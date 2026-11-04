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

export const reportApi = {
  createReport: async ({ targetUserId, matchId, roomCode, reason, description, evidenceTurn }) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          targetUserId,
          matchId,
          roomCode,
          reason,
          description,
          evidenceTurn,
        }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Report API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  getMyReports: async () => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/reports/my-reports`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await res.json();
    } catch (err) {
      console.warn('[Get My Reports Error]:', err.message);
      return { success: false, reports: [] };
    }
  },
};
