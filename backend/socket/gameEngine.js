/**
 * Game Engine - Trọng tài ván cờ thời gian thực cho NEO-UNO
 */
const User = require('../models/User');
const Match = require('../models/Match');
const PlayerStats = require('../models/PlayerStats');

const COLORS = ['red', 'blue', 'green', 'yellow'];
const ACTION_VALUES = ['skip', 'reverse', 'draw_two'];

function calculateDeltas(totalPlayerCount, rank) {
  let eloDelta = 0;
  let coinsDelta = 0;
  let expDelta = 0;
  let isWin = false;
  let isLoss = false;

  if (totalPlayerCount === 2) {
    if (rank === 1) {
      eloDelta = +15;
      coinsDelta = +70;
      expDelta = +50;
      isWin = true;
    } else {
      eloDelta = -15;
      coinsDelta = +15;
      expDelta = +10;
      isLoss = true;
    }
  } else if (totalPlayerCount === 3) {
    if (rank === 1) {
      eloDelta = +20;
      coinsDelta = +100;
      expDelta = +70;
      isWin = true;
    } else if (rank === 2) {
      eloDelta = +5;
      coinsDelta = +50;
      expDelta = +35;
    } else {
      eloDelta = -15;
      coinsDelta = +20;
      expDelta = +15;
      isLoss = true;
    }
  } else {
    // 4 người
    if (rank === 1) {
      eloDelta = +30;
      coinsDelta = +150;
      expDelta = +100;
      isWin = true;
    } else if (rank === 2) {
      eloDelta = +10;
      coinsDelta = +75;
      expDelta = +50;
    } else if (rank === 3) {
      eloDelta = -5;
      coinsDelta = +40;
      expDelta = +25;
      isLoss = true;
    } else {
      eloDelta = -20;
      coinsDelta = +20;
      expDelta = +10;
      isLoss = true;
    }
  }

  return { eloDelta, coinsDelta, expDelta, isWin, isLoss };
}

function createDeck() {
  const deck = [];
  let cardCount = 0;

  COLORS.forEach((color) => {
    // 1 lá số '0'
    deck.push({
      id: `card_${color}_0_${++cardCount}`,
      color,
      value: '0',
    });

    // 2 bộ lá số từ '1' đến '9'
    for (let set = 1; set <= 2; set++) {
      for (let num = 1; num <= 9; num++) {
        deck.push({
          id: `card_${color}_${num}_set${set}_${++cardCount}`,
          color,
          value: String(num),
        });
      }
    }

    // 2 bộ lá chức năng: skip, reverse, draw_two
    for (let set = 1; set <= 2; set++) {
      ACTION_VALUES.forEach((action) => {
        deck.push({
          id: `card_${color}_${action}_set${set}_${++cardCount}`,
          color,
          value: action,
        });
      });
    }
  });

  // 4 lá wild
  for (let i = 1; i <= 4; i++) {
    deck.push({
      id: `card_wild_${i}_${++cardCount}`,
      color: 'wild',
      value: 'wild',
    });
  }

  // 4 lá wild_draw_four
  for (let i = 1; i <= 4; i++) {
    deck.push({
      id: `card_wild_draw_four_${i}_${++cardCount}`,
      color: 'wild',
      value: 'wild_draw_four',
    });
  }

  return deck;
}

function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function isValidCardPlay(card, topCard, activeColor, drawTwoStack) {
  if (!card) return false;

  // Nếu đang có cộng dồn +2 hoặc +4
  if (drawTwoStack > 0) {
    if (topCard.value === 'draw_two' && card.value === 'draw_two') return true;
    if (topCard.value === 'wild_draw_four' && card.value === 'wild_draw_four') return true;
    return false;
  }

  // Lá bài Wild hoặc Wild +4 luôn đánh được
  if (card.color === 'wild' || card.value === 'wild' || card.value === 'wild_draw_four') {
    return true;
  }

  // Trùng màu đang hoạt động
  if (card.color === activeColor) return true;

  // Trùng giá trị số hoặc chức năng với lá trên cùng
  if (card.value === topCard.value) return true;

  return false;
}

// Lưu trữ các trận đấu online đang chạy theo roomCode
const activeGames = new Map();

class OnlineGame {
  constructor(room, io) {
    this.roomCode = room.code;
    this.io = io;
    this.isRanked = room.isRanked || false;
    this.mode = room.mode || '4_PLAYERS';
    this.startTime = Date.now();

    // Khởi tạo bộ bài
    this.drawPile = shuffleDeck(createDeck());
    this.discardPile = [];

    // Người chơi và bài trên tay
    this.players = room.players.map((p, idx) => ({
      ...p,
      seatIndex: idx,
      hand: this.drawPile.splice(0, 7),
      unoCalled: false,
      isAfk: false,
    }));

    // Chọn lá bài khởi đầu (không phải Wild hay lá phạt chức năng)
    let startIdx = 0;
    for (let i = 0; i < this.drawPile.length; i++) {
      const c = this.drawPile[i];
      if (c.color !== 'wild' && !['draw_two', 'skip', 'reverse'].includes(c.value)) {
        startIdx = i;
        break;
      }
    }
    const [startCard] = this.drawPile.splice(startIdx, 1);
    this.discardPile.push(startCard);

    this.activeColor = startCard.color;
    this.currentTurnIndex = 0;
    this.turnDirection = 1;
    this.drawTwoStack = 0;
    this.drawnCountInTurn = 0;
    this.turnTimeRemaining = 15;
    this.matchTimeRemaining = 300;
    this.status = 'in_game';
    this.winner = null;

    // Giai đoạn phát bài đầu trận (3 giây)
    this.isDealing = true;
    this.dealingCountdown = 3;
    this.isTransitioning = false; // Cờ khóa trạng thái chuyển lượt (chống race condition AFK timeout)
    this.penalizedThisTurn = false; // Đánh dấu đã bị phạt trong lượt này (chống phạt kép 2 lá UNO + 2 lá AFK)

    this.timerInterval = null;
    this.botTimeout = null;
    this.botUnoTimer = null;
    this.unoPenaltyTimer = null;
    this.actionTransitionTimeout = null;

    // Phát trạng thái bàn cờ ban đầu ngay lập tức
    this.broadcastState();
    this.startTimers();
  }

