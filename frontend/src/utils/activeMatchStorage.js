import { matchApi } from '../apis/matchApi.js';

const STORAGE_KEY = 'NEO_ACTIVE_MATCH';

/**
 * Kiểm tra lá bài có hợp lệ với lá bài trên chồng bài bỏ hay không
 */
export function isValidCardPlay(card, currentDiscard, activeColor, currentStack) {
  if (!card || !currentDiscard) return false;
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
}

/**
 * MÔ PHỎNG TRẬN ĐẤU VẪN TIẾP TỤC CHẠY KHI NGƯỜI CHƠI THOÁT WEB (AFK CATCH-UP)
 * - Đồng hồ ván đấu 5 phút KHÔNG DỪNG (trừ thời gian thực trôi qua).
 * - Các Bot vẫn tiếp tục ra bài, bốc bài theo lượt.
 * - Khi đến lượt người chơi vắng mặt (AFK): hết 15s tự động bốc bài/bỏ lượt.
 */
export function catchUpActiveMatch(session) {
  if (!session || session.status !== 'in_progress') return session;

  const now = Date.now();
  const lastActive = session.updatedAt || session.createdAt || now;
  const elapsedSeconds = Math.max(0, Math.floor((now - lastActive) / 1000));

  if (elapsedSeconds <= 0) return session;

  let matchTimeRemaining = (session.matchTimeRemaining ?? 300) - elapsedSeconds;
  let playerHand = [...(session.playerHand || [])];
  let bots = (session.bots || []).map((b) => ({ ...b, hand: [...(b.hand || [])] }));
  let drawPile = [...(session.drawPile || [])];
  let discardPile = [...(session.discardPile || [])];
  let currentTurnIndex = session.currentTurnIndex ?? 0;
  let turnDirection = session.turnDirection ?? 1;
  let drawTwoStack = session.drawTwoStack ?? 0;
  let activeColor = session.activeColor || (discardPile[discardPile.length - 1]?.color) || 'red';
  let winner = session.winner || null;

  const totalPlayers = 1 + bots.length;

  const getNextSeat = (current, steps = 1) => {
    let next = (current + steps * turnDirection) % totalPlayers;
    if (next < 0) next += totalPlayers;
    return next;
  };

  const drawOne = () => {
    if (drawPile.length === 0) {
      if (discardPile.length > 1) {
        const top = discardPile.pop();
        drawPile = discardPile.sort(() => Math.random() - 0.5);
        discardPile = [top];
      }
    }
    return drawPile.pop() || null;
  };

  // Giới hạn mô phỏng tối đa theo thời gian còn lại của trận đấu
  let simulatedSec = 0;
  const maxToSimulate = Math.min(elapsedSeconds, session.matchTimeRemaining || 300);

  while (simulatedSec < maxToSimulate && !winner) {
    const currentDiscard = discardPile[discardPile.length - 1];

    if (currentTurnIndex === 0) {
      // Lượt người chơi: Người chơi đang AFK (vắng mặt)!
      // Hết 15 giây đếm ngược, tự động bốc 2 lá phạt và chuyển lượt
      simulatedSec += 15;

      if (drawTwoStack > 0) {
        for (let i = 0; i < drawTwoStack; i++) {
          const c = drawOne();
          if (c) playerHand.push(c);
        }
        drawTwoStack = 0;
      } else {
        // Đúng theo luật: Hết 15s tự động bốc 2 lá phạt rồi mất lượt
        for (let i = 0; i < 2; i++) {
          const c = drawOne();
          if (c) playerHand.push(c);
        }
      }

      currentTurnIndex = getNextSeat(currentTurnIndex, 1);
    } else {
      // Lượt Bot: Bot suy nghĩ và ra bài trong ~2 giây
      simulatedSec += 2;
      const bot = bots[currentTurnIndex - 1];

      if (bot) {
        const playableIdx = bot.hand.findIndex((c) =>
          isValidCardPlay(c, currentDiscard, activeColor, drawTwoStack)
        );

        if (playableIdx !== -1) {
          const [playedCard] = bot.hand.splice(playableIdx, 1);
          discardPile.push(playedCard);

          if (playedCard.color === 'wild') {
            const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
            bot.hand.forEach((c) => {
              if (colorCounts[c.color] !== undefined) colorCounts[c.color]++;
            });
            const bestColor = Object.keys(colorCounts).reduce((a, b) =>
              colorCounts[a] >= colorCounts[b] ? a : b
            );
            activeColor = bestColor;
          } else {
            activeColor = playedCard.color;
          }

          if (playedCard.value === 'draw_two') {
            drawTwoStack += 2;
            currentTurnIndex = getNextSeat(currentTurnIndex, 1);
          } else if (playedCard.value === 'reverse') {
            turnDirection = -turnDirection;
            currentTurnIndex = getNextSeat(currentTurnIndex, 1);
          } else if (playedCard.value === 'skip') {
            currentTurnIndex = getNextSeat(currentTurnIndex, 2);
          } else {
            currentTurnIndex = getNextSeat(currentTurnIndex, 1);
          }

          if (bot.hand.length === 0) {
            winner = bot.name;
            break;
          }
        } else {
          // Bot không có bài hợp lệ -> bốc bài
          if (drawTwoStack > 0) {
            for (let i = 0; i < drawTwoStack; i++) {
              const c = drawOne();
              if (c) bot.hand.push(c);
            }
            drawTwoStack = 0;
          } else {
            const c = drawOne();
            if (c) bot.hand.push(c);
          }
          currentTurnIndex = getNextSeat(currentTurnIndex, 1);
        }
      } else {
        currentTurnIndex = getNextSeat(currentTurnIndex, 1);
      }
    }
  }

  const isExpired = matchTimeRemaining <= 0 || Boolean(winner);

  const updatedSession = {
    ...session,
    matchTimeRemaining: Math.max(0, matchTimeRemaining),
    playerHand,
    bots,
    drawPile,
    discardPile,
    currentTurnIndex,
    turnDirection,
    drawTwoStack,
    activeColor,
    status: isExpired ? 'finished' : 'in_progress',
    winner: winner || (isExpired ? 'Hết giờ (Timeout)' : null),
    updatedAt: now,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
  } catch (err) {
    console.warn('[ActiveMatchStorage] Cập nhật catch-up thất bại:', err.message);
  }

  return updatedSession;
}

