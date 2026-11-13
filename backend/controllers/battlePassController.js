const mongoose = require('mongoose');
const User = require('../models/User');

// ============================================================================
// CẤU HÌNH 30 CẤP ĐỘ SỔ SỨ MỆNH MÙA 1: NEON OVERDRIVE (BATTLE PASS LEVELS)
// ============================================================================
const EXP_PER_LEVEL = 200;
const MAX_LEVEL = 30;
const SEASON_NUMBER = 1;
const SEASON_NAME = 'Neon Overdrive 2026';
const PREMIUM_UPGRADE_COST = 5000;

// Danh sách phần thưởng 30 Cấp Độ
const BATTLE_PASS_LEVELS = [
  {
    level: 1,
    free: { coins: 100, exp: 50, item: null, icon: '🪙', label: '100 Vàng + 50 Exp' },
    premium: { coins: 500, exp: 200, item: null, icon: '💰', label: '500 Vàng + 200 Exp' },
  },
  {
    level: 2,
    free: { coins: 150, exp: 0, item: null, icon: '🪙', label: '150 Vàng' },
    premium: { coins: 600, exp: 0, item: null, icon: '💰', label: '600 Vàng' },
  },
  {
    level: 3,
    free: { coins: 200, exp: 50, item: null, icon: '🪙', label: '200 Vàng + 50 Exp' },
    premium: { coins: 700, exp: 250, item: null, icon: '💰', label: '700 Vàng + 250 Exp' },
  },
  {
    level: 4,
    free: { coins: 250, exp: 0, item: null, icon: '🪙', label: '250 Vàng' },
    premium: { coins: 800, exp: 0, item: null, icon: '💰', label: '800 Vàng' },
  },
  {
    level: 5,
    free: { coins: 300, exp: 100, item: 'ticket_cup', icon: '🎫', label: '300 Vàng + 1 Vé Đấu Cúp' },
    premium: { coins: 1000, exp: 300, item: 'frame_fire_blaze', icon: '🔥', label: '1,000 Vàng + Khung Lửa Thiêu Đốt' },
  },
  {
    level: 6,
    free: { coins: 200, exp: 80, item: null, icon: '🪙', label: '200 Vàng + 80 Exp' },
    premium: { coins: 800, exp: 0, item: null, icon: '💰', label: '800 Vàng' },
  },
  {
    level: 7,
    free: { coins: 250, exp: 0, item: null, icon: '🪙', label: '250 Vàng' },
    premium: { coins: 900, exp: 300, item: null, icon: '💰', label: '900 Vàng + 300 Exp' },
  },
  {
    level: 8,
    free: { coins: 300, exp: 100, item: null, icon: '🪙', label: '300 Vàng + 100 Exp' },
    premium: { coins: 1000, exp: 0, item: null, icon: '💰', label: '1,000 Vàng' },
  },
  {
    level: 9,
    free: { coins: 350, exp: 0, item: null, icon: '🪙', label: '350 Vàng' },
    premium: { coins: 1200, exp: 350, item: null, icon: '💰', label: '1,200 Vàng + 350 Exp' },
  },
  {
    level: 10,
    free: { coins: 500, exp: 200, item: null, icon: '💰', label: '500 Vàng + 200 Exp' },
    premium: {
      coins: 2000,
      exp: 500,
      item: 'skin_matrix',
      icon: '🎨',
      label: '2,000 Vàng + Skin Cyber Matrix Hologram 3D',
      isMilestone: true,
    },
  },
  {
    level: 11,
    free: { coins: 300, exp: 0, item: null, icon: '🪙', label: '300 Vàng' },
    premium: { coins: 1000, exp: 0, item: null, icon: '💰', label: '1,000 Vàng' },
  },
  {
    level: 12,
    free: { coins: 350, exp: 100, item: null, icon: '🪙', label: '350 Vàng + 100 Exp' },
    premium: { coins: 1200, exp: 400, item: null, icon: '💰', label: '1,200 Vàng + 400 Exp' },
  },
  {
    level: 13,
    free: { coins: 400, exp: 0, item: null, icon: '🪙', label: '400 Vàng' },
    premium: { coins: 1400, exp: 0, item: null, icon: '💰', label: '1,400 Vàng' },
  },
  {
    level: 14,
    free: { coins: 450, exp: 150, item: null, icon: '🪙', label: '450 Vàng + 150 Exp' },
    premium: { coins: 1600, exp: 450, item: null, icon: '💰', label: '1,600 Vàng + 450 Exp' },
  },
  {
    level: 15,
    free: { coins: 600, exp: 200, item: 'ticket_cup', icon: '🎫', label: '600 Vàng + 1 Vé Đấu Cúp' },
    premium: { coins: 3000, exp: 800, item: 'ticket_cup', icon: '💎', label: '3,000 Vàng + 3 Vé Đấu Cúp' },
  },
  {
    level: 16,
    free: { coins: 400, exp: 0, item: null, icon: '🪙', label: '400 Vàng' },
    premium: { coins: 1500, exp: 0, item: null, icon: '💰', label: '1,500 Vàng' },
  },
  {
    level: 17,
    free: { coins: 450, exp: 150, item: null, icon: '🪙', label: '450 Vàng + 150 Exp' },
    premium: { coins: 1800, exp: 500, item: null, icon: '💰', label: '1,800 Vàng + 500 Exp' },
  },
  {
    level: 18,
    free: { coins: 500, exp: 0, item: null, icon: '🪙', label: '500 Vàng' },
    premium: { coins: 2000, exp: 0, item: null, icon: '💰', label: '2,000 Vàng' },
  },
  {
    level: 19,
    free: { coins: 550, exp: 180, item: null, icon: '🪙', label: '550 Vàng + 180 Exp' },
    premium: { coins: 2200, exp: 600, item: null, icon: '💰', label: '2,200 Vàng + 600 Exp' },
  },
  {
    level: 20,
    free: { coins: 1000, exp: 300, item: 'title_cyber_warrior', icon: '🎖️', label: '1,000 Vàng + Danh Hiệu [CHIẾN THẦN CYBER]' },
    premium: { coins: 3500, exp: 800, item: 'frame_gold_crown', icon: '👑', label: '3,500 Vàng + Khung Hoàng Gia Vàng' },
  },
  {
    level: 21,
    free: { coins: 500, exp: 0, item: null, icon: '🪙', label: '500 Vàng' },
    premium: { coins: 2000, exp: 0, item: null, icon: '💰', label: '2,000 Vàng' },
  },
  {
    level: 22,
    free: { coins: 600, exp: 200, item: null, icon: '🪙', label: '600 Vàng + 200 Exp' },
    premium: { coins: 2500, exp: 700, item: null, icon: '💰', label: '2,500 Vàng + 700 Exp' },
  },
  {
    level: 23,
    free: { coins: 700, exp: 0, item: null, icon: '🪙', label: '700 Vàng' },
    premium: { coins: 3000, exp: 0, item: null, icon: '💰', label: '3,000 Vàng' },
  },
  {
    level: 24,
    free: { coins: 800, exp: 250, item: null, icon: '🪙', label: '800 Vàng + 250 Exp' },
    premium: { coins: 3500, exp: 800, item: null, icon: '💰', label: '3,500 Vàng + 800 Exp' },
  },
  {
    level: 25,
    free: { coins: 1200, exp: 400, item: 'ticket_cup', icon: '🎫', label: '1,200 Vàng + 2 Vé Đấu Cúp' },
    premium: { coins: 5000, exp: 1000, item: 'ticket_cup', icon: '💎', label: '5,000 Vàng + 1,000 Exp + 5 Vé Cúp' },
  },
  {
    level: 26,
    free: { coins: 700, exp: 0, item: null, icon: '🪙', label: '700 Vàng' },
    premium: { coins: 3000, exp: 0, item: null, icon: '💰', label: '3,000 Vàng' },
  },
  {
    level: 27,
    free: { coins: 800, exp: 300, item: null, icon: '🪙', label: '800 Vàng + 300 Exp' },
    premium: { coins: 3500, exp: 900, item: null, icon: '💰', label: '3,500 Vàng + 900 Exp' },
  },
  {
    level: 28,
    free: { coins: 900, exp: 0, item: null, icon: '🪙', label: '900 Vàng' },
    premium: { coins: 4000, exp: 0, item: null, icon: '💰', label: '4,000 Vàng' },
  },
  {
    level: 29,
    free: { coins: 1000, exp: 400, item: null, icon: '🪙', label: '1,000 Vàng + 400 Exp' },
    premium: { coins: 5000, exp: 1000, item: null, icon: '💰', label: '5,000 Vàng + 1,000 Exp' },
  },
  {
    level: 30,
    free: {
      coins: 2500,
      exp: 1000,
      item: 'frame_neon_cyan',
      icon: '✨',
      label: '2,500 Vàng + Khung Neon Cyan Cao Cấp',
      isMilestone: true,
    },
    premium: {
      coins: 10000,
      exp: 2000,
      item: 'frame_cyber_emperor',
      title: 'title_cyber_emperor',
      icon: '👑',
      label: '10,000 Vàng + Khung Vương Miện Điện Tử + Danh Hiệu [CHÚA TỂ CYBER 2026]',
      isGrandPrize: true,
      isMilestone: true,
    },
  },
];

