const User = require('../models/User');
const PlayerStats = require('../models/PlayerStats');
const Guild = require('../models/Guild');
const mongoose = require('mongoose');

// Danh mục Danh hiệu Cyberpunk & Tiêu chuẩn Mở khóa
const TITLE_CATALOG = [
  {
    id: 'title_novice',
    name: 'Tân Thủ Cyber',
    badge: '🔰',
    color: 'cyan',
    description: 'Đấu thủ gia nhập đấu trường số NEO UNO',
    requirement: 'Mặc định mở khóa cho mọi người chơi',
    isUnlocked: () => true,
  },
  {
    id: 'title_card_master',
    name: 'Bậc Thầy Đánh Bài',
    badge: '🃏',
    color: 'amber',
    description: 'Kinh nghiệm dày dặn với hơn 50 ván đấu căng thẳng',
    requirement: 'Tham gia từ 50 trận đấu trở lên',
    isUnlocked: (user, stats) => (stats?.totalMatches || 0) >= 50,
  },
  {
    id: 'title_knockout_king',
    name: 'Vua Đấu Loại',
    badge: '🏆',
    color: 'fuchsia',
    description: 'Bản lĩnh đoạt cúp Vô Địch giải Knockout Cup 8 người',
    requirement: 'Đạt ít nhất 1 cúp Vô Địch Giải Đấu Tournament',
    isUnlocked: (user) => (user?.tournamentsWon || 0) > 0 || (user?.tournamentCups?.length || 0) > 0,
  },
  {
    id: 'title_duo_champion',
    name: 'Cặp Đôi Bất Bại',
    badge: '🤝',
    color: 'emerald',
    description: 'Phối hợp ăn ý áp đảo đối thủ trong chế độ Tag-Team 2v2',
    requirement: 'Đạt cấp độ từ 5 trở lên hoặc chuỗi thắng 3+',
    isUnlocked: (user, stats) => (user?.level || 1) >= 5 || (stats?.highestWinStreak || 0) >= 3,
  },
  {
    id: 'title_guild_legend',
    name: 'Huyền Thoại Quân Đoàn',
    badge: '🛡️',
    color: 'blue',
    description: 'Gia nhập hoặc lãnh đạo Quân Đoàn Cyberpunk ưu tú',
    requirement: 'Là thành viên chính thức của một Quân Đoàn',
    isUnlocked: (user) => Boolean(user?.guild?.guildId),
  },
  {
    id: 'title_cyber_warrior',
    name: 'Chiến Thần Cyber',
    badge: '🎖️',
    color: 'rose',
    description: 'Chiến binh thiện chiến với ELO cao hoặc Sổ Sứ Mệnh',
    requirement: 'ELO >= 1,200 hoặc mở khóa Battle Pass cấp 15',
    isUnlocked: (user) =>
      (user?.elo || 1000) >= 1200 ||
      (user?.inventory && user.inventory.includes('title_cyber_warrior')) ||
      (user?.battlePass?.level || 1) >= 15,
  },
  {
    id: 'title_comeback_god',
    name: 'Thần Lật Kèo',
    badge: '⚡',
    color: 'purple',
    description: 'Bản lĩnh lội ngược dòng với chuỗi thắng ngoạn mục',
    requirement: 'Đạt chuỗi thắng cao nhất từ 5 trận trở lên',
    isUnlocked: (user, stats) => (stats?.highestWinStreak || 0) >= 5,
  },
  {
    id: 'title_cyber_emperor',
    name: 'Hoàng Đế Cyber',
    badge: '👑',
    color: 'yellow',
    description: 'Bá chủ tối thượng ngự trị đỉnh cao đấu trường số',
    requirement: 'ELO >= 1,500 hoặc mở khóa Battle Pass cấp 30',
    isUnlocked: (user) =>
      (user?.elo || 1000) >= 1500 ||
      (user?.inventory && user.inventory.includes('title_cyber_emperor')) ||
      (user?.battlePass?.level || 1) >= 30,
  },
];

// Phân hạng Rank Tier theo ELO
const getRankTier = (elo = 1000) => {
  if (elo >= 1900) return { name: 'Đại Cao Thủ Thách Đấu', tier: 8, badge: '👑', color: '#f59e0b' };
  if (elo >= 1700) return { name: 'Cao Thủ Tối Thượng', tier: 7, badge: '🔥', color: '#ef4444' };
  if (elo >= 1550) return { name: 'Kim Cương Lượng Tử', tier: 6, badge: '💎', color: '#06b6d4' };
  if (elo >= 1400) return { name: 'Bạch Kim Cyber', tier: 5, badge: '⚡', color: '#8b5cf6' };
  if (elo >= 1250) return { name: 'Vàng Hoàng Kim', tier: 4, badge: '🥇', color: '#eab308' };
  if (elo >= 1150) return { name: 'Bạc Neon', tier: 3, badge: '🥈', color: '#94a3b8' };
  if (elo >= 1050) return { name: 'Đồng Đỏ', tier: 2, badge: '🥉', color: '#b45309' };
  return { name: 'Tập Sự Cyber', tier: 1, badge: '🔰', color: '#10b981' };
};

