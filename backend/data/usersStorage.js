const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const USERS_FILE = path.join(__dirname, 'users.json');

// Mật khẩu mặc định đã được băm an toàn: "Password@123"
const DEFAULT_HASH = bcrypt.hashSync('Password@123', 10);

const INITIAL_USERS = [
  {
    id: 'usr_001',
    nickname: 'CyberStriker_99',
    email: 'player@neouno.com',
    password: DEFAULT_HASH,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberStriker',
    elo: 1250,
    coins: 500,
    matchesWon: 14,
    matchesLost: 6,
    role: 'user',
    createdAt: new Date('2025-01-10').toISOString()
  },
  {
    id: 'usr_002',
    nickname: 'JokerNeon',
    email: 'joker@neouno.com',
    password: DEFAULT_HASH,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=JokerNeon',
    elo: 1100,
    coins: 250,
    matchesWon: 8,
    matchesLost: 5,
    role: 'user',
    createdAt: new Date('2025-02-15').toISOString()
  }
];

function readUsersFromFile() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(INITIAL_USERS, null, 2), 'utf-8');
      return [...INITIAL_USERS];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [...INITIAL_USERS];
  } catch (error) {
    console.error('[Storage] Lỗi đọc file users.json:', error);
    return [...INITIAL_USERS];
  }
}

function writeUsersToFile(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('[Storage] Lỗi ghi file users.json:', error);
    return false;
  }
}

module.exports = {
  getUsers: () => readUsersFromFile(),

  findByIdentifier: (identifier) => {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();
    const users = readUsersFromFile();
    return users.find(
      (u) => u.email.toLowerCase() === clean || u.nickname.toLowerCase() === clean
    ) || null;
  },

  findById: (id) => {
    const users = readUsersFromFile();
    return users.find((u) => u.id === id) || null;
  },

  findByEmailOrNickname: (email, nickname) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanNick = (nickname || '').trim().toLowerCase();
    const users = readUsersFromFile();
    return users.find(
      (u) => u.email.toLowerCase() === cleanEmail || u.nickname.toLowerCase() === cleanNick
    ) || null;
  },

  createUser: ({ nickname, email, password }) => {
    const users = readUsersFromFile();
    const cleanEmail = email.trim().toLowerCase();
    const cleanNick = nickname.trim();
    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser = {
      id: `usr_${Date.now()}`,
      nickname: cleanNick,
      email: cleanEmail,
      password: passwordHash,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanNick)}`,
      elo: 1000,
      coins: 200,
      matchesWon: 0,
      matchesLost: 0,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsersToFile(users);
    return newUser;
  },

  createGuest: () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guestUser = {
      id: `guest_${randomSuffix}`,
      nickname: `Khách_${randomSuffix}`,
      email: `guest_${randomSuffix}@neouno.local`,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=Guest${randomSuffix}`,
      elo: 1000,
      coins: 100,
      matchesWon: 0,
      matchesLost: 0,
      role: 'guest',
      createdAt: new Date().toISOString()
    };
    return guestUser;
  },

  verifyPassword: (inputPassword, storedPasswordHash) => {
    if (!inputPassword || !storedPasswordHash) return false;
    // Hỗ trợ kiểm tra hash bcrypt chuẩn
    if (storedPasswordHash.startsWith('$2a$') || storedPasswordHash.startsWith('$2b$')) {
      return bcrypt.compareSync(inputPassword, storedPasswordHash);
    }
    // Hỗ trợ trường hợp mật khẩu chưa băm
    return inputPassword === storedPasswordHash;
  },

  updateLastLogin: (userId) => {
    const users = readUsersFromFile();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      users[idx].lastLoginAt = new Date().toISOString();
      writeUsersToFile(users);
    }
  }
};
