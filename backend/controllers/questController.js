const User = require('../models/User');
const PlayerStats = require('../models/PlayerStats');
const UserQuest = require('../models/UserQuest');
const UserAchievement = require('../models/UserAchievement');
const SecurityLog = require('../models/SecurityLog');
const {
  DAILY_QUEST_TEMPLATES,
  DAILY_CHEST_REWARD,
  ACHIEVEMENTS_CONFIG,
} = require('../config/questConfig');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'neo_uno_super_secret_jwt_key_2026_xyz';

// Helper lấy DateKey dạng YYYY-MM-DD theo giờ UTC
function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

// Helper tính số giây còn lại đến 00:00 UTC tiếp theo
function getSecondsUntilNextReset() {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
}

// Helper resolve user từ token hoặc req.user
async function resolveUserFromReq(req) {
  if (req.user) return req.user;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.id) {
        return await User.findById(decoded.id);
      }
    } catch {}
  }
  const userId = req.query?.userId || req.body?.userId;
  if (userId) {
    try {
      return await User.findById(userId);
    } catch {}
  }
  return null;
}

/**
 * Lấy hoặc Tự Động Khởi Tạo Danh Sách Nhiệm Vụ Hôm Nay Cho Người Chơi
 */
async function getOrCreateTodayQuests(userId) {
  const dateKey = getTodayDateKey();
  let userQuestDoc = await UserQuest.findOne({ userId, dateKey });

  if (!userQuestDoc) {
    const initialQuests = DAILY_QUEST_TEMPLATES.map((tmpl) => ({
      questId: tmpl.id,
      title: tmpl.title,
      description: tmpl.description,
      icon: tmpl.icon,
      target: tmpl.target,
      current: 0,
      rewardCoins: tmpl.rewardCoins,
      rewardExp: tmpl.rewardExp,
      isCompleted: false,
      isClaimed: false,
      claimedAt: null,
    }));

    try {
      userQuestDoc = await UserQuest.create({
        userId,
        dateKey,
        quests: initialQuests,
        isDailyChestClaimed: false,
      });
    } catch (err) {
      // Trường hợp race condition khi 2 request cùng tạo
      userQuestDoc = await UserQuest.findOne({ userId, dateKey });
    }
  }

  return userQuestDoc;
}

/**
 * 1. LẤY TOÀN BỘ DANH SÁCH NHIỆM VỤ HÔM NAY (GET /api/quests)
 */
exports.getDailyQuests = async (req, res) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập tài khoản để nhận nhiệm vụ!',
      });
    }

    const questDoc = await getOrCreateTodayQuests(user._id);

    // Tính toán tiến độ tổng hợp
    const quests = questDoc.quests.map((q) => {
      const isCompleted = q.current >= q.target;
      return {
        ...q.toObject(),
        isCompleted,
        canClaim: isCompleted && !q.isClaimed,
      };
    });

    const completedCount = quests.filter((q) => q.isCompleted).length;
    const totalCount = quests.length;
    const allCompleted = completedCount === totalCount;
    const canClaimChest = allCompleted && !questDoc.isDailyChestClaimed;

    // Kiểm tra có phần thưởng đang chờ bấm nhận không (để hiện chấm đỏ thông báo)
    const hasClaimableReward = quests.some((q) => q.canClaim) || canClaimChest;

    return res.status(200).json({
      success: true,
      dateKey: questDoc.dateKey,
      secondsUntilReset: getSecondsUntilNextReset(),
      quests,
      dailyChest: {
        ...DAILY_CHEST_REWARD,
        allCompleted,
        isClaimed: questDoc.isDailyChestClaimed,
        canClaim: canClaimChest,
      },
      stats: {
        completedCount,
        totalCount,
        hasClaimableReward,
      },
    });
  } catch (error) {
    console.error('[Quest GetDaily Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tải nhiệm vụ hằng ngày!',
    });
  }
};

/**
 * 2. NHẬN THƯỞNG NHIỆM VỤ HẰNG NGÀY (POST /api/quests/claim)
 */
