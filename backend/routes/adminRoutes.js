const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// Tất cả các route bên dưới bắt buộc phải có Token Quản Trị Viên (role === 'admin')
router.use(requireAdmin);

// 1. Thống kê Dashboard & Cảnh báo an ninh
router.get('/dashboard', adminController.getDashboardStats);

// 2. Quản lý người chơi & Chống hack
router.get('/users', adminController.getUsersList);
router.post('/user/ban', adminController.banUser);
router.post('/user/unban', adminController.unbanUser);
router.post('/user/adjust', adminController.adjustUserBalance);
router.post('/user/role', adminController.setUserRole);
router.post('/user/clear-flag', adminController.clearUserFlag);

// 3. Nhật ký kiểm toán an ninh (Security Audit Logs)
router.get('/logs', adminController.getSecurityLogs);

// 4. Quản lý Báo cáo Tố cáo (SOC Reports - Task 3)
router.get('/reports', adminController.getReportsList);
router.post('/report/:id/resolve', adminController.resolveReport);

// 5. Giám sát Hiệu năng & Tải máy chủ (Server Metrics Telemetry - Task 4)
router.get('/metrics', adminController.getServerMetrics);

module.exports = router;
