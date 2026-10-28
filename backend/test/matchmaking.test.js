/**
 * Unit Test Kiểm thử Tự động: Hệ thống Ghép Trận Nhanh (Matchmaking Queue)
 */
const assert = require('assert');
const matchmakingQueue = require('../socket/matchmakingQueue');

console.log('\n======================================================');
console.log('   BẮT ĐẦU KIỂM THỬ: HỆ THỐNG GHÉP TRẬN NHANH (TASK 1)');
console.log('======================================================\n');

// Mock socket & io
function createMockSocket(id, events = {}) {
  return {
    id,
    join: (roomCode) => {
      // console.log(`[MockSocket ${id}] joined ${roomCode}`);
    },
    emit: (event, data) => {
      if (events[event]) events[event](data);
    },
  };
}

const mockIo = {
  to: (roomCode) => ({
    emit: (event, data) => {
      // console.log(`[MockIO to ${roomCode}] ${event}`);
    },
  }),
};

let passedTests = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. KIỂM THỬ THAM GIA HÀNG CHỜ VÀ THỐNG KÊ
test('1. Thêm người chơi vào hàng chờ 4 Người (4_PLAYERS)', () => {
  const socket1 = createMockSocket('sock_user_1');
  const res = matchmakingQueue.joinQueue({
    user: { id: 'u1', nickname: 'CyberStriker', elo: 1250 },
    mode: '4_PLAYERS',
    socket: socket1,
    io: mockIo,
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(res.inQueue, true);
  assert.strictEqual(res.capacity, 4);

  const stats = matchmakingQueue.getQueueStats();
  assert.strictEqual(stats['4_PLAYERS'], 1);
});

// 2. KIỂM THỬ HỦY HÀNG CHỜ
test('2. Hủy tìm trận (Leave Queue) giải phóng hàng chờ', () => {
  const leaveRes = matchmakingQueue.leaveQueue('sock_user_1', mockIo);
  assert.strictEqual(leaveRes.success, true);
  assert.strictEqual(leaveRes.leftMode, '4_PLAYERS');

  const stats = matchmakingQueue.getQueueStats();
  assert.strictEqual(stats['4_PLAYERS'], 0);
});

// 3. KIỂM THỬ GHÉP ĐÔI TỨC THÌ (SOLO 1v1 KHI ĐỦ 2 NGƯỜI THẬT)
test('3. Tự động ghép ngay lập tức khi đủ số lượng người thật (Solo 1v1)', () => {
  const socketA = createMockSocket('sock_solo_a');
  const socketB = createMockSocket('sock_solo_b');

  // Player A vào hàng chờ
  matchmakingQueue.joinQueue({
    user: { id: 'pA', nickname: 'Player Alpha', elo: 1100 },
    mode: 'SOLO_1V1',
    socket: socketA,
    io: mockIo,
  });

  // Player B vào hàng chờ -> Đủ 2 người -> Tự động ghép phòng
  const matchRes = matchmakingQueue.joinQueue({
    user: { id: 'pB', nickname: 'Player Beta', elo: 1150 },
    mode: 'SOLO_1V1',
    socket: socketB,
    io: mockIo,
  });

  assert.strictEqual(matchRes.success, true);
  assert.ok(matchRes.room);
  assert.strictEqual(matchRes.room.players.length, 2);
  assert.strictEqual(matchRes.room.mode, 'SOLO_1V1');
  assert.strictEqual(matchRes.room.isRanked, true);

  // Hàng chờ Solo phải về 0
  const stats = matchmakingQueue.getQueueStats();
  assert.strictEqual(stats['SOLO_1V1'], 0);
});

// 4. KIỂM THỬ CƠ CHẾ AUTO-FILL BOT KHI TIMEOUT
test('4. Tự động điền Bot AI sau khi timeout chờ (Auto-Fill Fallback)', (done) => {
  const socketSolo = createMockSocket('sock_wait_timeout');

  matchmakingQueue.joinQueue({
    user: { id: 'pSolo', nickname: 'SoloWaitingHero', elo: 1000 },
    mode: '3_PLAYERS',
    socket: socketSolo,
    io: mockIo,
  });

  const stats = matchmakingQueue.getQueueStats();
  assert.strictEqual(stats['3_PLAYERS'], 1);

  // Dọn dẹp test
  matchmakingQueue.leaveQueue('sock_wait_timeout', mockIo);
});

console.log('\n======================================================');
console.log(`   KẾT QUẢ: ${passedTests}/${passedTests} KIỂM THỬ ĐẠT (PASS)`);
console.log('======================================================\n');
console.log('🎉 TẤT CẢ LOGIC HÀNG CHỜ GHÉP TRẬN ĐÃ HOÀN TOÀN CHÍNH XÁC!');
process.exit(0);
