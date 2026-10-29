import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../utils/audioFx';

// DANH MỤC CÁC BIỂU CẢM & CÂU THOẠI TRONG TRẬN (TASK 3)
export const EMOTE_ITEMS = [
  // --- THOẠI NHANH ---
  { id: 'good_job', category: 'chat', icon: '👏', label: 'Chơi hay lắm!', type: 'text', sound: 'emote_pop' },
  { id: 'uno_alert', category: 'chat', icon: '🚨', label: 'UNO đây coi chừng!', type: 'text', sound: 'firework' },
  { id: 'hurry_up', category: 'chat', icon: '⏰', label: 'Nhanh lên bạn ơi!', type: 'text', sound: 'emote_pop' },
  { id: 'salty', category: 'chat', icon: '😤', label: 'Cay thật đấy!', type: 'text', sound: 'splat' },
  { id: 'thanks', category: 'chat', icon: '🙏', label: 'Cảm ơn nhé!', type: 'text', sound: 'heart_pop' },
  { id: 'sorry', category: 'chat', icon: '😅', label: 'Xin lỗi nha!', type: 'text', sound: 'emote_pop' },
  { id: 'gg', category: 'chat', icon: '🤝', label: 'Good Game!', type: 'text', sound: 'firework' },
  { id: 'wait', category: 'chat', icon: '⏳', label: 'Chờ tí đang tính!', type: 'text', sound: 'emote_pop' },

  // --- EMOJI BIỂU CẢM ---
  { id: 'laugh', category: 'emoji', icon: '😂', label: 'Cười xỉu', type: 'emoji', sound: 'emote_pop' },
  { id: 'cry', category: 'emoji', icon: '😭', label: 'Khóc ròng', type: 'emoji', sound: 'splat' },
  { id: 'rage', category: 'emoji', icon: '😡', label: 'Tức điên', type: 'emoji', sound: 'zap' },
  { id: 'cool', category: 'emoji', icon: '😎', label: 'Đẳng cấp', type: 'emoji', sound: 'firework' },
  { id: 'shocked', category: 'emoji', icon: '😱', label: 'Hết hồn', type: 'emoji', sound: 'zap' },
  { id: 'heart', category: 'emoji', icon: '💖', label: 'Thả tim', type: 'emoji', sound: 'heart_pop' },

  // --- ĐẠO CỤ TƯƠNG TÁC NÉM VÀO AVATAR ---
  {
    id: 'tomato',
    category: 'prop',
    icon: '🍅',
    label: 'Ném Cà Chua',
    subtitle: 'Đập bẹp dính mặt',
    type: 'projectile',
    sound: 'splat',
    color: 'from-rose-500/20 to-red-600/30 border-rose-500/50 text-rose-300',
  },
  {
    id: 'zap',
    category: 'prop',
    icon: '⚡',
    label: 'Giật Sấm Sét',
    subtitle: 'Tê tái điện giật',
    type: 'projectile',
    sound: 'zap',
    color: 'from-sky-500/20 to-indigo-600/30 border-sky-400/50 text-sky-300',
  },
  {
    id: 'firework',
    category: 'prop',
    icon: '🎉',
    label: 'Bắn Pháo Hoa',
    subtitle: 'Nổ bung chúc mừng',
    type: 'projectile',
    sound: 'firework',
    color: 'from-amber-500/20 to-yellow-500/30 border-amber-400/50 text-amber-300',
  },
  {
    id: 'poop',
    category: 'prop',
    icon: '💩',
    label: 'Cục Phân Troll',
    subtitle: 'Thúi quắc dính vách',
    type: 'projectile',
    sound: 'splat',
    color: 'from-amber-700/20 to-yellow-900/30 border-yellow-600/50 text-amber-400',
  },
];

