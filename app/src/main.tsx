import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/literata/wght.css';
import '@fontsource-variable/literata/wght-italic.css';
import './styles/theme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { hideSplash, isNative } from './lib/native';
import { store } from './lib/storage';

async function boot() {
  await store.load();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  requestAnimationFrame(() => setTimeout(hideSplash, 120));

  if (!isNative() && 'serviceWorker' in navigator && import.meta.env.PROD) {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({ immediate: true });
  }
}

boot();
