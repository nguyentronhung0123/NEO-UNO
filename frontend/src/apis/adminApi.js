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

export const adminApi = {
  // 1. Thống kê Dashboard & Cảnh báo an ninh
  getDashboardStats: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: authHeaders(),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Admin API Error - getDashboardStats]:', err.message);
      return { success: false, message: err.message };
    }
  },

  // 2. Danh sách người chơi & bộ lọc chống gian lận
  getUsers: async ({ page = 1, limit = 15, search = '', filter = 'all' } = {}) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        filter,
      });
      const res = await fetch(`${API_BASE_URL}/admin/users?${params.toString()}`, {
        headers: authHeaders(),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Admin API Error - getUsers]:', err.message);
      return { success: false, message: err.message };
    }
  },

  // 3. Khóa tài khoản người dùng
  banUser: async ({ userId, reason }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/user/ban`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId, reason }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Admin API Error - banUser]:', err.message);
      return { success: false, message: err.message };
    }
  },

  // 4. Mở khóa tài khoản
  unbanUser: async ({ userId }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/user/unban`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Admin API Error - unbanUser]:', err.message);
      return { success: false, message: err.message };
    }
  },

  // 5. Điều chỉnh số dư Vàng & Điểm ELO
  adjustBalance: async ({ userId, coinAdjustment, eloAdjustment, reason }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/user/adjust`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId, coinAdjustment, eloAdjustment, reason }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Admin API Error - adjustBalance]:', err.message);
      return { success: false, message: err.message };
    }
  },

  // 6. Phân quyền vai trò (player / admin)
  setUserRole: async ({ userId, role }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/user/role`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId, role }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Admin API Error - setUserRole]:', err.message);
      return { success: false, message: err.message };
    }
  },

  // 7. Gỡ cờ cảnh báo nghi vấn
  clearUserFlag: async ({ userId }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/user/clear-flag`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Admin API Error - clearUserFlag]:', err.message);
      return { success: false, message: err.message };
    }
  },

  // 8. Nhật ký an ninh & kiểm toán (Audit Logs)
  getSecurityLogs: async ({ page = 1, limit = 20, severity = 'all', action = 'all' } = {}) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        severity,
        action,
      });
      const res = await fetch(`${API_BASE_URL}/admin/logs?${params.toString()}`, {
        headers: authHeaders(),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Admin API Error - getSecurityLogs]:', err.message);
      return { success: false, message: err.message };
    }
  },
};
