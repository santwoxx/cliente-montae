import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Calendar, User, DollarSign } from 'lucide-react';
import { FURNITURE_CATALOG, formatBRL } from '../services/calculations';

export default function NewOrderModal({
  clients,
  employees,
  initialClient = null,
  onSave,
  onClose
}) {
  const [clientId, setClientId] = useState(initialClient ? initialClient.id : '');
  const [clientName, setClientName] = useState(initialClient ? initialClient.name : '');
  const [clientPhone, setClientPhone] = useState(initialClient ? initialClient.phone : '');
  const [address, setAddress] = useState(
    initialClient 
      ? `${initialClient.address || ''}${initialClient.neighborhood ? `, ${initialClient.neighborhood}` : ''} - ${initialClient.city || ''}`
      : ''
  );
  const [employeeId, setEmployeeId] = useState('emp-1'); // default Marcos Elias
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [totalValue, setTotalValue] = useState('250.00');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [status, setStatus] = useState('agendado');
  const [notes, setNotes] = useState('');

  // Items
  const [items, setItems] = useState([
    { name: 'Guarda-Roupa Casal 6 Portas', qty: 1, room: 'Quarto', type: 'Novo na Caixa' }
  ]);

  const handleSelectClient = (id) => {
    setClientId(id);
    const cli = clients.find(c => c.id === id);
    if (cli) {
      setClientName(cli.name);
      setClientPhone(cli.phone || '');
      setAddress(`${cli.address || ''}${cli.neighborhood ? `, ${cli.neighborhood}` : ''} - ${cli.city || ''}`);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { name: '', qty: 1, room: 'Quarto', type: 'Novo na Caixa' }
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }

    const emp = employees.find(e => e.id === employeeId);

    const orderData = {
      clientId: clientId || undefined,
      clientName,
      clientPhone,
      address,
      employeeId,
      employeeName: emp ? emp.name : 'Marcos Elias',
      items: items.filter(i => i.name.trim().length > 0),
      scheduledDate,
      scheduledTime,
      totalValue: parseFloat(totalValue) || 0,
      paymentMethod,
      paymentStatus: 'pendente',
      status,
      notes,
      checklist: {
        leveling: false,
        doorsAdjusted: false,
        drawersTested: false,
        wallSecured: false,
        areaCleaned: false
      }
    };

    onSave(orderData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '18px' }}>Nova Ordem de Serviço & Agendamento</h3>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Client Selection */}
            <div className="form-group">
              <label className="form-label">Selecionar Cliente Cadastrado (ou preencher abaixo)</label>
              <select
                className="form-control"
                value={clientId}
                onChange={(e) => handleSelectClient(e.target.value)}
              >
                <option value="">-- Novo / Cliente Avulso --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.neighborhood || c.city}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Ex: Carlos Eduardo"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone / WhatsApp</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: 4899123456"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Endereço Completo</label>
              <input
                type="text"
                className="form-control"
                placeholder="Rua, número, apto, bairro e cidade"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Service items */}
            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label className="form-label" style={{ margin: 0, fontWeight: '700' }}>
                  Móveis a Montar ({items.length})
                </label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddItem}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                >
                  <Plus size={12} /> Adicionar Item
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: Cama Queen Baú"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                      style={{ flex: 2 }}
                    />
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={item.qty}
                      onChange={(e) => handleUpdateItem(idx, 'qty', parseInt(e.target.value) || 1)}
                      style={{ width: '60px', textAlign: 'center' }}
                    />
                    <select
                      className="form-control"
                      value={item.type}
                      onChange={(e) => handleUpdateItem(idx, 'type', e.target.value)}
                      style={{ flex: 1.5 }}
                    >
                      <option value="Novo na Caixa">Novo na Caixa</option>
                      <option value="Desmontar e Remontar">Desmontar + Remontar</option>
                      <option value="Apenas Regulagem">Regulagem/Reparo</option>
                    </select>
                    {items.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon btn-sm"
                        onClick={() => handleRemoveItem(idx)}
                      >
                        <Trash2 size={13} color="var(--danger)" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Date, Time & Staff */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Data Agendada</label>
                <input
                  type="date"
                  className="form-control"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Horário Previsto</label>
                <input
                  type="time"
                  className="form-control"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Montador Responsável</label>
                <select
                  className="form-control"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Value & Payment */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Valor Total do Serviço (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="form-control"
                  value={totalValue}
                  onChange={(e) => setTotalValue(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Forma de Pagamento</label>
                <select
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status Inicial</label>
                <select
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="agendado">Agendado</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="orcamento">Orçamento Solicitado</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Observações Internas</label>
              <textarea
                className="form-control"
                placeholder="Ex: Levar parafusos adicionais, cliente preferiu pagar metade antes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} /> Salvar e Agendar Montagem
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
