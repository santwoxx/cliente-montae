// ============================================================
// MontaÊ - Barra superior (marca, navegação e conta)
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Wallet,
  Smartphone,
  Share2,
  Settings,
  LogOut,
  ChevronDown,
  HardDrive,
  CloudOff
} from 'lucide-react';
import Logo from './Logo';
import { initials } from '../services/calculations';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const TABS = [
  { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
  { id: 'orders', label: 'Ordens', icon: ClipboardList, countKey: 'quotes' },
  { id: 'clients', label: 'Clientes', icon: Users },
  { id: 'financial', label: 'Financeiro', icon: Wallet, adminOnly: true },
  { id: 'assembler', label: 'Campo', icon: Smartphone }
];

export default function Topbar({ activeTab, onNavigate, onShareQuote, pendingQuotes }) {
  const { user, isAdmin, signOut, authEnabled } = useAuth();
  const { isCloudMode, online } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Fecha o menu ao clicar fora ou pressionar Esc.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointer = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const visibleTabs = TABS.filter((tab) => !tab.adminOnly || isAdmin);

  return (
    <>
      {!online && (
        <div className="mode-strip is-offline no-print" role="status">
          <CloudOff size={14} aria-hidden="true" />
          Sem conexão — você continua trabalhando e tudo sincroniza quando a internet voltar.
        </div>
      )}

      {online && !isCloudMode && (
        <div className="mode-strip no-print" role="status">
          <HardDrive size={14} aria-hidden="true" />
          Modo local: os dados ficam somente neste aparelho. Configure o Firebase para sincronizar.
        </div>
      )}

      <header className="topbar no-print">
        <div className="topbar-inner">
          <button
            type="button"
            className="brand"
            onClick={() => onNavigate('dashboard')}
            aria-label="Ir para o painel"
          >
            <Logo />
            <span className="brand-text">
              <span className="brand-name">
                Monta<em>Ê</em>
              </span>
              <span className="brand-tag">Monta. Repara. Conecta.</span>
            </span>
          </button>

          <nav className="navtabs only-desktop" aria-label="Navegação principal">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const count = tab.countKey === 'quotes' ? pendingQuotes : 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`navtab ${activeTab === tab.id ? 'is-active' : ''}`}
                  onClick={() => onNavigate(tab.id)}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{tab.label}</span>
                  {count > 0 && <span className="navtab-count">{count}</span>}
                </button>
              );
            })}
          </nav>

          <div className="spacer" />

          <button
            type="button"
            className="btn btn-primary btn-sm only-desktop"
            onClick={onShareQuote}
          >
            <Share2 size={15} aria-hidden="true" />
            Link de Orçamento
          </button>

          <div className="user-menu" ref={menuRef}>
            <button
              type="button"
              className="user-chip"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="avatar" aria-hidden="true">
                {initials(user?.displayName || user?.email)}
              </span>
              <span className="user-chip-name">{user?.displayName || 'Conta'}</span>
              <ChevronDown size={15} aria-hidden="true" />
            </button>

            {menuOpen && (
              <div className="dropdown" role="menu">
                <div className="dropdown-head">
                  <div className="strong fs-13 truncate">{user?.displayName}</div>
                  <div className="muted fs-11 truncate">{user?.email}</div>
                  <span className={`badge ${isAdmin ? 'badge-brand' : 'badge-info'} mt-8`}>
                    {isAdmin ? 'Administrador' : 'Montador'}
                  </span>
                </div>

                <button
                  type="button"
                  className="dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigate('settings');
                  }}
                >
                  <Settings size={16} aria-hidden="true" />
                  Configurações
                </button>

                <button
                  type="button"
                  className="dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onShareQuote();
                  }}
                >
                  <Share2 size={16} aria-hidden="true" />
                  Link de orçamento
                </button>

                {authEnabled && (
                  <button
                    type="button"
                    className="dropdown-item is-danger"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Sair da conta
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
