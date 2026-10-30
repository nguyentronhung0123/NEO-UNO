import React from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * =========================================================================
 * 1. HALLOWEEN SPOOKY 2026 SVGs (Chuẩn Vector SVG từ File Word tham khảo)
 * =========================================================================
 */

// Icon bí ngô mini cho góc số Halloween
function MiniPumpkinSvg({ className = 'w-3 h-3 text-amber-400' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2c.5 1 .3 2-.2 3C16.8 5.3 20 8.3 20 12c0 4.4-3.6 8-8 8s-8-3.6-8-8c0-3.7 3.2-6.7 8.2-7-.5-1-.7-2-.2-3zm-3 7c-.6 0-1 .4-1 1 0 .8.7 1.4 1.5 1.2.6-.2.8-.8.5-1.4-.2-.5-.6-.8-1-.8zm6 0c-.4 0-.8.3-1 .8-.3.6-.1 1.2.5 1.4.8.2 1.5-.4 1.5-1.2 0-.6-.4-1-1-1zm-3 4c-2 0-3 1-3.5 2h7c-.5-1-1.5-2-3.5-2z" />
    </svg>
  );
}

// Icon răng nanh ma cà rồng cho góc lá Rút 2
function VampireFangsCornerSvg({ className = 'w-3.5 h-2 text-rose-400' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 12">
      <path d="M2 1h16c-1 3-2 6-4 10-1-3-2-6-4-10-2 4-3 7-4 10C5 7 4 4 2 1z" />
    </svg>
  );
}

// Icon cấm ma thuật cho góc lá Bỏ Lượt
function ProhibitionSkipCornerSvg({ className = 'w-3.5 h-3.5 text-emerald-400' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <line x1="5.7" x2="18.3" y1="5.7" y2="18.3" />
    </svg>
  );
}

