// ============================================================
// MontaÊ - Configurações
//
// Reúne o que antes estava fixo no código: dados da empresa,
// equipe de montadores, liberação de acessos e backup dos dados.
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  Users,
  Check,
  Plus,
  Trash2,
  Pencil,
  Download,
  Upload,
  DatabaseBackup,
  ShieldCheck,
  Cloud,
  HardDrive,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import Modal from '../components/Modal';
import { Database } from '../services/db';
import { db } from '../lib/firebase';
import { ROLES } from '../services/auth';
import { formatPhoneBR, isValidEmail, todayISO, downloadFile } from '../services/calculations';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

const EMPTY_EMPLOYEE = {
  name: '',
  email: '',
  phone: '',
  role: 'Montador',
  commissionRate: 50,
  active: true
};

export default function SettingsView() {
  const { isAdmin, cloudMode, user } = useAuth();
  const { profile, employees, saveProfile, saveEmployee, deleteEmployee } = useData();
  const { confirm, toast } = useToast();

  const [tab, setTab] = useState('empresa');
  const [company, setCompany] = useState(profile);
  const [savingCompany, setSavingCompany] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState(EMPTY_EMPLOYEE);
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setCompany(profile);
  }, [profile]);

  const tabs = useMemo(() => {
    const list = [
      { id: 'empresa', label: 'Empresa', icon: Building2 },
      { id: 'equipe', label: 'Equipe', icon: Users }
    ];
    if (isAdmin && cloudMode) list.push({ id: 'acessos', label: 'Acessos', icon: ShieldCheck });
    if (isAdmin) list.push({ id: 'dados', label: 'Dados', icon: DatabaseBackup });
    return list;
  }, [isAdmin, cloudMode]);

  // ---------------------------------------------------------
  // Empresa
  // ---------------------------------------------------------

  const handleSaveCompany = async (event) => {
    event.preventDefault();
    if (company.email && !isValidEmail(company.email)) {
      toast.error('Informe um e-mail válido.');
      return;
    }
    setSavingCompany(true);
    try {
      await saveProfile({
        ...company,
        warrantyDays: Number(company.warrantyDays) || 90,
        ratePerHour: Number(company.ratePerHour) || 0
      });
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível salvar as configurações.');
    } finally {
      setSavingCompany(false);
    }
  };

  // ---------------------------------------------------------
  // Equipe
  // ---------------------------------------------------------

  const openEmployee = (employee) => {
    setEmployeeForm(employee ? { ...employee, phone: formatPhoneBR(employee.phone) } : EMPTY_EMPLOYEE);
    setEditingEmployee(employee || {});
  };

  const handleSaveEmployee = async (event) => {
    event.preventDefault();
    if (!employeeForm.name.trim()) {
      toast.error('Informe o nome do montador.');
      return;
    }
    if (employeeForm.email && !isValidEmail(employeeForm.email)) {
      toast.error('E-mail inválido.');
      return;
    }

    setBusy(true);
    try {
      await saveEmployee({
        ...(editingEmployee?.id ? { id: editingEmployee.id } : {}),
        ...employeeForm,
        commissionRate: Math.min(100, Math.max(0, Number(employeeForm.commissionRate) || 0))
      });
      setEditingEmployee(null);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteEmployee = async (employee) => {
    const ok = await confirm({
      title: `Remover ${employee.name}?`,
      message: 'As ordens já atribuídas a ele continuam no histórico.',
      confirmLabel: 'Remover'
    });
    if (ok) await deleteEmployee(employee.id);
  };

  // ---------------------------------------------------------
  // Acessos (somente nuvem)
  // ---------------------------------------------------------

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      setAccounts(snapshot.docs.map((d) => ({ uid: d.id, ...d.data() })));
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível carregar as contas.');
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (tab === 'acessos' && cloudMode) loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, cloudMode]);

  const changeRole = async (account, role) => {
    try {
      await updateDoc(doc(db, 'users', account.uid), { role, active: role !== ROLES.PENDING });
      toast.success(`${account.email} agora é ${role}.`);
      loadAccounts();
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível alterar o papel deste usuário.');
    }
  };

  const revokeAccount = async (account) => {
    const ok = await confirm({
      title: `Revogar o acesso de ${account.email}?`,
      message: 'A pessoa perde o acesso imediatamente. O login continua existindo, mas sem permissão.',
      confirmLabel: 'Revogar'
    });
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'users', account.uid));
      toast.success('Acesso revogado.');
      loadAccounts();
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível revogar o acesso.');
    }
  };

  // ---------------------------------------------------------
  // Backup
  // ---------------------------------------------------------

  const handleExport = async () => {
    setBusy(true);
    try {
      const data = await Database.exportAll();
      downloadFile(`montae-backup-${todayISO()}.json`, JSON.stringify(data, null, 2));
      toast.success('Backup gerado com sucesso.');
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível gerar o backup.');
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const ok = await confirm({
      title: 'Restaurar backup?',
      message:
        'Os registros do arquivo serão gravados por cima dos atuais (mesmo id). Registros novos são adicionados.',
      confirmLabel: 'Restaurar',
      danger: false
    });
    if (!ok) return;

    setBusy(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object') throw new Error('Arquivo inválido');
      await Database.importAll(data);
      toast.success('Backup restaurado.');
    } catch (error) {
      console.error(error);
      toast.error('Arquivo de backup inválido ou corrompido.');
    } finally {
      setBusy(false);
    }
  };

  const handleRestoreSample = async () => {
    const ok = await confirm({
      title: 'Restaurar dados de exemplo?',
      message: 'Os registros de demonstração voltam ao sistema. Seus dados atuais são mantidos.',
      confirmLabel: 'Restaurar',
      danger: false
    });
    if (!ok) return;
    setBusy(true);
    try {
      await Database.restoreSampleData();
      toast.success('Dados de exemplo restaurados.');
    } finally {
      setBusy(false);
    }
  };

  const handleWipe = async () => {
    const ok = await confirm({
      title: 'Apagar todos os registros?',
      message:
        'Ordens, clientes, montadores e lançamentos financeiros serão excluídos. Gere um backup antes. Esta ação não pode ser desfeita.',
      confirmLabel: 'Apagar tudo'
    });
    if (!ok) return;

    const sure = await confirm({
      title: 'Tem certeza absoluta?',
      message: 'Esta é a última confirmação antes de apagar todos os dados operacionais.',
      confirmLabel: 'Sim, apagar'
    });
    if (!sure) return;

    setBusy(true);
    try {
      await Database.clearOperationalData();
      toast.success('Registros apagados.');
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível apagar os dados.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-sub">
            Dados da empresa, equipe de montadores, permissões de acesso e backup do sistema.
          </p>
        </div>
      </div>

      <div className="segmented mb-20">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`segment ${tab === item.id ? 'is-active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              <Icon size={13} style={{ display: 'inline', verticalAlign: -2, marginRight: 5 }} aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* ---------------- Empresa ---------------- */}
      {tab === 'empresa' && (
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">
              <Building2 size={17} aria-hidden="true" />
              Dados da empresa
            </h2>
            <span className={`badge ${cloudMode ? 'badge-ok' : 'badge-warn'}`}>
              {cloudMode ? <Cloud size={11} aria-hidden="true" /> : <HardDrive size={11} aria-hidden="true" />}
              {cloudMode ? 'Nuvem (Firebase)' : 'Somente neste aparelho'}
            </span>
          </div>

          <form onSubmit={handleSaveCompany}>
            <div className="card-body">
              <div className="grid-2">
                <div className="field">
                  <label className="label" htmlFor="st-name">
                    Responsável
                  </label>
                  <input
                    id="st-name"
                    className="input"
                    value={company.name || ''}
                    onChange={(e) => setCompany((c) => ({ ...c, name: e.target.value }))}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="st-company">
                    Nome da empresa
                  </label>
                  <input
                    id="st-company"
                    className="input"
                    value={company.company || ''}
                    onChange={(e) => setCompany((c) => ({ ...c, company: e.target.value }))}
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label className="label" htmlFor="st-email">
                    E-mail
                  </label>
                  <input
                    id="st-email"
                    type="email"
                    className="input"
                    value={company.email || ''}
                    onChange={(e) => setCompany((c) => ({ ...c, email: e.target.value }))}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="st-phone">
                    WhatsApp
                  </label>
                  <input
                    id="st-phone"
                    className="input"
                    value={company.phone || ''}
                    onChange={(e) => setCompany((c) => ({ ...c, phone: formatPhoneBR(e.target.value) }))}
                    disabled={!isAdmin}
                    inputMode="tel"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label className="label" htmlFor="st-slogan">
                    Slogan
                  </label>
                  <input
                    id="st-slogan"
                    className="input"
                    value={company.slogan || ''}
                    onChange={(e) => setCompany((c) => ({ ...c, slogan: e.target.value }))}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="st-city">
                    Região de atendimento
                  </label>
                  <input
                    id="st-city"
                    className="input"
                    value={company.city || ''}
                    onChange={(e) => setCompany((c) => ({ ...c, city: e.target.value }))}
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              <div className="grid-3">
                <div className="field">
                  <label className="label" htmlFor="st-pix">
                    Chave Pix
                  </label>
                  <input
                    id="st-pix"
                    className="input"
                    value={company.pixKey || ''}
                    onChange={(e) => setCompany((c) => ({ ...c, pixKey: e.target.value }))}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="st-warranty">
                    Garantia (dias)
                  </label>
                  <input
                    id="st-warranty"
                    type="number"
                    min="0"
                    max="365"
                    className="input"
                    value={company.warrantyDays ?? 90}
                    onChange={(e) => setCompany((c) => ({ ...c, warrantyDays: e.target.value }))}
                    disabled={!isAdmin}
                  />
                  <span className="field-hint">Usado no termo do comprovante.</span>
                </div>
                <div className="field">
                  <label className="label" htmlFor="st-rate">
                    Valor da hora (R$)
                  </label>
                  <input
                    id="st-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    value={company.ratePerHour ?? 0}
                    onChange={(e) => setCompany((c) => ({ ...c, ratePerHour: e.target.value }))}
                    disabled={!isAdmin}
                  />
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="card-foot" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={savingCompany}>
                  {savingCompany ? <span className="spinner" /> : <Check size={16} aria-hidden="true" />}
                  Salvar alterações
                </button>
              </div>
            )}
          </form>
        </section>
      )}

      {/* ---------------- Equipe ---------------- */}
      {tab === 'equipe' && (
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">
              <Users size={17} aria-hidden="true" />
              Montadores ({employees.length})
            </h2>
            {isAdmin && (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => openEmployee(null)}>
                <Plus size={14} aria-hidden="true" />
                Novo montador
              </button>
            )}
          </div>

          <div className="card-body">
            {employees.length === 0 ? (
              <div className="empty">
                <div className="empty-icon" aria-hidden="true">
                  <Users size={22} />
                </div>
                <h4>Nenhum montador cadastrado</h4>
                <p>Cadastre a equipe para distribuir as ordens e calcular comissões.</p>
              </div>
            ) : (
              <div className="stack-sm">
                {employees.map((employee) => (
                  <div key={employee.id} className="tile">
                    <div style={{ minWidth: 0 }}>
                      <div className="row" style={{ gap: 7, flexWrap: 'wrap' }}>
                        <span className="tile-title">{employee.name}</span>
                        <span className="badge badge-brand">{employee.commissionRate}% comissão</span>
                        {employee.active === false && <span className="badge badge-mute">Inativo</span>}
                      </div>
                      <div className="tile-sub truncate">
                        {employee.role}
                        {employee.phone ? ` · ${formatPhoneBR(employee.phone)}` : ''}
                        {employee.email ? ` · ${employee.email}` : ''}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="row" style={{ gap: 5, flexShrink: 0 }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon btn-sm"
                          onClick={() => openEmployee(employee)}
                          aria-label={`Editar ${employee.name}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon btn-sm"
                          onClick={() => handleDeleteEmployee(employee)}
                          aria-label={`Remover ${employee.name}`}
                        >
                          <Trash2 size={14} color="var(--bad)" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------------- Acessos ---------------- */}
      {tab === 'acessos' && (
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">
              <ShieldCheck size={17} aria-hidden="true" />
              Contas com acesso
            </h2>
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadAccounts} disabled={loadingAccounts}>
              <RefreshCw size={14} aria-hidden="true" />
              Atualizar
            </button>
          </div>

          <div className="card-body">
            <p className="fs-12 muted mb-16">
              Quem se cadastra entra como <strong>pendente</strong> e não vê nenhum dado até você
              liberar. Montadores não têm acesso ao financeiro.
            </p>

            {loadingAccounts ? (
              <div className="stack-sm">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="skeleton" style={{ height: 58 }} />
                ))}
              </div>
            ) : accounts.length === 0 ? (
              <div className="empty">
                <p>Nenhuma conta encontrada.</p>
              </div>
            ) : (
              <div className="stack-sm">
                {accounts.map((account) => (
                  <div key={account.uid} className="tile">
                    <div style={{ minWidth: 0 }}>
                      <div className="row" style={{ gap: 7, flexWrap: 'wrap' }}>
                        <span className="tile-title truncate">{account.displayName || account.email}</span>
                        {account.uid === user?.uid && <span className="badge badge-info">Você</span>}
                        {!account.active && <span className="badge badge-warn">Pendente</span>}
                      </div>
                      <div className="tile-sub truncate">{account.email}</div>
                    </div>

                    <div className="row" style={{ gap: 6, flexShrink: 0 }}>
                      <select
                        className="select select-sm"
                        style={{ width: 'auto' }}
                        value={account.role || ROLES.PENDING}
                        onChange={(e) => changeRole(account, e.target.value)}
                        disabled={account.uid === user?.uid}
                        aria-label={`Papel de ${account.email}`}
                      >
                        <option value={ROLES.PENDING}>Pendente</option>
                        <option value={ROLES.ASSEMBLER}>Montador</option>
                        <option value={ROLES.ADMIN}>Administrador</option>
                      </select>

                      {account.uid !== user?.uid && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon btn-sm"
                          onClick={() => revokeAccount(account)}
                          aria-label={`Revogar ${account.email}`}
                        >
                          <Trash2 size={14} color="var(--bad)" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------------- Dados ---------------- */}
      {tab === 'dados' && (
        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">
                <DatabaseBackup size={17} aria-hidden="true" />
                Backup e restauração
              </h2>
            </div>
            <div className="card-body">
              <p className="fs-13 text-2 mb-16">
                O backup salva um arquivo <code>.json</code> com clientes, ordens, montadores,
                lançamentos e configurações. Guarde-o no Drive ou no e-mail — é a sua garantia contra
                perda de dados.
              </p>

              <div className="row-wrap">
                <button type="button" className="btn btn-primary" onClick={handleExport} disabled={busy}>
                  <Download size={16} aria-hidden="true" />
                  Baixar backup
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                >
                  <Upload size={16} aria-hidden="true" />
                  Restaurar backup
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImport}
                  className="sr-only"
                  aria-label="Selecionar arquivo de backup"
                />
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2 className="card-title">
                <UserCheck size={17} aria-hidden="true" />
                Manutenção
              </h2>
            </div>
            <div className="card-body">
              <div className="row-between mb-16" style={{ gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="strong fs-13">Restaurar dados de exemplo</div>
                  <div className="fs-12 muted">
                    Repõe os registros de demonstração para testar o sistema.
                  </div>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleRestoreSample} disabled={busy}>
                  Restaurar
                </button>
              </div>

              <hr className="divider" />

              <div className="row-between" style={{ gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="strong fs-13" style={{ color: 'var(--bad)' }}>
                    Apagar todos os registros
                  </div>
                  <div className="fs-12 muted">
                    Remove ordens, clientes, montadores e lançamentos. Gere um backup antes.
                  </div>
                </div>
                <button type="button" className="btn btn-danger btn-sm" onClick={handleWipe} disabled={busy}>
                  <Trash2 size={14} aria-hidden="true" />
                  Apagar
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Modal de montador */}
      {editingEmployee && (
        <Modal
          title={editingEmployee.id ? 'Editar montador' : 'Novo montador'}
          icon={Users}
          size="sm"
          onClose={() => setEditingEmployee(null)}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingEmployee(null)}>
                Cancelar
              </button>
              <button type="submit" form="employee-form" className="btn btn-primary" disabled={busy}>
                {busy ? <span className="spinner" /> : <Check size={16} aria-hidden="true" />}
                Salvar
              </button>
            </>
          }
        >
          <form id="employee-form" onSubmit={handleSaveEmployee} noValidate>
            <div className="field">
              <label className="label" htmlFor="em-name">
                Nome <span className="req">*</span>
              </label>
              <input
                id="em-name"
                className="input"
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm((c) => ({ ...c, name: e.target.value }))}
                placeholder="Ex.: Carlos Eduardo"
              />
            </div>

            <div className="grid-2">
              <div className="field">
                <label className="label" htmlFor="em-phone">
                  WhatsApp
                </label>
                <input
                  id="em-phone"
                  className="input"
                  value={employeeForm.phone}
                  onChange={(e) => setEmployeeForm((c) => ({ ...c, phone: formatPhoneBR(e.target.value) }))}
                  inputMode="tel"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="em-email">
                  E-mail
                </label>
                <input
                  id="em-email"
                  type="email"
                  className="input"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm((c) => ({ ...c, email: e.target.value }))}
                />
                <span className="field-hint">Liga a conta de login a este montador.</span>
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label className="label" htmlFor="em-role">
                  Função
                </label>
                <input
                  id="em-role"
                  className="input"
                  value={employeeForm.role}
                  onChange={(e) => setEmployeeForm((c) => ({ ...c, role: e.target.value }))}
                  placeholder="Ex.: Montador Especialista"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="em-commission">
                  Comissão (%)
                </label>
                <input
                  id="em-commission"
                  type="number"
                  min="0"
                  max="100"
                  className="input"
                  value={employeeForm.commissionRate}
                  onChange={(e) => setEmployeeForm((c) => ({ ...c, commissionRate: e.target.value }))}
                />
              </div>
            </div>

            <label className={`check ${employeeForm.active ? 'is-on' : ''}`}>
              <input
                type="checkbox"
                checked={Boolean(employeeForm.active)}
                onChange={(e) => setEmployeeForm((c) => ({ ...c, active: e.target.checked }))}
              />
              <span>Montador ativo (aparece na lista de atribuição)</span>
            </label>
          </form>
        </Modal>
      )}
    </div>
  );
}
