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

export const guildApi = {
  getGuilds: async (search = '') => {
    try {
      const token = getStoredToken();
      const url = search
        ? `${API_BASE_URL}/guilds?search=${encodeURIComponent(search)}`
        : `${API_BASE_URL}/guilds`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await res.json();
    } catch (err) {
      console.warn('[Guild API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  getMyGuild: async (userId = null) => {
    try {
      const token = getStoredToken();
      const url = userId
        ? `${API_BASE_URL}/guilds/my-guild?userId=${encodeURIComponent(userId)}`
        : `${API_BASE_URL}/guilds/my-guild`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await res.json();
    } catch (err) {
      console.warn('[Guild API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  getLeaderboard: async () => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/guilds/leaderboard`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await res.json();
    } catch (err) {
      console.warn('[Guild API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  createGuild: async ({ name, tag, slogan, emblem, userId = null }) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/guilds/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, tag, slogan, emblem, userId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Guild API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  joinGuild: async (guildId, userId = null) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/guilds/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ guildId, userId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Guild API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  leaveGuild: async (userId = null) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/guilds/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Guild API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  donate: async (amount, userId = null) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/guilds/donate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amount, userId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Guild API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  sendChatMessage: async (message, userId = null) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/guilds/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message, userId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Guild API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },
};
