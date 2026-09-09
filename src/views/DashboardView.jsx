// ============================================================
// MontaÊ - Painel geral
// ============================================================

import React, { useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  Clock,
  ClipboardCheck,
  Sparkles,
  PlusCircle,
  Share2,
  ArrowUpRight,
  Calendar,
  Star,
  CalendarClock,
  Receipt
} from 'lucide-react';
import { formatBRL, formatDateBR, statusMeta, todayISO } from '../services/calculations';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

/** Agrupa receitas e despesas dos últimos 6 meses para o gráfico. */
function buildCashFlow(financial) {
  const months = [];
  const now = new Date();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      income: 0,
      outcome: 0
    });
  }

  const index = new Map(months.map((month) => [month.key, month]));

  for (const entry of financial) {
    const key = String(entry.date || '').slice(0, 7);
    const bucket = index.get(key);
    if (!bucket) continue;
    const amount = Number(entry.amount) || 0;
    if (entry.type === 'receita') bucket.income += amount;
    else bucket.outcome += amount;
  }

  const peak = Math.max(1, ...months.flatMap((month) => [month.income, month.outcome]));
  return { months, peak };
}

export default function DashboardView({ onNavigate, onNewOrder, onShareQuote, onViewReceipt }) {
  const { isAdmin, user } = useAuth();
  const { orders, financial, metrics, profile } = useData();

  const cashFlow = useMemo(() => buildCashFlow(financial), [financial]);

  /** Próximas montagens ordenadas por data, ignorando as encerradas. */
  const upcoming = useMemo(() => {
    const today = todayISO();
    return orders
      .filter((order) => ['agendado', 'em_andamento'].includes(order.status))
      .sort((a, b) => String(a.scheduledDate || '').localeCompare(String(b.scheduledDate || '')))
      .slice(0, 5)
      .map((order) => ({ ...order, isLate: (order.scheduledDate || '') < today }));
  }, [orders]);

  const recent = useMemo(() => orders.slice(0, 5), [orders]);
  const pendingQuotes = metrics.counts.orcamento;
  const firstName = (user?.displayName || profile?.name || '').split(' ')[0];

  return (
    <div>
      {pendingQuotes > 0 && (
        <div className="notice">
          <div className="notice-icon" aria-hidden="true">
            <Sparkles size={20} />
          </div>
          <div className="notice-body">
            <div className="notice-title">
              {pendingQuotes} {pendingQuotes === 1 ? 'novo orçamento' : 'novos orçamentos'} pelo link
              público
            </div>
            <div className="notice-text">
              Clientes preencheram o simulador e aguardam retorno para aprovação e agendamento.
            </div>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('orders')}>
            Revisar
            <ArrowUpRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="page-head">
        <div>
          <h1 className="page-title">
            Painel geral · <em>MontaÊ</em>
          </h1>
          <p className="page-sub">
            {firstName ? `Olá, ${firstName}. ` : ''}
            Visão rápida das montagens, do caixa e do que precisa da sua atenção hoje.
          </p>
        </div>

        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={onNewOrder}>
            <PlusCircle size={16} aria-hidden="true" />
            Nova montagem
          </button>
          <button type="button" className="btn btn-outline" onClick={onShareQuote}>
            <Share2 size={16} aria-hidden="true" />
            Link de orçamento
          </button>
        </div>
      </div>

      {/* Indicadores */}
      <div className="stats">
        {isAdmin && (
          <div className="stat t-brand">
            <div className="stat-top">
              <span className="stat-label">Faturamento</span>
              <div className="stat-icon t-brand" aria-hidden="true">
                <Wallet size={18} />
              </div>
            </div>
            <div className="stat-value t-brand">{formatBRL(metrics.revenue)}</div>
            <div className="stat-foot">
              <TrendingUp size={13} aria-hidden="true" />
              Receitas acumuladas
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="stat t-ok">
            <div className="stat-top">
              <span className="stat-label">Lucro líquido</span>
              <div className="stat-icon t-ok" aria-hidden="true">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="stat-value t-ok">{formatBRL(metrics.profit)}</div>
            <div className="stat-foot">
              Margem de {metrics.margin.toFixed(0)}% · despesas {formatBRL(metrics.expenses)}
            </div>
          </div>
        )}

        <div className="stat t-info">
          <div className="stat-top">
            <span className="stat-label">Montagens ativas</span>
            <div className="stat-icon t-info" aria-hidden="true">
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value t-info">
            {metrics.counts.em_andamento + metrics.counts.agendado}
          </div>
          <div className="stat-foot">
            {metrics.counts.em_andamento} em campo · {metrics.counts.agendado} agendadas
          </div>
        </div>

        <div className="stat t-warn">
          <div className="stat-top">
            <span className="stat-label">Concluídas</span>
            <div className="stat-icon t-warn" aria-hidden="true">
              <ClipboardCheck size={18} />
            </div>
          </div>
          <div className="stat-value">{metrics.counts.concluido}</div>
          <div className="stat-foot">
            {metrics.averageRating > 0 ? (
              <>
                <Star size={13} fill="#eab308" color="#eab308" aria-hidden="true" />
                {metrics.averageRating.toFixed(1)} de satisfação média
              </>
            ) : (
              'Com assinatura e garantia'
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="stat">
            <div className="stat-top">
              <span className="stat-label">Ticket médio</span>
              <div className="stat-icon t-brand" aria-hidden="true">
                <Receipt size={18} />
              </div>
            </div>
            <div className="stat-value">{formatBRL(metrics.averageTicket)}</div>
            <div className="stat-foot">Por montagem concluída</div>
          </div>
        )}
      </div>

      <div className="grid-split">
        {/* Próximas montagens */}
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">
              <CalendarClock size={17} aria-hidden="true" />
              Próximas montagens
            </h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('orders')}>
              Ver todas
            </button>
          </div>

          <div className="card-body">
            {upcoming.length === 0 ? (
              <div className="empty" style={{ padding: '28px 12px' }}>
                <div className="empty-icon" aria-hidden="true">
                  <Calendar size={22} />
                </div>
                <h4>Nenhuma montagem agendada</h4>
                <p>Crie uma ordem de serviço ou aprove um orçamento recebido.</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={onNewOrder}>
                  <PlusCircle size={14} aria-hidden="true" />
                  Nova montagem
                </button>
              </div>
            ) : (
              <div className="stack-sm">
                {upcoming.map((order) => {
                  const meta = statusMeta(order.status);
                  return (
                    <div key={order.id} className="tile">
                      <div style={{ minWidth: 0 }}>
                        <div className="row" style={{ gap: 7, flexWrap: 'wrap' }}>
                          <span className="tile-title truncate">{order.clientName}</span>
                          <span className={`badge badge-${meta.tone}`}>{meta.label}</span>
                          {order.isLate && <span className="badge badge-bad">Atrasada</span>}
                        </div>
                        <div className="tile-sub truncate">
                          {formatDateBR(order.scheduledDate)} às {order.scheduledTime || '09:00'} ·{' '}
                          {order.employeeName || 'sem montador'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div className="money">{formatBRL(order.totalValue)}</div>
                        <div className="tile-sub">{order.id}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Caixa */}
        {isAdmin ? (
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">
                <Wallet size={17} aria-hidden="true" />
                Fluxo de caixa (6 meses)
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onNavigate('financial')}
              >
                Financeiro
              </button>
            </div>

            <div className="card-body">
              <div className="chart" role="img" aria-label="Gráfico de receitas e despesas dos últimos seis meses">
                {cashFlow.months.map((month) => (
                  <div key={month.key} className="chart-col">
                    <div className="chart-bars">
                      <div
                        className="chart-bar is-in"
                        style={{ height: `${(month.income / cashFlow.peak) * 100}%` }}
                        title={`Receitas em ${month.label}: ${formatBRL(month.income)}`}
                      />
                      <div
                        className="chart-bar is-out"
                        style={{ height: `${(month.outcome / cashFlow.peak) * 100}%` }}
                        title={`Despesas em ${month.label}: ${formatBRL(month.outcome)}`}
                      />
                    </div>
                    <span className="chart-label">{month.label}</span>
                  </div>
                ))}
              </div>

              <div className="chart-legend">
                <span className="chart-key">
                  <span className="chart-dot" style={{ background: 'var(--ok)' }} />
                  Receitas
                </span>
                <span className="chart-key">
                  <span className="chart-dot" style={{ background: 'var(--bad-line)' }} />
                  Despesas
                </span>
              </div>

              <hr className="divider" />

              <div className="grid-2">
                <div className="panel">
                  <div className="stat-label">A receber</div>
                  <div className="stat-value t-warn" style={{ fontSize: 19 }}>
                    {formatBRL(metrics.receivable)}
                  </div>
                </div>
                <div className="panel">
                  <div className="stat-label">Despesas</div>
                  <div className="stat-value t-bad" style={{ fontSize: 19 }}>
                    {formatBRL(metrics.expenses)}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">
                <ClipboardCheck size={17} aria-hidden="true" />
                Ordens recentes
              </h2>
            </div>
            <div className="card-body stack-sm">
              {recent.map((order) => {
                const meta = statusMeta(order.status);
                return (
                  <div key={order.id} className="tile">
                    <div style={{ minWidth: 0 }}>
                      <div className="tile-title truncate">{order.clientName}</div>
                      <div className="tile-sub">
                        {order.id} · {formatDateBR(order.scheduledDate)}
                      </div>
                    </div>
                    <span className={`badge badge-${meta.tone}`}>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Últimas ordens */}
      {isAdmin && (
        <section className="card mt-20">
          <div className="card-head">
            <h2 className="card-title">
              <ClipboardCheck size={17} aria-hidden="true" />
              Ordens recentes
            </h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('orders')}>
              Ver todas
            </button>
          </div>

          <div className="card-body">
            {recent.length === 0 ? (
              <div className="empty" style={{ padding: '24px 12px' }}>
                <p>Nenhuma ordem cadastrada ainda.</p>
              </div>
            ) : (
              <div className="stack-sm">
                {recent.map((order) => {
                  const meta = statusMeta(order.status);
                  return (
                    <div key={order.id} className="tile">
                      <div style={{ minWidth: 0 }}>
                        <div className="row" style={{ gap: 7, flexWrap: 'wrap' }}>
                          <span className="tile-title">{order.id}</span>
                          <span className="truncate">{order.clientName}</span>
                          <span className={`badge badge-${meta.tone}`}>{meta.label}</span>
                        </div>
                        <div className="tile-sub truncate">
                          {order.items?.[0]?.name || 'Montagem'}
                          {order.items?.length > 1 ? ` +${order.items.length - 1}` : ''} ·{' '}
                          {formatDateBR(order.scheduledDate)}
                        </div>
                      </div>

                      <div className="row" style={{ flexShrink: 0, gap: 10 }}>
                        <span className="money">{formatBRL(order.totalValue)}</span>
                        {order.status === 'concluido' && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => onViewReceipt(order)}
                          >
                            Comprovante
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
