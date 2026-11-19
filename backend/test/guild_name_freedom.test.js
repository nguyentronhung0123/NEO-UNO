const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const guildController = require('../controllers/guildController');
const Guild = require('../models/Guild');
const User = require('../models/User');

function createMockRes() {
  return {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.data = obj;
      return this;
    },
  };
}

async function runTest() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/neo_uno_test';
  await mongoose.connect(mongoUri);
  console.log(' Connected to MongoDB for Guild Name Freedom Test');

  try {
    const randomSuffix = Math.floor(Math.random() * 100000);
    const testUser = await User.create({
      username: `test_freedom_${randomSuffix}`,
      nickname: `Player_${randomSuffix}`,
      email: `freedom_${randomSuffix}@test.com`,
      password: 'Password123!',
      coins: 50000,
    });

    // Test 1: Tạo bang "one piece" với tag "VICECITY" (8 ký tự - đúng như ảnh lỗi của người dùng)
    const res1 = createMockRes();
    await guildController.createGuild(
      {
        user: testUser,
        body: {
          userId: testUser._id.toString(),
          name: 'one piece',
          tag: 'VICECITY',
          slogan: 'AE mình thế thôi',
          emblem: '🛡️',
        },
      },
      res1
    );

    assert.strictEqual(res1.statusCode, 201, 'Tạo bang "one piece" với tag "VICECITY" phải thành công (HTTP 201)');
    assert.strictEqual(res1.data.guild.name, 'one piece');
    assert.strictEqual(res1.data.guild.tag, 'VICECITY');
    console.log(' PASS Test 1: Bang "one piece" với tag "VICECITY" tạo thành công 100%!');

    // Dọn dẹp
    await Guild.findByIdAndDelete(res1.data.guild._id);
    await User.findByIdAndUpdate(testUser._id, { $unset: { guild: 1 }, $inc: { coins: 2000 } });

    // Test 2: Tạo bang để trống Tag -> Tự động sinh Tag từ tên
    const res2 = createMockRes();
    await guildController.createGuild(
      {
        user: testUser,
        body: {
          userId: testUser._id.toString(),
          name: 'Cyber Strike Legends',
          tag: '',
        },
      },
      res2
    );

    assert.strictEqual(res2.statusCode, 201, 'Tạo bang để trống Tag phải thành công');
    assert.strictEqual(res2.data.guild.tag, 'CSL', 'Tag tự động sinh từ chữ cái đầu phải là CSL');
    console.log(' PASS Test 2: Để trống Tag tự động sinh [CSL] thành công!');

    // Dọn dẹp
    await Guild.findByIdAndDelete(res2.data.guild._id);
    await User.findByIdAndUpdate(testUser._id, { $unset: { guild: 1 }, $inc: { coins: 2000 } });

    // Test 3: Tên bang ngắn 1-2 ký tự (VD: "VN", "A")
    const res3 = createMockRes();
    await guildController.createGuild(
      {
        user: testUser,
        body: {
          userId: testUser._id.toString(),
          name: 'VN',
          tag: 'VN',
        },
      },
      res3
    );

    assert.strictEqual(res3.statusCode, 201, 'Tạo bang ngắn 1-2 ký tự phải thành công');
    console.log(' PASS Test 3: Bang ngắn "VN" tạo thành công!');

    // Dọn dẹp cuối
    await Guild.findByIdAndDelete(res3.data.guild._id);
    await User.findByIdAndDelete(testUser._id);

    console.log('\n TẤT CẢ CÁC BÀI TEST TỰ DO ĐẶT TÊN BANG ĐÃ PASS HOÀN TOÀN!');
  } finally {
    await mongoose.disconnect();
  }
}

runTest().catch((err) => {
  console.error(' Test failed:', err);
  process.exit(1);
});
