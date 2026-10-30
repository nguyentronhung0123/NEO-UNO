const Match = require('../models/Match');
const User = require('../models/User');
const PlayerStats = require('../models/PlayerStats');
const SecurityLog = require('../models/SecurityLog');

// 0. CẤU HÌNH BOT ĐẤU TRƯỜNG ĐỒNG BỘ ELO
const BOT_DEFINITIONS = [
  {
    regex: /titan/i,
    nickname: 'Bot Titan 🛡️',
    email: 'bot_titan@neouno.ai',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=BotTitan',
  },
  {
    regex: /neon/i,
    nickname: 'Bot Neon ⚡',
    email: 'bot_neon@neouno.ai',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=BotNeon',
  },
  {
    regex: /cyber/i,
    nickname: 'Bot Cyber 🤖',
    email: 'bot_cyber@neouno.ai',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=BotCyber',
  },
];

async function findOrCreateBot(playerEntry) {
  const matched = BOT_DEFINITIONS.find(b => 
    b.regex.test(playerEntry.id) || b.regex.test(playerEntry.name)
  );
  if (!matched) return null;

  let botUser = await User.findOne({
    $or: [{ email: matched.email }, { nickname: matched.nickname }]
  });

  if (!botUser) {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('bot_secret_password_2026', 10);
    botUser = await User.create({
      nickname: matched.nickname,
      email: matched.email,
      password: hash,
      avatar: matched.avatar,
      elo: 1000,
      coins: 1000,
      level: 1,
      exp: 0,
      role: 'bot',
    });
  }

  return botUser;
}

function calculateDeltas(totalPlayerCount, rank) {
  let eloDelta = 0;
  let coinsDelta = 0;
  let expDelta = 0;
  let isWin = false;
  let isLoss = false;

  if (totalPlayerCount === 2) {
    // Solo 1v1
    if (rank === 1) {
      eloDelta = +15;
      coinsDelta = +70;
      expDelta = +50;
      isWin = true;
    } else {
      eloDelta = -15;
      coinsDelta = +15;
      expDelta = +10;
      isLoss = true;
    }
  } else if (totalPlayerCount === 3) {
    // Bàn 3 người
    if (rank === 1) {
      eloDelta = +20;
      coinsDelta = +100;
      expDelta = +70;
      isWin = true;
    } else if (rank === 2) {
      eloDelta = +5;
      coinsDelta = +50;
      expDelta = +35;
    } else {
      eloDelta = -15;
      coinsDelta = +20;
      expDelta = +15;
      isLoss = true;
    }
  } else {
    // Bàn 4 người (chuẩn)
    if (rank === 1) {
      eloDelta = +30;
      coinsDelta = +150;
      expDelta = +100;
      isWin = true;
    } else if (rank === 2) {
      eloDelta = +10;
      coinsDelta = +75;
      expDelta = +50;
    } else if (rank === 3) {
      eloDelta = -5;
      coinsDelta = +40;
      expDelta = +25;
      isLoss = true;
    } else {
      eloDelta = -20;
      coinsDelta = +20;
      expDelta = +10;
      isLoss = true;
    }
  }

  return { eloDelta, coinsDelta, expDelta, isWin, isLoss };
}

