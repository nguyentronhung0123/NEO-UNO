const Tournament = require('../models/Tournament');
const User = require('../models/User');

// Danh sách pool Master Bots cho giải đấu Cúp
const TOURNAMENT_BOT_POOL = [
  { nickname: 'Nova Striker', avatar: 'avatar_8', avatarFrame: 'frame_default', eloOffset: -50 },
  { nickname: 'Neon Phantom', avatar: 'avatar_4', avatarFrame: 'frame_fire_blaze', eloOffset: +80 },
  { nickname: 'Apex Titan', avatar: 'avatar_5', avatarFrame: 'frame_default', eloOffset: +40 },
  { nickname: 'Alpha Cyber', avatar: 'avatar_2', avatarFrame: 'frame_neon_cyan', eloOffset: +150 },
  { nickname: 'Matrix Zero', avatar: 'avatar_7', avatarFrame: 'frame_rainbow_rgb', eloOffset: -20 },
  { nickname: 'Valkyrie Uno', avatar: 'avatar_3', avatarFrame: 'frame_gold_crown', eloOffset: +120 },
  { nickname: 'Viper Bot AI', avatar: 'avatar_6', avatarFrame: 'frame_halloween', eloOffset: +10 },
  { nickname: 'Shadow Blade', avatar: 'avatar_1', avatarFrame: 'frame_fire_blaze', eloOffset: +60 },
  { nickname: 'Cyber Sentinel', avatar: 'avatar_5', avatarFrame: 'frame_gold_crown', eloOffset: +90 },
];

/**
 * Tạo danh sách 8 đấu thủ (Người chơi + 7 Bots hạt giống)
 */
function generateParticipants(user) {
  const userElo = user?.elo || 1000;
  const userId = String(user?._id || user?.id || 'guest_user');
  const userNickname = user?.nickname || 'Đấu Thủ Neo';
  const userAvatar = user?.avatar || 'avatar_1';
  const userFrame = user?.equippedAvatarFrame || 'frame_default';

  const human = {
    id: userId,
    nickname: userNickname,
    avatar: userAvatar,
    avatarFrame: userFrame,
    elo: userElo,
    isBot: false,
    seed: 1,
  };

  // Trộn pool bots
  const shuffledBots = [...TOURNAMENT_BOT_POOL].sort(() => 0.5 - Math.random());
  const participants = [human];

  for (let i = 0; i < 7; i++) {
    const template = shuffledBots[i];
    participants.push({
      id: `bot_tourn_${i + 1}_${Date.now()}`,
      nickname: template.nickname,
      avatar: template.avatar,
      avatarFrame: template.avatarFrame,
      elo: Math.max(800, userElo + template.eloOffset),
      isBot: true,
      seed: i + 2, // 2..8
    });
  }

  return participants;
}

/**
 * Khởi tạo 7 trận đấu trong sơ đồ phân nhánh (Bracket)
 * Tứ Kết: 1v8, 4v5, 2v7, 3v6
 * Bán Kết: W1vW2, W3vW4
 * Chung Kết: W5vW6
 */