exports.claimQuestReward = async (req, res) => {
  try {
    const { questId } = req.body;
    if (!questId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã nhiệm vụ (questId)!',
      });
    }

    const user = await resolveUserFromReq(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập tài khoản!',
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị KHÓA! Không thể nhận thưởng.',
      });
    }

    const questDoc = await getOrCreateTodayQuests(user._id);
    const targetQuest = questDoc.quests.find((q) => q.questId === questId);

    if (!targetQuest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhiệm vụ tương ứng trong ngày hôm nay!',
      });
    }

    if (targetQuest.current < targetQuest.target) {
      return res.status(400).json({
        success: false,
        message: `Nhiệm vụ chưa hoàn thành! Tiến độ hiện tại: ${targetQuest.current}/${targetQuest.target}`,
      });
    }

    if (targetQuest.isClaimed) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã nhận phần thưởng cho nhiệm vụ này rồi!',
      });
    }

    // Đánh dấu đã nhận thưởng
    targetQuest.isCompleted = true;
    targetQuest.isClaimed = true;
    targetQuest.claimedAt = new Date();
    await questDoc.save();

    // Cộng thưởng Vàng và EXP cho người chơi
    const oldLevel = user.level || 1;
    const updatedCoins = (user.coins || 0) + targetQuest.rewardCoins;
    const updatedExp = (user.exp || 0) + targetQuest.rewardExp;
    const nextLevel = Math.floor(updatedExp / 150) + 1;
    let isLevelUp = false;

    user.coins = updatedCoins;
    user.exp = updatedExp;
    if (nextLevel > oldLevel) {
      user.level = nextLevel;
      user.coins += 250; // Thưởng thăng cấp
      isLevelUp = true;
    }
    await user.save();

    // Ghi nhận Audit Log
    await SecurityLog.create({
      userId: user._id,
      action: 'RECORD_MATCH_POINTS',
      severity: 'info',
      details: {
        type: 'CLAIM_DAILY_QUEST_REWARD',
        questId: targetQuest.questId,
        rewardCoins: targetQuest.rewardCoins,
        rewardExp: targetQuest.rewardExp,
        newCoins: user.coins,
      },
      performedBy: user.nickname || 'USER',
      ipAddress: req.ip || req.connection?.remoteAddress,
    });

    console.log(
      `[Quest] 🎉 ${user.nickname} đã nhận thưởng nhiệm vụ "${targetQuest.title}": +${targetQuest.rewardCoins} Vàng, +${targetQuest.rewardExp} EXP.`
    );

    return res.status(200).json({
      success: true,
      message: `🎉 Chúc mừng! Bạn đã nhận được 🪙 ${targetQuest.rewardCoins} Vàng & ⭐ ${targetQuest.rewardExp} EXP!`,
      quest: targetQuest,
      userCoins: user.coins,
      userExp: user.exp,
      userLevel: user.level,
      isLevelUp,
    });
  } catch (error) {
    console.error('[Quest Claim Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi nhận thưởng nhiệm vụ!',
    });
  }
};

/**
 * 3. MỞ RƯƠNG CHIẾN TÍCH NGÀY KHI HOÀN THÀNH TẤT CẢ (POST /api/quests/claim-chest)
 */
exports.claimDailyChest = async (req, res) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập tài khoản!',
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị KHÓA!',
      });
    }

    const questDoc = await getOrCreateTodayQuests(user._id);

    if (questDoc.isDailyChestClaimed) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã mở Rương Chiến Tích của ngày hôm nay rồi!',
      });
    }

    const allCompleted = questDoc.quests.every((q) => q.current >= q.target);
    if (!allCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Bạn cần hoàn thành toàn bộ nhiệm vụ trong ngày để mở khóa Rương!',
      });
    }

    questDoc.isDailyChestClaimed = true;
    questDoc.dailyChestClaimedAt = new Date();
    await questDoc.save();

    // Thưởng Rương Ngày
    user.coins = (user.coins || 0) + DAILY_CHEST_REWARD.rewardCoins;
    user.exp = (user.exp || 0) + DAILY_CHEST_REWARD.rewardExp;

    const nextLevel = Math.floor(user.exp / 150) + 1;
    let isLevelUp = false;
    if (nextLevel > (user.level || 1)) {
      user.level = nextLevel;
      user.coins += 250;
      isLevelUp = true;
    }
    await user.save();

    await SecurityLog.create({
      userId: user._id,
      action: 'RECORD_MATCH_POINTS',
      severity: 'info',
      details: {
        type: 'CLAIM_DAILY_CHEST',
        rewardCoins: DAILY_CHEST_REWARD.rewardCoins,
        rewardExp: DAILY_CHEST_REWARD.rewardExp,
        newCoins: user.coins,
      },
      performedBy: user.nickname || 'USER',
      ipAddress: req.ip || req.connection?.remoteAddress,
    });

    return res.status(200).json({
      success: true,
      message: `🎁 Chúc mừng! Bạn đã mở Rương Ngày: 🪙 +${DAILY_CHEST_REWARD.rewardCoins} Vàng & ⭐ +${DAILY_CHEST_REWARD.rewardExp} EXP!`,
      reward: DAILY_CHEST_REWARD,
      userCoins: user.coins,
      userExp: user.exp,
      userLevel: user.level,
      isLevelUp,
    });
  } catch (error) {
    console.error('[Quest ClaimChest Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi mở Rương Ngày!',
    });
  }
};

