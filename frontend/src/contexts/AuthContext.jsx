import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../apis/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('neo_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục phiên đăng nhập khi load trang
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('neo_token');
      const savedUser = localStorage.getItem('neo_user');

      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        } catch {
          localStorage.removeItem('neo_token');
          localStorage.removeItem('neo_user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    const res = await authApi.login({ identifier, password });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('neo_token', res.token);
      localStorage.setItem('neo_user', JSON.stringify(res.user));
    }
    return res;
  };

  const register = async (nickname, email, password) => {
    const res = await authApi.register({ nickname, email, password });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('neo_token', res.token);
      localStorage.setItem('neo_user', JSON.stringify(res.user));
    }
    return res;
  };

  const guestLogin = async () => {
    const res = await authApi.guestLogin();
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('neo_token', res.token);
      localStorage.setItem('neo_user', JSON.stringify(res.user));
    }
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('neo_token');
    localStorage.removeItem('neo_user');
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
        logout,
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
