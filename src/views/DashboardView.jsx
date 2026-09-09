import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  ClipboardCheck, 
  Sparkles, 
  PlusCircle, 
  Share2, 
  UserPlus, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { formatBRL, formatDateBR, formatWhatsAppLink } from '../services/calculations';

export default function DashboardView({
  orders,
  financial,
  clients,
  employees,
  profile,
  onNavigate,
  onOpenShareQuote,
  onOpenNewOrder,
  onViewReceipt
}) {
  // Financial metrics
  const totalRevenue = financial
    .filter(f => f.type === 'receita')
    .reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);

  const totalExpenses = financial
    .filter(f => f.type === 'despesa')
    .reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);

  const netProfit = totalRevenue - totalExpenses;

  // Assembly metrics
  const pendingQuotes = orders.filter(o => o.status === 'orcamento');
  const scheduledOrders = orders.filter(o => o.status === 'agendado');
  const inProgressOrders = orders.filter(o => o.status === 'em_andamento');
  const completedOrders = orders.filter(o => o.status === 'concluido');

  // Accounts receivable from active orders
  const accountsReceivable = orders
    .filter(o => o.status !== 'cancelado' && o.paymentStatus !== 'pago')
    .reduce((acc, cur) => acc + (Number(cur.totalValue) || 0), 0);

  return (
    <div className="dashboard-container">
      {/* Alert banner if there are new pending quotes from client links */}
      {pendingQuotes.length > 0 && (
        <div className="alert-banner">
          <div className="alert-banner-content">
            <div className="alert-banner-icon">
              <Sparkles size={22} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: '#fff' }}>
                {pendingQuotes.length} novo(s) orçamento(s) recebido(s) pelo Link Público!
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Clientes preencheram o simulador e aguardam retorno de Marcos Elias para aprovação e agendamento.
              </p>
            </div>
          </div>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => onNavigate('orders')}
          >
            Revisar Orçamentos <ArrowUpRight size={15} />
          </button>
        </div>
      )}

      {/* Top Welcome & Quick Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', margin: 0 }}>
            Painel Geral • <span style={{ color: 'var(--gold-primary)' }}>MontaÊ</span>
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Olá, {profile.name || 'Marcos Elias'} ({profile.email}). Gestão financeira e operacional de montagens.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onOpenNewOrder}>
            <PlusCircle size={16} /> Nova Montagem (OS)
          </button>
          <button className="btn btn-outline-gold" onClick={onOpenShareQuote}>
            <Share2 size={16} /> Link de Orçamento
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('clients')}>
            <UserPlus size={16} /> Clientes
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        {/* Total Revenue */}
        <div className="stat-card gold">
          <div className="stat-top">
            <span className="stat-label">Faturamento Total</span>
            <div className="stat-icon" style={{ background: 'rgba(229, 169, 60, 0.15)', color: 'var(--gold-hover)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--gold-hover)' }}>
            {formatBRL(totalRevenue)}
          </div>
          <div className="stat-footer">
            <TrendingUp size={14} color="var(--success)" />
            <span>Receitas acumuladas no período</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="stat-card emerald">
          <div className="stat-top">
            <span className="stat-label">Lucro Líquido</span>
            <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {formatBRL(netProfit)}
          </div>
          <div className="stat-footer">
            <span>Despesas deduzidas: {formatBRL(totalExpenses)}</span>
          </div>
        </div>

        {/* Pending / Active Assemblies */}
        <div className="stat-card blue">
          <div className="stat-top">
            <span className="stat-label">Montagens em Andamento</span>
            <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--info)' }}>
            {inProgressOrders.length + scheduledOrders.length}
          </div>
          <div className="stat-footer">
            <span>{inProgressOrders.length} em campo • {scheduledOrders.length} agendadas</span>
          </div>
        </div>

        {/* Concluded Orders */}
        <div className="stat-card amber">
          <div className="stat-top">
            <span className="stat-label">Montagens Concluídas</span>
            <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <ClipboardCheck size={20} />
            </div>
          </div>
          <div className="stat-value">
            {completedOrders.length}
          </div>
          <div className="stat-footer">
            <span>100% com assinaturas e garantia</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Orders & Quick Financial Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Recent Work Orders */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Calendar size={18} /> Ordens de Serviço Recentes
            </h3>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('orders')}
            >
              Ver Todas
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orders.slice(0, 5).map(order => (
              <div 
                key={order.id}
                style={{
                  background: 'var(--bg-surface)',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'border-color 0.2s'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>{order.id}</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '13.5px' }}>{order.clientName}</span>
                    {order.status === 'concluido' && (
                      <span className="badge badge-success">Concluído</span>
                    )}
                    {order.status === 'em_andamento' && (
                      <span className="badge badge-info">Em Andamento</span>
                    )}
                    {order.status === 'agendado' && (
                      <span className="badge badge-purple">Agendado</span>
                    )}
                    {order.status === 'orcamento' && (
                      <span className="badge badge-warning">Novo Orçamento</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {order.items && order.items[0] ? order.items[0].name : 'Montagem'} 
                    {order.items && order.items.length > 1 ? ` (+${order.items.length - 1} itens)` : ''}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    📅 {formatDateBR(order.scheduledDate)} {order.scheduledTime ? `às ${order.scheduledTime}` : ''} | Montador: {order.employeeName || 'A definir'}
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--gold-hover)' }}>
                    {formatBRL(order.totalValue)}
                  </span>
                  {order.status === 'concluido' ? (
                    <button 
                      className="btn btn-outline-gold btn-sm"
                      onClick={() => onViewReceipt(order)}
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                    >
                      <ClipboardCheck size={12} /> Comprovante
                    </button>
                  ) : (
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => onNavigate('orders')}
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                    >
                      Gerenciar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Flow & Fast Links */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <DollarSign size={18} /> Fluxo de Caixa Rápido
            </h3>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('financial')}
            >
              Ver Financeiro
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                  A Receber de Clientes
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--warning)', marginTop: '4px' }}>
                  {formatBRL(accountsReceivable)}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                  Despesas Operacionais
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--danger)', marginTop: '4px' }}>
                  {formatBRL(totalExpenses)}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Últimas Movimentações:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {financial.slice(0, 4).map(item => (
                <div 
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{item.description}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDateBR(item.date)} • {item.category}</div>
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '700', 
                    color: item.type === 'receita' ? 'var(--success)' : 'var(--danger)' 
                  }}>
                    {item.type === 'receita' ? '+' : '-'} {formatBRL(item.amount)}
                  </div>
                </div>
              ))}
            </div>

            {/* Public Link Share Callout */}
            <div style={{ 
              marginTop: '12px', 
              background: 'linear-gradient(135deg, rgba(229, 169, 60, 0.15) 0%, rgba(229, 169, 60, 0.04) 100%)', 
              padding: '14px 16px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gold-hover)' }}>
                  Envie o link para novos orçamentos
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  O cliente simula o valor e o pedido cai direto no seu sistema.
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={onOpenShareQuote}>
                Compartilhar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
