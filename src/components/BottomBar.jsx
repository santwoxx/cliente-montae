// ============================================================
// MontaÊ - Barra de navegação inferior (celular)
//
// É a navegação principal em campo: alvos grandes, alcançáveis
// com o polegar e respeitando a área segura do iPhone.
// ============================================================

import React from 'react';
import { LayoutDashboard, ClipboardList, Smartphone, Users, Wallet, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomBar({ activeTab, onNavigate, pendingQuotes = 0 }) {
  const { isAdmin } = useAuth();

  const items = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'orders', label: 'Ordens', icon: ClipboardList, badge: pendingQuotes },
    { id: 'assembler', label: 'Campo', icon: Smartphone },
    { id: 'clients', label: 'Clientes', icon: Users },
    isAdmin
      ? { id: 'financial', label: 'Finanças', icon: Wallet }
      : { id: 'public-quote', label: 'Orçamento', icon: Sparkles }
  ];

  return (
    <nav className="bottombar no-print" aria-label="Navegação principal">
      <div className="bottombar-inner">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`bottombar-item ${isActive ? 'is-active' : ''}`}
              onClick={() => {
                onNavigate(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="bottombar-icon">
                <Icon size={21} aria-hidden="true" />
                {item.badge > 0 && (
                  <span className="bottombar-dot" aria-label={`${item.badge} pendentes`}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
