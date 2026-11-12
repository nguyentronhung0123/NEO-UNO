const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    nickname: { type: String, required: true },
    avatar: { type: String, default: 'avatar_1' },
    avatarFrame: { type: String, default: 'frame_default' },
    elo: { type: Number, default: 1000 },
    isBot: { type: Boolean, default: false },
    seed: { type: Number, required: true }, // 1 to 8
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    matchId: { type: Number, required: true }, // 1..4 (Tứ kết), 5..6 (Bán kết), 7 (Chung kết)
    round: { type: Number, required: true }, // 1: Tứ kết, 2: Bán kết, 3: Chung kết
    roundName: { type: String, required: true }, // 'Tứ Kết', 'Bán Kết', 'Chung Kết'
    player1: { type: participantSchema, default: null },
    player2: { type: participantSchema, default: null },
    winnerId: { type: String, default: null },
    winner: { type: participantSchema, default: null },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    score: {
      p1CardsLeft: { type: Number, default: null },
      p2CardsLeft: { type: Number, default: null },
    },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const tournamentSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      default: '🏆 CÚP VÔ ĐỊCH NEO UNO ARENA',
    },
    season: {
      type: String,
      default: 'Mùa 1: Cyber Awakening',
    },
    creatorId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'in_progress', 'completed', 'cancelled'],
      default: 'in_progress',
    },
    currentRound: {
      type: Number,
      default: 1, // 1: Tứ kết, 2: Bán kết, 3: Chung kết, 4: Đã kết thúc
    },
    participants: {
      type: [participantSchema],
      validate: [val => val.length === 8, 'Giải đấu phải có chính xác 8 đấu thủ'],
    },
    matches: {
      type: [matchSchema],
      validate: [val => val.length === 7, 'Sơ đồ giải phải có chính xác 7 trận đấu'],
    },
    champion: {
      type: participantSchema,
      default: null,
    },
    rewards: {
      champion: {
        coins: { type: Number, default: 5000 },
        exp: { type: Number, default: 800 },
        elo: { type: Number, default: 60 },
        title: { type: String, default: '👑 Quán Quân Cúp Vô Địch' },
      },
      runnerUp: {
        coins: { type: Number, default: 2000 },
        exp: { type: Number, default: 400 },
        elo: { type: Number, default: 30 },
        title: { type: String, default: '🥈 Á Quân Giải Đấu' },
      },
      semiFinalist: {
        coins: { type: Number, default: 800 },
        exp: { type: Number, default: 200 },
        elo: { type: Number, default: 15 },
        title: { type: String, default: '🥉 Top 4 Bán Kết' },
      },
      quarterFinalist: {
        coins: { type: Number, default: 250 },
        exp: { type: Number, default: 80 },
        elo: { type: Number, default: 5 },
        title: { type: String, default: '🎖️ Top 8 Tứ Kết' },
      },
    },
    userFinishedStage: {
      type: String,
      enum: ['none', 'quarter', 'semi', 'final', 'champion'],
      default: 'none',
    },
    isRewardClaimed: {
      type: Boolean,
      default: false,
    },
    claimedReward: {
      coins: { type: Number, default: 0 },
      exp: { type: Number, default: 0 },
      elo: { type: Number, default: 0 },
      title: { type: String, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tournament', tournamentSchema);
