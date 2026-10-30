const mongoose = require('mongoose');

const questItemSchema = new mongoose.Schema(
  {
    questId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: 'task_alt',
    },
    target: {
      type: Number,
      required: true,
      default: 1,
    },
    current: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewardCoins: {
      type: Number,
      default: 100,
    },
    rewardExp: {
      type: Number,
      default: 30,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    isClaimed: {
      type: Boolean,
      default: false,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const userQuestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dateKey: {
      type: String, // Định dạng YYYY-MM-DD theo giờ UTC/Local
      required: true,
      index: true,
    },
    quests: [questItemSchema],
    isDailyChestClaimed: {
      type: Boolean,
      default: false,
    },
    dailyChestClaimedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userQuestSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model('UserQuest', userQuestSchema);
