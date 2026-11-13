const User = require('../models/User');

// ============================================================================
// CẤU HÌNH 8 Ô PHẦN THƯỞNG VÒNG QUAY MAY MẮN (WHEEL SLICES)
// ============================================================================
const WHEEL_SLICES = [
  { id: 'coins_200', label: '200 Vàng', type: 'coins', value: 200, icon: '🪙', weight: 30, color: '#0ea5e9' },
  { id: 'exp_100', label: '100 Exp', type: 'exp', value: 100, icon: '⚡', weight: 20, color: '#8b5cf6' },
  { id: 'coins_500', label: '500 Vàng', type: 'coins', value: 500, icon: '🪙', weight: 18, color: '#10b981' },
  { id: 'tourn_ticket', label: 'Vé Đấu Cúp', type: 'ticket', value: 'ticket_cup', icon: '🎫', weight: 10, color: '#f59e0b' },
  { id: 'coins_1000', label: '1,000 Vàng', type: 'coins', value: 1000, icon: '💰', weight: 8, color: '#3b82f6' },
  { id: 'exp_300', label: '300 Exp', type: 'exp', value: 300, icon: '⚡', weight: 8, color: '#a855f7' },
  { id: 'frame_neon', label: 'Khung Neon', type: 'item', value: 'frame_neon_cyan', icon: '🎭', weight: 4, color: '#06b6d4' },
  { id: 'jackpot', label: '2,500 Vàng', type: 'coins', value: 2500, icon: '👑', weight: 2, color: '#f43f5e' },
];

// ============================================================================
// CẤU HÌNH PHẦN THƯỞNG ĐIỂM DANH 7 NGÀY (7-DAY CHECK-IN STREAK)
// ============================================================================
const CHECK_IN_REWARDS = [
  { day: 1, label: '100 Vàng + 50 Exp', coins: 100, exp: 50, item: null, icon: '🪙' },
  { day: 2, label: '200 Vàng + 80 Exp', coins: 200, exp: 80, item: null, icon: '🪙' },
  { day: 3, label: '350 Vàng + 120 Exp', coins: 350, exp: 120, item: null, icon: '💰' },
  { day: 4, label: '400 Vàng + Vé Đấu Cúp', coins: 400, exp: 150, item: 'ticket_cup', icon: '🎫' },
  { day: 5, label: '600 Vàng + 200 Exp', coins: 600, exp: 200, item: null, icon: '💰' },
  { day: 6, label: '800 Vàng + 300 Exp', coins: 800, exp: 300, item: null, icon: '💎' },
  {
    day: 7,
    label: '🎁 ĐẠI THƯỞNG: 1,500 Vàng + 500 Exp + Khung Bí Ngô',
    coins: 1500,
    exp: 500,
    item: 'frame_halloween',
    icon: '🎃',
    isGrandPrize: true,
  },
];

