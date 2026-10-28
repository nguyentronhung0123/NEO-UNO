import React, { useState, useEffect, useRef } from 'react';
import { friendApi } from '../apis/friendApi';

export default function FriendChatBox({
  friend,
  currentUser,
  socket,
  onClose,
  onInviteToMatch,
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const myId = currentUser?.id || currentUser?._id;
  const friendId = friend?._id;

  // Cuộn xuống tin nhắn cuối cùng
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Tải lịch sử tin nhắn ban đầu
  useEffect(() => {
    if (!friendId) return;

    let isMounted = true;
    setIsLoading(true);

    friendApi.getDirectMessages(friendId).then((res) => {
      if (isMounted) {
        setIsLoading(false);
        if (res && res.success) {
          setMessages(res.messages || []);
          setTimeout(scrollToBottom, 100);
        }
      }
    });

    // Thông báo cho socket server biết đã đọc tin nhắn
    if (socket && myId) {
      socket.emit('dm:read', { fromUserId: friendId, myUserId: myId });
    }

    return () => {
      isMounted = false;
    };
  }, [friendId, socket, myId]);

  // 2. Lắng nghe tin nhắn realtime từ Socket.io
  useEffect(() => {
    if (!socket || !friendId) return;

    const handleDmReceive = ({ message, fromUserId }) => {
      if (String(fromUserId) === String(friendId)) {
        setMessages((prev) => [...prev, message]);
        setTimeout(scrollToBottom, 50);

        // Đánh dấu đã đọc ngay lập tức
        socket.emit('dm:read', { fromUserId: friendId, myUserId: myId });
      }
    };

    const handleReadReceipt = ({ readerId }) => {
      if (String(readerId) === String(friendId)) {
        setMessages((prev) =>
          prev.map((m) => (String(m.recipient) === String(friendId) ? { ...m, isRead: true } : m))
        );
      }
    };

    socket.on('dm:receive', handleDmReceive);
    socket.on('dm:read_receipt', handleReadReceipt);

    return () => {
      socket.off('dm:receive', handleDmReceive);
      socket.off('dm:read_receipt', handleReadReceipt);
    };
  }, [socket, friendId, myId]);

  // 3. Gửi tin nhắn
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText('');

    // Optimistic UI: Tạo tin nhắn tạm thời
    const tempMsg = {
      _id: `temp_${Date.now()}`,
      sender: {
        _id: myId,
        nickname: currentUser?.nickname || currentUser?.name || 'Bạn',
        avatar: currentUser?.avatar || 'avatar_1',
      },
      recipient: friendId,
      content: text,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 50);

    // Gửi đồng thời qua Socket (realtime) và REST API (lưu trữ CSDL)
    if (socket) {
      socket.emit('dm:send', {
        toUserId: friendId,
        content: text,
        sender: {
          id: myId,
          nickname: currentUser?.nickname || currentUser?.name,
          avatar: currentUser?.avatar,
        },
      });
    }

    try {
      const res = await friendApi.sendDirectMessage(friendId, text);
      if (res && res.success && res.message) {
        // Thay thế tempMsg bằng tin nhắn thực có ID từ MongoDB
        setMessages((prev) =>
          prev.map((m) => (m._id === tempMsg._id ? res.message : m))
        );
      }
    } catch (err) {
      console.warn('Lỗi gửi tin nhắn:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Tin nhắn nhanh (Quick Emotes)
  const sendQuickText = (txt) => {
    setInputText(txt);
  };

  if (!friend) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[90] w-80 sm:w-96 h-[460px] bg-[#0e1320] border-2 border-cyan-400/50 rounded-3xl shadow-[0_0_50px_rgba(0,210,255,0.35)] backdrop-blur-xl flex flex-col overflow-hidden animate-slide-up">
      {/* HEADER KHUNG CHAT */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#131929] border-b border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-800 border border-white/20 flex items-center justify-center text-white font-headline font-bold text-xs shadow-md">
              {(friend.nickname || 'U').substring(0, 2).toUpperCase()}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#131929] ${
                friend.isOnline
                  ? friend.status === 'in_game'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                  : 'bg-slate-500'
              }`}
            />
          </div>

          <div className="min-w-0">
            <h4 className="text-white font-headline font-bold text-xs sm:text-sm truncate flex items-center gap-1.5">
              <span>{friend.nickname}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                {friend.elo || 1000} ELO
              </span>
            </h4>
            <span className="text-[10px] text-slate-400 font-mono block truncate">
              ID: {friend._id}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onInviteToMatch && friend.isOnline && (
            <button
              onClick={() => onInviteToMatch(friend)}
              className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 transition-colors"
              title="Mời bạn bè vào phòng đấu"
            >
              <span className="material-symbols-outlined text-base">sports_esports</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            title="Đóng chat"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      </div>

      {/* DANH SÁCH TIN NHẮN (MESSAGE BUBBLES) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 custom-scrollbar text-xs">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
            <span className="material-symbols-outlined animate-spin text-xl text-cyan-400">
              progress_activity
            </span>
            <span>Đang tải tin nhắn...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-3xl text-slate-600">forum</span>
            <span>Chưa có tin nhắn nào. Hãy gửi lời chào đến {friend.nickname}!</span>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = String(m.sender?._id || m.sender) === String(myId);
            const timeStr = m.createdAt
              ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={m._id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[78%] px-3.5 py-2 rounded-2xl break-words leading-relaxed shadow-md ${
                    isMe
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-xs shadow-[0_0_15px_rgba(0,210,255,0.2)]'
                      : 'bg-[#1b2236] text-slate-200 border border-white/10 rounded-bl-xs'
                  }`}
                >
                  <p className="text-xs">{m.content}</p>
                </div>

                <div className="flex items-center gap-1 mt-0.5 px-1 text-[9px] text-slate-500 font-mono">
                  <span>{timeStr}</span>
                  {isMe && (
                    <span className={m.isRead ? 'text-cyan-400' : 'text-slate-500'}>
                      {m.isRead ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* QUICK SUGGESTIONS */}
      <div className="px-3 py-1.5 bg-[#0b0e17] border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {['👋 Xin chào!', '🎮 Làm ván nào!', '🔥 UNO!', '😎 Chờ tí nhé!'].map((quick) => (
          <button
            key={quick}
            onClick={() => sendQuickText(quick)}
            className="px-2 py-0.8 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 text-[10px] font-medium whitespace-nowrap transition-colors"
          >
            {quick}
          </button>
        ))}
      </div>

      {/* FOOTER INPUT */}
      <form
        onSubmit={handleSendMessage}
        className="p-2.5 bg-[#111728] border-t border-white/10 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Nhắn tin cho ${friend.nickname}...`}
          className="flex-1 px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          autoFocus
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="w-9 h-9 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-black flex items-center justify-center hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          <span className="material-symbols-outlined text-base">send</span>
        </button>
      </form>
    </div>
  );
}
