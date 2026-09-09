import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  CheckCircle, 
  Plus, 
  Minus, 
  Calendar, 
  MapPin, 
  Phone, 
  User, 
  ShieldCheck, 
  Send, 
  MessageSquare, 
  ArrowRight,
  RotateCcw,
  Check,
  Award
} from 'lucide-react';
import { FURNITURE_CATALOG, SERVICE_MODIFIERS, formatBRL, formatWhatsAppLink } from '../services/calculations';

export default function PublicQuoteView({ profile, onSaveOrder, onReturnToAdmin }) {
  // Client contact state
  const [clientData, setClientData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    neighborhood: '',
    city: 'Florianópolis / São José - SC',
    scheduledDate: '',
    preferredPeriod: 'Manhã (08h às 12h)',
    notes: ''
  });

  // Selected furniture items
  const [selectedItems, setSelectedItems] = useState([
    { catalogId: 'guarda-roupa-grande', qty: 1, serviceType: 'novo_caixa' }
  ]);

  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const categories = ['Todos', 'Quarto', 'Sala', 'Cozinha', 'Sala de Jantar', 'Escritório', 'Geral'];

  // Add / Modify item helpers
  const handleAddItem = (catalogItem) => {
    const existingIndex = selectedItems.findIndex(i => i.catalogId === catalogItem.id);
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex].qty += 1;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        { catalogId: catalogItem.id, qty: 1, serviceType: 'novo_caixa' }
      ]);
    }
  };

  const handleRemoveItem = (index) => {
    setSelectedItems(selectedItems.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index][field] = value;
    setSelectedItems(updated);
  };

  // Calculate estimated total
  const estimatedTotal = selectedItems.reduce((acc, cur) => {
    const catalogItem = FURNITURE_CATALOG.find(c => c.id === cur.catalogId);
    if (!catalogItem) return acc;
    const modifier = SERVICE_MODIFIERS[cur.serviceType]?.multiplier || 1.0;
    return acc + (catalogItem.basePrice * modifier * (cur.qty || 1));
  }, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientData.name.trim() || !clientData.phone.trim()) {
      alert('Por favor, informe seu nome e telefone/WhatsApp.');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Por favor, adicione ao menos um móvel para orçamento.');
      return;
    }

    const itemsFormatted = selectedItems.map(item => {
      const cat = FURNITURE_CATALOG.find(c => c.id === item.catalogId);
      const mod = SERVICE_MODIFIERS[item.serviceType];
      return {
        name: cat ? cat.name : 'Móvel personalizado',
        qty: item.qty,
        room: cat ? cat.category : 'Geral',
        type: mod ? mod.label : 'Novo na Caixa'
      };
    });

    const fullAddress = `${clientData.address || ''}${clientData.neighborhood ? `, ${clientData.neighborhood}` : ''} - ${clientData.city}`;

    const newOrder = {
      clientName: clientData.name,
      clientPhone: clientData.phone,
      address: fullAddress,
      items: itemsFormatted,
      scheduledDate: clientData.scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: clientData.preferredPeriod.includes('Manhã') ? '09:00' : '14:00',
      status: 'orcamento',
      source: 'link_orcamento',
      totalValue: estimatedTotal,
      paymentMethod: 'Pix',
      paymentStatus: 'pendente',
      notes: `${clientData.notes ? clientData.notes + ' | ' : ''}Turno preferido: ${clientData.preferredPeriod}`
    };

    const saved = onSaveOrder(newOrder);
    setSubmittedOrder(saved);

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.5 }
    });
  };

  const filteredCatalog = selectedCategory === 'Todos' 
    ? FURNITURE_CATALOG 
    : FURNITURE_CATALOG.filter(c => c.category === selectedCategory);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Return to Admin Button Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span>
          Visualização do Link Público do Cliente
        </div>

        {onReturnToAdmin && (
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={onReturnToAdmin}
          >
            ← Voltar ao Painel Administrativo
          </button>
        )}
      </div>

      {/* Brand Header Banner */}
      <div 
        className="card" 
        style={{ 
          textAlign: 'center', 
          padding: '32px 20px', 
          background: 'linear-gradient(180deg, #181d26 0%, #0f1115 100%)', 
          border: '1px solid var(--border-gold)',
          marginBottom: '24px'
        }}
      >
        <img 
          src="/logo.jpeg" 
          alt="MontaÊ Logo" 
          style={{ height: '70px', width: 'auto', borderRadius: '8px', margin: '0 auto 12px auto', display: 'block' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', margin: '0 0 4px 0' }}>
          Simulador & Solicitação de Orçamento
        </h1>
        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gold-hover)', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
          {profile?.slogan || 'MONTA. REPARA. CONECTA.'}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '550px', margin: '8px auto 0 auto' }}>
          Montagens profissionais de móveis com ferramentas adequadas, capricho no acabamento, pontualidade e <strong>garantia de 90 dias com assinatura digital</strong>.
        </p>
      </div>

      {/* Success Confirmation State */}
      {submittedOrder ? (
        <div className="card" style={{ border: '1px solid var(--success)', textAlign: 'center', padding: '36px 24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <CheckCircle size={36} />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
            Orçamento Enviado com Sucesso!
          </h2>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 20px auto' }}>
            Obrigado, <strong>{submittedOrder.clientName}</strong>! Seu pedido foi registrado sob o protocolo <strong style={{ color: 'var(--gold-hover)' }}>{submittedOrder.id}</strong> e nossa equipe técnica já recebeu a notificação no painel.
          </p>

          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', maxWidth: '480px', margin: '0 auto 24px auto', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Estimativa Inicial:</span>
              <strong style={{ color: 'var(--gold-hover)', fontSize: '16px' }}>{formatBRL(submittedOrder.totalValue)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Data Desejada:</span>
              <span style={{ color: '#fff', fontSize: '13px' }}>{submittedOrder.scheduledDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Contato da MontaÊ:</span>
              <span style={{ color: '#fff', fontSize: '13px' }}>{profile?.email || 'marcos.elias.sc@gmail.com'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px', margin: '0 auto' }}>
            <a
              href={formatWhatsAppLink(
                profile?.phone || '48991823401', 
                `Olá Marcos Elias (MontaÊ)! Acabei de solicitar o orçamento ${submittedOrder.id} no valor estimado de ${formatBRL(submittedOrder.totalValue)}. Meu nome é ${submittedOrder.clientName}. Podemos agendar?`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-success btn-lg"
            >
              <MessageSquare size={18} /> Confirmar Agora pelo WhatsApp
            </a>

            <button 
              className="btn btn-secondary"
              onClick={() => {
                setSubmittedOrder(null);
                setSelectedItems([]);
              }}
            >
              <RotateCcw size={15} /> Fazer Outro Orçamento
            </button>
          </div>
        </div>
      ) : (
        /* Form for client */
        <form onSubmit={handleSubmit}>
          {/* Step 1: Customer Contact Info */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h3 className="card-title">
                <User size={18} /> 1. Seus Dados de Contato e Local
              </h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Seu Nome Completo *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Ex: Mariana Costa"
                  value={clientData.name}
                  onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp com DDD *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Ex: 48999887766"
                  value={clientData.phone}
                  onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Endereço (Rua e Número)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Rua Felipe Schmidt, 250, Apto 401"
                  value={clientData.address}
                  onChange={(e) => setClientData({ ...clientData, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bairro</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Centro"
                  value={clientData.neighborhood}
                  onChange={(e) => setClientData({ ...clientData, neighborhood: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cidade</label>
                <input
                  type="text"
                  className="form-control"
                  value={clientData.city}
                  onChange={(e) => setClientData({ ...clientData, city: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Step 2: Furniture Selection */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h3 className="card-title">
                <Sparkles size={18} /> 2. Escolha os Móveis para Montagem
              </h3>
            </div>

            {/* Category tabs */}
            <div className="nav-tabs" style={{ marginBottom: '16px', overflowX: 'auto' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`nav-tab ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Catalog Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              {filteredCatalog.map(catItem => (
                <div 
                  key={catItem.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--gold-hover)', fontWeight: '700', textTransform: 'uppercase' }}>
                      {catItem.category}
                    </span>
                    <h4 style={{ fontSize: '13.5px', color: '#fff', margin: '2px 0 4px 0' }}>
                      {catItem.name}
                    </h4>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gold-hover)' }}>
                      a partir de {formatBRL(catItem.basePrice)}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleAddItem(catItem)}
                    style={{ width: '100%', borderColor: 'var(--border-gold)' }}
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                </div>
              ))}
            </div>

            {/* Selected Items List */}
            <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                Móveis Selecionados ({selectedItems.length}):
              </h4>

              {selectedItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Nenhum móvel selecionado acima ainda. Clique em "Adicionar" nos móveis desejados.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedItems.map((item, idx) => {
                    const catalogItem = FURNITURE_CATALOG.find(c => c.id === item.catalogId);
                    const modifier = SERVICE_MODIFIERS[item.serviceType]?.multiplier || 1.0;
                    const itemSubtotal = (catalogItem?.basePrice || 100) * modifier * item.qty;

                    return (
                      <div 
                        key={idx}
                        style={{
                          background: 'var(--bg-card)',
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                      >
                        <div style={{ flex: '1 1 240px' }}>
                          <div style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>
                            {catalogItem?.name || 'Móvel'}
                          </div>

                          <div style={{ marginTop: '6px' }}>
                            <select
                              className="form-control"
                              style={{ width: 'auto', padding: '4px 10px', fontSize: '12px' }}
                              value={item.serviceType}
                              onChange={(e) => handleUpdateItem(idx, 'serviceType', e.target.value)}
                            >
                              {Object.entries(SERVICE_MODIFIERS).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Qty & subtotal */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-icon btn-sm"
                              onClick={() => {
                                if (item.qty > 1) {
                                  handleUpdateItem(idx, 'qty', item.qty - 1);
                                } else {
                                  handleRemoveItem(idx);
                                }
                              }}
                            >
                              <Minus size={12} />
                            </button>
                            <span style={{ fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              className="btn btn-secondary btn-icon btn-sm"
                              onClick={() => handleUpdateItem(idx, 'qty', item.qty + 1)}
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <div style={{ minWidth: '80px', textAlign: 'right', fontWeight: '800', color: 'var(--gold-hover)', fontSize: '15px' }}>
                            {formatBRL(itemSubtotal)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total Estimated Box */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Valor Estimado Preliminar:</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>*Pode variar de acordo com complexidade e estado do móvel</div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--gold-hover)' }}>
                  {formatBRL(estimatedTotal)}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Date & Details */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h3 className="card-title">
                <Calendar size={18} /> 3. Data Desejada e Detalhes
              </h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Data Preferida de Atendimento</label>
                <input
                  type="date"
                  className="form-control"
                  value={clientData.scheduledDate}
                  onChange={(e) => setClientData({ ...clientData, scheduledDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Melhor Turno para Receber o Montador</label>
                <select
                  className="form-control"
                  value={clientData.preferredPeriod}
                  onChange={(e) => setClientData({ ...clientData, preferredPeriod: e.target.value })}
                >
                  <option value="Manhã (08h às 12h)">Manhã (08h às 12h)</option>
                  <option value="Tarde (13h às 18h)">Tarde (13h às 18h)</option>
                  <option value="Sábado de Manhã">Sábado de Manhã</option>
                  <option value="Qualquer Horário">Qualquer Horário</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Observações Adicionais (Links dos móveis, andar, elevador...)</label>
              <textarea
                className="form-control"
                placeholder="Ex: Móveis comprados na Mobly/MadeiraMadeira, moro no 3º andar, tenho animais de estimação..."
                value={clientData.notes}
                onChange={(e) => setClientData({ ...clientData, notes: e.target.value })}
              />
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', fontSize: '17px', fontWeight: '800' }}
          >
            <Send size={18} /> Enviar Orçamento para Marcos Elias (MontaÊ)
          </button>
        </form>
      )}
    </div>
  );
}
