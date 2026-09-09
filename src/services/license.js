// ============================================================
// MontaÊ - Controle de licença / mensalidade
//
// Sistema entregue em 08/09/2026. A primeira mensalidade vence
// em 08/10/2026 e, a partir daí, todo dia 8 de cada mês.
//
// Como funciona:
//   - A data-limite fica no Firestore em  settings/licenca
//     no campo  paidUntil ("AAAA-MM-DD").
//   - Quando o cliente paga, o desenvolvedor abre o Firebase
//     Console e avança essa data em um mês. O desbloqueio é
//     imediato, sem novo deploy.
//   - As regras do Firestore impedem que o próprio cliente
//     altere esse documento (veja firestore.rules).
//
// Proteções:
//   - Atrasar o relógio do aparelho não libera: guardamos a
//     maior data já vista e desconfiamos de retrocessos.
//   - Sem internet o app usa o cache do Firestore; se nunca
//     houve contato, vale a data-limite padrão abaixo.
// ============================================================

import { doc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseEnabled } from '../lib/firebase';

/** Dados fixos do contrato. */
export const LICENSE_INFO = {
  vendorName: 'Suporte MontaÊ',
  vendorPhone: '73991422872',
  vendorPhoneLabel: '(73) 99142-2872',
  purchaseDate: '2026-09-08',
  /** Primeira data de bloqueio, caso o Firestore não responda. */
  defaultPaidUntil: '2026-10-08',
  /** Dia do vencimento em cada mês. */
  dueDay: 8,
  /** Dias de tolerância após o vencimento (0 = bloqueia no dia). */
  graceDays: 0,
  /** Começa a avisar este número de dias antes do vencimento. */
  warnDaysBefore: 7
};

const CLOCK_KEY = 'montae:last_seen_date';

/** Data local no formato AAAA-MM-DD, sem influência de fuso. */
function localISODate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
}

/**
 * Data considerada "hoje". Se o relógio do aparelho for atrasado
 * para burlar o bloqueio, continuamos usando a maior data já vista.
 */
export function trustedToday() {
  const today = localISODate();
  try {
    const lastSeen = localStorage.getItem(CLOCK_KEY);
    if (lastSeen && lastSeen > today) return lastSeen;
    localStorage.setItem(CLOCK_KEY, today);
  } catch {
    // Armazenamento bloqueado: seguimos com a data do aparelho.
  }
  return today;
}

function addDays(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day + days);
  return localISODate(date);
}

function daysBetween(fromISO, toISO) {
  const [fy, fm, fd] = fromISO.split('-').map(Number);
  const [ty, tm, td] = toISO.split('-').map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / 86400000);
}

export function formatDateBR(isoDate) {
  if (!isoDate) return '—';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Avalia a situação da licença a partir do documento remoto.
 * Retorna: status ('ativa' | 'aviso' | 'bloqueada'), datas e mensagem.
 */
export function evaluateLicense(remote) {
  const today = trustedToday();
  const paidUntil = remote?.paidUntil || LICENSE_INFO.defaultPaidUntil;
  const blockDate = addDays(paidUntil, LICENSE_INFO.graceDays);
  const daysLeft = daysBetween(today, blockDate);

  // Bloqueio manual: o desenvolvedor pode travar antes do vencimento.
  if (remote?.blocked === true) {
    return {
      status: 'bloqueada',
      today,
      paidUntil,
      blockDate,
      daysLeft,
      message: remote?.message || ''
    };
  }

  // Licença vitalícia / quitada: libera para sempre.
  if (remote?.plan === 'vitalicia' || remote?.blocked === false && remote?.paidUntil === 'never') {
    return { status: 'ativa', today, paidUntil: 'never', blockDate: null, daysLeft: Infinity, message: '' };
  }

  if (daysLeft <= 0) {
    return {
      status: 'bloqueada',
      today,
      paidUntil,
      blockDate,
      daysLeft,
      message: remote?.message || ''
    };
  }

  if (daysLeft <= LICENSE_INFO.warnDaysBefore) {
    return { status: 'aviso', today, paidUntil, blockDate, daysLeft, message: remote?.message || '' };
  }

  return { status: 'ativa', today, paidUntil, blockDate, daysLeft, message: remote?.message || '' };
}

/**
 * Observa o documento de licença em tempo real. Assim que o
 * desenvolvedor atualiza a data no Console, o app do cliente
 * desbloqueia sozinho, sem precisar recarregar.
 */
export function watchLicense(callback) {
  if (!isFirebaseEnabled) {
    // Modo local (desenvolvimento): sem bloqueio.
    callback({ status: 'ativa', today: trustedToday(), paidUntil: 'never', daysLeft: Infinity });
    return () => {};
  }

  return onSnapshot(
    doc(db, 'settings', 'licenca'),
    (snapshot) => {
      callback(evaluateLicense(snapshot.exists() ? snapshot.data() : null));
    },
    (error) => {
      // Sem permissão ou sem rede: aplica a regra padrão do contrato.
      console.warn('[MontaÊ] Licença indisponível, usando data padrão:', error?.code);
      callback(evaluateLicense(null));
    }
  );
}

/** Mensagem pronta para o WhatsApp do desenvolvedor. */
export function buildRenewalMessage(license, companyName) {
  return (
    `Olá! Aqui é ${companyName || 'do sistema MontaÊ'}.\n\n` +
    `Quero regularizar a mensalidade do sistema.\n` +
    `Vencimento: ${formatDateBR(license?.paidUntil)}\n\n` +
    `Pode me enviar os dados para pagamento?`
  );
}
