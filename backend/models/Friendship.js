const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema(
  {
    requester: {
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
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'blocked'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// RÀNG BUỘC CƠ SỞ DỮ LIỆU: Không cho phép tạo trùng lặp quan hệ kết bạn theo cùng 1 chiều
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// COMPOUND INDEX: Tăng tốc truy vấn tìm kiếm bạn bè 2 chiều
friendshipSchema.index({ requester: 1, status: 1 });
friendshipSchema.index({ recipient: 1, status: 1 });

/**
 * THỦ TỤC CƠ SỞ DỮ LIỆU (DATABASE STORED PIPELINE):
 * Sử dụng Aggregation Pipeline kết hợp `$lookup`, `$match`, `$project`, `$facet`
 * Khai thác tối đa năng lực DBMS để lấy toàn bộ danh sách bạn bè, thông tin tài khoản,
 * và thống kê tin nhắn chưa đọc chỉ trong 1 truy vấn duy nhất.
 */
friendshipSchema.statics.getFriendsDetailedPipeline = async function (userId) {
  const uId = new mongoose.Types.ObjectId(String(userId));

  return await this.aggregate([
    // Bước 1: Lọc tất cả mối quan hệ đã accepted có sự tham gia của userId
    {
      $match: {
        $or: [{ requester: uId }, { recipient: uId }],
        status: 'accepted',
      },
    },
    // Bước 2: Xác định đâu là ID của người bạn (người đối diện)
    {
      $addFields: {
        friendUserId: {
          $cond: {
            if: { $eq: ['$requester', uId] },
            then: '$recipient',
            else: '$requester',
          },
        },
      },
    },
    // Bước 3: $lookup sang bảng users để lấy hồ sơ người bạn
    {
      $lookup: {
        from: 'users',
        localField: 'friendUserId',
        foreignField: '_id',
        as: 'friendUser',
      },
    },
    { $unwind: '$friendUser' },
    // Bước 4: $lookup sang bảng directmessages để đếm số tin nhắn chưa đọc từ người này
    {
      $lookup: {
        from: 'directmessages',
        let: { fId: '$friendUserId', myId: uId },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$sender', '$$fId'] },
                  { $eq: ['$recipient', '$$myId'] },
                  { $eq: ['$isRead', false] },
                ],
              },
            },
          },
          { $count: 'unreadCount' },
        ],
        as: 'unreadInfo',
      },
    },
    // Bước 5: $lookup lấy tin nhắn gần nhất giữa 2 người
    {
      $lookup: {
        from: 'directmessages',
        let: { fId: '$friendUserId', myId: uId },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $and: [
                      { $eq: ['$sender', '$$myId'] },
                      { $eq: ['$recipient', '$$fId'] },
                    ],
                  },
                  {
                    $and: [
                      { $eq: ['$sender', '$$fId'] },
                      { $eq: ['$recipient', '$$myId'] },
                    ],
                  },
                ],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: 'lastMessageInfo',
      },
    },
    // Bước 6: Định dạng cấu trúc trả về tối ưu cho client
    {
      $project: {
        _id: '$friendUser._id',
        accountId: {
          $ifNull: [
            '$friendUser.accountId',
            {
              $toUpper: {
                $substrCP: [{ $toString: '$friendUser._id' }, 14, 10],
              },
            },
          ],
        },
        friendshipId: '$_id',
        nickname: '$friendUser.nickname',
        email: '$friendUser.email',
        avatar: { $ifNull: ['$friendUser.avatar', 'avatar_1'] },
        elo: { $ifNull: ['$friendUser.elo', 1000] },
        coins: { $ifNull: ['$friendUser.coins', 1000] },
        level: { $ifNull: ['$friendUser.level', 1] },
        matchesWon: { $ifNull: ['$friendUser.matchesWon', 0] },
        friendSince: '$updatedAt',
        unreadCount: {
          $ifNull: [{ $arrayElemAt: ['$unreadInfo.unreadCount', 0] }, 0],
        },
        lastMessage: {
          $arrayElemAt: ['$lastMessageInfo.content', 0],
        },
        lastMessageAt: {
          $arrayElemAt: ['$lastMessageInfo.createdAt', 0],
        },
      },
    },
    { $sort: { lastMessageAt: -1, friendSince: -1 } },
  ]);
};

module.exports = mongoose.model('Friendship', friendshipSchema);
