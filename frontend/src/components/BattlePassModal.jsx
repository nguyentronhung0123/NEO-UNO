import React, { useState, useEffect, useCallback, useRef } from 'react';
import { battlePassApi } from '../apis/battlePassApi';
import { soundEngine } from '../utils/audioFx';

export default function BattlePassModal({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) {
  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const ribbonRef = useRef(null);

  // Lấy dữ liệu Sổ Sứ Mệnh từ máy chủ
  const fetchPassStatus = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await battlePassApi.getStatus(user?._id || user?.id);
      if (res && res.success) {
        setPassData(res);
      } else {
        setErrorMessage(res?.message || 'Không thể tải Sổ Sứ Mệnh');
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchPassStatus();
      setToastMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, fetchPassStatus]);

  // Tự động cuộn đến cấp độ hiện tại khi mở modal
  useEffect(() => {
    if (passData?.pass?.level && ribbonRef.current) {
      const curLv = passData.pass.level;
      const scrollPos = Math.max(0, (curLv - 2) * 160);
      ribbonRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  }, [passData?.pass?.level]);

  // Nhận thưởng 1 cấp đơn lẻ
  const handleClaimLevel = async (level, track) => {
    if (actionLoading) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await battlePassApi.claimLevel({
        level,
        track,
        userId: user?._id || user?.id,
      });

      if (res && res.success) {
        setToastMessage(res.message);
        try {
          soundEngine?.playVictory?.();
          soundEngine?.playCoinBuy?.();
        } catch {}

        // Cập nhật trạng thái hiển thị
        setPassData((prev) => {
          if (!prev) return prev;
          const updatedPass = { ...prev.pass };
          if (track === 'free') {
            updatedPass.claimedFreeLevels = [
              ...updatedPass.claimedFreeLevels,
              level,
            ];
          } else {
            updatedPass.claimedPremiumLevels = [
              ...updatedPass.claimedPremiumLevels,
              level,
            ];
          }
          return { ...prev, pass: updatedPass };
        });

        if (res.user && onUpdateUser) {
          onUpdateUser(res.user);
        }
      } else {
        setErrorMessage(res?.message || 'Không thể nhận phần thưởng này.');
        try {
          soundEngine?.playEmergencyBeep?.();
        } catch {}
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi mạng khi nhận thưởng.');
    } finally {
      setActionLoading(false);
    }
  };

  // Nhận toàn bộ phần thưởng đủ điều kiện
  const handleClaimAll = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await battlePassApi.claimAll(user?._id || user?.id);
      if (res && res.success) {
        setToastMessage(res.message);
        try {
          soundEngine?.playVictory?.();
          soundEngine?.playFirework?.();
        } catch {}

        fetchPassStatus();
        if (res.user && onUpdateUser) {
          onUpdateUser(res.user);
        }
      } else {
        setErrorMessage(res?.message || 'Không có phần thưởng nào chờ nhận.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi mạng khi nhận tất cả.');
    } finally {
      setActionLoading(false);
    }
  };

  // Nâng cấp Tuyến Cyber VIP (5,000 Vàng)
  const handleUpgradePremium = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await battlePassApi.upgradePremium(user?._id || user?.id);
      if (res && res.success) {
        setToastMessage(res.message);
        try {
          soundEngine?.playVictory?.();
          soundEngine?.playFirework?.();
        } catch {}

        setPassData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            pass: { ...prev.pass, isPremium: true },
            userCoins: (prev.userCoins || 5000) - 5000,
          };
        });

        if (res.user && onUpdateUser) {
          onUpdateUser(res.user);
        }
      } else {
        setErrorMessage(res?.message || 'Không thể mở khóa Tuyến VIP.');
        try {
          soundEngine?.playEmergencyBeep?.();
        } catch {}
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi mạng khi nâng cấp.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentLevel = passData?.pass?.level || 1;
  const currentExp = passData?.pass?.exp || 0;
  const isPremium = passData?.pass?.isPremium === true;
  const claimedFree = passData?.pass?.claimedFreeLevels || [];
  const claimedPremium = passData?.pass?.claimedPremiumLevels || [];
  const levels = passData?.levels || [];
  const userCoins = user?.coins ?? passData?.userCoins ?? 0;
  const expPercent = Math.min(100, Math.round((currentExp / 200) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-gradient-to-b from-[#11192e] via-[#0b101e] to-[#070b14] border-2 border-cyan-500/40 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col text-white max-h-[92vh]">
        
        {/* Nền Cyber Glow */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-44 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 px-5 sm:px-8 py-3.5 flex items-center justify-between border-b border-white/10 bg-black/30">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">🎖️</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline font-black text-base sm:text-lg tracking-wide uppercase bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                  SỔ SỨ MỆNH MÙA 1: NEON OVERDRIVE
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                  BATTLE PASS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Tích lũy Season EXP từ mọi trận đấu để mở khóa kho báu vật phẩm độc quyền
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

        {/* Thanh Thông Tin Người Chơi & Tiến Trình Cấp Độ */}
        <div className="relative z-10 px-5 sm:px-8 py-3 bg-black/40 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          
          {/* Cấp độ & Thanh EXP */}
          <div className="flex items-center gap-3 min-w-[240px]">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-amber-400 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.6)] flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#080d1a] rounded-[14px] flex flex-col items-center justify-center font-black">
                <span className="text-[9px] text-cyan-300 leading-none">CẤP</span>
                <span className="text-lg text-amber-300 leading-none mt-0.5 font-headline font-black">
                  {currentLevel}
                </span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-300">Tiến trình Mùa 1:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {currentLevel >= 30 ? 'TỐI ĐA (MAX)' : `${currentExp} / 200 EXP`}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/10 relative">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  style={{ width: `${currentLevel >= 30 ? 100 : expPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Nút Hành Động: Mở Khóa VIP & Nhận Tất Cả */}
          <div className="flex items-center gap-2.5">
            {isPremium ? (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/60 text-amber-300 font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <span>👑</span>
                <span>CYBER VIP ACTIVE</span>
              </div>
            ) : (
              <button
                onClick={handleUpgradePremium}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-headline font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all cursor-pointer hover:scale-105 active:scale-95 border border-yellow-200"
              >
                <span>👑</span>
                <span>MỞ KHÓA VIP (5,000 🪙)</span>
              </button>
            )}

            <button
              onClick={handleClaimAll}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-headline font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>🎁</span>
              <span>NHẬN TẤT CẢ</span>
            </button>
          </div>
        </div>

        {/* Thông báo nếu có */}
        {toastMessage && (
          <div className="mx-6 mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold text-center animate-in zoom-in-95">
            🎉 {toastMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mx-6 mt-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold text-center">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* KHU VỰC THANH CUỘN NGANG (HORIZONTAL RIBBON 30 CẤP ĐỘ) */}
        <div className="relative z-10 p-4 sm:p-6 flex-1 overflow-x-auto overflow-y-hidden" ref={ribbonRef}>
          <div className="flex gap-4 min-w-max pb-2">
            
            {/* Nhãn 2 Tuyến Bên Trái */}
            <div className="flex flex-col justify-between py-1 sticky left-0 z-20 bg-[#070b14]/95 backdrop-blur-md pr-3 border-r border-white/10 shrink-0 w-28">
              {/* Tuyến Free */}
              <div className="p-2 rounded-xl bg-slate-800/80 border border-white/10 text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Tuyến</div>
                <div className="text-xs font-black text-cyan-300 uppercase">FREE PASS</div>
              </div>

              {/* Mốc Cấp */}
              <div className="text-center font-mono text-xs font-black text-slate-400 my-2">
                CẤP ĐỘ
              </div>

              {/* Tuyến VIP */}
              <div className="p-2 rounded-xl bg-gradient-to-r from-amber-950/60 to-yellow-950/60 border border-amber-400/40 text-center">
                <div className="text-[10px] text-amber-400 font-bold uppercase flex items-center justify-center gap-1">
                  <span>👑</span> VIP
                </div>
                <div className="text-xs font-black text-amber-300 uppercase">PREMIUM</div>
              </div>
            </div>

            {/* Danh sách 30 Cột Cấp Độ */}
            {levels.map((lvl) => {
              const isPassed = currentLevel >= lvl.level;
              const isCurrent = currentLevel === lvl.level;
              const isFreeClaimed = claimedFree.includes(lvl.level);
              const isPremiumClaimed = claimedPremium.includes(lvl.level);

              const canClaimFree = isPassed && !isFreeClaimed;
              const canClaimPremium = isPassed && isPremium && !isPremiumClaimed;
              const needsVipUpgrade = isPassed && !isPremium;

              return (
                <div
                  key={lvl.level}
                  className={`flex flex-col justify-between items-center w-36 shrink-0 p-2.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                      : isPassed
                      ? 'bg-slate-900/40 border-white/10'
                      : 'bg-slate-950/40 border-white/5 opacity-70'
                  }`}
                >
                  {/* Ô Quà Free (Trên) */}
                  <div
                    className={`w-full p-2.5 rounded-xl border flex flex-col items-center justify-between text-center min-h-[110px] ${
                      isFreeClaimed
                        ? 'bg-slate-900/60 border-emerald-500/30 opacity-60'
                        : canClaimFree
                        ? 'bg-gradient-to-b from-cyan-500/20 to-slate-900/90 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)] animate-pulse'
                        : 'bg-slate-900/50 border-white/10'
                    }`}
                  >
                    <div className="text-xl mb-1">{lvl.free.icon}</div>
                    <div className="text-[11px] font-bold text-slate-200 line-clamp-2">
                      {lvl.free.label}
                    </div>

                    <div className="mt-1">
                      {isFreeClaimed ? (
                        <span className="text-[10px] font-black text-emerald-400">✔ ĐÃ NHẬN</span>
                      ) : canClaimFree ? (
                        <button
                          onClick={() => handleClaimLevel(lvl.level, 'free')}
                          disabled={actionLoading}
                          className="px-2 py-0.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[10px] uppercase cursor-pointer"
                        >
                          NHẬN
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">🔒 Khóa</span>
                      )}
                    </div>
                  </div>

                  {/* Vòng Tròn Số Cấp Độ (Giữa) */}
                  <div className="relative my-2 flex items-center justify-center w-full">
                    <div className="absolute inset-x-0 h-0.5 bg-white/10 z-0" />
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black font-mono shadow-md border-2 ${
                        isCurrent
                          ? 'bg-cyan-400 text-slate-950 border-white scale-110 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                          : isPassed
                          ? 'bg-slate-800 text-cyan-300 border-cyan-400/50'
                          : 'bg-slate-950 text-slate-400 border-slate-700'
                      }`}
                    >
                      {lvl.level}
                    </div>
                  </div>

                  {/* Ô Quà VIP (Dưới) */}
                  <div
                    className={`w-full p-2.5 rounded-xl border flex flex-col items-center justify-between text-center min-h-[125px] ${
                      lvl.premium.isGrandPrize
                        ? 'bg-gradient-to-b from-amber-500/30 via-rose-500/20 to-slate-900 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.5)]'
                        : isPremiumClaimed
                        ? 'bg-slate-900/60 border-emerald-500/30 opacity-60'
                        : canClaimPremium
                        ? 'bg-gradient-to-b from-amber-500/20 to-slate-900/90 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse'
                        : 'bg-slate-900/50 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xl">{lvl.premium.icon}</span>
                      {lvl.premium.isGrandPrize && (
                        <span className="text-[9px] px-1 py-0.2 bg-amber-400 text-slate-950 rounded font-black uppercase">
                          ĐẠI QUÀ
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] font-bold text-amber-200 line-clamp-2 my-1">
                      {lvl.premium.label}
                    </div>

                    <div className="mt-1">
                      {isPremiumClaimed ? (
                        <span className="text-[10px] font-black text-emerald-400">✔ ĐÃ NHẬN</span>
                      ) : canClaimPremium ? (
                        <button
                          onClick={() => handleClaimLevel(lvl.level, 'premium')}
                          disabled={actionLoading}
                          className="px-2 py-0.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] uppercase cursor-pointer"
                        >
                          NHẬN VIP
                        </button>
                      ) : needsVipUpgrade ? (
                        <button
                          onClick={handleUpgradePremium}
                          disabled={actionLoading}
                          className="px-1.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[9px] font-bold uppercase cursor-pointer hover:bg-amber-500/40"
                        >
                          👑 Mở VIP
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">🔒 Khóa</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="relative z-10 px-6 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] text-slate-400">
          <span>Thắng ván (+50 EXP) • Đấu Cúp (+100 EXP) • Điểm danh (+40 EXP)</span>
          <span className="text-cyan-400 font-semibold">Tự động thăng cấp & lưu vĩnh viễn</span>
        </div>
      </div>
    </div>
  );
}
