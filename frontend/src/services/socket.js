import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '/';
    socket = io(serverUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[SocketClient] 🟢 Đã kết nối Socket Server thành công:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[SocketClient] 🔴 Mất kết nối Socket:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('[SocketClient] ⚠️ Lỗi kết nối Socket:', error.message);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
