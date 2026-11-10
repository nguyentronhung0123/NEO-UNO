import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../apis/authApi';
import { disconnectSocket } from '../services/socket';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('neo_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  const saveSession = (newToken, newUser, remember = true) => {
    setToken(newToken);
    setUser(newUser);

    if (remember) {
      localStorage.setItem('neo_token', newToken);
      localStorage.setItem('neo_user', JSON.stringify(newUser));
      sessionStorage.removeItem('neo_token');
      sessionStorage.removeItem('neo_user');
    } else {
      sessionStorage.setItem('neo_token', newToken);
      sessionStorage.setItem('neo_user', JSON.stringify(newUser));
      localStorage.removeItem('neo_token');
      localStorage.removeItem('neo_user');
    }
  };

  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('neo_token');
    localStorage.removeItem('neo_user');
    localStorage.removeItem('neo_online_room');
    sessionStorage.removeItem('neo_token');
    sessionStorage.removeItem('neo_user');
    sessionStorage.removeItem('neo_online_room');
    sessionStorage.removeItem('activeMatchStorage');
  };

  // Khôi phục & Thẩm định phiên đăng nhập khi load trang
  useEffect(() => {
    const initAuth = async () => {
      const savedToken =
        localStorage.getItem('neo_token') || sessionStorage.getItem('neo_token');
      const savedUserStr =
        localStorage.getItem('neo_user') || sessionStorage.getItem('neo_user');

      if (savedToken) {
        try {
          if (savedUserStr) {
            setUser(JSON.parse(savedUserStr));
          }
          setToken(savedToken);

          // Thẩm định token với máy chủ Backend
          const verifyRes = await authApi.getMe(savedToken);
          if (verifyRes.success && verifyRes.user) {
            setUser(verifyRes.user);
          } else {
            console.warn('[Auth] Token không còn hợp lệ hoặc đã hết hạn!');
            clearSession();
          }
        } catch {
          clearSession();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password, remember = true) => {
    const res = await authApi.login({ identifier, password });
    if (res.success && res.token && res.user) {
      saveSession(res.token, res.user, remember);
    }
    return res;
  };

  const register = async (nickname, email, password, remember = true) => {
    const res = await authApi.register({ nickname, email, password });
    if (res.success && res.token && res.user) {
      saveSession(res.token, res.user, remember);
    }
    return res;
  };

  const guestLogin = async () => {
    const res = await authApi.guestLogin();
    if (res.success && res.token && res.user) {
      // Khách chỉ lưu trong sessionStorage
      saveSession(res.token, res.user, false);
    }
    return res;
  };

  const loginWithGoogle = async ({ credential, accessToken, mockUser }, remember = true) => {
    const res = await authApi.googleLogin({ credential, accessToken, mockUser });
    if (res.success && res.token && res.user) {
      saveSession(res.token, res.user, remember);
    }
    return res;
  };

  const logout = () => {
    try {
      if (token) {
        authApi.logout(token).catch(() => {});
      }
      disconnectSocket();
    } catch (err) {
      console.warn('[Auth] Lỗi ngắt socket khi logout:', err);
    }
    clearSession();
  };

  const updateUser = (partialUser) => {
    if (!partialUser || typeof partialUser !== 'object') return;
    setUser((prev) => {
      if (!prev) return prev;
      // Lọc bỏ triệt để các trường undefined để tránh ghi đè làm mất dữ liệu hiện tại (như coins)
      const sanitizedPartial = {};
      Object.keys(partialUser).forEach((key) => {
        if (partialUser[key] !== undefined) {
          sanitizedPartial[key] = partialUser[key];
        }
      });
      const updated = { ...prev, ...sanitizedPartial };
      try {
        if (localStorage.getItem('neo_user')) {
          localStorage.setItem('neo_user', JSON.stringify(updated));
        } else if (sessionStorage.getItem('neo_user')) {
          sessionStorage.setItem('neo_user', JSON.stringify(updated));
        }
      } catch {}
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        guestLogin,
        loginWithGoogle,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
}
