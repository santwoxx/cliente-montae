// ============================================================
// MontaÊ - Cadastro e edição de ordem de serviço
//
// Antes só criava ordens novas e não validava nada além do nome.
// Agora também edita, valida os campos, sugere o preço a partir do
// catálogo e preenche o endereço ao escolher um cliente existente.
// ============================================================

import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Check, Calculator, ClipboardList } from 'lucide-react';
import Modal from './Modal';
import {
  FURNITURE_CATALOG,
  PAYMENT_METHODS,
  formatBRL,
  formatPhoneBR,
  isValidPhoneBR,
  todayISO
} from '../services/calculations';
import { useToast } from '../context/ToastContext';

const ITEM_TYPES = ['Novo na Caixa', 'Desmontar e Remontar', 'Apenas Regulagem/Reparo'];

const EMPTY_ITEM = { name: '', qty: 1, room: 'Quarto', type: 'Novo na Caixa' };

function buildAddress(client) {
  if (!client) return '';
  return [client.address, client.neighborhood, client.city].filter(Boolean).join(', ');
}

export default function OrderFormModal({
  order = null,
  clients,
  employees,
  initialClient = null,
  onSave,
  onClose
}) {
  const { toast } = useToast();
  const isEditing = Boolean(order?.id);

  const [form, setForm] = useState(() => {
    if (order) {
      return {
        clientId: order.clientId || '',
        clientName: order.clientName || '',
        clientPhone: order.clientPhone || '',
        address: order.address || '',
        employeeId: order.employeeId || employees[0]?.id || '',
        scheduledDate: order.scheduledDate || todayISO(),
        scheduledTime: order.scheduledTime || '09:00',
        totalValue: String(order.totalValue ?? ''),
        paymentMethod: order.paymentMethod || 'Pix',
        paymentStatus: order.paymentStatus || 'pendente',
        status: order.status || 'agendado',
        notes: order.notes || ''
      };
    }
    return {
      clientId: initialClient?.id || '',
      clientName: initialClient?.name || '',
      clientPhone: initialClient?.phone ? formatPhoneBR(initialClient.phone) : '',
      address: buildAddress(initialClient),
      employeeId: employees[0]?.id || '',
      scheduledDate: todayISO(),
      scheduledTime: '09:00',
      totalValue: '',
      paymentMethod: 'Pix',
      paymentStatus: 'pendente',
      status: 'agendado',
      notes: ''
    };
  });

  const [items, setItems] = useState(() =>
    order?.items?.length ? order.items.map((item) => ({ ...item })) : [{ ...EMPTY_ITEM }]
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSelectClient = (id) => {
    const client = clients.find((c) => c.id === id);
    setForm((current) => ({
      ...current,
      clientId: id,
      clientName: client ? client.name : current.clientName,
      clientPhone: client ? formatPhoneBR(client.phone) : current.clientPhone,
      address: client ? buildAddress(client) : current.address
    }));
  };

  const updateItem = (index, field, value) => {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  /** Soma os preços de tabela dos itens reconhecidos no catálogo. */
  const suggestedPrice = useMemo(() => {
    return items.reduce((sum, item) => {
      const term = item.name.trim().toLowerCase();
      if (!term) return sum;
      const match = FURNITURE_CATALOG.find(
        (entry) =>
          entry.name.toLowerCase().includes(term) || term.includes(entry.name.toLowerCase().slice(0, 12))
      );
      if (!match) return sum;
      const multiplier = item.type === 'Desmontar e Remontar' ? 1.45 : item.type === 'Apenas Regulagem/Reparo' ? 0.75 : 1;
      return sum + match.basePrice * multiplier * (Number(item.qty) || 1);
    }, 0);
  }, [items]);

  const validate = () => {
    const found = {};
    if (!form.clientName.trim()) found.clientName = 'Informe o nome do cliente.';
    if (form.clientPhone && !isValidPhoneBR(form.clientPhone)) {
      found.clientPhone = 'Telefone incompleto (DDD + número).';
    }
    if (!form.address.trim()) found.address = 'Informe o endereço da montagem.';
    const value = parseFloat(String(form.totalValue).replace(',', '.'));
    if (!Number.isFinite(value) || value < 0) found.totalValue = 'Informe um valor válido.';
    if (!items.some((item) => item.name.trim())) found.items = 'Adicione ao menos um móvel.';
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      toast.error('Revise os campos destacados.');
      return;
    }

    setSaving(true);
    try {
      const employee = employees.find((e) => e.id === form.employeeId);
      await onSave({
        ...(order || {}),
        ...form,
        clientPhone: form.clientPhone,
        totalValue: parseFloat(String(form.totalValue).replace(',', '.')) || 0,
        employeeName: employee?.name || '',
        items: items
          .filter((item) => item.name.trim())
          .map((item) => ({ ...item, qty: Number(item.qty) || 1 })),
        checklist: order?.checklist || {
          leveling: false,
          doorsAdjusted: false,
          drawersTested: false,
          wallSecured: false,
          areaCleaned: false
        }
      });
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível salvar a ordem. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEditing ? `Editar ordem ${order.id}` : 'Nova ordem de serviço'}
      subtitle={isEditing ? 'Altere os dados e salve' : 'Cadastro e agendamento da montagem'}
      icon={ClipboardList}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="order-form" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner" /> : <Check size={16} aria-hidden="true" />}
            {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Salvar e agendar'}
          </button>
        </>
      }
    >
      <form id="order-form" onSubmit={handleSubmit} noValidate>
        {clients.length > 0 && (
          <div className="field">
            <label className="label" htmlFor="of-client">
              Cliente cadastrado
            </label>
            <select
              id="of-client"
              className="select"
              value={form.clientId}
              onChange={(e) => handleSelectClient(e.target.value)}
            >
              <option value="">— Cliente avulso (preencher abaixo) —</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                  {client.neighborhood ? ` · ${client.neighborhood}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid-2">
          <div className="field">
            <label className="label" htmlFor="of-name">
              Nome do cliente <span className="req">*</span>
            </label>
            <input
              id="of-name"
              className={`input ${errors.clientName ? 'is-invalid' : ''}`}
              value={form.clientName}
              onChange={(e) => update('clientName', e.target.value)}
              placeholder="Ex.: Carlos Eduardo"
              autoComplete="name"
            />
            {errors.clientName && <span className="field-error">{errors.clientName}</span>}
          </div>

          <div className="field">
            <label className="label" htmlFor="of-phone">
              WhatsApp
            </label>
            <input
              id="of-phone"
              className={`input ${errors.clientPhone ? 'is-invalid' : ''}`}
              value={form.clientPhone}
              onChange={(e) => update('clientPhone', formatPhoneBR(e.target.value))}
              placeholder="(48) 99912-3456"
              inputMode="tel"
              autoComplete="tel"
            />
            {errors.clientPhone && <span className="field-error">{errors.clientPhone}</span>}
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="of-address">
            Endereço da montagem <span className="req">*</span>
          </label>
          <input
            id="of-address"
            className={`input ${errors.address ? 'is-invalid' : ''}`}
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="Rua, número, apto, bairro e cidade"
            autoComplete="street-address"
          />
          {errors.address && <span className="field-error">{errors.address}</span>}
        </div>

        {/* Itens */}
        <div className="panel mb-16">
          <div className="row-between mb-12">
            <span className="label mb-0">Móveis a montar ({items.length})</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setItems((current) => [...current, { ...EMPTY_ITEM }])}
            >
              <Plus size={13} aria-hidden="true" />
              Adicionar
            </button>
          </div>

          <div className="stack-sm">
            {items.map((item, index) => (
              <div key={index} className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                <input
                  className="input input-sm"
                  style={{ flex: 3, minWidth: 0 }}
                  value={item.name}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                  placeholder="Ex.: Guarda-roupa 6 portas"
                  aria-label={`Móvel ${index + 1}`}
                  list="catalog-options"
                />
                <input
                  className="input input-sm"
                  style={{ width: 56, textAlign: 'center', flexShrink: 0 }}
                  type="number"
                  min="1"
                  max="99"
                  value={item.qty}
                  onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value, 10) || 1)}
                  aria-label="Quantidade"
                />
                <select
                  className="select select-sm"
                  style={{ flex: 2, minWidth: 0 }}
                  value={item.type}
                  onChange={(e) => updateItem(index, 'type', e.target.value)}
                  aria-label="Tipo de serviço"
                >
                  {ITEM_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {items.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                    aria-label={`Remover móvel ${index + 1}`}
                  >
                    <Trash2 size={14} color="var(--bad)" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <datalist id="catalog-options">
            {FURNITURE_CATALOG.map((entry) => (
              <option key={entry.id} value={entry.name} />
            ))}
          </datalist>

          {errors.items && <span className="field-error mt-8">{errors.items}</span>}

          {suggestedPrice > 0 && (
            <button
              type="button"
              className="btn btn-outline btn-sm mt-12"
              onClick={() => update('totalValue', suggestedPrice.toFixed(2))}
            >
              <Calculator size={13} aria-hidden="true" />
              Usar preço sugerido: {formatBRL(suggestedPrice)}
            </button>
          )}
        </div>

        <div className="grid-3">
          <div className="field">
            <label className="label" htmlFor="of-date">
              Data
            </label>
            <input
              id="of-date"
              type="date"
              className="input"
              value={form.scheduledDate}
              onChange={(e) => update('scheduledDate', e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="of-time">
              Horário
            </label>
            <input
              id="of-time"
              type="time"
              className="input"
              value={form.scheduledTime}
              onChange={(e) => update('scheduledTime', e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="of-employee">
              Montador
            </label>
            <select
              id="of-employee"
              className="select"
              value={form.employeeId}
              onChange={(e) => update('employeeId', e.target.value)}
            >
              <option value="">Não atribuído</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid-3">
          <div className="field">
            <label className="label" htmlFor="of-value">
              Valor total (R$) <span className="req">*</span>
            </label>
            <input
              id="of-value"
              className={`input ${errors.totalValue ? 'is-invalid' : ''}`}
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={form.totalValue}
              onChange={(e) => update('totalValue', e.target.value)}
              placeholder="0,00"
            />
            {errors.totalValue && <span className="field-error">{errors.totalValue}</span>}
          </div>

          <div className="field">
            <label className="label" htmlFor="of-payment">
              Pagamento
            </label>
            <select
              id="of-payment"
              className="select"
              value={form.paymentMethod}
              onChange={(e) => update('paymentMethod', e.target.value)}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="of-status">
              Situação
            </label>
            <select
              id="of-status"
              className="select"
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
            >
              <option value="orcamento">Orçamento</option>
              <option value="agendado">Agendado</option>
              <option value="em_andamento">Em andamento</option>
              {isEditing && <option value="concluido">Concluído</option>}
              {isEditing && <option value="cancelado">Cancelado</option>}
            </select>
          </div>
        </div>

        <div className="field mb-0">
          <label className="label" htmlFor="of-notes">
            Observações internas
          </label>
          <textarea
            id="of-notes"
            className="textarea"
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Ex.: levar buchas de expansão, prédio sem elevador, cliente paga metade adiantado..."
          />
        </div>
      </form>
    </Modal>
  );
}
