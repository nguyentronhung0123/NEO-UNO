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

export const shopApi = {
  // 1. Lấy toàn bộ danh mục Cửa Hàng kèm trạng thái sở hữu & trang bị
  getItems: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/shop/items`, {
        headers: authHeaders(),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Shop API Error - getItems]:', err.message);
      return { success: false, items: [], message: err.message };
    }
  },

  // 2. Mua vật phẩm bằng Vàng
  buyItem: async (itemId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/shop/buy`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ itemId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Shop API Error - buyItem]:', err.message);
      return { success: false, message: 'Lỗi mạng khi kết nối máy chủ Cửa Hàng!' };
    }
  },

  // 3. Trang bị / Thay đổi vật phẩm
  equipItem: async (itemId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/shop/equip`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ itemId }),
      });
      return await res.json();
    } catch (err) {
      console.warn('[Shop API Error - equipItem]:', err.message);
      return { success: false, message: 'Lỗi mạng khi trang bị vật phẩm!' };
    }
  },
};
