require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const compression = require('compression');
const connectDB = require('./config/db');
const migrateExistingUsers = require('./utils/migrateUsers');
const setupSocketIO = require('./socket/socketHandler');
const {
  helmetShield,
  serverCloaking,
  noSqlInjectionShield,
  globalApiLimiter,
  authLimiter,
  transactionLimiter,
  adminLimiter,
  honeypotTripwire,
  safeErrorHandler,
} = require('./middleware/securityShield');

const app = express();
const server = http.createServer(app);

// Ẩn hoàn toàn dấu vết công nghệ Express
app.disable('x-powered-by');

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5001;

// ============================================================================
// BỨC TƯỜNG THÉP BẢO MẬT & TỐI ƯU TẢI TRỌNG MẠNG (TASK 5 - TUẦN 4)
// ============================================================================
app.use(serverCloaking); // Ẩn danh Server, cấm Robot index API nhạy cảm
app.use(helmetShield); // HTTP Headers phòng thủ: CSP, HSTS, NoSniff, Clickjacking
app.use(compression()); // Nén dữ liệu mạng Gzip/Brotli giảm 60-80% băng thông
app.use(honeypotTripwire); // Cạm bẫy dò quét lỗ hổng .env, wp-admin, sql

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '64kb' })); // Chặn payload JSON khổng lồ chống cạn kiệt RAM
app.use(express.urlencoded({ extended: true, limit: '64kb' }));
app.use(noSqlInjectionShield); // Lọc sạch toán tử NoSQL Injection ($gt, $ne, $where)

// Phân tầng Rate-Limiting phòng vệ Brute-force & DDoS
app.use('/api', globalApiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/shop/buy', transactionLimiter);
app.use('/api/matches/record', transactionLimiter);
app.use('/api/admin', adminLimiter);

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

// 7. API Nhiệm Vụ Hằng Ngày & Thành Tựu Danh Hiệu (Quests & Achievements - Task 6)
const questRoutes = require('./routes/questRoutes');
app.use('/api/quests', questRoutes);

// 8. API Báo Cáo Vi Phạm & Tố Cáo (Player Reports - Task 3)
const reportRoutes = require('./routes/reportRoutes');
app.use('/api/reports', reportRoutes);

// Chặn 404 an toàn cho mọi endpoint không xác định (ẩn hoàn toàn HTML/công nghệ server)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Tài nguyên hoặc đường dẫn API không tồn tại trên hệ thống bảo mật NEO-UNO!',
  });
});

// Bộ lọc bắt lỗi toàn cục an toàn (không bao giờ để lộ stack trace ra ngoài)
app.use(safeErrorHandler);

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

  // Khởi động chu trình tối ưu CSDL: Dọn dẹp Replay > 7 ngày & giới hạn 100 trận gần nhất
  const { runMatchRetentionCleanup } = require('./utils/matchRetention');
  runMatchRetentionCleanup().catch((err) => console.warn('[Retention Init Warning]:', err.message));
  // Định kỳ chạy dọn dẹp mỗi 6 tiếng một lần
  setInterval(() => {
    runMatchRetentionCleanup().catch((err) => console.warn('[Retention Interval Warning]:', err.message));
  }, 6 * 60 * 60 * 1000);

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
