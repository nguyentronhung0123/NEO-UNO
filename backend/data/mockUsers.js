// Dữ liệu người chơi mẫu (Mock Data) trong bộ nhớ Backend

const mockUsers = [
  {
    id: 'usr_001',
    nickname: 'CyberStriker_99',
    email: 'player@neouno.com',
    password: 'Password@123', // Mật khẩu hợp lệ: 8+ ký tự, có chữ hoa, số, ký tự đặc biệt
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
    password: 'Password@123',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=JokerNeon',
    elo: 1100,
    coins: 250,
    matchesWon: 8,
    matchesLost: 5,
    role: 'user',
    createdAt: new Date('2025-02-15').toISOString()
  }
];

// Các hàm thao tác với Mock Data
module.exports = {
  getAllUsers: () => mockUsers,

  findUserByIdentifier: (identifier) => {
    const cleanId = (identifier || '').trim().toLowerCase();
    return mockUsers.find(
      (u) => u.email.toLowerCase() === cleanId || u.nickname.toLowerCase() === cleanId
    );
  },

  findUserById: (id) => mockUsers.find((u) => u.id === id),

  checkUserExists: (email, nickname) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanNick = (nickname || '').trim().toLowerCase();
    return mockUsers.find(
      (u) => u.email.toLowerCase() === cleanEmail || u.nickname.toLowerCase() === cleanNick
    );
  },

  addUser: (newUser) => {
    mockUsers.push(newUser);
    return newUser;
  },

  createGuest: () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guestUser = {
      id: `guest_${randomSuffix}`,
      nickname: `Khách_${randomSuffix}`,
      email: `guest_${randomSuffix}@neouno.local`,
      password: '',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=Guest${randomSuffix}`,
      elo: 1000,
      coins: 100,
      matchesWon: 0,
      matchesLost: 0,
      role: 'guest',
      createdAt: new Date().toISOString()
    };
    mockUsers.push(guestUser);
    return guestUser;
  }
};
