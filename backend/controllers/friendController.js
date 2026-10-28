const mongoose = require('mongoose');
const Friendship = require('../models/Friendship');
const User = require('../models/User');
const DirectMessage = require('../models/DirectMessage');
const userPresence = require('../socket/userPresence');

// 1. LẤY DANH SÁCH BẠN BÈ (SỬ DỤNG DATABASE AGGREGATION PIPELINE NÂNG CAO)
exports.getFriends = async (req, res) => {
  try {
    const myId = req.user._id;

    // Khai thác hàm thủ tục cơ sở dữ liệu (Database Aggregation Pipeline)
    const pipelineFriends = await Friendship.getFriendsDetailedPipeline(myId);

    // Bổ sung trạng thái Online Presence từ Socket Memory
    const enrichedFriends = pipelineFriends.map((f) => {
      const uid = String(f._id);
      const isOnline = userPresence.isUserOnline(uid);
      const status = userPresence.getUserStatus(uid);

      return {
        ...f,
        isOnline,
        status,
      };
    });

    // Sắp xếp ưu tiên: Người đang Online / In-game hoặc có tin nhắn mới lên đầu
    enrichedFriends.sort((a, b) => {
      if ((b.unreadCount || 0) !== (a.unreadCount || 0)) {
        return (b.unreadCount || 0) - (a.unreadCount || 0);
      }
      if (a.isOnline === b.isOnline) return 0;
      return a.isOnline ? -1 : 1;
    });

    res.status(200).json({
      success: true,
      friends: enrichedFriends,
      total: enrichedFriends.length,
    });
  } catch (err) {
    console.error('[Friend Controller Error - getFriends]:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách bạn bè!' });
  }
};

