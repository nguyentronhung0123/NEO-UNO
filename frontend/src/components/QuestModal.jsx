import React, { useState, useEffect, useCallback } from 'react';
import { questApi } from '../apis/questApi';

export default function QuestModal({ isOpen, onClose, user, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'achievements'

  // Daily Quests State
  const [dailyQuests, setDailyQuests] = useState([]);
  const [dailyChest, setDailyChest] = useState(null);
  const [dailyStats, setDailyStats] = useState({ completedCount: 0, totalCount: 0, hasClaimableReward: false });
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isDailyLoading, setIsDailyLoading] = useState(false);

  // Achievements State
  const [achievements, setAchievements] = useState([]);
  const [hasClaimableAch, setHasClaimableAch] = useState(false);
  const [isAchLoading, setIsAchLoading] = useState(false);

  // Action status state
  const [claimingId, setClaimingId] = useState(null);
  const [celebrationToast, setCelebrationToast] = useState(null);

  // 1. Tải danh sách nhiệm vụ hằng ngày
  const loadDailyQuests = useCallback(async () => {
    setIsDailyLoading(true);
    const res = await questApi.getDailyQuests();
    if (res && res.success) {
      setDailyQuests(res.quests || []);
      setDailyChest(res.dailyChest || null);
      setDailyStats(res.stats || { completedCount: 0, totalCount: 0, hasClaimableReward: false });
      setSecondsRemaining(res.secondsUntilReset || 0);
    }
    setIsDailyLoading(false);
  }, []);

  // 2. Tải danh sách thành tựu
  const loadAchievements = useCallback(async () => {
    setIsAchLoading(true);
    const res = await questApi.getAchievements();
    if (res && res.success) {
      setAchievements(res.achievements || []);
      setHasClaimableAch(Boolean(res.hasClaimable));
    }
    setIsAchLoading(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === 'daily') {
      loadDailyQuests();
    } else {
      loadAchievements();
    }
  }, [isOpen, activeTab, loadDailyQuests, loadAchievements]);

  // Đồng hồ đếm ngược thời gian làm mới nhiệm vụ ngày
  useEffect(() => {
    if (!isOpen || secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, secondsRemaining]);

  // Format giây thành chuỗi HH:MM:SS
  const formatCountdown = (secs) => {
    if (secs <= 0) return '00:00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Xử lý nhận thưởng nhiệm vụ ngày
  const handleClaimQuest = async (questId) => {
    setClaimingId(questId);
    const res = await questApi.claimQuest(questId);
    setClaimingId(null);

    if (res && res.success) {
      setCelebrationToast(res.message);
      if (onUpdateUser && res.userCoins !== undefined) {
        onUpdateUser({
          coins: res.userCoins,
          exp: res.userExp,
          level: res.userLevel,
        });
      }
      setTimeout(() => setCelebrationToast(null), 3000);
      loadDailyQuests();
    } else {
      alert(res?.message || 'Không thể nhận thưởng!');
    }
  };

  // Xử lý mở Rương Ngày
  const handleClaimChest = async () => {
    setClaimingId('daily_chest');
    const res = await questApi.claimDailyChest();
    setClaimingId(null);

    if (res && res.success) {
      setCelebrationToast(res.message);
      if (onUpdateUser && res.userCoins !== undefined) {
        onUpdateUser({
          coins: res.userCoins,
          exp: res.userExp,
          level: res.userLevel,
        });
      }
      setTimeout(() => setCelebrationToast(null), 3000);
      loadDailyQuests();
    } else {
      alert(res?.message || 'Không thể mở Rương Ngày!');
    }
  };

  // Xử lý nhận thưởng thành tựu
  const handleClaimAchievement = async (achievementId) => {
    setClaimingId(achievementId);
    const res = await questApi.claimAchievement(achievementId);
    setClaimingId(null);

    if (res && res.success) {
      setCelebrationToast(res.message);
      if (onUpdateUser && res.userCoins !== undefined) {
        onUpdateUser({
          coins: res.userCoins,
          exp: res.userExp,
          level: res.userLevel,
        });
      }
      setTimeout(() => setCelebrationToast(null), 3000);
      loadAchievements();
    } else {
      alert(res?.message || 'Không thể nhận thưởng thành tựu!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-body">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0b0f19] border-2 border-cyan-500/50 rounded-3xl shadow-[0_0_80px_rgba(0,210,255,0.25)] overflow-hidden">
        
        {/* ================= MODAL HEADER ================= */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#12192c] via-[#0d1424] to-[#12192c] border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-600/30 border border-amber-400/50 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              📜
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-headline font-black text-lg sm:text-xl text-white tracking-wide uppercase">
                  NHIỆM VỤ & THÀNH TỰU DANH HIỆU
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hoàn thành thử thách mỗi ngày để kiếm Vàng mua Skin và mở khóa Huy hiệu danh giá
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
            title="Đóng cửa sổ"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* ================= NAVIGATION TABS ================= */}
        <div className="flex items-center justify-between px-6 pt-3 border-b border-white/5 bg-[#0e1322]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-[#151c30] text-amber-300 border-t-2 border-x border-amber-400 border-b-transparent shadow-[0_-5px_15px_rgba(245,158,11,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-base">today</span>
              <span>Nhiệm Vụ Hằng Ngày</span>
              {dailyStats?.hasClaimableReward && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'achievements'
                  ? 'bg-[#151c30] text-cyan-300 border-t-2 border-x border-cyan-400 border-b-transparent shadow-[0_-5px_15px_rgba(0,210,255,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-base">military_tech</span>
              <span>Huy Hiệu & Thành Tựu</span>
              {hasClaimableAch && (
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,210,255,0.8)]" />
              )}
            </button>
          </div>

          {/* Đồng hồ đếm ngược reset 24h (chỉ hiện ở Tab Daily) */}
          {activeTab === 'daily' && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-amber-500/30 text-[11px] font-mono text-amber-300">
              <span className="material-symbols-outlined text-xs">timer</span>
              <span>Làm mới sau: <strong>{formatCountdown(secondsRemaining)}</strong></span>
            </div>
          )}
        </div>

        {/* TOAST ĂN MỪNG NHẬN THƯỞNG */}
        {celebrationToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-headline font-black text-xs uppercase shadow-[0_0_40px_rgba(245,158,11,0.6)] animate-bounce flex items-center gap-2">
            <span>🎉</span>
            <span>{celebrationToast}</span>
          </div>
        )}

        {/* ================= TAB 1: NHIỆM VỤ HẰNG NGÀY ================= */}
        {activeTab === 'daily' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            
            {/* 1. BANNER RƯƠNG CHIẾN TÍCH NGÀY (DAILY CHEST) */}
            {dailyChest && (
              <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-purple-950/60 via-amber-950/40 to-orange-950/60 border-2 border-amber-400/50 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg border transition-all ${
                    dailyChest.canClaim
                      ? 'bg-gradient-to-br from-amber-400 to-yellow-500 border-amber-300 animate-bounce'
                      : dailyChest.isClaimed
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-black/40 border-amber-500/30'
                  }`}>
                    {dailyChest.isClaimed ? '✓' : '🎁'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-headline font-black text-sm sm:text-base text-white">
                        {dailyChest.title}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {dailyStats.completedCount}/{dailyStats.totalCount} Nhiệm vụ
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1">
                      Hoàn thành toàn bộ nhiệm vụ hôm nay để nhận thêm: <strong className="text-amber-300">🪙 +{dailyChest.rewardCoins} Vàng</strong> & <strong className="text-cyan-300">⭐ +{dailyChest.rewardExp} EXP</strong>!
                    </p>

                    {/* Thanh tiến độ mở Rương */}
                    <div className="w-full sm:w-64 h-2 bg-black/60 rounded-full mt-2.5 overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                        style={{
                          width: `${dailyStats.totalCount > 0 ? (dailyStats.completedCount / dailyStats.totalCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Nút hành động Rương */}
                <div className="shrink-0">
                  {dailyChest.isClaimed ? (
                    <span className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-headline font-bold text-xs uppercase flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>Đã Mở Rương</span>
                    </span>
                  ) : dailyChest.canClaim ? (
                    <button
                      onClick={handleClaimChest}
                      disabled={claimingId === 'daily_chest'}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.6)] cursor-pointer transition-all hover:scale-105 active:scale-95 animate-pulse flex items-center justify-center gap-1.5"
                    >
                      <span>Mở Rương Ngay!</span>
                      <span className="text-sm">🎁</span>
                    </button>
                  ) : (
                    <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-headline font-bold text-xs uppercase block text-center">
                      Cần {dailyStats.totalCount}/{dailyStats.totalCount} Nhiệm vụ
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 2. DANH SÁCH CÁC NHIỆM VỤ NGÀY */}
            {isDailyLoading ? (
              <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin text-3xl text-amber-400">sync</span>
                <span className="text-xs">Đang tải danh sách nhiệm vụ hôm nay...</span>
              </div>
            ) : dailyQuests.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm">Chưa có nhiệm vụ nào hôm nay.</div>
            ) : (
              <div className="space-y-2.5">
                {dailyQuests.map((q) => {
                  const percent = Math.min(100, Math.round((q.current / q.target) * 100));
                  return (
                    <div
                      key={q.questId}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        q.isClaimed
                          ? 'bg-[#0f1422]/60 border-white/5 opacity-70'
                          : q.canClaim
                          ? 'bg-gradient-to-r from-amber-950/30 to-[#12182b] border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                          : 'bg-[#12182b] border-white/10 hover:border-cyan-500/30'
                      }`}
                    >
                      {/* Quest Info */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                          q.canClaim
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                            : 'bg-white/5 text-slate-400 border-white/10'
                        }`}>
                          <span className="material-symbols-outlined text-xl">
                            {q.icon || 'task_alt'}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-headline font-bold text-sm text-white">{q.title}</h5>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold">
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                🪙 +{q.rewardCoins} Vàng
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                ⭐ +{q.rewardExp} EXP
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-400 mt-1">{q.description}</p>

                          {/* Thanh tiến độ */}
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1 max-w-xs h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  q.isCompleted
                                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                                    : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 font-bold shrink-0">
                              {q.current} / {q.target} ({percent}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Nút hành động */}
                      <div className="shrink-0 self-end sm:self-center">
                        {q.isClaimed ? (
                          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-headline uppercase flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">check</span>
                            <span>Đã Nhận</span>
                          </span>
                        ) : q.canClaim ? (
                          <button
                            onClick={() => handleClaimQuest(q.questId)}
                            disabled={claimingId === q.questId}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 text-slate-950 font-headline font-black text-xs uppercase tracking-wider cursor-pointer transition-all shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-95 animate-pulse"
                          >
                            {claimingId === q.questId ? 'Đang nhận...' : 'Nhận Thưởng'}
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-500 text-xs font-bold font-headline uppercase">
                            Chưa Xong
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: HUY HIỆU & THÀNH TỰU DÀI HẠN ================= */}
        {activeTab === 'achievements' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
            {isAchLoading ? (
              <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin text-3xl text-cyan-400">sync</span>
                <span className="text-xs">Đang tải dữ liệu thành tựu...</span>
              </div>
            ) : achievements.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm">Chưa có thành tựu nào.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {achievements.map((ach) => {
                  const percent = Math.min(100, Math.round((ach.currentProgress / ach.targetProgress) * 100));
                  return (
                    <div
                      key={ach.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        ach.isClaimed
                          ? 'bg-[#0f1422]/60 border-white/5'
                          : ach.canClaim
                          ? 'bg-gradient-to-r from-purple-950/40 via-[#13192c] to-cyan-950/30 border-cyan-400/50 shadow-[0_0_20px_rgba(0,210,255,0.2)]'
                          : 'bg-[#12182b] border-white/10'
                      }`}
                    >
                      {/* Huy Hiệu Icon */}
                      <div className={`w-13 h-13 rounded-2xl flex items-center justify-center text-2xl shrink-0 border shadow-md ${
                        ach.isUnlocked
                          ? 'bg-gradient-to-br from-amber-400/30 via-purple-500/30 to-cyan-400/30 border-cyan-400/60 shadow-[0_0_15px_rgba(0,210,255,0.3)]'
                          : 'bg-black/50 border-white/10 opacity-50 grayscale'
                      }`}>
                        {ach.badge || '🏆'}
                      </div>

                      {/* Chi tiết thành tựu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-headline font-bold text-sm text-white truncate">{ach.title}</h5>
                          <span className="text-[10px] font-mono text-cyan-300 font-bold shrink-0">
                            {ach.currentProgress} / {ach.targetProgress}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{ach.description}</p>

                        {/* Thanh tiến độ */}
                        <div className="w-full h-1.5 bg-black/60 rounded-full mt-2 overflow-hidden border border-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        {/* Phần thưởng & Nút nhận */}
                        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold">
                            <span className="text-amber-300">🪙 +{ach.rewardCoins}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-cyan-300">⭐ +{ach.rewardExp} EXP</span>
                          </div>

                          {ach.isClaimed ? (
                            <span className="text-[11px] text-emerald-400 font-bold font-headline uppercase flex items-center gap-0.5">
                              <span>Đã Mở Khóa ✓</span>
                            </span>
                          ) : ach.canClaim ? (
                            <button
                              onClick={() => handleClaimAchievement(ach.id)}
                              disabled={claimingId === ach.id}
                              className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 text-slate-950 font-headline font-black text-xs uppercase cursor-pointer transition-all shadow-md active:scale-95 animate-pulse"
                            >
                              {claimingId === ach.id ? 'Đang nhận...' : 'Nhận Quà'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">lock</span>
                              <span>Chưa đạt</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
