// ============================================================
// MontaÊ - Controle de licença / mensalidade
//
// Regra do contrato:
//   - Sistema entregue em 08/09/2026.
//   - Primeiro vencimento: 08/10/2026.
//   - Depois disso, todo dia 9 de cada mês (09/11, 09/12, 09/01...).
//   - Em cada vencimento o sistema BLOQUEIA sozinho e só volta
//     quando o desenvolvedor confirmar o pagamento.
//
// Como liberar (leva 10 segundos, sem novo deploy):
//   Firebase Console > Firestore > settings > licenca
//   campo  paidUntil  =  data do PRÓXIMO vencimento
//   Ex.: cliente pagou a parcela de 08/10 -> paidUntil = "2026-11-09"
//   O app de todos os aparelhos desbloqueia na hora.
//
// Se o documento não existir ou estiver inacessível, vale a
// recorrência calculada aqui — ou seja, o padrão é bloquear.
//
// Proteções:
//   - Atrasar o relógio do aparelho não libera: guardamos a maior
//     data já vista e desconfiamos de retrocessos.
//   - As regras do Firestore impedem o cliente de editar este
//     documento (só leitura para ele).
// ============================================================

import { doc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseEnabled } from '../lib/firebase';

const env = import.meta.env;

/** Lê uma variável de ambiente com valor padrão. */
function cfg(name, fallback) {
  const value = env[name];
  return value === undefined || value === '' ? fallback : value;
}

/** Dados do contrato — todos ajustáveis por variável de ambiente. */
export const LICENSE_INFO = {
  vendorName: cfg('VITE_SUPPORT_NAME', 'Suporte MontaÊ'),
  vendorPhone: cfg('VITE_SUPPORT_PHONE', '73991422872'),
  vendorPhoneLabel: cfg('VITE_SUPPORT_PHONE_LABEL', '(73) 99142-2872'),
  purchaseDate: cfg('VITE_LICENSE_PURCHASE', '2026-09-08'),

  /** Primeiro vencimento. */
  firstDue: cfg('VITE_LICENSE_FIRST_DUE', '2026-10-08'),

  /** Dia do vencimento nos meses seguintes. */
  dueDay: Number(cfg('VITE_LICENSE_DUE_DAY', '9')),

  /**
   * Liberação de emergência por variável de ambiente. Use só se o
   * Firestore estiver fora do ar — exige novo deploy para valer.
   */
  envPaidUntil: cfg('VITE_LICENSE_PAID_UNTIL', ''),

  /** Dias de tolerância após o vencimento (0 = bloqueia no dia). */
  graceDays: Number(cfg('VITE_LICENSE_GRACE_DAYS', '0')),

  /** Começa a avisar este número de dias antes do vencimento. */
  warnDaysBefore: Number(cfg('VITE_LICENSE_WARN_DAYS', '7'))
};

const CLOCK_KEY = 'montae:last_seen_date';

/** Data local no formato AAAA-MM-DD, sem influência de fuso. */
function localISODate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
}

/**
 * Data considerada "hoje". Se o relógio do aparelho for atrasado
 * para burlar o bloqueio, continuamos usando a maior data já vista.
 */
export function trustedToday() {
  const today = localISODate();
  try {
    const lastSeen = localStorage.getItem(CLOCK_KEY);
    if (lastSeen && lastSeen > today) return lastSeen;
    localStorage.setItem(CLOCK_KEY, today);
  } catch {
    // Armazenamento bloqueado: seguimos com a data do aparelho.
  }
  return today;
}

function addDays(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return localISODate(new Date(year, month - 1, day + days));
}

function daysBetween(fromISO, toISO) {
  const [fy, fm, fd] = fromISO.split('-').map(Number);
  const [ty, tm, td] = toISO.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

/** Monta AAAA-MM-DD protegendo meses curtos (dia 31 em fevereiro etc.). */
function makeDate(year, monthIndex, day) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return localISODate(new Date(year, monthIndex, Math.min(day, lastDay)));
}

/**
 * Vencimento de um mês específico.
 *
 * O mês do primeiro vencimento é a exceção: em outubro/2026 a data
 * é 08, e só a partir de novembro passa a valer o dia 9. Sem esta
 * exceção o sistema inventaria uma parcela em 09/10.
 */
function dueOfMonth(year, monthIndex) {
  const { firstDue, dueDay } = LICENSE_INFO;
  const [fy, fm] = firstDue.split('-').map(Number);
  if (year === fy && monthIndex === fm - 1) return firstDue;
  return makeDate(year, monthIndex, dueDay);
}

/**
 * Vencimento que rege a data informada, ou seja, a última parcela
 * que já deveria ter sido paga. Retorna null antes do 1º vencimento.
 */