function generateInitialMatches(participants) {
  // Sắp xếp theo seed
  const pBySeed = {};
  participants.forEach(p => { pBySeed[p.seed] = p; });

  const matches = [
    // --- VÒNG TỨ KẾT (ROUND 1) ---
    {
      matchId: 1,
      round: 1,
      roundName: 'Tứ Kết 1',
      player1: pBySeed[1], // Người chơi (Seed 1)
      player2: pBySeed[8], // Seed 8
      winnerId: null,
      winner: null,
      status: 'pending',
      score: { p1CardsLeft: null, p2CardsLeft: null },
      completedAt: null,
    },
    {
      matchId: 2,
      round: 1,
      roundName: 'Tứ Kết 2',
      player1: pBySeed[4],
      player2: pBySeed[5],
      winnerId: null,
      winner: null,
      status: 'pending',
      score: { p1CardsLeft: null, p2CardsLeft: null },
      completedAt: null,
    },
    {
      matchId: 3,
      round: 1,
      roundName: 'Tứ Kết 3',
      player1: pBySeed[2],
      player2: pBySeed[7],
      winnerId: null,
      winner: null,
      status: 'pending',
      score: { p1CardsLeft: null, p2CardsLeft: null },
      completedAt: null,
    },
    {
      matchId: 4,
      round: 1,
      roundName: 'Tứ Kết 4',
      player1: pBySeed[3],
      player2: pBySeed[6],
      winnerId: null,
      winner: null,
      status: 'pending',
      score: { p1CardsLeft: null, p2CardsLeft: null },
      completedAt: null,
    },
    // --- VÒNG BÁN KẾT (ROUND 2) ---
    {
      matchId: 5,
      round: 2,
      roundName: 'Bán Kết 1',
      player1: null, // Thắng Tứ Kết 1
      player2: null, // Thắng Tứ Kết 2
      winnerId: null,
      winner: null,
      status: 'pending',
      score: { p1CardsLeft: null, p2CardsLeft: null },
      completedAt: null,
    },
    {
      matchId: 6,
      round: 2,
      roundName: 'Bán Kết 2',
      player1: null, // Thắng Tứ Kết 3
      player2: null, // Thắng Tứ Kết 4
      winnerId: null,
      winner: null,
      status: 'pending',
      score: { p1CardsLeft: null, p2CardsLeft: null },
      completedAt: null,
    },
    // --- VÒNG CHUNG KẾT (ROUND 3) ---
    {
      matchId: 7,
      round: 3,
      roundName: 'Chung Kết Tranh Cúp',
      player1: null, // Thắng Bán Kết 1
      player2: null, // Thắng Bán Kết 2
      winnerId: null,
      winner: null,
      status: 'pending',
      score: { p1CardsLeft: null, p2CardsLeft: null },
      completedAt: null,
    },
  ];

  return matches;
}

/**
 * Mô phỏng kết quả ván đấu giữa 2 AI bot dựa trên Elo
 */
function simulateBotVsBot(p1, p2) {
  if (!p1 || !p2) return null;
  const eloDiff = (p1.elo || 1000) - (p2.elo || 1000);
  // Tỷ lệ thắng cơ bản 50% + chênh lệch elo (tối đa 85%, tối thiểu 15%)
  const p1WinProb = Math.min(0.85, Math.max(0.15, 0.5 + eloDiff / 800));
  const isP1Winner = Math.random() < p1WinProb;
  const winner = isP1Winner ? p1 : p2;
  const loserCards = Math.floor(Math.random() * 5) + 1;

  return {
    winner,
    score: isP1Winner
      ? { p1CardsLeft: 0, p2CardsLeft: loserCards }
      : { p1CardsLeft: loserCards, p2CardsLeft: 0 },
  };
}

/**
 * [POST] /api/tournaments/join
 * Đăng ký hoặc tạo mới giải đấu Cúp 8 người
 */
