/**
 * Matchmaking Queue - Hệ thống Ghép Trận Nhanh Tự Động cho NEO-UNO
 * Hỗ trợ các chế độ: 4 Người (4_PLAYERS), 3 Người (3_PLAYERS), Solo 1v1 (SOLO_1V1)
 * Tự động ghép theo ELO và tự động điền Bot AI sau 8s nếu không đủ người thật
 */
const roomManager = require('./roomManager');
const gameEngine = require('./gameEngine');

// Thời gian chờ tối đa trước khi tự động điền Bot AI (8 giây)
const MATCHMAKING_TIMEOUT_MS = 8000;

// Các chế độ và số người yêu cầu
const MODE_CAPACITY = {
  '4_PLAYERS': 4,
  '3_PLAYERS': 3,
  'SOLO_1V1': 2,
};

// Hàng chờ in-memory cho từng chế độ: Map<mode, Array<QueueItem>>
const queues = {
  '4_PLAYERS': [],
  '3_PLAYERS': [],
  'SOLO_1V1': [],
};

// Lưu các timer tự động điền Bot: Map<socketId, Timeout>
const autoFillTimers = new Map();

// Tên và Avatar Bot mặc định khi auto-fill
const BOT_TEMPLATES = [
  { name: 'Bot Titan 🤖', avatar: 'bot_alpha', baseElo: 1100 },
  { name: 'Bot Neon ⚡', avatar: 'bot_delta', baseElo: 1050 },
  { name: 'Bot Cyber 🛡️', avatar: 'bot_prime', baseElo: 1020 },
  { name: 'Bot Vortex 🌀', avatar: 'bot_vortex', baseElo: 1080 },
];

/**
 * Thêm người chơi vào hàng chờ ghép trận
 */
function joinQueue({ user, mode = '4_PLAYERS', socket, io }) {
  const targetMode = MODE_CAPACITY[mode] ? mode : '4_PLAYERS';
  const capacity = MODE_CAPACITY[targetMode];

  // Xóa khỏi bất kỳ hàng chờ nào trước đó nếu có
  leaveQueue(socket.id, io);

  const userId = user?.id || user?._id || `guest_${socket.id}`;
  const displayName =
    user?.nickname || user?.name || user?.username || `Đấu thủ ${socket.id.slice(0, 4)}`;
  const avatar = user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + displayName;
  const elo = Number(user?.elo) || 1000;

  const queueItem = {
    socketId: socket.id,
    userId,
    name: displayName,
    avatar,
    elo,
    mode: targetMode,
    joinedAt: Date.now(),
    socket,
  };

  const queue = queues[targetMode];
  queue.push(queueItem);

  console.log(
    `[Matchmaking] 🎯 ${displayName} (ELO: ${elo}) tham gia hàng chờ [${targetMode}]. Hiện có: ${queue.length}/${capacity}`
  );

  // Kiểm tra nếu đã đủ người thật ngay lập tức
  if (queue.length >= capacity) {
    // Lấy đúng số lượng người cần cho trận đấu
    const matchedGroup = queue.splice(0, capacity);

    // Hủy các timer chờ của nhóm này
    matchedGroup.forEach((item) => {
      clearAutoFillTimer(item.socketId);
    });

    console.log(
      `[Matchmaking] 🚀 ĐỦ NGƯỜI THẬT! Ghép thành công trận [${targetMode}] với ${matchedGroup.length} người chơi!`
    );
    return createMatchedRoom(matchedGroup, targetMode, io);
  }

  // Nếu chưa đủ người: Thông báo trạng thái hàng chờ cho người chơi
  broadcastQueueStatus(targetMode, io);

  // Thiết lập bộ đếm thời gian tự động điền Bot AI sau MATCHMAKING_TIMEOUT_MS (8s)
  const timer = setTimeout(() => {
    handleQueueTimeout(socket.id, targetMode, io);
  }, MATCHMAKING_TIMEOUT_MS);

  autoFillTimers.set(socket.id, timer);

  return { success: true, inQueue: true, mode: targetMode, count: queue.length, capacity };
}

/**
 * Xử lý khi hết thời gian chờ: Tự động điền Bot AI vào các chỗ còn thiếu
 */
function handleQueueTimeout(socketId, mode, io) {
  const queue = queues[mode];
  const playerIndex = queue.findIndex((p) => p.socketId === socketId);

  if (playerIndex === -1) return; // Đã thoát hoặc đã ghép rồi

  const capacity = MODE_CAPACITY[mode];
  // Gom tất cả người chơi thật đang cùng chờ trong hàng chờ này (tối đa bằng capacity)
  const availableHumans = queue.splice(0, capacity);

  // Xóa timer của những người này
  availableHumans.forEach((item) => clearAutoFillTimer(item.socketId));

  const missingBotsCount = capacity - availableHumans.length;
  console.log(
    `[Matchmaking] ⏳ Hết 8s chờ! Tự động điền ${missingBotsCount} Bot AI vào trận [${mode}] cho ${availableHumans.map((h) => h.name).join(', ')}`
  );

  createMatchedRoom(availableHumans, mode, io, missingBotsCount);
}