  // Chuyển lượt sau khi hiệu ứng hoạt ảnh kết thúc trơn tru (chống giật và cắt hiệu ứng)
  scheduleTurnTransition(delayMs, nextSeatStep = 1) {
    this.isTransitioning = true;
    if (this.actionTransitionTimeout) clearTimeout(this.actionTransitionTimeout);
    this.actionTransitionTimeout = setTimeout(() => {
      if (this.status !== 'in_game') {
        this.isTransitioning = false;
        return;
      }
      this.currentTurnIndex = this.getNextTurnIndex(nextSeatStep);
      this.turnTimeRemaining = 15;
      this.drawnCountInTurn = 0;
      this.penalizedThisTurn = false;
      this.isTransitioning = false;
      this.broadcastState();
      this.checkBotTurn();
    }, delayMs);
  }

  drawOneCard() {
    if (this.drawPile.length === 0) {
      if (this.discardPile.length > 1) {
        const topCard = this.discardPile.pop();
        this.drawPile = shuffleDeck(this.discardPile);
        this.discardPile = [topCard];
      } else {
        this.drawPile = shuffleDeck(createDeck());
      }
    }
    return this.drawPile.pop();
  }

  getNextTurnIndex(step = 1) {
    const total = this.players.length;
    let next = (this.currentTurnIndex + step * this.turnDirection) % total;
    if (next < 0) next += total;
    return next;
  }

  startTimers() {
    this.timerInterval = setInterval(() => {
      if (this.status !== 'in_game') {
        this.stopTimers();
        return;
      }

      // Đang trong giai đoạn phát bài khởi đầu hoặc đang trong độ trễ chuyển lượt
      if (this.isDealing || this.isTransitioning) {
        if (this.isDealing) {
          this.dealingCountdown -= 1;
          this.io.to(this.roomCode).emit('game:dealing_tick', {
            countdown: this.dealingCountdown,
          });

          if (this.dealingCountdown <= 0) {
            this.isDealing = false;
            this.turnTimeRemaining = 15;
            this.broadcastState();
            this.checkBotTurn();
          }
        }
        return;
      }

      this.matchTimeRemaining = Math.max(0, this.matchTimeRemaining - 1);
      this.turnTimeRemaining -= 1;

      if (this.turnTimeRemaining <= 0) {
        // HẾT 15 GIÂY LƯỢT ĐÁNH -> Xử lý AFK Timeout
        this.handleTurnTimeout();
      } else {
        // Chỉ gửi tick nhẹ đếm giây, KHÔNG gửi lại toàn bộ state tránh lag/giật màn hình
        this.io.to(this.roomCode).emit('game:timer_tick', {
          turnTimeRemaining: this.turnTimeRemaining,
          matchTimeRemaining: this.matchTimeRemaining,
        });
      }

      if (this.matchTimeRemaining <= 0) {
        this.endMatchDueToTimeout();
      }
    }, 1000);
  }

