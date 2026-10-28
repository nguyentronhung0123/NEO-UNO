const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const { requireAuth } = require('../middleware/authMiddleware');

// Tất cả các routes bạn bè đều yêu cầu đăng nhập
router.use(requireAuth);

// 1. Lấy danh sách bạn bè (Khai thác Aggregation Pipeline)
router.get('/', friendController.getFriends);

// 2. Lấy danh sách lời mời kết bạn (nhận được & đã gửi)
router.get('/requests', friendController.getFriendRequests);

// 3. Gửi lời mời kết bạn (Hỗ trợ cả Nickname và ID tài khoản)
router.post('/request', friendController.sendFriendRequest);

// 4. Phản hồi lời mời kết bạn (Chấp nhận / Từ chối)
router.put('/respond/:requestId', friendController.respondFriendRequest);

// 5. Hủy kết bạn (Unfriend)
router.delete('/:friendId', friendController.removeFriend);

// 6. Tìm kiếm người chơi để kết bạn (Hỗ trợ cả Nickname và ID tài khoản)
router.get('/search', friendController.searchUsers);

// 7. Lấy lịch sử tin nhắn trực tiếp giữa 2 bạn bè (Direct Chat - Task 2)
router.get('/messages/:friendId', friendController.getDirectMessages);

// 8. Gửi tin nhắn trực tiếp cho bạn bè (Direct Chat - Task 2)
router.post('/messages/:friendId', friendController.sendDirectMessage);

module.exports = router;
