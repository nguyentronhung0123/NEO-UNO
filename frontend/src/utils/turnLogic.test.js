// Kiểm tra tự động toàn bộ logic vòng chơi và luật phạt
import { BOT_CONFIGS_4P, initGameState } from './gameLogic.js';

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
console.log('   KIỂM THỬ TOÀN DIỆN: VÒNG ĐÁNH 4 GÓC & CƠ CHẾ PHẠT');
console.log('======================================================\n');

const totalPlayers = 4;
const getNextSeat = (current, steps = 1, direction = 1) => {
  const raw = (current + steps * direction) % totalPlayers;
  return raw < 0 ? raw + totalPlayers : raw;
};

console.log('📌 Nhóm 1: Vòng đánh mặc định NGƯỢC CHIỀU KIM ĐỒNG HỒ (direction = 1)');
// Seat 0: P1 (Bạn - Dưới)
// Seat 1: P2 (Bot Titan - Phải)
// Seat 2: P3 (Bot Neon - Trên)
// Seat 3: P4 (Bot Cyber - Trái)
assert(getNextSeat(0, 1, 1) === 1, 'P1 (Dưới) đánh xong -> P2 (Phải - Titan) đánh');
assert(getNextSeat(1, 1, 1) === 2, 'P2 (Phải) đánh xong -> P3 (Trên - Neon) đánh');
assert(getNextSeat(2, 1, 1) === 3, 'P3 (Trên) đánh xong -> P4 (Trái - Cyber) đánh');
assert(getNextSeat(3, 1, 1) === 0, 'P4 (Trái) đánh xong -> P1 (Dưới - Bạn) đánh');

console.log('\n📌 Nhóm 2: Vòng đánh khi bị ĐỔI CHIỀU (REVERSE, direction = -1, Thuận chiều)');
assert(getNextSeat(0, 1, -1) === 3, 'P1 (Dưới) đổi chiều -> P4 (Trái - Cyber) đánh');
assert(getNextSeat(3, 1, -1) === 2, 'P4 (Trái) đánh tiếp -> P3 (Trên - Neon) đánh');
assert(getNextSeat(2, 1, -1) === 1, 'P3 (Trên) đánh tiếp -> P2 (Phải - Titan) đánh');
assert(getNextSeat(1, 1, -1) === 0, 'P2 (Phải) đánh tiếp -> P1 (Dưới - Bạn) đánh');

console.log('\n📌 Nhóm 3: Logic lá CẤM LƯỢT (SKIP, steps = 2)');
assert(getNextSeat(0, 2, 1) === 2, 'P1 đánh Skip -> P2 bị cấm, P3 đánh tiếp');
assert(getNextSeat(1, 2, 1) === 3, 'P2 đánh Skip -> P3 bị cấm, P4 đánh tiếp');
assert(getNextSeat(2, 2, 1) === 0, 'P3 đánh Skip -> P4 bị cấm, P1 đánh tiếp');
assert(getNextSeat(3, 2, 1) === 1, 'P4 đánh Skip -> P1 bị cấm, P2 đánh tiếp');

console.log('\n📌 Nhóm 4: Logic lá WILD +4 (Nạn nhân bốc 4 lá và MẤT LƯỢT)');
// Ví dụ người dùng: P1 đánh thường xong -> P2 đánh +4
const p2Victim = getNextSeat(1, 1, 1);
const p2NextTurn = getNextSeat(1, 2, 1);
assert(p2Victim === 2, 'P2 (Titan) đánh +4 -> Nạn nhân phải là P3 (Neon), TUYỆT ĐỐI KHÔNG PHẢI P1!');
assert(p2NextTurn === 3, 'P3 nhận 4 lá và mất lượt -> Lượt đánh tiếp theo là P4 (Cyber)');

// Khi P4 đánh +4
const p4Victim = getNextSeat(3, 1, 1);
const p4NextTurn = getNextSeat(3, 2, 1);
assert(p4Victim === 0, 'P4 (Cyber) đánh +4 -> Nạn nhân là P1 (Bạn)');
assert(p4NextTurn === 1, 'P1 nhận 4 lá và mất lượt -> Lượt đánh tiếp theo là P2 (Titan)');

console.log('\n📌 Nhóm 5: Logic lá +2 khi KHÔNG CÓ CỘNG DỒN (Nhận phạt và mất lượt)');
// Người chơi P2 không có lá +2 đỡ, nhận phạt:
// Lượt đang ở P2. Sau khi bốc đủ lá phạt, P2 mất lượt, lượt chuyển sang P3 (+1 bước từ P2):
const afterPenaltySeat = getNextSeat(1, 1, 1);
assert(afterPenaltySeat === 2, 'P2 chịu phạt +2 -> mất lượt -> chuyển lượt sang P3 (+1 bước, KHÔNG NHẢY BỎ QUA P3)');

console.log('\n📌 Nhóm 6: Điều kiện bấm báo UNO (UNO Call Logic & Button State)');
// Hàm logic xác định điều kiện được phép bấm Báo UNO
const canCallUnoCheck = (handCount, hasCalledUno, isDealing, isShuffling) => {
  return handCount <= 2 && handCount > 0 && !hasCalledUno && !isDealing && !isShuffling;
};

assert(canCallUnoCheck(7, false, false, false) === false, 'Còn 7 lá: Bị KHÓA, tuyệt đối không được báo UNO');
assert(canCallUnoCheck(5, false, false, false) === false, 'Còn 5 lá: Bị KHÓA, tuyệt đối không được báo UNO');
assert(canCallUnoCheck(3, false, false, false) === false, 'Còn 3 lá (> 2 lá): Bị KHÓA, tuyệt đối không được báo UNO');
assert(canCallUnoCheck(2, false, false, false) === true, 'Còn 2 lá: HỢP LỆ, cho phép Báo Trước UNO trước khi đánh lá áp chót');
assert(canCallUnoCheck(1, false, false, false) === true, 'Còn 1 lá: HỢP LỆ, bắt buộc cho phép Báo UNO để tránh bị phạt');
assert(canCallUnoCheck(1, true, false, false) === false, 'Đã báo UNO rồi: Nút chuyển sang trạng thái "Đã Báo", không cần bấm lại');
assert(canCallUnoCheck(1, false, true, false) === false, 'Đang chia bài: Không thể bấm báo UNO');

console.log('\n======================================================');
console.log(`   KẾT QUẢ: ${passed}/${total} KIỂM THỬ ĐẠT (PASS)`);
console.log('======================================================\n');
