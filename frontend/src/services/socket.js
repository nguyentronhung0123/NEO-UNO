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
      try {
        const userStr =
          localStorage.getItem('neo_user') || sessionStorage.getItem('neo_user');
        if (userStr) {
          const u = JSON.parse(userStr);
          const uid = u?.id || u?._id;
          if (uid && u.role !== 'guest') {
            socket.emit('user:register', {
              userId: uid,
              user: {
                id: uid,
                nickname: u.nickname || u.name,
                avatar: u.avatar,
                elo: u.elo,
                level: u.level,
              },
            });
            console.log('[SocketClient] 👤 Đã tự động tái đăng ký User Presence sau kết nối:', u.nickname);
          }
        }
      } catch (err) {
        console.warn('Lỗi re-register presence:', err);
      }
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
