const mongoose = require('mongoose');

const playerStatsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    totalMatches: {
      type: Number,
      default: 0,
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    winRate: {
      type: Number,
      default: 0, // Tính theo phần trăm (0 - 100%)
    },
    winStreak: {
      type: Number,
      default: 0,
    },
    highestWinStreak: {
      type: Number,
      default: 0,
    },
    totalCardsPlayed: {
      type: Number,
      default: 0,
    },
    unoCallsSuccess: {
      type: Number,
      default: 0,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PlayerStats', playerStatsSchema);
