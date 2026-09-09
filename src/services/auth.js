// ============================================================
// MontaÊ - Autenticação (Firebase Auth, plano gratuito)
//
// Papéis:
//   admin     -> acesso total, inclusive financeiro
//   montador  -> ordens, clientes e painel de campo
//   pendente  -> conta criada, aguardando liberação do admin
//
// O visitante do link público entra de forma anônima só para
// conseguir enviar o orçamento; ele não lê nenhum dado da empresa.
// ============================================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as fbSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseEnabled, OWNER_EMAIL } from '../lib/firebase';

export const ROLES = {
  ADMIN: 'admin',
  ASSEMBLER: 'montador',
  PENDING: 'pendente'
};

/** Mensagens em português para os códigos de erro do Firebase. */
const ERROR_MESSAGES = {
  'auth/invalid-email': 'E-mail inválido.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/user-not-found': 'Não encontramos uma conta com este e-mail.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Este e-mail já possui uma conta. Faça login.',
  'auth/weak-password': 'A senha precisa ter no mínimo 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  'auth/network-request-failed': 'Sem conexão com a internet. Verifique sua rede.',
  'auth/operation-not-allowed': 'Método de login não habilitado no Firebase Console.',
  'auth/admin-restricted-operation': 'Login anônimo não habilitado no Firebase Console.'
};

export function describeAuthError(error) {
  if (!error) return 'Erro desconhecido.';
  return ERROR_MESSAGES[error.code] || 'Não foi possível concluir. Tente novamente.';
}

/**
 * Lê (ou cria) o documento de perfil do usuário.
 * Contas novas nascem como "pendente" — as regras do Firestore
 * impedem que alguém se cadastre já como administrador.
 */
async function resolveUserProfile(user) {
  const ref = doc(db, 'users', user.uid);
  const snapshot = await getDoc(ref);

  if (snapshot.exists()) {
    const data = snapshot.data();
    return {
      uid: user.uid,
      email: user.email,
      displayName: data.displayName || user.displayName || user.email,
      role: data.role || ROLES.PENDING,
      active: data.active === true,
      employeeId: data.employeeId || null
    };
  }

  const isOwner = OWNER_EMAIL && user.email?.toLowerCase() === OWNER_EMAIL;

  await setDoc(ref, {
    email: user.email,
    displayName: user.displayName || user.email,
    role: ROLES.PENDING,
    active: false,
    createdAt: serverTimestamp()
  });

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email,
    role: ROLES.PENDING,
    active: false,
    employeeId: null,
    // Dica exibida na tela de espera para o dono do sistema.
    isOwnerEmail: Boolean(isOwner)
  };
}

export const AuthService = {
  enabled: isFirebaseEnabled,

  /** Observa o estado de login. Retorna a função de cancelamento. */
  observe(callback) {
    if (!isFirebaseEnabled) {
      // Modo local: administrador único, sem login.
      callback({
        uid: 'local',
        email: OWNER_EMAIL || 'local@montae.app',
        displayName: 'Administrador (modo local)',
        role: ROLES.ADMIN,
        active: true,
        isLocal: true
      });
      return () => {};
    }

    return onAuthStateChanged(auth, async (user) => {
      if (!user || user.isAnonymous) {
        callback(null);
        return;
      }
      try {
        callback(await resolveUserProfile(user));
      } catch (error) {
        console.error('[MontaÊ] Falha ao carregar perfil:', error);
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.email,
          role: ROLES.PENDING,
          active: false,
          profileError: true
        });
      }
    });
  },

  async signIn(email, password) {
    await setPersistence(auth, browserLocalPersistence);
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return credential.user;
  },

  async signUp(name, email, password) {
    await setPersistence(auth, browserLocalPersistence);
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name?.trim()) {
      await updateProfile(credential.user, { displayName: name.trim() });
    }
    await resolveUserProfile(credential.user);
    return credential.user;
  },

  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email.trim());
  },

  /**
   * Sessão anônima usada apenas pelo link público de orçamento.
   * Sem ela o visitante não conseguiria gravar o pedido.
   */
  async signInAsVisitor() {
    if (!isFirebaseEnabled) return null;
    if (auth.currentUser) return auth.currentUser;
    const credential = await signInAnonymously(auth);
    return credential.user;
  },

  async signOut() {
    if (!isFirebaseEnabled) return;
    await fbSignOut(auth);
  }
};
