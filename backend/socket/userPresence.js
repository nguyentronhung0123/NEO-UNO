/**
 * User Presence Tracker - Quản lý trạng thái Online/Offline/In-Game thời gian thực
 */
class UserPresence {
  constructor() {
    this.userSockets = new Map(); // userId -> Set<socketId>
    this.socketUsers = new Map(); // socketId -> userId
    this.userMeta = new Map();    // userId -> { status, nickname, avatar, lastActive }
  }

  registerUser(userId, socketId, userInfo = {}, io = null) {
    if (!userId) return;
    const uid = String(userId);

    if (!this.userSockets.has(uid)) {
      this.userSockets.set(uid, new Set());
    }
    this.userSockets.get(uid).add(socketId);
    this.socketUsers.set(socketId, uid);

    const prevMeta = this.userMeta.get(uid) || {};
    this.userMeta.set(uid, {
      status: prevMeta.status === 'in_game' ? 'in_game' : 'online',
      nickname: userInfo.nickname || userInfo.name || prevMeta.nickname || 'Người chơi',
      avatar: userInfo.avatar || prevMeta.avatar || 'avatar_1',
      lastActive: Date.now(),
    });

    if (io) {
      this.broadcastPresenceChange(uid, this.userMeta.get(uid).status, io);
    }
  }

  unregisterSocket(socketId, io = null) {
    const uid = this.socketUsers.get(socketId);
    if (!uid) return null;

    this.socketUsers.delete(socketId);
    const sockets = this.userSockets.get(uid);

    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(uid);
        const meta = this.userMeta.get(uid);
        if (meta) {
          meta.status = 'offline';
          meta.lastActive = Date.now();
        }
        if (io) {
          this.broadcastPresenceChange(uid, 'offline', io);
        }
      }
    }
    return uid;
  }

  setUserStatus(userId, status, io = null) {
    if (!userId) return;
    const uid = String(userId);
    const meta = this.userMeta.get(uid);
    if (meta) {
      meta.status = status;
      meta.lastActive = Date.now();
      if (io) {
        this.broadcastPresenceChange(uid, status, io);
      }
    }
  }

  isUserOnline(userId) {
    if (!userId) return false;
    const uid = String(userId);
    const sockets = this.userSockets.get(uid);
    return Boolean(sockets && sockets.size > 0);
  }

  getUserStatus(userId) {
    if (!userId) return 'offline';
    const uid = String(userId);
    if (!this.isUserOnline(uid)) return 'offline';
    return this.userMeta.get(uid)?.status || 'online';
  }

  getUserSockets(userId) {
    if (!userId) return [];
    const uid = String(userId);
    const sockets = this.userSockets.get(uid);
    return sockets ? Array.from(sockets) : [];
  }

  getPresenceMap(userIds = []) {
    const result = {};
    for (const id of userIds) {
      const uid = String(id);
      const isOnline = this.isUserOnline(uid);
      const meta = this.userMeta.get(uid);
      result[uid] = {
        isOnline,
        status: isOnline ? (meta?.status || 'online') : 'offline',
        lastActive: meta?.lastActive || null,
      };
    }
    return result;
  }

  broadcastPresenceChange(userId, status, io) {
    if (!io) return;
    io.emit('friend:status_change', {
      userId: String(userId),
      status,
      timestamp: Date.now(),
    });
  }
}

module.exports = new UserPresence();
