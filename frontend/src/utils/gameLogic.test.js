import { initGameState } from './gameLogic.js';

let passed = 0;
let total = 0;

function assert(cond, msg) {
  total++;
  if (cond) {
    passed++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${msg}`);
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${msg}`);
    process.exitCode = 1;
  }
}

console.log('\n======================================================');
console.log('   KIỂM THỬ TASK 2: GAME BOARD & CARD DISTRIBUTION');
console.log('======================================================\n');

const state = initGameState();

console.log('📌 Nhóm 1: Kiểm tra cấu trúc trạng thái bàn đấu khởi tạo');
assert(state && typeof state === 'object', 'initGameState() trả về object');
assert(Array.isArray(state.playerHand), 'playerHand là một mảng');
assert(Array.isArray(state.botHand), 'botHand là một mảng');
assert(Array.isArray(state.discardPile), 'discardPile là một mảng');
assert(Array.isArray(state.drawPile), 'drawPile là một mảng');

console.log('\n📌 Nhóm 2: Kiểm tra số lượng bài chia cho người chơi và Bot');
assert(state.playerHand.length === 7, `playerHand có đúng 7 lá bài (Thực tế: ${state.playerHand.length})`);
assert(state.botHand.length === 7, `botHand có đúng 7 lá bài (Thực tế: ${state.botHand.length})`);

console.log('\n📌 Nhóm 3: Kiểm tra lá bài mở đầu (Discard Pile) và chồng bài rút');
assert(state.discardPile.length === 1, `discardPile có đúng 1 lá mở đầu (Thực tế: ${state.discardPile.length})`);
assert(
  state.discardPile[0].color !== 'wild',
  `Lá mở đầu không được là lá 'wild' theo luật (Thực tế: màu [${state.discardPile[0].color}], giá trị [${state.discardPile[0].value}])`
);
assert(state.drawPile.length === 93, `drawPile còn lại đúng 93 lá (108 - 7 - 7 - 1 = 93) (Thực tế: ${state.drawPile.length})`);

console.log('\n📌 Nhóm 4: Kiểm tra tính toàn vẹn 108 lá và không trùng ID');
const allCards = [
  ...state.playerHand,
  ...state.botHand,
  ...state.discardPile,
  ...state.drawPile,
];
assert(allCards.length === 108, `Tổng số bài qua 4 phân vùng đúng bằng 108 lá (Thực tế: ${allCards.length})`);

const idSet = new Set(allCards.map((c) => c.id));
assert(idSet.size === 108, `Tất cả 108 lá bài trong bàn đấu có ID duy nhất 100% (Không trùng lặp: ${idSet.size === 108})`);

console.log('\n📌 Nhóm 5: Kiểm tra tính ngẫu nhiên sau 10 lần khởi tạo');
let differentStarters = 0;
let lastStartId = state.discardPile[0].id;
for (let i = 0; i < 10; i++) {
  const s = initGameState();
  assert(s.discardPile[0].color !== 'wild', `Lần thử ${i + 1}: Lá mở đầu luôn là non-wild`);
  if (s.discardPile[0].id !== lastStartId) {
    differentStarters++;
  }
}
assert(differentStarters > 3, 'Khởi tạo bàn đấu có xáo trộn ngẫu nhiên');

console.log('\n📌 Nhóm 6: Kiểm tra Tính điểm Thẻ bài & Xử lý Hòa (Tie-Breaker)');
const { calculateCardPoints, calculateHandPoints, getMaxCardPoint } = await import('./gameLogic.js');

// Test điểm từng lá bài
assert(calculateCardPoints({ value: '0' }) === 0, 'Lá 0 tính đúng 0 điểm');
assert(calculateCardPoints({ value: '7' }) === 7, 'Lá 7 tính đúng 7 điểm');
assert(calculateCardPoints({ value: 'skip' }) === 20, 'Lá Skip tính đúng 20 điểm phạt');
assert(calculateCardPoints({ value: 'draw_two' }) === 20, 'Lá +2 tính đúng 20 điểm phạt');
assert(calculateCardPoints({ value: 'wild' }) === 50, 'Lá Wild tính đúng 50 điểm phạt');
assert(calculateCardPoints({ value: 'wild_draw_four' }) === 50, 'Lá Wild +4 tính đúng 50 điểm phạt');

// Test tình huống hòa số lượng lá bài (Ví dụ cùng 3 lá bài)
const handA = [{ value: '1' }, { value: '2' }, { value: '3' }]; // 3 lá: 6 điểm
const handB = [{ value: '5' }, { value: 'skip' }, { value: 'wild_draw_four' }]; // 3 lá: 75 điểm
assert(calculateHandPoints(handA) === 6, 'Hand A có 3 lá với tổng điểm = 6');
assert(calculateHandPoints(handB) === 75, 'Hand B có 3 lá với tổng điểm = 75');
assert(calculateHandPoints(handA) < calculateHandPoints(handB), 'HÒA SỐ LÁ: Người giữ Hand A (6đ) thắng người giữ Hand B (75đ)');

console.log('\n======================================================');
console.log(`   KẾT QUẢ: ${passed}/${total} KIỂM THỬ ĐẠT (PASS)`);
console.log('======================================================\n');
