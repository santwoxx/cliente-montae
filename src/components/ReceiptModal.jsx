// ============================================================
// MontaÊ - Comprovante de conclusão e termo de garantia
// Documento oficial entregue ao cliente, pronto para impressão/PDF.
// ============================================================

import React from 'react';
import { Printer, Award, Phone, MapPin, ShieldCheck, Share2, X, Star } from 'lucide-react';
import {
  formatBRL,
  formatDateBR,
  formatDateTimeBR,
  formatWhatsAppLink
} from '../services/calculations';
import { useToast } from '../context/ToastContext';

const CHECKLIST_LABELS = {
  leveling: 'Nivelamento e esquadro',
  doorsAdjusted: 'Portas reguladas e alinhadas',
  drawersTested: 'Gavetas e corrediças testadas',
  wallSecured: 'Fixação segura em parede',
  areaCleaned: 'Local limpo e embalagens recolhidas'
};

export default function ReceiptModal({ order, profile, onClose }) {
  const { toast } = useToast();
  if (!order) return null;

  const signatures = order.signatures || {};
  const checklist = order.checklist || {};
  const approved = Object.entries(CHECKLIST_LABELS).filter(([key]) => checklist[key]);
  const warrantyDays = profile?.warrantyDays || 90;

  const shareText =
    `*MontaÊ* - Comprovante de Montagem\n\n` +
    `Ordem: ${order.id}\n` +
    `Cliente: ${order.clientName}\n` +
    `Concluída em: ${formatDateTimeBR(order.completedAt || order.scheduledDate)}\n` +
    `Valor: ${formatBRL(order.totalValue)}\n` +
    `Montador: ${order.employeeName || profile?.name || 'MontaÊ'}\n\n` +
    `Garantia de ${warrantyDays} dias sobre o serviço de montagem. Obrigado pela confiança!`;

  const handleShare = async () => {
    // Web Share API no celular; no desktop cai para a área de transferência.
    if (navigator.share) {
      try {
        await navigator.share({ title: `Comprovante ${order.id}`, text: shareText });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Resumo copiado. É só colar no WhatsApp do cliente.');
    } catch {
      toast.error('Não foi possível copiar o resumo.');
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Comprovante">
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header no-print">
          <div className="row" style={{ minWidth: 0 }}>
            <div className="stat-icon t-brand" aria-hidden="true">
              <Award size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 className="modal-title">Comprovante & Garantia</h3>
              <p className="modal-subtitle">Ordem {order.id}</p>
            </div>
          </div>
          <div className="row">
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleShare}>
              <Share2 size={14} aria-hidden="true" />
              Enviar
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
              <Printer size={14} aria-hidden="true" />
              Imprimir
            </button>
            <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fechar">
              <X size={19} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: 0 }}>
          <div className="receipt">
            {/* Cabeçalho */}
            <header className="receipt-head">
              <div className="receipt-brand">
                <img
                  src="/logo.jpeg"
                  alt=""
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div>
                  <h1>
                    Monta<em>Ê</em>
                  </h1>
                  <div className="tag">{profile?.slogan || 'MONTA. REPARA. CONECTA.'}</div>
                  <div className="contact">
                    {profile?.email} · {profile?.phone}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="receipt-code">ORDEM {order.id}</div>
                <div className="fs-11 muted mt-8">
                  Concluída em <strong>{formatDateTimeBR(order.completedAt || order.scheduledDate)}</strong>
                </div>
              </div>
            </header>

            {/* Dados */}
            <section className="receipt-grid">
              <div>
                <div className="receipt-label">Dados do cliente</div>
                <div className="strong fs-15">{order.clientName}</div>
                <div className="meta fs-13 mt-8">
                  <Phone size={13} aria-hidden="true" />
                  <span>{order.clientPhone || 'Não informado'}</span>
                </div>
                <div className="meta fs-13 mt-8">
                  <MapPin size={13} aria-hidden="true" />
                  <span>{order.address}</span>
                </div>
              </div>

              <div>
                <div className="receipt-label">Dados do atendimento</div>
                <div className="fs-13">
                  <strong>Montador:</strong> {order.employeeName || profile?.name}
                </div>
                <div className="fs-13 mt-8">
                  <strong>Valor total:</strong> {formatBRL(order.totalValue)}
                </div>
                <div className="fs-13 mt-8">
                  <strong>Pagamento:</strong> {order.paymentMethod || 'Pix'} (
                  {order.paymentStatus === 'pago' ? 'pago' : 'pendente'})
                </div>
                {signatures.satisfactionRating > 0 && (
                  <div className="fs-13 mt-8 row" style={{ gap: 4 }}>
                    <strong>Avaliação:</strong>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        size={13}
                        fill={index < signatures.satisfactionRating ? '#eab308' : 'none'}
                        color={index < signatures.satisfactionRating ? '#eab308' : '#d3d7de'}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Itens */}
            <section>
              <h4 className="receipt-section-title">Móveis montados / itens do serviço</h4>
              <table className="receipt-table">
                <thead>
                  <tr>
                    <th>Item / Descrição</th>
                    <th style={{ width: 62, textAlign: 'center' }}>Qtd</th>
                    <th style={{ width: 130 }}>Ambiente</th>
                    <th style={{ width: 150 }}>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item, index) => (
                    <tr key={index}>
                      <td className="strong">{item.name}</td>
                      <td style={{ textAlign: 'center' }}>{item.qty || 1}</td>
                      <td className="muted">{item.room || 'Geral'}</td>
                      <td className="muted">{item.type || 'Novo na Caixa'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Checklist */}
            {approved.length > 0 && (
              <section className="receipt-check">
                <div className="receipt-check-title">
                  <ShieldCheck size={15} aria-hidden="true" />
                  Checklist de qualidade aprovado na vistoria
                </div>
                <div className="receipt-check-list">
                  {approved.map(([key, label]) => (
                    <span key={key}>✓ {label}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Garantia */}
            <section className="receipt-warranty">
              <h5>TERMO DE GARANTIA DO SERVIÇO ({warrantyDays} DIAS)</h5>
              <p>
                A <strong>MontaÊ</strong> assegura garantia de {warrantyDays} dias contra vícios de
                montagem (regulagem de dobradiças, gavetas e fixações estruturais), contada a partir
                da data de conclusão registrada neste documento. A garantia não cobre avarias
                decorrentes de mau uso, umidade, sobrecarga de peso ou movimentação incorreta dos
                móveis após a entrega do serviço.
              </p>
            </section>

            {/* Assinaturas */}
            <section>
              <div className="receipt-label" style={{ textAlign: 'center', marginBottom: 12 }}>
                Assinaturas digitais registradas na conclusão
              </div>

              <div className="receipt-signs">
                <div className="receipt-sign">
                  <div className="receipt-sign-canvas">
                    {signatures.assemblerSignature ? (
                      <img src={signatures.assemblerSignature} alt="Assinatura do montador" />
                    ) : (
                      <span className="receipt-sign-empty">[Assinado eletronicamente]</span>
                    )}
                  </div>
                  <div className="receipt-sign-meta">
                    <div className="receipt-sign-name">
                      {signatures.assemblerName || order.employeeName || profile?.name}
                    </div>
                    <div className="receipt-sign-role">Montador responsável · MontaÊ</div>
                    <div className="receipt-sign-stamp">
                      {signatures.assemblerSignedAt || formatDateBR(order.completedAt)}
                    </div>
                  </div>
                </div>

                <div className="receipt-sign">
                  <div className="receipt-sign-canvas">
                    {signatures.clientSignature ? (
                      <img src={signatures.clientSignature} alt="Assinatura do cliente" />
                    ) : (
                      <span className="receipt-sign-empty">[Assinado eletronicamente]</span>
                    )}
                  </div>
                  <div className="receipt-sign-meta">
                    <div className="receipt-sign-name">{signatures.clientName || order.clientName}</div>
                    <div className="receipt-sign-role">Cliente · vistoria e aceite do serviço</div>
                    <div className="receipt-sign-stamp">
                      {signatures.clientSignedAt || formatDateBR(order.completedAt)}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="modal-footer no-print">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
          <a
            className="btn btn-success"
            href={formatWhatsAppLink(order.clientPhone, shareText)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Enviar ao cliente
          </a>
        </div>
      </div>
    </div>
  );
}
