const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'RECORD_MATCH_POINTS',
        'SHOP_BUY',
        'SHOP_EQUIP',
        'ADMIN_ADJUST_COINS',
        'ADMIN_ADJUST_ELO',
        'ADMIN_BAN_USER',
        'ADMIN_UNBAN_USER',
        'ADMIN_ROLE_CHANGE',
        'SUSPICIOUS_EXPLOIT_ATTEMPT',
        'RATE_LIMIT_EXCEEDED',
      ],
      index: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    performedBy: {
      type: String, // 'SYSTEM' hoặc Admin UserId/Nickname
      default: 'SYSTEM',
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index phục vụ truy vấn nhật ký an ninh theo thời gian thực
securityLogSchema.index({ createdAt: -1 });
securityLogSchema.index({ userId: 1, createdAt: -1 });
securityLogSchema.index({ action: 1, severity: 1 });

module.exports = mongoose.model('SecurityLog', securityLogSchema);
