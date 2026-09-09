// ============================================================
// MontaÊ - Catálogo de serviços, precificação e formatação
// ============================================================

export const FURNITURE_CATALOG = [
  {
    id: 'guarda-roupa-pequeno',
    name: 'Guarda-Roupa 2 a 3 Portas (Solteiro)',
    category: 'Quarto',
    basePrice: 160,
    estimatedMinutes: 120
  },
  {
    id: 'guarda-roupa-grande',
    name: 'Guarda-Roupa 6 Portas / Casal com Gaveteiro',
    category: 'Quarto',
    basePrice: 280,
    estimatedMinutes: 240
  },
  {
    id: 'guarda-roupa-correr',
    name: 'Guarda-Roupa Portas de Correr com Espelho',
    category: 'Quarto',
    basePrice: 320,
    estimatedMinutes: 240
  },
  {
    id: 'cama-box-bau',
    name: 'Cama Box Baú / Cama Casal',
    category: 'Quarto',
    basePrice: 120,
    estimatedMinutes: 60
  },
  {
    id: 'painel-tv',
    name: 'Painel para TV com fixação na parede',
    category: 'Sala',
    basePrice: 180,
    estimatedMinutes: 90
  },
  {
    id: 'rack-sala',
    name: 'Rack de Sala / Bancada com Gavetas',
    category: 'Sala',
    basePrice: 140,
    estimatedMinutes: 80
  },
  {
    id: 'mesa-jantar',
    name: 'Mesa de Jantar com 4 a 6 Cadeiras',
    category: 'Sala de Jantar',
    basePrice: 190,
    estimatedMinutes: 110
  },
  {
    id: 'cozinha-modulada',
    name: 'Cozinha Modulada Completa (3 a 5 módulos)',
    category: 'Cozinha',
    basePrice: 450,
    estimatedMinutes: 300
  },
  {
    id: 'armario-aereo',
    name: 'Armário Aéreo / Balcão de Cozinha Individual',
    category: 'Cozinha',
    basePrice: 130,
    estimatedMinutes: 70
  },
  {
    id: 'escrivaninha-mesa-office',
    name: 'Escrivaninha / Mesa de Escritório / Estante',
    category: 'Escritório',
    basePrice: 130,
    estimatedMinutes: 70
  },
  {
    id: 'outro-personalizado',
    name: 'Outro Móvel / Desmontagem e Remontagem Geral',
    category: 'Geral',
    basePrice: 120,
    estimatedMinutes: 60
  }
];

export const SERVICE_MODIFIERS = {
  novo_caixa: { label: 'Novo na Caixa (montagem padrão)', multiplier: 1.0 },
  desmontagem_remontagem: { label: 'Desmontagem + Nova Montagem', multiplier: 1.45 },
  reparo_regulagem: { label: 'Apenas Reparo ou Regulagem', multiplier: 0.75 }
};

export const CATALOG_CATEGORIES = [
  'Todos',
  'Quarto',
  'Sala',
  'Cozinha',
  'Sala de Jantar',
  'Escritório',
  'Geral'
];

/** Metadados de cada status: rótulo, cor e ordem de exibição. */
export const ORDER_STATUS = {
  orcamento: { label: 'Orçamento', tone: 'warn', flag: 'is-warn', order: 1 },
  agendado: { label: 'Agendado', tone: 'plum', flag: 'is-plum', order: 2 },
  em_andamento: { label: 'Em Andamento', tone: 'info', flag: 'is-info', order: 3 },
  concluido: { label: 'Concluído', tone: 'ok', flag: 'is-ok', order: 4 },
  cancelado: { label: 'Cancelado', tone: 'bad', flag: 'is-bad', order: 5 }
};

export function statusMeta(status) {
  return ORDER_STATUS[status] || { label: status || 'Indefinido', tone: 'mute', flag: '', order: 9 };
}

export const PAYMENT_METHODS = [
  'Pix',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro',
  'Boleto',
  'Transferência'
];

