import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';

function GameArenaPreview({ onBack }) {
  const { user, logout } = useAuth();

  const handleExit = () => {
    logout();
    onBack();
  };

  return (
    <div className="min-h-screen bg-[#0b0e17] flex flex-col items-center justify-center p-4 text-center text-slate-100 relative overflow-hidden font-body">
      {/* Background Soft Glows */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-container/10 blur-[130px] rounded-full"></div>
      <div className="absolute -bottom-32 left-1/4 w-[400px] h-[400px] bg-secondary-container/15 blur-[140px] rounded-full"></div>

      <div className="relative z-10 max-w-md w-full p-6 sm:p-8 rounded-[28px] bg-[#121622]/90 border border-primary-container/30 shadow-[0_0_50px_rgba(0,210,255,0.2)]">
        {/* User Profile Badge */}
        {user && (
          <div className="mb-6 p-3 rounded-2xl bg-[#191f2d] border border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-3 text-left">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.nickname}`}
                alt="Avatar"
                className="w-11 h-11 rounded-full bg-surface-container-high border border-primary-container/40 p-0.5"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-headline text-sm font-bold text-white">
                    {user.nickname}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-primary-container/20 text-primary-container font-black uppercase">
                    {user.role === 'guest' ? 'Khách' : 'Đấu thủ'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {user.email}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-black text-amber-400 flex items-center justify-end gap-1">
                <span>🪙</span>
                <span>{user.coins || 100}</span>
              </div>
              <div className="text-[10px] text-primary-container font-bold">
                ELO: {user.elo || 1000}
              </div>
            </div>
          </div>
        )}

        {/* Bot Opponent Preview */}
        <span className="material-symbols-outlined text-5xl text-tertiary-container mb-3 animate-bounce">
          smart_toy
        </span>
        <h2 className="text-xl sm:text-2xl font-headline font-black text-white mb-2 tracking-wide uppercase">
          BÀN ĐẤU BOT ARENA (OFFLINE)
        </h2>
        <p className="text-slate-400 mb-6 text-xs leading-relaxed">
          Đã kết nối tài khoản thành công với Backend API! Hệ thống Bot AI v2.8 và bộ bài UNO 108 lá sẵn sàng để bắt đầu xây dựng bàn đấu.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => alert('Sẵn sàng triển khai logic chia bài và bàn đấu UNO!')}
            className="w-full py-3 rounded-full bg-primary-container text-black font-headline text-xs sm:text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:shadow-[0_0_25px_rgba(0,210,255,0.6)] hover:scale-[1.01] transition-all cursor-pointer"
          >
            ⚔️ BẮT ĐẦU CHIA BÀI
          </button>

          <button
            onClick={handleExit}
            className="w-full py-2.5 rounded-full bg-[#1b2230] text-slate-400 hover:text-white text-xs font-semibold hover:bg-[#252e42] transition-colors cursor-pointer"
          >
            ← Đăng xuất / Quay lại Form
          </button>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState('auth'); // 'auth' | 'game'

  if (currentScreen === 'game') {
    return <GameArenaPreview onBack={() => setCurrentScreen('auth')} />;
  }

  return <AuthPage onEnterGameWithBot={() => setCurrentScreen('game')} />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
