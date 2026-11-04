const Report = require('../models/Report');
const User = require('../models/User');
const Match = require('../models/Match');
const SecurityLog = require('../models/SecurityLog');

/**
 * 1. GỬI TỐ CÁO VI PHẠM (PLAYER REPORT)
 * POST /api/reports
 */
exports.createReport = async (req, res) => {
  try {
    const reporter = req.user;
    if (!reporter) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để thực hiện tố cáo!',
      });
    }

    const { targetUserId, matchId, roomCode, reason, description, evidenceTurn } = req.body;

    if (!targetUserId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin người bị tố cáo hoặc lý do vi phạm!',
      });
    }

    // Không cho phép tự tố cáo chính mình
    if (reporter._id.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự tố cáo chính mình!',
      });
    }

    // Kiểm tra tài khoản bị tố cáo có tồn tại không
    let targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      // Thử tìm theo nickname nếu truyền id giả lập hoặc bot
      targetUser = await User.findOne({ nickname: targetUserId });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người chơi bị tố cáo trong hệ thống!',
      });
    }

    // Chặn người chơi bot bị tố cáo
    if (targetUser.role === 'bot') {
      return res.status(400).json({
        success: false,
        message: 'Người chơi này là Bot AI của hệ thống, không thể gửi tố cáo!',
      });
    }

    // Kiểm tra chống spam: Không gửi trùng lặp cùng đối tượng trong 60 giây
    const recentReport = await Report.findOne({
      reporter: reporter._id,
      targetUser: targetUser._id,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
    });

    if (recentReport) {
      return res.status(429).json({
        success: false,
        message: 'Bạn vừa gửi báo cáo về người chơi này, vui lòng chờ Ban Quản Trị xử lý!',
      });
    }

    // Lưu báo cáo vi phạm
    const newReport = await Report.create({
      reporter: reporter._id,
      reporterName: reporter.nickname,
      targetUser: targetUser._id,
      targetUserName: targetUser.nickname,
      matchId: matchId || null,
      roomCode: roomCode || 'UNKNOWN',
      reason,
      description: description ? description.trim() : '',
      evidenceTurn: typeof evidenceTurn === 'number' ? evidenceTurn : null,
      status: 'pending',
    });

    // Ghi nhật ký kiểm toán an ninh
    await SecurityLog.create({
      userId: reporter._id,
      action: 'USER_SUBMIT_REPORT',
      severity: 'info',
      details: {
        reportId: newReport._id,
        targetUserId: targetUser._id,
        targetUserName: targetUser.nickname,
        reason,
        matchId,
        roomCode,
      },
      performedBy: reporter.nickname,
      ipAddress: req.ip || req.connection?.remoteAddress,
    });

    return res.status(201).json({
      success: true,
      message: 'Gửi tố cáo thành công! Ban Quản Trị (SOC) sẽ thẩm tra ván đấu và xử lý nghiêm minh.',
      report: newReport,
    });
  } catch (error) {
    console.error('[Create Report Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi báo cáo tố cáo vi phạm!',
    });
  }
};

/**
 * 2. LẤY DANH SÁCH TỐ CÁO DO BẢN THÂN ĐÃ GỬI
 * GET /api/reports/my-reports
 */
exports.getMyReports = async (req, res) => {
  try {
    const reporter = req.user;
    const reports = await Report.find({ reporter: reporter._id })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error('[Get My Reports Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lịch sử báo cáo của bạn!',
    });
  }
};
