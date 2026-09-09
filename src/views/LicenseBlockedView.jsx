// ============================================================
// MontaÊ - Tela de bloqueio por mensalidade em aberto
//
// Aparece quando a licença vence. O acesso ao sistema fica
// suspenso até o desenvolvedor liberar a data no Firebase.
// ============================================================

import React, { useState } from 'react';
import { Lock, MessageSquare, Copy, Check, Phone, RefreshCw } from 'lucide-react';
import Logo from '../components/Logo';
import { LICENSE_INFO, formatDateBR, buildRenewalMessage } from '../services/license';
import { formatWhatsAppLink } from '../services/calculations';

export default function LicenseBlockedView({ license, companyName }) {
  const [copied, setCopied] = useState(false);

  const message = buildRenewalMessage(license, companyName);

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(LICENSE_INFO.vendorPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Sem permissão da área de transferência: o número já está na tela.
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card" style={{ maxWidth: 460, textAlign: 'center' }}>
        <div className="auth-brand">
          <Logo className="auth-logo" size={62} />
        </div>

        <div className="confirm-icon is-danger" style={{ width: 56, height: 56 }}>
          <Lock size={26} aria-hidden="true" />
        </div>

        <h1 className="auth-title">Sistema temporariamente bloqueado</h1>

        <p className="auth-sub mt-8">
          {license?.message ||
            'A mensalidade do sistema está em aberto. Assim que o pagamento for confirmado, o acesso é liberado na hora.'}
        </p>

        <div className="panel mt-20" style={{ textAlign: 'left' }}>
          <div className="row-between fs-13 mb-8">
            <span className="muted">Vencimento</span>
            <strong style={{ color: 'var(--bad)' }}>
              {formatDateBR(license?.dueDate || license?.paidUntil)}
            </strong>
          </div>
          <div className="row-between fs-13">
            <span className="muted">Situação</span>
            <span className="badge badge-bad">Pagamento pendente</span>
          </div>
        </div>

        <div className="notice is-bad mt-20 mb-0" style={{ textAlign: 'left' }}>
          <div className="notice-icon" aria-hidden="true">
            <Phone size={18} />
          </div>
          <div className="notice-body">
            <div className="notice-title">Fale com o suporte</div>
            <div className="notice-text">
              WhatsApp <strong>{LICENSE_INFO.vendorPhoneLabel}</strong>
            </div>
          </div>
        </div>

        <div className="stack-sm mt-20">
          <a
            className="btn btn-success btn-lg"
            href={formatWhatsAppLink(LICENSE_INFO.vendorPhone, message)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageSquare size={18} aria-hidden="true" />
            Falar no WhatsApp e regularizar
          </a>

          <button type="button" className="btn btn-secondary" onClick={handleCopyPhone}>
            {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            {copied ? 'Número copiado' : `Copiar ${LICENSE_INFO.vendorPhoneLabel}`}
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={14} aria-hidden="true" />
            Já paguei, atualizar
          </button>
        </div>

        <p className="auth-foot">
          Seus dados continuam salvos e intactos. O bloqueio afeta apenas o acesso ao sistema.
        </p>
      </div>
    </div>
  );
}