// 1. GHI NHẬN KẾT QUẢ VÁN ĐẤU & TÍNH ĐIỂM ELO
exports.recordMatch = async (req, res) => {
  try {
    const { roomCode, winner, reason, durationSeconds, players, userId } = req.body;

    if (!winner || !players || !Array.isArray(players)) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin kết quả trận đấu!'
      });
    }

    // Xác định mode trận đấu
    const totalPlayerCount = players.length;
    const matchMode = totalPlayerCount === 2 ? '1v1' : totalPlayerCount === 3 ? '3p' : '4p';

    // Xác định danh tính tài khoản người chơi (từ body, token hoặc user active gần nhất)
    let targetUserId = userId;
    if (!targetUserId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'neo_uno_super_secret_jwt_key_2026_xyz';
        const decoded = jwt.verify(token, JWT_SECRET);
        targetUserId = decoded.id;
      } catch (err) {
        console.warn('[Match Record] Token decode warning:', err.message);
      }
    }

    if (!targetUserId) {
      const lastActiveUser = await User.findOne({ role: 'player' }).sort({ lastLoginAt: -1, updatedAt: -1 });
      if (lastActiveUser) {
        targetUserId = lastActiveUser._id;
      } else {
        const anyUser = await User.findOne({ role: { $nin: ['bot', 'guest'] } });
        if (anyUser) targetUserId = anyUser._id;
      }
    }

    // 0. BẢO MẬT & KIỂM TRA TÀI KHOẢN NGƯỜI DÙNG (ANTI-CHEAT PRE-CHECKS)
    let preloadedHumanUser = null;
    if (targetUserId) {
      preloadedHumanUser = await User.findById(targetUserId);
    }

    // A. Chặn tài khoản đã bị khóa (Banned)
    if (preloadedHumanUser && preloadedHumanUser.isBanned) {
      return res.status(403).json({
        success: false,
        message: `Tài khoản của bạn đã bị KHÓA do vi phạm quy tắc an toàn hoặc nghi vấn gian lận! Lý do: ${preloadedHumanUser.banReason || 'Vi phạm điều khoản trò chơi'}`,
        isBanned: true,
      });
    }

    // B. Chống spam ghi nhận kết quả liên tục (Rate-limiting Cooldown 12s giữa các ván)
    if (preloadedHumanUser && preloadedHumanUser.lastMatchAt) {
      const elapsedMs = Date.now() - new Date(preloadedHumanUser.lastMatchAt).getTime();
      if (elapsedMs < 12000) {
        await SecurityLog.create({
          userId: preloadedHumanUser._id,
          action: 'RATE_LIMIT_EXCEEDED',
          severity: 'warning',
          details: {
            reason: 'MATCH_RECORD_SPAM_COOLDOWN',
            elapsedMs,
            thresholdMs: 12000,
            roomCode,
          },
          performedBy: preloadedHumanUser.nickname || 'USER',
          ipAddress: req.ip || req.connection?.remoteAddress,
        });

        return res.status(429).json({
          success: false,
          message: 'Thao tác quá nhanh! Vui lòng chờ ít nhất 12 giây giữa các ván đấu để hệ thống kiểm toán tính hợp lệ.',
          retryAfterSeconds: Math.ceil((12000 - elapsedMs) / 1000),
        });
      }
    }

    // C. Kiểm tra nghi vấn Speedrun bất thường (< 12 giây mà không phải do bỏ cuộc)
    const matchDuration = Number(durationSeconds) || 0;
    const isMatchForfeit = Boolean(req.body.isForfeit);
    let isSpeedrunSuspicious = false;

    if (matchDuration > 0 && matchDuration < 12 && !isMatchForfeit) {
      isSpeedrunSuspicious = true;
      if (preloadedHumanUser) {
        preloadedHumanUser.isFlagged = true;
        if (!Array.isArray(preloadedHumanUser.cheatWarnings)) {
          preloadedHumanUser.cheatWarnings = [];
        }
        preloadedHumanUser.cheatWarnings.push(
          `Cảnh báo speedrun: Ván đấu kết thúc bất thường trong ${matchDuration}s vào ${new Date().toISOString()}`
        );
        await preloadedHumanUser.save();
      }

      await SecurityLog.create({
        userId: preloadedHumanUser?._id,
        action: 'SUSPICIOUS_EXPLOIT_ATTEMPT',
        severity: 'warning',
        details: {
          reason: 'MATCH_SPEEDRUN_TOO_FAST',
          durationSeconds: matchDuration,
          thresholdSeconds: 12,
          roomCode,
        },
        performedBy: preloadedHumanUser?.nickname || 'USER',
        ipAddress: req.ip || req.connection?.remoteAddress,
      });
    }

    const enrichedPlayers = [];
    const playersResult = [];

    let updatedHumanUser = null;
    let updatedHumanStats = null;
    let humanRank = 4;
    let humanEloDelta = 0;
    let humanCoinsDelta = 0;
    let humanExpDelta = 0;
    let humanIsLevelUp = false;

    // TÍNH ĐIỂM ELO VÀ CẬP NHẬT THỐNG KÊ CHO TOÀN BỘ NGƯỜI CHƠI VÀ CÁC BOT AI
    for (const p of players) {
      const isHuman = Boolean(p.isHuman || p.id === 'player' || (targetUserId && p.id === String(targetUserId)));
      let userDoc = null;

      if (isHuman) {
        if (targetUserId) {
          userDoc = preloadedHumanUser || await User.findById(targetUserId);
        }
      } else {
        userDoc = await findOrCreateBot(p);
      }

      // Nếu người chơi bỏ cuộc / thoát trận (AFK): tự động xếp hạng chót
      const isPlayerForfeit = isHuman && (isMatchForfeit || Boolean(p.isForfeit));
      const pRank = isPlayerForfeit ? totalPlayerCount : (p.rank || totalPlayerCount);

      let { eloDelta, coinsDelta, expDelta, isWin, isLoss } = calculateDeltas(totalPlayerCount, pRank);

      // HÌNH PHẠT BỎ CUỘC: Phạt thêm -10 ELO và 0 Coins/EXP
      if (isPlayerForfeit) {
        eloDelta = eloDelta - 10;
        coinsDelta = 0;
        expDelta = 0;
        isLoss = true;
        isWin = false;
      }

      // CHỐNG HACK SPEEDRUN: Nếu phát hiện bất thường, không cộng ELO/Coins/EXP
      if (isSpeedrunSuspicious && isHuman) {
        eloDelta = 0;
        coinsDelta = 0;
        expDelta = 0;
      }

      if (userDoc) {
        // Chế độ Khách: Chỉ chơi với Bot, không tính điểm ELO xếp hạng
        const isGuestUser = userDoc.role === 'guest';
        let effectiveEloDelta = isGuestUser ? 0 : eloDelta;

        // RÀNG BUỘC SERVER-AUTHORITATIVE: Giới hạn biên độ an toàn deltas
        effectiveEloDelta = Math.max(-50, Math.min(35, effectiveEloDelta));
        coinsDelta = Math.max(0, Math.min(150, coinsDelta));
        expDelta = Math.max(0, Math.min(100, expDelta));

        let stats = await PlayerStats.findOne({ user: userDoc._id });
        if (!stats) {
          stats = await PlayerStats.create({ user: userDoc._id });
        }

        stats.totalMatches += 1;
        if (isWin && !isSpeedrunSuspicious) {
          stats.wins += 1;
          stats.winStreak += 1;
          userDoc.matchesWon = (userDoc.matchesWon || 0) + 1;
          if (stats.winStreak > stats.highestWinStreak) {
            stats.highestWinStreak = stats.winStreak;
          }
        } else if (isLoss) {
          stats.losses += 1;
          stats.winStreak = 0;
          userDoc.matchesLost = (userDoc.matchesLost || 0) + 1;
        }

        const oldLevel = userDoc.level || 1;
        // Ràng buộc ELO tối thiểu 0, tối đa 4000
        userDoc.elo = Math.min(4000, Math.max(0, (userDoc.elo || 1000) + effectiveEloDelta));
        userDoc.coins = Math.max(0, (userDoc.coins || 0) + coinsDelta);
        userDoc.exp = (userDoc.exp || 0) + expDelta;

        // Cập nhật timestamp ván đấu gần nhất phục vụ kiểm toán cooldown
        if (isHuman) {
          userDoc.lastMatchAt = new Date();
        }

        const nextLevel = Math.floor(userDoc.exp / 150) + 1;
        let isLevelUp = false;
        if (nextLevel > oldLevel) {
          userDoc.level = nextLevel;
          userDoc.coins += 250;
          isLevelUp = true;
        }

        stats.winRate = Math.round((stats.wins / stats.totalMatches) * 100);
        stats.totalScore += (p.finalScore || 0);

        await userDoc.save();
        await stats.save();

        if (isHuman) {
          updatedHumanUser = userDoc;
          updatedHumanStats = stats;
          humanRank = pRank;
          humanEloDelta = effectiveEloDelta;
          humanCoinsDelta = coinsDelta;
          humanExpDelta = expDelta;
          humanIsLevelUp = isLevelUp;
        }

        const playerEntry = {
          id: p.id,
          name: p.name,
          isHuman,
          avatar: userDoc.avatar || p.avatar || '👤',
          rank: pRank,
          finalScore: p.finalScore || 0,
          cardsRemaining: p.cardsRemaining || 0,
          eloDelta: effectiveEloDelta,
          coinsDelta,
          expDelta,
          newElo: userDoc.elo,
          isForfeit: isPlayerForfeit,
        };
        enrichedPlayers.push(playerEntry);

        playersResult.push({
          ...playerEntry,
          nickname: userDoc.nickname,
          newCoins: userDoc.coins,
          newLevel: userDoc.level,
          isLevelUp
        });
      } else {
        const playerEntry = {
          id: p.id,
          name: p.name,
          isHuman,
          avatar: p.avatar || '👤',
          rank: pRank,
          finalScore: p.finalScore || 0,
          cardsRemaining: p.cardsRemaining || 0,
          eloDelta,
          coinsDelta,
          expDelta,
          newElo: 1000 + eloDelta,
          isForfeit: isPlayerForfeit,
        };
        enrichedPlayers.push(playerEntry);

        playersResult.push({
          ...playerEntry,
          newCoins: 1000 + coinsDelta,
          newLevel: 1,
          isLevelUp: false
        });
      }
    }

    // Lưu bản ghi Match hoàn chỉnh vào MongoDB Atlas với thông tin đầy đủ
    const newMatch = await Match.create({
      roomCode: roomCode || 'SOLO_BOT',
      mode: matchMode,
      winner,
      reason: reason || (isMatchForfeit ? 'forfeit_afk' : 'out_of_cards'),
      durationSeconds: durationSeconds || 0,
      players: enrichedPlayers
    });

    // GHI NHẬN NHẬT KÝ AN NINH (Security Audit Log)
    if (updatedHumanUser) {
      await SecurityLog.create({
        userId: updatedHumanUser._id,
        action: 'RECORD_MATCH_POINTS',
        severity: isSpeedrunSuspicious ? 'warning' : 'info',
        details: {
          matchId: newMatch._id,
          roomCode: newMatch.roomCode,
          mode: matchMode,
          rank: humanRank,
          eloDelta: humanEloDelta,
          coinsDelta: humanCoinsDelta,
          newElo: updatedHumanUser.elo,
          newCoins: updatedHumanUser.coins,
          durationSeconds: matchDuration,
          isSpeedrunSuspicious,
          isForfeit: isMatchForfeit,
        },
        performedBy: updatedHumanUser.nickname || 'SYSTEM',
        ipAddress: req.ip || req.connection?.remoteAddress,
      });
    }

    return res.status(201).json({
      success: true,
      message: isMatchForfeit ? 'Đã xử thua và áp dụng hình phạt bỏ cuộc (-10 ELO)!' : 'Ghi nhận kết quả trận đấu thành công!',
      matchId: newMatch._id,
      isForfeit: isMatchForfeit,
      humanRank,
      eloDelta: humanEloDelta,
      coinsDelta: humanCoinsDelta,
      expDelta: humanExpDelta,
      isLevelUp: humanIsLevelUp,
      newElo: updatedHumanUser ? updatedHumanUser.elo : 1000,
      newCoins: updatedHumanUser ? updatedHumanUser.coins : 1000,
      newLevel: updatedHumanUser ? updatedHumanUser.level : 1,
      updatedUser: updatedHumanUser,
      updatedStats: updatedHumanStats,
      playersResult
    });
  } catch (error) {
    console.error('[Match Record Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lưu kết quả trận đấu!'
    });
  }
};

