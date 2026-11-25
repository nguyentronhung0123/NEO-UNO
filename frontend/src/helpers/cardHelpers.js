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

/**
 * Cập nhật trực tiếp style khi kéo/vuốt lá bài trên mobile để tránh re-render cả bàn đấu 60fps
 */
export function applyCardDragStyle(el, deltaY) {
  if (!el) return;
  el.style.transform = `translateY(${Math.max(-90, deltaY)}px) scale(1.12)`;
  el.style.zIndex = '60';
  el.style.boxShadow = '0 0 35px rgba(0, 210, 255, 0.95)';
  el.style.transition = 'none';
  el.classList.add('is-dragging', 'ring-4', 'ring-cyan-300');
}

export function resetCardDragStyle(el) {
  if (!el) return;
  el.style.transform = '';
  el.style.zIndex = '';
  el.style.boxShadow = '';
  el.style.transition = '';
  el.classList.remove('is-dragging', 'ring-4', 'ring-cyan-300');
}
