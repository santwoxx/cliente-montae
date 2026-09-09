import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './views/DashboardView';
import OrdersView from './views/OrdersView';
import ClientsView from './views/ClientsView';
import FinancialView from './views/FinancialView';
import AssemblerView from './views/AssemblerView';
import PublicQuoteView from './views/PublicQuoteView';

import ReceiptModal from './components/ReceiptModal';
import QuoteShareModal from './components/QuoteShareModal';
import NewOrderModal from './components/NewOrderModal';

import { StorageService } from './services/storage';

export default function App() {
  // Global data states
  const [profile, setProfile] = useState(StorageService.getProfile());
  const [employees, setEmployees] = useState(StorageService.getEmployees());
  const [clients, setClients] = useState(StorageService.getClients());
  const [orders, setOrders] = useState(StorageService.getOrders());
  const [financial, setFinancial] = useState(StorageService.getFinancial());

  // Active view
  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.hash === '#orcamento' || window.location.search.includes('orcamento')) {
      return 'public-quote';
    }
    return 'dashboard';
  });

  // Active assembler for field view
  const [currentEmployeeId, setCurrentEmployeeId] = useState('emp-1');
  const [selectedAssemblerOrderId, setSelectedAssemblerOrderId] = useState(null);

  // Modals
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [clientForNewOrder, setClientForNewOrder] = useState(null);

  // Synchronize state with storage updates
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#orcamento' || window.location.search.includes('orcamento')) {
        setActiveTab('public-quote');
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    const unsubscribe = StorageService.subscribe(() => {
      setProfile(StorageService.getProfile());
      setEmployees(StorageService.getEmployees());
      setClients(StorageService.getClients());
      setOrders(StorageService.getOrders());
      setFinancial(StorageService.getFinancial());
    });

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      unsubscribe();
    };
  }, []);

  // Handlers
  const handleSaveOrder = (orderData) => {
    const saved = StorageService.saveOrder(orderData);
    return saved;
  };

  const handleDeleteOrder = (orderId) => {
    StorageService.deleteOrder(orderId);
  };

  const handleSaveClient = (clientData) => {
    StorageService.saveClient(clientData);
  };

  const handleDeleteClient = (clientId) => {
    StorageService.deleteClient(clientId);
  };

  const handleAddTransaction = (transData) => {
    StorageService.addFinancialTransaction(transData);
  };

  const handleDeleteTransaction = (transId) => {
    StorageService.deleteFinancialTransaction(transId);
  };

  const handleSwitchToAssembler = (orderId) => {
    setSelectedAssemblerOrderId(orderId);
    setActiveTab('assembler');
  };

  const handleOpenNewOrderWithClient = (client) => {
    setClientForNewOrder(client);
    setIsNewOrderModalOpen(true);
  };

  const pendingQuotesCount = orders.filter(o => o.status === 'orcamento').length;

  return (
    <div className="app-layout">
      {/* Navbar with role and views */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onOpenShareQuote={() => setIsShareModalOpen(true)}
        pendingQuotesCount={pendingQuotesCount}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardView
            orders={orders}
            financial={financial}
            clients={clients}
            employees={employees}
            profile={profile}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenShareQuote={() => setIsShareModalOpen(true)}
            onOpenNewOrder={() => {
              setClientForNewOrder(null);
              setIsNewOrderModalOpen(true);
            }}
            onViewReceipt={(order) => setReceiptOrder(order)}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            clients={clients}
            employees={employees}
            onSaveOrder={handleSaveOrder}
            onDeleteOrder={handleDeleteOrder}
            onViewReceipt={(order) => setReceiptOrder(order)}
            onOpenNewOrder={() => {
              setClientForNewOrder(null);
              setIsNewOrderModalOpen(true);
            }}
            onSwitchToAssembler={handleSwitchToAssembler}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsView
            clients={clients}
            orders={orders}
            onSaveClient={handleSaveClient}
            onDeleteClient={handleDeleteClient}
            onOpenNewOrderWithClient={handleOpenNewOrderWithClient}
          />
        )}

        {activeTab === 'financial' && (
          <FinancialView
            financial={financial}
            orders={orders}
            employees={employees}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 'assembler' && (
          <AssemblerView
            orders={orders}
            employees={employees}
            currentEmployeeId={currentEmployeeId}
            setCurrentEmployeeId={setCurrentEmployeeId}
            onSaveOrder={handleSaveOrder}
            onViewReceipt={(order) => setReceiptOrder(order)}
            selectedOrderId={selectedAssemblerOrderId}
          />
        )}

        {activeTab === 'public-quote' && (
          <PublicQuoteView
            profile={profile}
            onSaveOrder={handleSaveOrder}
            onReturnToAdmin={() => setActiveTab('dashboard')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print" style={{ borderTop: '1px solid var(--border-subtle)', padding: '20px 24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <strong>MontaÊ</strong> • MONTA. REPARA. CONECTA. • Contato: <span style={{ color: 'var(--gold-hover)' }}>{profile.email}</span>
          </div>
          <div>
            Sistema de Gestão Financeira, Montagens com Assinatura Digital & Links de Orçamentos
          </div>
        </div>
      </footer>

      {/* Modals */}
      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          profile={profile}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {isShareModalOpen && (
        <QuoteShareModal
          onClose={() => setIsShareModalOpen(false)}
          onOpenClientView={() => setActiveTab('public-quote')}
        />
      )}

      {isNewOrderModalOpen && (
        <NewOrderModal
          clients={clients}
          employees={employees}
          initialClient={clientForNewOrder}
          onSave={handleSaveOrder}
          onClose={() => {
            setIsNewOrderModalOpen(false);
            setClientForNewOrder(null);
          }}
        />
      )}
    </div>
  );
}
