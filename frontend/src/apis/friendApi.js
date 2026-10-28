const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getStoredToken = () => {
  try {
    return (
      localStorage.getItem('neo_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('neo_token') ||
      sessionStorage.getItem('token') ||
      null
    );
  } catch {
    return null;
  }
};

const authHeaders = () => {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const friendApi = {
  // 1. Lấy danh sách bạn bè đã kết bạn
  getFriends: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/friends`, {
        headers: authHeaders(),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Friend API Error - getFriends]:', err.message);
      return { success: false, friends: [] };
    }
  },

  // 2. Lấy danh sách lời mời kết bạn (nhận được & đã gửi)
  getFriendRequests: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/friends/requests`, {
        headers: authHeaders(),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Friend API Error - getFriendRequests]:', err.message);
      return { success: false, received: [], sent: [] };
    }
  },

  // 3. Gửi lời mời kết bạn (theo userId hoặc nickname)
  sendFriendRequest: async ({ targetUserId, nickname }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/friends/request`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ targetUserId, nickname }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Friend API Error - sendFriendRequest]:', err.message);
      return { success: false, message: 'Lỗi mạng khi gửi lời mời kết bạn!' };
    }
  },

  // 4. Phản hồi lời mời kết bạn (Chấp nhận / Từ chối)
  respondFriendRequest: async (requestId, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/friends/respond/${requestId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ action }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Friend API Error - respondFriendRequest]:', err.message);
      return { success: false, message: 'Lỗi mạng khi phản hồi kết bạn!' };
    }
  },

  // 5. Hủy kết bạn
  removeFriend: async (friendId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/friends/${friendId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Friend API Error - removeFriend]:', err.message);
      return { success: false, message: 'Lỗi mạng khi hủy kết bạn!' };
    }
  },

  // 6. Tìm kiếm người chơi theo tên để kết bạn
  searchUsers: async (query) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/friends/search?q=${encodeURIComponent(query)}`,
        {
          headers: authHeaders(),
        }
      );
      return await res.json();
    } catch (err) {
      console.warn('[Friend API Error - searchUsers]:', err.message);
      return { success: false, users: [] };
    }
  },
};
