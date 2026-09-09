// ============================================================
// MontaÊ - Ordens de serviço e montagens
// ============================================================

import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  X,
  Phone,
  MapPin,
  MessageSquare,
  CheckCircle,
  Award,
  Printer,
  Trash2,
  Pencil,
  Calendar,
  Download,
  PlayCircle,
  Navigation
} from 'lucide-react';
import {
  formatBRL,
  formatDateBR,
  formatWhatsAppLink,
  mapsLink,
  statusMeta,
  todayISO,
  toCSV,
  downloadFile
} from '../services/calculations';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

const FILTERS = [
  { id: 'todos', label: 'Todas' },
  { id: 'orcamento', label: 'Orçamentos' },
  { id: 'agendado', label: 'Agendadas' },
  { id: 'em_andamento', label: 'Em campo' },
  { id: 'concluido', label: 'Concluídas' }
];

export default function OrdersView({ onNewOrder, onEditOrder, onViewReceipt, onOpenField }) {
  const { isAdmin } = useAuth();
  const { orders, employees, saveOrder, deleteOrder } = useData();
  const { confirm, toast } = useToast();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [sort, setSort] = useState('date-desc');

  const counts = useMemo(() => {
    const result = { todos: orders.length };
    for (const order of orders) {
      result[order.status] = (result[order.status] || 0) + 1;
    }
    return result;
  }, [orders]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = orders.filter((order) => {
      if (filter !== 'todos' && order.status !== filter) return false;
      if (!term) return true;
      return (
        String(order.id).toLowerCase().includes(term) ||
        String(order.clientName || '').toLowerCase().includes(term) ||
        String(order.address || '').toLowerCase().includes(term) ||
        String(order.clientPhone || '').includes(term) ||
        (order.items || []).some((item) => String(item.name).toLowerCase().includes(term))
      );
    });

    const sorters = {
      'date-desc': (a, b) => String(b.scheduledDate || '').localeCompare(String(a.scheduledDate || '')),
      'date-asc': (a, b) => String(a.scheduledDate || '').localeCompare(String(b.scheduledDate || '')),
      'value-desc': (a, b) => (Number(b.totalValue) || 0) - (Number(a.totalValue) || 0),
      'client': (a, b) => String(a.clientName || '').localeCompare(String(b.clientName || ''), 'pt-BR')
    };

    return [...filtered].sort(sorters[sort] || sorters['date-desc']);
  }, [orders, search, filter, sort]);

  const handleStatus = async (order, status) => {
    const patch = { ...order, status };
    if (status === 'concluido' && !patch.completedAt) {
      patch.completedAt = `${todayISO()} ${new Date().toTimeString().slice(0, 5)}`;
      patch.paymentStatus = 'pago';
    }
    await saveOrder(patch);
    toast.success(`Ordem ${order.id}: ${statusMeta(status).label.toLowerCase()}.`);
  };

  const handleAssign = async (order, employeeId) => {
    const employee = employees.find((e) => e.id === employeeId);
    await saveOrder({ ...order, employeeId, employeeName: employee?.name || '' });
  };

  const handleDelete = async (order) => {
    const ok = await confirm({
      title: `Excluir a ordem ${order.id}?`,
      message: `A ordem de ${order.clientName} será removida permanentemente. Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir'
    });
    if (ok) await deleteOrder(order.id);
  };

  const handleExport = () => {
    if (!visible.length) {
      toast.warning('Não há ordens para exportar com os filtros atuais.');
      return;
    }
    const csv = toCSV(visible, [
      { label: 'Ordem', value: (o) => o.id },
      { label: 'Cliente', value: (o) => o.clientName },
      { label: 'Telefone', value: (o) => o.clientPhone },
      { label: 'Endereço', value: (o) => o.address },
      { label: 'Data', value: (o) => formatDateBR(o.scheduledDate) },
      { label: 'Horário', value: (o) => o.scheduledTime },
      { label: 'Montador', value: (o) => o.employeeName },
      { label: 'Situação', value: (o) => statusMeta(o.status).label },
      { label: 'Pagamento', value: (o) => o.paymentMethod },
      { label: 'Status pagamento', value: (o) => o.paymentStatus },
      { label: 'Valor', value: (o) => Number(o.totalValue) || 0 },
      { label: 'Itens', value: (o) => (o.items || []).map((i) => `${i.qty}x ${i.name}`).join(' | ') }
    ]);
    downloadFile(`montae-ordens-${todayISO()}.csv`, csv, 'text/csv');
    toast.success(`${visible.length} ordens exportadas.`);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Ordens de serviço</h1>
          <p className="page-sub">
            Orçamentos recebidos, montagens agendadas, atendimentos em campo e comprovantes assinados.
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            <Download size={15} aria-hidden="true" />
            Exportar
          </button>
          <button type="button" className="btn btn-primary" onClick={onNewOrder}>
            <Plus size={16} aria-hidden="true" />
            Nova ordem
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={16} aria-hidden="true" />
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, cliente, endereço ou móvel..."
            aria-label="Buscar ordens"
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

        <select
          className="select select-sm"
          style={{ width: 'auto' }}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Ordenar por"
        >
          <option value="date-desc">Data (mais recente)</option>
          <option value="date-asc">Data (mais antiga)</option>
          <option value="value-desc">Maior valor</option>
          <option value="client">Cliente (A-Z)</option>
        </select>
      </div>

      <div className="segmented mb-20">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`segment ${filter === item.id ? 'is-active' : ''}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label} ({counts[item.id] || 0})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon" aria-hidden="true">
            <Calendar size={24} />
          </div>
          <h4>Nenhuma ordem encontrada</h4>
          <p>
            {search || filter !== 'todos'
              ? 'Tente outro termo de busca ou remova os filtros.'
              : 'Cadastre a primeira ordem de serviço para começar.'}
          </p>
          {search || filter !== 'todos' ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearch('');
                setFilter('todos');
              }}
            >
              Limpar filtros
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={onNewOrder}>
              <Plus size={15} aria-hidden="true" />
              Nova ordem
            </button>
          )}
        </div>
      ) : (
        <div className="stack">
          {visible.map((order) => {
            const meta = statusMeta(order.status);
            const isLate =
              ['agendado', 'em_andamento'].includes(order.status) &&
              (order.scheduledDate || '') < todayISO();

            return (
              <article key={order.id} className={`card card-flag ${meta.flag}`}>
                <div className="card-body">
                  <div className="row-between" style={{ alignItems: 'flex-start' }}>
                    {/* Identificação */}
                    <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                      <div className="row-wrap mb-8">
                        <span className="strong fs-15">{order.id}</span>
                        <span className={`badge badge-${meta.tone}`}>{meta.label}</span>
                        {order.source === 'link_orcamento' && (
                          <span className="badge badge-brand">Link do cliente</span>
                        )}
                        {isLate && <span className="badge badge-bad">Atrasada</span>}
                      </div>

                      <h3 className="fs-17 mb-8">{order.clientName}</h3>

                      <div className="metas mb-12">
                        <span className="meta">
                          <Phone size={14} aria-hidden="true" />
                          <span>{order.clientPhone || 'Sem telefone'}</span>
                        </span>
                        <span className="meta">
                          <Calendar size={14} aria-hidden="true" />
                          <span>
                            {formatDateBR(order.scheduledDate)} às {order.scheduledTime || '09:00'}
                          </span>
                        </span>
                      </div>

                      <a
                        className="meta mb-12"
                        href={mapsLink(order.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--text-2)' }}
                      >
                        <MapPin size={14} aria-hidden="true" />
                        <span className="truncate">{order.address}</span>
                      </a>

                      <div className="panel">
                        <div className="stat-label mb-8">Móveis a montar</div>
                        <div className="stack-sm">
                          {(order.items || []).map((item, index) => (
                            <div key={index} className="row-between fs-13" style={{ gap: 8 }}>
                              <span>
                                <strong>{item.qty || 1}×</strong> {item.name}
                                {item.room ? ` (${item.room})` : ''}
                              </span>
                              <span className="muted fs-12">{item.type || 'Novo'}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {order.notes && <p className="fs-12 muted mt-12">Observação: {order.notes}</p>}
                    </div>

                    {/* Valores e ações */}
                    <div
                      style={{
                        flex: '0 1 260px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        alignItems: 'flex-end'
                      }}
                    >
                      <div style={{ textAlign: 'right' }}>
                        <div className="money money-lg">{formatBRL(order.totalValue)}</div>
                        <div
                          className="fs-12 strong"
                          style={{
                            color: order.paymentStatus === 'pago' ? 'var(--ok)' : 'var(--warn)'
                          }}
                        >
                          {order.paymentStatus === 'pago' ? 'Pago' : 'Pendente'} ·{' '}
                          {order.paymentMethod || 'Pix'}
                        </div>
                      </div>

                      <label className="row" style={{ gap: 6 }}>
                        <span className="fs-12 muted">Montador:</span>
                        <select
                          className="select select-sm"
                          style={{ width: 'auto' }}
                          value={order.employeeId || ''}
                          onChange={(e) => handleAssign(order, e.target.value)}
                          aria-label={`Montador da ordem ${order.id}`}
                        >
                          <option value="">Não atribuído</option>
                          {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="row-wrap" style={{ justifyContent: 'flex-end' }}>
                        <a
                          className="btn btn-secondary btn-sm"
                          href={formatWhatsAppLink(
                            order.clientPhone,
                            `Olá ${order.clientName}! Aqui é da MontaÊ, sobre a montagem ${order.id}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageSquare size={14} color="#25D366" aria-hidden="true" />
                          WhatsApp
                        </a>

                        {order.status === 'orcamento' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleStatus(order, 'agendado')}
                          >
                            <CheckCircle size={14} aria-hidden="true" />
                            Aprovar
                          </button>
                        )}

                        {order.status === 'agendado' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStatus(order, 'em_andamento')}
                          >
                            <PlayCircle size={14} color="var(--info)" aria-hidden="true" />
                            Iniciar
                          </button>
                        )}

                        {order.status === 'em_andamento' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => onOpenField(order.id)}
                          >
                            <Award size={14} aria-hidden="true" />
                            Assinar
                          </button>
                        )}

                        {order.status === 'concluido' && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => onViewReceipt(order)}
                          >
                            <Printer size={14} aria-hidden="true" />
                            Comprovante
                          </button>
                        )}

                        <a
                          className="btn btn-secondary btn-icon btn-sm"
                          href={mapsLink(order.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir rota no mapa"
                          aria-label="Abrir rota no mapa"
                        >
                          <Navigation size={14} color="var(--info)" />
                        </a>

                        <button
                          type="button"
                          className="btn btn-secondary btn-icon btn-sm"
                          onClick={() => onEditOrder(order)}
                          title="Editar ordem"
                          aria-label={`Editar ordem ${order.id}`}
                        >
                          <Pencil size={14} />
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon btn-sm"
                            onClick={() => handleDelete(order)}
                            title="Excluir ordem"
                            aria-label={`Excluir ordem ${order.id}`}
                          >
                            <Trash2 size={14} color="var(--bad)" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
