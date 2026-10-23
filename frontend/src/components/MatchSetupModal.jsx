import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const BOT_PRESETS = [
  { id: 'bot_right', name: 'Bot Titan', avatar: '🛡️', badge: 'Bậc thầy phòng thủ', color: '#ec4899', playerNumber: 2 },
  { id: 'bot_top',   name: 'Bot Neon',  avatar: '⚡', badge: 'Chiến thuật gia',    color: '#10b981', playerNumber: 3 },
  { id: 'bot_left',  name: 'Bot Cyber', avatar: '🤖', badge: 'Chuyên gia tốc độ', color: '#00d2ff', playerNumber: 4 },
];

export default function MatchSetupModal({ isOpen, onClose, onStartMatch }) {
  const { user } = useAuth();
  
  // 3 slot bot: mặc định chưa thêm bot nào để người dùng tự do bấm ô tròn dấu cộng
  const [activeSlots, setActiveSlots] = useState([false, false, false]);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  if (!isOpen) return null;

  const activeBotCount = activeSlots.filter(Boolean).length;

  const handleToggleSlot = (index) => {
    setActiveSlots((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
    if (error) setError('');
  };

  const handleAddSlot = (index) => {
    setActiveSlots((prev) => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });
    if (error) setError('');
  };

  const handleRemoveSlot = (e, index) => {
    e.stopPropagation();
    setActiveSlots((prev) => {
      const updated = [...prev];
      updated[index] = false;
      return updated;
    });
  };

  const handleAddAll = () => {
    setActiveSlots([true, true, true]);
    if (error) setError('');
  };

  const handleClearAll = () => {
    setActiveSlots([false, false, false]);
  };

  const handleStart = () => {
    if (activeBotCount === 0) {
      setError('⚠️ Bạn chưa thêm Bot nào! Vui lòng ấn vào ô tròn dấu cộng (+) để thêm ít nhất 1 Bot đối thủ trước khi bắt đầu.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setError('');
    onStartMatch({
      botCount: activeBotCount,
      timeLimit: 300, // 5 phút = 300 giây
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-body">
      <div className={`relative w-full max-w-xl bg-[#0f1422]/95 border border-primary-container/30 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(0,210,255,0.25)] flex flex-col gap-5 overflow-hidden ${
        isShaking ? 'animate-shake' : ''
      }`}>
        
        {/* Glow hiệu ứng nền */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-primary-container/15 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-secondary-container/15 rounded-full blur-[90px] pointer-events-none" />

        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-primary-container shadow-[0_0_15px_rgba(0,210,255,0.3)]">
              <span className="text-xl">⚙️</span>
            </div>
            <div>
              <h2 className="font-headline text-lg sm:text-xl font-black text-white tracking-wide uppercase">
                THIẾT LẬP BÀN ĐẤU UNO
              </h2>
              <p className="text-xs text-slate-400">
                Tùy chỉnh số lượng đối thủ và quy tắc thời gian trận đấu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer text-base font-bold"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* ================= KHU VỰC 4 Ô TRÒN CHÍNH (1 BẠN + 3 BOT) ================= */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span className="text-primary-container text-sm">👥</span>
              <span>Đấu thủ tham gia bàn ({activeBotCount + 1}/4 người)</span>
            </label>
            
            {/* Tag chế độ bàn đấu */}
            <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border transition-all ${
              activeBotCount === 0
                ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                : activeBotCount === 1
                ? 'text-sky-400 bg-sky-500/10 border-sky-500/30'
                : activeBotCount === 2
                ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30'
                : 'text-amber-400 bg-amber-400/10 border-amber-400/30'
            }`}>
              {activeBotCount === 0
                ? 'Chưa thêm Bot'
                : activeBotCount === 1
                ? 'Bàn 2 người (Solo 1v1)'
                : activeBotCount === 2
                ? 'Bàn 3 người'
                : 'Bàn 4 người (Chuẩn UNO)'}
            </span>
          </div>

          {/* 4 Ô TRÒN NGANG NHAU */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 p-4 sm:p-5 rounded-2xl bg-surface-container-high/40 border border-white/10">
            
            {/* Ô 1: BẠN (CỐ ĐỊNH) */}
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary-container/20 to-cyan-950/60 border-2 border-primary-container flex items-center justify-center shadow-[0_0_20px_rgba(0,210,255,0.45)]">
                <span className="absolute -top-2 px-2 py-0.2 rounded-full bg-primary-container text-black font-headline font-black text-[9px] uppercase tracking-wider shadow-md">
                  P1
                </span>
                {user?.avatar ? (
                  <img src={user.avatar} alt="You" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
                ) : (
                  <span className="text-2xl sm:text-3xl">😎</span>
                )}
                <span className="absolute -bottom-1.5 px-2 py-0.2 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-300 font-bold text-[8px] uppercase tracking-tighter">
                  Chính bạn
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-white truncate max-w-[70px] sm:max-w-[90px]">
                  {user?.nickname || 'Bạn'}
                </span>
                <span className="text-[10px] text-cyan-400 font-medium">Chủ phòng</span>
              </div>
            </div>

            {/* Ô 2, 3, 4: 3 Ô BOT */}
            {BOT_PRESETS.map((bot, index) => {
              const isActive = activeSlots[index];
              return (
                <div key={bot.id} className="flex flex-col items-center gap-2 text-center">
                  {isActive ? (
                    /* Trạng thái: ĐÃ THÊM BOT */
                    <div
                      onClick={() => handleToggleSlot(index)}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#181f2f] border-2 border-amber-400 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.35)] cursor-pointer group transition-all hover:scale-105"
                      title="Bấm dấu X để gỡ Bot này"
                    >
                      {/* Huy hiệu P2 / P3 / P4 */}
                      <span className="absolute -top-2 px-2 py-0.2 rounded-full bg-amber-400 text-black font-headline font-black text-[9px] uppercase tracking-wider shadow-md">
                        P{bot.playerNumber}
                      </span>

                      {/* Nút xóa X nhỏ góc trên bên phải */}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveSlot(e, index)}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-xs font-black shadow-lg transition-transform hover:scale-115 cursor-pointer z-10"
                        title="Gỡ Bot này ra"
                      >
                        ✕
                      </button>

                      {/* Avatar Bot */}
                      <span className="text-2xl sm:text-3xl select-none group-hover:scale-110 transition-transform">
                        {bot.avatar}
                      </span>

                      {/* Tag trạng thái */}
                      <span className="absolute -bottom-1.5 px-2 py-0.2 rounded-full bg-amber-950 border border-amber-400/50 text-amber-300 font-bold text-[8px] uppercase tracking-tighter">
                        Đã sẵn sàng
                      </span>
                    </div>
                  ) : (
                    /* Trạng thái: Ô TRÒN DẤU CỘNG THÊM BOT */
                    <button
                      type="button"
                      onClick={() => handleAddSlot(index)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center group active:scale-95 ${
                        error
                          ? 'border-rose-400 bg-rose-500/10 hover:border-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
                          : 'border-cyan-400/40 hover:border-cyan-400 bg-white/[0.03] hover:bg-cyan-400/10 shadow-sm'
                      }`}
                      title={`Bấm vào đây để thêm ${bot.name}`}
                    >
                      <span className={`text-2xl sm:text-3xl font-black leading-none transition-transform group-hover:scale-125 ${
                        error ? 'text-rose-400' : 'text-cyan-400'
                      }`}>
                        +
                      </span>
                      <span className={`text-[9px] font-headline font-black uppercase tracking-tighter mt-0.5 ${
                        error ? 'text-rose-300' : 'text-cyan-300/80 group-hover:text-cyan-300'
                      }`}>
                        Thêm
                      </span>
                    </button>
                  )}

                  {/* Tên & danh hiệu dưới ô tròn */}
                  <div className="flex flex-col items-center">
                    <span className={`text-xs font-bold truncate max-w-[70px] sm:max-w-[90px] ${
                      isActive ? 'text-amber-300' : 'text-slate-400'
                    }`}>
                      {isActive ? bot.name : `Slot Bot ${index + 1}`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {isActive ? bot.badge : '+ Bấm để thêm'}
                    </span>
                  </div>
                </div>
              );
            })}

          </div>

          {/* Công cụ phím tắt Thêm nhanh / Xóa hết */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-400 text-[11px]">
              {activeBotCount === 0
                ? '💡 Nhấn ô tròn dấu cộng (+) để thêm bot bạn muốn đấu cùng'
                : `Đang có ${activeBotCount} Bot trong phòng`}
            </span>
            <div className="flex items-center gap-3">
              {activeBotCount < 3 && (
                <button
                  type="button"
                  onClick={handleAddAll}
                  className="text-primary-container hover:text-cyan-300 font-bold text-[11px] underline cursor-pointer transition-colors"
                >
                  + Thêm Đủ 3 Bot
                </button>
              )}
              {activeBotCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-slate-400 hover:text-rose-400 font-bold text-[11px] underline cursor-pointer transition-colors"
                >
                  Xóa Hết Bot
                </button>
              )}
            </div>
          </div>
        </div>

        {/* THÔNG BÁO LỖI NẾU KHÔNG THÊM BOT MÀ BẮT ĐẦU */}
        {error && (
          <div className="flex items-center gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-rose-500/15 border-2 border-rose-500/50 text-rose-300 text-xs font-bold animate-shake shadow-[0_0_25px_rgba(244,63,94,0.35)]">
            <span className="text-lg text-rose-400 shrink-0">
              ⚠️
            </span>
            <div className="flex-1 leading-snug">
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={handleAddAll}
              className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-[11px] font-headline font-black uppercase transition-colors whitespace-nowrap cursor-pointer shadow-md"
            >
              + Thêm Ngay
            </button>
          </div>
        )}

        {/* ================= KHU VỰC THỜI GIAN VÁN ĐẤU (5 PHÚT) ================= */}
        <div className="flex flex-col gap-2 p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-headline font-bold text-xs sm:text-sm uppercase">
              <span>⏱️</span>
              Thời Gian Ván Đấu: 5 Phút (05:00)
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300">
              Quy tắc thi đấu
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            ⏰ Trận đấu diễn ra trong tối đa <strong className="text-amber-300">5 phút</strong> theo <strong className="text-primary-container">chiều ngược kim đồng hồ ↺</strong>. Nếu hết 5 phút chưa ai đánh hết bài, trọng tài sẽ dừng ván và xét thứ hạng: <strong className="text-primary-container">Đấu thủ có số lá bài ít nhất trên tay sẽ giành chiến thắng</strong>!
          </p>
        </div>

        {/* ================= HÀNG NÚT HÀNH ĐỘNG DƯỚI CÙNG ================= */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 sm:py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white font-headline text-xs font-bold uppercase transition-colors cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleStart}
            className={`flex-2 py-3.5 rounded-full font-headline text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
              activeBotCount === 0
                ? 'bg-primary-container/40 text-slate-900 border border-primary-container/30 hover:bg-primary-container hover:scale-[1.01]'
                : 'bg-gradient-to-r from-primary-container to-cyan-400 hover:from-cyan-300 hover:to-primary-container text-black shadow-[0_0_30px_rgba(0,210,255,0.4)] hover:shadow-[0_0_40px_rgba(0,210,255,0.6)] hover:scale-[1.02]'
            }`}
          >
            <span>▶</span>
            <span>BẮT ĐẦU VÁN ĐẤU NGAY</span>
          </button>
        </div>

      </div>
    </div>
  );
}
