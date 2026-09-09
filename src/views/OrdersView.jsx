import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  DollarSign, 
  CheckCircle, 
  Award, 
  Printer, 
  MessageSquare, 
  ChevronRight,
  Sparkles,
  Edit2,
  Trash2,
  Send
} from 'lucide-react';
import { formatBRL, formatDateBR, formatWhatsAppLink } from '../services/calculations';

export default function OrdersView({
  orders,
  clients,
  employees,
  onSaveOrder,
  onDeleteOrder,
  onViewReceipt,
  onOpenNewOrder,
  onSwitchToAssembler
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (order.address && order.address.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'todos') return true;
    return order.status === statusFilter;
  });

  const handleStatusChange = (order, newStatus) => {
    const updated = {
      ...order,
      status: newStatus
    };
    if (newStatus === 'concluido' && !updated.completedAt) {
      updated.completedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      updated.paymentStatus = 'pago';
    }
    onSaveOrder(updated);
  };

  const handleAssignEmployee = (order, employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    onSaveOrder({
      ...order,
      employeeId,
      employeeName: emp ? emp.name : 'Não atribuído'
    });
  };

  return (
    <div className="orders-container">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', margin: 0 }}>
            Ordens de Serviço & Montagens
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Acompanhe orçamentos, montagens agendadas, vistorias em campo e termos de garantia assinados.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={onOpenNewOrder}>
            <Plus size={16} /> Nova Ordem de Serviço
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por código (OS-101), cliente ou endereço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        {/* Status Buttons */}
        <div className="nav-tabs" style={{ overflowX: 'auto' }}>
          <button 
            className={`nav-tab ${statusFilter === 'todos' ? 'active' : ''}`}
            onClick={() => setStatusFilter('todos')}
          >
            Todos ({orders.length})
          </button>
          <button 
            className={`nav-tab ${statusFilter === 'orcamento' ? 'active' : ''}`}
            onClick={() => setStatusFilter('orcamento')}
          >
            Novos Orçamentos ({orders.filter(o => o.status === 'orcamento').length})
          </button>
          <button 
            className={`nav-tab ${statusFilter === 'agendado' ? 'active' : ''}`}
            onClick={() => setStatusFilter('agendado')}
          >
            Agendados ({orders.filter(o => o.status === 'agendado').length})
          </button>
          <button 
            className={`nav-tab ${statusFilter === 'em_andamento' ? 'active' : ''}`}
            onClick={() => setStatusFilter('em_andamento')}
          >
            Em Andamento ({orders.filter(o => o.status === 'em_andamento').length})
          </button>
          <button 
            className={`nav-tab ${statusFilter === 'concluido' ? 'active' : ''}`}
            onClick={() => setStatusFilter('concluido')}
          >
            Concluídos ({orders.filter(o => o.status === 'concluido').length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredOrders.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <Calendar size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>Nenhuma ordem encontrada</h4>
            <p style={{ fontSize: '13.5px' }}>Tente alterar os termos de busca ou filtros acima.</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isCompleted = order.status === 'concluido';
            const isQuote = order.status === 'orcamento';
            const isInProgress = order.status === 'em_andamento';

            return (
              <div 
                key={order.id}
                className="card"
                style={{
                  borderLeft: isCompleted 
                    ? '4px solid var(--success)' 
                    : isQuote 
                    ? '4px solid var(--warning)' 
                    : isInProgress 
                    ? '4px solid var(--info)' 
                    : '4px solid var(--purple)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  {/* Left Column: ID, Client, Items */}
                  <div style={{ flex: '1 1 320px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '17px', fontWeight: '800', color: '#fff' }}>
                        {order.id}
                      </span>

                      {isCompleted && <span className="badge badge-success">✓ Concluído</span>}
                      {isInProgress && <span className="badge badge-info">⏳ Em Andamento</span>}
                      {order.status === 'agendado' && <span className="badge badge-purple">📅 Agendado</span>}
                      {isQuote && (
                        <span className="badge badge-warning">
                          <Sparkles size={11} /> Orçamento Solicitado
                        </span>
                      )}

                      {order.source === 'link_orcamento' && (
                        <span className="badge badge-gold" style={{ fontSize: '10px' }}>
                          Via Link do Cliente
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                      {order.clientName}
                    </h3>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Phone size={14} color="var(--gold-primary)" />
                        {order.clientPhone || 'Sem telefone'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={14} color="var(--gold-primary)" />
                        {order.address}
                      </span>
                    </div>

                    {/* Items List */}
                    <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Móveis a Montar:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                        {(order.items || []).map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                            <span><strong>{it.qty || 1}x</strong> {it.name} ({it.room || 'Ambiente'})</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{it.type || 'Novo'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.notes && (
                      <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Observação: "{order.notes}"
                      </div>
                    )}
                  </div>

                  {/* Right Column: Scheduling, Assignee, Values & Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', gap: '14px', minWidth: '240px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--gold-hover)' }}>
                        {formatBRL(order.totalValue)}
                      </div>
                      <div style={{ fontSize: '12px', color: order.paymentStatus === 'pago' ? 'var(--success)' : 'var(--warning)', fontWeight: '600' }}>
                        {order.paymentStatus === 'pago' ? '✓ Pagamento Recebido' : '• Pagamento Pendente'} ({order.paymentMethod || 'Pix'})
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        📅 Agendamento: <strong>{formatDateBR(order.scheduledDate)}</strong> às <strong>{order.scheduledTime || '09:00'}</strong>
                      </div>
                    </div>

                    {/* Assembler Selection */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Montador:</span>
                      <select
                        className="form-control"
                        style={{ width: 'auto', padding: '4px 10px', fontSize: '12.5px' }}
                        value={order.employeeId || ''}
                        onChange={(e) => handleAssignEmployee(order, e.target.value)}
                      >
                        <option value="">Não atribuído</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
                      {/* WhatsApp Client Link */}
                      <a
                        href={formatWhatsAppLink(order.clientPhone, `Olá ${order.clientName}! Aqui é o Marcos Elias da MontaÊ referente à montagem (${order.id}).`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        title="Conversar no WhatsApp"
                      >
                        <MessageSquare size={14} color="#25D366" />
                        <span>WhatsApp</span>
                      </a>

                      {/* If Quote, button to Approve & Schedule */}
                      {isQuote && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStatusChange(order, 'agendado')}
                        >
                          <CheckCircle size={14} /> Aprovar Orçamento
                        </button>
                      )}

                      {/* If Scheduled, button to Start Assembly */}
                      {order.status === 'agendado' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleStatusChange(order, 'em_andamento')}
                          style={{ borderColor: 'var(--info)' }}
                        >
                          Iniciar Montagem
                        </button>
                      )}

                      {/* If in progress, button to Open in Assembler View for signatures */}
                      {isInProgress && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onSwitchToAssembler(order.id)}
                          title="Abrir no celular / painel do montador para assinar"
                        >
                          <Award size={14} /> Assinar & Concluir
                        </button>
                      )}

                      {/* If Completed, button to View Official Receipt & Warranty */}
                      {isCompleted && (
                        <button
                          className="btn btn-outline-gold btn-sm"
                          onClick={() => onViewReceipt(order)}
                          title="Visualizar comprovante com as 2 assinaturas digitais"
                        >
                          <Printer size={14} /> Comprovante & Garantia
                        </button>
                      )}

                      {/* Delete button */}
                      <button
                        className="btn btn-secondary btn-icon btn-sm"
                        onClick={() => {
                          if (confirm(`Excluir a ordem de serviço ${order.id}?`)) {
                            onDeleteOrder(order.id);
                          }
                        }}
                        title="Excluir OS"
                      >
                        <Trash2 size={13} color="var(--danger)" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
