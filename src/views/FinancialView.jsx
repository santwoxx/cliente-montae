// ============================================================
// MontaÊ - Gestão financeira e comissões
// ============================================================

import React, { useMemo, useState } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Check,
  Download,
  Search,
  X,
  Receipt
} from 'lucide-react';
import Modal from '../components/Modal';
import {
  EXPENSE_CATEGORIES,
  REVENUE_CATEGORIES,
  PAYMENT_METHODS,
  formatBRL,
  formatDateBR,
  todayISO,
  toCSV,
  downloadFile
} from '../services/calculations';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

const EMPTY_FORM = {
  type: 'despesa',
  description: '',
  category: EXPENSE_CATEGORIES[0],
  amount: '',
  date: todayISO(),
  paymentMethod: 'Pix'
};

export default function FinancialView() {
  const { financial, metrics, commissions, addTransaction, deleteTransaction } = useData();
  const { confirm, toast } = useToast();

  const [typeFilter, setTypeFilter] = useState('todos');
  const [monthFilter, setMonthFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  /** Meses presentes no extrato, do mais recente para o mais antigo. */
  const months = useMemo(() => {
    const set = new Set();
    for (const entry of financial) {
      const key = String(entry.date || '').slice(0, 7);
      if (key.length === 7) set.add(key);
    }
    return [...set].sort().reverse();
  }, [financial]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return financial.filter((entry) => {
      if (typeFilter !== 'todos' && entry.type !== typeFilter) return false;
      if (monthFilter !== 'todos' && String(entry.date || '').slice(0, 7) !== monthFilter) return false;
      if (!term) return true;
      return (
        String(entry.description || '').toLowerCase().includes(term) ||
        String(entry.category || '').toLowerCase().includes(term)
      );
    });
  }, [financial, typeFilter, monthFilter, search]);

  /** Totais do recorte filtrado, e não do extrato inteiro. */
  const filteredTotals = useMemo(() => {
    let income = 0;
    let outcome = 0;
    for (const entry of visible) {
      const amount = Number(entry.amount) || 0;
      if (entry.type === 'receita') income += amount;
      else outcome += amount;
    }
    return { income, outcome, balance: income - outcome };
  }, [visible]);

  const categories = form.type === 'despesa' ? EXPENSE_CATEGORIES : REVENUE_CATEGORIES;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const found = {};
    if (!form.description.trim()) found.description = 'Descreva o lançamento.';
    const amount = parseFloat(String(form.amount).replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) found.amount = 'Informe um valor maior que zero.';

    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await addTransaction({ ...form, amount, status: 'concluido' });
      setForm({ ...EMPTY_FORM, date: form.date });
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível salvar o lançamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry) => {
    const ok = await confirm({
      title: 'Excluir lançamento?',
      message: `"${entry.description}" no valor de ${formatBRL(entry.amount)} será removido do extrato.`,
      confirmLabel: 'Excluir'
    });
    if (ok) await deleteTransaction(entry.id);
  };

  const handleExport = () => {
    if (!visible.length) {
      toast.warning('Não há lançamentos para exportar.');
      return;
    }
    const csv = toCSV(visible, [
      { label: 'Data', value: (t) => formatDateBR(t.date) },
      { label: 'Tipo', value: (t) => (t.type === 'receita' ? 'Receita' : 'Despesa') },
      { label: 'Descrição', value: (t) => t.description },
      { label: 'Categoria', value: (t) => t.category },
      { label: 'Pagamento', value: (t) => t.paymentMethod },
      { label: 'Ordem', value: (t) => t.orderId || '' },
      { label: 'Valor', value: (t) => Number(t.amount) || 0 }
    ]);
    downloadFile(`montae-financeiro-${todayISO()}.csv`, csv, 'text/csv');
    toast.success(`${visible.length} lançamentos exportados.`);
  };

  const monthLabel = (key) => {
    const [year, month] = key.split('-');
    return new Date(Number(year), Number(month) - 1, 1)
      .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      .replace(/^./, (char) => char.toUpperCase());
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-sub">
            Entradas das montagens, despesas de combustível e ferramentas, e comissões dos montadores.
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            <Download size={15} aria-hidden="true" />
            Exportar
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setIsOpen(true)}>
            <Plus size={16} aria-hidden="true" />
            Novo lançamento
          </button>
        </div>
      </div>

      {/* Indicadores gerais */}
      <div className="stats">
        <div className="stat t-ok">
          <div className="stat-top">
            <span className="stat-label">Receitas</span>
            <div className="stat-icon t-ok" aria-hidden="true">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="stat-value t-ok">{formatBRL(metrics.revenue)}</div>
          <div className="stat-foot">Entradas de montagens e serviços</div>
        </div>

        <div className="stat t-bad">
          <div className="stat-top">
            <span className="stat-label">Despesas</span>
            <div className="stat-icon t-bad" aria-hidden="true">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="stat-value t-bad">{formatBRL(metrics.expenses)}</div>
          <div className="stat-foot">Combustível, ferragens e insumos</div>
        </div>

        <div className="stat t-brand">
          <div className="stat-top">
            <span className="stat-label">Saldo líquido</span>
            <div className="stat-icon t-brand" aria-hidden="true">
              <Wallet size={18} />
            </div>
          </div>
          <div className="stat-value t-brand">{formatBRL(metrics.profit)}</div>
          <div className="stat-foot">Margem de {metrics.margin.toFixed(0)}%</div>
        </div>

        <div className="stat t-warn">
          <div className="stat-top">
            <span className="stat-label">A receber</span>
            <div className="stat-icon t-warn" aria-hidden="true">
              <Receipt size={18} />
            </div>
          </div>
          <div className="stat-value t-warn">{formatBRL(metrics.receivable)}</div>
          <div className="stat-foot">De ordens ainda não pagas</div>
        </div>
      </div>

      {/* Comissões */}
      {commissions.length > 0 && (
        <section className="card mb-20">
          <div className="card-head">
            <h2 className="card-title">
              <Users size={17} aria-hidden="true" />
              Comissões por montador
            </h2>
          </div>
          <div className="card-body">
            <div className="grid-cards">
              {commissions.map((employee) => (
                <div key={employee.id} className="panel">
                  <div className="row-between mb-8">
                    <span className="strong fs-15">{employee.name}</span>
                    <span className="badge badge-brand">{employee.commissionRate}%</span>
                  </div>
                  <div className="fs-12 muted mb-12">{employee.role}</div>

                  <div className="row-between fs-13">
                    <span className="muted">Montagens concluídas</span>
                    <strong>{employee.ordersCount}</strong>
                  </div>
                  <div className="row-between fs-13 mt-8">
                    <span className="muted">Total produzido</span>
                    <span>{formatBRL(employee.totalGenerated)}</span>
                  </div>

                  <hr className="divider" style={{ margin: '10px 0' }} />

                  <div className="row-between">
                    <strong className="fs-13">A repassar</strong>
                    <strong className="money">{formatBRL(employee.commissionEarned)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Extrato */}
      <section className="card">
        <div className="card-head">
          <h2 className="card-title">
            <Wallet size={17} aria-hidden="true" />
            Extrato de lançamentos
          </h2>

          <div className="row-wrap">
            {months.length > 0 && (
              <select
                className="select select-sm"
                style={{ width: 'auto' }}
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                aria-label="Filtrar por mês"
              >
                <option value="todos">Todos os meses</option>
                {months.map((key) => (
                  <option key={key} value={key}>
                    {monthLabel(key)}
                  </option>
                ))}
              </select>
            )}

            <div className="segmented">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'receita', label: 'Receitas' },
                { id: 'despesa', label: 'Despesas' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`segment ${typeFilter === item.id ? 'is-active' : ''}`}
                  onClick={() => setTypeFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card-body-tight">
          <div className="toolbar" style={{ margin: '4px 8px 12px' }}>
            <div className="search">
              <Search size={16} aria-hidden="true" />
              <input
                className="input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar lançamento ou categoria..."
                aria-label="Buscar lançamentos"
              />
              {search && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearch('')}
                  aria-label="Limpar busca"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Totais do recorte atual */}
            <div className="row-wrap fs-12">
              <span className="badge badge-ok">+ {formatBRL(filteredTotals.income)}</span>
              <span className="badge badge-bad">− {formatBRL(filteredTotals.outcome)}</span>
              <span className="badge badge-mute">= {formatBRL(filteredTotals.balance)}</span>
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="empty">
              <div className="empty-icon" aria-hidden="true">
                <Wallet size={22} />
              </div>
              <h4>Nenhum lançamento</h4>
              <p>Registre entradas e saídas para acompanhar o caixa do mês.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsOpen(true)}>
                <Plus size={14} aria-hidden="true" />
                Novo lançamento
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 96 }}>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Pagamento</th>
                    <th className="t-right">Valor</th>
                    <th style={{ width: 48 }} aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((entry) => {
                    const isIncome = entry.type === 'receita';
                    return (
                      <tr key={entry.id}>
                        <td className="muted">{formatDateBR(entry.date)}</td>
                        <td>
                          <div className="strong">{entry.description}</div>
                          {entry.orderId && <div className="fs-11 muted">Ordem {entry.orderId}</div>}
                        </td>
                        <td>
                          <span className="badge badge-mute">{entry.category || 'Geral'}</span>
                        </td>
                        <td className="muted fs-12">{entry.paymentMethod || '—'}</td>
                        <td className={`t-right num ${isIncome ? 'num-ok' : 'num-bad'}`}>
                          {isIncome ? '+' : '−'} {formatBRL(entry.amount)}
                        </td>
                        <td className="t-center">
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => handleDelete(entry)}
                            aria-label={`Excluir ${entry.description}`}
                          >
                            <Trash2 size={14} color="var(--bad)" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {isOpen && (
        <Modal
          title="Novo lançamento"
          icon={Wallet}
          size="sm"
          onClose={() => setIsOpen(false)}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setIsOpen(false)}>
                Cancelar
              </button>
              <button type="submit" form="fin-form" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" /> : <Check size={16} aria-hidden="true" />}
                Salvar
              </button>
            </>
          }
        >
          <form id="fin-form" onSubmit={handleSubmit} noValidate>
            <div className="toggle-group mb-16">
              <button
                type="button"
                className={`btn ${form.type === 'despesa' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    type: 'despesa',
                    category: EXPENSE_CATEGORIES[0]
                  }))
                }
              >
                <ArrowDownRight size={16} aria-hidden="true" />
                Despesa
              </button>
              <button
                type="button"
                className={`btn ${form.type === 'receita' ? 'btn-success' : 'btn-secondary'}`}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    type: 'receita',
                    category: REVENUE_CATEGORIES[0]
                  }))
                }
              >
                <ArrowUpRight size={16} aria-hidden="true" />
                Receita
              </button>
            </div>

            <div className="field">
              <label className="label" htmlFor="fin-desc">
                Descrição <span className="req">*</span>
              </label>
              <input
                id="fin-desc"
                className={`input ${errors.description ? 'is-invalid' : ''}`}
                value={form.description}
                onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                placeholder={
                  form.type === 'despesa'
                    ? 'Ex.: Gasolina posto Ipiranga'
                    : 'Ex.: Recebimento montagem avulsa'
                }
              />
              {errors.description && <span className="field-error">{errors.description}</span>}
            </div>

            <div className="grid-2">
              <div className="field">
                <label className="label" htmlFor="fin-amount">
                  Valor (R$) <span className="req">*</span>
                </label>
                <input
                  id="fin-amount"
                  className={`input ${errors.amount ? 'is-invalid' : ''}`}
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))}
                  placeholder="0,00"
                />
                {errors.amount && <span className="field-error">{errors.amount}</span>}
              </div>

              <div className="field">
                <label className="label" htmlFor="fin-date">
                  Data
                </label>
                <input
                  id="fin-date"
                  type="date"
                  className="input"
                  value={form.date}
                  onChange={(e) => setForm((c) => ({ ...c, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label className="label" htmlFor="fin-cat">
                  Categoria
                </label>
                <select
                  id="fin-cat"
                  className="select"
                  value={form.category}
                  onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field mb-0">
                <label className="label" htmlFor="fin-method">
                  Forma de pagamento
                </label>
                <select
                  id="fin-method"
                  className="select"
                  value={form.paymentMethod}
                  onChange={(e) => setForm((c) => ({ ...c, paymentMethod: e.target.value }))}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
