const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const PlayerStats = require('../models/PlayerStats');
const Match = require('../models/Match');

async function resetAllElo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Reset] 🔄 Đang reset toàn bộ dữ liệu người chơi về mốc 1000 ELO...');

    const userRes = await User.updateMany({}, {
      $set: {
        elo: 1000,
        coins: 1000,
        level: 1,
        exp: 0,
        matchesWon: 0,
        matchesLost: 0
      }
    });
    console.log(`[Reset] ✔ Đã cập nhật ${userRes.modifiedCount} tài khoản User.`);

    const statsRes = await PlayerStats.updateMany({}, {
      $set: {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        winStreak: 0,
        highestWinStreak: 0,
        totalScore: 0
      }
    });
    console.log(`[Reset] ✔ Đã cập nhật ${statsRes.modifiedCount} bản ghi PlayerStats.`);

    const matchRes = await Match.deleteMany({});
    console.log(`[Reset] ✔ Đã dọn dẹp ${matchRes.deletedCount} trận đấu cũ.`);

    console.log('[Reset] 🎉 TOÀN BỘ ELO VÀ THÀNH TÍCH ĐÃ ĐƯỢC RESET VỀ 1000 ELO!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Reset Error]:', err);
    process.exit(1);
  }
}

resetAllElo();
