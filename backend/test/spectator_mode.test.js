/**
 * Automated Test Suite: Task 2 - Chế độ Khán giả Xem Trực Tiếp & Anti-Cheat Fog of War
 * Kiểm tra các tính năng:
 * 1. Khán giả tham gia xem trận đấu thành công (addSpectator)
 * 2. Bảo mật Anti-Cheat Fog of War: myHand rỗng, mySeatIndex = -1, bài tẩy của các người chơi không bị rò rỉ (chỉ gửi handCount)
 * 3. Đồng bộ và cập nhật số lượng khán giả thời gian thực (getSpectatorCount)
 * 4. Khán giả rời phòng và dọn dẹp spectator danh sách (removeSpectator)
 * 5. Khóa tương tác bàn cờ: Khán giả không thể đánh bài, bốc bài, bỏ lượt hoặc hô UNO
 * 6. Cơ chế phát tán trạng thái (broadcastState) tới toàn bộ socket khán giả
 */

const assert = require('assert');
const gameEngine = require('../socket/gameEngine');

function runSpectatorModeTests() {
  console.log('🧪 Bắt đầu kiểm thử Task 2: Chế độ Khán giả Xem Trực Tiếp & Fog of War...\n');
  let passedTests = 0;
  const totalTests = 6;

  // Giả lập Mock IO
  const emittedEvents = [];
  const mockIo = {
    to: (target) => ({
      emit: (event, data) => {
        emittedEvents.push({ target, event, data });
      },
    }),
  };

  // Tạo mock room với 2 người chơi
  const mockRoom = {
    code: 'SPEC99',
    mode: '2_PLAYERS',
    isRanked: true,
    players: [
      { socketId: 'sock_player_1', userId: 'user_1', name: 'Player One', avatar: 'avatar_1', isHost: true },
      { socketId: 'sock_player_2', userId: 'user_2', name: 'Player Two', avatar: 'avatar_2', isHost: false },
    ],
  };

  // Khởi tạo trận đấu trên gameEngine
  const game = gameEngine.startOnlineMatch(mockRoom, mockIo);
  assert(game, 'Khởi tạo trận đấu online thất bại!');

  // TEST 1: Khán giả tham gia phòng
  try {
    const spectatorUser = { id: 'spec_user_1', nickname: 'Khán Giả VIP', avatar: 'avatar_3' };
    const spec = game.addSpectator('sock_spec_1', spectatorUser);

    assert.strictEqual(spec.name, 'Khán Giả VIP', 'Tên khán giả phải khớp');
    assert.strictEqual(game.getSpectatorCount(), 1, 'Số lượng khán giả phải là 1');
    console.log('✅ Test 1: Khán giả tham gia xem trận đấu thành công (Spectator Registered)');
    passedTests++;
  } catch (err) {
    console.error('❌ Test 1 thất bại:', err.message);
  }

  // TEST 2: Bảo mật Fog of War (Anti-Cheat)
  try {
    const spectatorState = game.getClientStateForSpectator();

    assert.strictEqual(spectatorState.isSpectator, true, 'isSpectator phải là true');
    assert.strictEqual(spectatorState.mySeatIndex, -1, 'mySeatIndex phải là -1');
    assert.strictEqual(spectatorState.myHand.length, 0, 'myHand của khán giả phải hoàn toàn rỗng để chống soi bài tẩy (Fog of War)');
    assert.strictEqual(spectatorState.spectatorCount, 1, 'spectatorCount phải đúng');

    // Kiểm tra tất cả người chơi trong danh sách: KHÔNG được chứa mảng hand chi tiết (chỉ được có handCount)
    spectatorState.players.forEach((p) => {
      assert.strictEqual(p.hand, undefined, `Bài tẩy của người chơi ${p.name} không được lộ trong payload mạng!`);
      assert(typeof p.handCount === 'number' && p.handCount > 0, `handCount của ${p.name} phải là số nguyên dương`);
    });

    console.log('✅ Test 2: Bảo mật Anti-Cheat Fog of War hoạt động chuẩn xác (Không rò rỉ bài tẩy)');
    passedTests++;
  } catch (err) {
    console.error('❌ Test 2 thất bại:', err.message);
  }

  // TEST 3: Cập nhật nhiều khán giả cùng lúc
  try {
    game.addSpectator('sock_spec_2', { id: 'spec_user_2', nickname: 'Fan Hâm Mộ 2' });
    game.addSpectator('sock_spec_3', { id: 'spec_user_3', nickname: 'Trọng Tài Uno' });

    assert.strictEqual(game.getSpectatorCount(), 3, 'Số lượng khán giả phải tăng lên 3');
    const updatedState = game.getClientStateForSpectator();
    assert.strictEqual(updatedState.spectators.length, 3, 'Danh sách khán giả phải có 3 phần tử');
    console.log('✅ Test 3: Đồng bộ số lượng và danh sách nhiều khán giả cùng lúc');
    passedTests++;
  } catch (err) {
    console.error('❌ Test 3 thất bại:', err.message);
  }

  // TEST 4: Khán giả rời phòng & Dọn dẹp danh sách
  try {
    const removed = game.removeSpectator('sock_spec_2');
    assert(removed, 'Phải xóa thành công khán giả');
    assert.strictEqual(removed.name, 'Fan Hâm Mộ 2', 'Khán giả bị xóa phải đúng tên');
    assert.strictEqual(game.getSpectatorCount(), 2, 'Số lượng khán giả còn lại phải là 2');
    console.log('✅ Test 4: Xóa khán giả và giải phóng bộ nhớ khi rời phòng');
    passedTests++;
  } catch (err) {
    console.error('❌ Test 4 thất bại:', err.message);
  }

  // TEST 5: Khóa tương tác - Khán giả không được phép can thiệp vào trận đấu
  try {
    const playRes = game.playerPlayCard('sock_spec_1', 'any_card', 'red', 'spec_user_1');
    assert.strictEqual(playRes.success, false, 'Khán giả không được phép đánh bài');

    const drawRes = game.playerDrawCard('sock_spec_1', 'spec_user_1');
    assert.strictEqual(drawRes.success, false, 'Khán giả không được phép bốc bài');

    const passRes = game.playerPassTurn('sock_spec_1', 'spec_user_1');
    assert.strictEqual(passRes.success, false, 'Khán giả không được phép bỏ lượt');

    const unoRes = game.playerCallUno('sock_spec_1', 'spec_user_1');
    assert.strictEqual(unoRes.success, false, 'Khán giả không được phép hô UNO');

    console.log('✅ Test 5: Khóa chặt tương tác bàn cờ đối với tài khoản khán giả (Anti-Interference)');
    passedTests++;
  } catch (err) {
    console.error('❌ Test 5 thất bại:', err.message);
  }

  // TEST 6: Phát tán trạng thái (broadcastState) gửi cho khán giả
  try {
    emittedEvents.length = 0; // Clear
    game.broadcastState();

    const specEvents = emittedEvents.filter(
      (e) => e.target === 'sock_spec_1' || e.target === 'sock_spec_3'
    );
    assert.strictEqual(specEvents.length, 2, 'Phải gửi game:state_sync tới cả 2 khán giả đang có mặt');
    assert.strictEqual(specEvents[0].data.isSpectator, true, 'Dữ liệu gửi cho khán giả phải có cờ isSpectator = true');
    assert.strictEqual(specEvents[0].data.myHand.length, 0, 'Dữ liệu gửi cho khán giả myHand phải rỗng');

    console.log('✅ Test 6: broadcastState gửi riêng gói tin Fog of War tới tất cả socket khán giả');
    passedTests++;
  } catch (err) {
    console.error('❌ Test 6 thất bại:', err.message);
  }

  // Dọn dẹp game
  game.stopTimers();
  gameEngine.activeGames.delete('SPEC99');

  console.log(`\n========================================`);
  console.log(`🎉 KẾT QUẢ TEST SPECTATOR MODE: ${passedTests}/${totalTests} PASS (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log(`========================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSpectatorModeTests();
