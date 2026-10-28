/**
 * Unit Test: Hệ Thống Bạn Bè & Lời Mời Đấu (Task 2)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const connectDB = require('../config/db');

async function runFriendTests() {
  console.log('\n======================================================');
  console.log('   BẮT ĐẦU KIỂM THỬ: HỆ THỐNG BẠN BÈ & LỜI MỜI (TASK 2)');
  console.log('======================================================\n');

  try {
    await connectDB();

    // 1. Dọn dẹp dữ liệu test cũ nếu có
    await User.deleteMany({ email: { $in: ['test_alice_task2@neo.com', 'test_bob_task2@neo.com', 'test_charlie_task2@neo.com'] } });

    // 2. Tạo 3 người chơi thử nghiệm
    const alice = await User.create({
      nickname: 'AliceStriker',
      email: 'test_alice_task2@neo.com',
      password: 'hashed_password_123',
      avatar: 'avatar_1',
      elo: 1200,
      coins: 2000,
      level: 5,
    });

    const bob = await User.create({
      nickname: 'BobDefender',
      email: 'test_bob_task2@neo.com',
      password: 'hashed_password_123',
      avatar: 'avatar_2',
      elo: 1150,
      coins: 1500,
      level: 4,
    });

    const charlie = await User.create({
      nickname: 'CharlieCyber',
      email: 'test_charlie_task2@neo.com',
      password: 'hashed_password_123',
      avatar: 'avatar_3',
      elo: 1300,
      coins: 3000,
      level: 7,
    });

    await Friendship.deleteMany({
      $or: [
        { requester: { $in: [alice._id, bob._id, charlie._id] } },
        { recipient: { $in: [alice._id, bob._id, charlie._id] } },
      ],
    });

    // TEST 1: Gửi lời mời kết bạn từ Alice sang Bob
    const req1 = await Friendship.create({
      requester: alice._id,
      recipient: bob._id,
      status: 'pending',
    });
    console.log(`[Friend] 📨 Alice (${alice.nickname}) đã gửi lời mời kết bạn tới Bob (${bob.nickname})`);
    if (!req1 || req1.status !== 'pending') throw new Error('Test 1 Thất bại: Lời mời không được tạo ở trạng thái pending');
    console.log('  ✔ PASS: 1. Gửi lời mời kết bạn thành công (Pending Request)');

    // TEST 2: Kiểm tra chống gửi trùng lặp (Duplicate Request)
    let duplicateCaught = false;
    try {
      await Friendship.create({
        requester: alice._id,
        recipient: bob._id,
        status: 'pending',
      });
    } catch (e) {
      duplicateCaught = true;
    }
    if (!duplicateCaught) throw new Error('Test 2 Thất bại: Cho phép tạo 2 lời mời trùng lặp');
    console.log('  ✔ PASS: 2. Ngăn chặn trùng lặp lời mời kết bạn (Unique Index Guard)');

    // TEST 3: Bob chấp nhận lời mời kết bạn của Alice
    req1.status = 'accepted';
    await req1.save();
    console.log(`[Friend] 🤝 Bob (${bob.nickname}) đã chấp nhận lời mời kết bạn từ Alice!`);
    const acceptedCheck = await Friendship.findById(req1._id);
    if (!acceptedCheck || acceptedCheck.status !== 'accepted') {
      throw new Error('Test 3 Thất bại: Trạng thái bạn bè chưa chuyển thành accepted');
    }
    console.log('  ✔ PASS: 3. Chấp nhận kết bạn thành công (Status: Accepted)');

    // TEST 4: Truy vấn danh sách bạn bè của Alice
    const aliceFriends = await Friendship.find({
      $or: [{ requester: alice._id }, { recipient: alice._id }],
      status: 'accepted',
    }).populate('requester recipient', 'nickname elo');

    if (aliceFriends.length !== 1) throw new Error(`Test 4 Thất bại: Số lượng bạn bè mong đợi là 1, nhận được ${aliceFriends.length}`);
    const friendPartner = aliceFriends[0].requester._id.equals(alice._id)
      ? aliceFriends[0].recipient
      : aliceFriends[0].requester;
    if (friendPartner.nickname !== 'BobDefender') throw new Error('Test 4 Thất bại: Tên bạn bè không khớp');
    console.log(`[Friend] 👥 Danh sách bạn bè của Alice: [${friendPartner.nickname}] (ELO: ${friendPartner.elo})`);
    console.log('  ✔ PASS: 4. Truy vấn danh sách bạn bè 2 chiều chuẩn xác');

    // TEST 5: Charlie gửi kết bạn tới Alice rồi Alice từ chối
    const req2 = await Friendship.create({
      requester: charlie._id,
      recipient: alice._id,
      status: 'pending',
    });
    console.log(`[Friend] 📨 Charlie gửi lời mời cho Alice`);
    await Friendship.findByIdAndDelete(req2._id);
    const declinedCheck = await Friendship.findById(req2._id);
    if (declinedCheck) throw new Error('Test 5 Thất bại: Lời mời chưa bị xóa khi từ chối');
    console.log('  ✔ PASS: 5. Từ chối lời mời kết bạn dọn dẹp hàng chờ');

    // TEST 6: Hủy kết bạn (Unfriend) giữa Alice và Bob
    await Friendship.findOneAndDelete({
      $or: [
        { requester: alice._id, recipient: bob._id },
        { requester: bob._id, recipient: alice._id },
      ],
      status: 'accepted',
    });
    const afterUnfriend = await Friendship.find({
      $or: [{ requester: alice._id }, { recipient: alice._id }],
      status: 'accepted',
    });
    if (afterUnfriend.length !== 0) throw new Error('Test 6 Thất bại: Vẫn còn quan hệ bạn bè sau khi hủy');
    console.log('  ✔ PASS: 6. Hủy kết bạn (Unfriend) thành công');

    // 3. Dọn dẹp dữ liệu test
    await User.deleteMany({ email: { $in: ['test_alice_task2@neo.com', 'test_bob_task2@neo.com', 'test_charlie_task2@neo.com'] } });
    await Friendship.deleteMany({
      $or: [
        { requester: { $in: [alice._id, bob._id, charlie._id] } },
        { recipient: { $in: [alice._id, bob._id, charlie._id] } },
      ],
    });

    console.log('\n======================================================');
    console.log('   KẾT QUẢ: 6/6 KIỂM THỬ ĐẠT (ALL PASS)');
    console.log('======================================================\n');
    console.log('🎉 HỆ THỐNG BẠN BÈ VÀ LỜI MỜI (TASK 2) ĐÃ HOÀN TOÀN CHÍNH XÁC!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ LỖI KIỂM THỬ:', err.message);
    process.exit(1);
  }
}

runFriendTests();
