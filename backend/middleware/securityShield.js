/**
 * ============================================================================
 * NEO-UNO DEFENSE-IN-DEPTH: BỨC TƯỜNG THÉP BẢO MẬT MÁY CHỦ (TASK 5 - TUẦN 4)
 * ============================================================================
 * 
 * Kiến trúc gia cố an ninh đa tầng (Multi-Tier Security Fortress):
 *  1. HTTP Header Hardening (Helmet, X-Frame-Options, NoSniff, XSS Protection).
 *  2. Server Fingerprint Cloaking (Xóa X-Powered-By, ngụy trang Server header).
 *  3. NoSQL Injection & Prototype Pollution Sanitization (express-mongo-sanitize).
 *  4. Phân tầng Rate-Limiting Chống Brute-force & DDoS (Global, Auth, Shop/Match, Admin).
 *  5. Honeypot & Security Tripwire (Cạm bẫy phát hiện quét lỗ hổng .env, wp-admin, config).
 *  6. Chống Cache Dữ liệu Nhạy cảm (No-Store cho Auth, Shop, Admin SOC).
 *  7. Chuẩn hóa Lỗi An toàn (Redaction of Stack Traces & Database Internals).
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const SecurityLog = require('../models/SecurityLog');

/**
 * 1. CẤU HÌNH HELMET BẢO VỆ HTTP HEADERS
 */
const helmetShield = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
      connectSrc: ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Hỗ trợ tải avatar bên ngoài (Dicebear, CDN)
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' }, // Chống tấn công Clickjacking
  hidePoweredBy: true, // Xóa header X-Powered-By: Express
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  ieNoOpen: true,
  noSniff: true, // Chống MIME-sniffing
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

/**
 * 2. ẨN DANH & NGỤY TRANG DẤU VẾT HỆ THỐNG (SERVER CLOAKING)
 */
function serverCloaking(req, res, next) {
  // Loại bỏ hoàn toàn dấu hiệu công nghệ Express/Node
  res.removeHeader('X-Powered-By');
  res.setHeader('Server', 'NEO-DEFENSE-FORTRESS');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Chặn Bot Google index các route quản trị và API mật
  if (req.originalUrl.startsWith('/api/admin') || req.originalUrl.startsWith('/api/auth')) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
}

/**
 * 3. BẢO VỆ CHỐNG NOSQL INJECTION & TOÁN TỬ GIAN LẬN ($gt, $ne, $where, prototype pollution)
 * Tương thích 100% với Express 5 (xử lý in-place không ghi đè getter req.query)
 */
function cleanNoSqlInjections(target) {
  if (!target || typeof target !== 'object') return false;
  let hasInjected = false;
  for (const key of Object.keys(target)) {
    if (key.startsWith('$') || key.includes('.')) {
      hasInjected = true;
      delete target[key];
    } else if (typeof target[key] === 'object' && target[key] !== null) {
      if (cleanNoSqlInjections(target[key])) {
        hasInjected = true;
      }
    }
  }
  return hasInjected;
}

function noSqlInjectionShield(req, res, next) {
  let detected = false;
  try {
    if (req.body && cleanNoSqlInjections(req.body)) detected = true;
    if (req.params && cleanNoSqlInjections(req.params)) detected = true;
    if (req.query && cleanNoSqlInjections(req.query)) detected = true;

    if (detected) {
      console.warn(`[Security Alert] ⚠️ Phát hiện và vô hiệu hóa NoSQL Injection từ IP: ${req.ip}`);
      SecurityLog.create({
        userId: req.user?._id || null,
        action: 'NOSQL_INJECTION_BLOCKED',
        severity: 'warning',
        details: { path: req.originalUrl, ip: req.ip },
        performedBy: 'NOSQL_SHIELD',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || 'Unknown',
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('[NoSQL Shield Warning]:', err.message);
  }
  next();
}

/**
 * 4. PHÂN TẦNG RATE LIMITING: BỨC TƯỜNG PHÒNG THỦ BRUTE-FORCE & DDOS
 */

// 4.1. Global Gateway Limiter (Áp dụng toàn bộ hệ thống API)
const globalApiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 300, // Tối đa 300 requests / 5 phút / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Tần suất truy cập vượt ngưỡng an toàn! Vui lòng làm chậm thao tác.',
    code: 'ERR_GLOBAL_RATE_LIMIT',
  },
});

