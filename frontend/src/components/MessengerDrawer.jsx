import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { friendApi } from '../apis/friendApi';

export default function MessengerDrawer({
  user,
  socket,
  onOpenChat,
  onOpenFriendsModal,
  onOpenShop,
  activeChatFriendId = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 1. Tải danh sách bạn bè & hội thoại
  const fetchConversations = useCallback(async () => {
    if (!user || user.role === 'guest') return;
    try {
      const res = await friendApi.getFriends();
      if (res && res.success) {
        setFriends(res.friends || []);
      }
    } catch (err) {
      console.warn('[MessengerDrawer] Lỗi tải hội thoại:', err);
    }
  }, [user]);

  // Tải danh sách khi mount hoặc khi mở Drawer
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, isOpen]);

  // 2. Lắng nghe sự kiện Realtime từ Socket (tin nhắn mới, cập nhật unread, trạng thái online)
  useEffect(() => {
    if (!socket || !user) return;

    const handleDmReceive = () => {
      fetchConversations();
    };

    const handleUnreadUpdate = () => {
      fetchConversations();
    };

    const handleStatusChange = ({ userId, status }) => {
      setFriends((prev) =>
        prev.map((f) =>
          String(f._id) === String(userId)
            ? { ...f, status, isOnline: status !== 'offline' }
            : f
        )
      );
    };

    socket.on('dm:receive', handleDmReceive);
    socket.on('dm:unread_update', handleUnreadUpdate);
    socket.on('friend:status_change', handleStatusChange);

    return () => {
      socket.off('dm:receive', handleDmReceive);
      socket.off('dm:unread_update', handleUnreadUpdate);
      socket.off('friend:status_change', handleStatusChange);
    };
  }, [socket, user, fetchConversations]);

  // 3. Tính toán tổng số tin nhắn chưa đọc
  const totalUnreadCount = useMemo(() => {
    return friends.reduce((sum, f) => sum + (f.unreadCount || 0), 0);
  }, [friends]);

  // 4. Số lượng bạn bè đang Online
  const onlineCount = useMemo(() => {
    return friends.filter((f) => f.isOnline).length;
  }, [friends]);

  // 5. Lọc danh sách theo ô tìm kiếm
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const q = searchQuery.toLowerCase().trim();
    return friends.filter(
      (f) =>
        (f.nickname && f.nickname.toLowerCase().includes(q)) ||
        (f.accountId && f.accountId.toLowerCase().includes(q))
    );
  }, [friends, searchQuery]);

  // Format thời gian tin nhắn
  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHour = Math.floor(diffMin / 60);

      if (diffMin < 1) return 'Vừa xong';
      if (diffMin < 60) return `${diffMin}p`;
      if (diffHour < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  // Chọn bạn bè để mở chat
  const handleSelectFriend = (friend) => {
    if (onOpenChat) {
      onOpenChat(friend);
    }
    setIsOpen(false);
  };

  const isGuest = !user || user.role === 'guest';

  // Không hiển thị nếu không có thông tin người dùng và không có nút Shop
  if (!user && !onOpenShop) return null;

  return (
    <>
      {/* ================= BẢNG DANH SÁCH CHAT MESSENGER (POPOVER) ================= */}
      {isOpen && !isGuest && (
        <div className="fixed bottom-[154px] sm:bottom-[160px] right-6 z-[85] w-80 sm:w-92 h-[480px] max-h-[calc(100vh-180px)] bg-[#0c101d]/95 border-2 border-cyan-400/50 rounded-3xl shadow-[0_0_60px_rgba(0,210,255,0.35)] backdrop-blur-2xl flex flex-col overflow-hidden animate-slide-up font-body">
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#111728] border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <span className="material-symbols-outlined text-lg">chat</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-headline font-black text-sm text-white tracking-wide">
                    ĐOẠN CHAT
                  </h3>
                  {totalUnreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px] animate-pulse">
                      {totalUnreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-cyan-300/80 font-medium">
                  🟢 {onlineCount} bạn bè trực tuyến
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={fetchConversations}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Làm mới danh sách"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
              </button>

              {onOpenFriendsModal && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenFriendsModal();
                  }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                  title="Mở danh bạ bạn bè đầy đủ"
                >
                  <span className="material-symbols-outlined text-base">open_in_full</span>
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Thu nhỏ"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>

          {/* THANH TÌM KIẾM NHANH */}
          <div className="p-3 bg-[#0f1422] border-b border-white/5">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-slate-400 text-sm pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bạn bè theo tên hoặc ID 10 ký tự..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/70"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* DANH SÁCH BẠN BÈ / CUỘC TRÒ CHUYỆN */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar text-xs">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <span className="material-symbols-outlined animate-spin text-xl text-cyan-400">
                  progress_activity
                </span>
                <span>Đang tải tin nhắn...</span>
              </div>
            ) : friends.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                  👥
                </div>
                <div>
                  <p className="font-bold text-slate-200">Chưa có bạn bè để trò chuyện</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hãy mở danh bạ để tìm kiếm và kết bạn bằng Tên hoặc ID nhé!
                  </p>
                </div>
                {onOpenFriendsModal && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenFriendsModal();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-headline font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    Tìm Bạn Bè Ngay
                  </button>
                )}
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Không tìm thấy bạn bè phù hợp với "{searchQuery}"
              </div>
            ) : (
              filteredFriends.map((f) => {
                const isSelected = activeChatFriendId && String(activeChatFriendId) === String(f._id);
                const hasUnread = (f.unreadCount || 0) > 0;

                return (
                  <div
                    key={f._id}
                    onClick={() => handleSelectFriend(f)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,210,255,0.2)]'
                        : hasUnread
                        ? 'bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500/25'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Avatar kèm chấm Online Status */}
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 to-purple-900 border border-white/20 flex items-center justify-center text-white font-headline font-black text-xs shadow-inner">
                          {(f.nickname || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0c101d] ${
                            f.isOnline
                              ? f.status === 'in_game'
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                              : 'bg-slate-500'
                          }`}
                          title={
                            f.isOnline
                              ? f.status === 'in_game'
                                ? 'Đang trong trận'
                                : 'Đang Online'
                              : 'Offline'
                          }
                        />
                      </div>

                      {/* Thông tin tên & tin nhắn gần nhất */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`font-headline text-xs truncate ${
                              hasUnread ? 'font-black text-white' : 'font-bold text-slate-200'
                            }`}
                          >
                            {f.nickname}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono shrink-0">
                            {formatMessageTime(f.lastMessageAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p
                            className={`text-[11px] truncate max-w-[170px] ${
                              hasUnread
                                ? 'text-cyan-300 font-bold'
                                : 'text-slate-400'
                            }`}
                          >
                            {f.lastMessage ? f.lastMessage : 'Bắt đầu trò chuyện 👋'}
                          </p>

                          {hasUnread && (
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono font-black text-[9px] shrink-0 animate-pulse">
                              +{f.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER */}
          {onOpenFriendsModal && (
            <div className="p-2.5 bg-[#0e1322] border-t border-white/10 flex items-center justify-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenFriendsModal();
                }}
                className="text-[11px] text-cyan-300/90 hover:text-cyan-200 font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">group</span>
                <span>Mở quản lý danh bạ bạn bè & kết bạn</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= KHỐI NÚT NỔI GÓC DƯỚI PHẢI (CỬA HÀNG + CHAT MESSENGER NẰM CÙNG KHỐI) ================= */}
      <div className="fixed bottom-6 right-6 z-[80] flex flex-col items-center p-1.5 rounded-full bg-[#0c101d]/85 border border-cyan-500/30 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.7),0_0_25px_rgba(0,210,255,0.2)] gap-2.5">
        
        {/* 1. NÚT CỬA HÀNG (ICON NẰM PHÍA TRÊN NÚT CHAT) */}
        {onOpenShop && (
          <button
            onClick={onOpenShop}
            className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 group bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 hover:-translate-y-0.5 ring-2 ring-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.5)]"
            title="Cửa Hàng Skin & Khung Avatar độc quyền (Task 5)"
            aria-label="Mở Cửa Hàng"
          >
            {/* Biểu tượng storefront */}
            <span className="material-symbols-outlined text-white text-2xl transition-transform group-hover:scale-110">
              storefront
            </span>

            {/* Huy hiệu số dư Vàng mini */}
            <span className="absolute -bottom-1 -left-1 px-1.5 py-0.2 rounded-full bg-[#0a0d16] text-amber-300 font-mono font-black text-[9px] border border-amber-400/60 shadow-md">
              🪙 {(user?.coins ?? 1000) > 9999 ? `${Math.floor((user?.coins ?? 1000) / 1000)}k` : (user?.coins ?? 1000).toLocaleString()}
            </span>

            {/* Tooltip khi rê chuột */}
            <div className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-[#0f1422]/95 border border-amber-400/50 text-amber-200 text-xs font-headline font-bold whitespace-nowrap shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              Cửa Hàng Skin 🛍️
            </div>
          </button>
        )}

        {/* ĐƯỜNG PHÂN CÁCH NHẸ NẾU CẢ 2 NÚT CÙNG HIỂN THỊ */}
        {onOpenShop && !isGuest && (
          <div className="w-6 h-[1px] bg-white/10" />
        )}

        {/* 2. NÚT CHAT MESSENGER (NẰM PHÍA DƯỚI CÙNG KHỐI) */}
        {!isGuest && (
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 group ${
              isOpen
                ? 'bg-gradient-to-tr from-rose-600 to-purple-600 ring-4 ring-rose-400/40 shadow-[0_0_35px_rgba(244,63,94,0.6)]'
                : 'bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 hover:brightness-110 hover:-translate-y-0.5 ring-2 ring-cyan-400/60 shadow-[0_0_25px_rgba(0,210,255,0.45)]'
            }`}
            title={isOpen ? 'Thu nhỏ Messenger' : 'Mở trò chuyện Messenger'}
            aria-label="Mở Messenger"
          >
            {/* Biểu tượng xoay mượt mà khi mở/đóng */}
            <span
              className={`material-symbols-outlined text-white text-2xl transition-transform duration-300 group-hover:scale-110 ${
                isOpen ? 'rotate-90' : ''
              }`}
            >
              {isOpen ? 'close' : 'chat'}
            </span>

            {/* Đèn chỉ báo Online */}
            {!isOpen && onlineCount > 0 && (
              <span
                className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0c101d]"
                title={`${onlineCount} bạn bè đang online`}
              />
            )}

            {/* Huy hiệu số tin nhắn chưa đọc (Red Unread Badge) */}
            {!isOpen && totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono font-black text-[11px] border-2 border-[#0b0e17] shadow-lg animate-bounce">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}

            {/* Tooltip khi rê chuột (Nằm ngang chuẩn xác sang trái, không bị xoay theo nút) */}
            <div className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-[#0f1422]/95 border border-cyan-400/50 text-cyan-200 text-xs font-headline font-bold whitespace-nowrap shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
              {isOpen ? 'Thu nhỏ Messenger ✕' : 'Tin Nhắn Bạn Bè 💬'}
            </div>
          </button>
        )}
      </div>
    </>
  );
}
