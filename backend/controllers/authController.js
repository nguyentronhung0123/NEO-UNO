const mockDB = require('../data/mockUsers');

exports.login = (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp đầy đủ tài khoản và mật mã!'
    });
  }

  const user = mockDB.findUserByIdentifier(identifier);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Tài khoản hoặc Email không tồn tại trong Đấu trường NEO UNO!'
    });
  }

  // So khớp mật khẩu mẫu
  if (user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Mật mã bảo mật không chính xác!'
    });
  }

  // Cấp Token giả lập và gửi thông tin hồ sơ
  const token = `neo_token_${user.id}_${Date.now()}`;
  const userSafe = {
    id: user.id,
    nickname: user.nickname,
    email: user.email,
    avatar: user.avatar,
    elo: user.elo,
    coins: user.coins,
    role: user.role
  };

  return res.status(200).json({
    success: true,
    message: `Chào mừng ${user.nickname} bước vào Đấu trường NEO UNO!`,
    token,
    user: userSafe
  });
};

exports.register = (req, res) => {
  const { nickname, email, password } = req.body;

  if (!nickname || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng điền đầy đủ các thông tin đăng ký bắt buộc!'
    });
  }

  const existing = mockDB.checkUserExists(email, nickname);
  if (existing) {
    const isEmail = existing.email.toLowerCase() === email.trim().toLowerCase();
    return res.status(409).json({
      success: false,
      message: isEmail ? 'Email này đã được đăng ký tài khoản khác!' : 'Biệt danh này đã có người sử dụng trong Đấu trường!'
    });
  }

  const newUser = {
    id: `usr_${Date.now().toString().slice(-4)}`,
    nickname: nickname.trim(),
    email: email.trim().toLowerCase(),
    password: password,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nickname)}`,
    elo: 1000,
    coins: 200,
    matchesWon: 0,
    matchesLost: 0,
    role: 'user',
    createdAt: new Date().toISOString()
  };

  mockDB.addUser(newUser);

  const token = `neo_token_${newUser.id}_${Date.now()}`;
  const userSafe = {
    id: newUser.id,
    nickname: newUser.nickname,
    email: newUser.email,
    avatar: newUser.avatar,
    elo: newUser.elo,
    coins: newUser.coins,
    role: newUser.role
  };

  return res.status(201).json({
    success: true,
    message: `Khởi tạo tài khoản NEO ID: ${newUser.nickname} thành công!`,
    token,
    user: userSafe
  });
};

exports.guestLogin = (req, res) => {
  const guest = mockDB.createGuest();
  const token = `neo_guest_token_${guest.id}_${Date.now()}`;

  return res.status(200).json({
    success: true,
    message: `Chào mừng ${guest.nickname} tham gia bàn đấu với Bot AI!`,
    token,
    user: guest
  });
};

exports.getMe = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy Token xác thực!'
    });
  }

  const token = authHeader.split(' ')[1];
  // Trích xuất user id từ token giả lập: neo_token_usr_001_...
  const parts = token.split('_');
  const userId = parts.length >= 3 ? `${parts[1]}_${parts[2]}` : null;
  const user = userId ? mockDB.findUserById(userId) : mockDB.getAllUsers()[0];

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Người dùng không tồn tại hoặc phiên đăng nhập đã hết hạn!'
    });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
      avatar: user.avatar,
      elo: user.elo,
      coins: user.coins,
      role: user.role
    }
  });
};
