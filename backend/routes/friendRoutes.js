const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const { requireAuth } = require('../middleware/authMiddleware');

// Tất cả các routes bạn bè đều yêu cầu đăng nhập
router.use(requireAuth);

// 1. Lấy danh sách bạn bè
router.get('/', friendController.getFriends);

// 2. Lấy danh sách lời mời kết bạn (nhận được & đã gửi)
router.get('/requests', friendController.getFriendRequests);

// 3. Gửi lời mời kết bạn
router.post('/request', friendController.sendFriendRequest);

// 4. Phản hồi lời mời kết bạn (Chấp nhận / Từ chối)
router.put('/respond/:requestId', friendController.respondFriendRequest);

// 5. Hủy kết bạn
router.delete('/:friendId', friendController.removeFriend);

// 6. Tìm kiếm người chơi để kết bạn
router.get('/search', friendController.searchUsers);

module.exports = router;