// Helper tính toán level từ exp cộng thêm
function calculatePassLevel(currentLevel, currentExp, addedExp) {
  let totalExp = (currentExp || 0) + addedExp;
  let level = currentLevel || 1;

  while (totalExp >= EXP_PER_LEVEL && level < MAX_LEVEL) {
    totalExp -= EXP_PER_LEVEL;
    level += 1;
  }

  if (level >= MAX_LEVEL) {
    level = MAX_LEVEL;
    totalExp = Math.min(totalExp, EXP_PER_LEVEL);
  }

  return { level, exp: totalExp };
}

/**
 * Hook thêm Season EXP cho người chơi (gọi từ các ván đấu hoặc nhận thưởng)
 */
exports.addSeasonExpToUser = async (userId, addedExp) => {
  try {
    if (!userId || !mongoose.isValidObjectId(userId) || addedExp <= 0) return null;

    const user = await User.findById(userId);
    if (!user) return null;

    const oldLevel = user.battlePass?.level || 1;
    const oldExp = user.battlePass?.exp || 0;

    const { level: newLevel, exp: newExp } = calculatePassLevel(oldLevel, oldExp, addedExp);

    user.battlePass.level = newLevel;
    user.battlePass.exp = newExp;
    user.battlePass.season = SEASON_NUMBER;

    await user.save();
    return { level: newLevel, exp: newExp, leveledUp: newLevel > oldLevel };
  } catch (err) {
    console.warn('[BattlePass] ⚠️ Lỗi cộng Season EXP:', err.message);
    return null;
  }
};

