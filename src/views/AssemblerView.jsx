// ============================================================
// MontaÊ - Painel do montador em campo
//
// Fluxo: escolher a montagem → conferir os móveis → marcar o
// checklist de qualidade → colher as duas assinaturas → emitir
// o comprovante com garantia.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Smartphone,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Navigation,
  MessageSquare,
  Star,
  Printer,
  ArrowLeft,
  PackageCheck
} from 'lucide-react';
import SignaturePad from '../components/SignaturePad';
import {
  formatBRL,
  formatDateBR,
  formatWhatsAppLink,
  mapsLink,
  statusMeta,
  timestampBR
} from '../services/calculations';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

const CHECKLIST = [
  { key: 'leveling', label: 'Móvel nivelado no chão e no prumo' },
  { key: 'doorsAdjusted', label: 'Portas alinhadas com dobradiças reguladas' },
  { key: 'drawersTested', label: 'Gavetas deslizando e puxadores firmes' },
  { key: 'wallSecured', label: 'Fixação em parede com bucha adequada' },
  { key: 'areaCleaned', label: 'Local limpo e embalagens recolhidas' }
];

const EMPTY_CHECKLIST = {
  leveling: false,
  doorsAdjusted: false,
  drawersTested: false,
  wallSecured: false,
  areaCleaned: false
};

