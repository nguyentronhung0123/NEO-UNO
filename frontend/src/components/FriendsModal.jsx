import React, { useState, useEffect, useCallback, useRef } from 'react';
import { friendApi } from '../apis/friendApi';
import { getRankTier } from './LeaderboardModal';

export default function FriendsModal({
  isOpen,
  onClose,
  user,
  socket,
  currentRoomCode = null,
  onInviteToRoom = null,
  onCreateAndInvite = null,
  onOpenAuth = null,
  onOpenChat = null,
}) {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'requests' | 'search'
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [friendFilter, setFriendFilter] = useState('');
  const searchTimeoutRef = useRef(null);

  // Hiển thị thông báo nhỏ tự ẩn
  const showToast = (text, type = 'info') => {
    setActionMessage({ text, type, id: Date.now() });
    setTimeout(() => setActionMessage(null), 3500);
  };

  // 1. Tải danh sách bạn bè
  const fetchFriends = useCallback(async () => {
    if (!user || user.role === 'guest') return;
    try {
      const res = await friendApi.getFriends();
      if (res && res.success) {
        setFriends(res.friends || []);
      }
    } catch (err) {
      console.warn('Lỗi tải bạn bè:', err);
    }
  }, [user]);

  // 2. Tải danh sách lời mời kết bạn
  const fetchRequests = useCallback(async () => {
    if (!user || user.role === 'guest') return;
    try {
      const res = await friendApi.getFriendRequests();
      if (res && res.success) {
        setRequests({
          received: res.received || [],
          sent: res.sent || [],
        });
      }
    } catch (err) {
      console.warn('Lỗi tải lời mời:', err);
    }
  }, [user]);

  // Tải dữ liệu ban đầu khi mở modal
  useEffect(() => {
    if (isOpen && user && user.role !== 'guest') {
      setIsLoading(true);
      Promise.all([fetchFriends(), fetchRequests()]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen, user, fetchFriends, fetchRequests]);

  // Lắng nghe sự kiện socket realtime
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleRequestReceived = ({ sender }) => {
      fetchRequests();
      showToast(`📨 ${sender?.nickname || 'Ai đó'} vừa gửi lời mời kết bạn!`, 'info');
    };

    const handleRequestAccepted = ({ accepter }) => {
      fetchFriends();
      fetchRequests();
      showToast(`🎉 ${accepter?.nickname || 'Người chơi'} đã chấp nhận kết bạn!`, 'success');
    };

    const handleStatusChange = ({ userId, status }) => {
      setFriends((prev) =>
        prev.map((f) => {
          if (String(f._id) === String(userId)) {
            return {
              ...f,
              isOnline: status !== 'offline',
              status,
            };
          }
          return f;
        })
      );
    };

    socket.on('friend:request_received', handleRequestReceived);
    socket.on('friend:request_accepted', handleRequestAccepted);
    socket.on('friend:status_change', handleStatusChange);

    return () => {
      socket.off('friend:request_received', handleRequestReceived);
      socket.off('friend:request_accepted', handleRequestAccepted);
      socket.off('friend:status_change', handleStatusChange);
    };
  }, [socket, isOpen, fetchFriends, fetchRequests]);

  // Tìm kiếm người chơi theo từ khóa
  useEffect(() => {
    if (activeTab !== 'search' || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const res = await friendApi.searchUsers(searchQuery);
      setSearchLoading(false);
      if (res && res.success) {
        setSearchResults(res.users || []);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, activeTab]);

  // Xử lý gửi lời mời kết bạn
  const handleSendRequest = async (targetUserId, nickname) => {
    const res = await friendApi.sendFriendRequest({ targetUserId, nickname });
    if (res && res.success) {
      showToast(res.message, 'success');
      // Phát socket thông báo cho đối phương realtime
      if (socket && targetUserId) {
        socket.emit('friend:notify_request', {
          targetUserId,
          sender: {
            id: user?.id || user?._id,
            nickname: user?.nickname || user?.name,
            avatar: user?.avatar,
          },
        });
      }
      fetchRequests();
      // Cập nhật trạng thái trong searchResults
      setSearchResults((prev) =>
        prev.map((u) => (u._id === targetUserId ? { ...u, relationship: 'pending_sent' } : u))
      );
    } else {
      showToast(res?.message || 'Không thể gửi lời mời kết bạn!', 'error');
    }
  };

  // Xử lý phản hồi lời mời kết bạn (Đồng ý / Từ chối)
  const handleRespondRequest = async (requestId, action, requesterUser = null) => {
    const res = await friendApi.respondFriendRequest(requestId, action);
    if (res && res.success) {
      showToast(res.message, action === 'accept' ? 'success' : 'info');
      if (action === 'accept' && socket && requesterUser) {
        socket.emit('friend:notify_accept', {
          targetUserId: requesterUser._id,
          accepter: {
            id: user?.id || user?._id,
            nickname: user?.nickname || user?.name,
            avatar: user?.avatar,
          },
        });
      }
      fetchFriends();
      fetchRequests();
    } else {
      showToast(res?.message || 'Có lỗi xảy ra!', 'error');
    }
  };

  // Xử lý hủy kết bạn
  const handleRemoveFriend = async (friendId, friendName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy kết bạn với ${friendName}?`)) return;
    const res = await friendApi.removeFriend(friendId);
    if (res && res.success) {
      showToast(res.message, 'info');
      fetchFriends();
    } else {
      showToast(res?.message || 'Không thể hủy kết bạn!', 'error');
    }
  };

  // Xử lý mời bạn vào phòng đấu
  const handleInviteFriend = (friend) => {
    if (!friend.isOnline) {
      showToast(`${friend.nickname} hiện đang Offline!`, 'error');
      return;
    }

    if (currentRoomCode) {
      // Đang có phòng sẵn -> Gửi lời mời trực tiếp
      if (socket) {
        socket.emit(
          'invite:send',
          {
            toUserId: friend._id,
            roomCode: currentRoomCode,
            sender: {
              id: user?.id || user?._id,
              nickname: user?.nickname || user?.name,
              avatar: user?.avatar,
            },
          },
          (res) => {
            if (res && res.success) {
              showToast(`Đã gửi lời mời tới ${friend.nickname}!`, 'success');
            } else {
              showToast(res?.message || 'Không thể gửi lời mời!', 'error');
            }
          }
        );
      }
    } else {
      // Chưa có phòng -> Tạo phòng mới và mời
      if (onCreateAndInvite) {
        onCreateAndInvite(friend);
        onClose();
      } else {
        showToast('Vui lòng tạo phòng đấu Online trước khi mời bạn bè!', 'info');
      }
    }
  };

  if (!isOpen) return null;

  const isGuest = !user || user.role === 'guest';
  const pendingReceivedCount = requests.received.length;

  const filteredFriends = friends.filter((f) =>
    (f.nickname || '').toLowerCase().includes(friendFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0d121d] border border-cyan-500/30 rounded-3xl shadow-[0_0_60px_rgba(0,210,255,0.2)] flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121826]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-lg">
              <span className="material-symbols-outlined text-2xl">group</span>
            </div>
            <div>
              <h2 className="text-white font-headline text-lg sm:text-xl font-black uppercase tracking-wide flex items-center gap-2">
                HỆ THỐNG BẠN BÈ & LỜI MỜI
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                  TASK 2
                </span>
              </h2>
              <p className="text-slate-400 text-xs">
                Kết nối chiến hữu, theo dõi trạng thái online và mời đấu trực tiếp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* TOAST THÔNG BÁO NHANH */}
        {actionMessage && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex items-center justify-between animate-fade-in ${
              actionMessage.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30'
                : actionMessage.type === 'error'
                ? 'bg-rose-500/20 text-rose-300 border-b border-rose-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border-b border-cyan-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">
                {actionMessage.type === 'success'
                  ? 'check_circle'
                  : actionMessage.type === 'error'
                  ? 'error'
                  : 'info'}
              </span>
              <span>{actionMessage.text}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* CẢNH BÁO NẾU ĐANG LÀ KHÁCH */}
        {isGuest ? (
          <div className="p-8 flex flex-col items-center justify-center text-center gap-4 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-3xl">
              <span className="material-symbols-outlined text-4xl">lock</span>
            </div>
            <div>
              <h3 className="text-white font-headline text-lg font-bold">
                TÍNH NĂNG DÀNH CHO THÀNH VIÊN
              </h3>
              <p className="text-slate-400 text-xs max-w-sm mt-1">
                Bạn đang chơi ở chế độ Khách (Guest). Vui lòng đăng nhập hoặc tạo tài khoản để kết bạn và mời thi đấu nhé!
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                if (onOpenAuth) onOpenAuth();
              }}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-primary-container to-cyan-400 text-black font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:brightness-110 transition-all cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>ĐĂNG NHẬP NGAY</span>
            </button>
          </div>
        ) : (
          <>
            {/* TABS NAVIGATION */}
            <div className="flex items-center border-b border-white/10 bg-[#101522] px-6">
              <button
                onClick={() => setActiveTab('friends')}
                className={`py-3 px-4 font-headline text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'friends'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base">group</span>
                <span>Bạn Bè</span>
                <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] font-mono">
                  {friends.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                className={`py-3 px-4 font-headline text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer relative ${
                  activeTab === 'requests'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base">mark_email_unread</span>
                <span>Lời Mời</span>
                {pendingReceivedCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold animate-pulse">
                    {pendingReceivedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('search')}
                className={`py-3 px-4 font-headline text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'search'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span>Tìm Bạn Mới</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar min-h-[320px]">
              {/* TAB 1: DANH SÁCH BẠN BÈ */}
              {activeTab === 'friends' && (
                <>
                  {friends.length > 0 && (
                    <div className="relative mb-3">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-base">
                        search
                      </span>
                      <input
                        type="text"
                        value={friendFilter}
                        onChange={(e) => setFriendFilter(e.target.value)}
                        placeholder="Tìm nhanh trong danh sách bạn bè..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60"
                      />
                    </div>
                  )}

                  {isLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                      <span className="material-symbols-outlined animate-spin text-2xl text-cyan-400">
                        progress_activity
                      </span>
                      <span>Đang tải danh sách bạn bè...</span>
                    </div>
                  ) : filteredFriends.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 text-2xl">
                        <span className="material-symbols-outlined text-3xl">sentiment_dissatisfied</span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-bold">
                          {friendFilter ? 'Không tìm thấy bạn bè phù hợp' : 'Chưa có người bạn nào'}
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                          Hãy chuyển sang tab "Tìm Bạn Mới" để kết bạn và cùng nhau so tài nhé!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {filteredFriends.map((f) => {
                        const tier = getRankTier(f.elo || 1000);
                        return (
                          <div
                            key={f._id}
                            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#141926] border border-white/10 hover:border-cyan-500/40 transition-all shadow-md group"
                          >
                            <div className="flex items-center gap-3">
                              {/* Avatar & Online Dot */}
                              <div className="relative">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-800 border border-white/20 flex items-center justify-center text-white font-headline font-black text-sm shadow-md">
                                  {f.avatar?.startsWith('avatar_') ? (
                                    <span className="material-symbols-outlined text-xl">
                                      sports_esports
                                    </span>
                                  ) : (
                                    (f.nickname || 'U').substring(0, 2).toUpperCase()
                                  )}
                                </div>
                                <span
                                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#141926] ${
                                    f.isOnline
                                      ? f.status === 'in_game'
                                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                                        : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                                      : 'bg-slate-500'
                                  }`}
                                  title={
                                    f.isOnline
                                      ? f.status === 'in_game'
                                        ? 'Đang trong trận đấu'
                                        : 'Đang Online sẵn sàng'
                                      : 'Offline'
                                  }
                                />
                              </div>

                              {/* Info */}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-headline font-bold text-sm">
                                    {f.nickname}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-mono">
                                    Lv.{f.level || 1}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                  <span className="font-mono text-cyan-300 font-bold">
                                    {f.elo || 1000} ELO
                                  </span>
                                  <span>•</span>
                                  <span
                                    className={`text-[10px] font-bold ${
                                      f.isOnline
                                        ? f.status === 'in_game'
                                          ? 'text-amber-300'
                                          : 'text-emerald-300'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {f.isOnline
                                      ? f.status === 'in_game'
                                        ? '🎮 Đang Trong Trận'
                                        : '🟢 Đang Online'
                                      : '⚪ Offline'}
                                  </span>
                                </div>
                                <span className="text-[9px] text-cyan-400/80 font-mono block mt-0.5 tracking-wider">
                                  ID: {f.accountId || (f._id ? String(f._id).slice(-10).toUpperCase() : '')}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5">
                              {/* NÚT CHAT TRỰC TIẾP (TASK 2) */}
                              <button
                                onClick={() => onOpenChat && onOpenChat(f)}
                                className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-300 font-headline font-bold text-xs flex items-center gap-1 transition-all cursor-pointer relative shadow-sm"
                                title={`Nhắn tin trò chuyện với ${f.nickname}`}
                              >
                                <span className="material-symbols-outlined text-sm">chat</span>
                                <span className="hidden sm:inline">Chat</span>
                                {(f.unreadCount || 0) > 0 && (
                                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold animate-pulse shadow-sm">
                                    +{f.unreadCount}
                                  </span>
                                )}
                              </button>

                              {f.isOnline ? (
                                <button
                                  onClick={() => handleInviteFriend(f)}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-headline font-bold text-xs flex items-center gap-1 shadow-[0_0_15px_rgba(0,210,255,0.3)] transition-all cursor-pointer"
                                  title="Mời bạn bè vào phòng đấu"
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    sports_esports
                                  </span>
                                  <span className="hidden sm:inline">Mời Đấu</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-500 font-medium px-1.5 py-1">
                                  Offline
                                </span>
                              )}

                              <button
                                onClick={() => handleRemoveFriend(f._id, f.nickname)}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer border border-white/5"
                                title="Hủy kết bạn"
                              >
                                <span className="material-symbols-outlined text-base">person_remove</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: LỜI MỜI KẾT BẠN */}
              {activeTab === 'requests' && (
                <div className="space-y-4">
                  {/* Nhận được */}
                  <div>
                    <h3 className="text-xs font-headline font-black text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">inbox</span>
                      <span>Lời Mời Nhận Được ({requests.received.length})</span>
                    </h3>

                    {requests.received.length === 0 ? (
                      <p className="text-slate-500 text-xs italic p-3 bg-white/5 rounded-xl text-center">
                        Không có lời mời kết bạn nào đang chờ.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {requests.received.map((r) => (
                          <div
                            key={r.requestId}
                            className="flex items-center justify-between p-3 rounded-2xl bg-[#141926] border border-cyan-500/30 shadow-md"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold">
                                {(r.user?.nickname || 'U').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="text-white font-bold text-sm block">
                                  {r.user?.nickname}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {r.user?.elo || 1000} ELO • Cấp {r.user?.level || 1}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRespondRequest(r.requestId, 'accept', r.user)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                              >
                                <span className="material-symbols-outlined text-sm">check</span>
                                <span>Đồng Ý</span>
                              </button>

                              <button
                                onClick={() => handleRespondRequest(r.requestId, 'decline')}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                                <span>Từ Chối</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Đã gửi */}
                  <div className="pt-2 border-t border-white/10">
                    <h3 className="text-xs font-headline font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">send</span>
                      <span>Lời Mời Đã Gửi ({requests.sent.length})</span>
                    </h3>

                    {requests.sent.length === 0 ? (
                      <p className="text-slate-500 text-xs italic p-3 bg-white/5 rounded-xl text-center">
                        Bạn chưa gửi lời mời nào đang chờ.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {requests.sent.map((s) => (
                          <div
                            key={s.requestId}
                            className="flex items-center justify-between p-3 rounded-2xl bg-[#141926]/70 border border-white/5 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 font-bold text-xs">
                                {(s.user?.nickname || 'U').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="text-white font-medium block">
                                  {s.user?.nickname}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Đang chờ đối phương chấp nhận...
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleRespondRequest(s.requestId, 'decline')}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Thu Hồi
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: TÌM & THÊM BẠN */}
              {activeTab === 'search' && (
                <div className="space-y-3">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-3 text-cyan-400 text-lg">
                      search
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Nhập Nickname hoặc ID tài khoản 10 ký tự (VD: Alice hoặc 9DBC27F2DD)..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-cyan-500/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner"
                      autoFocus
                    />
                  </div>

                  {searchLoading ? (
                    <div className="py-8 flex items-center justify-center text-cyan-300 text-xs gap-2">
                      <span className="material-symbols-outlined animate-spin text-xl">
                        progress_activity
                      </span>
                      <span>Đang tìm kiếm người chơi...</span>
                    </div>
                  ) : searchQuery.trim() && searchResults.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Không tìm thấy người chơi nào với từ khóa "{searchQuery}"
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((u) => (
                        <div
                          key={u._id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-[#141926] border border-white/10 hover:border-cyan-500/30 transition-all shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white font-bold flex items-center justify-center text-sm shadow">
                                {(u.nickname || 'U').substring(0, 2).toUpperCase()}
                              </div>
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#141926] ${
                                  u.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                                }`}
                              />
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-sm">{u.nickname}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-mono">
                                  Lv.{u.level || 1}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <span className="text-cyan-300 font-mono font-bold">
                                  {u.elo || 1000} ELO
                                </span>
                                <span>•</span>
                                <span className="text-[10px] text-cyan-400/80 font-mono tracking-wider">
                                  ID: {u.accountId || (u._id ? String(u._id).slice(-10).toUpperCase() : '')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            {u.relationship === 'friend' ? (
                              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">check</span>
                                <span>Bạn Bè</span>
                              </span>
                            ) : u.relationship === 'pending_sent' ? (
                              <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">hourglass_top</span>
                                <span>Đã Gửi</span>
                              </span>
                            ) : u.relationship === 'pending_received' ? (
                              <button
                                onClick={() => handleRespondRequest(u.friendshipId, 'accept', u)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-black font-headline font-bold text-xs flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">check</span>
                                <span>Chấp Nhận</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSendRequest(u._id, u.nickname)}
                                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-headline font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md"
                              >
                                <span className="material-symbols-outlined text-sm">person_add</span>
                                <span>Kết Bạn</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      Gợi ý: Nhập chính xác hoặc gần đúng Nickname để tìm bạn chơi nhanh chóng.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-[#0f1420] text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Trạng thái kết nối: Real-time Socket.io</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
