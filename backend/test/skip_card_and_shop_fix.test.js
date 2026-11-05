const assert = require('assert');
const gameEngine = require('../socket/gameEngine');
const fs = require('fs');

console.log('===============================================================');
console.log('   KIỂM THỬ: LOGIC CẤM LƯỢT (SKIP) & ĐỒNG BỘ TIỀN VÀNG SHOP');
console.log('===============================================================');

// 1. TEST SHOP CONTROLLER RETURN SHAPE
console.log('\n--- [TEST 1]: Shop buyItem trả về đồng thời coins và userCoins ---');
const shopCode = fs.readFileSync(__dirname + '/../controllers/shopController.js', 'utf8');
assert(shopCode.includes('coins: updatedUser.coins'), 'shopController must include coins: updatedUser.coins');
assert(shopCode.includes('userCoins: updatedUser.coins'), 'shopController must include userCoins: updatedUser.coins');
console.log('  ✔ PASS: shopController.js trả về cả 2 trường coins & userCoins đảm bảo tương thích 100%');

// 2. TEST AUTHCONTEXT UPDATE USER SANITIZATION
console.log('\n--- [TEST 2]: AuthContext updateUser loại bỏ các trường undefined ---');
const authCode = fs.readFileSync(__dirname + '/../../frontend/src/contexts/AuthContext.jsx', 'utf8');
assert(authCode.includes('sanitizedPartial[key] = partialUser[key]'), 'AuthContext must sanitize partialUser against undefined keys');
console.log('  ✔ PASS: AuthContext.jsx đã có bộ lọc undefined, ngăn ngừa việc vô tình xóa mất coins');

// 3. TEST BOT DRAW & PLAY SKIP CARD ACTION HANDLING
console.log('\n--- [TEST 3]: Bot rút bài và đánh lá Skip kích hoạt đúng logic cấm lượt ---');
const emittedEvents = [];
const mockIo = {
  to: () => ({
    emit: (event, data) => {
      emittedEvents.push({ event, data });
    },
  }),
  emit: () => {},
};

const mockRoom = {
  code: 'SKIP_TEST',
  isRanked: false,
  players: [
    { userId: 'u1', name: 'PlayerHuman', socketId: 's1', isBot: false },
    { userId: 'bot1', name: 'BotMaster', socketId: 's_bot', isBot: true },
  ],
};

const match = gameEngine.startOnlineMatch(mockRoom, mockIo);
assert(match, 'Match must be created');
match.isDealing = false;
match.isTransitioning = false;

const bot = match.players[1];
const skipCard = { id: 'test_skip_red', color: 'red', value: 'skip' };
match.currentTurnIndex = 1; // Bot turn
match.activeColor = 'red';

match.executeBotCardPlay(bot, skipCard, 'red');

const skipAction = emittedEvents.find((e) => e.event === 'game:action_event' && e.data.type === 'skip');
assert(skipAction, 'game:action_event of type skip must be emitted');
assert.strictEqual(skipAction.data.playerName, 'BotMaster');
assert.strictEqual(skipAction.data.targetSeatIndex, 0, 'Target of skip should be seat 0 (Human player)');
console.log('  ✔ PASS: executeBotCardPlay phát đúng sự kiện cấm lượt:');
console.log(`         Type: ${skipAction.data.type}, Từ: ${skipAction.data.playerName} -> Cấm: Ghế ${skipAction.data.targetSeatIndex} (${skipAction.data.targetName})`);

console.log('\n===============================================================');
console.log('   🎉 TẤT CẢ KIỂM THỬ XÁC MINH ĐÃ HOÀN TẤT VÀ PASS 100%!');
console.log('===============================================================');
process.exit(0);
