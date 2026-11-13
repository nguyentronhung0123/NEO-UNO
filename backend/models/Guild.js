const mongoose = require('mongoose');

const guildMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    nickname: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: 'avatar_1',
    },
    elo: {
      type: Number,
      default: 1200,
    },
    role: {
      type: String,
      enum: ['leader', 'officer', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    contributionPoints: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const guildChatMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderAvatar: {
      type: String,
      default: 'avatar_1',
    },
    senderRole: {
      type: String,
      default: 'member',
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const guildSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên Bang Hội'],
      trim: true,
      minlength: [3, 'Tên Bang Hội phải có ít nhất 3 ký tự'],
      maxlength: [30, 'Tên Bang Hội không vượt quá 30 ký tự'],
    },
    tag: {
      type: String,
      required: [true, 'Vui lòng nhập Tag viết tắt của Bang Hội'],
      trim: true,
      uppercase: true,
      minlength: [2, 'Tag phải từ 2 đến 6 ký tự'],
      maxlength: [6, 'Tag phải từ 2 đến 6 ký tự'],
      unique: true,
    },
    slogan: {
      type: String,
      trim: true,
      maxlength: [100, 'Châm ngôn không vượt quá 100 ký tự'],
      default: 'Gia nhập quân đoàn Cyberpunk cùng chiến đấu và thống trị đấu trường!',
    },
    emblem: {
      type: String,
      default: '🛡️',
    },
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
    exp: {
      type: Number,
      default: 0,
    },
    treasuryCoins: {
      type: Number,
      default: 0,
    },
    maxMembers: {
      type: Number,
      default: 15,
    },
    members: {
      type: [guildMemberSchema],
      default: [],
    },
    chatMessages: {
      type: [guildChatMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

guildSchema.index({ level: -1, exp: -1 });

module.exports = mongoose.model('Guild', guildSchema);
