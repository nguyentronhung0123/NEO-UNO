const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    nickname: {
      type: String,
      required: [true, 'Vui lòng nhập tên người dùng'],
      trim: true,
      minlength: [3, 'Tên người dùng phải từ 3 ký tự trở lên'],
      maxlength: [30, 'Tên người dùng không được quá 30 ký tự'],
    },
    accountId: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      minlength: [10, 'Mã tài khoản phải gồm 10 ký tự'],
      maxlength: [10, 'Mã tài khoản không được quá 10 ký tự'],
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
      default: 'avatar_1',
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

// RÀNG BUỘC CSDL CẤP HỆ THỐNG: 1 Tên không thể có 2 tài khoản sử dụng (Case-insensitive Collation)
userSchema.index(
  { nickname: 1 },
  {
    unique: true,
    collation: { locale: 'en', strength: 2 },
    name: 'unique_nickname_case_insensitive',
  }
);

// PRE-SAVE HOOK (DBMS CONSTRAINT): Thẩm định nghiêm ngặt trước khi ghi dữ liệu
userSchema.pre('save', async function () {
  // Tự động sinh ID tài khoản 10 ký tự nếu chưa có
  if (!this.accountId) {
    if (this._id) {
      this.accountId = this._id.toString().substring(14).toUpperCase();
    } else {
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let candidate = '';
      let isUnique = false;
      while (!isUnique) {
        candidate = '';
        for (let i = 0; i < 10; i++) {
          candidate += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const exists = await this.constructor.findOne({ accountId: candidate });
        if (!exists) isUnique = true;
      }
      this.accountId = candidate;
    }
  }

  if (this.isModified('nickname')) {
    const cleanNick = this.nickname.trim();
    this.nickname = cleanNick;

    const existingUser = await this.constructor.findOne({
      _id: { $ne: this._id },
      nickname: { $regex: new RegExp(`^${cleanNick}$`, 'i') },
    });

    if (existingUser) {
      const err = new Error(
        `RÀNG BUỘC CSDL VI PHẠM: Tên tài khoản "${cleanNick}" đã tồn tại trên hệ thống!`
      );
      err.code = 11000;
      throw err;
    }
  }
});

// CẤU TRÚC FUNCTION THỦ TỤC 1: Tìm kiếm tài khoản tối ưu theo ID (10 ký tự hoặc ObjectId) hoặc Nickname
userSchema.statics.findByNicknameOrId = async function (identifier) {
  if (!identifier) return null;
  const clean = String(identifier).trim();

  // 1. Tra cứu theo ID tài khoản 10 ký tự (Account ID)
  if (clean.length === 10) {
    const userByAccountId = await this.findOne({
      accountId: clean.toUpperCase(),
    });
    if (userByAccountId) return userByAccountId;
  }

  // 2. Nếu là MongoDB ObjectId hợp lệ (24 ký tự hex)
  if (mongoose.Types.ObjectId.isValid(clean) && clean.length === 24) {
    const userById = await this.findById(clean);
    if (userById) return userById;
  }

  // 3. Tra cứu theo Nickname không phân biệt chữ hoa/thường
  return await this.findOne({
    nickname: { $regex: new RegExp(`^${clean}$`, 'i') },
  });
};

// CẤU TRÚC FUNCTION THỦ TỤC 2: Kiểm tra trùng lặp Nickname
userSchema.statics.isNicknameTaken = async function (nickname, excludeUserId = null) {
  if (!nickname) return false;
  const clean = nickname.trim();
  const query = {
    nickname: { $regex: new RegExp(`^${clean}$`, 'i') },
  };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  const count = await this.countDocuments(query);
  return count > 0;
};

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  userObject.id = userObject._id.toString();
  userObject.accountId = userObject.accountId || userObject._id.toString().substring(14).toUpperCase();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
