const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Đăng nhập
router.post('/login', authController.login);

// Đăng ký tài khoản mới
router.post('/register', authController.register);

// Đăng nhập chế độ khách
router.post('/guest', authController.guestLogin);

// Lấy thông tin tài khoản hiện tại
router.get('/me', authController.getMe);

module.exports = router;
