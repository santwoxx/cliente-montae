// ============================================================
// MontaÊ - Banco local (modo offline / demonstração)
//
// Usado quando o Firebase não está configurado. Diferente da versão
// anterior, que fazia JSON.parse do armazenamento inteiro a cada
// leitura, aqui os dados ficam em um cache de memória e o disco só
// é tocado na gravação. Também sincroniza entre abas abertas e
// versiona o schema para migrações futuras.
// ============================================================

const PREFIX = 'montae';
const SCHEMA_VERSION = 2;

const KEYS = {
  version: `${PREFIX}:schema_version`,
  settings: `${PREFIX}:settings`,
  employees: `${PREFIX}:employees`,
  clients: `${PREFIX}:clients`,
  orders: `${PREFIX}:orders`,
  financial: `${PREFIX}:financial`,
  counter: `${PREFIX}:order_counter`
};

/** Chaves da versão 1 do app, migradas automaticamente. */
const LEGACY_KEYS = {
  settings: 'montae_profile_v1',
  employees: 'montae_employees_v1',
  clients: 'montae_clients_v1',
  orders: 'montae_orders_v1',
  financial: 'montae_financial_v1'
};

const memory = new Map();
const listeners = new Map(); // collection -> Set<callback>

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function readDisk(key, fallback) {
  try {
    return safeParse(localStorage.getItem(key), fallback);
  } catch {
    // Modo privado do Safari / cookies bloqueados: segue só em memória.
    return fallback;
  }
}

function writeDisk(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn('[MontaÊ] Não foi possível gravar no armazenamento local:', err?.name);
    return false;
  }
}

/** Migra dados da v1 (chaves antigas) para o formato atual, uma única vez. */
function migrate() {
  let version = Number(readDisk(KEYS.version, 0)) || 0;
  if (version >= SCHEMA_VERSION) return;

  if (version < 2) {
    for (const [collection, legacyKey] of Object.entries(LEGACY_KEYS)) {
      const legacy = readDisk(legacyKey, null);
      const current = readDisk(KEYS[collection], null);
      if (legacy && !current) {
        writeDisk(KEYS[collection], legacy);
      }
    }
  }

  version = SCHEMA_VERSION;
  writeDisk(KEYS.version, version);
}

function notify(collection) {
  const set = listeners.get(collection);
  if (!set) return;
  const value = memory.get(collection);
  for (const fn of set) {
    try {
      fn(value);
    } catch (err) {
      console.error('[MontaÊ] Erro em listener local:', err);
    }
  }
}

function load(collection, fallback) {
  if (memory.has(collection)) return memory.get(collection);
  const value = readDisk(KEYS[collection], fallback);
  memory.set(collection, value);
  return value;
}

function persist(collection, value) {
  memory.set(collection, value);
  writeDisk(KEYS[collection], value);
  notify(collection);
}

// Mantém as abas abertas em sincronia sem custo de polling.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (!event.key || !event.key.startsWith(`${PREFIX}:`)) return;
    const collection = Object.keys(KEYS).find((k) => KEYS[k] === event.key);
    if (!collection || collection === 'version') return;
    memory.set(collection, safeParse(event.newValue, memory.get(collection)));
    notify(collection);
  });
}

export const LocalDb = {
  init(seed) {
    migrate();
    // Semeia apenas o que ainda não existe, preservando dados reais.
    for (const collection of ['settings', 'employees', 'clients', 'orders', 'financial']) {
      const existing = readDisk(KEYS[collection], null);
      if (existing === null) {
        persist(collection, seed[collection]);
      } else {
        memory.set(collection, existing);
      }
    }
  },

  /** Assina uma coleção. Dispara imediatamente com o valor atual. */
  watch(collection, callback, fallback) {
    if (!listeners.has(collection)) listeners.set(collection, new Set());
    listeners.get(collection).add(callback);
    callback(load(collection, fallback));
    return () => {
      const set = listeners.get(collection);
      if (set) set.delete(callback);
    };
  },

  list(collection) {
    return load(collection, []);
  },

  get(collection) {
    return load(collection, null);
  },

  set(collection, value) {
    persist(collection, value);
    return value;
  },

  /** Insere ou atualiza um documento pelo id, sempre no topo da lista. */
  upsert(collection, doc) {
    const list = [...load(collection, [])];
    const index = list.findIndex((item) => item.id === doc.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...doc };
      persist(collection, list);
      return list[index];
    }
    list.unshift(doc);
    persist(collection, list);
    return doc;
  },

  remove(collection, id) {
    const list = load(collection, []).filter((item) => item.id !== id);
    persist(collection, list);
  },

  /**
   * Próximo número de OS. Usa o maior número já existente em vez da
   * quantidade de ordens — a versão anterior gerava códigos repetidos
   * depois de qualquer exclusão.
   */
  nextOrderNumber() {
    const orders = load('orders', []);
    const highest = orders.reduce((max, order) => {
      const num = parseInt(String(order.id).replace(/\D/g, ''), 10);
      return Number.isFinite(num) && num > max ? num : max;
    }, 100);
    const stored = Number(readDisk(KEYS.counter, 0)) || 0;
    const next = Math.max(highest, stored) + 1;
    writeDisk(KEYS.counter, next);
    return next;
  },

  exportAll() {
    return {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      settings: load('settings', null),
      employees: load('employees', []),
      clients: load('clients', []),
      orders: load('orders', []),
      financial: load('financial', [])
    };
  },

  importAll(data) {
    for (const collection of ['settings', 'employees', 'clients', 'orders', 'financial']) {
      if (data[collection] !== undefined) persist(collection, data[collection]);
    }
  },

  reset(seed) {
    for (const collection of ['settings', 'employees', 'clients', 'orders', 'financial']) {
      persist(collection, seed[collection]);
    }
    writeDisk(KEYS.counter, 0);
  },

  wipe() {
    for (const collection of ['settings', 'employees', 'clients', 'orders', 'financial']) {
      persist(collection, collection === 'settings' ? null : []);
    }
  }
};
