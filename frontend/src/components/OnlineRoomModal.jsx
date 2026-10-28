import React, { useState, useEffect } from 'react';
import { getSocket } from '../services/socket';
import { getRankTier } from './LeaderboardModal';

export default function OnlineRoomModal({
  isOpen,
  onClose,
  user,
  onStartOnlineMatch,
  targetRoomCode = null,
  onClearTargetRoomCode = null,
  onOpenFriends = null,
}) {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Tên hiển thị của người chơi
  const [playerName, setPlayerName] = useState(() => {
    return (
      user?.nickname ||
      user?.name ||
      localStorage.getItem('neo_player_name') ||
      ''
    );
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const socket = getSocket();

  // Đăng ký các sự kiện Socket khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    const handleRoomUpdated = (room) => {
      setCurrentRoom(room);
      setErrorMsg('');
    };

    const handleGameStarted = (room) => {
      console.log('[Socket] Trận đấu phòng bắt đầu:', room.code);
      if (onStartOnlineMatch) {
        onStartOnlineMatch(room);
      }
    };

    const handlePlayerLeft = ({ playerName }) => {
      setErrorMsg(`Người chơi "${playerName}" đã rời khỏi phòng.`);
      setTimeout(() => setErrorMsg(''), 4000);
    };

    socket.on('room:updated', handleRoomUpdated);
    socket.on('room:game_started', handleGameStarted);
    socket.on('room:player_left', handlePlayerLeft);

    return () => {
      socket.off('room:updated', handleRoomUpdated);
      socket.off('room:game_started', handleGameStarted);
      socket.off('room:player_left', handlePlayerLeft);
    };
  }, [isOpen, socket, onStartOnlineMatch]);

  // Kiểm tra nếu URL có sẵn tham số ?room=XXXXXX thì tự động điền mã
  useEffect(() => {
    if (isOpen) {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam && !currentRoom) {
        setInputCode(roomParam.toUpperCase());
      }
    }
  }, [isOpen, currentRoom]);

  if (!isOpen) return null;

  // Lấy dữ liệu user kèm tên hiển thị chính xác
  const getPreparedUser = () => {
    let localUserId = localStorage.getItem('neo_user_id');
    if (!localUserId) {
      localUserId = 'guest_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('neo_user_id', localUserId);
    }
    const chosenName =
      (playerName || '').trim() ||
      user?.nickname ||
      user?.name ||
      'Người chơi ' + Math.floor(100 + Math.random() * 900);
    localStorage.setItem('neo_player_name', chosenName);
    return {
      ...user,
      id: user?.id || user?._id || localUserId,
      userId: user?.id || user?._id || localUserId,
      nickname: chosenName,
      name: chosenName,
    };
  };

  // 1. TẠO PHÒNG
  const handleCreateRoom = () => {
    setIsLoading(true);
    setErrorMsg('');
    const preparedUser = getPreparedUser();
    socket.emit('room:create', { user: preparedUser }, (res) => {
      setIsLoading(false);
      if (res?.success) {
        setCurrentRoom(res.room);
      } else {
        setErrorMsg(res?.message || 'Không thể tạo phòng lúc này!');
      }
    });
  };

  // 2. VÀO PHÒNG BẰNG MÃ
  const handleJoinRoom = (codeOrEvent) => {
    let cleanCode = '';
    if (typeof codeOrEvent === 'string') {
      cleanCode = codeOrEvent.trim().toUpperCase();
    } else {
      if (codeOrEvent && codeOrEvent.preventDefault) codeOrEvent.preventDefault();
      cleanCode = inputCode.trim().toUpperCase();
    }

    if (!cleanCode || cleanCode.length < 4) {
      setErrorMsg('Vui lòng nhập đúng mã phòng (ít nhất 4-6 ký tự)!');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    const preparedUser = getPreparedUser();
    socket.emit('room:join', { code: cleanCode, user: preparedUser }, (res) => {
      setIsLoading(false);
      if (res?.success) {
        setCurrentRoom(res.room);
      } else {
        setErrorMsg(res?.message || 'Mã phòng không chính xác hoặc phòng đã đầy!');
      }
    });
  };

  // Tự động vào phòng khi có targetRoomCode từ lời mời bạn bè
  useEffect(() => {
    if (isOpen && targetRoomCode) {
      handleJoinRoom(targetRoomCode);
      if (onClearTargetRoomCode) onClearTargetRoomCode();
    }
  }, [isOpen, targetRoomCode]);

  // Đổi tên trực tiếp khi đã ở trong phòng
  const handleUpdateMyName = (newName) => {
    const trimmed = (newName || '').trim();
    if (!trimmed || !currentRoom) return;
    setPlayerName(trimmed);
    localStorage.setItem('neo_player_name', trimmed);
    socket.emit('room:update_name', { code: currentRoom.code, newName: trimmed });
    setIsEditingName(false);
  };

  // 3. ĐỔI TRẠNG THÁI SẴN SÀNG
  const handleToggleReady = () => {
    if (!currentRoom) return;
    socket.emit('room:toggle_ready', { code: currentRoom.code }, (res) => {
      if (!res?.success) {
        setErrorMsg(res?.message || 'Thao tác thất bại!');
      }
    });
  };

  // 4. THÊM BOT
  const handleAddBot = () => {
    if (!currentRoom) return;
    socket.emit('room:add_bot', { code: currentRoom.code }, (res) => {
      if (!res?.success) {
        setErrorMsg(res?.message || 'Không thể thêm bot!');
      }
    });
  };

  // 5. XÓA BOT
  const handleRemoveBot = (botId) => {
    if (!currentRoom) return;
    socket.emit('room:remove_bot', { code: currentRoom.code, botId }, (res) => {
      if (!res?.success) {
        setErrorMsg(res?.message || 'Không thể xóa bot!');
      }
    });
  };

  // 6. BẮT ĐẦU TRẬN ĐẤU
  const handleStartGame = () => {
    if (!currentRoom) return;
    socket.emit('room:start_game', { code: currentRoom.code }, (res) => {
      if (!res?.success) {
        setErrorMsg(res?.message || 'Chưa thể bắt đầu trận đấu!');
      }
    });
  };

  // 7. RỜI PHÒNG
  const handleLeaveRoom = () => {
    socket.emit('room:leave', () => {
      setCurrentRoom(null);
      setErrorMsg('');
    });
  };

  // 8. SAO CHÉP MÃ PHÒNG / LINK
  const handleCopyLink = () => {
    if (!currentRoom) return;
    const inviteLink = `${window.location.origin}?room=${currentRoom.code}`;
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleCopyCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Xác định vai trò của người chơi hiện tại
  const myPlayer = currentRoom?.players.find(
    (p) => p.socketId === socket.id || p.userId === (user?.id || user?._id)
  );
  const isHost = myPlayer?.isHost;
  const canStartGame =
    isHost &&
    currentRoom?.players.length >= 2 &&
    currentRoom?.players.every((p) => p.isReady);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in font-body selection:bg-primary-container selection:text-black">
      <div className="relative w-full max-w-2xl bg-[#0f1422] border border-cyan-500/30 rounded-3xl p-5 sm:p-7 shadow-[0_0_80px_rgba(0,210,255,0.25)] flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Nút đóng modal */}
        <button
          type="button"
          onClick={() => {
            if (currentRoom) {
              handleLeaveRoom();
            }
            onClose();
          }}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer z-10"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* ================= GIAO DIỆN CHƯA VÀO PHÒNG (TẠO HOẶC NHẬP MÃ) ================= */}
        {!currentRoom ? (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-black tracking-wider uppercase mb-2">
                <span className="material-symbols-outlined text-sm text-purple-400">sports_esports</span>
                <span>PHÒNG GIAO HỮU BẠN BÈ • KHÔNG TÍNH RANK ELO</span>
              </div>
              <h2 className="font-headline font-black text-2xl sm:text-3xl text-white tracking-wide uppercase">
                PHÒNG ĐẤU VỚI BẠN BÈ
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Tạo phòng riêng hoặc nhập mã để so tài cùng bạn bè. <strong className="text-purple-300">Lưu ý:</strong> Chế độ chơi với bạn là <strong>giao hữu giải trí, không cộng hay trừ điểm Rank ELO</strong>!
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs text-center font-medium animate-shake flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Ô NHẬP TÊN HIỂN THỊ CỦA NGƯỜI CHƠI */}
            <div className="mb-5 p-3.5 rounded-2xl bg-surface-container-high/60 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_20px_rgba(0,210,255,0.1)]">
              <div className="flex items-center gap-3 text-left w-full sm:w-auto">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-black text-sm shrink-0">
                  <span className="material-symbols-outlined text-xl">badge</span>
                </div>
                <div>
                  <span className="text-[11px] text-white font-bold uppercase tracking-wider block">
                    Tên của bạn trong phòng:
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Tên này sẽ hiển thị trên ghế ngồi để bạn bè nhận diện
                  </span>
                </div>
              </div>
              <input
                type="text"
                maxLength={16}
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  localStorage.setItem('neo_player_name', e.target.value);
                }}
                placeholder="Nhập tên của bạn (VD: Hải Đăng, Tuấn Pro...)"
                className="w-full sm:w-64 px-4 py-2.5 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 font-headline font-bold text-sm text-center sm:text-left focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,210,255,0.3)] transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CỘT 1: TẠO PHÒNG MỚI */}
              <div className="p-5 rounded-2xl bg-surface-container-high/40 border border-white/10 flex flex-col justify-between hover:border-cyan-500/40 transition-all">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-2xl">add_circle</span>
                  </div>
                  <h3 className="font-headline font-black text-base text-white uppercase tracking-wider mb-1">
                    TẠO PHÒNG MỚI
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Trở thành chủ phòng, nhận mã phòng riêng và toàn quyền mời bạn bè hoặc thêm Bot lấp đầy bàn đấu.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary-container to-cyan-400 text-black font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,210,255,0.35)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">rocket_launch</span>
                  <span>{isLoading ? 'ĐANG TẠO PHÒNG...' : 'TẠO PHÒNG NGAY'}</span>
                </button>
              </div>

              {/* CỘT 2: NHẬP MÃ PHÒNG */}
              <div className="p-5 rounded-2xl bg-surface-container-high/40 border border-white/10 flex flex-col justify-between hover:border-amber-500/40 transition-all">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-2xl">login</span>
                  </div>
                  <h3 className="font-headline font-black text-base text-white uppercase tracking-wider mb-1">
                    VÀO PHÒNG BẰNG MÃ
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Nhập mã phòng 6 ký tự mà bạn bè đã gửi cho bạn:
                  </p>

                  <input
                    type="text"
                    maxLength={8}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="VD: 8K2M9P"
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-center font-mono font-black text-lg tracking-widest text-amber-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 uppercase mb-4"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleJoinRoom}
                  disabled={isLoading || !inputCode.trim()}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">login</span>
                  <span>{isLoading ? 'ĐANG VÀO...' : 'THAM GIA PHÒNG'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ================= GIAO DIỆN PHÒNG CHỜ (WAITING ROOM) ================= */
          <div>
            {/* Banner Giao Hữu Không Tính Rank */}
            <div className="mb-4 px-3.5 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-between text-xs text-purple-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-purple-400">shield</span>
                <span><strong>Chế độ Giao Hữu:</strong> Ván đấu vui vẻ cùng bạn bè, <strong>KHÔNG</strong> tính điểm Rank ELO.</span>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-400/40">
                GIAO HỮU
              </span>
            </div>

            {/* Header Phòng Chờ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 mb-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  MÃ PHÒNG ĐẤU BẠN BÈ
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-black text-2xl text-cyan-300 tracking-widest">
                    {currentRoom.code}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    title="Sao chép mã phòng"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">
                      {isCopied ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {onOpenFriends && (
                  <button
                    type="button"
                    onClick={() => onOpenFriends(currentRoom.code)}
                    className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-300 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    title="Mời bạn bè trong danh sách vào phòng này"
                  >
                    <span className="material-symbols-outlined text-base">group</span>
                    <span>MỜI BẠN BÈ</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">share</span>
                  <span>{isCopied ? 'ĐÃ COPY LINK!' : 'COPY LINK MỜI'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>RỜI PHÒNG</span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs text-center font-medium flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-base">info</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* DANH SÁCH 4 GHẾ NGỒI TRONG BÀN */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  THÀNH VIÊN TRONG PHÒNG ({currentRoom.players.length}/4)
                </span>
                {isHost && currentRoom.players.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddBot}
                    className="text-xs text-primary-container hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">smart_toy</span>
                    <span>+ Thêm Bot vào ghế trống</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((seatIndex) => {
                  const player = currentRoom.players[seatIndex];

                  if (player) {
                    const isMe =
                      player.socketId === socket.id ||
                      player.userId === (user?.id || user?._id);
                    const tier = getRankTier(player.elo || 1000);

                    return (
                      <div
                        key={player.userId || seatIndex}
                        className={`relative p-3.5 rounded-2xl border flex flex-col items-center text-center transition-all ${
                          isMe
                            ? 'bg-cyan-950/30 border-cyan-400 shadow-[0_0_20px_rgba(0,210,255,0.2)]'
                            : 'bg-surface-container-high/40 border-white/10'
                        }`}
                      >
                        {/* Huy hiệu Chủ phòng */}
                        {player.isHost && (
                          <div className="absolute -top-2.5 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                            <span className="material-symbols-outlined text-[10px]">stars</span>
                            <span>CHỦ PHÒNG</span>
                          </div>
                        )}

                        {/* Nút xóa Bot nếu là Host */}
                        {isHost && player.isBot && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBot(player.userId)}
                            title="Xóa Bot này"
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white flex items-center justify-center text-xs transition-all cursor-pointer"
                          >
                            ✕
                          </button>
                        )}

                        {/* Avatar */}
                        <div className={`w-14 h-14 rounded-full mt-1.5 mb-2 flex items-center justify-center font-headline font-black text-base border-2 shadow-sm ${
                          player.isBot
                            ? 'bg-purple-950/60 border-purple-400 text-purple-300'
                            : player.isReady
                            ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300'
                            : 'bg-slate-800 border-slate-600 text-slate-300'
                        }`}>
                          {player.isBot ? (
                            <span className="material-symbols-outlined text-2xl">smart_toy</span>
                          ) : (
                            (player.name || 'P').substring(0, 2).toUpperCase()
                          )}
                        </div>

                        {/* Tên Người Chơi (Có thể sửa trực tiếp nếu là mình) */}
                        {isMe && !player.isBot ? (
                          isEditingName ? (
                            <div className="flex items-center gap-1 w-full px-1 justify-center my-0.5">
                              <input
                                type="text"
                                maxLength={16}
                                value={tempName}
                                autoFocus
                                onChange={(e) => setTempName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateMyName(tempName);
                                  if (e.key === 'Escape') setIsEditingName(false);
                                }}
                                className="w-24 px-1.5 py-0.5 rounded bg-black/80 border border-cyan-400 text-[11px] text-cyan-200 font-bold focus:outline-none text-center"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateMyName(tempName)}
                                className="px-1.5 py-0.5 rounded bg-cyan-400 hover:bg-cyan-300 text-black text-[10px] font-black cursor-pointer"
                              >
                                ✓
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setTempName(player.name);
                                setIsEditingName(true);
                              }}
                              className="font-headline font-black text-xs text-cyan-300 truncate w-full px-1 flex items-center justify-center gap-1 cursor-pointer hover:text-white transition-colors group"
                              title="Bấm để đổi tên của bạn"
                            >
                              <span className="truncate">{player.name} (Bạn)</span>
                              <span className="material-symbols-outlined text-[12px] text-slate-400 group-hover:text-cyan-300">
                                edit
                              </span>
                            </div>
                          )
                        ) : (
                          <div className="font-headline font-black text-xs text-white truncate w-full px-1">
                            {player.name}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {player.isBot ? 'Bot AI' : `${player.elo || 1000} ELO • ${tier.name}`}
                        </div>

                        {/* Trạng thái Sẵn Sàng */}
                        <div className="mt-2.5">
                          {player.isHost ? (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold">
                              Chủ Bàn
                            </span>
                          ) : player.isReady ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">check_circle</span>
                              <span>Sẵn Sàng</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">hourglass_empty</span>
                              <span>Chưa Sẵn Sàng</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Ghế trống
                  return (
                    <div
                      key={seatIndex}
                      className="p-3.5 rounded-2xl border border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center text-center min-h-[170px]"
                    >
                      <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center text-slate-600 mb-2">
                        <span className="material-symbols-outlined text-xl">person_add</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-semibold mb-2">
                        Ghế {seatIndex + 1} Trống
                      </span>

                      {isHost ? (
                        <button
                          type="button"
                          onClick={handleAddBot}
                          className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-[10px] text-cyan-300 font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">add</span>
                          <span>Thêm Bot</span>
                        </button>
                      ) : (
                        <span className="text-[9px] text-slate-600 italic">Đang chờ bạn bè...</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="p-4 rounded-2xl bg-surface-container-high/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                {isHost ? (
                  canStartGame ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      Tất cả thành viên đã sẵn sàng! Bạn có thể bắt đầu trận.
                    </span>
                  ) : currentRoom.players.length < 2 ? (
                    <span className="text-amber-400 font-medium">
                      ⚠️ Cần thêm ít nhất 1 người chơi hoặc 1 Bot để bắt đầu.
                    </span>
                  ) : (
                    <span className="text-amber-400 font-medium">
                      ⏳ Đang chờ các thành viên khác bấm "Sẵn Sàng"...
                    </span>
                  )
                ) : (
                  <span>
                    Trạng thái của bạn:{' '}
                    {myPlayer?.isReady ? (
                      <strong className="text-emerald-400">ĐÃ SẴN SÀNG</strong>
                    ) : (
                      <strong className="text-amber-400">CHƯA SẴN SÀNG</strong>
                    )}
                  </span>
                )}
              </div>

              <div className="w-full sm:w-auto flex items-center gap-2">
                {!isHost ? (
                  <button
                    type="button"
                    onClick={handleToggleReady}
                    className={`w-full sm:w-auto px-6 py-3 rounded-full font-headline font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                      myPlayer?.isReady
                        ? 'bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {myPlayer?.isReady ? 'cancel' : 'check'}
                    </span>
                    <span>{myPlayer?.isReady ? 'HỦY SẴN SÀNG' : 'SẴN SÀNG!'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartGame}
                    disabled={!canStartGame}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-primary-container to-cyan-400 text-black font-headline font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(0,210,255,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-lg">play_arrow</span>
                    <span>BẮT ĐẦU TRẬN ĐẤU</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
