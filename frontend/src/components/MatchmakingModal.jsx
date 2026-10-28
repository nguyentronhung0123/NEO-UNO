import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';
import { soundEngine } from '../utils/audioFx';
import { getRankTier } from './LeaderboardModal';

export default function MatchmakingModal({
  isOpen,
  onClose,
  user,
  initialMode = '4_PLAYERS',
  onStartOnlineMatch,
}) {
  const [selectedMode, setSelectedMode] = useState(initialMode);
  const [isSearching, setIsSearching] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentPlayers, setCurrentPlayers] = useState(1);
  const [requiredPlayers, setRequiredPlayers] = useState(4);
  const [matchedRoom, setMatchedRoom] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [errorMsg, setErrorMsg] = useState('');

  const timerRef = useRef(null);
  const radarPingIntervalRef = useRef(null);
  const socket = getSocket();

  const MODE_CONFIGS = {
    '4_PLAYERS': { label: 'Bàn 4 Người', capacity: 4, icon: 'groups', desc: 'Đấu trường chuẩn quốc tế' },
    '3_PLAYERS': { label: 'Đấu Tay Ba', capacity: 3, icon: 'group', desc: 'Trận chiến 3 người tốc độ cao' },
    'SOLO_1V1': { label: 'Solo 1v1', capacity: 2, icon: 'swords', desc: 'Đấu tay đôi sinh tử' },
  };

  // Khởi động ghép trận
  const startSearching = (modeToUse = selectedMode) => {
    setIsSearching(true);
    setElapsedSeconds(0);
    setCurrentPlayers(1);
    setRequiredPlayers(MODE_CONFIGS[modeToUse]?.capacity || 4);
    setMatchedRoom(null);
    setErrorMsg('');

    soundEngine.init();
    soundEngine.playRadarPing();

    socket.emit(
      'matchmaking:join',
      {
        user: {
          id: user?.id || user?._id,
          nickname: user?.nickname || user?.name || 'Đấu thủ',
          avatar: user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.nickname || 'player'}`,
          elo: user?.elo || 1000,
        },
        mode: modeToUse,
      },
      (res) => {
        if (!res?.success) {
          setErrorMsg(res?.message || 'Không thể tham gia hàng chờ!');
          setIsSearching(false);
        }
      }
    );
  };

  // Hủy tìm trận
  const cancelSearching = () => {
    socket.emit('matchmaking:cancel', () => {
      setIsSearching(false);
      setElapsedSeconds(0);
      setMatchedRoom(null);
    });
    setIsSearching(false);
    onClose();
  };

  // Tự động bắt đầu tìm khi mở modal
  useEffect(() => {
    if (isOpen) {
      setSelectedMode(initialMode);
      startSearching(initialMode);
    } else {
      setIsSearching(false);
      setMatchedRoom(null);
      setElapsedSeconds(0);
    }
  }, [isOpen, initialMode]);

  // Bộ đếm giây tìm trận & âm thanh radar
  useEffect(() => {
    if (isSearching && !matchedRoom) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      radarPingIntervalRef.current = setInterval(() => {
        soundEngine.playRadarPing();
      }, 3500);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (radarPingIntervalRef.current) clearInterval(radarPingIntervalRef.current);
    };
  }, [isSearching, matchedRoom]);

  // Lắng nghe sự kiện từ Socket
  useEffect(() => {
    if (!socket) return;

    const handleStatus = (data) => {
      if (data?.inQueue) {
        setCurrentPlayers(data.currentPlayers || 1);
        setRequiredPlayers(data.requiredPlayers || 4);
      }
    };

    const handleMatched = ({ room }) => {
      console.log('[Matchmaking] 🎉 Đã tìm thấy trận!', room);
      setMatchedRoom(room);
      setIsSearching(false);
      setCountdown(3);
      soundEngine.playMatchFound();

      // Đếm ngược 3.. 2.. 1.. chuyển vào game
      let count = 3;
      const countTimer = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(countTimer);
          onStartOnlineMatch && onStartOnlineMatch(room);
          onClose();
        }
      }, 1000);
    };

    socket.on('matchmaking:status', handleStatus);
    socket.on('matchmaking:matched', handleMatched);

    return () => {
      socket.off('matchmaking:status', handleStatus);
      socket.off('matchmaking:matched', handleMatched);
    };
  }, [socket, onStartOnlineMatch, onClose]);

  if (!isOpen) return null;

  const currentCap = MODE_CONFIGS[selectedMode]?.capacity || 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in font-body">
      {/* Background radial glow */}
      <div className="absolute w-[500px] h-[500px] bg-primary-container/10 blur-[130px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-lg bg-[#0e121d]/95 border border-primary-container/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,210,255,0.25)] flex flex-col items-center text-center overflow-hidden">
        
        {/* Nút đóng góc phải (khi chưa ghép) */}
        {!matchedRoom && (
          <button
            onClick={cancelSearching}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            title="Đóng / Hủy tìm"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}

        {/* ================= GIAI ĐOẠN 1: ĐANG TÌM KIẾM TRẬN ================= */}
        {!matchedRoom ? (
          <>
            {/* Radar Animation */}
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 my-3 flex items-center justify-center">
              {/* Radar concentric rings */}
              <div className="absolute inset-0 rounded-full border border-primary-container/20 animate-ping opacity-25"></div>
              <div className="absolute inset-3 rounded-full border border-cyan-500/30"></div>
              <div className="absolute inset-8 rounded-full border border-cyan-500/20"></div>
              <div className="absolute inset-14 rounded-full border border-cyan-500/20"></div>

              {/* Radar crosshairs */}
              <div className="absolute w-full h-[1px] bg-primary-container/20"></div>
              <div className="absolute h-full w-[1px] bg-primary-container/20"></div>

              {/* Sweeping Conic Beam */}
              <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(0,210,255,0.4)_360deg)] animate-[spin_2.5s_linear_infinite]"></div>

              {/* Center Glowing Hub */}
              <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-primary-container/30 to-cyan-500/20 border border-primary-container/50 shadow-[0_0_20px_rgba(0,210,255,0.6)] flex items-center justify-center backdrop-blur-md">
                <span className="material-symbols-outlined text-2xl text-primary-container animate-pulse">
                  radar
                </span>
              </div>
            </div>

            {/* Header info */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/15 border border-primary-container/30 text-primary-container text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-ping"></span>
              {MODE_CONFIGS[selectedMode]?.label} • Đang tìm đối thủ
            </div>

            <h2 className="text-xl sm:text-2xl font-headline font-black text-white tracking-wide uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              GHÉP TRẬN NHANH
            </h2>

            {/* Timer & Player Count Status */}
            <div className="mt-2 flex items-center justify-center gap-6 text-slate-300 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-cyan-400">schedule</span>
                <span className="font-mono text-sm font-bold text-white">
                  00:{elapsedSeconds < 10 ? `0${elapsedSeconds}` : elapsedSeconds}
                </span>
              </div>
              <div className="w-[1px] h-3 bg-white/10"></div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-amber-400">group</span>
                <span className="font-bold text-amber-300">
                  {currentPlayers} / {currentCap} Người
                </span>
              </div>
            </div>

            {/* Slot Preview Indicators */}
            <div className="flex items-center justify-center gap-3 my-4 w-full">
              {Array.from({ length: currentCap }).map((_, idx) => {
                const isFilled = idx < currentPlayers;
                return (
                  <div
                    key={idx}
                    className={`flex-1 max-w-[85px] py-2 px-1 rounded-xl border flex flex-col items-center transition-all ${
                      isFilled
                        ? 'bg-primary-container/15 border-primary-container/60 shadow-[0_0_15px_rgba(0,210,255,0.3)]'
                        : 'bg-white/5 border-white/10 opacity-60'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full mb-1 flex items-center justify-center bg-black/40 overflow-hidden border border-white/20">
                      {isFilled ? (
                        <span className="material-symbols-outlined text-sm text-primary-container">
                          person
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-xs text-slate-500 animate-pulse">
                          more_horiz
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-300">
                      {isFilled ? (idx === 0 ? 'Bạn' : `Đấu thủ ${idx + 1}`) : 'Chờ...'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Tip Banner */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-400 max-w-sm mb-5 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary-container">info</span>
              <span>
                Ghép theo trình độ ELO. Sau <strong>8 giây</strong> sẽ tự điền Bot AI để vào trận ngay!
              </span>
            </div>

            {errorMsg && (
              <div className="text-rose-400 text-xs font-bold mb-3">{errorMsg}</div>
            )}

            {/* Action: Hủy tìm */}
            <button
              onClick={cancelSearching}
              className="w-full py-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-white font-headline text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.01]"
            >
              <span className="material-symbols-outlined text-sm">cancel</span>
              <span>HỦY TÌM TRẬN</span>
            </button>
          </>
        ) : (
          /* ================= GIAI ĐOẠN 2: ĐÃ TÌM THẤY TRẬN ĐẤU ================= */
          <div className="py-2 flex flex-col items-center animate-scale-up w-full">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] mb-3">
              <span className="material-symbols-outlined text-3xl font-black">check</span>
            </div>

            <h2 className="text-2xl font-headline font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-300 to-white uppercase tracking-wider mb-1">
              ĐÃ TÌM THẤY TRẬN!
            </h2>
            <p className="text-slate-400 text-xs mb-4">
              Phòng đấu: <strong className="text-white font-mono">{matchedRoom.code}</strong> • Chuẩn bị vào bàn đấu
            </p>

            {/* Danh sách đấu thủ trong trận */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full my-2">
              {matchedRoom.players.map((p, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-[#141a27] border border-cyan-500/40 flex flex-col items-center text-center shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                >
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-10 h-10 rounded-full bg-slate-800 border border-cyan-400/50 mb-1.5 p-0.5"
                    onError={(e) => {
                      e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${p.name}`;
                    }}
                  />
                  <span className="font-bold text-xs text-white truncate max-w-[90px]">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-cyan-300 font-medium">
                    {p.isBot ? '🤖 Bot AI' : `${p.elo || 1000} ELO`}
                  </span>
                </div>
              ))}
            </div>

            {/* Countdown Badge */}
            <div className="mt-5 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border-2 border-primary-container text-primary-container font-headline font-black text-xl flex items-center justify-center animate-bounce shadow-[0_0_20px_rgba(0,210,255,0.5)]">
                {countdown}
              </div>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-2">
                Trận đấu sẽ bắt đầu sau {countdown}s...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
