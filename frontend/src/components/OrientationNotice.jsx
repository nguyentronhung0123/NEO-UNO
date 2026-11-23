import React, { useState, useEffect, useCallback } from 'react';

/**
 * OrientationNotice
 * Ràng buộc người chơi trên thiết bị di động (Mobile / Tablet) phải xoay ngang
 * màn hình (Landscape) khi bước vào trận đấu NEO-UNO.
 */
export default function OrientationNotice({ onExit }) {
  const [isPortrait, setIsPortrait] = useState(false);
  const [canLockOrientation, setCanLockOrientation] = useState(false);

  const checkOrientation = useCallback(() => {
    if (typeof window === 'undefined') return;

    // 1. Kiểm tra màn hình dọc: Chiều cao lớn hơn chiều rộng HOẶC media query portrait
    const heightGreaterThanWidth = window.innerHeight > window.innerWidth;
    const mediaPortrait = window.matchMedia
      ? window.matchMedia('(orientation: portrait)').matches
      : heightGreaterThanWidth;
    const isCurrentlyPortrait = heightGreaterThanWidth || mediaPortrait;

    // 2. Kiểm tra có phải thiết bị di động / tablet hoặc màn hình cảm ứng / màn hình nhỏ
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
    const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    const isSmallScreen = Math.min(window.screen?.width || 9999, window.screen?.height || 9999) <= 1024;
    const isNarrowViewport = window.innerWidth <= 1024;

    const isMobileDevice = isMobileUA || (isTouch && isNarrowViewport) || (isSmallScreen && isNarrowViewport);

    // Bật overlay khi và chỉ khi đang ở chiều dọc trên thiết bị di động / màn hình nhỏ
    setIsPortrait(isCurrentlyPortrait && isMobileDevice);

    // Kiểm tra khả năng hỗ trợ Screen Orientation Lock API
    const hasLockAPI = Boolean(
      (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen) &&
      window.screen?.orientation?.lock
    );
    setCanLockOrientation(hasLockAPI);
  }, []);

  useEffect(() => {
    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    let mql = null;
    if (window.matchMedia) {
      mql = window.matchMedia('(orientation: portrait)');
      try {
        mql.addEventListener('change', checkOrientation);
      } catch {
        if (mql.addListener) mql.addListener(checkOrientation);
      }
    }

    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', checkOrientation);
    }

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      if (mql) {
        try {
          mql.removeEventListener('change', checkOrientation);
        } catch {
          if (mql.removeListener) mql.removeListener(checkOrientation);
        }
      }
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', checkOrientation);
      }
    };
  }, [checkOrientation]);

  // Thử khóa xoay ngang qua Fullscreen + Screen Orientation API (Hỗ trợ tốt trên Android Chrome)
  const handleTryAutoRotate = async () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      }

      if (window.screen?.orientation?.lock) {
        await window.screen.orientation.lock('landscape');
      }
    } catch (err) {
      console.log('Orientation lock not permitted without user physical rotation:', err);
    }
  };

  if (!isPortrait) return null;

  return (
    <aside
      aria-label="Yêu cầu xoay ngang màn hình"
      className="fixed inset-0 z-[999999] bg-[#07090e]/96 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none overflow-y-auto"
    >
      {/* Vòng sáng nền Neon Cyberpunk */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none -top-10 -left-10" />
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-rose-500/10 blur-3xl pointer-events-none -bottom-10 -right-10" />

      <div className="relative z-10 max-w-xs sm:max-w-sm w-full flex flex-col items-center gap-3 sm:gap-4">
        
        {/* Huy hiệu cảnh báo */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[11px] font-mono font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(6,182,212,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>Yêu Cầu Màn Hình Ngang</span>
        </div>

        {/* Hoạt ảnh xoay điện thoại Cyberpunk */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center my-1">
          {/* Vòng cung mũi tên xoay */}
          <svg
            className="absolute inset-0 w-full h-full text-cyan-400/30 animate-spin-slow"
            viewBox="0 0 100 100"
            fill="none"
          >
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="18 10"
              strokeLinecap="round"
            />
          </svg>

          {/* Khung điện thoại xoay mượt mà 0deg -> 90deg */}
          <div className="animate-phone-rotate relative w-14 h-22 sm:w-16 sm:h-26 rounded-xl border-2 border-cyan-400 bg-slate-900/90 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex flex-col items-center justify-between p-1.5">
            {/* Rãnh loa / Notch */}
            <div className="w-4 h-0.5 rounded-full bg-cyan-400/60" />

            {/* Màn hình điện thoại hiển thị bàn cờ thu nhỏ */}
            <div className="w-full flex-1 my-1 rounded bg-slate-950/80 border border-cyan-500/20 flex flex-col items-center justify-center p-0.5">
              <span className="text-[8px] sm:text-[9px] font-black text-cyan-300 tracking-wider font-mono">
                NEO UNO
              </span>
              <div className="flex gap-0.5 mt-0.5">
                <span className="w-2 h-2.5 rounded-xs bg-rose-500 shadow-xs" />
                <span className="w-2 h-2.5 rounded-xs bg-cyan-400 shadow-xs" />
                <span className="w-2 h-2.5 rounded-xs bg-amber-400 shadow-xs" />
              </div>
            </div>

            {/* Thanh điều hướng / Home bar */}
            <div className="w-5 h-0.5 rounded-full bg-slate-600" />
          </div>
        </div>

        {/* Tiêu đề & Nội dung giải thích */}
        <div className="space-y-1">
          <h2 className="text-base sm:text-xl font-black text-white font-headline tracking-wide uppercase">
            Vui Lòng <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-rose-400">Xoay Ngang</span> Điện Thoại
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300 font-body leading-relaxed px-1">
            Đấu trường được thiết kế tối ưu cho màn hình ngang (Landscape) để quan sát đủ 4 người chơi và thao tác vuốt bài chính xác.
          </p>
        </div>

        {/* Hướng dẫn 2 bước */}
        <div className="w-full bg-slate-900/70 border border-white/10 rounded-xl p-2.5 text-left space-y-1.5 text-[11px] font-mono text-slate-300">
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
              1
            </span>
            <span>Mở khóa <strong>"Tự động xoay màn hình"</strong> (Auto-Rotate) trong trung tâm điều khiển điện thoại.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
              2
            </span>
            <span>Xoay ngang thiết bị — Bàn cờ sẽ tự động mở ra ngay lập tức.</span>
          </div>
        </div>

        {/* Các nút hành động */}
        <div className="w-full flex flex-col gap-1.5 pt-0.5">
          {canLockOrientation && (
            <button
              type="button"
              onClick={handleTryAutoRotate}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-headline font-black text-[11px] uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">screen_rotation</span>
              <span>Kích Hoạt Toàn Màn Hình Ngang</span>
            </button>
          )}

          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="w-full py-1.5 px-3 rounded-lg bg-surface-container-low hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 font-mono text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Rời Bàn Đấu Về Sảnh</span>
            </button>
          )}
        </div>

      </div>
    </aside>
  );
}
