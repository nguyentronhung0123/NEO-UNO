import React, { useState, useEffect, useCallback } from 'react';
import { tournamentApi } from '../apis/tournamentApi';
import { AvatarFrame } from './AvatarFrame';
import { soundEngine } from '../utils/audioFx';
import { getRankTier } from '../utils/rankTiers';

export default function TournamentBracketModal({
  isOpen,
  onClose,
  user,
  onStartTournamentMatch,
  onUpdateUser,
}) {
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimToast, setClaimToast] = useState(null);

  // Tải hoặc khởi tạo giải đấu Cúp
  const fetchOrJoinTournament = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tournamentApi.joinTournament(user);
      if (res?.success && res.tournament) {
        setTournament(res.tournament);
      }
    } catch (err) {
      console.warn('Lỗi tải giải đấu:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchOrJoinTournament();
      try {
        soundEngine?.playUnoChime?.();
      } catch {}
    }
  }, [isOpen, fetchOrJoinTournament]);

  // Nhận thưởng giải đấu
  const handleClaimReward = async () => {
    if (!tournament || claiming || tournament.isRewardClaimed) return;
    setClaiming(true);
    try {
      const res = await tournamentApi.claimReward(
        tournament.tournamentId,
        user?._id || user?.id
      );
      if (res?.success) {
        setTournament((prev) => ({
          ...prev,
          isRewardClaimed: true,
          claimedReward: res.reward,
        }));
        if (res.user && onUpdateUser) {
          onUpdateUser(res.user);
        }
        setClaimToast(res.message);
        try {
          soundEngine?.playUnoAlert?.();
        } catch {}
      } else {
        setClaimToast(res?.message || 'Không thể nhận thưởng lúc này');
      }
    } catch (err) {
      setClaimToast('Lỗi kết nối khi nhận thưởng');
    } finally {
      setClaiming(false);
    }
  };

  // Tạo giải đấu mới khi đã hoàn thành hoặc muốn chơi lại
  const handleRestartTournament = async () => {
    setTournament(null);
    setClaimToast(null);
    setLoading(true);
    try {
      // Để tạo mới, truyền payload buộc server reset hoặc tạo id mới
      const res = await tournamentApi.joinTournament({
        ...user,
        forceNew: true,
      });
      if (res?.success && res.tournament) {
        setTournament(res.tournament);
      }
    } catch {
      fetchOrJoinTournament();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentRound = tournament?.currentRound || 1;
  const isCompleted = tournament?.status === 'completed';
  const isChampion = tournament?.userFinishedStage === 'champion';
  const isKnockedOut =
    isCompleted && tournament?.userFinishedStage !== 'champion';

  // Tìm trận đấu tiếp theo của người chơi
  const userId = String(user?._id || user?.id || 'guest_user');
  let currentActiveMatch = null;
  if (!isCompleted && tournament?.matches) {
    if (currentRound === 1) {
      currentActiveMatch = tournament.matches.find(
        (m) =>
          m.matchId === 1 &&
          m.status !== 'completed' &&
          (String(m.player1?.id) === userId || !m.player1?.isBot)
      );
    } else if (currentRound === 2) {
      currentActiveMatch = tournament.matches.find(
        (m) =>
          m.matchId === 5 &&
          m.status !== 'completed' &&
          (String(m.player1?.id) === userId ||
            String(m.player2?.id) === userId ||
            !m.player1?.isBot)
      );
    } else if (currentRound === 3) {
      currentActiveMatch = tournament.matches.find(
        (m) =>
          m.matchId === 7 &&
          m.status !== 'completed' &&
          (String(m.player1?.id) === userId ||
            String(m.player2?.id) === userId ||
            !m.player1?.isBot)
      );
    }
  }

  // Phân chia danh sách trận đấu theo 3 vòng
  const qfMatches =
    tournament?.matches?.filter((m) => m.round === 1) || [];
  const sfMatches =
    tournament?.matches?.filter((m) => m.round === 2) || [];
  const finalMatch = tournament?.matches?.find((m) => m.round === 3);

  // Render thẻ đấu thủ trong một cặp trận
  const renderParticipant = (p, isWinner, isCurrentPlayer) => {
    if (!p) {
      return (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/40 border border-dashed border-slate-700/60 text-slate-500 text-xs">
          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold">
            ?
          </div>
          <span>Chờ đối thủ vòng trước...</span>
        </div>
      );
    }

    const rank = getRankTier(p.elo || 1000);

    return (
      <div
        className={`flex items-center justify-between p-2 rounded-xl transition-all ${
          isWinner
            ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            : isCurrentPlayer
            ? 'bg-cyan-500/15 border border-cyan-400/50 text-cyan-200'
            : 'bg-slate-900/60 border border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0">
            <AvatarFrame
              avatar={
                p.avatar ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${p.nickname}`
              }
              frame={p.avatarFrame || 'frame_default'}
              size="w-7 h-7"
            />
            {p.seed && (
              <span className="absolute -bottom-1 -left-1 px-1 py-0.2 rounded-full bg-slate-950 text-[9px] font-black text-amber-400 border border-amber-400/30">
                #{p.seed}
              </span>
            )}
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-xs truncate">
                {p.nickname}
              </span>
              {isCurrentPlayer && (
                <span className="px-1 py-0.2 rounded bg-cyan-500 text-slate-950 text-[8px] font-black uppercase">
                  BẠN
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span>{rank.icon}</span>
              <span>{p.elo} Elo</span>
            </div>
          </div>
        </div>
        {isWinner && (
          <span className="shrink-0 ml-1 text-amber-400 text-xs font-black">
            🏆 THẮNG
          </span>
        )}
      </div>
    );
  };

  // Render thẻ trận đấu
  const renderMatchCard = (match) => {
    if (!match) return null;
    const isPlayerInMatch =
      String(match.player1?.id) === userId ||
      String(match.player2?.id) === userId ||
      (!match.player1?.isBot && match.player1 !== null);
    const isReadyToPlay =
      isPlayerInMatch &&
      match.status !== 'completed' &&
      match.player1 &&
      match.player2;

    return (
      <div
        key={match.matchId}
        className={`flex flex-col gap-1.5 p-3 rounded-2xl relative transition-all ${
          isReadyToPlay
            ? 'bg-gradient-to-b from-[#192233] to-[#111722] border-2 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.35)] scale-[1.02]'
            : match.status === 'completed'
            ? 'bg-[#121622]/90 border border-slate-700/60 opacity-90'
            : 'bg-[#0f1420]/80 border border-slate-800/80'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] font-headline font-bold text-slate-400 pb-1 border-b border-slate-800">
          <span>{match.roundName}</span>
          {isReadyToPlay ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black animate-pulse text-[9px] uppercase tracking-wider">
              TRẬN CỦA BẠN
            </span>
          ) : match.status === 'completed' ? (
            <span className="text-emerald-400 font-semibold text-[10px]">
              Đã xong
            </span>
          ) : (
            <span className="text-slate-500 text-[10px]">Đang chờ</span>
          )}
        </div>

        {/* 2 Đấu Thủ */}
        <div className="flex flex-col gap-1.5 my-0.5">
          {renderParticipant(
            match.player1,
            match.winner?.id && match.winner?.id === match.player1?.id,
            String(match.player1?.id) === userId || (!match.player1?.isBot && match.player1 !== null)
          )}
          {renderParticipant(
            match.player2,
            match.winner?.id && match.winner?.id === match.player2?.id,
            String(match.player2?.id) === userId
          )}
        </div>

        {/* Nút hành động trực tiếp nếu là trận đấu của người chơi */}
        {isReadyToPlay && (
          <button
            onClick={() => {
              try {
                soundEngine?.playCardSlam?.();
              } catch {}
              if (onStartTournamentMatch) {
                onStartTournamentMatch(match, tournament);
              }
            }}
            className="mt-1 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-slate-950 font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-black">
              sports_esports
            </span>
            <span>VÀO TRẬN ĐẤU NGAY</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md font-body animate-fadeIn">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-[28px] bg-[#0b0e17] border border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden">
        
        {/* HEADER MODAL */}
        <div className="relative px-6 py-4 border-b border-amber-500/20 bg-gradient-to-r from-[#14120c] via-[#1a140a] to-[#14120c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.5)]">
              <span className="material-symbols-outlined text-2xl font-black">
                emoji_events
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 tracking-wide">
                  ĐẤU GIẢI CÚP VÔ ĐỊCH CYBER
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase">
                  8 ĐẤU THỦ
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>🏆 Tổng Thưởng:</span>
                <span className="font-bold text-amber-400">5,000 Vàng</span>
                <span>•</span>
                <span className="font-bold text-cyan-400">800 Exp</span>
                <span>•</span>
                <span className="font-bold text-purple-400">+60 Elo</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* TOAST THÔNG BÁO NHẬN THƯỞNG */}
        {claimToast && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-200 text-xs font-bold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-base">
                military_tech
              </span>
              <span>{claimToast}</span>
            </div>
            <button
              onClick={() => setClaimToast(null)}
              className="text-amber-400 hover:text-white text-xs underline cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* NỘI DUNG SƠ ĐỒ NHÁNH ĐẤU (TOURNAMENT BRACKET TREE) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-amber-400 gap-3">
              <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs uppercase tracking-wider font-mono">
                Đang thiết lập sơ đồ bốc thăm 8 đấu thủ...
              </span>
            </div>
          ) : (
            <>
              {/* STATUS BANNER KHI ĐÃ HOÀN TẤT HOẶC BỊ LOẠI */}
              {isChampion && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-400 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                  <div className="flex items-center gap-3 text-center sm:text-left">
                    <span className="text-4xl animate-bounce">👑</span>
                    <div>
                      <h3 className="font-headline font-black text-amber-300 text-base sm:text-lg">
                        XIN CHÚC MỪNG QUÁN QUÂN CÚP VÔ ĐỊCH!
                      </h3>
                      <p className="text-xs text-amber-100/80">
                        Bạn đã đánh bại toàn bộ 7 đối thủ để bước lên bục vinh quang cao nhất!
                      </p>
                    </div>
                  </div>
                  {!tournament?.isRewardClaimed ? (
                    <button
                      onClick={handleClaimReward}
                      disabled={claiming}
                      className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      {claiming ? 'ĐANG NHẬN...' : '🎁 NHẬN THƯỞNG 5000 VÀNG & CÚP'}
                    </button>
                  ) : (
                    <button
                      onClick={handleRestartTournament}
                      className="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs uppercase tracking-wider border border-amber-400/40 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      🔄 THAM GIA GIẢI ĐẤU MỚI
                    </button>
                  )}
                </div>
              )}

              {isKnockedOut && (
                <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🥀</span>
                    <div>
                      <h3 className="font-headline font-bold text-rose-300 text-sm">
                        BẠN ĐÃ DỪNG BƯỚC TẠI VÒNG{' '}
                        {tournament?.userFinishedStage === 'semi'
                          ? 'BÁN KẾT'
                          : tournament?.userFinishedStage === 'final'
                          ? 'CHUNG KẾT'
                          : 'TỨ KẾT'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Đừng nản lòng! Nhận phần thưởng an ủi và quay trở lại chinh phục cúp vô địch nhé.
                      </p>
                    </div>
                  </div>
                  {!tournament?.isRewardClaimed ? (
                    <button
                      onClick={handleClaimReward}
                      disabled={claiming}
                      className="py-2 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer shrink-0"
                    >
                      {claiming ? 'ĐANG NHẬN...' : '🎁 NHẬN THƯỞNG AN ỦI'}
                    </button>
                  ) : (
                    <button
                      onClick={handleRestartTournament}
                      className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 cursor-pointer shrink-0"
                    >
                      🔄 THỬ LẠI GIẢI MỚI
                    </button>
                  )}
                </div>
              )}

              {/* SƠ ĐỒ CÂY PHÂN NHÁNH 3 VÒNG (BRACKET GRID) */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch relative">
                
                {/* CỘT 1: VÒNG TỨ KẾT (ROUND 1 - 4 TRẬN) */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-2 py-1 bg-slate-900/60 rounded-xl border border-slate-800 text-xs font-headline font-black text-amber-300">
                    <span>VÒNG TỨ KẾT</span>
                    <span className="text-[10px] text-slate-400">4 Trận / 8 Đấu Thủ</span>
                  </div>
                  <div className="flex flex-col gap-3 flex-1 justify-around">
                    {qfMatches.map((m) => renderMatchCard(m))}
                  </div>
                </div>

                {/* CỘT 2: VÒNG BÁN KẾT (ROUND 2 - 2 TRẬN) */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-2 py-1 bg-slate-900/60 rounded-xl border border-slate-800 text-xs font-headline font-black text-cyan-300">
                    <span>VÒNG BÁN KẾT</span>
                    <span className="text-[10px] text-slate-400">2 Trận / 4 Đấu Thủ</span>
                  </div>
                  <div className="flex flex-col gap-6 flex-1 justify-around py-4">
                    {sfMatches.map((m) => renderMatchCard(m))}
                  </div>
                </div>

                {/* CỘT 3: VÒNG CHUNG KẾT (ROUND 3 - 1 TRẬN TRANH CÚP) */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-2 py-1 bg-slate-900/60 rounded-xl border border-slate-800 text-xs font-headline font-black text-yellow-400">
                    <span>CHUNG KẾT TRANH CÚP</span>
                    <span className="text-[10px] text-amber-300 font-bold">1 Trận Quyết Định</span>
                  </div>
                  <div className="flex flex-col justify-center flex-1 py-8">
                    {finalMatch ? renderMatchCard(finalMatch) : null}
                  </div>
                </div>

                {/* CỘT 4: BỤC VINH QUANG QUÁN QUÂN (PODIUM) */}
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-[#18150c] via-[#120e06] to-[#0a0803] border-2 border-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.2)] text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400/10 via-transparent to-transparent pointer-events-none"></div>

                  {/* CÚP VÀNG CYBERPUNK NỔI BẬT */}
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500/30 to-yellow-400/20 border-2 border-amber-400/60 flex items-center justify-center text-5xl mb-4 shadow-[0_0_35px_rgba(251,191,36,0.5)] animate-pulse">
                    🏆
                  </div>

                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">
                    BỤC VINH QUANG
                  </span>
                  <h4 className="font-headline font-black text-lg text-white mb-2">
                    NHÀ VÔ ĐỊCH CÚP
                  </h4>

                  {tournament?.champion ? (
                    <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-400/40 w-full animate-fadeIn">
                      <AvatarFrame
                        avatar={
                          tournament.champion.avatar ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${tournament.champion.nickname}`
                        }
                        frame={tournament.champion.avatarFrame || 'frame_gold_crown'}
                        size="w-12 h-12"
                      />
                      <span className="font-headline font-black text-amber-300 text-sm">
                        {tournament.champion.nickname}
                      </span>
                      <span className="text-[10px] text-amber-200/80">
                        {tournament.champion.id === userId
                          ? '👑 BẠN LÀ NHÀ VÔ ĐỊCH'
                          : 'Quán Quân Mùa 1'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-700/60 w-full text-slate-500 text-xs">
                      <span>Đang chờ phân định qua 3 vòng đấu nghẹt thở...</span>
                    </div>
                  )}

                  {/* Nút hành động chính nếu có trận của bạn đang chờ */}
                  {currentActiveMatch && (
                    <div className="mt-5 w-full">
                      <button
                        onClick={() => {
                          try {
                            soundEngine?.playCardSlam?.();
                          } catch {}
                          if (onStartTournamentMatch) {
                            onStartTournamentMatch(currentActiveMatch, tournament);
                          }
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-slate-950 font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer animate-bounce"
                      >
                        <span className="material-symbols-outlined text-base font-black">
                          swords
                        </span>
                        <span>
                          {currentRound === 1
                            ? 'CHIẾN VÒNG TỨ KẾT'
                            : currentRound === 2
                            ? 'CHIẾN VÒNG BÁN KẾT'
                            : 'TRANH CÚP VÔ ĐỊCH'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </div>

        {/* FOOTER MODAL */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0d111a] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Hệ thống bốc thăm hạt giống Cyber Elo cân bằng</span>
          </div>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold transition-all cursor-pointer"
          >
            Đóng sơ đồ
          </button>
        </div>

      </div>
    </div>
  );
}
