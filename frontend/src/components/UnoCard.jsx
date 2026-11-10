import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * =========================================================================
 * 1. HALLOWEEN SPOOKY 2026 SVGs (Chuẩn Vector SVG từ File Word tham khảo)
 * =========================================================================
 */

function MiniPumpkinSvg({ className = 'w-3 h-3 text-amber-400' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2c.5 1 .3 2-.2 3C16.8 5.3 20 8.3 20 12c0 4.4-3.6 8-8 8s-8-3.6-8-8c0-3.7 3.2-6.7 8.2-7-.5-1-.7-2-.2-3zm-3 7c-.6 0-1 .4-1 1 0 .8.7 1.4 1.5 1.2.6-.2.8-.8.5-1.4-.2-.5-.6-.8-1-.8zm6 0c-.4 0-.8.3-1 .8-.3.6-.1 1.2.5 1.4.8.2 1.5-.4 1.5-1.2 0-.6-.4-1-1-1zm-3 4c-2 0-3 1-3.5 2h7c-.5-1-1.5-2-3.5-2z" />
    </svg>
  );
}

function VampireFangsCornerSvg({ className = 'w-3.5 h-2 text-rose-400' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 12">
      <path d="M2 1h16c-1 3-2 6-4 10-1-3-2-6-4-10-2 4-3 7-4 10C5 7 4 4 2 1z" />
    </svg>
  );
}

function ProhibitionSkipCornerSvg({ className = 'w-3.5 h-3.5 text-emerald-400' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <line x1="5.7" x2="18.3" y1="5.7" y2="18.3" />
    </svg>
  );
}

