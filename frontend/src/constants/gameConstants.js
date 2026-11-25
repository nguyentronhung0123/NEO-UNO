// Hằng số định nghĩa luật chơi và các lá bài trong NEO UNO
export const CARD_COLORS = {
  RED: 'red',
  BLUE: 'blue',
  YELLOW: 'yellow',
  GREEN: 'green',
  WILD: 'wild',
};

export const CARD_TYPES = {
  NUMBER: 'number',
  SKIP: 'skip',
  REVERSE: 'reverse',
  DRAW_TWO: 'draw_two',
  WILD: 'wild',
  WILD_DRAW_FOUR: 'wild_draw_four',
};

export const GAME_MODES = {
  PVE_BOT: 'pve_bot',
  PVP_ONLINE: 'pvp_online',
};

// Avatar SVG nội bộ siêu nhẹ (0ms, không cần gọi api.dicebear.com khi chưa đăng nhập)
export const DEFAULT_CYBER_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%2300d2ff'/%3E%3Cstop offset='100%25' stop-color='%236366f1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='32' fill='%230b1222'/%3E%3Crect x='14' y='18' width='36' height='28' rx='10' fill='url(%23g)' opacity='0.22' stroke='%2300d2ff' stroke-width='2.5'/%3E%3Ccircle cx='25' cy='31' r='4' fill='%2300d2ff'/%3E%3Ccircle cx='39' cy='31' r='4' fill='%2300d2ff'/%3E%3Cpath d='M25 40h14' stroke='%2369f6b9' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M32 10v8' stroke='%2300d2ff' stroke-width='2.5' stroke-linecap='round'/%3E%3Ccircle cx='32' cy='9' r='3' fill='%2369f6b9'/%3E%3C/svg%3E";
