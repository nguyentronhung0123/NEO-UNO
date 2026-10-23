import { createDeck, shuffleDeck } from './deck.js';

// CẤU HÌNH BÀN ĐẤU 4 VỊ TRÍ THEO VÒNG NGƯỢC CHIỀU KIM ĐỒNG HỒ (↺):
// Seat 0 (Dưới): P1 - Bạn
// Seat 1 (Phải): P2 - Bot Titan (🛡️ Bậc thầy phòng thủ)
// Seat 2 (Trên): P3 - Bot Neon (⚡ Chiến thuật gia)
// Seat 3 (Trái): P4 - Bot Cyber (🤖 Chuyên gia tốc độ)
export const BOT_CONFIGS_4P = [
  { id: 'bot_right', name: 'Bot Titan', avatar: '🛡️', badge: 'Bậc thầy phòng thủ', color: '#ec4899', position: 'right', playerNumber: 2 },
  { id: 'bot_top',   name: 'Bot Neon',  avatar: '⚡', badge: 'Chiến thuật gia',    color: '#10b981', position: 'top',   playerNumber: 3 },
  { id: 'bot_left',  name: 'Bot Cyber', avatar: '🤖', badge: 'Chuyên gia tốc độ', color: '#00d2ff', position: 'left',  playerNumber: 4 },
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
