/**
 * Integration Test: Tính Điểm Rank ELO Cho Chế Độ Ghép Auto (Matchmaking)
 */
require('dotenv').config();
const { io } = require('../../frontend/node_modules/socket.io-client');
const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
const PlayerStats = require('../models/PlayerStats');
const connectDB = require('../config/db');
const gameEngine = require('../socket/gameEngine');

const SERVER_URL = 'http://localhost:5001';

async function runRankMatchmakingTest() {
  console.log('\n======================================================');
  console.log('   KIỂM THỬ: TÍNH ĐIỂM RANK ELO CHO CHẾ ĐỘ GHÉP AUTO');
  console.log('======================================================\n');

  try {
    await connectDB();

    // 1. Tạo 2 tài khoản test
    await User.deleteMany({ email: { $in: ['rank_player1@neo.com', 'rank_player2@neo.com'] } });

    const p1 = await User.create({
      nickname: 'RankHero1',
      email: 'rank_player1@neo.com',
      password: 'password123',
      elo: 1000,
      coins: 500,
      matchesWon: 0,
      matchesLost: 0,
    });

    const p2 = await User.create({
      nickname: 'RankHero2',
      email: 'rank_player2@neo.com',
      password: 'password123',
      elo: 1000,
      coins: 500,
      matchesWon: 0,
      matchesLost: 0,
    });

    console.log(`[Setup] Người chơi 1: ${p1.nickname} (ELO: ${p1.elo})`);
    console.log(`[Setup] Người chơi 2: ${p2.nickname} (ELO: ${p2.elo})`);

    // 2. Giả lập phòng trận đấu ghép auto (Solo 1v1, isRanked = true)
    const mockRoom = {
      code: 'RANKTEST_' + Math.floor(1000 + Math.random() * 9000),
      isRanked: true,
      mode: 'SOLO_1V1',
      players: [
        {
          userId: p1._id.toString(),
          name: p1.nickname,
          isBot: false,
          avatar: 'avatar_1',
        },
        {
          userId: p2._id.toString(),
          name: p2.nickname,
          isBot: false,
          avatar: 'avatar_2',
        },
      ],
    };

    const mockIo = {
      to: () => ({
        emit: (event, payload) => {
          if (event === 'game:finished') {
            console.log(`[GameEngine] 📢 Phát sự kiện game:finished:`);
            console.log(`  - Người thắng: ${payload.winner}`);
            console.log(`  - Chế độ tính Rank: ${payload.isRanked}`);
            console.log(`  - Chi tiết ELO:`, payload.rankings.map(r => `${r.name}: ${r.eloDelta > 0 ? '+' : ''}${r.eloDelta} ELO (Mới: ${r.newElo})`));
          }
        },
      }),
    };

    // 3. Bắt đầu trận đấu trên gameEngine
    const game = gameEngine.startOnlineMatch(mockRoom, mockIo);
    console.log(`  ✔ Đã khởi tạo trận đấu online [${mockRoom.code}] với isRanked = true`);

    // 4. Cho P1 thắng ván đấu (P1 đánh hết bài -> hand = [])
    game.players[0].hand = [];
    game.players[1].hand = [{ id: 'card_dummy_1', color: 'red', value: '5' }];

    // 5. Kết thúc trận đấu
    await game.finishGame(game.players[0]);

    // 6. Kiểm tra CSDL MongoDB Atlas
    const updatedP1 = await User.findById(p1._id);
    const updatedP2 = await User.findById(p2._id);

    console.log(`\n[MongoDB Atlas Verification]:`);
    console.log(`- ${updatedP1.nickname}: ELO cũ 1000 -> ELO mới: ${updatedP1.elo} (Kỳ vọng: 1015)`);
    console.log(`- ${updatedP2.nickname}: ELO cũ 1000 -> ELO mới: ${updatedP2.elo} (Kỳ vọng: 985)`);

    if (updatedP1.elo !== 1015) {
      throw new Error(`P1 ELO không đúng! Nhận được: ${updatedP1.elo}, mong đợi: 1015 (+15 ELO)`);
    }
    if (updatedP2.elo !== 985) {
      throw new Error(`P2 ELO không đúng! Nhận được: ${updatedP2.elo}, mong đợi: 985 (-15 ELO)`);
    }

    if (updatedP1.matchesWon !== 1) {
      throw new Error(`P1 matchesWon không tăng! Nhận được: ${updatedP1.matchesWon}`);
    }
    if (updatedP2.matchesLost !== 1) {
      throw new Error(`P2 matchesLost không tăng! Nhận được: ${updatedP2.matchesLost}`);
    }

    // 7. Kiểm tra Match record đã lưu vào MongoDB Atlas chưa
    const matchRecord = await Match.findOne({ roomCode: mockRoom.code });
    if (!matchRecord) {
      throw new Error(`Không tìm thấy Match record cho phòng ${mockRoom.code}`);
    }
    console.log(`- Match Record đã lưu: Phòng ${matchRecord.roomCode}, Người thắng: ${matchRecord.winner.name}, Mode: ${matchRecord.mode}`);

    // Dọn dẹp
    await User.deleteMany({ email: { $in: ['rank_player1@neo.com', 'rank_player2@neo.com'] } });
    await Match.deleteOne({ roomCode: mockRoom.code });
    await PlayerStats.deleteMany({ user: { $in: [p1._id, p2._id] } });

    console.log('\n======================================================');
    console.log('   KẾT QUẢ: TÍNH ĐIỂM RANK ELO CHO GHÉP AUTO HOÀN HẢO!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ LỖI KIỂM THỬ RANK:', err);
    process.exit(1);
  }
}

runRankMatchmakingTest();
