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

export const profileApi = {
  getProfile: async (userId) => {
    try {
      const token = getStoredToken();
      const targetId = userId || 'me';
      const res = await fetch(`${API_BASE_URL}/profile/${encodeURIComponent(targetId)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await res.json();
    } catch (err) {
      console.warn('[Profile API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  equipTitle: async ({ titleId, userId = null }) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/profile/equip-title`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ titleId, userId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Profile API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },
};