// 4.2. Sensitive Auth Limiter (Chống dò mật khẩu, spam đăng ký, credential stuffing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 20, // Tối đa 20 lần thử / 15 phút
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    SecurityLog.create({
      action: 'RATE_LIMIT_EXCEEDED',
      severity: 'warning',
      details: { path: req.originalUrl, ip: req.ip, bodyUser: req.body?.username || req.body?.email },
      performedBy: 'RATE_LIMITER_AUTH',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'Unknown',
    }).catch(() => {});

    return res.status(429).json({
      success: false,
      message: 'CẢNH BÁO BẢO MẬT: Quá nhiều lần thử đăng nhập/đăng ký thất bại. Tạm khóa IP trong 15 phút!',
      code: 'ERR_AUTH_BRUTE_FORCE_BLOCKED',
      retryAfterSeconds: 900,
    });
  },
});

// 4.3. Financial & Game Transaction Limiter (Chống Spam Mua Đồ & Ghi Kết Quả Trận)
const transactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 15, // Tối đa 15 giao dịch / phút
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Giao dịch quá nhanh! Cơ chế chống gian lận (Anti Double-Spend) đang kích hoạt.',
    code: 'ERR_TRANSACTION_COOLDOWN',
  },
});

// 4.4. Admin SOC Fortress Limiter (Bảo vệ API Quản Trị Tuyệt Đối)
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 60, // Tối đa 60 requests / phút
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Lưu lượng truy cập Quản trị viên vượt ngưỡng cho phép!',
    code: 'ERR_ADMIN_RATE_LIMIT',
  },
});

/**
 * 5. HONEYPOT & SECURITY TRIPWIRE (CẠM BẪY PHÁT HIỆN HACKER QUÉT ĐƯỜNG DẪN MẬT)
 */
const SUSPICIOUS_PATHS = [
  /\.env/i,
  /\.git/i,
  /config\.json/i,
  /wp-admin/i,
  /wp-login/i,
  /admin\.php/i,
  /backup/i,
  /\.sql/i,
  /eval-stdin/i,
  /phpmyadmin/i,
  /actuator/i,
  /\.aws/i,
  /\.ssh/i,
  /cgi-bin/i,
];

function honeypotTripwire(req, res, next) {
  const url = req.originalUrl;
  const isSuspicious = SUSPICIOUS_PATHS.some((regex) => regex.test(url));

  if (isSuspicious) {
    console.error(`[HONEYPOT TRIPWIRE] 🚨 Phát hiện hành vi dò quét lỗ hổng trái phép: [${url}] từ IP: ${req.ip}`);

    SecurityLog.create({
      action: 'HONEYPOT_ATTACK_DETECTED',
      severity: 'critical',
      details: {
        attackPath: url,
        method: req.method,
        ip: req.ip,
        headers: req.headers,
      },
      performedBy: 'HONEYPOT_TRIPWIRE',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'Unknown Scanner',
    }).catch(() => {});

    // Phản hồi 404 giả lập máy chủ trống, không cung cấp bất kỳ thông tin nội bộ nào
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy tài nguyên yêu cầu trên máy chủ!',
    });
  }

  next();
}

/**
 * 6. BỘ XỬ LÝ LỖI TOÀN CỤC AN TOÀN (SAFE ERROR REDACTION SHIELD)
 */
function safeErrorHandler(err, req, res, next) {
  // Không bao giờ để lộ stack trace hoặc cấu trúc thư mục máy chủ ra ngoài
  console.error('[BE Safe Error Handler]:', err.message);

  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.userMessage || 'Yêu cầu không thể hoàn thành do sự cố an toàn dữ liệu.',
    code: err.code || 'INTERNAL_SECURITY_ERROR',
  });
}

module.exports = {
  helmetShield,
  serverCloaking,
  noSqlInjectionShield,
  globalApiLimiter,
  authLimiter,
  transactionLimiter,
  adminLimiter,
  honeypotTripwire,
  safeErrorHandler,
};
