import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function GameRulesPage({ onBackToLobby, onStartMatch }) {
  const { user } = useAuth();

  return (
    <div className="bg-[#0f131d] font-body text-slate-100 min-h-screen relative overflow-x-hidden selection:bg-primary-container selection:text-black flex flex-col justify-between">
      
      {/* Background Soft Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-container/10 blur-[130px]"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary-container/15 blur-[130px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,19,29,0.85)_100%)]"></div>
      </div>

      {/* ================= 1. HEADER NAVIGATION BAR ================= */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f131d]/85 backdrop-blur-xl border-b border-white/5 shadow-md">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4">
          
          {/* Logo & Nút Về Sảnh */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={onBackToLobby}
              className="flex items-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer"
            >
              <span className="font-headline font-black text-xl tracking-tight text-primary-container">NEO</span>
              <span className="font-headline font-black text-xl tracking-tight text-emerald-400">UNO</span>
            </button>

            <button
              onClick={onBackToLobby}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1f2a] text-slate-300 hover:bg-[#262a35] hover:text-white transition-all text-xs font-semibold cursor-pointer border border-white/5"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Về Sảnh</span>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={onBackToLobby}
              className="px-3.5 py-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer"
            >
              Sảnh Chơi
            </button>
            <button
              onClick={() => onStartMatch && onStartMatch()}
              className="px-3.5 py-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer"
            >
              Bàn Đấu
            </button>
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              Luật Chơi
            </div>
            <button
              onClick={onBackToLobby}
              className="px-3.5 py-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer"
            >
              Cài Đặt
            </button>
            <button
              onClick={onBackToLobby}
              className="px-3.5 py-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer"
            >
              Hồ Sơ
            </button>
          </nav>

          {/* Avatar User */}
          <div className="flex items-center gap-2">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.nickname || 'Player'}`}
              alt={user?.nickname || 'Avatar'}
              className="w-9 h-9 rounded-full bg-slate-800 border border-primary-container/40 p-0.5 object-cover cursor-pointer"
              onClick={onBackToLobby}
              title={user?.nickname || 'Tài khoản'}
            />
          </div>

        </div>
      </header>

      {/* ================= 2. MAIN CONTENT ================= */}
      <main className="relative z-10 w-full pt-24 pb-12 px-4 sm:px-6 lg:px-12 flex flex-col items-center">
        <div className="w-full max-w-4xl flex flex-col gap-8 sm:gap-10">
          
          {/* Section 1: Header Tiêu Đề */}
          <section className="flex flex-col items-center text-center gap-3 relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1c1f2a] text-primary-container text-xs uppercase tracking-wider font-bold border border-white/5 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
              <span>HỌC NHANH SIÊU TỐC</span>
            </div>

            <h1 className="font-headline font-black text-2xl sm:text-4xl text-white tracking-tight uppercase">
              NEO UNO – Hướng Dẫn Luật Chơi
            </h1>

            <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
              Luật chơi cơ bản giúp bạn làm quen và chiến thắng chỉ trong 1 phút!
            </p>
          </section>

          {/* Section 2: Box Mục Tiêu Trò Chơi */}
          <section className="w-full">
            <div className="rounded-2xl bg-[#171b26] border border-white/10 p-5 sm:p-7 flex flex-col sm:flex-row items-center gap-5 shadow-lg hover:border-emerald-500/40 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 shadow-inner border border-emerald-500/30">
                <span className="material-symbols-outlined text-3xl">emoji_events</span>
              </div>
              <div className="flex flex-col text-center sm:text-left">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  MỤC TIÊU TRÒ CHƠI
                </span>
                <p className="font-headline font-bold text-base sm:text-lg text-white mt-1 leading-snug">
                  Đánh hết bài trên tay trước các người chơi khác và hô <strong className="text-amber-300">"UNO"</strong> khi còn đúng 1 lá trên tay!
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Cách Đánh Bài (3 Bước Đơn Giản) */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-6 rounded-full bg-primary-container shadow-[0_0_8px_#00d2ff]"></span>
              <h2 className="font-headline font-black text-lg sm:text-xl text-white uppercase tracking-wide">
                Cách Đánh Bài
              </h2>
              <span className="text-[10px] font-mono font-bold text-slate-400 px-2.5 py-0.5 rounded-full bg-[#1c1f2a] border border-white/5">
                3 Bước Đơn Giản
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 01 */}
              <div className="rounded-2xl bg-[#171b26] border border-white/10 p-5 flex flex-col gap-3 shadow-md hover:border-primary-container/40 transition-all relative overflow-hidden group">
                <span className="absolute top-3 right-4 font-headline font-black text-4xl text-white/5 group-hover:text-primary-container/10 transition-colors">
                  01
                </span>
                <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-primary-container flex items-center justify-center border border-primary-container/30">
                  <span className="material-symbols-outlined text-xl">palette</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-sm text-white">Khớp Màu hoặc Số</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Đánh lá bài cùng màu hoặc cùng số với lá bài hiện tại đang ngửa trên bàn đấu.
                  </p>
                </div>
              </div>

              {/* Card 02 */}
              <div className="rounded-2xl bg-[#171b26] border border-white/10 p-5 flex flex-col gap-3 shadow-md hover:border-cyan-400/40 transition-all relative overflow-hidden group">
                <span className="absolute top-3 right-4 font-headline font-black text-4xl text-white/5 group-hover:text-cyan-400/10 transition-colors">
                  02
                </span>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/30">
                  <span className="material-symbols-outlined text-xl">layers</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-sm text-white">Rút Bài Tự Động</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Nếu không có lá bài nào hợp lệ để đánh, bạn rút 1 lá từ chồng bài chung.
                  </p>
                </div>
              </div>

              {/* Card 03 */}
              <div className="rounded-2xl bg-[#171b26] border border-white/10 p-5 flex flex-col gap-3 shadow-md hover:border-rose-400/40 transition-all relative overflow-hidden group">
                <span className="absolute top-3 right-4 font-headline font-black text-4xl text-white/5 group-hover:text-rose-400/10 transition-colors">
                  03
                </span>
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-400/30">
                  <span className="material-symbols-outlined text-xl">campaign</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-sm text-white">Hô UNO Thật Nhanh</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Bấm nút UNO ngay khi đánh xuống và trên tay bạn chỉ còn đúng 1 lá cuối cùng.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Các Lá Bài Chức Năng (Dễ Nhớ) */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-6 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
              <h2 className="font-headline font-black text-lg sm:text-xl text-white uppercase tracking-wide">
                Các Lá Bài Chức Năng
              </h2>
              <span className="text-[10px] font-mono font-bold text-slate-400 px-2.5 py-0.5 rounded-full bg-[#1c1f2a] border border-white/5">
                Dễ Nhớ
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
              
              {/* Lá 1: Cấm Lượt (Skip) */}
              <div className="rounded-2xl bg-[#171b26] border border-white/10 p-4 flex flex-col gap-2.5 items-center text-center shadow-md hover:border-rose-500/40 transition-all">
                <div className="w-12 h-16 rounded-xl bg-[#0a0e18] flex items-center justify-center text-rose-400 shadow-inner border border-white/5">
                  <span className="material-symbols-outlined text-2xl">block</span>
                </div>
                <div>
                  <span className="font-headline font-bold text-xs text-white block">Lá Cấm Lượt</span>
                  <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-wider">SKIP</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Người kế tiếp bị mất lượt đánh bài.
                </p>
              </div>

              {/* Lá 2: Đổi Chiều (Reverse) */}
              <div className="rounded-2xl bg-[#171b26] border border-white/10 p-4 flex flex-col gap-2.5 items-center text-center shadow-md hover:border-primary-container/40 transition-all">
                <div className="w-12 h-16 rounded-xl bg-[#0a0e18] flex items-center justify-center text-primary-container shadow-inner border border-white/5">
                  <span className="material-symbols-outlined text-2xl">sync_alt</span>
                </div>
                <div>
                  <span className="font-headline font-bold text-xs text-white block">Lá Đổi Chiều</span>
                  <span className="text-[9px] font-mono font-bold text-primary-container uppercase tracking-wider">REVERSE</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Đổi chiều vòng chơi (thuận / ngược lại).
                </p>
              </div>

              {/* Lá 3: Phạt +2 (Draw Two) */}
              <div className="rounded-2xl bg-[#171b26] border border-white/10 p-4 flex flex-col gap-2.5 items-center text-center shadow-md hover:border-emerald-400/40 transition-all">
                <div className="w-12 h-16 rounded-xl bg-[#0a0e18] flex items-center justify-center text-emerald-400 shadow-inner border border-white/5 font-headline font-black text-2xl">
                  +2
                </div>
                <div>
                  <span className="font-headline font-bold text-xs text-white block">Lá Phạt +2</span>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider">DRAW TWO</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Người kế tiếp phải rút 2 lá và mất lượt.
                </p>
              </div>

              {/* Lá 4: Đổi Màu (Wild) */}
              <div className="rounded-2xl bg-[#171b26] border border-white/10 p-4 flex flex-col gap-2.5 items-center text-center shadow-md hover:border-purple-400/40 transition-all">
                <div className="w-12 h-16 rounded-xl bg-[#0a0e18] flex items-center justify-center text-purple-400 shadow-inner border border-white/5">
                  <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                </div>
                <div>
                  <span className="font-headline font-bold text-xs text-white block">Lá Đổi Màu</span>
                  <span className="text-[9px] font-mono font-bold text-purple-400 uppercase tracking-wider">WILD</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Được đổi sang 1 trong 4 màu tùy ý bạn chọn.
                </p>
              </div>

              {/* Lá 5: Đổi Màu +4 (Wild +4) */}
              <div className="rounded-2xl bg-[#171b26] border border-white/10 p-4 flex flex-col gap-2.5 items-center text-center shadow-md hover:border-yellow-400/40 transition-all col-span-2 sm:col-span-1">
                <div className="w-12 h-16 rounded-xl bg-[#0a0e18] flex items-center justify-center text-yellow-400 shadow-inner border border-white/5 font-headline font-black text-2xl">
                  +4
                </div>
                <div>
                  <span className="font-headline font-bold text-xs text-white block">Lá Đổi Màu +4</span>
                  <span className="text-[9px] font-mono font-bold text-yellow-400 uppercase tracking-wider">WILD +4</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Đổi màu bàn đấu và bắt người kế tiếp rút 4 lá.
                </p>
              </div>

            </div>
          </section>

          {/* Section 5: Bottom Actions */}
          <section className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pb-4">
            <button
              onClick={() => onStartMatch && onStartMatch()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary-container text-black font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_30px_rgba(0,210,255,0.4)] hover:shadow-[0_0_40px_rgba(0,210,255,0.6)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">play_arrow</span>
              <span>Đã Hiểu • Vào Chơi Ngay</span>
            </button>

            <button
              onClick={onBackToLobby}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-[#1c1f2a] hover:bg-[#262a35] text-white font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-white/10"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span>Quay Về Sảnh</span>
            </button>
          </section>

        </div>
      </main>

      {/* ================= 3. FOOTER ================= */}
      <footer className="w-full bg-[#0a0e18] py-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono">
          <p>© 2025 NEO UNO • Game vui miễn phí</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Chế độ Offline vs AI</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
