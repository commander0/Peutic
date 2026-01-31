import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { logger } from './services/logger';
import './index.css';

// --- GLOBAL ERROR MIDDLEWARE ---
window.onerror = (message, source, lineno, colno, error) => {
  logger.error("Uncaught Global Exception", `Source: ${source}:${lineno}:${colno}`, error || message);
};

window.onunhandledrejection = (event) => {
  logger.error("Unhandled Promise Rejection", "Async Failure", event.reason);
};
// -------------------------------

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);