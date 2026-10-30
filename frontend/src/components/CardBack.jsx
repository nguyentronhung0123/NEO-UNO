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
  // Bản đồ kích thước tiêu chuẩn
  const sizeClasses = {
    sm: 'w-7 h-10 sm:w-8 sm:h-11 rounded-[6px] text-[7px]',
    md: 'w-18 h-26 sm:w-20 sm:h-28 md:w-24 md:h-34 rounded-[18px] text-[10px]',
    lg: 'w-56 h-84 sm:w-64 sm:h-96 rounded-[28px] text-xs',
    deck: 'w-full h-full rounded-[18px]',
    custom: '',
  };

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  // Render dạng Halloween Spooky '26 (Thiết kế độc quyền từ File Word: Mạng nhện 4 góc, Logo 3D Mạ Vàng Hổ Phách, Jack-o'-Lantern)
  if (skinId === 'skin_halloween') {
    return (
      <div
        onClick={onClick}
        className={`
          relative select-none overflow-hidden p-1 sm:p-2 flex flex-col items-center justify-center
          bg-gradient-to-br from-violet-900 via-neutral-900 to-black
          border-2 border-violet-500/50 shadow-[0_0_25px_rgba(139,92,246,0.45)]
          ${interactive ? 'transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(168,85,247,0.7)] cursor-pointer' : ''}
          ${sizeClasses[size] || ''} ${className}
        `}
      >
        {/* Lớp nền sâu bên trong */}
        <div className="relative w-full h-full rounded-[14px] sm:rounded-[20px] bg-gradient-to-b from-stone-950 via-zinc-950 to-black overflow-hidden flex flex-col items-center justify-center p-1 sm:p-2 border border-violet-500/20">
          
          {/* MẠNG NHỆN CỔ KÍNH 4 GÓC (SVG chuẩn từ bản thiết kế) */}
          {!isSmall && (
            <>
              {/* Góc Trên - Trái */}
              <svg
                className="absolute top-1 left-1 sm:top-2 sm:left-2 w-5 h-5 sm:w-9 sm:h-9 text-violet-400/40 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 40 40"
              >
                <path
                  d="M0 0 L40 0 M0 0 L0 40 M0 0 L30 30 M15 0 Q15 15 0 15 M25 0 Q25 25 0 25 M35 0 Q35 35 0 35"
                  strokeWidth="1.2"
                />
              </svg>

              {/* Góc Trên - Phải */}
              <svg
                className="absolute top-1 right-1 sm:top-2 sm:right-2 w-5 h-5 sm:w-9 sm:h-9 text-violet-400/40 rotate-90 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 40 40"
              >
                <path
                  d="M0 0 L40 0 M0 0 L0 40 M0 0 L30 30 M15 0 Q15 15 0 15 M25 0 Q25 25 0 25 M35 0 Q35 35 0 35"
                  strokeWidth="1.2"
                />
              </svg>

              {/* Góc Dưới - Trái */}
              <svg
                className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 w-5 h-5 sm:w-9 sm:h-9 text-violet-400/40 -rotate-90 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 40 40"
              >
                <path
                  d="M0 0 L40 0 M0 0 L0 40 M0 0 L30 30 M15 0 Q15 15 0 15 M25 0 Q25 25 0 25 M35 0 Q35 35 0 35"
                  strokeWidth="1.2"
                />
              </svg>

              {/* Góc Dưới - Phải */}
              <svg
                className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-9 sm:h-9 text-violet-400/40 rotate-180 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 40 40"
              >
                <path
                  d="M0 0 L40 0 M0 0 L0 40 M0 0 L30 30 M15 0 Q15 15 0 15 M25 0 Q25 25 0 25 M35 0 Q35 35 0 35"
                  strokeWidth="1.2"
                />
              </svg>
            </>
          )}

          {/* Vòng viền Dây Leo Bí Ngô Ma Quái */}
          <div className="absolute inset-1.5 sm:inset-3 rounded-[12px] sm:rounded-[16px] pointer-events-none opacity-30 bg-gradient-to-b from-transparent via-purple-500/15 to-transparent border border-purple-500/20"></div>

          {/* HÌNH ELIP NGHIÊNG ĐẶC TRƯNG VỚI HUY HIỆU 3D KIM LOẠI */}
          <div
            className={`
              relative rounded-[50%] -rotate-12 bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-purple-800 p-0.5 sm:p-1
              shadow-[0_0_25px_rgba(168,85,247,0.7)] flex items-center justify-center
              ${isSmall ? 'w-5 h-7' : isLarge ? 'w-44 h-60' : 'w-14 h-20 sm:w-16 sm:h-22'}
            `}
          >
            <div className="w-full h-full rounded-[50%] bg-gradient-to-b from-zinc-950 via-purple-950 to-black flex flex-col items-center justify-center text-center p-1 relative overflow-hidden">
              
              {/* Mini Jack-o'-Lanterns viền trên & dưới */}
              {!isSmall && (
                <div className="absolute top-1 w-full flex justify-around opacity-75">
                  <span className={isLarge ? 'text-xs' : 'text-[7px]'}>🎃</span>
                  <span className={isLarge ? 'text-xs' : 'text-[7px]'}>🎃</span>
                </div>
              )}

              {/* LOGO 3D NEO UNO METALLIC */}
              <div className="rotate-12 flex flex-col items-center leading-none">
                <span
                  className={`
                    font-headline font-black tracking-widest text-cyan-300 drop-shadow-[0_0_6px_#38bdf8]
                    ${isSmall ? 'text-[5px]' : isLarge ? 'text-lg' : 'text-[8px] sm:text-[9px]'}
                  `}
                >
                  NEO
                </span>
                <span
                  className={`
                    font-headline font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-orange-600
                    drop-shadow-[0_3px_8px_rgba(245,158,11,0.85)]
                    ${isSmall ? 'text-[9px]' : isLarge ? 'text-4xl sm:text-5xl mt-1' : 'text-base sm:text-lg'}
                  `}
                >
                  UNO
                </span>
                {!isSmall && (
                  <span
                    className={`
                      font-bold text-purple-300 uppercase tracking-widest
                      ${isLarge ? 'text-[10px] mt-1.5' : 'text-[6px] sm:text-[7px] mt-0.5'}
                    `}
                  >
                    HALLOWEEN
                  </span>
                )}
              </div>

              {!isSmall && (
                <div className="absolute bottom-1 w-full flex justify-around opacity-75">
                  <span className={isLarge ? 'text-xs' : 'text-[7px]'}>🎃</span>
                  <span className={isLarge ? 'text-xs' : 'text-[7px]'}>🎃</span>
                </div>
              )}
            </div>
          </div>

          {label && (
            <span className="mt-1 font-headline font-bold text-amber-300 text-[8px] sm:text-[10px] uppercase tracking-wider drop-shadow z-10">
              {label}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Render dạng Cyberpunk 2077 (Vi mạch phát sáng Neon Cyan & Magenta)
  if (skinId === 'skin_cyberpunk') {
    return (
      <div
        onClick={onClick}
        className={`
          relative select-none overflow-hidden p-1 sm:p-2 flex flex-col items-center justify-center
          bg-gradient-to-br from-[#051329] via-[#0b1b38] to-[#1a0033]
          border-2 border-cyan-400/80 shadow-[0_0_25px_rgba(0,210,255,0.45)]
          ${interactive ? 'transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(0,210,255,0.7)] cursor-pointer' : ''}
          ${sizeClasses[size] || ''} ${className}
        `}
      >
        <div className="relative w-full h-full rounded-[14px] sm:rounded-[20px] bg-[#030914] overflow-hidden flex flex-col items-center justify-center p-1 border border-cyan-500/30">
          {/* Lưới vi mạch tương lai */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#00d2ff_1px,transparent_1px),linear-gradient(to_bottom,#00d2ff_1px,transparent_1px)] bg-[size:10px_10px]"></div>

          <div
            className={`
              relative rounded-[50%] -rotate-12 bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-blue-600 p-0.5 sm:p-1
              shadow-[0_0_20px_rgba(0,210,255,0.7)] flex items-center justify-center
              ${isSmall ? 'w-5 h-7' : isLarge ? 'w-44 h-60' : 'w-14 h-20 sm:w-16 sm:h-22'}
            `}
          >
            <div className="w-full h-full rounded-[50%] bg-gradient-to-b from-[#020b18] via-[#05132b] to-[#120026] flex flex-col items-center justify-center text-center p-1">
              <div className="rotate-12 flex flex-col items-center leading-none">
                <span className={`font-mono font-black text-cyan-300 tracking-widest ${isSmall ? 'text-[5px]' : isLarge ? 'text-sm' : 'text-[8px]'}`}>
                  CYBER
                </span>
                <span className={`font-headline font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-pink-500 drop-shadow-[0_0_10px_#00d2ff] ${isSmall ? 'text-[9px]' : isLarge ? 'text-4xl' : 'text-base sm:text-lg'}`}>
                  UNO
                </span>
                {!isSmall && (
                  <span className={`text-[6px] font-mono text-fuchsia-300 tracking-wider ${isLarge ? 'text-[10px] mt-1' : ''}`}>
                    SYS.2077
                  </span>
                )}
              </div>
            </div>
          </div>

          {label && (
            <span className="mt-1 font-mono font-bold text-cyan-300 text-[8px] sm:text-[10px] uppercase tracking-wider drop-shadow z-10">
              {label}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Render dạng Galaxy (Thiên hà vũ trụ sâu thẳm & sao băng)
  if (skinId === 'skin_galaxy') {
    return (
      <div
        onClick={onClick}
        className={`
          relative select-none overflow-hidden p-1 sm:p-2 flex flex-col items-center justify-center
          bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950
          border-2 border-purple-400/80 shadow-[0_0_25px_rgba(168,85,247,0.45)]
          ${interactive ? 'transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(168,85,247,0.7)] cursor-pointer' : ''}
          ${sizeClasses[size] || ''} ${className}
        `}
      >
        <div className="relative w-full h-full rounded-[14px] sm:rounded-[20px] bg-[#0b0817] overflow-hidden flex flex-col items-center justify-center p-1 border border-purple-500/30">
          {/* Hạt bụi sao lung linh */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(168,85,247,0.3)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.3)_0%,transparent_50%)]"></div>

          <div
            className={`
              relative rounded-[50%] -rotate-12 bg-gradient-to-tr from-purple-500 via-indigo-400 to-pink-500 p-0.5 sm:p-1
              shadow-[0_0_22px_rgba(192,132,252,0.7)] flex items-center justify-center
              ${isSmall ? 'w-5 h-7' : isLarge ? 'w-44 h-60' : 'w-14 h-20 sm:w-16 sm:h-22'}
            `}
          >
            <div className="w-full h-full rounded-[50%] bg-gradient-to-b from-[#13072b] via-[#09031c] to-[#04010a] flex flex-col items-center justify-center text-center p-1">
              <div className="rotate-12 flex flex-col items-center leading-none">
                <span className={`font-headline font-black text-purple-300 tracking-widest ${isSmall ? 'text-[5px]' : isLarge ? 'text-sm' : 'text-[8px]'}`}>
                  GALAXY
                </span>
                <span className={`font-headline font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-purple-300 drop-shadow-[0_0_8px_#c084fc] ${isSmall ? 'text-[9px]' : isLarge ? 'text-4xl' : 'text-base sm:text-lg'}`}>
                  UNO
                </span>
                {!isSmall && (
                  <span className={`text-[6px] text-pink-300 font-bold ${isLarge ? 'text-[10px] mt-1' : ''}`}>
                    ✨ NEBULA
                  </span>
                )}
              </div>
            </div>
          </div>

          {label && (
            <span className="mt-1 font-headline font-bold text-purple-200 text-[8px] sm:text-[10px] uppercase tracking-wider drop-shadow z-10">
              {label}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Render dạng Dragon Fire (Hỏa Long Rực Lửa)
  if (skinId === 'skin_dragon_fire') {
    return (
      <div
        onClick={onClick}
        className={`
          relative select-none overflow-hidden p-1 sm:p-2 flex flex-col items-center justify-center
          bg-gradient-to-br from-rose-700 via-amber-900 to-stone-950
          border-2 border-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.5)]
          ${interactive ? 'transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(239,68,68,0.75)] cursor-pointer' : ''}
          ${sizeClasses[size] || ''} ${className}
        `}
      >
        <div className="relative w-full h-full rounded-[14px] sm:rounded-[20px] bg-[#1a0505] overflow-hidden flex flex-col items-center justify-center p-1 border border-orange-500/30">
          <div
            className={`
              relative rounded-[50%] -rotate-12 bg-gradient-to-tr from-amber-500 via-rose-600 to-red-600 p-0.5 sm:p-1
              shadow-[0_0_25px_rgba(249,115,22,0.8)] flex items-center justify-center
              ${isSmall ? 'w-5 h-7' : isLarge ? 'w-44 h-60' : 'w-14 h-20 sm:w-16 sm:h-22'}
            `}
          >
            <div className="w-full h-full rounded-[50%] bg-gradient-to-b from-[#240303] via-[#100101] to-black flex flex-col items-center justify-center text-center p-1">
              <div className="rotate-12 flex flex-col items-center leading-none">
                <span className={`font-headline font-black text-amber-400 tracking-widest ${isSmall ? 'text-[5px]' : isLarge ? 'text-sm' : 'text-[8px]'}`}>
                  DRAGON
                </span>
                <span className={`font-headline font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-400 to-red-600 drop-shadow-[0_0_10px_#f97316] ${isSmall ? 'text-[9px]' : isLarge ? 'text-4xl' : 'text-base sm:text-lg'}`}>
                  UNO
                </span>
                {!isSmall && (
                  <span className={`text-[6px] text-amber-300 font-bold ${isLarge ? 'text-[10px] mt-1' : ''}`}>
                    🔥 INFERNO
                  </span>
                )}
              </div>
            </div>
          </div>

          {label && (
            <span className="mt-1 font-headline font-bold text-amber-400 text-[8px] sm:text-[10px] uppercase tracking-wider drop-shadow z-10">
              {label}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Render dạng 24K Gold Luxury (Hoàng Gia Mạ Vàng)
  if (skinId === 'skin_gold_luxury') {
    return (
      <div
        onClick={onClick}
        className={`
          relative select-none overflow-hidden p-1 sm:p-2 flex flex-col items-center justify-center
          bg-gradient-to-br from-amber-300 via-yellow-600 to-stone-900
          border-2 border-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.6)]
          ${interactive ? 'transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(251,191,36,0.85)] cursor-pointer' : ''}
          ${sizeClasses[size] || ''} ${className}
        `}
      >
        <div className="relative w-full h-full rounded-[14px] sm:rounded-[20px] bg-gradient-to-b from-[#2b200b] via-[#140e02] to-black overflow-hidden flex flex-col items-center justify-center p-1 border border-yellow-400/40">
          <div
            className={`
              relative rounded-[50%] -rotate-12 bg-gradient-to-tr from-amber-200 via-yellow-400 to-amber-600 p-0.5 sm:p-1
              shadow-[0_0_25px_rgba(250,204,21,0.8)] flex items-center justify-center
              ${isSmall ? 'w-5 h-7' : isLarge ? 'w-44 h-60' : 'w-14 h-20 sm:w-16 sm:h-22'}
            `}
          >
            <div className="w-full h-full rounded-[50%] bg-gradient-to-b from-[#1f1704] via-[#0d0a02] to-black flex flex-col items-center justify-center text-center p-1">
              {!isSmall && <span className={isLarge ? 'text-sm mb-1' : 'text-[8px]'}>👑</span>}
              <div className="rotate-12 flex flex-col items-center leading-none">
                <span className={`font-headline font-black text-amber-200 tracking-widest ${isSmall ? 'text-[5px]' : isLarge ? 'text-sm' : 'text-[8px]'}`}>
                  ROYAL
                </span>
                <span className={`font-headline font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-yellow-600 drop-shadow-[0_2px_8px_rgba(234,179,8,0.9)] ${isSmall ? 'text-[9px]' : isLarge ? 'text-4xl' : 'text-base sm:text-lg'}`}>
                  UNO
                </span>
                {!isSmall && (
                  <span className={`text-[6px] text-amber-200 font-bold ${isLarge ? 'text-[10px] mt-1' : ''}`}>
                    24K GOLD
                  </span>
                )}
              </div>
            </div>
          </div>

          {label && (
            <span className="mt-1 font-headline font-bold text-amber-300 text-[8px] sm:text-[10px] uppercase tracking-wider drop-shadow z-10">
              {label}
            </span>
          )}
        </div>
      </div>
    );
  }

  // MẶC ĐỊNH: Mặt Lưng Cổ Điển Đỏ Ruby (Classic UNO Red)
  return (
    <div
      onClick={onClick}
      className={`
        relative select-none overflow-hidden p-1 sm:p-2 flex flex-col items-center justify-center
        bg-gradient-to-br from-[#e00050] via-[#c20042] to-[#800028]
        border-2 border-white/40 shadow-xl
        ${interactive ? 'transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(224,0,80,0.6)] cursor-pointer' : ''}
        ${sizeClasses[size] || ''} ${className}
      `}
    >
      <div className="relative w-full h-full rounded-[14px] sm:rounded-[20px] bg-gradient-to-b from-black/15 to-black/35 overflow-hidden flex flex-col items-center justify-center p-1 border border-white/20">
        <div
          className={`
            relative rounded-[50%] -rotate-12 bg-black/30 border border-white/30 backdrop-blur-xs flex items-center justify-center
            ${isSmall ? 'w-5 h-7' : isLarge ? 'w-44 h-60' : 'w-14 h-20 sm:w-16 sm:h-22'}
          `}
        >
          <div className="rotate-12 flex flex-col items-center leading-none">
            <span className={`font-headline font-black text-cyan-300 tracking-wider drop-shadow ${isSmall ? 'text-[5px]' : isLarge ? 'text-sm' : 'text-[8px]'}`}>
              NEO
            </span>
            <span className={`font-headline font-black text-white italic tracking-tighter drop-shadow-md ${isSmall ? 'text-[9px]' : isLarge ? 'text-4xl' : 'text-base sm:text-lg'}`}>
              UNO
            </span>
          </div>
        </div>

        {label && (
          <span className="mt-1 font-headline font-bold text-white text-[8px] sm:text-[10px] uppercase tracking-wider drop-shadow z-10">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export default React.memo(CardBack);