  stopTimers() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.botTimeout) clearTimeout(this.botTimeout);
    if (this.botUnoTimer) clearTimeout(this.botUnoTimer);
    if (this.unoPenaltyTimer) clearTimeout(this.unoPenaltyTimer);
    if (this.actionTransitionTimeout) clearTimeout(this.actionTransitionTimeout);
    this.isTransitioning = false;
  }

  handleTurnTimeout() {
    // Nếu đang trong quá trình chuyển lượt -> BỎ QUA NGAY LẬP TỨC (chống lặp vô tận)
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.turnTimeRemaining = 15; // Reset ngay lập tức để tick kế tiếp không bị trigger lại!

    const curPlayer = this.players[this.currentTurnIndex];
    if (!curPlayer) {
      this.isTransitioning = false;
      return;
    }

    // Nếu người chơi đã bị phạt do quên hô UNO trong lượt này, KHÔNG phạt kép thêm 2 lá AFK
    if (this.penalizedThisTurn) {
      this.penalizedThisTurn = false;
      this.io.to(this.roomCode).emit('game:action_event', {
        type: 'pass_turn',
        playerName: curPlayer.name,
        seatIndex: curPlayer.seatIndex,
        message: `⏰ ${curPlayer.name} hết giờ: Tự động chuyển lượt.`,
      });
      this.scheduleTurnTransition(600, 1);
      return;
    }

    // NẾU NGƯỜI CHƠI ĐÃ BỐC BÀI TRONG LƯỢT (drawnCountInTurn > 0) -> Họ đã tham gia lượt, KHÔNG PHẢI AFK!
    // Tuyệt đối không phạt thêm 2 lá nữa! Chỉ chuyển lượt sang người kế tiếp.
    if (this.drawnCountInTurn > 0) {
      this.drawnCountInTurn = 0;

      this.io.to(this.roomCode).emit('game:action_event', {
        type: 'pass_turn',
        playerName: curPlayer.name,
        seatIndex: curPlayer.seatIndex,
        message: `⏰ ${curPlayer.name} hết giờ sau khi đã bốc bài: Tự động chuyển lượt.`,
      });

      this.scheduleTurnTransition(600, 1);
      return;
    }

    // HÌNH PHẠT HẾT GIỜ (AFK):
    // - Nếu đang có chồng phạt cộng dồn (+2 dồn): nhận toàn bộ số bài phạt của chồng đó
    // - Nếu trong lượt bình thường: tuyệt đối chỉ phạt tối đa 2 lá bài
    const penaltyCount = this.drawTwoStack > 0 ? this.drawTwoStack : 2;
    const isStackedPenalty = this.drawTwoStack > 0;
    this.drawTwoStack = 0;
    this.drawnCountInTurn = 0;

    const penaltyCards = [];
    for (let i = 0; i < penaltyCount; i++) {
      const c = this.drawOneCard();
      if (c) {
        curPlayer.hand.push(c);
        penaltyCards.push(c);
      }
    }
    if (curPlayer.hand.length > 2) {
      curPlayer.unoCalled = false;
    }

    const msg = isStackedPenalty
      ? `💥 ${curPlayer.name} hết giờ: Nhận dồn ${penaltyCount} lá phạt từ chồng bài +2 và mất lượt!`
      : `⏰ ${curPlayer.name} hết 15s (AFK)! Tự động phạt bốc 2 lá và mất lượt!`;

    this.io.to(this.roomCode).emit('game:action_event', {
      type: 'timeout_penalty',
      seatIndex: curPlayer.seatIndex,
      playerName: curPlayer.name,
      count: penaltyCount,
      message: msg,
    });

    this.io.to(this.roomCode).emit('game:card_drawn', {
      seatIndex: curPlayer.seatIndex,
      count: penaltyCards.length,
      isPenalty: true,
      playerName: curPlayer.name,
    });

    // Chuyển lượt dứt khoát sang người kế tiếp sau 1.2s hiệu ứng
    this.scheduleTurnTransition(1200, 1);
  }

  checkBotTurn() {
    if (this.status !== 'in_game') return;

    const curPlayer = this.players[this.currentTurnIndex];
    if (curPlayer && curPlayer.isBot) {
      if (this.botTimeout) clearTimeout(this.botTimeout);
      this.botTimeout = setTimeout(() => {
        this.executeBotTurn(curPlayer);
      }, 1600);
    }
  }

  triggerBotUnoCall(bot) {
    bot.unoCalled = false;
    this.io.to(this.roomCode).emit('game:uno_warning', {
      seatIndex: bot.seatIndex,
      playerName: bot.name,
      countdown: 5,
    });

    if (this.botUnoTimer) clearTimeout(this.botUnoTimer);
    // Bot có thời gian phản xạ 2.0s - 3.5s trước khi hô UNO
    // Trong thời gian này, người chơi có thể bấm nút "BẮT UNO" để phạt bot!
    this.botUnoTimer = setTimeout(() => {
      if (this.status === 'in_game' && bot.hand.length === 1 && !bot.unoCalled) {
        bot.unoCalled = true;
        this.io.to(this.roomCode).emit('game:action_event', {
          type: 'uno',
          seatIndex: bot.seatIndex,
          playerName: bot.name,
          message: `🎉 ${bot.name} đã hô UNO!`,
        });
        this.broadcastState();
      }
    }, 2200 + Math.random() * 1300);
  }

  executeBotTurn(bot) {
    if (this.status !== 'in_game') return;

    // 1. Đối mặt chồng phạt +2
    if (this.drawTwoStack > 0) {
      const botDrawTwoIdx = bot.hand.findIndex((c) => c.value === 'draw_two');
      if (botDrawTwoIdx !== -1) {
        // Bot có lá +2 để đỡ và cộng dồn tiếp
        const [card] = bot.hand.splice(botDrawTwoIdx, 1);
        this.discardPile.push(card);
        this.activeColor = card.color;
        this.drawTwoStack += 2;

        this.io.to(this.roomCode).emit('game:card_played', {
          seatIndex: bot.seatIndex,
          card,
          chosenColor: this.activeColor,
          playerName: bot.name,
          action: 'draw_two',
        });

        this.io.to(this.roomCode).emit('game:action_event', {
          type: 'draw_two',
          playerName: bot.name,
          seatIndex: bot.seatIndex,
          count: this.drawTwoStack,
          message: `🔥 ${bot.name} đỡ đòn với lá +2! Chồng phạt: +${this.drawTwoStack} lá!`,
        });

        if (bot.hand.length === 1) this.triggerBotUnoCall(bot);
        if (bot.hand.length === 0) {
          this.finishGame(bot);
          return;
        }

        this.scheduleTurnTransition(900, 1);
        return;
      } else {
        // Bot không có lá +2: Nhận toàn bộ bài phạt cộng dồn và mất lượt
        const count = this.drawTwoStack;
        this.drawTwoStack = 0;
        this.drawnCountInTurn = 0;

        for (let i = 0; i < count; i++) {
          const c = this.drawOneCard();
          if (c) bot.hand.push(c);
        }
        if (bot.hand.length > 2) bot.unoCalled = false;

        this.io.to(this.roomCode).emit('game:action_event', {
          type: 'draw_two_penalize',
          seatIndex: bot.seatIndex,
          playerName: bot.name,
          count,
          message: `💥 ${bot.name} nhận +${count} lá phạt và mất lượt!`,
        });

        this.io.to(this.roomCode).emit('game:card_drawn', {
          seatIndex: bot.seatIndex,
          count,
          isPenalty: true,
          playerName: bot.name,
        });

        const animDelay = Math.max(1600, count * 380 + 400);
        this.scheduleTurnTransition(animDelay, 1);
        return;
      }
    }

    // 2. Đánh bài thông thường
    const topCard = this.discardPile[this.discardPile.length - 1];

    // CHIẾN THUẬT BOT CÔNG BẰNG & THÔNG MINH:
    // Ưu tiên 1: Đánh bài số thông thường cùng màu hoặc cùng số (0-9)
    // Ưu tiên 2: Đánh bài chức năng cùng màu (Skip, Reverse, Draw Two)
    // Ưu tiên 3: Đánh lá Wild đổi màu
    // Ưu tiên 4: CUỐI CÙNG mới dùng Wild Draw Four (+4) khi không còn lá nào khác!
    const validEntries = bot.hand
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => isValidCardPlay(card, topCard, this.activeColor, 0));

    let chosenEntry = null;
    if (validEntries.length > 0) {
      chosenEntry = validEntries.find(
        ({ card }) => card.color !== 'wild' && !['skip', 'reverse', 'draw_two'].includes(card.value)
      );
      if (!chosenEntry) {
        chosenEntry = validEntries.find(
          ({ card }) => card.color !== 'wild' && ['skip', 'reverse', 'draw_two'].includes(card.value)
        );
      }
      if (!chosenEntry) {
        chosenEntry = validEntries.find(({ card }) => card.value === 'wild');
      }
      if (!chosenEntry) {
        chosenEntry = validEntries.find(({ card }) => card.value === 'wild_draw_four');
      }
    }

    if (chosenEntry) {
      const [card] = bot.hand.splice(chosenEntry.index, 1);
      this.discardPile.push(card);

      let chosenColor = card.color;
      if (card.color === 'wild') {
        const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
        bot.hand.forEach((c) => {
          if (colorCounts[c.color] !== undefined) colorCounts[c.color]++;
        });
        chosenColor = Object.keys(colorCounts).reduce((a, b) =>
          colorCounts[a] >= colorCounts[b] ? a : b
        );
      }
      this.activeColor = chosenColor;

      // Phát sự kiện đánh bài cho tất cả client tạo hiệu ứng
      this.io.to(this.roomCode).emit('game:card_played', {
        seatIndex: bot.seatIndex,
        card,
        chosenColor: this.activeColor,
        playerName: bot.name,
        action: card.value,
      });

      if (bot.hand.length === 1) this.triggerBotUnoCall(bot);
      if (bot.hand.length === 0) {
        this.finishGame(bot);
        return;
      }

      // Xử lý hiệu ứng lá bài
      if (card.value === 'wild_draw_four') {
        const victim = this.players[this.getNextTurnIndex(1)];
        const penaltyCount = 4;
        for (let i = 0; i < penaltyCount; i++) {
          const c = this.drawOneCard();
          if (c) victim.hand.push(c);
        }
        if (victim.hand.length > 2) victim.unoCalled = false;

        this.io.to(this.roomCode).emit('game:action_event', {
          type: 'wild_draw_four',
          playerName: bot.name,
          seatIndex: bot.seatIndex,
          victimSeatIndex: victim.seatIndex,
          victimName: victim.name,
          chosenColor: this.activeColor,
          count: penaltyCount,
          message: `⚡ ${bot.name} đánh WILD +4! ${victim.name} bị phạt bốc 4 lá và chuyển lượt!`,
        });

        this.io.to(this.roomCode).emit('game:card_drawn', {
          seatIndex: victim.seatIndex,
          count: penaltyCount,
          isPenalty: true,
          playerName: victim.name,
        });

        const step = this.players.length === 2 ? 1 : 2;
        this.scheduleTurnTransition(2000, step);
        return;
      } else if (card.value === 'draw_two') {
        this.drawTwoStack += 2;
        this.io.to(this.roomCode).emit('game:action_event', {
          type: 'draw_two',
          playerName: bot.name,
          seatIndex: bot.seatIndex,
          count: this.drawTwoStack,
          message: `🔥 ${bot.name} đánh lá +2! Chồng phạt: +${this.drawTwoStack} lá!`,
        });
        this.scheduleTurnTransition(900, 1);
        return;
      } else if (card.value === 'skip') {
        const victim = this.players[this.getNextTurnIndex(1)];
        this.io.to(this.roomCode).emit('game:action_event', {
          type: 'skip',
          playerName: bot.name,
          seatIndex: bot.seatIndex,
          targetSeatIndex: victim.seatIndex,
          targetName: victim.name,
          message: `🛑 ${bot.name} đã chặn lượt của ${victim.name}!`,
        });
        this.scheduleTurnTransition(1200, 2);
        return;
      } else if (card.value === 'reverse') {
        this.turnDirection = -this.turnDirection;
        const step = this.players.length === 2 ? 2 : 1;
        this.io.to(this.roomCode).emit('game:action_event', {
          type: 'reverse',
          playerName: bot.name,
          seatIndex: bot.seatIndex,
          direction: this.turnDirection,
          message: `🔄 ${bot.name} đã đổi chiều vòng đánh!`,
        });
        this.scheduleTurnTransition(1000, step);
        return;
      } else {
        this.scheduleTurnTransition(750, 1);
        return;
      }
    } else {
      // Bot bốc 1 lá
      const c = this.drawOneCard();
      if (c) bot.hand.push(c);

      this.io.to(this.roomCode).emit('game:card_drawn', {
        seatIndex: bot.seatIndex,
        count: 1,
        playerName: bot.name,
      });

      // Nếu lá vừa bốc đánh được thì đánh ngay!
      const topNow = this.discardPile[this.discardPile.length - 1];
      if (c && isValidCardPlay(c, topNow, this.activeColor, 0)) {
        setTimeout(() => {
          if (this.status !== 'in_game' || this.currentTurnIndex !== bot.seatIndex) return;
          const idx = bot.hand.findIndex((item) => item.id === c.id);
          if (idx !== -1) {
            const [played] = bot.hand.splice(idx, 1);
            this.discardPile.push(played);
            if (played.color === 'wild') {
              const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
              bot.hand.forEach((cd) => {
                if (colorCounts[cd.color] !== undefined) colorCounts[cd.color]++;
              });
              this.activeColor = Object.keys(colorCounts).reduce((a, b) =>
                colorCounts[a] >= colorCounts[b] ? a : b
              );
            } else {
              this.activeColor = played.color;
            }

            this.io.to(this.roomCode).emit('game:card_played', {
              seatIndex: bot.seatIndex,
              card: played,
              chosenColor: this.activeColor,
              playerName: bot.name,
              action: played.value,
            });

            if (bot.hand.length === 1) this.triggerBotUnoCall(bot);
            if (bot.hand.length === 0) {
              this.finishGame(bot);
              return;
            }
            this.scheduleTurnTransition(900, 1);
          }
        }, 900);
        return;
      }

      // Nếu không đánh được, bot bốc lá thứ 2 hoặc qua lượt
      setTimeout(() => {
        if (this.status !== 'in_game' || this.currentTurnIndex !== bot.seatIndex) return;
        const c2 = this.drawOneCard();
        if (c2) bot.hand.push(c2);

        this.io.to(this.roomCode).emit('game:card_drawn', {
          seatIndex: bot.seatIndex,
          count: 1,
          playerName: bot.name,
        });

        const top2 = this.discardPile[this.discardPile.length - 1];
        if (c2 && isValidCardPlay(c2, top2, this.activeColor, 0)) {
          setTimeout(() => {
            if (this.status !== 'in_game' || this.currentTurnIndex !== bot.seatIndex) return;
            const idx2 = bot.hand.findIndex((item) => item.id === c2.id);
            if (idx2 !== -1) {
              const [played2] = bot.hand.splice(idx2, 1);
              this.discardPile.push(played2);
              if (played2.color === 'wild') {
                const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
                bot.hand.forEach((cd) => {
                  if (colorCounts[cd.color] !== undefined) colorCounts[cd.color]++;
                });
                this.activeColor = Object.keys(colorCounts).reduce((a, b) =>
                  colorCounts[a] >= colorCounts[b] ? a : b
                );
              } else {
                this.activeColor = played2.color;
              }

              this.io.to(this.roomCode).emit('game:card_played', {
                seatIndex: bot.seatIndex,
                card: played2,
                chosenColor: this.activeColor,
                playerName: bot.name,
                action: played2.value,
              });

              if (bot.hand.length === 1) this.triggerBotUnoCall(bot);
              if (bot.hand.length === 0) {
                this.finishGame(bot);
                return;
              }
              this.scheduleTurnTransition(900, 1);
            }
          }, 900);
        } else {
          this.scheduleTurnTransition(1000, 1);
        }
      }, 700);
    }
  }

  findActionPlayer(socketId, userId) {
    let player = null;
    if (userId) {
      player = this.players.find((p) => p.userId === userId);
    }
    if (!player) {
      player = this.players.find((p) => p.socketId === socketId);
    }
    if (player) {
      player.socketId = socketId;
      player.isAfk = false;
    }
    return player;
  }

  // Người chơi thật đánh bài
  playerPlayCard(socketId, cardId, chosenColor, userId) {
    const player = this.findActionPlayer(socketId, userId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi trong phòng!' };
    }

    if (player.seatIndex !== this.currentTurnIndex) {
      return { success: false, message: 'Chưa tới lượt của bạn!' };
    }

    const curPlayer = player;
    const cardIdx = curPlayer.hand.findIndex((c) => c.id === cardId);
    if (cardIdx === -1) {
      return { success: false, message: 'Lá bài không tồn tại trên tay!' };
    }

    const card = curPlayer.hand[cardIdx];
    const topCard = this.discardPile[this.discardPile.length - 1];

    if (!isValidCardPlay(card, topCard, this.activeColor, this.drawTwoStack)) {
      return { success: false, message: 'Lá bài này không hợp lệ với lá trên bàn!' };
    }

    // Đánh bài hợp lệ
    curPlayer.hand.splice(cardIdx, 1);
    this.discardPile.push(card);
    this.drawnCountInTurn = 0;

    if (card.color === 'wild') {
      this.activeColor = chosenColor || 'red';
    } else {
      this.activeColor = card.color;
    }

    // Phát sự kiện đánh bài cho tất cả client tạo hiệu ứng
    this.io.to(this.roomCode).emit('game:card_played', {
      seatIndex: curPlayer.seatIndex,
      card,
      chosenColor: this.activeColor,
      playerName: curPlayer.name,
      action: card.value,
    });

    // Tự động kiểm tra điều kiện thắng
    if (curPlayer.hand.length === 0) {
      this.finishGame(curPlayer);
      return { success: true };
    }

    // Khi người chơi còn đúng 1 lá bài: Cảnh báo 5 giây đếm ngược để người chơi tự bấm HÔ UNO
    if (curPlayer.hand.length === 1) {
      if (!curPlayer.unoCalled) {
        this.io.to(this.roomCode).emit('game:uno_warning', {
          seatIndex: curPlayer.seatIndex,
          playerName: curPlayer.name,
          countdown: 5,
        });

        // Thiết lập timer 5.5s: Nếu không bấm HÔ UNO sẽ bị phạt 2 lá bài
        if (this.unoPenaltyTimer) clearTimeout(this.unoPenaltyTimer);
        this.unoPenaltyTimer = setTimeout(() => {
          if (this.status === 'in_game' && curPlayer.hand.length === 1 && !curPlayer.unoCalled) {
            this.penalizedThisTurn = true; // Đánh dấu đã bị phạt trong lượt này (chống phạt kép khi hết 15s)
            const penaltyCards = [];
            for (let i = 0; i < 2; i++) {
              const c = this.drawOneCard();
              if (c) {
                curPlayer.hand.push(c);
                penaltyCards.push(c);
              }
            }
            if (curPlayer.hand.length > 2) {
              curPlayer.unoCalled = false;
            }
            this.io.to(this.roomCode).emit('game:action_event', {
              type: 'uno_penalty',
              seatIndex: curPlayer.seatIndex,
              playerName: curPlayer.name,
              count: penaltyCards.length,
              message: `🚨 ${curPlayer.name} QUÊN HÔ UNO! Bị phạt bốc 2 lá bài!`,
            });
            this.io.to(this.roomCode).emit('game:card_drawn', {
              seatIndex: curPlayer.seatIndex,
              count: penaltyCards.length,
              isPenalty: true,
              playerName: curPlayer.name,
            });
            this.broadcastState();
            this.scheduleTurnTransition(1600, 0);
          }
        }, 5500);
      }
    }

    // Xử lý hiệu ứng lá bài
    if (card.value === 'wild_draw_four') {
      const victim = this.players[this.getNextTurnIndex(1)];
      const penaltyCount = 4;
      const penaltyCards = [];
      for (let i = 0; i < penaltyCount; i++) {
        const c = this.drawOneCard();
        if (c) {
          victim.hand.push(c);
          penaltyCards.push(c);
        }
      }
      if (victim.hand.length > 2) victim.unoCalled = false;

      this.io.to(this.roomCode).emit('game:action_event', {
        type: 'wild_draw_four',
        playerName: curPlayer.name,
        seatIndex: curPlayer.seatIndex,
        victimSeatIndex: victim.seatIndex,
        victimName: victim.name,
        chosenColor: this.activeColor,
        count: penaltyCount,
        message: `⚡ ${curPlayer.name} đánh WILD +4! ${victim.name} bị phạt bốc ${penaltyCount} lá và chuyển lượt!`,
      });

      this.io.to(this.roomCode).emit('game:card_drawn', {
        seatIndex: victim.seatIndex,
        count: penaltyCount,
        isPenalty: true,
        playerName: victim.name,
      });

      const step = this.players.length === 2 ? 1 : 2;
      this.scheduleTurnTransition(2000, step);
      return { success: true };
    } else if (card.value === 'draw_two') {
      this.drawTwoStack += 2;
      this.io.to(this.roomCode).emit('game:action_event', {
        type: 'draw_two',
        playerName: curPlayer.name,
        seatIndex: curPlayer.seatIndex,
        count: this.drawTwoStack,
        message: `🔥 ${curPlayer.name} đánh lá +2! Chồng phạt: +${this.drawTwoStack} lá!`,
      });
      this.scheduleTurnTransition(900, 1);
      return { success: true };
    } else if (card.value === 'skip') {
      const victim = this.players[this.getNextTurnIndex(1)];
      this.io.to(this.roomCode).emit('game:action_event', {
        type: 'skip',
        playerName: curPlayer.name,
        seatIndex: curPlayer.seatIndex,
        targetSeatIndex: victim.seatIndex,
        targetName: victim.name,
        message: `🛑 ${curPlayer.name} đã chặn lượt của ${victim.name}!`,
      });
      this.scheduleTurnTransition(1200, 2);
      return { success: true };
    } else if (card.value === 'reverse') {
      this.turnDirection = -this.turnDirection;
      const step = this.players.length === 2 ? 2 : 1;
      this.io.to(this.roomCode).emit('game:action_event', {
        type: 'reverse',
        playerName: curPlayer.name,
        seatIndex: curPlayer.seatIndex,
        direction: this.turnDirection,
        message: `🔄 ${curPlayer.name} đã đảo ngược chiều đánh!`,
      });
      this.scheduleTurnTransition(1000, step);
      return { success: true };
    } else {
      this.scheduleTurnTransition(750, 1);
      return { success: true };
    }
  }

  // Người chơi thật bốc bài
  playerDrawCard(socketId, userId) {
    const player = this.findActionPlayer(socketId, userId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi!' };
    }

    // KHÓA CHẶT: Nếu bàn cờ đang trong quá trình chuyển lượt -> BỎ QUA NGAY LẬP TỨC!
    if (this.isTransitioning) {
      return { success: false, message: 'Đang chuyển lượt, vui lòng đợi!' };
    }

    if (player.seatIndex !== this.currentTurnIndex) {
      return { success: false, message: 'Chưa tới lượt của bạn!' };
    }

    const curPlayer = player;

    // 1. Nếu đang có chồng phạt +2: Nhận toàn bộ bài phạt cộng dồn và mất lượt
    if (this.drawTwoStack > 0) {
      this.isTransitioning = true; // KHÓA NGAY LẬP TỨC chống click đúp bốc thêm bài thường
      const count = this.drawTwoStack;
      this.drawTwoStack = 0;
      this.drawnCountInTurn = 0;

      const penaltyCards = [];
      for (let i = 0; i < count; i++) {
        const c = this.drawOneCard();
        if (c) {
          curPlayer.hand.push(c);
          penaltyCards.push(c);
        }
      }
      if (curPlayer.hand.length > 2) {
        curPlayer.unoCalled = false;
      }

      this.io.to(this.roomCode).emit('game:action_event', {
        type: 'draw_two_penalize',
        seatIndex: curPlayer.seatIndex,
        playerName: curPlayer.name,
        count,
        message: `💥 ${curPlayer.name} nhận +${count} lá phạt và mất lượt!`,
      });

      this.io.to(this.roomCode).emit('game:card_drawn', {
        seatIndex: curPlayer.seatIndex,
        count,
        isPenalty: true,
        playerName: curPlayer.name,
      });

      const animDelay = Math.max(1600, count * 380 + 400);
      this.scheduleTurnTransition(animDelay, 1);

      return { success: true, isPenalty: true, count };
    }

    // 2. Bốc bài bình thường (tối đa 2 lá / lượt, KHÔNG tự ý chuyển lượt, người chơi có thể đánh bài ngay!)
    if (this.drawnCountInTurn >= 2) {
      return { success: false, message: 'Bạn đã bốc tối đa 2 lá trong lượt này! Hãy đánh bài hoặc bấm Bỏ Lượt.' };
    }

    const c = this.drawOneCard();
    if (c) {
      curPlayer.hand.push(c);
    }
    if (curPlayer.hand.length > 2) {
      curPlayer.unoCalled = false;
    }
    this.drawnCountInTurn += 1;

    this.io.to(this.roomCode).emit('game:card_drawn', {
      seatIndex: curPlayer.seatIndex,
      count: 1,
      playerName: curPlayer.name,
    });

    // Kiểm tra xem sau khi bốc, người chơi có lá nào đánh được không
    const topCard = this.discardPile[this.discardPile.length - 1];
    const hasPlayableCard = curPlayer.hand.some((card) =>
      isValidCardPlay(card, topCard, this.activeColor, 0)
    );

    // Nếu đã bốc đủ 2 lá mà vẫn KHÔNG CÓ BÀI HỢP LỆ: Tự động chuyển lượt sau 1.2s (chuẩn luật bàn bot)
    if (this.drawnCountInTurn >= 2 && !hasPlayableCard) {
      this.turnTimeRemaining = 15;
      this.broadcastState();

      setTimeout(() => {
        if (
          this.status === 'in_game' &&
          this.currentTurnIndex === curPlayer.seatIndex &&
          this.drawnCountInTurn >= 2
        ) {
          this.drawnCountInTurn = 0;
          this.currentTurnIndex = this.getNextTurnIndex(1);
          this.turnTimeRemaining = 15;
          this.io.to(this.roomCode).emit('game:action_event', {
            type: 'pass_turn',
            playerName: curPlayer.name,
            message: `↷ ${curPlayer.name} đã bốc đủ 2 lá nhưng không có bài hợp lệ: Tự động chuyển lượt.`,
          });
          this.broadcastState();
          this.checkBotTurn();
        }
      }, 1200);

      return { success: true, drawnCountInTurn: this.drawnCountInTurn, autoPass: true };
    }

    // Reset lại 15 giây để người chơi suy nghĩ đánh lá vừa bốc hoặc bốc tiếp lá 2
    this.turnTimeRemaining = 15;
    this.broadcastState();

    return { success: true, drawnCountInTurn: this.drawnCountInTurn, hasPlayableCard };
  }

  // Người chơi chủ động Bỏ Lượt (khi đã bốc ít nhất 1 lá mà không muốn hoặc không thể đánh)
  playerPassTurn(socketId, userId) {
    const player = this.findActionPlayer(socketId, userId);
    if (!player) {
      return { success: false, message: 'Không tìm thấy người chơi!' };
    }

    if (player.seatIndex !== this.currentTurnIndex) {
      return { success: false, message: 'Chưa tới lượt của bạn!' };
    }

    const curPlayer = player;

    if (this.drawnCountInTurn === 0) {
      return { success: false, message: 'Bạn cần bốc ít nhất 1 lá trước khi bỏ lượt!' };
    }

    this.drawnCountInTurn = 0;
    this.currentTurnIndex = this.getNextTurnIndex(1);
    this.turnTimeRemaining = 15;

    this.io.to(this.roomCode).emit('game:action_event', {
      type: 'pass_turn',
      playerName: curPlayer.name,
      message: `↷ ${curPlayer.name} đã bỏ lượt.`,
    });

    this.broadcastState();
    this.checkBotTurn();

    return { success: true };
  }

  // Hô UNO chủ động (còn 1-2 lá) hoặc Bắt quả tang đối thủ quên hô UNO (bất kể số lá trên tay)
  playerCallUno(socketId, userId) {
    const player = this.findActionPlayer(socketId, userId);
    if (!player) return { success: false, message: 'Không tìm thấy người chơi!' };

    // 1. Tự hô UNO cho chính mình khi còn 1 hoặc 2 lá
    if (player.hand.length <= 2) {
      if (player.unoCalled) {
        return { success: true, message: '✓ Bạn đã hô UNO từ trước!' };
      }

      player.unoCalled = true;
      if (this.unoPenaltyTimer) {
        clearTimeout(this.unoPenaltyTimer);
        this.unoPenaltyTimer = null;
      }

      this.io.to(this.roomCode).emit('game:action_event', {
        type: 'uno',
        seatIndex: player.seatIndex,
        playerName: player.name,
        message: `🎉 ${player.name} đã hô UNO!`,
      });
      this.broadcastState();

      return { success: true, message: '🎉 Bạn đã hô UNO thành công!' };
    }

    // 2. Bắt quả tang đối thủ (kể cả Bot) còn đúng 1 lá bài mà CHƯA hô UNO
    const forgotOpponent = this.players.find(
      (p) => p.seatIndex !== player.seatIndex && p.hand.length === 1 && !p.unoCalled
    );

    if (forgotOpponent) {
      if (this.unoPenaltyTimer) {
        clearTimeout(this.unoPenaltyTimer);
        this.unoPenaltyTimer = null;
      }
      if (this.botUnoTimer) {
        clearTimeout(this.botUnoTimer);
        this.botUnoTimer = null;
      }

      const penaltyCards = [];
      for (let i = 0; i < 2; i++) {
        const c = this.drawOneCard();
        if (c) {
          forgotOpponent.hand.push(c);
          penaltyCards.push(c);
        }
      }
      forgotOpponent.unoCalled = false;

      this.io.to(this.roomCode).emit('game:action_event', {
        type: 'uno_penalty',
        seatIndex: forgotOpponent.seatIndex,
        playerName: forgotOpponent.name,
        catcherName: player.name,
        count: penaltyCards.length,
        message: `🎯 ${player.name} BẮT QUẢ TANG ${forgotOpponent.name} QUÊN HÔ UNO! Phạt bốc 2 lá!`,
      });

      this.io.to(this.roomCode).emit('game:card_drawn', {
        seatIndex: forgotOpponent.seatIndex,
        count: penaltyCards.length,
        isPenalty: true,
        playerName: forgotOpponent.name,
      });

      this.broadcastState();
      return { success: true, message: `🎯 Đã bắt quả tang ${forgotOpponent.name} quên hô UNO!` };
    }

    return {
      success: false,
      message: `❌ Bạn đang có ${player.hand.length} lá trên tay và hiện không có đối thủ nào quên hô UNO!`,
    };
  }

  // XỬ LÝ VÀ LƯU KẾT QUẢ ĐẤU RANK XẾP HẠNG (ELO) VÀO CSDL MONGODB ATLAS
  async processRankedMatchResults(winnerPlayer, sortedRankings, reason = 'out_of_cards') {
    const totalPlayerCount = this.players.length;
    const enrichedRankings = [];
    const matchPlayers = [];

    for (let idx = 0; idx < sortedRankings.length; idx++) {
      const p = sortedRankings[idx];
      const rank = idx + 1;
      const { eloDelta, coinsDelta, expDelta, isWin, isLoss } = calculateDeltas(totalPlayerCount, rank);

      let newElo = p.elo || 1000;
      let effectiveEloDelta = eloDelta;

      if (!p.isBot && p.userId) {
        try {
          const userDoc = await User.findByNicknameOrId(p.userId);
          if (userDoc) {
            const isGuest = userDoc.role === 'guest';
            effectiveEloDelta = isGuest ? 0 : eloDelta;

            userDoc.elo = Math.max(100, (userDoc.elo || 1000) + effectiveEloDelta);
            userDoc.coins = (userDoc.coins || 0) + coinsDelta;
            userDoc.exp = (userDoc.exp || 0) + expDelta;

            if (isWin) {
              userDoc.matchesWon = (userDoc.matchesWon || 0) + 1;
            } else if (isLoss) {
              userDoc.matchesLost = (userDoc.matchesLost || 0) + 1;
            }

            const oldLevel = userDoc.level || 1;
            const nextLevel = Math.floor(userDoc.exp / 150) + 1;
            if (nextLevel > oldLevel) {
              userDoc.level = nextLevel;
              userDoc.coins += 250;
            }

            await userDoc.save();
            newElo = userDoc.elo;

            let stats = await PlayerStats.findOne({ user: userDoc._id });
            if (!stats) {
              stats = await PlayerStats.create({ user: userDoc._id });
            }
            stats.totalMatches += 1;
            if (isWin) {
              stats.wins += 1;
              stats.winStreak += 1;
              if (stats.winStreak > stats.highestWinStreak) {
                stats.highestWinStreak = stats.winStreak;
              }
            } else if (isLoss) {
              stats.losses += 1;
              stats.winStreak = 0;
            }
            stats.winRate = Math.round((stats.wins / stats.totalMatches) * 100);
            await stats.save();

            console.log(
              `[Rank Engine] 🏆 Đã cập nhật ELO cho ${userDoc.nickname}: ${effectiveEloDelta > 0 ? '+' : ''}${effectiveEloDelta} ELO -> Mới: ${newElo}`
            );
          }
        } catch (dbErr) {
          console.error(`[Rank Engine] Lỗi cập nhật CSDL cho người chơi ${p.name}:`, dbErr);
        }
      } else {
        newElo = Math.max(100, (p.elo || 1000) + eloDelta);
      }

      enrichedRankings.push({
        rank,
        userId: p.userId,
        name: p.name,
        avatar: p.avatar || 'avatar_1',
        cardsRemaining: p.hand.length,
        isBot: p.isBot,
        eloDelta: effectiveEloDelta,
        newElo,
        coinsDelta,
        expDelta,
      });

      matchPlayers.push({
        id: String(p.userId || p.name),
        name: p.name,
        isHuman: !p.isBot,
        avatar: p.avatar || '👤',
        rank,
        cardsRemaining: p.hand.length,
        eloDelta: effectiveEloDelta,
        coinsDelta,
        expDelta,
        newElo,
      });
    }

    try {
      const modeKey =
        totalPlayerCount === 2
          ? '1v1'
          : totalPlayerCount === 3
          ? '3p'
          : '4p';

      await Match.create({
        roomCode: this.roomCode,
        mode: modeKey,
        winner: {
          id: String(winnerPlayer.userId || winnerPlayer.name),
          name: winnerPlayer.name,
          isHuman: !winnerPlayer.isBot,
        },
        reason,
        durationSeconds: Math.floor((Date.now() - (this.startTime || Date.now())) / 1000),
        players: matchPlayers,
      });
      console.log(`[Rank Engine] 📝 Đã lưu lịch sử trận đấu xếp hạng phòng ${this.roomCode} vào MongoDB Atlas!`);
    } catch (matchErr) {
      console.error('[Rank Engine] Lỗi lưu Match record:', matchErr);
    }

    return enrichedRankings;
  }

  async finishGame(winnerPlayer) {
    this.status = 'finished';
    this.winner = winnerPlayer;
    this.stopTimers();

    // Sắp xếp thứ hạng: Đảm bảo winnerPlayer luôn ở vị trí số 1 (rank 1)
    const otherPlayers = this.players.filter((p) => p.seatIndex !== winnerPlayer.seatIndex);
    otherPlayers.sort((a, b) => a.hand.length - b.hand.length);
    const sortedRankings = [winnerPlayer, ...otherPlayers];

    let finalRankings = [];
    if (this.isRanked) {
      finalRankings = await this.processRankedMatchResults(winnerPlayer, sortedRankings, 'out_of_cards');
    } else {
      finalRankings = sortedRankings.map((p, idx) => ({
        rank: idx + 1,
        userId: p.userId,
        name: p.name,
        avatar: p.avatar,
        cardsRemaining: p.hand.length,
        isBot: p.isBot,
      }));
    }

    this.io.to(this.roomCode).emit('game:finished', {
      winner: winnerPlayer.name,
      rankings: finalRankings,
      isRanked: this.isRanked,
      mode: this.mode,
    });

    this.broadcastState();
  }

  async endMatchDueToTimeout() {
    this.status = 'finished';
    this.stopTimers();

    const sortedRankings = [...this.players].sort((a, b) => a.hand.length - b.hand.length);
    const winner = sortedRankings[0];
    this.winner = winner;

    let finalRankings = [];
    if (this.isRanked) {
      finalRankings = await this.processRankedMatchResults(winner, sortedRankings, 'timeout');
    } else {
      finalRankings = sortedRankings.map((p, idx) => ({
        rank: idx + 1,
        userId: p.userId,
        name: p.name,
        avatar: p.avatar,
        cardsRemaining: p.hand.length,
        isBot: p.isBot,
      }));
    }

    this.io.to(this.roomCode).emit('game:finished', {
      winner: `${winner.name} (Hết giờ)`,
      rankings: finalRankings,
      isRanked: this.isRanked,
      mode: this.mode,
    });

    this.broadcastState();
  }

  getClientStateForPlayer(player) {
    const topCard = this.discardPile[this.discardPile.length - 1];
    return {
      roomCode: this.roomCode,
      status: this.status,
      isRanked: this.isRanked,
      isDealing: this.isDealing,
      dealingCountdown: this.dealingCountdown,
      drawPileCount: this.drawPile.length,
      drawnCountInTurn: this.drawnCountInTurn,
      topCard,
      activeColor: this.activeColor,
      currentTurnIndex: this.currentTurnIndex,
      turnDirection: this.turnDirection,
      drawTwoStack: this.drawTwoStack,
      turnTimeRemaining: this.turnTimeRemaining,
      matchTimeRemaining: this.matchTimeRemaining,
      mySeatIndex: player.seatIndex,
      myHand: player.hand,
      players: this.players.map((other) => ({
        seatIndex: other.seatIndex,
        userId: other.userId,
        name: other.name,
        avatar: other.avatar,
        isHost: other.isHost,
        isBot: other.isBot,
        handCount: other.hand.length,
        isTurn: other.seatIndex === this.currentTurnIndex,
        unoCalled: other.unoCalled,
        isAfk: other.isAfk,
      })),
    };
  }

  reconnectPlayer(socketId, userId, playerName) {
    let player = null;
    if (userId) {
      player = this.players.find((p) => p.userId === userId);
    }
    if (!player && playerName) {
      player = this.players.find((p) => p.name === playerName);
    }
    if (!player) {
      // Tìm ghế người chơi người thật chưa có kết nối hoặc trùng socketId
      player = this.players.find((p) => !p.isBot && (!p.socketId || p.socketId === socketId));
    }
    if (player) {
      player.socketId = socketId;
      player.isAfk = false;
      return player;
    }
    return null;
  }

  // Gửi trạng thái bảo mật (chỉ gửi bài riêng của từng người)
  broadcastState() {
    console.log(`[GameEngine] broadcastState cho phòng ${this.roomCode}, số người: ${this.players.length}`);

    this.players.forEach((p) => {
      if (!p.isBot && p.socketId) {
        const clientState = this.getClientStateForPlayer(p);
        this.io.to(p.socketId).emit('game:state_sync', clientState);
      }
    });
  }
}

function startOnlineMatch(room, io) {
  // Dọn dẹp trận đấu cũ của phòng này nếu có (tránh trùng lặp timer gây nhảy màn hình)
  const existingGame = activeGames.get(room.code);
  if (existingGame) {
    existingGame.stopTimers();
    activeGames.delete(room.code);
  }

  const game = new OnlineGame(room, io);
  activeGames.set(room.code, game);
  return game;
}

function getActiveGame(roomCode) {
  if (!roomCode) return null;
  return activeGames.get(roomCode.toUpperCase()) || null;
}

module.exports = {
  startOnlineMatch,
  getActiveGame,
  activeGames,
};
