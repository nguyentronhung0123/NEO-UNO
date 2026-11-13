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

export const battlePassApi = {
  getStatus: async (userId = null) => {
    try {
      const token = getStoredToken();
      const url = userId
        ? `${API_BASE_URL}/battlepass/status?userId=${encodeURIComponent(userId)}`
        : `${API_BASE_URL}/battlepass/status`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await res.json();
    } catch (err) {
      console.warn('[BattlePass API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  claimLevel: async ({ level, track, userId = null }) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/battlepass/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ level, track, userId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[BattlePass API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  claimAll: async (userId = null) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/battlepass/claim-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[BattlePass API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  upgradePremium: async (userId = null) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/battlepass/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[BattlePass API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },
};
