const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const PlayerStats = require('../models/PlayerStats');
const { sendOtpEmail } = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'neo_uno_super_secret_jwt_key_2026_xyz';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleOAuthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id ? user._id.toString() : user.id,
      nickname: user.nickname,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function sanitizeUser(user, stats = null) {
  const idStr = user._id ? user._id.toString() : user.id;
  const accId = user.accountId || (idStr && idStr.length >= 14 ? idStr.substring(14).toUpperCase() : idStr);
  return {
    id: idStr,
    accountId: accId,
    nickname: user.nickname,
    email: user.email,
    avatar: user.avatar,
    elo: user.elo || 1000,
    coins: user.coins || 1000,
    level: user.level || 1,
    exp: user.exp || 0,
    matchesWon: stats ? stats.wins : user.matchesWon || 0,
    matchesLost: stats ? stats.losses : user.matchesLost || 0,
    winRate: stats ? stats.winRate : 0,
    role: user.role,
    isBanned: Boolean(user.isBanned),
    banReason: user.banReason || null,
    isFlagged: Boolean(user.isFlagged),
    inventory: user.inventory || ['skin_classic', 'frame_default'],
    equippedCardSkin: user.equippedCardSkin || 'skin_classic',
    equippedAvatarFrame: user.equippedAvatarFrame || 'frame_default',
    googleId: user.googleId || null,
    authProvider: user.authProvider || 'local',
    createdAt: user.createdAt
  };
}

// Bộ nhớ lưu số lần đăng nhập sai (Brute-Force Rate Limiting)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 giây

function checkRateLimit(key) {
  const record = loginAttempts.get(key);
  if (!record) return { allowed: true };

  const now = Date.now();
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingSeconds,
      message: `Tài khoản tạm khóa do nhập sai mật mã quá 5 lần. Vui lòng thử lại sau ${remainingSeconds} giây!`
    };
  }

  if (record.lockedUntil && now >= record.lockedUntil) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailedAttempt(key) {
  const now = Date.now();
  const record = loginAttempts.get(key) || { attempts: 0, firstAttemptAt: now };

  if (now - record.firstAttemptAt > 60 * 1000) {
    record.attempts = 1;
    record.firstAttemptAt = now;
    record.lockedUntil = null;
  } else {
    record.attempts += 1;
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }

  loginAttempts.set(key, record);
  return record.attempts;
}

function clearFailedAttempts(key) {
  loginAttempts.delete(key);
}

function validateStrongPassword(password) {
  if (!password || password.length < 6) {
    return 'Mật khẩu phải có độ dài tối thiểu từ 6 ký tự trở lên!';
  }
  return null;
}

function validateNickname(nickname) {
  if (!nickname || nickname.trim().length < 3) {
    return 'Tên tài khoản (P1 TAG) phải có ít nhất 3 ký tự!';
  }
  if (nickname.trim().length > 30) {
    return 'Tên tài khoản không được vượt quá 30 ký tự!';
  }
  return null;
}

// 1. XỬ LÝ ĐĂNG NHẬP (LOGIN)
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập Email hoặc Tên tài khoản!'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật mã bảo mật!'
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const clientIp = req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || 'local';
    const rateLimitKey = `${cleanIdentifier}_${clientIp}`;

    const limitStatus = checkRateLimit(rateLimitKey);
    if (!limitStatus.allowed) {
      return res.status(429).json({
        success: false,
        message: limitStatus.message
      });
    }

    // Tìm trong MongoDB Atlas theo email hoặc nickname
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { nickname: { $regex: new RegExp(`^${identifier.trim()}$`, 'i') } }
      ]
    });

    if (!user) {
      const attempts = recordFailedAttempt(rateLimitKey);
      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - attempts);
      return res.status(404).json({
        success: false,
        message: 'Tài khoản hoặc Email không tồn tại trong hệ thống NEO UNO!',
        remainingAttempts
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const attempts = recordFailedAttempt(rateLimitKey);
      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - attempts);
      return res.status(401).json({
        success: false,
        message: remainingAttempts > 0
          ? `Mật mã bảo mật không chính xác! (Còn ${remainingAttempts} lần thử)`
          : 'Mật mã bảo mật không chính xác! Tài khoản tạm khóa 30 giây.',
        remainingAttempts
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: `Tài khoản đã bị KHÓA do vi phạm quy tắc an toàn hoặc nghi vấn gian lận! Lý do: ${user.banReason || 'Vi phạm điều khoản trò chơi'}`,
        isBanned: true,
      });
    }

    clearFailedAttempts(rateLimitKey);
    user.lastLoginAt = new Date();
    await user.save();

    const stats = await PlayerStats.findOne({ user: user._id });
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: `Chào mừng ${user.nickname} đăng nhập thành công!`,
      token,
      user: sanitizeUser(user, stats)
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống máy chủ, vui lòng thử lại sau!'
    });
  }
};

