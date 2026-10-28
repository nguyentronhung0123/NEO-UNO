import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import UnoCard from '../components/UnoCard';
import { getSocket } from '../services/socket';
import { soundEngine } from '../utils/audioFx';

const COLOR_GLOW_MAP = {
  red: 'bg-rose-500/40 shadow-[0_0_80px_rgba(244,63,94,0.7)]',
  blue: 'bg-sky-500/40 shadow-[0_0_80px_rgba(14,165,233,0.7)]',
  green: 'bg-emerald-500/40 shadow-[0_0_80px_rgba(16,185,129,0.7)]',
  yellow: 'bg-amber-400/40 shadow-[0_0_80px_rgba(250,204,21,0.7)]',
  wild: 'bg-purple-500/40 shadow-[0_0_80px_rgba(168,85,247,0.7)]',
};

const COLOR_NAME_MAP = {
  red: 'ĐỎ',
  blue: 'XANH DƯƠNG',
  green: 'XANH LÁ',
  yellow: 'VÀNG',
};

// Helper render Avatar an toàn: Render ảnh khi là URL, render emoji khi là icon, TUYỆT ĐỐI KHÔNG in chuỗi URL hoặc ID text ra màn hình
function renderPlayerAvatar(avatar, isBot = false, isActive = false, size = 'w-9 h-9 sm:w-10 sm:h-10') {
  const activeRing = isActive
    ? 'ring-2 ring-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
    : 'border border-white/20';

  let avatarUrl = avatar;
  // Nếu là bot và avatar không phải là URL -> Tự động sinh avatar Bot Dicebear Robot cực đẹp
  if (isBot && (!avatar || !avatar.startsWith('http'))) {
    const seed = (typeof avatar === 'string' && avatar) ? avatar : 'bot';
    avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
  }

  if (
    avatarUrl &&
    typeof avatarUrl === 'string' &&
    (avatarUrl.startsWith('http://') ||
      avatarUrl.startsWith('https://') ||
      avatarUrl.startsWith('/') ||
      avatarUrl.startsWith('data:'))
  ) {
    return (
      <div
        className={`${size} rounded-full overflow-hidden bg-slate-800 p-0.5 ${activeRing} shrink-0 flex items-center justify-center`}
      >
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Nếu là chuỗi dài hơn 4 ký tự (ví dụ text ID, bot_id) -> Fallback sang robot emoji hoặc user emoji
  const isEmoji = typeof avatar === 'string' && avatar.length <= 4;
  const displayIcon = isEmoji ? avatar : (isBot ? '🤖' : '👤');

  return (
    <div
      className={`${size} rounded-full bg-slate-800/80 p-1 ${activeRing} shrink-0 flex items-center justify-center text-xl sm:text-2xl select-none shadow-md`}
    >
      {displayIcon}
    </div>
  );
}

export default function OnlineGameBoard({ room, user, onBack }) {
  const socket = getSocket();

  // Trạng thái trận đấu nhận từ Socket Server
  const [gameState, setGameState] = useState(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState(null);
  const [shakingCardId, setShakingCardId] = useState(null);

  // Cảnh báo khẩn cấp UNO 5 giây
  const [unoCountdown, setUnoCountdown] = useState(null);

  // Hiệu ứng Visual Effects (GIỐNG 100% GAMEBOARD.JSX)
  const [activeActionFx, setActiveActionFx] = useState(null);
  const [activeAvatarFx, setActiveAvatarFx] = useState(null);
  const avatarFxTimerRef = useRef(null);

  const [showUnoBurst, setShowUnoBurst] = useState(false);
  const [cardPlaySlam, setCardPlaySlam] = useState(false);
  const [shockwaveActive, setShockwaveActive] = useState(false);

  // HIỆU ỨNG XÁO BÀI & PHÁT BÀI KHỞI ĐẦU (GIỐNG 100% BÀN BOT GAMEBOARD.JSX)
  const [isShuffling, setIsShuffling] = useState(true);
  const [isDealing, setIsDealing] = useState(false);
  const [dealingRound, setDealingRound] = useState(0);
  const hasIntroPlayedRef = useRef(false);

  // Hiệu ứng bay bài: rút bài và đánh bài
  const [flyingDraw, setFlyingDraw] = useState(null); // { direction: 'bottom'|'top'|'left'|'right', id }
  const [flyingPlay, setFlyingPlay] = useState(null); // { direction, card, id }

  // Khóa chống click đúp bốc bài dồn dập
  const [isDrawingThrottled, setIsDrawingThrottled] = useState(false);

  // Khóa đồng bộ chống click nhanh đánh 2-3 lá bài trong cùng 1 lượt (LUẬT: 1 LƯỢT = 1 LÁ)
  const isCardActionLockedRef = useRef(false);
  const [isCardActionLocked, setIsCardActionLocked] = useState(false);
  const lastTurnIndexRef = useRef(-1);

  const [gameResult, setGameResult] = useState(null);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Lấy ID người dùng ổn định
  const getMyUserId = useCallback(() => {
    let localUserId = localStorage.getItem('neo_user_id');
    if (!localUserId) {
      localUserId = user?.id || user?._id || `guest_${socket.id}`;
      localStorage.setItem('neo_user_id', localUserId);
    }
    return user?.id || user?._id || localUserId;
  }, [user, socket.id]);

  // Hiệu ứng trực tiếp trên Avatar người chơi / bot (Cấm lượt, +2, +4)
  const triggerAvatarFx = useCallback(
    (targetSeatIndex, type, text, icon = 'warning', duration = 3000) => {
      if (avatarFxTimerRef.current) clearTimeout(avatarFxTimerRef.current);
      setActiveAvatarFx({ targetSeatIndex, type, text, icon });
      avatarFxTimerRef.current = setTimeout(() => {
        setActiveAvatarFx(null);
      }, duration);
    },
    []
  );

  // Helper render huy hiệu hiệu ứng trực tiếp trên Avatar (GIỐNG 100% GAMEBOARD.JSX)
  const renderAvatarFxBadge = (seatIndex) => {
    if (!activeAvatarFx || activeAvatarFx.targetSeatIndex !== seatIndex) return null;

    const { type, text, icon } = activeAvatarFx;

    let bgClasses = 'bg-rose-600 text-white border-white shadow-[0_0_25px_rgba(244,63,94,0.95)]';
    let animClass = 'animate-bounce';

    if (type === 'skip') {
      bgClasses =
        'bg-red-600 text-white border-white/90 shadow-[0_0_30px_rgba(220,38,38,0.95)] ring-2 ring-red-400';
      animClass = 'animate-skip-slam';
    } else if (type === 'wild_draw_four') {
      bgClasses =
        'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white border-yellow-300 shadow-[0_0_35px_rgba(168,85,247,0.95)] ring-2 ring-yellow-400';
      animClass = 'animate-action-pop';
    } else if (type === 'draw_two' || type === 'draw_two_penalize') {
      bgClasses =
        'bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.95)] ring-2 ring-amber-400';
      animClass = 'animate-pulse';
    }

    return (
      <div
        className={`absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap ${animClass} transform-gpu`}
      >
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border-2 font-headline font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-2xl drop-shadow-xl ${bgClasses}`}
        >
          {icon && <span className="material-symbols-outlined text-sm">{icon}</span>}
          <span>{text}</span>
        </div>
      </div>
    );
  };

  // Kích hoạt hiệu ứng lá bài chức năng thông báo giữa bàn
  const triggerActionFx = useCallback((type, text, subtext = '') => {
    setActiveActionFx({ type, text, subtext });
    try {
      if (soundEnabledRef.current) soundEngine.playActionSound(type);
    } catch {}
    setTimeout(() => {
      setActiveActionFx(null);
    }, 2000);
  }, []);

  // Hiệu ứng đập bài xuống bàn
  const triggerCardImpact = useCallback(() => {
    setCardPlaySlam(true);
    setShockwaveActive(true);
    try {
      if (soundEnabledRef.current) soundEngine.playCardSlam();
    } catch {}
    setTimeout(() => setCardPlaySlam(false), 400);
    setTimeout(() => setShockwaveActive(false), 650);
  }, []);

  // Xác định hướng ghế của từng người chơi tương đối so với bạn
  const getDirectionForSeat = useCallback((seatIndex) => {
    const cur = gameStateRef.current;
    if (!cur || !cur.players) return 'top';
    const mySeat = cur.mySeatIndex ?? 0;
    const total = cur.players.length;
    const diff = (seatIndex - mySeat + total) % total;

    if (diff === 0) return 'bottom';
    if (total === 2) return 'top';
    if (total === 3) return diff === 1 ? 'right' : 'left';
    if (diff === 1) return 'right';
    if (diff === 2) return 'top';
    return 'left';
  }, []);

  // HIỆU ỨNG BỐC BÀI TỪNG LÁ MỘT CHO +2 / +4 (TUYỆT ĐỐI KHÔNG BỐC NGUYÊN 1 NẮM BÀI)
  const triggerSequentialDraw = useCallback(
    (dir, count = 1) => {
      const safeCount = Math.max(1, count || 1);

      for (let i = 0; i < safeCount; i++) {
        setTimeout(() => {
          setFlyingDraw({ direction: dir, id: Date.now() + i + Math.random() });
          try {
            if (soundEnabledRef.current) soundEngine.playCardSlide();
          } catch {}

          setTimeout(() => setFlyingDraw(null), 360);
        }, i * 380);
      }
    },
    []
  );

  // Sử dụng Ref ổn định để socket listeners không bao giờ bị re-bind liên tục (CHỐNG LAG 100%)
  const handlersRef = useRef({});
  handlersRef.current = {
    getDirectionForSeat,
    triggerActionFx,
    triggerAvatarFx,
    triggerCardImpact,
    triggerSequentialDraw,
  };

  // KHỞI ĐỘNG HIỆU ỨNG XÁO BÀI & PHÁT BÀI KHỞI ĐẦU (GIỐNG 100% GAMEBOARD.JSX)
  const runDealingIntroSequence = useCallback(() => {
    setIsShuffling(true);
    setIsDealing(false);
    setDealingRound(0);

    try {
      if (soundEnabledRef.current) soundEngine.playShuffle();
    } catch {}

    // Giai đoạn 1: Xáo bài trong 650ms
    setTimeout(() => {
      setIsShuffling(false);
      setIsDealing(true);

      // Giai đoạn 2: Phát bài 7 vòng từng lá một
      let round = 1;
      const dealInterval = setInterval(() => {
        try {
          if (soundEnabledRef.current) soundEngine.playCardSlide();
        } catch {}

        setDealingRound(round);

        if (round >= 7) {
          clearInterval(dealInterval);

          // Giai đoạn 3: Lật lá bài khởi đầu đập xuống bàn
          setTimeout(() => {
            triggerCardImpact();
            setIsDealing(false);
            setDealingRound(0);
          }, 350);
        } else {
          round++;
        }
      }, 130);
    }, 650);
  }, [triggerCardImpact]);

  // LẮNG NGHE SỰ KIỆN TỪ SOCKET SERVER (CHỈ BIND 1 LẦN DUY NHẤT TRÊN MOUNT - KHÔNG LAG)
  useEffect(() => {
    const handleStateSync = (state) => {
      // Khi lượt chơi thay đổi -> Giải phóng khóa đánh bài cho lượt mới
      if (state.currentTurnIndex !== lastTurnIndexRef.current) {
        lastTurnIndexRef.current = state.currentTurnIndex;
        isCardActionLockedRef.current = false;
        setIsCardActionLocked(false);
      } else if (state.currentTurnIndex !== state.mySeatIndex) {
        isCardActionLockedRef.current = false;
        setIsCardActionLocked(false);
      }

      setGameState(state);

      // Nếu là ván mới và chưa chạy intro phát bài -> kích hoạt intro chuẩn bàn bot
      if (state.isDealing && !hasIntroPlayedRef.current) {
        hasIntroPlayedRef.current = true;
        runDealingIntroSequence();
      } else if (!state.isDealing) {
        hasIntroPlayedRef.current = true;
        setIsShuffling(false);
        setIsDealing(false);
      }
    };

    const handleTimerTick = ({ turnTimeRemaining, matchTimeRemaining }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          turnTimeRemaining,
          matchTimeRemaining,
        };
      });
    };

    const handleDealingTick = ({ countdown }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isDealing: countdown > 0,
          dealingCountdown: countdown,
        };
      });
    };

    // Khi có người đánh bài (Hiệu ứng bài bay + Âm thanh + Sóng xung kích)
    const handleCardPlayed = ({ seatIndex, card, chosenColor, playerName, action }) => {
      const cur = gameStateRef.current;
      const isMe = cur && seatIndex === cur.mySeatIndex;

      // 1. Nếu là chính mình vừa đánh:
      // Client đã cập nhật lạc quan và chạy hiệu ứng rồi -> Không chạy lại lần 2 tránh nháy số!
      if (isMe) {
        setGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            topCard: card,
            activeColor: chosenColor || card.color,
          };
        });
        return;
      }

      // 2. Nếu là đối thủ đánh (Bot hoặc người chơi khác):
      const dir = handlersRef.current.getDirectionForSeat(seatIndex);

      // Kích hoạt hoạt ảnh bài bay từ ghế đối thủ
      setFlyingPlay({ direction: dir, card, id: Date.now() });

      // Khi lá bài bay chạm tâm bàn đấu (220ms): Đồng bộ ngay lập tức topCard và dằn bài
      setTimeout(() => {
        setGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            topCard: card,
            activeColor: chosenColor || card.color,
          };
        });
        handlersRef.current.triggerCardImpact();
      }, 220);

      // Dọn dẹp hoạt ảnh bay sau khi đã tiếp đất
      setTimeout(() => setFlyingPlay(null), 440);

      try {
        if (soundEnabledRef.current) {
          if (action === 'skip') {
            soundEngine.playSkip();
          } else if (action === 'reverse') {
            soundEngine.playReverse();
          } else if (action === 'draw_two') {
            soundEngine.playActionSound('draw_two');
          } else if (action === 'wild_draw_four') {
            soundEngine.playActionSound('wild_draw_four');
          } else if (action === 'wild') {
            soundEngine.playActionSound('wild');
          }
        }
      } catch (err) {
        console.warn('Audio/FX error:', err);
      }
    };

    // Khi có người bốc bài (Hỗ trợ bốc phạt nhiều lá tuần tự mượt mà từng lá)
    const handleCardDrawn = ({ seatIndex, count }) => {
      const dir = handlersRef.current.getDirectionForSeat(seatIndex);
      handlersRef.current.triggerSequentialDraw(dir, count || 1);
    };

    // Khi có action event
    const handleActionEvent = (event) => {
      if (event.type === 'uno') {
        setShowUnoBurst(true);
        setUnoCountdown(null);
        setTimeout(() => setShowUnoBurst(false), 2000);
        try {
          if (soundEnabledRef.current) soundEngine.playUnoAlert();
        } catch {}
      } else if (event.type === 'wild_draw_four') {
        handlersRef.current.triggerActionFx('wild_draw_four', '⚡ SIÊU WILD +4!', event.message);
        if (event.victimSeatIndex !== undefined) {
          handlersRef.current.triggerAvatarFx(
            event.victimSeatIndex,
            'wild_draw_four',
            '⚡ BỊ PHẠT +4 LÁ!',
            'bolt',
            3200
          );
        }
      } else if (event.type === 'draw_two') {
        handlersRef.current.triggerActionFx(
          'draw_two',
          `🔥 +${event.count || 2} PHẠT RÚT BÀI!`,
          event.message
        );
      } else if (event.type === 'draw_two_penalize') {
        handlersRef.current.triggerActionFx(
          'draw_two',
          `💥 NHẬN +${event.count} LÁ PHẠT!`,
          event.message
        );
        if (event.seatIndex !== undefined) {
          handlersRef.current.triggerAvatarFx(
            event.seatIndex,
            'draw_two_penalize',
            `💥 NHẬN +${event.count} LÁ!`,
            'emergency_home',
            3000
          );
        }
      } else if (event.type === 'skip') {
        handlersRef.current.triggerActionFx('skip', `🛑 CẤM LƯỢT!`, event.message);
        if (event.targetSeatIndex !== undefined) {
          handlersRef.current.triggerAvatarFx(
            event.targetSeatIndex,
            'skip',
            '🛑 BỊ CẤM LƯỢT!',
            'block',
            2600
          );
        }
      } else if (event.type === 'reverse') {
        handlersRef.current.triggerActionFx('reverse', `🔄 ĐỔI CHIỀU ĐÁNH!`, event.message);
      } else if (event.type === 'uno_penalty') {
        handlersRef.current.triggerActionFx('skip', `🚨 QUÊN HÔ UNO!`, event.message);
        setUnoCountdown(null);
        if (event.seatIndex !== undefined) {
          handlersRef.current.triggerAvatarFx(
            event.seatIndex,
            'draw_two_penalize',
            '🚨 PHẠT 2 LÁ UNO!',
            'warning',
            3000
          );
        }
        try {
          if (soundEnabledRef.current) soundEngine.playSkip();
        } catch {}
      } else if (event.type === 'timeout_penalty') {
        handlersRef.current.triggerActionFx('skip', `⏰ HẾT 15 GIÂY (AFK)!`, event.message);
        if (event.seatIndex !== undefined) {
          handlersRef.current.triggerAvatarFx(
            event.seatIndex,
            'draw_two_penalize',
            '⏰ PHẠT 2 LÁ AFK!',
            'schedule',
            3000
          );
        }
        try {
          if (soundEnabledRef.current) soundEngine.playSkip();
        } catch {}
      } else if (event.type === 'pass_turn') {
        handlersRef.current.triggerActionFx('skip', `↷ BỎ LƯỢT`, event.message);
        try {
          if (soundEnabledRef.current) soundEngine.playCardSlide();
        } catch {}
      }
    };

    const handleUnoWarning = ({ seatIndex, playerName, countdown }) => {
      const cur = gameStateRef.current;
      if (cur && seatIndex === cur.mySeatIndex) {
        setUnoCountdown(countdown || 5);
      } else {
        handlersRef.current.triggerActionFx('skip', `🚨 CẢNH BÁO UNO!`, `${playerName} còn đúng 1 lá bài!`);
      }
    };

    const handleGameFinished = (result) => {
      setGameResult(result);
      try {
        if (soundEnabledRef.current) soundEngine.playVictory();
      } catch {}
    };

    socket.on('game:state_sync', handleStateSync);
    socket.on('game:timer_tick', handleTimerTick);
    socket.on('game:dealing_tick', handleDealingTick);
    socket.on('game:card_played', handleCardPlayed);
    socket.on('game:card_drawn', handleCardDrawn);
    socket.on('game:action_event', handleActionEvent);
    socket.on('game:uno_warning', handleUnoWarning);
    socket.on('game:finished', handleGameFinished);

    const activeCode = room?.code;
    if (activeCode) {
      const myUserId = getMyUserId();
      const myName = user?.nickname || user?.name || localStorage.getItem('neo_player_name') || 'Bạn';
      socket.emit('game:get_state', { code: activeCode, userId: myUserId, playerName: myName });
    }

    return () => {
      socket.off('game:state_sync', handleStateSync);
      socket.off('game:timer_tick', handleTimerTick);
      socket.off('game:dealing_tick', handleDealingTick);
      socket.off('game:card_played', handleCardPlayed);
      socket.off('game:card_drawn', handleCardDrawn);
      socket.off('game:action_event', handleActionEvent);
      socket.off('game:uno_warning', handleUnoWarning);
      socket.off('game:finished', handleGameFinished);
      if (avatarFxTimerRef.current) clearTimeout(avatarFxTimerRef.current);
    };
  }, [socket, room?.code, getMyUserId, runDealingIntroSequence, user?.nickname, user?.name]);

  // Bộ đếm lùi 5s khẩn cấp cho UNO
  useEffect(() => {
    if (unoCountdown === null) return;
    if (unoCountdown > 0) {
      try {
        if (soundEnabledRef.current) soundEngine.playEmergencyBeep();
      } catch {}
      const timer = setTimeout(() => {
        setUnoCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (unoCountdown === 0) {
      setUnoCountdown(null);
    }
  }, [unoCountdown]);

  // Tự động kích hoạt đếm ngược 5s nếu phát hiện trên tay còn đúng 1 lá và chưa hô UNO
  useEffect(() => {
    if (!gameState || gameState.isDealing || isDealing || isShuffling) return;
    const mySeat = gameState.mySeatIndex;
    const myPl = (gameState.players || []).find((p) => p.seatIndex === mySeat);
    if ((gameState.myHand || []).length === 1 && myPl && !myPl.unoCalled && unoCountdown === null) {
      setUnoCountdown(5);
    } else if ((gameState.myHand || []).length > 2 || myPl?.unoCalled) {
      if (unoCountdown !== null) setUnoCountdown(null);
    }
  }, [gameState, unoCountdown, isDealing, isShuffling]);

  // Thống kê màu sắc các lá bài trên tay phục vụ Wild Color Picker
  const myHandColorStats = useMemo(() => {
    const stats = { red: 0, blue: 0, green: 0, yellow: 0 };
    (gameState?.myHand || []).forEach((c) => {
      if (stats[c.color] !== undefined) stats[c.color]++;
    });
    return stats;
  }, [gameState?.myHand]);

  const isMyTurn = gameState && gameState.currentTurnIndex === gameState.mySeatIndex;

  const myPlayer = useMemo(() => {
    if (!gameState || !gameState.players) return null;
    return gameState.players.find((p) => p.seatIndex === gameState.mySeatIndex) || null;
  }, [gameState]);

  const myDisplayName =
    myPlayer?.name || user?.nickname || user?.name || localStorage.getItem('neo_player_name') || 'Bạn';

  // Kiểm tra tính hợp lệ của lá bài theo luật chuẩn UNO
  const checkValidCard = useCallback(
    (card, topCard, drawTwoStack) => {
      if (!card || !topCard) return false;

      // Đang có cộng dồn +2: CHỈ được đánh tiếp lá +2 để cộng dồn
      if (drawTwoStack > 0) {
        return card.value === 'draw_two';
      }

      // Lá bài Wild hoặc Wild +4 luôn đánh được
      if (card.color === 'wild' || card.value === 'wild' || card.value === 'wild_draw_four') {
        return true;
      }

      // Trùng màu đang hoạt động
      const targetColor = gameState?.activeColor || topCard.color;
      if (card.color === targetColor) return true;

      // Trùng giá trị số hoặc chức năng với lá trên cùng
      if (card.value === topCard.value) return true;

      return false;
    },
    [gameState?.activeColor]
  );

  const isCardPlayable = useCallback(
    (card) => {
      if (!gameState || gameState.isDealing || isDealing || isShuffling) return false;
      const { topCard, drawTwoStack, currentTurnIndex, mySeatIndex } = gameState;
      if (currentTurnIndex !== mySeatIndex) return false;
      return checkValidCard(card, topCard, drawTwoStack);
    },
    [gameState, isDealing, isShuffling, checkValidCard]
  );

  // CLICK ĐÁNH BÀI (HIỆU ỨNG TỨC THÌ 0ms - NATIVE 60 FPS)
  const handlePlayCardClick = (card) => {
    // KHÓA CHẶT 1: Mỗi lượt chỉ được đánh đúng 1 lá bài duy nhất, chặn tuyệt đối spam đánh 2-3 lá
    if (!isMyTurn || isDealing || isShuffling || isCardActionLockedRef.current || isCardActionLocked) return;

    if (!isCardPlayable(card)) {
      setShakingCardId(card.id);
      setTimeout(() => setShakingCardId(null), 500);
      return;
    }

    if (card.color === 'wild' || card.value === 'wild' || card.value === 'wild_draw_four') {
      setPendingWildCard(card);
      setColorPickerOpen(true);
    } else {
      executePlayCard(card, card.color);
    }
  };

  const executePlayCard = (card, chosenColor) => {
    const activeCode = room?.code || gameState?.roomCode;
    if (!activeCode) return;

    // KHÓA ĐỒNG BỘ 0ms NGAY LẬP TỨC: Tuyệt đối chặn các click liên tiếp kế sau
    isCardActionLockedRef.current = true;
    setIsCardActionLocked(true);

    // 1. Ẩn ngay lá bài khỏi tay người chơi (phản hồi tức thì 0ms)
    setGameState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        myHand: (prev.myHand || []).filter((c) => c.id !== card.id),
      };
    });

    // 2. Kích hoạt hoạt ảnh bài bay từ tay lên giữa bàn đấu
    setFlyingPlay({ direction: 'bottom', card, id: Date.now() });

    // 3. Khi bài bay tiếp đất vào tâm bàn (sau 200ms): Cập nhật topCard và dằn bài
    setTimeout(() => {
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          topCard: card,
          activeColor: chosenColor || card.color,
        };
      });
      triggerCardImpact();
    }, 200);

    // 4. Kết thúc hoạt ảnh bay
    setTimeout(() => setFlyingPlay(null), 420);

    const myUserId = getMyUserId();
    socket.emit(
      'game:play_card',
      {
        code: activeCode,
        cardId: card.id,
        chosenColor,
        userId: myUserId,
      },
      (res) => {
        if (res && !res.success) {
          triggerActionFx('skip', 'LỖI ĐÁNH BÀI', res.message);
          // Mở lại khóa nếu server từ chối vì lỗi
          isCardActionLockedRef.current = false;
          setIsCardActionLocked(false);
        }
      }
    );
    setColorPickerOpen(false);
    setPendingWildCard(null);
  };

  // Click bốc bài (có debounce và throttle chống click spam)
  const handleDrawCardClick = () => {
    if (!isMyTurn || gameState?.isDealing || isDealing || isShuffling || isDrawingThrottled) return;

    if ((gameState?.drawnCountInTurn || 0) >= 2 && (gameState?.drawTwoStack || 0) === 0) {
      triggerActionFx('skip', 'ĐÃ BỐC ĐỦ 2 LÁ', 'Hãy đánh một lá bài hợp lệ hoặc bấm Bỏ Lượt ↷');
      return;
    }

    setIsDrawingThrottled(true);
    setTimeout(() => setIsDrawingThrottled(false), 800);

    const activeCode = room?.code || gameState?.roomCode;
    if (!activeCode) return;
    const myUserId = getMyUserId();
    socket.emit('game:draw_card', { code: activeCode, userId: myUserId }, (res) => {
      if (res && !res.success) {
        triggerActionFx('skip', 'KHÔNG THỂ BỐC BÀI', res.message);
      }
    });
  };

  // Click Bỏ Lượt (sau khi đã bốc ít nhất 1 lá mà không thể hoặc không muốn đánh)
  const handlePassTurnClick = () => {
    if (!isMyTurn || gameState?.isDealing || isDealing || isShuffling) return;
    const activeCode = room?.code || gameState?.roomCode;
    if (!activeCode) return;
    const myUserId = getMyUserId();
    socket.emit('game:pass_turn', { code: activeCode, userId: myUserId }, (res) => {
      if (res && !res.success) {
        triggerActionFx('skip', 'KHÔNG THỂ BỎ LƯỢT', res.message);
      }
    });
  };

  // Click Hô UNO cho bản thân hoặc Bắt phạt đối thủ quên hô UNO
  const handleCallUnoClick = () => {
    const activeCode = room?.code || gameState?.roomCode;
    if (!activeCode) return;
    const handCount = (gameState?.myHand || []).length;

    // Kiểm tra xem có đối thủ nào còn đúng 1 lá mà chưa hô UNO không
    const forgotOpponent = (gameState?.players || []).find(
      (p) => p.seatIndex !== gameState?.mySeatIndex && p.handCount === 1 && !p.unoCalled
    );

    if (handCount > 2 && !forgotOpponent) {
      triggerActionFx(
        'skip',
        '❌ CHƯA THỂ HÔ UNO!',
        `Bạn đang có ${handCount} lá bài trên tay và hiện không có đối thủ nào quên hô UNO!`
      );
      return;
    }

    const myUserId = getMyUserId();
    socket.emit('game:call_uno', { code: activeCode, userId: myUserId }, (res) => {
      if (res && res.success) {
        setUnoCountdown(null);
        setShowUnoBurst(true);
        setTimeout(() => setShowUnoBurst(false), 2000);
        try {
          if (soundEnabledRef.current) soundEngine.playUnoAlert();
        } catch {}
      } else if (res && !res.success) {
        triggerActionFx('skip', 'LỖI HÔ UNO', res.message);
      }
    });
  };

  // Sắp xếp các đối thủ theo các vị trí tương đối (Top, Left, Right)
  const { topOpponent, leftOpponent, rightOpponent } = useMemo(() => {
    if (!gameState || !gameState.players) {
      return { topOpponent: null, leftOpponent: null, rightOpponent: null };
    }

    const mySeat = gameState.mySeatIndex ?? 0;
    const total = gameState.players.length;
    const opponents = [];

    for (let i = 1; i < total; i++) {
      const seat = (mySeat + i) % total;
      opponents.push(gameState.players[seat]);
    }

    if (opponents.length === 1) {
      return { topOpponent: opponents[0], leftOpponent: null, rightOpponent: null };
    } else if (opponents.length === 2) {
      return { rightOpponent: opponents[0], leftOpponent: opponents[1], topOpponent: null };
    } else {
      return {
        rightOpponent: opponents[0],
        topOpponent: opponents[1],
        leftOpponent: opponents[2],
      };
    }
  }, [gameState]);

  // Tọa độ 4 cung mũi tên vòng cung bao quanh bàn đấu (CHUẨN 60 FPS)
  const orbitPaths = useMemo(() => {
    const dir = gameState?.turnDirection ?? 1;
    if (dir === 1) {
      return {
        'bottom-right': 'M 330 300 C 430 300, 480 240, 480 185',
        'top-right': 'M 480 135 C 480 80, 430 20, 330 20',
        'top-left': 'M 170 20 C 70 20, 20 80, 20 135',
        'bottom-left': 'M 20 185 C 20 240, 70 300, 170 300',
      };
    } else {
      return {
        'bottom-left': 'M 170 300 C 70 300, 20 240, 20 185',
        'top-left': 'M 20 135 C 20 80, 70 20, 170 20',
        'top-right': 'M 330 20 C 430 20, 480 80, 480 135',
        'bottom-right': 'M 480 185 C 480 240, 430 300, 330 300',
      };
    }
  }, [gameState?.turnDirection]);

  // Xác định cung mũi tên đang sáng chính xác theo lượt người chơi
  const activeArcKey = useMemo(() => {
    if (!gameState || !gameState.players) return 'bottom-right';
    const total = gameState.players.length;
    const mySeat = gameState.mySeatIndex ?? 0;
    const curRel = (gameState.currentTurnIndex - mySeat + total) % total;
    const dir = gameState.turnDirection ?? 1;

    if (total === 2) {
      return curRel === 0 ? 'bottom-right' : 'top-left';
    }

    if (dir === 1) {
      if (curRel === 0) return 'bottom-right';
      if (curRel === 1) return 'top-right';
      if (curRel === 2) return 'top-left';
      return 'bottom-left';
    } else {
      if (curRel === 0) return 'bottom-left';
      if (curRel === 3) return 'top-left';
      if (curRel === 2) return 'top-right';
      return 'bottom-right';
    }
  }, [gameState]);

  // Bộ bài người chơi hiển thị thực tế
  const displayedPlayerHand = useMemo(() => {
    const rawHand = gameState?.myHand || [];
    if (isDealing) {
      return rawHand.slice(0, dealingRound);
    }
    return rawHand;
  }, [gameState?.myHand, isDealing, dealingRound]);

  // Helper render Bot / Người chơi bên Cánh Trái & Phải (GIỐNG 100% GAMEBOARD.JSX)
  const renderSidePlayer = (player, side) => {
    if (!player) return <div className="w-28 sm:w-36" />;
    const isCurrent = gameState?.currentTurnIndex === player.seatIndex;
    const cardCount = isDealing ? dealingRound : player.handCount;

    return (
      <div
        className={`relative flex flex-col items-center p-2.5 sm:p-3 rounded-2xl transition-all duration-300 w-32 sm:w-40 backdrop-blur-md shadow-lg transform-gpu ${
          isCurrent
            ? 'bg-gradient-to-b from-amber-500/25 via-slate-900/95 to-amber-950/40 border-2 border-amber-300 ring-4 ring-amber-400/80 shadow-[0_0_40px_rgba(251,191,36,0.85)] scale-110 z-30 animate-bot-spotlight'
            : 'bg-surface-container-high/40 border border-white/5 opacity-75'
        }`}
      >
        {isCurrent ? (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-headline font-black text-[9px] uppercase tracking-wider shadow-lg whitespace-nowrap animate-pulse">
            <span>👑 ĐẾN LƯỢT (P{player.seatIndex + 1})</span>
          </div>
        ) : (
          <span className="absolute -top-3 px-2 py-0.5 rounded-full bg-slate-900 border border-white/20 text-white font-mono font-black text-[9px] uppercase tracking-wider shadow-md">
            P{player.seatIndex + 1}
          </span>
        )}

        {player.unoCalled && (
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black tracking-widest uppercase shadow-[0_0_15px_rgba(225,29,72,0.8)] animate-pulse whitespace-nowrap z-30">
            UNO!
          </div>
        )}

        <div className="flex items-center gap-2 mb-1 mt-1 relative w-full justify-center">
          {renderAvatarFxBadge(player.seatIndex)}
          {renderPlayerAvatar(player.avatar, player.isBot, isCurrent, 'w-8 h-8 sm:w-9 sm:h-9')}
          <div className="flex flex-col text-left overflow-hidden">
            <span
              className={`text-[11px] sm:text-xs font-bold leading-tight truncate max-w-[70px] sm:max-w-[85px] ${
                isCurrent ? 'text-amber-300 font-black' : 'text-white'
              }`}
              title={player.name}
            >
              {player.name}
            </span>
            <span className="text-[9px] sm:text-[10px] text-amber-300 font-bold">
              {cardCount} lá bài
            </span>
          </div>
        </div>

        {/* Compact Fan of Cards */}
        <div className="flex -space-x-3.5 mt-1 min-h-[36px] items-center justify-center max-w-full overflow-hidden">
          {Array.from({ length: Math.min(7, cardCount) }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="w-5 h-8 sm:w-6 sm:h-9 rounded-[4px] bg-gradient-to-br from-[#8b0032] to-[#400010] border border-white/20 shadow-xs flex items-center justify-center select-none shrink-0"
            >
              <span className="text-[6px] sm:text-[7px] font-black text-white/90">UNO</span>
            </div>
          ))}
          {cardCount > 7 && (
            <span className="text-[9px] text-amber-300 font-bold ml-1">+{cardCount - 7}</span>
          )}
        </div>
      </div>
    );
  };

  if (!gameState) {
    return (
      <main className="w-full min-h-screen bg-background relative overflow-x-hidden flex items-center justify-center">
        <div className="text-primary-container font-headline font-bold text-lg animate-pulse flex items-center gap-2">
          <span className="material-symbols-outlined animate-spin text-2xl">autorenew</span>
          <span>ĐANG CHUẨN BỊ BÀN ĐẤU ONLINE...</span>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`w-full min-h-screen bg-background relative overflow-x-hidden select-none transition-all duration-300 ${
        unoCountdown !== null ? 'animate-emergency-border' : ''
      }`}
    >
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-between p-2 sm:p-4 max-w-7xl mx-auto">
        
        {/* ================= 1. TOP HEADER HUD (GIỐNG 100% GAMEBOARD.JSX) ================= */}
        <div className="w-full flex items-center justify-between pb-1 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExitModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-headline transition-all cursor-pointer shadow-sm"
              title="Rời trận đấu"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span className="hidden sm:inline">Thoát</span>
            </button>

            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-primary-container text-lg sm:text-xl">
                sports_soccer
              </span>
              <span className="font-headline font-black text-sm sm:text-base text-white tracking-wider">
                NEO <span className="text-primary-container">UNO</span>
              </span>
            </div>

            {(room?.isRanked || gameState?.isRanked) ? (
              <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-black tracking-wider uppercase shadow-[0_0_15px_rgba(251,191,36,0.3)] animate-pulse">
                <span className="material-symbols-outlined text-xs text-amber-400">military_tech</span>
                <span>ĐẤU XẾP HẠNG (RANK)</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-black tracking-wider uppercase shadow-sm">
                <span className="material-symbols-outlined text-xs text-purple-400">groups</span>
                <span>GIAO HỮU: {room?.code || gameState?.roomCode}</span>
              </div>
            )}
          </div>

          {/* Center Info: 5-Phút Countdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border shadow-sm transition-colors ${
                (gameState?.matchTimeRemaining || 300) <= 60
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-surface-container-low/90 border-white/10 text-slate-200'
              }`}
              title="Thời gian trận đấu (5 phút). Hết giờ ai ít bài nhất thắng!"
            >
              <span className="material-symbols-outlined text-base text-amber-400">timer</span>
              <span className="font-mono text-xs sm:text-sm font-black tracking-widest">
                {Math.floor((gameState?.matchTimeRemaining || 300) / 60)
                  .toString()
                  .padStart(2, '0')}
                :
                {((gameState?.matchTimeRemaining || 300) % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-primary-container/10 border-primary-container/40 text-primary-container'
                  : 'bg-surface-container-low border-white/10 text-slate-500'
              }`}
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              <span className="material-symbols-outlined text-base">
                {soundEnabled ? 'volume_up' : 'volume_off'}
              </span>
            </button>
          </div>
        </div>

        {/* THÔNG BÁO KHẨN CẤP: ĐẾM NGƯỢC 5 GIÂY BÁO UNO */}
        {unoCountdown !== null && (
          <div className="w-full flex justify-center -mb-2 z-30 animate-bounce">
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-headline font-black px-6 py-2 rounded-full shadow-[0_0_35px_rgba(244,63,94,0.9)] border-2 border-white flex items-center gap-3 text-sm">
              <span className="material-symbols-outlined text-xl animate-spin">alarm</span>
              <span>CÒN 1 LÁ! BÁO UNO TRONG:</span>
              <span className="text-xl bg-black/40 px-2.5 py-0.5 rounded-full text-yellow-300 font-mono">
                {unoCountdown}s
              </span>
            </div>
          </div>
        )}

        {/* ================= 2. TOP POSITION: ĐỐI THỦ PHÍA TRÊN (GIỐNG 100% GAMEBOARD.JSX) ================= */}
        {topOpponent && (
          <div className="w-full flex flex-col items-center justify-start mt-0.5 z-20">
            {(() => {
              const isTopActive = gameState?.currentTurnIndex === topOpponent.seatIndex;
              const cardCount = isDealing ? dealingRound : topOpponent.handCount;

              return (
                <div
                  className={`relative flex flex-col items-center px-6 py-2 rounded-2xl backdrop-blur-md border shadow-md transition-all transform-gpu ${
                    isTopActive
                      ? 'bg-gradient-to-b from-amber-500/25 via-slate-900/95 to-amber-950/40 border-2 border-amber-300 ring-4 ring-amber-400/80 text-white shadow-[0_0_40px_rgba(251,191,36,0.85)] scale-110 z-30 animate-bot-spotlight'
                      : 'bg-surface-container-low/90 border-white/10 text-slate-300 opacity-75'
                  }`}
                >
                  {isTopActive ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-headline font-black text-[9px] uppercase tracking-wider shadow-lg whitespace-nowrap animate-pulse">
                      <span>👑 ĐẾN LƯỢT (P{topOpponent.seatIndex + 1} - {topOpponent.name})</span>
                    </div>
                  ) : (
                    <span className="absolute -top-3 px-2 py-0.5 rounded-full bg-slate-900 border border-white/20 text-white font-mono font-black text-[9px] uppercase tracking-wider shadow-md">
                      P{topOpponent.seatIndex + 1}
                    </span>
                  )}

                  {topOpponent.unoCalled && (
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black tracking-widest uppercase shadow-[0_0_15px_rgba(225,29,72,0.8)] animate-pulse whitespace-nowrap z-30">
                      UNO!
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 mt-0.5 relative">
                    {renderAvatarFxBadge(topOpponent.seatIndex)}
                    {renderPlayerAvatar(
                      topOpponent.avatar,
                      topOpponent.isBot,
                      isTopActive,
                      'w-9 h-9 sm:w-10 sm:h-10'
                    )}
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold tracking-wide ${
                          isTopActive ? 'text-amber-300 font-black' : 'text-white'
                        }`}
                      >
                        {topOpponent.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-amber-300 font-bold">
                        {cardCount} lá bài
                      </span>
                    </div>
                  </div>

                  {/* Fan of Face-down cards */}
                  <div className="flex -space-x-3.5 pt-1 min-h-[42px] items-center">
                    {Array.from({ length: Math.min(8, cardCount) }).map((_, cIdx) => {
                      const rotationDegree = -8 + (cIdx * 16) / Math.max(1, cardCount - 1);
                      return (
                        <div
                          key={cIdx}
                          style={{ transform: `rotate(${rotationDegree}deg)` }}
                          className="w-7 h-10 rounded-[5px] bg-gradient-to-br from-[#8b0032] to-[#400010] border border-white/20 shadow-xs flex items-center justify-center select-none"
                        >
                          <span className="text-[7px] font-black text-white/90">UNO</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ================= 3. MIDDLE SECTION: BÀN ĐẤU TRUNG TÂM (Trái, Giữa, Phải) ================= */}
        <div className="w-full flex items-center justify-between my-auto py-1 relative px-1 sm:px-4 md:px-6">
          
          {/* CÁNH TRÁI */}
          <div className="flex justify-start items-center z-20">
            {renderSidePlayer(leftOpponent, 'left')}
          </div>

          {/* TRUNG TÂM: CENTER PILE (Draw Pile & Discard Pile + Orbit Ring 60 FPS) */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative flex items-center justify-center gap-5 sm:gap-8 md:gap-10 py-5 px-6 sm:px-8 md:px-10 rounded-full bg-surface-container-lowest/40 backdrop-blur-xl border border-white/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">

              {/* 4 MŨI TÊN VÒNG CUNG CHỈ THEO LƯỢT NGƯỜI CHƠI (60 FPS GPU-ACCELERATED) */}
              <div className="absolute -inset-10 sm:-inset-14 md:-inset-16 pointer-events-none z-10 flex items-center justify-center">
                <svg
                  viewBox="0 0 500 320"
                  className="w-full h-full overflow-visible max-w-[620px] max-h-[400px]"
                  fill="none"
                >
                  <defs>
                    <marker
                      id="orbit-arrow-online-inactive"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="rgba(255, 255, 255, 0.25)" />
                    </marker>

                    <marker
                      id="orbit-arrow-online-cyan"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="7"
                      markerHeight="7"
                      orient="auto"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#00d2ff" />
                    </marker>

                    <marker
                      id="orbit-arrow-online-gold"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="7"
                      markerHeight="7"
                      orient="auto"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#fbbf24" />
                    </marker>
                  </defs>

                  {Object.entries(orbitPaths).map(([key, d]) => {
                    const isActive = key === activeArcKey;
                    const isHuman = isMyTurn;

                    return (
                      <g key={key}>
                        {/* Halo phát sáng phía sau khi cung đang active */}
                        {isActive && (
                          <path
                            d={d}
                            stroke={isHuman ? 'rgba(0, 210, 255, 0.45)' : 'rgba(251, 191, 36, 0.45)'}
                            strokeWidth="9"
                            strokeLinecap="round"
                            fill="none"
                          />
                        )}

                        <path
                          d={d}
                          stroke={
                            isActive
                              ? isHuman
                                ? '#00d2ff'
                                : '#fbbf24'
                              : 'rgba(255, 255, 255, 0.2)'
                          }
                          strokeWidth={isActive ? '4' : '2'}
                          strokeDasharray={isActive ? '8 6' : '5 5'}
                          strokeLinecap="round"
                          fill="none"
                          className={isActive ? 'animate-arc-flow' : ''}
                          markerEnd={
                            isActive
                              ? isHuman
                                ? 'url(#orbit-arrow-online-cyan)'
                                : 'url(#orbit-arrow-online-gold)'
                              : 'url(#orbit-arrow-online-inactive)'
                          }
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Draw Pile: Chồng bài rút */}
              <div
                onClick={
                  isMyTurn &&
                  !gameState?.isDealing &&
                  !isDealing &&
                  !isShuffling &&
                  ((gameState?.drawnCountInTurn || 0) < 2 || (gameState?.drawTwoStack || 0) > 0)
                    ? handleDrawCardClick
                    : undefined
                }
                className={`relative flex flex-col items-center group ${
                  isMyTurn &&
                  !gameState?.isDealing &&
                  !isDealing &&
                  !isShuffling &&
                  ((gameState?.drawnCountInTurn || 0) < 2 || (gameState?.drawTwoStack || 0) > 0)
                    ? 'cursor-pointer hover:scale-105 active:scale-95'
                    : 'cursor-not-allowed opacity-60 pointer-events-none'
                } transition-transform duration-200 transform-gpu`}
                title={
                  gameState?.drawTwoStack > 0
                    ? `Bấm để nhận phạt bốc ${gameState.drawTwoStack} lá và mất lượt`
                    : (gameState?.drawnCountInTurn || 0) === 0
                    ? 'Bấm để bốc lá thứ 1 (Nếu đánh được bạn có thể đánh ngay)'
                    : (gameState?.drawnCountInTurn || 0) === 1
                    ? 'Bấm để bốc tiếp lá thứ 2 (Nếu vẫn không đánh được sẽ qua lượt)'
                    : 'Đã bốc tối đa 2 lá trong lượt này'
                }
              >
                <div
                  className={`absolute -top-1.5 -left-1.5 w-18 h-26 sm:w-20 sm:h-28 md:w-24 md:h-34 rounded-[18px] bg-[#660022] border border-white/10 opacity-70 pointer-events-none ${
                    isShuffling ? 'animate-shuffle-left' : ''
                  }`}
                />
                <div
                  className={`absolute -top-0.5 -left-0.5 w-18 h-26 sm:w-20 sm:h-28 md:w-24 md:h-34 rounded-[18px] bg-[#88002d] border border-white/15 opacity-85 pointer-events-none ${
                    isShuffling ? 'animate-shuffle-right' : ''
                  }`}
                />

                {/* Hiệu ứng rút bài bay */}
                {flyingDraw && (
                  <div
                    key={flyingDraw.id}
                    className={`absolute inset-0 pointer-events-none z-50 flex items-center justify-center transform-gpu ${
                      flyingDraw.direction === 'bottom'
                        ? 'animate-draw-bottom'
                        : flyingDraw.direction === 'top'
                        ? 'animate-draw-top'
                        : flyingDraw.direction === 'left'
                        ? 'animate-draw-left'
                        : 'animate-draw-right'
                    }`}
                  >
                    <div className="w-18 h-26 sm:w-20 sm:h-28 md:w-24 md:h-34 rounded-[18px] bg-gradient-to-br from-[#e00050] to-[#990033] border-2 border-white/70 shadow-2xl flex items-center justify-center">
                      <span className="font-headline font-black text-white text-sm sm:text-base italic drop-shadow">
                        UNO
                      </span>
                    </div>
                  </div>
                )}

                <div
                  className={`relative w-18 h-26 sm:w-20 sm:h-28 md:w-24 md:h-34 rounded-[18px] border-2 shadow-2xl flex flex-col items-center justify-center select-none ${
                    isShuffling
                      ? 'bg-gradient-to-br from-indigo-700 to-purple-900 border-cyan-400 animate-pulse animate-reshuffle-vortex'
                      : gameState?.drawTwoStack > 0
                      ? 'bg-gradient-to-br from-amber-600 to-rose-700 border-amber-300 animate-pulse ring-2 ring-amber-400'
                      : isMyTurn && (gameState?.drawnCountInTurn || 0) === 1
                      ? 'bg-gradient-to-br from-cyan-600 to-blue-700 border-cyan-300 ring-2 ring-cyan-400/60 shadow-[0_0_20px_rgba(0,210,255,0.4)]'
                      : isMyTurn
                      ? 'bg-gradient-to-br from-cyan-600 to-blue-700 border-cyan-300 ring-2 ring-cyan-400/50'
                      : 'bg-gradient-to-br from-[#e00050] to-[#990033] border-white/25'
                  }`}
                >
                  <div className="w-10 h-7 sm:w-12 sm:h-8 md:w-16 md:h-10 rounded-full bg-black/25 flex items-center justify-center transform -rotate-12 border border-white/20 mb-1">
                    <span className="font-headline font-black text-[11px] sm:text-xs md:text-sm text-white italic tracking-tighter drop-shadow">
                      UNO
                    </span>
                  </div>

                  <span className="text-[9px] sm:text-[10px] md:text-xs font-headline font-bold text-white uppercase tracking-wider drop-shadow-md text-center px-1">
                    {isShuffling
                      ? 'Đang xáo...'
                      : isDealing
                      ? `Chia ${dealingRound}/7`
                      : gameState?.drawTwoStack > 0
                      ? `Phạt +${gameState.drawTwoStack}`
                      : (gameState?.drawnCountInTurn || 0) === 0
                      ? 'Bốc Lá 1'
                      : (gameState?.drawnCountInTurn || 0) === 1
                      ? 'Bốc Lá 2'
                      : 'Đã Bốc 2/2'}
                  </span>

                  <span className="text-[9px] text-white/70 font-mono mt-0.5">
                    ({gameState?.drawPileCount ?? 108})
                  </span>
                </div>
              </div>

              {/* Discard Pile: Chồng bài đã đánh */}
              <div className="relative flex items-center justify-center min-w-[90px] sm:min-w-[100px] min-h-[130px] sm:min-h-[140px]">
                {/* Hiệu ứng đánh bài bay vào chồng bài bỏ */}
                {flyingPlay && (
                  <div
                    key={flyingPlay.id}
                    className={`absolute inset-0 pointer-events-none z-50 flex items-center justify-center transform-gpu ${
                      flyingPlay.direction === 'bottom'
                        ? 'animate-play-bottom'
                        : flyingPlay.direction === 'top'
                        ? 'animate-play-top'
                        : flyingPlay.direction === 'left'
                        ? 'animate-play-left'
                        : 'animate-play-right'
                    }`}
                  >
                    <UnoCard color={flyingPlay.card.color} value={flyingPlay.card.value} />
                  </div>
                )}

                {gameState?.topCard && !isDealing && !isShuffling ? (
                  <>
                    <div
                      className={`absolute -inset-4 rounded-full blur-2xl animate-pulse pointer-events-none transition-colors duration-500 ${
                        COLOR_GLOW_MAP[gameState.activeColor || gameState.topCard?.color] || COLOR_GLOW_MAP.red
                      }`}
                    />

                    {shockwaveActive && (
                      <div className="absolute inset-0 rounded-full border-cyan-400 animate-shockwave pointer-events-none" />
                    )}

                    <div
                      className={`relative transition-transform duration-300 transform-gpu ${
                        cardPlaySlam ? 'animate-card-slam' : 'rotate-[-3deg]'
                      }`}
                    >
                      <UnoCard color={gameState.topCard.color} value={gameState.topCard.value} />
                    </div>

                    {gameState?.activeColor && (
                      <div className="absolute -bottom-6 flex items-center gap-1 text-[10px] font-bold text-slate-300 bg-black/70 px-2.5 py-0.5 rounded-full border border-white/20 backdrop-blur-sm whitespace-nowrap">
                        <span>Màu hiện tại:</span>
                        <span
                          className={`uppercase font-black ${
                            gameState.activeColor === 'red'
                              ? 'text-rose-400'
                              : gameState.activeColor === 'blue'
                              ? 'text-sky-400'
                              : gameState.activeColor === 'green'
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {COLOR_NAME_MAP[gameState.activeColor] || gameState.activeColor}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-18 h-26 sm:w-20 sm:h-28 md:w-24 md:h-34 rounded-[18px] border-2 border-dashed border-white/20 flex items-center justify-center text-slate-400 text-xs font-mono">
                    {isShuffling ? 'Đang xáo...' : isDealing ? `Chia ${dealingRound}/7` : 'Đang chia...'}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* CÁNH PHẢI */}
          <div className="flex justify-end items-center z-20">
            {renderSidePlayer(rightOpponent, 'right')}
          </div>

          {/* OVERLAY HIỆU ỨNG LÁ CHỨC NĂNG */}
          {activeActionFx && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-40">
              <div className="flex flex-col items-center justify-center py-4 px-8 rounded-2xl bg-black/85 border-2 border-primary-container shadow-[0_0_50px_rgba(0,210,255,0.7)] animate-badge-zoom backdrop-blur-md">
                <span className="font-headline font-black text-2xl md:text-3xl text-primary-container uppercase tracking-wider drop-shadow-md">
                  {activeActionFx.text}
                </span>
                {activeActionFx.subtext && (
                  <span className="text-xs md:text-sm font-semibold text-slate-300 mt-1">
                    {activeActionFx.subtext}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* OVERLAY UNO BÙNG NỔ */}
          {showUnoBurst && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-40">
              <div className="flex flex-col items-center justify-center py-5 px-10 rounded-3xl bg-gradient-to-r from-red-600 to-amber-500 border-2 border-white shadow-[0_0_80px_rgba(244,63,94,0.9)] animate-uno-pop">
                <span className="font-headline font-black text-5xl md:text-6xl text-white italic tracking-tighter drop-shadow-2xl">
                  UNO!
                </span>
                <span className="text-xs font-black text-black bg-white px-3 py-0.5 rounded-full uppercase tracking-widest mt-1">
                  ĐÃ BÁO THÀNH CÔNG 🎉
                </span>
              </div>
            </div>
          )}

          {/* OVERLAY XÁO BÀI & PHÁT BÀI KHỞI ĐẦU CHUẨN BÀN BOT */}
          {(isShuffling || isDealing) && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-40">
              <div className="flex flex-col items-center justify-center py-4 px-8 rounded-2xl bg-black/85 border-2 border-primary-container shadow-[0_0_50px_rgba(0,210,255,0.7)] animate-badge-zoom backdrop-blur-md">
                <span className="font-headline font-black text-xl text-primary-container uppercase tracking-wider">
                  {isShuffling
                    ? '🃏 ĐANG XÁO BỘ BÀI UNO 108 LÁ...'
                    : `🎴 ĐANG CHIA BÀI CHO CÁC VỊ TRÍ (${dealingRound}/7)...`}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* ================= 4. BOTTOM SECTION: BẠN (P1 - PLAYER HAND & HUD GIỐNG 100% GAMEBOARD.JSX) ================= */}
        <div className="w-full flex flex-col items-center gap-2 pt-1 z-20">
          {/* Player Hand - TRÊN */}
          <div
            className={`flex items-end justify-center -space-x-3 md:-space-x-5 hover:-space-x-1 transition-all duration-300 px-4 py-2 overflow-x-auto max-w-full min-h-[140px] rounded-3xl ${
              isMyTurn
                ? 'bg-primary-container/10 border-2 border-primary-container/40 shadow-[0_0_35px_rgba(0,210,255,0.25)]'
                : ''
            }`}
          >
            {displayedPlayerHand.map((card, index) => {
              const isSelectedWild = colorPickerOpen && pendingWildCard?.id === card.id;
              const isOtherCardWhilePicking = colorPickerOpen && pendingWildCard?.id !== card.id;
              const isPlayable = isCardPlayable(card);
              const isShaking = shakingCardId === card.id;
              const isNewlyDealt = isDealing && index === displayedPlayerHand.length - 1;

              return (
                <div
                  key={card.id || `player_card_${index}`}
                  onClick={() => {
                    if (isCardActionLockedRef.current || isCardActionLocked) return;
                    if (isOtherCardWhilePicking) {
                      setColorPickerOpen(false);
                      setPendingWildCard(null);
                      setTimeout(() => handlePlayCardClick(card), 50);
                    } else if (isSelectedWild) {
                      setColorPickerOpen(false);
                      setPendingWildCard(null);
                    } else {
                      handlePlayCardClick(card);
                    }
                  }}
                  className={`transform transition-all duration-200 shrink-0 transform-gpu ${
                    isNewlyDealt
                      ? 'animate-deal-to-player'
                      : isSelectedWild
                      ? '-translate-y-7 scale-110 z-40 ring-4 ring-primary-container rounded-2xl shadow-[0_0_30px_rgba(0,210,255,0.8)] cursor-pointer'
                      : isOtherCardWhilePicking
                      ? 'opacity-40 hover:opacity-80 scale-95 transition-opacity cursor-pointer'
                      : !isMyTurn || gameState?.isDealing || isDealing || isShuffling || isCardActionLockedRef.current || isCardActionLocked
                      ? 'opacity-40 grayscale-[40%] pointer-events-none'
                      : isPlayable
                      ? 'hover:-translate-y-5 hover:scale-105 hover:shadow-2xl hover:z-50 cursor-pointer ring-2 ring-primary-container/90 rounded-2xl shadow-[0_0_20px_rgba(0,210,255,0.6)]'
                      : 'opacity-40 grayscale-[40%] cursor-not-allowed'
                  } ${isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
                >
                  <UnoCard color={card.color} value={card.value} />
                </div>
              );
            })}
          </div>

          {/* Player HUD - DƯỚI */}
          <div
            className={`w-full max-w-xl flex items-center justify-between px-5 py-2.5 rounded-full backdrop-blur-md shadow-md relative transition-all duration-300 transform-gpu ${
              isMyTurn
                ? 'bg-gradient-to-r from-primary-container/30 via-cyan-950/90 to-primary-container/30 border-2 border-primary-container ring-4 ring-primary-container/70 shadow-[0_0_45px_rgba(0,210,255,0.7)] scale-102 animate-player-spotlight'
                : 'bg-surface-container-low/90 border border-white/10 opacity-80'
            }`}
          >
            {/* Banner nổi bật khi đến lượt bạn */}
            {isMyTurn && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-primary-container text-black font-headline font-black text-[10px] uppercase tracking-wider shadow-[0_0_20px_rgba(0,210,255,0.8)] animate-pulse whitespace-nowrap z-30">
                <span className="material-symbols-outlined text-xs">play_circle</span>
                <span>✨ LƯỢT ĐÁNH CỦA BẠN ({gameState?.turnTimeRemaining}s)</span>
              </div>
            )}

            <div className="flex items-center gap-2.5 relative">
              {renderAvatarFxBadge(gameState?.mySeatIndex)}
              <div className="relative">
                {renderPlayerAvatar(
                  myPlayer?.avatar || user?.avatar,
                  false,
                  isMyTurn,
                  'w-9 h-9 sm:w-10 sm:h-10'
                )}
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-slate-900 border border-cyan-400 text-[8px] font-mono font-bold text-cyan-300">
                  P{((gameState?.mySeatIndex ?? 0) + 1)}
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-xs font-bold leading-tight ${
                    isMyTurn ? 'text-primary-container font-black' : 'text-white'
                  }`}
                >
                  {myDisplayName} (Bạn)
                </span>
                <span className="text-[10px] text-slate-400">
                  {displayedPlayerHand.length} lá trên tay
                </span>
              </div>
            </div>

            {isMyTurn &&
              (gameState?.drawnCountInTurn || 0) > 0 &&
              !gameState?.isDealing &&
              !isDealing &&
              !isShuffling && (
                <button
                  onClick={handlePassTurnClick}
                  className="px-3.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/50 text-amber-300 text-xs font-bold transition-colors cursor-pointer animate-pulse"
                  title="Bấm để kết thúc lượt nếu không muốn đánh lá bài nào"
                >
                  Bỏ Lượt ↷
                </button>
              )}

            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border transition-colors ${
                  (gameState?.turnTimeRemaining || 15) <= 5
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                    : isMyTurn
                    ? 'bg-primary-container/25 border-primary-container text-primary-container font-black shadow-[0_0_15px_rgba(0,210,255,0.5)]'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
                title="Thời gian lượt đánh (15s)"
              >
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>{gameState?.turnTimeRemaining || 15}s</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ================= NÚT BÁO UNO TO NỔI BẬT Ở GÓC DƯỚI PHẢI (HỖ TRỢ CẢ HÔ UNO & BẮT PHẠT ĐỐI THỦ) ================= */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-40 flex flex-col items-center">
        {(() => {
          const handCount = displayedPlayerHand.length;
          const hasCalledUno = myPlayer?.unoCalled || false;
          const canCallUno =
            handCount <= 2 && handCount > 0 && !hasCalledUno && !gameState?.isDealing && !isDealing && !isShuffling;

          // Kiểm tra xem có đối thủ nào (kể cả Bot) còn đúng 1 lá mà CHƯA hô UNO không (BẮT UNO)
          const forgotOpponent = (gameState?.players || []).find(
            (p) => p.seatIndex !== gameState?.mySeatIndex && p.handCount === 1 && !p.unoCalled
          );
          const canCatchUno = Boolean(forgotOpponent) && !canCallUno && !gameState?.isDealing && !isDealing && !isShuffling;

          const isOverTwoCards = handCount > 2;

          return (
            <button
              onClick={handleCallUnoClick}
              disabled={!canCallUno && !hasCalledUno && !canCatchUno}
              className={`relative group flex flex-col items-center justify-center transition-all duration-300 rounded-full select-none transform-gpu ${
                canCallUno
                  ? handCount === 1
                    ? 'w-22 h-22 sm:w-26 sm:h-26 bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 border-4 border-white shadow-[0_0_50px_rgba(244,63,94,0.95)] ring-4 ring-yellow-400 hover:scale-110 active:scale-95 animate-bounce cursor-pointer'
                    : 'w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 border-3 border-white shadow-[0_0_35px_rgba(245,158,11,0.85)] ring-2 ring-yellow-300 hover:scale-105 active:scale-95 cursor-pointer'
                  : canCatchUno
                  ? 'w-22 h-22 sm:w-26 sm:h-26 bg-gradient-to-tr from-purple-600 via-rose-600 to-amber-400 border-4 border-yellow-300 shadow-[0_0_55px_rgba(234,179,8,0.9)] ring-4 ring-amber-400 hover:scale-110 active:scale-95 animate-pulse cursor-pointer'
                  : hasCalledUno
                  ? 'w-18 h-18 sm:w-20 sm:h-20 bg-emerald-600/90 border-2 border-emerald-300 text-white shadow-[0_0_25px_rgba(16,185,129,0.7)] opacity-90 cursor-default'
                  : 'w-18 h-18 sm:w-20 sm:h-20 bg-surface-container-high/40 border border-white/10 text-slate-500 opacity-30 cursor-not-allowed'
              }`}
              title={
                canCatchUno
                  ? `BẮT QUẢ TANG! ${forgotOpponent.name} còn 1 lá mà chưa hô UNO! Bấm ngay để phạt 2 lá bài!`
                  : hasCalledUno
                  ? 'Bạn đã báo UNO thành công!'
                  : handCount === 1
                  ? 'BÁO UNO NGAY! (Còn đúng 1 lá bài trên tay)'
                  : handCount === 2
                  ? 'BÁO TRƯỚC UNO! (Chuẩn bị đánh lá áp chót)'
                  : `Không thể báo UNO khi còn ${handCount} lá bài (Chỉ khả dụng khi còn 1 hoặc 2 lá)`
              }
            >
              {canCallUno && (
                <span className="absolute -top-3 px-2 py-0.5 rounded-full bg-yellow-400 text-black font-black text-[9px] uppercase tracking-tighter shadow-md animate-pulse whitespace-nowrap">
                  {handCount === 1 ? 'BẤM NGAY!' : 'BÁO TRƯỚC'}
                </span>
              )}

              {canCatchUno && (
                <span className="absolute -top-3 px-2 py-0.5 rounded-full bg-amber-300 text-black font-black text-[9px] uppercase tracking-tighter shadow-md animate-bounce whitespace-nowrap">
                  🎯 BẮT PHẠT!
                </span>
              )}

              <span
                className={`font-headline font-black italic tracking-tighter drop-shadow-lg ${
                  canCallUno || canCatchUno
                    ? 'text-2xl sm:text-3xl text-white'
                    : hasCalledUno
                    ? 'text-lg sm:text-xl text-emerald-100'
                    : 'text-base sm:text-lg text-slate-500'
                }`}
              >
                {canCatchUno ? 'BẮT!' : 'UNO'}
              </span>

              <span
                className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${
                  canCatchUno
                    ? 'text-amber-200'
                    : hasCalledUno
                    ? 'text-emerald-200'
                    : canCallUno
                    ? 'text-white/90'
                    : 'text-slate-500'
                }`}
              >
                {canCatchUno
                  ? 'PHẠT 2 LÁ'
                  : hasCalledUno
                  ? '✓ ĐÃ BÁO'
                  : canCallUno
                  ? handCount === 1
                    ? 'BÁO UNO'
                    : 'BÁO TRƯỚC'
                  : 'KHÓA'}
              </span>

              {isOverTwoCards && !canCatchUno && (
                <span className="absolute -bottom-2 px-1.5 py-0.2 rounded-full bg-black/80 border border-white/10 text-[8px] text-slate-400 font-mono">
                  {handCount} lá
                </span>
              )}
            </button>
          );
        })()}
      </div>

      {/* ================= MODAL CHỌN MÀU (WILD COLOR PICKER - NỀN TRONG SUỐT NHÌN BÀI) ================= */}
      {colorPickerOpen && pendingWildCard && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-none flex flex-col items-center justify-center pb-28 sm:pb-36 z-50 animate-fade-in p-4"
          onClick={() => {
            setColorPickerOpen(false);
            setPendingWildCard(null);
          }}
        >
          <div
            className="bg-[#121826]/95 border-2 border-primary-container/50 p-4 sm:p-5 rounded-3xl max-w-sm w-full shadow-[0_0_50px_rgba(0,210,255,0.35)] text-center flex flex-col gap-3.5 relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút X đóng/hủy chọn */}
            <button
              onClick={() => {
                setColorPickerOpen(false);
                setPendingWildCard(null);
              }}
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Hủy chọn lá Wild này"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            {/* Header Dialog */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">
                {pendingWildCard.value === 'wild_draw_four' ? '💥' : '🌈'}
              </span>
              <div>
                <h3 className="font-headline font-black text-base sm:text-lg text-white uppercase tracking-wide">
                  {pendingWildCard.value === 'wild_draw_four'
                    ? 'CHỌN MÀU CHO LÁ WILD +4'
                    : 'CHỌN MÀU CHO LÁ WILD'}
                </h3>
                <p className="text-[10px] text-slate-400">
                  Chọn 1 trong 4 màu sắc bên dưới
                </p>
              </div>
            </div>

            {/* 4 Nút Chọn Màu */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  key: 'red',
                  name: 'MÀU ĐỎ',
                  count: myHandColorStats.red,
                  bg: 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400',
                  ring: 'ring-rose-400',
                },
                {
                  key: 'blue',
                  name: 'XANH DƯƠNG',
                  count: myHandColorStats.blue,
                  bg: 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400',
                  ring: 'ring-cyan-400',
                },
                {
                  key: 'green',
                  name: 'XANH LÁ',
                  count: myHandColorStats.green,
                  bg: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400',
                  ring: 'ring-emerald-400',
                },
                {
                  key: 'yellow',
                  name: 'MÀU VÀNG',
                  count: myHandColorStats.yellow,
                  bg: 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black',
                  ring: 'ring-amber-300',
                },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => executePlayCard(pendingWildCard, c.key)}
                  className={`${c.bg} py-3.5 px-3 rounded-2xl font-headline font-black text-xs sm:text-sm uppercase tracking-wider text-white shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer ring-offset-2 ring-offset-black hover:ring-2 ${c.ring} flex items-center justify-between`}
                >
                  <span className={c.key === 'yellow' ? 'text-black' : 'text-white'}>
                    {c.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 text-white font-mono font-bold">
                    {c.count} lá
                  </span>
                </button>
              ))}
            </div>

            {/* Nút HỦY CHỌN / ĐỔI LÁ KHÁC */}
            <button
              type="button"
              onClick={() => {
                setColorPickerOpen(false);
                setPendingWildCard(null);
              }}
              className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-300 hover:text-white font-headline text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">undo</span>
              <span>HỦY CHỌN (ĐỔI LÁ KHÁC)</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL KẾT QUẢ VÁN ĐẤU (GAME OVER) ================= */}
      {gameResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-body">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-[#121622] border-2 border-primary-container/50 shadow-[0_0_80px_rgba(0,210,255,0.4)] flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-3xl shadow-lg mb-2">
              🏆
            </div>
            <h2 className="font-headline font-black text-2xl text-white uppercase tracking-wider mb-1">
              KẾT THÚC TRẬN ĐẤU!
            </h2>
            <div className="text-sm text-cyan-300 font-bold mb-3">
              👑 Người chiến thắng: <strong className="text-amber-300">{gameResult.winner}</strong>
            </div>

            {/* THÔNG BÁO CHẾ ĐỘ XẾP HẠNG / GIAO HỮU */}
            {gameResult.isRanked ? (
              <div className="w-full mb-4">
                <div className="mb-3 px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-headline font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                  <span className="material-symbols-outlined text-base text-amber-400">military_tech</span>
                  <span>TRẬN ĐẤU GHÉP NHANH XẾP HẠNG (RANK MATCH)</span>
                </div>

                {(() => {
                  const myRank = (gameResult.rankings || []).find(
                    (r) =>
                      String(r.userId) === String(user?.id || user?._id) ||
                      r.name === (user?.nickname || user?.name)
                  );
                  if (!myRank) return null;

                  return (
                    <div className="p-3.5 rounded-2xl bg-black/50 border border-cyan-500/30 flex items-center justify-around text-center shadow-inner">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-mono">Thứ Hạng</span>
                        <span className="text-sm sm:text-base font-headline font-black text-amber-300">
                          #{myRank.rank} {myRank.rank === 1 ? '🥇 Nhất' : myRank.rank === 2 ? '🥈 Nhì' : myRank.rank === 3 ? '🥉 Ba' : '4️⃣ Bét'}
                        </span>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-mono">Điểm Rank ELO</span>
                        <span
                          className={`text-sm sm:text-base font-headline font-black ${
                            (myRank.eloDelta || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {(myRank.eloDelta || 0) > 0 ? `+${myRank.eloDelta}` : myRank.eloDelta} ELO
                        </span>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-mono">ELO Mới</span>
                        <span className="text-sm sm:text-base font-headline font-black text-cyan-300">
                          {myRank.newElo || 1000}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="mb-4 px-3.5 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-[11px] text-purple-200 leading-relaxed">
                🛡️ <strong>Chế độ Giao Hữu:</strong> Trận đấu bạn bè vui vẻ, kết quả này{' '}
                <strong>KHÔNG</strong> tính điểm Rank ELO.
              </div>
            )}

            {/* Bảng Xếp Hạng Ván */}
            <div className="w-full flex flex-col gap-2 mb-6">
              {(gameResult.rankings || []).map((r, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    idx === 0
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.15)]'
                      : 'bg-surface-container-high/40 border-white/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '4️⃣'}</span>
                    <span>
                      {r.name} {r.isBot && '(Bot AI)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {gameResult.isRanked && r.eloDelta !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                          r.eloDelta > 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : r.eloDelta < 0
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-slate-500/20 text-slate-300'
                        }`}
                      >
                        {r.eloDelta > 0 ? `+${r.eloDelta}` : r.eloDelta} ELO
                      </span>
                    )}
                    <span className="text-slate-400 font-mono text-[11px]">{r.cardsRemaining} lá</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onBack}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary-container to-cyan-400 text-black font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              QUAY VỀ SẢNH CHÍNH
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL XÁC NHẬN RỜI PHÒNG (GIỐNG GAMEBOARD.JSX) ================= */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-body">
          <div className="p-6 rounded-3xl bg-[#121622] border border-white/20 shadow-2xl flex flex-col items-center text-center max-w-sm">
            <span className="material-symbols-outlined text-4xl text-rose-400 mb-2">logout</span>
            <h3 className="font-headline font-black text-base text-white uppercase tracking-wider mb-2">
              BẠN MUỐN RỜI PHÒNG?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Đây là phòng giao hữu bạn bè (không tính điểm Rank ELO). Nếu bạn thoát, các người chơi còn lại vẫn có thể tiếp tục chơi.
            </p>

            <div className="flex gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setIsExitModalOpen(false)}
                className="flex-1 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
              >
                Ở Lại
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExitModalOpen(false);
                  socket.emit('room:leave');
                  onBack();
                }}
                className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md"
              >
                Xác Nhận Rời
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
