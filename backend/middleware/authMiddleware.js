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
 * Middleware phân quyền Admin cấp cao (Tàng hình bảo mật 100% với người không có quyền)
 * Bất kỳ truy cập nào không có Token Admin hợp lệ đều nhận HTTP 404 (Không tồn tại),
 * triệt để giấu kín toàn bộ hệ thống API Quản trị khỏi tầm ngắm của hacker và máy quét.
 */
const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(404).json({
      success: false,
      message: 'Đường dẫn API không tồn tại trên hệ thống máy chủ an toàn NEO-UNO!',
    });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err || !decoded?.id) {
      return res.status(404).json({
        success: false,
        message: 'Đường dẫn API không tồn tại trên hệ thống máy chủ an toàn NEO-UNO!',
      });
    }

    try {
      const user = await User.findById(decoded.id);
      if (!user || user.role !== 'admin' || user.isBanned) {
        return res.status(404).json({
          success: false,
          message: 'Đường dẫn API không tồn tại trên hệ thống máy chủ an toàn NEO-UNO!',
        });
      }

      req.user = user;
      next();
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Đường dẫn API không tồn tại trên hệ thống máy chủ an toàn NEO-UNO!',
      });
    }
  });
};

module.exports = { requireAuth, requireAdmin };
