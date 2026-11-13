import { createDeck, shuffleDeck } from './deck.js';

// CẤU HÌNH BÀN ĐẤU 4 VỊ TRÍ THEO VÒNG NGƯỢC CHIỀU KIM ĐỒNG HỒ (↺):
// Seat 0 (Dưới): P1 - Bạn (Team Alpha trong 2v2)
// Seat 1 (Phải): P2 - Bot Titan (Team Omega trong 2v2)
// Seat 2 (Trên): P3 - Bot Neon (Đồng đội Team Alpha trong 2v2)
// Seat 3 (Trái): P4 - Bot Cyber (Team Omega trong 2v2)
export const BOT_CONFIGS_4P = [
  { id: 'bot_right', name: 'Bot Titan', avatar: '🛡️', badge: 'Bậc thầy phòng thủ', color: '#ec4899', position: 'right', playerNumber: 2, team: 'OMEGA', teamName: 'Team Omega' },
  { id: 'bot_top',   name: 'Bot Neon',  avatar: '⚡', badge: 'Chiến thuật gia (Đồng đội)', color: '#10b981', position: 'top', playerNumber: 3, team: 'ALPHA', teamName: 'Team Alpha', isTeammate: true },
  { id: 'bot_left',  name: 'Bot Cyber', avatar: '🤖', badge: 'Chuyên gia tốc độ', color: '#00d2ff', position: 'left',  playerNumber: 4, team: 'OMEGA', teamName: 'Team Omega' },
];

export const BOT_CONFIGS_3P = [
  { id: 'bot_right', name: 'Bot Titan', avatar: '🛡️', badge: 'Bậc thầy phòng thủ', color: '#ec4899', position: 'right', playerNumber: 2 },
  { id: 'bot_left',  name: 'Bot Cyber', avatar: '🤖', badge: 'Chuyên gia tốc độ', color: '#00d2ff', position: 'left',  playerNumber: 3 },
];

export const BOT_CONFIGS_2P = [
  { id: 'bot_top',   name: 'Bot Neon',  avatar: '⚡', badge: 'Chiến thuật gia',    color: '#10b981', position: 'top',   playerNumber: 2 },
];

export const BOT_CONFIGS = BOT_CONFIGS_4P;

export function initGameState(botCount = 1) {
  const fullDeck = shuffleDeck(createDeck());

  // playerHand: 7 lá đầu tiên cho người chơi (P1)
  const playerHand = fullDeck.splice(0, 7);

  const safeBotCount = Math.max(1, Math.min(3, botCount));
  const botTemplates = safeBotCount === 3
    ? BOT_CONFIGS_4P
    : safeBotCount === 2
      ? BOT_CONFIGS_3P
      : BOT_CONFIGS_2P;

  const bots = botTemplates.slice(0, safeBotCount).map((config) => ({
    ...config,
    hand: fullDeck.splice(0, 7),
  }));

  const botHand = bots[0]?.hand || [];

  // Lá lật khởi đầu: Chọn lá số thông thường (không phải Wild hay lá phạt/chức năng)
  let activeCardIndex = -1;
  for (let i = 0; i < fullDeck.length; i++) {
    const c = fullDeck[i];
    if (c.color !== 'wild' && !['draw_two', 'skip', 'reverse'].includes(c.value)) {
      activeCardIndex = i;
      break;
    }
  }

  const [activeCard] = fullDeck.splice(activeCardIndex !== -1 ? activeCardIndex : 0, 1);
  const discardPile = [activeCard];
  const drawPile = fullDeck;

  return {
    playerHand,
    botHand,
    bots,
    discardPile,
    drawPile,
  };
}

// TÍNH ĐIỂM LÁ BÀI CHUẨN LUẬT UNO QUỐC TẾ (MATTEL UNO):
// - Lá số 0 - 9: 0 - 9 điểm
// - Lá chức năng (Draw Two, Skip, Reverse): 20 điểm / lá
// - Lá Wild & Wild +4: 50 điểm / lá
export function calculateCardPoints(card) {
  if (!card) return 0;
  if (card.value === 'wild' || card.value === 'wild_draw_four') return 50;
  if (card.value === 'draw_two' || card.value === 'skip' || card.value === 'reverse') return 20;
  const num = parseInt(card.value, 10);
  return isNaN(num) ? 0 : num;
}

