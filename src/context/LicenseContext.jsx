// ============================================================
// MontaÊ - Estado da licença / mensalidade
// ============================================================

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { watchLicense } from '../services/license';

const LicenseContext = createContext(null);

export function LicenseProvider({ children }) {
  const [license, setLicense] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = watchLicense((result) => {
      setLicense(result);
      setChecking(false);
    });

    // Se o Firestore demorar (sinal fraco, primeira abertura), seguimos
    // com a regra padrão do contrato em vez de prender o usuário na
    // tela de carregamento. O bloqueio por data continua valendo.
    const timeout = setTimeout(() => setChecking(false), 2500);

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      license,
      checking,
      isBlocked: license?.status === 'bloqueada',
      isWarning: license?.status === 'aviso'
    }),
    [license, checking]
  );

  return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>;
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (!context) throw new Error('useLicense precisa estar dentro de <LicenseProvider>');
  return context;
}
