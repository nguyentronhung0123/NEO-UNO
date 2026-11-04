const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reporterName: {
      type: String,
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetUserName: {
      type: String,
      required: true,
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: false,
      index: true,
    },
    roomCode: {
      type: String,
      default: 'SOLO_BOT',
    },
    reason: {
      type: String,
      enum: ['afk_delay', 'cheating_exploit', 'toxic_chat', 'teaming', 'other'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    evidenceTurn: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved_penalized', 'dismissed'],
      default: 'pending',
      index: true,
    },
    resolution: {
      action: {
        type: String,
        enum: ['none', 'warning', 'deduct_elo', 'temp_ban', 'perm_ban'],
        default: 'none',
      },
      penaltyAmount: {
        type: Number,
        default: 0,
      },
      resolvedBy: {
        type: String,
        default: null,
      },
      resolvedAt: {
        type: Date,
        default: null,
      },
      notes: {
        type: String,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Report', reportSchema);
