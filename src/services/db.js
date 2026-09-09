// ============================================================
// MontaÊ - Camada única de dados
//
// As telas nunca falam com o Firestore nem com o localStorage
// diretamente: elas usam este repositório. Isso mantém as views
// limpas e permite trocar o back-end sem tocar na interface.
//
//   Firebase configurado  -> Firestore em tempo real (multi-dispositivo)
//   Firebase ausente      -> banco local do navegador
// ============================================================

import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  runTransaction,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseEnabled } from '../lib/firebase';
import { LocalDb } from './localDb';
import { SEED } from './seed';

export const COLLECTIONS = ['employees', 'clients', 'orders', 'financial'];

export const isCloudMode = isFirebaseEnabled;

/** Documento único com o perfil/configuração da empresa. */
const SETTINGS_DOC = ['settings', 'empresa'];

if (!isCloudMode) {
  LocalDb.init(SEED);
}

/** Remove chaves `undefined`, que o Firestore rejeita. */
function clean(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(clean);
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    out[key] = clean(value);
  }
  return out;
}

function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export const Database = {
  mode: isCloudMode ? 'nuvem' : 'local',

  // ---------------------------------------------------------
  // Leitura reativa
  // ---------------------------------------------------------

  /**
   * Assina uma coleção. `callback` recebe a lista completa sempre que
   * algo muda, em qualquer dispositivo. Retorna a função de cancelamento.
   */
  watchCollection(name, callback, onError) {
    if (!isCloudMode) {
      return LocalDb.watch(name, callback, []);
    }

    return onSnapshot(
      collection(db, name),
      (snapshot) => {
        const rows = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        callback(rows);
      },
      (error) => {
        console.error(`[MontaÊ] Falha ao ler "${name}":`, error.code);
        if (onError) onError(error);
      }
    );
  },

  /** Assina o documento de configuração da empresa. */
  watchSettings(callback, onError) {
    if (!isCloudMode) {
      return LocalDb.watch('settings', (value) => callback(value || SEED.settings), SEED.settings);
    }

    return onSnapshot(
      doc(db, ...SETTINGS_DOC),
      (snapshot) => callback(snapshot.exists() ? { ...SEED.settings, ...snapshot.data() } : SEED.settings),
      (error) => {
        console.error('[MontaÊ] Falha ao ler configurações:', error.code);
        if (onError) onError(error);
      }
    );
  },

  // ---------------------------------------------------------
  // Escrita
  // ---------------------------------------------------------

  async saveSettings(profile) {
    const payload = clean(profile);
    if (!isCloudMode) return LocalDb.set('settings', payload);
    await setDoc(doc(db, ...SETTINGS_DOC), payload, { merge: true });
    return payload;
  },

  /** Cria ou atualiza um documento. Gera id quando não houver. */
  async save(name, data, idPrefix = 'doc') {
    const id = data.id || generateId(idPrefix);
    const payload = clean({ ...data, id, updatedAt: new Date().toISOString() });
    if (!payload.createdAt) payload.createdAt = payload.updatedAt;

    if (!isCloudMode) return LocalDb.upsert(name, payload);

    await setDoc(doc(db, name, id), { ...payload, syncedAt: serverTimestamp() }, { merge: true });
    return payload;
  },

  async remove(name, id) {
    if (!isCloudMode) return LocalDb.remove(name, id);
    await deleteDoc(doc(db, name, id));
  },

  /** Aplica várias gravações de uma vez (usado na importação/restauração). */
  async saveMany(name, rows) {
    if (!isCloudMode) {
      for (const row of rows) LocalDb.upsert(name, row);
      return;
    }
    // O Firestore aceita no máximo 500 operações por lote.
    for (let i = 0; i < rows.length; i += 400) {
      const batch = writeBatch(db);
      for (const row of rows.slice(i, i + 400)) {
        const id = row.id || generateId(name.slice(0, 3));
        batch.set(doc(db, name, id), clean({ ...row, id }), { merge: true });
      }
      await batch.commit();
    }
  },

  // ---------------------------------------------------------
  // Numeração sequencial das ordens de serviço
  // ---------------------------------------------------------

  /**
   * Gera o próximo código (OS-105, OS-106...). Na nuvem usa uma
   * transação, de modo que dois celulares criando ordens ao mesmo
   * tempo nunca recebem o mesmo número.
   */
  async nextOrderId() {
    if (!isCloudMode) {
      return `OS-${LocalDb.nextOrderNumber()}`;
    }

    const counterRef = doc(db, 'counters', 'orders');
    try {
      const value = await runTransaction(db, async (tx) => {
        const snapshot = await tx.get(counterRef);
        const current = snapshot.exists() ? Number(snapshot.data().value) || 100 : 100;
        const next = current + 1;
        tx.set(counterRef, { value: next }, { merge: true });
        return next;
      });
      return `OS-${value}`;
    } catch (error) {
      // Sem rede a transação falha; cai para um código único por tempo,
      // que a sincronização preserva sem colidir com os sequenciais.
      console.warn('[MontaÊ] Contador indisponível, gerando código local:', error.code);
      return `OS-${Date.now().toString().slice(-6)}`;
    }
  },

  // ---------------------------------------------------------
  // Backup e manutenção
  // ---------------------------------------------------------

  async exportAll() {
    if (!isCloudMode) return LocalDb.exportAll();

    const result = {
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      settings: null,
      employees: [],
      clients: [],
      orders: [],
      financial: []
    };

    const settingsSnap = await getDoc(doc(db, ...SETTINGS_DOC));
    if (settingsSnap.exists()) result.settings = settingsSnap.data();

    for (const name of COLLECTIONS) {
      const snapshot = await getDocs(collection(db, name));
      result[name] = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
    }
    return result;
  },

  async importAll(data) {
    if (!isCloudMode) {
      LocalDb.importAll(data);
      return;
    }
    if (data.settings) await this.saveSettings(data.settings);
    for (const name of COLLECTIONS) {
      if (Array.isArray(data[name]) && data[name].length) {
        await this.saveMany(name, data[name]);
      }
    }
  },

  /** Repõe a base de demonstração (somente modo local). */
  async restoreSampleData() {
    if (!isCloudMode) {
      LocalDb.reset(SEED);
      return;
    }
    await this.saveSettings(SEED.settings);
    for (const name of COLLECTIONS) {
      await this.saveMany(name, SEED[name]);
    }
  },

  /** Apaga todos os registros operacionais, preservando as configurações. */
  async clearOperationalData() {
    if (!isCloudMode) {
      LocalDb.wipe();
      return;
    }
    for (const name of COLLECTIONS) {
      const snapshot = await getDocs(collection(db, name));
      for (let i = 0; i < snapshot.docs.length; i += 400) {
        const batch = writeBatch(db);
        for (const d of snapshot.docs.slice(i, i + 400)) batch.delete(d.ref);
        await batch.commit();
      }
    }
  }
};
