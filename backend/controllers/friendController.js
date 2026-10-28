const Friendship = require('../models/Friendship');
const User = require('../models/User');
const userPresence = require('../socket/userPresence');

// 1. LẤY DANH SÁCH BẠN BÈ ĐÃ KẾT BẠN
exports.getFriends = async (req, res) => {
  try {
    const myId = req.user._id;

    const friendships = await Friendship.find({
      $or: [{ requester: myId }, { recipient: myId }],
      status: 'accepted',
    })
      .populate('requester', 'nickname email avatar elo coins level exp matchesWon')
      .populate('recipient', 'nickname email avatar elo coins level exp matchesWon')
      .sort({ updatedAt: -1 });

    const friends = friendships.map((f) => {
      const isRequester = f.requester._id.equals(myId);
      const friendUser = isRequester ? f.recipient : f.requester;
      const uid = String(friendUser._id);

      return {
        friendshipId: f._id,
        _id: friendUser._id,
        nickname: friendUser.nickname,
        email: friendUser.email,
        avatar: friendUser.avatar || 'avatar_1',
        elo: friendUser.elo ?? 1000,
        coins: friendUser.coins ?? 1000,
        level: friendUser.level ?? 1,
        exp: friendUser.exp ?? 0,
        matchesWon: friendUser.matchesWon ?? 0,
        isOnline: userPresence.isUserOnline(uid),
        status: userPresence.getUserStatus(uid),
        friendSince: f.updatedAt,
      };
    });

    // Sắp xếp ưu tiên: Bạn đang Online / In-game lên đầu
    friends.sort((a, b) => {
      if (a.isOnline === b.isOnline) return 0;
      return a.isOnline ? -1 : 1;
    });

    res.status(200).json({
      success: true,
      friends,
      total: friends.length,
    });
  } catch (err) {
    console.error('[Friend Controller Error - getFriends]:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy danh sách bạn bè!' });
  }
};

// 2. LẤY DANH SÁCH LỜI MỜI KẾT BẠN (CẢ NHẬN ĐƯỢC VÀ ĐÃ GỬI)
exports.getFriendRequests = async (req, res) => {
  try {
    const myId = req.user._id;

    // Lời mời người khác gửi cho mình (cần duyệt)
    const received = await Friendship.find({
      recipient: myId,
      status: 'pending',
    })
      .populate('requester', 'nickname email avatar elo coins level')
      .sort({ createdAt: -1 });

    // Lời mời chính mình đã gửi đi
    const sent = await Friendship.find({
      requester: myId,
      status: 'pending',
    })
      .populate('recipient', 'nickname email avatar elo coins level')
      .sort({ createdAt: -1 });

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

// 3. GỬI LỜI MỜI KẾT BẠN
exports.sendFriendRequest = async (req, res) => {
  try {
    const myId = req.user._id;
    const { targetUserId, nickname } = req.body;

    let targetUser = null;
    if (targetUserId) {
      targetUser = await User.findById(targetUserId);
    } else if (nickname) {
      targetUser = await User.findOne({
        nickname: { $regex: new RegExp(`^${nickname.trim()}$`, 'i') },
      });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người chơi cần kết bạn!',
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
        message: 'Không thể gửi lời mời kết bạn cho Bot AI!',
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
          message: 'Hai bạn đã là bạn bè của nhau rồi!',
        });
      }

      if (existing.status === 'pending') {
        if (existing.requester.equals(myId)) {
          return res.status(400).json({
            success: false,
            message: 'Bạn đã gửi lời mời rồi, hãy chờ đối phương chấp nhận nhé!',
          });
        } else {
          // Đối phương đã từng gửi cho mình trước đó -> Tự động chấp nhận luôn!
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
        // Cho phép gửi lại nếu từng bị từ chối
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

    // Tạo lời mời mới
    const newFriendship = await Friendship.create({
      requester: myId,
      recipient: targetUser._id,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: `Đã gửi lời mời kết bạn đến ${targetUser.nickname}!`,
      friendship: newFriendship,
    });
  } catch (err) {
    console.error('[Friend Controller Error - sendFriendRequest]:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi lời mời kết bạn!' });
  }
};

// 4. PHẢN HỒI LỜI MỜI KẾT BẠN (CHẤP NHẬN HOẶC TỪ CHỐI)
exports.respondFriendRequest = async (req, res) => {
  try {
    const myId = req.user._id;
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' hoặc 'decline'

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

// 6. TÌM KIẾM NGƯỜI CHƠI ĐỂ KẾT BẠN
exports.searchUsers = async (req, res) => {
  try {
    const myId = req.user._id;
    const query = req.query.q ? req.query.q.trim() : '';

    if (!query) {
      return res.status(200).json({ success: true, users: [] });
    }

    // Tìm theo nickname hoặc email (không phân biệt hoa thường, trừ chính mình và bot)
    const users = await User.find({
      _id: { $ne: myId },
      role: { $ne: 'bot' },
      $or: [
        { nickname: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    })
      .select('nickname email avatar elo coins level')
      .limit(10);

    // Xác định quan hệ bạn bè với từng user tìm được
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
