// ============================================================
// MontaÊ - Configuração inicial da empresa
//
// Aqui ficam APENAS os dados reais de identidade do negócio,
// usados para preencher o cabeçalho, o comprovante e o link
// público antes de o administrador salvar as configurações.
//
// O sistema é entregue sem nenhum registro fictício: clientes,
// ordens de serviço e lançamentos financeiros começam vazios e
// são criados pelo próprio uso.
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

/**
 * Montador responsável, para que a primeira ordem de serviço já
 * possa ser atribuída a alguém. Os demais são cadastrados pela
 * tela de Configurações → Equipe.
 */
export const DEFAULT_EMPLOYEES = [
  {
    id: 'emp-1',
    name: 'Marcos Elias',
    email: 'marcos.elias.sc@gmail.com',
    phone: '(48) 99182-3401',
    role: 'Montador Master / Responsável',
    commissionRate: 100,
    active: true
  }
];

export const SEED = {
  settings: DEFAULT_PROFILE,
  employees: DEFAULT_EMPLOYEES,
  clients: [],
  orders: [],
  financial: []
};
