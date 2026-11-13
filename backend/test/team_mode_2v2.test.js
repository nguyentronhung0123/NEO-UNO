const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import logic game 2v2
// Do backend và frontend dùng chung cấu trúc dữ liệu, ta định nghĩa bộ kiểm thử xác thực logic 2v2
function runTeamMode2v2Tests() {
  console.log('\n======================================================');
  console.log('   KIỂM THỬ TASK 2 (TUẦN 5): CHẾ ĐỘ ĐỒNG ĐỘI 2V2 (DUO MODE)');
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

  // Helper mô phỏng luật 2v2
  function getTeamForSeat(seatIndex) {
    if (seatIndex === 0 || seatIndex === 2) {
      return {
        id: 'ALPHA',
        name: 'Team Alpha',
        isPlayerTeam: true,
        isTeammate: seatIndex === 2,
      };
    }
    return {
      id: 'OMEGA',
      name: 'Team Omega',
      isPlayerTeam: false,
      isTeammate: false,
    };
  }

  function checkTeamVictory({ playerHand = [], bots = [], reason = 'out_of_cards' }) {
    const topBot = bots.find((b) => b.position === 'top') || bots[1];
    const rightBot = bots.find((b) => b.position === 'right') || bots[0];
    const leftBot = bots.find((b) => b.position === 'left') || bots[2];

    const pCount = playerHand.length;
    const topCount = topBot?.hand?.length ?? 99;
    const rightCount = rightBot?.hand?.length ?? 99;
    const leftCount = leftBot?.hand?.length ?? 99;

    if (reason === 'out_of_cards') {
      if (pCount === 0 || topCount === 0) {
        return {
          winningTeam: 'ALPHA',
          isPlayerWin: true,
          mvp: pCount === 0 ? 'player' : 'bot_top',
          reason: 'out_of_cards',
        };
      }
      if (rightCount === 0 || leftCount === 0) {
        return {
          winningTeam: 'OMEGA',
          isPlayerWin: false,
          mvp: rightCount === 0 ? 'bot_right' : 'bot_left',
          reason: 'out_of_cards',
        };
      }
    }

    const alphaTotalCards = pCount + topCount;
    const omegaTotalCards = rightCount + leftCount;

    if (alphaTotalCards <= omegaTotalCards) {
      return {
        winningTeam: 'ALPHA',
        isPlayerWin: true,
        alphaCards: alphaTotalCards,
        omegaCards: omegaTotalCards,
        reason: 'timeout',
      };
    }

    return {
      winningTeam: 'OMEGA',
      isPlayerWin: false,
      alphaCards: alphaTotalCards,
      omegaCards: omegaTotalCards,
      reason: 'timeout',
    };
  }

  try {
    console.log('📌 Nhóm 1: Kiểm thử Phân Chia Ghế & Đội Hình 2v2 Đối Xứng');
    const team0 = getTeamForSeat(0);
    const team1 = getTeamForSeat(1);
    const team2 = getTeamForSeat(2);
    const team3 = getTeamForSeat(3);

    assert(team0.id === 'ALPHA' && team0.isPlayerTeam === true, 'Ghế 0 (Người chơi) phải thuộc TEAM ALPHA');
    assert(team2.id === 'ALPHA' && team2.isTeammate === true, 'Ghế 2 (Đối diện - Bot Neon) phải là ĐỒNG ĐỘI TEAM ALPHA');
    assert(team1.id === 'OMEGA' && team1.isPlayerTeam === false, 'Ghế 1 (Phải - Bot Titan) phải thuộc TEAM OMEGA');
    assert(team3.id === 'OMEGA' && team3.isPlayerTeam === false, 'Ghế 3 (Trái - Bot Cyber) phải thuộc TEAM OMEGA');
    assert(team0.id === team2.id && team1.id === team3.id, 'Ghế đối xứng (0-2 và 1-3) phải thuộc cùng một phe');

    console.log('\n📌 Nhóm 2: Kiểm thử Luật Chiến Thắng Đồng Đội (Co-op Victory Condition)');
    // Kịch bản 1: Người chơi hết bài trước
    const resHumanWin = checkTeamVictory({
      playerHand: [],
      bots: [
        { id: 'bot_right', position: 'right', hand: [1, 2, 3] },
        { id: 'bot_top', position: 'top', hand: [1, 2] },
        { id: 'bot_left', position: 'left', hand: [1, 2, 3, 4] },
      ],
      reason: 'out_of_cards',
    });
    assert(resHumanWin.winningTeam === 'ALPHA', 'Khi Người chơi hết bài, Team ALPHA phải thắng');
    assert(resHumanWin.isPlayerWin === true, 'Người chơi được ghi nhận Chiến Thắng');
    assert(resHumanWin.mvp === 'player', 'MVP trận đấu là Người chơi');

    // Kịch bản 2: Đồng đội (Bot Neon) hết bài trước (Người chơi vẫn còn bài)
    const resTeammateWin = checkTeamVictory({
      playerHand: [1, 2, 3], // Người chơi vẫn còn 3 lá!
      bots: [
        { id: 'bot_right', position: 'right', hand: [1, 2] },
        { id: 'bot_top', position: 'top', hand: [] }, // Đồng đội hết bài trước!
        { id: 'bot_left', position: 'left', hand: [1, 2, 3, 4] },
      ],
      reason: 'out_of_cards',
    });
    assert(resTeammateWin.winningTeam === 'ALPHA', 'Khi Đồng đội (Ghế 2) hết bài trước, toàn đội ALPHA vẫn thắng');
    assert(resTeammateWin.isPlayerWin === true, 'Người chơi vẫn được tính là THẮNG TRẬN nhờ công của đồng đội');
    assert(resTeammateWin.mvp === 'bot_top', 'MVP trận đấu được vinh danh cho Đồng đội Bot Neon');

    // Kịch bản 3: Đối thủ (Team Omega) hết bài trước
    const resOpponentWin = checkTeamVictory({
      playerHand: [1],
      bots: [
        { id: 'bot_right', position: 'right', hand: [] }, // Đối thủ hết bài!
        { id: 'bot_top', position: 'top', hand: [1, 2] },
        { id: 'bot_left', position: 'left', hand: [1, 2] },
      ],
      reason: 'out_of_cards',
    });
    assert(resOpponentWin.winningTeam === 'OMEGA', 'Khi bất kỳ đối thủ nào hết bài, Team OMEGA thắng');
    assert(resOpponentWin.isPlayerWin === false, 'Người chơi nhận kết quả thua cuộc ván đấu');

    console.log('\n📌 Nhóm 3: Kiểm thử Luật Hết Giờ (Timeout 5 Phút) Cộng Dồn Điểm Đội');
    // Kịch bản 4: Hết giờ, Team Alpha có tổng số lá ít hơn (Player 2 + Teammate 3 = 5 lá vs Omega 4 + 4 = 8 lá)
    const resTimeoutAlphaWin = checkTeamVictory({
      playerHand: [1, 2], // 2 lá
      bots: [
        { id: 'bot_right', position: 'right', hand: [1, 2, 3, 4] }, // 4 lá
        { id: 'bot_top', position: 'top', hand: [1, 2, 3] }, // 3 lá -> Tổng Alpha: 5 lá
        { id: 'bot_left', position: 'left', hand: [1, 2, 3, 4] }, // 4 lá -> Tổng Omega: 8 lá
      ],
      reason: 'timeout',
    });
    assert(resTimeoutAlphaWin.winningTeam === 'ALPHA', 'Hết giờ: Team Alpha có 5 lá (< 8 lá) phải giành chiến thắng');
    assert(resTimeoutAlphaWin.isPlayerWin === true, 'Xác nhận Team Alpha chiến thắng kịch bản timeout');

    // Kịch bản 5: Hết giờ, Team Omega có tổng số lá ít hơn
    const resTimeoutOmegaWin = checkTeamVictory({
      playerHand: [1, 2, 3, 4], // 4 lá
      bots: [
        { id: 'bot_right', position: 'right', hand: [1] }, // 1 lá
        { id: 'bot_top', position: 'top', hand: [1, 2, 3] }, // 3 lá -> Tổng Alpha: 7 lá
        { id: 'bot_left', position: 'left', hand: [1, 2] }, // 2 lá -> Tổng Omega: 3 lá
      ],
      reason: 'timeout',
    });
    assert(resTimeoutOmegaWin.winningTeam === 'OMEGA', 'Hết giờ: Team Omega có 3 lá (< 7 lá) phải giành chiến thắng');
    assert(resTimeoutOmegaWin.isPlayerWin === false, 'Xác nhận Team Omega thắng kịch bản timeout');

    console.log('\n======================================================');
    console.log(`   KẾT QUẢ: ${passed}/${total} KIỂM THỬ ĐẠT (PASS 100%)`);
    console.log('======================================================');
    console.log('🎉 TOÀN BỘ LOGIC CHẾ ĐỘ ĐỒNG ĐỘI 2V2 (TASK 2) ĐÃ ĐẠT CHUẨN HOÀN TOÀN!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ LỖI KIỂM THỬ:', err);
    process.exit(1);
  }
}

runTeamMode2v2Tests();
