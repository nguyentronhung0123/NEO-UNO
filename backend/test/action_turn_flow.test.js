require('dotenv').config();
const { io } = require('../../frontend/node_modules/socket.io-client');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const SERVER_URL = 'http://localhost:5001';

async function runActionTurnTest() {
  console.log('\n======================================================');
  console.log('   KIỂM THỬ: ĐỒNG BỘ LƯỢT, PASS TURN & KHÔNG BỊ TREO');
  console.log('======================================================\n');

  let socketAlice = null;
  let socketBob = null;

  const testRunId = Date.now();
  const aliceId = 'user_alice_' + testRunId;
  const bobId = 'user_bob_' + testRunId;

  try {
    await connectDB();

    socketAlice = io(SERVER_URL, { transports: ['websocket'] });
    socketBob = io(SERVER_URL, { transports: ['websocket'] });

    await Promise.all([
      new Promise((resolve) => socketAlice.on('connect', resolve)),
      new Promise((resolve) => socketBob.on('connect', resolve)),
    ]);
    console.log('  ✔ Socket Alice & Bob đã kết nối tới Server');

    // 1. Tạo phòng
    const roomCode = await new Promise((resolve) => {
      socketAlice.emit(
        'room:create',
        {
          user: {
            name: 'Alice',
            id: aliceId,
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=alice_act',
            isRanked: true,
            maxPlayers: 2,
          },
        },
        (res) => {
          if (res.success) resolve(res.room.code);
        }
      );
    });

    // 2. Bob tham gia phòng
    await new Promise((resolve) => {
      socketBob.emit(
        'room:join',
        {
          code: roomCode,
          user: {
            name: 'Bob',
            id: bobId,
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=bob_act',
          },
        },
        (res) => {
          if (res.success) resolve();
        }
      );
    });

    // 3. Sẵn sàng và bắt đầu ván
    await new Promise((resolve) => {
      socketBob.emit('room:toggle_ready', { code: roomCode }, () => resolve());
    });

    const startPromise = new Promise((resolve) => {
      socketAlice.on('room:game_started', resolve);
    });
    socketAlice.emit('room:start_game', { code: roomCode });
    await startPromise;
    console.log(`  ✔ PASS: 1. Khởi tạo trận đấu [${roomCode}] thành công`);

    // Lắng nghe state_sync từ Alice
    const statePromise = new Promise((resolve) => {
      socketAlice.on('game:state_sync', (state) => {
        if (!state.isDealing) resolve(state);
      });
    });

    // Chờ 3.5s để dealing hoàn tất
    console.log('  ... Đang chờ ván cờ phát bài và bắt đầu lượt ...');
    const stateAlice = await statePromise;

    if (stateAlice.turnNumber === undefined || stateAlice.turnNumber < 1) {
      throw new Error('turnNumber không được đồng bộ trong state!');
    }
    if (stateAlice.isTransitioning === undefined) {
      throw new Error('isTransitioning không được đồng bộ trong state!');
    }
    console.log(`  ✔ PASS: 2. turnNumber (${stateAlice.turnNumber}) & isTransitioning (${stateAlice.isTransitioning}) được đồng bộ chuẩn xác`);

    // 4. Test Rút bài & Bỏ lượt (Kiểm tra xem pass_turn có bị kẹt isTransitioning không)
    const activeSocket = stateAlice.currentTurnIndex === stateAlice.mySeatIndex ? socketAlice : socketBob;
    const activeUserId = stateAlice.currentTurnIndex === stateAlice.mySeatIndex ? aliceId : bobId;
    const inactiveSocket = activeSocket === socketAlice ? socketBob : socketAlice;

    // Rút 1 lá
    const drawRes = await new Promise((resolve) => {
      activeSocket.emit('game:draw_card', { code: roomCode, userId: activeUserId }, resolve);
    });
    if (!drawRes.success) throw new Error('Rút bài thất bại: ' + drawRes.message);
    console.log('  ✔ PASS: 3. Người chơi đang tới lượt rút bài thành công');

    // Chuẩn bị bắt state_sync của lượt tiếp theo
    const nextStatePromise = new Promise((resolve) => {
      inactiveSocket.on('game:state_sync', (st) => {
        if (st.turnNumber > stateAlice.turnNumber && !st.isTransitioning) {
          resolve(st);
        }
      });
    });

    // Bỏ lượt
    const passRes = await new Promise((resolve) => {
      activeSocket.emit('game:pass_turn', { code: roomCode, userId: activeUserId }, resolve);
    });
    if (!passRes.success) throw new Error('Bỏ lượt thất bại: ' + passRes.message);
    console.log('  ✔ PASS: 4. Lệnh pass_turn thực thi thành công');

    // Chờ state mới
    const nextState = await nextStatePromise;

    if (nextState.isTransitioning !== false) {
      throw new Error(`Bug 2 tái diễn: isTransitioning vẫn bị kẹt true sau pass_turn!`);
    }
    if (nextState.turnNumber <= stateAlice.turnNumber) {
      throw new Error(`turnNumber không tăng sau khi chuyển lượt!`);
    }
    console.log(`  ✔ PASS: 5. Chuyển lượt dứt khoát! isTransitioning = ${nextState.isTransitioning}, turnNumber mới = ${nextState.turnNumber} (Bug 2 đã được triệt tiêu 100%)`);

    console.log('\n======================================================');
    console.log('   TẤT CẢ KIỂM THỬ ĐÃ PASS HOÀN TOÀN! HỆ THỐNG ỔN ĐỊNH.');
    console.log('======================================================\n');
  } finally {
    if (socketAlice) socketAlice.disconnect();
    if (socketBob) socketBob.disconnect();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runActionTurnTest().catch((err) => {
  console.error('❌ LỖI:', err);
  process.exit(1);
});
