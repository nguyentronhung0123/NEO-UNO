import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../utils/audioFx';

// DANH MỤC CÁC BIỂU CẢM & CÂU THOẠI TRONG TRẬN (TASK 3)
export const EMOTE_ITEMS = [
  // --- CÂU THOẠI NHANH ---
  { id: 'good_job', category: 'chat', icon: '👏', label: 'Chơi hay lắm!', type: 'text', sound: 'emote_pop' },
  { id: 'uno_alert', category: 'chat', icon: '🚨', label: 'UNO đây coi chừng!', type: 'text', sound: 'firework' },
  { id: 'hurry_up', category: 'chat', icon: '⏰', label: 'Nhanh lên bạn ơi!', type: 'text', sound: 'emote_pop' },
  { id: 'salty', category: 'chat', icon: '😤', label: 'Cay thật đấy!', type: 'text', sound: 'splat' },
  { id: 'thanks', category: 'chat', icon: '🙏', label: 'Cảm ơn nhé!', type: 'text', sound: 'heart_pop' },
  { id: 'sorry', category: 'chat', icon: '😅', label: 'Xin lỗi nha!', type: 'text', sound: 'emote_pop' },
  { id: 'gg', category: 'chat', icon: '🤝', label: 'Good Game!', type: 'text', sound: 'firework' },
  { id: 'wait', category: 'chat', icon: '⏳', label: 'Chờ tí đang tính!', type: 'text', sound: 'emote_pop' },

  // --- EMOJI BIỂU CẢM KHUÔN MẶT ---
  { id: 'laugh', category: 'emoji', icon: '😂', label: 'Cười xỉu', type: 'emoji', sound: 'emote_pop' },
  { id: 'cry', category: 'emoji', icon: '😭', label: 'Khóc ròng', type: 'emoji', sound: 'splat' },
  { id: 'rage', category: 'emoji', icon: '😡', label: 'Tức điên', type: 'emoji', sound: 'zap' },
  { id: 'cool', category: 'emoji', icon: '😎', label: 'Đẳng cấp', type: 'emoji', sound: 'firework' },
  { id: 'shocked', category: 'emoji', icon: '😱', label: 'Hết hồn', type: 'emoji', sound: 'zap' },
  { id: 'heart', category: 'emoji', icon: '💖', label: 'Thả tim', type: 'emoji', sound: 'heart_pop' },

  // --- ĐẠO CỤ TƯƠNG TÁC NÉM VÀO AVATAR ---
  { id: 'tomato', category: 'prop', icon: '🍅', label: 'Ném Cà Chua', type: 'projectile', sound: 'splat' },
  { id: 'firework', category: 'prop', icon: '🎉', label: 'Bắn Pháo Hoa', type: 'projectile', sound: 'firework' },
  { id: 'zap', category: 'prop', icon: '⚡', label: 'Giật Sấm Sét', type: 'projectile', sound: 'zap' },
  { id: 'poop', category: 'prop', icon: '💩', label: 'Cục Phân Troll', type: 'projectile', sound: 'splat' },
];

