import React, { useState, useEffect, useCallback } from 'react';
import { rewardApi } from '../apis/rewardApi';
import { soundEngine } from '../utils/audioFx';

export default function DailyCheckInModal({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) {
  const [checkInStatus, setCheckInStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimToast, setClaimToast] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchCheckInStatus = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await rewardApi.getCheckInStatus(user?._id || user?.id);
      if (res && res.success) {
        setCheckInStatus(res);
      } else {
        setErrorMessage(res?.message || 'Không thể lấy thông tin điểm danh');
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchCheckInStatus();
      setClaimToast(null);
      setErrorMessage(null);
    }
  }, [isOpen, fetchCheckInStatus]);

  // Thực hiện điểm danh ngày hôm nay
  const handleClaim = async () => {
    if (claiming || checkInStatus?.isClaimedToday) return;

    if (!user || user.role === 'guest') {
      setErrorMessage('Vui lòng đăng nhập tài khoản để tích lũy chuỗi điểm danh 7 ngày!');
      try {
        soundEngine?.playEmergencyBeep?.();
      } catch {}
      return;
    }

    setClaiming(true);
    setErrorMessage(null);

    try {
      const res = await rewardApi.claimCheckIn(user?._id || user?.id);
      if (res && res.success) {
        setCheckInStatus((prev) => ({
          ...prev,
          isClaimedToday: true,
          streak: res.streak,
          claimedDays: res.claimedDays,
        }));

        setClaimToast(res.message);

        if (res.user && onUpdateUser) {
          onUpdateUser(res.user);
        }

        try {
          soundEngine?.playVictory?.();
          soundEngine?.playFirework?.();
        } catch {}
      } else {
        setErrorMessage(res?.message || 'Không thể điểm danh lúc này.');
        try {
          soundEngine?.playEmergencyBeep?.();
        } catch {}
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi mạng khi điểm danh.');
    } finally {
      setClaiming(false);
    }
  };

  if (!isOpen) return null;

  const streak = checkInStatus?.streak || 0;
  const isClaimedToday = checkInStatus?.isClaimedToday === true;
  const currentDayToClaim = checkInStatus?.currentDayToClaim || 1;
  const claimedDays = checkInStatus?.claimedDays || [];
  const rewards = checkInStatus?.rewards || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#141b2d] to-[#0a0f1d] border-2 border-amber-500/40 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col text-white">
        
        {/* Glow hiệu ứng Neon */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">📅</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline font-black text-lg tracking-wide uppercase bg-gradient-to-r from-amber-400 via-yellow-300 to-rose-400 bg-clip-text text-transparent">
                  Điểm Danh 7 Ngày
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  STREAK
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Duy trì chuỗi đăng nhập hằng ngày để nhận Khung Halloween Giới Hạn!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Thanh trạng thái chuỗi Streak */}
        <div className="relative z-10 px-6 py-3 bg-black/40 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <span className="text-xs font-bold text-slate-300">Chuỗi hiện tại:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-orange-500/20 border border-orange-400/50 text-orange-400 font-mono font-black text-sm">
              {streak} Ngày
            </span>
          </div>

          <div className="text-xs font-semibold text-slate-400">
            {isClaimedToday ? (
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <span>✔</span> Đã điểm danh hôm nay
              </span>
            ) : (
              <span className="text-amber-300 flex items-center gap-1 animate-pulse font-bold">
                <span>⚡</span> Hôm nay: Ngày {currentDayToClaim}
              </span>
            )}
          </div>
        </div>

        {/* Nội dung 7 Ngày Thưởng */}
        <div className="relative z-10 p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto max-h-[65vh]">
          
          {/* Lưới Ngày 1 -> Ngày 6 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {rewards
              .filter((r) => r.day < 7)
              .map((reward) => {
                const isClaimed = claimedDays.includes(reward.day);
                const isTodayTarget = !isClaimedToday && reward.day === currentDayToClaim;

                return (
                  <div
                    key={reward.day}
                    className={`relative p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-between gap-2 overflow-hidden ${
                      isClaimed
                        ? 'bg-slate-900/60 border-emerald-500/30 opacity-70'
                        : isTodayTarget
                        ? 'bg-gradient-to-b from-amber-500/20 to-slate-900/90 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-[1.02]'
                        : 'bg-slate-900/40 border-white/10 opacity-80'
                    }`}
                  >
                    {/* Header ngày */}
                    <div className="w-full flex items-center justify-between text-[11px] font-bold">
                      <span className={isTodayTarget ? 'text-amber-300' : 'text-slate-400'}>
                        Ngày {reward.day}
                      </span>
                      {isClaimed && (
                        <span className="text-emerald-400 text-xs font-black">✔ ĐÃ NHẬN</span>
                      )}
                      {isTodayTarget && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase">
                          HÔM NAY
                        </span>
                      )}
                    </div>

                    {/* Biểu tượng quà */}
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl my-1 group-hover:scale-110 transition-transform">
                      {reward.icon}
                    </div>

                    {/* Tên quà */}
                    <div className="text-center">
                      <div className="font-mono font-bold text-xs text-amber-300">
                        +{reward.coins} Vàng
                      </div>
                      <div className="text-[10px] text-purple-300 font-semibold">
                        +{reward.exp} Exp
                      </div>
                      {reward.item === 'ticket_cup' && (
                        <div className="text-[10px] text-cyan-300 font-bold mt-0.5">
                          +1 Vé Đấu Cúp
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Ngày 7: ĐẠI THƯỞNG CUỐI TUẦN (GRAND PRIZE) */}
          {(() => {
            const day7 = rewards.find((r) => r.day === 7);
            if (!day7) return null;
            const isDay7Claimed = claimedDays.includes(7);
            const isDay7Today = !isClaimedToday && currentDayToClaim === 7;

            return (
              <div
                className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden ${
                  isDay7Claimed
                    ? 'bg-slate-900/60 border-emerald-500/40 opacity-80'
                    : isDay7Today
                    ? 'bg-gradient-to-r from-amber-500/25 via-rose-500/20 to-purple-500/25 border-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.5)]'
                    : 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-purple-950/30 border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(244,63,94,0.5)] shrink-0 animate-pulse">
                    🎃
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-amber-400 uppercase tracking-widest">
                        NGÀY 7 • ĐẠI THƯỞNG HOÀN TẤT CHUỖI
                      </span>
                      {isDay7Claimed && (
                        <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                          ✔ ĐÃ MỞ KHÓA
                        </span>
                      )}
                    </div>
                    <div className="font-headline font-black text-sm sm:text-base text-white mt-0.5">
                      1,500 Vàng + 500 Exp + Khung Halloween Bí Ngô
                    </div>
                    <div className="text-[11px] text-slate-300 font-medium">
                      Vật phẩm huyền thoại tăng phong cách hồ sơ Cyberpunk độc quyền!
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center justify-center px-4 py-2 rounded-xl bg-black/40 border border-amber-400/30">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Giá trị quà
                  </span>
                  <span className="font-mono font-black text-amber-300 text-sm">
                    ~5,000 Vàng
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Thông báo Thành công nếu có */}
          {claimToast && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold text-center animate-in zoom-in-95">
              🎉 {claimToast}
            </div>
          )}

          {/* Lỗi nếu có */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold text-center">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* NÚT BẤM ĐIỂM DANH */}
          <div className="pt-2">
            <button
              onClick={handleClaim}
              disabled={claiming || isClaimedToday || loading}
              className={`w-full py-4 px-6 rounded-2xl font-headline font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                isClaimedToday
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 border-2 border-yellow-200 hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.5)]'
              }`}
            >
              {claiming ? (
                <span>Đang ghi nhận máy chủ...</span>
              ) : isClaimedToday ? (
                <>
                  <span>✔ ĐÃ ĐIỂM DANH HÔM NAY (QUAY LẠI VÀO NGÀY MAI)</span>
                </>
              ) : (
                <>
                  <span className="text-xl">✨</span>
                  <span>ĐIỂM DANH NGAY - NGÀY {currentDayToClaim}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="relative z-10 px-6 py-3 border-t border-white/10 bg-black/30 flex items-center justify-between text-[11px] text-slate-400">
          <span>Chuỗi điểm danh reset lúc 00:00 hằng ngày</span>
          <span className="text-amber-400 font-semibold">Tự động lặp lại sau 7 ngày</span>
        </div>
      </div>
    </div>
  );
}
