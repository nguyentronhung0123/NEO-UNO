/**
 * Socket Handler - Quản lý sự kiện kết nối thời gian thực cho NEO-UNO
 */
const roomManager = require('./roomManager');
const gameEngine = require('./gameEngine');
const matchmakingQueue = require('./matchmakingQueue');

function setupSocketIO(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] ⚡ Người chơi kết nối: ${socket.id}`);

    // 0. GHÉP TRẬN NHANH TỰ ĐỘNG (MATCHMAKING)
    socket.on('matchmaking:join', ({ user, mode }, callback) => {
      try {
        const result = matchmakingQueue.joinQueue({ user, mode, socket, io });
        if (typeof callback === 'function') callback(result);
      } catch (err) {
        console.error('[Socket] Lỗi tham gia ghép trận:', err);
        if (typeof callback === 'function') {
          callback({ success: false, message: 'Lỗi máy chủ khi ghép trận!' });
        }
      }
    });

    socket.on('matchmaking:cancel', (callback) => {
      try {
        const result = matchmakingQueue.leaveQueue(socket.id, io);
        if (typeof callback === 'function') callback(result);
      } catch (err) {
        console.error('[Socket] Lỗi hủy ghép trận:', err);
      }
    });

    // 1. TẠO PHÒNG MỚI
    socket.on('room:create', ({ user }, callback) => {
      try {
        const room = roomManager.createRoom(user, socket.id);
        socket.join(room.code);
        console.log(`[Socket] 🏠 Tạo phòng thành công: ${room.code} bởi ${user?.name || socket.id}`);

        if (typeof callback === 'function') {
          callback({ success: true, room });
        }
        io.to(room.code).emit('room:updated', room);
      } catch (err) {
        console.error('[Socket] Lỗi tạo phòng:', err);
        if (typeof callback === 'function') {
          callback({ success: false, message: 'Lỗi máy chủ khi tạo phòng!' });
        }
      }
    });

    // 2. THAM GIA PHÒNG
    socket.on('room:join', ({ code, user }, callback) => {
      try {
        const result = roomManager.joinRoom(code, user, socket.id);
        if (!result.success) {
          if (typeof callback === 'function') callback(result);
          return;
        }

        const room = result.room;
        socket.join(room.code);
        console.log(`[Socket] 👥 ${user?.name || socket.id} đã vào phòng: ${room.code}`);

        if (typeof callback === 'function') {
          callback({ success: true, room });
        }
        io.to(room.code).emit('room:updated', room);
      } catch (err) {
        console.error('[Socket] Lỗi vào phòng:', err);
        if (typeof callback === 'function') {
          callback({ success: false, message: 'Lỗi máy chủ khi vào phòng!' });
        }
      }
    });

    // 3. SẴN SÀNG / HỦY SẴN SÀNG
    socket.on('room:toggle_ready', ({ code }, callback) => {
      try {
        const result = roomManager.toggleReady(code, socket.id);
        if (typeof callback === 'function') callback(result);
        if (result.success) {
          io.to(result.room.code).emit('room:updated', result.room);
        }
      } catch (err) {
        console.error('[Socket] Lỗi sẵn sàng:', err);
      }
    });

    // 4. THÊM BOT
    socket.on('room:add_bot', ({ code }, callback) => {
      try {
        const result = roomManager.addBot(code, socket.id);
        if (typeof callback === 'function') callback(result);
        if (result.success) {
          io.to(result.room.code).emit('room:updated', result.room);
        }
      } catch (err) {
        console.error('[Socket] Lỗi thêm Bot:', err);
      }
    });

    // 5. XÓA BOT
    socket.on('room:remove_bot', ({ code, botId }, callback) => {
      try {
        const result = roomManager.removeBot(code, socket.id, botId);
        if (typeof callback === 'function') callback(result);
        if (result.success) {
          io.to(result.room.code).emit('room:updated', result.room);
        }
      } catch (err) {
        console.error('[Socket] Lỗi xóa Bot:', err);
      }
    });

    // CẬP NHẬT TÊN NGƯỜI CHƠI TRỰC TIẾP
    socket.on('room:update_name', ({ code, newName }, callback) => {
      try {
        const result = roomManager.updatePlayerName(code, socket.id, newName);
        if (typeof callback === 'function') callback(result);
        if (result.success) {
          io.to(result.room.code).emit('room:updated', result.room);
        }
      } catch (err) {
        console.error('[Socket] Lỗi cập nhật tên:', err);
      }
    });

    // 6. BẮT ĐẦU TRẬN ĐẤU
    socket.on('room:start_game', ({ code }, callback) => {
      try {
        const result = roomManager.startGame(code, socket.id);
        if (typeof callback === 'function') callback(result);
        if (result.success) {
          console.log(`[Socket] 🎮 Bắt đầu trận đấu phòng ${code}!`);
          io.to(result.room.code).emit('room:game_started', result.room);

          // Khởi chạy ván đấu thời gian thực trên Game Engine
          gameEngine.startOnlineMatch(result.room, io);
        }
      } catch (err) {
        console.error('[Socket] Lỗi bắt đầu trận đấu:', err);
      }
    });

    // LẤY TRẠNG THÁI VÁN ĐẤU HIỆN TẠI (HỖ TRỢ RECONNECT F5)
    socket.on('game:get_state', ({ code, userId, playerName }) => {
      try {
        console.log(`[Socket] 🔄 game:get_state nhận từ ${playerName} (socket: ${socket.id}, room: ${code})`);
        const game = gameEngine.getActiveGame(code);
        if (game) {
          socket.join(game.roomCode);
          let p = game.reconnectPlayer(socket.id, userId, playerName);
          if (!p) {
            p = game.players.find((pl) => pl.socketId === socket.id);
          }
          if (!p) {
            // Fallback an toàn: Tìm ghế người thật đầu tiên trùng tên hoặc chưa gán socketId
            p = game.players.find((pl) => !pl.isBot && (!pl.socketId || pl.name === playerName));
            if (p) p.socketId = socket.id;
          }
          if (p) {
            console.log(`[Socket] 📤 Gửi game:state_sync cho ${p.name} (ghế P${p.seatIndex + 1})`);
            socket.emit('game:state_sync', game.getClientStateForPlayer(p));
          } else {
            console.warn(`[Socket] ⚠️ Không tìm thấy ghế cho ${playerName} trong phòng ${code}!`);
          }
        } else {
          console.warn(`[Socket] ⚠️ Trận đấu phòng ${code} chưa bắt đầu trên gameEngine!`);
        }
      } catch (err) {
        console.error('[Socket] Lỗi lấy trạng thái ván đấu:', err);
      }
    });

    // 6.1. NGƯỜI CHƠI ĐÁNH BÀI ONLINE
    socket.on('game:play_card', ({ code, cardId, chosenColor, userId }, callback) => {
      try {
        const game = gameEngine.getActiveGame(code);
        if (!game) {
          if (typeof callback === 'function') callback({ success: false, message: 'Trận đấu không tồn tại!' });
          return;
        }

        const res = game.playerPlayCard(socket.id, cardId, chosenColor, userId);
        if (typeof callback === 'function') callback(res);
      } catch (err) {
        console.error('[Socket] Lỗi đánh bài:', err);
      }
    });

    // 6.2. NGƯỜI CHƠI BỐC BÀI ONLINE
    socket.on('game:draw_card', ({ code, userId }, callback) => {
      try {
        const game = gameEngine.getActiveGame(code);
        if (!game) {
          if (typeof callback === 'function') callback({ success: false, message: 'Trận đấu không tồn tại!' });
          return;
        }

        const res = game.playerDrawCard(socket.id, userId);
        if (typeof callback === 'function') callback(res);
      } catch (err) {
        console.error('[Socket] Lỗi bốc bài:', err);
      }
    });

    // 6.3. NGƯỜI CHƠI BỎ LƯỢT (PASS TURN SAU KHI ĐÃ BỐC BÀI)
    socket.on('game:pass_turn', ({ code, userId }, callback) => {
      try {
        const game = gameEngine.getActiveGame(code);
        if (!game) {
          if (typeof callback === 'function') callback({ success: false, message: 'Trận đấu không tồn tại!' });
          return;
        }

        const res = game.playerPassTurn(socket.id, userId);
        if (typeof callback === 'function') callback(res);
      } catch (err) {
        console.error('[Socket] Lỗi bỏ lượt:', err);
      }
    });

    // 6.3. NGƯỜI CHƠI HÔ UNO
    socket.on('game:call_uno', ({ code, userId }, callback) => {
      try {
        const game = gameEngine.getActiveGame(code);
        if (game) {
          const res = game.playerCallUno(socket.id, userId);
          if (typeof callback === 'function') callback(res);
        }
      } catch (err) {
        console.error('[Socket] Lỗi hô UNO:', err);
      }
    });

    // 7. RỜI PHÒNG THỦ CÔNG
    socket.on('room:leave', (callback) => {
      try {
        const { roomCode, room, removedPlayer } = roomManager.leaveRoom(socket.id, true);
        if (roomCode) {
          socket.leave(roomCode);
          if (room) {
            io.to(roomCode).emit('room:updated', room);
          }
          if (typeof callback === 'function') callback({ success: true });
        }
      } catch (err) {
        console.error('[Socket] Lỗi rời phòng:', err);
      }
    });

    // 8. MẤT KẾT NỐI (DISCONNECT)
    socket.on('disconnect', () => {
      console.log(`[Socket] ❌ Người chơi ngắt kết nối: ${socket.id}`);
      try {
        // Hủy ghép trận nếu đang trong hàng chờ
        matchmakingQueue.leaveQueue(socket.id, io);

        // Kiểm tra xem phòng có đang trong ván không
        const currentRoom = roomManager.getRoomBySocket(socket.id);
        if (currentRoom && currentRoom.status === 'in_game') {
          console.log(`[Socket] Giữ nguyên ghế cho người chơi phòng ${currentRoom.code} để chờ reconnect!`);
          return;
        }

        const { roomCode, room, removedPlayer } = roomManager.leaveRoom(socket.id, false);
        if (roomCode && room) {
          io.to(roomCode).emit('room:updated', room);
          io.to(roomCode).emit('room:player_left', {
            playerName: removedPlayer?.name || 'Một người chơi',
          });
        }
      } catch (err) {
        console.error('[Socket] Lỗi xử lý ngắt kết nối:', err);
      }
    });
  });
}

module.exports = setupSocketIO;