/**
 * Tạo phòng và bắt đầu trận đấu ghép đôi
 */
function createMatchedRoom(humanPlayers, mode, io, botCount = 0) {
  if (!humanPlayers || humanPlayers.length === 0) return null;

  const host = humanPlayers[0];
  const room = roomManager.createRoom(
    {
      id: host.userId,
      nickname: host.name,
      avatar: host.avatar,
      elo: host.elo,
    },
    host.socketId
  );

  room.maxPlayers = MODE_CAPACITY[mode] || 4;
  room.isRanked = true; // Ghép trận nhanh tự động là trận tính ELO!
  room.mode = mode;

  // Thêm các người chơi thật còn lại vào phòng
  for (let i = 1; i < humanPlayers.length; i++) {
    const h = humanPlayers[i];
    room.players.push({
      socketId: h.socketId,
      userId: h.userId,
      name: h.name,
      avatar: h.avatar,
      elo: h.elo,
      isHost: false,
      isReady: true,
      isBot: false,
    });
  }

  // Thêm Bot AI vào nếu còn thiếu
  for (let b = 0; b < botCount; b++) {
    const botTemplate = BOT_TEMPLATES[b % BOT_TEMPLATES.length];
    room.players.push({
      socketId: null,
      userId: `bot_mm_${Date.now()}_${b + 1}`,
      name: botTemplate.name,
      avatar: botTemplate.avatar,
      elo: botTemplate.baseElo + Math.floor(Math.random() * 50 - 25),
      isHost: false,
      isReady: true,
      isBot: true,
    });
  }

  // Cho tất cả socket của người thật join room
  humanPlayers.forEach((h) => {
    if (h.socket) {
      h.socket.join(room.code);
    }
  });

  room.status = 'in_game';

  // Thông báo tìm thấy trận (matchmaking:matched)
  console.log(`[Matchmaking] 📢 Phát sự kiện matchmaking:matched cho phòng ${room.code}`);
  io.to(room.code).emit('matchmaking:matched', {
    success: true,
    room,
    countdown: 3,
  });

  // Khởi động trận đấu trên gameEngine
  setTimeout(() => {
    io.to(room.code).emit('room:game_started', room);
    gameEngine.startOnlineMatch(room, io);
  }, 1200);

  return { success: true, room };
}

/**
 * Rời khỏi hàng chờ ghép trận
 */
function leaveQueue(socketId, io) {
  let foundMode = null;

  for (const [mode, queue] of Object.entries(queues)) {
    const index = queue.findIndex((p) => p.socketId === socketId);
    if (index !== -1) {
      const removed = queue.splice(index, 1)[0];
      foundMode = mode;
      console.log(`[Matchmaking] ❌ ${removed.name} đã hủy tìm trận [${mode}]`);
      break;
    }
  }

  clearAutoFillTimer(socketId);

  if (foundMode && io) {
    broadcastQueueStatus(foundMode, io);
  }

  return { success: true, leftMode: foundMode };
}

/**
 * Xóa bộ đếm timer auto-fill
 */
function clearAutoFillTimer(socketId) {
  if (autoFillTimers.has(socketId)) {
    clearTimeout(autoFillTimers.get(socketId));
    autoFillTimers.delete(socketId);
  }
}

/**
 * Cập nhật số người đang chờ tới các client trong hàng chờ
 */
function broadcastQueueStatus(mode, io) {
  const queue = queues[mode] || [];
  const capacity = MODE_CAPACITY[mode] || 4;

  queue.forEach((item) => {
    if (item.socket) {
      item.socket.emit('matchmaking:status', {
        inQueue: true,
        mode,
        currentPlayers: queue.length,
        requiredPlayers: capacity,
        elapsedSeconds: Math.floor((Date.now() - item.joinedAt) / 1000),
      });
    }
  });
}

/**
 * Lấy thống kê số lượng người đang chờ
 */
function getQueueStats() {
  return {
    '4_PLAYERS': queues['4_PLAYERS'].length,
    '3_PLAYERS': queues['3_PLAYERS'].length,
    'SOLO_1V1': queues['SOLO_1V1'].length,
  };
}

module.exports = {
  joinQueue,
  leaveQueue,
  getQueueStats,
  MATCHMAKING_TIMEOUT_MS,
  MODE_CAPACITY,
};
