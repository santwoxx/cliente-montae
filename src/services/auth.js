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
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
import { auth, db, isFirebaseEnabled, OWNER_EMAIL, ADMIN_EMAILS } from '../lib/firebase';

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
  'auth/admin-restricted-operation': 'Login anônimo não habilitado no Firebase Console.',
  'auth/popup-closed-by-user': 'A janela do Google foi fechada antes de concluir.',
  'auth/cancelled-popup-request': 'Havia outra janela de login aberta.',
  'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Tentando outro modo...',
  'auth/unauthorized-domain':
    'Este endereço não está autorizado no Firebase (Authentication › Settings › Authorized domains).',
  'auth/account-exists-with-different-credential':
    'Este e-mail já tem conta com outro método de acesso.'
};

export function describeAuthError(error) {
  if (!error) return 'Erro desconhecido.';
  return ERROR_MESSAGES[error.code] || 'Não foi possível concluir. Tente novamente.';
}

/**
 * O login foi feito com a conta Google? Só nesse caso confiamos no
 * endereço de e-mail para conceder administração automaticamente:
 * o Google comprova a posse da caixa. Num cadastro por e-mail e
 * senha o endereço é apenas digitado, sem nenhuma prova.
 */
function isGoogleSignIn(user) {
  return (user.providerData || []).some((p) => p?.providerId === 'google.com');
}

/** Este usuário é um dos donos previstos do sistema? */
function isAdminEmail(user) {
  const email = (user.email || '').toLowerCase();
  return isGoogleSignIn(user) && ADMIN_EMAILS.includes(email);
}

async function resolveUserProfile(user) {
  const ref = doc(db, 'users', user.uid);
  const snapshot = await getDoc(ref);
  const shouldBeAdmin = isAdminEmail(user);

  if (snapshot.exists()) {
    const data = snapshot.data();

    // Dono do sistema que ainda está como pendente (por exemplo,
    // criou a conta antes desta regra existir): promove na hora.
    if (shouldBeAdmin && (data.role !== ROLES.ADMIN || data.active !== true)) {
      try {
        await setDoc(ref, { role: ROLES.ADMIN, active: true }, { merge: true });
        return {
          uid: user.uid,
          email: user.email,
          displayName: data.displayName || user.displayName || user.email,
          role: ROLES.ADMIN,
          active: true,
          employeeId: data.employeeId || null
        };
      } catch (error) {
        console.warn('[MontaÊ] Não foi possível promover a admin:', error?.code);
      }
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: data.displayName || user.displayName || user.email,
      role: data.role || ROLES.PENDING,
      active: data.active === true,
      employeeId: data.employeeId || null
    };
  }

  // Conta nova: os e-mails da lista entram como administradores;
  // os demais ficam pendentes até um admin liberar.
  const role = shouldBeAdmin ? ROLES.ADMIN : ROLES.PENDING;
  const active = shouldBeAdmin;

  await setDoc(ref, {
    email: user.email,
    displayName: user.displayName || user.email,
    role,
    active,
    createdAt: serverTimestamp()
  });

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email,
    role,
    active,
    employeeId: null,
    // Avisa a tela de espera de que este e-mail deveria ser admin,
    // caso as regras do Firestore ainda não estejam publicadas.
    isOwnerEmail: ADMIN_EMAILS.includes((user.email || '').toLowerCase())
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

  /**
   * Login com a conta Google — caminho principal para o dono do
   * sistema e para quem já usa Gmail. Sem senha para memorizar.
   *
   * Em celular o pop-up costuma ser bloqueado, então caímos para o
   * fluxo de redirecionamento, que sempre funciona.
   */
  async signInWithGoogle() {
    await setPersistence(auth, browserLocalPersistence);

    const provider = new GoogleAuthProvider();
    // Força a escolha da conta: evita entrar sozinho na conta errada
    // quando o aparelho tem vários logins do Google.
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const credential = await signInWithPopup(auth, provider);
      return credential.user;
    } catch (error) {
      const fallbackCodes = [
        'auth/popup-blocked',
        'auth/operation-not-supported-in-this-environment',
        'auth/cancelled-popup-request'
      ];
      if (fallbackCodes.includes(error?.code)) {
        await signInWithRedirect(auth, provider);
        return null; // a página recarrega e volta pelo redirect
      }
      throw error;
    }
  },

  /** Conclui o login por redirecionamento após a página recarregar. */
  async completeRedirectSignIn() {
    if (!isFirebaseEnabled) return null;
    try {
      const credential = await getRedirectResult(auth);
      return credential?.user || null;
    } catch (error) {
      console.warn('[MontaÊ] Falha ao concluir login por redirecionamento:', error?.code);
      return null;
    }
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
