// ============================================================
// MontaÊ - Estado de dados da aplicação
//
// Assina as coleções uma única vez e distribui para todas as telas.
// As métricas (faturamento, lucro, comissões) são calculadas aqui,
// memoizadas, em vez de recalculadas dentro de cada view a cada render.
// ============================================================

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Database, isCloudMode } from '../services/db';
import { AuthService } from '../services/auth';
import { SEED } from '../services/seed';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const DataContext = createContext(null);

/** Ordena por data mais recente primeiro, tolerando campos ausentes. */
function byRecent(field) {
  return (a, b) => String(b?.[field] || '').localeCompare(String(a?.[field] || ''));
}

export function DataProvider({ children }) {
  const { isApproved, isAdmin, cloudMode } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState(SEED.settings);
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [financial, setFinancial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  // Indicador de conexão para o painel de campo, onde o sinal oscila.
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    // Na nuvem só assinamos depois da liberação do usuário, senão as
    // regras do Firestore recusam a leitura e o console enche de erro.
    if (cloudMode && !isApproved) {
      setLoading(false);
      return undefined;
    }

    const unsubscribers = [
      Database.watchSettings(setProfile),
      Database.watchCollection('employees', setEmployees),
      Database.watchCollection('clients', setClients),
      Database.watchCollection('orders', (rows) => {
        setOrders(rows.sort(byRecent('createdAt')));
        setLoading(false);
      })
    ];

    // O extrato financeiro é restrito ao administrador.
    if (!cloudMode || isAdmin) {
      unsubscribers.push(
        Database.watchCollection('financial', (rows) => setFinancial(rows.sort(byRecent('date'))))
      );
    } else {
      setFinancial([]);
    }

    const timeout = setTimeout(() => setLoading(false), 6000);

    return () => {
      clearTimeout(timeout);
      unsubscribers.forEach((fn) => fn && fn());
    };
  }, [cloudMode, isApproved, isAdmin]);

  // ---------------------------------------------------------
  // Operações
  // ---------------------------------------------------------

  const saveOrder = useCallback(
    async (order) => {
      const isNew = !order.id;
      const id = order.id || (await Database.nextOrderId());
      const payload = { ...order, id };
      const saved = await Database.save('orders', payload, 'OS');

      // Uma montagem concluída e paga vira receita automaticamente,
      // sem lançamento duplicado se a ordem for salva de novo.
      if (saved.status === 'concluido' && saved.paymentStatus === 'pago') {
        const alreadyBilled = financial.some((entry) => entry.orderId === saved.id);
        if (!alreadyBilled) {
          await Database.save(
            'financial',
            {
              type: 'receita',
              description: `Montagem ${saved.id} (${saved.clientName})`,
              category: 'Montagem de Móveis',
              amount: Number(saved.totalValue) || 0,
              date: saved.completedAt
                ? saved.completedAt.split(' ')[0].split('/').reverse().join('-')
                : new Date().toISOString().split('T')[0],
              orderId: saved.id,
              paymentMethod: saved.paymentMethod || 'Pix',
              status: 'concluido'
            },
            'fin'
          );
        }
      }

      if (isNew) toast.success(`Ordem ${saved.id} criada com sucesso.`);
      return saved;
    },
    [financial, toast]
  );

  const deleteOrder = useCallback(
    async (id) => {
      await Database.remove('orders', id);
      toast.success(`Ordem ${id} excluída.`);
    },
    [toast]
  );

  const saveClient = useCallback(
    async (client) => {
      const saved = await Database.save('clients', client, 'cli');
      toast.success(client.id ? 'Cliente atualizado.' : 'Cliente cadastrado.');
      return saved;
    },
    [toast]
  );

  const deleteClient = useCallback(
    async (id) => {
      await Database.remove('clients', id);
      toast.success('Cliente excluído.');
    },
    [toast]
  );

  const saveEmployee = useCallback(
    async (employee) => {
      const saved = await Database.save('employees', employee, 'emp');
      toast.success(employee.id ? 'Montador atualizado.' : 'Montador cadastrado.');
      return saved;
    },
    [toast]
  );

  const deleteEmployee = useCallback(
    async (id) => {
      await Database.remove('employees', id);
      toast.success('Montador removido.');
    },
    [toast]
  );

  const addTransaction = useCallback(
    async (transaction) => {
      const saved = await Database.save('financial', transaction, 'fin');
      toast.success('Lançamento registrado.');
      return saved;
    },
    [toast]
  );

  const deleteTransaction = useCallback(
    async (id) => {
      await Database.remove('financial', id);
      toast.success('Lançamento excluído.');
    },
    [toast]
  );

  const saveProfile = useCallback(
    async (data) => {
      await Database.saveSettings(data);
      toast.success('Configurações salvas.');
    },
    [toast]
  );

  /**
   * Envio do formulário público. Garante a sessão anônima antes de
   * gravar: sem ela as regras do Firestore recusam a escrita, e o
   * visitante rápido chegava a enviar antes do login terminar.
   */
  const submitPublicQuote = useCallback(async (order) => {
    if (isCloudMode) await AuthService.signInAsVisitor();
    const id = await Database.nextOrderId();
    return Database.save('orders', { ...order, id }, 'OS');
  }, []);

  // ---------------------------------------------------------
  // Métricas derivadas
  // ---------------------------------------------------------

  const metrics = useMemo(() => {
    let revenue = 0;
    let expenses = 0;
    for (const entry of financial) {
      const amount = Number(entry.amount) || 0;
      if (entry.type === 'receita') revenue += amount;
      else expenses += amount;
    }

    const counts = { orcamento: 0, agendado: 0, em_andamento: 0, concluido: 0, cancelado: 0 };
    let receivable = 0;
    let ratingSum = 0;
    let ratingCount = 0;

    for (const order of orders) {
      if (counts[order.status] !== undefined) counts[order.status] += 1;
      if (order.status !== 'cancelado' && order.paymentStatus !== 'pago') {
        receivable += Number(order.totalValue) || 0;
      }
      const rating = order.signatures?.satisfactionRating;
      if (rating) {
        ratingSum += rating;
        ratingCount += 1;
      }
    }

    const completedValues = orders
      .filter((o) => o.status === 'concluido')
      .map((o) => Number(o.totalValue) || 0);

    return {
      revenue,
      expenses,
      profit: revenue - expenses,
      receivable,
      counts,
      totalOrders: orders.length,
      averageTicket: completedValues.length
        ? completedValues.reduce((a, b) => a + b, 0) / completedValues.length
        : 0,
      averageRating: ratingCount ? ratingSum / ratingCount : 0,
      margin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0
    };
  }, [orders, financial]);

  /** Comissão devida a cada montador pelas ordens já concluídas. */
  const commissions = useMemo(() => {
    return employees.map((employee) => {
      const done = orders.filter((o) => o.employeeId === employee.id && o.status === 'concluido');
      const produced = done.reduce((sum, o) => sum + (Number(o.totalValue) || 0), 0);
      const rate = Number(employee.commissionRate) || 0;
      return {
        ...employee,
        ordersCount: done.length,
        totalGenerated: produced,
        commissionEarned: (produced * rate) / 100
      };
    });
  }, [employees, orders]);

  const value = useMemo(
    () => ({
      profile,
      employees,
      clients,
      orders,
      financial,
      metrics,
      commissions,
      loading,
      online,
      isCloudMode,
      saveOrder,
      deleteOrder,
      saveClient,
      deleteClient,
      saveEmployee,
      deleteEmployee,
      addTransaction,
      deleteTransaction,
      saveProfile,
      submitPublicQuote
    }),
    [
      profile,
      employees,
      clients,
      orders,
      financial,
      metrics,
      commissions,
      loading,
      online,
      saveOrder,
      deleteOrder,
      saveClient,
      deleteClient,
      saveEmployee,
      deleteEmployee,
      addTransaction,
      deleteTransaction,
      saveProfile,
      submitPublicQuote
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData precisa estar dentro de <DataProvider>');
  return context;
}
