import React from 'react';

/**
 * Component AvatarFrame - Hiển thị Khung Viền Avatar Độc Quyền cho Người Chơi
 * Hỗ trợ các khung: Halloween Pumpkin, Neon Cyan 2077, Inferno Fire Blaze,
 * Imperial Gold Crown, Chroma RGB Gaming, và Khung Cơ Bản Bạc (Default).
 *
 * @param {Object} props
 * @param {string} [props.frameId='frame_default'] - Mã khung viền
 * @param {React.ReactNode} props.children - Nội dung bên trong (thẻ img Avatar)
 * @param {string} [props.size='md'] - 'sm' (nhỏ), 'md' (vừa), 'lg' (to), 'xl' (profile to)
 * @param {string} [props.className] - Class bổ sung tùy biến
 * @param {boolean} [props.isActive=false] - Trạng thái đang đến lượt (thêm viền phát sáng)
 */
export function AvatarFrame({
  frameId = 'frame_default',
  children,
  size = 'md',
  className = '',
  isActive = false,
}) {
  // Mapping kích cỡ bao ngoài
  const sizeMap = {
    sm: 'w-8 h-8 sm:w-9 sm:h-9',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-13 h-13 sm:w-14 sm:h-14',
    xl: 'w-18 h-18 sm:w-20 sm:h-20',
  };

  const dim = sizeMap[size] || sizeMap.md;

  // 1. KHUNG HALLOWEEN PUMPKIN (🎃 Khung Bí Ngô Lửa Ma Quái)
  if (frameId === 'frame_halloween') {
    return (
      <div
        className={`
          relative rounded-full shrink-0 flex items-center justify-center p-[2.5px]
          bg-gradient-to-tr from-amber-500 via-orange-600 to-purple-600
          shadow-[0_0_18px_rgba(249,115,22,0.85)]
          ${isActive ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-black scale-105' : ''}
          ${dim} ${className}
        `}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center relative">
          {children}
        </div>
        {/* Huy hiệu Bí Ngô Ma Quái góc trên */}
        <span
          className="absolute -top-1.5 -right-1 text-xs sm:text-sm drop-shadow-[0_0_8px_rgba(249,115,22,1)] animate-bounce"
          title="Halloween Spooky Aura"
        >
          🎃
        </span>
      </div>
    );
  }

  // 2. KHUNG NEON CYAN 2077 (Vòng LED Cyberpunk Siêu Sáng)
  if (frameId === 'frame_neon_cyan') {
    return (
      <div
        className={`
          relative rounded-full shrink-0 flex items-center justify-center p-[2.5px]
          bg-gradient-to-tr from-cyan-400 via-sky-300 to-blue-600
          shadow-[0_0_20px_rgba(6,182,212,0.9)]
          ${isActive ? 'ring-2 ring-cyan-200 ring-offset-2 ring-offset-black scale-105' : ''}
          ${dim} ${className}
        `}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-[#030914] flex items-center justify-center relative">
          {children}
        </div>
        {/* Chấm tròn tín hiệu Cyber */}
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-300 border-2 border-black animate-ping" />
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-black shadow-[0_0_6px_#00d2ff]" />
      </div>
    );
  }

  // 3. KHUNG NGỌN LỬA RỰC CHÁY (🔥 Inferno Fire Blaze)
  if (frameId === 'frame_fire_blaze') {
    return (
      <div
        className={`
          relative rounded-full shrink-0 flex items-center justify-center p-[2.5px]
          bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-600
          shadow-[0_0_22px_rgba(244,63,94,0.95)]
          ${isActive ? 'ring-2 ring-yellow-300 ring-offset-2 ring-offset-black scale-105' : ''}
          ${dim} ${className}
        `}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-[#180303] flex items-center justify-center relative">
          {children}
        </div>
        {/* Huy hiệu Lửa Chiến Binh */}
        <span
          className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs sm:text-sm drop-shadow-[0_0_10px_rgba(244,63,94,1)]"
          title="Inferno Fire Blaze"
        >
          🔥
        </span>
      </div>
    );
  }

  // 4. KHUNG VƯƠNG MIỆN HOÀNG GIA (👑 Imperial Gold Crown)
  if (frameId === 'frame_gold_crown') {
    return (
      <div
        className={`
          relative rounded-full shrink-0 flex items-center justify-center p-[2.5px]
          bg-gradient-to-tr from-yellow-200 via-amber-400 to-yellow-600
          shadow-[0_0_22px_rgba(234,179,8,0.95)]
          ${isActive ? 'ring-2 ring-amber-200 ring-offset-2 ring-offset-black scale-105' : ''}
          ${dim} ${className}
        `}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-[#1a1403] flex items-center justify-center relative">
          {children}
        </div>
        {/* Vương miện vàng lộng lẫy đỉnh đầu */}
        <span
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs sm:text-sm drop-shadow-[0_0_8px_rgba(250,204,21,1)]"
          title="Vương Miện Hoàng Gia"
        >
          👑
        </span>
      </div>
    );
  }

  // 5. KHUNG CẦU VỒNG RGB (Chroma RGB Gaming)
  if (frameId === 'frame_rainbow_rgb') {
    return (
      <div
        className={`
          relative rounded-full shrink-0 flex items-center justify-center p-[2.5px]
          bg-[conic-gradient(from_0deg,#ff0000,#ff8000,#ffff00,#00ff00,#00ffff,#0000ff,#8000ff,#ff0000)]
          animate-rgb-rotate shadow-[0_0_20px_rgba(16,185,129,0.85)]
          ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-105' : ''}
          ${dim} ${className}
        `}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center relative">
          {children}
        </div>
      </div>
    );
  }

  // MẶC ĐỊNH: Khung Kim Loại Cơ Bản (Default Metallic Slate)
  return (
    <div
      className={`
        relative rounded-full shrink-0 flex items-center justify-center p-0.5
        border-2 border-slate-500/50 bg-slate-800/80 shadow-md
        ${isActive ? 'border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : ''}
        ${dim} ${className}
      `}
    >
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export default React.memo(AvatarFrame);
