const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const PlayerStats = require('../models/PlayerStats');
const Guild = require('../models/Guild');
const profileController = require('../controllers/profileController');

async function runCareerProfileTests() {
  console.log('\n================================================================');
  console.log('   KIỂM THỬ TASK 6 (TUẦN 5): HỒ SƠ SỰ NGHIỆP & RADAR 6 TRỤC');
  console.log('================================================================\n');

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
      console.log('  ⚠️ Không kết nối được CSDL, kiểm thử các điều kiện logic.');
    }

    // =========================================================================
    // NHÓM 1: KIỂM THỬ HỒ SƠ KHÁCH (GUEST PROFILE & RADAR CHUẨN HÓA)
    // =========================================================================
    console.log('📌 Nhóm 1: Kiểm thử Hồ Sơ Khách & Radar Mặc Định');
    const guestRes = createMockRes();
    await profileController.getCareerProfile({ params: { userId: 'guest_test_99' } }, guestRes);

    assert(guestRes.data && guestRes.data.success === true, 'getCareerProfile cho khách trả về success: true');
    assert(guestRes.data.isGuest === true, 'isGuest phải là true');
    assert(guestRes.data.user.equippedTitle === 'Tân Thủ Cyber', 'Danh hiệu mặc định là Tân Thủ Cyber');
    assert(guestRes.data.rank.tier === 1, 'Hạng khởi đầu là Tier 1 (Tập Sự Cyber)');
    
    // Kiểm thử 6 trục radar của khách
    const guestRadar = guestRes.data.radar;
    assert(typeof guestRadar.winRate === 'number' && guestRadar.winRate >= 10 && guestRadar.winRate <= 100, 'Radar Tỷ lệ thắng chuẩn hóa 10-100');
    assert(typeof guestRadar.aggression === 'number' && guestRadar.aggression >= 20 && guestRadar.aggression <= 100, 'Radar Công phạt chuẩn hóa 20-100');
    assert(typeof guestRadar.speed === 'number' && guestRadar.speed >= 30 && guestRadar.speed <= 100, 'Radar Tốc độ phản xạ chuẩn hóa 30-100');
    assert(typeof guestRadar.defense === 'number' && guestRadar.defense >= 25 && guestRadar.defense <= 100, 'Radar Phòng thủ chuẩn hóa 25-100');
    assert(typeof guestRadar.synergy === 'number' && guestRadar.synergy >= 20 && guestRadar.synergy <= 100, 'Radar Đồng đội chuẩn hóa 20-100');
    assert(typeof guestRadar.comeback === 'number' && guestRadar.comeback >= 25 && guestRadar.comeback <= 100, 'Radar Lật kèo chuẩn hóa 25-100');
    assert(typeof guestRadar.overallPower === 'number' && guestRadar.overallPower > 0, 'Chỉ số Lực chiến trung bình tính toán chính xác');

    // Kiểm thử danh mục danh hiệu của khách
    assert(Array.isArray(guestRes.data.titles) && guestRes.data.titles.length === 8, 'Hệ thống có đúng 8 danh hiệu Cyberpunk');
    const noviceTitle = guestRes.data.titles.find((t) => t.id === 'title_novice');
    assert(noviceTitle && noviceTitle.isUnlocked === true, 'Danh hiệu Tân Thủ Cyber mở khóa sẵn');
    const masterTitle = guestRes.data.titles.find((t) => t.id === 'title_card_master');
    assert(masterTitle && masterTitle.isUnlocked === false, 'Danh hiệu Bậc Thầy Đánh Bài chưa mở khóa cho khách');

    // =========================================================================
    // NHÓM 2: KIỂM THỬ TRANG BỊ DANH HIỆU CHO TÀI KHOẢN KHÁCH
    // =========================================================================
    console.log('\n📌 Nhóm 2: Kiểm thử Trang Bị Danh Hiệu cho Khách');
    const guestEquipLocked = createMockRes();
    await profileController.equipTitle({
      body: { userId: 'guest_test_99', titleId: 'title_cyber_emperor' },
    }, guestEquipLocked);
    assert(guestEquipLocked.statusCode === 400, 'Khách trang bị danh hiệu cao cấp bị từ chối mã 400');

    const guestEquipNovice = createMockRes();
    await profileController.equipTitle({
      body: { userId: 'guest_test_99', titleId: 'title_novice' },
    }, guestEquipNovice);
    assert(guestEquipNovice.statusCode === 200 && guestEquipNovice.data.success === true, 'Khách trang bị Tân Thủ Cyber thành công');

    const invalidTitleRes = createMockRes();
    await profileController.equipTitle({
      body: { userId: 'guest_test_99', titleId: 'title_fake_xyz' },
    }, invalidTitleRes);
    assert(invalidTitleRes.statusCode === 404, 'Trang bị danh hiệu không tồn tại trả về mã 404');

    // =========================================================================
    // NHÓM 3: KIỂM THỬ TÀI KHOẢN ĐĂNG KÝ VỚI MONGODB
    // =========================================================================
    if (dbConnected) {
      console.log('\n📌 Nhóm 3: Kiểm thử Tài Khoản Đăng Ký, Mở Khóa Danh Hiệu & Persistence CSDL');
      const testEmail = `pro_player_${Date.now()}@neouno.cyber`;
      const testUser = await User.create({
        username: `pro_${Date.now()}`,
        nickname: 'CyberProPlayer',
        email: testEmail,
        password: 'Password123!',
        elo: 1350,
        level: 8,
        tournamentsWon: 2,
        tournamentCups: ['Cyber Knockout Cup Season 1', 'Neon Blitz Open'],
        inventory: ['skin_classic', 'frame_default', 'title_cyber_warrior'],
      });

      const testStats = await PlayerStats.create({
        user: testUser._id,
        totalMatches: 60,
        wins: 45,
        losses: 15,
        winRate: 75,
        winStreak: 4,
        highestWinStreak: 7,
        totalCardsPlayed: 520,
        unoCallsSuccess: 38,
        totalScore: 4800,
      });

      // Lấy hồ sơ của tài khoản Pro
      const proProfileRes = createMockRes();
      await profileController.getCareerProfile({ params: { userId: testUser._id.toString() } }, proProfileRes);
      assert(proProfileRes.data.success === true, 'Lấy hồ sơ tài khoản Pro thành công');
      assert(proProfileRes.data.isGuest === false, 'isGuest là false');
      assert(proProfileRes.data.user.elo === 1350, 'ELO hiển thị đúng 1350');
      assert(proProfileRes.data.rank.name === 'Vàng Hoàng Kim', 'ELO 1350 xếp hạng Vàng Hoàng Kim');
      assert(proProfileRes.data.stats.totalMatches === 60, 'Tổng số trận đấu đúng 60');

      // Kiểm thử mở khóa danh hiệu dựa trên thành tích
      const titles = proProfileRes.data.titles;
      const tCardMaster = titles.find((t) => t.id === 'title_card_master');
      assert(tCardMaster.isUnlocked === true, 'Bậc Thầy Đánh Bài tự động mở khóa vì số trận >= 50 (60 trận)');

      const tKnockout = titles.find((t) => t.id === 'title_knockout_king');
      assert(tKnockout.isUnlocked === true, 'Vua Đấu Loại tự động mở khóa vì có 2 cúp vô địch Tournament');

      const tComeback = titles.find((t) => t.id === 'title_comeback_god');
      assert(tComeback.isUnlocked === true, 'Thần Lật Kèo tự động mở khóa vì chuỗi thắng đỉnh cao = 7 (>= 5)');

      const tCyberWarrior = titles.find((t) => t.id === 'title_cyber_warrior');
      assert(tCyberWarrior.isUnlocked === true, 'Chiến Thần Cyber mở khóa vì ELO >= 1200 và có trong túi đồ');

      // Kiểm tra danh hiệu chưa đủ điều kiện
      const tEmperor = titles.find((t) => t.id === 'title_cyber_emperor');
      assert(tEmperor.isUnlocked === false, 'Hoàng Đế Cyber vẫn khóa vì ELO chưa đạt 1500 (1350 < 1500)');

      // =========================================================================
      // NHÓM 4: KIỂM THỬ THAY ĐỔI & TRANG BỊ DANH HIỆU THỰC TẾ
      // =========================================================================
      console.log('\n📌 Nhóm 4: Kiểm thử Thay Đổi & Trang Bị Danh Hiệu Thực Tế');
      
      // Thử trang bị Hoàng Đế Cyber (chưa mở khóa) -> Phải thất bại
      const tryEquipEmperor = createMockRes();
      await profileController.equipTitle({
        user: testUser,
        body: { userId: testUser._id.toString(), titleId: 'title_cyber_emperor' },
      }, tryEquipEmperor);
      assert(tryEquipEmperor.statusCode === 400, 'Không thể trang bị danh hiệu chưa mở khóa');

      // Trang bị Vua Đấu Loại (đã mở khóa) -> Phải thành công
      const equipKnockout = createMockRes();
      await profileController.equipTitle({
        user: testUser,
        body: { userId: testUser._id.toString(), titleId: 'title_knockout_king' },
      }, equipKnockout);
      assert(equipKnockout.statusCode === 200 && equipKnockout.data.success === true, 'Trang bị Vua Đấu Loại thành công');
      assert(equipKnockout.data.equippedTitle === 'Vua Đấu Loại', 'Tiêu đề trang bị trả về là Vua Đấu Loại');

      // Kiểm tra trong CSDL xem đã lưu thật chưa
      const reloadedUser = await User.findById(testUser._id);
      assert(reloadedUser.equippedTitle === 'Vua Đấu Loại', 'CSDL MongoDB đã lưu vĩnh viễn equippedTitle: Vua Đấu Loại');
      assert(reloadedUser.inventory.includes('title_knockout_king'), 'Mã danh hiệu được thêm vào inventory của người chơi');

      // Dọn dẹp dữ liệu test
      await PlayerStats.findByIdAndDelete(testStats._id);
      await User.findByIdAndDelete(testUser._id);
      console.log('  ✔ Đã dọn dẹp sạch sẽ tài khoản kiểm thử khỏi CSDL');
    }

    console.log('\n======================================================');
    console.log(`🎉 TẤT CẢ ${passed}/${total} BÀI KIỂM THỬ TASK 6 ĐÃ THÀNH CÔNG RỰC RỠ!`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ LỖI TRONG QUÁ TRÌNH CHẠY TEST TASK 6:', err);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

runCareerProfileTests();
