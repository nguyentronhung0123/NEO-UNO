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

export const matchApi = {
  recordMatch: async (payload) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/matches/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Match API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  getMatchHistory: async (limit = 10) => {
    try {
      const res = await fetch(`${API_BASE_URL}/matches/history?limit=${limit}`);
      return await res.json();
    } catch (err) {
      console.warn('[Match History API Error]:', err.message);
      return { success: false, matches: [] };
    }
  },

  getMyMatchHistory: async ({ limit = 20, page = 1, filter = 'all', mode = 'all', userId = null } = {}) => {
    try {
      const token = getStoredToken();
      const params = new URLSearchParams({
        limit,
        page,
        filter,
        mode,
        ...(userId ? { userId } : {}),
      });
      const res = await fetch(`${API_BASE_URL}/matches/my-history?${params.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await res.json();
    } catch (err) {
      console.warn('[My Match History API Error]:', err.message);
      return { success: false, matches: [], summary: null };
    }
  },

  getLeaderboard: async (limit = 10) => {
    try {
      const res = await fetch(`${API_BASE_URL}/leaderboard?limit=${limit}`);
      return await res.json();
    } catch (err) {
      console.warn('[Leaderboard API Error]:', err.message);
      return { success: false, leaderboard: [] };
    }
  },
};
