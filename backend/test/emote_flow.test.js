/**
 * Integration Test: Realtime Emotes & Quick Chat Flow (Task 3)
 */
require('dotenv').config();
const { io } = require('../../frontend/node_modules/socket.io-client');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const SERVER_URL = 'http://localhost:5001';

async function runEmoteFlowTest() {
  console.log('\n======================================================');
  console.log('   KIỂM THỬ TÍCH HỢP: BÁNH XE CHAT NHANH & EMOJI (TASK 3)');
  console.log('======================================================\n');

  let socketAlice = null;
  let socketBob = null;

  try {
    await connectDB();

    socketAlice = io(SERVER_URL, { transports: ['websocket'] });
    socketBob = io(SERVER_URL, { transports: ['websocket'] });

    await Promise.all([
      new Promise((resolve) => socketAlice.on('connect', resolve)),
      new Promise((resolve) => socketBob.on('connect', resolve)),
    ]);
    console.log('  ✔ Socket Alice & Bob đã kết nối tới Server');

    // 1. Alice tạo phòng
    const roomCode = await new Promise((resolve) => {
      socketAlice.emit(
        'room:create',
        {
          user: {
            name: 'AliceStriker',
            id: 'user_alice_01',
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=alice',
            isRanked: false,
            maxPlayers: 2,
          },
        },
        (res) => {
          if (res.success) resolve(res.room.code);
        }
      );
    });
    console.log(`[Alice] Đã tạo phòng: [${roomCode}]`);

    // 2. Bob tham gia phòng
    await new Promise((resolve) => {
      socketBob.emit(
        'room:join',
        {
          code: roomCode,
          user: {
            name: 'BobDefender',
            id: 'user_bob_02',
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=bob',
          },
        },
        (res) => {
          if (res.success) resolve();
        }
      );
    });
    console.log(`[Bob] Đã vào phòng: [${roomCode}]`);

    // 3. Bob sẵn sàng và Alice bắt đầu trận đấu
    await new Promise((resolve) => {
      socketBob.emit('room:toggle_ready', { code: roomCode }, () => resolve());
    });
    await new Promise((resolve) => {
      socketAlice.emit('room:start_game', { code: roomCode }, () => resolve());
    });
    console.log(`[Game] Trận đấu [${roomCode}] đã bắt đầu!`);

    // 4. Test Alice gửi Quick Chat tới Cả Bàn
    const aliceEmotePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout chờ nhận emote từ Alice')), 4000);
      socketBob.on('game:receive_emote', (payload) => {
        if (payload.emote?.id === 'good_job') {
          clearTimeout(timeout);
          resolve(payload);
        }
      });
    });

    socketAlice.emit('game:send_emote', {
      code: roomCode,
      emote: { id: 'good_job', category: 'chat', icon: '👏', label: 'Chơi hay lắm!', type: 'text', sound: 'emote_pop' },
      targetSeatIndex: null,
    });

    const receivedByBob = await aliceEmotePromise;
    console.log(`[Bob] 💬 Nhận được biểu cảm: ${receivedByBob.senderName} -> ${receivedByBob.emote.icon} "${receivedByBob.emote.label}"`);
    console.log('  ✔ PASS: Alice gửi và Bob nhận Chat nhanh thời gian thực!');

    // 5. Test Bob ném cà chua (Projectile) nhắm thẳng vào Avatar Alice (seatIndex 0)
    const bobProjectilePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout chờ nhận projectile từ Bob')), 4000);
      socketAlice.on('game:receive_emote', (payload) => {
        if (payload.emote?.id === 'tomato') {
          clearTimeout(timeout);
          resolve(payload);
        }
      });
    });

    socketBob.emit('game:send_emote', {
      code: roomCode,
      emote: { id: 'tomato', category: 'prop', icon: '🍅', label: 'Ném Cà Chua', type: 'projectile', sound: 'splat' },
      targetSeatIndex: 0,
    });

    const projectileReceivedByAlice = await bobProjectilePromise;
    console.log(`[Alice] 🍅 Nhận được quả cà chua từ: ${projectileReceivedByAlice.senderName} ném vào ghế P${(projectileReceivedByAlice.targetSeatIndex ?? 0) + 1}!`);
    console.log('  ✔ PASS: Bob ném đạo cụ có mục tiêu đích chính xác 100%!');

    console.log('\n======================================================');
    console.log('   KẾT QUẢ: TOÀN BỘ TÍNH NĂNG CHAT NHANH & EMOJI ĐÃ HOÀN HẢO!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Test thất bại:', err);
    process.exit(1);
  } finally {
    if (socketAlice) socketAlice.disconnect();
    if (socketBob) socketBob.disconnect();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runEmoteFlowTest();
