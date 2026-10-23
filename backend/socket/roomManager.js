/**
 * Room Manager cho Chế độ Online Multiplayer NEO-UNO
 */

// Lưu trữ tất cả các phòng chơi đang hoạt động
const rooms = new Map();

/**
 * Tạo mã phòng ngẫu nhiên 6 ký tự dễ đọc (tránh số 0 và chữ O, số 1 và chữ I để người chơi không nhầm)
 */
function generateRoomCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Tạo một phòng mới
 */
function createRoom(hostUser, socketId) {
  let code = generateRoomCode();
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const hostDisplayName =
    hostUser?.nickname || hostUser?.name || hostUser?.username || 'Chủ Phòng';

  const hostPlayer = {
    socketId,
    userId: hostUser?.id || hostUser?._id || `guest_${socketId}`,
    name: hostDisplayName,
    avatar: hostUser?.avatar || 'avatar_1',
    elo: hostUser?.elo || 1000,
    isHost: true,
    isReady: true, // Chủ phòng luôn coi là sẵn sàng
    isBot: false,
  };

  const newRoom = {
    code,
    hostId: hostPlayer.userId,
    maxPlayers: 4,
    status: 'waiting', // 'waiting' | 'in_game' | 'finished'
    isRanked: false, // Chơi với bạn bè là giao hữu KHÔNG tính điểm Rank ELO
    mode: 'friendly',
    createdAt: Date.now(),
    players: [hostPlayer],
  };

  rooms.set(code, newRoom);
  return newRoom;
}

/**
 * Lấy thông tin phòng theo mã
 */
function getRoom(code) {
  if (!code) return null;
  return rooms.get(code.toUpperCase().trim()) || null;
}

/**
 * Người chơi tham gia vào phòng
 */
function joinRoom(code, user, socketId) {
  const room = getRoom(code);
  if (!room) {
    return { success: false, message: 'Phòng không tồn tại hoặc đã bị giải tán!' };
  }

  if (room.status !== 'waiting') {
    return { success: false, message: 'Trận đấu trong phòng này đã bắt đầu!' };
  }

  if (room.players.length >= room.maxPlayers) {
    return { success: false, message: 'Phòng chơi đã đủ 4 người!' };
  }

  const userId = user?.id || user?._id || `guest_${socketId}`;
  const existingPlayerIndex = room.players.findIndex((p) => p.userId === userId || p.socketId === socketId);

  if (existingPlayerIndex !== -1) {
    // Đã có trong phòng -> cập nhật socketId
    room.players[existingPlayerIndex].socketId = socketId;
    return { success: true, room };
  }

  const userDisplayName =
    user?.nickname || user?.name || user?.username || `Người chơi ${room.players.length + 1}`;

  const newPlayer = {
    socketId,
    userId,
    name: userDisplayName,
    avatar: user?.avatar || `avatar_${(room.players.length % 4) + 1}`,
    elo: user?.elo || 1000,
    isHost: false,
    isReady: false,
    isBot: false,
  };

  room.players.push(newPlayer);
  return { success: true, room };
}

/**
 * Thêm Bot vào phòng (Chỉ chủ phòng)
 */
function addBot(code, hostSocketId) {
  const room = getRoom(code);
  if (!room) return { success: false, message: 'Phòng không tồn tại!' };

  const hostPlayer = room.players.find((p) => p.socketId === hostSocketId && p.isHost);
  if (!hostPlayer) return { success: false, message: 'Chỉ chủ phòng mới có quyền thêm Bot!' };

  if (room.players.length >= room.maxPlayers) {
    return { success: false, message: 'Phòng chơi đã đầy chỗ!' };
  }

  const botCount = room.players.filter((p) => p.isBot).length + 1;
  const botNames = ['CyberBot Alpha', 'Neon AI Delta', 'ShadowBot Prime', 'Vortex AI'];
  const botAvatars = ['bot_alpha', 'bot_delta', 'bot_prime', 'bot_vortex'];

  const botPlayer = {
    socketId: null,
    userId: `bot_${Date.now()}_${botCount}`,
    name: botNames[(botCount - 1) % botNames.length],
    avatar: botAvatars[(botCount - 1) % botAvatars.length],
    elo: 1000 + Math.floor(Math.random() * 200),
    isHost: false,
    isReady: true, // Bot luôn luôn sẵn sàng
    isBot: true,
  };

  room.players.push(botPlayer);
  return { success: true, room };
}