export default function EmoteWheel({
  onSendEmote,
  players = [],
  mySeatIndex = 0,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'emoji' | 'prop'
  const [targetSeatIndex, setTargetSeatIndex] = useState(null); // null = Cả bàn
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownTimerRef = useRef(null);
  const wheelRef = useRef(null);

  // Bộ đếm hồi chiêu 2.5s chống spam
  useEffect(() => {
    if (cooldownRemaining > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setCooldownRemaining((prev) => Math.max(0, prev - 0.5));
      }, 500);
      return () => clearTimeout(cooldownTimerRef.current);
    }
  }, [cooldownRemaining]);

  // Đóng bảng biểu cảm khi bấm ra ngoài
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (wheelRef.current && !wheelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleTriggerEmote = (emote) => {
    if (cooldownRemaining > 0 || disabled) return;

    if (onSendEmote) {
      onSendEmote({
        emote,
        targetSeatIndex,
      });
    }

    // Bắt đầu hồi chiêu 2.5s
    setCooldownRemaining(2.5);
    setIsOpen(false);
  };

  const currentTabItems = EMOTE_ITEMS.filter((item) => item.category === activeTab);

  // Danh sách đối thủ có thể chọn làm mục tiêu ném
  const opponents = players.filter((p) => p && p.seatIndex !== mySeatIndex);

  return (
    <div ref={wheelRef} className="relative font-body">
      {/* NÚT MỞ BÁNH XE BIỂU CẢM */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg cursor-pointer ${
          isOpen
            ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-black ring-4 ring-yellow-400/50 scale-105 shadow-[0_0_25px_rgba(251,191,36,0.5)]'
            : cooldownRemaining > 0
            ? 'bg-surface-container-high/60 text-slate-400 border border-white/10 opacity-70 cursor-not-allowed'
            : 'bg-gradient-to-tr from-[#1b2236] to-[#252f4a] hover:from-amber-500/20 hover:to-yellow-400/20 text-yellow-300 border border-amber-400/40 hover:border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.25)] hover:scale-105 active:scale-95'
        }`}
        title="Bánh xe biểu cảm & Chat nhanh (Task 3)"
        aria-label="Biểu cảm"
      >
        <span className="material-symbols-outlined text-2xl">
          {isOpen ? 'close' : 'mood'}
        </span>

        {/* Thanh đếm hồi chiêu Cooldown */}
        {cooldownRemaining > 0 && (
          <span className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center text-[10px] font-mono font-bold text-amber-300">
            {cooldownRemaining.toFixed(1)}s
          </span>
        )}
      </button>

      {/* POPOVER BÁNH XE BIỂU CẢM (EMOTE WHEEL DRAWER) */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 z-50 w-72 sm:w-80 bg-[#0e1424]/95 border-2 border-amber-400/50 rounded-3xl p-3 shadow-[0_0_50px_rgba(251,191,36,0.35)] backdrop-blur-2xl flex flex-col gap-2.5 animate-scale-up">
          {/* HEADER & CHỌN MỤC TIÊU NÉM */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-headline font-black text-white">
              <span className="text-base">🎭</span>
              <span>BIỂU CẢM & CHAT</span>
            </div>

            {/* Chọn mục tiêu (Cả bàn hoặc Người cụ thể) */}
            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-slate-400">Tới:</span>
              <select
                value={targetSeatIndex === null ? 'all' : targetSeatIndex}
                onChange={(e) =>
                  setTargetSeatIndex(e.target.value === 'all' ? null : Number(e.target.value))
                }
                className="bg-black/50 border border-white/20 rounded-lg px-2 py-0.8 text-yellow-300 font-bold text-[10px] focus:outline-none focus:border-yellow-400 cursor-pointer"
              >
                <option value="all">🌐 Cả Bàn Đấu</option>
                {opponents.map((p) => (
                  <option key={p.seatIndex} value={p.seatIndex}>
                    👤 {p.name} (P{p.seatIndex + 1})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TABS PHÂN LOẠI */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-1 rounded-lg font-headline font-bold text-[11px] transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💬 Thoại Nhanh
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('emoji')}
              className={`flex-1 py-1 rounded-lg font-headline font-bold text-[11px] transition-all cursor-pointer ${
                activeTab === 'emoji'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              😊 Emoji
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('prop')}
              className={`flex-1 py-1 rounded-lg font-headline font-bold text-[11px] transition-all cursor-pointer ${
                activeTab === 'prop'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🍅 Đạo Cụ Ném
            </button>
          </div>

          {/* GRID CÁC ITEMS */}
          <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto custom-scrollbar p-0.5">
            {currentTabItems.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={cooldownRemaining > 0}
                onClick={() => handleTriggerEmote(item)}
                className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/40 text-left transition-all active:scale-95 cursor-pointer group"
              >
                <span className="text-xl group-hover:scale-125 transition-transform shrink-0">
                  {item.icon}
                </span>
                <span className="text-[11px] font-bold text-slate-200 group-hover:text-yellow-300 truncate">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <div className="text-[9px] text-center text-slate-400 pt-1 border-t border-white/5">
            ⏱ Hồi chiêu 2.5s mỗi lần gửi biểu cảm
          </div>
        </div>
      )}
    </div>
  );
}
