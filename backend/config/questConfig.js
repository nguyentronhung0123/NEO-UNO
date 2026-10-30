/**
 * Cấu hình Hệ thống Nhiệm Vụ Hằng Ngày & Thành Tựu Danh Hiệu (Task 6)
 */

// 1. DANH MỤC NHIỆM VỤ HẰNG NGÀY (DAILY QUESTS) - TỰ ĐỘNG LÀM MỚI MỖI 24H
const DAILY_QUEST_TEMPLATES = [
  {
    id: 'quest_play_matches',
    title: 'Chiến Binh Đấu Trường',
    description: 'Thi đấu hoàn thành 2 ván đấu bất kỳ (Solo 1v1 hoặc Ghép 4 người).',
    icon: 'swords',
    target: 2,
    rewardCoins: 200,
    rewardExp: 60,
  },
  {
    id: 'quest_win_match',
    title: 'Khát Vọng Vinh Quang',
    description: 'Giành ngôi vị Quán quân (Hạng 1) trong 1 ván đấu xếp hạng.',
    icon: 'trophy',
    target: 1,
    rewardCoins: 250,
    rewardExp: 80,
  },
  {
    id: 'quest_play_wild',
    title: 'Bậc Thầy Biến Ảo',
    description: 'Đánh ra 3 lá bài Đổi Màu (Wild hoặc Wild Draw Four).',
    icon: 'auto_awesome',
    target: 3,
    rewardCoins: 200,
    rewardExp: 70,
  },
  {
    id: 'quest_say_uno',
    title: 'Phản Xạ Thần Tốc',
    description: 'Hô "UNO!" thành công khi trên tay còn đúng 1 lá bài duy nhất.',
    icon: 'campaign',
    target: 1,
    rewardCoins: 150,
    rewardExp: 50,
  },
  {
    id: 'quest_interact_emote',
    title: 'Giao Lưu Vui Vẻ',
    description: 'Ném 2 biểu cảm hoặc vật phẩm tương tác (Cà chua, pháo hoa...) vào đối thủ.',
    icon: 'sentiment_very_satisfied',
    target: 2,
    rewardCoins: 150,
    rewardExp: 50,
  },
];

// Phần thưởng Rương Ngày khi hoàn thành đủ toàn bộ nhiệm vụ trong ngày
const DAILY_CHEST_REWARD = {
  title: 'Rương Chiến Tích Hằng Ngày',
  description: 'Mở khóa khi hoàn thành tất cả nhiệm vụ trong ngày!',
  rewardCoins: 500,
  rewardExp: 150,
};

// 2. DANH MỤC THÀNH TỰU DÀI HẠN & HUY HIỆU DANH GIÁ (LONG-TERM ACHIEVEMENTS)
const ACHIEVEMENTS_CONFIG = [
  {
    id: 'ach_level_5',
    title: 'Đệ Nhất Tân Thủ',
    description: 'Nâng cấp tài khoản đạt mốc Cấp độ 5 (Level 5).',
    icon: 'military_tech',
    badge: '🥇',
    category: 'level',
    target: 5,
    rewardCoins: 600,
    rewardExp: 200,
  },
  {
    id: 'ach_elo_1150',
    title: 'Chiến Thần Đấu Trường',
    description: 'Vươn lên mốc 1,150 điểm ELO xếp hạng danh giá.',
    icon: 'workspace_premium',
    badge: '⚔️',
    category: 'elo',
    target: 1150,
    rewardCoins: 800,
    rewardExp: 300,
  },
  {
    id: 'ach_win_streak_3',
    title: 'Chuỗi Thắng Bất Bại',
    description: 'Đạt chuỗi 3 trận thắng liên tiếp không hề đứt đoạn.',
    icon: 'local_fire_department',
    badge: '🔥',
    category: 'win_streak',
    target: 3,
    rewardCoins: 700,
    rewardExp: 250,
  },
  {
    id: 'ach_total_wins_5',
    title: 'Bách Chiến Bách Thắng',
    description: 'Đạt tổng cộng 5 ván thắng trên đấu trường NEO-UNO.',
    icon: 'emoji_events',
    badge: '👑',
    category: 'total_wins',
    target: 5,
    rewardCoins: 1000,
    rewardExp: 400,
  },
  {
    id: 'ach_own_skins_2',
    title: 'Nhà Sưu Tầm Sành Điệu',
    description: 'Sở hữu từ 2 vật phẩm Skin bài hoặc Khung Avatar trong Cửa Hàng.',
    icon: 'storefront',
    badge: '🛍️',
    category: 'inventory',
    target: 2,
    rewardCoins: 600,
    rewardExp: 200,
  },
  {
    id: 'ach_throw_emotes_5',
    title: 'Vua Tương Tác',
    description: 'Ném 5 vật phẩm tương tác (Cà chua, pháo hoa, bom nước) vào đối thủ.',
    icon: 'waving_hand',
    badge: '🍅',
    category: 'emotes',
    target: 5,
    rewardCoins: 500,
    rewardExp: 150,
  },
];

module.exports = {
  DAILY_QUEST_TEMPLATES,
  DAILY_CHEST_REWARD,
  ACHIEVEMENTS_CONFIG,
};
