const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const tournamentController = require('../controllers/tournamentController');

// Test suite cho Task 1: Chế độ Đấu Giải Cúp Vô Địch (Tournament Knockout Cup)
async function runTournamentTests() {
  console.log('\n======================================================');
  console.log('   KIỂM THỬ TASK 1 (TUẦN 5): ĐẤU GIẢI CÚP VÔ ĐỊCH (TOURNAMENT)');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✔ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Test failed: ${message}`);
    }
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/neo_uno_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 }).catch(() => {
        console.log('  ⚠️ Không kết nối được MongoDB thực tế, chạy mock test logic cục bộ.');
      });
    }

    const testUserId = 'test_player_cup_' + Date.now();
    const mockUser = {
      _id: testUserId,
      id: testUserId,
      nickname: 'NeoChampion2026',
      avatar: 'avatar_1',
      equippedAvatarFrame: 'frame_neon_cyan',
      elo: 1250,
    };

    console.log('📌 Nhóm 1: Kiểm thử Khởi tạo Giải đấu 8 Đấu Thủ & Sơ đồ Phân nhánh');
    const reqJoin = { user: mockUser, body: {} };
    let resData = null;
    const resJoin = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        resData = data;
        return this;
      },
    };

    await tournamentController.joinTournament(reqJoin, resJoin);

    assert(resData && resData.success === true, 'joinTournament phải trả về success: true');
    assert(resData.tournament !== null, 'Phải tạo thành công thực thể Tournament');
    assert(resData.tournament.participants.length === 8, 'Giải đấu phải có chính xác 8 đấu thủ (1 người + 7 bots)');
    assert(resData.tournament.participants[0].seed === 1, 'Người chơi thật phải giữ vị trí Hạt giống số 1');
    assert(resData.tournament.participants[0].id === testUserId, 'Hạt giống số 1 phải mang đúng ID người chơi');
    assert(resData.tournament.matches.length === 7, 'Sơ đồ nhánh đấu phải có chính xác 7 trận đấu');

    const t = resData.tournament;
    const tournId = t.tournamentId;

    // Kiểm tra cấu trúc phân nhánh
    const m1 = t.matches.find(m => m.matchId === 1);
    const m2 = t.matches.find(m => m.matchId === 2);
    const m5 = t.matches.find(m => m.matchId === 5);
    const m7 = t.matches.find(m => m.matchId === 7);

    assert(m1.round === 1 && m1.player1.seed === 1 && m1.player2.seed === 8, 'Trận Tứ kết 1 phải là Seed 1 vs Seed 8');
    assert(m2.round === 1 && m2.player1.seed === 4 && m2.player2.seed === 5, 'Trận Tứ kết 2 phải là Seed 4 vs Seed 5');
    assert(m5.round === 2 && m5.player1 === null, 'Trận Bán kết 1 ban đầu chưa có đấu thủ (chờ W1 vs W2)');
    assert(m7.round === 3 && m7.player1 === null, 'Trận Chung kết ban đầu chờ W5 vs W6');

    console.log('\n📌 Nhóm 2: Kiểm thử Vòng Tứ Kết & Tự Động Mô Phỏng Nhánh Bots');
    const reqM1 = {
      params: { id: tournId },
      body: { matchId: 1, isWin: true, userCardsLeft: 0, opponentCardsLeft: 3, userId: testUserId },
      user: mockUser,
    };
    let resM1Data = null;
    const resM1 = {
      status(code) { return this; },
      json(data) { resM1Data = data; return this; },
    };

    await tournamentController.submitMatchResult(reqM1, resM1);
    assert(resM1Data.success === true, 'Ghi nhận kết quả Tứ kết 1 thành công');
    assert(resM1Data.tournament.currentRound === 2, 'Sau khi thắng Tứ kết, vòng đấu hiện tại phải chuyển sang Vòng 2 (Bán kết)');

    // Kiểm tra các trận Tứ kết khác (2, 3, 4) đã được tự động mô phỏng xong chưa
    const updatedM2 = resM1Data.tournament.matches.find(m => m.matchId === 2);
    const updatedM3 = resM1Data.tournament.matches.find(m => m.matchId === 3);
    const updatedM4 = resM1Data.tournament.matches.find(m => m.matchId === 4);
    assert(updatedM2.status === 'completed' && updatedM2.winner !== null, 'Trận Tứ kết 2 của Bot phải được mô phỏng hoàn tất');
    assert(updatedM3.status === 'completed' && updatedM3.winner !== null, 'Trận Tứ kết 3 của Bot phải được mô phỏng hoàn tất');
    assert(updatedM4.status === 'completed' && updatedM4.winner !== null, 'Trận Tứ kết 4 của Bot phải được mô phỏng hoàn tất');

    // Kiểm tra Bán kết 1 (Match 5) đã được điền Người chơi vs Người thắng Tứ kết 2
    const updatedM5 = resM1Data.tournament.matches.find(m => m.matchId === 5);
    assert(updatedM5.player1.id === testUserId, 'Bán kết 1 slot Player 1 phải là Người chơi');
    assert(updatedM5.player2.id === updatedM2.winner.id, 'Bán kết 1 slot Player 2 phải là người thắng Tứ kết 2');

    console.log('\n📌 Nhóm 3: Kiểm thử Vòng Bán Kết & Thăng Hạng Chung Kết');
    const reqM5 = {
      params: { id: tournId },
      body: { matchId: 5, isWin: true, userCardsLeft: 0, opponentCardsLeft: 4, userId: testUserId },
      user: mockUser,
    };
    let resM5Data = null;
    const resM5 = {
      status(code) { return this; },
      json(data) { resM5Data = data; return this; },
    };

    await tournamentController.submitMatchResult(reqM5, resM5);
    assert(resM5Data.success === true, 'Ghi nhận kết quả Bán kết 1 thành công');
    assert(resM5Data.tournament.currentRound === 3, 'Sau khi thắng Bán kết, giải đấu phải chuyển sang Vòng 3 (Chung kết Tranh Cúp)');

    const updatedM7 = resM5Data.tournament.matches.find(m => m.matchId === 7);
    assert(updatedM7.player1.id === testUserId, 'Chung kết Slot 1 phải là Người chơi');
    assert(updatedM7.player2 !== null, 'Chung kết Slot 2 phải có đối thủ thắng từ Bán kết 2');

    console.log('\n📌 Nhóm 4: Kiểm thử Chung Kết, Đăng Quang Quán Quân & Nhận Thưởng');
    const reqM7 = {
      params: { id: tournId },
      body: { matchId: 7, isWin: true, userCardsLeft: 0, opponentCardsLeft: 6, userId: testUserId },
      user: mockUser,
    };
    let resM7Data = null;
    const resM7 = {
      status(code) { return this; },
      json(data) { resM7Data = data; return this; },
    };

    await tournamentController.submitMatchResult(reqM7, resM7);
    assert(resM7Data.isChampion === true, 'Xác định chính xác Người chơi là Vô địch (isChampion: true)');
    assert(resM7Data.tournament.status === 'completed', 'Trạng thái giải đấu phải chuyển sang completed');
    assert(resM7Data.tournament.champion.id === testUserId, 'Nhà Quán Quân giải đấu phải lưu ID người chơi');

    // Kiểm thử Nhận Thưởng
    const reqClaim = {
      params: { id: tournId },
      user: mockUser,
      body: { userId: testUserId },
    };
    let resClaimData = null;
    const resClaim = {
      status(code) { return this; },
      json(data) { resClaimData = data; return this; },
    };

    await tournamentController.claimReward(reqClaim, resClaim);
    assert(resClaimData.success === true, 'Nhận thưởng Cúp Vô Địch thành công');
    assert(resClaimData.reward.coins === 5000, 'Thưởng Quán Quân phải là 5000 Vàng');
    assert(resClaimData.reward.exp === 800, 'Thưởng Quán Quân phải là 800 Exp');
    assert(resClaimData.reward.elo === 60, 'Thưởng Quán Quân phải là 60 Điểm Elo');

    console.log('\n======================================================');
    console.log(`   KẾT QUẢ: ${passed}/${total} KIỂM THỬ ĐẠT (PASS 100%)`);
    console.log('======================================================');
    console.log('🎉 TOÀN BỘ LOGIC GIẢI ĐẤU CÚP VÔ ĐỊCH (TASK 1) ĐÃ ĐẠT CHUẨN HOÀN TOÀN!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ LỖI TRONG QUÁ TRÌNH KIỂM THỬ:', err);
    process.exit(1);
  }
}

runTournamentTests();
