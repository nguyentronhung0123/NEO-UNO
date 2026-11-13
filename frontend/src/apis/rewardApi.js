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

export const rewardApi = {
  getWheelStatus: async (userId = null) => {
    try {
      const token = getStoredToken();
      const url = userId
        ? `${API_BASE_URL}/rewards/wheel-status?userId=${encodeURIComponent(userId)}`
        : `${API_BASE_URL}/rewards/wheel-status`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await res.json();
    } catch (err) {
      console.warn('[Reward API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  spinWheel: async ({ isFree = true, userId = null } = {}) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/rewards/spin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isFree, userId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Reward API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  getCheckInStatus: async (userId = null) => {
    try {
      const token = getStoredToken();
      const url = userId
        ? `${API_BASE_URL}/rewards/checkin-status?userId=${encodeURIComponent(userId)}`
        : `${API_BASE_URL}/rewards/checkin-status`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await res.json();
    } catch (err) {
      console.warn('[Reward API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  claimCheckIn: async (userId = null) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/rewards/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Reward API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },
};
