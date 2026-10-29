/**
 * Hệ thống Hội thoại & Biểu cảm Đa dạng của Bot AI (NEO-UNO Backend)
 * Hỗ trợ 4 cá tính Bot riêng biệt (Neon ⚡, Titan 🤖, Cyber 🛡️, Vortex 🌀)
 * Cơ chế chống lặp câu (Anti-repetition memory)
 */

const lastBotQuotes = new Map();

function getRandomNonRepeating(botKey, list) {
  if (!list || list.length === 0) return null;
  const last = lastBotQuotes.get(botKey);
  const candidates = list.filter((item) => item.label !== last);
  const pool = candidates.length > 0 ? candidates : list;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  if (chosen && chosen.label) {
    lastBotQuotes.set(botKey, chosen.label);
  }
  return { ...chosen };
}

function resolveBotKey(botName = '') {
  const lower = botName.toLowerCase();
  if (lower.includes('neon')) return 'neon';
  if (lower.includes('titan')) return 'titan';
  if (lower.includes('cyber')) return 'cyber';
  if (lower.includes('vortex')) return 'vortex';
  return 'general';
}

const BOT_DIALOGUE_DATABASE = {
  // 1. BOT NEON: Nhanh nhẹn, lém lỉnh, thích cà khịa
  neon: {
    attack: [
      { id: 'neon_att_1', icon: '⚡', label: 'Tốc độ ánh sáng! Đỡ được không?', type: 'text', sound: 'zap' },
      { id: 'neon_att_2', icon: '💣', label: 'Quá nhanh quá nguy hiểm! Nhận bài nè!', type: 'text', sound: 'firework' },
      { id: 'neon_att_3', icon: '😈', label: 'Bốc bài mỏi tay nhé bạn tôi ơi!', type: 'text', sound: 'emote_pop' },
      { id: 'neon_att_4', icon: '⚡', label: 'Né sao được quả bài này của Neon!', type: 'text', sound: 'zap' },
      { id: 'neon_att_5', icon: '😂', label: 'Cười người hôm trước, hôm sau bốc bài!', type: 'emoji', sound: 'emote_pop' },
      { id: 'neon_att_6', icon: '🌪️', label: 'Bất ngờ chưa bà già?!', type: 'text', sound: 'firework' },
      { id: 'neon_att_7', icon: '🛑', label: 'Chớp mắt cái là mất lượt liền!', type: 'text', sound: 'emote_pop' },
    ],
    penalty: [
      { id: 'neon_pen_1', icon: '😤', label: 'Ui là trời, cay thế nhờ! Chờ đấy!', type: 'emoji', sound: 'splat' },
      { id: 'neon_pen_2', icon: '⚡', label: 'Chơi gắt vậy bạn êi? Sắp phục thù!', type: 'text', sound: 'zap' },
      { id: 'neon_pen_3', icon: '😭', label: 'Gió cuốn bay mất bài đẹp rồi hu hu!', type: 'emoji', sound: 'splat' },
      { id: 'neon_pen_4', icon: '😅', label: 'Bốc thì bốc, tí nữa biết tay tui!', type: 'emoji', sound: 'emote_pop' },
      { id: 'neon_pen_5', icon: '🤦‍♂️', label: 'Đen thôi đỏ quên đi nha!', type: 'text', sound: 'splat' },
    ],
    uno: [
      { id: 'neon_uno_1', icon: '🚀', label: 'UNO! Đố bạn đuổi kịp tốc độ của tôi!', type: 'text', sound: 'firework' },
      { id: 'neon_uno_2', icon: '👑', label: 'Còn đúng 1 lá! Chiến thắng trong tầm tay!', type: 'text', sound: 'firework' },
      { id: 'neon_uno_3', icon: '⚡', label: 'Coi chừng sét đánh, tôi UNO rồi nhé!', type: 'text', sound: 'zap' },
      { id: 'neon_uno_4', icon: '🎉', label: 'Tới công chuyện luôn rồi! UNO đây!', type: 'projectile', sound: 'firework' },
      { id: 'neon_uno_5', icon: '😎', label: 'Đẳng cấp tốc độ, 1 lá duy nhất!', type: 'emoji', sound: 'firework' },
    ],
    retaliate: [
      { id: 'tomato', icon: '🍅', label: 'Ném trả cà chua nè bạn ơi!', type: 'projectile', sound: 'splat' },
      { id: 'zap', icon: '⚡', label: 'Sấm sét phản đòn!', type: 'projectile', sound: 'zap' },
      { id: 'rage', icon: '😡', label: 'Ủa alo? Sao ném tui hoài dị!', type: 'emoji', sound: 'zap' },
      { id: 'salty', icon: '😤', label: 'Nhớ mặt tui đấy, lát ném lại!', type: 'text', sound: 'splat' },
    ],
    banter: [
      { id: 'neon_ban_1', icon: '⏰', label: 'Nhanh tay lên nào, sốt ruột ghê á!', type: 'text', sound: 'emote_pop' },
      { id: 'neon_ban_2', icon: '🌪️', label: 'Đấu với Bot Neon chỉ có hoa mắt thôi!', type: 'text', sound: 'emote_pop' },
      { id: 'neon_ban_3', icon: '👀', label: 'Có lá nào xịn sò đánh ra xem thử?', type: 'text', sound: 'emote_pop' },
    ],
  },

  // 2. BOT TITAN: Máy móc, uy lực, tính toán hủy diệt
  titan: {
    attack: [
      { id: 'titan_att_1', icon: '🤖', label: 'Khóa mục tiêu! Kích hoạt đòn hủy diệt!', type: 'text', sound: 'zap' },
      { id: 'titan_att_2', icon: '📊', label: 'Tỷ lệ thất bại của bạn vừa tăng lên 99%!', type: 'text', sound: 'zap' },
      { id: 'titan_att_3', icon: '🦾', label: 'Tính toán chuẩn xác: Bạn phải bốc bài!', type: 'text', sound: 'firework' },
      { id: 'titan_att_4', icon: '💥', label: 'Giao thức tấn công cấp độ tối đa!', type: 'text', sound: 'splat' },
      { id: 'titan_att_5', icon: '🤖', label: 'AI tối ưu không bao giờ mắc sai sót!', type: 'text', sound: 'zap' },
    ],
    penalty: [
      { id: 'titan_pen_1', icon: '⚠️', label: 'Cảnh báo: Lỗi hệ thống quá cay cú!', type: 'text', sound: 'splat' },
      { id: 'titan_pen_2', icon: '🔋', label: 'Đang nạp lại năng lượng... Sẽ trả đũa!', type: 'text', sound: 'zap' },
      { id: 'titan_pen_3', icon: '📉', label: 'Phát hiện nước đi liều mạng từ đối thủ!', type: 'text', sound: 'splat' },
      { id: 'titan_pen_4', icon: '😡', label: 'Khởi động vi xử lý... Tức giận 100%!', type: 'emoji', sound: 'zap' },
    ],
    uno: [
      { id: 'titan_uno_1', icon: '🚨', label: 'CẢNH BÁO TOÀN SÂN: Titan đã UNO!', type: 'text', sound: 'firework' },
      { id: 'titan_uno_2', icon: '👑', label: 'Chỉ còn 1 lá! Lệnh hủy diệt sắp hoàn tất!', type: 'text', sound: 'firework' },
      { id: 'titan_uno_3', icon: '🏆', label: 'Xác suất tôi giành chiến thắng: 99.9%!', type: 'text', sound: 'firework' },
      { id: 'titan_uno_4', icon: '⚡', label: 'UNO! Không lối thoát cho đối thủ!', type: 'projectile', sound: 'zap' },
    ],
    retaliate: [
      { id: 'zap', icon: '⚡', label: 'Phóng xung điện!', type: 'projectile', sound: 'zap' },
      { id: 'poop', icon: '💩', label: 'Tặng lại quà troll!', type: 'projectile', sound: 'splat' },
      { id: 'titan_ret_1', icon: '🤖', label: 'Phát hiện hành vi ném đồ thô bạo!', type: 'text', sound: 'zap' },
    ],
    banter: [
      { id: 'titan_ban_1', icon: '🧠', label: 'Vi xử lý Titan đã tính trước 10 lượt đi!', type: 'text', sound: 'emote_pop' },
      { id: 'titan_ban_2', icon: '💓', label: 'Quét nhịp tim đối thủ: Có vẻ đang lo lắng?', type: 'text', sound: 'emote_pop' },
      { id: 'titan_ban_3', icon: '⚙️', label: 'Hệ thống vận hành với hiệu suất 100%!', type: 'text', sound: 'emote_pop' },
    ],
  },

  // 3. BOT CYBER: Điềm đạm, chiến thuật kiên cố
  cyber: {
    attack: [
      { id: 'cyber_att_1', icon: '🛡️', label: 'Tường lửa Cyber chặn đứng mọi hy vọng!', type: 'text', sound: 'firework' },
      { id: 'cyber_att_2', icon: '♟️', label: 'Chiến thuật bài bản, không thể chống đỡ!', type: 'text', sound: 'zap' },
      { id: 'cyber_att_3', icon: '🎁', label: 'Nhận món quà chiến thuật này đi bạn!', type: 'text', sound: 'splat' },
      { id: 'cyber_att_4', icon: '🌐', label: 'Đã phong tỏa hoàn toàn đường đi nước bước!', type: 'text', sound: 'zap' },
      { id: 'cyber_att_5', icon: '😎', label: 'Đẳng cấp chiến thuật Neo-UNO đỉnh cao!', type: 'emoji', sound: 'firework' },
    ],
    penalty: [
      { id: 'cyber_pen_1', icon: '🛡️', label: 'Va vấp nhỏ không làm lung lay lá chắn!', type: 'text', sound: 'emote_pop' },
      { id: 'cyber_pen_2', icon: '☕', label: 'Được đấy! Bạn chơi khá hơn tôi tưởng!', type: 'text', sound: 'emote_pop' },
      { id: 'cyber_pen_3', icon: '📈', label: 'Chiến thuật lùi 1 bước để tiến 3 bước!', type: 'text', sound: 'emote_pop' },
      { id: 'cyber_pen_4', icon: '🎯', label: 'Tạm thời nhận bài, ván đấu còn rất dài!', type: 'text', sound: 'emote_pop' },
    ],
    uno: [
      { id: 'cyber_uno_1', icon: '🏁', label: 'UNO! Kế hoạch tác chiến đã về đích!', type: 'text', sound: 'firework' },
      { id: 'cyber_uno_2', icon: '👑', label: 'Phòng thủ hoàn hảo và giờ là 1 lá bài!', type: 'text', sound: 'firework' },
      { id: 'cyber_uno_3', icon: '🎉', label: 'Báo UNO! Không một kẽ hở để lật kèo!', type: 'projectile', sound: 'firework' },
    ],
    retaliate: [
      { id: 'firework', icon: '🎉', label: 'Pháo hoa phản kích!', type: 'projectile', sound: 'firework' },
      { id: 'tomato', icon: '🍅', label: 'Cà chua phản công!', type: 'projectile', sound: 'splat' },
      { id: 'cyber_ret_1', icon: '🛡️', label: 'Lá chắn Cyber phản đòn ngay lập tức!', type: 'text', sound: 'zap' },
    ],
    banter: [
      { id: 'cyber_ban_1', icon: '♟️', label: 'Hãy bình tĩnh suy nghĩ kỹ từng lá bài!', type: 'text', sound: 'emote_pop' },
      { id: 'cyber_ban_2', icon: '🌐', label: 'Công nghệ Cyber luôn kiểm soát thế trận!', type: 'text', sound: 'emote_pop' },
    ],
  },

  // 4. BOT VORTEX: Hỗn loạn, troll, hài hước cực bựa
  vortex: {
    attack: [
      { id: 'vort_att_1', icon: '🌀', label: 'Xoay mòng mòng luôn á! Chóng mặt chưa?!', type: 'text', sound: 'firework' },
      { id: 'vort_att_2', icon: '🌪️', label: 'Lốc xoáy quét sạch hy vọng thắng trận!', type: 'text', sound: 'zap' },
      { id: 'vort_att_3', icon: '🎁', label: 'Tặng bạn cả bầu trời bài UNO nè!', type: 'text', sound: 'splat' },
      { id: 'vort_att_4', icon: '🚀', label: 'Một phát lên mây luôn nha bạn yêu!', type: 'text', sound: 'firework' },
      { id: 'vort_att_5', icon: '🤣', label: 'Ảo thật đấy! Đỡ đòn này đi xem nào!', type: 'emoji', sound: 'emote_pop' },
    ],
    penalty: [
      { id: 'vort_pen_1', icon: '😱', label: 'Ối giồi ôi, bão táp ập tới rồi làng nước ơi!', type: 'emoji', sound: 'splat' },
      { id: 'vort_pen_2', icon: '😭', label: 'Gì vậy trời?! Ai cứu tui dới!', type: 'emoji', sound: 'splat' },
      { id: 'vort_pen_3', icon: '🤦‍♂️', label: 'Bốc bài mỏi cả tay, quả báo tới sớm quá!', type: 'text', sound: 'splat' },
      { id: 'vort_pen_4', icon: '💢', label: 'Cay đắng cuộc đời, nhớ mặt tui đấy nhé!', type: 'text', sound: 'zap' },
    ],
    uno: [
      { id: 'vort_uno_1', icon: '🎉', label: 'UNO BÙNG NỔ! Ai cản được lốc Vortex?!', type: 'text', sound: 'firework' },
      { id: 'vort_uno_2', icon: '💃', label: 'Còn đúng 1 lá! Quẩy lên nào anh em ơi!', type: 'text', sound: 'firework' },
      { id: 'vort_uno_3', icon: '👑', label: 'UNO! Chuẩn bị quỳ trước chúa tể hỗn loạn!', type: 'text', sound: 'firework' },
      { id: 'vort_uno_4', icon: '💩', label: 'Tặng quà ăn mừng UNO nè!', type: 'projectile', sound: 'splat' },
    ],
    retaliate: [
      { id: 'poop', icon: '💩', label: 'Ném tui hả? Cho ăn phân troll nè!', type: 'projectile', sound: 'splat' },
      { id: 'tomato', icon: '🍅', label: 'Ném trả bẹp dính mặt!', type: 'projectile', sound: 'splat' },
      { id: 'zap', icon: '⚡', label: 'Bị troll thì giật sét lại!', type: 'projectile', sound: 'zap' },
      { id: 'vort_ret_1', icon: '🤪', label: 'Á à dám ném anh hả em!', type: 'emoji', sound: 'splat' },
    ],
    banter: [
      { id: 'vort_ban_1', icon: '⏳', label: 'Đánh lẹ lẹ lên bạn ơi, sốt ruột quá đi à!', type: 'text', sound: 'emote_pop' },
      { id: 'vort_ban_2', icon: '🤣', label: 'Ván này ảo ma Canada thật sự luôn á!', type: 'text', sound: 'emote_pop' },
      { id: 'vort_ban_3', icon: '🔮', label: 'Tui đang có linh cảm sắp có biến lớn nè!', type: 'text', sound: 'emote_pop' },
    ],
  },

  // Fallback chung
  general: {
    attack: [
      { id: 'gen_att_1', icon: '💣', label: 'Đòn tấn công bất ngờ nè!', type: 'text', sound: 'firework' },
      { id: 'gen_att_2', icon: '⚡', label: 'Bốc bài phạt đi bạn ơi!', type: 'text', sound: 'zap' },
      { id: 'gen_att_3', icon: '🛑', label: 'Cấm lượt nhé!', type: 'text', sound: 'emote_pop' },
    ],
    penalty: [
      { id: 'gen_pen_1', icon: '😭', label: 'Trời ơi bị phạt nhiều thế!', type: 'emoji', sound: 'splat' },
      { id: 'gen_pen_2', icon: '😤', label: 'Cay thật đấy, chờ đấy!', type: 'text', sound: 'splat' },
    ],
    uno: [
      { id: 'gen_uno_1', icon: '👑', label: 'UNO! Còn đúng 1 lá bài!', type: 'text', sound: 'firework' },
      { id: 'gen_uno_2', icon: '🎉', label: 'Báo UNO! Sắp thắng rồi!', type: 'projectile', sound: 'firework' },
    ],
    retaliate: [
      { id: 'tomato', icon: '🍅', label: 'Ném trả cà chua!', type: 'projectile', sound: 'splat' },
      { id: 'zap', icon: '⚡', label: 'Phóng điện phản đòn!', type: 'projectile', sound: 'zap' },
    ],
    banter: [
      { id: 'gen_ban_1', icon: '🤔', label: 'Đang suy nghĩ nước đi hay nhất...', type: 'text', sound: 'emote_pop' },
    ],
  },
};

