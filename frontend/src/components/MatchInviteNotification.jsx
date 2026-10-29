import React, { useState, useEffect } from 'react';

export default function MatchInviteNotification({ invite, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (!invite) return;
    setTimeLeft(15);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [invite]);

  // Khi hết 15s tự động từ chối
  useEffect(() => {
    if (timeLeft === 0 && invite && onDecline) {
      onDecline(invite);
    }
  }, [timeLeft, invite, onDecline]);

  if (!invite) return null;

  const { fromUser, roomCode, roomMode } = invite;
  const fromNickname = fromUser?.nickname || fromUser?.name || 'Bạn bè';
  const displayRoomCode = roomCode || '---';
  const avatarLetter = String(fromNickname).charAt(0).toUpperCase() || 'U';

  const modeLabel =
    roomMode === 'SOLO_1V1'
      ? 'Solo 1v1'
      : roomMode === '3_PLAYERS'
      ? 'Tam Đấu (3P)'
      : 'Tứ Hùng (4P)';

  return (
    <div className="fixed top-5 right-5 z-[100] max-w-sm w-full animate-bounce-in font-body">
      <div className="relative bg-[#101524] border-2 border-cyan-400 rounded-2xl p-4 shadow-[0_0_40px_rgba(0,210,255,0.4)] backdrop-blur-xl overflow-hidden flex flex-col gap-3">
        {/* Progress Bar đếm ngược 15s */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-1000"
            style={{ width: `${(timeLeft / 15) * 100}%` }}
          />
        </div>

        {/* Nội dung lời mời */}
        <div className="flex items-center gap-3 pt-1">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-800 border border-white/20 flex items-center justify-center text-white font-headline font-black text-base shadow-md">
              {avatarLetter}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#101524] animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                LỜI MỜI THI ĐẤU
              </span>
              <span className="text-[11px] font-mono text-slate-400">{timeLeft}s</span>
            </div>
            <p className="text-white text-xs font-headline font-bold truncate">
              {fromNickname}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              Phòng: <span className="font-mono text-cyan-300 font-bold">{displayRoomCode}</span> • {modeLabel}
            </p>
          </div>
        </div>

        {/* 2 Nút hành động: Chấp nhận & Từ chối */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onAccept && onAccept(invite)}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:brightness-110 text-black font-headline font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">sports_esports</span>
            <span>CHẤP NHẬN</span>
          </button>

          <button
            onClick={() => onDecline && onDecline(invite)}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-white/10 text-xs font-bold transition-colors cursor-pointer"
          >
            Từ Chối
          </button>
        </div>
      </div>
    </div>
  );
}