/**
 * [GET] /api/battlepass/status
 * Lấy tiến trình Sổ Sứ Mệnh của người chơi
 */
exports.getBattlePassStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.query?.userId;

    let userPass = {
      season: SEASON_NUMBER,
      level: 1,
      exp: 0,
      isPremium: false,
      claimedFreeLevels: [],
      claimedPremiumLevels: [],
    };
    let userCoins = 0;

    if (userId && mongoose.isValidObjectId(userId)) {
      const user = await User.findById(userId);
      if (user) {
        userCoins = user.coins || 0;
        if (user.battlePass) {
          userPass = {
            season: user.battlePass.season || SEASON_NUMBER,
            level: user.battlePass.level || 1,
            exp: user.battlePass.exp || 0,
            isPremium: user.battlePass.isPremium === true,
            claimedFreeLevels: user.battlePass.claimedFreeLevels || [],
            claimedPremiumLevels: user.battlePass.claimedPremiumLevels || [],
          };
        }
      }
    }

    // Kiểm tra xem có mốc nào đủ điều kiện nhưng chưa nhận không
    let canClaimAny = false;
    for (let l = 1; l <= userPass.level; l++) {
      if (!userPass.claimedFreeLevels.includes(l)) {
        canClaimAny = true;
        break;
      }
      if (userPass.isPremium && !userPass.claimedPremiumLevels.includes(l)) {
        canClaimAny = true;
        break;
      }
    }

    return res.status(200).json({
      success: true,
      season: SEASON_NUMBER,
      seasonName: SEASON_NAME,
      maxLevel: MAX_LEVEL,
      expPerLevel: EXP_PER_LEVEL,
      premiumCost: PREMIUM_UPGRADE_COST,
      userCoins,
      pass: userPass,
      canClaimAny,
      levels: BATTLE_PASS_LEVELS,
    });
  } catch (err) {
    console.error('[BattlePass] ❌ Lỗi getBattlePassStatus:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [POST] /api/battlepass/claim
 * Nhận thưởng của 1 cấp cụ thể (Free hoặc Premium)
 */
exports.claimLevelReward = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    const targetLevel = Number(req.body?.level);
    const track = req.body?.track; // 'free' | 'premium'

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để nhận thưởng Sổ Sứ Mệnh!',
      });
    }

    if (!targetLevel || targetLevel < 1 || targetLevel > MAX_LEVEL) {
      return res.status(400).json({ success: false, message: 'Cấp độ nhận thưởng không hợp lệ!' });
    }

    if (track !== 'free' && track !== 'premium') {
      return res.status(400).json({ success: false, message: 'Tuyến nhận thưởng không hợp lệ!' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản!' });
    }

    const pass = user.battlePass || {
      season: SEASON_NUMBER,
      level: 1,
      exp: 0,
      isPremium: false,
      claimedFreeLevels: [],
      claimedPremiumLevels: [],
    };

    // 1. Kiểm tra đã đạt cấp độ yêu cầu chưa
    if (targetLevel > (pass.level || 1)) {
      return res.status(400).json({
        success: false,
        message: `Bạn chưa đạt Cấp ${targetLevel} (Hiện tại: Cấp ${pass.level || 1})!`,
      });
    }

    // 2. Kiểm tra nếu nhận Premium thì đã nâng cấp VIP chưa
    if (track === 'premium' && !pass.isPremium) {
      return res.status(400).json({
        success: false,
        message: 'Bạn cần mở khóa Tuyến VIP để nhận phần thưởng cao cấp!',
      });
    }

    // 3. Kiểm tra đã nhận mốc này chưa
    const claimedList = track === 'free' ? pass.claimedFreeLevels || [] : pass.claimedPremiumLevels || [];
    if (claimedList.includes(targetLevel)) {
      return res.status(400).json({
        success: false,
        message: `Bạn đã nhận phần thưởng ${track === 'free' ? 'Miễn phí' : 'VIP'} Cấp ${targetLevel} rồi!`,
      });
    }

    const levelConfig = BATTLE_PASS_LEVELS.find((l) => l.level === targetLevel);
    if (!levelConfig) {
      return res.status(404).json({ success: false, message: 'Cấu hình cấp độ không tồn tại!' });
    }

    const reward = track === 'free' ? levelConfig.free : levelConfig.premium;

    // 4. Cập nhật tài khoản & phần thưởng
    const updateOps = {
      $inc: {
        coins: reward.coins || 0,
        exp: reward.exp || 0,
      },
      $push: {},
    };

    if (track === 'free') {
      updateOps.$push['battlePass.claimedFreeLevels'] = targetLevel;
    } else {
      updateOps.$push['battlePass.claimedPremiumLevels'] = targetLevel;
    }

    const itemsToAdd = [];
    if (reward.item) itemsToAdd.push(reward.item);
    if (reward.title) itemsToAdd.push(reward.title);

    if (itemsToAdd.length > 0) {
      updateOps.$addToSet = { inventory: { $each: itemsToAdd } };
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateOps, {
      returnDocument: 'after',
    });

    return res.status(200).json({
      success: true,
      message: `Nhận thành công phần thưởng Cấp ${targetLevel}: ${reward.label}!`,
      level: targetLevel,
      track,
      reward,
      user: updatedUser,
    });
  } catch (err) {
    console.error('[BattlePass] ❌ Lỗi claimLevelReward:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [POST] /api/battlepass/claim-all
 * Nhận TOÀN BỘ các mốc phần thưởng đủ điều kiện chưa nhận
 */
exports.claimAllRewards = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để nhận thưởng Sổ Sứ Mệnh!',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản!' });
    }

    const pass = user.battlePass || {
      season: SEASON_NUMBER,
      level: 1,
      exp: 0,
      isPremium: false,
      claimedFreeLevels: [],
      claimedPremiumLevels: [],
    };

    const currentLevel = pass.level || 1;
    const isPremium = pass.isPremium === true;
    const claimedFree = pass.claimedFreeLevels || [];
    const claimedPremium = pass.claimedPremiumLevels || [];

    let totalCoins = 0;
    let totalExp = 0;
    const newItems = [];
    const newlyClaimedFree = [];
    const newlyClaimedPremium = [];

    for (let l = 1; l <= currentLevel; l++) {
      const cfg = BATTLE_PASS_LEVELS.find((x) => x.level === l);
      if (!cfg) continue;

      // Free track
      if (!claimedFree.includes(l)) {
        newlyClaimedFree.push(l);
        totalCoins += cfg.free.coins || 0;
        totalExp += cfg.free.exp || 0;
        if (cfg.free.item) newItems.push(cfg.free.item);
      }

      // Premium track
      if (isPremium && !claimedPremium.includes(l)) {
        newlyClaimedPremium.push(l);
        totalCoins += cfg.premium.coins || 0;
        totalExp += cfg.premium.exp || 0;
        if (cfg.premium.item) newItems.push(cfg.premium.item);
        if (cfg.premium.title) newItems.push(cfg.premium.title);
      }
    }

    if (newlyClaimedFree.length === 0 && newlyClaimedPremium.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không có phần thưởng mới nào chờ nhận!',
      });
    }

    const updateOps = {
      $inc: {
        coins: totalCoins,
        exp: totalExp,
      },
      $push: {},
    };

    if (newlyClaimedFree.length > 0) {
      updateOps.$push['battlePass.claimedFreeLevels'] = { $each: newlyClaimedFree };
    }
    if (newlyClaimedPremium.length > 0) {
      updateOps.$push['battlePass.claimedPremiumLevels'] = { $each: newlyClaimedPremium };
    }
    if (newItems.length > 0) {
      updateOps.$addToSet = { inventory: { $each: newItems } };
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateOps, {
      returnDocument: 'after',
    });

    return res.status(200).json({
      success: true,
      message: `Nhận tất cả thành công: +${totalCoins.toLocaleString()} Vàng, +${totalExp} Exp và ${newItems.length} vật phẩm!`,
      totalCoins,
      totalExp,
      items: newItems,
      newlyClaimedFree,
      newlyClaimedPremium,
      user: updatedUser,
    });
  } catch (err) {
    console.error('[BattlePass] ❌ Lỗi claimAllRewards:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [POST] /api/battlepass/upgrade
 * Mở khóa Tuyến Cyber VIP (Premium Pass) bằng 5,000 Vàng
 */
exports.upgradeToPremium = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để nâng cấp Sổ Sứ Mệnh!',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản!' });
    }

    if (user.battlePass?.isPremium) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã mở khóa Tuyến VIP Mùa 1 rồi!',
      });
    }

    if (user.coins < PREMIUM_UPGRADE_COST) {
      return res.status(400).json({
        success: false,
        message: `Số dư Vàng không đủ (Cần ${PREMIUM_UPGRADE_COST.toLocaleString()} Vàng để mở khóa Tuyến VIP)!`,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { coins: -PREMIUM_UPGRADE_COST },
        'battlePass.isPremium': true,
      },
      { returnDocument: 'after' }
    );

    return res.status(200).json({
      success: true,
      message: 'Chúc mừng bạn đã mở khóa thành công Tuyến Cyber VIP Sổ Sứ Mệnh Mùa 1!',
      user: updatedUser,
    });
  } catch (err) {
    console.error('[BattlePass] ❌ Lỗi upgradeToPremium:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