// Tính toán 6 trục Radar chuẩn hóa (0 - 100)
const computeRadarMetrics = (user, stats) => {
  const totalMatches = stats?.totalMatches || 0;
  const wins = stats?.wins || 0;
  const cardsPlayed = stats?.totalCardsPlayed || 0;
  const unoCalls = stats?.unoCallsSuccess || 0;
  const highestStreak = stats?.highestWinStreak || 0;
  const userElo = user?.elo || 1000;
  const userLevel = user?.level || 1;
  const tourneysWon = user?.tournamentsWon || 0;

  // 1. Tỷ Lệ Thắng (Win Rate & Execution)
  let winRateScore = 50;
  if (totalMatches > 0) {
    const rawRate = (wins / totalMatches) * 100;
    // Tự tin theo số trận để chống biến động ảo khi chỉ chơi 1-2 trận
    const confidence = Math.min(1, totalMatches / 10);
    winRateScore = Math.round(50 * (1 - confidence) + rawRate * confidence);
  }
  winRateScore = Math.max(10, Math.min(100, winRateScore));

  // 2. Sát Thương Công Phạt (Aggressiveness & Card Play)
  const avgCardsPerMatch = totalMatches > 0 ? cardsPlayed / totalMatches : 8;
  let aggressionScore = Math.round(35 + avgCardsPerMatch * 3.2 + (userElo > 1200 ? 15 : 8));
  aggressionScore = Math.max(20, Math.min(100, aggressionScore));

  // 3. Tốc Độ Phản Xạ & APM (Speed & Quick Actions)
  const unoBonus = Math.min(25, unoCalls * 3.5);
  const levelBonus = Math.min(20, userLevel * 2.5);
  let speedScore = Math.round(45 + unoBonus + levelBonus);
  speedScore = Math.max(30, Math.min(100, speedScore));

  // 4. Phòng Thủ Kiên Cố (Defense & Counter)
  const streakBonus = Math.min(25, highestStreak * 5);
  const tourneyDefense = Math.min(20, tourneysWon * 8);
  let defenseScore = Math.round(35 + (wins / Math.max(1, totalMatches)) * 25 + streakBonus + tourneyDefense);
  defenseScore = Math.max(25, Math.min(100, defenseScore));

  // 5. Đồng Đội & Phối Hợp (Synergy & Tag-Team)
  let synergyScore = 35;
  if (user?.guild?.guildId) synergyScore += 30;
  if (userLevel >= 5) synergyScore += 15;
  if (wins >= 5) synergyScore += 10;
  if (tourneysWon > 0) synergyScore += 10;
  synergyScore = Math.max(20, Math.min(100, synergyScore));

  // 6. Bản Lĩnh Lật Kèo (Comeback Factor)
  const eloClimb = Math.max(0, Math.min(30, (userElo - 900) / 20));
  const comebackStreak = Math.min(35, highestStreak * 6.5);
  let comebackScore = Math.round(35 + comebackStreak + eloClimb);
  comebackScore = Math.max(25, Math.min(100, comebackScore));

  // Tổng hợp chỉ số Lực Chiến Esports (Combat Rating Index)
  const overallPower = Math.round(
    (winRateScore + aggressionScore + speedScore + defenseScore + synergyScore + comebackScore) / 6
  );

  return {
    winRate: winRateScore,
    aggression: aggressionScore,
    speed: speedScore,
    defense: defenseScore,
    synergy: synergyScore,
    comeback: comebackScore,
    overallPower,
  };
};

/**
 * Lấy Hồ Sơ Sự Nghiệp Đấu Thủ & Chỉ Số Radar 6 Trục
 * GET /api/profile/:userId
 */
