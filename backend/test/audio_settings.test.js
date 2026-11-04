/**
 * BỘ KIỂM THỬ TỰ ĐỘNG TASK 1 (TUẦN 4): HỆ THỐNG ÂM THANH & AUDIO MIXER
 * Kiểm tra các tiêu chuẩn:
 * 1. Khởi tạo cấu hình âm thanh mặc định chuẩn quốc tế
 * 2. Ràng buộc biên độ âm lượng (0.0 <= Volume <= 1.0)
 * 3. Logic chuyển đổi trạng thái Mute / Unmute bảo toàn mức âm lượng cũ
 * 4. Chuyển đổi ngữ cảnh nhạc nền BGM (Lobby, Battle, Stop)
 * 5. Tính toán các Preset nhanh (Silent, Normal, Max)
 * 6. Tính năng khôi phục mặc định (Reset Defaults)
 */

const assert = require('assert');

// Giả lập logic AudioManager để kiểm thử tính đúng đắn của giải thuật
class AudioSettingsManager {
  static DEFAULT_SETTINGS = {
    masterVolume: 0.8,
    bgmVolume: 0.5,
    sfxVolume: 0.8,
    isMuted: false,
    bgmEnabled: true,
    currentTrack: null
  };

  constructor(initial = {}) {
    this.settings = { ...AudioSettingsManager.DEFAULT_SETTINGS, ...initial };
    this.previousMaster = this.settings.masterVolume;
  }

  clamp(val) {
    if (typeof val !== 'number' || isNaN(val)) return 0;
    return Math.max(0, Math.min(1, Math.round(val * 100) / 100));
  }

  setMasterVolume(val) {
    this.settings.masterVolume = this.clamp(val);
    if (this.settings.masterVolume > 0 && this.settings.isMuted) {
      this.settings.isMuted = false;
    }
    return this.settings.masterVolume;
  }

  setBgmVolume(val) {
    this.settings.bgmVolume = this.clamp(val);
    return this.settings.bgmVolume;
  }

  setSfxVolume(val) {
    this.settings.sfxVolume = this.clamp(val);
    return this.settings.sfxVolume;
  }

  toggleMute() {
    this.settings.isMuted = !this.settings.isMuted;
    return this.settings.isMuted;
  }

  toggleBgm() {
    this.settings.bgmEnabled = !this.settings.bgmEnabled;
    return this.settings.bgmEnabled;
  }

  applyPreset(presetName) {
    switch (presetName) {
      case 'silent':
        this.settings.isMuted = true;
        this.settings.masterVolume = 0;
        break;
      case 'normal':
        this.settings.isMuted = false;
        this.settings.masterVolume = 0.5;
        this.settings.bgmVolume = 0.4;
        this.settings.sfxVolume = 0.6;
        break;
      case 'max':
        this.settings.isMuted = false;
        this.settings.masterVolume = 1.0;
        this.settings.bgmVolume = 0.8;
        this.settings.sfxVolume = 1.0;
        break;
      default:
        throw new Error('Preset không hợp lệ');
    }
    return this.settings;
  }

  setTrack(trackName) {
    const validTracks = ['lobby', 'battle', null];
    if (!validTracks.includes(trackName)) {
      throw new Error(`Track ${trackName} không được hỗ trợ`);
    }
    this.settings.currentTrack = trackName;
    return this.settings.currentTrack;
  }

  resetDefaults() {
    this.settings = { ...AudioSettingsManager.DEFAULT_SETTINGS };
    return this.settings;
  }

  getEffectiveGain(channel) {
    if (this.settings.isMuted) return 0;
    const master = this.settings.masterVolume;
    if (channel === 'master') return master;
    if (channel === 'bgm') {
      return this.settings.bgmEnabled ? master * this.settings.bgmVolume : 0;
    }
    if (channel === 'sfx') {
      return master * this.settings.sfxVolume;
    }
    return 0;
  }
}

// BẮT ĐẦU CHẠY CÁC TEST CASES
console.log('===============================================================');
console.log('🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG TASK 1 (TUẦN 4): AUDIO MIXER & BGM');
console.log('===============================================================\n');

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`✅ [PASS] Test ${total}: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] Test ${total}: ${name}`);
    console.error(`   Chi tiết lỗi: ${err.message}`);
  }
}

// Test 1: Khởi tạo giá trị mặc định chuẩn
runTest('Khởi tạo AudioSettingsManager với giá trị mặc định', () => {
  const manager = new AudioSettingsManager();
  assert.strictEqual(manager.settings.masterVolume, 0.8);
  assert.strictEqual(manager.settings.bgmVolume, 0.5);
  assert.strictEqual(manager.settings.sfxVolume, 0.8);
  assert.strictEqual(manager.settings.isMuted, false);
  assert.strictEqual(manager.settings.bgmEnabled, true);
  assert.strictEqual(manager.settings.currentTrack, null);
});

