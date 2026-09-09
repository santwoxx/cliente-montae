// ============================================================
// MontaÊ - Estado de autenticação da aplicação
// ============================================================

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthService, ROLES } from '../services/auth';
import { isCloudMode } from '../services/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.observe((profile) => {
      setUser(profile);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo(() => {
    const isAdmin = user?.role === ROLES.ADMIN && user?.active;
    const isAssembler = user?.role === ROLES.ASSEMBLER && user?.active;

    return {
      user,
      loading,
      cloudMode: isCloudMode,
      authEnabled: AuthService.enabled,
      isSignedIn: Boolean(user),
      isApproved: Boolean(isAdmin || isAssembler),
      isAdmin,
      isAssembler,
      signIn: AuthService.signIn,
      signUp: AuthService.signUp,
      signOut: AuthService.signOut,
      resetPassword: AuthService.resetPassword
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return context;
}
