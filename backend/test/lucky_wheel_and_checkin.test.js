const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const rewardController = require('../controllers/rewardController');

async function runRewardTests() {
  console.log('\n======================================================');
  console.log('   KIỂM THỬ TASK 3 (TUẦN 5): VÒNG QUAY MAY MẮN & ĐIỂM DANH 7 NGÀY');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✔ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Test failed: ${message}`);
    }
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/neo_uno_test';
    let dbConnected = false;
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
      }
      dbConnected = mongoose.connection.readyState === 1;
    } catch {
      console.log('  ⚠️ Không kết nối được CSDL từ xa, chạy kiểm thử logic độc lập.');
    }

    // Helper tạo fake Express req & res
    function createMockRes() {
      const res = {
        statusCode: 200,
        data: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(payload) {
          this.data = payload;
          return this;
        },
      };
      return res;
    }

    // =========================================================================
    // NHÓM 1: KIỂM THỬ CẤU TRÚC VÒNG QUAY MAY MẮN (LUCKY WHEEL STATUS & WEIGHTS)
    // =========================================================================
    console.log('📌 Nhóm 1: Kiểm thử Cấu hình 8 Ô Vòng Quay May Mắn');
    const resStatus1 = createMockRes();
    await rewardController.getWheelStatus({ user: null, query: {} }, resStatus1);

    assert(resStatus1.data && resStatus1.data.success === true, 'getWheelStatus trả về success: true');
    assert(Array.isArray(resStatus1.data.slices) && resStatus1.data.slices.length === 8, 'Vòng quay phải có chính xác 8 ô');

    const totalWeight = resStatus1.data.slices.reduce((s, x) => s + x.weight, 0);
    assert(totalWeight === 100, `Tổng trọng số 8 ô quà phải đúng chuẩn xác 100% (Hiện tại: ${totalWeight}%)`);

    const jackpotSlice = resStatus1.data.slices.find((s) => s.id === 'jackpot');
    assert(jackpotSlice && jackpotSlice.value === 2500 && jackpotSlice.weight === 2, 'Jackpot phải là 2500 Vàng với tỉ lệ 2%');
    assert(resStatus1.data.paidSpinCost === 200, 'Giá quay thêm bằng Vàng phải là 200');

    // =========================================================================
    // NHÓM 2: KIỂM THỬ THUẬT TOÁN QUAY SERVER-AUTHORITATIVE & TÍNH GÓC QUAY
    // =========================================================================
    console.log('\n📌 Nhóm 2: Kiểm thử Thuật toán Quay & Góc Dừng Vòng Quay (Angle Calculation)');
    
    // Giả lập 500 lượt quay ngẫu nhiên kiểm tra góc quay và tính hợp lệ
    const hits = {};
    let angleCheckPassed = true;
    for (let i = 0; i < 500; i++) {
      const resSpin = createMockRes();
      await rewardController.spinWheel({ user: null, body: { isFree: true } }, resSpin);
      if (!resSpin.data?.success) throw new Error(`Lượt quay ${i + 1} thất bại`);
      const { selectedIndex, prize, stopAngle } = resSpin.data;
      if (selectedIndex < 0 || selectedIndex >= 8 || !prize?.id) throw new Error('Dữ liệu quay không hợp lệ');
      
      // Kiểm tra công thức góc quay: stopAngle = 1800 + (360 - (selectedIndex * 45 + 22.5))
      const expectedAngle = 1800 + (360 - (selectedIndex * 45 + 22.5));
      if (Math.abs(stopAngle - expectedAngle) > 0.001) {
        angleCheckPassed = false;
      }
      
      hits[prize.id] = (hits[prize.id] || 0) + 1;
    }
    assert(angleCheckPassed, 'Tất cả 500 lượt quay đều tính góc dừng stopAngle chuẩn xác tâm ô');

    console.log('    📊 Phân bổ 500 lượt quay thực tế:', hits);
    assert(hits['coins_200'] > hits['jackpot'], 'Tần suất ô 200 Vàng (30%) phải cao hơn Jackpot (2%)');

    // =========================================================================
    // NHÓM 3: KIỂM THỬ BẢO MẬT & LUẬT LƯỢT QUAY (FREE & PAID SPINS)
    // =========================================================================
    console.log('\n📌 Nhóm 3: Kiểm thử Luật Quay Miễn Phí & Trừ Vàng Chống Gian Lận');

    if (dbConnected) {
      // Tạo User test tạm thời trong MongoDB
      const testEmail = `wheel_test_${Date.now()}@neouno.cyber`;
      const testUser = await User.create({
        username: `wheel_${Date.now()}`,
        nickname: 'WheelTester',
        email: testEmail,
        password: 'Password123!',
        coins: 300,
        exp: 0,
      });

      try {
        // 1. Lần đầu: Quay Free thành công
        const resFree1 = createMockRes();
        await rewardController.spinWheel({ user: testUser, body: { isFree: true, userId: testUser._id.toString() } }, resFree1);
        assert(resFree1.data.success === true, 'Lượt quay miễn phí đầu tiên trong ngày phải thành công');

        // 2. Lần thứ hai trong cùng ngày: Quay Free phải bị chặn (HTTP 400)
        const updatedAfterFree1 = await User.findById(testUser._id);
        const resFree2 = createMockRes();
        await rewardController.spinWheel({ user: updatedAfterFree1, body: { isFree: true, userId: testUser._id.toString() } }, resFree2);
        assert(resFree2.statusCode === 400, 'Quay miễn phí lần thứ 2 trong cùng ngày phải bị từ chối với status 400');
        assert(resFree2.data.success === false, 'Phải trả về success: false');

        // 3. Quay có phí (200 Vàng) khi còn đủ tiền
        const resPaid1 = createMockRes();
        await rewardController.spinWheel({ user: updatedAfterFree1, body: { isFree: false, userId: testUser._id.toString() } }, resPaid1);
        assert(resPaid1.data.success === true, 'Quay trả phí khi đủ 200 Vàng phải thành công');

        // 4. Kiểm tra user không đủ 200 Vàng thì phải bị chặn
        await User.findByIdAndUpdate(testUser._id, { coins: 50 });
        const userPoor = await User.findById(testUser._id);
        const resPaid2 = createMockRes();
        await rewardController.spinWheel({ user: userPoor, body: { isFree: false, userId: testUser._id.toString() } }, resPaid2);
        assert(resPaid2.statusCode === 400, 'Quay trả phí khi chỉ có 50 Vàng phải bị từ chối');
        assert(resPaid2.data.message.includes('không đủ'), 'Thông báo phải nêu rõ không đủ Vàng');

      } finally {
        await User.deleteOne({ _id: testUser._id });
      }
    } else {
      console.log('  ⏩ Bỏ qua test CSDL ghi trực tiếp do không có kết nối DB.');
    }

    // =========================================================================
    // NHÓM 4: KIỂM THỬ CHUỖI ĐIỂM DANH 7 NGÀY (7-DAY CHECK-IN STREAK)
    // =========================================================================
    console.log('\n📌 Nhóm 4: Kiểm thử Chuỗi Điểm Danh 7 Ngày & Đại Thưởng Ngày 7');

    const resCheckInStatus = createMockRes();
    await rewardController.getCheckInStatus({ user: null, query: {} }, resCheckInStatus);
    assert(resCheckInStatus.data.success === true, 'getCheckInStatus phải thành công');
    assert(resCheckInStatus.data.rewards.length === 7, 'Phải có đúng 7 mốc phần thưởng điểm danh');
    
    const day7Reward = resCheckInStatus.data.rewards.find((r) => r.day === 7);
    assert(day7Reward.isGrandPrize === true, 'Ngày 7 phải có cờ isGrandPrize: true');
    assert(day7Reward.item === 'frame_halloween', 'Ngày 7 phải tặng Khung Avatar Bí Ngô frame_halloween');
    assert(day7Reward.coins === 1500, 'Ngày 7 phải thưởng 1500 Vàng');

    if (dbConnected) {
      const checkInUser = await User.create({
        username: `checkin_${Date.now()}`,
        nickname: 'CheckInTester',
        email: `checkin_${Date.now()}@neouno.cyber`,
        password: 'Password123!',
        coins: 1000,
        exp: 100,
        checkInStreak: 0,
        lastCheckInDate: null,
        claimedCheckInDays: [],
      });

      try {
        // Điểm danh Ngày 1
        const resClaimDay1 = createMockRes();
        await rewardController.claimCheckIn({ user: checkInUser, body: { userId: checkInUser._id.toString() } }, resClaimDay1);
        assert(resClaimDay1.data.success === true, 'Điểm danh Ngày 1 phải thành công');
        assert(resClaimDay1.data.streak === 1, 'Streak phải là 1 sau Ngày 1');
        assert(resClaimDay1.data.claimedDays.includes(1), 'claimedDays phải chứa ngày 1');

        // Điểm danh lần nữa trong cùng ngày -> Phải bị chặn
        const resClaimDup = createMockRes();
        await rewardController.claimCheckIn({ user: checkInUser, body: { userId: checkInUser._id.toString() } }, resClaimDup);
        assert(resClaimDup.statusCode === 400, 'Điểm danh lại trong cùng ngày phải bị từ chối');

        // Giả lập người chơi đã duy trì đến Ngày 6, hôm qua là ngày trước đó
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        await User.findByIdAndUpdate(checkInUser._id, {
          checkInStreak: 6,
          lastCheckInDate: yStr,
          claimedCheckInDays: [1, 2, 3, 4, 5, 6],
        });

        // Điểm danh Ngày 7 -> Nhận Đại Thưởng
        const resClaimDay7 = createMockRes();
        await rewardController.claimCheckIn({ user: checkInUser, body: { userId: checkInUser._id.toString() } }, resClaimDay7);
        assert(resClaimDay7.data.success === true, 'Điểm danh Ngày 7 phải thành công');
        assert(resClaimDay7.data.streak === 7, 'Streak phải đạt mốc 7');
        assert(resClaimDay7.data.user.inventory.includes('frame_halloween'), 'Túi đồ của người chơi phải có Khung Avatar Bí Ngô');

      } finally {
        await User.deleteOne({ _id: checkInUser._id });
      }
    }

    console.log('\n======================================================');
    console.log(`🎉 TẤT CẢ ${passed}/${total} BÀI KIỂM THỬ TASK 3 ĐÃ VƯỢT QUA XUẤT SẮC!`);
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ KIỂM THỬ THẤT BẠI:', error);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

runRewardTests();
