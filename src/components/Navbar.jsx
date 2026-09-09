import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  DollarSign, 
  Smartphone, 
  Link as LinkIcon, 
  Sparkles,
  Share2
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenShareQuote, pendingQuotesCount = 0 }) {
  return (
    <header className="navbar no-print">
      <div className="navbar-inner">
        {/* Brand / Logo */}
        <div className="brand-wrapper" onClick={() => setActiveTab('dashboard')}>
          <img 
            src="/logo.jpeg" 
            alt="MontaÊ Logo" 
            className="brand-logo-img" 
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="brand-text">
            <div className="brand-name">
              Monta<span>Ê</span>
            </div>
            <div className="brand-slogan">
              MONTA. REPARA. CONECTA.
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ClipboardList size={17} />
            <span>Ordens & Montagens</span>
            {pendingQuotesCount > 0 && (
              <span style={{ 
                background: 'var(--danger)', 
                color: '#fff', 
                borderRadius: '10px', 
                padding: '1px 6px', 
                fontSize: '11px', 
                fontWeight: 'bold',
                marginLeft: '4px' 
              }}>
                {pendingQuotesCount}
              </span>
            )}
          </button>

          <button 
            className={`nav-tab ${activeTab === 'clients' ? 'active' : ''}`}
            onClick={() => setActiveTab('clients')}
          >
            <Users size={17} />
            <span>Clientes (CRM)</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === 'financial' ? 'active' : ''}`}
            onClick={() => setActiveTab('financial')}
          >
            <DollarSign size={17} />
            <span>Financeiro</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === 'assembler' ? 'active' : ''}`}
            onClick={() => setActiveTab('assembler')}
            style={{ borderLeft: '1px solid var(--border-subtle)' }}
          >
            <Smartphone size={17} color="var(--gold-primary)" />
            <span>Painel do Montador</span>
            <span className="badge badge-gold" style={{ fontSize: '10px', padding: '1px 6px' }}>Campo</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === 'public-quote' ? 'active' : ''}`}
            onClick={() => setActiveTab('public-quote')}
          >
            <Sparkles size={17} color="var(--gold-hover)" />
            <span>Link do Cliente</span>
          </button>
        </nav>

        {/* Action Button: Share quote link */}
        <div className="nav-actions">
          <button 
            className="btn btn-primary btn-sm"
            onClick={onOpenShareQuote}
            title="Gerar e compartilhar link de orçamento para clientes"
          >
            <Share2 size={15} />
            <span>Gerar Link Orçamento</span>
          </button>
        </div>
      </div>
    </header>
  );
}
