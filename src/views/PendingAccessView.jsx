// ============================================================
// MontaÊ - Conta criada, aguardando liberação
//
// Tela mostrada a quem se cadastrou mas ainda não recebeu papel
// de admin ou montador. Traz as instruções do primeiro acesso.
// ============================================================

import React from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export default function PendingAccessView() {
  const { user, signOut } = useAuth();

  return (
    <div className="auth-screen">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-brand">
          <Logo className="auth-logo" size={62} />
        </div>

        <div className="confirm-icon is-info" style={{ background: 'var(--warn-bg)', color: 'var(--warn)' }}>
          <Clock size={24} aria-hidden="true" />
        </div>

        <h1 className="auth-title">Acesso aguardando liberação</h1>
        <p className="auth-sub mt-8">
          Sua conta <strong>{user?.email}</strong> foi criada com sucesso. Um administrador precisa
          liberar o seu acesso antes de você entrar no sistema.
        </p>

        <div className="panel mt-20" style={{ textAlign: 'left' }}>
          <div className="strong fs-13 mb-8">É você o dono do sistema?</div>
          <p className="fs-12 text-2">
            No primeiro acesso ainda não existe nenhum administrador. Abra o Firebase Console,
            vá em <strong>Firestore Database</strong> → coleção <strong>users</strong> → o documento
            com o seu e-mail, e ajuste dois campos:
          </p>
          <ul className="fs-12 text-2 mt-8" style={{ paddingLeft: 18 }}>
            <li>
              <code>role</code> para <strong>admin</strong>
            </li>
            <li>
              <code>active</code> para <strong>true</strong>
            </li>
          </ul>
          <p className="fs-12 text-2 mt-8">
            Depois disso você libera os montadores pela própria tela de Configurações.
          </p>
        </div>

        <div className="row mt-20" style={{ gap: 8 }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={15} aria-hidden="true" />
            Já liberei, atualizar
          </button>
          <button type="button" className="btn btn-secondary" onClick={signOut}>
            <LogOut size={15} aria-hidden="true" />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