// Icon mũi tên linh hồn cho góc lá Đổi Chiều
function GhostReverseCornerSvg({ className = 'w-3.5 h-3.5 text-cyan-300' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
      <polyline points="9 14 4 9 9 4" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

/**
 * Helper render trung tâm cho Bộ Skin Halloween (Pure SVG từ bản thiết kế)
 */
function renderHalloweenCenter(value, color) {
  switch (value) {
    case 'skip':
      // Witch Cauldron Skip (Nồi độc phù thủy sủi bọt)
      return (
        <div className="flex flex-col items-center justify-center">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_0_12px_#22c55e]" fill="none" viewBox="0 0 100 100">
            {/* Witch Hat */}
            <path d="M50 8 L32 30 L68 30 Z" fill="#6ee7b7" />
            <ellipse cx="50" cy="30" fill="#a7f3d0" rx="24" ry="4" />
            {/* Cauldron Bubbles */}
            <circle cx="42" cy="38" fill="#86efac" opacity="0.8" r="4" />
            <circle cx="58" cy="36" fill="#4ade80" opacity="0.9" r="5" />
            <circle cx="50" cy="42" fill="#bbf7d0" r="3" />
            {/* Cauldron Body */}
            <path d="M26 48 C26 44 74 44 74 48 C74 72 65 82 50 82 C35 82 26 72 26 48 Z" fill="#14532d" stroke="#4ade80" strokeWidth="2.5" />
            <ellipse cx="50" cy="48" fill="#22c55e" rx="24" ry="5" />
            <circle cx="46" cy="48" fill="#022c22" r="1.5" />
            <circle cx="54" cy="48" fill="#022c22" r="1.5" />
            <path d="M34 80 L30 88 M66 80 L70 88" stroke="#4ade80" strokeLinecap="round" strokeWidth="3" />
          </svg>
          <span className="text-[8px] sm:text-[9px] font-black text-emerald-300 tracking-wider uppercase mt-0.5">BỎ LƯỢT</span>
        </div>
      );

    case 'reverse':
      // Twin Spiraling Spirits Reverse (Song hồn ma trơi đảo chiều)
      return (
        <div className="flex flex-col items-center justify-center">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_0_12px_#38bdf8]" fill="none" viewBox="0 0 100 100">
            {/* Ghost 1 */}
            <path d="M30 35 C30 20 48 18 48 30 C48 40 40 44 44 48 C42 46 38 48 36 46 C34 48 32 46 30 48 Z" fill="#e0f2fe" opacity="0.95" />
            <circle cx="37" cy="27" fill="#0c4a6e" r="2" />
            <circle cx="43" cy="27" fill="#0c4a6e" r="2" />
            <path d="M48 24 Q65 20 72 35" stroke="#7dd3fc" strokeLinecap="round" strokeWidth="3.5" />
            <polygon fill="#38bdf8" points="75,32 72,40 65,34" />
            {/* Ghost 2 */}
            <path d="M70 65 C70 80 52 82 52 70 C52 60 60 56 56 52 C58 54 62 52 64 54 C66 52 68 54 70 52 Z" fill="#bae6fd" opacity="0.95" />
            <circle cx="63" cy="73" fill="#0c4a6e" r="2" />
            <circle cx="57" cy="73" fill="#0c4a6e" r="2" />
            <path d="M52 76 Q35 80 28 65" stroke="#7dd3fc" strokeLinecap="round" strokeWidth="3.5" />
            <polygon fill="#38bdf8" points="25,68 28,60 35,66" />
          </svg>
          <span className="text-[8px] sm:text-[9px] font-black text-cyan-200 tracking-wider uppercase mt-0.5">ĐỔI CHIỀU</span>
        </div>
      );

    case 'draw_two':
      // Vampire Fangs Draw Two (Cánh dơi & Răng nanh ma cà rồng rút 2)
      return (
        <div className="flex flex-col items-center justify-center">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_0_12px_#f43f5e]" fill="none" viewBox="0 0 100 100">
            {/* Bat Wings */}
            <path d="M50 36 C55 22 75 16 92 28 C84 38 88 50 82 56 C74 50 68 54 62 48 C56 52 52 46 50 48 C48 46 44 52 38 48 C32 54 26 50 18 56 C12 50 16 38 8 28 C25 16 45 22 50 36 Z" fill="#991b1b" stroke="#fda4af" strokeWidth="1.5" />
            {/* Ruby Gem */}
            <polygon fill="#f43f5e" points="50,42 58,54 50,66 42,54" />
            <text fill="#ffe4e6" fontFamily="'Sora', sans-serif" fontSize="24" fontWeight="900" stroke="#e11d48" strokeWidth="1" textAnchor="middle" x="50" y="86">+2</text>
          </svg>
          <span className="text-[8px] sm:text-[9px] font-black text-rose-300 tracking-wider uppercase mt-0.5">RÚT 2</span>
        </div>
      );

    case 'wild':
      // Haunted Castle Wild (Lâu đài ma ám dưới trăng tròn)
      return (
        <div className="flex flex-col items-center justify-center">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_0_12px_#c084fc]" fill="none" viewBox="0 0 100 100">
            <circle cx="50" cy="42" fill="#fef08a" opacity="0.9" r="30" />
            <circle cx="44" cy="38" fill="#fde047" opacity="0.5" r="4" />
            <path d="M26 80 L32 55 L38 55 L38 80 L44 80 L44 48 L48 42 L52 42 L56 48 L56 80 L62 80 L62 55 L68 55 L74 80 Z" fill="#0f0728" />
            <polygon fill="#0f0728" points="50,30 46,42 54,42" />
            <path d="M24 30 Q28 26 32 30 Q30 32 28 30 Z" fill="#1e1b4b" />
            <path d="M68 22 Q72 18 76 22 Q74 24 72 22 Z" fill="#1e1b4b" />
          </svg>
          <span className="text-[8px] sm:text-[9px] font-black text-purple-200 tracking-wider uppercase mt-0.5">ĐỔI MÀU</span>
        </div>
      );

    case 'wild_draw_four':
      return (
        <div className="flex flex-col items-center justify-center">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_0_12px_#c084fc]" fill="none" viewBox="0 0 100 100">
            <circle cx="50" cy="42" fill="#fef08a" opacity="0.9" r="30" />
            <path d="M26 80 L32 55 L38 55 L38 80 L44 80 L44 48 L48 42 L52 42 L56 48 L56 80 L62 80 L62 55 L68 55 L74 80 Z" fill="#0f0728" />
            <polygon fill="#0f0728" points="50,30 46,42 54,42" />
          </svg>
          <span className="font-headline text-2xl font-black text-amber-300 drop-shadow-[0_0_8px_#f59e0b] -mt-2">
            +4
          </span>
          <span className="text-[7px] sm:text-[8px] font-black text-purple-200 tracking-wider uppercase mt-0.5">RÚT 4 LÁ</span>
        </div>
      );

    case '7':
      // Jack-o'-lantern 7 (Khuôn mặt bí ngô ma quái chạm khắc từ tài liệu tham khảo)
      return (
        <div className="flex flex-col items-center justify-center">
          <svg className="w-10 h-10 sm:w-11 sm:h-11 drop-shadow-[0_0_10px_#fbbf24]" fill="none" viewBox="0 0 100 100">
            <path d="M48 12C50 6 56 5 58 4C56 9 53 13 52 16" stroke="#4ade80" strokeLinecap="round" strokeWidth="4" />
            <polygon fill="#fef08a" points="30,38 42,42 34,48" />
            <polygon fill="#fef08a" points="70,38 58,42 66,48" />
            <polygon fill="#fde047" points="50,49 44,57 56,57" />
            <path d="M25,65 Q50,90 75,65 Q70,75 64,72 L62,67 L56,71 L51,66 L46,71 L40,67 L36,73 Q30,73 25,65 Z" fill="#fde047" />
            <ellipse cx="50" cy="54" opacity="0.6" rx="42" ry="34" stroke="#f97316" strokeDasharray="4 2" strokeWidth="2.5" />
          </svg>
          <span className="font-headline text-xl sm:text-2xl font-black italic tracking-tighter drop-shadow-md text-amber-200 -mt-1">
            7
          </span>
        </div>
      );

    default:
      // Các lá số Halloween thông thường (0..9)
      return (
        <div className="relative flex flex-col items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
            <span className="text-2xl sm:text-3xl">🎃</span>
          </div>
          <span className="font-headline text-4xl sm:text-5xl font-black italic tracking-tighter drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] z-10">
            {value}
          </span>
        </div>
      );
  }
}

/**
 * Helper hàm render nhãn & icon hiển thị mặc định Classic
 */
function renderClassicContent(value, isCorner = false) {
  switch (value) {
    case 'skip':
      return isCorner ? (
        <span className="font-black text-[11px] leading-none">⊘</span>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-3xl sm:text-4xl font-black">
            block
          </span>
          <span className="text-[9px] font-black tracking-widest uppercase mt-0.5">SKIP</span>
        </div>
      );

    case 'reverse':
      return isCorner ? (
        <span className="font-black text-[11px] leading-none">⇄</span>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-3xl sm:text-4xl font-black">
            sync_alt
          </span>
          <span className="text-[9px] font-black tracking-widest uppercase mt-0.5">REVERSE</span>
        </div>
      );

    case 'draw_two':
      return isCorner ? (
        <span className="font-black text-[11px] sm:text-xs leading-none">+2</span>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <span className="font-headline text-3xl sm:text-4xl font-black italic tracking-tighter drop-shadow-md">
            +2
          </span>
          <span className="text-[8px] font-black tracking-wider uppercase mt-0.5 opacity-90">RÚT 2</span>
        </div>
      );

    case 'wild':
      return isCorner ? (
        <span className="font-headline font-black text-xs sm:text-sm text-white drop-shadow leading-none">
          W
        </span>
      ) : (
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden grid grid-cols-2 grid-rows-2 shadow-[0_2px_12px_rgba(0,0,0,0.5)] border-2 border-white/90">
          <div className="bg-rose-500"></div>
          <div className="bg-sky-400"></div>
          <div className="bg-amber-400"></div>
          <div className="bg-emerald-500"></div>
        </div>
      );

    case 'wild_draw_four':
      return isCorner ? (
        <span className="font-headline font-black text-xs sm:text-sm text-white drop-shadow leading-none">
          +4
        </span>
      ) : (
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden grid grid-cols-2 grid-rows-2 shadow-[0_2px_12px_rgba(0,0,0,0.5)] border-2 border-white/90">
          <div className="bg-rose-500"></div>
          <div className="bg-sky-400"></div>
          <div className="bg-amber-400"></div>
          <div className="bg-emerald-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-headline text-3xl sm:text-4xl font-black italic text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              +4
            </span>
          </div>
        </div>
      );

    default:
      return isCorner ? (
        <span className="font-headline font-black text-xs sm:text-sm leading-none">
          {value}
        </span>
      ) : (
        <span className="font-headline text-4xl sm:text-5xl font-black italic tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
          {value}
        </span>
      );
  }
}

/**
 * Cấu hình style và màu nền cho Skin HALLOWEEN
 */
const HALLOWEEN_COLOR_CONFIGS = {
  red: {
    bg: 'bg-gradient-to-br from-red-600 via-rose-700 to-stone-950',
    innerBg: 'bg-gradient-to-b from-rose-950/80 via-black/90 to-red-950/95',
    border: 'border-red-500/60',
    shadow: 'shadow-[0_4px_22px_rgba(239,68,68,0.5)] hover:shadow-[0_8px_32px_rgba(239,68,68,0.8)]',
    textColor: 'text-rose-300',
    ovalBg: 'bg-gradient-to-tr from-rose-600 to-red-400 p-[1.5px] shadow-[0_0_15px_rgba(244,63,94,0.6)]',
    innerOval: 'bg-gradient-to-b from-black via-zinc-950 to-rose-950',
    strokeColor: '#ef4444',
  },
  blue: {
    bg: 'bg-gradient-to-br from-sky-400 via-cyan-600 to-blue-950',
    innerBg: 'bg-gradient-to-b from-cyan-950/80 via-black/90 to-blue-950/95',
    border: 'border-cyan-400/60',
    shadow: 'shadow-[0_4px_22px_rgba(6,182,212,0.5)] hover:shadow-[0_8px_32px_rgba(6,182,212,0.8)]',
    textColor: 'text-cyan-300',
    ovalBg: 'bg-gradient-to-tr from-cyan-400 to-sky-200 p-[1.5px] shadow-[0_0_15px_rgba(6,182,212,0.6)]',
    innerOval: 'bg-gradient-to-b from-black via-slate-950 to-cyan-950',
    strokeColor: '#38bdf8',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-950',
    innerBg: 'bg-gradient-to-b from-green-950/80 via-black/90 to-emerald-950/95',
    border: 'border-emerald-400/60',
    shadow: 'shadow-[0_4px_22px_rgba(34,197,94,0.5)] hover:shadow-[0_8px_32px_rgba(34,197,94,0.8)]',
    textColor: 'text-emerald-300',
    ovalBg: 'bg-gradient-to-tr from-emerald-500 to-green-300 p-[1.5px] shadow-[0_0_15px_rgba(34,197,94,0.6)]',
    innerOval: 'bg-gradient-to-b from-black via-zinc-950 to-green-950',
    strokeColor: '#4ade80',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-amber-500 via-orange-600 to-amber-950',
    innerBg: 'bg-gradient-to-b from-orange-950/80 via-black/90 to-amber-950/95',
    border: 'border-amber-400/60',
    shadow: 'shadow-[0_4px_22px_rgba(249,115,22,0.5)] hover:shadow-[0_8px_32px_rgba(249,115,22,0.8)]',
    textColor: 'text-amber-300',
    ovalBg: 'bg-gradient-to-tr from-amber-600 to-orange-400 p-[1.5px] shadow-[0_0_15px_rgba(249,115,22,0.6)]',
    innerOval: 'bg-gradient-to-b from-black via-stone-900 to-amber-950',
    strokeColor: '#f97316',
  },
  wild: {
    bg: 'bg-gradient-to-br from-purple-600 via-indigo-700 to-fuchsia-950',
    innerBg: 'bg-gradient-to-b from-purple-950/90 via-black/95 to-slate-950',
    border: 'border-purple-400/60',
    shadow: 'shadow-[0_4px_22px_rgba(168,85,247,0.5)] hover:shadow-[0_8px_32px_rgba(168,85,247,0.8)]',
    textColor: 'text-purple-200',
    ovalBg: 'bg-gradient-to-r from-red-500 via-amber-400 via-emerald-400 to-purple-500 p-[1.5px] shadow-[0_0_20px_rgba(192,132,252,0.7)] animate-pulse',
    innerOval: 'bg-gradient-to-b from-slate-950 via-purple-950 to-black',
    strokeColor: '#c084fc',
  },
};

/**
 * Cấu hình style và màu nền cho Skin CLASSIC mặc định
 */
const CLASSIC_COLOR_CONFIGS = {
  red: {
    bg: 'bg-gradient-to-br from-rose-500 via-red-600 to-rose-700',
    border: 'border-rose-400/50',
    shadow: 'shadow-[0_4px_20px_rgba(244,63,94,0.4)] hover:shadow-[0_8px_30px_rgba(244,63,94,0.7)]',
    textColor: 'text-white',
    ovalBg: 'bg-white/15',
    ovalBorder: 'border-white/20',
  },
  blue: {
    bg: 'bg-gradient-to-br from-sky-400 via-cyan-500 to-blue-600',
    border: 'border-sky-300/50',
    shadow: 'shadow-[0_4px_20px_rgba(14,165,233,0.4)] hover:shadow-[0_8px_30px_rgba(14,165,233,0.7)]',
    textColor: 'text-white',
    ovalBg: 'bg-black/20',
    ovalBorder: 'border-white/20',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-700',
    border: 'border-emerald-300/50',
    shadow: 'shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.7)]',
    textColor: 'text-white',
    ovalBg: 'bg-black/20',
    ovalBorder: 'border-white/20',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500',
    border: 'border-amber-200/60',
    shadow: 'shadow-[0_4px_20px_rgba(250,204,21,0.4)] hover:shadow-[0_8px_30px_rgba(250,204,21,0.7)]',
    textColor: 'text-slate-900',
    ovalBg: 'bg-black/15',
    ovalBorder: 'border-black/10',
  },
  wild: {
    bg: 'bg-gradient-to-br from-slate-900 via-[#181d29] to-slate-950',
    border: 'border-white/30 hover:border-white/80',
    shadow: 'shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.2)]',
    textColor: 'text-white',
    ovalBg: 'bg-black/25',
    ovalBorder: 'border-white/20',
  },
};

/**
 * Component UnoCard - Hiển thị lá bài chuẩn UNO với hỗ trợ Theme Skin bài trên tay (Task 5)
 *
 * @param {Object} props
 * @param {'red'|'blue'|'green'|'yellow'|'wild'} props.color - Màu sắc của lá bài
 * @param {string} props.value - Giá trị: '0'..'9', 'skip', 'reverse', 'draw_two', 'wild', 'wild_draw_four'
 * @param {string} [props.skinId] - Mã Skin bài ('skin_classic', 'skin_halloween', 'skin_cyberpunk', v.v.)
 * @param {Function} [props.onClick] - Xử lý khi click vào lá bài
 * @param {string} [props.className] - Class bổ sung tùy biến
 * @param {boolean} [props.disabled] - Trạng thái vô hiệu hóa
 * @param {boolean} [props.selected] - Trạng thái đang được chọn
 */
function UnoCard({
  color = 'red',
  value = '0',
  skinId,
  onClick,
  className = '',
  disabled = false,
  selected = false,
}) {
  // Lấy skinId an toàn từ AuthContext nếu props không truyền
  let userEquippedSkin = 'skin_classic';
  try {
    const auth = useAuth();
    if (auth?.user?.equippedCardSkin) {
      userEquippedSkin = auth.user.equippedCardSkin;
    }
  } catch {}

  const activeSkin = skinId || userEquippedSkin || 'skin_classic';

  // =========================================================================
  // PHONG CÁCH 1: HALLOWEEN SPOOKY 2026 (Chuẩn thiết kế từ File Word)
  // =========================================================================
  if (activeSkin === 'skin_halloween') {
    const hTheme = HALLOWEEN_COLOR_CONFIGS[color] || HALLOWEEN_COLOR_CONFIGS.red;

    // Helper render góc trên & góc dưới cho Halloween
    const renderHalloweenCorner = () => {
      switch (value) {
        case 'skip':
          return (
            <div className="flex flex-col items-center leading-none">
              <ProhibitionSkipCornerSvg />
              <span className="text-[6px] sm:text-[7px] text-emerald-300 font-black mt-0.5">SKIP</span>
            </div>
          );
        case 'reverse':
          return (
            <div className="flex flex-col items-center leading-none">
              <GhostReverseCornerSvg />
              <span className="text-[6px] sm:text-[7px] text-cyan-300 font-black mt-0.5">REV</span>
            </div>
          );
        case 'draw_two':
          return (
            <div className="flex flex-col items-center leading-none">
              <span className="font-headline font-black text-xs sm:text-sm text-rose-300 drop-shadow-[0_0_6px_#ef4444]">
                +2
              </span>
              <VampireFangsCornerSvg />
            </div>
          );
        case 'wild':
        case 'wild_draw_four':
          return (
            <div className="flex flex-col items-center leading-none">
              <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full overflow-hidden p-0.5 bg-black/60 border border-purple-400/50">
                <div className="bg-red-500 rounded-tl-xs"></div>
                <div className="bg-blue-500 rounded-tr-xs"></div>
                <div className="bg-amber-400 rounded-bl-xs"></div>
                <div className="bg-emerald-500 rounded-br-xs"></div>
              </div>
              <span className="text-[6px] sm:text-[7px] text-purple-300 font-extrabold mt-0.5">
                {value === 'wild_draw_four' ? '+4' : 'WILD'}
              </span>
            </div>
          );
        default:
          return (
            <div className="flex flex-col items-center leading-none">
              <span className={`font-headline font-black text-xs sm:text-sm ${hTheme.textColor} leading-none`}>
                {value}
              </span>
              <MiniPumpkinSvg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 mt-0.5" />
            </div>
          );
      }
    };

    return (
      <div
        onClick={!disabled && onClick ? onClick : undefined}
        className={`
          relative w-20 h-32 sm:w-24 sm:h-36 rounded-2xl p-1.5 select-none flex flex-col justify-between
          border-2 ${hTheme.border} ${hTheme.bg} ${hTheme.shadow}
          transition-all duration-200 ease-out transform-gpu
          ${disabled ? 'opacity-40 cursor-not-allowed grayscale-[40%]' : 'cursor-pointer hover:-translate-y-2 hover:scale-105 active:scale-95'}
          ${selected ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-[#0b0e17] -translate-y-3 shadow-[0_0_25px_rgba(249,115,22,0.9)]' : ''}
          ${className}
        `}
        title={`[Halloween Spooky] Lá bài UNO ${color.toUpperCase()} - ${value}`}
      >
        {/* Lớp khung viền sâu bên trong (Inner Deep Container) */}
        <div className={`relative w-full h-full rounded-[14px] ${hTheme.innerBg} overflow-hidden flex flex-col justify-between p-1.5 border border-white/10`}>
          
          {/* Subtle Atmospheric Web SVG Pattern in Background */}
          <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,0 Q60,20 120,0 M0,0 Q30,50 0,100 M120,0 Q90,50 120,100 M60,0 L60,100" fill="none" stroke={hTheme.strokeColor} strokeWidth="1" />
          </svg>

          {/* Góc trên bên trái */}
          <div className="flex items-center justify-start z-10 pl-0.5 pt-0.5">
            {renderHalloweenCorner()}
          </div>

          {/* Trung tâm: Elip nghiêng -12° Halloween với SVGs độc quyền */}
          <div className="absolute inset-1.5 flex items-center justify-center overflow-hidden pointer-events-none">
            <div className={`w-[86%] h-[78%] rounded-full -rotate-12 flex items-center justify-center ${hTheme.ovalBg}`}>
              <div className={`w-full h-full rounded-full ${hTheme.innerOval} flex items-center justify-center overflow-hidden relative p-1`}>
                <div className="rotate-12 flex items-center justify-center">
                  {renderHalloweenCenter(value, color)}
                </div>
              </div>
            </div>
          </div>

          {/* Góc dưới bên phải (Xoay 180 độ) */}
          <div className="flex items-center justify-end z-10 pr-0.5 pb-0.5 rotate-180">
            {renderHalloweenCorner()}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // PHONG CÁCH 2: MẶC ĐỊNH (Classic Neo-Glassmorphism)
  // =========================================================================
  const theme = CLASSIC_COLOR_CONFIGS[color] || CLASSIC_COLOR_CONFIGS.red;

  return (
    <div
      onClick={!disabled && onClick ? onClick : undefined}
      className={`
        relative w-20 h-32 sm:w-24 sm:h-36 rounded-2xl p-2 select-none flex flex-col justify-between
        border ${theme.border} ${theme.bg} ${theme.textColor} ${theme.shadow}
        transition-all duration-200 ease-out transform-gpu
        ${disabled ? 'opacity-40 cursor-not-allowed grayscale-[40%]' : 'cursor-pointer hover:-translate-y-2 hover:scale-105 active:scale-95'}
        ${selected ? 'ring-4 ring-white ring-offset-2 ring-offset-[#0b0e17] -translate-y-3' : ''}
        ${className}
      `}
      title={`Lá bài UNO ${color.toUpperCase()} - ${value}`}
    >
      {/* Góc trên bên trái */}
      <div className="flex items-center justify-start z-10 pl-0.5 pt-0.5">
        {renderClassicContent(value, true)}
      </div>

      {/* Trung tâm Elip nghiêng */}
      <div className="absolute inset-2 flex items-center justify-center overflow-hidden pointer-events-none">
        <div
          className={`
            w-[86%] h-[78%] rounded-full -rotate-12 flex items-center justify-center
            border ${theme.ovalBorder} ${theme.ovalBg} backdrop-blur-xs shadow-inner
          `}
        >
          <div className="rotate-12 flex items-center justify-center">
            {renderClassicContent(value, false)}
          </div>
        </div>
      </div>

      {/* Góc dưới bên phải */}
      <div className="flex items-center justify-end z-10 pr-0.5 pb-0.5 rotate-180">
        {renderClassicContent(value, true)}
      </div>
    </div>
  );
}

export default React.memo(UnoCard);