// 2. LẤY DANH SÁCH LỜI MỜI KẾT BẠN
exports.getFriendRequests = async (req, res) => {
  try {
    const myId = req.user._id;

    const [received, sent] = await Promise.all([
      Friendship.find({ recipient: myId, status: 'pending' })
        .populate('requester', 'nickname email avatar elo coins level accountId')
        .sort({ createdAt: -1 }),
      Friendship.find({ requester: myId, status: 'pending' })
        .populate('recipient', 'nickname email avatar elo coins level accountId')
        .sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      received: received.map((r) => ({
        requestId: r._id,
        user: r.requester,
        createdAt: r.createdAt,
      })),
      sent: sent.map((s) => ({
        requestId: s._id,
        user: s.recipient,
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    console.error('[Friend Controller Error - getFriendRequests]:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách lời mời kết bạn!' });
  }
};

// 3. GỬI LỜI MỜI KẾT BẠN (HỖ TRỢ CẢ NICKNAME VÀ ID TÀI KHOẢN)
exports.sendFriendRequest = async (req, res) => {
  try {
    const myId = req.user._id;
    const { targetUserId, nickname, identifier } = req.body;

    const searchTarget = identifier || targetUserId || nickname;
    if (!searchTarget) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp Tên người chơi hoặc ID tài khoản để kết bạn!',
      });
    }

    // Khai thác static function tìm kiếm thông minh theo Nickname hoặc ID
    const targetUser = await User.findByNicknameOrId(searchTarget);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy tài khoản người chơi với thông tin "${searchTarget}"!`,
      });
    }

    if (targetUser._id.equals(myId)) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự gửi lời mời kết bạn cho chính mình!',
      });
    }

    if (targetUser.role === 'bot') {
      return res.status(400).json({
        success: false,
        message: 'Không thể kết bạn với Bot AI!',
      });
    }

    // Kiểm tra mối quan hệ hiện tại
    const existing = await Friendship.findOne({
      $or: [
        { requester: myId, recipient: targetUser._id },
        { requester: targetUser._id, recipient: myId },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({
          success: false,
          message: `Bạn và ${targetUser.nickname} đã là bạn bè của nhau rồi!`,
        });
      }

      if (existing.status === 'pending') {
        if (existing.requester.equals(myId)) {
          return res.status(400).json({
            success: false,
            message: 'Bạn đã gửi lời mời trước đó, vui lòng chờ đối phương phản hồi nhé!',
          });
        } else {
          // Đối phương đã từng gửi cho mình trước đó -> Tự động chấp nhận luôn
          existing.status = 'accepted';
          await existing.save();

          return res.status(200).json({
            success: true,
            isMutualAccept: true,
            message: `Đối phương cũng vừa gửi lời mời cho bạn! Hai bạn đã trở thành bạn bè!`,
            friendship: existing,
          });
        }
      }

      if (existing.status === 'declined') {
        existing.requester = myId;
        existing.recipient = targetUser._id;
        existing.status = 'pending';
        await existing.save();

        return res.status(200).json({
          success: true,
          message: `Đã gửi lại lời mời kết bạn đến ${targetUser.nickname}!`,
          friendship: existing,
        });
      }
    }

    // Tạo mới lời mời
    const newFriendship = await Friendship.create({
      requester: myId,
      recipient: targetUser._id,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: `Đã gửi lời mời kết bạn đến ${targetUser.nickname} (ID: ${targetUser._id})!`,
      friendship: newFriendship,
    });
  } catch (err) {
    console.error('[Friend Controller Error - sendFriendRequest]:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi lời mời kết bạn!' });
  }
};

// 4. PHẢN HỒI LỜI MỜI KẾT BẠN
exports.respondFriendRequest = async (req, res) => {
  try {
    const myId = req.user._id;
    const { requestId } = req.params;
    const { action } = req.body;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Hành động không hợp lệ! Chỉ chấp nhận 'accept' hoặc 'decline'.",
      });
    }

    const friendship = await Friendship.findById(requestId).populate('requester', 'nickname avatar');
    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: 'Lời mời kết bạn không tồn tại hoặc đã bị hủy!',
      });
    }

    if (!friendship.recipient.equals(myId)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xử lý lời mời kết bạn này!',
      });
    }

    if (action === 'accept') {
      friendship.status = 'accepted';
      await friendship.save();

      return res.status(200).json({
        success: true,
        action: 'accepted',
        message: `Đã đồng ý kết bạn với ${friendship.requester?.nickname || 'người chơi'}!`,
        friendship,
      });
    } else {
      await Friendship.findByIdAndDelete(requestId);
      return res.status(200).json({
        success: true,
        action: 'declined',
        message: 'Đã từ chối lời mời kết bạn!',
      });
    }
  } catch (err) {
    console.error('[Friend Controller Error - respondFriendRequest]:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi xử lý phản hồi lời mời kết bạn!' });
  }
};

// 5. HỦY KẾT BẠN (UNFRIEND)
exports.removeFriend = async (req, res) => {
  try {
    const myId = req.user._id;
    const { friendId } = req.params;

    const friendship = await Friendship.findOneAndDelete({
      $or: [
        { requester: myId, recipient: friendId },
        { requester: friendId, recipient: myId },
      ],
      status: 'accepted',
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy quan hệ bạn bè để hủy!',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã hủy kết bạn thành công!',
    });
  } catch (err) {
    console.error('[Friend Controller Error - removeFriend]:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi hủy kết bạn!' });
  }
};

// 6. TÌM KIẾM NGƯỜI CHƠI (TÌM BẰNG CẢ NICKNAME VÀ ID TÀI KHOẢN)
exports.searchUsers = async (req, res) => {
  try {
    const myId = req.user._id;
    const query = req.query.q ? req.query.q.trim() : '';

    if (!query) {
      return res.status(200).json({ success: true, users: [] });
    }

    const searchConditions = [];

    // Nếu người dùng nhập ID tài khoản 10 ký tự
    if (query.length === 10) {
      searchConditions.push({ accountId: query.toUpperCase() });
    }

    // Nếu người dùng nhập ID tài khoản ObjectId (24 hex)
    if (mongoose.Types.ObjectId.isValid(query) && query.length === 24) {
      searchConditions.push({ _id: new mongoose.Types.ObjectId(query) });
    }

    // Tìm theo Nickname hoặc Email
    searchConditions.push(
      { nickname: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    );

    const users = await User.find({
      _id: { $ne: myId },
      role: { $ne: 'bot' },
      $or: searchConditions,
    })
      .select('nickname email avatar elo coins level accountId')
      .limit(10);

    const userIds = users.map((u) => u._id);
    const existingFriendships = await Friendship.find({
      $or: [
        { requester: myId, recipient: { $in: userIds } },
        { requester: { $in: userIds }, recipient: myId },
      ],
    });

    const enrichedUsers = users.map((u) => {
      const rel = existingFriendships.find(
        (f) =>
          (f.requester.equals(myId) && f.recipient.equals(u._id)) ||
          (f.requester.equals(u._id) && f.recipient.equals(myId))
      );

      let relationship = 'none';
      let friendshipId = null;

      if (rel) {
        friendshipId = rel._id;
        if (rel.status === 'accepted') {
          relationship = 'friend';
        } else if (rel.status === 'pending') {
          relationship = rel.requester.equals(myId) ? 'pending_sent' : 'pending_received';
        }
      }

      const uid = String(u._id);
      return {
        _id: u._id,
        accountId: u.accountId || u._id.toString().substring(14).toUpperCase(),
        nickname: u.nickname,
        avatar: u.avatar || 'avatar_1',
        elo: u.elo ?? 1000,
        level: u.level ?? 1,
        relationship,
        friendshipId,
        isOnline: userPresence.isUserOnline(uid),
        status: userPresence.getUserStatus(uid),
      };
    });

    res.status(200).json({
      success: true,
      users: enrichedUsers,
    });
  } catch (err) {
    console.error('[Friend Controller Error - searchUsers]:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi tìm kiếm người chơi!' });
  }
};

// 7. LẤY HỘI THOẠI TIN NHẮN TRỰC TIẾP (DIRECT CHAT - TASK 2)
exports.getDirectMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const { friendId } = req.params;
    const { limit = 50, before } = req.query;

    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ success: false, message: 'ID bạn bè không hợp lệ!' });
    }

    // Xác thực người này có phải là bạn bè không
    const isFriend = await Friendship.findOne({
      $or: [
        { requester: myId, recipient: friendId },
        { requester: friendId, recipient: myId },
      ],
      status: 'accepted',
    });

    if (!isFriend) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể trò chuyện với người đã kết bạn!',
      });
    }

    // Khai thác Stored Procedure lấy tin nhắn
    const messages = await DirectMessage.getConversation(myId, friendId, { limit, before });

    // Đánh dấu đã đọc các tin nhắn gửi đến mình (Bulk Update)
    await DirectMessage.markConversationAsRead(myId, friendId);

    res.status(200).json({
      success: true,
      messages,
      total: messages.length,
    });
  } catch (err) {
    console.error('[Friend Controller Error - getDirectMessages]:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi tải lịch sử tin nhắn!' });
  }
};

// 8. GỬI TIN NHẮN TRỰC TIẾP CHO BẠN BÈ (DIRECT CHAT - TASK 2)
exports.sendDirectMessage = async (req, res) => {
  try {
    const myId = req.user._id;
    const { friendId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống!' });
    }

    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ success: false, message: 'ID người nhận không hợp lệ!' });
    }

    // Xác thực quan hệ bạn bè
    const isFriend = await Friendship.findOne({
      $or: [
        { requester: myId, recipient: friendId },
        { requester: friendId, recipient: myId },
      ],
      status: 'accepted',
    });

    if (!isFriend) {
      return res.status(403).json({
        success: false,
        message: 'Hai người chưa là bạn bè, không thể nhắn tin trực tiếp!',
      });
    }

    // Tạo bản ghi tin nhắn mới
    const messageDoc = await DirectMessage.create({
      sender: myId,
      recipient: friendId,
      content: content.trim(),
    });

    const populatedMsg = await messageDoc.populate('sender', 'nickname avatar');

    res.status(201).json({
      success: true,
      message: populatedMsg,
    });
  } catch (err) {
    console.error('[Friend Controller Error - sendDirectMessage]:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi tin nhắn!' });
  }
};
