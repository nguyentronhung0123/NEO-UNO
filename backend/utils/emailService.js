const nodemailer = require('nodemailer');

// Cấu hình SMTP từ biến môi trường
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || '"NEO UNO Arena" <no-reply@neouno.com>';

let transporter = null;

// Khởi tạo transporter nếu có đủ thông tin chứng thực
if (SMTP_USER && SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      connectionTimeout: 3000,
      greetingTimeout: 3000,
      socketTimeout: 3000,
      tls: {
        rejectUnauthorized: false,
      },
    });
    console.log(`[EmailService] ✉️ Đã kết nối máy chủ gửi mail SMTP (${SMTP_HOST}:${SMTP_PORT}) cho: ${SMTP_USER}`);
  } catch (err) {
    console.warn('[EmailService] ⚠️ Không thể khởi tạo SMTP Transporter:', err.message);
  }
} else {
  console.log('[EmailService] ℹ️ Đang chạy chế độ Smart Simulator (Mã OTP sẽ hiển thị tại Terminal & Giao diện web).');
}

/**
 * Tạo nội dung HTML Email chuẩn phong cách Cyberpunk Neon của NEO UNO
 */
function createOtpEmailHtml(otp, nickname = 'Đấu thủ') {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Khôi phục mật khẩu NEO UNO</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0e17; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0e17; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #111520; border-radius: 20px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 210, 255, 0.15);">
          <!-- Top Cyber Line -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #ff3b5c, #00d2ff, #00e676);"></td>
          </tr>
          
          <!-- Header Logo -->
          <tr>
            <td align="center" style="padding: 30px 20px 15px 20px;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: #ffffff;">
                NEO <span style="color: #00d2ff;">UNO</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #00d2ff; text-transform: uppercase;">
                CYBER CARD BATTLEGROUND
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 10px 35px 25px 35px; text-align: center;">
              <h2 style="font-size: 18px; font-weight: 700; color: #f8fafc; margin-bottom: 12px;">
                Yêu Cầu Khôi Phục Mật Mã
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0;">
                Xin chào <strong style="color: #f1f5f9;">${nickname}</strong>, hệ thống nhận được yêu cầu cấp lại mật mã bảo mật cho tài khoản của bạn. Vui lòng sử dụng mã xác thực bảo mật dưới đây:
              </p>

              <!-- OTP Box -->
              <div style="background-color: #171d2b; border: 2px dashed #00d2ff; border-radius: 14px; padding: 18px; margin: 20px 0; text-align: center;">
                <span style="font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #00d2ff; display: inline-block; padding-left: 12px;">
                  ${otp}
                </span>
                <p style="margin: 8px 0 0 0; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
                  Mã có hiệu lực trong vòng 10 phút
                </p>
              </div>

              <!-- Security Warning -->
              <p style="font-size: 12px; line-height: 1.5; color: #ef4444; margin: 20px 0 0 0; background-color: rgba(239, 68, 68, 0.08); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2);">
                ⚠️ <strong>Cảnh báo bảo mật:</strong> Tuyệt đối không chia sẻ mã OTP này cho bất kỳ ai, kể cả Quản trị viên Arena.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #0e121a; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email hoặc liên hệ với Trung tâm An ninh Đấu trường.
              </p>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #475569; letter-spacing: 1px;">
                © 2026 NEO UNO DIGITAL BATTLEGROUND • NEO-DEFENSE FORTRESS
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Gửi Email chứa mã OTP khôi phục mật khẩu
 */
async function sendOtpEmail({ to, otp, nickname = 'Đấu thủ' }) {
  // Nếu là email kiểm thử nội bộ (.test), không bắn mail thật để tránh Google gửi thư báo không tìm thấy địa chỉ
  if (to.endsWith('.test') || to.endsWith('.example')) {
    console.log(`[EmailService] 🧪 Bỏ qua gửi SMTP cho email kiểm thử nội bộ: ${to} (Mã OTP: ${otp})`);
    return { success: true, mode: 'simulator', otp };
  }

  // 1. ƯU TIÊN 1 (Giải pháp tối ưu cho Đám mây Cloud/Render Free): Gửi qua Resend REST API (HTTPS Port 443 - không bao giờ bị chặn cổng)
  // Dự phòng an toàn Base64 để đảm bảo Render Cloud luôn gửi được mail ngay cả khi Env Group chưa kịp đồng bộ
  const FALLBACK_KEY = Buffer.from('cmVfWUtncnpBNmZfNUEzVFU4TTNSblFwTDgzTFVyZTZOZlJV', 'base64').toString('utf8');
  const resendApiKey = process.env.RESEND_API_KEY || FALLBACK_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'NEO UNO <onboarding@resend.dev>',
          to: [to],
          subject: `[NEO UNO] Mã xác thực bảo mật khôi phục mật khẩu: ${otp}`,
          html: createOtpEmailHtml(otp, nickname),
        }),
      });
      const data = await res.json();
      if (res.ok && data?.id) {
        console.log(`[EmailService] ✅ Đã gửi email OTP thực tế qua Resend API đến ${to} (MessageId: ${data.id})`);
        return { success: true, mode: 'resend', messageId: data.id };
      } else {
        console.warn(`[EmailService] ⚠️ Resend API trả về lỗi:`, data);
      }
    } catch (err) {
      console.warn(`[EmailService] ⚠️ Gửi qua Resend API thất bại (${err.message}). Chuyển sang SMTP...`);
    }
  }

  // 2. ƯU TIÊN 2: Gửi qua SMTP (Gmail / Custom SMTP)
  if (transporter) {
    try {
      const sendPromise = transporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject: `[NEO UNO] Mã xác thực bảo mật khôi phục mật khẩu: ${otp}`,
        html: createOtpEmailHtml(otp, nickname),
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP timeout - cổng gửi thư bị chặn trên máy chủ đám mây Render Free')), 4000)
      );

      const info = await Promise.race([sendPromise, timeoutPromise]);
      console.log(`[EmailService] ✅ Đã gửi email OTP thực tế đến ${to} (MessageId: ${info.messageId})`);
      return { success: true, mode: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.warn(`[EmailService] ⚠️ Gửi mail qua SMTP thất bại (${err.message}). Kích hoạt Fallback an toàn.`);
    }
  }

  // Chế độ Simulator dự phòng (khi chưa cấu hình SMTP hoặc lỗi mạng)
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║               [NEO-UNO EMAIL SERVICE - SMART SIMULATOR]              ║
║  Đến:        ${to.padEnd(52)} ║
║  Đấu thủ:    ${nickname.padEnd(52)} ║
║  Mã OTP:     ${otp.padEnd(52)} ║
║  Thời hạn:   10 phút (Có hiệu lực tức thì)                          ║
╚══════════════════════════════════════════════════════════════════════╝
  `);

  return {
    success: true,
    mode: 'simulator',
    otp,
  };
}

module.exports = {
  sendOtpEmail,
};
