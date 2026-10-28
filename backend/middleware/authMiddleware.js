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

module.exports = { requireAuth };
