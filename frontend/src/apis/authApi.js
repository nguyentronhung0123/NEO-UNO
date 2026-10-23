// Các hàm gọi API xác thực Backend (Mock & Live Backend)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function safeFetchJson(url, options = {}) {
  try {
    const res = await fetch(url, options);
    let data;
    try {
      data = await res.json();
    } catch {
      data = {
        success: false,
        message: `Máy chủ phản hồi mã ${res.status}: Không thể phân tích cú pháp dữ liệu!`
      };
    }

    if (!res.ok && data && !data.message) {
      data.message = `Lỗi từ máy chủ (HTTP ${res.status})!`;
    }

    return data;
  } catch (error) {
    console.error(`[API Network Error] ${url}:`, error);
    return {
      success: false,
      message: 'Không thể kết nối đến máy chủ Backend (Port 5001)! Vui lòng kiểm tra mạng hoặc khởi động server.',
    };
  }
}

export const authApi = {
  checkHealth: async () => {
    return safeFetchJson(`${API_BASE_URL}/health`);
  },

  login: async ({ identifier, password }) => {
    return safeFetchJson(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
  },

  register: async ({ nickname, email, password }) => {
    return safeFetchJson(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, email, password }),
    });
  },

  guestLogin: async () => {
    return safeFetchJson(`${API_BASE_URL}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  },

  getMe: async (token) => {
    return safeFetchJson(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  },

  forgotPassword: async ({ email }) => {
    return safeFetchJson(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  },

  verifyOtp: async ({ email, otp }) => {
    return safeFetchJson(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
  },

  resetPassword: async ({ email, otp, newPassword }) => {
    return safeFetchJson(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },
};
