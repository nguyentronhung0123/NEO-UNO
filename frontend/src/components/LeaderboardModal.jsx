import React, { useState, useEffect } from 'react';
import { matchApi } from '../apis/matchApi';

// CẤU HÌNH CÁC BẬC RANK ĐẤU TRƯỜNG NEO-UNO
export const RANK_TIERS = [
  {
    tier: 'bronze',
    name: 'ĐỒNG',
    title: 'Tân Binh Đấu Trường',
    minElo: 0,
    maxElo: 1049,
    badge: '🥉',
    color: '#cd7f32',
    accentColor: 'from-amber-700 via-amber-800 to-yellow-900',
    borderColor: 'border-amber-600/70',
    glowColor: 'shadow-[0_0_35px_rgba(205,127,50,0.5)]',
    ringColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    nextTierName: 'BẠC',
    nextBadge: '🥈',
    nextElo: 1050,
    rewardDesc: '500 Vàng • Huy hiệu Tân Binh',
  },
  {
    tier: 'silver',
    name: 'BẠC',
    title: 'Chiến Binh Tinh Anh',
    minElo: 1050,
    maxElo: 1149,
    badge: '🥈',
    color: '#cbd5e1',
    accentColor: 'from-slate-400 via-slate-600 to-slate-800',
    borderColor: 'border-slate-300/80',
    glowColor: 'shadow-[0_0_35px_rgba(203,213,225,0.5)]',
    ringColor: 'border-slate-300/40',
    textColor: 'text-slate-200',
    nextTierName: 'VÀNG',
    nextBadge: '🥇',
    nextElo: 1150,
    rewardDesc: '1,000 Vàng • Khung Avatar Bạc',
  },
  {
    tier: 'gold',
    name: 'VÀNG',
    title: 'Cao Thủ Hoàng Kim',
    minElo: 1150,
    maxElo: 1299,
    badge: '🥇',
    color: '#fbbf24',
    accentColor: 'from-amber-500 via-yellow-600 to-amber-900',
    borderColor: 'border-yellow-400/90',
    glowColor: 'shadow-[0_0_40px_rgba(251,191,36,0.6)]',
    ringColor: 'border-yellow-400/50',
    textColor: 'text-yellow-300',
    nextTierName: 'BẠCH KIM',
    nextBadge: '💠',
    nextElo: 1300,
    rewardDesc: '2,000 Vàng • Khung Avatar Hoàng Kim',
  },
  {
    tier: 'platinum',
    name: 'BẠCH KIM',
    title: 'Bậc Thầy Chiến Thuật',
    minElo: 1300,
    maxElo: 1499,
    badge: '💠',
    color: '#22d3ee',
    accentColor: 'from-cyan-500 via-teal-700 to-cyan-950',
    borderColor: 'border-cyan-400/90',
    glowColor: 'shadow-[0_0_40px_rgba(34,211,238,0.6)]',
    ringColor: 'border-cyan-400/50',
    textColor: 'text-cyan-300',
    nextTierName: 'KIM CƯƠNG',
    nextBadge: '💎',
    nextElo: 1500,
    rewardDesc: '3,500 Vàng • Thẻ Bài Neon Platinum',
  },
  {
    tier: 'diamond',
    name: 'KIM CƯƠNG',
    title: 'Huyền Thoại Bất Bại',
    minElo: 1500,
    maxElo: 1799,
    badge: '💎',
    color: '#60a5fa',
    accentColor: 'from-blue-600 via-indigo-800 to-blue-950',
    borderColor: 'border-blue-400/90',
    glowColor: 'shadow-[0_0_45px_rgba(96,165,250,0.65)]',
    ringColor: 'border-blue-400/50',
    textColor: 'text-blue-300',
    nextTierName: 'CAO THỦ',
    nextBadge: '👑',
    nextElo: 1800,
    rewardDesc: '5,000 Vàng • Khung Kim Cương Lấp Lánh',
  },
  {
    tier: 'master',
    name: 'CAO THỦ',
    title: 'Đại Kiện Tướng UNO',
    minElo: 1800,
    maxElo: 2099,
    badge: '👑',
    color: '#c084fc',
    accentColor: 'from-purple-600 via-fuchsia-800 to-purple-950',
    borderColor: 'border-purple-400/90',
    glowColor: 'shadow-[0_0_50px_rgba(192,132,252,0.7)]',
    ringColor: 'border-purple-400/50',
    textColor: 'text-purple-300',
    nextTierName: 'THẦN THOẠI',
    nextBadge: '🔥',
    nextElo: 2100,
    rewardDesc: '8,000 Vàng • Danh hiệu [Bậc Thầy UNO]',
  },
  {
    tier: 'grandmaster',
    name: 'THẦN THOẠI',
    title: 'Chúa Tể Tối Cao',
    minElo: 2100,
    maxElo: 99999,
    badge: '🔥',
    color: '#f87171',
    accentColor: 'from-rose-600 via-red-800 to-rose-950',
    borderColor: 'border-rose-500/90',
    glowColor: 'shadow-[0_0_60px_rgba(244,63,94,0.75)]',
    ringColor: 'border-rose-500/50',
    textColor: 'text-rose-300',
    nextTierName: null,
    nextBadge: null,
    nextElo: null,
    rewardDesc: '15,000 Vàng • Vương Miện Thần Thoại Vĩnh Cửu',
  },
];

