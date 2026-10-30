/**
 * Automated Test Suite: HỆ THỐNG NHIỆM VỤ HẰNG NGÀY & THÀNH TỰU DANH HIỆU (TASK 6)
 * Kiểm thử toàn diện:
 *  1. Khởi tạo nhiệm vụ ngày (Daily Quests Generation) & đếm ngược reset 24h.
 *  2. Hook tự động cập nhật tiến trình từ Game Engine & Socket (trackQuestProgress).
 *  3. Nhận thưởng nhiệm vụ ngày (Claim Quest Reward): Kiểm tra cộng Vàng/EXP & chặn nhận 2 lần.
 *  4. Mở Rương Chiến Tích Ngày (Daily Chest): Hoàn thành 100% nhiệm vụ mới được mở.
 *  5. Hệ thống Thành Tựu Dài Hạn & Huy Hiệu (Long-term Achievements & Badges):
 *     Mở khóa danh hiệu, nhận thưởng Vàng/EXP và chặn nhận trùng.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const PlayerStats = require('../models/PlayerStats');
const UserQuest = require('../models/UserQuest');
const UserAchievement = require('../models/UserAchievement');
const connectDB = require('../config/db');

const questController = require('../controllers/questController');
const matchController = require('../controllers/matchController');

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

async function runQuestTestSuite() {
  console.log('\n========================================================================');
  console.log('   BẮT ĐẦU KIỂM THỬ: HỆ THỐNG NHIỆM VỤ & THÀNH TỰU DANH HIỆU (TASK 6)');
  console.log('========================================================================\n');

  try {
    await connectDB();

    // 0. Dọn dẹp dữ liệu test cũ
    await User.deleteMany({ email: 'quest_tester@neouno.test' });

    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('password123', 10);
    const testUser = await User.create({
      nickname: 'QuestMaster',
      email: 'quest_tester@neouno.test',
      password: hash,
      role: 'player',
      coins: 1000,
      elo: 1100,
      level: 1,
      exp: 0,
      inventory: ['skin_classic', 'frame_default'],
    });

    await UserQuest.deleteMany({ userId: testUser._id });
    await UserAchievement.deleteMany({ userId: testUser._id });

    console.log(`[Setup] 🎯 Đã tạo tài khoản test: [${testUser.nickname}] (Coins: ${testUser.coins}, Level: ${testUser.level})`);

    // ========================================================================
    // TEST 1: KHỞI TẠO TỰ ĐỘNG DANH SÁCH NHIỆM VỤ HÔM NAY (GET /api/quests)
    // ========================================================================
    console.log('\n--- TEST 1: KHỞI TẠO TỰ ĐỘNG NHIỆM VỤ NGÀY & ĐỒNG HỒ RESET ---');
    const mockReqGet = { user: testUser };
    const mockResGet = mockResponse();
    await questController.getDailyQuests(mockReqGet, mockResGet);

    if (mockResGet.statusCode !== 200 || !mockResGet.body.success) {
      throw new Error(`TEST 1 THẤT BẠI: Lấy danh sách nhiệm vụ thất bại! Status: ${mockResGet.statusCode}`);
    }

    const { quests, dailyChest, secondsUntilReset } = mockResGet.body;
    if (!Array.isArray(quests) || quests.length < 5) {
      throw new Error(`TEST 1 THẤT BẠI: Số lượng nhiệm vụ không đúng (cần ít nhất 5, nhận được ${quests?.length})`);
    }

    if (secondsUntilReset <= 0) {
      throw new Error(`TEST 1 THẤT BẠI: Đồng hồ đếm ngược reset không hợp lệ: ${secondsUntilReset}`);
    }

    console.log(`[Daily Quests] 📜 Đã sinh thành công ${quests.length} nhiệm vụ ngày.`);
    console.log(`[Countdown] ⏳ Thời gian còn lại đến 00:00 UTC tiếp theo: ${secondsUntilReset} giây.`);
    console.log('  ✔ PASS: 1. Tự động khởi tạo danh sách 5 nhiệm vụ ngày và đồng hồ đếm ngược reset 24h!');

    // ========================================================================
    // TEST 2: CHẶN NHẬN THƯỞNG KHI CHƯA HOÀN THÀNH TIẾN ĐỘ
    // ========================================================================
    console.log('\n--- TEST 2: CHẶN NHẬN THƯỞNG KHI TIẾN ĐỘ CHƯA ĐẠT (0/TARGET) ---');
    const firstQuest = quests[0];
    const mockReqEarlyClaim = {
      user: testUser,
      body: { questId: firstQuest.questId },
    };
    const mockResEarlyClaim = mockResponse();
    await questController.claimQuestReward(mockReqEarlyClaim, mockResEarlyClaim);

    if (mockResEarlyClaim.statusCode !== 400) {
      throw new Error(`TEST 2 THẤT BẠI: Cho phép nhận thưởng khi chưa xong! Status: ${mockResEarlyClaim.statusCode}`);
    }
    console.log(`[Quest Guard] 🛡️ Hệ thống từ chối chính xác: "${mockResEarlyClaim.body.message}"`);
    console.log('  ✔ PASS: 2. Chặn nhận thưởng nhiệm vụ chưa hoàn thành!');

    // ========================================================================
    // TEST 3: TỰ ĐỘNG CẬP NHẬT TIẾN TRÌNH NHIỆM VỤ QUA HOOK (trackQuestProgress)
    // ========================================================================
    console.log('\n--- TEST 3: AUTO-HOOK CẬP NHẬT TIẾN TRÌNH THI ĐẤU ---');
    // Giả lập chơi 2 ván đấu, thắng 1 ván, đánh 3 lá Wild, hô 1 lần UNO
    await questController.trackQuestProgress(testUser._id, 'quest_play_matches', 2);
    await questController.trackQuestProgress(testUser._id, 'quest_win_match', 1);
    await questController.trackQuestProgress(testUser._id, 'quest_play_wild', 3);
    await questController.trackQuestProgress(testUser._id, 'quest_say_uno', 1);
    await questController.trackQuestProgress(testUser._id, 'quest_interact_emote', 2);

    // Kiểm tra lại danh sách nhiệm vụ sau khi hook
    const mockResAfterHook = mockResponse();
    await questController.getDailyQuests(mockReqGet, mockResAfterHook);
    const updatedQuests = mockResAfterHook.body.quests;

    const allCompleted = updatedQuests.every((q) => q.current >= q.target);
    if (!allCompleted) {
      throw new Error('TEST 3 THẤT BẠI: Tiến trình sau hook không đạt 100%!');
    }
    console.log(`[Auto-Hook] 🎯 Toàn bộ ${updatedQuests.length}/${updatedQuests.length} nhiệm vụ đã hoàn thành 100%!`);
    console.log('  ✔ PASS: 3. Cơ chế Auto-Hook tự động ghi nhận tiến độ chính xác!');

    // ========================================================================
    // TEST 4: NHẬN THƯỞNG NHIỆM VỤ NGÀY & CHỐNG NHẬN 2 LẦN
    // ========================================================================
    console.log('\n--- TEST 4: NHẬN THƯỞNG NHIỆM VỤ & CHỐNG DUPLICATE CLAIM ---');
    const questToClaim = updatedQuests.find((q) => q.questId === 'quest_win_match');
    const prevCoins = testUser.coins;

    const mockReqClaim = {
      user: testUser,
      body: { questId: questToClaim.questId },
    };
    const mockResClaim = mockResponse();
    await questController.claimQuestReward(mockReqClaim, mockResClaim);

    if (mockResClaim.statusCode !== 200 || !mockResClaim.body.success) {
      throw new Error(`TEST 4.1 THẤT BẠI: Nhận thưởng thất bại! Status: ${mockResClaim.statusCode}`);
    }

    const expectedCoins = prevCoins + questToClaim.rewardCoins;
    if (mockResClaim.body.userCoins !== expectedCoins) {
      throw new Error(`TEST 4.2 THẤT BẠI: Số dư sau nhận thưởng không khớp! Nhận được: ${mockResClaim.body.userCoins}, Kỳ vọng: ${expectedCoins}`);
    }
    console.log(`[Claim Reward] 🪙 Nhận thưởng thành công: +${questToClaim.rewardCoins} Vàng, +${questToClaim.rewardExp} EXP. Số dư mới: ${mockResClaim.body.userCoins} Vàng.`);

    // Thử nhận lại lần 2 (Duplicate Claim)
    const mockResClaimAgain = mockResponse();
    await questController.claimQuestReward(mockReqClaim, mockResClaimAgain);
    if (mockResClaimAgain.statusCode !== 400) {
      throw new Error(`TEST 4.3 THẤT BẠI: Hệ thống cho phép nhận thưởng 2 lần! Status: ${mockResClaimAgain.statusCode}`);
    }
    console.log(`[Duplicate Guard] 🛡️ Đã chặn nhận lần 2 thành công: "${mockResClaimAgain.body.message}"`);
    console.log('  ✔ PASS: 4. Nhận thưởng cộng tiền Vàng chính xác và chặn triệt để duplicate claim!');

    // ========================================================================
    // TEST 5: MỞ RƯƠNG CHIẾN TÍCH NGÀY (DAILY CHEST)
    // ========================================================================
    console.log('\n--- TEST 5: MỞ RƯƠNG CHIẾN TÍCH NGÀY KHI ĐẠT 5/5 NHIỆM VỤ ---');
    const mockReqChest = { user: testUser };
    const mockResChest = mockResponse();
    await questController.claimDailyChest(mockReqChest, mockResChest);

    if (mockResChest.statusCode !== 200 || !mockResChest.body.success) {
      throw new Error(`TEST 5.1 THẤT BẠI: Mở rương thất bại! Status: ${mockResChest.statusCode}`);
    }
    console.log(`[Daily Chest] 🎁 Mở rương thành công: +${mockResChest.body.reward.rewardCoins} Vàng & +${mockResChest.body.reward.rewardExp} EXP!`);

    // Thử mở lại lần 2
    const mockResChestAgain = mockResponse();
    await questController.claimDailyChest(mockReqChest, mockResChestAgain);
    if (mockResChestAgain.statusCode !== 400) {
      throw new Error('TEST 5.2 THẤT BẠI: Cho phép mở Rương Ngày 2 lần!');
    }
    console.log(`[Chest Guard] 🛡️ Đã chặn mở rương lần 2: "${mockResChestAgain.body.message}"`);
    console.log('  ✔ PASS: 5. Mở Rương Chiến Tích Ngày thành công và bảo vệ an toàn!');

    // ========================================================================
    // TEST 6: HỆ THỐNG THÀNH TỰU DÀI HẠN & HUY HIỆU DANH GIÁ
    // ========================================================================
    console.log('\n--- TEST 6: THÀNH TỰU DÀI HẠN & HUY HIỆU DANH GIÁ ---');
    // Nâng user lên level 5 để mở khóa thành tựu ach_level_5
    testUser.level = 5;
    await testUser.save();

    const mockReqAch = { user: testUser };
    const mockResAch = mockResponse();
    await questController.getAchievements(mockReqAch, mockResAch);

    if (mockResAch.statusCode !== 200 || !mockResAch.body.achievements) {
      throw new Error(`TEST 6.1 THẤT BẠI: Lấy danh sách thành tựu thất bại! Status: ${mockResAch.statusCode}`);
    }

    const achLevel5 = mockResAch.body.achievements.find((a) => a.id === 'ach_level_5');
    if (!achLevel5 || !achLevel5.isUnlocked) {
      throw new Error('TEST 6.2 THẤT BẠI: Thành tựu ach_level_5 không được mở khóa tự động khi đạt Level 5!');
    }
    console.log(`[Achievement Unlocked] 👑 Đã mở khóa Huy Hiệu: "${achLevel5.badge} ${achLevel5.title}" (Level: ${achLevel5.currentProgress}/${achLevel5.targetProgress})`);

    // Nhận thưởng thành tựu
    const mockReqClaimAch = {
      user: testUser,
      body: { achievementId: 'ach_level_5' },
    };
    const mockResClaimAch = mockResponse();
    await questController.claimAchievementReward(mockReqClaimAch, mockResClaimAch);

    if (mockResClaimAch.statusCode !== 200 || !mockResClaimAch.body.success) {
      throw new Error(`TEST 6.3 THẤT BẠI: Nhận thưởng thành tựu thất bại! Status: ${mockResClaimAch.statusCode}`);
    }
    console.log(`[Claim Achievement] 🎉 Nhận thưởng thành công: "${mockResClaimAch.body.message}"`);

    // Chặn nhận thưởng thành tựu lần 2
    const mockResClaimAchAgain = mockResponse();
    await questController.claimAchievementReward(mockReqClaimAch, mockResClaimAchAgain);
    if (mockResClaimAchAgain.statusCode !== 400) {
      throw new Error('TEST 6.4 THẤT BẠI: Cho phép nhận thưởng thành tựu 2 lần!');
    }
    console.log(`[Achievement Guard] 🛡️ Đã chặn nhận thưởng lần 2: "${mockResClaimAchAgain.body.message}"`);
    console.log('  ✔ PASS: 6. Hệ thống thành tựu dài hạn & huy hiệu danh giá hoạt động hoàn hảo 100%!');

    // Dọn dẹp dữ liệu test
    await User.deleteMany({ email: 'quest_tester@neouno.test' });
    await UserQuest.deleteMany({ userId: testUser._id });
    await UserAchievement.deleteMany({ userId: testUser._id });

    console.log('\n========================================================================');
    console.log('   🎉 TOÀN BỘ 6/6 BÀI KIỂM THỬ TASK 6 ĐÃ VƯỢT QUA 100%!');
    console.log('========================================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ KIỂM THỬ TASK 6 THẤT BẠI:', error);
    process.exit(1);
  }
}

runQuestTestSuite();
