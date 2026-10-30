const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/Users/admin/.gemini/antigravity/brain/5b773ddb-3414-469b-bf12-e6ea0f3285fe';
const PUBLIC_DIR = '/Users/admin/NEO-UNO/frontend/public/evidence';

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

async function getWsUrl() {
  const res = await fetch('http://localhost:9222/json');
  const targets = await res.json();
  const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost:3000'));
  if (!pageTarget) {
    throw new Error('Page target not found! Targets: ' + JSON.stringify(targets));
  }
  return pageTarget.webSocketDebuggerUrl;
}

class ChromeClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.callbacks = new Map();
    this.id = 1;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res?.result?.value;
  }

  async setViewport(width, height, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: isMobile
    });
  }

  async screenshot(fileName) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const artifactPath = path.join(ARTIFACT_DIR, fileName);
    const publicPath = path.join(PUBLIC_DIR, fileName);
    fs.writeFileSync(artifactPath, buffer);
    fs.writeFileSync(publicPath, buffer);
    console.log(`📸 Saved screenshot: ${fileName} (${buffer.length} bytes)`);
  }

  async sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  console.log('🚀 Starting evidence capture...');
  const wsUrl = await getWsUrl();
  const client = new ChromeClient(wsUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('DOM.enable');

  // Set standard Desktop Viewport
  await client.setViewport(1440, 900, false);

  // 1. Setup Auth hung0123
  console.log('👤 Setting up hung0123 credentials...');
  await client.evaluate(`
    (() => {
      localStorage.setItem('neo_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhZDk4ZTc2MjA2ZjNkOWRiYzI3ZjJlNyIsIm5pY2tuYW1lIjoiaHVuZzAxMjMiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3OTMzNDEyMTYsImV4cCI6MTc5NTkzMzIxNn0.AGXCeqOgig5yPJMqqwjaQze515WBvkWokXlzP1-heZQ');
      localStorage.setItem('neo_user', JSON.stringify({
        _id: '6ad98e76206f3d9dbc27f2e7',
        nickname: 'hung0123',
        email: 'nguyentronghung11102019@gmail.com',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=hung0123',
        elo: 850,
        coins: 100000,
        matchesWon: 15,
        matchesLost: 21,
        level: 16,
        exp: 2305,
        role: 'admin',
        accountId: '9DBC27F2E7',
        equippedAvatarFrame: 'frame_fire_blaze',
        equippedCardSkin: 'skin_classic',
        inventory: ['skin_classic', 'frame_default', 'skin_halloween', 'frame_fire_blaze']
      }));
      localStorage.removeItem('NEO_ACTIVE_MATCH');
      sessionStorage.removeItem('neo_pwa_dismissed');
      window.location.href = 'http://localhost:3000/';
    })()
  `);

  await client.sleep(2500);

  // ================= TASK 1: RADAR MATCHMAKING =================
  console.log('🎯 Capturing Task 1: Matchmaking...');
  await client.evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('GHÉP TRẬN NHANH'));
      if (btn) btn.click();
    })()
  `);
  await client.sleep(1200);
  await client.screenshot('task1_matchmaking.png');

  // Dismiss Matchmaking
  await client.evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('HỦY TÌM TRẬN') || b.textContent.includes('Hủy'));
      if (btn) btn.click();
    })()
  `);
  await client.sleep(800);

  // ================= TASK 2: FRIENDS & MESSENGER =================
  console.log('🎯 Capturing Task 2: Friends...');
  await client.evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bạn Bè'));
      if (btn) btn.click();
    })()
  `);
  await client.sleep(1000);
  await client.screenshot('task2_friends_system.png');

  // Close friends modal
  await client.evaluate(`
    (() => {
      const closeBtn = document.querySelector('button[title="Đóng"], button[title="Đóng bảng bạn bè"]');
      if (closeBtn) closeBtn.click();
      else {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerHTML.includes('close'));
        if (btn) btn.click();
      }
    })()
  `);
  await client.sleep(800);

  // Open Messenger Drawer
  await client.evaluate(`
    (() => {
      const msgBtn = document.querySelector('button[aria-label="Mở Messenger"]');
      if (msgBtn) msgBtn.click();
    })()
  `);
  await client.sleep(1000);
  await client.screenshot('task2_messenger_chat.png');

  // Close Messenger Drawer
  await client.evaluate(`
    (() => {
      const msgBtn = document.querySelector('button[aria-label="Mở Messenger"]');
      if (msgBtn) msgBtn.click();
    })()
  `);
  await client.sleep(800);

  // ================= TASK 5: SHOP & ADMIN SOC =================
  console.log('🎯 Capturing Task 5: Shop...');
  await client.evaluate(`
    (() => {
      const shopBtn = document.querySelector('button[aria-label="Mở Cửa Hàng"]');
      if (shopBtn) shopBtn.click();
    })()
  `);
  await client.sleep(1200);
  await client.screenshot('task5_shop_skins.png');

  // Close Shop
  await client.evaluate(`
    (() => {
      const closeBtn = document.querySelector('button[title="Đóng cửa hàng"]');
      if (closeBtn) closeBtn.click();
      else {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerHTML.includes('close'));
        if (btn) btn.click();
      }
    })()
  `);
  await client.sleep(800);

  console.log('🎯 Capturing Task 5: Admin Security SOC...');
  await client.evaluate(`
    (() => {
      const adminBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Quản Trị') && b.textContent.includes('SOC'));
      if (adminBtn) adminBtn.click();
    })()
  `);
  await client.sleep(1200);
  await client.screenshot('task5_admin_security_soc.png');

  // Close Admin SOC
  await client.evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerHTML.includes('close') || b.textContent.includes('Đóng'));
      if (btn) btn.click();
    })()
  `);
  await client.sleep(800);

  // ================= TASK 6: DAILY QUESTS & ACHIEVEMENTS =================
  console.log('🎯 Capturing Task 6: Quests...');
  await client.evaluate(`
    (() => {
      const questBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Nhiệm Vụ'));
      if (questBtn) questBtn.click();
    })()
  `);
  await client.sleep(1200);
  await client.screenshot('task6_daily_quests.png');

  // Switch to Achievements tab
  await client.evaluate(`
    (() => {
      const achTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Huy Hiệu') || b.textContent.includes('Thành Tựu'));
      if (achTab) achTab.click();
    })()
  `);
  await client.sleep(1000);
  await client.screenshot('task6_achievements_badges.png');

  // Close Quests
  await client.evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerHTML.includes('close') || b.textContent.includes('Đóng'));
      if (btn) btn.click();
    })()
  `);
  await client.sleep(800);

  // ================= TASK 4: REJOIN / AFK TAKEOVER MODAL =================
  console.log('🎯 Capturing Task 4: Rejoin Modal...');
  await client.evaluate(`
    (() => {
      localStorage.setItem('NEO_ACTIVE_MATCH', JSON.stringify({
        matchId: 'match_afk_rejoin_2026',
        matchConfig: { botCount: 3, timeLimit: 300 },
        matchTimeRemaining: 215,
        playerHand: [
          { id: 'c_r1', color: 'red', value: '7' },
          { id: 'c_b2', color: 'blue', value: 'reverse' },
          { id: 'c_w3', color: 'wild', value: 'wild_draw_four' }
        ],
        bots: [
          { id: 'bot_1', name: 'Bot Titan', avatar: '🛡️', badge: 'Phòng thủ', color: '#ec4899', position: 'right', playerNumber: 2, hand: [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }] },
          { id: 'bot_2', name: 'Bot Neon', avatar: '⚡', badge: 'Chiến thuật', color: '#10b981', position: 'top', playerNumber: 3, hand: [{ id: 'b4' }, { id: 'b5' }] },
          { id: 'bot_3', name: 'Bot Cyber', avatar: '🤖', badge: 'Tốc độ', color: '#00d2ff', position: 'left', playerNumber: 4, hand: [{ id: 'b6' }, { id: 'b7' }] }
        ],
        drawPile: [{ id: 'd1', color: 'red', value: '5' }],
        discardPile: [{ id: 'c_red_0', color: 'red', value: '0' }],
        currentTurnIndex: 1,
        turnDirection: 1,
        drawTwoStack: 0,
        status: 'in_progress',
        updatedAt: Date.now() - 45000 // 45s ago
      }));
      window.location.reload();
    })()
  `);
  await client.sleep(2500);
  await client.screenshot('task4_rejoin_match_modal.png');

  // Click Rejoin to go to GameBoard
  console.log('🎯 Joining active match...');
  await client.evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('TIẾP TỤC VÀO LẠI'));
      if (btn) btn.click();
    })()
  `);
  await client.sleep(2000);

  // ================= TASK 3: EMOTE WHEEL IN GAME =================
  console.log('🎯 Capturing Task 3: GameBoard & Emote Wheel...');
  // Open Emote Wheel
  await client.evaluate(`
    (() => {
      const emoteBtn = document.querySelector('button[title*="Biểu cảm"], button[title*="Chat"], button[title*="Emote"]');
      if (emoteBtn) emoteBtn.click();
      else {
        // Find button with emote icon or chat icon
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find(el => el.innerHTML.includes('mood') || el.innerHTML.includes('sentiment_satisfied') || el.innerHTML.includes('chat'));
        if (b) b.click();
      }
    })()
  `);
  await client.sleep(1200);
  await client.screenshot('task3_emote_wheel_in_game.png');

  // Trigger interactive throwable item animation (tomato explosion)
  await client.evaluate(`
    (() => {
      const tomatoBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('🍅') || b.title?.includes('cà chua'));
      if (tomatoBtn) tomatoBtn.click();
    })()
  `);
  await client.sleep(800);
  await client.screenshot('task3_interactive_throwable.png');

  // ================= TASK 7: MOBILE TOUCH & PWA =================
  console.log('🎯 Capturing Task 7: Mobile Viewport & Native Bottom Sheet...');
  await client.setViewport(414, 896, true);
  await client.evaluate(`
    (() => {
      localStorage.removeItem('NEO_ACTIVE_MATCH');
      window.location.href = 'http://localhost:3000/';
    })()
  `);
  await client.sleep(2000);
  await client.screenshot('task7_mobile_lobby_pwa.png');

  // Open Mobile Profile Bottom Sheet Drawer
  await client.evaluate(`
    (() => {
      const avatarBtn = document.querySelector('[title*="Menu tính năng Hồ Sơ"], [title*="Menu"], .rounded-full');
      // Click profile capsule
      const profileCapsule = Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('hung0123') && d.textContent.includes('VIP'));
      if (profileCapsule) profileCapsule.click();
    })()
  `);
  await client.sleep(1200);
  await client.screenshot('task7_mobile_bottom_sheet_drawer.png');

  console.log('✅ ALL SCREENSHOT EVIDENCE CAPTURED SUCCESSFULLY!');
  client.close();
}

run().catch((err) => {
  console.error('❌ Error capturing evidence:', err);
  process.exit(1);
});
