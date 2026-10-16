// Hàm tiện ích hỗ trợ xáo bài và kiểm tra hợp lệ
export function createUnoDeck() {
  // Bộ bài chuẩn 108 lá (sẽ triển khai chi tiết khi vào bàn đấu)
  return [];
}

export function isValidMove(cardToPlay, topCard) {
  if (!topCard) return true;
  if (cardToPlay.color === 'wild') return true;
  return cardToPlay.color === topCard.color || cardToPlay.value === topCard.value;
}
