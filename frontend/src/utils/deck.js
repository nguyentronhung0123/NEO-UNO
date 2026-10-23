/**
 * Module quản lý và khởi tạo Bộ bài UNO 108 lá chuẩn
 */

const COLORS = ['red', 'blue', 'green', 'yellow'];
const ACTION_VALUES = ['skip', 'reverse', 'draw_two'];

export function createDeck() {
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

export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
