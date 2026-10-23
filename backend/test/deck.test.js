/**
 * Bộ kiểm thử tự động toàn diện Logic Bộ bài UNO 108 lá chuẩn
 * Chạy bằng lệnh: node backend/test/deck.test.js
 */

const { createDeck, shuffleDeck } = require('../utils/deck');

const COLORS = ['red', 'blue', 'green', 'yellow'];
const ACTION_VALUES = ['skip', 'reverse', 'draw_two'];

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${message}`);
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${message}`);
    process.exitCode = 1;
  }
}

console.log('\n======================================================');
console.log('   BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG TASK 1: LOGIC BỘ BÀI UNO');
console.log('======================================================\n');

// 1. Kiểm tra khởi tạo và tổng số lượng
console.log('📌 Nhóm 1: Kiểm tra số lượng và cấu trúc dữ liệu');
const deck = createDeck();
assert(Array.isArray(deck), 'createDeck() phải trả về một mảng');
assert(deck.length === 108, `Tổng số lượng lá bài phải đúng chính xác 108 lá (Thực tế: ${deck.length})`);

// 2. Kiểm tra tính duy nhất của ID
const ids = deck.map((c) => c.id);
const uniqueIds = new Set(ids);
assert(uniqueIds.size === 108, `Tất cả 108 lá bài phải có ID duy nhất (Trùng lặp: ${108 - uniqueIds.size})`);

// 3. Kiểm tra thuộc tính bắt buộc của từng lá bài
const validStructure = deck.every(
  (c) => typeof c.id === 'string' && typeof c.color === 'string' && typeof c.value === 'string'
);
assert(validStructure, 'Mỗi lá bài phải có cấu trúc hợp lệ { id: string, color: string, value: string }');

// 4. Kiểm tra phân bổ 4 màu cơ bản (100 lá)
console.log('\n📌 Nhóm 2: Kiểm tra phân bổ 4 màu cơ bản (100 lá có màu)');
COLORS.forEach((color) => {
  const colorCards = deck.filter((c) => c.color === color);
  assert(colorCards.length === 25, `Màu [${color}] phải có chính xác 25 lá (Thực tế: ${colorCards.length})`);

  // Lá số 0
  const zeroCards = colorCards.filter((c) => c.value === '0');
  assert(zeroCards.length === 1, `Màu [${color}] phải có đúng 1 lá số '0' (Thực tế: ${zeroCards.length})`);

  // Các số 1 đến 9: mỗi số 2 lá
  for (let num = 1; num <= 9; num++) {
    const numCards = colorCards.filter((c) => c.value === String(num));
    assert(
      numCards.length === 2,
      `Màu [${color}] phải có đúng 2 lá số '${num}' (Thực tế: ${numCards.length})`
    );
  }

  // Các lá chức năng: mỗi loại 2 lá
  ACTION_VALUES.forEach((action) => {
    const actionCards = colorCards.filter((c) => c.value === action);
    assert(
      actionCards.length === 2,
      `Màu [${color}] phải có đúng 2 lá chức năng [${action}] (Thực tế: ${actionCards.length})`
    );
  });
});

// 5. Kiểm tra 8 lá Wild đặc biệt
console.log('\n📌 Nhóm 3: Kiểm tra các lá đặc biệt Wild (8 lá)');
const wildColorCards = deck.filter((c) => c.color === 'wild');
assert(wildColorCards.length === 8, `Tổng số lá màu 'wild' phải đúng 8 lá (Thực tế: ${wildColorCards.length})`);

const wildCards = deck.filter((c) => c.color === 'wild' && c.value === 'wild');
assert(wildCards.length === 4, `Phải có chính xác 4 lá 'wild' đổi màu (Thực tế: ${wildCards.length})`);

const wildDrawFourCards = deck.filter((c) => c.color === 'wild' && c.value === 'wild_draw_four');
assert(
  wildDrawFourCards.length === 4,
  `Phải có chính xác 4 lá 'wild_draw_four' đổi màu + rút 4 (Thực tế: ${wildDrawFourCards.length})`
);

// 6. Kiểm tra thuật toán xáo bài Fisher-Yates
console.log('\n📌 Nhóm 4: Kiểm tra thuật toán Fisher-Yates shuffleDeck()');
const originalDeck = createDeck();
const originalFirstId = originalDeck[0].id;
const originalLastId = originalDeck[originalDeck.length - 1].id;

const shuffled = shuffleDeck(originalDeck);

assert(Array.isArray(shuffled), 'shuffleDeck() phải trả về một mảng mới');
assert(shuffled.length === 108, `Mảng bài sau khi xáo trộn vẫn giữ nguyên 108 lá (Thực tế: ${shuffled.length})`);

// Kiểm tra tính bất biến (Immutability - không thay đổi mảng gốc)
assert(
  originalDeck[0].id === originalFirstId && originalDeck[originalDeck.length - 1].id === originalLastId,
  'Hàm shuffleDeck() không được làm thay đổi vị trí của mảng gốc truyền vào (Immutability)'
);

// Kiểm tra đầy đủ ID sau khi xáo (không rơi rớt hoặc thêm lá nào)
const shuffledIdSet = new Set(shuffled.map((c) => c.id));
assert(shuffledIdSet.size === 108, 'Mảng sau khi xáo trộn phải bảo toàn đủ 108 ID lá bài ban đầu');

// Kiểm tra độ xáo trộn: Vị trí lá bài có thay đổi
let samePositionCount = 0;
for (let i = 0; i < 108; i++) {
  if (originalDeck[i].id === shuffled[i].id) {
    samePositionCount++;
  }
}
assert(
  samePositionCount < 15,
  `Thuật toán xáo trộn ngẫu nhiên tốt: Tỷ lệ trùng vị trí chỉ ${samePositionCount}/108 lá (< 15 lá)`
);

// Tổng kết
console.log('\n======================================================');
console.log(`   KẾT QUẢ: ${passedTests}/${totalTests} KIỂM THỬ ĐẠT (PASS)`);
console.log('======================================================\n');

if (passedTests === totalTests) {
  console.log('\x1b[32m🎉 TẤT CẢ TEST CASES CỦA TASK 1 BACKEND ĐÃ ĐẠT 100% TIÊU CHUẨN!\x1b[0m\n');
} else {
  console.log('\x1b[31m⚠️ CÓ TEST CASE CHƯA ĐẠT. VUI LÒNG KIỂM TRA LẠI!\x1b[0m\n');
}