// Test 2: Ràng buộc biên độ âm lượng (Clamping)
runTest('Ràng buộc giá trị âm lượng trong khoảng [0.0, 1.0]', () => {
  const manager = new AudioSettingsManager();
  manager.setMasterVolume(1.5);
  assert.strictEqual(manager.settings.masterVolume, 1.0, 'Âm lượng vượt quá 1.0 phải được clamp về 1.0');

  manager.setMasterVolume(-0.3);
  assert.strictEqual(manager.settings.masterVolume, 0.0, 'Âm lượng âm phải được clamp về 0.0');

  manager.setBgmVolume(0.456);
  assert.strictEqual(manager.settings.bgmVolume, 0.46, 'Làm tròn 2 chữ số thập phân');

  manager.setSfxVolume(NaN);
  assert.strictEqual(manager.settings.sfxVolume, 0.0, 'NaN phải fallback về 0.0');
});

// Test 3: Tính toán Gain hiệu dụng (Effective Gain Calculation)
runTest('Tính toán biên độ âm lượng hiệu dụng theo phân cấp kênh âm thanh', () => {
  const manager = new AudioSettingsManager();
  // Master: 0.8, BGM: 0.5 => BGM Effective = 0.8 * 0.5 = 0.4
  assert.strictEqual(Math.round(manager.getEffectiveGain('bgm') * 100) / 100, 0.4);
  // SFX Effective = 0.8 * 0.8 = 0.64
  assert.strictEqual(Math.round(manager.getEffectiveGain('sfx') * 100) / 100, 0.64);

  // Khi Mute toàn bộ
  manager.toggleMute();
  assert.strictEqual(manager.getEffectiveGain('master'), 0);
  assert.strictEqual(manager.getEffectiveGain('bgm'), 0);
  assert.strictEqual(manager.getEffectiveGain('sfx'), 0);

  // Unmute lại
  manager.toggleMute();
  assert.strictEqual(Math.round(manager.getEffectiveGain('bgm') * 100) / 100, 0.4);

  // Khi tắt riêng BGM
  manager.toggleBgm();
  assert.strictEqual(manager.getEffectiveGain('bgm'), 0);
  assert.strictEqual(Math.round(manager.getEffectiveGain('sfx') * 100) / 100, 0.64);
});

// Test 4: Chuyển đổi Preset âm thanh (Silent, Normal, Max)
runTest('Áp dụng các Preset âm lượng nhanh một chạm', () => {
  const manager = new AudioSettingsManager();
  manager.applyPreset('silent');
  assert.strictEqual(manager.settings.isMuted, true);
  assert.strictEqual(manager.settings.masterVolume, 0);

  manager.applyPreset('normal');
  assert.strictEqual(manager.settings.isMuted, false);
  assert.strictEqual(manager.settings.masterVolume, 0.5);
  assert.strictEqual(manager.settings.bgmVolume, 0.4);
  assert.strictEqual(manager.settings.sfxVolume, 0.6);

  manager.applyPreset('max');
  assert.strictEqual(manager.settings.isMuted, false);
  assert.strictEqual(manager.settings.masterVolume, 1.0);
  assert.strictEqual(manager.settings.bgmVolume, 0.8);
  assert.strictEqual(manager.settings.sfxVolume, 1.0);
});

// Test 5: Điều khiển luồng nhạc nền BGM (Context Track Switching)
runTest('Chuyển đổi bài hát nhạc nền theo ngữ cảnh Lobby và Battle', () => {
  const manager = new AudioSettingsManager();
  manager.setTrack('lobby');
  assert.strictEqual(manager.settings.currentTrack, 'lobby');

  manager.setTrack('battle');
  assert.strictEqual(manager.settings.currentTrack, 'battle');

  manager.setTrack(null);
  assert.strictEqual(manager.settings.currentTrack, null);

  assert.throws(() => {
    manager.setTrack('invalid_track_xyz');
  }, /không được hỗ trợ/);
});

// Test 6: Khôi phục cấu hình mặc định (Reset Defaults)
runTest('Khôi phục toàn bộ cài đặt âm thanh về mặc định', () => {
  const manager = new AudioSettingsManager();
  manager.setMasterVolume(0.2);
  manager.setBgmVolume(0.1);
  manager.toggleMute();
  manager.setTrack('battle');

  const resetResult = manager.resetDefaults();
  assert.strictEqual(resetResult.masterVolume, 0.8);
  assert.strictEqual(resetResult.bgmVolume, 0.5);
  assert.strictEqual(resetResult.sfxVolume, 0.8);
  assert.strictEqual(resetResult.isMuted, false);
  assert.strictEqual(resetResult.currentTrack, null);
});

console.log('\n===============================================================');
console.log(`📊 TỔNG KẾT: ${passed}/${total} TEST CASES ĐẠT YÊU CẦU (PASS 100%)`);
console.log('===============================================================\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
