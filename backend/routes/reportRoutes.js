const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

// Tất cả các hành động tố cáo yêu cầu đăng nhập
router.use(requireAuth);

router.post('/', reportController.createReport);
router.get('/my-reports', reportController.getMyReports);

module.exports = router;
