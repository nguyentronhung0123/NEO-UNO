import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import UnoCard from '../components/UnoCard';
import CardShowcaseModal from '../features/deckTest/components/CardShowcaseModal';
import MatchSetupModal from '../components/MatchSetupModal';
import LeaderboardModal, { getRankTier } from '../components/LeaderboardModal';
import MatchHistoryModal from '../components/MatchHistoryModal';
import OnlineRoomModal from '../components/OnlineRoomModal';
import MatchmakingModal from '../components/MatchmakingModal';
import FriendsModal from '../components/FriendsModal';
import FriendChatBox from '../components/FriendChatBox';
import MessengerDrawer from '../components/MessengerDrawer';
import MatchInviteNotification from '../components/MatchInviteNotification';
import ShopModal from '../components/ShopModal';
import AdminSecurityModal from '../components/AdminSecurityModal';
import QuestModal from '../components/QuestModal';
import { AvatarFrame } from '../components/AvatarFrame';
import { getSocket } from '../services/socket';
import { friendApi } from '../apis/friendApi';
import { questApi } from '../apis/questApi';
import { getActiveMatch, forfeitActiveMatch, clearActiveMatch } from '../utils/activeMatchStorage.js';

export default function LobbyPage({ onJoinOfflineMatch, onOpenRules, onOpenAuth, onJoinOnlineMatch }) {
  const { user, logout, updateUser } = useAuth();
  const [isShowcaseOpen, setIsShowcaseOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isOnlineRoomOpen, setIsOnlineRoomOpen] = useState(false);
  const [isMatchmakingOpen, setIsMatchmakingOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isQuestOpen, setIsQuestOpen] = useState(false);
  const [hasClaimableQuest, setHasClaimableQuest] = useState(false);
  const [matchmakingMode, setMatchmakingMode] = useState('4_PLAYERS');
  const [showGuestOnlineModal, setShowGuestOnlineModal] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // HỆ THỐNG BẠN BÈ & LỜI MỜI ĐẤU (TASK 2)
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [friendsRoomCode, setFriendsRoomCode] = useState(null);
  const [incomingInvite, setIncomingInvite] = useState(null);
  const [targetRoomCode, setTargetRoomCode] = useState(null);
  const [onlineInitialRoom, setOnlineInitialRoom] = useState(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [activeChatFriend, setActiveChatFriend] = useState(null);
  const [incomingChatNotification, setIncomingChatNotification] = useState(null);
  const [copyIdToast, setCopyIdToast] = useState(false);

  const activeChatFriendRef = useRef(activeChatFriend);
  activeChatFriendRef.current = activeChatFriend;

  // PHÁT HIỆN TRẬN ĐẤU DỞ DANG ĐỂ TIẾP TỤC CHƠI (RECONNECT / AFK)
  const [rejoinMatch, setRejoinMatch] = useState(null);
  const [rejoinOnlineRoomCode, setRejoinOnlineRoomCode] = useState(null);
  const [isForfeiting, setIsForfeiting] = useState(false);
  const [forfeitToast, setForfeitToast] = useState(null);

  const profileMenuRef = useRef(null);

  // PHÁT HIỆN TRẬN ĐẤU ONLINE DỞ DANG ĐỂ RECONNECT (TASK 4)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const checkActiveOnline = () => {
      const myId = user?.id || user?._id || localStorage.getItem('neo_user_id');
      const myName = user?.nickname || user?.name || localStorage.getItem('neo_player_name');
      if (!myId && !myName) return;
      socket.emit('game:check_active', { userId: myId, playerName: myName }, (res) => {
        if (res && res.hasActiveGame && res.roomCode) {
          setRejoinOnlineRoomCode(res.roomCode);
        } else {
          setRejoinOnlineRoomCode(null);
        }
      });
    };

    checkActiveOnline();
    const interval = setInterval(checkActiveOnline, 4000);
    return () => clearInterval(interval);
  }, [user]);

  // ĐĂNG KÝ PRESENCE VÀ LẮNG NGHE LỜI MỜI ĐẤU REALTIME (TASK 2)
  useEffect(() => {
    const socket = getSocket();
    if (user && user.role !== 'guest') {
      socket.emit('user:register', {
        userId: user.id || user._id,
        user: {
          id: user.id || user._id,
          nickname: user.nickname || user.name,
          avatar: user.avatar,
          elo: user.elo,
          level: user.level,
        },
      });

      friendApi.getFriendRequests().then((res) => {
        if (res && res.success) {
          setPendingRequestsCount(res.received?.length || 0);
        }
      });

      // Kiểm tra trạng thái quà nhiệm vụ chờ nhận (Task 6)
      questApi.getDailyQuests().then((res) => {
        if (res && res.success && res.stats?.hasClaimableReward) {
          setHasClaimableQuest(true);
        } else {
          setHasClaimableQuest(false);
        }
      });
    }

    const handleInviteReceived = (invite) => {
      console.log('[Lobby] 📨 Nhận lời mời thi đấu trực tiếp:', invite);
      setIncomingInvite(invite);
    };

    const handleFriendRequestReceived = () => {
      setPendingRequestsCount((prev) => prev + 1);
    };

    const handleDmReceivedGlobally = ({ message, fromUserId }) => {
      console.log('[Lobby] 💬 Nhận tin nhắn mới từ bạn bè:', message);
      const curFriend = activeChatFriendRef.current;
      const curFriendId = curFriend?._id || curFriend?.id;
      // Nếu đang mở đúng khung chat với người này -> FriendChatBox sẽ tự cập nhật mượt mà
      if (curFriendId && String(curFriendId) === String(fromUserId)) {
        return;
      }

      setIncomingChatNotification({
        friend: message.sender,
        content: message.content,
        fromUserId,
        id: message._id || Date.now(),
      });
    };

    const handleBalanceUpdated = (data) => {
      console.log('[Lobby] 🪙 Nhận cập nhật số dư từ máy chủ:', data);
      if (data?.coins !== undefined) {
        updateUser({ coins: data.coins, ...(data.elo !== undefined ? { elo: data.elo } : {}) });
      }
    };

    socket.on('invite:received', handleInviteReceived);
    socket.on('friend:request_received', handleFriendRequestReceived);
    socket.on('dm:receive', handleDmReceivedGlobally);
    socket.on('user:balance_updated', handleBalanceUpdated);

    return () => {
      socket.off('invite:received', handleInviteReceived);
      socket.off('friend:request_received', handleFriendRequestReceived);
      socket.off('dm:receive', handleDmReceivedGlobally);
      socket.off('user:balance_updated', handleBalanceUpdated);
    };
  }, [user]);

  const handleAcceptInvite = (invite) => {
    setIncomingInvite(null);
    setIsFriendsOpen(false);
    setActiveChatFriend(null);
    setTargetRoomCode(invite.roomCode);
    setIsOnlineRoomOpen(true);
  };

  const handleDeclineInvite = (invite) => {
    setIncomingInvite(null);
    const socket = getSocket();
    socket.emit('invite:decline', {
      senderUserId: invite.fromUser?.id,
      user: {
        id: user?.id || user?._id,
        nickname: user?.nickname || user?.name,
      },
      roomCode: invite.roomCode,
    });
  };

  const handleOpenFriends = (roomCode = null) => {
    if (isGuest) {
      setShowGuestOnlineModal(true);
      return;
    }
    setFriendsRoomCode(roomCode);
    setIsFriendsOpen(true);
  };

  // TẠO PHÒNG VÀ GỬI LỜI MỜI ĐẤU TRỰC TIẾP TỚI BẠN BÈ 1-CLICK (TASK 2)
  const handleCreateRoomAndInvite = (friend) => {
    const socket = getSocket();
    if (!socket) return;

    let localUserId = localStorage.getItem('neo_user_id');
    if (!localUserId) {
      localUserId = 'user_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('neo_user_id', localUserId);
    }
    const chosenName =
      (user?.nickname || user?.name || localStorage.getItem('neo_player_name') || 'Người chơi').trim();

    const preparedUser = {
      ...user,
      id: user?.id || user?._id || localUserId,
      userId: user?.id || user?._id || localUserId,
      nickname: chosenName,
      name: chosenName,
      avatar: user?.avatar,
    };

    socket.emit('room:create', { user: preparedUser }, (res) => {
      if (res && res.success && res.room) {
        setOnlineInitialRoom(res.room);
        setFriendsRoomCode(res.room.code);
        setIsFriendsOpen(false);
        setActiveChatFriend(null);
        setIsOnlineRoomOpen(true);

        socket.emit(
          'invite:send',
          {
            toUserId: friend._id,
            roomCode: res.room.code,
            sender: preparedUser,
          },
          (inviteRes) => {
            if (inviteRes && inviteRes.success) {
              console.log(`[Invite] Đã gửi lời mời tới ${friend.nickname}`);
            }
          }
        );
      } else {
        alert(res?.message || 'Không thể tạo phòng lúc này!');
      }
    });
  };

  // Tự động kiểm tra và đồng bộ trực tiếp trận đấu dở dang theo thời gian thực (1s/lần)
  useEffect(() => {
    const updateActive = () => {
      const active = getActiveMatch();
      if (active && (active.status === 'in_progress' || active.status === 'finished') && active.playerHand) {
        setRejoinMatch(active);
      } else {
        setRejoinMatch(null);
      }
    };

    updateActive();
    const interval = setInterval(updateActive, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmRejoin = () => {
    if (!rejoinMatch) return;
    const session = rejoinMatch;
    setRejoinMatch(null);
    onJoinOfflineMatch(session.matchConfig, session);
  };

  const handleRejectRejoin = async () => {
    if (!rejoinMatch) return;
    setIsForfeiting(true);
    const session = rejoinMatch;
    const totalP = 1 + (session.matchConfig?.botCount || 3);
    const penalty = totalP === 4 ? -30 : -25;
    try {
      await forfeitActiveMatch(session);
      setForfeitToast(`⚠️ Bạn đã bỏ cuộc! Bị xử Hạng chót và nhận hình phạt: ${penalty} ELO.`);
      setTimeout(() => setForfeitToast(null), 5000);
    } catch (err) {
      console.warn('Forfeit active match error:', err);
    }
    clearActiveMatch();
    setIsForfeiting(false);
    setRejoinMatch(null);
  };

  // Xác định người dùng có phải là Khách (chưa đăng ký / chưa đăng nhập tài khoản chính thức)
  const isGuest = !user || user.role === 'guest';
  const userTier = getRankTier(user?.elo || 1000);

  // Tự động đóng menu profile khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tự động mở modal nếu URL có tham số mời ?room=
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('room')) {
      setIsOnlineRoomOpen(true);
    }
  }, []);

  const handleOnlineMultiplayerClick = () => {
    setIsOnlineRoomOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0b0e17] flex flex-col justify-between p-3 sm:p-5 text-slate-100 relative overflow-hidden font-body selection:bg-primary-container selection:text-black">
      {/* Background Soft Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-primary-container/10 blur-[130px] rounded-full"></div>
        <div className="absolute -bottom-40 -left-20 w-[480px] h-[480px] bg-secondary-container/15 blur-[140px] rounded-full"></div>
        <div className="absolute top-1/3 -right-20 w-[420px] h-[420px] bg-tertiary-container/10 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(28,31,42,0.6)_0%,rgba(10,14,24,0.95)_100%)]"></div>
      </div>

      {/* ================= HEADER FULL-WIDTH CỰC ĐẸP ================= */}
      <header className="relative z-30 w-full max-w-7xl mx-auto flex items-center justify-between gap-3 px-2 sm:px-6 pt-1 pb-4">
        
        {/* GÓC TRÊN TRÁI: LOGO GAME & CHẾ ĐỘ CHƠI */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex bg-surface-container-low/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-outline-variant/30 items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-primary-container text-xl">
              style
            </span>
            <span className="font-headline text-lg sm:text-xl font-black tracking-wider uppercase text-white">
              NEO <span className="text-primary-container">UNO</span>
            </span>
          </div>

          <div className="hidden sm:flex bg-tertiary-container/15 border border-tertiary-container/40 text-tertiary px-3 py-1 rounded-full items-center gap-1.5 text-[10px] font-bold uppercase shadow-[0_0_10px_rgba(72,217,158,0.2)]">
            <span className="w-1.5 h-1.5 bg-tertiary-container rounded-full animate-pulse"></span>
            OFFLINE AI ARENA
          </div>
        </div>

        {/* GÓC TRÊN PHẢI: DUY NHẤT 1 KHU VỰC ĐĂNG NHẬP / PROFILE DROPDOWN TAB */}
        <div className="flex items-center gap-2.5 relative" ref={profileMenuRef}>
          
          {/* NÚT NHIỆM VỤ & THÀNH TỰU - ẨN TRÊN MOBILE, CÓ TRONG MENU PROFILE */}
          <button
            onClick={() => setIsQuestOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#131826]/90 hover:bg-[#1c2336] border border-amber-500/40 hover:border-amber-400 text-amber-300 font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md group relative hover:scale-105 active:scale-95"
            title="Nhiệm vụ hằng ngày & Huy hiệu thành tựu"
          >
            <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform text-amber-400">
              assignment
            </span>
            <span className="hidden md:inline">Nhiệm Vụ</span>
            {hasClaimableQuest && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            )}
          </button>

          {/* NÚT BẠN BÈ & LỜI MỜI - ẨN TRÊN MOBILE, CÓ TRONG MENU PROFILE & CHAT MESSENGER */}
          <button
            onClick={() => handleOpenFriends()}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#131826]/90 hover:bg-[#1c2336] border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md group relative hover:scale-105 active:scale-95"
            title="Hệ thống bạn bè & lời mời đấu trực tuyến"
          >
            <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform">
              group
            </span>
            <span className="hidden md:inline">Bạn Bè</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          {/* NÚT QUẢN TRỊ AN NINH & BẢO MẬT (CHỈ DÀNH CHO ADMIN) */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-900/70 to-rose-900/70 hover:from-purple-800 hover:to-rose-800 border border-purple-400/60 hover:border-cyan-400 text-purple-200 font-headline font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)] group relative hover:scale-105 active:scale-95 animate-pulse"
              title="Trung Tâm Quản Trị Bảo Mật & Chống Gian Lận (Admin SOC)"
            >
              <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform text-cyan-300">
                shield
              </span>
              <span className="hidden sm:inline">Quản Trị</span>
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 text-purple-200 text-[9px] font-mono font-bold border border-purple-400/40">
                SOC
              </span>
            </button>
          )}

          {/* Nút Đăng Nhập Duy Nhất Góc Trên Phải (chỉ hiện khi là Khách) */}
          {isGuest && (
            <button
              onClick={() => onOpenAuth && onOpenAuth()}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-primary-container to-cyan-400 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,210,255,0.45)] hover:shadow-[0_0_25px_rgba(0,210,255,0.7)] transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
              title="Bấm để Đăng nhập hoặc Tạo tài khoản leo Rank"
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>Đăng Nhập</span>
            </button>
          )}

          {/* Profile Capsule (Bấm để mở Menu Tab / Mobile Bottom Sheet) */}
          <div
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className={`relative flex items-center gap-2 sm:gap-3 bg-[#131826]/90 hover:bg-[#1a2233] px-2.5 sm:px-3.5 py-1.5 rounded-full border transition-all cursor-pointer shadow-md select-none group shrink-0 ${
              isProfileMenuOpen
                ? 'border-cyan-400/80 shadow-[0_0_25px_rgba(0,210,255,0.35)]'
                : 'border-outline-variant/30 hover:border-cyan-400/50'
            }`}
            title="Nhấn để mở Menu tính năng Hồ Sơ"
          >
            {/* Notification Badge cho Mobile khi các nút header bị ẩn */}
            {(hasClaimableQuest || pendingRequestsCount > 0) && (
              <span className="sm:hidden absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border border-[#131826] text-[8px] text-white font-mono font-bold items-center justify-center">
                  {pendingRequestsCount > 0 ? pendingRequestsCount : '!'}
                </span>
              </span>
            )}

            <AvatarFrame
              frameId={user?.equippedAvatarFrame || 'frame_default'}
              size="sm"
              className="flex-shrink-0"
            >
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.nickname || 'Guest'}`}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </AvatarFrame>

            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-white max-w-[85px] sm:max-w-[130px] truncate group-hover:text-cyan-300 transition-colors">
                  {user?.nickname || 'Khách Chơi Thử'}
                </span>
                <span
                  className={`text-[8px] px-1.5 py-0.2 rounded-sm uppercase font-black ${
                    isGuest
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-primary-container/20 text-primary-container'
                  }`}
                >
                  {isGuest ? 'KHÁCH' : 'VIP'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {isGuest ? 'Chưa Xếp Hạng' : `${user?.elo || 1000} ELO • Lv.${user?.level || 1}`}
              </span>
            </div>

            <span
              className={`material-symbols-outlined text-slate-400 text-sm transition-transform duration-200 ${
                isProfileMenuOpen ? 'rotate-180 text-cyan-400' : 'group-hover:text-cyan-300'
              }`}
            >
              keyboard_arrow_down
            </span>
          </div>

          {/* ================= BACKDROP CHO MOBILE KHI MỞ PROFILE DRAWER ================= */}
          {isProfileMenuOpen && (
            <div
              onClick={() => setIsProfileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xs z-[95] md:hidden animate-fade-in"
            />
          )}

          {/* ================= PROFILE DROPDOWN / MOBILE BOTTOM SHEET DRAWER ================= */}
          {isProfileMenuOpen && (
            <div
              className="fixed inset-x-0 bottom-0 z-[100] max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#0e1322] border-t-2 border-cyan-500/50 p-4 sm:p-5 shadow-[0_-20px_50px_rgba(0,0,0,0.95)] animate-in slide-in-from-bottom duration-200 md:static md:inset-auto md:max-h-[85vh] md:overflow-y-auto md:absolute md:top-full md:right-0 md:mt-2 md:w-96 md:rounded-3xl md:border md:border-cyan-500/40 md:shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(0,210,255,0.25)] md:animate-in md:fade-in md:zoom-in-95 text-left"
            >
              {/* THANH VUỐT KÉO & NÚT ĐÓNG CHO DI ĐỘNG (MOBILE DRAG PILL) */}
              <div className="flex md:hidden items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,210,255,0.8)]" />
                  <span className="font-headline font-black text-xs text-white uppercase tracking-wider">
                    Menu Cá Nhân & Tiện Ích
                  </span>
                </div>
                <button
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Đóng menu"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
              {/* 1. Header Hồ Sơ Người Chơi */}
              <div className="flex items-center gap-3.5 pb-3.5 border-b border-white/10">
                <AvatarFrame
                  frameId={user?.equippedAvatarFrame || 'frame_default'}
                  size="lg"
                  className="flex-shrink-0"
                >
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.nickname || 'Guest'}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </AvatarFrame>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-headline font-black text-white text-base truncate">
                      {user?.nickname || 'Khách Chơi Thử'}
                    </h4>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold uppercase tracking-wider">
                      {isGuest ? 'Khách' : 'VIP Member'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="text-amber-400 font-bold">
                      {userTier.badge} Bậc {userTier.name}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-cyan-300 font-bold">
                      {user?.elo || 1000} ELO
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                    <span>🪙 <strong>{(user?.coins ?? 1000).toLocaleString()}</strong> Vàng</span>
                    <span>⭐ <strong>Lv.{user?.level || 1}</strong></span>
                  </div>

                  {/* NÚT MỞ CỬA HÀNG & TÚI ĐỒ TRONG MENU */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsShopOpen(true);
                    }}
                    className="w-full mt-2.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 font-headline font-bold text-xs flex items-center justify-between transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm group-hover:scale-110 transition-transform">🛍️</span>
                      <span>Mở Cửa Hàng & Túi Đồ</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-300">
                      🪙 {(user?.coins ?? 1000).toLocaleString()} Vàng →
                    </span>
                  </button>

                  {/* ID TÀI KHOẢN (10 KÝ TỰ - TASK 2) */}
                  {user && !isGuest && (() => {
                    const displayId = user.accountId || (user.id || user._id ? String(user.id || user._id).slice(-10).toUpperCase() : '');
                    return (
                      <div className="flex items-center gap-1.5 mt-2 bg-black/50 px-2.5 py-1 rounded-lg border border-cyan-500/20 w-fit">
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: <strong className="text-cyan-300 font-bold select-all tracking-wider">{displayId}</strong>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(displayId);
                            setCopyIdToast(true);
                            setTimeout(() => setCopyIdToast(false), 2200);
                          }}
                          className="text-slate-400 hover:text-cyan-300 p-0.5 rounded transition-colors cursor-pointer flex items-center"
                          title="Sao chép ID tài khoản (10 ký tự)"
                        >
                          <span className="material-symbols-outlined text-xs">
                            {copyIdToast ? 'check' : 'content_copy'}
                          </span>
                        </button>
                        {copyIdToast && (
                          <span className="text-[9px] text-emerald-400 font-bold animate-fade-in">Đã copy!</span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* 2. Danh Mục Các Tab Chức Năng (Bảng Vinh Danh, Lịch Sử, Bộ Bài, Luật) */}
              <div className="py-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-2 px-1">
                  DANH MỤC TÍNH NĂNG
                </span>

                <div className="space-y-1.5">
                  {/* Tab 0: Hệ Thống Bạn Bè & Lời Mời Đấu (Task 2) */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleOpenFriends();
                    }}
                    className="w-full bg-[#151b2a] hover:bg-cyan-500/15 border border-white/5 hover:border-cyan-400/40 p-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shadow-xs">
                        👥
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                          <span>Bạn Bè & Lời Mời</span>
                          {pendingRequestsCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold animate-pulse">
                              +{pendingRequestsCount}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Quản lý bạn bè, theo dõi online & mời đấu
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all text-sm">
                      chevron_right
                    </span>
                  </button>

                  {/* Tab 0.5: Nhiệm Vụ & Thành Tựu (Task 6) */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsQuestOpen(true);
                    }}
                    className="w-full bg-[#151b2a] hover:bg-amber-500/15 border border-white/5 hover:border-amber-400/40 p-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shadow-xs">
                        📜
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-2">
                          <span>Nhiệm Vụ & Thành Tựu</span>
                          {hasClaimableQuest && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Nhiệm vụ ngày reset 24h & mở khóa danh hiệu
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-all text-sm">
                      chevron_right
                    </span>
                  </button>

                  {/* Tab 1: Bảng Vinh Danh & Bậc Rank */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsLeaderboardOpen(true);
                    }}
                    className="w-full bg-[#151b2a] hover:bg-amber-500/15 border border-white/5 hover:border-amber-400/40 p-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shadow-xs">
                        🏆
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                          Bảng Vinh Danh & Bậc Rank
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Xem Top 5 cao thủ & 6 bậc rank Cloud
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-all text-sm">
                      chevron_right
                    </span>
                  </button>

                  {/* Tab 2: Lịch Sử Đấu Trường */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsHistoryOpen(true);
                    }}
                    className="w-full bg-[#151b2a] hover:bg-cyan-500/15 border border-white/5 hover:border-cyan-400/40 p-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shadow-xs">
                        📜
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          Lịch Sử Đấu Trường
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Nhật ký ván đấu & biến động điểm ELO
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all text-sm">
                      chevron_right
                    </span>
                  </button>

                  {/* Tab 3: Khám Phá 108 Lá Bài UNO */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsShowcaseOpen(true);
                    }}
                    className="w-full bg-[#151b2a] hover:bg-emerald-500/15 border border-white/5 hover:border-emerald-400/40 p-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shadow-xs">
                        🃏
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                          Bộ 108 Lá Bài UNO Neon
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Chiêm ngưỡng toàn bộ bộ bài & hiệu ứng
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-300 group-hover:translate-x-1 transition-all text-sm">
                      chevron_right
                    </span>
                  </button>

                  {/* Tab 4: Cẩm Nang Luật Chơi */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenRules && onOpenRules();
                    }}
                    className="w-full bg-[#151b2a] hover:bg-sky-500/15 border border-white/5 hover:border-sky-400/40 p-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shadow-xs">
                        📖
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                          Luật Chơi & Thẻ Bài
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Quy tắc đánh bài, phạt UNO & thẻ chức năng
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-sky-300 group-hover:translate-x-1 transition-all text-sm">
                      chevron_right
                    </span>
                  </button>

                  {/* Tab Admin: Quản Trị Bảo Mật (Chỉ dành cho Admin) */}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsAdminModalOpen(true);
                      }}
                      className="w-full bg-gradient-to-r from-purple-950/40 to-rose-950/40 hover:from-purple-900/50 hover:to-rose-900/50 border border-purple-500/40 hover:border-cyan-400 p-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between group text-left shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shadow-xs">
                          🛡️
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-2">
                            <span>Quản Trị An Ninh (SOC)</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 font-mono font-bold">
                              ADMIN
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Khóa tài khoản, chống hack điểm/tiền & kiểm toán
                          </div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-purple-300 group-hover:translate-x-1 transition-all text-sm">
                        chevron_right
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Footer Menu Profile */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                {isGuest ? (
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenAuth && onOpenAuth();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary-container to-cyan-400 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer hover:scale-[1.02]"
                  >
                    <span className="material-symbols-outlined text-base">login</span>
                    <span>Đăng Nhập / Tạo Tài Khoản</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    <span>Đăng Xuất Khỏi Thiết Bị</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ================= KHU VỰC THÂN CHÍNH (CENTER CONTENT) ================= */}
      <main className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center my-auto">
        
        {/* HERO SHOWCASE */}
        <div className="relative mb-5 flex flex-col items-center">
          {/* Card Fan (Xòe 4 lá bài Neon biểu tượng) */}
          <div className="relative h-40 sm:h-48 w-72 sm:w-80 flex items-center justify-center">
            {/* Lá 1 (Red Skip) */}
            <div className="absolute transform -translate-x-16 -rotate-15 hover:-translate-y-4 hover:-rotate-12 transition-all duration-300 cursor-pointer shadow-[0_0_30px_rgba(255,43,112,0.3)]">
              <UnoCard color="red" value="skip" />
            </div>

            {/* Lá 2 (Blue 7) */}
            <div className="absolute transform -translate-x-5 -rotate-5 hover:-translate-y-4 hover:rotate-0 transition-all duration-300 cursor-pointer shadow-[0_0_30px_rgba(0,210,255,0.3)] z-10">
              <UnoCard color="blue" value="7" />
            </div>

            {/* Lá 3 (Green Reverse) */}
            <div className="absolute transform translate-x-5 rotate-5 hover:-translate-y-4 hover:rotate-0 transition-all duration-300 cursor-pointer shadow-[0_0_30px_rgba(72,217,158,0.3)] z-20">
              <UnoCard color="green" value="reverse" />
            </div>

            {/* Lá 4 (Wild +4) */}
            <div className="absolute transform translate-x-16 rotate-15 hover:-translate-y-4 hover:rotate-12 transition-all duration-300 cursor-pointer shadow-[0_0_40px_rgba(255,255,255,0.25)] z-30">
              <UnoCard color="wild" value="wild_draw_four" />
            </div>
          </div>

          <h1 className="font-headline text-4xl sm:text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] mt-1">
            NEO <span className="text-secondary-container">UNO</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5 max-w-md text-center font-medium">
            Đấu trường thẻ bài UNO trực tuyến đỉnh cao với phong cách Cyberpunk và luật chơi chuẩn quốc tế
          </p>
        </div>

        {/* KHUNG ĐIỀU KHIỂN CHÍNH (SẢNH THI ĐẤU) - ĐÃ LOẠI BỎ CÁC NÚT RỜI RẠC XẤU */}
        <div className="w-full max-w-lg bg-[#111520]/80 backdrop-blur-xl border border-outline-variant/30 rounded-3xl p-6 sm:p-7 shadow-[0_15px_50px_rgba(0,0,0,0.6)] flex flex-col items-center gap-4 text-center mb-6">
          
          {/* Badge thông số ván đấu */}
          <div className="flex flex-wrap items-center justify-center gap-2 w-full">
            <span className="bg-primary-container/10 text-primary-container border border-primary-container/30 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-sm">smart_toy</span>
              Đấu với 3 Bot AI (Sẵn Sàng)
            </span>
            <span className="bg-surface-container text-slate-300 border border-outline-variant/30 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">group</span>
              Bàn 4 Người
            </span>
            <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">bolt</span>
              Tốc độ 60 FPS
            </span>
          </div>

          <div className="text-slate-400 text-xs flex items-center justify-center gap-2 flex-wrap">
            <span>Luật Chính Thức</span>
            <span>•</span>
            <span>Hô UNO Tự Động / Thủ Công</span>
            <span>•</span>
            <span>Thẻ Wild Đổi Màu</span>
          </div>

          {/* NÚT CHÍNH: GHÉP TRẬN NHANH, ĐẤU VỚI BOT AI & ĐẤU ONLINE */}
          <div className="flex flex-col gap-3 w-full mt-1">
            {/* 1. NÚT HERO: GHÉP TRẬN NHANH TỰ ĐỘNG (QUICK MATCH) */}
            <button
              onClick={() => {
                setMatchmakingMode('4_PLAYERS');
                setIsMatchmakingOpen(true);
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-rose-400 text-slate-950 font-headline text-base sm:text-lg font-black uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-[0_0_35px_rgba(245,158,11,0.5)] hover:shadow-[0_0_50px_rgba(245,158,11,0.7)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
              <span className="material-symbols-outlined text-2xl font-black animate-pulse">
                bolt
              </span>
              <span>GHÉP TRẬN NHANH</span>
              <span className="px-2 py-0.5 rounded-full bg-black/40 text-amber-200 border border-amber-300/40 text-[10px] font-black uppercase tracking-wider shadow-sm">
                TỰ ĐỘNG ELO
              </span>
            </button>

            {/* Quick Mode Chips: 4P, 3P, Solo 1v1 */}
            <div className="flex items-center justify-center gap-2 w-full text-[11px] font-bold">
              <button
                onClick={() => {
                  setMatchmakingMode('4_PLAYERS');
                  setIsMatchmakingOpen(true);
                }}
                className="flex-1 py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer hover:border-amber-400/50"
              >
                <span>👥</span>
                <span>4 Người (Chuẩn)</span>
              </button>
              <button
                onClick={() => {
                  setMatchmakingMode('3_PLAYERS');
                  setIsMatchmakingOpen(true);
                }}
                className="flex-1 py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer hover:border-amber-400/50"
              >
                <span>⚔️</span>
                <span>Đấu Tay Ba</span>
              </button>
              <button
                onClick={() => {
                  setMatchmakingMode('SOLO_1V1');
                  setIsMatchmakingOpen(true);
                }}
                className="flex-1 py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer hover:border-amber-400/50"
              >
                <span>🥊</span>
                <span>Solo 1v1</span>
              </button>
            </div>

            {/* 2 Nút phụ: Đấu Bot & Phòng Bạn Bè */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {/* Nút 1: Đấu với Bot (Luôn mở cho cả Khách & Đấu thủ) */}
              <button
                onClick={() => setIsSetupOpen(true)}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-primary-container to-cyan-400 text-black font-headline text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,210,255,0.35)] hover:shadow-[0_0_35px_rgba(0,210,255,0.5)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">smart_toy</span>
                <span>ĐẤU VỚI BOT AI</span>
              </button>

              {/* Nút 2: Đấu Online Bạn Bè */}
              <button
                onClick={handleOnlineMultiplayerClick}
                className="flex-1 py-3.5 px-4 rounded-2xl border border-purple-500/50 bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 hover:text-white font-headline text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(168,85,247,0.3)] hover:shadow-[0_0_35px_rgba(168,85,247,0.5)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer relative overflow-hidden"
              >
                <span className="material-symbols-outlined text-xl text-purple-300">
                  groups
                </span>
                <span>PHÒNG BẠN BÈ</span>
                <span className="px-1.5 py-0.2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[8px] font-black uppercase tracking-wider shadow-sm">
                  CODE
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 THẺ CHỨC NĂNG DƯỚI CÙNG */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
          
          {/* Thẻ 1: Hồ sơ / Xếp hạng */}
          <div
            onClick={() => setIsLeaderboardOpen(true)}
            className="bg-[#151923] border border-outline-variant/20 rounded-2xl p-5 hover:bg-[#1a1f2b] transition-colors cursor-pointer group text-left"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">leaderboard</span>
              </div>
              <span className="text-[9px] bg-tertiary-container/20 text-tertiary px-2 py-0.5 rounded-full font-black uppercase">
                {isGuest ? 'Chưa Xếp Hạng' : `${user?.elo || 1000} ELO`}
              </span>
            </div>
            <h3 className="text-white font-bold text-sm mb-1">Bảng Xếp Hạng & Hồ Sơ</h3>
            <p className="text-slate-500 text-[10px] leading-relaxed mb-4 min-h-[30px]">
              {isGuest
                ? 'Đăng nhập để lưu điểm ELO và leo hạng cùng Top 5 cao thủ'
                : 'Theo dõi tiến trình thăng hạng Rank và lịch sử ván đấu'}
            </p>
            <div className="flex items-center gap-1 text-primary-container text-[11px] font-bold group-hover:translate-x-1 transition-transform">
              Xem bảng xếp hạng <span className="material-symbols-outlined text-sm">chevron_right</span>
            </div>
          </div>

          {/* Thẻ 2: Luật chơi & Thẻ Bài */}
          <div
            onClick={() => onOpenRules && onOpenRules()}
            className="bg-[#151923] border border-outline-variant/20 rounded-2xl p-5 hover:bg-[#1a1f2b] transition-colors cursor-pointer group text-left"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 rounded-full bg-tertiary-container/20 text-tertiary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">menu_book</span>
              </div>
              <span className="text-[9px] bg-surface-container text-slate-400 border border-outline-variant/30 px-2 py-0.5 rounded-full font-black uppercase">
                Cẩm nang
              </span>
            </div>
            <h3 className="text-white font-bold text-sm mb-1">Luật Chơi & Thẻ Bài</h3>
            <p className="text-slate-500 text-[10px] leading-relaxed mb-4 min-h-[30px]">
              Hướng dẫn 3 bước đánh bài và 5 thẻ chức năng (Wild, +4, Skip...)
            </p>
            <div className="flex items-center gap-1 text-tertiary-container text-[11px] font-bold group-hover:translate-x-1 transition-transform">
              Xem luật chơi <span className="material-symbols-outlined text-sm">chevron_right</span>
            </div>
          </div>

          {/* Thẻ 3: Đấu Online Bạn Bè */}
          <div
            onClick={handleOnlineMultiplayerClick}
            className="bg-[#151923] border border-outline-variant/20 rounded-2xl p-5 hover:bg-[#1a1f2b] hover:border-purple-500/40 transition-all cursor-pointer group text-left"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">
                  groups
                </span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase border bg-purple-500/20 text-purple-300 border-purple-500/30">
                MULTI PVP
              </span>
            </div>
            <h3 className="text-white font-bold text-sm mb-1">Phòng Bạn Bè (Giao Hữu)</h3>
            <p className="text-slate-500 text-[10px] leading-relaxed mb-4 min-h-[30px]">
              Tạo phòng riêng so tài cùng bạn bè (Chế độ giao hữu giải trí, không tính điểm Rank ELO)
            </p>
            <div className="flex items-center gap-1 text-purple-400 text-[11px] font-bold group-hover:translate-x-1 transition-transform">
              Tham gia ngay <span className="material-symbols-outlined text-sm">chevron_right</span>
            </div>
          </div>

        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto pt-6 pb-2 flex justify-between items-center text-[10px] text-slate-500 font-medium px-4">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span>
          Chơi ngoại tuyến với AI • Tốc độ 60 FPS
        </div>
        <div>© 2026 NEO UNO Arcade Stadium. Mọi quyền được bảo lưu.</div>
      </footer>

      {/* MODAL THÔNG BÁO CHO CHẾ ĐỘ KHÁCH KHI BẤM ĐẤU ONLINE */}
      {showGuestOnlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-[#121622] border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(245,158,11,0.25)] flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center mb-4 text-3xl">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>

            <h3 className="font-headline font-black text-lg text-white uppercase tracking-wider mb-2">
              TÍNH NĂNG ĐẤU ONLINE YÊU CẦU TÀI KHOẢN
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Bạn đang ở <strong>Chế Độ Khách</strong> (Guest Mode). Chế độ này chỉ cho phép chơi luyện tập với <strong>Bot AI</strong>. Để có thể thi đấu Online với người chơi thật và tham gia <strong>Bảng Xếp Hạng Rank ELO</strong>, vui lòng đăng nhập hoặc tạo tài khoản chính thức!
            </p>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={() => {
                  setShowGuestOnlineModal(false);
                  if (onOpenAuth) onOpenAuth();
                }}
                className="w-full py-3 rounded-full bg-gradient-to-r from-primary-container to-cyan-400 text-black font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">login</span>
                <span>ĐĂNG NHẬP NGAY</span>
              </button>

              <button
                onClick={() => setShowGuestOnlineModal(false)}
                className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Tiếp Tục Chơi Thử Với Bot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kiểm Thử Bộ Bài UNO Task 1 */}
      <CardShowcaseModal
        isOpen={isShowcaseOpen}
        onClose={() => setIsShowcaseOpen(false)}
      />

      {/* Modal Thiết Lập Bàn Đấu (Chọn số Bot & Thời gian 5 phút) */}
      <MatchSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onStartMatch={(config) => {
          setIsSetupOpen(false);
          onJoinOfflineMatch(config);
        }}
      />

      {/* Modal Bảng Vinh Danh Cao Thủ (MongoDB Cloud) */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        onOpenAuth={onOpenAuth}
      />

      {/* Modal Lịch Sử Đấu Trường (MongoDB Cloud) */}
      <MatchHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onOpenAuth={onOpenAuth}
        onPlayNow={() => setIsSetupOpen(true)}
      />

      {/* ================= MODAL PHÁT HIỆN TRẬN ĐẤU DỞ DANG (TIẾP TỤC CHƠI / AFK) ================= */}
      {rejoinMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-body">
          <div className="relative w-full max-w-lg bg-[#0f1422]/95 border-2 border-primary-container/60 rounded-3xl p-6 sm:p-7 shadow-[0_0_70px_rgba(0,210,255,0.35)] flex flex-col gap-5 overflow-hidden">
            
            {/* Glow effect */}
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-primary-container/20 rounded-full blur-[90px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-rose-500/15 rounded-full blur-[90px] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-lg ${
                rejoinMatch.status === 'finished'
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                  : 'bg-primary-container/20 border-primary-container/50 text-primary-container shadow-[0_0_20px_rgba(0,210,255,0.4)]'
              }`}>
                <span className="text-2xl">{rejoinMatch.status === 'finished' ? '⚠️' : '⏳'}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                    {rejoinMatch.status === 'finished' ? 'TRẬN ĐẤU ĐÃ KẾT THÚC' : 'TRẬN ĐẤU ĐANG DIỄN RA'}
                  </h3>
                  {rejoinMatch.status === 'in_progress' && (
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-black uppercase tracking-wider animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-cyan-300">
                  {rejoinMatch.status === 'finished'
                    ? 'Ván đấu đã kết thúc trong thời gian bạn vắng mặt (AFK)!'
                    : 'Trận đấu không dừng lại! Các Bot vẫn đang đánh và bạn đang treo AFK.'}
                </p>
              </div>
            </div>

            {/* Thông tin ván đấu dở dang */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-center">
              <div className="p-3 rounded-2xl bg-surface-container-high/60 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quy mô bàn</span>
                <span className="font-headline font-black text-sm text-white mt-1">
                  {1 + (rejoinMatch.matchConfig?.botCount || 3)} Người
                </span>
                <span className="text-[9px] text-cyan-400 font-medium">Bàn cờ đang chạy</span>
              </div>

              <div className="p-3 rounded-2xl bg-surface-container-high/60 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bài trên tay</span>
                <span className="font-headline font-black text-sm text-amber-300 mt-1">
                  {rejoinMatch.playerHand?.length || 0} Lá bài
                </span>
                <span className="text-[9px] text-amber-400 font-medium">Cập nhật thời gian thực</span>
              </div>

              <div className="p-3 rounded-2xl bg-surface-container-high/60 border border-white/10 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thời gian còn</span>
                <span className="font-headline font-black text-sm text-primary-container mt-1 font-mono">
                  {Math.floor((rejoinMatch.matchTimeRemaining || 0) / 60).toString().padStart(2, '0')}:
                  {((rejoinMatch.matchTimeRemaining || 0) % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-[9px] text-slate-400 font-medium">Đang đếm lùi</span>
              </div>
            </div>

            {/* Thông báo quy định */}
            <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${
              rejoinMatch.status === 'finished'
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                : 'bg-amber-500/10 border-amber-500/30 text-slate-300'
            }`}>
              <span className="text-base shrink-0 mt-0.5">⚠️</span>
              <div>
                {rejoinMatch.status === 'finished' ? (
                  <span>
                    Ván đấu đã kết thúc trong lúc bạn vắng mặt ({rejoinMatch.winner ? `Người thắng: ${rejoinMatch.winner}` : 'Hết giờ'}). Bạn bị xử <strong className="text-rose-400">THUA HẠNG CHÓT (-20 ELO)</strong> và chịu phạt thêm <strong className="text-rose-400">-10 ELO bỏ cuộc</strong> (Tổng phạt: {(1 + (rejoinMatch.matchConfig?.botCount || 3)) === 4 ? '-30 ELO' : '-25 ELO'}).
                  </span>
                ) : (
                  <span>
                    Trận đấu <strong>vẫn tiếp tục diễn ra theo thời gian thực</strong>! Các Bot vẫn đang đánh bình thường và mỗi lần tới lượt bạn, sau 15s hệ thống tự động bốc 2 lá phạt và mất lượt. Bấm <strong className="text-primary-container">"Tiếp Tục Chơi"</strong> để vào lại bàn đấu ngay. Nếu chọn <strong className="text-rose-400">"Từ Chối / Bỏ Cuộc"</strong>, bạn sẽ bị xử thua và phạt thêm <strong className="text-rose-400">-10 ELO</strong>.
                  </span>
                )}
              </div>
            </div>

            {/* 2 Nút hành động */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              {rejoinMatch.status === 'finished' ? (
                <button
                  type="button"
                  onClick={handleRejectRejoin}
                  disabled={isForfeiting}
                  className="w-full py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_25px_rgba(244,63,94,0.6)]"
                >
                  {isForfeiting ? 'Đang xử lý...' : 'Xác Nhận & Nhận Kết Quả Xử Thua'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleRejectRejoin}
                    disabled={isForfeiting}
                    className="w-full sm:w-auto sm:flex-1 py-3.5 rounded-full bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 hover:text-white font-headline text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isForfeiting ? 'Đang xử lý...' : 'Từ Chối / Bỏ Cuộc'}
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmRejoin}
                    disabled={isForfeiting}
                    className="w-full sm:flex-2 py-3.5 rounded-full bg-gradient-to-r from-primary-container to-cyan-400 hover:from-cyan-300 hover:to-primary-container text-black font-headline text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_0_30px_rgba(0,210,255,0.5)] hover:shadow-[0_0_40px_rgba(0,210,255,0.7)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-xl">play_arrow</span>
                    <span>TIẾP TỤC VÀO LẠI TRẬN ĐẤU</span>
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL PHÁT HIỆN TRẬN ĐẤU ONLINE DỞ DANG (TASK 4 - RECONNECT ONLINE) */}
      {!rejoinMatch && rejoinOnlineRoomCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-body">
          <div className="relative max-w-lg w-full p-6 sm:p-8 rounded-[32px] bg-[#121622]/95 border-2 border-primary-container shadow-[0_0_80px_rgba(0,210,255,0.4)] flex flex-col gap-5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-primary-container/20 border border-primary-container/50 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,210,255,0.5)]">
              <span className="material-symbols-outlined text-4xl text-primary-container animate-spin">
                sync
              </span>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-headline font-black text-[10px] uppercase tracking-widest mb-2 border border-cyan-500/40">
                PHÁT HIỆN TRẬN ĐẤU ONLINE DỞ DANG
              </div>
              <h3 className="font-headline font-black text-xl sm:text-2xl text-white uppercase tracking-wider mb-2">
                BẠN ĐANG CÓ VÁN ĐẤU ONLINE!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                Hệ thống phát hiện bạn đang có ván cờ trực tuyến tại phòng <strong className="text-yellow-300 font-mono">[{rejoinOnlineRoomCode}]</strong>. Bot AI đang tạm quyền đánh hộ trong thời gian ân hạn.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  const socket = getSocket();
                  if (socket) {
                    const myId = user?._id || user?.id || localStorage.getItem('neo_user_id');
                    socket.emit('game:forfeit', { code: rejoinOnlineRoomCode, userId: myId });
                  }
                  setRejoinOnlineRoomCode(null);
                  setForfeitToast('⚠️ Bạn đã từ chối vào lại ván đấu! Bị tính bỏ cuộc và trừ 25 ELO.');
                  setTimeout(() => setForfeitToast(null), 5000);
                }}
                className="w-full sm:w-auto sm:flex-1 py-3.5 rounded-full bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 hover:text-white font-headline text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Bỏ Cuộc (-25 ELO)
              </button>

              <button
                type="button"
                onClick={() => {
                  const code = rejoinOnlineRoomCode;
                  setRejoinOnlineRoomCode(null);
                  if (onJoinOnlineMatch) {
                    onJoinOnlineMatch({ code });
                  }
                }}
                className="w-full sm:flex-2 py-3.5 rounded-full bg-gradient-to-r from-primary-container to-cyan-400 hover:from-cyan-300 hover:to-primary-container text-black font-headline text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_0_30px_rgba(0,210,255,0.5)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">play_arrow</span>
                <span>VÀO LẠI TRẬN ĐẤU (RECONNECT)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST THÔNG BÁO XỬ THUA KHI BỎ CUỘC */}
      {forfeitToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-rose-200 text-xs font-bold shadow-[0_0_40px_rgba(244,63,94,0.6)] animate-bounce flex items-center gap-3 max-w-md">
          <span className="material-symbols-outlined text-2xl text-rose-400 shrink-0">error</span>
          <span>{forfeitToast}</span>
        </div>
      )}

      {/* MODAL PHÒNG CHƠI ONLINE MULTIPLAYER VỚI BẠN BÈ */}
      <OnlineRoomModal
        isOpen={isOnlineRoomOpen}
        onClose={() => {
          setIsOnlineRoomOpen(false);
          setTargetRoomCode(null);
          setOnlineInitialRoom(null);
          setFriendsRoomCode(null);
        }}
        user={user}
        targetRoomCode={targetRoomCode}
        initialRoom={onlineInitialRoom}
        onClearInitialRoom={() => setOnlineInitialRoom(null)}
        onClearTargetRoomCode={() => setTargetRoomCode(null)}
        onOpenFriends={(code) => handleOpenFriends(code)}
        onStartOnlineMatch={(room) => {
          setIsOnlineRoomOpen(false);
          if (onJoinOnlineMatch) {
            onJoinOnlineMatch(room);
          } else {
            alert(`🎮 Phòng ${room.code}: Tất cả đã sẵn sàng! Đang chuẩn bị chuyển vào bàn đấu thời gian thực...`);
          }
        }}
      />

      {/* MODAL GHÉP TRẬN NHANH TỰ ĐỘNG (RADAR MATCHMAKING) */}
      <MatchmakingModal
        isOpen={isMatchmakingOpen}
        onClose={() => setIsMatchmakingOpen(false)}
        user={user}
        initialMode={matchmakingMode}
        onStartOnlineMatch={(room) => {
          setIsMatchmakingOpen(false);
          if (onJoinOnlineMatch) {
            onJoinOnlineMatch(room);
          }
        }}
      />

      {/* MODAL HỆ THỐNG BẠN BÈ & LỜI MỜI ĐẤU (TASK 2) */}
      <FriendsModal
        isOpen={isFriendsOpen}
        onClose={() => {
          setIsFriendsOpen(false);
          setFriendsRoomCode(null);
        }}
        user={user}
        socket={getSocket()}
        currentRoomCode={friendsRoomCode}
        onOpenAuth={onOpenAuth}
        onOpenChat={(friend) => setActiveChatFriend(friend)}
        onCreateAndInvite={(friend) => handleCreateRoomAndInvite(friend)}
      />

      {/* KHUNG CHAT TRỰC TIẾP BẠN BÈ 1-1 (TASK 2) */}
      {activeChatFriend && (
        <FriendChatBox
          friend={activeChatFriend}
          currentUser={user}
          socket={getSocket()}
          onClose={() => setActiveChatFriend(null)}
          onInviteToMatch={(friend) => {
            if (friendsRoomCode) {
              const s = getSocket();
              s.emit('invite:send', {
                toUserId: friend._id,
                roomCode: friendsRoomCode,
                sender: {
                  id: user?.id || user?._id,
                  nickname: user?.nickname || user?.name,
                  avatar: user?.avatar,
                },
              });
            } else {
              handleCreateRoomAndInvite(friend);
            }
          }}
        />
      )}

      {/* POPUP THÔNG BÁO LỜI MỜI ĐẤU REALTIME (TASK 2) */}
      <MatchInviteNotification
        invite={incomingInvite}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
      />

      {/* POPUP THÔNG BÁO TIN NHẮN MỚI TỪ BẠN BÈ (REALTIME CHAT TOAST) */}
      {incomingChatNotification && (
        <div className="fixed bottom-6 left-6 z-[100] max-w-sm bg-[#121727]/95 border-2 border-purple-500/60 rounded-2xl p-3.5 shadow-[0_0_40px_rgba(168,85,247,0.4)] backdrop-blur-xl flex items-center justify-between gap-3 animate-slide-up font-body">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300 text-lg shadow-inner shrink-0">
              💬
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline font-black text-xs text-white truncate">
                {incomingChatNotification.friend?.nickname || 'Bạn bè'}
              </span>
              <span className="text-[11px] text-slate-300 truncate max-w-[180px]">
                {incomingChatNotification.content}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setActiveChatFriend(incomingChatNotification.friend);
                setIncomingChatNotification(null);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-110 text-white font-headline font-bold text-[11px] cursor-pointer shadow-md transition-all active:scale-95"
            >
              Trả lời
            </button>
            <button
              onClick={() => setIncomingChatNotification(null)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL CỬA HÀNG SKIN & KHUNG AVATAR (TASK 5) */}
      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        user={user}
        onUpdateUser={updateUser}
      />

      {/* MODAL TRUNG TÂM QUẢN TRỊ BẢO MẬT & CHỐNG GIAN LẬN (ADMIN SOC) */}
      <AdminSecurityModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={user}
      />

      {/* MODAL NHIỆM VỤ HẰNG NGÀY & THÀNH TỰU DANH HIỆU (TASK 6) */}
      <QuestModal
        isOpen={isQuestOpen}
        onClose={() => {
          setIsQuestOpen(false);
          questApi.getDailyQuests().then((res) => {
            setHasClaimableQuest(Boolean(res?.stats?.hasClaimableReward));
          });
        }}
        user={user}
        onUpdateUser={updateUser}
      />

      {/* KHỐI NÚT NỔI GÓC DƯỚI PHẢI (CỬA HÀNG + CHAT MESSENGER NẰM CÙNG KHỐI) */}
      <MessengerDrawer
        user={user}
        socket={getSocket()}
        onOpenChat={(friend) => setActiveChatFriend(friend)}
        onOpenFriendsModal={() => setIsFriendsOpen(true)}
        onOpenShop={() => setIsShopOpen(true)}
        activeChatFriendId={activeChatFriend?._id || activeChatFriend?.id}
      />
    </div>
  );
}
