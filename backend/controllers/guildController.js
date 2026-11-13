const mongoose = require('mongoose');
const Guild = require('../models/Guild');
const User = require('../models/User');

const GUILD_CREATION_COST = 2000;

// Bảng ngưỡng EXP và Giới hạn thành viên theo Cấp Bang Hội
const GUILD_LEVEL_THRESHOLDS = [
  { level: 1, expRequired: 0, maxMembers: 15 },
  { level: 2, expRequired: 1000, maxMembers: 16 },
  { level: 3, expRequired: 2500, maxMembers: 18 },
  { level: 4, expRequired: 5000, maxMembers: 20 },
  { level: 5, expRequired: 8000, maxMembers: 22 },
  { level: 6, expRequired: 12000, maxMembers: 24 },
  { level: 7, expRequired: 17000, maxMembers: 26 },
  { level: 8, expRequired: 23000, maxMembers: 28 },
  { level: 9, expRequired: 30000, maxMembers: 29 },
  { level: 10, expRequired: 40000, maxMembers: 30 },
];

function calculateGuildLevel(totalExp) {
  let level = 1;
  let maxMembers = 15;
  for (let i = GUILD_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalExp >= GUILD_LEVEL_THRESHOLDS[i].expRequired) {
      level = GUILD_LEVEL_THRESHOLDS[i].level;
      maxMembers = GUILD_LEVEL_THRESHOLDS[i].maxMembers;
      break;
    }
  }
  return { level, maxMembers };
}

/**
 * [GET] /api/guilds
 * Danh sách Bang Hội công khai
 */
