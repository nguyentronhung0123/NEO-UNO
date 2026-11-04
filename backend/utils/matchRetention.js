const Match = require('../models/Match');
const User = require('../models/User');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày
const MAX_MATCHES_PER_USER = 100; // Lưu tối đa 100 trận gần nhất

/**
 * 1. Dọn dẹp dữ liệu Replay chi tiết (turnLogs & initialState) của các ván đấu quá 7 ngày.
 * Vẫn giữ lại bản ghi ván đấu (Người thắng, thời gian, ELO delta) trong lịch sử.
 */
async function cleanExpiredReplays(retentionMs = SEVEN_DAYS_MS) {
  try {
    const cutoffDate = new Date(Date.now() - retentionMs);
    const result = await Match.updateMany(
      {
        createdAt: { $lt: cutoffDate },
        $or: [
          { turnLogs: { $exists: true, $ne: [] } },
          { initialState: { $exists: true, $ne: null } },
        ],
      },
      {
        $unset: { turnLogs: 1, initialState: 1 },
      }
    );

    return {
      success: true,
      modifiedCount: result.modifiedCount || 0,
      cutoffDate,
    };
  } catch (error) {
    console.error('[Retention Engine] Lỗi khi dọn dẹp Replay hết hạn:', error);
    return { success: false, error: error.message, modifiedCount: 0 };
  }
}

/**
 * 2. Cắt tỉa Lịch sử Đấu: Giới hạn lưu tối đa 100 trận đấu gần nhất cho mỗi người chơi.
 * Tuyệt đối không ảnh hưởng đến PlayerStats (thắng, thua, ELO, Coins, Level được giữ vĩnh viễn).
 */
async function trimUserMatchHistory(maxMatches = MAX_MATCHES_PER_USER) {
  try {
    let totalDeleted = 0;
    const humanUsers = await User.find({ role: { $nin: ['bot', 'guest'] } }).select('_id nickname');

    for (const u of humanUsers) {
      const uId = String(u._id);
      const uNick = String(u.nickname);

      // Tìm tất cả các trận có sự tham gia của người chơi này, xếp từ mới nhất đến cũ nhất
      const matches = await Match.find({
        $or: [
          { 'players.id': uId },
          { 'players.id': uNick },
        ],
      })
        .sort({ createdAt: -1 })
        .select('_id createdAt');

      if (matches.length > maxMatches) {
        const excessMatches = matches.slice(maxMatches);
        const excessIds = excessMatches.map((m) => m._id);

        const deleteRes = await Match.deleteMany({ _id: { $in: excessIds } });
        totalDeleted += (deleteRes.deletedCount || 0);
      }
    }

    return {
      success: true,
      deletedCount: totalDeleted,
    };
  } catch (error) {
    console.error('[Retention Engine] Lỗi khi cắt tỉa lịch sử ván đấu:', error);
    return { success: false, error: error.message, deletedCount: 0 };
  }
}

/**
 * 3. Chạy tổng dọn dẹp định kỳ
 */
async function runMatchRetentionCleanup() {
  console.log('[Retention Engine] 🔄 Bắt đầu chu trình tối ưu & dọn dẹp dữ liệu trận đấu...');
  const replayRes = await cleanExpiredReplays();
  const trimRes = await trimUserMatchHistory();

  console.log(
    `[Retention Engine] 🧹 Hoàn tất dọn dẹp: Đã giải phóng ${replayRes.modifiedCount} Replay (>7 ngày) và cắt tỉa ${trimRes.deletedCount} trận đấu vượt mốc ${MAX_MATCHES_PER_USER} trận!`
  );

  return {
    replaysPurged: replayRes.modifiedCount,
    matchesTrimmed: trimRes.deletedCount,
  };
}

module.exports = {
  cleanExpiredReplays,
  trimUserMatchHistory,
  runMatchRetentionCleanup,
  SEVEN_DAYS_MS,
  MAX_MATCHES_PER_USER,
};
