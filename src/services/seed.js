// ============================================================
// MontaÊ - Dados iniciais (perfil da empresa + base de demonstração)
// Usados no primeiro acesso e no botão "restaurar dados de exemplo".
// ============================================================

export const DEFAULT_PROFILE = {
  name: 'Marcos Elias',
  email: 'marcos.elias.sc@gmail.com',
  phone: '(48) 99182-3401',
  company: 'MontaÊ - Montagem e Manutenção Especializada',
  slogan: 'MONTA. REPARA. CONECTA.',
  pixKey: 'marcos.elias.sc@gmail.com',
  city: 'Florianópolis / São José - SC',
  warrantyDays: 90,
  ratePerHour: 90
};

export const DEFAULT_EMPLOYEES = [
  {
    id: 'emp-1',
    name: 'Marcos Elias',
    email: 'marcos.elias.sc@gmail.com',
    phone: '(48) 99182-3401',
    role: 'Montador Master / Responsável',
    commissionRate: 100,
    active: true
  },
  {
    id: 'emp-2',
    name: 'Carlos Eduardo',
    email: 'carlos.montagens@gmail.com',
    phone: '(48) 98845-6712',
    role: 'Montador Especialista',
    commissionRate: 60,
    active: true
  },
  {
    id: 'emp-3',
    name: 'Matheus Souza',
    email: 'matheus.monta@gmail.com',
    phone: '(48) 99123-8890',
    role: 'Montador Assistente',
    commissionRate: 45,
    active: true
  }
];

export const DEFAULT_CLIENTS = [
  {
    id: 'cli-1',
    name: 'Juliana Mendes Rocha',
    phone: '4899881122',
    email: 'juliana.mendes@gmail.com',
    address: 'Rua Bocaiúva, 1420, Apto 502',
    neighborhood: 'Centro',
    city: 'Florianópolis - SC',
    notes: 'Prédio com elevador de serviço liberado até 18h.',
    createdAt: '2026-09-01'
  },
  {
    id: 'cli-2',
    name: 'Rodrigo de Albuquerque',
    phone: '4899123456',
    email: 'rodrigo.albuquerque@hotmail.com',
    address: 'Av. Lédio João Martins, 890, Bloco B',
    neighborhood: 'Kobrasol',
    city: 'São José - SC',
    notes: 'Parede de drywall na sala, levar buchas de expansão.',
    createdAt: '2026-09-03'
  },
  {
    id: 'cli-3',
    name: 'Camila Silveira Santos',
    phone: '4898456789',
    email: 'camila.silveira@outlook.com',
    address: 'Rua Najla Carone Goedert, 310',
    neighborhood: 'Pagani',
    city: 'Palhoça - SC',
    notes: 'Cozinha modulada comprada na MadeiraMadeira.',
    createdAt: '2026-09-05'
  },
  {
    id: 'cli-4',
    name: 'Felipe Amorim',
    phone: '4899988776',
    email: 'felipe.amorim@yahoo.com.br',
    address: 'Rua Lúcio Born, 45',
    neighborhood: 'Centro',
    city: 'Biguaçu - SC',
    notes: 'Preferência por atendimento no sábado de manhã.',
    createdAt: '2026-09-08'
  }
];

const SAMPLE_SIGNATURE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120" viewBox="0 0 300 120"><path d="M 20 80 Q 70 20 120 70 T 200 60 T 280 80" fill="none" stroke="%230f172a" stroke-width="3" stroke-linecap="round"/><path d="M 80 95 L 220 95" fill="none" stroke="%230f172a" stroke-width="2"/></svg>';

