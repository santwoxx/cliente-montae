import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Smartphone, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  PenTool, 
  Navigation, 
  MessageSquare, 
  Star, 
  Award, 
  AlertCircle,
  Check,
  Printer
} from 'lucide-react';
import SignaturePad from '../components/SignaturePad';
import { formatBRL, formatDateBR, formatWhatsAppLink } from '../services/calculations';

export default function AssemblerView({
  orders,
  employees,
  currentEmployeeId,
  setCurrentEmployeeId,
  onSaveOrder,
  onViewReceipt,
  selectedOrderId
}) {
  const [activeOrderId, setActiveOrderId] = useState(selectedOrderId || null);
  const [assemblerSig, setAssemblerSig] = useState(null);
  const [clientSig, setClientSig] = useState(null);
  const [clientRating, setClientRating] = useState(5);
  const [checklist, setChecklist] = useState({
    leveling: true,
    doorsAdjusted: true,
    drawersTested: true,
    wallSecured: true,
    areaCleaned: true
  });
  const [isFinishing, setIsFinishing] = useState(false);

  const currentEmployee = employees.find(e => e.id === currentEmployeeId) || employees[0] || {
    id: 'emp-1',
    name: 'Marcos Elias'
  };

  // Orders for this employee (or all active if Marcos Elias master)
  const myOrders = orders.filter(o => 
    (o.employeeId === currentEmployee.id || (!o.employeeId && currentEmployee.id === 'emp-1')) &&
    o.status !== 'cancelado'
  );

  const activeOrder = activeOrderId ? orders.find(o => o.id === activeOrderId) : null;

  const handleStartWork = (order) => {
    const updated = {
      ...order,
      status: 'em_andamento',
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name
    };
    onSaveOrder(updated);
    setActiveOrderId(order.id);
  };

  const handleOpenOrder = (order) => {
    setActiveOrderId(order.id);
    if (order.checklist) {
      setChecklist(order.checklist);
    }
    if (order.signatures) {
      setAssemblerSig(order.signatures.assemblerSignature || null);
      setClientSig(order.signatures.clientSignature || null);
      setClientRating(order.signatures.satisfactionRating || 5);
    } else {
      setAssemblerSig(null);
      setClientSig(null);
    }
  };

  const handleToggleChecklist = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFinishAssembly = (order) => {
    if (!assemblerSig) {
      alert('Por favor, o montador deve assinar no primeiro quadro de assinatura.');
      return;
    }
    if (!clientSig) {
      alert('Por favor, o cliente deve conferir e assinar no segundo quadro de assinatura.');
      return;
    }

    setIsFinishing(true);

    const now = new Date();
    const timestampStr = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    const updated = {
      ...order,
      status: 'concluido',
      completedAt: timestampStr,
      paymentStatus: 'pago',
      checklist: checklist,
      signatures: {
        assemblerName: currentEmployee.name,
        assemblerSignature: assemblerSig,
        assemblerSignedAt: timestampStr,
        clientName: order.clientName,
        clientSignature: clientSig,
        clientSignedAt: timestampStr,
        satisfactionRating: clientRating
      }
    };

    onSaveOrder(updated);

    // Confetti celebration!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      setIsFinishing(false);
      onViewReceipt(updated);
    }, 800);
  };

  return (
    <div className="assembler-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header with Employee Switcher */}
      <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #181d26 0%, #13171f 100%)', border: '1px solid var(--border-gold)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={20} color="var(--gold-primary)" />
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>
                Painel do Montador em Campo
              </h2>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Atendimento, checklist de qualidade e assinatura digital dupla na conclusão.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Montador:</span>
            <select
              className="form-control"
              style={{ width: 'auto', padding: '6px 12px', fontWeight: '700', color: 'var(--gold-hover)', background: '#0b0d11' }}
              value={currentEmployee.id}
              onChange={(e) => setCurrentEmployeeId(e.target.value)}
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* If an active order is selected for assembly completion */}
      {activeOrder ? (
        <div className="card" style={{ border: '1px solid var(--border-gold)', position: 'relative' }}>
          {/* Back button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveOrderId(null)}
            >
              ← Voltar à Lista de Montagens
            </button>

            <span className="badge badge-gold" style={{ fontSize: '13px' }}>
              {activeOrder.id}
            </span>
          </div>

          {/* Client summary */}
          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
              {activeOrder.clientName}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} color="var(--gold-primary)" />
                <span>{activeOrder.address}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={15} color="var(--gold-primary)" />
                <span>{activeOrder.clientPhone}</span>
              </div>
            </div>

            {/* GPS and WhatsApp quick links */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeOrder.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
              >
                <Navigation size={14} color="var(--info)" /> Abrir no GPS / Waze
              </a>
              <a
                href={formatWhatsAppLink(activeOrder.clientPhone, `Olá ${activeOrder.clientName}! Estou a caminho / no local para a montagem dos seus móveis (MontaÊ).`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success btn-sm"
                style={{ flex: 1 }}
              >
                <MessageSquare size={14} /> Chamar no WhatsApp
              </a>
            </div>
          </div>

          {/* Furniture items */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Móveis da Ordem:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(activeOrder.items || []).map((it, idx) => (
                <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                  <span><strong>{it.qty || 1}x</strong> {it.name}</span>
                  <span style={{ color: 'var(--gold-hover)' }}>{it.room || 'Ambiente'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Quality Checklist */}
          <div style={{ background: 'var(--bg-surface)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <ShieldCheck size={18} color="var(--success)" />
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>
                Checklist de Qualidade Pré-Entrega
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={checklist.leveling} 
                  onChange={() => handleToggleChecklist('leveling')} 
                  style={{ width: '18px', height: '18px', accentColor: 'var(--gold-primary)' }}
                />
                <span>Móvel nivelado no chão e no prumo</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={checklist.doorsAdjusted} 
                  onChange={() => handleToggleChecklist('doorsAdjusted')} 
                  style={{ width: '18px', height: '18px', accentColor: 'var(--gold-primary)' }}
                />
                <span>Portas alinhadas com dobradiças reguladas</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={checklist.drawersTested} 
                  onChange={() => handleToggleChecklist('drawersTested')} 
                  style={{ width: '18px', height: '18px', accentColor: 'var(--gold-primary)' }}
                />
                <span>Gavetas deslizando suavemente e puxadores firmes</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={checklist.wallSecured} 
                  onChange={() => handleToggleChecklist('wallSecured')} 
                  style={{ width: '18px', height: '18px', accentColor: 'var(--gold-primary)' }}
                />
                <span>Fixação em parede segura (bucha/parafuso adequados)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={checklist.areaCleaned} 
                  onChange={() => handleToggleChecklist('areaCleaned')} 
                  style={{ width: '18px', height: '18px', accentColor: 'var(--gold-primary)' }}
                />
                <span>Local limpo, serragem aspirada e papelões organizados</span>
              </label>
            </div>
          </div>

          {/* DUAL DIGITAL SIGNATURE CANVAS SECTION */}
          <div style={{ background: '#0b0d11', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-gold)', marginBottom: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--gold-hover)', margin: '0 0 4px 0' }}>
                ✒️ Coleta de Assinatura Digital Dupla
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Ambas as partes assinam na tela do celular para validação jurídica e emissão da garantia.
              </p>
            </div>

            {/* Signature 1: Assembler */}
            <SignaturePad
              title="1. Assinatura do Montador Técnico"
              signerLabel={`Montador: ${currentEmployee.name} (Confirma montagem e ajustes realizados)`}
              initialSignature={assemblerSig || activeOrder.signatures?.assemblerSignature}
              onSave={(dataUrl) => setAssemblerSig(dataUrl)}
              readOnly={activeOrder.status === 'concluido'}
            />

            {/* Signature 2: Client */}
            <SignaturePad
              title="2. Assinatura do Cliente / Vistoria"
              signerLabel={`Cliente: ${activeOrder.clientName} (Atesta conferência, funcionamento e garantia)`}
              initialSignature={clientSig || activeOrder.signatures?.clientSignature}
              onSave={(dataUrl) => setClientSig(dataUrl)}
              readOnly={activeOrder.status === 'concluido'}
            />

            {/* Client satisfaction rating */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Avaliação do Cliente:
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setClientRating(star)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                  >
                    <Star 
                      size={22} 
                      fill={star <= clientRating ? '#f59e0b' : 'none'} 
                      color={star <= clientRating ? '#f59e0b' : '#64748b'} 
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action button */}
          {activeOrder.status === 'concluido' ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-outline-gold" 
                style={{ flex: 1 }}
                onClick={() => onViewReceipt(activeOrder)}
              >
                <Printer size={16} /> Ver Comprovante & Garantia Emitido
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', fontSize: '16px', fontWeight: '800' }}
              disabled={isFinishing}
              onClick={() => handleFinishAssembly(activeOrder)}
            >
              <CheckCircle2 size={20} />
              {isFinishing ? 'Salvando Assinaturas...' : 'Finalizar Montagem & Emitir Comprovante'}
            </button>
          )}
        </div>
      ) : (
        /* Orders list for assembler */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Minhas Montagens Agendadas ({myOrders.length}):
          </h3>

          {myOrders.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Nenhuma montagem atribuída para {currentEmployee.name} no momento.
            </div>
          ) : (
            myOrders.map(order => {
              const isConcluded = order.status === 'concluido';
              const isInProgress = order.status === 'em_andamento';

              return (
                <div 
                  key={order.id}
                  className="card"
                  style={{
                    borderLeft: isConcluded ? '4px solid var(--success)' : isInProgress ? '4px solid var(--info)' : '4px solid var(--gold-primary)',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleOpenOrder(order)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--gold-hover)', textTransform: 'uppercase' }}>
                        {order.id}
                      </span>
                      <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#fff', margin: '2px 0 0 0' }}>
                        {order.clientName}
                      </h3>
                    </div>

                    <div>
                      {isConcluded && <span className="badge badge-success">✓ Concluído</span>}
                      {isInProgress && <span className="badge badge-info">Em Andamento</span>}
                      {order.status === 'agendado' && <span className="badge badge-purple">Agendado</span>}
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="var(--gold-primary)" />
                      <span>{order.address}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="var(--gold-primary)" />
                      <span>{formatDateBR(order.scheduledDate)} às {order.scheduledTime || '09:00'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--gold-hover)' }}>
                      {formatBRL(order.totalValue)}
                    </span>

                    <button 
                      className={`btn btn-sm ${isConcluded ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (order.status === 'agendado') {
                          handleStartWork(order);
                        } else {
                          handleOpenOrder(order);
                        }
                      }}
                    >
                      {isConcluded ? 'Ver Comprovante' : isInProgress ? 'Coletar Assinaturas' : 'Iniciar Atendimento'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
