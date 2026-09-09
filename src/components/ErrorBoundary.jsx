// ============================================================
// MontaÊ - Barreira de erro
//
// Sem isso, qualquer exceção em uma tela deixava a página em
// branco no celular do montador, sem explicação nem saída.
// ============================================================

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[MontaÊ] Erro na interface:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="splash">
        <div className="card card-pad" style={{ maxWidth: 460 }}>
          <div className="confirm-icon is-danger">
            <AlertTriangle size={24} aria-hidden="true" />
          </div>
          <h2 className="confirm-title">Algo deu errado nesta tela</h2>
          <p className="confirm-message mb-16">
            Seus dados estão salvos. Recarregue a página para continuar de onde parou.
          </p>
          <button type="button" className="btn btn-primary btn-block" onClick={() => window.location.reload()}>
            <RotateCcw size={16} aria-hidden="true" />
            Recarregar o sistema
          </button>
          <details className="mt-16">
            <summary className="muted fs-12" style={{ cursor: 'pointer' }}>
              Detalhes técnicos
            </summary>
            <pre className="muted fs-11 mt-8" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
