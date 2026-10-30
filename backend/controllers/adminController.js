const User = require('../models/User');
const Match = require('../models/Match');
const SecurityLog = require('../models/SecurityLog');

/**
 * 1. TỔNG QUAN AN NINH HỆ THỐNG (DASHBOARD STATS)
 * GET /api/admin/dashboard
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'bot' } });
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const flaggedUsers = await User.countDocuments({ isFlagged: true });
    const totalMatches = await Match.countDocuments();

    // Tổng hợp Vàng đang lưu thông và ELO trung bình thị trường
    const metrics = await User.aggregate([
      { $match: { role: { $ne: 'bot' } } },
      {
        $group: {
          _id: null,
          totalCoins: { $sum: '$coins' },
          avgElo: { $avg: '$elo' },
          maxElo: { $max: '$elo' },
        },
      },
    ]);

    const totalCoinsInCirculation = metrics[0]?.totalCoins || 0;
    const averageElo = Math.round(metrics[0]?.avgElo || 1000);
    const highestElo = metrics[0]?.maxElo || 1000;

    // Cảnh báo an ninh trong 24 giờ qua (Warning & Critical)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const securityAlerts24h = await SecurityLog.countDocuments({
      severity: { $in: ['warning', 'critical'] },
      createdAt: { $gte: twentyFourHoursAgo },
    });

    // Nhật ký an ninh gần đây nhất
    const recentLogs = await SecurityLog.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('userId', 'nickname email avatar');

    // Đánh giá mức độ đe dọa hệ thống (Threat Level)
    let threatLevel = 'LOW';
    if (securityAlerts24h > 15 || flaggedUsers > 5) {
      threatLevel = 'HIGH';
    } else if (securityAlerts24h > 5 || flaggedUsers > 0) {
      threatLevel = 'MEDIUM';
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        bannedUsers,
        flaggedUsers,
        totalMatches,
        totalCoinsInCirculation,
        averageElo,
        highestElo,
        securityAlerts24h,
        threatLevel,
      },
      recentLogs,
    });
  } catch (error) {
    console.error('[Admin Dashboard Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy dữ liệu Tổng quan An ninh!',
    });
  }
};

/**
 * 2. LẤY DANH SÁCH NGƯỜI CHƠI & LỌC AN NINH
 * GET /api/admin/users
 */
exports.getUsersList = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 12);
    const search = req.query.search ? req.query.search.trim() : '';
    const filter = req.query.filter || 'all'; // all, banned, flagged, admin, player

    const query = {};

    if (search) {
      query.$or = [
        { nickname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (filter === 'banned') {
      query.isBanned = true;
    } else if (filter === 'flagged') {
      query.isFlagged = true;
    } else if (filter === 'admin') {
      query.role = 'admin';
    } else if (filter === 'player') {
      query.role = 'player';
    }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ isBanned: -1, isFlagged: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit) || 1,
      },
    });
  } catch (error) {
    console.error('[Admin Users Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tải danh sách người chơi!',
    });
  }
};

/**
 * 3. KHÓA TÀI KHOẢN NGƯỜI DÙNG (BAN USER)
 * POST /api/admin/user/ban
 */
