// ============================================================
// MontaÊ - Gerador do link público de orçamento
// ============================================================

import React, { useMemo, useState } from 'react';
import { Copy, Check, Share2, Send, ExternalLink, QrCode } from 'lucide-react';
import Modal from './Modal';
import { formatPhoneBR, formatWhatsAppLink } from '../services/calculations';
import { useToast } from '../context/ToastContext';

export default function QuoteShareModal({ onClose, onOpenClientView }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [showQr, setShowQr] = useState(false);

  const publicUrl = `${window.location.origin}${window.location.pathname}#orcamento`;

  const message = useMemo(
    () =>
      `Olá${clientName ? ` ${clientName.trim()}` : ''}! 👋\n\n` +
      `Precisa montar seus móveis com agilidade, capricho e garantia? 🛠️\n\n` +
      `Monte seu orçamento em 1 minuto neste link:\n${publicUrl}\n\n` +
      `Assim que você enviar, a equipe da *MontaÊ* recebe direto no sistema e retorna com o agendamento!`,
    [clientName, publicUrl]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      toast.error('Seu navegador bloqueou a cópia. Selecione o link manualmente.');
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      handleCopy();
      return;
    }
    try {
      await navigator.share({ title: 'Orçamento MontaÊ', text: message, url: publicUrl });
    } catch (error) {
      if (error?.name !== 'AbortError') toast.error('Não foi possível compartilhar.');
    }
  };

  // QR gerado por serviço público gratuito, sem dependência no bundle.
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    publicUrl
  )}`;

  return (
    <Modal
      title="Link de orçamento"
      subtitle="Envie para o cliente e receba o pedido direto no sistema"
      icon={Share2}
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Fechar
        </button>
      }
    >
      <div className="field">
        <div className="row-between">
          <label className="label" htmlFor="qs-url">
            Link público
          </label>
          {copied && (
            <span className="badge badge-ok">
              <Check size={11} aria-hidden="true" /> Copiado
            </span>
          )}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <input
            id="qs-url"
            className="input"
            readOnly
            value={publicUrl}
            onFocus={(e) => e.target.select()}
            style={{ fontWeight: 600, color: 'var(--brand-strong)' }}
          />
          <button type="button" className="btn btn-primary" onClick={handleCopy} style={{ flexShrink: 0 }}>
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            <span className="only-desktop">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
        <span className="field-hint">
          O cliente monta o próprio orçamento e o pedido cai na aba Ordens como “Orçamento”.
        </span>
      </div>

      <div className="row-wrap mb-16">
        <button type="button" className="btn btn-secondary btn-sm" onClick={handleNativeShare}>
          <Share2 size={14} aria-hidden="true" />
          Compartilhar
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setShowQr((current) => !current)}
        >
          <QrCode size={14} aria-hidden="true" />
          {showQr ? 'Ocultar QR Code' : 'Gerar QR Code'}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            onClose();
            onOpenClientView();
          }}
        >
          <ExternalLink size={14} aria-hidden="true" />
          Ver como o cliente vê
        </button>
      </div>

      {showQr && (
        <div className="panel mb-16" style={{ textAlign: 'center' }}>
          <img
            src={qrUrl}
            alt="QR Code do link de orçamento"
            width="220"
            height="220"
            style={{ margin: '0 auto', borderRadius: 'var(--r-sm)' }}
          />
          <p className="fs-12 muted mt-8">
            Imprima e cole na van ou mostre na tela: o cliente aponta a câmera e abre o orçamento.
          </p>
        </div>
      )}

      <div className="panel">
        <div className="row mb-12" style={{ color: 'var(--ok)', fontWeight: 700, fontSize: 13 }}>
          <Send size={15} aria-hidden="true" />
          Enviar direto no WhatsApp
        </div>

        <div className="grid-2">
          <div className="field">
            <label className="label" htmlFor="qs-name">
              Nome do cliente
            </label>
            <input
              id="qs-name"
              className="input"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="qs-phone">
              WhatsApp com DDD
            </label>
            <input
              id="qs-phone"
              className="input"
              value={clientPhone}
              onChange={(e) => setClientPhone(formatPhoneBR(e.target.value))}
              placeholder="(48) 99912-3456"
              inputMode="tel"
            />
          </div>
        </div>

        <details className="mb-12">
          <summary className="fs-12 muted" style={{ cursor: 'pointer' }}>
            Prévia da mensagem
          </summary>
          <p className="fs-12 text-2 mt-8" style={{ whiteSpace: 'pre-line' }}>
            {message}
          </p>
        </details>

        <a
          className="btn btn-success btn-block"
          href={formatWhatsAppLink(clientPhone, message)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Send size={16} aria-hidden="true" />
          Abrir conversa no WhatsApp
        </a>
      </div>
    </Modal>
  );
}
