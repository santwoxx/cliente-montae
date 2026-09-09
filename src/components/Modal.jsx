// ============================================================
// MontaÊ - Base de todos os modais
//
// Centraliza o que antes estava repetido em cada tela: fechar com
// Esc, travar a rolagem do fundo, devolver o foco ao final e não
// fechar quando o clique começa dentro e termina fora.
// ============================================================

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  title,
  subtitle,
  icon: Icon,
  size = 'md',
  onClose,
  children,
  footer,
  closeOnOverlay = true,
  bodyClassName = 'modal-body'
}) {
  const contentRef = useRef(null);
  const pointerInsideRef = useRef(false);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [onClose]);

  const sizeClass = size === 'sm' ? 'modal-sm' : size === 'lg' ? 'modal-lg' : '';

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : undefined}
      onMouseDown={() => {
        pointerInsideRef.current = false;
      }}
      onClick={() => {
        // Evita fechar quando o usuário arrasta a seleção de dentro para fora.
        if (closeOnOverlay && !pointerInsideRef.current) onClose?.();
      }}
    >
      <div
        ref={contentRef}
        className={`modal-content ${sizeClass}`}
        onMouseDown={(e) => {
          e.stopPropagation();
          pointerInsideRef.current = true;
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <div className="row" style={{ minWidth: 0 }}>
              {Icon && (
                <div className="stat-icon t-brand" aria-hidden="true">
                  <Icon size={18} />
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <h3 className="modal-title">{title}</h3>
                {subtitle && <p className="modal-subtitle">{subtitle}</p>}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={onClose}
              aria-label="Fechar"
            >
              <X size={19} />
            </button>
          </div>
        )}

        <div className={bodyClassName}>{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
