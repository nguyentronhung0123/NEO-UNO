import React from 'react';

/**
 * Component CardBack - Hiển thị Mặt Lưng Lá Bài UNO theo Skin đã trang bị
 * Bộ sưu tập độc quyền 6 skin:
 * 1. skin_classic: Mặt Lưng Cổ Điển Đỏ Ruby (Classic Uno Red Neo-Glassmorphism)
 * 2. skin_halloween: 🎃 Halloween Spooky 2026 (Jack-o'-Lantern Edition)
 * 3. skin_cyberpunk: Neon Cyberpunk 2077 (Glitch Future Sci-Fi)
 * 4. skin_galaxy: Thiên Hà Vũ Trụ Tím (Deep Nebula Starry)
 * 5. skin_dragon_fire: Hỏa Long Rực Lửa (Dragon Flame Scales)
 * 6. skin_gold_luxury: Hoàng Gia Mạ Vàng 24K (Luxury 24K Gold Plated)
 *
 * @param {Object} props
 * @param {string} [props.skinId='skin_classic'] - Mã Skin
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
  const isLarge = size === 'lg' || size === 'custom';

  // Bản đồ kích thước tiêu chuẩn
  const sizeClasses = {
    sm: 'w-7 h-10 sm:w-8 sm:h-11 rounded-[6px] text-[7px]',
    md: 'w-18 h-26 sm:w-20 sm:h-28 md:w-24 md:h-34 rounded-[18px] text-[10px]',
    lg: 'w-56 h-84 sm:w-64 sm:h-96 rounded-[28px] text-xs',
    deck: 'w-full h-full rounded-[18px]',
    custom: '',
  };

  // =========================================================================
  // 1. HALLOWEEN SPOOKY 2026 (Jack-o'-Lantern Edition)
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
        <div
          className={`
            relative w-full h-full bg-gradient-to-b from-stone-950 via-zinc-950 to-black overflow-hidden flex flex-col items-center justify-center border border-violet-500/30
            ${isSmall ? 'p-0.5 rounded-[4px]' : 'p-1 sm:p-2 rounded-[14px] sm:rounded-[16px]'}
          `}
        >
          {/* MẠNG NHỆN CỔ KÍNH 4 GÓC (SVG chuẩn) */}
          <svg className={`absolute top-0.5 left-0.5 ${isSmall ? 'w-2.5 h-2.5 text-violet-400' : 'w-5 h-5 sm:w-8 sm:h-8 text-violet-300/80'} pointer-events-none z-10`} fill="none" stroke="currentColor" viewBox="0 0 40 40">
            <path d="M0 0 L40 0 M0 0 L0 40 M0 0 L30 30 M15 0 Q15 15 0 15 M25 0 Q25 25 0 25 M35 0 Q35 35 0 35" strokeWidth={isSmall ? '2.5' : '1.5'} />
          </svg>
          <svg className={`absolute top-0.5 right-0.5 ${isSmall ? 'w-2.5 h-2.5 text-violet-400' : 'w-5 h-5 sm:w-8 sm:h-8 text-violet-300/80'} rotate-90 pointer-events-none z-10`} fill="none" stroke="currentColor" viewBox="0 0 40 40">
            <path d="M0 0 L40 0 M0 0 L0 40 M0 0 L30 30 M15 0 Q15 15 0 15 M25 0 Q25 25 0 25 M35 0 Q35 35 0 35" strokeWidth={isSmall ? '2.5' : '1.5'} />
          </svg>
          <svg className={`absolute bottom-0.5 left-0.5 ${isSmall ? 'w-2.5 h-2.5 text-violet-400' : 'w-5 h-5 sm:w-8 sm:h-8 text-violet-300/80'} -rotate-90 pointer-events-none z-10`} fill="none" stroke="currentColor" viewBox="0 0 40 40">
            <path d="M0 0 L40 0 M0 0 L0 40 M0 0 L30 30 M15 0 Q15 15 0 15 M25 0 Q25 25 0 25 M35 0 Q35 35 0 35" strokeWidth={isSmall ? '2.5' : '1.5'} />
          </svg>
          <svg className={`absolute bottom-0.5 right-0.5 ${isSmall ? 'w-2.5 h-2.5 text-violet-400' : 'w-5 h-5 sm:w-8 sm:h-8 text-violet-300/80'} rotate-180 pointer-events-none z-10`} fill="none" stroke="currentColor" viewBox="0 0 40 40">
            <path d="M0 0 L40 0 M0 0 L0 40 M0 0 L30 30 M15 0 Q15 15 0 15 M25 0 Q25 25 0 25 M35 0 Q35 35 0 35" strokeWidth={isSmall ? '2.5' : '1.5'} />
          </svg>

          {!isSmall && (
            <div className="absolute inset-1 sm:inset-2 rounded-[10px] sm:rounded-[14px] pointer-events-none opacity-40 bg-gradient-to-b from-transparent via-purple-500/15 to-transparent border border-purple-500/25"></div>
          )}

          {/* ELIP NGHIÊNG SPOOKY */}
          <div
            className={`
              relative rounded-[50%] -rotate-12 bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-purple-800 p-0.5
              shadow-[0_0_20px_rgba(168,85,247,0.7)] flex items-center justify-center
              ${isSmall ? 'w-5 h-7' : isLarge ? 'w-44 h-60' : 'w-12 h-16 sm:w-14 sm:h-18'}
            `}
          >
            <div className="w-full h-full rounded-[50%] bg-gradient-to-b from-zinc-950 via-purple-950 to-black flex flex-col items-center justify-center text-center p-0.5 relative overflow-hidden">
              <div className="absolute top-0.5 w-full flex justify-around opacity-80 leading-none">
                <span className={isSmall ? 'text-[5px]' : isLarge ? 'text-xs' : 'text-[7px]'}>🎃</span>
                <span className={isSmall ? 'text-[5px]' : isLarge ? 'text-xs' : 'text-[7px]'}>🎃</span>
              </div>

              <div className="rotate-12 flex flex-col items-center leading-none z-10">
                <span className={`font-headline font-black tracking-widest text-cyan-300 drop-shadow-[0_0_4px_#38bdf8] ${isSmall ? 'text-[4px]' : isLarge ? 'text-lg' : 'text-[7px] sm:text-[8px]'}`}>
                  NEO
                </span>
                <span className={`font-headline font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-orange-600 drop-shadow-[0_2px_6px_rgba(245,158,11,0.9)] ${isSmall ? 'text-[8px] sm:text-[9px]' : isLarge ? 'text-4xl sm:text-5xl mt-1' : 'text-sm sm:text-base'}`}>
                  UNO
                </span>
                {!isSmall && (
                  <span className={`font-bold text-purple-300 uppercase tracking-widest ${isLarge ? 'text-[10px] mt-1.5' : 'text-[5px] sm:text-[6px] mt-0.5'}`}>
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
  // 2. CYBERPUNK 2077 (Glitch Future Sci-Fi)
  // =========================================================================
  if (skinId === 'skin_cyberpunk') {
    return (
      <div
        onClick={onClick}
        className={`
          relative select-none overflow-hidden flex flex-col items-center justify-center
          bg-gradient-to-br from-[#051329] via-[#0b1b38] to-[#1a0033]
          border-2 border-cyan-400/80 shadow-[0_0_22px_rgba(0,210,255,0.55),inset_0_0_15px_rgba(255,0,128,0.25)]
          ${isSmall ? 'p-0.5 rounded-[6px]' : 'p-1 sm:p-2 rounded-[18px]'}
          ${interactive ? 'transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(0,210,255,0.85)] cursor-pointer' : ''}
          ${sizeClasses[size] || ''} ${className}
        `}
      >
        <div className={`relative w-full h-full bg-[#030914] overflow-hidden flex flex-col items-center justify-center p-0.5 border border-cyan-500/30 ${isSmall ? 'rounded-[4px]' : 'rounded-[14px]'}`}>
          {/* Tech HUD Corners */}
          <svg className={`absolute top-0.5 left-0.5 ${isSmall ? 'w-2 h-2 text-cyan-400' : 'w-4 h-4 sm:w-6 sm:h-6 text-cyan-400/80'} pointer-events-none z-10`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 8V2h6 M2 2l4 4" />
          </svg>
          <svg className={`absolute top-0.5 right-0.5 ${isSmall ? 'w-2 h-2 text-fuchsia-400' : 'w-4 h-4 sm:w-6 sm:h-6 text-fuchsia-400/80'} pointer-events-none z-10`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 8V2h-6 M22 2l-4 4" />
          </svg>
          <svg className={`absolute bottom-0.5 left-0.5 ${isSmall ? 'w-2 h-2 text-fuchsia-400' : 'w-4 h-4 sm:w-6 sm:h-6 text-fuchsia-400/80'} pointer-events-none z-10`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 16v6h6 M2 22l4-4" />
          </svg>
          <svg className={`absolute bottom-0.5 right-0.5 ${isSmall ? 'w-2 h-2 text-cyan-400' : 'w-4 h-4 sm:w-6 sm:h-6 text-cyan-400/80'} pointer-events-none z-10`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16v6h-6 M22 22l-4-4" />
          </svg>

          {/* Hexagonal Cyber Matrix Pattern */}
          <div className="absolute inset-0 opacity-25 bg-[linear-gradient(to_right,#00d2ff_1px,transparent_1px),linear-gradient(to_bottom,#00d2ff_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none"></div>

          {/* Holographic Glowing Ellipse */}
          <div
            className={`
              relative rounded-[50%] -rotate-12 bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-blue-600 p-0.5
              shadow-[0_0_20px_rgba(0,210,255,0.75)] flex items-center justify-center
              ${isSmall ? 'w-5 h-7' : isLarge ? 'w-44 h-60' : 'w-12 h-16 sm:w-14 sm:h-18'}
            `}
          >
            <div className="w-full h-full rounded-[50%] bg-[#020b18] flex flex-col items-center justify-center text-center p-0.5 relative overflow-hidden">
              <div className="rotate-12 flex flex-col items-center leading-none z-10">
                <span className={`font-mono font-black text-cyan-300 tracking-[0.25em] drop-shadow-[0_0_6px_#00d2ff] ${isSmall ? 'text-[4px]' : isLarge ? 'text-sm' : 'text-[7px]'}`}>
                  CYBER
                </span>
                <span className={`font-headline font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-pink-500 drop-shadow-[0_0_12px_#00d2ff] ${isSmall ? 'text-[8px]' : isLarge ? 'text-4xl sm:text-5xl my-0.5' : 'text-sm sm:text-base'}`}>
                  UNO
                </span>
                {!isSmall && (
                  <span className={`font-mono font-bold text-fuchsia-400 tracking-widest ${isLarge ? 'text-[9px] mt-1' : 'text-[5px]'}`}>
                    2077 MATRIX
                  </span>
                )}
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
  // 3. GALAXY (Thiên Hà Vũ Trụ Tím)
  // =========================================================================
  if (skinId === 'skin_galaxy') {
    return (
      <div
        onClick={onClick}
        className={`
          relative select-none overflow-hidden flex flex-col items-center justify-center
          bg-gradient-to-br from-[#0d0221] via-[#1a053f] to-[#060012]
          border-2 border-purple-400/80 shadow-[0_0_24px_rgba(168,85,247,0.65)]
          ${isSmall ? 'p-0.5 rounded-[6px]' : 'p-1 sm:p-2 rounded-[18px]'}
          ${interactive ? 'transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(168,85,247,0.85)] cursor-pointer' : ''}
          ${sizeClasses[size] || ''} ${className}
        `}
      >
        <div className={`relative w-full h-full bg-[#080214] overflow-hidden flex flex-col items-center justify-center p-0.5 border border-purple-500/30 ${isSmall ? 'rounded-[4px]' : 'rounded-[14px]'}`}>
          {/* Celestial Starlight Sparkles 4 Corners */}
          <svg className={`absolute top-0.5 left-0.5 ${isSmall ? 'w-2 h-2 text-purple-300' : 'w-4 h-4 sm:w-6 sm:h-6 text-purple-300/80'} pointer-events-none z-10`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
          </svg>
          <svg className={`absolute top-0.5 right-0.5 ${isSmall ? 'w-2 h-2 text-cyan-300' : 'w-4 h-4 sm:w-6 sm:h-6 text-cyan-300/80'} pointer-events-none z-10`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
          </svg>
          <svg className={`absolute bottom-0.5 left-0.5 ${isSmall ? 'w-2 h-2 text-cyan-300' : 'w-4 h-4 sm:w-6 sm:h-6 text-cyan-300/80'} pointer-events-none z-10`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
          </svg>
          <svg className={`absolute bottom-0.5 right-0.5 ${isSmall ? 'w-2 h-2 text-purple-300' : 'w-4 h-4 sm:w-6 sm:h-6 text-purple-300/80'} pointer-events-none z-10`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
          </svg>

          {/* Cosmic Nebula Clouds & Stardust */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-600/30 via-purple-900/10 to-transparent pointer-events-none"></div>
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-600/30 via-cyan-900/10 to-transparent pointer-events-none"></div>

          {/* Planetary Orbit Ellipse */}
          <div
            className={`
              relative rounded-[50%] -rotate-12 bg-gradient-to-tr from-purple-500 via-indigo-400 to-pink-500 p-0.5
              shadow-[0_0_22px_rgba(192,132,252,0.8)] flex items-center justify-center
              ${isSmall ? 'w-5 h-7' : isLarge ? 'w-44 h-60' : 'w-12 h-16 sm:w-14 sm:h-18'}
            `}
          >
            <div className="w-full h-full rounded-[50%] bg-[#120629] flex flex-col items-center justify-center text-center p-0.5 relative overflow-hidden">
              <div className="rotate-12 flex flex-col items-center leading-none z-10">
                <span className={`font-headline font-black text-cyan-200 tracking-widest drop-shadow-[0_0_6px_#38bdf8] ${isSmall ? 'text-[4px]' : isLarge ? 'text-sm' : 'text-[7px]'}`}>
                  GALAXY
                </span>
                <span className={`font-headline font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-pink-200 to-purple-300 drop-shadow-[0_0_12px_#c084fc] ${isSmall ? 'text-[8px]' : isLarge ? 'text-4xl sm:text-5xl my-0.5' : 'text-sm sm:text-base'}`}>
                  UNO
                </span>
                {!isSmall && (
                  <span className={`font-headline font-bold text-purple-300 uppercase tracking-widest ${isLarge ? 'text-[9px] mt-1' : 'text-[5px]'}`}>
                    DEEP NEBULA
                  </span>
                )}
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
  // 4. DRAGON FIRE (Hỏa Long Rực Lửa - Dragon Flame Scales)
  // =========================================================================
  if (skinId === 'skin_dragon_fire' || skinId === 'skin_dragon') {
    return (
      <div
        onClick={onClick}
        className={`
          relative select-none overflow-hidden flex flex-col items-center justify-center
          bg-gradient-to-br from-[#450a0a] via-[#1a0505] to-[#050000]
          border-2 border-orange-500/80 shadow-[0_0_24px_rgba(249,115,22,0.7),inset_0_0_15px_rgba(220,38,38,0.4)]
          ${isSmall ? 'p-0.5 rounded-[6px]' : 'p-1 sm:p-2 rounded-[18px]'}
          ${interactive ? 'transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(234,88,12,0.9)] cursor-pointer' : ''}
          ${sizeClasses[size] || ''} ${className}
        `}
      >
        <div className={`relative w-full h-full bg-[#120303] overflow-hidden flex flex-col items-center justify-center p-0.5 border border-orange-500/30 ${isSmall ? 'rounded-[4px]' : 'rounded-[14px]'}`}>
          {/* Tribal Dragon Flame Corners */}
          <svg className={`absolute top-0.5 left-0.5 ${isSmall ? 'w-2.5 h-2.5 text-amber-500' : 'w-5 h-5 sm:w-8 sm:h-8 text-amber-500/90'} pointer-events-none z-10`} fill="currentColor" viewBox="0 0 40 40">
            <path d="M0,0 L35,0 C25,10 18,18 12,30 C12,18 18,12 0,0 Z M0,0 L0,35 C10,25 18,18 30,12 C18,12 12,18 0,0 Z" />
            <circle cx="8" cy="8" r="2.5" fill="#f97316" />
          </svg>
          <svg className={`absolute top-0.5 right-0.5 ${isSmall ? 'w-2.5 h-2.5 text-amber-500' : 'w-5 h-5 sm:w-8 sm:h-8 text-amber-500/90'} rotate-90 pointer-events-none z-10`} fill="currentColor" viewBox="0 0 40 40">
            <path d="M0,0 L35,0 C25,10 18,18 12,30 C12,18 18,12 0,0 Z M0,0 L0,35 C10,25 18,18 30,12 C18,12 12,18 0,0 Z" />
            <circle cx="8" cy="8" r="2.5" fill="#f97316" />
          </svg>
          <svg className={`absolute bottom-0.5 left-0.5 ${isSmall ? 'w-2.5 h-2.5 text-amber-500' : 'w-5 h-5 sm:w-8 sm:h-8 text-amber-500/90'} -rotate-90 pointer-events-none z-10`} fill="currentColor" viewBox="0 0 40 40">
            <path d="M0,0 L35,0 C25,10 18,18 12,30 C12,18 18,12 0,0 Z M0,0 L0,35 C10,25 18,18 30,12 C18,12 12,18 0,0 Z" />
            <circle cx="8" cy="8" r="2.5" fill="#f97316" />
          </svg>
          <svg className={`absolute bottom-0.5 right-0.5 ${isSmall ? 'w-2.5 h-2.5 text-amber-500' : 'w-5 h-5 sm:w-8 sm:h-8 text-amber-500/90'} rotate-180 pointer-events-none z-10`} fill="currentColor" viewBox="0 0 40 40">
            <path d="M0,0 L35,0 C25,10 18,18 12,30 C12,18 18,12 0,0 Z M0,0 L0,35 C10,25 18,18 30,12 C18,12 12,18 0,0 Z" />
            <circle cx="8" cy="8" r="2.5" fill="#f97316" />
          </svg>

          {/* Dragon Scale Pattern Texture */}
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#ea580c_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>

          {/* Molten Lava Glow */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/25 via-red-900/10 to-transparent pointer-events-none"></div>

          {/* Fiery Molten Ellipse */}
          <div
            className={`
              relative rounded-[50%] -rotate-12 bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 p-0.5
              shadow-[0_0_24px_rgba(249,115,22,0.85)] flex items-center justify-center
              ${isSmall ? 'w-5 h-7' : isLarge ? 'w-44 h-60' : 'w-12 h-16 sm:w-14 sm:h-18'}
            `}
          >
            <div className="w-full h-full rounded-[50%] bg-gradient-to-b from-[#2a0606] via-[#150202] to-[#380909] flex flex-col items-center justify-center text-center p-0.5 relative overflow-hidden">
              <div className="rotate-12 flex flex-col items-center leading-none z-10">
                <span className={`font-headline font-black tracking-widest text-amber-400 drop-shadow-[0_0_6px_#f59e0b] ${isSmall ? 'text-[4px]' : isLarge ? 'text-lg' : 'text-[7px] sm:text-[8px]'}`}>
                  DRAGON
                </span>
                <span className={`font-headline font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-orange-400 to-red-600 drop-shadow-[0_2px_8px_rgba(234,88,12,0.95)] ${isSmall ? 'text-[8px] sm:text-[9px]' : isLarge ? 'text-4xl sm:text-5xl mt-1' : 'text-sm sm:text-base'}`}>
                  UNO
                </span>
                {!isSmall && (
                  <span className={`font-bold text-orange-300 uppercase tracking-widest ${isLarge ? 'text-[10px] mt-1.5' : 'text-[5px] sm:text-[6px] mt-0.5'}`}>
                    FLAME SCALES
                  </span>
                )}
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
  // 5. GOLD LUXURY (Hoàng Gia Mạ Vàng 24K - Luxury 24K Gold Plated)
  // =========================================================================
  if (skinId === 'skin_gold_luxury' || skinId === 'skin_gold_24k' || skinId === 'skin_gold') {
    return (
      <div
        onClick={onClick}
        className={`
          relative select-none overflow-hidden flex flex-col items-center justify-center
          bg-gradient-to-br from-[#ffd700] via-[#d4af37] to-[#785400]
          border-2 border-amber-300/90 shadow-[0_0_28px_rgba(251,191,36,0.8),inset_0_0_20px_rgba(255,255,255,0.4)]
          ${isSmall ? 'p-0.5 rounded-[6px]' : 'p-1 sm:p-2 rounded-[18px]'}
          ${interactive ? 'transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(251,191,36,0.95)] cursor-pointer' : ''}
          ${sizeClasses[size] || ''} ${className}
        `}
      >
        <div className={`relative w-full h-full bg-gradient-to-b from-[#181102] via-[#0b0801] to-[#221803] overflow-hidden flex flex-col items-center justify-center p-0.5 border border-amber-400/40 ${isSmall ? 'rounded-[4px]' : 'rounded-[14px]'}`}>
          {/* Royal Baroque Crown Corners */}
          <svg className={`absolute top-0.5 left-0.5 ${isSmall ? 'w-2.5 h-2.5 text-amber-300' : 'w-5 h-5 sm:w-8 sm:h-8 text-amber-300/90'} pointer-events-none z-10`} fill="currentColor" viewBox="0 0 40 40">
            <path d="M0,0 L30,0 C20,5 15,10 10,20 C10,12 12,8 0,0 Z M0,0 L0,30 C5,20 10,15 20,10 C12,10 8,12 0,0 Z" />
            <polygon points="6,6 9,3 12,6 9,9" fill="#fef08a" />
          </svg>
          <svg className={`absolute top-0.5 right-0.5 ${isSmall ? 'w-2.5 h-2.5 text-amber-300' : 'w-5 h-5 sm:w-8 sm:h-8 text-amber-300/90'} rotate-90 pointer-events-none z-10`} fill="currentColor" viewBox="0 0 40 40">
            <path d="M0,0 L30,0 C20,5 15,10 10,20 C10,12 12,8 0,0 Z M0,0 L0,30 C5,20 10,15 20,10 C12,10 8,12 0,0 Z" />
            <polygon points="6,6 9,3 12,6 9,9" fill="#fef08a" />
          </svg>
          <svg className={`absolute bottom-0.5 left-0.5 ${isSmall ? 'w-2.5 h-2.5 text-amber-300' : 'w-5 h-5 sm:w-8 sm:h-8 text-amber-300/90'} -rotate-90 pointer-events-none z-10`} fill="currentColor" viewBox="0 0 40 40">
            <path d="M0,0 L30,0 C20,5 15,10 10,20 C10,12 12,8 0,0 Z M0,0 L0,30 C5,20 10,15 20,10 C12,10 8,12 0,0 Z" />
            <polygon points="6,6 9,3 12,6 9,9" fill="#fef08a" />
          </svg>
          <svg className={`absolute bottom-0.5 right-0.5 ${isSmall ? 'w-2.5 h-2.5 text-amber-300' : 'w-5 h-5 sm:w-8 sm:h-8 text-amber-300/90'} rotate-180 pointer-events-none z-10`} fill="currentColor" viewBox="0 0 40 40">
            <path d="M0,0 L30,0 C20,5 15,10 10,20 C10,12 12,8 0,0 Z M0,0 L0,30 C5,20 10,15 20,10 C12,10 8,12 0,0 Z" />
            <polygon points="6,6 9,3 12,6 9,9" fill="#fef08a" />
          </svg>

          {/* Royal Diamond Lattice Texture */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none"></div>

          {/* Light Sweep Reflection Line */}
          <div className="absolute -inset-full bg-gradient-to-r from-transparent via-amber-200/15 to-transparent rotate-45 pointer-events-none"></div>

          {/* 24K Sculpted Gold Medal Ellipse */}
          <div
            className={`
              relative rounded-[50%] -rotate-12 bg-gradient-to-tr from-yellow-200 via-amber-400 to-yellow-600 p-0.5
              shadow-[0_0_26px_rgba(251,191,36,0.9)] flex items-center justify-center
              ${isSmall ? 'w-5 h-7' : isLarge ? 'w-44 h-60' : 'w-12 h-16 sm:w-14 sm:h-18'}
            `}
          >
            <div className="w-full h-full rounded-[50%] bg-gradient-to-b from-[#1c1404] via-[#0d0901] to-[#261c05] flex flex-col items-center justify-center text-center p-0.5 relative overflow-hidden">
              <div className="absolute top-1 opacity-90 leading-none">
                <span className={isSmall ? 'text-[5px]' : isLarge ? 'text-sm' : 'text-[7px]'}>👑</span>
              </div>

              <div className="rotate-12 flex flex-col items-center leading-none z-10">
                <span className={`font-serif font-black tracking-widest text-amber-200 drop-shadow-[0_0_6px_#fbbf24] ${isSmall ? 'text-[4px]' : isLarge ? 'text-lg' : 'text-[7px] sm:text-[8px]'}`}>
                  ROYAL
                </span>
                <span className={`font-headline font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-500 drop-shadow-[0_2px_8px_rgba(251,191,36,0.95)] ${isSmall ? 'text-[8px] sm:text-[9px]' : isLarge ? 'text-4xl sm:text-5xl mt-1' : 'text-sm sm:text-base'}`}>
                  UNO
                </span>
                {!isSmall && (
                  <span className={`font-mono font-extrabold text-amber-300 uppercase tracking-widest ${isLarge ? 'text-[10px] mt-1.5' : 'text-[5px] sm:text-[6px] mt-0.5'}`}>
                    24K GOLD
                  </span>
                )}
              </div>

              <div className="absolute bottom-1 opacity-90 leading-none">
                <span className={isSmall ? 'text-[5px]' : isLarge ? 'text-sm' : 'text-[7px]'}>👑</span>
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
  // 6. MẶC ĐỊNH: ĐỎ RUBY (Classic Uno Red Neo-Glassmorphism)
  // =========================================================================
  return (
    <div
      onClick={onClick}
      className={`
        relative select-none overflow-hidden flex flex-col items-center justify-center
        bg-gradient-to-br from-[#e00050] via-[#c20042] to-[#800028]
        border-2 border-white/50 shadow-xl
        ${isSmall ? 'p-0.5 rounded-[6px]' : 'p-1 sm:p-2 rounded-[18px]'}
        ${interactive ? 'transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(224,0,80,0.6)] cursor-pointer' : ''}
        ${sizeClasses[size] || ''} ${className}
      `}
    >
      <div className={`relative w-full h-full bg-gradient-to-b from-black/15 to-black/40 overflow-hidden flex flex-col items-center justify-center p-0.5 border border-white/20 ${isSmall ? 'rounded-[4px]' : 'rounded-[14px]'}`}>
        {/* Diamond Micro-Faceted Accent Corners */}
        <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-white/40 pointer-events-none"></div>
        <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-white/40 pointer-events-none"></div>
        <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-white/40 pointer-events-none"></div>
        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-white/40 pointer-events-none"></div>

        <div
          className={`
            relative rounded-[50%] -rotate-12 bg-black/35 border border-white/35 backdrop-blur-xs flex items-center justify-center shadow-lg
            ${isSmall ? 'w-5 h-7' : isLarge ? 'w-44 h-60' : 'w-12 h-16 sm:w-14 sm:h-18'}
          `}
        >
          <div className="rotate-12 flex flex-col items-center leading-none">
            <span className={`font-headline font-black text-cyan-300 tracking-wider drop-shadow ${isSmall ? 'text-[4px]' : isLarge ? 'text-lg' : 'text-[7px]'}`}>
              NEO
            </span>
            <span className={`font-headline font-black text-white italic tracking-tighter drop-shadow-md ${isSmall ? 'text-[8px]' : isLarge ? 'text-4xl sm:text-5xl mt-1' : 'text-sm sm:text-base'}`}>
              UNO
            </span>
            {!isSmall && (
              <span className={`font-bold text-rose-200 uppercase tracking-widest ${isLarge ? 'text-[10px] mt-1.5' : 'text-[5px] sm:text-[6px] mt-0.5'}`}>
                CLASSIC RUBY
              </span>
            )}
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
