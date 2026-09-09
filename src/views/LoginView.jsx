// ============================================================
// MontaÊ - Entrada no sistema
// Login, criação de conta e recuperação de senha.
// ============================================================

import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, User, ArrowLeft, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';
import { describeAuthError } from '../services/auth';
import { isValidEmail } from '../services/calculations';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginView({ onOpenPublicQuote }) {
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState('login'); // login | signup | reset
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const found = {};
    if (!form.email.trim()) found.email = 'Informe seu e-mail.';
    else if (!isValidEmail(form.email)) found.email = 'E-mail inválido.';

    if (mode !== 'reset') {
      if (!form.password) found.password = 'Informe sua senha.';
      else if (form.password.length < 6) found.password = 'Mínimo de 6 caracteres.';
    }
    if (mode === 'signup' && !form.name.trim()) found.name = 'Informe seu nome.';

    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password);
      } else if (mode === 'signup') {
        await signUp(form.name, form.email, form.password);
        toast.success('Conta criada! Aguarde a liberação do administrador.');
      } else {
        await resetPassword(form.email);
        toast.success('Enviamos um link de redefinição para o seu e-mail.');
        setMode('login');
      }
    } catch (error) {
      toast.error(describeAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  const titles = {
    login: { title: 'Acessar o sistema', sub: 'Entre com seu e-mail e senha' },
    signup: { title: 'Criar conta', sub: 'Seu acesso é liberado pelo administrador' },
    reset: { title: 'Recuperar senha', sub: 'Enviaremos um link para o seu e-mail' }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <Logo className="auth-logo" size={62} />
          <div>
            <div className="brand-name" style={{ fontSize: 22 }}>
              Monta<em>Ê</em>
            </div>
            <div className="brand-tag">Monta. Repara. Conecta.</div>
          </div>
        </div>

        <h1 className="auth-title">{titles[mode].title}</h1>
        <p className="auth-sub mb-20">{titles[mode].sub}</p>

        <form onSubmit={handleSubmit} noValidate>
          {mode === 'signup' && (
            <div className="field">
              <label className="label" htmlFor="lg-name">
                Nome completo
              </label>
              <div className="search">
                <User size={16} aria-hidden="true" />
                <input
                  id="lg-name"
                  className={`input ${errors.name ? 'is-invalid' : ''}`}
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Ex.: Marcos Elias"
                  autoComplete="name"
                />
              </div>
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
          )}

          <div className="field">
            <label className="label" htmlFor="lg-email">
              E-mail
            </label>
            <div className="search">
              <Mail size={16} aria-hidden="true" />
              <input
                id="lg-email"
                type="email"
                className={`input ${errors.email ? 'is-invalid' : ''}`}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="voce@email.com"
                autoComplete="email"
                inputMode="email"
              />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          {mode !== 'reset' && (
            <div className="field">
              <label className="label" htmlFor="lg-password">
                Senha
              </label>
              <div className="search">
                <Lock size={16} aria-hidden="true" />
                <input
                  id="lg-password"
                  type="password"
                  className={`input ${errors.password ? 'is-invalid' : ''}`}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-block mt-8" disabled={busy}>
            {busy ? (
              <span className="spinner" />
            ) : mode === 'signup' ? (
              <UserPlus size={17} aria-hidden="true" />
            ) : (
              <LogIn size={17} aria-hidden="true" />
            )}
            {busy
              ? 'Aguarde...'
              : mode === 'login'
                ? 'Entrar'
                : mode === 'signup'
                  ? 'Criar conta'
                  : 'Enviar link'}
          </button>
        </form>

        {mode === 'login' && (
          <button type="button" className="auth-link mt-16" onClick={() => setMode('reset')}>
            Esqueci minha senha
          </button>
        )}

        <div className="auth-switch">
          {mode === 'login' ? (
            <>
              Ainda não tem conta?{' '}
              <button type="button" className="auth-link" onClick={() => setMode('signup')}>
                Criar agora
              </button>
            </>
          ) : (
            <button type="button" className="auth-link" onClick={() => setMode('login')}>
              <ArrowLeft size={13} style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true" />{' '}
              Voltar para o login
            </button>
          )}
        </div>

        {onOpenPublicQuote && (
          <button type="button" className="btn btn-ghost btn-sm btn-block mt-16" onClick={onOpenPublicQuote}>
            <Sparkles size={14} aria-hidden="true" />
            Sou cliente e quero um orçamento
          </button>
        )}

        <p className="auth-foot">MontaÊ · Gestão de montagens, CRM e financeiro</p>
      </div>
    </div>
  );
}