exports.banUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã định danh tài khoản người dùng (userId)!',
      });
    }

    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự khóa tài khoản Quản trị viên của chính mình!',
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản người chơi cần khóa!',
      });
    }

    if (targetUser.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không thể khóa tài khoản có quyền Quản Trị Viên (Admin)!',
      });
    }

    targetUser.isBanned = true;
    targetUser.banReason = reason || 'Vi phạm chính sách an ninh & điều khoản trò chơi';
    targetUser.bannedAt = new Date();
    await targetUser.save();

    // Ngắt kết nối socket realtime nếu người dùng đang online
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${targetUser._id}`).emit('user:banned', {
        reason: targetUser.banReason,
      });
    }

    // Ghi nhận Audit Log
    await SecurityLog.create({
      userId: targetUser._id,
      action: 'ADMIN_BAN_USER',
      severity: 'warning',
      details: {
        targetNickname: targetUser.nickname,
        targetEmail: targetUser.email,
        reason: targetUser.banReason,
      },
      performedBy: req.user.nickname || 'ADMIN',
      ipAddress: req.ip || req.connection?.remoteAddress,
    });

    return res.status(200).json({
      success: true,
      message: `Đã KHÓA tài khoản [${targetUser.nickname}] thành công!`,
      user: targetUser,
    });
  } catch (error) {
    console.error('[Admin Ban Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi thực hiện khóa tài khoản!',
    });
  }
};

/**
 * 4. MỞ KHÓA TÀI KHOẢN (UNBAN USER)
 * POST /api/admin/user/unban
 */
exports.unbanUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã định danh tài khoản người dùng (userId)!',
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản cần mở khóa!',
      });
    }

    targetUser.isBanned = false;
    targetUser.banReason = null;
    targetUser.bannedAt = null;
    await targetUser.save();

    // Ghi nhận Audit Log
    await SecurityLog.create({
      userId: targetUser._id,
      action: 'ADMIN_UNBAN_USER',
      severity: 'info',
      details: {
        targetNickname: targetUser.nickname,
      },
      performedBy: req.user.nickname || 'ADMIN',
      ipAddress: req.ip || req.connection?.remoteAddress,
    });

    return res.status(200).json({
      success: true,
      message: `Đã MỞ KHÓA thành công cho tài khoản [${targetUser.nickname}]!`,
      user: targetUser,
    });
  } catch (error) {
    console.error('[Admin Unban Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi mở khóa tài khoản!',
    });
  }
};

/**
 * 5. ĐIỀU CHỈNH SỐ DƯ TIỀN VÀNG & ĐIỂM ELO (ADJUST BALANCE / ELO)
 * POST /api/admin/user/adjust
 */
exports.adjustUserBalance = async (req, res) => {
  try {
    const { userId, coinAdjustment, eloAdjustment, reason } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã định danh tài khoản người dùng (userId)!',
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản người dùng!',
      });
    }

    const prevCoins = targetUser.coins || 0;
    const prevElo = targetUser.elo || 1000;

    let appliedCoinDelta = 0;
    let appliedEloDelta = 0;

    if (coinAdjustment !== undefined && coinAdjustment !== null && !isNaN(coinAdjustment)) {
      appliedCoinDelta = parseInt(coinAdjustment);
      // Ràng buộc số dư không được âm
      targetUser.coins = Math.max(0, prevCoins + appliedCoinDelta);
    }

    if (eloAdjustment !== undefined && eloAdjustment !== null && !isNaN(eloAdjustment)) {
      appliedEloDelta = parseInt(eloAdjustment);
      // Ràng buộc ELO từ 0 đến 4000
      targetUser.elo = Math.min(4000, Math.max(0, prevElo + appliedEloDelta));
    }

    await targetUser.save();

    // Ghi nhận Audit Log
    const logAction = appliedCoinDelta !== 0 ? 'ADMIN_ADJUST_COINS' : 'ADMIN_ADJUST_ELO';
    await SecurityLog.create({
      userId: targetUser._id,
      action: logAction,
      severity: 'info',
      details: {
        targetNickname: targetUser.nickname,
        prevCoins,
        newCoins: targetUser.coins,
        coinAdjustment: appliedCoinDelta,
        prevElo,
        newElo: targetUser.elo,
        eloAdjustment: appliedEloDelta,
        reason: reason || 'Quản trị viên điều chỉnh thủ công',
      },
      performedBy: req.user.nickname || 'ADMIN',
      ipAddress: req.ip || req.connection?.remoteAddress,
    });

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật số dư cho [${targetUser.nickname}]! Vàng: ${prevCoins} ➔ ${targetUser.coins}, ELO: ${prevElo} ➔ ${targetUser.elo}`,
      user: targetUser,
    });
  } catch (error) {
    console.error('[Admin Adjust Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi máy chủ khi điều chỉnh số dư!',
    });
  }
};

/**
 * 6. PHÂN QUYỀN VAI TRÒ TÀI KHOẢN (SET ROLE: PLAYER / ADMIN)
 * POST /api/admin/user/role
 */
exports.setUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp userId và role hợp lệ!',
      });
    }

    if (!['player', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Vai trò chỉ có thể là "player" hoặc "admin"!',
      });
    }

    if (String(userId) === String(req.user._id) && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự hạ quyền Quản trị viên của chính mình!',
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng!',
      });
    }

    const oldRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await SecurityLog.create({
      userId: targetUser._id,
      action: 'ADMIN_ROLE_CHANGE',
      severity: 'warning',
      details: {
        targetNickname: targetUser.nickname,
        oldRole,
        newRole: role,
      },
      performedBy: req.user.nickname || 'ADMIN',
      ipAddress: req.ip || req.connection?.remoteAddress,
    });

    return res.status(200).json({
      success: true,
      message: `Đã thay đổi vai trò của [${targetUser.nickname}] thành [${role.toUpperCase()}]!`,
      user: targetUser,
    });
  } catch (error) {
    console.error('[Admin Role Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi phân quyền vai trò!',
    });
  }
};

/**
 * 7. GỠ CỜ CẢNH BÁO GIAN LẬN (CLEAR CHEAT FLAG)
 * POST /api/admin/user/clear-flag
 */
exports.clearUserFlag = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã định danh tài khoản người dùng (userId)!',
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng!',
      });
    }

    targetUser.isFlagged = false;
    targetUser.cheatWarnings = [];
    await targetUser.save();

    await SecurityLog.create({
      userId: targetUser._id,
      action: 'SUSPICIOUS_EXPLOIT_ATTEMPT',
      severity: 'info',
      details: {
        action: 'CLEAR_FLAG_BY_ADMIN',
        targetNickname: targetUser.nickname,
      },
      performedBy: req.user.nickname || 'ADMIN',
      ipAddress: req.ip || req.connection?.remoteAddress,
    });

    return res.status(200).json({
      success: true,
      message: `Đã xóa cảnh báo nghi vấn gian lận cho tài khoản [${targetUser.nickname}]!`,
      user: targetUser,
    });
  } catch (error) {
    console.error('[Admin Clear Flag Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa cờ cảnh báo!',
    });
  }
};

/**
 * 8. TRA CỨU NHẬT KÝ AN NINH & KIỂM TOÁN (AUDIT LOGS)
 * GET /api/admin/logs
 */
exports.getSecurityLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const severity = req.query.severity; // info, warning, critical
    const action = req.query.action;

    const query = {};
    if (severity && severity !== 'all') {
      query.severity = severity;
    }
    if (action && action !== 'all') {
      query.action = action;
    }

    const totalLogs = await SecurityLog.countDocuments(query);
    const logs = await SecurityLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'nickname email avatar elo coins role');

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        total: totalLogs,
        page,
        limit,
        totalPages: Math.ceil(totalLogs / limit) || 1,
      },
    });
  } catch (error) {
    console.error('[Admin Logs Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi truy vấn nhật ký an ninh!',
    });
  }
};