/**
 * Lưu trạng thái ván đấu hiện tại vào localStorage
 */
export function saveActiveMatch(state) {
  try {
    if (!state || state.isGameOver) {
      clearActiveMatch();
      return;
    }

    const payload = {
      matchId: state.matchId || `match_${Date.now()}`,
      matchConfig: state.matchConfig || { botCount: 3, timeLimit: 300 },
      matchTimeRemaining: state.matchTimeRemaining ?? 300,
      playerHand: state.playerHand || [],
      bots: (state.bots || []).map((b) => ({
        id: b.id,
        name: b.name,
        avatar: b.avatar,
        badge: b.badge,
        color: b.color,
        position: b.position,
        playerNumber: b.playerNumber,
        hand: b.hand || [],
      })),
      drawPile: state.drawPile || [],
      discardPile: state.discardPile || [],
      currentTurnIndex: state.currentTurnIndex ?? 0,
      turnDirection: state.turnDirection ?? 1,
      drawTwoStack: state.drawTwoStack ?? 0,
      drawnCountInTurn: state.drawnCountInTurn ?? 0,
      activeColor: state.activeColor,
      status: 'in_progress',
      updatedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[ActiveMatchStorage] Lưu ván đấu thất bại:', err.message);
  }
}

/**
 * Đọc ván đấu dở dang (Luôn tự động đồng bộ thời gian thực theo catch-up)
 */
export function getActiveMatch() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    let session = JSON.parse(raw);

    // Nếu ván đấu đã kết thúc trước đó mà chưa dọn
    if (session.status === 'finished') {
      return session;
    }

    // Nếu phiên đã cũ hơn 2 giờ thì hủy bỏ
    if (Date.now() - (session.updatedAt || 0) > 2 * 60 * 60 * 1000) {
      clearActiveMatch();
      return null;
    }

    if (session.playerHand && session.bots) {
      // TỰ ĐỘNG ĐỒNG BỘ NƯỚC ĐI VÀ THỜI GIAN THEO THỜI GIAN THỰC (AFK CATCH-UP)
      session = catchUpActiveMatch(session);
      return session;
    }
    return null;
  } catch (err) {
    console.warn('[ActiveMatchStorage] Đọc ván đấu thất bại:', err.message);
    return null;
  }
}

