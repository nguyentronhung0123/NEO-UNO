/**
 * Unit Test: Chống Đánh Bài Nhiều Lần Trong 1 Lượt (1 Lượt = 1 Lá Duy Nhất)
 */
require('dotenv').config();
const gameEngine = require('../socket/gameEngine');

function runTest() {
  console.log('\n================================================================');
  console.log('   KIỂM THỬ: KHÓA CHẶT 1 LƯỢT CHỈ ĐƯỢC ĐÁNH 1 LÁ BÀI DUY NHẤT');
  console.log('================================================================\n');

  const mockRoom = {
    code: 'GUARD_TEST',
    isRanked: false,
    players: [
      {
        userId: 'p1_user',
        name: 'Player 1',
        isBot: false,
        socketId: 'sock_p1',
      },
      {
        userId: 'bot_2',
        name: 'Bot 2',
        isBot: true,
      },
    ],
  };

  const mockIo = {
    to: () => ({
      emit: () => {},
    }),
  };

  const game = gameEngine.startOnlineMatch(mockRoom, mockIo);
  // Bỏ qua dealing
  game.isDealing = false;
  game.isTransitioning = false;
  game.currentTurnIndex = 0; // Lượt của Player 1

  // Cho P1 hai lá bài hợp lệ
  game.activeColor = 'red';
  game.discardPile = [{ id: 'top_card', color: 'red', value: '1' }];
  game.players[0].hand = [
    { id: 'c1', color: 'red', value: '2' },
    { id: 'c2', color: 'red', value: '3' },
    { id: 'c3', color: 'red', value: '4' },
  ];

  console.log('Ban đầu: P1 có 3 lá bài:', game.players[0].hand.map(c => c.id));
  console.log('Đang là lượt của P1 (currentTurnIndex = 0)');

  // 1. P1 đánh lá bài thứ nhất
  const res1 = game.playerPlayCard('sock_p1', 'c1', 'red', 'p1_user');
  console.log('\nLần 1 đánh lá c1 -> Kết quả:', res1);
  if (!res1 || !res1.success) {
    throw new Error('Lần 1 đánh bài hợp lệ phải thành công!');
  }
  console.log('  ✔ Lần 1 đánh bài hợp lệ thành công');

  // 2. Thử đánh tiếp lá thứ hai ngay lập tức trong cùng 1 lượt (Mô phỏng click nhanh 2 lần)
  const res2 = game.playerPlayCard('sock_p1', 'c2', 'red', 'p1_user');
  console.log('Lần 2 cố tình đánh tiếp lá c2 trong cùng lượt -> Kết quả:', res2);

  if (res2 && res2.success) {
    throw new Error('LỖI: Server vẫn cho phép đánh lá thứ 2 trong cùng 1 lượt!');
  }
  console.log('  ✔ PASS: Server đã chặn thành công lần click thứ 2 (' + res2.message + ')');

  // 3. Thử đánh tiếp lá thứ ba
  const res3 = game.playerPlayCard('sock_p1', 'c3', 'red', 'p1_user');
  console.log('Lần 3 cố tình đánh tiếp lá c3 trong cùng lượt -> Kết quả:', res3);
  if (res3 && res3.success) {
    throw new Error('LỖI: Server vẫn cho phép đánh lá thứ 3 trong cùng 1 lượt!');
  }
  console.log('  ✔ PASS: Server đã chặn thành công lần click thứ 3 (' + res3.message + ')');

  // Kiểm tra số lá còn lại trên tay: P1 chỉ được mất ĐÚNG 1 LÁ (còn 2 lá)
  if (game.players[0].hand.length !== 2) {
    throw new Error(`Số lá trên tay không đúng! Mong đợi: 2, Thực tế: ${game.players[0].hand.length}`);
  }
  console.log(`  ✔ PASS: Số bài trên tay của P1 còn đúng 2 lá (${game.players[0].hand.map(c => c.id).join(', ')})`);

  game.stopTimers();

  console.log('\n================================================================');
  console.log('   KẾT QUẢ: KHÓA CHẶT 1 LƯỢT = 1 LÁ HOẠT ĐỘNG HOÀN TOÀN CHÍNH XÁC!');
  console.log('================================================================\n');
  process.exit(0);
}

runTest();
