import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Tự động tải lại trang 1 lần nếu phát hiện chunk JS cũ bị lỗi sau khi deploy bản mới
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  try {
    const lastReload = Number(sessionStorage.getItem('neo_chunk_reload_at') || '0');
    if (Date.now() - lastReload > 10000) {
      sessionStorage.setItem('neo_chunk_reload_at', String(Date.now()));
      window.location.reload();
    }
  } catch {
    window.location.reload();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Đăng ký Service Worker cho Progressive Web App (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] ✅ Service Worker đã đăng ký thành công:', reg.scope);
        reg.update().catch(() => {});
      })
      .catch((err) => {
        console.warn('[PWA] ⚠️ Lỗi đăng ký Service Worker:', err);
      });
  });
}