export const DEFAULT_ORDERS = [
  {
    id: 'OS-101',
    clientId: 'cli-1',
    clientName: 'Juliana Mendes Rocha',
    clientPhone: '4899881122',
    address: 'Rua Bocaiúva, 1420, Apto 502, Centro, Florianópolis',
    employeeId: 'emp-1',
    employeeName: 'Marcos Elias',
    items: [
      { name: 'Guarda-Roupa Casal 6 Portas com Espelho', qty: 1, room: 'Quarto Casal', type: 'Novo na Caixa' },
      { name: 'Cama Box Baú Casal', qty: 1, room: 'Quarto Casal', type: 'Novo na Caixa' }
    ],
    scheduledDate: '2026-09-07',
    scheduledTime: '09:00',
    status: 'concluido',
    totalValue: 420,
    paymentMethod: 'Pix',
    paymentStatus: 'pago',
    notes: 'Montagem concluída com sucesso. Portas reguladas e puxadores instalados.',
    completedAt: '2026-09-07 14:30',
    createdAt: '2026-09-01T10:00:00.000Z',
    signatures: {
      assemblerName: 'Marcos Elias',
      assemblerSignature: SAMPLE_SIGNATURE,
      assemblerSignedAt: '2026-09-07 14:25',
      clientName: 'Juliana Mendes Rocha',
      clientSignature: SAMPLE_SIGNATURE,
      clientSignedAt: '2026-09-07 14:28',
      satisfactionRating: 5
    },
    checklist: { leveling: true, doorsAdjusted: true, drawersTested: true, areaCleaned: true, wallSecured: true }
  },
  {
    id: 'OS-102',
    clientId: 'cli-2',
    clientName: 'Rodrigo de Albuquerque',
    clientPhone: '4899123456',
    address: 'Av. Lédio João Martins, 890, Bloco B, Kobrasol, São José',
    employeeId: 'emp-1',
    employeeName: 'Marcos Elias',
    items: [
      { name: 'Painel Ripado para TV até 75 pol. com Fita LED', qty: 1, room: 'Sala de Estar', type: 'Novo na Caixa' },
      { name: 'Rack Suspenso 2 Gavetas', qty: 1, room: 'Sala de Estar', type: 'Novo na Caixa' }
    ],
    scheduledDate: '2026-09-09',
    scheduledTime: '13:30',
    status: 'em_andamento',
    totalValue: 340,
    paymentMethod: 'Pix',
    paymentStatus: 'pendente',
    notes: 'Cliente em casa. Passagem de cabos embutida solicitada.',
    createdAt: '2026-09-03T10:00:00.000Z',
    checklist: { leveling: true, doorsAdjusted: false, drawersTested: false, areaCleaned: false, wallSecured: true }
  },
  {
    id: 'OS-103',
    clientId: 'cli-3',
    clientName: 'Camila Silveira Santos',
    clientPhone: '4898456789',
    address: 'Rua Najla Carone Goedert, 310, Pagani, Palhoça',
    employeeId: 'emp-2',
    employeeName: 'Carlos Eduardo',
    items: [
      { name: 'Cozinha Modulada 4 Peças (Aéreo + Balcão Pia + Paneleiro)', qty: 1, room: 'Cozinha', type: 'Novo na Caixa' }
    ],
    scheduledDate: '2026-09-10',
    scheduledTime: '09:00',
    status: 'agendado',
    totalValue: 480,
    paymentMethod: 'Cartão de Crédito',
    paymentStatus: 'pendente',
    notes: 'Fixação de aéreos com cantoneiras reforçadas.',
    createdAt: '2026-09-05T10:00:00.000Z',
    checklist: { leveling: false, doorsAdjusted: false, drawersTested: false, areaCleaned: false, wallSecured: false }
  },
  {
    id: 'OS-104',
    clientId: 'cli-4',
    clientName: 'Felipe Amorim',
    clientPhone: '4899988776',
    address: 'Rua Lúcio Born, 45, Centro, Biguaçu',
    employeeId: 'emp-1',
    employeeName: 'Marcos Elias',
    items: [
      { name: 'Mesa de Jantar 6 Cadeiras Estofadas', qty: 1, room: 'Sala de Jantar', type: 'Novo na Caixa' },
      { name: 'Aparador Buffet 3 Portas', qty: 1, room: 'Sala de Jantar', type: 'Novo na Caixa' }
    ],
    scheduledDate: '2026-09-12',
    scheduledTime: '10:00',
    status: 'orcamento',
    totalValue: 260,
    paymentMethod: 'Pix',
    paymentStatus: 'pendente',
    notes: 'Solicitado pelo cliente via link online de orçamento.',
    source: 'link_orcamento',
    createdAt: '2026-09-08T10:00:00.000Z',
    checklist: { leveling: false, doorsAdjusted: false, drawersTested: false, areaCleaned: false, wallSecured: false }
  }
];

export const DEFAULT_FINANCIAL = [
  {
    id: 'fin-1',
    type: 'receita',
    description: 'Montagem OS-101 (Juliana Mendes - Quarto Casal)',
    category: 'Montagem de Móveis',
    amount: 420,
    date: '2026-09-07',
    orderId: 'OS-101',
    paymentMethod: 'Pix',
    status: 'concluido'
  },
  {
    id: 'fin-2',
    type: 'receita',
    description: 'Montagem OS-100 (Carlos - Home Office)',
    category: 'Montagem de Móveis',
    amount: 320,
    date: '2026-09-04',
    orderId: 'OS-100',
    paymentMethod: 'Cartão de Débito',
    status: 'concluido'
  },
  {
    id: 'fin-3',
    type: 'despesa',
    description: 'Combustível / Deslocamento atendimentos',
    category: 'Transporte & Combustível',
    amount: 110,
    date: '2026-09-06',
    status: 'concluido'
  },
  {
    id: 'fin-4',
    type: 'despesa',
    description: 'Brocas de videa + Kit de buchas e parafusos 8mm/10mm',
    category: 'Ferramentas & Insumos',
    amount: 68.5,
    date: '2026-09-05',
    status: 'concluido'
  },
  {
    id: 'fin-5',
    type: 'despesa',
    description: 'Cantoneiras de aço e tapa furos adesivos',
    category: 'Ferragens & Reparos',
    amount: 35,
    date: '2026-09-03',
    status: 'concluido'
  }
];

export const SEED = {
  settings: DEFAULT_PROFILE,
  employees: DEFAULT_EMPLOYEES,
  clients: DEFAULT_CLIENTS,
  orders: DEFAULT_ORDERS,
  financial: DEFAULT_FINANCIAL
};
