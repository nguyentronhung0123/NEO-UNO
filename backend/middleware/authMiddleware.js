const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'neo_uno_super_secret_jwt_key_2026_xyz';

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Chưa đăng nhập hoặc thiếu Token xác thực!',
      });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!',
        });
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài khoản người dùng!',
        });
      }

      // RÀNG BUỘC AN NINH: Chặn tài khoản bị cấm (Banned)
      if (user.isBanned) {
        return res.status(403).json({
          success: false,
          message: `Tài khoản của bạn đã bị KHÓA do vi phạm quy tắc an toàn hoặc nghi vấn gian lận! Lý do: ${user.banReason || 'Không xác định'}`,
          isBanned: true,
        });
      }

      req.user = user;
      next();
    });
  } catch (err) {
    console.error('[Auth Middleware Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực người dùng trên máy chủ!',
    });
  }
};

/**
 * Middleware phân quyền Admin cấp cao (Chỉ dành cho quản trị viên)
 */
const requireAdmin = async (req, res, next) => {
  await requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'TRUY CẬP BỊ TỪ CHỐI: Yêu cầu quyền Quản trị viên (Admin) cấp cao!',
      });
    }
    next();
  });
};

module.exports = { requireAuth, requireAdmin };