/**
 * 4. LẤY DANH SÁCH THÀNH TỰU DÀI HẠN & HUY HIỆU (GET /api/quests/achievements)
 */
exports.getAchievements = async (req, res) => {
  try {
    const user = await resolveUserFromReq(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập!',
      });
    }

    const stats = (await PlayerStats.findOne({ user: user._id })) || {
      wins: user.matchesWon || 0,
      winStreak: 0,
      highestWinStreak: 0,
    };

    // Số vật phẩm sở hữu (trừ mặc định)
    const ownedCustomItemsCount = Array.isArray(user.inventory)
      ? user.inventory.filter((id) => !id.includes('default') && !id.includes('classic')).length
      : 0;

    // Lấy danh sách thành tựu đã lưu trong DB
    const userAchievements = await UserAchievement.find({ userId: user._id });
    const achMap = new Map(userAchievements.map((a) => [a.achievementId, a]));

    const enrichedAchievements = [];
    let hasClaimable = false;

    for (const config of ACHIEVEMENTS_CONFIG) {
      let currentProgress = 0;

      if (config.category === 'level') {
        currentProgress = user.level || 1;
      } else if (config.category === 'elo') {
        currentProgress = user.elo || 1000;
      } else if (config.category === 'win_streak') {
        currentProgress = Math.max(stats.highestWinStreak || 0, stats.winStreak || 0);
      } else if (config.category === 'total_wins') {
        currentProgress = user.matchesWon || stats.wins || 0;
      } else if (config.category === 'inventory') {
        currentProgress = ownedCustomItemsCount;
      } else if (config.category === 'emotes') {
        const saved = achMap.get(config.id);
        currentProgress = saved ? saved.currentProgress : 0;
      }

      let achDoc = achMap.get(config.id);
      const isUnlocked = currentProgress >= config.target;

      if (!achDoc) {
        achDoc = await UserAchievement.create({
          userId: user._id,
          achievementId: config.id,
          title: config.title,
          badge: config.badge,
          currentProgress,
          targetProgress: config.target,
          isUnlocked,
          unlockedAt: isUnlocked ? new Date() : null,
          isClaimed: false,
        });
      } else {
        if (currentProgress > achDoc.currentProgress || (isUnlocked && !achDoc.isUnlocked)) {
          achDoc.currentProgress = Math.max(achDoc.currentProgress, currentProgress);
          if (isUnlocked && !achDoc.isUnlocked) {
            achDoc.isUnlocked = true;
            achDoc.unlockedAt = new Date();
          }
          await achDoc.save();
        }
      }

      const canClaim = achDoc.isUnlocked && !achDoc.isClaimed;
      if (canClaim) hasClaimable = true;

      enrichedAchievements.push({
        ...config,
        currentProgress: achDoc.currentProgress,
        targetProgress: config.target,
        isUnlocked: achDoc.isUnlocked,
        isClaimed: achDoc.isClaimed,
        canClaim,
      });
    }

    return res.status(200).json({
      success: true,
      achievements: enrichedAchievements,
      hasClaimable,
    });
  } catch (error) {
    console.error('[Achievements Get Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách thành tựu!',
    });
  }
};

