/**
 * Service Worker cho NEO-UNO PWA (v2 - Fix Mobile Cache & Cross-Origin)
 * Đảm bảo không phục vụ index.html cũ trỏ tới JS hash đã bị xóa sau mỗi lần deploy.
 */

const CACHE_NAME = 'neo-uno-cache-v2';
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

// 1. CÀI ĐẶT SERVICE WORKER & LƯU ICON/MANIFEST TĨNH
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch((err) => {
        console.warn('[SW] ⚠️ Bỏ qua lỗi nạp trước một số asset tĩnh:', err);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. KÍCH HOẠT SERVICE WORKER & XÓA SẠCH CACHE CŨ (v1)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              console.log('[SW] 🧹 Dọn dẹp cache phiên bản cũ:', key);
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. ĐIỀU PHỐI YÊU CẦU MẠNG AN TOÀN
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. CHỈ xử lý request GET cùng origin (Bỏ qua hoàn toàn Google Fonts, Google GSI, Render API, Socket.io...)
  if (
    event.request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/socket.io') ||
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/@fs/')
  ) {
    return;
  }

  // B. ĐIỀU HƯỚNG TRANG (HTML NAVIGATION): Luôn ưu tiên mạng (Network-First)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = (await caches.match('/index.html')) || (await caches.match('/'));
        return cached || Response.error();
      })
    );
    return;
  }

  // C. TÀI NGUYÊN TĨNH CÙNG ORIGIN (JS/CSS đã hash, Icon, Ảnh):
  // Luôn ưu tiên mạng hoặc cache có fallback hợp lệ (không bao giờ trả về undefined)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Revalidate ngầm với các file không phải hashed asset
        if (!url.pathname.startsWith('/assets/')) {
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse.clone());
                });
              }
            })
            .catch(() => {});
        }
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      });
    })
  );
});
