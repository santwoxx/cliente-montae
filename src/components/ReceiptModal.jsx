import React from 'react';
import { X, Printer, CheckCircle, ShieldCheck, Calendar, MapPin, Phone, User, Award } from 'lucide-react';
import { formatBRL, formatDateBR } from '../services/calculations';

export default function ReceiptModal({ order, profile, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const signatures = order.signatures || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '750px', background: '#ffffff', color: '#1e293b' }}
      >
        {/* Modal Controls - Hidden during print */}
        <div className="modal-header no-print" style={{ background: '#0f1115', color: '#fff', borderBottom: '1px solid #282e3c' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} color="var(--gold-primary)" />
            <h3 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>Comprovante de Conclusão & Termo de Garantia</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={15} /> Imprimir / Salvar PDF
            </button>
            <button className="btn btn-secondary btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="receipt-sheet" style={{ padding: '32px 36px', fontFamily: 'var(--font-body)' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img 
                src="/logo.jpeg" 
                alt="MontaÊ Logo" 
                style={{ height: '60px', width: 'auto', borderRadius: '6px' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
                  Monta<span style={{ color: '#d49228' }}>Ê</span>
                </h1>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#b87b1e', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
                  MONTA. REPARA. CONECTA.
                </p>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  E-mail: {profile?.email || 'marcos.elias.sc@gmail.com'} | WhatsApp: {profile?.phone || '(48) 99182-3401'}
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '4px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                ORDEM DE SERVIÇO: {order.id}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Concluído em: <strong>{order.completedAt || formatDateBR(order.scheduledDate)}</strong>
              </div>
            </div>
          </div>

          {/* Client & Service Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#f8fafc', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Dados do Cliente
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{order.clientName}</div>
              <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <Phone size={13} /> {order.clientPhone || 'Não informado'}
              </div>
              <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '4px' }}>
                <MapPin size={13} style={{ marginTop: '2px', flexShrink: 0 }} /> {order.address}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Dados do Atendimento
              </div>
              <div style={{ fontSize: '14px', color: '#334155' }}>
                <strong>Montador Técnico:</strong> {order.employeeName || 'Marcos Elias'}
              </div>
              <div style={{ fontSize: '14px', color: '#334155', marginTop: '4px' }}>
                <strong>Valor Total:</strong> {formatBRL(order.totalValue)}
              </div>
              <div style={{ fontSize: '14px', color: '#334155', marginTop: '4px' }}>
                <strong>Forma de Pagamento:</strong> {order.paymentMethod || 'Pix'} ({order.paymentStatus === 'pago' ? 'Pago' : 'Pendente'})
              </div>
            </div>
          </div>

          {/* Items Assembled */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '10px' }}>
              Móveis Montados / Itens do Serviço
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1' }}>Item / Descrição</th>
                  <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1', width: '80px', textAlign: 'center' }}>Qtd</th>
                  <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1', width: '130px' }}>Ambiente</th>
                  <th style={{ padding: '8px 10px', border: '1px solid #cbd5e1', width: '130px' }}>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', fontWeight: '600', color: '#1e293b' }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      {item.qty || 1}
                    </td>
                    <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                      {item.room || 'Geral'}
                    </td>
                    <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                      {item.type || 'Novo na Caixa'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quality Checklist Summary */}
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px 16px', borderRadius: '6px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065f46', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>
              <ShieldCheck size={16} /> Inspeção e Checklist de Qualidade Aprovados:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12px', color: '#047857' }}>
              <span>✓ Nivelamento e esquadro</span>
              <span>✓ Portas reguladas e alinhadas</span>
              <span>✓ Gavetas e corrediças testadas</span>
              <span>✓ Fixação segura em parede</span>
              <span>✓ Local limpo e embalagens recolhidas</span>
            </div>
          </div>

          {/* Warranty Terms */}
          <div style={{ border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '6px', marginBottom: '28px', background: '#fafafa' }}>
            <h5 style={{ fontSize: '12px', fontWeight: '700', color: '#334155', margin: '0 0 4px 0' }}>
              TERMO DE GARANTIA DO SERVIÇO ({profile?.warrantyDays || 90} DIAS)
            </h5>
            <p style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4', margin: 0 }}>
              A <strong>MontaÊ</strong> assegura garantia de {profile?.warrantyDays || 90} dias contra vícios de montagem (regulagem de dobradiças, gavetas e fixações estruturais). Esta garantia não cobre avarias decorrentes de mau uso, umidade, sobrecarga de peso excessivo ou movimentação incorreta dos móveis após a conclusão.
            </p>
          </div>

          {/* Dual Digital Signatures Section */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '14px', textAlign: 'center' }}>
              Assinaturas Digitais Válidas Registradas na Conclusão
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Assembler Signature */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '14px', textAlign: 'center', background: '#fff' }}>
                <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  {signatures.assemblerSignature ? (
                    <img 
                      src={signatures.assemblerSignature} 
                      alt="Assinatura Montador" 
                      style={{ maxHeight: '80px', maxWidth: '90%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                      [Assinado eletronicamente pelo montador]
                    </span>
                  )}
                </div>
                <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                    {signatures.assemblerName || order.employeeName || 'Marcos Elias'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Montador Responsável • MontaÊ
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Carimbo: {signatures.assemblerSignedAt || order.completedAt || 'Data de entrega'}
                  </div>
                </div>
              </div>

              {/* Client Signature */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '14px', textAlign: 'center', background: '#fff' }}>
                <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  {signatures.clientSignature ? (
                    <img 
                      src={signatures.clientSignature} 
                      alt="Assinatura Cliente" 
                      style={{ maxHeight: '80px', maxWidth: '90%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                      [Assinado eletronicamente pelo cliente]
                    </span>
                  )}
                </div>
                <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '6px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                    {signatures.clientName || order.clientName}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Cliente • Vistoria & Aceite do Serviço
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Carimbo: {signatures.clientSignedAt || order.completedAt || 'Data de entrega'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions for screen */}
        <div className="modal-footer no-print" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Imprimir Comprovante
          </button>
        </div>
      </div>
    </div>
  );
}
