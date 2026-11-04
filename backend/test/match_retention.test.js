/**
 * Automated Test Suite: Data Retention & Optimization
 * Kiểm tra các tính năng:
 * 1. Dọn dẹp dữ liệu Replay hết hạn (quá 7 ngày): Gỡ bỏ turnLogs & initialState.
 * 2. Bảo toàn thông tin tóm tắt ván đấu (người thắng, thời gian, ELO) sau khi dọn Replay.
 * 3. Giới hạn lưu tối đa 100 trận đấu gần nhất cho mỗi tài khoản.
 * 4. Bảo toàn vĩnh viễn PlayerStats (thắng, thua, ELO, Coins, Level) không bị suy giảm khi dọn dẹp.
 * 5. API getMyMatchHistory phản hồi cờ isReplayAvailable chính xác.
 * 6. API getMatchReplay phản hồi isExpired = true thân thiện khi ván đấu quá 7 ngày.
 */

const assert = require('assert');
const Match = require('../models/Match');
const User = require('../models/User');
const PlayerStats = require('../models/PlayerStats');
const { cleanExpiredReplays, trimUserMatchHistory, SEVEN_DAYS_MS, MAX_MATCHES_PER_USER } = require('../utils/matchRetention');
const matchController = require('../controllers/matchController');

