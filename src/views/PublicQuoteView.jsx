// ============================================================
// MontaÊ - Link público de orçamento
//
// Única tela aberta a quem não tem conta. O visitante monta o
// próprio orçamento e o pedido cai direto na aba Ordens.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  CheckCircle,
  Plus,
  Minus,
  Calendar,
  User,
  Send,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  ArrowLeft,
  Clock,
  Trash2
} from 'lucide-react';
import Logo from '../components/Logo';
import {
  FURNITURE_CATALOG,
  SERVICE_MODIFIERS,
  CATALOG_CATEGORIES,
  formatBRL,
  formatPhoneBR,
  formatWhatsAppLink,
  isValidPhoneBR,
  quoteItemSubtotal,
  quoteTotal,
  estimatedDuration,
  todayISO
} from '../services/calculations';
import { AuthService } from '../services/auth';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

const PERIODS = [
  'Manhã (08h às 12h)',
  'Tarde (13h às 18h)',
  'Sábado de manhã',
  'Qualquer horário'
];

export default function PublicQuoteView({ onBackToAdmin }) {
  const { profile, submitPublicQuote } = useData();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    neighborhood: '',
    city: 'Florianópolis - SC',
    scheduledDate: '',
    period: PERIODS[0],
    notes: ''
  });
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('Todos');
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  // Sessão anônima: sem ela as regras do Firestore recusam a gravação.
  useEffect(() => {
    AuthService.signInAsVisitor().catch((error) => {
      console.warn('[MontaÊ] Sessão de visitante indisponível:', error?.code);
    });
  }, []);

  const catalog = useMemo(
    () =>
      category === 'Todos'
        ? FURNITURE_CATALOG
        : FURNITURE_CATALOG.filter((entry) => entry.category === category),
    [category]
  );

  const total = useMemo(() => quoteTotal(items), [items]);
  const duration = useMemo(() => estimatedDuration(items), [items]);

  const addItem = (entry) => {
    setItems((current) => {
      const index = current.findIndex((item) => item.catalogId === entry.id);
      if (index >= 0) {
        return current.map((item, i) => (i === index ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...current, { catalogId: entry.id, qty: 1, serviceType: 'novo_caixa' }];
    });
    if (errors.items) setErrors((current) => ({ ...current, items: undefined }));
  };

  const updateItem = (index, field, value) => {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeItem = (index) => setItems((current) => current.filter((_, i) => i !== index));

  const handleSubmit = async (event) => {
    event.preventDefault();

    const found = {};
    if (!form.name.trim()) found.name = 'Informe seu nome.';
    if (!form.phone.trim()) found.phone = 'Informe seu WhatsApp.';
    else if (!isValidPhoneBR(form.phone)) found.phone = 'Telefone incompleto (DDD + número).';
    if (!items.length) found.items = 'Escolha ao menos um móvel.';

    setErrors(found);
    if (Object.keys(found).length) {
      toast.error('Confira os campos destacados.');
      return;
    }

    setSending(true);
    try {
      const formatted = items.map((item) => {
        const entry = FURNITURE_CATALOG.find((c) => c.id === item.catalogId);
        return {
          name: entry?.name || 'Móvel',
          qty: item.qty,
          room: entry?.category || 'Geral',
          type: SERVICE_MODIFIERS[item.serviceType]?.label || 'Novo na Caixa'
        };
      });

      const saved = await submitPublicQuote({
        clientName: form.name.trim(),
        clientPhone: form.phone,
        address: [form.address, form.neighborhood, form.city].filter(Boolean).join(', '),
        items: formatted,
        scheduledDate: form.scheduledDate || todayISO(),
        scheduledTime: form.period.includes('Manhã') || form.period.includes('manhã') ? '09:00' : '14:00',
        status: 'orcamento',
        source: 'link_orcamento',
        totalValue: total,
        paymentMethod: 'Pix',
        paymentStatus: 'pendente',
        notes: `${form.notes ? `${form.notes} | ` : ''}Turno preferido: ${form.period}`
      });

      setSubmitted(saved);
      confetti({ particleCount: 90, spread: 65, origin: { y: 0.5 } });
    } catch (error) {
      console.error(error);
      toast.error('Não conseguimos enviar seu orçamento. Verifique a internet e tente de novo.');
    } finally {
      setSending(false);
    }
  };

  const restart = () => {
    setSubmitted(null);
    setItems([]);
    setForm((current) => ({ ...current, notes: '', scheduledDate: '' }));
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {onBackToAdmin && (
        <div className="row-between mb-16">
          <span className="fs-12 muted row" style={{ gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--ok)',
                display: 'inline-block'
              }}
            />
            Prévia do link público
          </span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onBackToAdmin}>
            <ArrowLeft size={14} aria-hidden="true" />
            Voltar ao painel
          </button>
        </div>
      )}

      <header className="quote-hero">
        <Logo size={68} alt="MontaÊ" />
        <h1>Monte seu orçamento</h1>
        <div className="tag">{profile?.slogan || 'MONTA. REPARA. CONECTA.'}</div>
        <p>
          Montagem profissional de móveis com ferramenta certa, acabamento caprichado, pontualidade e{' '}
          <strong>garantia de {profile?.warrantyDays || 90} dias</strong> com assinatura digital.
        </p>
      </header>

      {submitted ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '36px 24px' }}>
            <div className="confirm-icon" style={{ background: 'var(--ok-bg)', color: 'var(--ok)' }}>
              <CheckCircle size={26} aria-hidden="true" />
            </div>

            <h2 className="fs-17" style={{ fontSize: 23 }}>
              Orçamento enviado!
            </h2>

            <p className="text-2 mt-8" style={{ maxWidth: '46ch', margin: '8px auto 20px' }}>
              Obrigado, <strong>{submitted.clientName}</strong>! Seu pedido foi registrado sob o
              protocolo <strong style={{ color: 'var(--brand-strong)' }}>{submitted.id}</strong> e
              nossa equipe já foi notificada.
            </p>

            <div className="panel mb-20" style={{ maxWidth: 420, margin: '0 auto 20px', textAlign: 'left' }}>
              <div className="row-between fs-13 mb-8">
                <span className="muted">Estimativa inicial</span>
                <strong className="money">{formatBRL(submitted.totalValue)}</strong>
              </div>
              <div className="row-between fs-13 mb-8">
                <span className="muted">Data desejada</span>
                <span>{submitted.scheduledDate.split('-').reverse().join('/')}</span>
              </div>
              <div className="row-between fs-13">
                <span className="muted">Contato MontaÊ</span>
                <span>{profile?.phone}</span>
              </div>
            </div>

            <div className="stack-sm" style={{ maxWidth: 420, margin: '0 auto' }}>
              <a
                className="btn btn-success btn-lg"
                href={formatWhatsAppLink(
                  profile?.phone,
                  `Olá! Acabei de enviar o orçamento ${submitted.id} (${formatBRL(
                    submitted.totalValue
                  )}). Meu nome é ${submitted.clientName}. Podemos agendar?`
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquare size={18} aria-hidden="true" />
                Confirmar pelo WhatsApp
              </a>
              <button type="button" className="btn btn-secondary" onClick={restart}>
                <RotateCcw size={15} aria-hidden="true" />
                Fazer outro orçamento
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {/* 1. Contato */}
          <section className="card mb-20">
            <div className="card-head">
              <h2 className="card-title">
                <User size={17} aria-hidden="true" />
                1. Seus dados
              </h2>
            </div>
            <div className="card-body">
              <div className="grid-2">
                <div className="field">
                  <label className="label" htmlFor="pq-name">
                    Nome completo <span className="req">*</span>
                  </label>
                  <input
                    id="pq-name"
                    className={`input ${errors.name ? 'is-invalid' : ''}`}
                    value={form.name}
                    onChange={(e) => {
                      setForm((c) => ({ ...c, name: e.target.value }));
                      setErrors((c) => ({ ...c, name: undefined }));
                    }}
                    placeholder="Ex.: Mariana Costa"
                    autoComplete="name"
                  />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </div>

                <div className="field">
                  <label className="label" htmlFor="pq-phone">
                    WhatsApp com DDD <span className="req">*</span>
                  </label>
                  <input
                    id="pq-phone"
                    className={`input ${errors.phone ? 'is-invalid' : ''}`}
                    value={form.phone}
                    onChange={(e) => {
                      setForm((c) => ({ ...c, phone: formatPhoneBR(e.target.value) }));
                      setErrors((c) => ({ ...c, phone: undefined }));
                    }}
                    placeholder="(48) 99912-3456"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>
              </div>

              <div className="grid-3">
                <div className="field">
                  <label className="label" htmlFor="pq-address">
                    Endereço
                  </label>
                  <input
                    id="pq-address"
                    className="input"
                    value={form.address}
                    onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))}
                    placeholder="Rua, número, apto"
                    autoComplete="street-address"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="pq-neighborhood">
                    Bairro
                  </label>
                  <input
                    id="pq-neighborhood"
                    className="input"
                    value={form.neighborhood}
                    onChange={(e) => setForm((c) => ({ ...c, neighborhood: e.target.value }))}
                    placeholder="Ex.: Centro"
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="pq-city">
                    Cidade
                  </label>
                  <input
                    id="pq-city"
                    className="input"
                    value={form.city}
                    onChange={(e) => setForm((c) => ({ ...c, city: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 2. Móveis */}
          <section className="card mb-20">
            <div className="card-head">
              <h2 className="card-title">
                <Sparkles size={17} aria-hidden="true" />
                2. Escolha os móveis
              </h2>
            </div>

            <div className="card-body">
              <div className="segmented mb-16">
                {CATALOG_CATEGORIES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`segment ${category === item ? 'is-active' : ''}`}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="catalog mb-20">
                {catalog.map((entry) => (
                  <div key={entry.id} className="catalog-item">
                    <span className="catalog-cat">{entry.category}</span>
                    <span className="catalog-name">{entry.name}</span>
                    <span className="catalog-price">
                      {formatBRL(entry.basePrice)}
                      <small>a partir de</small>
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm btn-block"
                      onClick={() => addItem(entry)}
                    >
                      <Plus size={14} aria-hidden="true" />
                      Adicionar
                    </button>
                  </div>
                ))}
              </div>

              {/* Carrinho */}
              <div className="panel">
                <div className="row-between mb-12">
                  <span className="stat-label">Selecionados ({items.length})</span>
                  {duration && (
                    <span className="badge badge-mute">
                      <Clock size={11} aria-hidden="true" />
                      {duration} estimadas
                    </span>
                  )}
                </div>

                {items.length === 0 ? (
                  <p className="fs-13 muted" style={{ textAlign: 'center', padding: '18px 0' }}>
                    Nenhum móvel escolhido. Toque em “Adicionar” nos itens acima.
                  </p>
                ) : (
                  <div className="stack-sm">
                    {items.map((item, index) => {
                      const entry = FURNITURE_CATALOG.find((c) => c.id === item.catalogId);
                      return (
                        <div key={`${item.catalogId}-${index}`} className="cart-row">
                          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                            <div className="strong fs-13 mb-8">{entry?.name}</div>
                            <select
                              className="select select-sm"
                              value={item.serviceType}
                              onChange={(e) => updateItem(index, 'serviceType', e.target.value)}
                              aria-label="Tipo de serviço"
                            >
                              {Object.entries(SERVICE_MODIFIERS).map(([key, value]) => (
                                <option key={key} value={key}>
                                  {value.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="row" style={{ gap: 12 }}>
                            <div className="qty">
                              <button
                                type="button"
                                onClick={() =>
                                  item.qty > 1 ? updateItem(index, 'qty', item.qty - 1) : removeItem(index)
                                }
                                aria-label="Diminuir quantidade"
                              >
                                {item.qty > 1 ? <Minus size={14} /> : <Trash2 size={13} />}
                              </button>
                              <span>{item.qty}</span>
                              <button
                                type="button"
                                onClick={() => updateItem(index, 'qty', item.qty + 1)}
                                aria-label="Aumentar quantidade"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <span className="money" style={{ minWidth: 82, textAlign: 'right' }}>
                              {formatBRL(quoteItemSubtotal(item))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {errors.items && <span className="field-error mt-12">{errors.items}</span>}

                <div className="quote-total">
                  <div>
                    <div className="fs-12 muted">Valor estimado</div>
                    <div className="fs-11 muted">
                      Pode variar conforme a complexidade e o estado do móvel
                    </div>
                  </div>
                  <div className="quote-total-value">{formatBRL(total)}</div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Agendamento */}
          <section className="card mb-20">
            <div className="card-head">
              <h2 className="card-title">
                <Calendar size={17} aria-hidden="true" />
                3. Quando prefere?
              </h2>
            </div>
            <div className="card-body">
              <div className="grid-2">
                <div className="field">
                  <label className="label" htmlFor="pq-date">
                    Data preferida
                  </label>
                  <input
                    id="pq-date"
                    type="date"
                    className="input"
                    min={todayISO()}
                    value={form.scheduledDate}
                    onChange={(e) => setForm((c) => ({ ...c, scheduledDate: e.target.value }))}
                  />
                </div>

                <div className="field">
                  <label className="label" htmlFor="pq-period">
                    Melhor turno
                  </label>
                  <select
                    id="pq-period"
                    className="select"
                    value={form.period}
                    onChange={(e) => setForm((c) => ({ ...c, period: e.target.value }))}
                  >
                    {PERIODS.map((period) => (
                      <option key={period} value={period}>
                        {period}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field mb-0">
                <label className="label" htmlFor="pq-notes">
                  Observações
                </label>
                <textarea
                  id="pq-notes"
                  className="textarea"
                  value={form.notes}
                  onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
                  placeholder="Ex.: móveis da Mobly, moro no 3º andar sem elevador, tenho animais..."
                />
              </div>
            </div>
          </section>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={sending}>
            {sending ? <span className="spinner" /> : <Send size={18} aria-hidden="true" />}
            {sending ? 'Enviando...' : 'Enviar meu orçamento'}
          </button>

          <p className="fs-12 muted mt-16" style={{ textAlign: 'center' }}>
            <ShieldCheck size={13} style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true" />{' '}
            Seus dados são usados apenas para o atendimento da MontaÊ.
          </p>
        </form>
      )}
    </div>
  );
}
