// ============================================================
// MontaÊ - Inicialização do Firebase (plano Spark / gratuito)
//
// As chaves abaixo são a configuração pública do app web. No
// Firebase elas NÃO são segredo: a proteção real vem das regras
// do Firestore (firestore.rules), que definem quem lê e escreve
// cada coleção. Por isso ficam versionadas — assim qualquer
// deploy funciona sem configuração extra. As variáveis de
// ambiente, quando definidas, têm prioridade.
// ============================================================

import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const env = import.meta.env;

const DEFAULTS = {
  apiKey: 'AIzaSyBCWA2yfInsq9xalhHQfsInrOzDUtkL2QA',
  authDomain: 'brandpilot-ai-ab60b.firebaseapp.com',
  projectId: 'brandpilot-ai-ab60b',
  storageBucket: 'brandpilot-ai-ab60b.firebasestorage.app',
  messagingSenderId: '294298906616',
  appId: '1:294298906616:web:674375363814d8c683700d'
};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || DEFAULTS.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULTS.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || DEFAULTS.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULTS.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULTS.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || DEFAULTS.appId
};

/** Só considera configurado se as chaves essenciais existirem. */
export const isFirebaseEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

export const OWNER_EMAIL = (env.VITE_OWNER_EMAIL || 'marcos.elias.sc@gmail.com')
  .trim()
  .toLowerCase();

let app = null;
let db = null;
let auth = null;

if (isFirebaseEnabled) {
  app = initializeApp(firebaseConfig);

  // Cache persistente em IndexedDB: o app abre instantaneamente com os
  // dados da última sessão, funciona sem internet no meio da montagem e
  // sincroniza sozinho quando o sinal volta. Também reduz muito as
  // leituras cobradas na cota gratuita do Firestore.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    }),
    ignoreUndefinedProperties: true
  });

  auth = getAuth(app);
}

export { app, db, auth };