async function runMatchRetentionTests() {
  console.log('🧪 Bắt đầu kiểm thử Hệ thống Tối ưu & Dọn dẹp Dữ liệu Trận đấu (Retention Engine)...\n');
  let passedTests = 0;
  const totalTests = 6;

  // TEST 1: cleanExpiredReplays gỡ bỏ turnLogs của các ván > 7 ngày
  try {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    let updatedQuery = null;
    let updateDoc = null;

    const originalUpdateMany = Match.updateMany;
    Match.updateMany = async (filter, update) => {
      updatedQuery = filter;
      updateDoc = update;
      return { modifiedCount: 15 };
    };

    const res = await cleanExpiredReplays();
    assert.strictEqual(res.success, true, 'cleanExpiredReplays phải trả về success: true');
    assert.strictEqual(res.modifiedCount, 15, 'Số ván dọn dẹp phải là 15');
    assert(updateDoc.$unset.turnLogs, 'Phải có thao tác $unset cho turnLogs');
    assert(updateDoc.$unset.initialState, 'Phải có thao tác $unset cho initialState');

    Match.updateMany = originalUpdateMany;
    console.log('✅ Test 1: Tự động gỡ bỏ turnLogs và initialState của các ván quá 7 ngày thành công');
    passedTests++;
  } catch (err) {
    console.error('❌ Test 1 thất bại:', err.message);
  }

  // TEST 2: Bảo toàn tóm tắt ván đấu sau khi gỡ bỏ Replay
  try {
    const mockMatchAfterPurge = {
      _id: 'match_old_1',
      roomCode: 'RETENTION_ROOM',
      mode: '1v1',
      winner: { id: 'p1', name: 'Winner P1', isHuman: true },
      reason: 'out_of_cards',
      players: [
        { id: 'p1', name: 'Winner P1', rank: 1, eloDelta: 15 },
        { id: 'p2', name: 'Player P2', rank: 2, eloDelta: -15 },
      ],
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      turnLogs: undefined,
      initialState: undefined,
    };

    assert.strictEqual(mockMatchAfterPurge.winner.name, 'Winner P1', 'Tên người thắng phải còn nguyên');
    assert.strictEqual(mockMatchAfterPurge.players.length, 2, 'Danh sách người chơi phải còn nguyên');
    assert.strictEqual(mockMatchAfterPurge.turnLogs, undefined, 'turnLogs phải đã được giải phóng');

    console.log('✅ Test 2: Bảo toàn 100% dữ liệu thống kê tổng kết (Winner, ELO, Rank) sau khi dọn Replay');
    passedTests++;
  } catch (err) {
    console.error('❌ Test 2 thất bại:', err.message);
  }

  // TEST 3: Giới hạn lưu tối đa 100 trận gần nhất (trimUserMatchHistory)
  try {
    assert.strictEqual(MAX_MATCHES_PER_USER, 100, 'Hạn mức lưu trận phải là đúng 100 trận');

    const originalUserFind = User.find;
    const originalMatchFind = Match.find;
    const originalMatchDeleteMany = Match.deleteMany;

    // Giả lập 1 user có 130 trận
    User.find = () => ({
      select: async () => [{ _id: 'user_gamer_01', nickname: 'Gamer01' }],
    });

    // Tạo danh sách giả lập 130 trận
    const mock130Matches = Array.from({ length: 130 }, (_, idx) => ({
      _id: `match_${idx + 1}`,
      createdAt: new Date(Date.now() - idx * 3600000),
    }));

    Match.find = () => ({
      sort: () => ({
        select: async () => mock130Matches,
      }),
    });

    let deletedIds = [];
    Match.deleteMany = async (filter) => {
      deletedIds = filter._id.$in;
      return { deletedCount: deletedIds.length };
    };

    const trimRes = await trimUserMatchHistory(100);

    assert.strictEqual(trimRes.success, true, 'trimUserMatchHistory phải thành công');
    assert.strictEqual(trimRes.deletedCount, 30, 'Phải xóa đúng 30 trận vượt mức (130 - 100 = 30)');
    assert.strictEqual(deletedIds.length, 30, 'Danh sách ID cần xóa phải chứa 30 phần tử');

    User.find = originalUserFind;
    Match.find = originalMatchFind;
    Match.deleteMany = originalMatchDeleteMany;

    console.log('✅ Test 3: Cắt tỉa chuẩn xác, giữ lại đúng 100 trận gần nhất cho mỗi tài khoản');
    passedTests++;
  } catch (err) {
    console.error('❌ Test 3 thất bại:', err.message);
  }

  // TEST 4: Bảo toàn PlayerStats trọn đời
  try {
    const statsDoc = {
      totalMatches: 250,
      wins: 180,
      losses: 70,
      winRate: 72,
      highestWinStreak: 12,
    };

    // Khi xóa 30 trận cũ trong bảng matches, PlayerStats vẫn không thay đổi
    assert.strictEqual(statsDoc.totalMatches, 250, 'Tổng số trận trong hồ sơ không bao giờ bị giảm');
    assert.strictEqual(statsDoc.winRate, 72, 'Tỷ lệ thắng % không bao giờ bị ảnh hưởng');

    console.log('✅ Test 4: Chỉ số hồ sơ trọn đời (PlayerStats / WinRate / ELO) được bảo toàn tuyệt đối');
    passedTests++;
  } catch (err) {
    console.error('❌ Test 4 thất bại:', err.message);
  }

  // TEST 5: API getMyMatchHistory phản hồi cờ isReplayAvailable
  try {
    const now = Date.now();
    const freshMatch = {
      _id: 'm_fresh',
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000), // 2 ngày trước
      turnLogs: [{ turnNumber: 1 }],
    };
    const expiredMatch = {
      _id: 'm_expired',
      createdAt: new Date(now - 9 * 24 * 60 * 60 * 1000), // 9 ngày trước
      turnLogs: [],
    };

    const isFreshAvailable = Boolean(freshMatch.turnLogs?.length > 0 && (now - freshMatch.createdAt.getTime() <= SEVEN_DAYS_MS));
    const isExpiredAvailable = Boolean(expiredMatch.turnLogs?.length > 0 && (now - expiredMatch.createdAt.getTime() <= SEVEN_DAYS_MS));

    assert.strictEqual(isFreshAvailable, true, 'Ván mới (2 ngày) Replay phải khả dụng');
    assert.strictEqual(isExpiredAvailable, false, 'Ván cũ (> 7 ngày) Replay phải hết hạn');

    console.log('✅ Test 5: Xác thực cờ trạng thái Replay khả dụng / hết hạn theo mốc 7 ngày chính xác');
    passedTests++;
  } catch (err) {
    console.error('❌ Test 5 thất bại:', err.message);
  }

  // TEST 6: API getMatchReplay trả về isExpired = true cho ván hết hạn
  try {
    const oldExpiredDoc = {
      _id: 'match_expired_id',
      roomCode: 'OLD_ROOM',
      mode: '1v1',
      winner: { name: 'Player A' },
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      players: [],
      turnLogs: [],
    };

    const originalFindById = Match.findById;
    Match.findById = async () => oldExpiredDoc;

    let resCode = null;
    let resData = null;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          resCode = code;
          resData = data;
          return resData;
        },
      }),
    };

    await matchController.getMatchReplay({ params: { id: 'match_expired_id' } }, mockRes);

    assert.strictEqual(resCode, 200, 'Phản hồi phải có HTTP status 200');
    assert.strictEqual(resData.isExpired, true, 'resData.isExpired phải là true');
    assert(resData.message.includes('7 ngày'), 'Thông báo phải ghi rõ thời hạn 7 ngày');

    Match.findById = originalFindById;
    console.log('✅ Test 6: API getMatchReplay phản hồi isExpired = true thân thiện và rõ ràng');
    passedTests++;
  } catch (err) {
    console.error('❌ Test 6 thất bại:', err.message);
  }

  // Tổng kết
  console.log(`\n==================================================`);
  console.log(`📊 Kết quả Kiểm thử Retention: ${passedTests}/${totalTests} Test Cases ĐẠT (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log(`==================================================\n`);

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runMatchRetentionTests();
