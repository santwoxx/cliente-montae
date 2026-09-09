// ============================================================
// MontaÊ - Casca da aplicação
//
// Cuida do roteamento por hash, do controle de acesso e do
// carregamento sob demanda das telas. As views pesadas só são
// baixadas quando o usuário realmente abre cada aba.
// ============================================================

import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import Topbar from './components/Topbar';
import BottomBar from './components/BottomBar';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardView from './views/DashboardView';
import LoginView from './views/LoginView';
import PendingAccessView from './views/PendingAccessView';
import LicenseBlockedView from './views/LicenseBlockedView';
import LicenseBanner from './components/LicenseBanner';
import { useAuth } from './context/AuthContext';
import { useData } from './context/DataContext';
import { useLicense } from './context/LicenseContext';

// Divisão de código: cada tela vira um arquivo próprio no build.
const OrdersView = lazy(() => import('./views/OrdersView'));
const ClientsView = lazy(() => import('./views/ClientsView'));
const FinancialView = lazy(() => import('./views/FinancialView'));
const AssemblerView = lazy(() => import('./views/AssemblerView'));
const PublicQuoteView = lazy(() => import('./views/PublicQuoteView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const OrderFormModal = lazy(() => import('./components/OrderFormModal'));
const ReceiptModal = lazy(() => import('./components/ReceiptModal'));
const QuoteShareModal = lazy(() => import('./components/QuoteShareModal'));

const VALID_TABS = [
  'dashboard',
  'orders',
  'clients',
  'financial',
  'assembler',
  'settings',
  'public-quote'
];

/** Lê a aba atual do endereço (#orcamento, #ordens...). */
function tabFromHash() {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (hash === 'orcamento' || hash === 'public-quote') return 'public-quote';
  return VALID_TABS.includes(hash) ? hash : null;
}

function ViewLoader() {
  return (
    <div className="stack" aria-busy="true" aria-label="Carregando">
      <div className="skeleton" style={{ height: 34, width: '45%' }} />
      <div className="stats">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="skeleton" style={{ height: 108 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 220 }} />
    </div>
  );
}

export default function App() {
  const { loading: authLoading, isSignedIn, isApproved, isAdmin, authEnabled } = useAuth();
  const { orders, clients, employees, profile, metrics, saveOrder } = useData();
  const { license, checking: licenseChecking, isBlocked } = useLicense();

  const [activeTab, setActiveTab] = useState(() => tabFromHash() || 'dashboard');
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [orderModal, setOrderModal] = useState(null); // null | { order?, client? }
  const [fieldOrderId, setFieldOrderId] = useState(null);

  // O link público é a única rota acessível sem conta.
  const isPublicRoute = activeTab === 'public-quote';

  const navigate = useCallback((tab) => {
    setActiveTab(tab);
    const hash = tab === 'public-quote' ? 'orcamento' : tab;
    if (window.location.hash.replace('#', '') !== hash) {
      window.history.replaceState(null, '', `#${hash}`);
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const tab = tabFromHash();
      if (tab) setActiveTab(tab);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Um montador não pode abrir o financeiro nem as contas.
  useEffect(() => {
    if (!isAdmin && activeTab === 'financial') navigate('dashboard');
  }, [isAdmin, activeTab, navigate]);

  const openFieldOrder = useCallback(
    (orderId) => {
      setFieldOrderId(orderId);
      navigate('assembler');
    },
    [navigate]
  );

  const pendingQuotes = metrics.counts.orcamento;

  const pageTitle = useMemo(() => {
    const titles = {
      dashboard: 'Painel',
      orders: 'Ordens de serviço',
      clients: 'Clientes',
      financial: 'Financeiro',
      assembler: 'Painel do montador',
      settings: 'Configurações',
      'public-quote': 'Orçamento online'
    };
    return `${titles[activeTab] || 'MontaÊ'} · MontaÊ`;
  }, [activeTab]);

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  // ---------------------------------------------------------
  // Portões de acesso
  // ---------------------------------------------------------

  if (authLoading || licenseChecking) {
    return (
      <div className="splash">
        <div className="spinner is-dark" style={{ width: 28, height: 28 }} />
        <p>Carregando o sistema...</p>
      </div>
    );
  }

  // Cliente acessando o link público: sem login, sem navegação interna.
  // Com a licença vencida, mostramos um aviso neutro de manutenção —
  // a cobrança é assunto entre fornecedor e contratante, e não deve
  // ser exposta aos clientes finais da empresa.
  if (isPublicRoute && !isApproved) {
    if (isBlocked) {
      return (
        <div className="splash">
          <div className="card card-pad" style={{ maxWidth: 420, textAlign: 'center' }}>
            <h2 className="confirm-title">Orçamento indisponível no momento</h2>
            <p className="confirm-message">
              Estamos em manutenção. Tente novamente mais tarde ou fale direto com a empresa pelo
              WhatsApp.
            </p>
          </div>
        </div>
      );
    }
    return (
      <ErrorBoundary>
        <main className="app-main">
          <Suspense fallback={<ViewLoader />}>
            <PublicQuoteView />
          </Suspense>
        </main>
      </ErrorBoundary>
    );
  }

  // Mensalidade em aberto: o sistema inteiro fica suspenso.
  if (isBlocked) {
    return <LicenseBlockedView license={license} companyName={profile?.company} />;
  }

  if (authEnabled && !isSignedIn) {
    return <LoginView onOpenPublicQuote={() => navigate('public-quote')} />;
  }

  if (authEnabled && isSignedIn && !isApproved) {
    return <PendingAccessView />;
  }

  // ---------------------------------------------------------
  // Aplicação
  // ---------------------------------------------------------

  return (
    <div className="app-shell">
      <Topbar
        activeTab={activeTab}
        onNavigate={navigate}
        onShareQuote={() => setShareOpen(true)}
        pendingQuotes={pendingQuotes}
      />

      <main className="app-main">
        <LicenseBanner companyName={profile?.company} />

        <ErrorBoundary key={activeTab}>
          <Suspense fallback={<ViewLoader />}>
            {activeTab === 'dashboard' && (
              <DashboardView
                onNavigate={navigate}
                onNewOrder={() => setOrderModal({})}
                onShareQuote={() => setShareOpen(true)}
                onViewReceipt={setReceiptOrder}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersView
                onNewOrder={() => setOrderModal({})}
                onEditOrder={(order) => setOrderModal({ order })}
                onViewReceipt={setReceiptOrder}
                onOpenField={openFieldOrder}
              />
            )}

            {activeTab === 'clients' && (
              <ClientsView onNewOrderForClient={(client) => setOrderModal({ client })} />
            )}

            {activeTab === 'financial' && isAdmin && <FinancialView />}

            {activeTab === 'assembler' && (
              <AssemblerView
                selectedOrderId={fieldOrderId}
                onClearSelection={() => setFieldOrderId(null)}
                onViewReceipt={setReceiptOrder}
              />
            )}

            {activeTab === 'settings' && <SettingsView />}

            {activeTab === 'public-quote' && (
              <PublicQuoteView onBackToAdmin={() => navigate('dashboard')} />
            )}
          </Suspense>
        </ErrorBoundary>
      </main>

      <BottomBar activeTab={activeTab} onNavigate={navigate} pendingQuotes={pendingQuotes} />

      {/* Modais */}
      <Suspense fallback={null}>
        {orderModal && (
          <OrderFormModal
            order={orderModal.order || null}
            initialClient={orderModal.client || null}
            clients={clients}
            employees={employees}
            onSave={saveOrder}
            onClose={() => setOrderModal(null)}
          />
        )}

        {receiptOrder && (
          <ReceiptModal
            order={orders.find((o) => o.id === receiptOrder.id) || receiptOrder}
            profile={profile}
            onClose={() => setReceiptOrder(null)}
          />
        )}

        {shareOpen && (
          <QuoteShareModal
            onClose={() => setShareOpen(false)}
            onOpenClientView={() => navigate('public-quote')}
          />
        )}
      </Suspense>
    </div>
  );
}
