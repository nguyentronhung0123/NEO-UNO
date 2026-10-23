const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      default: 'SOLO_BOT',
    },
    mode: {
      type: String,
      enum: ['1v1', '3p', '4p', 'custom'],
      default: '4p',
    },
    winner: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      isHuman: { type: Boolean, default: false },
    },
    reason: {
      type: String,
      enum: ['out_of_cards', 'timeout', 'forfeit_afk', 'player_quit'],
      default: 'out_of_cards',
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    players: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        isHuman: { type: Boolean, default: false },
        avatar: { type: String, default: '👤' },
        rank: { type: Number, required: true },
        finalScore: { type: Number, default: 0 },
        cardsRemaining: { type: Number, default: 0 },
        eloDelta: { type: Number, default: 0 },
        coinsDelta: { type: Number, default: 0 },
        expDelta: { type: Number, default: 0 },
        newElo: { type: Number, default: 1000 },
        isForfeit: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Match', matchSchema);