exports.getGuilds = async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { tag: { $regex: s, $options: 'i' } },
      ];
    }

    const guilds = await Guild.find(query)
      .sort({ level: -1, exp: -1, createdAt: -1 })
      .limit(30)
      .lean();

    const formattedGuilds = guilds.map((g) => ({
      id: g._id,
      name: g.name,
      tag: g.tag,
      slogan: g.slogan,
      emblem: g.emblem,
      level: g.level,
      exp: g.exp,
      memberCount: g.members?.length || 0,
      maxMembers: g.maxMembers,
      treasuryCoins: g.treasuryCoins,
      leaderId: g.leaderId,
    }));

    return res.status(200).json({
      success: true,
      guilds: formattedGuilds,
      creationCost: GUILD_CREATION_COST,
    });
  } catch (err) {
    console.error('[Guild] ❌ Lỗi getGuilds:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [GET] /api/guilds/my-guild
 * Lấy thông tin Bang Hội chi tiết của người chơi
 */
exports.getMyGuild = async (req, res) => {
  try {
    const userId = req.user?.id || req.query?.userId;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(200).json({ success: true, guild: null });
    }

    const guild = await Guild.findOne({ 'members.userId': userId });
    if (!guild) {
      return res.status(200).json({ success: true, guild: null });
    }

    const memberInfo = guild.members.find((m) => m.userId.toString() === userId.toString());
    const nextLevelConfig = GUILD_LEVEL_THRESHOLDS.find((t) => t.level === guild.level + 1);

    return res.status(200).json({
      success: true,
      guild: {
        id: guild._id,
        name: guild.name,
        tag: guild.tag,
        slogan: guild.slogan,
        emblem: guild.emblem,
        level: guild.level,
        exp: guild.exp,
        nextLevelExp: nextLevelConfig ? nextLevelConfig.expRequired : guild.exp,
        treasuryCoins: guild.treasuryCoins,
        maxMembers: guild.maxMembers,
        members: guild.members,
        chatMessages: guild.chatMessages?.slice(-40) || [],
        myRole: memberInfo?.role || 'member',
        myContribution: memberInfo?.contributionPoints || 0,
      },
    });
  } catch (err) {
    console.error('[Guild] ❌ Lỗi getMyGuild:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [POST] /api/guilds/create
 * Thành lập Bang Hội mới (Phí 2,000 Vàng)
 */
exports.createGuild = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    const { name, tag, slogan, emblem } = req.body;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để thành lập Bang Hội!',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản!' });
    }

    // 1. Kiểm tra đã có bang chưa
    if (user.guild?.guildId) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đang thuộc một Bang Hội khác! Vui lòng rời bang hiện tại trước khi tạo mới.',
      });
    }

    // 2. Kiểm tra số dư Vàng
    if ((user.coins || 0) < GUILD_CREATION_COST) {
      return res.status(400).json({
        success: false,
        message: `Số dư không đủ! Cần ${GUILD_CREATION_COST.toLocaleString()} Vàng để thành lập Bang Hội.`,
      });
    }

    // 3. Chuẩn hóa & Xác thực Tag và Tên Bang
    if (!name || name.trim().length < 3 || name.trim().length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Tên Bang Hội phải từ 3 đến 30 ký tự!',
      });
    }

    const cleanTag = (tag || '').trim().toUpperCase();
    if (!cleanTag || cleanTag.length < 2 || cleanTag.length > 6 || !/^[A-Z0-9]+$/.test(cleanTag)) {
      return res.status(400).json({
        success: false,
        message: 'Tag Bang Hội phải từ 2 đến 6 ký tự chữ hoa hoặc số (VD: NEO, CYBER, TITAN)!',
      });
    }

    const existingTag = await Guild.findOne({ tag: cleanTag });
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: `Tag [${cleanTag}] đã được sử dụng bởi Bang Hội khác! Vui lòng chọn Tag khác.`,
      });
    }

    // 4. Trừ tiền Vàng & Tạo Bang Hội
    user.coins -= GUILD_CREATION_COST;

    const newGuild = new Guild({
      name: name.trim(),
      tag: cleanTag,
      slogan: slogan?.trim() || 'Gia nhập quân đoàn Cyberpunk cùng chiến đấu và thống trị đấu trường!',
      emblem: emblem || '🛡️',
      leaderId: user._id,
      level: 1,
      exp: 0,
      treasuryCoins: 0,
      maxMembers: 15,
      members: [
        {
          userId: user._id,
          nickname: user.nickname || user.username,
          avatar: user.avatar || 'avatar_1',
          elo: user.elo || 1200,
          role: 'leader',
          joinedAt: new Date(),
          contributionPoints: 100,
        },
      ],
      chatMessages: [
        {
          senderId: 'system',
          senderName: 'Hệ Thống',
          senderAvatar: '🛡️',
          senderRole: 'system',
          message: `Bang Hội [${cleanTag}] ${name.trim()} đã được thành lập thành công bởi ${user.nickname || user.username}!`,
          createdAt: new Date(),
        },
      ],
    });

    await newGuild.save();

    // 5. Cập nhật thông tin User
    user.guild = {
      guildId: newGuild._id,
      guildTag: newGuild.tag,
      guildName: newGuild.name,
      role: 'leader',
    };
    await user.save();

    return res.status(201).json({
      success: true,
      message: `Chúc mừng bạn đã thành lập thành công Bang Hội [${newGuild.tag}] ${newGuild.name}!`,
      guild: newGuild,
      user,
    });
  } catch (err) {
    console.error('[Guild] ❌ Lỗi createGuild:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [POST] /api/guilds/join
 * Gia nhập Bang Hội
 */
exports.joinGuild = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    const { guildId } = req.body;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để gia nhập Bang Hội!',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản!' });
    }

    if (user.guild?.guildId) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã là thành viên của một Bang Hội! Vui lòng rời bang cũ trước.',
      });
    }

    if (!guildId || !mongoose.isValidObjectId(guildId)) {
      return res.status(400).json({ success: false, message: 'Mã Bang Hội không hợp lệ!' });
    }

    const guild = await Guild.findById(guildId);
    if (!guild) {
      return res.status(404).json({ success: false, message: 'Bang Hội không tồn tại!' });
    }

    if (guild.members.length >= guild.maxMembers) {
      return res.status(400).json({
        success: false,
        message: `Bang Hội đã đạt giới hạn tối đa ${guild.maxMembers} thành viên!`,
      });
    }

    const newMember = {
      userId: user._id,
      nickname: user.nickname || user.username,
      avatar: user.avatar || 'avatar_1',
      elo: user.elo || 1200,
      role: 'member',
      joinedAt: new Date(),
      contributionPoints: 0,
    };

    guild.members.push(newMember);
    guild.chatMessages.push({
      senderId: 'system',
      senderName: 'Hệ Thống',
      senderAvatar: '🛡️',
      senderRole: 'system',
      message: `Chào mừng ${user.nickname || user.username} đã gia nhập Bang Hội!`,
      createdAt: new Date(),
    });

    await guild.save();

    user.guild = {
      guildId: guild._id,
      guildTag: guild.tag,
      guildName: guild.name,
      role: 'member',
    };
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Chào mừng bạn đã gia nhập Bang Hội [${guild.tag}] ${guild.name}!`,
      guild,
      user,
    });
  } catch (err) {
    console.error('[Guild] ❌ Lỗi joinGuild:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [POST] /api/guilds/leave
 * Rời khỏi Bang Hội
 */
exports.leaveGuild = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập!' });
    }

    const user = await User.findById(userId);
    if (!user || !user.guild?.guildId) {
      return res.status(400).json({ success: false, message: 'Bạn chưa tham gia Bang Hội nào!' });
    }

    const guild = await Guild.findById(user.guild.guildId);
    if (!guild) {
      user.guild = { guildId: null, guildTag: null, guildName: null, role: null };
      await user.save();
      return res.status(200).json({ success: true, message: 'Đã cập nhật trạng thái tự do.' });
    }

    const isLeader = guild.leaderId.toString() === userId.toString();

    if (isLeader) {
      // Nếu Bang Chủ muốn rời:
      if (guild.members.length > 1) {
        // Chuyển quyền cho thành viên tiếp theo có điểm cống hiến cao nhất
        const otherMembers = guild.members.filter((m) => m.userId.toString() !== userId.toString());
        otherMembers.sort((a, b) => (b.contributionPoints || 0) - (a.contributionPoints || 0));
        const newLeader = otherMembers[0];

        guild.leaderId = newLeader.userId;
        newLeader.role = 'leader';
        guild.members = otherMembers;

        await User.findByIdAndUpdate(newLeader.userId, { 'guild.role': 'leader' });

        guild.chatMessages.push({
          senderId: 'system',
          senderName: 'Hệ Thống',
          senderAvatar: '🛡️',
          senderRole: 'system',
          message: `Bang Chủ cũ đã rời bang. Quyền Bang Chủ được trao cho ${newLeader.nickname}!`,
          createdAt: new Date(),
        });
        await guild.save();
      } else {
        // Chỉ có 1 mình Bang Chủ -> Giải tán Bang Hội
        await Guild.findByIdAndDelete(guild._id);
      }
    } else {
      // Thành viên bình thường rời bang
      guild.members = guild.members.filter((m) => m.userId.toString() !== userId.toString());
      guild.chatMessages.push({
        senderId: 'system',
        senderName: 'Hệ Thống',
        senderAvatar: '🛡️',
        senderRole: 'system',
        message: `${user.nickname || user.username} đã rời khỏi Bang Hội.`,
        createdAt: new Date(),
      });
      await guild.save();
    }

    user.guild = { guildId: null, guildTag: null, guildName: null, role: null };
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Bạn đã rời khỏi Bang Hội thành công!',
      user,
    });
  } catch (err) {
    console.error('[Guild] ❌ Lỗi leaveGuild:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [POST] /api/guilds/donate
 * Đóng góp Vàng vào Quỹ Bang Hội & Tích lũy EXP thăng cấp
 */
exports.donateCoins = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    const amount = Number(req.body?.amount);

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập!' });
    }

    if (!amount || amount < 50 || amount > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Mức cống hiến hợp lệ từ 50 đến 50,000 Vàng!',
      });
    }

    const user = await User.findById(userId);
    if (!user || !user.guild?.guildId) {
      return res.status(400).json({ success: false, message: 'Bạn chưa tham gia Bang Hội!' });
    }

    if ((user.coins || 0) < amount) {
      return res.status(400).json({
        success: false,
        message: `Số dư Vàng không đủ (Cần ${amount.toLocaleString()} Vàng)!`,
      });
    }

    const guild = await Guild.findById(user.guild.guildId);
    if (!guild) {
      return res.status(404).json({ success: false, message: 'Bang Hội không tồn tại!' });
    }

    // 1. Trừ Vàng người chơi
    user.coins -= amount;
    await user.save();

    // 2. Cập nhật Quỹ & EXP Bang Hội
    guild.treasuryCoins += amount;
    guild.exp += amount;

    // Cập nhật điểm cống hiến của thành viên
    const member = guild.members.find((m) => m.userId.toString() === userId.toString());
    if (member) {
      member.contributionPoints = (member.contributionPoints || 0) + amount;
    }

    // 3. Tính toán Thăng Cấp Bang Hội
    const { level: newLevel, maxMembers: newMaxMembers } = calculateGuildLevel(guild.exp);
    const leveledUp = newLevel > guild.level;

    guild.level = newLevel;
    guild.maxMembers = newMaxMembers;

    if (leveledUp) {
      guild.chatMessages.push({
        senderId: 'system',
        senderName: 'Hệ Thống',
        senderAvatar: '🎉',
        senderRole: 'system',
        message: `Chúc mừng Bang Hội đã thăng hạng lên CẤP ${newLevel}! Giới hạn mở rộng ${newMaxMembers} thành viên!`,
        createdAt: new Date(),
      });
    }

    await guild.save();

    return res.status(200).json({
      success: true,
      message: `Cống hiến thành công ${amount.toLocaleString()} Vàng cho Bang Hội!${leveledUp ? ` Bang Hội đã thăng hạng CẤP ${newLevel}!` : ''}`,
      treasuryCoins: guild.treasuryCoins,
      exp: guild.exp,
      level: guild.level,
      leveledUp,
      user,
    });
  } catch (err) {
    console.error('[Guild] ❌ Lỗi donateCoins:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [POST] /api/guilds/chat
 * Gửi tin nhắn vào Kênh Chat Bang Hội
 */
exports.sendChatMessage = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    const { message } = req.body;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập!' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung tin nhắn!' });
    }

    const user = await User.findById(userId);
    if (!user || !user.guild?.guildId) {
      return res.status(400).json({ success: false, message: 'Bạn chưa tham gia Bang Hội!' });
    }

    const guild = await Guild.findById(user.guild.guildId);
    if (!guild) {
      return res.status(404).json({ success: false, message: 'Bang Hội không tồn tại!' });
    }

    const member = guild.members.find((m) => m.userId.toString() === userId.toString());
    const newMsg = {
      senderId: user._id.toString(),
      senderName: user.nickname || user.username,
      senderAvatar: user.avatar || 'avatar_1',
      senderRole: member?.role || 'member',
      message: message.trim().slice(0, 300),
      createdAt: new Date(),
    };

    guild.chatMessages.push(newMsg);
    if (guild.chatMessages.length > 60) {
      guild.chatMessages = guild.chatMessages.slice(-50);
    }

    await guild.save();

    return res.status(200).json({
      success: true,
      message: 'Gửi tin nhắn thành công!',
      chatMessage: newMsg,
    });
  } catch (err) {
    console.error('[Guild] ❌ Lỗi sendChatMessage:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [GET] /api/guilds/leaderboard
 * Bảng Xếp Hạng Top 10 Bang Hội mạnh nhất máy chủ
 */
exports.getGuildLeaderboard = async (req, res) => {
  try {
    const guilds = await Guild.find().lean();

    const rankedGuilds = guilds.map((g) => {
      const totalElo = (g.members || []).reduce((sum, m) => sum + (m.elo || 1200), 0);
      const totalContribution = (g.members || []).reduce((sum, m) => sum + (m.contributionPoints || 0), 0);
      // Điểm sức mạnh bang = Tổng Elo + (Cấp * 500) + (Cống hiến * 0.1)
      const powerScore = Math.round(totalElo + g.level * 500 + totalContribution * 0.1);

      return {
        id: g._id,
        name: g.name,
        tag: g.tag,
        emblem: g.emblem,
        level: g.level,
        memberCount: g.members?.length || 0,
        maxMembers: g.maxMembers,
        totalElo,
        powerScore,
      };
    });

    rankedGuilds.sort((a, b) => b.powerScore - a.powerScore);

    return res.status(200).json({
      success: true,
      leaderboard: rankedGuilds.slice(0, 10),
    });
  } catch (err) {
    console.error('[Guild] ❌ Lỗi getGuildLeaderboard:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
