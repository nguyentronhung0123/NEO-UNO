const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const PlayerStats = require('../models/PlayerStats');

const migrateExistingUsers = async () => {
  try {
    const jsonPath = path.join(__dirname, '../data/users.json');
    if (!fs.existsSync(jsonPath)) return;

    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const jsonUsers = JSON.parse(rawData);

    for (const u of jsonUsers) {
      const exists = await User.findOne({
        $or: [{ email: u.email.toLowerCase() }, { nickname: u.nickname }]
      });

      if (!exists) {
        const createdUser = await User.create({
          nickname: u.nickname,
          email: u.email.toLowerCase(),
          password: u.password, // Đã được hash bcrypt từ trước
          avatar: u.avatar || '👤',
          elo: u.elo || 1000,
          coins: u.coins || 1000,
          matchesWon: u.matchesWon || 0,
          matchesLost: u.matchesLost || 0,
          role: u.role === 'admin' ? 'admin' : 'player',
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date()
        });

        // Tạo luôn bảng thống kê tương ứng
        await PlayerStats.create({
          user: createdUser._id,
          totalMatches: (u.matchesWon || 0) + (u.matchesLost || 0),
          wins: u.matchesWon || 0,
          losses: u.matchesLost || 0,
          winRate: (u.matchesWon || 0) + (u.matchesLost || 0) > 0
            ? Math.round(((u.matchesWon || 0) / ((u.matchesWon || 0) + (u.matchesLost || 0))) * 100)
            : 0,
          winStreak: u.matchesWon || 0,
          highestWinStreak: u.matchesWon || 0,
          totalScore: (u.matchesWon || 0) * 150
        });

        console.log(`[Migration] 🔄 Đã chuyển đổi tài khoản [${u.nickname}] sang MongoDB Atlas thành công!`);
      }
    }
  } catch (err) {
    console.error('[Migration Error]:', err.message);
  }
};

module.exports = migrateExistingUsers;