// Helper xác định bậc Rank dựa trên điểm ELO
export function getRankTier(elo = 1000) {
  const numElo = Number(elo) || 1000;
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (numElo >= RANK_TIERS[i].minElo) {
      return RANK_TIERS[i];
    }
  }
  return RANK_TIERS[0];
}

export default function LeaderboardModal({ isOpen, onClose, onOpenAuth }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [previewTier, setPreviewTier] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const stored = localStorage.getItem('neo_user') || localStorage.getItem('user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          console.warn('Cannot parse current user');
        }
      }

      matchApi.getLeaderboard(15).then((data) => {
        if (data.success && data.leaderboard) {
          const humanOnly = data.leaderboard.filter(
            (p) => p.role !== 'bot' && !/^bot/i.test(p.nickname)
          );
          setLeaderboard(humanOnly);
        }
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Lấy ELO đồng bộ từ danh sách leaderboard nếu có
  const myEntryInLeaderboard = leaderboard.find(
    (p) => currentUser && (p.id === currentUser.id || p.id === currentUser._id || p.nickname === currentUser.nickname)
  );
  const userElo = myEntryInLeaderboard ? myEntryInLeaderboard.elo : currentUser?.elo || 1000;
  const userActualTier = getRankTier(userElo);

  // Bậc đang hiển thị (mặc định là bậc hiện tại của user, hoặc bậc user đang click xem thử)
  const displayTier = previewTier || userActualTier;
  const isViewingMyTier = displayTier.tier === userActualTier.tier;

  // Tính toán thanh tiến trình điểm thăng hạng
  const tierMin = displayTier.minElo === 0 ? 1000 : displayTier.minElo;
  const targetElo = displayTier.nextElo || (displayTier.minElo + 500);
  const eloRange = Math.max(1, targetElo - tierMin);
  const currentProgress = Math.max(0, userElo - tierMin);
  const progressPercent = displayTier.nextElo
    ? Math.min(100, Math.max(8, Math.round((currentProgress / eloRange) * 100)))
    : 100;
  const pointsNeeded = displayTier.nextElo ? Math.max(0, displayTier.nextElo - userElo) : 0;

  // Top 5 người chơi rank cao nhất
  const top5Players = leaderboard.slice(0, 5);
  const userInTop5 = top5Players.some(
    (p) => currentUser && (p.id === currentUser.id || p.id === currentUser._id || p.nickname === currentUser.nickname)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl bg-surface-container-lowest/95 border border-primary-container/30 rounded-3xl p-5 sm:p-7 shadow-[0_0_80px_rgba(0,210,255,0.25)] flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-xl shadow-md">
              🏆
            </div>
            <div>
              <h2 className="font-headline font-black text-lg sm:text-xl text-white tracking-tight uppercase flex items-center gap-2">
                ĐẤU TRƯỜNG RANK & BẢNG VINH DANH CAO THỦ
              </h2>
              <p className="text-[11px] text-slate-400">
                Đồng bộ dữ liệu thời gian thực trực tiếp từ MongoDB Atlas Cloud
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Banner Nhắc Nhở Chế Độ Khách */}
        {(currentUser?.role === 'guest' || !currentUser) && (
          <div className="mb-3.5 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-500/40 text-xs flex flex-wrap items-center justify-between gap-3 shadow-md animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⚠️</span>
              <div>
                <span className="font-bold text-amber-300">Bạn đang ở Chế Độ Khách (Guest)</span>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Chế độ Khách chỉ chơi luyện tập với Bot AI. Chỉ tài khoản chính thức mới được tích lũy ELO và vinh danh trên Bảng Xếp Hạng.
                </p>
              </div>
            </div>
            {onOpenAuth && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-4 py-1.5 rounded-full bg-primary-container hover:bg-cyan-400 text-black font-headline font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(0,210,255,0.4)] whitespace-nowrap"
              >
                🚪 Đăng Nhập Để Leo Rank
              </button>
            )}
          </div>
        )}

        {/* THÂN MODAL: 2 CỘT RÕ RÀNG */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 flex-1 min-h-0 overflow-hidden">
          
          {/* ================= BÊN TRÁI: LOGO BẬC RANK & THANH ĐIỂM TIẾN TRÌNH ================= */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-b from-surface-container-low/90 to-surface-container-lowest/95 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-inner relative overflow-hidden">
            
            {/* Vệt sáng trang trí background */}
            <div
              className="absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20"
              style={{ backgroundColor: displayTier.color }}
            />

            {/* Tiêu đề & Trạng thái xem */}
            <div className="flex items-center justify-between z-10">
              <span className="text-[11px] font-headline font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>🎖️</span> BẬC RANK CỦA BẠN
              </span>
              {!isViewingMyTier ? (
                <button
                  onClick={() => setPreviewTier(null)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-primary-container/20 text-primary-container border border-primary-container/40 hover:bg-primary-container/30 transition-all cursor-pointer font-bold"
                >
                  ↩ Về Bậc Của Bạn
                </button>
              ) : myEntryInLeaderboard ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary-container/20 text-primary-container border border-primary-container/30">
                  Hạng #{myEntryInLeaderboard.rank}
                </span>
              ) : null}
            </div>

            {/* TRỌNG TÂM: LOGO BẬC RANK (HUY HIỆU LỚN PHÁT SÁNG) */}
            <div className="flex flex-col items-center justify-center py-4 sm:py-5 z-10">
              
              {/* Khung viền Logo Cyberpunk phát sáng đa tầng */}
              <div className="relative flex items-center justify-center">
                {/* Vòng hào quang ngoài */}
                <div
                  className={`absolute w-36 h-36 rounded-full border border-dashed animate-spin-slow pointer-events-none ${displayTier.ringColor}`}
                  style={{ animationDuration: '20s' }}
                />

                {/* Huy hiệu chính */}
                <div
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br ${displayTier.accentColor} border-2 ${displayTier.borderColor} ${displayTier.glowColor} flex flex-col items-center justify-center shadow-2xl relative transition-all duration-300 transform hover:scale-105`}
                >
                  {/* Biểu tượng Rank lớn */}
                  <span className="text-5xl sm:text-6xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] select-none">
                    {displayTier.badge}
                  </span>

                  {/* Ngôi sao danh vọng */}
                  <div className="flex items-center gap-1 mt-1 text-xs select-none">
                    <span>⭐</span>
                    <span>⭐</span>
                    <span>⭐</span>
                  </div>
                </div>
              </div>

              {/* Tên Bậc Rank hoành tráng */}
              <div className="text-center mt-3.5">
                <h3 className={`font-headline font-black text-xl sm:text-2xl uppercase tracking-wider ${displayTier.textColor} drop-shadow-md`}>
                  BẬC {displayTier.name}
                </h3>
                <p className="text-xs text-slate-300 font-medium tracking-wide mt-0.5">
                  {displayTier.title}
                </p>
                <div className="mt-1">
                  <span className="inline-block px-3 py-0.5 rounded-full bg-black/50 border border-white/10 text-[11px] font-mono font-bold text-amber-300">
                    {displayTier.minElo} - {displayTier.maxElo >= 9999 ? 'Trở lên' : `${displayTier.maxElo}`} ELO
                  </span>
                </div>
              </div>

            </div>

            {/* THANH TIẾN TRÌNH ĐIỂM: ĐIỂM HIỆN TẠI ĐẾN ĐIỂM LÊN RANK */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-black/50 border border-white/10 shadow-inner z-10 flex flex-col gap-2">
              
              {/* Hàng thông tin điểm số 2 đầu */}
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-sans">Điểm hiện tại</span>
                  <span className="font-headline font-black text-amber-300 text-sm">
                    {userElo} ELO
                  </span>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 font-sans">
                    {displayTier.nextElo ? `Mốc lên ${displayTier.nextTierName}` : 'Đỉnh cao'}
                  </span>
                  <span className="font-headline font-black text-cyan-300 text-sm flex items-center gap-1">
                    {displayTier.nextBadge && <span>{displayTier.nextBadge}</span>}
                    <span>{displayTier.nextElo ? `${displayTier.nextElo} ELO` : 'MAX'}</span>
                  </span>
                </div>
              </div>

              {/* Thanh tiến trình Neon Progress Bar */}
              <div className="w-full bg-slate-900 rounded-full h-3.5 overflow-hidden p-0.5 border border-white/15 relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-container via-cyan-400 to-amber-300 transition-all duration-700 shadow-[0_0_15px_rgba(0,210,255,0.7)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Dòng chữ trạng thái tiến trình */}
              <div className="text-center text-[11px] font-semibold text-slate-300 pt-0.5">
                {displayTier.nextElo ? (
                  <span>
                    Cần thêm <strong className="font-mono text-white text-xs">+{pointsNeeded} ELO</strong> nữa để thăng hạng <strong className={displayTier.textColor}>{displayTier.nextTierName} {displayTier.nextBadge}</strong>!
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                    <span>🔥</span> ĐÃ ĐẠT BẬC THẦN THOẠI TỐI CAO
                  </span>
                )}
              </div>
            </div>

            {/* DẢI HUY HIỆU MINI: XEM TRƯỚC TẤT CẢ CÁC BẬC RANK */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-1 z-10">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">
                Xem Bậc:
              </span>
              <div className="flex items-center justify-between w-full sm:w-auto gap-1">
                {RANK_TIERS.map((t) => {
                  const isSelected = displayTier.tier === t.tier;
                  const isMine = userActualTier.tier === t.tier;

                  return (
                    <button
                      key={t.tier}
                      onClick={() => setPreviewTier(t)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm sm:text-base transition-all cursor-pointer relative ${
                        isSelected
                          ? `bg-white/20 border-2 ${t.borderColor} scale-110 shadow-md`
                          : 'bg-white/5 border border-white/10 hover:bg-white/15 opacity-70 hover:opacity-100'
                      }`}
                      title={`${t.name} (${t.minElo} - ${t.maxElo} ELO)`}
                    >
                      <span>{t.badge}</span>
                      {isMine && (
                        <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary-container ring-1 ring-black" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ================= BÊN PHẢI: TOP 5 NGƯỜI CHƠI RANK CAO NHẤT ================= */}
          <div className="lg:col-span-7 flex flex-col min-h-0 bg-surface-container-lowest/80 border border-primary-container/30 rounded-2xl p-4 sm:p-5">
            
            {/* Header Cột Phải */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">👑</span>
                <h3 className="font-headline font-black text-sm sm:text-base text-amber-300 uppercase tracking-wider">
                  TOP 5 CAO THỦ RANK CAO NHẤT
                </h3>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono font-bold">
                Bảng Vàng Đấu Trường
              </span>
            </div>

            {/* Danh sách Top 5 Player */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 custom-scrollbar">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <span className="material-symbols-outlined animate-spin text-3xl text-primary-container">autorenew</span>
                  <span className="text-xs font-semibold">Đang tải Top 5 cao thủ từ MongoDB...</span>
                </div>
              ) : top5Players.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-xs">
                  Chưa có dữ liệu người chơi trong bảng xếp hạng.
                </div>
              ) : (
                top5Players.map((player) => {
                  const isRank1 = player.rank === 1;
                  const isRank2 = player.rank === 2;
                  const isRank3 = player.rank === 3;
                  const pTier = getRankTier(player.elo || 1000);
                  const isCurrent =
                    currentUser &&
                    (player.id === currentUser.id ||
                      player.id === currentUser._id ||
                      player.nickname === currentUser.nickname);

                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-primary-container/20 border-primary-container shadow-[0_0_18px_rgba(0,210,255,0.25)]'
                          : isRank1
                          ? 'bg-gradient-to-r from-amber-500/25 via-yellow-500/10 to-transparent border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                          : isRank2
                          ? 'bg-slate-300/15 border-slate-300/50'
                          : isRank3
                          ? 'bg-amber-700/20 border-amber-600/50'
                          : 'bg-surface-container-low/50 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Huy hiệu thứ hạng 1, 2, 3, 4, 5 */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-headline font-black text-sm flex-shrink-0">
                          {isRank1 ? (
                            <span className="text-2xl filter drop-shadow">🥇</span>
                          ) : isRank2 ? (
                            <span className="text-2xl filter drop-shadow">🥈</span>
                          ) : isRank3 ? (
                            <span className="text-2xl filter drop-shadow">🥉</span>
                          ) : (
                            <span className="text-slate-400 font-mono text-sm font-bold">#{player.rank}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        <img
                          src={player.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.nickname}`}
                          alt={player.nickname}
                          className="w-10 h-10 rounded-full bg-slate-800 border border-white/20 p-0.5 object-cover flex-shrink-0"
                        />

                        {/* Thông tin đấu thủ */}
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-bold text-sm truncate max-w-[140px] sm:max-w-[180px] ${
                                isCurrent
                                  ? 'text-primary-container font-black'
                                  : isRank1
                                  ? 'text-amber-200'
                                  : 'text-white'
                              }`}
                            >
                              {player.nickname} {isCurrent && '(Bạn)'}
                            </span>

                            {/* Huy hiệu Bậc Rank của Player */}
                            <span
                              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${pTier.bg || 'bg-white/10 border-white/20 text-slate-200'}`}
                              title={`Bậc ${pTier.name}`}
                            >
                              <span>{pTier.badge}</span>
                              <span>{pTier.name}</span>
                            </span>

                            {/* Tag Bot AI */}
                            {player.role === 'bot' && (
                              <span className="text-[8px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-bold">
                                BOT AI
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {player.wins} Trận thắng • {player.winRate}% Tỷ lệ thắng
                          </span>
                        </div>
                      </div>

                      {/* Điểm ELO & Tiền Vàng */}
                      <div className="flex flex-col items-end flex-shrink-0 pl-3">
                        <span className="font-headline font-black text-sm sm:text-base text-amber-300">
                          {player.elo || 1000} ELO
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <span className="text-yellow-400 text-xs">🪙</span>
                          {player.coins || 1000}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Nếu người chơi hiện tại không nằm trong Top 5 thì hiển thị vị trí của họ ở dưới */}
              {!loading && !userInTop5 && myEntryInLeaderboard && (
                <div className="mt-2 pt-2.5 border-t border-dashed border-white/15">
                  <div className="p-3 rounded-2xl bg-primary-container/15 border border-primary-container/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-slate-400">#{myEntryInLeaderboard.rank}</span>
                      <span className="text-xs font-bold text-primary-container">
                        {currentUser?.nickname || 'Bạn'} (Thứ hạng của bạn)
                      </span>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-slate-200">
                        {userActualTier.badge} {userActualTier.name}
                      </span>
                    </div>
                    <span className="font-headline font-black text-sm text-amber-300">
                      {userElo} ELO
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="pt-3.5 mt-3 border-t border-white/10 flex flex-wrap justify-between items-center gap-2 text-[10px] text-slate-500">
          <span>💡 Điểm ELO ván 4 người: 🥇 Nhất +30 ELO | 🥈 Nhì +10 ELO | 🥉 Ba -5 ELO | 🏅 Bét -20 ELO</span>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
