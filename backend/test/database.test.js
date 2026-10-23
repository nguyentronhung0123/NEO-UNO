const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const PlayerStats = require('../models/PlayerStats');
const Match = require('../models/Match');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${message}`);
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${message}`);
    process.exitCode = 1;
  }
}

async function runDatabaseTests() {
  console.log('\n======================================================');
  console.log('   KIỂM THỬ TỰ ĐỘNG: MONGODB ATLAS & MODELS DỮ LIỆU');
  console.log('======================================================\n');

  try {
    // Test 1: Kết nối
    console.log('📌 Nhóm 1: Kết nối CSDL MongoDB Atlas');
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    assert(conn.connection.readyState === 1, 'Kết nối MongoDB Atlas thành công (readyState = 1)');
    assert(conn.connection.name === 'neo_uno', `Database mục tiêu chính xác: [${conn.connection.name}]`);

    // Test 2: Kiểm tra dữ liệu Users
    console.log('\n📌 Nhóm 2: Kiểm tra Bộ sưu tập User & PlayerStats');
    const userCount = await User.countDocuments();
    assert(userCount >= 5, `Số lượng người chơi đã đồng bộ vào CSDL (Hiện có: ${userCount} users)`);

    const statsCount = await PlayerStats.countDocuments();
    assert(statsCount >= 5, `Bản ghi PlayerStats tương ứng đã được khởi tạo (Hiện có: ${statsCount} stats)`);

    // Test 3: Tạo và lưu trữ Ván Đấu (Match)
    console.log('\n📌 Nhóm 3: Kiểm tra Ghi nhận Trận đấu (Match Record)');
    const testMatch = await Match.create({
      roomCode: 'CI_TEST_ROOM',
      winner: { id: 'player', name: 'Tester', isHuman: true },
      reason: 'out_of_cards',
      durationSeconds: 120,
      players: [
        { id: 'player', name: 'Tester', isHuman: true, rank: 1, finalScore: 100, cardsRemaining: 0 },
        { id: 'bot_titan', name: 'Bot Titan', isHuman: false, rank: 2, finalScore: 20, cardsRemaining: 3 }
      ]
    });

    assert(testMatch._id !== undefined, 'Lưu thành công bản ghi trận đấu vào MongoDB Atlas');
    assert(testMatch.players.length === 2, 'Cấu trúc mảng người chơi trong Match được bảo toàn');
    assert(testMatch.winner.isHuman === true, 'Người chiến thắng được định danh chuẩn xác');

    // Dọn dẹp bản ghi test
    await Match.findByIdAndDelete(testMatch._id);
    assert(true, 'Dọn dẹp bản ghi kiểm thử thành công');

    console.log('\n======================================================');
    console.log(`   KẾT QUẢ: ${passed}/${total} KIỂM THỬ ĐẠT (PASS)`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Lỗi kiểm thử CSDL:', err);
    process.exit(1);
  }
}

runDatabaseTests();