/**
 * Xóa Bot khỏi phòng
 */
function removeBot(code, hostSocketId, botId) {
  const room = getRoom(code);
  if (!room) return { success: false, message: 'Phòng không tồn tại!' };

  const hostPlayer = room.players.find((p) => p.socketId === hostSocketId && p.isHost);
  if (!hostPlayer) return { success: false, message: 'Chỉ chủ phòng mới có quyền xóa Bot!' };

  const botIndex = room.players.findIndex((p) => p.userId === botId && p.isBot);
  if (botIndex === -1) return { success: false, message: 'Không tìm thấy Bot cần xóa!' };

  room.players.splice(botIndex, 1);
  return { success: true, room };
}

/**
 * Đổi trạng thái Sẵn Sàng (Ready)
 */
function toggleReady(code, socketId) {
  const room = getRoom(code);
  if (!room) return { success: false, message: 'Phòng không tồn tại!' };

  const player = room.players.find((p) => p.socketId === socketId);
  if (!player) return { success: false, message: 'Người chơi không có trong phòng!' };

  if (player.isHost) {
    return { success: false, message: 'Chủ phòng không cần bấm sẵn sàng!' };
  }

  player.isReady = !player.isReady;
  return { success: true, room };
}

/**
 * Lấy phòng dựa trên socketId của người chơi
 */
function getRoomBySocket(socketId) {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.socketId === socketId)) {
      return room;
    }
  }
  return null;
}

/**
 * Rời phòng hoặc Mất kết nối
 */
function leaveRoom(socketId, force = false) {
  let affectedRoom = null;

  for (const [code, room] of rooms.entries()) {
    const playerIndex = room.players.findIndex((p) => p.socketId === socketId);
    if (playerIndex !== -1) {
      // Nếu đang trong trận đấu và không phải bấm thoát chủ động (force) -> giữ chỗ chờ reconnect
      if (room.status === 'in_game' && !force) {
        return { roomCode: code, room, removedPlayer: null };
      }

      const removedPlayer = room.players.splice(playerIndex, 1)[0];
      affectedRoom = room;

      // Nếu phòng không còn người thật nào (chỉ còn bot hoặc rỗng) -> Xóa phòng
      const humanPlayers = room.players.filter((p) => !p.isBot);
      if (humanPlayers.length === 0) {
        rooms.delete(code);
        return { roomCode: code, room: null, removedPlayer };
      }

      // Nếu chủ phòng rời đi -> chuyển quyền chủ phòng cho người thật kế tiếp
      if (removedPlayer.isHost && humanPlayers.length > 0) {
        humanPlayers[0].isHost = true;
        humanPlayers[0].isReady = true;
        room.hostId = humanPlayers[0].userId;
      }

      return { roomCode: code, room, removedPlayer };
    }
  }

  return { roomCode: null, room: null, removedPlayer: null };
}

/**
 * Bắt đầu trận đấu
 */
function startGame(code, hostSocketId) {
  const room = getRoom(code);
  if (!room) return { success: false, message: 'Phòng không tồn tại!' };

  const hostPlayer = room.players.find((p) => p.socketId === hostSocketId && p.isHost);
  if (!hostPlayer) return { success: false, message: 'Chỉ chủ phòng mới có quyền bắt đầu trận!' };

  if (room.players.length < 2) {
    return { success: false, message: 'Cần ít nhất 2 người chơi (hoặc thêm Bot) để bắt đầu trận!' };
  }

  const unreadyPlayer = room.players.find((p) => !p.isReady);
  if (unreadyPlayer) {
    return { success: false, message: `Người chơi "${unreadyPlayer.name}" chưa bấm Sẵn Sàng!` };
  }

  room.status = 'in_game';
  return { success: true, room };
}

/**
 * Cập nhật tên hiển thị của người chơi trong phòng
 */
function updatePlayerName(code, socketId, newName) {
  const room = getRoom(code);
  if (!room) return { success: false, message: 'Phòng không tồn tại!' };

  const player = room.players.find((p) => p.socketId === socketId);
  if (!player) return { success: false, message: 'Người chơi không có trong phòng!' };

  const trimmed = (newName || '').trim();
  if (trimmed) {
    player.name = trimmed;
  }
  return { success: true, room };
}

module.exports = {
  rooms,
  createRoom,
  getRoom,
  joinRoom,
  addBot,
  removeBot,
  toggleReady,
  leaveRoom,
  startGame,
  updatePlayerName,
  getRoomBySocket,
};