// 2. LẤY LỊCH SỬ CÁC TRẬN GẦN NHẤT (Chung toàn server)
exports.getMatchHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const matches = await Match.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: matches.length,
      matches
    });
  } catch (error) {
    console.error('[Match History Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lịch sử trận đấu!'
    });
  }
};

// 3. LẤY LỊCH SỬ ĐẤU CHI TIẾT CỦA NGƯỜI CHƠI (Hỗ trợ lọc, phân trang và thống kê tóm tắt)
exports.getMyMatchHistory = async (req, res) => {
  try {
    let targetUserId = req.query.userId;
    if (!targetUserId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'neo_uno_super_secret_jwt_key_2026_xyz';
        const decoded = jwt.verify(token, JWT_SECRET);
        targetUserId = decoded.id;
      } catch (err) {
        // ignore
      }
    }

    if (!targetUserId) {
      const lastActiveUser = await User.findOne({ role: 'player' }).sort({ lastLoginAt: -1, updatedAt: -1 });
      if (lastActiveUser) targetUserId = lastActiveUser._id;
    }

    const filter = req.query.filter || 'all'; // 'all', 'win', 'loss'
    const mode = req.query.mode || 'all'; // 'all', '1v1', '3p', '4p'
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * limit;

    // Lấy tất cả trận đấu trong database
    const allMatches = await Match.find().sort({ createdAt: -1 });

    let totalMatches = 0;
    let wins = 0;
    let losses = 0;
    let rank1Count = 0;
    let rank2Count = 0;
    let rank3Count = 0;
    let rank4Count = 0;

    const formattedMatches = [];

    for (const m of allMatches) {
      // Tìm vị trí của người chơi trong trận đấu
      const pEntry = m.players.find(p => 
        p.isHuman || 
        p.id === 'player' || 
        (targetUserId && String(p.id) === String(targetUserId))
      ) || m.players[0];

      if (!pEntry) continue;

      const totalPlayerCount = m.players.length;
      const detectedMode = m.mode || (totalPlayerCount === 2 ? '1v1' : totalPlayerCount === 3 ? '3p' : '4p');
      const isWinner = pEntry.rank === 1;

      // Fallback tính deltas nếu bản ghi cũ chưa lưu
      let eloDelta = pEntry.eloDelta;
      let coinsDelta = pEntry.coinsDelta;
      let expDelta = pEntry.expDelta;
      if (eloDelta === undefined || eloDelta === null) {
        const fallback = calculateDeltas(totalPlayerCount, pEntry.rank);
        eloDelta = fallback.eloDelta;
        coinsDelta = fallback.coinsDelta;
        expDelta = fallback.expDelta;
      }

      totalMatches++;
      if (isWinner) wins++;
      else losses++;

      if (pEntry.rank === 1) rank1Count++;
      else if (pEntry.rank === 2) rank2Count++;
      else if (pEntry.rank === 3) rank3Count++;
      else rank4Count++;

      formattedMatches.push({
        _id: m._id,
        roomCode: m.roomCode,
        mode: detectedMode,
        reason: m.reason,
        durationSeconds: m.durationSeconds,
        createdAt: m.createdAt,
        winner: m.winner,
        myResult: {
          rank: pEntry.rank,
          isWin: isWinner,
          isForfeit: Boolean(pEntry.isForfeit || m.reason === 'forfeit_afk'),
          cardsRemaining: pEntry.cardsRemaining || 0,
          finalScore: pEntry.finalScore || 0,
          eloDelta,
          coinsDelta,
          expDelta,
          newElo: pEntry.newElo || 1000
        },
        players: m.players.map(p => {
          let pEloDelta = p.eloDelta;
          if (pEloDelta === undefined || pEloDelta === null) {
            pEloDelta = calculateDeltas(totalPlayerCount, p.rank).eloDelta;
          }
          return {
            id: p.id,
            name: p.name,
            avatar: p.avatar || '👤',
            isHuman: p.isHuman,
            rank: p.rank,
            finalScore: p.finalScore || 0,
            cardsRemaining: p.cardsRemaining || 0,
            eloDelta: pEloDelta
          };
        })
      });
    }

    // Lọc theo chế độ mode
    let filtered = formattedMatches;
    if (mode && mode !== 'all') {
      filtered = filtered.filter(m => m.mode === mode);
    }

    // Lọc theo filter 'win' | 'loss'
    if (filter === 'win') {
      filtered = filtered.filter(m => m.myResult.isWin);
    } else if (filter === 'loss') {
      filtered = filtered.filter(m => !m.myResult.isWin);
    }

    const paginatedMatches = filtered.slice(skip, skip + limit);

    // Lấy thông tin user hiện tại
    let currentUser = null;
    let currentStats = null;
    if (targetUserId) {
      currentUser = await User.findById(targetUserId).select('-password');
      currentStats = await PlayerStats.findOne({ user: targetUserId });
    }

    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    return res.status(200).json({
      success: true,
      summary: {
        totalMatches,
        wins,
        losses,
        winRate,
        rank1Count,
        rank2Count,
        rank3Count,
        rank4Count,
        highestWinStreak: currentStats ? currentStats.highestWinStreak : 0,
        winStreak: currentStats ? currentStats.winStreak : 0,
        elo: currentUser ? currentUser.elo : 1000,
        coins: currentUser ? currentUser.coins : 1000,
        level: currentUser ? currentUser.level : 1,
        nickname: currentUser ? currentUser.nickname : 'Người Chơi',
        avatar: currentUser ? currentUser.avatar : '👤'
      },
      pagination: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit) || 1
      },
      matches: paginatedMatches
    });
  } catch (error) {
    console.error('[Get My Match History Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lịch sử đấu cá nhân!'
    });
  }
};
