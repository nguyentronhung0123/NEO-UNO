import React, { useState, useEffect, useRef, useCallback } from 'react';
import { rewardApi } from '../apis/rewardApi';
import { soundEngine } from '../utils/audioFx';

export default function LuckyWheelModal({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) {
  const [wheelStatus, setWheelStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const wheelCanvasRef = useRef(null);
  const tickAudioIntervalRef = useRef(null);

  // Lấy trạng thái vòng quay từ máy chủ
  const fetchWheelStatus = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await rewardApi.getWheelStatus(user?._id || user?.id);
      if (res && res.success) {
        setWheelStatus(res);
      } else {
        setErrorMessage(res?.message || 'Không thể tải trạng thái vòng quay');
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchWheelStatus();
      setWonPrize(null);
      setErrorMessage(null);
    } else {
      if (tickAudioIntervalRef.current) {
        clearInterval(tickAudioIntervalRef.current);
      }
    }
  }, [isOpen, fetchWheelStatus]);

  // Vẽ các nan quạt của vòng quay lên Canvas
  useEffect(() => {
    const canvas = wheelCanvasRef.current;
    if (!canvas || !wheelStatus?.slices) return;

    const ctx = canvas.getContext('2d');
    const slices = wheelStatus.slices;
    const numSlices = slices.length;
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 12;

    ctx.clearRect(0, 0, size, size);

    const arc = (2 * Math.PI) / numSlices;

    slices.forEach((slice, i) => {
      // Bắt đầu từ góc -PI/2 - arc/2 để đỉnh ô 0 nằm thẳng đứng ở vị trí 12 giờ
      const angle = i * arc - Math.PI / 2 - arc / 2;

      // 1. Vẽ hình quạt
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arc);
      ctx.closePath();

      // Màu nền nan quạt Cyberpunk xen kẽ hoặc theo slice.color
      const isEven = i % 2 === 0;
      const gradient = ctx.createRadialGradient(
        center,
        center,
        20,
        center,
        center,
        radius
      );
      if (slice.id === 'jackpot') {
        gradient.addColorStop(0, '#f43f5e');
        gradient.addColorStop(1, '#9f1239');
      } else if (slice.id === 'frame_neon') {
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(1, '#0e7490');
      } else if (isEven) {
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(1, '#0f172a');
      } else {
        gradient.addColorStop(0, '#334155');
        gradient.addColorStop(1, '#1e293b');
      }

      ctx.fillStyle = gradient;
      ctx.fill();

      // Viền neon mỏng giữa các nan
      ctx.strokeStyle = slice.id === 'jackpot' ? '#fbbf24' : 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = slice.id === 'jackpot' ? 3 : 1.5;
      ctx.stroke();

      // 2. Vẽ nhãn và biểu tượng icon
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arc / 2);

      // Icon & Text
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.shadowColor = slice.color || '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.fillText(`${slice.icon} ${slice.label}`, radius - 20, 5);

      ctx.restore();
    });

    // 3. Vòng tròn ngoài viền sáng Neon
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 15;
    ctx.stroke();

    // Các chấm đinh ốc trang trí xung quanh viền
    for (let j = 0; j < numSlices * 2; j++) {
      const dotAngle = (j * Math.PI) / numSlices;
      const x = center + (radius + 6) * Math.cos(dotAngle);
      const y = center + (radius + 6) * Math.sin(dotAngle);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = j % 2 === 0 ? '#38bdf8' : '#fbbf24';
      ctx.fill();
    }
  }, [wheelStatus]);

  // Kích hoạt quay
  const handleSpin = async () => {
    if (isSpinning) return;
    setErrorMessage(null);
    setWonPrize(null);

    const isFree = wheelStatus?.canFreeSpin === true;
    const currentCoins = user?.coins ?? wheelStatus?.userCoins ?? 0;

    if (!isFree && currentCoins < (wheelStatus?.paidSpinCost || 200)) {
      setErrorMessage(
        `Bạn không đủ Vàng (Cần ${wheelStatus?.paidSpinCost || 200} Vàng để quay tiếp)!`
      );
      try {
        soundEngine?.playEmergencyBeep?.();
      } catch {}
      return;
    }

    setIsSpinning(true);

    try {
      const res = await rewardApi.spinWheel({
        isFree,
        userId: user?._id || user?.id,
      });

      if (!res || !res.success) {
        setIsSpinning(false);
        setErrorMessage(res?.message || 'Có lỗi xảy ra khi quay thưởng.');
        return;
      }

      // Phát âm thanh tiếng tíc tắc trong lúc vòng quay chuyển động
      let tickCount = 0;
      tickAudioIntervalRef.current = setInterval(() => {
        tickCount++;
        try {
          soundEngine?.playTickTock?.(tickCount % 2 === 0);
        } catch {}
      }, 180);

      // Góc quay tích luỹ để tiếp tục xoay xuôi chiều
      const spinsBase = 1800; // 5 vòng
      const extraAngle = res.stopAngle % 360;
      const currentFullSpins = Math.floor(rotationDegree / 360) * 360;
      const nextDegree = currentFullSpins + spinsBase + extraAngle;

      setRotationDegree(nextDegree);

      // Thời gian quay là 4.5 giây
      setTimeout(() => {
        if (tickAudioIntervalRef.current) {
          clearInterval(tickAudioIntervalRef.current);
        }
        setIsSpinning(false);
        setWonPrize(res.prize);

        // Cập nhật trạng thái người chơi & lượt quay
        setWheelStatus((prev) => ({
          ...prev,
          canFreeSpin: false,
          userCoins: res.user?.coins ?? (isFree ? currentCoins : currentCoins - 200),
        }));

        if (res.user && onUpdateUser) {
          onUpdateUser(res.user);
        }

        // Âm thanh chúc mừng
        try {
          soundEngine?.playVictory?.();
          soundEngine?.playFirework?.();
        } catch {}
      }, 4500);
    } catch (err) {
      setIsSpinning(false);
      if (tickAudioIntervalRef.current) {
        clearInterval(tickAudioIntervalRef.current);
      }
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ');
    }
  };

  if (!isOpen) return null;

  const isFree = wheelStatus?.canFreeSpin === true;
  const currentCoins = user?.coins ?? wheelStatus?.userCoins ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#131b2e] to-[#0a0f1d] border-2 border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col text-white">
        
        {/* Nền hiệu ứng Cyberpunk Grid & Glow */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-36 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-spin" style={{ animationDuration: '8s' }}>
              🎡
            </span>
            <div>
              <h2 className="font-headline font-black text-lg tracking-wide uppercase bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                Vòng Quay Cyberpunk
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Mỗi ngày 1 lượt quay miễn phí 100%
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isSpinning) return;
              onClose();
            }}
            disabled={isSpinning}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        {/* Thông tin số dư & Lượt quay */}
        <div className="relative z-10 px-6 pt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
            <span>🪙 Vàng của bạn:</span>
            <span className="font-mono font-black text-amber-400">
              {currentCoins.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isFree ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-bold text-[11px] uppercase tracking-wider animate-pulse">
                ✨ Lượt Free hôm nay
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-[11px]">
                Quay thêm: 200 🪙
              </span>
            )}
          </div>
        </div>

        {/* Khu vực Vòng Quay */}
        <div className="relative z-10 p-4 sm:p-6 flex flex-col items-center justify-center">
          
          {/* Kim chỉ vị trí (Pointer mũi tên Neon ở góc trên đỉnh 12h) */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
            
            {/* Kim chỉ */}
            <div className="absolute -top-3 z-30 flex flex-col items-center filter drop-shadow-[0_2px_10px_rgba(244,63,94,0.8)]">
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[22px] border-t-rose-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow-md -mt-1" />
            </div>

            {/* Vòng quay có hiệu ứng xoay CSS */}
            <div
              className="w-full h-full rounded-full relative flex items-center justify-center"
              style={{
                transform: `rotate(${rotationDegree}deg)`,
                transition: isSpinning
                  ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.2, 1)'
                  : 'none',
              }}
            >
              <canvas
                ref={wheelCanvasRef}
                width={320}
                height={320}
                className="w-full h-full select-none"
              />
            </div>

            {/* Nút QUAY ở giữa tâm vòng quay */}
            <div className="absolute z-20">
              <button
                onClick={handleSpin}
                disabled={isSpinning || loading}
                className={`w-20 h-20 rounded-full font-headline font-black uppercase text-xs tracking-wider flex flex-col items-center justify-center shadow-[0_0_25px_rgba(0,0,0,0.8)] transition-all cursor-pointer border-4 ${
                  isSpinning
                    ? 'bg-slate-700 text-slate-400 border-slate-600 scale-95 cursor-not-allowed'
                    : isFree
                    ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-300 text-slate-950 border-white hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.7)]'
                    : 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 border-amber-200 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.6)]'
                }`}
              >
                {isSpinning ? (
                  <span className="animate-spin text-lg">⚙️</span>
                ) : (
                  <>
                    <span className="text-sm font-black leading-none">QUAY</span>
                    <span className="text-[10px] font-bold mt-0.5 opacity-90">
                      {isFree ? 'FREE' : '200 🪙'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Lỗi nếu có */}
          {errorMessage && (
            <div className="mt-3 text-center px-4 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold animate-shake">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Hộp Thông báo Nhận Thưởng Khi Quay Trúng */}
          {wonPrize && !isSpinning && (
            <div className="mt-4 w-full p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-amber-950/80 border-2 border-amber-400/80 shadow-[0_0_30px_rgba(251,191,36,0.4)] flex items-center justify-between animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-bounce">{wonPrize.icon}</span>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Chúc Mừng Bạn Đã Trúng Thưởng!
                  </div>
                  <div className="text-base font-black text-white">
                    {wonPrize.label}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setWonPrize(null)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase cursor-pointer transition-all shadow-md active:scale-95"
              >
                Tuyệt Vời
              </button>
            </div>
          )}
        </div>

        {/* Chú thích xác suất minh bạch */}
        <div className="relative z-10 px-6 py-3 border-t border-white/10 bg-black/30 flex items-center justify-between text-[10px] text-slate-400">
          <span>Tỉ lệ: 200 Vàng (30%) • Exp (28%) • Jackpot 2,500 Vàng (2%)</span>
          <span className="text-cyan-400 font-semibold">Tự động cộng vào ví</span>
        </div>
      </div>
    </div>
  );
}