export function currentDueDate(todayISO) {
  const { firstDue } = LICENSE_INFO;
  if (todayISO < firstDue) return null;

  const [year, month] = todayISO.split('-').map(Number);
  const thisMonth = dueOfMonth(year, month - 1);
  if (todayISO >= thisMonth) return thisMonth;

  const previous = new Date(year, month - 2, 1);
  const due = dueOfMonth(previous.getFullYear(), previous.getMonth());
  return due < firstDue ? firstDue : due;
}

/** Próximo vencimento depois da data informada — o valor a usar em paidUntil. */
export function nextDueDate(fromISO) {
  const { firstDue } = LICENSE_INFO;
  if (fromISO < firstDue) return firstDue;

  const [year, month] = fromISO.split('-').map(Number);
  const thisMonth = dueOfMonth(year, month - 1);
  if (fromISO < thisMonth) return thisMonth;

  const next = new Date(year, month, 1);
  return dueOfMonth(next.getFullYear(), next.getMonth());
}

export function formatDateBR(isoDate) {
  if (!isoDate) return '—';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Avalia a licença. `remote` é o documento settings/licenca.
 *
 * Bloqueia quando a parcela vencida ainda não foi quitada, e volta
 * a bloquear a cada novo vencimento — sem precisar de nova ação.
 */
export function evaluateLicense(remote) {
  const today = trustedToday();

  // Bloqueio manual: trava mesmo antes do vencimento.
  if (remote?.blocked === true) {
    return {
      status: 'bloqueada',
      today,
      paidUntil: remote?.paidUntil || null,
      dueDate: currentDueDate(today),
      daysLeft: 0,
      message: remote?.message || '',
      reason: 'manual'
    };
  }

  // Licença quitada em definitivo.
  if (remote?.plan === 'vitalicia') {
    return {
      status: 'ativa',
      today,
      paidUntil: 'sempre',
      dueDate: null,
      daysLeft: Infinity,
      message: '',
      reason: 'vitalicia'
    };
  }

  // Até onde o cliente já pagou. O Firestore manda; a variável de
  // ambiente é só um plano B para quando o Firestore não responder.
  const paidUntil = remote?.paidUntil || LICENSE_INFO.envPaidUntil || null;
  const dueDate = currentDueDate(today);

  // Ainda não chegou o primeiro vencimento.
  if (!dueDate) {
    return {
      status: 'ativa',
      today,
      paidUntil,
      dueDate: LICENSE_INFO.firstDue,
      daysLeft: daysBetween(today, LICENSE_INFO.firstDue),
      message: '',
      reason: 'antes-do-primeiro-vencimento'
    };
  }

  const limit = addDays(paidUntil || dueDate, LICENSE_INFO.graceDays);
  const daysLeft = daysBetween(today, limit);

  // Pagou menos do que a parcela corrente exige -> bloqueia.
  if (!paidUntil || daysLeft <= 0) {
    return {
      status: 'bloqueada',
      today,
      paidUntil,
      dueDate,
      daysLeft: 0,
      message: remote?.message || '',
      reason: paidUntil ? 'vencida' : 'sem-pagamento-registrado'
    };
  }

  if (daysLeft <= LICENSE_INFO.warnDaysBefore) {
    return {
      status: 'aviso',
      today,
      paidUntil,
      dueDate: limit,
      daysLeft,
      message: remote?.message || '',
      reason: 'a-vencer'
    };
  }

  return {
    status: 'ativa',
    today,
    paidUntil,
    dueDate: limit,
    daysLeft,
    message: remote?.message || '',
    reason: 'em-dia'
  };
}

/**
 * Observa a licença em tempo real. Assim que você atualiza a data
 * no Console, o sistema do cliente desbloqueia sozinho.
 */
export function watchLicense(callback) {
  if (!isFirebaseEnabled) {
    // Modo local (desenvolvimento): sem bloqueio.
    callback({
      status: 'ativa',
      today: trustedToday(),
      paidUntil: 'sempre',
      daysLeft: Infinity,
      reason: 'modo-local'
    });
    return () => {};
  }

  return onSnapshot(
    doc(db, 'settings', 'licenca'),
    (snapshot) => callback(evaluateLicense(snapshot.exists() ? snapshot.data() : null)),
    (error) => {
      // Sem permissão ou sem rede: aplica a recorrência do contrato.
      console.warn('[MontaÊ] Licença indisponível, aplicando regra padrão:', error?.code);
      callback(evaluateLicense(null));
    }
  );
}

/** Mensagem pronta para o WhatsApp do desenvolvedor. */
export function buildRenewalMessage(license, companyName) {
  const venc = formatDateBR(license?.dueDate || license?.paidUntil);
  return (
    `Olá! Aqui é ${companyName || 'do sistema MontaÊ'}.\n\n` +
    `Quero regularizar a mensalidade do sistema.\n` +
    `Vencimento: ${venc}\n\n` +
    `Pode me enviar os dados para pagamento?`
  );
}
