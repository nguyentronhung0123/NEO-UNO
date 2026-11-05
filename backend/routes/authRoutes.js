const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Đăng nhập
router.post('/login', authController.login);

// Đăng ký tài khoản mới
router.post('/register', authController.register);

// Đăng nhập chế độ khách
router.post('/guest', authController.guestLogin);

// Quên mật khẩu: Gửi OTP
router.post('/forgot-password', authController.forgotPassword);

// Quên mật khẩu: Xác thực OTP
router.post('/verify-otp', authController.verifyOtp);

// Quên mật khẩu: Đặt lại mật khẩu mới
router.post('/reset-password', authController.resetPassword);

// Đăng nhập Google
router.post('/google', authController.googleLogin);

// Đăng xuất an toàn
router.post('/logout', authController.logout);

// Lấy thông tin tài khoản hiện tại
router.get('/me', authController.getMe);

module.exports = router;
