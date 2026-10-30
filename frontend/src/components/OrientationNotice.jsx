import React, { useState, useEffect } from 'react';

/**
 * OrientationNotice
 * Nhắc nhở người chơi xoay ngang điện thoại (Landscape) để có góc nhìn bàn đấu tốt nhất
 */
export default function OrientationNotice() {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Chỉ kiểm tra trên màn hình kích thước điện thoại/tablet nhỏ (< 900px chiều ngắn)
      const isMobileSize = Math.min(window.innerWidth, window.innerHeight) < 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPortraitMobile(isMobileSize && isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortraitMobile || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[90] w-[94%] max-w-sm animate-bounce-in">
      <div className="p-2.5 px-3.5 rounded-2xl bg-[#0e1424]/95 border border-amber-400/50 backdrop-blur-md shadow-[0_0_25px_rgba(251,191,36,0.25)] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-lg animate-spin-slow">
            screen_rotation
          </span>
          <div className="text-left">
            <span className="font-bold text-amber-300">Gợi ý xoay ngang</span>
            <p className="text-[10px] text-slate-300">
              Xoay ngang màn hình để trải nghiệm bàn đấu tối ưu nhất!
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="Đóng thông báo"
        >
          <span className="material-symbols-outlined text-xs">close</span>
        </button>
      </div>
    </div>
  );
}