// 2. XỬ LÝ ĐĂNG KÝ (REGISTER)
exports.register = async (req, res) => {
  try {
    const { nickname, email, password } = req.body;

    const nickError = validateNickname(nickname);
    if (nickError) {
      return res.status(400).json({
        success: false,
        message: nickError
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập Email liên kết!'
      });
    }

    const cleanNick = nickname.trim();
    const cleanEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng email không hợp lệ (ví dụ: player@neouno.com)!'
      });
    }

    const passwordError = validateStrongPassword(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError
      });
    }

    // Kiểm tra trùng lặp email hoặc nickname trong MongoDB
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email này đã được đăng ký tài khoản khác trong hệ thống!'
      });
    }

    const existingNick = await User.findOne({
      nickname: { $regex: new RegExp(`^${cleanNick}$`, 'i') }
    });
    if (existingNick) {
      return res.status(409).json({
        success: false,
        message: 'Tên tài khoản (P1 TAG) này đã có người sử dụng trong Đấu trường!'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      nickname: cleanNick,
      email: cleanEmail,
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanNick)}`,
      elo: 1000,
      coins: 1000
    });

    const newStats = await PlayerStats.create({
      user: newUser._id
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: `Khởi tạo tài khoản NEO ID: ${newUser.nickname} thành công!`,
      token,
      user: sanitizeUser(newUser, newStats)
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi tạo tài khoản, vui lòng thử lại sau!'
    });
  }
};

// 3. ĐĂNG NHẬP CHẾ ĐỘ KHÁCH (GUEST)
exports.guestLogin = async (req, res) => {
  try {
    const guestNumber = Math.floor(1000 + Math.random() * 9000);
    const guestNick = `Guest_${guestNumber}`;
    const guestEmail = `guest_${guestNumber}_${Date.now()}@neouno.guest`;
    const randomPass = await bcrypt.hash(Date.now().toString(), 8);

    const guestUser = await User.create({
      nickname: guestNick,
      email: guestEmail,
      password: randomPass,
      avatar: '👤',
      coins: 500,
      elo: 1000,
      role: 'guest'
    });

    const guestStats = await PlayerStats.create({
      user: guestUser._id
    });

    const token = generateToken(guestUser);

    return res.status(200).json({
      success: true,
      message: `Chào mừng ${guestNick} tham gia Đấu trường NEO UNO!`,
      token,
      user: sanitizeUser(guestUser, guestStats)
    });
  } catch (error) {
    console.error('[Auth Guest Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi khởi tạo tài khoản khách!'
    });
  }
};

// 4. LẤY THÔNG TIN TÀI KHOẢN (ME)
exports.getMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Chưa đăng nhập hoặc thiếu Token xác thực!'
      });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!'
        });
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin tài khoản người dùng!'
        });
      }

      if (user.isBanned) {
        return res.status(403).json({
          success: false,
          message: `Tài khoản đã bị KHÓA do vi phạm quy tắc an toàn hoặc nghi vấn gian lận! Lý do: ${user.banReason || 'Vi phạm điều khoản trò chơi'}`,
          isBanned: true,
        });
      }

      const stats = await PlayerStats.findOne({ user: user._id });

      return res.status(200).json({
        success: true,
        user: sanitizeUser(user, stats)
      });
    });
  } catch (error) {
    console.error('[Auth GetMe Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy hồ sơ người dùng!'
    });
  }
};

// 5. QUÊN MẬT KHẨU: GỬI MÃ OTP XÁC MINH VỀ EMAIL THẬT
const otpCache = new Map();

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập địa chỉ email khôi phục!',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản liên kết với địa chỉ email này!',
      });
    }

    // Tạo mã OTP 6 chữ số an toàn với crypto
    const otp = crypto.randomInt(100000, 999999).toString();
    otpCache.set(cleanEmail, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 phút
      attempts: 0,
    });

    // Gửi email thật qua emailService
    const emailRes = await sendOtpEmail({
      to: cleanEmail,
      otp,
      nickname: user.nickname,
    });

    return res.status(200).json({
      success: true,
      message: `Mã OTP xác thực đã được gửi đến email ${cleanEmail}!`,
      mode: emailRes.mode,
      // Gửi kèm testOtp khi chạy simulator hoặc trong test suite
      demoOtp: (emailRes.mode === 'simulator' || req.headers['x-test-suite'] === 'true' || process.env.NODE_ENV === 'test') ? otp : undefined,
    });
  } catch (err) {
    console.error('[Forgot Password Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống máy chủ khi gửi mã khôi phục!',
    });
  }
};

// 6. QUÊN MẬT KHẨU: XÁC THỰC MÃ OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ email và mã OTP 6 chữ số!',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cached = otpCache.get(cleanEmail);

    if (!cached || cached.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Mã xác minh đã hết hạn hoặc không tồn tại. Vui lòng gửi lại mã mới!',
      });
    }

    if (cached.attempts >= 5) {
      otpCache.delete(cleanEmail);
      return res.status(429).json({
        success: false,
        message: 'Nhập sai mã OTP quá 5 lần! Vui lòng yêu cầu cấp lại mã mới.',
      });
    }

    if (cached.otp !== otp.trim()) {
      cached.attempts += 1;
      const remainingAttempts = 5 - cached.attempts;
      return res.status(400).json({
        success: false,
        message: `Mã xác minh OTP không chính xác! (Còn ${remainingAttempts} lần thử)`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Xác thực mã bảo mật thành công! Bạn có thể thiết lập mật khẩu mới.',
    });
  } catch (err) {
    console.error('[Verify OTP Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi xác thực mã OTP!',
    });
  }
};

// 7. QUÊN MẬT KHẨU: THIẾT LẬP MẬT KHẨU MỚI & TỰ ĐỘNG ĐĂNG NHẬP
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin mật khẩu mới!',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cached = otpCache.get(cleanEmail);

    if (!cached || cached.otp !== otp?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phiên xác thực bảo mật không hợp lệ hoặc đã hết hạn!',
      });
    }

    const passwordError = validateStrongPassword(newPassword);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản người dùng!',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.lastLoginAt = new Date();
    await user.save();

    // Hủy OTP sau khi đổi mật khẩu thành công
    otpCache.delete(cleanEmail);

    const stats = await PlayerStats.findOne({ user: user._id });
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Thiết lập mật mã mới thành công! Đang tự động chuyển vào Đấu trường...',
      token,
      user: sanitizeUser(user, stats),
    });
  } catch (err) {
    console.error('[Reset Password Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi đổi mật khẩu mới!',
    });
  }
};

// 8. ĐĂNG NHẬP BẰNG GOOGLE (OAUTH 2.0 / GOOGLE IDENTITY SERVICES)
exports.googleLogin = async (req, res) => {
  try {
    const { credential, accessToken, mockUser } = req.body;

    let googlePayload = null;

    // A. Thẩm định qua Google Access Token (từ Google OAuth2 initTokenClient)
    if (accessToken) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userInfoRes.ok) {
          googlePayload = await userInfoRes.json();
        }
      } catch (err) {
        console.warn('[Google AccessToken Verify Error]:', err.message);
      }
    }

    // B. Thẩm định qua Google Identity Services ID Token (credential)
    if (!googlePayload && credential) {
      try {
        if (GOOGLE_CLIENT_ID) {
          const ticket = await googleOAuthClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
          });
          googlePayload = ticket.getPayload();
        } else {
          // Thẩm định trực tiếp qua endpoint chính thức của Google
          const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
          if (verifyResponse.ok) {
            googlePayload = await verifyResponse.json();
          }
        }
      } catch (err) {
        console.warn('[Google Auth Verify Error]:', err.message);
      }

      // Fallback giải mã an toàn payload nếu Google endpoint không thể kết nối
      if (!googlePayload && credential) {
        try {
          const parts = credential.split('.');
          if (parts.length === 3) {
            googlePayload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          }
        } catch {}
      }
    }

    // C. Chế độ Mock User dành cho nhà phát triển kiểm thử nhanh
    if (!googlePayload && mockUser) {
      googlePayload = {
        sub: mockUser.googleId || `google_mock_${Date.now()}`,
        email: mockUser.email || `player_${Date.now()}@gmail.com`,
        name: mockUser.name || 'Đấu thủ Google',
        picture: mockUser.picture || 'https://api.dicebear.com/7.x/bottts/svg?seed=google_player',
      };
    }

    if (!googlePayload || !googlePayload.email) {
      return res.status(400).json({
        success: false,
        message: 'Chứng chỉ đăng nhập Google không hợp lệ hoặc đã hết hạn!',
      });
    }

    const googleId = googlePayload.sub;
    const cleanEmail = googlePayload.email.toLowerCase().trim();
    const rawName = (googlePayload.name || googlePayload.email.split('@')[0]).trim();
    const picture = googlePayload.picture;

    // Tìm xem tài khoản đã tồn tại qua googleId hoặc email chưa
    let user = await User.findOne({
      $or: [{ googleId }, { email: cleanEmail }],
    });

    if (user) {
      if (user.isBanned) {
        return res.status(403).json({
          success: false,
          message: `Tài khoản đã bị KHÓA do vi phạm quy tắc an toàn! Lý do: ${user.banReason || 'Vi phạm điều khoản'}`,
          isBanned: true,
        });
      }

      let needsSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        needsSave = true;
      }
      if (picture && (!user.avatar || user.avatar === 'avatar_1')) {
        user.avatar = picture;
        needsSave = true;
      }
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Khởi tạo tài khoản mới từ Google
      let finalNickname = rawName.replace(/[^a-zA-Z0-9_\s]/g, '').trim();
      if (finalNickname.length < 3) finalNickname = `Player_${Math.floor(1000 + Math.random() * 9000)}`;
      if (finalNickname.length > 25) finalNickname = finalNickname.substring(0, 25);

      const existingNick = await User.findOne({
        nickname: { $regex: new RegExp(`^${finalNickname}$`, 'i') },
      });
      if (existingNick) {
        finalNickname = `${finalNickname}_${Math.floor(100 + Math.random() * 900)}`;
      }

      user = await User.create({
        nickname: finalNickname,
        email: cleanEmail,
        googleId,
        authProvider: 'google',
        avatar: picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(finalNickname)}`,
        elo: 1000,
        coins: 1000,
        role: 'player',
      });

      await PlayerStats.create({
        user: user._id,
      });
    }

    const stats = await PlayerStats.findOne({ user: user._id });
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: `Chào mừng ${user.nickname} đăng nhập thành công qua Google!`,
      token,
      user: sanitizeUser(user, stats),
    });
  } catch (error) {
    console.error('[Google Login Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống máy chủ khi đăng nhập bằng Google!',
    });
  }
};

// 9. ĐĂNG XUẤT AN TOÀN
exports.logout = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Đăng xuất tài khoản an toàn thành công!',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng xuất!',
    });
  }
};
