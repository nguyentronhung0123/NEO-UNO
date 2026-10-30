/**
 * Service Worker cho NEO-UNO PWA
 * Hỗ trợ Offline Shell, Tải Nhanh (Instant Load) & Quản lý Bộ Nhớ Đệm
 */

const CACHE_NAME = 'neo-uno-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

// 1. CÀI ĐẶT SERVICE WORKER & LƯU SHELL TĨNH VÀO CACHE
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] 📦 Đang nạp trước bộ nhớ đệm Shell tĩnh cho NEO-UNO...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. KÍCH HOẠT SERVICE WORKER & DỌN DẸP CACHE PHIÊN BẢN CŨ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] 🧹 Dọn dẹp cache phiên bản cũ:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. ĐIỀU PHỐI YÊU CẦU MẠNG (FETCH STRATEGY)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. BỎ QUA các yêu cầu không phải GET hoặc là API / Socket.io / Hot-reload
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/socket.io') ||
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/@fs/')
  ) {
    return; // Để mạng xử lý trực tiếp thời gian thực
  }

  // B. ĐIỀU HƯỚNG TRANG (HTML NAVIGATION): Network-first fallback to Cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // C. TÀI NGUYÊN TĨNH (CSS, JS, Fonts, Images): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Bỏ qua lỗi mạng nền nếu đã có cache
        });

      return cachedResponse || fetchPromise;
    })
  );
});
