const User = require('../models/User');
const PlayerStats = require('../models/PlayerStats');

// LẤY BẢNG XẾP HẠNG TOP CAO THỦ (CHỈ TÍNH RANK CHO NGƯỜI CHƠI THẬT, KHÔNG TÍNH BOT & GUEST)
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Lấy top người chơi theo Elo và số trận thắng - CHỈ TÍNH NGƯỜI THẬT (player, admin), LOẠI BỎ TOÀN BỘ BOT & GUEST
    const topUsers = await User.find({
      role: { $in: ['player', 'admin'] },
      nickname: { $not: /^bot/i },
    })
      .select('nickname avatar elo coins level exp matchesWon matchesLost role')
      .sort({ elo: -1, matchesWon: -1 })
      .limit(limit);

    const leaderboard = await Promise.all(
      topUsers.map(async (u, idx) => {
        const stats = await PlayerStats.findOne({ user: u._id });
        return {
          rank: idx + 1,
          id: u._id,
          nickname: u.nickname,
          avatar: u.avatar,
          elo: u.elo || 1000,
          level: u.level || 1,
          coins: u.coins || 1000,
          role: u.role || 'player',
          wins: stats ? stats.wins : u.matchesWon || 0,
          winRate: stats ? stats.winRate : 0,
          winStreak: stats ? stats.winStreak : 0
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: leaderboard.length,
      leaderboard
    });
  } catch (error) {
    console.error('[Leaderboard Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải bảng xếp hạng!'
    });
  }
};