function GhostReverseCornerSvg({ className = 'w-3.5 h-3.5 text-cyan-300' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
      <polyline points="9 14 4 9 9 4" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

function renderHalloweenCenter(value, color) {
  switch (value) {
    case 'skip':
      return (
        <div className="flex flex-col items-center justify-center">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_0_12px_#22c55e]" fill="none" viewBox="0 0 100 100">
            <path d="M50 8 L32 30 L68 30 Z" fill="#6ee7b7" />
            <ellipse cx="50" cy="30" fill="#a7f3d0" rx="24" ry="4" />
            <circle cx="42" cy="38" fill="#86efac" opacity="0.8" r="4" />
            <circle cx="58" cy="36" fill="#4ade80" opacity="0.9" r="5" />
            <circle cx="50" cy="42" fill="#bbf7d0" r="3" />
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
      return (
        <div className="flex flex-col items-center justify-center">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_0_12px_#38bdf8]" fill="none" viewBox="0 0 100 100">
            <path d="M30 35 C30 20 48 18 48 30 C48 40 40 44 44 48 C42 46 38 48 36 46 C34 48 32 46 30 48 Z" fill="#e0f2fe" opacity="0.95" />
            <circle cx="37" cy="27" fill="#0c4a6e" r="2" />
            <circle cx="43" cy="27" fill="#0c4a6e" r="2" />
            <path d="M48 24 Q65 20 72 35" stroke="#7dd3fc" strokeLinecap="round" strokeWidth="3.5" />
            <polygon fill="#38bdf8" points="75,32 72,40 65,34" />
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
      return (
        <div className="flex flex-col items-center justify-center">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_0_12px_#f43f5e]" fill="none" viewBox="0 0 100 100">
            <path d="M50 36 C55 22 75 16 92 28 C84 38 88 50 82 56 C74 50 68 54 62 48 C56 52 52 46 50 48 C48 46 44 52 38 48 C32 54 26 50 18 56 C12 50 16 38 8 28 C25 16 45 22 50 36 Z" fill="#991b1b" stroke="#fda4af" strokeWidth="1.5" />
            <polygon fill="#f43f5e" points="50,42 58,54 50,66 42,54" />
            <text fill="#ffe4e6" fontFamily="'Sora', sans-serif" fontSize="24" fontWeight="900" stroke="#e11d48" strokeWidth="1" textAnchor="middle" x="50" y="86">+2</text>
          </svg>
          <span className="text-[8px] sm:text-[9px] font-black text-rose-300 tracking-wider uppercase mt-0.5">RÚT 2</span>
        </div>
      );

    case 'wild':
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
 * Cấu hình style và màu nền cho Skin CYBERPUNK 2077
 */
const CYBERPUNK_COLOR_CONFIGS = {
  red: {
    bg: 'bg-gradient-to-br from-rose-500 via-pink-600 to-[#120010]',
    innerBg: 'bg-gradient-to-b from-[#180210] via-black to-[#0c0008]',
    border: 'border-pink-500/70',
    shadow: 'shadow-[0_4px_20px_rgba(236,72,153,0.55)] hover:shadow-[0_8px_30px_rgba(236,72,153,0.85)]',
    textColor: 'text-pink-300',
    badge: 'CYBER',
  },
  blue: {
    bg: 'bg-gradient-to-br from-cyan-400 via-sky-600 to-[#020b18]',
    innerBg: 'bg-gradient-to-b from-[#020e24] via-black to-[#010814]',
    border: 'border-cyan-400/80',
    shadow: 'shadow-[0_4px_20px_rgba(6,182,212,0.6)] hover:shadow-[0_8px_30px_rgba(6,182,212,0.9)]',
    textColor: 'text-cyan-300',
    badge: 'CYBER',
  },
  green: {
    bg: 'bg-gradient-to-br from-lime-400 via-emerald-600 to-[#021408]',
    innerBg: 'bg-gradient-to-b from-[#021808] via-black to-[#010c04]',
    border: 'border-lime-400/70',
    shadow: 'shadow-[0_4px_20px_rgba(132,204,22,0.55)] hover:shadow-[0_8px_30px_rgba(132,204,22,0.85)]',
    textColor: 'text-lime-300',
    badge: 'CYBER',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-yellow-300 via-amber-500 to-[#1a1202]',
    innerBg: 'bg-gradient-to-b from-[#1a1202] via-black to-[#0e0a01]',
    border: 'border-amber-400/80',
    shadow: 'shadow-[0_4px_20px_rgba(245,158,11,0.55)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.85)]',
    textColor: 'text-amber-300',
    badge: 'CYBER',
  },
  wild: {
    bg: 'bg-gradient-to-br from-cyan-400 via-fuchsia-600 to-[#15021a]',
    innerBg: 'bg-gradient-to-b from-[#180026] via-black to-[#080010]',
    border: 'border-cyan-300/80',
    shadow: 'shadow-[0_4px_24px_rgba(0,210,255,0.7)] hover:shadow-[0_8px_35px_rgba(0,210,255,0.95)]',
    textColor: 'text-cyan-200',
    badge: 'MATRIX',
  },
};

/**
 * Cấu hình style và màu nền cho Skin GALAXY (Thiên Hà Tím)
 */
const GALAXY_COLOR_CONFIGS = {
  red: {
    bg: 'bg-gradient-to-br from-rose-500 via-purple-900 to-[#0d0112]',
    innerBg: 'bg-gradient-to-b from-[#160220] via-black to-[#07000d]',
    border: 'border-rose-400/70',
    shadow: 'shadow-[0_4px_20px_rgba(244,63,94,0.55)] hover:shadow-[0_8px_30px_rgba(244,63,94,0.85)]',
    textColor: 'text-rose-300',
    badge: 'NEBULA',
  },
  blue: {
    bg: 'bg-gradient-to-br from-indigo-400 via-blue-800 to-[#03061c]',
    innerBg: 'bg-gradient-to-b from-[#060a28] via-black to-[#020412]',
    border: 'border-indigo-400/70',
    shadow: 'shadow-[0_4px_20px_rgba(129,140,248,0.55)] hover:shadow-[0_8px_30px_rgba(129,140,248,0.85)]',
    textColor: 'text-indigo-200',
    badge: 'NEBULA',
  },
  green: {
    bg: 'bg-gradient-to-br from-teal-400 via-emerald-800 to-[#01140e]',
    innerBg: 'bg-gradient-to-b from-[#021a12] via-black to-[#010c08]',
    border: 'border-teal-400/70',
    shadow: 'shadow-[0_4px_20px_rgba(45,212,191,0.55)] hover:shadow-[0_8px_30px_rgba(45,212,191,0.85)]',
    textColor: 'text-teal-200',
    badge: 'AURORA',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-amber-300 via-orange-800 to-[#170802]',
    innerBg: 'bg-gradient-to-b from-[#1a0a02] via-black to-[#0d0401]',
    border: 'border-amber-400/70',
    shadow: 'shadow-[0_4px_20px_rgba(251,191,36,0.55)] hover:shadow-[0_8px_30px_rgba(251,191,36,0.85)]',
    textColor: 'text-amber-200',
    badge: 'STARFIRE',
  },
  wild: {
    bg: 'bg-gradient-to-br from-purple-500 via-indigo-700 to-[#050014]',
    innerBg: 'bg-gradient-to-b from-[#13032d] via-black to-[#050012]',
    border: 'border-purple-400/80',
    shadow: 'shadow-[0_4px_24px_rgba(168,85,247,0.7)] hover:shadow-[0_8px_35px_rgba(192,132,252,0.95)]',
    textColor: 'text-purple-200',
    badge: 'COSMIC',
  },
};

/**
 * Cấu hình style và màu nền cho Skin HỎA LONG (Dragon Fire)
 */
const DRAGON_COLOR_CONFIGS = {
  red: {
    bg: 'bg-gradient-to-br from-red-600 via-orange-600 to-[#1c0303]',
    innerBg: 'bg-gradient-to-b from-[#250404] via-black to-[#100101]',
    border: 'border-orange-500/80',
    shadow: 'shadow-[0_4px_22px_rgba(249,115,22,0.65)] hover:shadow-[0_8px_32px_rgba(249,115,22,0.9)]',
    textColor: 'text-amber-300',
    badge: 'HỎA LONG',
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 via-sky-600 to-[#020b18]',
    innerBg: 'bg-gradient-to-b from-[#021028] via-black to-[#010814]',
    border: 'border-sky-400/80',
    shadow: 'shadow-[0_4px_22px_rgba(14,165,233,0.65)] hover:shadow-[0_8px_32px_rgba(14,165,233,0.9)]',
    textColor: 'text-sky-300',
    badge: 'HỎA LONG',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-500 via-green-600 to-[#021405]',
    innerBg: 'bg-gradient-to-b from-[#021a08] via-black to-[#010c04]',
    border: 'border-emerald-400/80',
    shadow: 'shadow-[0_4px_22px_rgba(16,185,129,0.65)] hover:shadow-[0_8px_32px_rgba(16,185,129,0.9)]',
    textColor: 'text-emerald-300',
    badge: 'HỎA LONG',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-amber-400 via-orange-500 to-[#1a0802]',
    innerBg: 'bg-gradient-to-b from-[#1e0a02] via-black to-[#0f0401]',
    border: 'border-amber-400/80',
    shadow: 'shadow-[0_4px_22px_rgba(245,158,11,0.65)] hover:shadow-[0_8px_32px_rgba(245,158,11,0.9)]',
    textColor: 'text-amber-300',
    badge: 'HỎA LONG',
  },
  wild: {
    bg: 'bg-gradient-to-br from-red-600 via-orange-600 to-[#120000]',
    innerBg: 'bg-gradient-to-b from-[#240404] via-black to-[#100000]',
    border: 'border-orange-500/90',
    shadow: 'shadow-[0_4px_25px_rgba(234,88,12,0.8)] hover:shadow-[0_8px_35px_rgba(234,88,12,1)]',
    textColor: 'text-amber-200',
    badge: 'INFERNO',
  },
};

/**
 * Cấu hình style và màu nền cho Skin HOÀNG GIA MẠ VÀNG 24K (Gold Luxury)
 */
const GOLD_COLOR_CONFIGS = {
  red: {
    bg: 'bg-gradient-to-br from-red-600 via-rose-800 to-[#1a0408]',
    innerBg: 'bg-gradient-to-b from-[#1e050a] via-black to-[#0e0204]',
    border: 'border-amber-300/80',
    shadow: 'shadow-[0_4px_22px_rgba(251,191,36,0.65)] hover:shadow-[0_8px_32px_rgba(251,191,36,0.9)]',
    textColor: 'text-amber-200',
    badge: '24K ROYAL',
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-600 via-indigo-800 to-[#04081a]',
    innerBg: 'bg-gradient-to-b from-[#050a22] via-black to-[#020412]',
    border: 'border-amber-300/80',
    shadow: 'shadow-[0_4px_22px_rgba(251,191,36,0.65)] hover:shadow-[0_8px_32px_rgba(251,191,36,0.9)]',
    textColor: 'text-amber-200',
    badge: '24K ROYAL',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-600 via-teal-800 to-[#041a0d]',
    innerBg: 'bg-gradient-to-b from-[#052010] via-black to-[#020e06]',
    border: 'border-amber-300/80',
    shadow: 'shadow-[0_4px_22px_rgba(251,191,36,0.65)] hover:shadow-[0_8px_32px_rgba(251,191,36,0.9)]',
    textColor: 'text-amber-200',
    badge: '24K ROYAL',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-yellow-300 via-amber-500 to-[#221602]',
    innerBg: 'bg-gradient-to-b from-[#1c1202] via-black to-[#0e0901]',
    border: 'border-amber-300/90',
    shadow: 'shadow-[0_4px_24px_rgba(251,191,36,0.75)] hover:shadow-[0_8px_35px_rgba(251,191,36,0.95)]',
    textColor: 'text-amber-300',
    badge: '24K ROYAL',
  },
  wild: {
    bg: 'bg-gradient-to-br from-yellow-300 via-amber-500 to-[#2b1f05]',
    innerBg: 'bg-gradient-to-b from-[#201503] via-black to-[#100a01]',
    border: 'border-amber-200/90',
    shadow: 'shadow-[0_4px_28px_rgba(251,191,36,0.85)] hover:shadow-[0_8px_40px_rgba(251,191,36,1)]',
    textColor: 'text-amber-200',
    badge: '24K SOVEREIGN',
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
  const auth = useContext(AuthContext);
  const userEquippedSkin = auth?.user?.equippedCardSkin || 'skin_classic';
  const activeSkin = skinId || userEquippedSkin || 'skin_classic';

  // =========================================================================
  // 1. SKIN HALLOWEEN
  // =========================================================================
  if (activeSkin === 'skin_halloween') {
    const hTheme = HALLOWEEN_COLOR_CONFIGS[color] || HALLOWEEN_COLOR_CONFIGS.red;

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
        <div className={`relative w-full h-full rounded-[14px] ${hTheme.innerBg} overflow-hidden flex flex-col justify-between p-1.5 border border-white/10`}>
          <div className="flex items-center justify-start z-10 pl-0.5 pt-0.5">
            {renderHalloweenCorner()}
          </div>
          <div className="absolute inset-1.5 flex items-center justify-center overflow-hidden pointer-events-none">
            <div className={`w-[86%] h-[78%] rounded-full -rotate-12 flex items-center justify-center ${hTheme.ovalBg}`}>
              <div className={`w-full h-full rounded-full ${hTheme.innerOval} flex items-center justify-center overflow-hidden relative p-1`}>
                <div className="rotate-12 flex items-center justify-center">
                  {renderHalloweenCenter(value, color)}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end z-10 pr-0.5 pb-0.5 rotate-180">
            {renderHalloweenCorner()}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. SKIN CYBERPUNK 2077
  // =========================================================================
  if (activeSkin === 'skin_cyberpunk') {
    const cTheme = CYBERPUNK_COLOR_CONFIGS[color] || CYBERPUNK_COLOR_CONFIGS.red;
    return (
      <div
        onClick={!disabled && onClick ? onClick : undefined}
        className={`
          relative w-20 h-32 sm:w-24 sm:h-36 rounded-2xl p-1.5 select-none flex flex-col justify-between
          border-2 ${cTheme.border} ${cTheme.bg} ${cTheme.shadow}
          transition-all duration-200 ease-out transform-gpu
          ${disabled ? 'opacity-40 cursor-not-allowed grayscale-[40%]' : 'cursor-pointer hover:-translate-y-2 hover:scale-105 active:scale-95'}
          ${selected ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-[#0b0e17] -translate-y-3 shadow-[0_0_25px_rgba(0,210,255,0.9)]' : ''}
          ${className}
        `}
        title={`[Cyberpunk 2077] Lá bài UNO ${color.toUpperCase()} - ${value}`}
      >
        <div className={`relative w-full h-full rounded-[14px] ${cTheme.innerBg} overflow-hidden flex flex-col justify-between p-1.5 border border-cyan-400/30`}>
          <div className="flex flex-col items-center self-start leading-none z-10 pl-0.5 pt-0.5">
            <span className={`font-mono font-black text-xs sm:text-sm ${cTheme.textColor}`}>
              {value === 'skip' ? '⊘' : value === 'reverse' ? '⇄' : value === 'draw_two' ? '+2' : value === 'wild' ? 'W' : value === 'wild_draw_four' ? '+4' : value}
            </span>
            <span className="text-[6px] font-mono text-cyan-400 font-bold uppercase mt-0.5">CYBER</span>
          </div>

          <div className="absolute inset-1.5 flex items-center justify-center overflow-hidden pointer-events-none">
            <div className="w-[86%] h-[78%] rounded-full -rotate-12 flex items-center justify-center bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-sky-300 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.7)]">
              <div className="w-full h-full rounded-full bg-[#020b18] flex items-center justify-center overflow-hidden relative">
                <div className="rotate-12 flex items-center justify-center text-cyan-300">
                  {renderClassicContent(value, false)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center self-end leading-none rotate-180 z-10 pr-0.5 pb-0.5">
            <span className={`font-mono font-black text-xs sm:text-sm ${cTheme.textColor}`}>
              {value === 'skip' ? '⊘' : value === 'reverse' ? '⇄' : value === 'draw_two' ? '+2' : value === 'wild' ? 'W' : value === 'wild_draw_four' ? '+4' : value}
            </span>
            <span className="text-[6px] font-mono text-cyan-400 font-bold uppercase mt-0.5">CYBER</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. SKIN GALAXY (Thiên Hà Tím)
  // =========================================================================
  if (activeSkin === 'skin_galaxy') {
    const gTheme = GALAXY_COLOR_CONFIGS[color] || GALAXY_COLOR_CONFIGS.red;
    return (
      <div
        onClick={!disabled && onClick ? onClick : undefined}
        className={`
          relative w-20 h-32 sm:w-24 sm:h-36 rounded-2xl p-1.5 select-none flex flex-col justify-between
          border-2 ${gTheme.border} ${gTheme.bg} ${gTheme.shadow}
          transition-all duration-200 ease-out transform-gpu
          ${disabled ? 'opacity-40 cursor-not-allowed grayscale-[40%]' : 'cursor-pointer hover:-translate-y-2 hover:scale-105 active:scale-95'}
          ${selected ? 'ring-4 ring-purple-400 ring-offset-2 ring-offset-[#0b0e17] -translate-y-3 shadow-[0_0_25px_rgba(168,85,247,0.9)]' : ''}
          ${className}
        `}
        title={`[Galaxy] Lá bài UNO ${color.toUpperCase()} - ${value}`}
      >
        <div className={`relative w-full h-full rounded-[14px] ${gTheme.innerBg} overflow-hidden flex flex-col justify-between p-1.5 border border-purple-400/30`}>
          <div className="flex flex-col items-center self-start leading-none z-10 pl-0.5 pt-0.5">
            <span className={`font-headline font-black text-xs sm:text-sm ${gTheme.textColor}`}>
              {value === 'skip' ? '⊘' : value === 'reverse' ? '⇄' : value === 'draw_two' ? '+2' : value === 'wild' ? 'W' : value === 'wild_draw_four' ? '+4' : value}
            </span>
            <span className="text-[7px] mt-0.5">✨</span>
          </div>

          <div className="absolute inset-1.5 flex items-center justify-center overflow-hidden pointer-events-none">
            <div className="w-[86%] h-[78%] rounded-full -rotate-12 flex items-center justify-center bg-gradient-to-tr from-purple-500 via-indigo-400 to-pink-400 p-0.5 shadow-[0_0_15px_rgba(192,132,252,0.7)]">
              <div className="w-full h-full rounded-full bg-[#0e0424] flex items-center justify-center overflow-hidden relative">
                <div className="rotate-12 flex items-center justify-center text-purple-200">
                  {renderClassicContent(value, false)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center self-end leading-none rotate-180 z-10 pr-0.5 pb-0.5">
            <span className={`font-headline font-black text-xs sm:text-sm ${gTheme.textColor}`}>
              {value === 'skip' ? '⊘' : value === 'reverse' ? '⇄' : value === 'draw_two' ? '+2' : value === 'wild' ? 'W' : value === 'wild_draw_four' ? '+4' : value}
            </span>
            <span className="text-[7px] mt-0.5">✨</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. SKIN HỎA LONG (Dragon Fire)
  // =========================================================================
  if (activeSkin === 'skin_dragon_fire' || activeSkin === 'skin_dragon') {
    const dTheme = DRAGON_COLOR_CONFIGS[color] || DRAGON_COLOR_CONFIGS.red;
    return (
      <div
        onClick={!disabled && onClick ? onClick : undefined}
        className={`
          relative w-20 h-32 sm:w-24 sm:h-36 rounded-2xl p-1.5 select-none flex flex-col justify-between
          border-2 ${dTheme.border} ${dTheme.bg} ${dTheme.shadow}
          transition-all duration-200 ease-out transform-gpu
          ${disabled ? 'opacity-40 cursor-not-allowed grayscale-[40%]' : 'cursor-pointer hover:-translate-y-2 hover:scale-105 active:scale-95'}
          ${selected ? 'ring-4 ring-orange-500 ring-offset-2 ring-offset-[#0b0e17] -translate-y-3 shadow-[0_0_25px_rgba(249,115,22,0.9)]' : ''}
          ${className}
        `}
        title={`[Hỏa Long] Lá bài UNO ${color.toUpperCase()} - ${value}`}
      >
        <div className={`relative w-full h-full rounded-[14px] ${dTheme.innerBg} overflow-hidden flex flex-col justify-between p-1.5 border border-orange-500/40`}>
          <div className="flex flex-col items-center self-start leading-none z-10 pl-0.5 pt-0.5">
            <span className={`font-headline font-black text-xs sm:text-sm ${dTheme.textColor}`}>
              {value === 'skip' ? '⊘' : value === 'reverse' ? '⇄' : value === 'draw_two' ? '+2' : value === 'wild' ? 'W' : value === 'wild_draw_four' ? '+4' : value}
            </span>
            <span className="text-[7px] mt-0.5">🔥</span>
          </div>

          <div className="absolute inset-1.5 flex items-center justify-center overflow-hidden pointer-events-none">
            <div className="w-[86%] h-[78%] rounded-full -rotate-12 flex items-center justify-center bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 p-0.5 shadow-[0_0_15px_rgba(249,115,22,0.7)]">
              <div className="w-full h-full rounded-full bg-[#180303] flex items-center justify-center overflow-hidden relative">
                <div className="rotate-12 flex items-center justify-center text-amber-300">
                  {renderClassicContent(value, false)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center self-end leading-none rotate-180 z-10 pr-0.5 pb-0.5">
            <span className={`font-headline font-black text-xs sm:text-sm ${dTheme.textColor}`}>
              {value === 'skip' ? '⊘' : value === 'reverse' ? '⇄' : value === 'draw_two' ? '+2' : value === 'wild' ? 'W' : value === 'wild_draw_four' ? '+4' : value}
            </span>
            <span className="text-[7px] mt-0.5">🔥</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. SKIN HOÀNG GIA MẠ VÀNG 24K (Gold Luxury)
  // =========================================================================
  if (activeSkin === 'skin_gold_luxury' || activeSkin === 'skin_gold_24k' || activeSkin === 'skin_gold') {
    const lTheme = GOLD_COLOR_CONFIGS[color] || GOLD_COLOR_CONFIGS.red;
    return (
      <div
        onClick={!disabled && onClick ? onClick : undefined}
        className={`
          relative w-20 h-32 sm:w-24 sm:h-36 rounded-2xl p-1.5 select-none flex flex-col justify-between
          border-2 ${lTheme.border} ${lTheme.bg} ${lTheme.shadow}
          transition-all duration-200 ease-out transform-gpu
          ${disabled ? 'opacity-40 cursor-not-allowed grayscale-[40%]' : 'cursor-pointer hover:-translate-y-2 hover:scale-105 active:scale-95'}
          ${selected ? 'ring-4 ring-amber-300 ring-offset-2 ring-offset-[#0b0e17] -translate-y-3 shadow-[0_0_25px_rgba(251,191,36,0.95)]' : ''}
          ${className}
        `}
        title={`[Hoàng Gia 24K] Lá bài UNO ${color.toUpperCase()} - ${value}`}
      >
        <div className={`relative w-full h-full rounded-[14px] ${lTheme.innerBg} overflow-hidden flex flex-col justify-between p-1.5 border border-amber-300/40`}>
          <div className="flex flex-col items-center self-start leading-none z-10 pl-0.5 pt-0.5">
            <span className={`font-serif font-black text-xs sm:text-sm ${lTheme.textColor}`}>
              {value === 'skip' ? '⊘' : value === 'reverse' ? '⇄' : value === 'draw_two' ? '+2' : value === 'wild' ? 'W' : value === 'wild_draw_four' ? '+4' : value}
            </span>
            <span className="text-[7px] mt-0.5">👑</span>
          </div>

          <div className="absolute inset-1.5 flex items-center justify-center overflow-hidden pointer-events-none">
            <div className="w-[86%] h-[78%] rounded-full -rotate-12 flex items-center justify-center bg-gradient-to-tr from-yellow-200 via-amber-400 to-yellow-600 p-0.5 shadow-[0_0_18px_rgba(251,191,36,0.85)]">
              <div className="w-full h-full rounded-full bg-[#160f03] flex items-center justify-center overflow-hidden relative">
                <div className="rotate-12 flex items-center justify-center text-amber-200">
                  {renderClassicContent(value, false)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center self-end leading-none rotate-180 z-10 pr-0.5 pb-0.5">
            <span className={`font-serif font-black text-xs sm:text-sm ${lTheme.textColor}`}>
              {value === 'skip' ? '⊘' : value === 'reverse' ? '⇄' : value === 'draw_two' ? '+2' : value === 'wild' ? 'W' : value === 'wild_draw_four' ? '+4' : value}
            </span>
            <span className="text-[7px] mt-0.5">👑</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 6. PHONG CÁCH MẶC ĐỊNH (Classic Neo-Glassmorphism)
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
      <div className="flex items-center justify-start z-10 pl-0.5 pt-0.5">
        {renderClassicContent(value, true)}
      </div>

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

      <div className="flex items-center justify-end z-10 pr-0.5 pb-0.5 rotate-180">
        {renderClassicContent(value, true)}
      </div>
    </div>
  );
}

export default React.memo(UnoCard);