function getBotAttackEmote(botName) {
  const key = resolveBotKey(botName);
  const personality = BOT_DIALOGUE_DATABASE[key] || BOT_DIALOGUE_DATABASE.general;
  return getRandomNonRepeating(`${key}_att`, personality.attack);
}

function getBotPenaltyEmote(botName) {
  const key = resolveBotKey(botName);
  const personality = BOT_DIALOGUE_DATABASE[key] || BOT_DIALOGUE_DATABASE.general;
  return getRandomNonRepeating(`${key}_pen`, personality.penalty);
}

function getBotUnoEmote(botName) {
  const key = resolveBotKey(botName);
  const personality = BOT_DIALOGUE_DATABASE[key] || BOT_DIALOGUE_DATABASE.general;
  return getRandomNonRepeating(`${key}_uno`, personality.uno);
}

function getBotRetaliationEmote(botName) {
  const key = resolveBotKey(botName);
  const personality = BOT_DIALOGUE_DATABASE[key] || BOT_DIALOGUE_DATABASE.general;
  return getRandomNonRepeating(`${key}_ret`, personality.retaliate);
}

function getBotBanterEmote(botName) {
  const key = resolveBotKey(botName);
  const personality = BOT_DIALOGUE_DATABASE[key] || BOT_DIALOGUE_DATABASE.general;
  return getRandomNonRepeating(`${key}_ban`, personality.banter);
}

module.exports = {
  getBotAttackEmote,
  getBotPenaltyEmote,
  getBotUnoEmote,
  getBotRetaliationEmote,
  getBotBanterEmote,
};