exports.getCareerProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    let user = null;
    let stats = null;

    if (userId && !String(userId).startsWith('guest_') && mongoose.isValidObjectId(userId)) {
      user = await User.findById(userId).lean();
      if (user) {
        stats = await PlayerStats.findOne({ user: user._id }).lean();
      }
    }

    // Nếu là Guest hoặc không tìm thấy user, trả về hồ sơ khách tiêu chuẩn
    if (!user) {
      const guestName = String(userId).startsWith('guest_') ? `Khách #${String(userId).slice(-4)}` : 'Đấu Thủ Khách';
      const mockStats = {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        winStreak: 0,
        highestWinStreak: 0,
        totalCardsPlayed: 0,
        unoCallsSuccess: 0,
        totalScore: 0,
      };

      const guestUser = {
        nickname: guestName,
        accountId: 'GUEST_CYBER',
        avatar: 'avatar_1',
        elo: 1000,
        level: 1,
        exp: 0,
        coins: 1000,
        equippedTitle: 'Tân Thủ Cyber',
        equippedCardSkin: 'skin_classic',
        equippedAvatarFrame: 'frame_default',
        tournamentsWon: 0,
        tournamentCups: [],
        guild: null,
      };

      const radar = computeRadarMetrics(guestUser, mockStats);
      const rank = getRankTier(guestUser.elo);

      const titles = TITLE_CATALOG.map((t) => ({
        id: t.id,
        name: t.name,
        badge: t.badge,
        color: t.color,
        description: t.description,
        requirement: t.requirement,
        isUnlocked: t.isUnlocked(guestUser, mockStats),
        isEquipped: guestUser.equippedTitle === t.name,
      }));

      return res.json({
        success: true,
        isGuest: true,
        user: guestUser,
        stats: mockStats,
        radar,
        rank,
        titles,
      });
    }

    // Đảm bảo stats tồn tại cho registered user
    if (!stats) {
      stats = await PlayerStats.create({ user: user._id });
    }

    // Lấy thông tin Guild chi tiết nếu có
    let guildInfo = null;
    if (user.guild?.guildId) {
      try {
        const guildDoc = await Guild.findById(user.guild.guildId).select('name tag level icon memberCount').lean();
        if (guildDoc) {
          guildInfo = guildDoc;
        }
      } catch {}
    }

    const radar = computeRadarMetrics(user, stats);
    const rank = getRankTier(user.elo);

    // Tính trạng thái mở khóa cho từng Danh Hiệu
    const titles = TITLE_CATALOG.map((t) => {
      const unlocked = t.isUnlocked(user, stats);
      return {
        id: t.id,
        name: t.name,
        badge: t.badge,
        color: t.color,
        description: t.description,
        requirement: t.requirement,
        isUnlocked: unlocked,
        isEquipped: user.equippedTitle === t.name || (t.id === 'title_novice' && !user.equippedTitle),
      };
    });

    return res.json({
      success: true,
      isGuest: false,
      user: {
        _id: user._id,
        nickname: user.nickname,
        accountId: user.accountId || String(user._id).slice(-10).toUpperCase(),
        avatar: user.avatar,
        elo: user.elo || 1000,
        level: user.level || 1,
        exp: user.exp || 0,
        coins: user.coins || 0,
        equippedTitle: user.equippedTitle || 'Tân Thủ Cyber',
        equippedCardSkin: user.equippedCardSkin || 'skin_classic',
        equippedAvatarFrame: user.equippedAvatarFrame || 'frame_default',
        tournamentsWon: user.tournamentsWon || 0,
        tournamentCups: user.tournamentCups || [],
        guild: guildInfo || user.guild,
        inventory: user.inventory || [],
        createdAt: user.createdAt,
      },
      stats: {
        totalMatches: stats.totalMatches || 0,
        wins: stats.wins || 0,
        losses: stats.losses || 0,
        winRate: stats.winRate || (stats.totalMatches > 0 ? Math.round((stats.wins / stats.totalMatches) * 100) : 0),
        winStreak: stats.winStreak || 0,
        highestWinStreak: stats.highestWinStreak || 0,
        totalCardsPlayed: stats.totalCardsPlayed || 0,
        unoCallsSuccess: stats.unoCallsSuccess || 0,
        totalScore: stats.totalScore || 0,
      },
      radar,
      rank,
      titles,
    });
  } catch (error) {
    console.error('Lỗi lấy hồ sơ sự nghiệp:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải hồ sơ sự nghiệp đấu thủ: ' + error.message,
    });
  }
};

/**
 * Trang Bị Danh Hiệu Cyber
 * POST /api/profile/equip-title
 */
exports.equipTitle = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { titleId } = req.body;

    if (!titleId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã danh hiệu cần trang bị!',
      });
    }

    const titleItem = TITLE_CATALOG.find((t) => t.id === titleId);
    if (!titleItem) {
      return res.status(404).json({
        success: false,
        message: 'Danh hiệu không tồn tại trong hệ thống NEO UNO!',
      });
    }

    // Nếu là Guest
    if (!userId || String(userId).startsWith('guest_') || !mongoose.isValidObjectId(userId)) {
      if (titleId !== 'title_novice') {
        return res.status(400).json({
          success: false,
          message: 'Tài khoản Khách chỉ có thể sử dụng danh hiệu Tân Thủ Cyber!',
        });
      }
      return res.json({
        success: true,
        message: `Đã trang bị danh hiệu: ${titleItem.name}`,
        equippedTitle: titleItem.name,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng!',
      });
    }

    const stats = await PlayerStats.findOne({ user: user._id });
    const isUnlocked = titleItem.isUnlocked(user, stats);

    if (!isUnlocked) {
      return res.status(400).json({
        success: false,
        message: `Bạn chưa mở khóa danh hiệu "${titleItem.name}". Yêu cầu: ${titleItem.requirement}`,
      });
    }

    user.equippedTitle = titleItem.name;
    // Thêm vào inventory nếu chưa có
    if (!user.inventory.includes(titleItem.id)) {
      user.inventory.push(titleItem.id);
    }
    await user.save();

    return res.json({
      success: true,
      message: `Đã trang bị danh hiệu: [${titleItem.name}] thành công!`,
      equippedTitle: user.equippedTitle,
      title: titleItem,
    });
  } catch (error) {
    console.error('Lỗi trang bị danh hiệu:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể trang bị danh hiệu: ' + error.message,
    });
  }
};
