const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

// Lấy danh mục Cửa Hàng (hỗ trợ cả token đăng nhập lẫn guest)
router.get('/items', shopController.getShopCatalog);

// Mua vật phẩm bằng tiền Vàng
router.post('/buy', shopController.buyItem);

// Trang bị vật phẩm (Skin lưng bài hoặc Khung avatar)
router.post('/equip', shopController.equipItem);

module.exports = router;
