import React from 'react';

/**
 * Component CardBack - Hiển thị Mặt Lưng Lá Bài UNO theo Skin đã trang bị
 * Bao gồm bộ sưu tập độc quyền: Halloween Spooky '26 (chuẩn SVG từ bản thiết kế),
 * Cyberpunk 2077, Thiên Hà Tím (Galaxy), Hỏa Long (Dragon Fire), Mạ Vàng 24K (Gold Luxury), và Cổ Điển Ruby (Classic).
 *
 * @param {Object} props
 * @param {string} [props.skinId='skin_classic'] - Mã Skin ('skin_classic', 'skin_halloween', 'skin_cyberpunk', 'skin_galaxy', 'skin_dragon_fire', 'skin_gold_luxury')
 * @param {'sm'|'md'|'lg'|'deck'|'custom'} [props.size='md'] - Kích thước hiển thị
 * @param {string} [props.className] - CSS class tùy biến
 * @param {string} [props.label] - Nhãn text tùy chọn hiển thị trên thẻ bài
 * @param {boolean} [props.interactive=false] - Bật hiệu ứng rê chuột nổi 3D
 * @param {Function} [props.onClick] - Xử lý click
 */
export function CardBack({
  skinId = 'skin_classic',
  size = 'md',
  className = '',
  label = '',
  interactive = false,
  onClick,
}) {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  // Bản đồ kích thước tiêu chuẩn
  const sizeClasses = {
    sm: 'w-7 h-10 sm:w-8 sm:h-11 rounded-[6px] text-[7px]',
    md: 'w-18 h-26 sm:w-20 sm:h-28 md:w-24 md:h-34 rounded-[18px] text-[10px]',
    lg: 'w-56 h-84 sm:w-64 sm:h-96 rounded-[28px] text-xs',
    deck: 'w-full h-full rounded-[18px]',
    custom: '',
  };

  // =========================================================================
  // 1. HALLOWEEN SPOOKY 2026 (Chuẩn thiết kế từ File Word)
  // =========================================================================
  if (skinId === 'skin_halloween') {
    return (
      <div
        onClick={onClick}
        className={`
          relative select-none overflow-hidden flex flex-col items-center justify-center
          bg-gradient-to-br from-violet-900 via-neutral-900 to-black
          border-2 border-violet-500/70 shadow-[0_0_20px_rgba(139,92,246,0.6)]
          ${isSmall ? 'p-0.5 rounded-[6px]' : 'p-1 sm:p-2 rounded-[18px]'}
          ${interactive ? 'transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(168,85,247,0.85)] cursor-pointer' : ''}
          ${sizeClasses[size] || ''} ${className}
        `}
      >
        {/* Lớp nền sâu bên trong */}
        <div
          className={`
            relative w-full h-full bg-gradient-to-b from-stone-950 via-zinc-950 to-black overflow-hidden flex flex-col items-center justify-center border border-violet-500/30
            ${isSmall ? 'p-0.5 rounded-[4px]' : 'p-1 sm:p-2 rounded-[14px] sm:rounded-[16px]'}
          `}
        >
          {/* MẠNG NHỆN CỔ KÍNH 4 GÓC (SVG chuẩn từ bản thiết kế) */}
          {/* Góc Trên - Trái */}
          <svg
            className={`absolute top-0.5 left-0.5 ${isSmall ? 'w-2.5 h-2.5 text-violet-400' : 'w-5 h-5 sm:w-8 sm:h-8 text-violet-300/80'} pointer-events-none z-10`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 40 40"
          >
            <path
              d="M0 0 L40 0 M0 0 L0 40 M0 0 L30 30 M15 0 Q15 15 0 15 M25 0 Q25 25 0 25 M35 0 Q35 35 0 35"
              strokeWidth={isSmall ? '2.5' : '1.5'}
            />
          </svg>

          {/* Góc Trên - Phải */}
          <svg
            className={`absolute top-0.5 right-0.5 ${isSmall ? 'w-2.5 h-2.5 text-violet-400' : 'w-5 h-5 sm:w-8 sm:h-8 text-violet-300/80'} rotate-90 pointer-events-none z-10`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 40 40"
          >
            <path
              d="M0 0 L40 0 M0 0 L0 40 M0 0 L30 30 M15 0 Q15 15 0 15 M25 0 Q25 25 0 25 M35 0 Q35 35 0 35"
              strokeWidth={isSmall ? '2.5' : '1.5'}
            />
          </svg>

          {/* Góc Dưới - Trái */}
          <svg
            className={`absolute bottom-0.5 left-0.5 ${isSmall ? 'w-2.5 h-2.5 text-violet-400' : 'w-5 h-5 sm:w-8 sm:h-8 text-violet-300/80'} -rotate-90 pointer-events-none z-10`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 40 40"
          >
            <path
              d="M0 0 L40 0 M0 0 L0 40 M0 0 L30 30 M15 0 Q15 15 0 15 M25 0 Q25 25 0 25 M35 0 Q35 35 0 35"
              strokeWidth={isSmall ? '2.5' : '1.5'}
            />
          </svg>

          {/* Góc Dưới - Phải */}
          <svg
            className={`absolute bottom-0.5 right-0.5 ${isSmall ? 'w-2.5 h-2.5 text-violet-400' : 'w-5 h-5 sm:w-8 sm:h-8 text-violet-300/80'} rotate-180 pointer-events-none z-10`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 40 40"
          >
            <path
              d="M0 0 L40 0 M0 0 L0 40 M0 0 L30 30 M15 0 Q15 15 0 15 M25 0 Q25 25 0 25 M35 0 Q35 35 0 35"
              strokeWidth={isSmall ? '2.5' : '1.5'}
            />
          </svg>

          {/* Vòng viền Dây Leo Bí Ngô Ma Quái */}
          {!isSmall && (
            <div className="absolute inset-1 sm:inset-2 rounded-[10px] sm:rounded-[14px] pointer-events-none opacity-40 bg-gradient-to-b from-transparent via-purple-500/15 to-transparent border border-purple-500/25"></div>
          )}

          {/* HÌNH ELIP NGHIÊNG ĐẶC TRƯNG VỚI HUY HIỆU 3D KIM LOẠI */}
          <div
            className={`
              relative rounded-[50%] -rotate-12 bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-purple-800 p-0.5
              shadow-[0_0_20px_rgba(168,85,247,0.7)] flex items-center justify-center
              ${isSmall ? 'w-5 h-7' : isLarge ? 'w-44 h-60' : 'w-12 h-16 sm:w-14 sm:h-18'}
            `}
          >
            <div className="w-full h-full rounded-[50%] bg-gradient-to-b from-zinc-950 via-purple-950 to-black flex flex-col items-center justify-center text-center p-0.5 relative overflow-hidden">
              
              {/* Mini Jack-o'-Lanterns viền trên & dưới */}
              <div className="absolute top-0.5 w-full flex justify-around opacity-80 leading-none">
                <span className={isSmall ? 'text-[5px]' : isLarge ? 'text-xs' : 'text-[7px]'}>🎃</span>
                <span className={isSmall ? 'text-[5px]' : isLarge ? 'text-xs' : 'text-[7px]'}>🎃</span>
              </div>

              {/* LOGO 3D NEO UNO METALLIC */}
              <div className="rotate-12 flex flex-col items-center leading-none z-10">
                <span
                  className={`
                    font-headline font-black tracking-widest text-cyan-300 drop-shadow-[0_0_4px_#38bdf8]
                    ${isSmall ? 'text-[4px]' : isLarge ? 'text-lg' : 'text-[7px] sm:text-[8px]'}
                  `}
                >
                  NEO
                </span>
                <span
                  className={`
                    font-headline font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-orange-600
                    drop-shadow-[0_2px_6px_rgba(245,158,11,0.9)]
                    ${isSmall ? 'text-[8px] sm:text-[9px]' : isLarge ? 'text-4xl sm:text-5xl mt-1' : 'text-sm sm:text-base'}
                  `}
                >
                  UNO
                </span>
                {!isSmall && (
                  <span
                    className={`
                      font-bold text-purple-300 uppercase tracking-widest
                      ${isLarge ? 'text-[10px] mt-1.5' : 'text-[5px] sm:text-[6px] mt-0.5'}
                    `}
                  >
                    HALLOWEEN
                  </span>
                )}
              </div>

              <div className="absolute bottom-0.5 w-full flex justify-around opacity-80 leading-none">
                <span className={isSmall ? 'text-[5px]' : isLarge ? 'text-xs' : 'text-[7px]'}>🎃</span>
                <span className={isSmall ? 'text-[5px]' : isLarge ? 'text-xs' : 'text-[7px]'}>🎃</span>
              </div>
            </div>
          </div>

          {label && (
            <span className="mt-0.5 font-headline font-bold text-amber-300 text-[8px] sm:text-[9px] uppercase tracking-wider drop-shadow z-10 whitespace-nowrap">
              {label}
            </span>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. CYBERPUNK 2077
  // =========================================================================
  if (skinId === 'skin_cyberpunk') {
    return (
      <div
        onClick={onClick}
        className={`
          relative select-none overflow-hidden flex flex-col items-center justify-center
          bg-gradient-to-br from-[#051329] via-[#0b1b38] to-[#1a0033]
          border-2 border-cyan-400/80 shadow-[0_0_20px_rgba(0,210,255,0.45)]
          ${isSmall ? 'p-0.5 rounded-[6px]' : 'p-1 sm:p-2 rounded-[18px]'}
          ${interactive ? 'transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(0,210,255,0.7)] cursor-pointer' : ''}
          ${sizeClasses[size] || ''} ${className}
        `}
      >
        <div className={`relative w-full h-full bg-[#030914] overflow-hidden flex flex-col items-center justify-center p-0.5 border border-cyan-500/30 ${isSmall ? 'rounded-[4px]' : 'rounded-[14px]'}`}>
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#00d2ff_1px,transparent_1px),linear-gradient(to_bottom,#00d2ff_1px,transparent_1px)] bg-[size:8px_8px]"></div>

          <div
            className={`
              relative rounded-[50%] -rotate-12 bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-blue-600 p-0.5
              shadow-[0_0_15px_rgba(0,210,255,0.7)] flex items-center justify-center
              ${isSmall ? 'w-5 h-7' : isLarge ? 'w-44 h-60' : 'w-12 h-16 sm:w-14 sm:h-18'}
            `}
          >
            <div className="w-full h-full rounded-[50%] bg-[#020b18] flex flex-col items-center justify-center text-center p-0.5">
              <div className="rotate-12 flex flex-col items-center leading-none">
                <span className={`font-mono font-black text-cyan-300 tracking-widest ${isSmall ? 'text-[4px]' : isLarge ? 'text-sm' : 'text-[7px]'}`}>
                  CYBER
                </span>
                <span className={`font-headline font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-pink-500 drop-shadow-[0_0_8px_#00d2ff] ${isSmall ? 'text-[8px]' : isLarge ? 'text-4xl' : 'text-sm sm:text-base'}`}>
                  UNO
                </span>
              </div>
            </div>
          </div>

          {label && (
            <span className="mt-0.5 font-mono font-bold text-cyan-300 text-[8px] sm:text-[9px] uppercase tracking-wider drop-shadow z-10">
              {label}
            </span>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. GALAXY (Thiên Hà Tím)
  // =========================================================================
  if (skinId === 'skin_galaxy') {
    return (
      <div
        onClick={onClick}
        className={`
          relative select-none overflow-hidden flex flex-col items-center justify-center
          bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950
          border-2 border-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.45)]
          ${isSmall ? 'p-0.5 rounded-[6px]' : 'p-1 sm:p-2 rounded-[18px]'}
          ${interactive ? 'transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.7)] cursor-pointer' : ''}
          ${sizeClasses[size] || ''} ${className}
        `}
      >
        <div className={`relative w-full h-full bg-[#0b0817] overflow-hidden flex flex-col items-center justify-center p-0.5 border border-purple-500/30 ${isSmall ? 'rounded-[4px]' : 'rounded-[14px]'}`}>
          <div
            className={`
              relative rounded-[50%] -rotate-12 bg-gradient-to-tr from-purple-500 via-indigo-400 to-pink-500 p-0.5
              shadow-[0_0_15px_rgba(192,132,252,0.7)] flex items-center justify-center
              ${isSmall ? 'w-5 h-7' : isLarge ? 'w-44 h-60' : 'w-12 h-16 sm:w-14 sm:h-18'}
            `}
          >
            <div className="w-full h-full rounded-[50%] bg-[#13072b] flex flex-col items-center justify-center text-center p-0.5">
              <div className="rotate-12 flex flex-col items-center leading-none">
                <span className={`font-headline font-black text-purple-300 tracking-widest ${isSmall ? 'text-[4px]' : isLarge ? 'text-sm' : 'text-[7px]'}`}>
                  GALAXY
                </span>
                <span className={`font-headline font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-purple-300 drop-shadow-[0_0_8px_#c084fc] ${isSmall ? 'text-[8px]' : isLarge ? 'text-4xl' : 'text-sm sm:text-base'}`}>
                  UNO
                </span>
              </div>
            </div>
          </div>

          {label && (
            <span className="mt-0.5 font-headline font-bold text-purple-200 text-[8px] sm:text-[9px] uppercase tracking-wider drop-shadow z-10">
              {label}
            </span>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. MẶC ĐỊNH: ĐỎ RUBY (Classic Uno Red)
  // =========================================================================
  return (
    <div
      onClick={onClick}
      className={`
        relative select-none overflow-hidden flex flex-col items-center justify-center
        bg-gradient-to-br from-[#e00050] via-[#c20042] to-[#800028]
        border-2 border-white/40 shadow-xl
        ${isSmall ? 'p-0.5 rounded-[6px]' : 'p-1 sm:p-2 rounded-[18px]'}
        ${interactive ? 'transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(224,0,80,0.6)] cursor-pointer' : ''}
        ${sizeClasses[size] || ''} ${className}
      `}
    >
      <div className={`relative w-full h-full bg-gradient-to-b from-black/15 to-black/35 overflow-hidden flex flex-col items-center justify-center p-0.5 border border-white/20 ${isSmall ? 'rounded-[4px]' : 'rounded-[14px]'}`}>
        <div
          className={`
            relative rounded-[50%] -rotate-12 bg-black/30 border border-white/30 backdrop-blur-xs flex items-center justify-center
            ${isSmall ? 'w-5 h-7' : isLarge ? 'w-44 h-60' : 'w-12 h-16 sm:w-14 sm:h-18'}
          `}
        >
          <div className="rotate-12 flex flex-col items-center leading-none">
            <span className={`font-headline font-black text-cyan-300 tracking-wider drop-shadow ${isSmall ? 'text-[4px]' : isLarge ? 'text-sm' : 'text-[7px]'}`}>
              NEO
            </span>
            <span className={`font-headline font-black text-white italic tracking-tighter drop-shadow-md ${isSmall ? 'text-[8px]' : isLarge ? 'text-4xl' : 'text-sm sm:text-base'}`}>
              UNO
            </span>
          </div>
        </div>

        {label && (
          <span className="mt-0.5 font-headline font-bold text-white text-[8px] sm:text-[9px] uppercase tracking-wider drop-shadow z-10">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export default React.memo(CardBack);
