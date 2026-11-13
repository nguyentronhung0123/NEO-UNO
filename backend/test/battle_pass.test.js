const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const battlePassController = require('../controllers/battlePassController');

async function runBattlePassTests() {
  console.log('\n======================================================');
  console.log('   KIỂM THỬ TASK 4 (TUẦN 5): SỔ SỨ MỆNH CYBER MÙA 1 (BATTLE PASS)');
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

  function createMockRes() {
    return {
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

    // =========================================================================
    // NHÓM 1: KIỂM THỬ CẤU TRÚC 30 CẤP ĐỘ SỔ SỨ MỆNH (BATTLE PASS LEVELS)
    // =========================================================================
    console.log('📌 Nhóm 1: Kiểm thử Cấu hình 30 Cấp Độ Sổ Sứ Mệnh Mùa 1');
    const resStatus1 = createMockRes();
    await battlePassController.getBattlePassStatus({ user: null, query: {} }, resStatus1);

    assert(resStatus1.data && resStatus1.data.success === true, 'getBattlePassStatus trả về success: true');
    assert(resStatus1.data.season === 1, 'Mùa giải hiện tại phải là Mùa 1');
    assert(resStatus1.data.levels.length === 30, 'Sổ Sứ Mệnh phải có chính xác 30 cấp độ');
    assert(resStatus1.data.expPerLevel === 200, 'Mỗi cấp yêu cầu đúng 200 Season EXP');
    assert(resStatus1.data.premiumCost === 5000, 'Giá mở khóa VIP phải là 5,000 Vàng');

    // Kiểm tra mốc đặc biệt
    const lv10 = resStatus1.data.levels.find((l) => l.level === 10);
    assert(lv10.premium.item === 'skin_matrix', 'Cấp 10 VIP phải có Skin Mặt Lưng Cyber Matrix');

    const lv30 = resStatus1.data.levels.find((l) => l.level === 30);
    assert(lv30.premium.isGrandPrize === true, 'Cấp 30 VIP phải là Đại Thưởng Mùa');
    assert(lv30.premium.item === 'frame_cyber_emperor', 'Cấp 30 VIP phải thưởng Khung Vương Miện Điện Tử');
    assert(lv30.premium.coins === 10000, 'Cấp 30 VIP phải thưởng 10,000 Vàng');

    // =========================================================================
    // NHÓM 2: KIỂM THỬ THUẬT TOÁN TÍCH LŨY EXP & THĂNG CẤP TỰ ĐỘNG
    // =========================================================================
    console.log('\n📌 Nhóm 2: Kiểm thử Cơ chế Tích EXP & Thăng Cấp (EXP Progression)');

    if (dbConnected) {
      const testEmail = `pass_test_${Date.now()}@neouno.cyber`;
      const testUser = await User.create({
        username: `pass_${Date.now()}`,
        nickname: 'PassTester',
        email: testEmail,
        password: 'Password123!',
        coins: 10000,
        exp: 0,
        battlePass: {
          season: 1,
          level: 1,
          exp: 0,
          isPremium: false,
          claimedFreeLevels: [],
          claimedPremiumLevels: [],
        },
      });

      try {
        // 1. Cộng 150 EXP -> Chưa đủ lên cấp, giữ Level 1 (150/200)
        let hookRes = await battlePassController.addSeasonExpToUser(testUser._id, 150);
        assert(hookRes.level === 1 && hookRes.exp === 150, '150 EXP phải giữ người chơi ở Cấp 1 với 150 EXP');
        assert(hookRes.leveledUp === false, 'Chưa thăng cấp');

        // 2. Cộng thêm 100 EXP -> Tổng 250 EXP -> Lên Cấp 2, dư 50 EXP (50/200)
        hookRes = await battlePassController.addSeasonExpToUser(testUser._id, 100);
        assert(hookRes.level === 2 && hookRes.exp === 50, 'Cộng thêm 100 EXP phải thăng hạng Cấp 2 với 50 EXP dư');
        assert(hookRes.leveledUp === true, 'Xác nhận cờ thăng cấp leveledUp: true');

        // 3. Cộng lượng lớn EXP (10,000 EXP) -> Phải chạm mốc giới hạn Cấp 30 (Max Level)
        hookRes = await battlePassController.addSeasonExpToUser(testUser._id, 10000);
        assert(hookRes.level === 30, 'Cộng 10,000 EXP phải đạt Cấp tối đa (Level 30)');

        // =====================================================================
        // NHÓM 3: KIỂM THỬ NHẬN THƯỞNG & BẢO MẬT CHỐNG GIAN LẬN
        // =====================================================================
        console.log('\n📌 Nhóm 3: Kiểm thử Nhận Thưởng Cấp & Chống Gian Lận (Claim Security)');

        // 1. Nhận thưởng Cấp 1 Tuyến Miễn Phí
        const resClaim1 = createMockRes();
        await battlePassController.claimLevelReward(
          { user: testUser, body: { userId: testUser._id.toString(), level: 1, track: 'free' } },
          resClaim1
        );
        assert(resClaim1.data.success === true, 'Nhận thưởng Cấp 1 Free phải thành công');
        assert(resClaim1.data.reward.coins === 100, 'Thưởng Cấp 1 Free phải là 100 Vàng');

        // 2. Nhận lại Cấp 1 Tuyến Miễn Phí -> Phải bị chặn với HTTP 400
        const resClaimDup = createMockRes();
        await battlePassController.claimLevelReward(
          { user: testUser, body: { userId: testUser._id.toString(), level: 1, track: 'free' } },
          resClaimDup
        );
        assert(resClaimDup.statusCode === 400, 'Nhận lại Cấp 1 Free phải bị từ chối với status 400');
        assert(resClaimDup.data.message.includes('đã nhận'), 'Thông báo phải nêu rõ đã nhận rồi');

        // 3. Nhận Cấp 1 Tuyến VIP khi CHƯA nâng cấp -> Phải bị chặn
        const resClaimVipFail = createMockRes();
        await battlePassController.claimLevelReward(
          { user: testUser, body: { userId: testUser._id.toString(), level: 1, track: 'premium' } },
          resClaimVipFail
        );
        assert(resClaimVipFail.statusCode === 400, 'Chưa nâng cấp VIP mà nhận quà Premium phải bị từ chối');

        // =====================================================================
        // NHÓM 4: MỞ KHÓA TUYẾN VIP & KIỂM TRA ĐẠI THƯỞNG
        // =====================================================================
        console.log('\n📌 Nhóm 4: Kiểm thử Mở Khóa Tuyến Cyber VIP & Nhận Quà Huyền Thoại');

        // 1. Mở khóa VIP (Trừ 5,000 Vàng)
        const resUpgrade = createMockRes();
        await battlePassController.upgradeToPremium(
          { user: testUser, body: { userId: testUser._id.toString() } },
          resUpgrade
        );
        assert(resUpgrade.data.success === true, 'Mở khóa Tuyến VIP phải thành công');
        assert(resUpgrade.data.user.battlePass.isPremium === true, 'battlePass.isPremium phải chuyển sang true');

        // 2. Nâng cấp lại lần nữa khi đã VIP -> Phải bị từ chối
        const resUpgradeDup = createMockRes();
        await battlePassController.upgradeToPremium(
          { user: testUser, body: { userId: testUser._id.toString() } },
          resUpgradeDup
        );
        assert(resUpgradeDup.statusCode === 400, 'Nâng cấp lại khi đã là VIP phải bị từ chối');

        // 3. Sau khi là VIP, nhận thưởng Cấp 10 VIP -> Nhận Skin Cyber Matrix Hologram
        const resClaimLv10Vip = createMockRes();
        await battlePassController.claimLevelReward(
          { user: testUser, body: { userId: testUser._id.toString(), level: 10, track: 'premium' } },
          resClaimLv10Vip
        );
        assert(resClaimLv10Vip.data.success === true, 'Nhận Cấp 10 VIP thành công');
        assert(resClaimLv10Vip.data.user.inventory.includes('skin_matrix'), 'Kho đồ phải chứa Skin Cyber Matrix');

        // =====================================================================
        // NHÓM 5: TÍNH NĂNG "NHẬN TẤT CẢ" (CLAIM ALL REWARDS)
        // =====================================================================
        console.log('\n📌 Nhóm 5: Kiểm thử Tính Năng "Nhận Tất Cả" (Claim All)');

        const resClaimAll = createMockRes();
        await battlePassController.claimAllRewards(
          { user: testUser, body: { userId: testUser._id.toString() } },
          resClaimAll
        );
        assert(resClaimAll.data.success === true, 'claimAllRewards phải thành công');
        assert(resClaimAll.data.totalCoins > 0, 'Phải gom và cộng toàn bộ số Vàng còn lại');
        assert(resClaimAll.data.user.inventory.includes('frame_cyber_emperor'), 'Kho đồ phải mở khóa Khung Vương Miện Điện Tử Cấp 30');

        // Gọi lại lần nữa khi đã nhận sạch -> Bị từ chối vì không còn quà
        const resClaimAllEmpty = createMockRes();
        await battlePassController.claimAllRewards(
          { user: testUser, body: { userId: testUser._id.toString() } },
          resClaimAllEmpty
        );
        assert(resClaimAllEmpty.statusCode === 400, 'Không còn quà chờ nhận phải trả về status 400');

      } finally {
        await User.deleteOne({ _id: testUser._id });
      }
    }

    console.log('\n======================================================');
    console.log(`🎉 TẤT CẢ ${passed}/${total} BÀI KIỂM THỬ TASK 4 ĐÃ VƯỢT QUA XUẤT SẮC!`);
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

runBattlePassTests();
