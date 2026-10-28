const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Nội dung tin nhắn không được để trống'],
      trim: true,
      maxlength: [500, 'Tin nhắn tối đa 500 ký tự'],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// TỐI ƯU HÓA HỆ QUẢN TRỊ CSDL (COMPOUND INDEXES): Tăng tốc truy vấn hội thoại 2 chiều và đếm tin chưa đọc
directMessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
directMessageSchema.index({ recipient: 1, isRead: 1 });

// THỦ TỤC 1: Lấy lịch sử hội thoại 2 chiều giữa 2 người bạn kèm phân trang
directMessageSchema.statics.getConversation = async function (user1Id, user2Id, options = {}) {
  const limit = Math.min(Math.max(parseInt(options.limit, 10) || 50, 1), 100);
  const u1 = new mongoose.Types.ObjectId(String(user1Id));
  const u2 = new mongoose.Types.ObjectId(String(user2Id));

  const query = {
    $or: [
      { sender: u1, recipient: u2 },
      { sender: u2, recipient: u1 },
    ],
  };

  if (options.before) {
    query.createdAt = { $lt: new Date(options.before) };
  }

  const messages = await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'nickname avatar')
    .lean();

  return messages.reverse(); // Đảo lại theo thứ tự thời gian tăng dần để hiển thị khung chat
};

// THỦ TỤC 2: Đánh dấu đã đọc toàn bộ tin nhắn từ một người bạn gửi tới (Bulk Operation)
directMessageSchema.statics.markConversationAsRead = async function (recipientId, senderId) {
  const rId = new mongoose.Types.ObjectId(String(recipientId));
  const sId = new mongoose.Types.ObjectId(String(senderId));

  const result = await this.updateMany(
    {
      recipient: rId,
      sender: sId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );

  return result.modifiedCount;
};

// THỦ TỤC 3: Aggregation Pipeline đếm số lượng tin nhắn chưa đọc phân nhóm theo từng bạn bè
directMessageSchema.statics.getUnreadCountsGrouped = async function (recipientId) {
  const rId = new mongoose.Types.ObjectId(String(recipientId));

  const results = await this.aggregate([
    {
      $match: {
        recipient: rId,
        isRead: false,
      },
    },
    {
      $group: {
        _id: '$sender',
        count: { $sum: 1 },
        lastMessage: { $last: '$content' },
        lastMessageAt: { $last: '$createdAt' },
      },
    },
  ]);

  const map = {};
  results.forEach((item) => {
    map[String(item._id)] = {
      count: item.count,
      lastMessage: item.lastMessage,
      lastMessageAt: item.lastMessageAt,
    };
  });
  return map;
};

module.exports = mongoose.model('DirectMessage', directMessageSchema);
