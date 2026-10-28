/**
 * Integration Test: Realtime Match Invite & Join Flow (Task 2)
 */
require('dotenv').config();
const { io } = require('../../frontend/node_modules/socket.io-client');
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const SERVER_URL = 'http://localhost:5001';

async function runMatchInviteTest() {
  console.log('\n======================================================');
  console.log('   KIỂM THỬ TÍCH HỢP: LỜI MỜI ĐẤU BẠN BÈ THỜI GIAN THỰC');
  console.log('======================================================\n');

  try {
    await connectDB();

    // 1. Dọn dẹp tài khoản test
    await User.deleteMany({ email: { $in: ['test_sender@neo.com', 'test_receiver@neo.com'] } });

    const alice = await User.create({
      nickname: 'AliceHost',
      email: 'test_sender@neo.com',
      password: 'password123',
      elo: 1250,
      avatar: 'avatar_1',
    });

    const bob = await User.create({
      nickname: 'BobGuest',
      email: 'test_receiver@neo.com',
      password: 'password123',
      elo: 1100,
      avatar: 'avatar_2',
    });

    console.log(`[Setup] Đã chuẩn bị 2 tài khoản test: Alice (${alice._id}) & Bob (${bob._id})`);

    // 2. Kết nối Socket cho cả 2 người
    const socketAlice = io(SERVER_URL, { transports: ['websocket'] });
    const socketBob = io(SERVER_URL, { transports: ['websocket'] });

    await Promise.all([
      new Promise((resolve) => socketAlice.on('connect', resolve)),
      new Promise((resolve) => socketBob.on('connect', resolve)),
    ]);
    console.log('  ✔ Socket Alice & Bob đã kết nối tới Server');

    // 3. Đăng ký Presence (user:register)
    socketAlice.emit('user:register', {
      userId: alice._id.toString(),
      user: { id: alice._id.toString(), nickname: alice.nickname },
    });

    socketBob.emit('user:register', {
      userId: bob._id.toString(),
      user: { id: bob._id.toString(), nickname: bob.nickname },
    });

    // Chờ 300ms để presence cập nhật
    await new Promise((r) => setTimeout(r, 300));
    console.log('  ✔ Đã đăng ký User Presence trên Socket Server');

    // 4. Alice tạo phòng đấu
    let roomCode = null;
    await new Promise((resolve, reject) => {
      socketAlice.emit(
        'room:create',
        {
          user: {
            id: alice._id.toString(),
            nickname: alice.nickname,
            name: alice.nickname,
          },
        },
        (res) => {
          if (res?.success && res.room) {
            roomCode = res.room.code;
            console.log(`[Alice] Đã tạo phòng đấu mới: [${roomCode}]`);
            resolve();
          } else {
            reject(new Error(res?.message || 'Không thể tạo phòng'));
          }
        }
      );
    });

    // 5. Alice gửi lời mời đấu tới Bob
    const invitePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Bob không nhận được invite:received trong 3s')), 3000);
      socketBob.on('invite:received', (invite) => {
        clearTimeout(timeout);
        console.log(`[Bob] 📨 Nhận được lời mời đấu từ ${invite.fromUser?.nickname} vào phòng [${invite.roomCode}]!`);
        resolve(invite);
      });
    });

    await new Promise((resolve, reject) => {
      socketAlice.emit(
        'invite:send',
        {
          toUserId: bob._id.toString(),
          roomCode: roomCode,
          sender: {
            id: alice._id.toString(),
            nickname: alice.nickname,
            avatar: alice.avatar,
          },
        },
        (res) => {
          if (res?.success) {
            console.log(`[Alice] Đã gửi lệnh invite:send thành công`);
            resolve();
          } else {
            reject(new Error(res?.message || 'Không thể gửi lời mời'));
          }
        }
      );
    });

    const receivedInvite = await invitePromise;
    if (receivedInvite.roomCode !== roomCode) {
      throw new Error(`Mã phòng nhận được (${receivedInvite.roomCode}) không khớp (${roomCode})`);
    }
    console.log('  ✔ PASS: Alice gửi và Bob nhận lời mời đấu qua Socket thành công!');

    // 6. Bob chấp nhận và vào phòng đấu (room:join)
    await new Promise((resolve, reject) => {
      socketBob.emit(
        'room:join',
        {
          code: roomCode,
          user: {
            id: bob._id.toString(),
            nickname: bob.nickname,
            name: bob.nickname,
          },
        },
        (res) => {
          if (res?.success) {
            console.log(`[Bob] Đã vào phòng [${roomCode}] thành công!`);
            resolve();
          } else {
            reject(new Error(res?.message || 'Bob không thể vào phòng'));
          }
        }
      );
    });

    // 7. Bob bấm Sẵn Sàng (room:toggle_ready)
    await new Promise((resolve) => {
      socketBob.emit('room:toggle_ready', { code: roomCode });
      setTimeout(resolve, 300);
    });
    console.log('  ✔ PASS: Bob đã vào phòng và bấm Sẵn Sàng');

    // 8. Dọn dẹp
    socketAlice.disconnect();
    socketBob.disconnect();
    await User.deleteMany({ email: { $in: ['test_sender@neo.com', 'test_receiver@neo.com'] } });

    console.log('\n======================================================');
    console.log('   KẾT QUẢ: TOÀN BỘ QUY TRÌNH MỜI ĐẤU ĐÃ HOẠT ĐỘNG HOÀN HẢO!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ LỖI TEST MỜI ĐẤU:', err.message);
    process.exit(1);
  }
}

runMatchInviteTest();
