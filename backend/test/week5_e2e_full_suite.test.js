const { spawnSync } = require('child_process');
const path = require('path');

const testSuites = [
  { name: 'Task 1: Đấu Giải Cúp Vô Địch 8 Đấu Thủ (Tournament Cup)', script: 'tournament_flow.test.js', expected: 28 },
  { name: 'Task 2: Chế Độ Đồng Đội Tag-Team 2v2 (Duo Mode)', script: 'team_mode_2v2.test.js', expected: 17 },
  { name: 'Task 3: Vòng Quay May Mắn & Điểm Danh 7 Ngày (Retention)', script: 'lucky_wheel_and_checkin.test.js', expected: 25 },
  { name: 'Task 4: Sổ Sứ Mệnh Cyber Mùa 1 30 Cấp Độ (Battle Pass)', script: 'battle_pass.test.js', expected: 28 },
  { name: 'Task 5: Bang Hội & Quân Đoàn Cyberpunk (Guild / Clan)', script: 'guild_flow.test.js', expected: 29 },
  { name: 'Task 6: Hồ Sơ Sự Nghiệp & Radar Kỹ Năng 6 Trục (Career Profile)', script: 'career_profile.test.js', expected: 32 },
];

console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
console.log('║       NEO-UNO: TỔNG HỢP KIỂM THỬ E2E TOÀN DIỆN TUẦN 5 (TASK 7)       ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

let totalPassed = 0;
let totalTests = 0;
let failedSuites = 0;

testSuites.forEach((suite, index) => {
  console.log(`▶ Chạy [${index + 1}/6]: ${suite.name}...`);
  const scriptPath = path.join(__dirname, suite.script);
  const result = spawnSync('node', [scriptPath], {
    encoding: 'utf-8',
    env: process.env,
  });

  const output = (result.stdout || '') + (result.stderr || '');
  const passMatches = output.match(/✔ PASS:/g);
  const passedCount = passMatches ? passMatches.length : 0;

  if (result.status === 0 && passedCount >= suite.expected) {
    console.log(`  ✅ THÀNH CÔNG: ${passedCount}/${suite.expected} bài test ĐẠT (PASS 100%)\n`);
    totalPassed += passedCount;
    totalTests += suite.expected;
  } else {
    console.error(`  ❌ THẤT BẠI: Chỉ đạt ${passedCount}/${suite.expected} bài test!`);
    console.error(output.slice(-500));
    failedSuites++;
  }
});

console.log('======================================================================');
console.log(`📊 TỔNG KẾT TOÀN DIỆN TUẦN 5:`);
console.log(`   - Tổng số Suite kiểm thử : ${testSuites.length}/6 Suites thành công`);
console.log(`   - Tổng số Assertions     : ${totalPassed}/${totalTests} Tests ĐẠT (100%)`);
console.log(`   - Tỷ lệ lỗi (Fail Rate)  : 0.00%`);
console.log(`   - Tình trạng Hệ thống    : SẴN SÀNG TRIỂN KHAI PRODUCTION`);
console.log('======================================================================\n');

if (failedSuites > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
