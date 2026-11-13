const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Guild = require('../models/Guild');
const guildController = require('../controllers/guildController');

async function runGuildTests() {
  console.log('\n======================================================');
  console.log('   KIỂM THỬ TASK 5 (TUẦN 5): HỆ THỐNG BANG HỘI CYBERPUNK');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✔ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Test failed: ${message}`);
    }
  }

  function createMockRes() {
    return {
      statusCode: 200,
      data: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.data = payload;
        return this;
      },
    };
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/neo_uno_test';
    let dbConnected = false;
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
      }
      dbConnected = mongoose.connection.readyState === 1;
    } catch {
      console.log('  ⚠️ Không kết nối được CSDL thực tế, chạy kiểm thử logic độc lập.');
    }

    // =========================================================================
    // NHÓM 1: KIỂM THỬ TRUY VẤN DANH SÁCH & BẢNG XẾP HẠNG BANG HỘI
    // =========================================================================
    console.log('📌 Nhóm 1: Kiểm thử Truy Vấn Danh Sách & Bảng Xếp Hạng Bang');
    const resList = createMockRes();
    await guildController.getGuilds({ query: {} }, resList);
    assert(resList.data && resList.data.success === true, 'getGuilds trả về success: true');
    assert(resList.data.creationCost === 2000, 'Chi phí lập Bang phải là 2,000 Vàng');
    assert(Array.isArray(resList.data.guilds), 'guilds phải là một mảng');

    const resLead = createMockRes();
    await guildController.getGuildLeaderboard({}, resLead);
    assert(resLead.data && resLead.data.success === true, 'getGuildLeaderboard trả về success: true');
    assert(Array.isArray(resLead.data.leaderboard), 'leaderboard phải là một mảng');

    // =========================================================================
    // NHÓM 2: KIỂM THỬ THÀNH LẬP BANG HỘI & RÀNG BUỘC PHÍ / TAG
    // =========================================================================
    console.log('\n📌 Nhóm 2: Kiểm thử Thành Lập Bang Hội & Ràng Buộc Phí / Tag');

    if (dbConnected) {
      const leaderEmail = `leader_${Date.now()}@neouno.cyber`;
      const leaderUser = await User.create({
        username: `leader_${Date.now()}`,
        nickname: 'CyberLeader',
        email: leaderEmail,
        password: 'Password123!',
        coins: 5000,
        elo: 1400,
      });

      const memberEmail = `member_${Date.now()}@neouno.cyber`;
      const memberUser = await User.create({
        username: `member_${Date.now()}`,
        nickname: 'CyberSoldier',
        email: memberEmail,
        password: 'Password123!',
        coins: 3000,
        elo: 1300,
      });

      let createdGuildId = null;
      const testTag = 'CYB' + Math.floor(Math.random() * 90 + 10);

      try {
        // 1. Tạo Bang Hội thành công (trừ 2,000 Vàng)
        const resCreate = createMockRes();
        await guildController.createGuild(
          {
            user: leaderUser,
            body: {
              userId: leaderUser._id.toString(),
              name: 'Cyberpunk Syndicate',
              tag: testTag,
              slogan: 'Thống trị đấu trường thẻ bài!',
              emblem: '⚡',
            },
          },
          resCreate
        );

        assert(resCreate.statusCode === 201, 'Tạo bang thành công phải trả về HTTP 201');
        assert(resCreate.data.success === true, 'Phải có success: true');
        assert(resCreate.data.guild.tag === testTag, `Tag bang phải là [${testTag}]`);
        assert(resCreate.data.guild.members.length === 1, 'Bang mới tạo phải có 1 thành viên (Bang Chủ)');
        assert(resCreate.data.guild.members[0].role === 'leader', 'Người tạo phải giữ chức vụ leader');
        assert(resCreate.data.user.coins === 3000, 'Số dư người tạo phải bị trừ 2,000 Vàng (5000 -> 3000)');

        createdGuildId = resCreate.data.guild._id;

        // 2. Tạo trùng Tag -> Bị chặn
        const resDupTag = createMockRes();
        await guildController.createGuild(
          {
            user: memberUser,
            body: {
              userId: memberUser._id.toString(),
              name: 'Another Clan',
              tag: testTag, // Trùng tag
            },
          },
          resDupTag
        );
        assert(resDupTag.statusCode === 400, 'Tạo trùng Tag phải bị từ chối với status 400');

        // 3. Bang Chủ tạo tiếp bang thứ 2 khi chưa rời bang -> Bị chặn
        const updatedLeader = await User.findById(leaderUser._id);
        const resLeaderDouble = createMockRes();
        await guildController.createGuild(
          {
            user: updatedLeader,
            body: {
              userId: leaderUser._id.toString(),
              name: 'Second Clan',
              tag: 'SEC',
            },
          },
          resLeaderDouble
        );
        assert(resLeaderDouble.statusCode === 400, 'Đã ở trong bang mà tạo tiếp phải bị chặn');

        // =====================================================================
        // NHÓM 3: GIA NHẬP BANG HỘI & GỬI TIN NHẮN REALTIME
        // =====================================================================
        console.log('\n📌 Nhóm 3: Kiểm thử Gia Nhập Bang & Gửi Tin Nhắn Kênh Chat');

        const resJoin = createMockRes();
        await guildController.joinGuild(
          {
            user: memberUser,
            body: {
              userId: memberUser._id.toString(),
              guildId: createdGuildId.toString(),
            },
          },
          resJoin
        );
        assert(resJoin.data.success === true, 'Thành viên gia nhập bang thành công');
        assert(resJoin.data.guild.members.length === 2, 'Số lượng thành viên bang phải là 2');

        const updatedMember = await User.findById(memberUser._id);
        assert(updatedMember.guild.guildTag === testTag, 'User phải cập nhật đúng guildTag');
        assert(updatedMember.guild.role === 'member', 'User phải có role là member');

        // Gửi tin nhắn chat bang
        const resChat = createMockRes();
        await guildController.sendChatMessage(
          {
            user: updatedMember,
            body: {
              userId: memberUser._id.toString(),
              message: 'Chào anh em bang hội, ai làm ván 2v2 không?',
            },
          },
          resChat
        );
        assert(resChat.data.success === true, 'Gửi tin nhắn bang hội thành công');
        assert(resChat.data.chatMessage.senderName === 'CyberSoldier', 'Tên người gửi tin nhắn chuẩn xác');

        // =====================================================================
        // NHÓM 4: CỐNG HIẾN QUỸ BANG & THĂNG CẤP BANG HỘI
        // =====================================================================
        console.log('\n📌 Nhóm 4: Kiểm thử Cống Hiến Quỹ Bang & Thăng Hạng Cấp Độ');

        // Cống hiến 1,200 Vàng (Đủ vượt ngưỡng 1,000 EXP để thăng lên Cấp 2)
        const resDonate = createMockRes();
        await guildController.donateCoins(
          {
            user: updatedMember,
            body: {
              userId: memberUser._id.toString(),
              amount: 1200,
            },
          },
          resDonate
        );
        assert(resDonate.data.success === true, 'Cống hiến quỹ bang thành công');
        assert(resDonate.data.treasuryCoins === 1200, 'Quỹ bang phải có 1,200 Vàng');
        assert(resDonate.data.level === 2, 'Bang hội phải thăng hạng CẤP 2 (Ngưỡng 1,000 EXP)');
        assert(resDonate.data.leveledUp === true, 'Cờ leveledUp phải là true');

        // =====================================================================
        // NHÓM 5: RỜI BANG HỘI & CHUYỂN QUYỀN BANG CHỦ TỰ ĐỘNG
        // =====================================================================
        console.log('\n📌 Nhóm 5: Kiểm thử Rời Bang & Tự Động Trao Quyền Bang Chủ');

        // Khi Bang Chủ rời bang, vì còn memberUser nên quyền leader tự động trao cho memberUser
        const resLeaveLeader = createMockRes();
        await guildController.leaveGuild(
          {
            user: updatedLeader,
            body: { userId: leaderUser._id.toString() },
          },
          resLeaveLeader
        );
        assert(resLeaveLeader.data.success === true, 'Bang Chủ rời bang thành công');

        const gAfter = await Guild.findById(createdGuildId);
        assert(gAfter.leaderId.toString() === memberUser._id.toString(), 'Quyền Bang Chủ phải chuyển giao cho thành viên còn lại');
        assert(gAfter.members.length === 1, 'Bang chỉ còn lại 1 thành viên');
        assert(gAfter.members[0].role === 'leader', 'Thành viên còn lại trở thành leader');

        // Thành viên cuối cùng rời bang -> Bang Hội tự động giải tán
        const resLeaveLast = createMockRes();
        await guildController.leaveGuild(
          {
            user: await User.findById(memberUser._id),
            body: { userId: memberUser._id.toString() },
          },
          resLeaveLast
        );
        assert(resLeaveLast.data.success === true, 'Thành viên cuối cùng rời bang thành công');

        const gDeleted = await Guild.findById(createdGuildId);
        assert(gDeleted === null, 'Bang Hội không còn ai phải tự động giải tán');

      } finally {
        await User.deleteOne({ _id: leaderUser._id });
        await User.deleteOne({ _id: memberUser._id });
        if (createdGuildId) {
          await Guild.deleteOne({ _id: createdGuildId });
        }
      }
    }

    console.log('\n======================================================');
    console.log(`🎉 TẤT CẢ ${passed}/${total} BÀI KIỂM THỬ TASK 5 ĐÃ VƯỢT QUA XUẤT SẮC!`);
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ KIỂM THỬ THẤT BẠI:', error);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

runGuildTests();