// Lấy ngày chuẩn YYYY-MM-DD
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Kiểm tra xem 2 chuỗi ngày có phải là 2 ngày liên tiếp không
function isConsecutiveDay(prevDateStr, curDateStr) {
  if (!prevDateStr) return false;
  const prev = new Date(prevDateStr);
  const cur = new Date(curDateStr);
  const diffTime = cur - prev;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

/**
 * [GET] /api/rewards/wheel-status
 * Lấy trạng thái vòng quay (Lượt free, danh sách ô quà)
 */
exports.getWheelStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.query?.userId;
    let canFreeSpin = true;
    let userCoins = 0;

    if (userId && require('mongoose').isValidObjectId(userId)) {
      const user = await User.findById(userId);
      if (user) {
        userCoins = user.coins || 0;
        if (user.lastDailySpinAt) {
          const lastSpin = new Date(user.lastDailySpinAt);
          const now = new Date();
          const isSameDay =
            lastSpin.getFullYear() === now.getFullYear() &&
            lastSpin.getMonth() === now.getMonth() &&
            lastSpin.getDate() === now.getDate();
          canFreeSpin = !isSameDay;
        }
      }
    }

    return res.status(200).json({
      success: true,
      canFreeSpin,
      paidSpinCost: 200,
      userCoins,
      slices: WHEEL_SLICES,
    });
  } catch (err) {
    console.error('[Rewards] ❌ Lỗi getWheelStatus:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [POST] /api/rewards/spin
 * Thực hiện quay vòng quay may mắn (Server-Authoritative Random)
 */
exports.spinWheel = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    const isFree = req.body?.isFree === true;

    let user = null;
    if (userId && require('mongoose').isValidObjectId(userId)) {
      user = await User.findById(userId);
    }

    // 1. Kiểm tra điều kiện quay
    if (isFree) {
      if (user?.lastDailySpinAt) {
        const lastSpin = new Date(user.lastDailySpinAt);
        const now = new Date();
        const isSameDay =
          lastSpin.getFullYear() === now.getFullYear() &&
          lastSpin.getMonth() === now.getMonth() &&
          lastSpin.getDate() === now.getDate();
        if (isSameDay) {
          return res.status(400).json({
            success: false,
            message: 'Bạn đã sử dụng lượt quay miễn phí hôm nay! Vui lòng quay bằng Vàng hoặc chờ ngày mai.',
          });
        }
      }
    } else {
      // Quay bằng Vàng (200 Vàng)
      if (user && user.coins < 200) {
        return res.status(400).json({
          success: false,
          message: 'Số dư Vàng không đủ (Cần 200 Vàng để quay thêm)!',
        });
      }
    }

    // 2. Thuật toán Random có trọng số (Weighted Random)
    const totalWeight = WHEEL_SLICES.reduce((sum, s) => sum + s.weight, 0);
    let rand = Math.random() * totalWeight;
    let selectedIndex = 0;

    for (let i = 0; i < WHEEL_SLICES.length; i++) {
      if (rand < WHEEL_SLICES[i].weight) {
        selectedIndex = i;
        break;
      }
      rand -= WHEEL_SLICES[i].weight;
    }

    const prize = WHEEL_SLICES[selectedIndex];

    // 3. Tính góc quay dừng chính xác
    // 8 ô -> Mỗi ô 45 độ. Tâm ô i: i * 45 + 22.5
    // Đảo ngược chiều kim đồng hồ để dừng đúng kim đỉnh trên (0 độ)
    const sliceAngle = 360 / WHEEL_SLICES.length;
    const targetCenter = selectedIndex * sliceAngle + sliceAngle / 2;
    // 5 vòng quay trọn vẹn (1800 độ) + góc lệch để kim chỉ vào đúng ô
    const stopAngle = 1800 + (360 - targetCenter);

    // 4. Cộng thưởng và trừ vàng trong CSDL nếu có user
    let updatedUser = null;
    if (user) {
      const updateOps = {
        $inc: { spinCount: 1 },
      };

      if (!isFree) {
        updateOps.$inc.coins = -200;
      }

      if (isFree) {
        updateOps.lastDailySpinAt = new Date();
      }

      if (prize.type === 'coins') {
        updateOps.$inc.coins = (updateOps.$inc.coins || 0) + prize.value;
      } else if (prize.type === 'exp') {
        updateOps.$inc.exp = prize.value;
      } else if (prize.type === 'item') {
        updateOps.$addToSet = { inventory: prize.value };
      }

      updatedUser = await User.findByIdAndUpdate(user._id, updateOps, {
        returnDocument: 'after',
      });

      // Hook thưởng Season EXP cho Sổ Sứ Mệnh (Task 4)
      try {
        const { addSeasonExpToUser } = require('./battlePassController');
        await addSeasonExpToUser(user._id, 20);
      } catch {}
    }

    return res.status(200).json({
      success: true,
      message: `Chúc mừng bạn đã quay trúng: ${prize.label}!`,
      selectedIndex,
      prize,
      stopAngle,
      user: updatedUser,
    });
  } catch (err) {
    console.error('[Rewards] ❌ Lỗi spinWheel:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [GET] /api/rewards/checkin-status
 * Lấy thông tin chuỗi điểm danh 7 ngày
 */
exports.getCheckInStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.query?.userId;
    const today = getTodayDateString();

    let streak = 0;
    let isClaimedToday = false;
    let claimedDays = [];

    if (userId && require('mongoose').isValidObjectId(userId)) {
      const user = await User.findById(userId);
      if (user) {
        isClaimedToday = user.lastCheckInDate === today;
        streak = user.checkInStreak || 0;
        claimedDays = user.claimedCheckInDays || [];

        // Nếu ngày đăng nhập trước đó cách hơn 1 ngày so với hôm nay (đứt chuỗi)
        // và hôm nay chưa nhận quà, thì reset chuỗi về 0
        if (!isClaimedToday && user.lastCheckInDate) {
          const isCont = isConsecutiveDay(user.lastCheckInDate, today);
          if (!isCont) {
            streak = 0;
            claimedDays = [];
          }
        }
      }
    }

    const currentDayToClaim = isClaimedToday ? streak : (streak % 7) + 1;

    return res.status(200).json({
      success: true,
      today,
      streak,
      isClaimedToday,
      currentDayToClaim,
      claimedDays,
      rewards: CHECK_IN_REWARDS,
    });
  } catch (err) {
    console.error('[Rewards] ❌ Lỗi getCheckInStatus:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [POST] /api/rewards/checkin
 * Nhận thưởng điểm danh ngày hôm nay
 */
exports.claimCheckIn = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    const today = getTodayDateString();

    if (!userId || !require('mongoose').isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập tài khoản để tích lũy chuỗi điểm danh 7 ngày!',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản!' });
    }

    // 1. Kiểm tra hôm nay đã nhận chưa
    if (user.lastCheckInDate === today) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã điểm danh hôm nay rồi! Hãy quay lại vào ngày mai nhé.',
      });
    }

    // 2. Tính toán ngày streak tiếp theo
    let newStreak = 1;
    let newClaimedDays = [...(user.claimedCheckInDays || [])];

    if (user.lastCheckInDate && isConsecutiveDay(user.lastCheckInDate, today)) {
      // Điểm danh liên tiếp
      newStreak = (user.checkInStreak % 7) + 1;
      if (newStreak === 1) {
        // Hoàn tất 1 chu kỳ 7 ngày, bắt đầu chu kỳ mới
        newClaimedDays = [1];
      } else {
        newClaimedDays.push(newStreak);
      }
    } else {
      // Đứt chuỗi, bắt đầu lại Ngày 1
      newStreak = 1;
      newClaimedDays = [1];
    }

    const reward = CHECK_IN_REWARDS.find((r) => r.day === newStreak) || CHECK_IN_REWARDS[0];

    // 3. Cập nhật tài khoản
    const updateOps = {
      checkInStreak: newStreak,
      lastCheckInDate: today,
      claimedCheckInDays: newClaimedDays,
      $inc: {
        coins: reward.coins || 0,
        exp: reward.exp || 0,
      },
    };

    if (reward.item) {
      updateOps.$addToSet = { inventory: reward.item };
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateOps, {
      returnDocument: 'after',
    });

    // Hook thưởng Season EXP cho Sổ Sứ Mệnh (Task 4)
    try {
      const { addSeasonExpToUser } = require('./battlePassController');
      await addSeasonExpToUser(userId, 40);
    } catch {}

    return res.status(200).json({
      success: true,
      message: `Điểm danh Ngày ${newStreak} thành công! Nhận +${reward.coins} Vàng, +${reward.exp} Exp!`,
      reward,
      streak: newStreak,
      claimedDays: newClaimedDays,
      user: updatedUser,
    });
  } catch (err) {
    console.error('[Rewards] ❌ Lỗi claimCheckIn:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
