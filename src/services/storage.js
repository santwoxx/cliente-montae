// MontaÊ - Storage & Local State Management Service

const STORAGE_KEYS = {
  PROFILE: 'montae_profile_v1',
  EMPLOYEES: 'montae_employees_v1',
  CLIENTS: 'montae_clients_v1',
  ORDERS: 'montae_orders_v1',
  FINANCIAL: 'montae_financial_v1',
  QUOTES: 'montae_quotes_v1',
  CONFIG: 'montae_config_v1'
};

// Initial realistic default data
const DEFAULT_PROFILE = {
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

const DEFAULT_EMPLOYEES = [
  {
    id: 'emp-1',
    name: 'Marcos Elias',
    email: 'marcos.elias.sc@gmail.com',
    phone: '(48) 99182-3401',
    role: 'Montador Master / Responsável',
    commissionRate: 100, // %
    active: true
  },
  {
    id: 'emp-2',
    name: 'Carlos Eduardo',
    email: 'carlos.montagens@gmail.com',
    phone: '(48) 98845-6712',
    role: 'Montador Especialista',
    commissionRate: 60, // %
    active: true
  },
  {
    id: 'emp-3',
    name: 'Matheus Souza',
    email: 'matheus.monta@gmail.com',
    phone: '(48) 99123-8890',
    role: 'Montador Assistente',
    commissionRate: 45, // %
    active: true
  }
];

const DEFAULT_CLIENTS = [
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

// Sample signature lines (data URLs) for ready-to-test completed orders
const SAMPLE_SIGNATURE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120" viewBox="0 0 300 120"><path d="M 20 80 Q 70 20 120 70 T 200 60 T 280 80" fill="none" stroke="%230f172a" stroke-width="3" stroke-linecap="round"/><path d="M 80 95 L 220 95" fill="none" stroke="%230f172a" stroke-width="2"/></svg>';

const DEFAULT_ORDERS = [
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
    status: 'concluido', // orcamento, agendado, em_andamento, concluido, cancelado
    totalValue: 420.00,
    paymentMethod: 'Pix',
    paymentStatus: 'pago',
    notes: 'Montagem concluída com sucesso. Portas reguladas e puxadores instalados.',
    completedAt: '2026-09-07 14:30',
    signatures: {
      assemblerName: 'Marcos Elias',
      assemblerSignature: SAMPLE_SIGNATURE,
      assemblerSignedAt: '2026-09-07 14:25',
      clientName: 'Juliana Mendes Rocha',
      clientSignature: SAMPLE_SIGNATURE,
      clientSignedAt: '2026-09-07 14:28',
      satisfactionRating: 5
    },
    checklist: {
      leveling: true,
      doorsAdjusted: true,
      drawersTested: true,
      areaCleaned: true,
      wallSecured: true
    }
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
      { name: 'Painel Ripado para TV até 75" com Fita LED', qty: 1, room: 'Sala de Estar', type: 'Novo na Caixa' },
      { name: 'Rack Suspenso 2 Gavetas', qty: 1, room: 'Sala de Estar', type: 'Novo na Caixa' }
    ],
    scheduledDate: '2026-09-09',
    scheduledTime: '13:30',
    status: 'em_andamento',
    totalValue: 340.00,
    paymentMethod: 'Pix',
    paymentStatus: 'pendente',
    notes: 'Cliente em casa. Passagem de cabos embutida solicitada.',
    checklist: {
      leveling: true,
      doorsAdjusted: false,
      drawersTested: false,
      areaCleaned: false,
      wallSecured: true
    }
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
    totalValue: 480.00,
    paymentMethod: 'Cartão de Crédito',
    paymentStatus: 'pendente',
    notes: 'Fixação de aéreos com cantoneiras reforçadas.',
    checklist: {
      leveling: false,
      doorsAdjusted: false,
      drawersTested: false,
      areaCleaned: false,
      wallSecured: false
    }
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
    totalValue: 260.00,
    paymentMethod: 'Pix',
    paymentStatus: 'pendente',
    notes: 'Solicitado pelo cliente via link online de orçamento.',
    source: 'link_orcamento',
    checklist: {
      leveling: false,
      doorsAdjusted: false,
      drawersTested: false,
      areaCleaned: false,
      wallSecured: false
    }
  }
];

const DEFAULT_FINANCIAL = [
  {
    id: 'fin-1',
    type: 'receita', // receita ou despesa
    description: 'Montagem OS-101 (Juliana Mendes - Quarto Casal)',
    category: 'Montagem de Móveis',
    amount: 420.00,
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
    amount: 320.00,
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
    amount: 110.00,
    date: '2026-09-06',
    status: 'concluido'
  },
  {
    id: 'fin-4',
    type: 'despesa',
    description: 'Brocas de videa + Kit de buchas e parafusos 8mm/10mm',
    category: 'Ferramentas & Insumos',
    amount: 68.50,
    date: '2026-09-05',
    status: 'concluido'
  },
  {
    id: 'fin-5',
    type: 'despesa',
    description: 'Cantoneiras de aço e tapa furos adesivos',
    category: 'Ferragens & Reparos',
    amount: 35.00,
    date: '2026-09-03',
    status: 'concluido'
  }
];