/**
 * Xóa ván đấu đã kết thúc
 */
export function clearActiveMatch() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Xử thua trận đấu dở dang (Do bấm Thoát hoặc Từ chối vào lại)
 * - Người chơi bị xếp hạng chót
 * - Phạt thêm -10 ELO vì bỏ cuộc (Tổng phạt -30 ELO bàn 4 người)
 * - Ghi kết quả vào MongoDB Atlas
 */
export async function forfeitActiveMatch(session) {
  try {
    const active = session || getActiveMatch();
    const storedUser = localStorage.getItem('neo_user') || localStorage.getItem('user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;

    const botCount = active?.matchConfig?.botCount || (active?.bots?.length) || 3;
    const totalPlayers = 1 + botCount;

    // Tìm bot có ít bài nhất để phong làm winner
    const bots = active?.bots || [];
    let bestBot = bots[0];
    for (const b of bots) {
      if ((b.hand?.length || 99) < (bestBot?.hand?.length || 99)) {
        bestBot = b;
      }
    }

    const winner = bestBot
      ? { id: bestBot.id, name: bestBot.name, isHuman: false }
      : { id: 'bot_neon', name: 'Bot Neon', isHuman: false };

    // Xây dựng danh sách xếp hạng (Người chơi hạng chót)
    const sortedBots = [...bots].sort((a, b) => (a.hand?.length || 0) - (b.hand?.length || 0));
    const playersPayload = [];

    // Các Bot đứng trên
    sortedBots.forEach((b, idx) => {
      playersPayload.push({
        id: b.id,
        name: b.name,
        isHuman: false,
        avatar: b.avatar || '🤖',
        rank: idx + 1,
        finalScore: Math.max(10, 50 - (b.hand?.length || 0) * 5),
        cardsRemaining: b.hand?.length || 0,
      });
    });

    // Người chơi xếp hạng chót cùng
    playersPayload.push({
      id: 'player',
      name: currentUser?.nickname || 'Bạn',
      isHuman: true,
      avatar: currentUser?.avatar || '👤',
      rank: totalPlayers,
      finalScore: 0,
      cardsRemaining: active?.playerHand?.length || 7,
      isForfeit: true,
    });

    const durationSec = Math.max(5, (active?.matchConfig?.timeLimit || 300) - (active?.matchTimeRemaining || 300));

    const res = await matchApi.recordMatch({
      roomCode: 'SOLO_BOT',
      winner,
      reason: 'forfeit_afk',
      durationSeconds: durationSec,
      players: playersPayload,
      userId: currentUser?.id || currentUser?._id,
      isForfeit: true,
    });

    clearActiveMatch();

    if (res?.success && res.updatedUser) {
      localStorage.setItem('neo_user', JSON.stringify(res.updatedUser));
      localStorage.setItem('user', JSON.stringify(res.updatedUser));
    }

    return res;
  } catch (err) {
    console.error('[ActiveMatchStorage] Xử thua thất bại:', err);
    clearActiveMatch();
    return { success: false, message: err.message };
  }
}
