// ============================================================
// MontaÊ - Cadastro de clientes (CRM)
// ============================================================

import React, { useMemo, useState } from 'react';
import {
  UserPlus,
  Search,
  X,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Trash2,
  Pencil,
  ClipboardList,
  Users,
  Check,
  Download
} from 'lucide-react';
import Modal from '../components/Modal';
import {
  formatBRL,
  formatPhoneBR,
  formatWhatsAppLink,
  isValidEmail,
  isValidPhoneBR,
  mapsLink,
  todayISO,
  toCSV,
  downloadFile
} from '../services/calculations';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  address: '',
  neighborhood: '',
  city: 'Florianópolis - SC',
  notes: ''
};

export default function ClientsView({ onNewOrderForClient }) {
  const { isAdmin } = useAuth();
  const { clients, orders, saveClient, deleteClient } = useData();
  const { confirm, toast } = useToast();

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | {} (novo) | cliente
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  /** Histórico por cliente calculado uma vez, não dentro do laço de render. */
  const history = useMemo(() => {
    const map = new Map();
    for (const order of orders) {
      const key = order.clientId || order.clientName;
      if (!key) continue;
      const entry = map.get(key) || { count: 0, total: 0, last: '' };
      entry.count += 1;
      if (order.status === 'concluido') entry.total += Number(order.totalValue) || 0;
      if ((order.scheduledDate || '') > entry.last) entry.last = order.scheduledDate || '';
      map.set(key, entry);
    }
    return map;
  }, [orders]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? clients.filter((client) =>
          [client.name, client.phone, client.email, client.neighborhood, client.city, client.address]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(term))
        )
      : clients;
    return [...filtered].sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'));
  }, [clients, search]);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditing({});
  };

  const openEdit = (client) => {
    setForm({ ...EMPTY_FORM, ...client, phone: formatPhoneBR(client.phone) });
    setErrors({});
    setEditing(client);
  };

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const found = {};
    if (!form.name.trim()) found.name = 'Informe o nome do cliente.';
    if (!form.phone.trim()) found.phone = 'Informe o WhatsApp.';
    else if (!isValidPhoneBR(form.phone)) found.phone = 'Telefone incompleto (DDD + número).';
    if (form.email && !isValidEmail(form.email)) found.email = 'E-mail inválido.';

    setErrors(found);
    if (Object.keys(found).length) {
      toast.error('Revise os campos destacados.');
      return;
    }

    setSaving(true);
    try {
      await saveClient({
        ...(editing?.id ? { id: editing.id, createdAt: editing.createdAt } : { createdAt: todayISO() }),
        ...form
      });
      setEditing(null);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível salvar o cliente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (client) => {
    const ok = await confirm({
      title: `Excluir ${client.name}?`,
      message: 'O cliente sai do cadastro. As ordens de serviço já criadas continuam no histórico.',
      confirmLabel: 'Excluir'
    });
    if (ok) await deleteClient(client.id);
  };

  const handleExport = () => {
    if (!visible.length) {
      toast.warning('Não há clientes para exportar.');
      return;
    }
    const csv = toCSV(visible, [
      { label: 'Nome', value: (c) => c.name },
      { label: 'Telefone', value: (c) => c.phone },
      { label: 'E-mail', value: (c) => c.email },
      { label: 'Endereço', value: (c) => c.address },
      { label: 'Bairro', value: (c) => c.neighborhood },
      { label: 'Cidade', value: (c) => c.city },
      { label: 'Observações', value: (c) => c.notes },
      { label: 'Serviços', value: (c) => history.get(c.id || c.name)?.count || 0 }
    ]);
    downloadFile(`montae-clientes-${todayISO()}.csv`, csv, 'text/csv');
    toast.success(`${visible.length} clientes exportados.`);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-sub">
            Base de contatos com WhatsApp, endereço de montagem e histórico de serviços.
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            <Download size={15} aria-hidden="true" />
            Exportar
          </button>
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <UserPlus size={16} aria-hidden="true" />
            Novo cliente
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
            placeholder="Buscar por nome, telefone, bairro ou cidade..."
            aria-label="Buscar clientes"
          />
          {search && (
            <button type="button" className="search-clear" onClick={() => setSearch('')} aria-label="Limpar busca">
              <X size={15} />
            </button>
          )}
        </div>
        <span className="fs-12 muted">
          {visible.length} de {clients.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon" aria-hidden="true">
            <Users size={24} />
          </div>
          <h4>{search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</h4>
          <p>
            {search
              ? 'Tente outro termo de busca.'
              : 'Cadastre seus clientes para agilizar o preenchimento das ordens de serviço.'}
          </p>
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <UserPlus size={15} aria-hidden="true" />
            Cadastrar cliente
          </button>
        </div>
      ) : (
        <div className="grid-cards">
          {visible.map((client) => {
            const stats = history.get(client.id) || history.get(client.name) || { count: 0, total: 0 };

            return (
              <article key={client.id} className="card">
                <div className="card-body">
                  <div className="row-between mb-12" style={{ alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="fs-17 truncate">{client.name}</h3>
                      <div className="fs-11 muted">Cliente desde {client.createdAt || '—'}</div>
                    </div>
                    <div className="row" style={{ gap: 5, flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon btn-sm"
                        onClick={() => openEdit(client)}
                        aria-label={`Editar ${client.name}`}
                      >
                        <Pencil size={14} />
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon btn-sm"
                          onClick={() => handleDelete(client)}
                          aria-label={`Excluir ${client.name}`}
                        >
                          <Trash2 size={14} color="var(--bad)" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="stack-sm mb-16">
                    <span className="meta">
                      <Phone size={14} aria-hidden="true" />
                      <strong>{formatPhoneBR(client.phone) || 'Sem telefone'}</strong>
                    </span>

                    {client.email && (
                      <span className="meta">
                        <Mail size={14} aria-hidden="true" />
                        <span className="truncate">{client.email}</span>
                      </span>
                    )}

                    {client.address && (
                      <a
                        className="meta"
                        href={mapsLink(`${client.address}, ${client.neighborhood}, ${client.city}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--text-2)' }}
                      >
                        <MapPin size={14} aria-hidden="true" />
                        <span className="clamp-2">
                          {[client.address, client.neighborhood, client.city].filter(Boolean).join(', ')}
                        </span>
                      </a>
                    )}

                    {client.notes && <div className="panel fs-12 muted">{client.notes}</div>}
                  </div>
                </div>

                <div className="card-foot row-between">
                  <span className="fs-12 muted">
                    <strong>{stats.count}</strong> serviço(s)
                    {stats.total > 0 && ` · ${formatBRL(stats.total)}`}
                  </span>

                  <div className="row" style={{ gap: 6 }}>
                    <a
                      className="btn btn-success btn-sm"
                      href={formatWhatsAppLink(
                        client.phone,
                        `Olá ${client.name}! Tudo bem? Aqui é da MontaÊ, montagem de móveis.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle size={14} aria-hidden="true" />
                      WhatsApp
                    </a>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => onNewOrderForClient(client)}
                    >
                      <ClipboardList size={14} aria-hidden="true" />
                      Nova OS
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && (
        <Modal
          title={editing.id ? 'Editar cliente' : 'Novo cliente'}
          icon={UserPlus}
          size="sm"
          onClose={() => setEditing(null)}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button type="submit" form="client-form" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" /> : <Check size={16} aria-hidden="true" />}
                Salvar
              </button>
            </>
          }
        >
          <form id="client-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="label" htmlFor="cl-name">
                Nome completo <span className="req">*</span>
              </label>
              <input
                id="cl-name"
                className={`input ${errors.name ? 'is-invalid' : ''}`}
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Ex.: Amanda Silva"
                autoComplete="name"
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="grid-2">
              <div className="field">
                <label className="label" htmlFor="cl-phone">
                  WhatsApp <span className="req">*</span>
                </label>
                <input
                  id="cl-phone"
                  className={`input ${errors.phone ? 'is-invalid' : ''}`}
                  value={form.phone}
                  onChange={(e) => update('phone', formatPhoneBR(e.target.value))}
                  placeholder="(48) 99912-3456"
                  inputMode="tel"
                  autoComplete="tel"
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>

              <div className="field">
                <label className="label" htmlFor="cl-email">
                  E-mail
                </label>
                <input
                  id="cl-email"
                  type="email"
                  className={`input ${errors.email ? 'is-invalid' : ''}`}
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="cliente@email.com"
                  autoComplete="email"
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="cl-address">
                Endereço
              </label>
              <input
                id="cl-address"
                className="input"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Rua, número e complemento"
                autoComplete="street-address"
              />
            </div>

            <div className="grid-2">
              <div className="field">
                <label className="label" htmlFor="cl-neighborhood">
                  Bairro
                </label>
                <input
                  id="cl-neighborhood"
                  className="input"
                  value={form.neighborhood}
                  onChange={(e) => update('neighborhood', e.target.value)}
                  placeholder="Ex.: Kobrasol"
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="cl-city">
                  Cidade / UF
                </label>
                <input
                  id="cl-city"
                  className="input"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  placeholder="Ex.: São José - SC"
                />
              </div>
            </div>

            <div className="field mb-0">
              <label className="label" htmlFor="cl-notes">
                Observações sobre o local
              </label>
              <textarea
                id="cl-notes"
                className="textarea"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Ex.: prédio sem elevador, parede de drywall, cliente tem cachorro..."
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