// Event listeners for state reactivity
const listeners = new Set();

function notifyListeners() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('Listener error:', e);
    }
  });
}

export const StorageService = {
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  // Profile
  getProfile() {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return raw ? JSON.parse(raw) : DEFAULT_PROFILE;
  },

  saveProfile(data) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data));
    notifyListeners();
  },

  // Employees
  getEmployees() {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(DEFAULT_EMPLOYEES));
      return DEFAULT_EMPLOYEES;
    }
    return JSON.parse(raw);
  },

  saveEmployee(employee) {
    const employees = this.getEmployees();
    const index = employees.findIndex(e => e.id === employee.id);
    if (index >= 0) {
      employees[index] = employee;
    } else {
      employees.push({ ...employee, id: 'emp-' + Date.now() });
    }
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    notifyListeners();
    return employee;
  },

  deleteEmployee(id) {
    const employees = this.getEmployees().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    notifyListeners();
  },

  // Clients
  getClients() {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(DEFAULT_CLIENTS));
      return DEFAULT_CLIENTS;
    }
    return JSON.parse(raw);
  },

  saveClient(client) {
    const clients = this.getClients();
    let updated;
    if (client.id) {
      const idx = clients.findIndex(c => c.id === client.id);
      if (idx >= 0) {
        clients[idx] = { ...clients[idx], ...client };
        updated = clients[idx];
      }
    } else {
      updated = {
        ...client,
        id: 'cli-' + Date.now(),
        createdAt: new Date().toISOString().split('T')[0]
      };
      clients.unshift(updated);
    }
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    notifyListeners();
    return updated;
  },

  deleteClient(id) {
    const clients = this.getClients().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    notifyListeners();
  },

  // Orders
  getOrders() {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
      return DEFAULT_ORDERS;
    }
    return JSON.parse(raw);
  },

  saveOrder(order) {
    const orders = this.getOrders();
    let saved;
    if (order.id) {
      const idx = orders.findIndex(o => o.id === order.id);
      if (idx >= 0) {
        orders[idx] = { ...orders[idx], ...order };
        saved = orders[idx];
      } else {
        orders.unshift(order);
        saved = order;
      }
    } else {
      const nextNum = 100 + orders.length + 1;
      saved = {
        ...order,
        id: 'OS-' + nextNum,
        createdAt: new Date().toISOString()
      };
      orders.unshift(saved);
    }
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    // If order was marked as concluded and paid, ensure financial transaction exists
    if (saved.status === 'concluido' && saved.paymentStatus === 'pago') {
      this.ensureOrderRevenue(saved);
    }

    notifyListeners();
    return saved;
  },

  ensureOrderRevenue(order) {
    const financial = this.getFinancial();
    const existing = financial.find(f => f.orderId === order.id);
    if (!existing) {
      this.addFinancialTransaction({
        type: 'receita',
        description: `Montagem ${order.id} (${order.clientName})`,
        category: 'Montagem de Móveis',
        amount: Number(order.totalValue) || 0,
        date: order.completedAt ? order.completedAt.split(' ')[0] : new Date().toISOString().split('T')[0],
        orderId: order.id,
        paymentMethod: order.paymentMethod || 'Pix',
        status: 'concluido'
      });
    }
  },

  deleteOrder(id) {
    const orders = this.getOrders().filter(o => o.id !== id);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    notifyListeners();
  },

  // Financial Transactions
  getFinancial() {
    const raw = localStorage.getItem(STORAGE_KEYS.FINANCIAL);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FINANCIAL, JSON.stringify(DEFAULT_FINANCIAL));
      return DEFAULT_FINANCIAL;
    }
    return JSON.parse(raw);
  },

  addFinancialTransaction(transaction) {
    const list = this.getFinancial();
    const item = {
      ...transaction,
      id: 'fin-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    list.unshift(item);
    localStorage.setItem(STORAGE_KEYS.FINANCIAL, JSON.stringify(list));
    notifyListeners();
    return item;
  },

  deleteFinancialTransaction(id) {
    const list = this.getFinancial().filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEYS.FINANCIAL, JSON.stringify(list));
    notifyListeners();
  },

  // Reset to sample data
  resetAllData() {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(DEFAULT_EMPLOYEES));
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(DEFAULT_CLIENTS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
    localStorage.setItem(STORAGE_KEYS.FINANCIAL, JSON.stringify(DEFAULT_FINANCIAL));
    notifyListeners();
  }
};
