/**
 * Module quản lý và khởi tạo Bộ bài UNO 108 lá chuẩn
 * Định dạng mỗi lá bài:
 * {
 *   id: string,
 *   color: 'red' | 'blue' | 'green' | 'yellow' | 'wild',
 *   value: '0'..'9' | 'skip' | 'reverse' | 'draw_two' | 'wild' | 'wild_draw_four'
 * }
 */

const COLORS = ['red', 'blue', 'green', 'yellow'];
const ACTION_VALUES = ['skip', 'reverse', 'draw_two'];

/**
 * Khởi tạo bộ bài UNO chuẩn 108 lá
 * - Mỗi màu (4 màu):
 *   + 1 lá số '0' (4 lá)
 *   + 2 bộ lá số từ '1' đến '9' (2 * 9 * 4 = 72 lá)
 *   + 2 lá 'skip' (8 lá)
 *   + 2 lá 'reverse' (8 lá)
 *   + 2 lá 'draw_two' (8 lá)
 * - Bài đặc biệt (Wild):
 *   + 4 lá 'wild' (Đổi màu)
 *   + 4 lá 'wild_draw_four' (Đổi màu + Rút 4)
 * Tổng cộng: 4 + 72 + 8 + 8 + 8 + 4 + 4 = 108 lá bài.
 * @returns {Array<Object>} Mảng chứa 108 lá bài
 */
function createDeck() {
  const deck = [];
  let cardCount = 0;

  // 1. Tạo các lá bài có màu (100 lá)
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

  // 2. Tạo 4 lá 'wild' (Đổi màu)
  for (let i = 1; i <= 4; i++) {
    deck.push({
      id: `card_wild_${i}_${++cardCount}`,
      color: 'wild',
      value: 'wild',
    });
  }

  // 3. Tạo 4 lá 'wild_draw_four' (Đổi màu + Rút 4)
  for (let i = 1; i <= 4; i++) {
    deck.push({
      id: `card_wild_draw_four_${i}_${++cardCount}`,
      color: 'wild',
      value: 'wild_draw_four',
    });
  }

  return deck;
}

/**
 * Xáo trộn bộ bài sử dụng thuật toán Fisher-Yates
 * @param {Array<Object>} deck - Mảng các lá bài cần xáo trộn
 * @returns {Array<Object>} Mảng lá bài mới đã được xáo trộn ngẫu nhiên
 */
function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Chọn chỉ số ngẫu nhiên từ 0 đến i
    const j = Math.floor(Math.random() * (i + 1));
    // Hoán đổi vị trí
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

module.exports = {
  createDeck,
  shuffleDeck,
};