// TÍNH TỔNG ĐIỂM CỦA TOÀN BỘ CÁC LÁ BÀI CÒN LẠI TRÊN TAY
export function calculateHandPoints(hand = []) {
  return hand.reduce((sum, c) => sum + calculateCardPoints(c), 0);
}

// LẤY GIÁ TRỊ LÁ BÀI CAO NHẤT TRÊN TAY ĐỂ TIE-BREAK NÂNG CAO
export function getMaxCardPoint(hand = []) {
  if (!hand || hand.length === 0) return 0;
  return Math.max(...hand.map(calculateCardPoints));
}

// ============================================================================
// HỖ TRỢ CHẾ ĐỘ CHƠI ĐỒNG ĐỘI 2V2 (TASK 2 - TUẦN 5: DUO TAG-TEAM MODE)
// ============================================================================

/**
 * Lấy thông tin phe (Team) theo vị trí ghế ngồi
 * Seat 0 (Player) & Seat 2 (Bot Neon đối diện) = TEAM ALPHA
 * Seat 1 (Bot Titan) & Seat 3 (Bot Cyber) = TEAM OMEGA
 */
export function getTeamForSeat(seatIndex) {
  if (seatIndex === 0 || seatIndex === 2) {
    return {
      id: 'ALPHA',
      name: 'Team Alpha',
      color: '#00d2ff',
      isPlayerTeam: true,
      isTeammate: seatIndex === 2,
    };
  }
  return {
    id: 'OMEGA',
    name: 'Team Omega',
    color: '#f43f5e',
    isPlayerTeam: false,
    isTeammate: false,
  };
}

/**
 * Kiểm tra kết quả chiến thắng theo luật Đồng Đội 2v2:
 * 1. Nếu bất kỳ thành viên nào hết bài -> Đội của thành viên đó thắng 100%!
 * 2. Nếu hết thời gian (Timeout) -> Đội nào có tổng số lá bài còn lại ít hơn thắng!
 */
export function checkTeamVictory({ playerHand = [], bots = [], reason = 'out_of_cards' }) {
  const topBot = bots.find((b) => b.position === 'top') || bots[1];
  const rightBot = bots.find((b) => b.position === 'right') || bots[0];
  const leftBot = bots.find((b) => b.position === 'left') || bots[2];

  const pCount = playerHand.length;
  const topCount = topBot?.hand?.length ?? 99;
  const rightCount = rightBot?.hand?.length ?? 99;
  const leftCount = leftBot?.hand?.length ?? 99;

  // 1. Luật hết bài: 1 người hết bài là cả đội thắng
  if (reason === 'out_of_cards') {
    if (pCount === 0 || topCount === 0) {
      return {
        winningTeam: 'ALPHA',
        isPlayerWin: true,
        mvp: pCount === 0 ? 'player' : 'bot_top',
        reason: 'out_of_cards',
      };
    }
    if (rightCount === 0 || leftCount === 0) {
      return {
        winningTeam: 'OMEGA',
        isPlayerWin: false,
        mvp: rightCount === 0 ? 'bot_right' : 'bot_left',
        reason: 'out_of_cards',
      };
    }
  }

  // 2. Luật hết giờ (Timeout): Tổng số lá của đội
  const alphaTotalCards = pCount + topCount;
  const omegaTotalCards = rightCount + leftCount;

  if (alphaTotalCards <= omegaTotalCards) {
    return {
      winningTeam: 'ALPHA',
      isPlayerWin: true,
      alphaCards: alphaTotalCards,
      omegaCards: omegaTotalCards,
      reason: 'timeout',
    };
  }

  return {
    winningTeam: 'OMEGA',
    isPlayerWin: false,
    alphaCards: alphaTotalCards,
    omegaCards: omegaTotalCards,
    reason: 'timeout',
  };
}