export const EXPENSE_CATEGORIES = [
  'Transporte & Combustível',
  'Ferramentas & Insumos',
  'Ferragens & Reparos',
  'Alimentação / Diária',
  'Comissão de Ajudante',
  'Impostos & Taxas',
  'Outras Despesas'
];

export const REVENUE_CATEGORIES = [
  'Montagem de Móveis',
  'Desmontagem & Remontagem',
  'Regulagem & Manutenção',
  'Instalação de Painel/TV',
  'Outras Receitas'
];

// ------------------------------------------------------------
// Formatação
// ------------------------------------------------------------

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

export function formatBRL(value) {
  return BRL.format(Number(value) || 0);
}

/** Aceita "2026-09-07", "2026-09-07 14:30" e ISO completo. */
export function formatDateBR(value) {
  if (!value) return '—';
  const datePart = String(value).split('T')[0].split(' ')[0];
  const parts = datePart.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return String(value);
}

export function formatDateTimeBR(value) {
  if (!value) return '—';
  const raw = String(value);
  if (raw.includes('/')) return raw;
  const [date, time] = raw.replace('T', ' ').split(' ');
  const formatted = formatDateBR(date);
  return time ? `${formatted} às ${time.slice(0, 5)}` : formatted;
}

export function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split('T')[0];
}

/** Carimbo legível gravado nas assinaturas. */
export function timestampBR() {
  const now = new Date();
  return `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
}

/** Máscara progressiva: (48) 99182-3401 */
export function formatPhoneBR(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

/** Um telefone brasileiro válido tem 10 (fixo) ou 11 (celular) dígitos. */
export function isValidPhoneBR(value) {
  const digits = onlyDigits(value);
  return digits.length === 10 || digits.length === 11;
}

export function isValidEmail(value) {
  if (!value) return true; // e-mail é opcional em vários formulários
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
}

export function formatWhatsAppLink(phone, text) {
  const digits = onlyDigits(phone);
  const message = encodeURIComponent(
    text || 'Olá! Gostaria de falar sobre montagem de móveis com a MontaÊ.'
  );
  if (!digits) return `https://wa.me/?text=${message}`;
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${message}`;
}

export function mapsLink(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`;
}

/** Iniciais para o avatar do usuário. */
export function initials(name) {
  const parts = String(name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ------------------------------------------------------------
// Cálculo do orçamento
// ------------------------------------------------------------

export function quoteItemSubtotal(item) {
  const catalogItem = FURNITURE_CATALOG.find((c) => c.id === item.catalogId);
  if (!catalogItem) return 0;
  const multiplier = SERVICE_MODIFIERS[item.serviceType]?.multiplier ?? 1;
  return catalogItem.basePrice * multiplier * (Number(item.qty) || 1);
}

export function quoteTotal(items) {
  return (items || []).reduce((sum, item) => sum + quoteItemSubtotal(item), 0);
}

export function estimatedDuration(items) {
  const minutes = (items || []).reduce((sum, item) => {
    const catalogItem = FURNITURE_CATALOG.find((c) => c.id === item.catalogId);
    if (!catalogItem) return sum;
    return sum + catalogItem.estimatedMinutes * (Number(item.qty) || 1);
  }, 0);
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours}h${String(rest).padStart(2, '0')}` : `${hours}h`;
}

// ------------------------------------------------------------
// Exportação de arquivos
// ------------------------------------------------------------

/** Dispara o download de um conteúdo gerado no navegador. */
export function downloadFile(filename, content, mime = 'application/json') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Libera a memória do blob depois que o navegador iniciou o download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Gera CSV compatível com o Excel em português: separador ";",
 * BOM para acentuação correta e vírgula decimal.
 */
export function toCSV(rows, columns) {
  const escape = (value) => {
    if (value === null || value === undefined) return '';
    const text = typeof value === 'number' ? String(value).replace('.', ',') : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const header = columns.map((col) => escape(col.label)).join(';');
  const body = rows
    .map((row) => columns.map((col) => escape(col.value(row))).join(';'))
    .join('\r\n');

  return `﻿${header}\r\n${body}`;
}
