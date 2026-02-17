import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { CacheService } from './services/cacheService';
import * as Sentry from "@sentry/react";

// Initialize Caching (Redis if configured)
// Safe access to env to prevent crashes if import.meta.env is undefined
const env = import.meta.env || {};

CacheService.init({
  redisUrl: env.VITE_REDIS_URL,
  redisToken: env.VITE_REDIS_TOKEN
});

// Initialize Sentry Monitoring (if DSN provided)
if (env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);