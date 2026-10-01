import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent Vite development HMR WebSocket closed without opened unhandled rejections
if (typeof window !== 'undefined') {
  const isViteOrWsNoise = (msg: string) => {
    return (
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('ws://') ||
      msg.includes('wss://') ||
      msg.includes('[vite]') ||
      msg.includes('vite-plugin-pwa')
    );
  };

  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const combined = args.map((a) => (typeof a === 'string' ? a : a?.message || '')).join(' ');
    if (isViteOrWsNoise(combined)) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason || '');
    if (isViteOrWsNoise(msg)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (isViteOrWsNoise(msg)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
