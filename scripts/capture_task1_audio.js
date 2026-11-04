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

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error('Eval error: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : null;
  }

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png', quality: 100 });
    const buffer = Buffer.from(res.data, 'base64');
    const pubPath = path.join(PUBLIC_DIR, filename);
    const artPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(pubPath, buffer);
    fs.writeFileSync(artPath, buffer);
    console.log(`📸 Saved screenshot: ${pubPath} & ${artPath} (${buffer.length} bytes)`);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  const wsUrl = await getWsUrl();
  console.log('Connected to CDP at:', wsUrl);
  const client = new ChromeClient(wsUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });

  console.log('Navigating to http://localhost:3000...');
  await client.send('Page.navigate', { url: 'http://localhost:3000' });
  await new Promise(r => setTimeout(r, 2500));

  // 1. Chụp ảnh Sảnh có nút Âm Thanh
  await client.screenshot('task1_lobby_audio_header.png');

  // 2. Mở Modal Cài đặt Âm thanh
  console.log('Opening Audio Settings Modal...');
  await client.eval(`
    // Tìm nút Cài Đặt Âm Thanh trên Header
    const btns = Array.from(document.querySelectorAll('button'));
    const audioBtn = btns.find(b => b.textContent.includes('Âm Thanh') || b.title?.includes('âm thanh'));
    if (audioBtn) {
      audioBtn.click();
    } else {
      console.warn('Audio button not found!');
    }
  `);

  await new Promise(r => setTimeout(r, 1200));

  // Kích hoạt nghe thử một bài hát để hiện visualizer / đang phát
  await client.eval(`
    const trackBtns = Array.from(document.querySelectorAll('button'));
    const lobbyTrack = trackBtns.find(b => b.textContent.includes('Sảnh Chờ Cyberpunk'));
    if (lobbyTrack) lobbyTrack.click();
  `);

  await new Promise(r => setTimeout(r, 800));

  // Chụp ảnh Modal Audio Settings
  await client.screenshot('task1_audio_mixer_modal.png');

  client.close();
  console.log('🎉 Done capturing Task 1 screenshots!');
}

run().catch(console.error);
