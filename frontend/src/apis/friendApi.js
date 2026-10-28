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
  // 1. Lấy danh sách bạn bè đã kết bạn (sử dụng Aggregation Pipeline từ server)
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

  // 3. Gửi lời mời kết bạn (hỗ trợ cả Tên Nickname và ID tài khoản)
  sendFriendRequest: async ({ targetUserId, nickname, identifier }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/friends/request`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ targetUserId, nickname, identifier }),
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

  // 5. Hủy kết bạn (Unfriend)
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

  // 6. Tìm kiếm người chơi theo Nickname hoặc ID tài khoản
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

  // 7. Lấy lịch sử tin nhắn trực tiếp giữa 2 bạn bè (Direct Chat - Task 2)
  getDirectMessages: async (friendId, options = {}) => {
    try {
      const params = new URLSearchParams(options);
      const res = await fetch(`${API_BASE_URL}/friends/messages/${friendId}?${params.toString()}`, {
        headers: authHeaders(),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Friend API Error - getDirectMessages]:', err.message);
      return { success: false, messages: [] };
    }
  },

  // 8. Gửi tin nhắn trực tiếp cho bạn bè (Direct Chat - Task 2)
  sendDirectMessage: async (friendId, content) => {
    try {
      const res = await fetch(`${API_BASE_URL}/friends/messages/${friendId}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ content }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Friend API Error - sendDirectMessage]:', err.message);
      return { success: false, message: 'Lỗi mạng khi gửi tin nhắn!' };
    }
  },
};