exports.joinTournament = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId || 'guest_' + Date.now();
    let user = null;
    if (req.user?.id && require('mongoose').isValidObjectId(req.user.id)) {
      user = await User.findById(req.user.id);
    } else if (req.user) {
      user = req.user;
    } else if (req.body?.user) {
      user = req.body.user;
    }

    // Kiểm tra xem người chơi đã có giải đấu đang dở dang không
    let existingTournament = await Tournament.findOne({
      creatorId: userId,
      status: 'in_progress',
    }).sort({ createdAt: -1 });

    if (existingTournament) {
      return res.status(200).json({
        success: true,
        message: 'Tiếp tục giải đấu Cúp đang diễn ra',
        tournament: existingTournament,
      });
    }

    // Tạo giải đấu mới
    const participants = generateParticipants(user);
    const matches = generateInitialMatches(participants);
    const tournamentId = `CUP_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newTournament = await Tournament.create({
      tournamentId,
      creatorId: userId,
      status: 'in_progress',
      currentRound: 1,
      participants,
      matches,
    });

    return res.status(201).json({
      success: true,
      message: 'Khởi tạo Giải đấu Cúp Vô Địch thành công!',
      tournament: newTournament,
    });
  } catch (err) {
    console.error('[Tournament] ❌ Lỗi joinTournament:', err);
    return res.status(500).json({
      success: false,
      message: 'Không thể khởi tạo giải đấu lúc này.',
      error: err.message,
    });
  }
};

/**
 * [GET] /api/tournaments/:id
 * Lấy chi tiết sơ đồ giải đấu
 */
exports.getTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findOne({ tournamentId: id });
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giải đấu' });
    }
    return res.status(200).json({ success: true, tournament });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * [POST] /api/tournaments/:id/match-result
 * Ghi nhận kết quả trận đấu của người chơi và tự động mô phỏng các nhánh bot
 */
exports.submitMatchResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { matchId, isWin, userCardsLeft, opponentCardsLeft } = req.body;
    const userId = req.user?.id || req.body?.userId;

    const tournament = await Tournament.findOne({ tournamentId: id });
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Giải đấu không tồn tại!' });
    }

    if (tournament.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Giải đấu đã kết thúc!' });
    }

    const match = tournament.matches.find(m => m.matchId === Number(matchId));
    if (!match) {
      return res.status(404).json({ success: false, message: 'Trận đấu không hợp lệ!' });
    }

    if (match.status === 'completed') {
      return res.status(200).json({
        success: true,
        message: 'Trận đấu này đã có kết quả trước đó.',
        tournament,
      });
    }

    // Xác định người thắng trận đấu của Human
    const isPlayer1 = String(match.player1?.id) === String(userId) || !match.player1?.isBot;
    const humanPlayer = isPlayer1 ? match.player1 : match.player2;
    const botOpponent = isPlayer1 ? match.player2 : match.player1;

    const winner = isWin ? humanPlayer : botOpponent;
    match.winner = winner;
    match.winnerId = winner?.id;
    match.status = 'completed';
    match.completedAt = new Date();
    match.score = {
      p1CardsLeft: isWin ? 0 : (userCardsLeft || 3),
      p2CardsLeft: isWin ? (opponentCardsLeft || 4) : 0,
    };

    // 1. NẾU ĐÂY LÀ VÒNG TỨ KẾT (ROUND 1)
    if (match.round === 1) {
      // Mô phỏng 3 trận Tứ kết còn lại (Match 2, 3, 4)
      for (const mId of [2, 3, 4]) {
        const m = tournament.matches.find(item => item.matchId === mId);
        if (m && m.status !== 'completed' && m.player1 && m.player2) {
          const sim = simulateBotVsBot(m.player1, m.player2);
          m.winner = sim.winner;
          m.winnerId = sim.winner.id;
          m.status = 'completed';
          m.score = sim.score;
          m.completedAt = new Date();
        }
      }

      // Đẩy người thắng lên Vòng Bán Kết (Match 5 và Match 6)
      const m1Winner = tournament.matches.find(m => m.matchId === 1)?.winner;
      const m2Winner = tournament.matches.find(m => m.matchId === 2)?.winner;
      const m3Winner = tournament.matches.find(m => m.matchId === 3)?.winner;
      const m4Winner = tournament.matches.find(m => m.matchId === 4)?.winner;

      const m5 = tournament.matches.find(m => m.matchId === 5);
      if (m5) {
        m5.player1 = m1Winner;
        m5.player2 = m2Winner;
      }
      const m6 = tournament.matches.find(m => m.matchId === 6);
      if (m6) {
        m6.player1 = m3Winner;
        m6.player2 = m4Winner;
      }

      if (isWin) {
        tournament.currentRound = 2; // Thăng hạng Bán kết!
      } else {
        tournament.userFinishedStage = 'quarter';
        // Người chơi bị loại, mô phỏng tiếp toàn bộ giải để tìm bot quán quân
        simulateRemainingTournament(tournament);
      }
    }
    // 2. NẾU ĐÂY LÀ VÒNG BÁN KẾT (ROUND 2 - Match 5)
    else if (match.round === 2) {
      // Mô phỏng trận Bán kết 2 (Match 6) nếu chưa xong
      const m6 = tournament.matches.find(m => m.matchId === 6);
      if (m6 && m6.status !== 'completed' && m6.player1 && m6.player2) {
        const sim = simulateBotVsBot(m6.player1, m6.player2);
        m6.winner = sim.winner;
        m6.winnerId = sim.winner.id;
        m6.status = 'completed';
        m6.score = sim.score;
        m6.completedAt = new Date();
      }

      // Đẩy người thắng lên Chung kết (Match 7)
      const m5Winner = tournament.matches.find(m => m.matchId === 5)?.winner;
      const m6Winner = tournament.matches.find(m => m.matchId === 6)?.winner;

      const m7 = tournament.matches.find(m => m.matchId === 7);
      if (m7) {
        m7.player1 = m5Winner;
        m7.player2 = m6Winner;
      }

      if (isWin) {
        tournament.currentRound = 3; // Thăng hạng Chung kết!
      } else {
        tournament.userFinishedStage = 'semi';
        simulateRemainingTournament(tournament);
      }
    }
    // 3. NẾU ĐÂY LÀ VÒNG CHUNG KẾT (ROUND 3 - Match 7)
    else if (match.round === 3) {
      tournament.champion = winner;
      tournament.status = 'completed';
      tournament.currentRound = 4;
      tournament.userFinishedStage = isWin ? 'champion' : 'final';
    }

    await tournament.save();

    return res.status(200).json({
      success: true,
      message: isWin ? 'Chúc mừng bạn đã giành chiến thắng và thăng hạng!' : 'Rất tiếc bạn đã dừng bước tại vòng đấu!',
      tournament,
      finishedStage: tournament.userFinishedStage,
      isChampion: tournament.userFinishedStage === 'champion',
    });
  } catch (err) {
    console.error('[Tournament] ❌ Lỗi submitMatchResult:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Hàm phụ: Mô phỏng toàn bộ các trận còn lại khi người chơi bị loại
 */
function simulateRemainingTournament(tournament) {
  // Bán kết 2 (Match 6)
  const m6 = tournament.matches.find(m => m.matchId === 6);
  if (m6 && m6.status !== 'completed' && m6.player1 && m6.player2) {
    const sim = simulateBotVsBot(m6.player1, m6.player2);
    m6.winner = sim.winner;
    m6.winnerId = sim.winner.id;
    m6.status = 'completed';
    m6.score = sim.score;
    m6.completedAt = new Date();
  }

  // Chung kết (Match 7)
  const m5Winner = tournament.matches.find(m => m.matchId === 5)?.winner;
  const m6Winner = tournament.matches.find(m => m.matchId === 6)?.winner;
  const m7 = tournament.matches.find(m => m.matchId === 7);
  if (m7) {
    m7.player1 = m5Winner;
    m7.player2 = m6Winner;
    if (m7.player1 && m7.player2) {
      const simFinal = simulateBotVsBot(m7.player1, m7.player2);
      m7.winner = simFinal.winner;
      m7.winnerId = simFinal.winner.id;
      m7.status = 'completed';
      m7.score = simFinal.score;
      m7.completedAt = new Date();
      tournament.champion = simFinal.winner;
    }
  }

  tournament.status = 'completed';
  tournament.currentRound = 4;
}

/**
 * [POST] /api/tournaments/:id/claim-reward
 * Nhận thưởng giải đấu Cúp và cập nhật số dư, Cup, Elo cho Người chơi
 */
exports.claimReward = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.body?.userId;

    const tournament = await Tournament.findOne({ tournamentId: id });
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giải đấu' });
    }

    if (tournament.isRewardClaimed) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã nhận phần thưởng của giải đấu này rồi!',
        reward: tournament.claimedReward,
      });
    }

    let stageReward = null;
    switch (tournament.userFinishedStage) {
      case 'champion':
        stageReward = tournament.rewards.champion;
        break;
      case 'final':
        stageReward = tournament.rewards.runnerUp;
        break;
      case 'semi':
        stageReward = tournament.rewards.semiFinalist;
        break;
      default:
        stageReward = tournament.rewards.quarterFinalist;
    }

    tournament.isRewardClaimed = true;
    tournament.claimedReward = {
      coins: stageReward.coins,
      exp: stageReward.exp,
      elo: stageReward.elo,
      title: stageReward.title,
    };
    await tournament.save();

    // Cập nhật CSDL người dùng nếu đăng nhập
    let updatedUser = null;
    if (userId && !String(userId).startsWith('guest_') && require('mongoose').isValidObjectId(userId)) {
      const updateOps = {
        $inc: {
          coins: stageReward.coins,
          exp: stageReward.exp,
          elo: stageReward.elo,
        },
      };

      if (tournament.userFinishedStage === 'champion') {
        updateOps.$inc.tournamentsWon = 1;
        updateOps.$addToSet = { tournamentCups: tournament.title };
      }

      updatedUser = await User.findByIdAndUpdate(userId, updateOps, {
        returnDocument: 'after',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Nhận thưởng thành công! +${stageReward.coins} Vàng, +${stageReward.exp} Exp, +${stageReward.elo} Elo`,
      reward: tournament.claimedReward,
      user: updatedUser,
    });
  } catch (err) {
    console.error('[Tournament] ❌ Lỗi claimReward:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
