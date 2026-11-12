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

export const tournamentApi = {
  joinTournament: async (userPayload = null) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/tournaments/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ user: userPayload }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Tournament API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  getTournament: async (tournamentId) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await res.json();
    } catch (err) {
      console.warn('[Tournament API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  submitMatchResult: async (tournamentId, { matchId, isWin, userCardsLeft, opponentCardsLeft, userId }) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/match-result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ matchId, isWin, userCardsLeft, opponentCardsLeft, userId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Tournament API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },

  claimReward: async (tournamentId, userId) => {
    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/claim-reward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Tournament API Error]:', err.message);
      return { success: false, message: err.message };
    }
  },
};
