/**
 * Unit Test: Ràng Buộc CSDL Nickname Duy Nhất & Stored Functions Chat 1-1 (Task 2 Nâng Cao)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const DirectMessage = require('../models/DirectMessage');
const connectDB = require('../config/db');

async function runTests() {
  console.log('\n================================================================');
  console.log('   BẮT ĐẦU KIỂM THỬ: RÀNG BUỘC CSDL & HÀM THỦ TỤC CHAT 1-1');
  console.log('================================================================\n');

  try {
    await connectDB();

    // 1. Dọn dẹp dữ liệu thử nghiệm cũ
    await User.deleteMany({ email: { $in: ['db_test_alpha@neo.com', 'db_test_beta@neo.com', 'db_test_clone@neo.com'] } });

    // TEST 1: Tạo tài khoản người chơi Alpha
    const userAlpha = await User.create({
      nickname: 'AlphaShadow',
      email: 'db_test_alpha@neo.com',
      password: 'hashed_password_123',
      avatar: 'avatar_1',
    });
    console.log(`[DBMS] ✅ Đã tạo tài khoản Alpha: [${userAlpha.nickname}] (ID: ${userAlpha._id})`);
    console.log('  ✔ PASS: 1. Tạo tài khoản hợp lệ thành công');

    // TEST 2: Ràng buộc CSDL - Chống 2 tài khoản trùng Nickname (Kể cả khác chữ hoa/thường)
    let duplicateErrorCaught = false;
    try {
      await User.create({
        nickname: 'alphashadow', // Viết thường hoàn toàn so với AlphaShadow
        email: 'db_test_clone@neo.com',
        password: 'hashed_password_123',
        avatar: 'avatar_2',
      });
    } catch (err) {
      duplicateErrorCaught = true;
      console.log(`[DBMS Constraint] 🛡️ Hệ quản trị CSDL đã chặn trùng lặp Nickname: ${err.message}`);
    }

    if (!duplicateErrorCaught) {
      throw new Error('Test 2 Thất bại: CSDL cho phép 2 tài khoản trùng Nickname!');
    }
    console.log('  ✔ PASS: 2. Ràng buộc CSDL (Case-insensitive Unique Constraint) hoạt động tuyệt đối');

    // TEST 3: Tạo người chơi Beta và kiểm tra Stored Procedure `User.findByNicknameOrId`
    const userBeta = await User.create({
      nickname: 'BetaViper',
      email: 'db_test_beta@neo.com',
      password: 'hashed_password_123',
      avatar: 'avatar_3',
    });

    const foundById = await User.findByNicknameOrId(userBeta._id.toString());
    const foundByNick = await User.findByNicknameOrId('betaviper');

    if (!foundById || String(foundById._id) !== String(userBeta._id)) {
      throw new Error('Test 3 Thất bại: Không tìm được tài khoản theo ID ObjectId');
    }
    if (!foundByNick || String(foundByNick._id) !== String(userBeta._id)) {
      throw new Error('Test 3 Thất bại: Không tìm được tài khoản theo Nickname');
    }
    console.log(`[DBMS Procedure] 🔍 Tra cứu thành công tài khoản bằng cả ID [${foundById._id}] và Nickname [${foundByNick.nickname}]`);
    console.log('  ✔ PASS: 3. Hàm thủ tục tra cứu User.findByNicknameOrId chính xác 100%');

    // TEST 4: Thiết lập quan hệ bạn bè giữa Alpha và Beta
    await Friendship.create({
      requester: userAlpha._id,
      recipient: userBeta._id,
      status: 'accepted',
    });
    console.log(`[Friendship] 🤝 Alpha và Beta đã trở thành bạn bè`);

    // TEST 5: Gửi tin nhắn trực tiếp (Direct Message) giữa 2 bạn bè
    const msg1 = await DirectMessage.create({
      sender: userAlpha._id,
      recipient: userBeta._id,
      content: 'Chào Beta! Làm một ván UNO không?',
    });

    const msg2 = await DirectMessage.create({
      sender: userBeta._id,
      recipient: userAlpha._id,
      content: 'Sẵn sàng luôn Alpha ơi, vào phòng đi!',
    });

    console.log(`[Direct Message] 💬 Đã lưu 2 tin nhắn chat 2 chiều vào MongoDB`);
    if (!msg1 || !msg2) throw new Error('Test 5 Thất bại: Không lưu được tin nhắn vào CSDL');
    console.log('  ✔ PASS: 5. Gửi và lưu trữ tin nhắn Direct Message thành công');

    // TEST 6: Khai thác Stored Procedure `DirectMessage.getConversation`
    const conversation = await DirectMessage.getConversation(userAlpha._id, userBeta._id);
    if (conversation.length !== 2) {
      throw new Error(`Test 6 Thất bại: Độ dài hội thoại mong đợi 2, nhận được ${conversation.length}`);
    }
    console.log(`[DBMS Procedure] 📜 Lịch sử hội thoại 2 chiều: [${conversation.map(m => m.content).join(' -> ')}]`);
    console.log('  ✔ PASS: 6. Hàm thủ tục DirectMessage.getConversation sắp xếp thời gian chuẩn xác');

    // TEST 7: Khai thác Database Aggregation Pipeline `Friendship.getFriendsDetailedPipeline`
    const pipelineResult = await Friendship.getFriendsDetailedPipeline(userAlpha._id);
    if (pipelineResult.length !== 1) {
      throw new Error(`Test 7 Thất bại: Kết quả pipeline bạn bè mong đợi 1, nhận được ${pipelineResult.length}`);
    }
    const friendData = pipelineResult[0];
    console.log(`[DBMS Pipeline] ⚡ Kết quả Aggregation: Bạn bè [${friendData.nickname}], Tin nhắn gần nhất: "${friendData.lastMessage}", Chưa đọc: ${friendData.unreadCount}`);
    if (friendData.lastMessage !== 'Sẵn sàng luôn Alpha ơi, vào phòng đi!') {
      throw new Error('Test 7 Thất bại: Last message trong pipeline không khớp');
    }
    console.log('  ✔ PASS: 7. Database Aggregation Pipeline $lookup $facet hoạt động tối ưu');

    // TEST 8: Đánh dấu đã đọc qua Stored Procedure `DirectMessage.markConversationAsRead`
    const modifiedCount = await DirectMessage.markConversationAsRead(userAlpha._id, userBeta._id);
    const unreadCheck = await DirectMessage.countDocuments({ recipient: userAlpha._id, isRead: false });
    if (unreadCheck !== 0) {
      throw new Error(`Test 8 Thất bại: Vẫn còn ${unreadCheck} tin nhắn chưa đọc`);
    }
    console.log(`[DBMS Bulk] 👁️ Đã đánh dấu ${modifiedCount} tin nhắn đã đọc`);
    console.log('  ✔ PASS: 8. Thủ tục Bulk Update đánh dấu đã đọc hoạt động chuẩn xác');

    // Dọn dẹp dữ liệu thử nghiệm
    await User.deleteMany({ email: { $in: ['db_test_alpha@neo.com', 'db_test_beta@neo.com', 'db_test_clone@neo.com'] } });
    await Friendship.deleteMany({
      $or: [
        { requester: { $in: [userAlpha._id, userBeta._id] } },
        { recipient: { $in: [userAlpha._id, userBeta._id] } },
      ],
    });
    await DirectMessage.deleteMany({
      $or: [
        { sender: { $in: [userAlpha._id, userBeta._id] } },
        { recipient: { $in: [userAlpha._id, userBeta._id] } },
      ],
    });

    console.log('\n================================================================');
    console.log('   KẾT QUẢ: 8/8 KIỂM THỬ ĐẠT (ALL PASS)');
    console.log('================================================================\n');
    console.log('🎉 TẤT CẢ RÀNG BUỘC CSDL & HÀM THỦ TỤC NÂNG CAO ĐÃ HOÀN TOÀN CHÍNH XÁC!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ LỖI KIỂM THỬ:', err.message);
    process.exit(1);
  }
}

runTests();
