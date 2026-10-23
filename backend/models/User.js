const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    nickname: {
      type: String,
      required: [true, 'Vui lòng nhập tên người dùng'],
      unique: true,
      trim: true,
      minlength: [3, 'Tên người dùng phải từ 3 ký tự trở lên'],
      maxlength: [30, 'Tên người dùng không được quá 30 ký tự'],
    },
    email: {
      type: String,
      required: [true, 'Vui lòng nhập email'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Vui lòng nhập mật khẩu'],
      minlength: [6, 'Mật khẩu phải từ 6 ký tự trở lên'],
    },
    avatar: {
      type: String,
      default: '👤',
    },
    elo: {
      type: Number,
      default: 1000,
    },
    coins: {
      type: Number,
      default: 1000,
    },
    matchesWon: {
      type: Number,
      default: 0,
    },
    matchesLost: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    exp: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: ['player', 'admin', 'guest', 'bot'],
      default: 'player',
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  userObject.id = userObject._id.toString();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
