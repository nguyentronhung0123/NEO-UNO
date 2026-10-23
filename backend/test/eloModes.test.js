let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${message}`);
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${message}`);
    process.exitCode = 1;
  }
}

function calculateEloDelta(totalPlayers, humanRank) {
  if (totalPlayers === 2) {
    return humanRank === 1 ? +15 : -15;
  } else if (totalPlayers === 3) {
    if (humanRank === 1) return +20;
    if (humanRank === 2) return +5;
    return -15;
  } else {
    if (humanRank === 1) return +30;
    if (humanRank === 2) return +10;
    if (humanRank === 3) return -5;
    return -20;
  }
}

console.log('\n======================================================');
console.log('   KIỂM THỬ TỰ ĐỘNG: CƠ CHẾ ELO ĐA CHẾ ĐỘ (4P, 3P, SOLO)');
console.log('======================================================\n');

console.log('📌 Nhóm 1: Chế độ 4 Người (Chuẩn Quốc Tế)');
assert(calculateEloDelta(4, 1) === +30, '4 Người - Hạng 1 (Nhất 🥇): +30 ELO');
assert(calculateEloDelta(4, 2) === +10, '4 Người - Hạng 2 (Nhì 🥈):  +10 ELO');
assert(calculateEloDelta(4, 3) === -5,  '4 Người - Hạng 3 (Ba 🥉):   -5 ELO');
assert(calculateEloDelta(4, 4) === -20, '4 Người - Hạng 4 (Bét 4th): -20 ELO');

console.log('\n📌 Nhóm 2: Chế độ 3 Người (Đấu Tay Ba)');
assert(calculateEloDelta(3, 1) === +20, '3 Người - Hạng 1 (Nhất 🥇): +20 ELO');
assert(calculateEloDelta(3, 2) === +5,  '3 Người - Hạng 2 (Nhì 🥈):  +5 ELO');
assert(calculateEloDelta(3, 3) === -15, '3 Người - Hạng 3 (Bét 🥉):  -15 ELO');

console.log('\n📌 Nhóm 3: Chế độ Solo 1v1 (Đấu Tay Đôi)');
assert(calculateEloDelta(2, 1) === +15, 'Solo 1v1 - Thắng 🏆: +15 ELO');
assert(calculateEloDelta(2, 2) === -15, 'Solo 1v1 - Thua 💀:  -15 ELO');

console.log('\n======================================================');
console.log(`   KẾT QUẢ: ${passed}/${total} KIỂM THỬ ĐẠT (PASS)`);
console.log('======================================================\n');
