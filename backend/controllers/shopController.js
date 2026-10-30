const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');
const { SHOP_ITEMS, getShopItemById } = require('../config/shopItems');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'neo_uno_super_secret_jwt_key_2026_xyz';

// Helper lấy user từ request (tự động phân tích Token hoặc query userId)
async function resolveUserFromReq(req) {
  // 1. Thử từ req.user (nếu đã qua middleware requireAuth)
  if (req.user) return req.user;

  // 2. Thử từ Bearer Token ở header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.id) {
        const u = await User.findById(decoded.id);
        if (u) return u;
      }
    } catch {}
  }

  // 3. Thử từ query userId hoặc body userId (dành cho guest / testing)
  const userId = req.query?.userId || req.body?.userId;
  if (userId) {
    try {
      const u = await User.findById(userId);
      if (u) return u;
      const uByNick = await User.findOne({ nickname: userId });
      if (uByNick) return uByNick;
    } catch {}
  }

  return null;
}

/**
 * 1. LẤY TOÀN BỘ DANH MỤC CỬA HÀNG (GET /api/shop/items)
 * Tự động gắn cờ isOwned, isEquipped theo tài khoản đang đăng nhập
 */
exports.getShopCatalog = async (req, res) => {
  try {
    const user = await resolveUserFromReq(req);

    const userCoins = user ? (user.coins ?? 1000) : 0;
    const userInventory = user && Array.isArray(user.inventory)
      ? user.inventory
      : ['skin_classic', 'frame_default'];
    const equippedSkin = user?.equippedCardSkin || 'skin_classic';
    const equippedFrame = user?.equippedAvatarFrame || 'frame_default';

    const enrichedItems = SHOP_ITEMS.map((item) => {
      const isOwned = item.isDefault || userInventory.includes(item.id);
      const isEquipped =
        item.type === 'card_skin'
          ? equippedSkin === item.id
          : equippedFrame === item.id;
      const canAfford = userCoins >= item.price;

      return {
        ...item,
        isOwned,
        isEquipped,
        canAfford,
      };
    });

    return res.status(200).json({
      success: true,
      items: enrichedItems,
      userCoins,
      inventory: userInventory,
      equippedCardSkin: equippedSkin,
      equippedAvatarFrame: equippedFrame,
    });
  } catch (err) {
    console.error('[Shop GetCatalog Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tải danh mục Cửa Hàng!',
    });
  }
};

/**
 * 2. MUA VẬT PHẨM BẰNG TIỀN VÀNG (POST /api/shop/buy)
 * RÀNG BUỘC BẢO MẬT: Giao dịch Atomic chống race-condition & double-spending
 */
