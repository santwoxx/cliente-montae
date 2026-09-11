import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { LicenseProvider } from './context/LicenseContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
import { AuthService } from './services/auth.js';
import './styles/index.css';

const CURRENT_VERSION = '1.0.1';
if (localStorage.getItem('app_version') !== CURRENT_VERSION) {
  localStorage.setItem('app_version', CURRENT_VERSION);
  AuthService.signOut().then(() => {
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <LicenseProvider>
          <AuthProvider>
            <DataProvider>
              <App />
            </DataProvider>
          </AuthProvider>
        </LicenseProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Service worker: deixa o app abrir instantaneamente e funcionar
// offline. Registrado apenas em produção para não atrapalhar o
// hot reload durante o desenvolvimento.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('[MontaÊ] Service worker não registrado:', error?.message);
    });
  });
}
