require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const migrateExistingUsers = require('./utils/migrateUsers');
const setupSocketIO = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Gắn io vào express app để các REST controller có thể phát sự kiện realtime
app.set('io', io);

// Tích hợp Socket.io
setupSocketIO(io);

// API kiểm tra hệ thống
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "NEO UNO Backend đang hoạt động với MongoDB Atlas!",
    database: "MongoDB Atlas Cloud",
    timestamp: new Date().toISOString()
  });
});

// 1. API Xác thực Auth
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// 2. API Trận đấu (Match Record & History)
const matchRoutes = require('./routes/matchRoutes');
app.use('/api/matches', matchRoutes);

// 3. API Bảng Xếp Hạng (Leaderboard)
const leaderboardRoutes = require('./routes/leaderboardRoutes');
app.use('/api/leaderboard', leaderboardRoutes);

// 4. API Bạn Bè & Lời Mời Đấu (Friendship & Invites - Task 2)
const friendRoutes = require('./routes/friendRoutes');
app.use('/api/friends', friendRoutes);

// 5. API Cửa Hàng Vật Phẩm & Skin (Shop & Inventory - Task 5)
const shopRoutes = require('./routes/shopRoutes');
app.use('/api/shop', shopRoutes);

// 6. API Hệ Quản Trị Bảo Mật & Chống Gian Lận (Admin Security Operations Center)
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Bắt lỗi toàn cục chống crash server ngoài ý muốn
process.on('uncaughtException', (err) => {
  console.error('[BE] ⚠️ Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[BE] ⚠️ Unhandled Rejection:', reason);
});

// Khởi động CSDL và Server
connectDB().then(async () => {
  // Tự động đồng bộ tài khoản cũ sang MongoDB nếu có
  await migrateExistingUsers();

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[BE] ⚠️ Cổng ${PORT} đang bị tiến trình khác chiếm dụng! Vui lòng tắt server cũ trước khi khởi động.`);
    } else {
      console.error('[BE] Lỗi server:', err);
    }
  });

  server.listen(PORT, () => {
    console.log(`[BE] 🚀 Server & Socket.io đã khởi chạy thành công tại: http://localhost:${PORT} (Chế độ ghép trận: 60s auto-fill)`);
  });
});
