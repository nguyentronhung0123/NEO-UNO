const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const matchmakingQueue = require('../socket/matchmakingQueue');
const { OnlineGame } = require('../socket/gameEngine');

console.log('\n======================================================');
console.log('   KIỂM THỬ: GHÉP TRẬN ONLINE 2V2 VÀ KẾT THÚC HẾT BÀI');
console.log('======================================================\n');

let passed = 0;
let total = 0;

async function it(desc, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✔ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(err);
    throw err;
  }
}

const mockIo = {
  to: () => ({ emit: () => {} }),
  emit: () => {},
};

async function run() {
  // 1. Kiểm tra hàng chờ 2V2_TEAM
  await it('1. Tham gia hàng chờ 2V2_TEAM (Sức chứa 4 người)', () => {
    const mockSocket = { id: 'sock_2v2_1', join: () => {}, emit: () => {} };
    const res = matchmakingQueue.joinQueue({
      user: { id: 'u1', nickname: 'Alpha1', elo: 1200 },
      mode: '2V2_TEAM',
      socket: mockSocket,
      io: mockIo,
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.mode, '2V2_TEAM');
    assert.strictEqual(res.capacity, 4);

    // Dọn dẹp
    matchmakingQueue.leaveQueue('sock_2v2_1', mockIo);
  });

  // 2. Tự động ghép khi đủ 4 người thật vào 2V2_TEAM
  await it('2. Đủ 4 người thật: Khởi tạo phòng 2v2 với Seat 0,2 = Alpha và Seat 1,3 = Omega', () => {
    const sockets = [
      { id: 's1', join: () => {}, emit: () => {} },
      { id: 's2', join: () => {}, emit: () => {} },
      { id: 's3', join: () => {}, emit: () => {} },
      { id: 's4', join: () => {}, emit: () => {} },
    ];

    matchmakingQueue.joinQueue({ user: { id: 'p1', nickname: 'Alpha_P1' }, mode: '2V2_TEAM', socket: sockets[0], io: mockIo });
    matchmakingQueue.joinQueue({ user: { id: 'p2', nickname: 'Omega_P1' }, mode: '2V2_TEAM', socket: sockets[1], io: mockIo });
    matchmakingQueue.joinQueue({ user: { id: 'p3', nickname: 'Alpha_P2' }, mode: '2V2_TEAM', socket: sockets[2], io: mockIo });
    const finalRes = matchmakingQueue.joinQueue({ user: { id: 'p4', nickname: 'Omega_P2' }, mode: '2V2_TEAM', socket: sockets[3], io: mockIo });

    assert.strictEqual(finalRes.success, true);
    assert.ok(finalRes.room);
    assert.strictEqual(finalRes.room.mode, '2V2_TEAM');
    assert.strictEqual(finalRes.room.isTeamMode, true);
    assert.strictEqual(finalRes.room.players.length, 4);

    // Ghế 0: Alpha, Ghế 1: Omega, Ghế 2: Alpha, Ghế 3: Omega
    assert.strictEqual(finalRes.room.players[0].team, 'ALPHA');
    assert.strictEqual(finalRes.room.players[1].team, 'OMEGA');
    assert.strictEqual(finalRes.room.players[2].team, 'ALPHA');
    assert.strictEqual(finalRes.room.players[3].team, 'OMEGA');
  });

  // 3. OnlineGame: Kiểm tra phân chia đội hình và kết thúc ván khi 1 người hết bài
  await it('3. OnlineGame 2v2: Khi bất kỳ ai hết bài, toàn đội chiến thắng (Rank 1 & Rank 2)', async () => {
    const room = {
      code: 'ROOM2V',
      mode: '2V2_TEAM',
      isTeamMode: true,
      isRanked: false,
      players: [
        { userId: 'u1', name: 'Alpha Captain', team: 'ALPHA', isBot: true },
        { userId: 'u2', name: 'Omega Leader', team: 'OMEGA', isBot: true },
        { userId: 'u3', name: 'Alpha Teammate', team: 'ALPHA', isBot: true },
        { userId: 'u4', name: 'Omega Teammate', team: 'OMEGA', isBot: true },
      ],
    };

    const game = new OnlineGame(room, mockIo);
    assert.strictEqual(game.isTeamMode, true);
    assert.strictEqual(game.players[0].team, 'ALPHA');
    assert.strictEqual(game.players[2].team, 'ALPHA');
    assert.strictEqual(game.players[1].team, 'OMEGA');
    assert.strictEqual(game.players[3].team, 'OMEGA');

    // Giả lập Alpha Teammate (Seat 2) đánh hết bài (0 lá)
    game.players[2].hand = [];
    await game.finishGame(game.players[2]);

    assert.strictEqual(game.status, 'finished');
    assert.ok(game.gameResult.winner.includes('Team Alpha'));
    assert.strictEqual(game.gameResult.isTeamMode, true);

    // Đội thắng xếp hạng 1 và 2
    const ranks = game.gameResult.rankings;
    assert.strictEqual(ranks[0].userId, 'u3'); // Người hết bài rank 1
    assert.strictEqual(ranks[1].userId, 'u1'); // Đồng đội rank 2

    game.stopTimers();
  });

  // 4. OnlineGame 2v2 Timeout: Đội có tổng số bài ít hơn thắng
  await it('4. OnlineGame 2v2: Khi hết 5 phút timeout, đội có tổng số lá ít hơn thắng', async () => {
    const room = {
      code: 'ROOM2V_TIMEOUT',
      mode: '2V2_TEAM',
      isTeamMode: true,
      isRanked: false,
      players: [
        { userId: 'u1', name: 'Alpha 1', team: 'ALPHA', isBot: true },
        { userId: 'u2', name: 'Omega 1', team: 'OMEGA', isBot: true },
        { userId: 'u3', name: 'Alpha 2', team: 'ALPHA', isBot: true },
        { userId: 'u4', name: 'Omega 2', team: 'OMEGA', isBot: true },
      ],
    };

    const game = new OnlineGame(room, mockIo);
    // Alpha: 2 + 1 = 3 lá; Omega: 4 + 4 = 8 lá -> Alpha thắng!
    game.players[0].hand = [{ id: '1' }, { id: '2' }];
    game.players[2].hand = [{ id: '3' }];
    game.players[1].hand = [{ id: '4' }, { id: '5' }, { id: '6' }, { id: '7' }];
    game.players[3].hand = [{ id: '8' }, { id: '9' }, { id: '10' }, { id: '11' }];

    await game.endMatchDueToTimeout();
    assert.strictEqual(game.status, 'finished');
    assert.ok(game.gameResult.winner.includes('Team Alpha'));
    assert.strictEqual(game.gameResult.isTeamMode, true);
    assert.strictEqual(game.gameResult.rankings[0].userId, 'u3'); // Alpha 2 ít bài nhất (1 lá)
    assert.strictEqual(game.gameResult.rankings[1].userId, 'u1'); // Alpha 1 (2 lá)

    game.stopTimers();
  });

  console.log('\n======================================================');
  console.log(`   KẾT QUẢ: ${passed}/${total} KIỂM THỬ ĐẠT (PASS 100%)`);
  console.log('======================================================\n');
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
