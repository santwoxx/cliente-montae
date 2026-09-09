import React, { useState } from 'react';
import { X, Copy, Check, Share2, Send, ExternalLink, Sparkles } from 'lucide-react';
import { formatWhatsAppLink } from '../services/calculations';

export default function QuoteShareModal({ onClose, onOpenClientView }) {
  const [copied, setCopied] = useState(false);
  const [clientPhone, setClientPhone] = useState('');
  const [clientName, setClientName] = useState('');

  const publicUrl = `${window.location.origin}${window.location.pathname}#orcamento`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const messageText = `Olá${clientName ? ` ${clientName}` : ''}! 👋\n\nPrecisa montar seus móveis com agilidade, capricho e garantia de 90 dias? 🛠️\n\nAcesse nosso link para simular e solicitar seu orçamento em 1 minuto:\n👉 ${publicUrl}\n\nAssim que você preencher, nossa equipe da *MontaÊ* recebe diretamente no sistema para aprovação e agendamento!`;

  const waLink = formatWhatsAppLink(clientPhone, messageText);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="stat-icon" style={{ background: 'var(--gold-gradient)', color: '#000' }}>
              <Share2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Gerador de Links de Orçamento</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                Envie para clientes pelo WhatsApp ou redes sociais
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Main Link Box */}
          <div style={{ marginBottom: '22px' }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Link Público do Cliente</span>
              {copied && <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓ Link copiado!</span>}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="form-control"
                style={{ background: '#0b0d11', color: 'var(--gold-hover)', fontWeight: '600' }}
              />
              <button className="btn btn-primary" onClick={handleCopy} style={{ flexShrink: 0 }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Direct Send Form */}
          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--success)', fontWeight: '700', fontSize: '13px' }}>
              <Send size={16} />
              Enviar Direto no WhatsApp do Cliente
            </div>

            <div className="form-row" style={{ marginBottom: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nome do Cliente (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  className="form-control"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">WhatsApp com DDD</label>
                <input
                  type="text"
                  placeholder="Ex: 48999998888"
                  className="form-control"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', background: 'var(--bg-primary)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <strong>Prévia da mensagem:</strong>
              <div style={{ whiteSpace: 'pre-line', marginTop: '4px', color: 'var(--text-secondary)' }}>
                {messageText}
              </div>
            </div>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-success"
              style={{ width: '100%' }}
            >
              <Send size={16} /> Abrir WhatsApp Web / Conversa
            </a>
          </div>

          {/* Test Link Button */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                onClose();
                onOpenClientView();
              }}
              style={{ color: 'var(--gold-hover)' }}
            >
              <ExternalLink size={14} /> Testar Visualização do Cliente Agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
