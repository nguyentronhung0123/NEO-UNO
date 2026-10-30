const express = require('express');
const router = express.Router();
const questController = require('../controllers/questController');

// 1. Lấy danh sách nhiệm vụ hôm nay
router.get('/', questController.getDailyQuests);

// 2. Nhận thưởng nhiệm vụ ngày
router.post('/claim', questController.claimQuestReward);

// 3. Mở rương chiến tích ngày
router.post('/claim-chest', questController.claimDailyChest);

// 4. Lấy danh sách thành tựu dài hạn & huy hiệu
router.get('/achievements', questController.getAchievements);

// 5. Nhận thưởng thành tựu
router.post('/achievements/claim', questController.claimAchievementReward);

module.exports = router;
