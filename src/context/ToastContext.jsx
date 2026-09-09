// ============================================================
// MontaÊ - Avisos e confirmações
//
// Substitui alert() e confirm() do navegador, que travam a tela,
// não funcionam bem em celular e destoam da identidade visual.
// ============================================================

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message, options = {}) => {
      const id = ++idRef.current;
      const toast = { id, type, message, title: options.title };
      setToasts((current) => [...current.slice(-3), toast]);
      const duration = options.duration ?? (type === 'error' ? 6000 : 3800);
      setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (message, options) => push('success', message, options),
      error: (message, options) => push('error', message, options),
      warning: (message, options) => push('warning', message, options),
      info: (message, options) => push('info', message, options)
    }),
    [push]
  );

  /** Confirmação em Promise: `if (await confirm({...})) { ... }` */
  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmState({
        title: options.title || 'Confirmar ação',
        message: options.message || '',
        confirmLabel: options.confirmLabel || 'Confirmar',
        cancelLabel: options.cancelLabel || 'Cancelar',
        danger: options.danger !== false,
        resolve
      });
    });
  }, []);

  const closeConfirm = useCallback(
    (result) => {
      setConfirmState((current) => {
        if (current) current.resolve(result);
        return null;
      });
    },
    []
  );

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((item) => {
          const Icon = ICONS[item.type] || Info;
          return (
            <div key={item.id} className={`toast toast-${item.type}`}>
              <Icon size={18} className="toast-icon" aria-hidden="true" />
              <div className="toast-body">
                {item.title && <strong className="toast-title">{item.title}</strong>}
                <span>{item.message}</span>
              </div>
              <button
                type="button"
                className="toast-close"
                onClick={() => dismiss(item.id)}
                aria-label="Fechar aviso"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {confirmState && (
        <div
          className="modal-overlay"
          onClick={() => closeConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body confirm-body">
              <div className={`confirm-icon ${confirmState.danger ? 'is-danger' : 'is-info'}`}>
                <AlertTriangle size={24} aria-hidden="true" />
              </div>
              <h3 id="confirm-title" className="confirm-title">
                {confirmState.title}
              </h3>
              {confirmState.message && <p className="confirm-message">{confirmState.message}</p>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => closeConfirm(false)}>
                {confirmState.cancelLabel}
              </button>
              <button
                type="button"
                className={`btn ${confirmState.danger ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => closeConfirm(true)}
                autoFocus
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast precisa estar dentro de <ToastProvider>');
  return context;
}
