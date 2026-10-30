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

export const questApi = {
  // 1. Lấy danh sách nhiệm vụ hôm nay & đồng hồ đếm ngược reset
  getDailyQuests: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/quests`, {
        headers: authHeaders(),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Quest API Error - getDailyQuests]:', err.message);
      return { success: false, message: err.message, quests: [] };
    }
  },

  // 2. Nhận phần thưởng nhiệm vụ hằng ngày
  claimQuest: async (questId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/quests/claim`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ questId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Quest API Error - claimQuest]:', err.message);
      return { success: false, message: 'Lỗi mạng khi nhận thưởng nhiệm vụ!' };
    }
  },

  // 3. Mở rương chiến tích ngày khi hoàn thành toàn bộ nhiệm vụ
  claimDailyChest: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/quests/claim-chest`, {
        method: 'POST',
        headers: authHeaders(),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Quest API Error - claimDailyChest]:', err.message);
      return { success: false, message: 'Lỗi mạng khi mở Rương Ngày!' };
    }
  },

  // 4. Lấy danh sách thành tựu dài hạn & tiến độ mở khóa huy hiệu
  getAchievements: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/quests/achievements`, {
        headers: authHeaders(),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Quest API Error - getAchievements]:', err.message);
      return { success: false, message: err.message, achievements: [] };
    }
  },

  // 5. Nhận thưởng thành tựu
  claimAchievement: async (achievementId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/quests/achievements/claim`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ achievementId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Quest API Error - claimAchievement]:', err.message);
      return { success: false, message: 'Lỗi mạng khi nhận thưởng thành tựu!' };
    }
  },
};
