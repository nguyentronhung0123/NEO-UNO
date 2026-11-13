import React, { useState, useEffect, useCallback, useRef } from 'react';
import { guildApi } from '../apis/guildApi';
import { soundEngine } from '../utils/audioFx';

const EMBLEM_OPTIONS = ['🛡️', '⚡', '👑', '🐉', '🔥', '💀', '⚔️', '🦅', '🐺', '🚀'];

export default function GuildModal({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) {
  const [activeTab, setActiveTab] = useState('my_guild'); // 'my_guild' | 'browse' | 'chat' | 'leaderboard' | 'create'
  const [myGuild, setMyGuild] = useState(null);
  const [guildsList, setGuildsList] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Form tạo bang
  const [createForm, setCreateForm] = useState({
    name: '',
    tag: '',
    slogan: '',
    emblem: '🛡️',
  });

  // Chat message input
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef(null);

  // Tải thông tin Bang của tôi
  const fetchMyGuild = useCallback(async () => {
    try {
      const res = await guildApi.getMyGuild(user?._id || user?.id);
      if (res && res.success) {
        setMyGuild(res.guild);
      }
    } catch (err) {
      console.warn('Lỗi tải Bang của tôi:', err);
    }
  }, [user]);

  // Tải danh sách bang công khai
  const fetchGuildsList = useCallback(async (search = '') => {
    try {
      const res = await guildApi.getGuilds(search);
      if (res && res.success) {
        setGuildsList(res.guilds || []);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách bang:', err);
    }
  }, []);

  // Tải Bảng Xếp Hạng Bang
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await guildApi.getLeaderboard();
      if (res && res.success) {
        setLeaderboard(res.leaderboard || []);
      }
    } catch (err) {
      console.warn('Lỗi tải bảng xếp hạng bang:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([fetchMyGuild(), fetchGuildsList(), fetchLeaderboard()]).finally(() => {
        setLoading(false);
      });
      setToastMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, fetchMyGuild, fetchGuildsList, fetchLeaderboard]);

  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, myGuild?.chatMessages]);

  // Tạo Bang Hội mới
  const handleCreateGuild = async (e) => {
    e.preventDefault();
    if (actionLoading) return;
    setActionLoading(true);
    setErrorMessage(null);

    const userCoins = user?.coins || 0;
    if (userCoins < 2000) {
      setErrorMessage('Bạn không đủ Vàng để lập Bang (Cần 2,000 Vàng)!');
      try {
        soundEngine?.playEmergencyBeep?.();
      } catch {}
      setActionLoading(false);
      return;
    }

    try {
      const res = await guildApi.createGuild({
        ...createForm,
        userId: user?._id || user?.id,
      });

      if (res && res.success) {
        setToastMessage(res.message);
        try {
          soundEngine?.playVictory?.();
          soundEngine?.playCoinBuy?.();
        } catch {}

        await fetchMyGuild();
        await fetchGuildsList();
        setActiveTab('my_guild');

        if (res.user && onUpdateUser) {
          onUpdateUser(res.user);
        }
      } else {
        setErrorMessage(res?.message || 'Không thể tạo Bang Hội.');
        try {
          soundEngine?.playEmergencyBeep?.();
        } catch {}
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi mạng khi tạo bang.');
    } finally {
      setActionLoading(false);
    }
  };

  // Gia nhập Bang Hội
  const handleJoinGuild = async (guildId) => {
    if (actionLoading) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await guildApi.joinGuild(guildId, user?._id || user?.id);
      if (res && res.success) {
        setToastMessage(res.message);
        try {
          soundEngine?.playVictory?.();
        } catch {}

        await fetchMyGuild();
        await fetchGuildsList();
        setActiveTab('my_guild');

        if (res.user && onUpdateUser) {
          onUpdateUser(res.user);
        }
      } else {
        setErrorMessage(res?.message || 'Không thể gia nhập Bang Hội.');
        try {
          soundEngine?.playEmergencyBeep?.();
        } catch {}
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi mạng khi gia nhập bang.');
    } finally {
      setActionLoading(false);
    }
  };

  // Rời Bang Hội
  const handleLeaveGuild = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn rời khỏi Bang Hội này?')) return;
    if (actionLoading) return;
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await guildApi.leaveGuild(user?._id || user?.id);
      if (res && res.success) {
        setToastMessage(res.message);
        setMyGuild(null);
        await fetchGuildsList();
        setActiveTab('browse');

        if (res.user && onUpdateUser) {
          onUpdateUser(res.user);
        }
      } else {
        setErrorMessage(res?.message || 'Không thể rời bang.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi mạng khi rời bang.');
    } finally {
      setActionLoading(false);
    }
  };

  // Cống hiến quỹ bang
  const handleDonate = async (amount) => {
    if (actionLoading) return;
    const currentCoins = user?.coins || 0;
    if (currentCoins < amount) {
      setErrorMessage(`Bạn không đủ ${amount.toLocaleString()} Vàng để cống hiến!`);
      try {
        soundEngine?.playEmergencyBeep?.();
      } catch {}
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await guildApi.donate(amount, user?._id || user?.id);
      if (res && res.success) {
        setToastMessage(res.message);
        try {
          soundEngine?.playCoinBuy?.();
          if (res.leveledUp) {
            soundEngine?.playVictory?.();
            soundEngine?.playFirework?.();
          }
        } catch {}

        await fetchMyGuild();
        if (res.user && onUpdateUser) {
          onUpdateUser(res.user);
        }
      } else {
        setErrorMessage(res?.message || 'Không thể cống hiến.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi mạng khi cống hiến.');
    } finally {
      setActionLoading(false);
    }
  };

  // Gửi tin nhắn chat bang
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || actionLoading) return;

    const msgToSend = chatInput.trim();
    setChatInput('');
    try {
      const res = await guildApi.sendChatMessage(msgToSend, user?._id || user?.id);
      if (res && res.success) {
        setMyGuild((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            chatMessages: [...(prev.chatMessages || []), res.chatMessage],
          };
        });
      } else {
        setErrorMessage(res?.message || 'Không thể gửi tin nhắn.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi mạng gửi chat.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-[#131b30] via-[#0b101f] to-[#070b14] border-2 border-cyan-500/40 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col text-white max-h-[92vh]">
        
        {/* Glow hiệu ứng Neon */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-44 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 px-5 sm:px-8 py-3.5 flex items-center justify-between border-b border-white/10 bg-black/30">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">🛡️</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline font-black text-base sm:text-lg tracking-wide uppercase bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                  QUÂN ĐOÀN CYBERPUNK (GUILDS)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                  CLAN WAR
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Thành lập bang hội, nhận Buff +10% Vàng & Exp, tranh bá Top 10 thế giới
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

        {/* Tab Navigation */}
        <div className="relative z-10 px-4 sm:px-8 bg-black/40 border-b border-white/10 flex items-center gap-2 overflow-x-auto py-2">
          {myGuild && (
            <button
              onClick={() => setActiveTab('my_guild')}
              className={`px-3.5 py-1.5 rounded-xl font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'my_guild'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <span>{myGuild.emblem}</span>
              <span>[{myGuild.tag}] Của Tôi</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3.5 py-1.5 rounded-xl font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'browse'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <span>🔍</span>
            <span>Danh Sách Bang</span>
          </button>

          {myGuild && (
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3.5 py-1.5 rounded-xl font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <span>💬</span>
              <span>Kênh Chat Bang</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3.5 py-1.5 rounded-xl font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <span>🏆</span>
            <span>Bảng Xếp Hạng</span>
          </button>

          {!myGuild && (
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3.5 py-1.5 rounded-xl font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ml-auto ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                  : 'bg-amber-500/20 border border-amber-400/40 text-amber-300 hover:bg-amber-500/30'
              }`}
            >
              <span>⚡</span>
              <span>Tạo Bang (2,000 🪙)</span>
            </button>
          )}
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

        {/* NỘI DUNG TỪNG TAB */}
        <div className="relative z-10 p-4 sm:p-6 flex-1 overflow-y-auto">
          
          {/* TAB 1: BANG HỘI CỦA TÔI */}
          {activeTab === 'my_guild' && myGuild && (
            <div className="flex flex-col gap-5">
              {/* Card Tổng quan Bang */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-sky-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(6,182,212,0.5)] shrink-0">
                    {myGuild.emblem}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-amber-400 text-lg">
                        [{myGuild.tag}]
                      </span>
                      <h3 className="font-headline font-black text-lg text-white">
                        {myGuild.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-lg bg-cyan-400 text-slate-950 text-[10px] font-black uppercase">
                        CẤP {myGuild.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 italic">
                      "{myGuild.slogan}"
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                      <span>👥 {myGuild.members?.length || 0} / {myGuild.maxMembers} thành viên</span>
                      <span>🪙 Quỹ Bang: <strong className="text-amber-300 font-mono">{(myGuild.treasuryCoins || 0).toLocaleString()}</strong></span>
                      <span>Chức vụ của bạn: <strong className="text-cyan-300 font-bold uppercase">{myGuild.myRole}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Đặc Quyền Bang Hội */}
                <div className="shrink-0 p-3 rounded-2xl bg-black/40 border border-cyan-400/30 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                    ⚡ ĐẶC QUYỀN BANG
                  </span>
                  <span className="text-xs font-black text-amber-300 mt-0.5">
                    +10% Vàng & EXP Mọi Trận
                  </span>
                </div>
              </div>

              {/* Khu vực Cống Hiến Quỹ Bang */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>🪙 Cống Hiến Quỹ Bang</span>
                    <span className="text-slate-400 font-normal text-[11px]">
                      (Tăng EXP Bang & Nhận Điểm Cống Hiến)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Số dư của bạn: <strong className="text-amber-400 font-mono">{(user?.coins || 0).toLocaleString()} 🪙</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {[200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleDonate(amt)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-mono font-bold text-xs uppercase transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      +{amt} 🪙
                    </button>
                  ))}
                  <button
                    onClick={handleLeaveGuild}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-300 font-bold text-xs uppercase transition-all cursor-pointer ml-2"
                  >
                    Rời Bang
                  </button>
                </div>
              </div>

              {/* Danh sách thành viên Bang */}
              <div>
                <h4 className="font-headline font-bold text-xs uppercase text-slate-400 tracking-wider mb-2">
                  Danh Sách Đấu Thủ Trong Bang ({myGuild.members?.length || 0})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(myGuild.members || []).map((m) => (
                    <div
                      key={m.userId}
                      className="p-3 rounded-2xl bg-slate-900/40 border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg">
                          👤
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-white">
                              {m.nickname}
                            </span>
                            {m.role === 'leader' && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[9px]">
                                BANG CHỦ
                              </span>
                            )}
                            {m.role === 'officer' && (
                              <span className="px-1.5 py-0.2 rounded bg-cyan-400 text-slate-950 font-black text-[9px]">
                                PHÓ BANG
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Elo: {m.elo} • Cống hiến: {m.contributionPoints}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DANH SÁCH BANG ĐỂ GIA NHẬP */}
          {activeTab === 'browse' && (
            <div className="flex flex-col gap-4">
              {/* Thanh tìm kiếm */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    fetchGuildsList(e.target.value);
                  }}
                  placeholder="Tìm kiếm theo Tên hoặc Tag Bang (VD: CYBER)..."
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Lưới Bang Hội */}
              {guildsList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Chưa có Bang Hội nào phù hợp với từ khóa tìm kiếm.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {guildsList.map((g) => {
                    const isFull = g.memberCount >= g.maxMembers;
                    const isMyOwn = myGuild && myGuild.id === g.id;

                    return (
                      <div
                        key={g.id}
                        className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 flex items-center justify-between gap-3 hover:border-cyan-400/40 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center text-2xl shrink-0">
                            {g.emblem}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-amber-400 text-xs">
                                [{g.tag}]
                              </span>
                              <span className="font-bold text-sm text-white">
                                {g.name}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 font-bold text-[9px]">
                                Lv.{g.level}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-1 italic mt-0.5">
                              "{g.slogan}"
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Thành viên: {g.memberCount}/{g.maxMembers}
                            </div>
                          </div>
                        </div>

                        <div>
                          {isMyOwn ? (
                            <span className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-xs">
                              Bang của bạn
                            </span>
                          ) : (
                            <button
                              onClick={() => handleJoinGuild(g.id)}
                              disabled={actionLoading || isFull}
                              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase transition-all cursor-pointer ${
                                isFull
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md'
                              }`}
                            >
                              {isFull ? 'Đầy' : 'Gia Nhập'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: KÊNH CHAT BANG HỘI */}
          {activeTab === 'chat' && myGuild && (
            <div className="flex flex-col h-[55vh]">
              {/* Khung tin nhắn */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-black/40 rounded-2xl border border-white/5">
                {(myGuild.chatMessages || []).length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên đến anh em trong Bang!
                  </div>
                ) : (
                  (myGuild.chatMessages || []).map((msg, i) => {
                    const isSystem = msg.senderRole === 'system';
                    const isMe = msg.senderId === (user?._id || user?.id);

                    if (isSystem) {
                      return (
                        <div key={i} className="text-center text-[11px] text-cyan-300/80 italic py-1">
                          📢 {msg.message}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={i}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                          <span>{msg.senderName}</span>
                          {msg.senderRole === 'leader' && (
                            <span className="text-amber-400 font-black">👑 Bang Chủ</span>
                          )}
                        </div>
                        <div
                          className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs ${
                            isMe
                              ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-none'
                              : 'bg-slate-800 text-white rounded-tl-none border border-white/5'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Khung nhập tin nhắn */}
              <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Nhập tin nhắn bang hội..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase cursor-pointer"
                >
                  Gửi
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: BẢNG XẾP HẠNG TOP 10 BANG */}
          {activeTab === 'leaderboard' && (
            <div className="flex flex-col gap-3">
              <div className="text-xs text-slate-400 mb-1">
                Điểm Sức Mạnh = Tổng Elo + (Cấp Bang × 500) + (Cống Hiến × 0.1)
              </div>
              <div className="space-y-2">
                {leaderboard.map((item, index) => {
                  const rank = index + 1;
                  const isTop1 = rank === 1;
                  const isTop2 = rank === 2;
                  const isTop3 = rank === 3;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                        isTop1
                          ? 'bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                          : isTop2
                          ? 'bg-gradient-to-r from-slate-400/20 via-slate-900 to-slate-900 border-slate-300'
                          : isTop3
                          ? 'bg-gradient-to-r from-amber-700/20 via-slate-900 to-slate-900 border-amber-700'
                          : 'bg-slate-900/40 border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-black font-mono text-xs ${
                            isTop1
                              ? 'bg-amber-400 text-slate-950 shadow-md'
                              : isTop2
                              ? 'bg-slate-300 text-slate-950'
                              : isTop3
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {rank}
                        </div>

                        <div className="text-2xl">{item.emblem}</div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-amber-300 text-xs">
                              [{item.tag}]
                            </span>
                            <span className="font-bold text-sm text-white">
                              {item.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 font-bold text-[9px]">
                              CẤP {item.level}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {item.memberCount} Thành viên • Tổng Elo: {item.totalElo}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-black text-cyan-300 text-sm">
                          {item.powerScore.toLocaleString()}
                        </div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-500">
                          Sức mạnh
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: FORM THÀNH LẬP BANG */}
          {activeTab === 'create' && !myGuild && (
            <form onSubmit={handleCreateGuild} className="max-w-lg mx-auto flex flex-col gap-4">
              <div className="text-center mb-2">
                <h3 className="font-headline font-black text-lg text-white">
                  Thành Lập Bang Hội Mới
                </h3>
                <p className="text-xs text-slate-400">
                  Phí thành lập: <strong className="text-amber-400 font-mono">2,000 Vàng</strong> (Bạn đang có: {(user?.coins || 0).toLocaleString()} 🪙)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tên Bang Hội (3 - 30 ký tự):
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="VD: Cyber Warriors 2026"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tag Viết Tắt (2 - 6 ký tự viết hoa):
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={createForm.tag}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      tag: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                    })
                  }
                  placeholder="VD: CYBER"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs uppercase tracking-wider focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Huy Hiệu Bang Hội:
                </label>
                <div className="flex gap-2 flex-wrap">
                  {EMBLEM_OPTIONS.map((emb) => (
                    <button
                      type="button"
                      key={emb}
                      onClick={() => setCreateForm({ ...createForm, emblem: emb })}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-all cursor-pointer ${
                        createForm.emblem === emb
                          ? 'bg-cyan-500/20 border-cyan-400 scale-110 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                          : 'bg-black/30 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {emb}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Châm Ngôn Hoạt Động (Slogan):
                </label>
                <textarea
                  value={createForm.slogan}
                  onChange={(e) => setCreateForm({ ...createForm, slogan: e.target.value })}
                  placeholder="Viết câu khẩu hiệu cổ vũ anh em..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-headline font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all cursor-pointer mt-2"
              >
                XÁC NHẬN THÀNH LẬP BANG (2,000 🪙)
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="relative z-10 px-6 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] text-slate-400">
          <span>Thành viên trong Bang nhận Buff +10% Vàng & EXP</span>
          <span className="text-cyan-400 font-semibold">Bảo mật thời gian thực</span>
        </div>
      </div>
    </div>
  );
}
