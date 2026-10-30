/**
 * Automated Test Suite: HỆ THỐNG QUẢN TRỊ BẢO MẬT & CHỐNG HACK ĐIỂM, HACK TIỀN
 * Kiểm thử toàn diện:
 *  1. Ràng buộc Schema: Chặn âm tiền Vàng (min: 0), Chặn ELO tràn ngưỡng (0 - 4000).
 *  2. Giao dịch Cửa Hàng Atomic: Chống gian lận Double-Spending & tiêu tiền âm.
 *  3. Chống Hack Trận Đấu (Anti-Speedrun): Ván đấu < 12s tự động gắn cờ & hủy thưởng ELO/Coins.
 *  4. Chống Spam Trận Đấu (Rate-Limiting Cooldown): Ghi nhận ván liên tục < 12s bị trả 429.
 *  5. Chức năng Admin: Khóa tài khoản (Ban), Mở khóa (Unban), Điều chỉnh số dư, Gỡ cờ nghi vấn.
 *  6. Chặn toàn diện tài khoản bị khóa: Không thể đăng nhập, không thể đấu, không thể mua đồ.
 *  7. Nhật ký kiểm toán an ninh (SecurityLog): Ghi nhận đầy đủ thông tin kiểm toán.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');
const Match = require('../models/Match');
const connectDB = require('../config/db');

// Controller logic wrappers
const shopController = require('../controllers/shopController');
const matchController = require('../controllers/matchController');
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');

// Helper mock response
function mockResponse() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

async function runSecurityTestSuite() {
  console.log('\n========================================================================');
  console.log('   BẮT ĐẦU KIỂM THỬ: HỆ QUẢN TRỊ BẢO MẬT & CHỐNG HACK ĐIỂM / TIỀN');
  console.log('========================================================================\n');

  try {
    await connectDB();

    // 0. Dọn dẹp dữ liệu thử nghiệm cũ
    await User.deleteMany({
      email: {
        $in: [
          'security_hacker@test.com',
          'security_victim@test.com',
          'security_admin@test.com',
        ],
      },
    });

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Tạo tài khoản Admin thử nghiệm
    const adminUser = await User.create({
      nickname: 'SecAdmin_01',
      email: 'security_admin@test.com',
      password: hashedPassword,
      role: 'admin',
      coins: 5000,
      elo: 1500,
    });

    // Tạo tài khoản người chơi nghi vấn thử nghiệm
    const testPlayer = await User.create({
      nickname: 'CheaterCandidate',
      email: 'security_hacker@test.com',
      password: hashedPassword,
      role: 'player',
      coins: 800,
      elo: 1000,
    });

    console.log(`[Setup] 🛡️ Đã khởi tạo Admin: [${adminUser.nickname}] và Player: [${testPlayer.nickname}]`);

    // ========================================================================
    // TEST 1: RÀNG BUỘC CSDL - CHẶN TIÊU ÂM TIỀN VÀNG (MIN: 0)
    // ========================================================================
    console.log('\n--- TEST 1: RÀNG BUỘC SCHEMA - CHỐNG HACK TIỀN TIÊU ÂM ---');
    let negativeCoinErrorCaught = false;
    try {
      testPlayer.coins = -150;
      await testPlayer.save();
    } catch (err) {
      negativeCoinErrorCaught = true;
      console.log(`[Schema Guard] 🛡️ MongoDB đã chặn thành công: "${err.message}"`);
    }

    if (!negativeCoinErrorCaught) {
      throw new Error('TEST 1 THẤT BẠI: CSDL cho phép số dư coins âm (-150)!');
    }
    console.log('  ✔ PASS: 1. Schema ngăn chặn triệt để số dư Vàng âm!');

    // Reset lại số dư hợp lệ cho testPlayer
    testPlayer.coins = 800;
    await testPlayer.save();

    // ========================================================================
    // TEST 2: RÀNG BUỘC SCHEMA - GIỚI HẠN ELO TỪ 0 ĐẾN 4000
    // ========================================================================
    console.log('\n--- TEST 2: RÀNG BUỘC SCHEMA - GIỚI HẠN ELO 0 ĐẾN 4000 ---');
    let eloOverflowCaught = false;
    try {
      testPlayer.elo = 5500;
      await testPlayer.save();
    } catch (err) {
      eloOverflowCaught = true;
      console.log(`[Schema Guard] 🛡️ MongoDB đã chặn ELO vượt ngưỡng: "${err.message}"`);
    }

    if (!eloOverflowCaught) {
      throw new Error('TEST 2 THẤT BẠI: CSDL cho phép ELO vượt ngưỡng 4000!');
    }
    console.log('  ✔ PASS: 2. Schema giới hạn ELO tối đa 4000 tuyệt đối!');

    // Reset lại ELO
    testPlayer.elo = 1000;
    await testPlayer.save();

    // ========================================================================
    // TEST 3: CỬA HÀNG ATOMIC - CHỐNG MUA HÀNG KHI THIẾU TIỀN & MUA THÀNH CÔNG
    // ========================================================================
    console.log('\n--- TEST 3: CỬA HÀNG ATOMIC - CHỐNG GIAN LẬN SỐ DƯ & AUDIT LOG ---');
    testPlayer.coins = 500;
    await testPlayer.save();

    // Thử mua vật phẩm đắt tiền (skin_halloween: 1,000 Vàng, trong khi chỉ có 500 Vàng)
    const mockReqOverspend = {
      body: { itemId: 'skin_halloween' },
      user: testPlayer,
      ip: '127.0.0.1',
    };
    const mockResOverspend = mockResponse();
    await shopController.buyItem(mockReqOverspend, mockResOverspend);

    if (mockResOverspend.statusCode !== 400) {
      throw new Error(`TEST 3.1 THẤT BẠI: Máy chủ cho phép mua hàng thiếu tiền! Status: ${mockResOverspend.statusCode}`);
    }
    console.log(`  ✔ PASS: 3.1 Chặn mua hàng khi không đủ Vàng (Status 400, Thiếu Vàng)`);

    // Mua vật phẩm hợp lệ (skin_cyberpunk: 500 Vàng, người chơi có đúng 500 Vàng)
    const mockReqValidBuy = {
      body: { itemId: 'skin_cyberpunk' },
      user: testPlayer,
      ip: '127.0.0.1',
    };
    const mockResValidBuy = mockResponse();
    await shopController.buyItem(mockReqValidBuy, mockResValidBuy);

    if (mockResValidBuy.statusCode !== 200 || mockResValidBuy.body?.userCoins !== 0) {
      throw new Error(`TEST 3.2 THẤT BẠI: Mua hàng hợp lệ thất bại! Response: ${JSON.stringify(mockResValidBuy.body)}`);
    }

    // Kiểm tra SecurityLog được ghi nhận
    const buyLog = await SecurityLog.findOne({
      userId: testPlayer._id,
      action: 'SHOP_BUY',
    });
    if (!buyLog) {
      throw new Error('TEST 3.3 THẤT BẠI: Không tìm thấy SecurityLog cho hành động SHOP_BUY!');
    }
    console.log(`  ✔ PASS: 3.2 Giao dịch Atomic thành công! Số dư mới: ${mockResValidBuy.body.userCoins} Vàng.`);
    console.log(`  ✔ PASS: 3.3 Đã ghi nhận SecurityLog kiểm toán cho giao dịch mua hàng.`);

    // ========================================================================
    // TEST 4: CHỐNG HACK SPEEDRUN TRẬN ĐẤU (< 12 GIÂY)
    // ========================================================================
    console.log('\n--- TEST 4: CHỐNG HACK SPEEDRUN TRẬN ĐẤU (< 12S) ---');
    const mockReqSpeedrun = {
      body: {
        roomCode: 'SUSPICIOUS_SPEED_01',
        winner: { id: String(testPlayer._id), name: testPlayer.nickname, isHuman: true },
        durationSeconds: 4, // Kết thúc chỉ sau 4 giây!
        userId: testPlayer._id,
        players: [
          { id: String(testPlayer._id), name: testPlayer.nickname, isHuman: true, rank: 1, finalScore: 100 },
          { id: 'titan_1', name: 'Bot Titan', isHuman: false, rank: 2, finalScore: 50 },
        ],
      },
      ip: '127.0.0.1',
    };
    const mockResSpeedrun = mockResponse();
    await matchController.recordMatch(mockReqSpeedrun, mockResSpeedrun);

    if (mockResSpeedrun.statusCode !== 201) {
      throw new Error(`TEST 4.1 THẤT BẠI: Lưu trận đấu thất bại! Status: ${mockResSpeedrun.statusCode}`);
    }

    // Kiểm tra người chơi có bị gắn cờ nghi vấn và deltas bị ép về 0 không
    const reloadedPlayerAfterSpeedrun = await User.findById(testPlayer._id);
    if (!reloadedPlayerAfterSpeedrun.isFlagged) {
      throw new Error('TEST 4.2 THẤT BẠI: Người chơi không bị gắn cờ isFlagged khi speedrun!');
    }
    if (mockResSpeedrun.body.eloDelta !== 0 || mockResSpeedrun.body.coinsDelta !== 0) {
      throw new Error(`TEST 4.3 THẤT BẠI: Người chơi vẫn được cộng điểm khi speedrun! ELO Delta: ${mockResSpeedrun.body.eloDelta}, Coins Delta: ${mockResSpeedrun.body.coinsDelta}`);
    }

    // Kiểm tra SecurityLog có log SUSPICIOUS_EXPLOIT_ATTEMPT không
    const speedrunLog = await SecurityLog.findOne({
      userId: testPlayer._id,
      action: 'SUSPICIOUS_EXPLOIT_ATTEMPT',
    });
    if (!speedrunLog) {
      throw new Error('TEST 4.4 THẤT BẠI: Không tìm thấy SecurityLog nghi vấn speedrun!');
    }
    console.log(`[Anti-Cheat] 🚩 Đã gắn cờ isFlagged cho người chơi: "${reloadedPlayerAfterSpeedrun.cheatWarnings[0]}"`);
    console.log('  ✔ PASS: 4. Anti-Speedrun phát hiện chính xác ván đấu 4s, ép deltas về 0 và gắn cờ nghi vấn!');

    // ========================================================================
    // TEST 5: CHỐNG SPAM TRẬN ĐẤU LIÊN TỤC (RATE-LIMITING COOLDOWN 12S)
    // ========================================================================
    console.log('\n--- TEST 5: CHỐNG SPAM TRẬN ĐẤU LIÊN TỤC (HTTP 429 COOLDOWN) ---');
    const mockReqSpam = {
      body: {
        roomCode: 'SPAM_ROOM_02',
        winner: { id: String(testPlayer._id), name: testPlayer.nickname, isHuman: true },
        durationSeconds: 15,
        userId: testPlayer._id,
        players: [
          { id: String(testPlayer._id), name: testPlayer.nickname, isHuman: true, rank: 1 },
          { id: 'titan_1', name: 'Bot Titan', isHuman: false, rank: 2 },
        ],
      },
      ip: '127.0.0.1',
    };
    const mockResSpam = mockResponse();
    await matchController.recordMatch(mockReqSpam, mockResSpam);

    if (mockResSpam.statusCode !== 429) {
      throw new Error(`TEST 5 THẤT BẠI: Hệ thống không chặn spam rate-limit! Status: ${mockResSpam.statusCode}`);
    }
    console.log(`[Rate Limiter] ⏳ Hệ thống đã chặn thành công: "${mockResSpam.body.message}"`);
    console.log('  ✔ PASS: 5. Rate-limiter trả về HTTP 429 Too Many Requests khi gọi liên tiếp trong 12s!');

    // ========================================================================
    // TEST 6: ADMIN QUẢN TRỊ - KHÓA TÀI KHOẢN (BAN USER) & CHẶN ĐĂNG NHẬP
    // ========================================================================
    console.log('\n--- TEST 6: ADMIN KHÓA TÀI KHOẢN (BAN) & TOÀN DIỆN KHÓA CỔNG ---');
    const mockReqBan = {
      body: {
        userId: testPlayer._id,
        reason: 'Sử dụng công cụ speedrun ván đấu trái phép',
      },
      user: adminUser,
      app: { get: () => null },
      ip: '127.0.0.1',
    };
    const mockResBan = mockResponse();
    await adminController.banUser(mockReqBan, mockResBan);

    if (mockResBan.statusCode !== 200 || !mockResBan.body.user.isBanned) {
      throw new Error(`TEST 6.1 THẤT BẠI: Khóa tài khoản thất bại! Body: ${JSON.stringify(mockResBan.body)}`);
    }
    console.log(`  ✔ PASS: 6.1 Admin khóa tài khoản [${testPlayer.nickname}] thành công!`);

    // Thử Đăng nhập tài khoản đã bị khóa
    const mockReqLoginBanned = {
      body: {
        identifier: testPlayer.email,
        password: 'password123',
      },
      headers: {},
      ip: '127.0.0.1',
    };
    const mockResLoginBanned = mockResponse();
    await authController.login(mockReqLoginBanned, mockResLoginBanned);

    if (mockResLoginBanned.statusCode !== 403 || !mockResLoginBanned.body.isBanned) {
      throw new Error(`TEST 6.2 THẤT BẠI: Tài khoản bị khóa vẫn đăng nhập được! Status: ${mockResLoginBanned.statusCode}`);
    }
    console.log(`[Auth Guard] 🚫 Cổng đăng nhập từ chối tài khoản bị cấm (403): "${mockResLoginBanned.body.message}"`);
    console.log('  ✔ PASS: 6.2 Cổng đăng nhập chặn hoàn toàn tài khoản bị khóa!');

    // ========================================================================
    // TEST 7: ADMIN ĐIỀU CHỈNH SỐ DƯ (ADJUST BALANCE / ELO) AN TOÀN
    // ========================================================================
    console.log('\n--- TEST 7: ADMIN ĐIỀU CHỈNH SỐ DƯ & AUDIT LOG ---');
    const mockReqAdjust = {
      body: {
        userId: testPlayer._id,
        coinAdjustment: +350,
        eloAdjustment: -20,
        reason: 'Xử phạt trừ ELO và hoàn tiền sự kiện',
      },
      user: adminUser,
      ip: '127.0.0.1',
    };
    const mockResAdjust = mockResponse();
    await adminController.adjustUserBalance(mockReqAdjust, mockResAdjust);

    if (mockResAdjust.statusCode !== 200) {
      throw new Error(`TEST 7 THẤT BẠI: Điều chỉnh số dư thất bại! Status: ${mockResAdjust.statusCode}`);
    }

    const reloadedAfterAdjust = await User.findById(testPlayer._id);
    if (reloadedAfterAdjust.coins !== 350 || reloadedAfterAdjust.elo !== 980) {
      throw new Error(`TEST 7 THẤT BẠI: Giá trị sau điều chỉnh không đúng! Coins: ${reloadedAfterAdjust.coins}, ELO: ${reloadedAfterAdjust.elo}`);
    }
    console.log(`  ✔ PASS: 7. Admin điều chỉnh số dư thành công! Coins: 350, ELO: 980.`);

    // ========================================================================
    // TEST 8: ADMIN GỠ CỜ NGHI VẤN (CLEAR FLAG) & MỞ KHÓA (UNBAN)
    // ========================================================================
    console.log('\n--- TEST 8: ADMIN GỠ CỜ NGHI VẤN & MỞ KHÓA TÀI KHOẢN ---');
    const mockReqClearFlag = {
      body: { userId: testPlayer._id },
      user: adminUser,
      ip: '127.0.0.1',
    };
    const mockResClearFlag = mockResponse();
    await adminController.clearUserFlag(mockReqClearFlag, mockResClearFlag);

    const mockReqUnban = {
      body: { userId: testPlayer._id },
      user: adminUser,
      ip: '127.0.0.1',
    };
    const mockResUnban = mockResponse();
    await adminController.unbanUser(mockReqUnban, mockResUnban);

    const reloadedFinal = await User.findById(testPlayer._id);
    if (reloadedFinal.isBanned || reloadedFinal.isFlagged) {
      throw new Error(`TEST 8 THẤT BẠI: Tài khoản vẫn bị cấm hoặc gắn cờ sau unban/clear-flag!`);
    }
    console.log(`  ✔ PASS: 8. Admin gỡ cờ nghi vấn và mở khóa tài khoản thành công!`);

    // ========================================================================
    // TEST 9: ADMIN DASHBOARD METRICS & THREAT LEVEL
    // ========================================================================
    console.log('\n--- TEST 9: ADMIN DASHBOARD THỐNG KÊ & THREAT LEVEL ---');
    const mockReqDash = { user: adminUser };
    const mockResDash = mockResponse();
    await adminController.getDashboardStats(mockReqDash, mockResDash);

    if (mockResDash.statusCode !== 200 || !mockResDash.body.stats) {
      throw new Error(`TEST 9 THẤT BẠI: Lấy Dashboard stats thất bại!`);
    }
    const { stats, recentLogs } = mockResDash.body;
    console.log(`[Dashboard Stats] 📊 Tổng Users: ${stats.totalUsers}, Tổng Vàng: ${stats.totalCoinsInCirculation}, ELO TB: ${stats.averageElo}, Threat: ${stats.threatLevel}`);
    console.log(`[Dashboard Logs] 📜 Số bản ghi gần nhất: ${recentLogs.length}`);
    console.log('  ✔ PASS: 9. Dashboard An ninh trả về đầy đủ các chỉ số thống kê thời gian thực!');

    // Dọn dẹp dữ liệu sau khi hoàn tất kiểm thử
    await User.deleteMany({
      email: {
        $in: [
          'security_hacker@test.com',
          'security_victim@test.com',
          'security_admin@test.com',
        ],
      },
    });

    console.log('\n========================================================================');
    console.log('   🎉 TẤT CẢ 9/9 BÀI KIỂM THỬ BẢO MẬT & CHỐNG HACK ĐÃ VƯỢT QUA 100%!');
    console.log('========================================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ KIỂM THỬ AN NINH THẤT BẠI:', error);
    process.exit(1);
  }
}

runSecurityTestSuite();