exports.buyItem = async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã vật phẩm cần mua (itemId)!',
      });
    }

    const item = getShopItemById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Vật phẩm không tồn tại trong danh mục Cửa Hàng!',
      });
    }

    const user = await resolveUserFromReq(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập tài khoản để thực hiện giao dịch!',
      });
    }

    // 1. Kiểm tra tài khoản có bị khóa không
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: `Tài khoản của bạn đã bị KHÓA! Lý do: ${user.banReason || 'Vi phạm an toàn'}`,
        isBanned: true,
      });
    }

    // Đảm bảo inventory luôn là mảng
    const currentInventory = Array.isArray(user.inventory) ? user.inventory : ['skin_classic', 'frame_default'];

    // 2. Kiểm tra nếu đã sở hữu
    if (item.isDefault || currentInventory.includes(item.id)) {
      return res.status(400).json({
        success: false,
        message: `Bạn đã sở hữu vật phẩm "${item.name}" này từ trước rồi!`,
      });
    }

    // 3. Kiểm tra số dư tiền Vàng
    const currentCoins = user.coins ?? 0;
    if (currentCoins < item.price) {
      const missing = item.price - currentCoins;
      return res.status(400).json({
        success: false,
        message: `Số dư Vàng không đủ! Bạn đang có 🪙 ${currentCoins.toLocaleString()} Vàng (còn thiếu 🪙 ${missing.toLocaleString()} Vàng). Hãy thi đấu thêm để kiếm Vàng!`,
        currentCoins,
        missingCoins: missing,
      });
    }

    // 4. THỰC THI GIAO DỊCH ATOMIC CHỐNG HACK TIỀN / CONCURRENCY SPEND
    const updateOps = {
      $inc: { coins: -item.price },
      $addToSet: { inventory: item.id },
    };
    if (item.type === 'card_skin') {
      updateOps.$set = { equippedCardSkin: item.id };
    } else if (item.type === 'avatar_frame') {
      updateOps.$set = { equippedAvatarFrame: item.id };
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        coins: { $gte: item.price },
        inventory: { $ne: item.id },
      },
      updateOps,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      // Ghi log hành vi nghi vấn gian lận concurrency
      await SecurityLog.create({
        userId: user._id,
        action: 'SUSPICIOUS_EXPLOIT_ATTEMPT',
        severity: 'warning',
        details: {
          attempt: 'CONCURRENT_DOUBLE_SPEND_BLOCKED',
          itemId: item.id,
          price: item.price,
          originalCoins: user.coins,
        },
        performedBy: user.nickname || 'USER',
        ipAddress: req.ip || req.connection?.remoteAddress,
      });

      return res.status(400).json({
        success: false,
        message: 'Giao dịch bị từ chối: Số dư không đủ hoặc vật phẩm đã được mua trên một tiến trình khác!',
      });
    }

    // 5. GHI NHẬN KIỂM TOÁN AN NINH (Security Audit Log)
    await SecurityLog.create({
      userId: user._id,
      action: 'SHOP_BUY',
      severity: 'info',
      details: {
        itemId: item.id,
        itemName: item.name,
        itemType: item.type,
        price: item.price,
        remainingCoins: updatedUser.coins,
      },
      performedBy: user.nickname || 'USER',
      ipAddress: req.ip || req.connection?.remoteAddress,
    });

    console.log(
      `[Shop] 🛒 Người chơi ${updatedUser.nickname} đã mua thành công "${item.name}" với giá ${item.price} Vàng (Atomic). Số dư mới: ${updatedUser.coins}`
    );

    return res.status(200).json({
      success: true,
      message: `🎉 Chúc mừng! Bạn đã mở khóa thành công "${item.name}" và đã được tự động trang bị!`,
      item,
      userCoins: updatedUser.coins,
      inventory: updatedUser.inventory,
      equippedCardSkin: updatedUser.equippedCardSkin,
      equippedAvatarFrame: updatedUser.equippedAvatarFrame,
    });
  } catch (err) {
    console.error('[Shop BuyItem Error]:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Lỗi giao dịch máy chủ khi mua vật phẩm!',
    });
  }
};

/**
 * 3. TRANG BỊ / ĐỔI TRANG BỊ VẬT PHẨM (POST /api/shop/equip)
 */
exports.equipItem = async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã vật phẩm cần trang bị (itemId)!',
      });
    }

    const item = getShopItemById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Vật phẩm không tồn tại trong Cửa Hàng!',
      });
    }

    const user = await resolveUserFromReq(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập tài khoản!',
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: `Tài khoản đã bị KHÓA! Lý do: ${user.banReason || 'Vi phạm an toàn'}`,
        isBanned: true,
      });
    }

    if (!Array.isArray(user.inventory)) {
      user.inventory = ['skin_classic', 'frame_default'];
    }

    // Kiểm tra xem người dùng đã sở hữu vật phẩm này chưa
    const isOwned = item.isDefault || user.inventory.includes(item.id);
    if (!isOwned) {
      return res.status(403).json({
        success: false,
        message: `Bạn chưa sở hữu vật phẩm "${item.name}"! Vui lòng mua trước khi trang bị.`,
      });
    }

    // Tiến hành trang bị
    if (item.type === 'card_skin') {
      user.equippedCardSkin = item.id;
    } else if (item.type === 'avatar_frame') {
      user.equippedAvatarFrame = item.id;
    }

    await user.save();

    // Ghi nhận Audit Log
    await SecurityLog.create({
      userId: user._id,
      action: 'SHOP_EQUIP',
      severity: 'info',
      details: {
        itemId: item.id,
        itemType: item.type,
      },
      performedBy: user.nickname || 'USER',
      ipAddress: req.ip || req.connection?.remoteAddress,
    });

    console.log(
      `[Shop] 👔 ${user.nickname} đã trang bị thành công ${item.type}: "${item.name}" (${item.id})`
    );

    return res.status(200).json({
      success: true,
      message: `Đã trang bị thành công "${item.name}"!`,
      equippedItem: item,
      equippedCardSkin: user.equippedCardSkin,
      equippedAvatarFrame: user.equippedAvatarFrame,
      inventory: user.inventory,
    });
  } catch (err) {
    console.error('[Shop EquipItem Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi trang bị vật phẩm!',
    });
  }
};
