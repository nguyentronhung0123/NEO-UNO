import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import UnoCard from '../components/UnoCard';
import LeaderboardModal, { getRankTier } from '../components/LeaderboardModal';
import MatchHistoryModal from '../components/MatchHistoryModal';
import { initGameState, calculateHandPoints, getMaxCardPoint } from '../utils/gameLogic.js';
import { shuffleDeck } from '../utils/deck.js';
import { soundEngine } from '../utils/audioFx.js';
import { matchApi } from '../apis/matchApi.js';
import { saveActiveMatch, clearActiveMatch, forfeitActiveMatch, getActiveMatch } from '../utils/activeMatchStorage.js';
import EmoteWheel from '../components/EmoteWheel';
import EmoteOverlay from '../components/EmoteOverlay';

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

export default function GameBoard({ matchConfig, onBack, restoredMatchState }) {
  // Cấu hình bàn đấu: Mặc định 3 Bot (bàn 4 người 4 góc) & 5 phút
  const botCount = Math.max(1, Math.min(3, matchConfig?.botCount || 3));
  const timeLimit = matchConfig?.timeLimit || 300;
  const totalPlayers = 1 + botCount;

  // Cảnh báo bỏ cuộc khi ấn nút Thoát
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isSubmittingForfeit, setIsSubmittingForfeit] = useState(false);

  const [gameState, setGameState] = useState(() => {
    if (restoredMatchState && restoredMatchState.playerHand && restoredMatchState.bots) {
      return {
        playerHand: restoredMatchState.playerHand || [],
        bots: restoredMatchState.bots || [],
        discardPile: restoredMatchState.discardPile || [],
        drawPile: restoredMatchState.drawPile || [],
      };
    }
    return null;
  });
  const [currentTurnIndex, setCurrentTurnIndex] = useState(() => restoredMatchState?.currentTurnIndex ?? 0);
  const [turnDirection, setTurnDirection] = useState(() => restoredMatchState?.turnDirection ?? 1);
  const [activeColor, setActiveColor] = useState(() => {
    if (restoredMatchState?.activeColor) return restoredMatchState.activeColor;
    const starter = restoredMatchState?.discardPile?.[restoredMatchState.discardPile.length - 1];
    return starter?.color || null;
  });
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState(null);
  const [statusMessage, setStatusMessage] = useState(() => {
    if (restoredMatchState) return '⚡ ĐÃ KHÔI PHỤC VÁN ĐẤU! BẠN CÓ THỂ TIẾP TỤC ĐÁNH.';
    return '';
  });
  const [shakingCardId, setShakingCardId] = useState(null);

  // ÂM THANH
  const [soundEnabled, setSoundEnabled] = useState(true);

  // HIỆU ỨNG XÁO BÀI & CHIA BÀI
  const [isShuffling, setIsShuffling] = useState(() => !restoredMatchState);
  const [isDealing, setIsDealing] = useState(false);
  const [dealingRound, setDealingRound] = useState(0);

  // HIỆU ỨNG TÁI CHẾ VÀ XÁO BÀI
  const [isReshufflingDeck, setIsReshufflingDeck] = useState(false);

  // HIỆU ỨNG ĐÁNH BÀI
  const [cardPlaySlam, setCardPlaySlam] = useState(false);
  const [shockwaveActive, setShockwaveActive] = useState(false);

  // HIỆU ỨNG RÚT BÀI & ĐÁNH BÀI BAY (FLYING CARDS FX)
  const [flyingDraw, setFlyingDraw] = useState(null); // { direction: 'bottom' | 'top' | 'left' | 'right', id: number }
  const [flyingPlay, setFlyingPlay] = useState(null); // { direction: 'bottom' | 'top' | 'left' | 'right', card: Card, id: number }

  // HIỆU ỨNG LÁ CHỨC NĂNG
  const [activeActionFx, setActiveActionFx] = useState(null);

  // HIỆU ỨNG TRỰC TIẾP TRÊN AVATAR (CẤM LƯỢT, +2, +4)
  const [activeAvatarFx, setActiveAvatarFx] = useState(null);
  const avatarFxTimerRef = useRef(null);

  // HIỆU ỨNG UNO BÙNG NỔ
  const [showUnoBurst, setShowUnoBurst] = useState(false);

  // LUẬT CỘNG DỒN LÁ +2
  const [drawTwoStack, setDrawTwoStack] = useState(() => restoredMatchState?.drawTwoStack ?? 0);

  // TRẠNG THÁI BỐC BÀI TỪNG LÁ
  const [drawnCountInTurn, setDrawnCountInTurn] = useState(() => restoredMatchState?.drawnCountInTurn ?? 0);
  const [isDrawing, setIsDrawing] = useState(false);

  // KHÓA LƯỢT TRONG KHI HIỆU ỨNG CHUYỂN TIẾP ĐANG CHẠY (CHỐNG NHẢY LƯỢT / CƯỚP LƯỢT)
  const [isTurnTransitioning, setIsTurnTransitioning] = useState(false);

  // ĐẾM NGƯỢC 15 GIÂY MỖI LƯỢT (THEO YÊU CẦU NGƯỜI DÙNG)
  const TURN_TIME_LIMIT = 15;
  const [turnTimer, setTurnTimer] = useState(TURN_TIME_LIMIT);

  // ĐẾM NGƯỢC 5 PHÚT TRẬN ĐẤU (300s -> 0s)
  const [matchTimeRemaining, setMatchTimeRemaining] = useState(() => restoredMatchState?.matchTimeRemaining ?? timeLimit);
  const matchTimeRemainingRef = useRef(matchTimeRemaining);
  matchTimeRemainingRef.current = matchTimeRemaining;

  // ĐẾM NGƯỢC 5 GIÂY BÁO UNO
  const [unoCountdown, setUnoCountdown] = useState(null);
  const [hasCalledUno, setHasCalledUno] = useState(false);

  // Trạng thái kết thúc trận đấu & Bảng xếp hạng
  const [winner, setWinner] = useState(null);
  const [endGameRankings, setEndGameRankings] = useState(null);
  const [endGameReason, setEndGameReason] = useState('out_of_cards');
  const [matchResultRewards, setMatchResultRewards] = useState(null);
  const [autoReturnCountdown, setAutoReturnCountdown] = useState(120);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Danh sách các biểu cảm đang hiển thị trên bàn đấu (Task 3)
  const [activeEmotes, setActiveEmotes] = useState([]);

  // Refs chống stale state
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const currentTurnIndexRef = useRef(currentTurnIndex);
  currentTurnIndexRef.current = currentTurnIndex;

  // Khóa đồng bộ chống click nhanh đánh 2-3 lá bài trong cùng 1 lượt (LUẬT: 1 LƯỢT = 1 LÁ)
  const isCardActionLockedRef = useRef(false);

  const turnDirectionRef = useRef(turnDirection);
  turnDirectionRef.current = turnDirection;

  const activeColorRef = useRef(activeColor);
  activeColorRef.current = activeColor;

  const isDrawingRef = useRef(isDrawing);
  isDrawingRef.current = isDrawing;

  const isDealingRef = useRef(isDealing);
  isDealingRef.current = isDealing;

  const isShufflingRef = useRef(isShuffling);
  isShufflingRef.current = isShuffling;

  const isReshufflingDeckRef = useRef(isReshufflingDeck);
  isReshufflingDeckRef.current = isReshufflingDeck;

  const drawTwoStackRef = useRef(drawTwoStack);
  drawTwoStackRef.current = drawTwoStack;

  const isTurnTransitioningRef = useRef(isTurnTransitioning);
  isTurnTransitioningRef.current = isTurnTransitioning;

  const winnerRef = useRef(winner);
  winnerRef.current = winner;

  const unoPenalizedRef = useRef(false);
  const unoHandledRef = useRef(false);
  const timeoutHandledRef = useRef(false);

  const shuffleTimerRef = useRef(null);
  const dealIntervalRef = useRef(null);
  const starterFlipTimerRef = useRef(null);
  const botTimerRef = useRef(null);
  const actionTimerRef = useRef(null);

  const isPlayerTurn = currentTurnIndex === 0;

  // Lấy thông tin người chơi theo vị trí ghế (Seat Index 0..totalPlayers - 1)
  const getPlayerInfo = useCallback(
    (seatIdx) => {
      if (seatIdx === 0) {
        return {
          id: 'player',
          seatIndex: 0,
          playerNumber: 1,
          displayName: '[P1] Bạn',
          name: 'Bạn',
          isHuman: true,
          color: '#00d2ff',
          avatar: '👤',
          position: 'bottom',
        };
      }
      const bot = gameStateRef.current?.bots?.[seatIdx - 1];
      const pNum = seatIdx + 1;
      return {
        id: bot?.id || `bot${seatIdx}`,
        seatIndex: seatIdx,
        playerNumber: pNum,
        displayName: `[P${pNum}] ${bot?.name || `Bot ${seatIdx}`}`,
        name: bot?.name || `Bot ${seatIdx}`,
        isHuman: false,
        color: bot?.color || '#ec4899',
        avatar: bot?.avatar || '🤖',
        position: bot?.position || 'top',
      };
    },
    []
  );

  // Xác định hướng bay (bottom / top / left / right) của người chơi/bot để chạy animation
  const getPlayerDirection = useCallback((target) => {
    if (target === 'player' || target === 0) return 'bottom';
    const currentBots = gameStateRef.current?.bots || [];
    const bot =
      currentBots.find((b) => b.id === target) ||
      (typeof target === 'number' ? currentBots[target - 1] : null);
    return bot?.position || 'top';
  }, []);

  // Lấy tọa độ % (x, y) trên bàn cờ cho bóng thoại và đạo cụ ném (Task 3)
  const getSeatPosition = useCallback((seatIndex) => {
    if (seatIndex === 0) return { x: 50, y: 84 };
    const botIdx = seatIndex - 1;
    const bot = gameStateRef.current?.bots?.[botIdx];
    if (!bot) return { x: 50, y: 50 };
    if (bot.position === 'left') return { x: 12, y: 48 };
    if (bot.position === 'top') return { x: 50, y: 16 };
    if (bot.position === 'right') return { x: 88, y: 48 };
    return { x: 50, y: 50 };
  }, []);

  // Danh sách người chơi để gửi biểu cảm / ném đạo cụ
  const allPlayersList = useMemo(() => {
    const list = [{ seatIndex: 0, name: 'Bạn' }];
    (gameState?.bots || []).forEach((b, idx) => {
      list.push({ seatIndex: idx + 1, name: b.name });
    });
    return list;
  }, [gameState?.bots]);

  // Gửi biểu cảm và phản hồi tương tác Bot AI (Task 3)
  const handleSendEmote = useCallback(
    ({ emote, targetSeatIndex }) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newEmote = {
        id,
        senderSeatIndex: 0,
        senderName: 'Bạn',
        emote,
        targetSeatIndex,
        timestamp: Date.now(),
      };
      setActiveEmotes((prev) => [...prev, newEmote]);

      const isProjectile = emote?.type === 'projectile' && targetSeatIndex !== null && targetSeatIndex !== undefined;
      if (soundEnabled && emote?.sound) {
        soundEngine.playEmoteEffect(emote.sound, isProjectile);
      }

      setTimeout(() => {
        setActiveEmotes((prev) => prev.filter((item) => item.id !== id));
      }, 3400);

      // Bot phản hồi nếu bị ném đạo cụ
      if (isProjectile && targetSeatIndex !== null) {
        const targetBotIdx = targetSeatIndex - 1;
        const targetBot = gameStateRef.current?.bots?.[targetBotIdx];
        if (targetBot) {
          setTimeout(() => {
            const botReactions = [
              { id: 'rage', icon: '😡', label: 'Sao ném tui?!', type: 'emoji', sound: 'zap' },
              { id: 'cry', icon: '😭', label: 'Đau quá bạn ơi!', type: 'emoji', sound: 'splat' },
              { id: 'tomato', icon: '🍅', label: 'Ném trả nè!', type: 'projectile', sound: 'splat' },
              { id: 'salty', icon: '😤', label: 'Chờ đấy nhé!', type: 'text', sound: 'splat' },
            ];
            const chosen = botReactions[Math.floor(Math.random() * botReactions.length)];
            const botEmoteId = `${Date.now()}_bot_${Math.random().toString(36).substring(2, 7)}`;
            setActiveEmotes((prev) => [
              ...prev,
              {
                id: botEmoteId,
                senderSeatIndex: targetSeatIndex,
                senderName: targetBot.name,
                emote: chosen,
                targetSeatIndex: chosen.type === 'projectile' ? 0 : null,
                timestamp: Date.now(),
              },
            ]);
            if (soundEnabled && chosen.sound) {
              soundEngine.playEmoteEffect(chosen.sound, chosen.type === 'projectile');
            }
            setTimeout(() => {
              setActiveEmotes((prev) => prev.filter((item) => item.id !== botEmoteId));
            }, 3400);
          }, 1000);
        }
      }
    },
    [soundEnabled]
  );

  // Tính toán vị trí người tiếp theo theo chiều xoay (1: Ngược chiều kim đồng hồ ↺, -1: Thuận chiều ↻)
  const getNextTurnIndex = useCallback(
    (current, steps = 1, direction = turnDirectionRef.current) => {
      const raw = (current + steps * direction) % totalPlayers;
      return raw < 0 ? raw + totalPlayers : raw;
    },
    [totalPlayers]
  );

  // Chuyển lượt sang người kế tiếp (Dọn dẹp triệt để timer cũ để chống nhảy lượt)
  const advanceTurn = useCallback(
    (steps = 1, forcedDirection = null) => {
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current);
        botTimerRef.current = null;
      }
      if (actionTimerRef.current) {
        clearTimeout(actionTimerRef.current);
        actionTimerRef.current = null;
      }

      const dir = forcedDirection !== null ? forcedDirection : turnDirectionRef.current;
      setCurrentTurnIndex((prev) => {
        const nextSeat = getNextTurnIndex(prev, steps, dir);
        currentTurnIndexRef.current = nextSeat;
        return nextSeat;
      });
      setTurnTimer(TURN_TIME_LIMIT);
      setDrawnCountInTurn(0);
      isCardActionLockedRef.current = false; // Mở khóa đánh bài cho lượt mới
      setIsTurnTransitioning(false);
    },
    [getNextTurnIndex]
  );

  // Hiệu ứng lá chức năng
  const triggerActionFx = useCallback((type, text, subtext = '') => {
    setActiveActionFx({ type, text, subtext });
    soundEngine.playActionSound(type);
    setTimeout(() => {
      setActiveActionFx(null);
    }, 1300);
  }, []);

  // Hiệu ứng gắn trực tiếp trên Avatar người chơi (Cấm lượt, +2, +4)
  const triggerAvatarFx = useCallback((targetId, type, text, icon = 'warning', duration = 2600) => {
    if (avatarFxTimerRef.current) clearTimeout(avatarFxTimerRef.current);
    setActiveAvatarFx({ targetId, type, text, icon });
    avatarFxTimerRef.current = setTimeout(() => {
      setActiveAvatarFx(null);
    }, duration);
  }, []);

  // Helper render huy hiệu hiệu ứng trực tiếp trên Avatar
  const renderAvatarFxBadge = (targetId) => {
    if (!activeAvatarFx || activeAvatarFx.targetId !== targetId) return null;

    const { type, text, icon } = activeAvatarFx;

    let bgClasses = 'bg-rose-600 text-white border-white shadow-[0_0_25px_rgba(244,63,94,0.95)]';
    let animClass = 'animate-bounce';

    if (type === 'skip') {
      bgClasses = 'bg-red-600 text-white border-white/90 shadow-[0_0_30px_rgba(220,38,38,0.95)] ring-2 ring-red-400';
      animClass = 'animate-skip-slam';
    } else if (type === 'wild_draw_four') {
      bgClasses = 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white border-yellow-300 shadow-[0_0_35px_rgba(168,85,247,0.95)] ring-2 ring-yellow-400';
      animClass = 'animate-action-pop';
    } else if (type === 'draw_two' || type === 'draw_two_penalize') {
      bgClasses = 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.95)] ring-2 ring-amber-400';
      animClass = 'animate-pulse';
    }

    return (
      <div className={`absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap ${animClass}`}>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border-2 font-headline font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-2xl drop-shadow-xl ${bgClasses}`}>
          {icon && <span className="material-symbols-outlined text-sm">{icon}</span>}
          <span>{text}</span>
        </div>
      </div>
    );
  };

  // Hiệu ứng đập bài
  const triggerCardImpact = useCallback(() => {
    setCardPlaySlam(true);
    setShockwaveActive(true);
    soundEngine.playCardSlam();
    setTimeout(() => setCardPlaySlam(false), 400);
    setTimeout(() => setShockwaveActive(false), 650);
  }, []);

  // Tổng kết thứ hạng khi kết thúc ván (Hết 5 phút HOẶC Hết bài)
  const finalizeRankings = useCallback(
    (customWinnerId = null, reason = 'out_of_cards') => {
      const current = gameStateRef.current;
      if (!current) return;

      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);

      const playerObj = {
        id: 'player',
        name: 'Bạn (P1)',
        isHuman: true,
        avatar: '👤',
        color: '#00d2ff',
        hand: current.playerHand || [],
        cardCount: (current.playerHand || []).length,
      };

      const botsList = (current.bots || []).map((b, idx) => ({
        id: b.id,
        name: `[P${idx + 2}] ${b.name}`,
        isHuman: false,
        avatar: b.avatar,
        color: b.color,
        badge: b.badge,
        position: b.position,
        hand: b.hand || [],
        cardCount: (b.hand || []).length,
      }));

      const allContenders = [playerObj, ...botsList];

      // TÍNH TOÁN ĐIỂM SỐ BÀI CÒN LẠI VÀ ĐIỂM LÁ CAO NHẤT CHO TỪNG NGƯỜI CHƠI
      allContenders.forEach((c) => {
        c.handPoints = calculateHandPoints(c.hand);
        c.maxCardPoint = getMaxCardPoint(c.hand);
      });

      if (reason === 'out_of_cards' && customWinnerId) {
        allContenders.forEach((c) => {
          if (c.id === customWinnerId) {
            c.hand = [];
            c.cardCount = 0;
            c.handPoints = 0;
            c.maxCardPoint = 0;
          }
        });
        allContenders.sort((a, b) => {
          if (a.id === customWinnerId) return -1;
          if (b.id === customWinnerId) return 1;
          // Tie-break cho các hạng sau: ít bài hơn xếp trên, nếu bằng số lá thì ít điểm bài hơn xếp trên
          if (a.cardCount !== b.cardCount) return a.cardCount - b.cardCount;
          if (a.handPoints !== b.handPoints) return a.handPoints - b.handPoints;
          return a.maxCardPoint - b.maxCardPoint;
        });
      } else {
        // HẾT 5 PHÚT (TIMEOUT):
        // 1. Ưu tiên 1: Ai còn ít lá bài nhất trên tay xếp trên
        // 2. Ưu tiên 2 (TIE-BREAKER): Nếu bằng số lá bài -> Ai có tổng điểm bài nhỏ hơn xếp trên!
        //    (Lá số: 0-9đ, Lá chức năng: 20đ, Lá Wild: 50đ. Ai giữ ít điểm phạt hơn thắng)
        // 3. Ưu tiên 3: Nếu bằng cả số lá và tổng điểm -> Ai có lá bài lớn nhất nhỏ hơn xếp trên
        allContenders.sort((a, b) => {
          if (a.cardCount !== b.cardCount) {
            return a.cardCount - b.cardCount;
          }
          if (a.handPoints !== b.handPoints) {
            return a.handPoints - b.handPoints;
          }
          return a.maxCardPoint - b.maxCardPoint;
        });
      }

      setEndGameRankings(allContenders);
      setEndGameReason(reason);

      const topWinner = allContenders[0];
      setWinner(topWinner.id === 'player' ? 'player' : topWinner.name);

      // Xóa phiên đấu dở dang vì ván đấu đã kết thúc chính thức
      clearActiveMatch();

      // TỰ ĐỘNG LƯU KẾT QUẢ VÁN ĐẤU VÀO MONGODB ATLAS
      try {
        const storedUser = localStorage.getItem('neo_user') || localStorage.getItem('user') || sessionStorage.getItem('neo_user');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;
        const durationSec = Math.max(1, (matchConfig?.timeLimit || 300) - (matchTimeRemainingRef.current || 0));

        matchApi.recordMatch({
          roomCode: 'SOLO_BOT',
          winner: {
            id: topWinner.id,
            name: topWinner.name,
            isHuman: topWinner.isHuman || topWinner.id === 'player',
          },
          reason,
          durationSeconds: durationSec,
          players: allContenders.map((p, idx) => ({
            id: p.id,
            name: p.name,
            isHuman: p.isHuman || p.id === 'player',
            avatar: p.avatar || '👤',
            rank: idx + 1,
            finalScore: idx === 0 ? 120 : Math.max(10, 50 - p.cardCount * 5),
            cardsRemaining: p.cardCount || 0,
          })),
          userId: currentUser?.id || currentUser?._id,
        }).then((res) => {
          if (res?.success) {
            console.log('[MongoDB Atlas] ✅ Trận đấu đã được lưu vĩnh viễn, Match ID:', res.matchId);
            setMatchResultRewards({
              eloDelta: res.eloDelta,
              coinsDelta: res.coinsDelta,
              expDelta: res.expDelta,
              newElo: res.newElo,
              newCoins: res.newCoins,
              isLevelUp: res.isLevelUp,
              humanRank: res.humanRank,
              playersResult: res.playersResult,
            });
            if (res.updatedUser) {
              localStorage.setItem('neo_user', JSON.stringify(res.updatedUser));
              localStorage.setItem('user', JSON.stringify(res.updatedUser));
            }
          }
        });
      } catch (err) {
        console.warn('[MongoDB Atlas] Lỗi khi gửi kết quả trận đấu:', err.message);
      }

      if (topWinner.id === 'player') {
        soundEngine.playUnoChime();
        setStatusMessage(
          reason === 'timeout'
            ? `⏱ HẾT 5 PHÚT! Bạn có ít bài nhất (${topWinner.cardCount} lá) và giành CHIẾN THẮNG!`
            : '🏆 CHÚC MỪNG! BẠN ĐÃ ĐÁNH HẾT BÀI VÀ CHIẾN THẮNG TRẬN ĐẤU!'
        );
      } else {
        soundEngine.playActionSound('skip');
        setStatusMessage(
          reason === 'timeout'
            ? `⏱ HẾT 5 PHÚT! ${topWinner.name} có ít bài nhất (${topWinner.cardCount} lá) và giành chiến thắng!`
            : `💥 ${topWinner.name} ĐÃ ĐÁNH HẾT BÀI VÀ CHIẾN THẮNG!`
        );
      }
    },
    []
  );

  // =========================================================================
  // HIỆU ỨNG XÁO BÀI & CHIA BÀI 4 GÓC + RANDOM NGƯỜI ĐÁNH TRƯỚC
  // =========================================================================
  const startShuffleAndDeal = useCallback(() => {
    if (shuffleTimerRef.current) clearTimeout(shuffleTimerRef.current);
    if (dealIntervalRef.current) clearInterval(dealIntervalRef.current);
    if (starterFlipTimerRef.current) clearTimeout(starterFlipTimerRef.current);
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    if (avatarFxTimerRef.current) clearTimeout(avatarFxTimerRef.current);

    setIsShuffling(true);
    setIsDealing(false);
    setIsTurnTransitioning(false);
    setDealingRound(0);
    setStatusMessage(`🃏 ĐANG XÁO BỘ BÀI UNO 108 LÁ CHO BÀN ${1 + botCount} NGƯỜI 4 GÓC...`);
    soundEngine.playShuffle();

    const fullState = initGameState(botCount);
    const starterCard = fullState.discardPile[0];

    setGameState({
      playerHand: [],
      bots: fullState.bots.map((b) => ({ ...b, hand: [] })),
      discardPile: [],
      drawPile: fullState.drawPile,
    });
    setActiveColor(starterCard.color);
    setTurnDirection(1); // 1 = Luôn bắt đầu NGƯỢC CHIỀU KIM ĐỒNG HỒ ↺
    turnDirectionRef.current = 1;
    setColorPickerOpen(false);
    setPendingWildCard(null);
    setDrawTwoStack(0);
    setDrawnCountInTurn(0);
    setIsDrawing(false);
    setTurnTimer(TURN_TIME_LIMIT);
    setMatchTimeRemaining(timeLimit);
    setUnoCountdown(null);
    setHasCalledUno(false);
    unoPenalizedRef.current = false;
    unoHandledRef.current = false;
    timeoutHandledRef.current = false;
    setWinner(null);
    setEndGameRankings(null);
    setMatchResultRewards(null);

    shuffleTimerRef.current = setTimeout(() => {
      setIsShuffling(false);
      setIsDealing(true);
      setStatusMessage(`🎴 ĐANG CHIA BÀI CHO 4 VỊ TRÍ (DƯỚI, PHẢI, TRÊN, TRÁI)...`);

      let round = 1;
      dealIntervalRef.current = setInterval(() => {
        soundEngine.playCardSlide();
        setDealingRound(round);

        setGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            playerHand: fullState.playerHand.slice(0, round),
            bots: fullState.bots.map((b) => ({
              ...b,
              hand: b.hand.slice(0, round),
            })),
          };
        });

        if (round >= 7) {
          clearInterval(dealIntervalRef.current);
          dealIntervalRef.current = null;

          starterFlipTimerRef.current = setTimeout(() => {
            soundEngine.playCardSlam();
            triggerCardImpact();
            setGameState((prev) => ({
              ...prev,
              playerHand: fullState.playerHand.slice(0, 7),
              bots: fullState.bots.map((b) => ({
                ...b,
                hand: b.hand.slice(0, 7),
              })),
              discardPile: [starterCard],
            }));
            setIsDealing(false);
            setDealingRound(0);

            // BỐC THĂM NGẪU NHIÊN NGƯỜI ĐÁNH TRƯỚC (P1, P2, P3 hoặc P4)
            const randomStarter = Math.floor(Math.random() * (1 + botCount));
            setCurrentTurnIndex(randomStarter);
            currentTurnIndexRef.current = randomStarter;
            setTurnDirection(1); // 1 = NGƯỢC CHIỀU KIM ĐỒNG HỒ ↺
            turnDirectionRef.current = 1;

            const starterInfo = getPlayerInfo(randomStarter);
            setStatusMessage(
              `🎲 Xổ số ngẫu nhiên: ${starterInfo.displayName} giành quyền đánh trước! Vòng chơi: NGƯỢC CHIỀU KIM ĐỒNG HỒ ↺.`
            );
          }, 300);
        } else {
          round++;
        }
      }, 110);
    }, 650);
  }, [botCount, getPlayerInfo, timeLimit, triggerCardImpact]);

  // NẠP LẠI TRẬN ĐẤU CŨ (NẾU CÓ RESTORED STATE HOẶC TỪ REJOIN MODAL)
  const restoreMatch = useCallback((savedState) => {
    if (!savedState) return;
    if (shuffleTimerRef.current) clearTimeout(shuffleTimerRef.current);
    if (dealIntervalRef.current) clearInterval(dealIntervalRef.current);
    if (starterFlipTimerRef.current) clearTimeout(starterFlipTimerRef.current);
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    if (avatarFxTimerRef.current) clearTimeout(avatarFxTimerRef.current);

    setIsShuffling(false);
    setIsDealing(false);
    setIsTurnTransitioning(false);
    setDealingRound(0);

    const starterCard = savedState.discardPile?.[savedState.discardPile.length - 1];

    setGameState({
      playerHand: savedState.playerHand || [],
      bots: savedState.bots || [],
      discardPile: savedState.discardPile || [],
      drawPile: savedState.drawPile || [],
    });

    setActiveColor(savedState.activeColor || starterCard?.color || 'red');
    setTurnDirection(savedState.turnDirection ?? 1);
    turnDirectionRef.current = savedState.turnDirection ?? 1;

    const restoredTurn = savedState.currentTurnIndex ?? 0;
    setCurrentTurnIndex(restoredTurn);
    currentTurnIndexRef.current = restoredTurn;

    setDrawTwoStack(savedState.drawTwoStack ?? 0);
    setDrawnCountInTurn(savedState.drawnCountInTurn ?? 0);
    setIsDrawing(false);

    const remainingSec = savedState.matchTimeRemaining ?? timeLimit;
    setMatchTimeRemaining(remainingSec);
    matchTimeRemainingRef.current = remainingSec;

    setTurnTimer(TURN_TIME_LIMIT);

    setUnoCountdown(null);
    setHasCalledUno(false);
    unoPenalizedRef.current = false;
    unoHandledRef.current = false;
    timeoutHandledRef.current = false;
    setWinner(null);
    setEndGameRankings(null);
    setMatchResultRewards(null);

    const activeInfo = getPlayerInfo(restoredTurn);
    setStatusMessage(`⚡ ĐÃ KHÔI PHỤC VÁN ĐẤU! ĐẾN LƯỢT: ${activeInfo.name}`);
  }, [getPlayerInfo, timeLimit]);

  // KHỞI TẠO BÀN ĐẤU KHI VÀO PHÒNG (NẾU CÓ RESTORE THÌ NẠP LẠI, NẾU KHÔNG THÌ CHIA MỚI)
  useEffect(() => {
    if (restoredMatchState) {
      restoreMatch(restoredMatchState);
    } else {
      startShuffleAndDeal();
    }
    return () => {
      if (shuffleTimerRef.current) clearTimeout(shuffleTimerRef.current);
      if (dealIntervalRef.current) clearInterval(dealIntervalRef.current);
      if (starterFlipTimerRef.current) clearTimeout(starterFlipTimerRef.current);
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
      if (avatarFxTimerRef.current) clearTimeout(avatarFxTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TỰ ĐỘNG ĐỒNG BỘ TRẠNG THÁI VÁN ĐẤU VÀO LOCALSTORAGE
  useEffect(() => {
    if (!gameState || winner || isShuffling || isDealing) return;

    saveActiveMatch({
      matchConfig: matchConfig || { botCount, timeLimit },
      matchTimeRemaining,
      playerHand: gameState.playerHand,
      bots: gameState.bots,
      drawPile: gameState.drawPile,
      discardPile: gameState.discardPile,
      currentTurnIndex,
      turnDirection,
      drawTwoStack,
      drawnCountInTurn,
      activeColor,
    });
  }, [
    gameState,
    matchConfig,
    botCount,
    timeLimit,
    matchTimeRemaining,
    currentTurnIndex,
    turnDirection,
    drawTwoStack,
    drawnCountInTurn,
    activeColor,
    winner,
    isShuffling,
    isDealing,
  ]);

  // XỬ LÝ KHI BẤM NÚT THOÁT
  const handleRequestExit = () => {
    if (winner || endGameRankings) {
      clearActiveMatch();
      onBack();
      return;
    }
    setIsExitModalOpen(true);
  };

  // TỰ ĐỘNG QUAY VỀ SẢNH SAU 120 GIÂY NẾU KẾT THÚC TRẬN ĐẤU MÀ KHÔNG THAO TÁC
  useEffect(() => {
    if (!winner || !endGameRankings) {
      setAutoReturnCountdown(120);
      return;
    }

    const timer = setInterval(() => {
      setAutoReturnCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          clearActiveMatch();
          onBack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [winner, endGameRankings, onBack, clearActiveMatch]);

  // XÁC NHẬN BỎ CUỘC & XỬ THUA
  const handleConfirmForfeitAndExit = async () => {
    setIsSubmittingForfeit(true);
    try {
      await forfeitActiveMatch({
        matchConfig: matchConfig || { botCount, timeLimit },
        matchTimeRemaining,
        playerHand: gameState?.playerHand || [],
        bots: gameState?.bots || [],
      });
    } catch (err) {
      console.warn('[Forfeit Error]:', err);
    }
    clearActiveMatch();
    setIsSubmittingForfeit(false);
    setIsExitModalOpen(false);
    onBack();
  };

  // ĐẾM NGƯỢC 5 PHÚT
  useEffect(() => {
    if (winner || isShuffling || isDealing || isReshufflingDeck) return;

    const timer = setInterval(() => {
      setMatchTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finalizeRankings(null, 'timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [winner, isShuffling, isDealing, isReshufflingDeck, finalizeRankings]);

  const activeDiscard = useMemo(() => {
    if (!gameState || !gameState.discardPile.length) return null;
    return gameState.discardPile[gameState.discardPile.length - 1];
  }, [gameState]);

  // RULE ENGINE CHUẨN
  const checkValidCard = useCallback(
    (card, currentDiscard, currentStack) => {
      if (!card || !currentDiscard) return false;

      // Đang có chồng phạt +2: CHỈ được đánh tiếp lá +2 để cộng dồn
      if (currentStack > 0) {
        return card.value === 'draw_two';
      }

      if (currentDiscard.color === 'wild') {
        return card.color === 'wild' || (activeColor && card.color === activeColor);
      }

      const targetColor = activeColor || currentDiscard.color;
      return (
        card.color === 'wild' ||
        card.color === targetColor ||
        card.value === currentDiscard.value
      );
    },
    [activeColor]
  );

  const pickBotWildColor = (hand) => {
    const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
    (hand || []).forEach((c) => {
      if (c.color !== 'wild') colorCounts[c.color] = (colorCounts[c.color] || 0) + 1;
    });
    return Object.keys(colorCounts).reduce((a, b) => (colorCounts[a] > colorCounts[b] ? a : b), 'red');
  };

  // BỐC BÀI TUẦN TỰ
  const drawCards = useCallback(
    (count, target, onComplete, delay = 350) => {
      if (count <= 0) {
        if (onComplete) onComplete([]);
        return;
      }

      setIsDrawing(true);
      let step = 0;
      let finalHand = null;

      const executeSingleDraw = () => {
        const currentDraw = gameStateRef.current?.drawPile || [];
        const currentDiscard = gameStateRef.current?.discardPile || [];

        if (currentDraw.length === 0) {
          if (currentDiscard.length <= 1) {
            setIsDrawing(false);
            if (onComplete) onComplete(finalHand);
            return;
          }

          setIsReshufflingDeck(true);
          soundEngine.playShuffle();
          setStatusMessage('♻️ CHỒNG BÀI RÚT ĐÃ HẾT! ĐANG GOM VÀ XÁO LẠI TỪ CHỒNG BÀI ĐÃ ĐÁNH...');

          setTimeout(() => {
            setGameState((prev) => {
              if (!prev) return prev;
              const discardCopy = [...prev.discardPile];
              const topCard = discardCopy.pop();
              const newDraw = shuffleDeck([...discardCopy]);
              return {
                ...prev,
                drawPile: newDraw,
                discardPile: [topCard],
              };
            });

            setIsReshufflingDeck(false);
            setStatusMessage('Đã xáo lại bài thành công! Tiếp tục bốc bài...');
            setTimeout(executeSingleDraw, 200);
          }, 1100);
          return;
        }

        soundEngine.playCardSlide();

        // KÍCH HOẠT HIỆU ỨNG RÚT BÀI BAY VỀ PHÍA NGƯỜI CHƠI / BOT
        const dir = getPlayerDirection(target);
        setFlyingDraw({ direction: dir, id: Date.now() + Math.random() });
        setTimeout(() => setFlyingDraw(null), 380);

        setGameState((prev) => {
          if (!prev || prev.drawPile.length === 0) return prev;
          let draw = [...prev.drawPile];
          const poppedCard = draw.pop();

          let nextPlayerHand = prev.playerHand;
          let nextBots = prev.bots || [];

          if (target === 'player') {
            nextPlayerHand = [...prev.playerHand, poppedCard];
            finalHand = nextPlayerHand;
          } else {
            nextBots = nextBots.map((b) => {
              if (b.id === target) {
                const updatedHand = [...b.hand, poppedCard];
                finalHand = updatedHand;
                return { ...b, hand: updatedHand };
              }
              return b;
            });
          }

          return {
            ...prev,
            playerHand: nextPlayerHand,
            bots: nextBots,
            drawPile: draw,
          };
        });

        step++;
        if (step < count) {
          setTimeout(executeSingleDraw, delay);
        } else {
          setTimeout(() => {
            setIsDrawing(false);
            if (onComplete) onComplete(finalHand);
          }, delay / 2);
        }
      };

      setTimeout(executeSingleDraw, 50);
    },
    [getPlayerDirection]
  );

  // 5 GIÂY BÁO UNO
  useEffect(() => {
    if (!gameState || winner || isDealing || isShuffling || isTurnTransitioning) return;

    if (
      gameState.playerHand.length === 1 &&
      !hasCalledUno &&
      unoCountdown === null &&
      !unoPenalizedRef.current
    ) {
      setUnoCountdown(5);
      setStatusMessage('⚠️ CÒN 1 LÁ! BẠN CÓ 5 GIÂY ĐỂ BẤM BÁO UNO!');
    }

    if (gameState.playerHand.length > 2) {
      if (hasCalledUno) setHasCalledUno(false);
      if (unoCountdown !== null) setUnoCountdown(null);
      unoPenalizedRef.current = false;
      unoHandledRef.current = false;
    }
  }, [gameState?.playerHand.length, hasCalledUno, unoCountdown, winner, isDealing, isShuffling, isTurnTransitioning]);

  useEffect(() => {
    if (unoCountdown === null) {
      unoHandledRef.current = false;
      return;
    }

    if (unoCountdown > 0) {
      soundEngine.playEmergencyBeep();
      const timer = setTimeout(() => {
        setUnoCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (unoCountdown === 0 && !unoHandledRef.current) {
      unoHandledRef.current = true;
      unoPenalizedRef.current = true;
      setUnoCountdown(null);
      setHasCalledUno(true);
      setIsTurnTransitioning(true);

      const nextSeat = getNextTurnIndex(0, 1);
      const nextInfo = getPlayerInfo(nextSeat);

      triggerActionFx('skip', '🚨 QUÊN BÁO UNO!', 'Bị phạt tự động bốc 2 lá và mất lượt!');
      triggerAvatarFx('player', 'skip', '🚨 QUÊN BÁO UNO', 'notification_important', 2600);
      setStatusMessage('🚨 CHƯA BÁO UNO! BỊ PHẠT TỰ ĐỘNG BỐC 2 LÁ VÀ MẤT LƯỢT!');
      drawCards(2, 'player', () => {
        setStatusMessage(`Đã phạt bốc 2 lá do quên báo UNO! Chuyển lượt sang ${nextInfo.displayName}.`);
        actionTimerRef.current = setTimeout(() => {
          advanceTurn(1);
        }, 1300);
      });
    }
  }, [unoCountdown, drawCards, triggerActionFx, advanceTurn, getNextTurnIndex, getPlayerInfo]);

  const handleCallUno = () => {
    if (!gameState || isDealing || isShuffling) return;

    const handCount = gameState.playerHand.length;

    // ĐIỀU KIỆN BÁO UNO:
    // Chỉ được phép báo UNO khi trên tay còn đúng 1 hoặc 2 lá bài!
    // - Còn trên 2 lá (3 lá trở lên): TUYỆT ĐỐI KHÔNG ĐƯỢC BÁO!
    if (handCount > 2) {
      setStatusMessage(`❌ KHÔNG THỂ BÁO UNO! Bạn đang có ${handCount} lá bài trên tay. Chỉ được báo UNO khi còn 1 hoặc 2 lá!`);
      return;
    }

    if (hasCalledUno) {
      setStatusMessage('✓ Bạn đã báo UNO thành công từ trước!');
      return;
    }

    setHasCalledUno(true);
    setUnoCountdown(null);
    unoPenalizedRef.current = false;
    unoHandledRef.current = false;
    setShowUnoBurst(true);
    soundEngine.playUnoChime();
    setTimeout(() => setShowUnoBurst(false), 1400);

    if (handCount === 1) {
      setStatusMessage('🎉 BẠN ĐÃ HÔ UNO! (Còn đúng 1 lá bài trên tay)');
    } else {
      setStatusMessage('🎉 BẠN ĐÃ BÁO TRƯỚC UNO! (Chuẩn bị đánh lá áp chót về 1 lá)');
    }
  };

  // 15 GIÂY HẾT LƯỢT
  const handleTurnTimeout = useCallback(() => {
    const curIdx = currentTurnIndexRef.current;
    const curInfo = getPlayerInfo(curIdx);
    const nextSeat = getNextTurnIndex(curIdx, 1);
    const nextInfo = getPlayerInfo(nextSeat);

    setTurnTimer(TURN_TIME_LIMIT);
    setDrawTwoStack(0);
    setIsTurnTransitioning(true);

    triggerActionFx('skip', `⏰ ${curInfo.name.toUpperCase()} HẾT GIỜ!`, 'Bị phạt 2 lá và mất lượt');
    triggerAvatarFx(curInfo.id, 'skip', '⏰ HẾT GIỜ (PHẠT 2 LÁ)', 'timer_off', 2600);
    setStatusMessage(`⏰ ${curInfo.displayName} hết thời gian (${TURN_TIME_LIMIT}s)! Tự động phạt bốc 2 lá và mất lượt! Chuyển lượt sang ${nextInfo.displayName}.`);

    drawCards(2, curInfo.id, () => {
      actionTimerRef.current = setTimeout(() => {
        advanceTurn(1);
      }, 1300);
    });
  }, [advanceTurn, drawCards, getNextTurnIndex, getPlayerInfo, triggerActionFx]);

  // Bộ đếm 15s mỗi lượt (Tạm dừng khi đang thực hiện hiệu ứng chuyển lượt hoặc bốc bài)
  useEffect(() => {
    if (!gameState || isDrawing || colorPickerOpen || winner || isShuffling || isDealing || isReshufflingDeck || isTurnTransitioning) return;

    timeoutHandledRef.current = false;

    const interval = setInterval(() => {
      setTurnTimer((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTurnIndex, isDrawing, colorPickerOpen, winner, !!gameState, isShuffling, isDealing, isReshufflingDeck, isTurnTransitioning]);

  useEffect(() => {
    if (turnTimer === 0 && !timeoutHandledRef.current && !isDrawing && !isShuffling && !isDealing && !isReshufflingDeck && !isTurnTransitioning) {
      timeoutHandledRef.current = true;
      handleTurnTimeout();
    }
  }, [turnTimer, isDrawing, isShuffling, isDealing, isReshufflingDeck, isTurnTransitioning, handleTurnTimeout]);

  // =========================================================================
  // BOT AI MASTER - ĐÁNH BÀI VÀ XỬ LÝ LÁ BÀI CHỨC NĂNG
  // =========================================================================
  const botExecutePlayCard = useCallback(
    (botSeatIndex, card, chosenColor) => {
      const curState = gameStateRef.current;
      if (!curState) return;

      const botIndex = botSeatIndex - 1;
      const activeBot = curState.bots?.[botIndex];
      if (!activeBot) return;

      const remainingBotHand = activeBot.hand.filter((c) => c.id !== card.id);
      const remainingCount = remainingBotHand.length;
      const botDisplayName = `[P${botSeatIndex + 1}] ${activeBot.name}`;

      setGameState((prev) => {
        if (!prev) return prev;
        const nextBots = prev.bots.map((b, idx) => {
          if (idx === botIndex) {
            return { ...b, hand: b.hand.filter((c) => c.id !== card.id) };
          }
          return b;
        });
        return {
          ...prev,
          bots: nextBots,
          discardPile: [...prev.discardPile, card],
        };
      });
      setActiveColor(chosenColor);
      setTurnTimer(TURN_TIME_LIMIT);

      // KÍCH HOẠT HIỆU ỨNG ĐÁNH BÀI BAY TỪ BOT XUỐNG DISCARD PILE
      const dir = getPlayerDirection(botSeatIndex);
      setFlyingPlay({ direction: dir, card, id: Date.now() + Math.random() });
      setTimeout(() => setFlyingPlay(null), 400);

      triggerCardImpact();

      if (remainingCount === 1) {
        soundEngine.playUnoChime();
        setShowUnoBurst(true);
        setTimeout(() => setShowUnoBurst(false), 1200);
        setTimeout(() => setStatusMessage(`🤖 ${botDisplayName} hô to: "UNO!" (chỉ còn đúng 1 lá trên tay)`), 200);

        // Bot thể hiện cảm xúc khi báo UNO (Task 3)
        if (Math.random() < 0.8) {
          const unoEmotes = [
            { id: 'uno_alert', icon: '🚨', label: 'UNO đây coi chừng!', type: 'text', sound: 'firework' },
            { id: 'firework', icon: '🎉', label: 'Bắn pháo hoa!', type: 'projectile', sound: 'firework' },
            { id: 'cool', icon: '😎', label: 'Đẳng cấp!', type: 'emoji', sound: 'firework' },
          ];
          const chosen = unoEmotes[Math.floor(Math.random() * unoEmotes.length)];
          const emoteId = `${Date.now()}_bot_${Math.random().toString(36).substring(2, 7)}`;
          setActiveEmotes((prev) => [
            ...prev,
            {
              id: emoteId,
              senderSeatIndex: botSeatIndex,
              senderName: activeBot.name,
              emote: chosen,
              targetSeatIndex: null,
              timestamp: Date.now(),
            },
          ]);
          if (soundEnabled && chosen.sound) {
            soundEngine.playEmoteEffect(chosen.sound, chosen.type === 'projectile');
          }
          setTimeout(() => {
            setActiveEmotes((prev) => prev.filter((item) => item.id !== emoteId));
          }, 3400);
        }
      }

      if (remainingCount === 0) {
        finalizeRankings(activeBot.id, 'out_of_cards');
        return;
      }

      setIsTurnTransitioning(true);

      // 1. Chồng phạt +2
      if (card.value === 'draw_two') {
        const newStack = drawTwoStackRef.current + 2;
        setDrawTwoStack(newStack);
        triggerActionFx('draw_two', `🔥 CỘNG DỒN +${newStack} LÁ!`, `${botDisplayName} vừa tung lá +2`);
        const nextSeat = getNextTurnIndex(botSeatIndex, 1);
        const nextInfo = getPlayerInfo(nextSeat);
        triggerAvatarFx(nextInfo.id, 'draw_two', `🔥 CỘNG DỒN +${newStack}!`, 'local_fire_department', 2600);
        setStatusMessage(`🤖 ${botDisplayName} đánh lá +2! Chồng phạt tăng lên +${newStack} lá! Chuyển lượt sang ${nextInfo.displayName}.`);
        actionTimerRef.current = setTimeout(() => {
          advanceTurn(1);
        }, 2000);
        return;
      }

      // 2. Skip (Cấm lượt)
      if (card.value === 'skip') {
        const skippedSeat = getNextTurnIndex(botSeatIndex, 1);
        const nextActiveSeat = getNextTurnIndex(botSeatIndex, 2);
        const skippedInfo = getPlayerInfo(skippedSeat);
        const nextActiveInfo = getPlayerInfo(nextActiveSeat);
        triggerActionFx('skip', '🚫 CẤM LƯỢT!', `${botDisplayName} cấm lượt ${skippedInfo.displayName}`);
        triggerAvatarFx(skippedInfo.id, 'skip', '🚫 BỊ CẤM LƯỢT!', 'block', 2600);
        setStatusMessage(`🚫 ${botDisplayName} đánh lá CẤM (SKIP)! ${skippedInfo.displayName} bị mất lượt! Chuyển lượt sang ${nextActiveInfo.displayName}.`);
        actionTimerRef.current = setTimeout(() => {
          advanceTurn(2);
        }, 2000);
        return;
      }

      // 3. Reverse (Đổi chiều vòng đánh)
      if (card.value === 'reverse') {
        if (totalPlayers === 2) {
          triggerActionFx('reverse', '🔄 ĐỔI CHIỀU / CẤM LƯỢT!', `${botDisplayName} đánh tiếp`);
          setStatusMessage(`🔄 ${botDisplayName} đánh lá REVERSE! Trong ván 2 người, đối thủ bị mất lượt!`);
          actionTimerRef.current = setTimeout(() => {
            advanceTurn(2);
          }, 2000);
        } else {
          const newDir = -turnDirectionRef.current;
          setTurnDirection(newDir);
          turnDirectionRef.current = newDir;
          const nextSeat = getNextTurnIndex(botSeatIndex, 1, newDir);
          const nextInfo = getPlayerInfo(nextSeat);
          triggerActionFx('reverse', '🔄 ĐỔI CHIỀU VÒNG ĐÁNH!', `${newDir === 1 ? 'Ngược ↺' : 'Thuận ↻'}`);
          setStatusMessage(`🔄 ${botDisplayName} đánh lá REVERSE! Vòng chơi đổi chiều sang ${newDir === 1 ? 'Ngược kim đồng hồ ↺' : 'Thuận kim đồng hồ ↻'}! Chuyển lượt sang ${nextInfo.displayName}.`);
          actionTimerRef.current = setTimeout(() => {
            advanceTurn(1, newDir);
          }, 2000);
        }
        return;
      }

      // 4. Wild +4: Người kế tiếp bốc 4 lá và MẤT LƯỢT (không được đỡ/cộng dồn)
      if (card.value === 'wild_draw_four') {
        const victimSeat = getNextTurnIndex(botSeatIndex, 1);
        const afterVictimSeat = getNextTurnIndex(botSeatIndex, 2);
        const victimInfo = getPlayerInfo(victimSeat);
        const afterVictimInfo = getPlayerInfo(afterVictimSeat);

        triggerActionFx('wild_draw_four', '⚡ SIÊU WILD +4!', `${botDisplayName} chọn màu ${COLOR_NAME_MAP[chosenColor]}`);
        triggerAvatarFx(victimInfo.id, 'wild_draw_four', '⚡ BỊ PHẠT +4 LÁ!', 'bolt', 3200);
        setStatusMessage(`🌈 ${botDisplayName} đánh WILD +4 và chọn màu ${COLOR_NAME_MAP[chosenColor]}! ${victimInfo.displayName} bị phạt bốc 4 lá và mất lượt!`);

        actionTimerRef.current = setTimeout(() => {
          drawCards(4, victimInfo.id, () => {
            setStatusMessage(`💥 ${victimInfo.displayName} đã nhận đủ 4 lá phạt và mất lượt! Chuyển lượt sang ${afterVictimInfo.displayName}.`);
            actionTimerRef.current = setTimeout(() => {
              advanceTurn(2);
            }, 2000);
          }, 450);
        }, 900);
        return;
      }

      // 5. Wild thường
      if (card.value === 'wild') {
        const nextSeat = getNextTurnIndex(botSeatIndex, 1);
        const nextInfo = getPlayerInfo(nextSeat);
        triggerActionFx('wild', '🌈 ĐỔI MÀU BÀI!', `${botDisplayName} chọn màu: ${COLOR_NAME_MAP[chosenColor]}`);
        setStatusMessage(`🌈 ${botDisplayName} đánh lá Wild và chọn màu ${COLOR_NAME_MAP[chosenColor]}. Chuyển lượt sang ${nextInfo.displayName}.`);
        actionTimerRef.current = setTimeout(() => {
          advanceTurn(1);
        }, 2000);
        return;
      }

      // 6. Lá số thông thường (0-9)
      const nextSeat = getNextTurnIndex(botSeatIndex, 1);
      const nextInfo = getPlayerInfo(nextSeat);
      const cardColorName = COLOR_NAME_MAP[chosenColor] || chosenColor.toUpperCase();
      setStatusMessage(`🤖 ${botDisplayName} đã đánh lá [${cardColorName} ${card.value}]. Chuyển lượt sang ${nextInfo.displayName}.`);
      actionTimerRef.current = setTimeout(() => {
        advanceTurn(1);
      }, 1800);
    },
    [advanceTurn, drawCards, finalizeRankings, getNextTurnIndex, getPlayerDirection, getPlayerInfo, totalPlayers, triggerActionFx, triggerCardImpact]
  );

  // =========================================================================
  // BOT AI SUY NGHĨ VÀ RA QUYẾT ĐỊNH (DELAY 2 GIÂY CHO NGƯỜI CHƠI KỊP QUAN SÁT)
  // =========================================================================
  const runBotTurn = useCallback(() => {
    const curIdx = currentTurnIndexRef.current;
    if (
      curIdx === 0 ||
      isDrawingRef.current ||
      winnerRef.current ||
      isShufflingRef.current ||
      isDealingRef.current ||
      isReshufflingDeckRef.current ||
      isTurnTransitioningRef.current
    ) return;

    const currentGameState = gameStateRef.current;
    if (!currentGameState) return;

    const botIndex = curIdx - 1;
    const activeBot = currentGameState.bots?.[botIndex];
    if (!activeBot) return;

    const botId = activeBot.id;
    const botDisplayName = `[P${curIdx + 1}] ${activeBot.name}`;

    setStatusMessage(`🤖 ${botDisplayName} đang suy nghĩ nước đi... (1.5 giây)`);

    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    // EXACT 1.5 GIÂY SUY NGHĨ (THEO YÊU CẦU NGƯỜI DÙNG)
    botTimerRef.current = setTimeout(() => {
      botTimerRef.current = null;
      if (
        currentTurnIndexRef.current !== curIdx ||
        isDrawingRef.current ||
        winnerRef.current ||
        isTurnTransitioningRef.current
      ) return;

      const latestState = gameStateRef.current;
      const latestBot = latestState?.bots?.[botIndex];
      if (!latestBot) return;

      const actualBotHand = [...latestBot.hand];
      const discard = latestState.discardPile[latestState.discardPile.length - 1];
      const currentStack = drawTwoStackRef.current;
      const currentTargetColor = activeColorRef.current || discard?.color;

      // 1. Đối mặt chồng phạt +2
      if (currentStack > 0) {
        const botDrawTwo = actualBotHand.find((c) => c.value === 'draw_two');
        if (botDrawTwo) {
          setStatusMessage(`⚡ ${botDisplayName} CÓ LÁ +2! Đang đỡ đòn và cộng dồn tiếp...`);
          actionTimerRef.current = setTimeout(() => {
            botExecutePlayCard(curIdx, botDrawTwo, botDrawTwo.color);
          }, 1000);
        } else {
          const penaltyCards = currentStack;
          setDrawTwoStack(0);
          setIsTurnTransitioning(true);
          const nextSeat = getNextTurnIndex(curIdx, 1);
          const nextInfo = getPlayerInfo(nextSeat);
          setStatusMessage(`⚠️ ${botDisplayName} không có lá +2 để đỡ: Bắt buộc nhận ${penaltyCards} lá phạt...`);
          triggerAvatarFx(botId, 'draw_two_penalize', `💥 NHẬN +${penaltyCards} LÁ!`, 'emergency_home', 3000);

          actionTimerRef.current = setTimeout(() => {
            drawCards(penaltyCards, botId, () => {
              setStatusMessage(`💥 ${botDisplayName} đã nhận đủ ${penaltyCards} lá phạt và mất lượt! Chuyển lượt sang ${nextInfo.displayName}.`);
              actionTimerRef.current = setTimeout(() => {
                advanceTurn(1); // Lượt chuyển tiếp 1 bước sang người tiếp theo
              }, 2000);
            }, 450);
          }, 800);
        }
        return;
      }

      // 2. Lượt đánh thường
      const playableCards = actualBotHand.filter((c) => {
        if (discard?.color === 'wild') {
          return c.color === 'wild' || (activeColorRef.current && c.color === activeColorRef.current);
        }
        return c.color === 'wild' || c.color === currentTargetColor || c.value === discard?.value;
      });

      if (playableCards.length > 0) {
        let chosenCard =
          playableCards.find((c) => c.value === 'wild_draw_four') ||
          playableCards.find((c) => c.value === 'draw_two') ||
          playableCards.find((c) => c.value === 'skip' || c.value === 'reverse') ||
          playableCards.find((c) => c.color === currentTargetColor && c.color !== 'wild') ||
          playableCards[0];

        let botColor = chosenCard.color;
        if (chosenCard.color === 'wild') {
          botColor = pickBotWildColor(actualBotHand);
        }

        botExecutePlayCard(curIdx, chosenCard, botColor);
        return;
      }

      // 3. Không có bài đánh được -> Bốc lá thứ 1
      setStatusMessage(`🤖 ${botDisplayName} không có bài đánh: Đang bốc lá thứ 1...`);
      actionTimerRef.current = setTimeout(() => {
        drawCards(1, botId, (handAfter1) => {
          const topDiscard1 = gameStateRef.current?.discardPile[gameStateRef.current.discardPile.length - 1];
          const playableAfter1 = (handAfter1 || []).filter((c) => {
            if (topDiscard1?.color === 'wild') {
              return c.color === 'wild' || (activeColorRef.current && c.color === activeColorRef.current);
            }
            return c.color === 'wild' || c.color === currentTargetColor || c.value === topDiscard1?.value;
          });

          if (playableAfter1.length > 0) {
            const cardToPlay = playableAfter1[0];
            let botColor = cardToPlay.color;
            if (cardToPlay.color === 'wild') {
              botColor = pickBotWildColor(handAfter1);
            }
            setStatusMessage(`🤖 ${botDisplayName} vừa bốc được lá hợp lệ! Đang chuẩn bị đánh...`);
            actionTimerRef.current = setTimeout(() => {
              botExecutePlayCard(curIdx, cardToPlay, botColor);
            }, 1200);
          } else {
            actionTimerRef.current = setTimeout(() => {
              setStatusMessage(`🤖 ${botDisplayName} bốc tiếp lá thứ 2...`);
              drawCards(1, botId, (handAfter2) => {
                const topDiscard2 = gameStateRef.current?.discardPile[gameStateRef.current.discardPile.length - 1];
                const playableAfter2 = (handAfter2 || []).filter((c) => {
                  if (topDiscard2?.color === 'wild') {
                    return c.color === 'wild' || (activeColorRef.current && c.color === activeColorRef.current);
                  }
                  return c.color === 'wild' || c.color === currentTargetColor || c.value === topDiscard2?.value;
                });

                if (playableAfter2.length > 0) {
                  const cardToPlay = playableAfter2[0];
                  let botColor = cardToPlay.color;
                  if (cardToPlay.color === 'wild') {
                    botColor = pickBotWildColor(handAfter2);
                  }
                  setStatusMessage(`🤖 ${botDisplayName} bốc được lá hợp lệ! Đang chuẩn bị đánh...`);
                  actionTimerRef.current = setTimeout(() => {
                    botExecutePlayCard(curIdx, cardToPlay, botColor);
                  }, 1200);
                } else {
                  setIsTurnTransitioning(true);
                  const nextSeat = getNextTurnIndex(curIdx, 1);
                  const nextInfo = getPlayerInfo(nextSeat);
                  setStatusMessage(`🤖 ${botDisplayName} đã bốc 2 lá nhưng không có bài đánh được! Chuyển lượt sang ${nextInfo.displayName}.`);
                  actionTimerRef.current = setTimeout(() => {
                    advanceTurn(1);
                  }, 2000);
                }
              });
            }, 1000);
          }
        });
      }, 600);
    }, 1500);
  }, [advanceTurn, botExecutePlayCard, drawCards, getNextTurnIndex, getPlayerInfo]);

  useEffect(() => {
    if (
      currentTurnIndex > 0 &&
      !isDrawing &&
      gameState &&
      !winner &&
      !isShuffling &&
      !isDealing &&
      !isReshufflingDeck &&
      !isTurnTransitioning
    ) {
      runBotTurn();
    }
  }, [currentTurnIndex, isDrawing, winner, isShuffling, isDealing, isReshufflingDeck, isTurnTransitioning, runBotTurn]);

  // =========================================================================
  // NGƯỜI CHƠI (P1 - BẠN) ĐÁNH BÀI
  // =========================================================================
  const handleCancelWildColor = () => {
    isCardActionLockedRef.current = false;
    setColorPickerOpen(false);
    setPendingWildCard(null);
    setStatusMessage('Đã hủy chọn lá Wild. Bạn có thể chọn lá bài khác để đánh.');
  };

  const playerRemainingHand = useMemo(() => {
    if (!gameState || !pendingWildCard) return [];
    return (gameState.playerHand || []).filter((c) => c.id !== pendingWildCard.id);
  }, [gameState, pendingWildCard]);

  const playerHandColorStats = useMemo(() => {
    const stats = { red: 0, blue: 0, green: 0, yellow: 0, wild: 0 };
    playerRemainingHand.forEach((c) => {
      if (stats[c.color] !== undefined) {
        stats[c.color]++;
      }
    });
    return stats;
  }, [playerRemainingHand]);

  const handlePlayCard = (card) => {
    // KHÓA CHẶT: Mỗi lượt chỉ được đánh đúng 1 lá bài duy nhất, chặn tuyệt đối spam đánh 2-3 lá
    if (isCardActionLockedRef.current || !isPlayerTurn || isDrawing || colorPickerOpen || winner || isShuffling || isDealing || isReshufflingDeck || isTurnTransitioning) return;

    if (!checkValidCard(card, activeDiscard, drawTwoStack)) {
      setShakingCardId(card.id);
      setTimeout(() => setShakingCardId(null), 500);

      if (drawTwoStack > 0) {
        setStatusMessage(`Đang có chồng phạt +${drawTwoStack} lá! Bạn CHỈ có thể đánh tiếp lá +2 để cộng dồn hoặc bốc bài chịu phạt!`);
      } else {
        setStatusMessage('Lá bài không hợp lệ! Phải cùng màu, cùng số hoặc là lá Wild.');
      }
      return;
    }

    if (card.color === 'wild') {
      setPendingWildCard(card);
      setColorPickerOpen(true);
      return;
    }

    // KHÓA ĐỒNG BỘ 0ms NGAY LẬP TỨC
    isCardActionLockedRef.current = true;
    executePlayCard(card, card.color);
  };

  const handleSelectWildColor = (selectedColor) => {
    if (!pendingWildCard) return;
    const card = pendingWildCard;
    setColorPickerOpen(false);
    setPendingWildCard(null);
    isCardActionLockedRef.current = true;
    executePlayCard(card, selectedColor);
  };

  const executePlayCard = (card, chosenColor) => {
    const curState = gameStateRef.current;
    const currentPlayerHand = curState?.playerHand || [];
    const remainingHand = currentPlayerHand.filter((c) => c.id !== card.id);
    const remainingCount = remainingHand.length;

    setGameState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        playerHand: prev.playerHand.filter((c) => c.id !== card.id),
        discardPile: [...prev.discardPile, card],
      };
    });
    setActiveColor(chosenColor);
    setTurnTimer(TURN_TIME_LIMIT);
    setDrawnCountInTurn(0);

    // KÍCH HOẠT HIỆU ỨNG ĐÁNH BÀI BAY TỪ NGƯỜI CHƠI XUỐNG DISCARD PILE
    setFlyingPlay({ direction: 'bottom', card, id: Date.now() + Math.random() });
    setTimeout(() => setFlyingPlay(null), 400);

    triggerCardImpact();

    if (remainingCount === 0) {
      finalizeRankings('player', 'out_of_cards');
      return;
    }

    setIsTurnTransitioning(true);

    // 1. +2
    if (card.value === 'draw_two') {
      const newStack = drawTwoStack + 2;
      setDrawTwoStack(newStack);
      triggerActionFx('draw_two', `🔥 CỘNG DỒN +${newStack} LÁ!`, 'Bạn vừa tung lá +2');
      const nextSeat = getNextTurnIndex(0, 1);
      const nextInfo = getPlayerInfo(nextSeat);
      triggerAvatarFx(nextInfo.id, 'draw_two', `🔥 CỘNG DỒN +${newStack}!`, 'local_fire_department', 2600);
      setStatusMessage(`[P1] Bạn đã đánh lá +2! Chồng phạt tăng lên +${newStack} lá! Chuyển lượt sang ${nextInfo.displayName}.`);
      actionTimerRef.current = setTimeout(() => {
        advanceTurn(1);
      }, 1600);
      return;
    }

    // 2. Skip (Cấm lượt)
    if (card.value === 'skip') {
      const skippedSeat = getNextTurnIndex(0, 1);
      const nextActiveSeat = getNextTurnIndex(0, 2);
      const skippedInfo = getPlayerInfo(skippedSeat);
      const nextActiveInfo = getPlayerInfo(nextActiveSeat);
      triggerActionFx('skip', '🚫 CẤM LƯỢT ĐỐI THỦ!', `${skippedInfo.displayName} bị mất lượt`);
      triggerAvatarFx(skippedInfo.id, 'skip', '🚫 BỊ CẤM LƯỢT!', 'block', 2600);
      setStatusMessage(`🚫 [P1] Bạn đánh lá CẤM (SKIP)! ${skippedInfo.displayName} bị mất lượt! Chuyển lượt sang ${nextActiveInfo.displayName}.`);
      actionTimerRef.current = setTimeout(() => {
        advanceTurn(2);
      }, 1800);
      return;
    }

    // 3. Reverse (Đổi chiều vòng đánh)
    if (card.value === 'reverse') {
      if (totalPlayers === 2) {
        triggerActionFx('reverse', '🔄 ĐỔI CHIỀU LƯỢT!', 'Trong ván 2 người, bạn được đánh tiếp');
        setStatusMessage('🔄 [P1] Bạn đánh lá REVERSE! Trong ván 2 người, đối thủ bị mất lượt và bạn được đánh tiếp!');
        actionTimerRef.current = setTimeout(() => {
          advanceTurn(2);
        }, 1800);
      } else {
        const newDir = -turnDirectionRef.current;
        setTurnDirection(newDir);
        turnDirectionRef.current = newDir;
        const nextSeat = getNextTurnIndex(0, 1, newDir);
        const nextInfo = getPlayerInfo(nextSeat);
        triggerActionFx('reverse', '🔄 ĐỔI CHIỀU VÒNG ĐÁNH!', `${newDir === 1 ? 'Ngược ↺' : 'Thuận ↻'}`);
        setStatusMessage(`🔄 [P1] Bạn đánh lá REVERSE! Vòng chơi đổi chiều sang ${newDir === 1 ? 'Ngược kim đồng hồ ↺' : 'Thuận kim đồng hồ ↻'}! Chuyển lượt sang ${nextInfo.displayName}.`);
        actionTimerRef.current = setTimeout(() => {
          advanceTurn(1, newDir);
        }, 1800);
      }
      return;
    }

    // 4. Wild +4 (Người kế tiếp bốc 4 lá và MẤT LƯỢT)
    if (card.value === 'wild_draw_four') {
      const victimSeat = getNextTurnIndex(0, 1);
      const afterVictimSeat = getNextTurnIndex(0, 2);
      const victimInfo = getPlayerInfo(victimSeat);
      const afterVictimInfo = getPlayerInfo(afterVictimSeat);

      triggerActionFx('wild_draw_four', '⚡ SIÊU WILD +4!', `Đã chọn màu ${COLOR_NAME_MAP[chosenColor]}`);
      triggerAvatarFx(victimInfo.id, 'wild_draw_four', '⚡ BỊ PHẠT +4 LÁ!', 'bolt', 3200);
      setStatusMessage(`🌈 [P1] Bạn đánh WILD +4! Đã chọn màu ${COLOR_NAME_MAP[chosenColor]}. ${victimInfo.displayName} lập tức bị phạt bốc 4 lá và mất lượt!`);

      actionTimerRef.current = setTimeout(() => {
        drawCards(4, victimInfo.id, () => {
          setStatusMessage(`💥 ${victimInfo.displayName} đã nhận đủ 4 lá phạt và mất lượt! Chuyển lượt sang ${afterVictimInfo.displayName}.`);
          actionTimerRef.current = setTimeout(() => {
            advanceTurn(2);
          }, 1800);
        }, 450);
      }, 900);
      return;
    }

    // 5. Wild thường
    if (card.value === 'wild') {
      const nextSeat = getNextTurnIndex(0, 1);
      const nextInfo = getPlayerInfo(nextSeat);
      triggerActionFx('wild', '🌈 ĐỔI MÀU BÀI!', `Bạn đã kích hoạt màu ${COLOR_NAME_MAP[chosenColor]}`);
      setStatusMessage(`🌈 [P1] Bạn đánh lá Wild và chọn màu ${COLOR_NAME_MAP[chosenColor]}. Chuyển lượt sang ${nextInfo.displayName}.`);
      actionTimerRef.current = setTimeout(() => {
        advanceTurn(1);
      }, 1600);
      return;
    }

    // 6. Lá số
    const nextSeat = getNextTurnIndex(0, 1);
    const nextInfo = getPlayerInfo(nextSeat);
    const cardColorName = COLOR_NAME_MAP[chosenColor] || chosenColor.toUpperCase();
    setStatusMessage(`[P1] Bạn đã đánh lá [${cardColorName} ${card.value}]. Chuyển lượt sang ${nextInfo.displayName}.`);
    actionTimerRef.current = setTimeout(() => {
      advanceTurn(1);
    }, 1400);
  };

  // =========================================================================
  // NGƯỜI CHƠI BỐC BÀI & TỰ ĐỘNG CHỊU PHẠT KHI KHÔNG CÓ LÁ +2 ĐỠ
  // =========================================================================
  const handleDrawCard = () => {
    if (!isPlayerTurn || isDrawing || colorPickerOpen || winner || isShuffling || isDealing || isReshufflingDeck || isTurnTransitioning) return;

    // Đang chịu phạt lá +2: Bốc tất cả các lá phạt và MẤT LƯỢT
    if (drawTwoStack > 0) {
      const penaltyCards = drawTwoStack;
      setDrawTwoStack(0);
      setIsTurnTransitioning(true);
      const nextSeat = getNextTurnIndex(0, 1);
      const nextInfo = getPlayerInfo(nextSeat);

      setStatusMessage(`⚠️ Bạn không có lá +2 để đỡ: Đang bốc lần lượt ${penaltyCards} lá phạt...`);
      triggerAvatarFx('player', 'draw_two_penalize', `💥 NHẬN +${penaltyCards} LÁ!`, 'emergency_home', 3000);
      drawCards(penaltyCards, 'player', () => {
        setStatusMessage(`💥 Bạn đã bốc đủ ${penaltyCards} lá phạt và mất lượt! Chuyển lượt sang ${nextInfo.displayName}.`);
        actionTimerRef.current = setTimeout(() => {
          advanceTurn(1); // Mất lượt, chuyển sang người tiếp theo
        }, 1300);
      });
      return;
    }

    if (drawnCountInTurn >= 2) {
      setStatusMessage('Bạn đã bốc tối đa 2 lá trong lượt này! Hãy đánh một lá bài hợp lệ hoặc bấm "Bỏ Lượt".');
      return;
    }

    const nextDrawnCount = drawnCountInTurn + 1;
    setStatusMessage(`Bạn đang bốc lá thứ ${nextDrawnCount}...`);

    drawCards(1, 'player', (updatedPlayerHand) => {
      setDrawnCountInTurn(nextDrawnCount);
      setTurnTimer(TURN_TIME_LIMIT);

      const currentDiscard = gameStateRef.current?.discardPile[gameStateRef.current.discardPile.length - 1];
      const finalHand = updatedPlayerHand || gameStateRef.current?.playerHand || [];
      const hasPlayableCard = finalHand.some((card) => checkValidCard(card, currentDiscard, 0));

      if (nextDrawnCount === 1) {
        if (hasPlayableCard) {
          setStatusMessage('Bạn vừa bốc 1 lá! Đã có lá đánh được trên tay, bạn có thể ĐÁNH NGAY hoặc bốc tiếp lá thứ 2.');
        } else {
          setStatusMessage('Lá vừa bốc không thể đánh! Bạn hãy bấm bốc tiếp lá thứ 2.');
        }
      } else if (nextDrawnCount === 2) {
        if (hasPlayableCard) {
          setStatusMessage('Bạn đã bốc đủ 2 lá! Bạn có lá bài hợp lệ, hãy chọn lá bài để đánh (hoặc bấm Bỏ Lượt).');
        } else {
          setIsTurnTransitioning(true);
          const nextSeat = getNextTurnIndex(0, 1);
          const nextInfo = getPlayerInfo(nextSeat);
          setStatusMessage(`Bạn đã bốc đủ 2 lá nhưng vẫn không có bài hợp lệ! Tự động chuyển lượt sang ${nextInfo.displayName}...`);
          actionTimerRef.current = setTimeout(() => {
            advanceTurn(1);
          }, 1400);
        }
      }
    });
  };

  // Tự động xử lý khi người chơi bắt đầu lượt với chồng phạt +2
  useEffect(() => {
    if (
      isPlayerTurn &&
      drawTwoStack > 0 &&
      !isDrawing &&
      !winner &&
      !isTurnTransitioning &&
      gameState &&
      !isShuffling &&
      !isDealing &&
      !isReshufflingDeck
    ) {
      const hasDrawTwo = (gameState.playerHand || []).some((c) => c.value === 'draw_two');
      if (hasDrawTwo) {
        setStatusMessage(`🔥 ĐANG CÓ CHỒNG PHẠT +${drawTwoStack} LÁ! Bạn có lá +2 trên tay: Hãy bấm lá +2 để CỘNG DỒN hoặc bấm chồng bài để CHỊU PHẠT!`);
      } else {
        setStatusMessage(`⚠️ ĐANG CÓ CHỒNG PHẠT +${drawTwoStack} LÁ! Bạn KHÔNG CÓ lá +2 để đỡ: Đang tự động nhận ${drawTwoStack} lá phạt...`);
        const timer = setTimeout(() => {
          handleDrawCard();
        }, 1600);
        return () => clearTimeout(timer);
      }
    }
  }, [isPlayerTurn, drawTwoStack, isDrawing, winner, isTurnTransitioning, gameState, isShuffling, isDealing, isReshufflingDeck]);

  const handlePassTurn = () => {
    if (!isPlayerTurn || isDrawing || drawnCountInTurn === 0 || isTurnTransitioning) return;
    setIsTurnTransitioning(true);
    const nextSeat = getNextTurnIndex(0, 1);
    const nextInfo = getPlayerInfo(nextSeat);
    setStatusMessage(`Bạn đã quyết định bỏ lượt! Chuyển lượt sang ${nextInfo.displayName}...`);
    actionTimerRef.current = setTimeout(() => {
      advanceTurn(1);
    }, 1100);
  };

  const handleToggleSound = () => {
    const newState = soundEngine.toggle();
    setSoundEnabled(newState);
  };

  const formatMatchTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Xác định cung mũi tên đang sáng và chuyển động theo lượt hiện tại
  const activeArcKey = useMemo(() => {
    if (turnDirection === 1) {
      // Ngược chiều kim đồng hồ ↺:
      if (currentTurnIndex === 0) return 'bottom-right';
      if (currentTurnIndex === 1) return 'top-right';
      if (currentTurnIndex === 2) return 'top-left';
      return 'bottom-left';
    } else {
      // Thuận chiều kim đồng hồ ↻:
      if (currentTurnIndex === 0) return 'bottom-left';
      if (currentTurnIndex === 3) return 'top-left';
      if (currentTurnIndex === 2) return 'top-right';
      return 'bottom-right';
    }
  }, [currentTurnIndex, turnDirection]);

  // Tọa độ 4 cung mũi tên vòng cung bao quanh bàn đấu
  const orbitPaths = useMemo(() => {
    if (turnDirection === 1) {
      // NGƯỢC CHIỀU KIM ĐỒNG HỒ ↺
      return {
        'bottom-right': 'M 330 300 C 430 300, 480 240, 480 185',
        'top-right': 'M 480 135 C 480 80, 430 20, 330 20',
        'top-left': 'M 170 20 C 70 20, 20 80, 20 135',
        'bottom-left': 'M 20 185 C 20 240, 70 300, 170 300',
      };
    } else {
      // THUẬN CHIỀU KIM ĐỒNG HỒ ↻
      return {
        'bottom-left': 'M 170 300 C 70 300, 20 240, 20 185',
        'top-left': 'M 20 135 C 20 80, 70 20, 170 20',
        'top-right': 'M 330 20 C 430 20, 480 80, 480 135',
        'bottom-right': 'M 480 185 C 480 240, 430 300, 330 300',
      };
    }
  }, [turnDirection]);

  if (!gameState) {
    return (
      <main className="w-full min-h-screen bg-background relative overflow-x-hidden flex items-center justify-center">
        <div className="text-primary-container font-headline font-bold text-lg animate-pulse flex items-center gap-2">
          <span className="material-symbols-outlined animate-spin text-2xl">autorenew</span>
          <span>ĐANG CHUẨN BỊ BÀN ĐẤU 4 GÓC...</span>
        </div>
      </main>
    );
  }

  const { playerHand, bots = [], drawPile } = gameState;

  // Phân bổ các Bot vào đúng 3 phía: Trái (Left), Trên (Top), Phải (Right)
  const leftBot = bots.find((b) => b.position === 'left');
  const topBot = bots.find((b) => b.position === 'top');
  const rightBot = bots.find((b) => b.position === 'right');

  // Helper render Bot Capsule cho vị trí Cánh Trái và Cánh Phải
  const renderSideBot = (bot, side) => {
    if (!bot) return <div className="w-28 sm:w-36" />;
    const botIdx = bots.findIndex((b) => b.id === bot.id);
    const botSeatIndex = botIdx + 1;
    const isBotActive = currentTurnIndex === botSeatIndex;

    return (
      <div
        className={`relative flex flex-col items-center p-2.5 sm:p-3 rounded-2xl transition-all duration-300 w-32 sm:w-40 backdrop-blur-md shadow-lg ${
          isBotActive
            ? 'bg-gradient-to-b from-amber-500/25 via-slate-900/95 to-amber-950/40 border-2 border-amber-300 ring-4 ring-amber-400/80 shadow-[0_0_40px_rgba(251,191,36,0.85)] scale-110 z-30 animate-bot-spotlight'
            : 'bg-surface-container-high/40 border border-white/5 opacity-75'
        }`}
      >
        {isBotActive ? (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-headline font-black text-[9px] uppercase tracking-wider shadow-lg whitespace-nowrap animate-pulse">
            <span>👑 ĐẾN LƯỢT (P{bot.playerNumber || botSeatIndex + 1})</span>
          </div>
        ) : (
          <span className="absolute -top-3 px-2 py-0.5 rounded-full bg-slate-900 border border-white/20 text-white font-mono font-black text-[9px] uppercase tracking-wider shadow-md">
            {bot.playerNumber ? `P${bot.playerNumber}` : `P${botSeatIndex + 1}`}
          </span>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 mt-1 relative">
          {renderAvatarFxBadge(bot.id)}
          <span className={`text-xl sm:text-2xl p-1 rounded-full ${
            isBotActive ? 'ring-2 ring-amber-300 bg-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : ''
          }`}>{bot.avatar}</span>
          <div className="flex flex-col text-left">
            <span className={`text-[11px] sm:text-xs font-bold leading-tight truncate max-w-[70px] sm:max-w-none ${
              isBotActive ? 'text-amber-300 font-black' : 'text-white'
            }`}>
              {bot.name}
            </span>
            <span className="text-[9px] sm:text-[10px] text-amber-300 font-bold">
              {bot.hand.length} lá bài
            </span>
          </div>
        </div>

        {/* Compact Fan of Cards */}
        <div className="flex -space-x-3.5 mt-1 min-h-[36px] items-center justify-center max-w-full overflow-hidden">
          {bot.hand.map((c, cIdx) => (
            <div
              key={c.id || `${bot.id}_card_${cIdx}`}
              className="w-5 h-8 sm:w-6 sm:h-9 rounded-[4px] bg-gradient-to-br from-[#8b0032] to-[#400010] border border-white/20 shadow-xs flex items-center justify-center select-none shrink-0"
            >
              <span className="text-[6px] sm:text-[7px] font-black text-white/90">UNO</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <main
      className={`w-full min-h-screen bg-background relative overflow-x-hidden select-none transition-all duration-300 ${
        unoCountdown !== null ? 'animate-emergency-border' : ''
      }`}
    >
      {/* LỚP PHỦ BIỂU CẢM & CHAT NHANH (TASK 3) */}
      <EmoteOverlay activeEmotes={activeEmotes} getSeatPosition={getSeatPosition} />

      <div className="relative z-10 w-full min-h-screen flex flex-col justify-between p-2 sm:p-4 max-w-7xl mx-auto">
        
        {/* 1. TOP HEADER HUD */}
        <div className="w-full flex items-center justify-between pb-1 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button
              onClick={handleRequestExit}
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
          </div>

          {/* Center Info: 5-Phút Countdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border shadow-sm transition-colors ${
                matchTimeRemaining <= 60
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-surface-container-low/90 border-white/10 text-slate-200'
              }`}
              title="Thời gian trận đấu (5 phút). Hết giờ ai ít bài nhất thắng!"
            >
              <span className="material-symbols-outlined text-base text-amber-400">timer</span>
              <span className="font-mono text-xs sm:text-sm font-black tracking-widest">
                {formatMatchTime(matchTimeRemaining)}
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSound}
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

        {/* 2. TOP POSITION: BOT Ở GIỮA PHÍA TRÊN (P3: Bot Neon) */}
        {topBot && (
          <div className="w-full flex flex-col items-center justify-start mt-0.5 z-20">
            {(() => {
              const topBotIdx = bots.findIndex((b) => b.id === topBot.id);
              const topBotSeatIndex = topBotIdx + 1;
              const isTopActive = currentTurnIndex === topBotSeatIndex;
              return (
                <div
                  className={`relative flex flex-col items-center px-6 py-2 rounded-2xl backdrop-blur-md border shadow-md transition-all ${
                    isTopActive
                      ? 'bg-gradient-to-b from-amber-500/25 via-slate-900/95 to-amber-950/40 border-2 border-amber-300 ring-4 ring-amber-400/80 text-white shadow-[0_0_40px_rgba(251,191,36,0.85)] scale-110 z-30 animate-bot-spotlight'
                      : 'bg-surface-container-low/90 border-white/10 text-slate-300 opacity-75'
                  }`}
                >
                  {isTopActive ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-headline font-black text-[9px] uppercase tracking-wider shadow-lg whitespace-nowrap animate-pulse">
                      <span>👑 ĐẾN LƯỢT (P{topBot.playerNumber || topBotSeatIndex + 1} - {topBot.name})</span>
                    </div>
                  ) : (
                    <span className="absolute -top-3 px-2 py-0.5 rounded-full bg-slate-900 border border-white/20 text-white font-mono font-black text-[9px] uppercase tracking-wider shadow-md">
                      {topBot.playerNumber ? `P${topBot.playerNumber}` : `P${topBotSeatIndex + 1}`}
                    </span>
                  )}
                  <div className="flex items-center gap-2.5 mt-0.5 relative">
                    {renderAvatarFxBadge(topBot.id)}
                    <span className={`text-2xl p-1 rounded-full ${
                      isTopActive ? 'ring-2 ring-amber-300 bg-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.6)]' : ''
                    }`}>{topBot.avatar}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold tracking-wide ${
                        isTopActive ? 'text-amber-300 font-black' : 'text-white'
                      }`}>{topBot.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-amber-300 font-bold">
                        {topBot.hand.length} lá bài
                      </span>
                    </div>
                  </div>

                  {/* Fan of Face-down cards */}
                  <div className="flex -space-x-3.5 pt-1 min-h-[42px] items-center">
                    {topBot.hand.map((c, cIdx) => {
                      const rotationDegree = -8 + (cIdx * 16) / Math.max(1, topBot.hand.length - 1);
                      return (
                        <div
                          key={c.id || `${topBot.id}_card_${cIdx}`}
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

        {/* 3. MIDDLE SECTION: BÀN ĐẤU TRUNG TÂM (Trái: Bot Cyber, Giữa: Piles & Ring, Phải: Bot Titan) */}
        <div className="w-full flex items-center justify-between my-auto py-1 relative px-1 sm:px-4 md:px-6">
          
          {/* CÁNH TRÁI: BOT CYBER (P4) */}
          <div className="flex justify-start items-center z-20">
            {renderSideBot(leftBot, 'left')}
          </div>

          {/* TRUNG TÂM: CENTER PILE (Draw Pile & Discard Pile + Orbit Ring) */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative flex items-center justify-center gap-5 sm:gap-8 md:gap-10 py-5 px-6 sm:px-8 md:px-10 rounded-full bg-surface-container-lowest/40 backdrop-blur-xl border border-white/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">

              {/* 4 MŨI TÊN VÒNG CUNG CHỈ THEO LƯỢT NGƯỜI CHƠI (CURVED TURN ARROWS) */}
              <div className="absolute -inset-10 sm:-inset-14 md:-inset-16 pointer-events-none z-10 flex items-center justify-center">
                <svg
                  viewBox="0 0 500 320"
                  className="w-full h-full overflow-visible max-w-[620px] max-h-[400px]"
                  fill="none"
                >
                  <defs>
                    <marker
                      id="orbit-arrow-inactive"
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
                      id="orbit-arrow-cyan"
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
                      id="orbit-arrow-gold"
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
                    const isHuman = currentTurnIndex === 0;

                    return (
                      <g key={key}>
                        {/* Halo phát sáng phía sau khi cung đang active */}
                        {isActive && (
                          <path
                            d={d}
                            stroke={isHuman ? 'rgba(0, 210, 255, 0.4)' : 'rgba(251, 191, 36, 0.4)'}
                            strokeWidth="9"
                            strokeLinecap="round"
                            fill="none"
                          />
                        )}

                        {/* Đường vòng cung chính */}
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
                                ? 'url(#orbit-arrow-cyan)'
                                : 'url(#orbit-arrow-gold)'
                              : 'url(#orbit-arrow-inactive)'
                          }
                          style={
                            isActive
                              ? {
                                  filter: isHuman
                                    ? 'drop-shadow(0 0 10px rgba(0, 210, 255, 0.95))'
                                    : 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.95))',
                                }
                              : undefined
                          }
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
              
              {/* Draw Pile: Chồng bài rút */}
              <div
                onClick={handleDrawCard}
                className={`relative flex flex-col items-center group ${
                  isPlayerTurn && !isDrawing && !isShuffling && !isDealing && !isReshufflingDeck && !isTurnTransitioning && (drawTwoStack > 0 || drawnCountInTurn < 2)
                    ? 'cursor-pointer hover:scale-105 active:scale-95'
                    : 'cursor-not-allowed opacity-60 pointer-events-none'
                } transition-transform duration-200`}
                title={
                  drawTwoStack > 0
                    ? `Bấm để nhận phạt bốc ${drawTwoStack} lá và mất lượt`
                    : drawnCountInTurn === 0
                    ? 'Bấm để bốc lá thứ 1 (Nếu đánh được bạn có thể đánh ngay)'
                    : drawnCountInTurn === 1
                    ? 'Bấm để bốc tiếp lá thứ 2 (Nếu vẫn không đánh được sẽ qua lượt)'
                    : 'Đã bốc tối đa 2 lá trong lượt này'
                }
              >
                <div className={`absolute -top-1.5 -left-1.5 w-18 h-26 sm:w-20 sm:h-28 md:w-24 md:h-34 rounded-[18px] bg-[#660022] border border-white/10 opacity-70 pointer-events-none ${
                  isShuffling || isReshufflingDeck ? 'animate-shuffle-left' : ''
                }`} />
                <div className={`absolute -top-0.5 -left-0.5 w-18 h-26 sm:w-20 sm:h-28 md:w-24 md:h-34 rounded-[18px] bg-[#88002d] border border-white/15 opacity-85 pointer-events-none ${
                  isShuffling || isReshufflingDeck ? 'animate-shuffle-right' : ''
                }`} />

                {/* HIỆU ỨNG RÚT BÀI BAY VỀ PHÍA NGƯỜI BỐC */}
                {flyingDraw && (
                  <div
                    key={flyingDraw.id}
                    className={`absolute inset-0 pointer-events-none z-50 flex items-center justify-center ${
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
                      <span className="font-headline font-black text-white text-sm sm:text-base italic drop-shadow">UNO</span>
                    </div>
                  </div>
                )}

                <div className={`relative w-18 h-26 sm:w-20 sm:h-28 md:w-24 md:h-34 rounded-[18px] border-2 shadow-2xl flex flex-col items-center justify-center select-none ${
                  isShuffling || isReshufflingDeck
                    ? 'bg-gradient-to-br from-indigo-700 to-purple-900 border-cyan-400 animate-pulse animate-reshuffle-vortex'
                    : drawTwoStack > 0
                    ? 'bg-gradient-to-br from-amber-600 to-rose-700 border-amber-300 animate-pulse ring-2 ring-amber-400'
                    : drawnCountInTurn === 1
                    ? 'bg-gradient-to-br from-cyan-600 to-blue-700 border-cyan-300 ring-2 ring-cyan-400/60 shadow-[0_0_20px_rgba(0,210,255,0.4)]'
                    : 'bg-gradient-to-br from-[#e00050] to-[#990033] border-white/25'
                }`}>
                  <div className="w-10 h-7 sm:w-12 sm:h-8 md:w-16 md:h-10 rounded-full bg-black/25 flex items-center justify-center transform -rotate-12 border border-white/20 mb-1">
                    <span className="font-headline font-black text-[11px] sm:text-xs md:text-sm text-white italic tracking-tighter drop-shadow">
                      UNO
                    </span>
                  </div>
                  
                  <span className="text-[9px] sm:text-[10px] md:text-xs font-headline font-bold text-white uppercase tracking-wider drop-shadow-md text-center px-1">
                    {isShuffling
                      ? 'Đang xáo...'
                      : isReshufflingDeck
                      ? 'Xáo lại bài...'
                      : isDealing
                      ? `Chia ${dealingRound}/7`
                      : drawTwoStack > 0
                      ? `Phạt +${drawTwoStack}`
                      : drawnCountInTurn === 0
                      ? 'Bốc Lá 1'
                      : drawnCountInTurn === 1
                      ? 'Bốc Lá 2'
                      : 'Đã Bốc 2/2'}
                  </span>
                  
                  <span className="text-[9px] text-white/70 font-mono mt-0.5">
                    ({drawPile.length})
                  </span>
                </div>
              </div>

              {/* Discard Pile: Chồng bài đã đánh */}
              <div className="relative flex items-center justify-center min-w-[90px] sm:min-w-[100px] min-h-[130px] sm:min-h-[140px]">
                {/* HIỆU ỨNG ĐÁNH BÀI BAY VÀO CHỒNG BÀI BỎ */}
                {flyingPlay && (
                  <div
                    key={flyingPlay.id}
                    className={`absolute inset-0 pointer-events-none z-50 flex items-center justify-center ${
                      flyingPlay.direction === 'bottom'
                        ? 'animate-play-bottom'
                        : flyingPlay.direction === 'top'
                        ? 'animate-play-top'
                        : flyingPlay.direction === 'left'
                        ? 'animate-play-left'
                        : 'animate-play-right'
                    }`}
                  >
                    <UnoCard
                      color={flyingPlay.card.color}
                      value={flyingPlay.card.value}
                    />
                  </div>
                )}

                {activeDiscard ? (
                  <>
                    <div
                      className={`absolute -inset-4 rounded-full blur-2xl animate-pulse pointer-events-none transition-colors duration-500 ${
                        COLOR_GLOW_MAP[activeColor || activeDiscard?.color] || COLOR_GLOW_MAP.red
                      }`}
                    />

                    {shockwaveActive && (
                      <div className="absolute inset-0 rounded-full border-cyan-400 animate-shockwave pointer-events-none" />
                    )}

                    <div className={`relative transition-transform duration-300 ${
                      cardPlaySlam ? 'animate-card-slam' : 'rotate-[-3deg]'
                    }`}>
                      <UnoCard
                        color={activeDiscard.color}
                        value={activeDiscard.value}
                      />
                    </div>

                    {activeColor && (
                      <div className="absolute -bottom-6 flex items-center gap-1 text-[10px] font-bold text-slate-300 bg-black/70 px-2.5 py-0.5 rounded-full border border-white/20 backdrop-blur-sm whitespace-nowrap">
                        <span>Màu hiện tại:</span>
                        <span className={`uppercase font-black ${
                          activeColor === 'red' ? 'text-rose-400' :
                          activeColor === 'blue' ? 'text-sky-400' :
                          activeColor === 'green' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {COLOR_NAME_MAP[activeColor] || activeColor}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-18 h-26 sm:w-20 sm:h-28 md:w-24 md:h-34 rounded-[18px] border-2 border-dashed border-white/20 flex items-center justify-center text-slate-400 text-xs font-mono">
                    Đang chia...
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* CÁNH PHẢI: BOT TITAN (P2) */}
          <div className="flex justify-end items-center z-20">
            {renderSideBot(rightBot, 'right')}
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

        </div>

        {/* 4. BOTTOM SECTION: BẠN (P1 - PLAYER HAND & HUD) */}
        <div className="w-full flex flex-col items-center gap-2 pt-1 z-20">
          {/* Player Hand */}
          <div className={`flex items-end justify-center -space-x-3 md:-space-x-5 hover:-space-x-1 transition-all duration-300 px-4 py-2 overflow-x-auto max-w-full min-h-[140px] rounded-3xl ${
            isPlayerTurn
              ? 'bg-primary-container/10 border-2 border-primary-container/40 shadow-[0_0_35px_rgba(0,210,255,0.25)]'
              : ''
          }`}>
            {playerHand.map((card, index) => {
              const isSelectedWild = colorPickerOpen && pendingWildCard?.id === card.id;
              const isOtherCardWhilePicking = colorPickerOpen && pendingWildCard?.id !== card.id;
              const isPlayable = isPlayerTurn && !isDrawing && !isShuffling && !isDealing && !isReshufflingDeck && !isTurnTransitioning && checkValidCard(card, activeDiscard, drawTwoStack);
              const isShaking = shakingCardId === card.id;
              const isNewlyDealt = isDealing && index === playerHand.length - 1;

              return (
                <div
                  key={card.id || `player_card_${index}`}
                  onClick={() => {
                    if (isCardActionLockedRef.current) return;
                    if (isOtherCardWhilePicking) {
                      handleCancelWildColor();
                      setTimeout(() => handlePlayCard(card), 50);
                    } else if (isSelectedWild) {
                      handleCancelWildColor();
                    } else {
                      handlePlayCard(card);
                    }
                  }}
                  className={`transform transition-all duration-200 shrink-0 ${
                    isNewlyDealt
                      ? 'animate-deal-to-player'
                      : isSelectedWild
                      ? '-translate-y-7 scale-110 z-40 ring-4 ring-primary-container rounded-2xl shadow-[0_0_30px_rgba(0,210,255,0.8)] cursor-pointer'
                      : isOtherCardWhilePicking
                      ? 'opacity-40 hover:opacity-80 scale-95 transition-opacity cursor-pointer'
                      : !isPlayerTurn || isDrawing || isShuffling || isDealing || isReshufflingDeck || isTurnTransitioning || isCardActionLockedRef.current
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

          {/* Player HUD */}
          <div className={`w-full max-w-xl flex items-center justify-between px-5 py-2.5 rounded-full backdrop-blur-md shadow-md relative transition-all duration-300 ${
            isPlayerTurn
              ? 'bg-gradient-to-r from-primary-container/30 via-cyan-950/90 to-primary-container/30 border-2 border-primary-container ring-4 ring-primary-container/70 shadow-[0_0_45px_rgba(0,210,255,0.7)] scale-102 animate-player-spotlight'
              : 'bg-surface-container-low/90 border border-white/10 opacity-80'
          }`}>
            {/* Banner nổi bật khi đến lượt bạn */}
            {isPlayerTurn && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-primary-container text-black font-headline font-black text-[10px] uppercase tracking-wider shadow-[0_0_20px_rgba(0,210,255,0.8)] animate-pulse whitespace-nowrap z-30">
                <span className="material-symbols-outlined text-xs">play_circle</span>
                <span>✨ LƯỢT ĐÁNH CỦA BẠN ({turnTimer}s)</span>
              </div>
            )}

            <div className="flex items-center gap-2.5 relative">
              {renderAvatarFxBadge('player')}
              <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shadow-md ${
                isPlayerTurn
                  ? 'bg-primary-container text-black ring-2 ring-white shadow-[0_0_15px_rgba(0,210,255,0.8)]'
                  : 'bg-primary-container/60 text-black'
              }`}>
                P1
              </div>
              <div className="flex flex-col">
                <span className={`text-xs font-bold leading-tight ${isPlayerTurn ? 'text-primary-container font-black' : 'text-white'}`}>
                  Bạn (Dưới)
                </span>
                <span className="text-[10px] text-slate-400">{playerHand.length} lá trên tay</span>
              </div>
            </div>

            {isPlayerTurn && drawnCountInTurn > 0 && !isDrawing && !isShuffling && !isDealing && !isTurnTransitioning && (
              <button
                onClick={handlePassTurn}
                className="px-3.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/50 text-amber-300 text-xs font-bold transition-colors cursor-pointer animate-pulse"
                title="Bấm để kết thúc lượt nếu không muốn đánh lá bài nào"
              >
                Bỏ Lượt ↷
              </button>
            )}

            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border transition-colors ${
                  turnTimer <= 5
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                    : isPlayerTurn
                    ? 'bg-primary-container/25 border-primary-container text-primary-container font-black shadow-[0_0_15px_rgba(0,210,255,0.5)]'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
                title={`Thời gian lượt đánh (${TURN_TIME_LIMIT}s)`}
              >
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>{turnTimer}s</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* KHU VỰC THAO TÁC GÓC DƯỚI PHẢI: BÁNH XE BIỂU CẢM (TASK 3) & NÚT BÁO UNO */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-40 flex flex-col items-center gap-2">
        {/* NÚT BÁNH XE BIỂU CẢM & CHAT NHANH */}
        <EmoteWheel
          onSendEmote={handleSendEmote}
          players={allPlayersList}
          mySeatIndex={0}
          disabled={isDealing || isShuffling}
        />

        {(() => {
          const handCount = gameState?.playerHand?.length || 0;
          const canCallUno = handCount <= 2 && handCount > 0 && !hasCalledUno && !isDealing && !isShuffling;
          const isOverTwoCards = handCount > 2;

          return (
            <button
              onClick={handleCallUno}
              disabled={!canCallUno && !hasCalledUno}
              className={`relative group flex flex-col items-center justify-center transition-all duration-300 rounded-full select-none ${
                canCallUno
                  ? handCount === 1
                    ? 'w-22 h-22 sm:w-26 sm:h-26 bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 border-4 border-white shadow-[0_0_50px_rgba(244,63,94,0.95)] ring-4 ring-yellow-400 hover:scale-110 active:scale-95 animate-bounce cursor-pointer'
                    : 'w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 border-3 border-white shadow-[0_0_35px_rgba(245,158,11,0.85)] ring-2 ring-yellow-300 hover:scale-105 active:scale-95 cursor-pointer'
                  : hasCalledUno
                  ? 'w-18 h-18 sm:w-20 sm:h-20 bg-emerald-600/90 border-2 border-emerald-300 text-white shadow-[0_0_25px_rgba(16,185,129,0.7)] opacity-90 cursor-default'
                  : 'w-18 h-18 sm:w-20 sm:h-20 bg-surface-container-high/40 border border-white/10 text-slate-500 opacity-30 cursor-not-allowed'
              }`}
              title={
                hasCalledUno
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

              <span className={`font-headline font-black italic tracking-tighter drop-shadow-lg ${
                canCallUno
                  ? 'text-2xl sm:text-3xl text-white'
                  : hasCalledUno
                  ? 'text-lg sm:text-xl text-emerald-100'
                  : 'text-base sm:text-lg text-slate-500'
              }`}>
                UNO
              </span>

              <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${
                hasCalledUno ? 'text-emerald-200' : canCallUno ? 'text-white/90' : 'text-slate-500'
              }`}>
                {hasCalledUno ? '✓ ĐÃ BÁO' : canCallUno ? (handCount === 1 ? 'BÁO UNO' : 'BÁO TRƯỚC') : 'KHÓA'}
              </span>

              {isOverTwoCards && (
                <span className="absolute -bottom-2 px-1.5 py-0.2 rounded-full bg-black/80 border border-white/10 text-[8px] text-slate-400 font-mono">
                  {handCount} lá
                </span>
              )}
            </button>
          );
        })()}
      </div>

      {/* MODAL CHỌN MÀU (WILD COLOR PICKER) - NỀN MỜ TRONG SUỐT, NHÌN THẲNG THẤY BÀI TRÊN TAY */}
      {colorPickerOpen && pendingWildCard && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-none flex flex-col items-center justify-center pb-28 sm:pb-36 z-50 animate-fade-in p-4"
          onClick={handleCancelWildColor}
        >
          <div
            className="bg-[#121826]/95 border-2 border-primary-container/50 p-4 sm:p-5 rounded-3xl max-w-sm w-full shadow-[0_0_50px_rgba(0,210,255,0.35)] text-center flex flex-col gap-3.5 relative animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút X đóng/hủy chọn */}
            <button
              onClick={handleCancelWildColor}
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
                  count: playerHandColorStats.red,
                  bg: 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400',
                  ring: 'ring-rose-400',
                },
                {
                  key: 'blue',
                  name: 'XANH DƯƠNG',
                  count: playerHandColorStats.blue,
                  bg: 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400',
                  ring: 'ring-cyan-400',
                },
                {
                  key: 'green',
                  name: 'XANH LÁ',
                  count: playerHandColorStats.green,
                  bg: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400',
                  ring: 'ring-emerald-400',
                },
                {
                  key: 'yellow',
                  name: 'MÀU VÀNG',
                  count: playerHandColorStats.yellow,
                  bg: 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black',
                  ring: 'ring-amber-300',
                },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => handleSelectWildColor(c.key)}
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
              onClick={handleCancelWildColor}
              className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-300 hover:text-white font-headline text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">undo</span>
              <span>HỦY CHỌN (ĐỔI LÁ KHÁC)</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL KẾT THÚC TRẬN ĐẤU & BẢNG XẾP HẠNG THỨ TỰ */}
      {winner && endGameRankings && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-container-high border border-primary-container/40 p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-[0_0_80px_rgba(0,210,255,0.3)] text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-3xl shadow-lg mb-3">
              {winner === 'player' ? '🏆' : '🎮'}
            </div>

            <h2 className="font-headline font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
              {winner === 'player' ? 'BẠN ĐÃ CHIẾN THẮNG!' : `${winner} CHIẾN THẮNG!`}
            </h2>

            <p className="text-xs text-slate-300 mt-1 mb-5">
              {endGameReason === 'timeout'
                ? '⏱ Trận đấu 5 phút đã kết thúc! Xếp hạng ưu tiên người ít lá bài nhất; nếu bằng số lá, người có tổng điểm phạt của bài nhỏ hơn (+2, +4, Skip...) sẽ xếp trên:'
                : 'Trận đấu kết thúc do có người chơi đã đánh hết toàn bộ bài trên tay:'}
            </p>

            {/* Bảng xếp hạng thứ tự 1, 2, 3, 4 */}
            <div className="w-full flex flex-col gap-2 mb-6">
              {endGameRankings.map((contender, rIdx) => {
                const rankMedals = ['🥇', '🥈', '🥉', '4th'];
                const isWinnerRank = rIdx === 0;

                return (
                  <div
                    key={contender.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isWinnerRank
                        ? 'bg-amber-500/20 border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                        : contender.isHuman
                        ? 'bg-primary-container/15 border-primary-container/40'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-headline font-black text-lg w-6 text-center">
                        {rankMedals[rIdx]}
                      </span>
                      <span className="text-xl">{contender.avatar}</span>
                      <div className="flex flex-col text-left">
                        <span className={`text-xs font-bold ${isWinnerRank ? 'text-amber-300' : 'text-white'}`}>
                          {contender.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {contender.isHuman ? 'Người chơi' : contender.badge || 'Bot AI'}
                        </span>
                      </div>
                    </div>

                    {(() => {
                      const pRes = matchResultRewards?.playersResult?.find(
                        (pr) => pr.id === contender.id || (contender.isHuman && pr.isHuman) || pr.rank === (rIdx + 1)
                      );

                      return (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-black/40 text-[11px] font-mono font-bold text-slate-200 border border-white/10">
                                {contender.cardCount} lá
                              </span>
                              {pRes && (
                                <span
                                  className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-full border ${
                                    pRes.eloDelta > 0
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                      : pRes.eloDelta === 0
                                      ? 'bg-slate-700/40 text-slate-400 border-slate-600/40'
                                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                                  }`}
                                  title={`Điểm ELO mới: ${pRes.newElo}`}
                                >
                                  {pRes.eloDelta > 0 ? `+${pRes.eloDelta}` : pRes.eloDelta} ELO
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {pRes && (
                                <span className="text-[10px] text-amber-300/90 font-mono font-bold">
                                  {pRes.newElo} ELO
                                </span>
                              )}
                              {contender.cardCount > 0 && contender.handPoints !== undefined && (
                                <span className="text-[9px] text-slate-400 font-mono" title="Tổng điểm các lá bài trên tay theo luật UNO quốc tế">
                                  ({contender.handPoints}đ)
                                </span>
                              )}
                            </div>
                          </div>
                          {isWinnerRank && (
                            <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                              TOP 1
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>

            {/* THƯỞNG ELO & VÀNG SAU TRẬN ĐẤU (TỰ ĐỘNG ĐỒNG BỘ MONGODB ATLAS) */}
            {matchResultRewards && (
              <div className="w-full mb-5 p-3.5 rounded-2xl bg-surface-container-low/80 border border-primary-container/30 shadow-md flex items-center justify-around text-xs animate-fade-in">
                {/* ELO */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Điểm ELO</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="font-headline font-black text-amber-300 text-sm">
                      {matchResultRewards.newElo}
                    </span>
                    {matchResultRewards.eloDelta !== 0 ? (
                      <span className={`text-[11px] font-bold font-mono ${matchResultRewards.eloDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ({matchResultRewards.eloDelta >= 0 ? `+${matchResultRewards.eloDelta}` : matchResultRewards.eloDelta})
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400" title="Chế độ Khách chỉ chơi luyện tập với Bot, không tích lũy Rank ELO">
                        (Khách)
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-px h-8 bg-white/10" />

                {/* Tiền Vàng */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thưởng Vàng</span>
                  <div className="flex items-center gap-1 mt-0.5 font-mono font-bold text-yellow-300 text-sm">
                    <span>🪙 +{matchResultRewards.coinsDelta}</span>
                  </div>
                </div>

                <div className="w-px h-8 bg-white/10" />

                {/* EXP & Cấp */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {matchResultRewards.isLevelUp ? '🎉 LÊN CẤP!' : 'Kinh Nghiệm'}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5 font-mono font-bold text-sky-300 text-sm">
                    <span>⚡ +{matchResultRewards.expDelta}</span>
                  </div>
                </div>

                {/* Bậc Rank */}
                {(() => {
                  const userTier = getRankTier(matchResultRewards.newElo);
                  return (
                    <>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bậc Rank</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${userTier.bg} ${userTier.glow}`}>
                            {userTier.badge} {userTier.name}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Thanh đếm ngược 120s tự động quay về sảnh */}
            <div className="w-full mb-3 px-3.5 py-2 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-1.5 shadow-inner">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                  <span className="material-symbols-outlined text-sm text-cyan-400">timer</span>
                  Tự động quay về sảnh sau:
                </span>
                <span className="font-mono font-black text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/30">
                  {autoReturnCountdown}s
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, (autoReturnCountdown / 120) * 100))}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full">
              <button
                onClick={startShuffleAndDeal}
                className="flex-1 min-w-[120px] py-3 rounded-2xl bg-gradient-to-r from-primary-container to-cyan-400 text-black font-headline font-black text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                Chơi Ván Mới
              </button>
              <button
                onClick={() => setShowLeaderboard(true)}
                className="py-3 px-3.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🏆</span> Bảng Rank
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="py-3 px-3.5 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>📜</span> Lịch Sử
              </button>
              <button
                onClick={() => {
                  clearActiveMatch();
                  onBack();
                }}
                className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Thoát</span>
                <span className="font-mono text-cyan-300 text-[11px]">({autoReturnCountdown}s)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CẢNH BÁO BỎ CUỘC KHI ẤN NÚT THOÁT */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-body">
          <div className="relative w-full max-w-md bg-[#0f1422]/95 border-2 border-rose-500/60 rounded-3xl p-6 shadow-[0_0_60px_rgba(244,63,94,0.4)] flex flex-col gap-5 overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)] shrink-0">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <h3 className="font-headline text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  CẢNH BÁO BỎ CUỘC
                </h3>
                <p className="text-xs text-rose-300">
                  Trận đấu vẫn đang diễn ra!
                </p>
              </div>
            </div>

            {/* Nội dung chi tiết hình phạt */}
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs">
              <p className="text-slate-200 leading-relaxed">
                Nếu bạn rời trận lúc này, bạn sẽ bị coi là <strong className="text-rose-400">bỏ cuộc (AFK)</strong> và chịu các hình phạt sau:
              </p>

              <div className="space-y-1.5 pl-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span>• Thứ hạng:</span>
                  <span className="font-bold text-rose-400">Hạng Chót ({totalPlayers}/{totalPlayers})</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>• Điểm hạng chót:</span>
                  <span className="font-mono font-bold text-rose-400">{totalPlayers === 4 ? '-20 ELO' : '-15 ELO'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>• Hình phạt bỏ cuộc:</span>
                  <span className="font-mono font-bold text-rose-300">-10 ELO</span>
                </div>
                <div className="pt-2 border-t border-rose-500/30 flex items-center justify-between font-black text-sm text-white">
                  <span>💥 TỔNG HÌNH PHẠT:</span>
                  <span className="text-rose-400 font-mono text-base">{totalPlayers === 4 ? '-30 ELO' : '-25 ELO'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>• Thưởng Coins:</span>
                  <span className="font-mono font-bold text-slate-400">0 Coins</span>
                </div>
              </div>

              <div className="mt-1 pt-2 border-t border-white/5 text-[11px] text-slate-400 italic">
                ℹ️ Những đối thủ còn lại trong bàn vẫn sẽ tiếp tục thi đấu bình thường.
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsExitModalOpen(false)}
                disabled={isSubmittingForfeit}
                className="flex-1 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-headline text-xs font-bold uppercase transition-all cursor-pointer"
              >
                Tiếp Tục Chơi
              </button>
              <button
                type="button"
                onClick={handleConfirmForfeitAndExit}
                disabled={isSubmittingForfeit}
                className="flex-1 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-headline text-xs font-black uppercase tracking-wider shadow-[0_0_25px_rgba(244,63,94,0.6)] hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingForfeit ? (
                  <span>Đang xử lý...</span>
                ) : (
                  <span>Thoát & Chịu Phạt</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL BẢNG VINH DANH & HỆ THỐNG BẬC RANK */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      {/* MODAL LỊCH SỬ ĐẤU TRƯỜNG */}
      <MatchHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </main>
  );
}
