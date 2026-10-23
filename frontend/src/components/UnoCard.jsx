import React from 'react';

/**
 * Helper hàm render nhãn & icon hiển thị cho các giá trị UNO
 * @param {string} value - '0'..'9' | 'skip' | 'reverse' | 'draw_two' | 'wild' | 'wild_draw_four'
 * @param {boolean} isCorner - Hiển thị dạng góc nhỏ hay trung tâm lớn
 */
function renderCardContent(value, isCorner = false) {
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
          {/* Chữ +4 to nổi bật ở giữa vòng tròn */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-headline text-3xl sm:text-4xl font-black italic text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              +4
            </span>
          </div>
        </div>
      );

    default:
      // Các số 0-9 thông thường
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
 * Cấu hình style và màu nền cho từng màu bài UNO
 */
const COLOR_CONFIGS = {
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
 * Component UnoCard - Hiển thị lá bài chuẩn UNO với phong cách Neo Glassmorphism
 *
 * @param {Object} props
 * @param {'red'|'blue'|'green'|'yellow'|'wild'} props.color - Màu sắc của lá bài
 * @param {string} props.value - Giá trị: '0'..'9', 'skip', 'reverse', 'draw_two', 'wild', 'wild_draw_four'
 * @param {Function} [props.onClick] - Xử lý khi click vào lá bài
 * @param {string} [props.className] - Class bổ sung tùy biến
 * @param {boolean} [props.disabled] - Trạng thái vô hiệu hóa
 * @param {boolean} [props.selected] - Trạng thái đang được chọn
 */
function UnoCard({
  color = 'red',
  value = '0',
  onClick,
  className = '',
  disabled = false,
  selected = false,
}) {
  const theme = COLOR_CONFIGS[color] || COLOR_CONFIGS.red;

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
      {/* Góc trên bên trái (Top-left Corner) */}
      <div className="flex items-center justify-start z-10 pl-0.5 pt-0.5">
        {renderCardContent(value, true)}
      </div>

      {/* Trung tâm lá bài với hình Elip nghiêng đặc trưng của UNO */}
      <div className="absolute inset-2 flex items-center justify-center overflow-hidden pointer-events-none">
        <div
          className={`
            w-[86%] h-[78%] rounded-full -rotate-12 flex items-center justify-center
            border ${theme.ovalBorder} ${theme.ovalBg} backdrop-blur-xs shadow-inner
          `}
        >
          <div className="rotate-12 flex items-center justify-center">
            {renderCardContent(value, false)}
          </div>
        </div>
      </div>

      {/* Góc dưới bên phải (Bottom-right Corner) - Xoay 180 độ theo chuẩn UNO */}
      <div className="flex items-center justify-end z-10 pr-0.5 pb-0.5 rotate-180">
        {renderCardContent(value, true)}
      </div>
    </div>
  );
}

export default React.memo(UnoCard);
