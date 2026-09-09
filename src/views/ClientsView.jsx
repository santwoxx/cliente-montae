import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  MapPin, 
  Mail, 
  Calendar, 
  MessageCircle, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  ClipboardList
} from 'lucide-react';
import { formatWhatsAppLink } from '../services/calculations';

export default function ClientsView({
  clients,
  orders,
  onSaveClient,
  onDeleteClient,
  onOpenNewOrderWithClient
}) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    neighborhood: '',
    city: 'Florianópolis / São José - SC',
    notes: ''
  });

  const openNewModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      neighborhood: '',
      city: 'Florianópolis / São José - SC',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cli) => {
    setEditingClient(cli);
    setFormData({
      name: cli.name || '',
      phone: cli.phone || '',
      email: cli.email || '',
      address: cli.address || '',
      neighborhood: cli.neighborhood || '',
      city: cli.city || '',
      notes: cli.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSaveClient({
      ...(editingClient ? { id: editingClient.id } : {}),
      ...formData
    });

    setIsModalOpen(false);
  };

  const filteredClients = clients.filter(c => {
    const term = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term)) ||
      (c.neighborhood && c.neighborhood.toLowerCase().includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term))
    );
  });

  return (
    <div className="clients-container">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', margin: 0 }}>
            Cadastro de Clientes (CRM)
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Base de clientes com integração ao WhatsApp, endereços para montagem e histórico de serviços.
          </p>
        </div>

        <button className="btn btn-primary" onClick={openNewModal}>
          <UserPlus size={16} /> Cadastrar Novo Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="form-control"
          placeholder="Buscar por nome do cliente, telefone, WhatsApp ou bairro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '40px' }}
        />
      </div>

      {/* Clients Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
        {filteredClients.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Nenhum cliente encontrado.
          </div>
        ) : (
          filteredClients.map(client => {
            const clientOrders = orders.filter(o => o.clientId === client.id || o.clientName === client.name);

            return (
              <div key={client.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#fff', margin: 0 }}>
                      {client.name}
                    </h3>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Cliente desde: {client.createdAt || 'Recente'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-icon btn-sm"
                      onClick={() => openEditModal(client)}
                      title="Editar cliente"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="btn btn-secondary btn-icon btn-sm"
                      onClick={() => {
                        if (confirm(`Excluir o cliente ${client.name}?`)) {
                          onDeleteClient(client.id);
                        }
                      }}
                      title="Excluir cliente"
                    >
                      <Trash2 size={14} color="var(--danger)" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} color="var(--gold-primary)" />
                    <strong style={{ color: 'var(--text-primary)' }}>{client.phone || 'Sem telefone'}</strong>
                  </div>

                  {client.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={14} color="var(--gold-primary)" />
                      <span>{client.email}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <MapPin size={14} color="var(--gold-primary)" style={{ marginTop: '3px', flexShrink: 0 }} />
                    <span>{client.address ? `${client.address}, ${client.neighborhood || ''} - ${client.city || ''}` : 'Endereço não cadastrado'}</span>
                  </div>

                  {client.notes && (
                    <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-muted)' }}>
                      Nota: {client.notes}
                    </div>
                  )}
                </div>

                {/* Footer: Orders count & WhatsApp CTA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    <strong>{clientOrders.length}</strong> serviço(s) realizado(s)
                  </span>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a
                      href={formatWhatsAppLink(client.phone, `Olá ${client.name}! Tudo bem? Aqui é o Marcos Elias da MontaÊ montagem de móveis.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-success btn-sm"
                      title="Abrir WhatsApp"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onOpenNewOrderWithClient(client)}
                      title="Criar nova montagem para este cliente"
                    >
                      <ClipboardList size={14} /> Nova OS
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add/Edit Client */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '18px' }}>
                {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Ex: Amanda Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Telefone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="Ex: 48991234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">E-mail</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Ex: cliente@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Endereço (Rua, Número, Apto)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Rua das Flores, 120, Apto 302"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Bairro</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: Kobrasol"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cidade / Estado</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: Florianópolis - SC"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Observações sobre o local ou montagem</label>
                  <textarea
                    className="form-control"
                    placeholder="Ex: Prédio sem elevador, cliente possui cachorro, parede de gesso..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