export default function AssemblerView({ selectedOrderId, onClearSelection, onViewReceipt }) {
  const { user, isAdmin } = useAuth();
  const { orders, employees, saveOrder } = useData();
  const { toast } = useToast();

  // Um montador vê apenas as próprias montagens; o admin escolhe qual.
  const defaultEmployeeId = useMemo(() => {
    if (user?.employeeId) return user.employeeId;
    const match = employees.find(
      (employee) => employee.email?.toLowerCase() === user?.email?.toLowerCase()
    );
    return match?.id || employees[0]?.id || '';
  }, [employees, user]);

  const [employeeId, setEmployeeId] = useState(defaultEmployeeId);
  const [activeId, setActiveId] = useState(selectedOrderId || null);
  const [assemblerSig, setAssemblerSig] = useState(null);
  const [clientSig, setClientSig] = useState(null);
  const [rating, setRating] = useState(5);
  const [checklist, setChecklist] = useState(EMPTY_CHECKLIST);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (defaultEmployeeId && !employeeId) setEmployeeId(defaultEmployeeId);
  }, [defaultEmployeeId, employeeId]);

  useEffect(() => {
    if (selectedOrderId) setActiveId(selectedOrderId);
  }, [selectedOrderId]);

  const employee = employees.find((e) => e.id === employeeId) || employees[0];
  const activeOrder = activeId ? orders.find((o) => o.id === activeId) : null;

  // Carrega checklist e assinaturas já gravadas ao abrir uma ordem.
  useEffect(() => {
    if (!activeOrder) return;
    setChecklist({ ...EMPTY_CHECKLIST, ...(activeOrder.checklist || {}) });
    setAssemblerSig(activeOrder.signatures?.assemblerSignature || null);
    setClientSig(activeOrder.signatures?.clientSignature || null);
    setRating(activeOrder.signatures?.satisfactionRating || 5);
  }, [activeOrder?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const myOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (order.status === 'cancelado') return false;
        if (isAdmin && !employeeId) return true;
        return order.employeeId === employeeId;
      })
      .sort((a, b) => String(a.scheduledDate || '').localeCompare(String(b.scheduledDate || '')));
  }, [orders, employeeId, isAdmin]);

  const closeOrder = () => {
    setActiveId(null);
    onClearSelection?.();
  };

  const handleStart = async (order) => {
    await saveOrder({
      ...order,
      status: 'em_andamento',
      employeeId: employee?.id || order.employeeId,
      employeeName: employee?.name || order.employeeName
    });
    setActiveId(order.id);
  };

  const handleFinish = async () => {
    if (!assemblerSig) {
      toast.error('O montador precisa assinar no primeiro quadro.');
      return;
    }
    if (!clientSig) {
      toast.error('O cliente precisa conferir e assinar no segundo quadro.');
      return;
    }

    const pending = CHECKLIST.filter((item) => !checklist[item.key]);
    if (pending.length) {
      toast.warning(`Confira o checklist: ${pending.length} item(ns) ainda não marcado(s).`);
      return;
    }

    setFinishing(true);
    const stamp = timestampBR();

    try {
      const updated = await saveOrder({
        ...activeOrder,
        status: 'concluido',
        completedAt: stamp,
        paymentStatus: 'pago',
        checklist,
        signatures: {
          assemblerName: employee?.name || user?.displayName || 'Montador',
          assemblerSignature: assemblerSig,
          assemblerSignedAt: stamp,
          clientName: activeOrder.clientName,
          clientSignature: clientSig,
          clientSignedAt: stamp,
          satisfactionRating: rating
        }
      });

      confetti({ particleCount: 110, spread: 72, origin: { y: 0.6 } });
      toast.success('Montagem concluída e comprovante emitido!');
      setTimeout(() => onViewReceipt(updated), 500);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível concluir. Verifique a conexão e tente de novo.');
    } finally {
      setFinishing(false);
    }
  };

  const doneCount = CHECKLIST.filter((item) => checklist[item.key]).length;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="field-hero">
        <div>
          <h2>
            <Smartphone size={19} aria-hidden="true" />
            Painel do montador
          </h2>
          <p>Atendimento, checklist de qualidade e assinatura digital dupla na conclusão.</p>
        </div>

        {(isAdmin || employees.length > 1) && (
          <div>
            <span className="field-hero-label">Montador</span>
            <select
              className="select select-sm"
              style={{ width: 'auto' }}
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value);
                closeOrder();
              }}
              aria-label="Selecionar montador"
            >
              {employees.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeOrder ? (
        <div className="card">
          <div className="card-head">
            <button type="button" className="btn btn-secondary btn-sm" onClick={closeOrder}>
              <ArrowLeft size={14} aria-hidden="true" />
              Voltar
            </button>
            <span className={`badge badge-${statusMeta(activeOrder.status).tone}`}>
              {activeOrder.id} · {statusMeta(activeOrder.status).label}
            </span>
          </div>

          <div className="card-body">
            {/* Cliente */}
            <div className="panel mb-20">
              <h3 className="fs-17 mb-8">{activeOrder.clientName}</h3>
              <div className="stack-sm mb-12">
                <span className="meta">
                  <MapPin size={14} aria-hidden="true" />
                  <span>{activeOrder.address}</span>
                </span>
                <span className="meta">
                  <Phone size={14} aria-hidden="true" />
                  <span>{activeOrder.clientPhone || 'Sem telefone'}</span>
                </span>
                <span className="meta">
                  <Clock size={14} aria-hidden="true" />
                  <span>
                    {formatDateBR(activeOrder.scheduledDate)} às {activeOrder.scheduledTime || '09:00'}
                  </span>
                </span>
              </div>

              <div className="row" style={{ gap: 8 }}>
                <a
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  href={mapsLink(activeOrder.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation size={14} color="var(--info)" aria-hidden="true" />
                  Rota / GPS
                </a>
                <a
                  className="btn btn-success btn-sm"
                  style={{ flex: 1 }}
                  href={formatWhatsAppLink(
                    activeOrder.clientPhone,
                    `Olá ${activeOrder.clientName}! Aqui é da MontaÊ, estou a caminho para a montagem.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageSquare size={14} aria-hidden="true" />
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Itens */}
            <div className="mb-20">
              <div className="stat-label mb-8">Móveis desta ordem</div>
              <div className="stack-sm">
                {(activeOrder.items || []).map((item, index) => (
                  <div key={index} className="tile">
                    <span className="fs-13">
                      <strong>{item.qty || 1}×</strong> {item.name}
                    </span>
                    <span className="badge badge-mute">{item.room || 'Ambiente'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist */}
            <div className="mb-20">
              <div className="row-between mb-12">
                <span className="card-title fs-15">
                  <ShieldCheck size={16} aria-hidden="true" />
                  Checklist de qualidade
                </span>
                <span className={`badge ${doneCount === CHECKLIST.length ? 'badge-ok' : 'badge-warn'}`}>
                  {doneCount}/{CHECKLIST.length}
                </span>
              </div>

              <div className="stack-sm">
                {CHECKLIST.map((item) => (
                  <label key={item.key} className={`check ${checklist[item.key] ? 'is-on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={Boolean(checklist[item.key])}
                      onChange={() =>
                        setChecklist((current) => ({ ...current, [item.key]: !current[item.key] }))
                      }
                      disabled={activeOrder.status === 'concluido'}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Assinaturas */}
            <div className="panel mb-20">
              <div style={{ textAlign: 'center' }} className="mb-16">
                <h3 className="fs-17">Assinatura digital dupla</h3>
                <p className="fs-12 muted">
                  As duas partes assinam na tela para validar o serviço e ativar a garantia.
                </p>
              </div>

              <SignaturePad
                title="1. Montador técnico"
                signerLabel={`${employee?.name || 'Montador'} — confirma a montagem e os ajustes realizados`}
                initialSignature={activeOrder.signatures?.assemblerSignature || null}
                onSave={setAssemblerSig}
                readOnly={activeOrder.status === 'concluido'}
              />

              <SignaturePad
                title="2. Cliente / vistoria"
                signerLabel={`${activeOrder.clientName} — atesta conferência, funcionamento e garantia`}
                initialSignature={activeOrder.signatures?.clientSignature || null}
                onSave={setClientSig}
                readOnly={activeOrder.status === 'concluido'}
              />

              <div className="row-between mt-16" style={{ paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                <span className="fs-13 text-2">Avaliação do cliente</span>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="star-btn"
                      onClick={() => setRating(star)}
                      disabled={activeOrder.status === 'concluido'}
                      aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        size={23}
                        fill={star <= rating ? '#eab308' : 'none'}
                        color={star <= rating ? '#eab308' : '#c3c9d3'}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeOrder.status === 'concluido' ? (
              <button
                type="button"
                className="btn btn-outline btn-lg btn-block"
                onClick={() => onViewReceipt(activeOrder)}
              >
                <Printer size={18} aria-hidden="true" />
                Ver comprovante e garantia
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-lg btn-block"
                onClick={handleFinish}
                disabled={finishing}
              >
                {finishing ? <span className="spinner" /> : <CheckCircle2 size={19} aria-hidden="true" />}
                {finishing ? 'Salvando assinaturas...' : 'Finalizar e emitir comprovante'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <h2 className="stat-label mb-12">
            Minhas montagens ({myOrders.length})
          </h2>

          {myOrders.length === 0 ? (
            <div className="card empty">
              <div className="empty-icon" aria-hidden="true">
                <PackageCheck size={24} />
              </div>
              <h4>Nenhuma montagem atribuída</h4>
              <p>
                Não há ordens para {employee?.name || 'este montador'} no momento. Assim que uma
                ordem for atribuída, ela aparece aqui.
              </p>
            </div>
          ) : (
            <div className="stack">
              {myOrders.map((order) => {
                const meta = statusMeta(order.status);
                const isDone = order.status === 'concluido';

                return (
                  <article
                    key={order.id}
                    className={`card card-flag ${meta.flag}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveId(order.id)}
                  >
                    <div className="card-body">
                      <div className="row-between mb-8" style={{ alignItems: 'flex-start' }}>
                        <div style={{ minWidth: 0 }}>
                          <span className="fs-11 strong" style={{ color: 'var(--brand)' }}>
                            {order.id}
                          </span>
                          <h3 className="fs-17 truncate">{order.clientName}</h3>
                        </div>
                        <span className={`badge badge-${meta.tone}`}>{meta.label}</span>
                      </div>

                      <div className="stack-sm mb-12">
                        <span className="meta">
                          <MapPin size={14} aria-hidden="true" />
                          <span className="clamp-2">{order.address}</span>
                        </span>
                        <span className="meta">
                          <Clock size={14} aria-hidden="true" />
                          <span>
                            {formatDateBR(order.scheduledDate)} às {order.scheduledTime || '09:00'}
                          </span>
                        </span>
                      </div>

                      <div
                        className="row-between"
                        style={{ paddingTop: 12, borderTop: '1px solid var(--line)' }}
                      >
                        <span className="money">{formatBRL(order.totalValue)}</span>

                        <button
                          type="button"
                          className={`btn btn-sm ${isDone ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (order.status === 'agendado' || order.status === 'orcamento') {
                              handleStart(order);
                            } else if (isDone) {
                              onViewReceipt(order);
                            } else {
                              setActiveId(order.id);
                            }
                          }}
                        >
                          {isDone
                            ? 'Ver comprovante'
                            : order.status === 'em_andamento'
                              ? 'Coletar assinaturas'
                              : 'Iniciar atendimento'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
