/**
 * Automated Test Suite: Hệ Thống Cửa Hàng Trang Bị Skin & Khung Avatar (Task 5)
 * Kiểm thử toàn diện: Catalog, Mua bằng Vàng, Kiểm tra số dư, Trang bị và Lưu MongoDB
 */
require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const connectDB = require('../config/db');
const { SHOP_ITEMS, getShopItemById } = require('../config/shopItems');

const JWT_SECRET = process.env.JWT_SECRET || 'neo_uno_super_secret_jwt_key_2026_xyz';
const BASE_URL = 'http://localhost:5001/api/shop';

async function runShopTests() {
  console.log('\n===============================================================');
  console.log('   BẮT ĐẦU KIỂM THỬ: HỆ THỐNG CỬA HÀNG SKIN & AVATAR (TASK 5)');
  console.log('===============================================================\n');

  let testUser = null;
  let testToken = null;

  try {
    await connectDB();

    // 1. Dọn dẹp dữ liệu test cũ
    await User.deleteMany({ email: 'test_shop_user_2026@neo.com' });

    // 2. Tạo User thử nghiệm với 6,000 Vàng
    testUser = await User.create({
      nickname: 'HalloweenMaster',
      email: 'test_shop_user_2026@neo.com',
      password: 'password_test_123',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=HalloweenMaster',
      coins: 6000,
      inventory: ['skin_classic', 'frame_default'],
      equippedCardSkin: 'skin_classic',
      equippedAvatarFrame: 'frame_default',
    });

    testToken = jwt.sign(
      { id: testUser._id, nickname: testUser.nickname, role: 'player' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log(`[Setup] ✅ Đã tạo người chơi test "${testUser.nickname}" (Coins: ${testUser.coins}, Inventory: [${testUser.inventory.join(', ')}])`);

    // ================= TEST 1: GET /api/shop/items =================
    console.log('\n--- [TEST 1]: Tải Danh Mục Cửa Hàng (GET /api/shop/items) ---');
    const catalogRes = await fetch(`${BASE_URL}/items`, {
      headers: { Authorization: `Bearer ${testToken}` },
    });
    const catalogData = await catalogRes.json();

    if (!catalogData.success || !Array.isArray(catalogData.items)) {
      throw new Error(`TEST 1 Thất bại: Không lấy được danh mục items! (${JSON.stringify(catalogData)})`);
    }

    const halloweenSkin = catalogData.items.find((i) => i.id === 'skin_halloween');
    const halloweenFrame = catalogData.items.find((i) => i.id === 'frame_halloween');
    const classicSkin = catalogData.items.find((i) => i.id === 'skin_classic');

    if (!halloweenSkin || !halloweenFrame) {
      throw new Error('TEST 1 Thất bại: Không tìm thấy vật phẩm sự kiện Halloween trong catalog!');
    }

    if (!classicSkin.isOwned || !classicSkin.isEquipped) {
      throw new Error('TEST 1 Thất bại: Skin mặc định không được đánh dấu isOwned hoặc isEquipped!');
    }

    if (halloweenSkin.isOwned) {
      throw new Error('TEST 1 Thất bại: Skin Halloween chưa mua nhưng bị đánh dấu isOwned = true!');
    }

    console.log(`[TEST 1] ✅ Catalog trả về thành công ${catalogData.items.length} vật phẩm. Skin Halloween giá: ${halloweenSkin.price} Vàng.`);

    // ================= TEST 2: POST /api/shop/buy (Mua Thành Công) =================
    console.log('\n--- [TEST 2]: Mua Skin "Halloween Spooky 2026" (3,500 Vàng) ---');
    const buyRes = await fetch(`${BASE_URL}/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ itemId: 'skin_halloween' }),
    });
    const buyData = await buyRes.json();

    if (!buyData.success || buyData.userCoins !== 2500) {
      throw new Error(`TEST 2 Thất bại: Mua không thành công hoặc trừ tiền sai! (Số dư: ${buyData.userCoins})`);
    }

    if (!buyData.inventory.includes('skin_halloween')) {
      throw new Error('TEST 2 Thất bại: skin_halloween chưa được thêm vào kho đồ!');
    }

    if (buyData.equippedCardSkin !== 'skin_halloween') {
      throw new Error('TEST 2 Thất bại: Skin vừa mua chưa được tự động trang bị!');
    }

    console.log(`[TEST 2] ✅ Mua thành công! Số dư còn lại: ${buyData.userCoins} Vàng. Tự động trang bị: ${buyData.equippedCardSkin}.`);

    // ================= TEST 3: Chống mua trùng vật phẩm đã sở hữu =================
    console.log('\n--- [TEST 3]: Chặn Mua Lại Vật Phẩm Đã Sở Hữu ---');
    const duplicateBuyRes = await fetch(`${BASE_URL}/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ itemId: 'skin_halloween' }),
    });
    const duplicateBuyData = await duplicateBuyRes.json();

    if (duplicateBuyData.success) {
      throw new Error('TEST 3 Thất bại: Hệ thống cho phép mua trùng vật phẩm đã sở hữu!');
    }
    console.log(`[TEST 3] ✅ Hệ thống đã chặn mua trùng chính xác: "${duplicateBuyData.message}"`);

    // ================= TEST 4: Chặn mua khi số dư không đủ =================
    console.log('\n--- [TEST 4]: Chặn Mua Khi Không Đủ Vàng (Vòng LED RGB 4,500 Vàng > 2,500 Vàng) ---');
    const poorBuyRes = await fetch(`${BASE_URL}/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ itemId: 'frame_rainbow_rgb' }),
    });
    const poorBuyData = await poorBuyRes.json();

    if (poorBuyData.success) {
      throw new Error('TEST 4 Thất bại: Cho phép mua khi số dư không đủ tiền!');
    }
    if (poorBuyData.missingCoins !== 2000) {
      throw new Error(`TEST 4 Thất bại: Số vàng còn thiếu tính toán sai: ${poorBuyData.missingCoins}`);
    }
    console.log(`[TEST 4] ✅ Chặn mua khi thiếu tiền chính xác! Thiếu: ${poorBuyData.missingCoins} Vàng.`);

    // ================= TEST 5: Mua Khung Halloween (1,800 Vàng) =================
    console.log('\n--- [TEST 5]: Mua Khung Avatar Bí Ngô Halloween (1,800 Vàng) ---');
    const buyFrameRes = await fetch(`${BASE_URL}/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ itemId: 'frame_halloween' }),
    });
    const buyFrameData = await buyFrameRes.json();

    if (!buyFrameData.success || buyFrameData.userCoins !== 700) {
      throw new Error(`TEST 5 Thất bại: Mua khung avatar không thành công! (Số dư: ${buyFrameData.userCoins})`);
    }
    if (buyFrameData.equippedAvatarFrame !== 'frame_halloween') {
      throw new Error('TEST 5 Thất bại: Khung avatar chưa được tự động trang bị!');
    }
    console.log(`[TEST 5] ✅ Mua khung thành công! Số dư còn lại: ${buyFrameData.userCoins} Vàng. Khung trang bị: ${buyFrameData.equippedAvatarFrame}.`);

    // ================= TEST 6: POST /api/shop/equip (Đổi Trang Bị) =================
    console.log('\n--- [TEST 6]: Đổi Trang Bị Giữa Các Vật Phẩm Đã Sở Hữu ---');
    // Đổi về Skin Cổ Điển
    const equipRes = await fetch(`${BASE_URL}/equip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ itemId: 'skin_classic' }),
    });
    const equipData = await equipRes.json();

    if (!equipData.success || equipData.equippedCardSkin !== 'skin_classic') {
      throw new Error('TEST 6 Thất bại: Đổi về skin_classic không thành công!');
    }

    // Đổi lại Skin Halloween
    const reEquipRes = await fetch(`${BASE_URL}/equip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ itemId: 'skin_halloween' }),
    });
    const reEquipData = await reEquipRes.json();

    if (!reEquipData.success || reEquipData.equippedCardSkin !== 'skin_halloween') {
      throw new Error('TEST 6 Thất bại: Trang bị lại skin_halloween không thành công!');
    }
    console.log(`[TEST 6] ✅ Đổi trang bị mượt mà! Hiện đang trang bị: ${reEquipData.equippedCardSkin}`);

    // ================= TEST 7: Chặn trang bị vật phẩm chưa sở hữu =================
    console.log('\n--- [TEST 7]: Chặn Trang Bị Vật Phẩm Chưa Sở Hữu (skin_gold_luxury) ---');
    const illegalEquipRes = await fetch(`${BASE_URL}/equip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({ itemId: 'skin_gold_luxury' }),
    });
    const illegalEquipData = await illegalEquipRes.json();

    if (illegalEquipData.success) {
      throw new Error('TEST 7 Thất bại: Cho phép trang bị vật phẩm khi chưa sở hữu!');
    }
    console.log(`[TEST 7] ✅ Đã chặn trang bị bất hợp pháp chính xác: "${illegalEquipData.message}"`);

    // ================= TEST 8: Kiểm tra tính toàn vẹn trong MongoDB Atlas =================
    console.log('\n--- [TEST 8]: Kiểm Tra Dữ Liệu Đồng Bộ Trong MongoDB Atlas ---');
    const updatedUser = await User.findById(testUser._id);

    if (updatedUser.coins !== 700) {
      throw new Error(`TEST 8 Thất bại: Số dư trong DB sai: ${updatedUser.coins} (Kỳ vọng: 700)`);
    }
    if (!updatedUser.inventory.includes('skin_halloween') || !updatedUser.inventory.includes('frame_halloween')) {
      throw new Error('TEST 8 Thất bại: Inventory trong DB thiếu vật phẩm vừa mua!');
    }
    if (updatedUser.equippedCardSkin !== 'skin_halloween' || updatedUser.equippedAvatarFrame !== 'frame_halloween') {
      throw new Error('TEST 8 Thất bại: Trang bị lưu trong DB không chính xác!');
    }

    console.log(`[TEST 8] ✅ MongoDB Atlas xác thực hoàn hảo: Coins = ${updatedUser.coins}, Skin = ${updatedUser.equippedCardSkin}, Frame = ${updatedUser.equippedAvatarFrame}`);

    // Dọn dẹp
    await User.findByIdAndDelete(testUser._id);
    console.log('\n[Cleanup] ✅ Đã dọn dẹp tài khoản thử nghiệm.');

    console.log('\n===============================================================');
    console.log('   🎉 TOÀN BỘ 8/8 BÀI TEST CỬA HÀNG TASK 5 ĐÃ VƯỢT QUA 100%!');
    console.log('===============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ LỖI KIỂM THỬ TASK 5:', err.message);
    if (testUser) {
      try {
        await User.findByIdAndDelete(testUser._id);
      } catch {}
    }
    process.exit(1);
  }
}

runShopTests();
