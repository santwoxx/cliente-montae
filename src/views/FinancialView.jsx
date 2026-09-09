import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Filter, 
  Calendar, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet, 
  Users, 
  CheckCircle,
  X,
  Check
} from 'lucide-react';
import { formatBRL, formatDateBR } from '../services/calculations';

export default function FinancialView({
  financial,
  orders,
  employees,
  onAddTransaction,
  onDeleteTransaction
}) {
  const [filterType, setFilterType] = useState('todos'); // todos, receita, despesa
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    type: 'despesa',
    description: '',
    category: 'Transporte & Combustível',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Pix'
  });

  const categories = {
    despesa: [
      'Transporte & Combustível',
      'Ferramentas & Insumos',
      'Ferragens & Reparos',
      'Alimentação / Diária',
      'Comissão de Ajudante',
      'Outras Despesas'
    ],
    receita: [
      'Montagem de Móveis',
      'Desmontagem & Remontagem',
      'Regulagem & Manutenção',
      'Outras Receitas'
    ]
  };

  // Calculations
  const totalRevenue = financial
    .filter(f => f.type === 'receita')
    .reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);

  const totalExpenses = financial
    .filter(f => f.type === 'despesa')
    .reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);

  const netBalance = totalRevenue - totalExpenses;

  const accountsReceivable = orders
    .filter(o => o.status !== 'cancelado' && o.paymentStatus !== 'pago')
    .reduce((acc, cur) => acc + (Number(cur.totalValue) || 0), 0);

  // Calculate commissions per employee based on completed orders
  const employeeCommissions = employees.map(emp => {
    const empOrders = orders.filter(o => o.employeeId === emp.id && o.status === 'concluido');
    const totalGenerated = empOrders.reduce((acc, o) => acc + (Number(o.totalValue) || 0), 0);
    const rate = emp.commissionRate || 100;
    const commissionEarned = (totalGenerated * rate) / 100;

    return {
      ...emp,
      ordersCount: empOrders.length,
      totalGenerated,
      commissionEarned
    };
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) return;

    onAddTransaction({
      ...form,
      amount: parseFloat(form.amount)
    });

    setIsModalOpen(false);
    setForm({
      type: 'despesa',
      description: '',
      category: 'Transporte & Combustível',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Pix'
    });
  };

  const filteredTransactions = financial.filter(f => {
    if (filterType === 'todos') return true;
    return f.type === filterType;
  });

  return (
    <div className="financial-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', margin: 0 }}>
            Gestão Financeira & Fluxo de Caixa
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Controle de entradas de montagens, despesas de combustível/ferramentas e cálculo de comissões.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Novo Lançamento
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card emerald">
          <div className="stat-top">
            <span className="stat-label">Receitas Totais</span>
            <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
              <ArrowUpRight size={22} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {formatBRL(totalRevenue)}
          </div>
          <div className="stat-footer">
            <span>Entradas de montagens e serviços</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderTop: '3px solid var(--danger)' }}>
          <div className="stat-top">
            <span className="stat-label">Despesas Operacionais</span>
            <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
              <ArrowDownRight size={22} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>
            {formatBRL(totalExpenses)}
          </div>
          <div className="stat-footer">
            <span>Gasolina, brocas, cantoneiras e insumos</span>
          </div>
        </div>

        <div className="stat-card gold">
          <div className="stat-top">
            <span className="stat-label">Saldo Líquido</span>
            <div className="stat-icon" style={{ background: 'rgba(229, 169, 60, 0.15)', color: 'var(--gold-hover)' }}>
              <Wallet size={22} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--gold-hover)' }}>
            {formatBRL(netBalance)}
          </div>
          <div className="stat-footer">
            <span>Lucro real após dedução de gastos</span>
          </div>
        </div>

        <div className="stat-card amber">
          <div className="stat-top">
            <span className="stat-label">A Receber (Previsão)</span>
            <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <DollarSign size={22} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>
            {formatBRL(accountsReceivable)}
          </div>
          <div className="stat-footer">
            <span>De ordens agendadas / em andamento</span>
          </div>
        </div>
      </div>

      {/* Staff Commission Breakdown */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">
            <Users size={18} /> Demonstrativo de Comissões por Montador
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {employeeCommissions.map(emp => (
            <div 
              key={emp.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{emp.name}</span>
                <span className="badge badge-gold">{emp.commissionRate}% Comissão</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {emp.role}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Montagens Concluídas:</span>
                <strong style={{ color: '#fff' }}>{emp.ordersCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Produzido:</span>
                <span>{formatBRL(emp.totalGenerated)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border-subtle)' }}>
                <strong style={{ color: 'var(--gold-hover)' }}>A Repassar:</strong>
                <strong style={{ color: 'var(--gold-hover)', fontSize: '16px' }}>{formatBRL(emp.commissionEarned)}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <DollarSign size={18} /> Extrato de Lançamentos
          </h3>

          <div className="nav-tabs">
            <button 
              className={`nav-tab ${filterType === 'todos' ? 'active' : ''}`}
              onClick={() => setFilterType('todos')}
            >
              Todos
            </button>
            <button 
              className={`nav-tab ${filterType === 'receita' ? 'active' : ''}`}
              onClick={() => setFilterType('receita')}
            >
              Receitas
            </button>
            <button 
              className={`nav-tab ${filterType === 'despesa' ? 'active' : ''}`}
              onClick={() => setFilterType('despesa')}
            >
              Despesas
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Forma de Pgto</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(item => {
                const isIncome = item.type === 'receita';
                return (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatDateBR(item.date)}</td>
                    <td style={{ fontWeight: '600', color: '#fff' }}>{item.description}</td>
                    <td>
                      <span className="badge badge-gold" style={{ fontSize: '11px' }}>
                        {item.category || 'Geral'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.paymentMethod || 'Pix'}</td>
                    <td>
                      <span className={`badge ${isIncome ? 'badge-success' : 'badge-danger'}`}>
                        {isIncome ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '14px', color: isIncome ? 'var(--success)' : 'var(--danger)' }}>
                      {isIncome ? '+' : '-'} {formatBRL(item.amount)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-secondary btn-icon btn-sm"
                        onClick={() => {
                          if (confirm(`Excluir lançamento "${item.description}"?`)) {
                            onDeleteTransaction(item.id);
                          }
                        }}
                        title="Excluir lançamento"
                      >
                        <Trash2 size={13} color="var(--danger)" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Transaction */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '18px' }}>Novo Lançamento Financeiro</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Type selector */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    className={`btn ${form.type === 'despesa' ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => setForm({ ...form, type: 'despesa', category: categories.despesa[0] })}
                  >
                    <ArrowDownRight size={16} /> Despesa (Saída)
                  </button>
                  <button
                    type="button"
                    className={`btn ${form.type === 'receita' ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => setForm({ ...form, type: 'receita', category: categories.receita[0] })}
                  >
                    <ArrowUpRight size={16} /> Receita (Entrada)
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder={form.type === 'despesa' ? 'Ex: Gasolina posto Ipiranga' : 'Ex: Recebimento montagem avulsa'}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Valor (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="form-control"
                      placeholder="0,00"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Categoria</label>
                    <select
                      className="form-control"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {categories[form.type].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Forma de Pagamento</label>
                    <select
                      className="form-control"
                      value={form.paymentMethod}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    >
                      <option value="Pix">Pix</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Boleto">Boleto</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
