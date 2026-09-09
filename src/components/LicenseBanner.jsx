// ============================================================
// MontaÊ - Aviso de mensalidade a vencer
//
// Aparece nos dias que antecedem o vencimento, para que o
// bloqueio nunca pegue o cliente de surpresa.
// ============================================================

import React from 'react';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import { LICENSE_INFO, formatDateBR, buildRenewalMessage } from '../services/license';
import { formatWhatsAppLink } from '../services/calculations';
import { useLicense } from '../context/LicenseContext';

export default function LicenseBanner({ companyName }) {
  const { license, isWarning } = useLicense();

  if (!isWarning) return null;

  const days = license.daysLeft;
  const label =
    days <= 0
      ? 'vence hoje'
      : days === 1
        ? 'vence amanhã'
        : `vence em ${days} dias`;

  return (
    <div className="notice is-bad no-print" role="status">
      <div className="notice-icon" aria-hidden="true">
        <AlertTriangle size={19} />
      </div>
      <div className="notice-body">
        <div className="notice-title">Mensalidade do sistema {label}</div>
        <div className="notice-text">
          Vencimento em {formatDateBR(license.paidUntil)}. Regularize para não perder o acesso ao
          sistema — WhatsApp {LICENSE_INFO.vendorPhoneLabel}.
        </div>
      </div>
      <a
        className="btn btn-success btn-sm"
        href={formatWhatsAppLink(LICENSE_INFO.vendorPhone, buildRenewalMessage(license, companyName))}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageSquare size={14} aria-hidden="true" />
        Pagar agora
      </a>
    </div>
  );
}