export default function EmoteWheel({
  onSendEmote,
  players = [],
  mySeatIndex = 0,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('prop'); // Mặc định mở tab Đạo Cụ Ném để tiện tương tác nhất
  const [targetSeatIndex, setTargetSeatIndex] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownTimerRef = useRef(null);
  const wheelRef = useRef(null);

  // Danh sách đối thủ có thể chọn làm mục tiêu
  const opponents = players.filter((p) => p && p.seatIndex !== mySeatIndex);

  // Tự động gán mục tiêu cho đối thủ duy nhất trong phòng 1v1 (VD: Bot Neon)
  useEffect(() => {
    if (opponents.length === 1 && targetSeatIndex === null) {
      setTargetSeatIndex(opponents[0].seatIndex);
    }
  }, [opponents, targetSeatIndex]);

  // Bộ đếm hồi chiêu 2s chống spam
  useEffect(() => {
    if (cooldownRemaining > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setCooldownRemaining((prev) => Math.max(0, prev - 0.5));
      }, 500);
      return () => clearTimeout(cooldownTimerRef.current);
    }
  }, [cooldownRemaining]);

  // Đóng khi click ngoài
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

    // Đảm bảo nếu là đạo cụ ném mà chưa có mục tiêu cụ thể thì tự động nhắm tới đối thủ đầu tiên
    let finalTarget = targetSeatIndex;
    if (emote.type === 'projectile') {
      if (finalTarget === null && opponents.length > 0) {
        finalTarget = opponents[0].seatIndex;
      }
    }

    if (onSendEmote) {
      onSendEmote({
        emote,
        targetSeatIndex: finalTarget,
      });
    }

    // Bắt đầu hồi chiêu 2.0s
    setCooldownRemaining(2.0);
    setIsOpen(false);
  };

  const currentTabItems = EMOTE_ITEMS.filter((item) => item.category === activeTab);

  return (
    <div ref={wheelRef} className="relative font-body">
      {/* NÚT TRÒN NEON MỞ BÁNH XE BIỂU CẢM (CHUẨN GAME CAO CẤP) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer select-none ${
          isOpen
            ? 'bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 text-white shadow-[0_0_30px_rgba(245,158,11,0.7)] scale-110 ring-2 ring-yellow-300'
            : cooldownRemaining > 0
            ? 'bg-slate-900/80 text-slate-500 border border-white/10 opacity-70 cursor-not-allowed'
            : 'bg-gradient-to-tr from-[#111726]/90 via-[#182138]/90 to-[#222f4d]/90 hover:from-amber-500/25 hover:to-orange-500/25 text-yellow-300 border border-amber-400/40 hover:border-yellow-300 shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:scale-110 active:scale-95 backdrop-blur-md'
        }`}
        title="Biểu cảm & Ném đạo cụ (Task 3)"
        aria-label="Biểu cảm"
      >
        <span className="text-2xl filter drop-shadow">
          {isOpen ? '✕' : '🎭'}
        </span>

        {/* Thanh đếm hồi chiêu Cooldown */}
        {cooldownRemaining > 0 && (
          <span className="absolute inset-0 rounded-full bg-black/75 flex items-center justify-center text-[11px] font-mono font-bold text-amber-300">
            {cooldownRemaining.toFixed(1)}s
          </span>
        )}
      </button>

      {/* POPOVER BẢNG BIỂU CẢM GLASSMORPHISM CAO CẤP */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 z-50 w-76 sm:w-84 bg-[#0a0e1a]/95 border border-white/15 rounded-3xl p-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(251,191,36,0.2)] backdrop-blur-2xl flex flex-col gap-3 animate-scale-up">
          
          {/* HEADER: TIÊU ĐỀ & CHỌN MỤC TIÊU NÉM */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 font-headline font-black text-xs text-white tracking-wide">
              <span className="text-base">🎭</span>
              <span>TƯƠNG TÁC TRẬN ĐẤU</span>
            </div>

            {/* CHIPS CHỌN MỤC TIÊU (KHÔNG DÙNG THẺ SELECT QUÊ MÙA) */}
            {opponents.length <= 1 ? (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-[10px] text-amber-300 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>🎯 {opponents[0]?.name || 'Đối thủ'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setTargetSeatIndex(null)}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                    targetSeatIndex === null
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  🌐 Cả bàn
                </button>
                {opponents.map((p) => (
                  <button
                    key={p.seatIndex}
                    type="button"
                    onClick={() => setTargetSeatIndex(p.seatIndex)}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all truncate max-w-[70px] ${
                      targetSeatIndex === p.seatIndex
                        ? 'bg-amber-400 text-black shadow-md'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                    title={p.name}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TABS PHÂN LOẠI HIỆN ĐẠI */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/40 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('prop')}
              className={`flex-1 py-1.5 rounded-xl font-headline font-black text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'prop'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🍅</span>
              <span>Ném Đồ</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('emoji')}
              className={`flex-1 py-1.5 rounded-xl font-headline font-black text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'emoji'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>😊</span>
              <span>Emoji</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-1.5 rounded-xl font-headline font-black text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>💬</span>
              <span>Thoại</span>
            </button>
          </div>

          {/* GRID HIỂN THỊ CÁC MỤC THEO TAB */}
          {activeTab === 'prop' ? (
            /* 4 NÚT ĐẠO CỤ NÉM THUẦN ICON (KHÔNG CHỮ THEO YÊU CẦU NGƯỜI DÙNG) */
            <div className="grid grid-cols-2 gap-3 p-1">
              {currentTabItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  disabled={cooldownRemaining > 0}
                  onClick={() => handleTriggerEmote(item)}
                  className={`h-24 sm:h-28 rounded-2xl bg-gradient-to-b ${item.color} border flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer shadow-lg group hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]`}
                >
                  <span className="text-5xl sm:text-6xl filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)] group-hover:scale-125 group-hover:rotate-6 transition-all duration-200">
                    {item.icon}
                  </span>
                </button>
              ))}
            </div>
          ) : activeTab === 'emoji' ? (
            /* 6 ICON EMOJI 3D ĐẬM NÉT */
            <div className="grid grid-cols-3 gap-2 p-0.5">
              {currentTabItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={cooldownRemaining > 0}
                  onClick={() => handleTriggerEmote(item)}
                  className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/5 hover:bg-amber-400/20 border border-white/10 hover:border-amber-400/40 transition-all hover:scale-110 active:scale-95 cursor-pointer group"
                >
                  <span className="text-3xl filter drop-shadow group-hover:scale-125 transition-transform">
                    {item.icon}
                  </span>
                  <span className="text-[10px] font-bold text-slate-200 group-hover:text-yellow-300 mt-1">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            /* DANH SÁCH THOẠI NHANH */
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar p-0.5">
              {currentTabItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={cooldownRemaining > 0}
                  onClick={() => handleTriggerEmote(item)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-amber-400/20 border border-white/10 hover:border-amber-400/40 text-left transition-all hover:scale-102 active:scale-95 cursor-pointer group"
                >
                  <span className="text-lg shrink-0">{item.icon}</span>
                  <span className="text-[11px] font-bold text-slate-200 group-hover:text-yellow-300 truncate">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="text-[9px] text-center text-slate-400 pt-1 border-t border-white/5 font-mono">
            ⚡ Bấm là ném ngay • Tự động nhắm đối thủ
          </div>
        </div>
      )}
    </div>
  );
}
