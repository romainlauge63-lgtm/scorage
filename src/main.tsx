import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Enregistrement PWA automatique (si supporté par le navigateur)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Le mode dev sans SW enregistré continue normalement
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
