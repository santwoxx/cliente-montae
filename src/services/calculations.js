// MontaÊ - Furniture Catalog, Pricing Formula & Formatting Helpers

export const FURNITURE_CATALOG = [
  {
    id: 'guarda-roupa-pequeno',
    name: 'Guarda-Roupa 2 a 3 Portas (Solteiro)',
    category: 'Quarto',
    basePrice: 160,
    estimatedMinutes: 120,
    icon: 'DoorClosed'
  },
  {
    id: 'guarda-roupa-grande',
    name: 'Guarda-Roupa 6 Portas / Casal com Gaveteiro',
    category: 'Quarto',
    basePrice: 280,
    estimatedMinutes: 240,
    icon: 'DoorOpen'
  },
  {
    id: 'guarda-roupa-correr',
    name: 'Guarda-Roupa Portas de Correr com Espelho',
    category: 'Quarto',
    basePrice: 320,
    estimatedMinutes: 240,
    icon: 'Maximize2'
  },
  {
    id: 'cama-box-bau',
    name: 'Cama Box Baú / Cama Casal',
    category: 'Quarto',
    basePrice: 120,
    estimatedMinutes: 60,
    icon: 'BedDouble'
  },
  {
    id: 'painel-tv',
    name: 'Painel para TV até 65" / 75" (com fixação na parede)',
    category: 'Sala',
    basePrice: 180,
    estimatedMinutes: 90,
    icon: 'Tv'
  },
  {
    id: 'rack-sala',
    name: 'Rack de Sala / Bancada com Gavetas',
    category: 'Sala',
    basePrice: 140,
    estimatedMinutes: 80,
    icon: 'Layers'
  },
  {
    id: 'mesa-jantar',
    name: 'Mesa de Jantar com 4 a 6 Cadeiras',
    category: 'Sala de Jantar',
    basePrice: 190,
    estimatedMinutes: 110,
    icon: 'Utensils'
  },
  {
    id: 'cozinha-modulada',
    name: 'Cozinha Modulada Completa (3 a 5 módulos)',
    category: 'Cozinha',
    basePrice: 450,
    estimatedMinutes: 300,
    icon: 'Coffee'
  },
  {
    id: 'armario-aereo',
    name: 'Armário Aéreo / Balcão de Cozinha Individual',
    category: 'Cozinha',
    basePrice: 130,
    estimatedMinutes: 70,
    icon: 'Box'
  },
  {
    id: 'escrivaninha-mesa-office',
    name: 'Escrivaninha / Mesa de Escritório / Estante',
    category: 'Escritório',
    basePrice: 130,
    estimatedMinutes: 70,
    icon: 'Monitor'
  },
  {
    id: 'outro-personalizado',
    name: 'Outro Móvel / Desmontagem e Remontagem Geral',
    category: 'Geral',
    basePrice: 120,
    estimatedMinutes: 60,
    icon: 'Wrench'
  }
];

export const SERVICE_MODIFIERS = {
  'novo_caixa': { label: 'Novo na Caixa (Montagem padrão)', multiplier: 1.0 },
  'desmontagem_remontagem': { label: 'Desmontagem + Nova Montagem', multiplier: 1.45 },
  'reparo_regulagem': { label: 'Apenas Reparo ou Regulagem de Portas/Gavetas', multiplier: 0.75 }
};

export function formatBRL(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDateBR(dateString) {
  if (!dateString) return '-';
  const parts = dateString.split(' ')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

export function formatWhatsAppLink(phone, text) {
  if (!phone) return '#';
  const cleaned = phone.replace(/\D/g, '');
  const withCountry = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  const encoded = encodeURIComponent(text || 'Olá! Gostaria de falar sobre montagem de móveis com a MontaÊ.');
  return `https://wa.me/${withCountry}?text=${encoded}`;
}