/**
 * 5. NHẬN THƯỞNG THÀNH TỰU (POST /api/quests/achievements/claim)
 */
exports.claimAchievementReward = async (req, res) => {
  try {
    const { achievementId } = req.body;
    if (!achievementId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã thành tựu (achievementId)!',
      });
    }

    const user = await resolveUserFromReq(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập!',
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị KHÓA!',
      });
    }

    const config = ACHIEVEMENTS_CONFIG.find((a) => a.id === achievementId);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Thành tựu không tồn tại!',
      });
    }

    let achDoc = await UserAchievement.findOne({ userId: user._id, achievementId });
    if (!achDoc || !achDoc.isUnlocked) {
      return res.status(400).json({
        success: false,
        message: 'Bạn chưa đạt điều kiện để mở khóa thành tựu này!',
      });
    }

    if (achDoc.isClaimed) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã nhận phần thưởng thành tựu này rồi!',
      });
    }

    achDoc.isClaimed = true;
    achDoc.claimedAt = new Date();
    await achDoc.save();

    user.coins = (user.coins || 0) + config.rewardCoins;
    user.exp = (user.exp || 0) + config.rewardExp;
    const nextLevel = Math.floor(user.exp / 150) + 1;
    let isLevelUp = false;
    if (nextLevel > (user.level || 1)) {
      user.level = nextLevel;
      user.coins += 250;
      isLevelUp = true;
    }
    await user.save();

    await SecurityLog.create({
      userId: user._id,
      action: 'RECORD_MATCH_POINTS',
      severity: 'info',
      details: {
        type: 'CLAIM_ACHIEVEMENT_REWARD',
        achievementId: config.id,
        rewardCoins: config.rewardCoins,
        rewardExp: config.rewardExp,
        newCoins: user.coins,
      },
      performedBy: user.nickname || 'USER',
      ipAddress: req.ip || req.connection?.remoteAddress,
    });

    return res.status(200).json({
      success: true,
      message: `👑 Chúc mừng! Bạn đã mở khóa Huy Hiệu "${config.badge} ${config.title}": 🪙 +${config.rewardCoins} Vàng & ⭐ +${config.rewardExp} EXP!`,
      achievement: achDoc,
      userCoins: user.coins,
      userExp: user.exp,
      userLevel: user.level,
      isLevelUp,
    });
  } catch (error) {
    console.error('[Achievement Claim Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi nhận thưởng thành tựu!',
    });
  }
};

/**
 * HÀM TIỆN ÍCH DÙNG NỘI BỘ (INTERNAL HOOK HELPER)
 * Tự động cập nhật tiến trình nhiệm vụ và thành tựu sau mỗi ván đấu hoặc thao tác
 */
exports.trackQuestProgress = async (userId, questId, increment = 1) => {
  if (!userId) return;
  try {
    const questDoc = await getOrCreateTodayQuests(userId);
    const targetQuest = questDoc.quests.find((q) => q.questId === questId);
    if (targetQuest) {
      targetQuest.current = (targetQuest.current || 0) + increment;
      if (targetQuest.current >= targetQuest.target) {
        targetQuest.isCompleted = true;
      }
      await questDoc.save();
    }

    // Nếu là thao tác ném emotes, đồng bộ luôn vào Thành tựu ach_throw_emotes_5
    if (questId === 'quest_interact_emote') {
      let achDoc = await UserAchievement.findOne({ userId, achievementId: 'ach_throw_emotes_5' });
      if (!achDoc) {
        achDoc = await UserAchievement.create({
          userId,
          achievementId: 'ach_throw_emotes_5',
          title: 'Vua Tương Tác',
          badge: '🍅',
          currentProgress: increment,
          targetProgress: 5,
          isUnlocked: increment >= 5,
          unlockedAt: increment >= 5 ? new Date() : null,
          isClaimed: false,
        });
      } else {
        achDoc.currentProgress += increment;
        if (achDoc.currentProgress >= achDoc.targetProgress && !achDoc.isUnlocked) {
          achDoc.isUnlocked = true;
          achDoc.unlockedAt = new Date();
        }
        await achDoc.save();
      }
    }
  } catch (err) {
    console.warn('[TrackQuestProgress Warning]:', err.message);
  }
};
