/**
 * HỆ THỐNG ÂM THANH ĐA KÊNH & BỘ TỔNG HỢP NHẠC NỀN SYNTHWAVE (TASK 1 - TUẦN 4)
 * - Sử dụng Web Audio API thuần 100% (Không phụ thuộc file mp3 nặng, không lo bản quyền hay trễ mạng)
 * - Kiến trúc phân luồng 3 kênh độc lập: Master Gain -> BGM Gain & SFX Gain
 * - Động cơ phát nhạc nền Procedural BGM:
 *     + Lobby Chillwave Synth (90 BPM - Am/F/C/G)
 *     + Battle Intense Beat (124 BPM - Dm/Bb/F/C kịch tính)
 * - Hỗ trợ lưu trữ cấu hình bền vững vào LocalStorage & Bộ đệm thông báo Reactive
 */

const SETTINGS_STORAGE_KEY = 'neo_uno_audio_settings';

export const DEFAULT_AUDIO_SETTINGS = {
  masterVolume: 0.8,
  bgmVolume: 0.5,
  sfxVolume: 0.8,
  isMuted: false,
  bgmEnabled: true,
  currentTrack: null, // 'lobby' | 'battle' | null
};

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGainNode = null;
    this.bgmGainNode = null;
    this.sfxGainNode = null;

    // Quản lý trạng thái và cấu hình
    this.settings = this.loadSettings();
    this.listeners = new Set();

    // Biến phục vụ Procedural BGM Synthesizer
    this.bgmInterval = null;
    this.bgmStep = 0;
    this.bgmActiveNodes = [];
    this.isBgmFading = false;
  }

  // Khởi tạo hoặc khôi phục AudioContext
  init() {
    if (typeof window === 'undefined') return;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // 1. Tạo các Node khuếch đại (Gain Nodes)
        this.masterGainNode = this.ctx.createGain();
        this.bgmGainNode = this.ctx.createGain();
        this.sfxGainNode = this.ctx.createGain();

        // 2. Định tuyến (Routing Graph): SFX & BGM -> Master -> Destination
        this.sfxGainNode.connect(this.masterGainNode);
        this.bgmGainNode.connect(this.masterGainNode);
        this.masterGainNode.connect(this.ctx.destination);

        // 3. Áp dụng các mức âm lượng đã lưu
        this.applyGainLevels();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Getter tương thích ngược cho các component cũ (true nếu không mute và master > 0)
  get enabled() {
    return !this.settings.isMuted && this.settings.masterVolume > 0;
  }

  set enabled(val) {
    this.setMasterVolume(val ? (this.settings.masterVolume || 0.8) : 0);
  }

  // Tương thích ngược với hàm toggle cũ
  toggle() {
    this.toggleMute();
    return this.enabled;
  }

  // =========================================================================
  // 1. QUẢN LÝ CẤU HÌNH & LƯU TRỮ LOCALSTORAGE
  // =========================================================================

  loadSettings() {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...DEFAULT_AUDIO_SETTINGS,
            ...parsed,
            currentTrack: null // Luôn reset track khi tải lại trang
          };
        }
      }
    } catch (e) {
      console.warn('Không thể đọc cấu hình âm thanh từ LocalStorage:', e);
    }
    return { ...DEFAULT_AUDIO_SETTINGS };
  }

  saveSettings() {
    try {
      if (typeof window !== 'undefined') {
        const toSave = {
          masterVolume: this.settings.masterVolume,
          bgmVolume: this.settings.bgmVolume,
          sfxVolume: this.settings.sfxVolume,
          isMuted: this.settings.isMuted,
          bgmEnabled: this.settings.bgmEnabled
        };
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(toSave));
      }
    } catch (e) {
      console.warn('Không thể lưu cấu hình âm thanh:', e);
    }
    this.notify();
  }

  clamp(val) {
    if (typeof val !== 'number' || isNaN(val)) return 0;
    return Math.max(0, Math.min(1, Math.round(val * 100) / 100));
  }

  applyGainLevels() {
    if (!this.ctx || !this.masterGainNode || !this.bgmGainNode || !this.sfxGainNode) return;
    const now = this.ctx.currentTime;

    const targetMaster = this.settings.isMuted ? 0 : this.settings.masterVolume;
    const targetBgm = this.settings.bgmEnabled ? this.settings.bgmVolume : 0;
    const targetSfx = this.settings.sfxVolume;

    this.masterGainNode.gain.cancelScheduledValues(now);
    this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, now);
    this.masterGainNode.gain.linearRampToValueAtTime(targetMaster, now + 0.05);

    this.bgmGainNode.gain.cancelScheduledValues(now);
    this.bgmGainNode.gain.setValueAtTime(this.bgmGainNode.gain.value, now);
    this.bgmGainNode.gain.linearRampToValueAtTime(targetBgm, now + 0.05);

    this.sfxGainNode.gain.cancelScheduledValues(now);
    this.sfxGainNode.gain.setValueAtTime(this.sfxGainNode.gain.value, now);
    this.sfxGainNode.gain.linearRampToValueAtTime(targetSfx, now + 0.05);
  }

  setMasterVolume(val) {
    this.init();
    this.settings.masterVolume = this.clamp(val);
    if (this.settings.masterVolume > 0 && this.settings.isMuted) {
      this.settings.isMuted = false;
    }
    this.applyGainLevels();
    this.saveSettings();
  }

  setBgmVolume(val) {
    this.init();
    this.settings.bgmVolume = this.clamp(val);
    this.applyGainLevels();
    this.saveSettings();
  }

  setSfxVolume(val) {
    this.init();
    this.settings.sfxVolume = this.clamp(val);
    this.applyGainLevels();
    this.saveSettings();
  }

  toggleMute() {
    this.init();
    this.settings.isMuted = !this.settings.isMuted;
    this.applyGainLevels();
    this.saveSettings();
    return this.settings.isMuted;
  }

  toggleBgm() {
    this.init();
    this.settings.bgmEnabled = !this.settings.bgmEnabled;
    this.applyGainLevels();
    if (!this.settings.bgmEnabled) {
      this.stopBGM(false);
    } else if (this.settings.currentTrack) {
      const track = this.settings.currentTrack;
      this.settings.currentTrack = null;
      if (track === 'battle') this.playBattleBGM();
      else this.playLobbyBGM();
    }
    this.saveSettings();
    return this.settings.bgmEnabled;
  }

  applyPreset(presetName) {
    this.init();
    if (presetName === 'silent') {
      this.settings.isMuted = true;
      this.settings.masterVolume = 0;
    } else if (presetName === 'normal') {
      this.settings.isMuted = false;
      this.settings.masterVolume = 0.5;
      this.settings.bgmVolume = 0.4;
      this.settings.sfxVolume = 0.6;
    } else if (presetName === 'max') {
      this.settings.isMuted = false;
      this.settings.masterVolume = 1.0;
      this.settings.bgmVolume = 0.8;
      this.settings.sfxVolume = 1.0;
    }
    this.applyGainLevels();
    this.saveSettings();
  }

  resetDefaults() {
    this.init();
    this.settings = { ...DEFAULT_AUDIO_SETTINGS };
    this.applyGainLevels();
    this.saveSettings();
  }

  getSettings() {
    return { ...this.settings };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const data = this.getSettings();
    this.listeners.forEach((fn) => {
      try {
        fn(data);
      } catch (e) {
        console.error('Lỗi khi gửi thông báo audio listener:', e);
      }
    });
  }

  // Điểm đích kết nối SFX & BGM
  getSfxDestination() {
    if (this.sfxGainNode) return this.sfxGainNode;
    return this.ctx ? this.ctx.destination : null;
  }

  getBgmDestination() {
    if (this.bgmGainNode) return this.bgmGainNode;
    return this.ctx ? this.ctx.destination : null;
  }

  // =========================================================================
  // 2. PROCEDURAL SYNTH BGM ENGINE (NHẠC NỀN TỔNG HỢP SIÊU NHẸ)
  // =========================================================================

  playLobbyBGM() {
    this.init();
    if (!this.ctx) return;
    if (this.settings.currentTrack === 'lobby' && this.bgmInterval) return;

    this.stopBGM(true);
    this.settings.currentTrack = 'lobby';
    this.notify();

    if (!this.settings.bgmEnabled || this.settings.isMuted) return;

    // Giai điệu Synthwave Chill (90 BPM -> 1 nhịp = 666ms, 1 nốt 16 = 166ms)
    // Hợp âm 4 ô nhịp: Am (La thứ) -> F (Pha trưởng) -> C (Đô trưởng) -> G (Sol trưởng)
    const chords = [
      { bass: 110.00, pad: [220.00, 261.63, 329.63], arps: [440.00, 523.25, 659.25, 783.99] }, // Am (A2, A3-C4-E4, A4-C5-E5-G5)
      { bass: 87.31,  pad: [174.61, 220.00, 261.63], arps: [349.23, 440.00, 523.25, 659.25] }, // F  (F2, F3-A3-C4, F4-A4-C5-E5)
      { bass: 130.81, pad: [261.63, 329.63, 392.00], arps: [523.25, 659.25, 783.99, 1046.50] }, // C  (C3, C4-E4-G4, C5-E5-G5-C6)
      { bass: 98.00,  pad: [196.00, 246.94, 293.66], arps: [392.00, 493.88, 587.33, 783.99] }  // G  (G2, G3-B3-D4, G4-B4-D5-G5)
    ];

    let chordIndex = 0;
    const stepDuration = 0.28; // giây

    const playMeasure = () => {
      if (!this.ctx || this.settings.currentTrack !== 'lobby') return;
      const now = this.ctx.currentTime;
      const currentChord = chords[chordIndex];
      chordIndex = (chordIndex + 1) % chords.length;

      try {
        // 1. Warm Bassline
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(currentChord.bass, now);

        bassGain.gain.setValueAtTime(0.001, now);
        bassGain.gain.linearRampToValueAtTime(0.22, now + 0.05);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 4 - 0.02);

        bassOsc.connect(bassGain);
        bassGain.connect(this.getBgmDestination());
        bassOsc.start(now);
        bassOsc.stop(now + stepDuration * 4);

        // 2. Dreamy Synth Arpeggios (4 nốt lượn sóng)
        currentChord.arps.forEach((freq, idx) => {
          const arpOsc = this.ctx.createOscillator();
          const arpGain = this.ctx.createGain();
          const t = now + idx * stepDuration;

          arpOsc.type = 'sine';
          arpOsc.frequency.setValueAtTime(freq, t);

          arpGain.gain.setValueAtTime(0.001, t);
          arpGain.gain.linearRampToValueAtTime(0.12, t + 0.03);
          arpGain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 1.8);

          arpOsc.connect(arpGain);
          arpGain.connect(this.getBgmDestination());
          arpOsc.start(t);
          arpOsc.stop(t + stepDuration * 1.8);
        });
      } catch (e) {
        // Ignored
      }
    };

    playMeasure();
    this.bgmInterval = setInterval(playMeasure, stepDuration * 4 * 1000);
  }

  playBattleBGM() {
    this.init();
    if (!this.ctx) return;
    if (this.settings.currentTrack === 'battle' && this.bgmInterval) return;

    this.stopBGM(true);
    this.settings.currentTrack = 'battle';
    this.notify();

    if (!this.settings.bgmEnabled || this.settings.isMuted) return;

    // Giai điệu Bàn Đấu Dồn Dập (124 BPM -> 1 nhịp = 483ms, 16th note = 120ms)
    // Chuỗi Dm (Rê thứ) -> Bb -> F -> C
    const battleChords = [
      { root: 146.83, notes: [293.66, 349.23, 440.00, 587.33] }, // Dm
      { root: 116.54, notes: [233.08, 293.66, 349.23, 466.16] }, // Bb
      { root: 174.61, notes: [349.23, 440.00, 523.25, 698.46] }, // F
      { root: 130.81, notes: [261.63, 329.63, 392.00, 523.25] }  // C
    ];

    let chordIdx = 0;
    const stepTime = 0.22; // giây

    const playBattleMeasure = () => {
      if (!this.ctx || this.settings.currentTrack !== 'battle') return;
      const now = this.ctx.currentTime;
      const cur = battleChords[chordIdx];
      chordIdx = (chordIdx + 1) % battleChords.length;

      try {
        // 1. Electronic Driving Kick (Punch nhịp trống)
        [0, 2].forEach((beat) => {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          const t = now + beat * stepTime;

          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(140, t);
          kickOsc.frequency.exponentialRampToValueAtTime(38, t + 0.12);

          kickGain.gain.setValueAtTime(0.3, t);
          kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

          kickOsc.connect(kickGain);
          kickGain.connect(this.getBgmDestination());
          kickOsc.start(t);
          kickOsc.stop(t + 0.14);
        });

        // 2. Punchy Synth Bassline
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(cur.root, now);

        bassGain.gain.setValueAtTime(0.18, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + stepTime * 3.8);

        bassOsc.connect(bassGain);
        bassGain.connect(this.getBgmDestination());
        bassOsc.start(now);
        bassOsc.stop(now + stepTime * 3.8);

        // 3. Fast High Arpeggios (Tăng kịch tính)
        cur.notes.forEach((freq, i) => {
          const arp = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          const t = now + i * stepTime;

          arp.type = 'square';
          arp.frequency.setValueAtTime(freq, t);

          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.08, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + stepTime * 1.2);

          arp.connect(g);
          g.connect(this.getBgmDestination());
          arp.start(t);
          arp.stop(t + stepTime * 1.2);
        });
      } catch (e) {
        // Ignored
      }
    };

    playBattleMeasure();
    this.bgmInterval = setInterval(playBattleMeasure, stepTime * 4 * 1000);
  }

  stopBGM(immediate = false) {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }

    if (this.ctx && this.bgmGainNode && !immediate) {
      const now = this.ctx.currentTime;
      this.bgmGainNode.gain.cancelScheduledValues(now);
      this.bgmGainNode.gain.setValueAtTime(this.bgmGainNode.gain.value, now);
      this.bgmGainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      setTimeout(() => {
        this.applyGainLevels();
      }, 450);
    } else {
      this.applyGainLevels();
    }

    this.settings.currentTrack = null;
    this.notify();
  }

  // =========================================================================
  // 3. HIỆU ỨNG ÂM THANH SFX MỞ RỘNG (COUNTDOWN TICK & UNO VOICE)
  // =========================================================================

  // Tiếng tích tắc đồng hồ đếm ngược 5 giây cuối (Countdown Woodblock Tick)
  playTickTock(isHigh = false) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isHigh ? 920 : 680, now);
      osc.frequency.exponentialRampToValueAtTime(isHigh ? 450 : 320, now + 0.05);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      console.warn('Audio playTickTock error:', e);
    }
  }

  // Tiếng hô UNO dõng dạc (Epic Uno Fanfare Chime)
  playUnoVoice() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Hợp âm 3 tầng vút cao biểu tượng: "U - NO!"
      const uChord = [523.25, 659.25]; // C5 - E5
      const noChord = [783.99, 1046.50, 1318.51]; // G5 - C6 - E6

      uChord.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.connect(gain);
        gain.connect(this.getSfxDestination());
        osc.start(now);
        osc.stop(now + 0.16);
      });

      noChord.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + 0.15;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(gain);
        gain.connect(this.getSfxDestination());
        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch (e) {
      console.warn('Audio playUnoVoice error:', e);
    }
  }

  // =========================================================================
  // 4. TOÀN BỘ CÁC HIỆU ỨNG ÂM THANH SFX CŨ (ĐƯỢC ROUTE VÀO SFX GAIN)
  // =========================================================================

  // 1. Âm thanh bốc bài / quẹt bài (Card Slide)
  playCardSlide() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.getSfxDestination());

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 2. Âm thanh đánh bài đập xuống bàn (Card Slam)
  playCardSlam() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Bass thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.getSfxDestination());
    osc.start(now);
    osc.stop(now + 0.15);

    // High snap
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'sine';
    snapOsc.frequency.setValueAtTime(800, now);
    snapOsc.frequency.exponentialRampToValueAtTime(200, now + 0.06);

    snapGain.gain.setValueAtTime(0.2, now);
    snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    snapOsc.connect(snapGain);
    snapGain.connect(this.getSfxDestination());
    snapOsc.start(now);
    snapOsc.stop(now + 0.06);
  }

  // 3. Âm thanh xáo bài (Shuffle Riffle)
  playShuffle() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 7; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = now + i * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300 + Math.random() * 200, time);
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);

      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(time);
      osc.stop(time + 0.04);
    }
  }

  // 4. Âm thanh hô UNO thành công (Victory Chime)
  playUnoChime() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.005, time + 0.35);

      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(time);
      osc.stop(time + 0.35);
    });
  }

  // 5. Âm thanh còi báo khẩn cấp 5s UNO (Alert Beep)
  playEmergencyBeep() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(660, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.getSfxDestination());
    osc.start(now);
    osc.stop(now + 0.16);
  }

  // 6. Âm thanh các lá chức năng (Action Special FX)
  playActionSound(type) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (type === 'skip') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'reverse') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(850, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'draw_two') {
      const notes = [300, 450, 600];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const time = now + i * 0.07;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.22, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.connect(gain);
        gain.connect(this.getSfxDestination());
        osc.start(time);
        osc.stop(time + 0.2);
      });
    } else if (type === 'wild_draw_four') {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const time = now + i * 0.05;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.45);
        osc.connect(gain);
        gain.connect(this.getSfxDestination());
        osc.start(time);
        osc.stop(time + 0.45);
      });
    } else if (type === 'wild') {
      const notes = [587.33, 739.99, 880];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const time = now + i * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        osc.connect(gain);
        gain.connect(this.getSfxDestination());
        osc.start(time);
        osc.stop(time + 0.3);
      });
    }
  }

  playCardSnap() {
    try {
      this.playCardSlam();
    } catch (e) {
      console.warn('Audio playCardSnap error:', e);
    }
  }

  playUnoAlert() {
    try {
      this.playUnoVoice();
    } catch (e) {
      this.playUnoChime();
    }
  }

  playSkip() {
    try {
      this.playActionSound('skip');
    } catch (e) {
      console.warn('Audio playSkip error:', e);
    }
  }

  playReverse() {
    try {
      this.playActionSound('reverse');
    } catch (e) {
      console.warn('Audio playReverse error:', e);
    }
  }

  playVictory() {
    try {
      this.playUnoChime();
    } catch (e) {
      console.warn('Audio playVictory error:', e);
    }
  }

  playDefeat() {
    try {
      this.playEmergencyBeep();
    } catch (e) {
      console.warn('Audio playDefeat error:', e);
    }
  }

  // 7. Âm thanh Radar quét tìm trận (Sonar Ping)
  playRadarPing() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.25);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio playRadarPing error:', e);
    }
  }

  // 8. Âm thanh Tìm thấy trận (Match Found Fanfare)
  playMatchFound() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const time = now + idx * 0.07;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.005, time + 0.4);

        osc.connect(gain);
        gain.connect(this.getSfxDestination());
        osc.start(time);
        osc.stop(time + 0.4);
      });
    } catch (e) {
      console.warn('Audio playMatchFound error:', e);
    }
  }

  // 9. Âm thanh Cà chua đập bẹp (Tomato Splat)
  playSplat() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(520, now);
      osc1.frequency.exponentialRampToValueAtTime(50, now + 0.2);
      gain1.gain.setValueAtTime(0.45, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(this.getSfxDestination());
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(180, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(35, now + 0.22);
      gain2.gain.setValueAtTime(0.35, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc2.connect(gain2);
      gain2.connect(this.getSfxDestination());
      osc2.start(now + 0.04);
      osc2.stop(now + 0.24);
    } catch (e) {
      console.warn('Audio playSplat error:', e);
    }
  }

  // 10. Âm thanh Pháo hoa chúc mừng (Firework / Party)
  playFirework() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const oscWhistle = this.ctx.createOscillator();
      const gainWhistle = this.ctx.createGain();
      oscWhistle.type = 'sine';
      oscWhistle.frequency.setValueAtTime(300, now);
      oscWhistle.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
      gainWhistle.gain.setValueAtTime(0.08, now);
      gainWhistle.gain.linearRampToValueAtTime(0.01, now + 0.25);
      oscWhistle.connect(gainWhistle);
      gainWhistle.connect(this.getSfxDestination());
      oscWhistle.start(now);
      oscWhistle.stop(now + 0.25);

      const chords = [587.33, 739.99, 880.0, 1174.66];
      chords.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.25);
        gain.gain.setValueAtTime(0.18, now + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.connect(gain);
        gain.connect(this.getSfxDestination());
        osc.start(now + 0.25);
        osc.stop(now + 0.65);
      });
    } catch (e) {
      console.warn('Audio playFirework error:', e);
    }
  }

  // 11. Âm thanh Thả tim ngọt ngào (Heart Pop)
  playHeartPop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [440, 554.37, 659.25].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + i * 0.06;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(this.getSfxDestination());
        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch (e) {
      console.warn('Audio playHeartPop error:', e);
    }
  }

  // 12. Âm thanh Tia sét nảy lửa (Zap / Lightning)
  playZap() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.22);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio playZap error:', e);
    }
  }

  // 13. Âm thanh Chat nhanh popup (Quick Chat Pop)
  playEmotePop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn('Audio playEmotePop error:', e);
    }
  }

  // 14. Âm thanh mua vật phẩm thành công trong Cửa Hàng (Coin Clink)
  playCoinBuy() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const t = now + idx * 0.08;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain);
        gain.connect(this.getSfxDestination());
        osc.start(t);
        osc.stop(t + 0.28);
      });
    } catch (e) {
      console.warn('Audio playCoinBuy error:', e);
    }
  }

  // 15. Âm thanh trang bị skin / khung avatar (Crisp Equip Swoosh)
  playEquip() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.getSfxDestination());
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {
      console.warn('Audio playEquip error:', e);
    }
  }

  // 16. Phát âm thanh theo tên loại hiệu ứng biểu cảm
  playEmoteEffect(soundType, isProjectile = false) {
    if (!this.enabled || !soundType) return;
    const play = () => {
      try {
        if (soundType === 'splat') this.playSplat();
        else if (soundType === 'firework') this.playFirework();
        else if (soundType === 'zap') this.playZap();
        else if (soundType === 'heart_pop') this.playHeartPop();
        else this.playEmotePop();
      } catch (e) {
        console.warn('Audio playEmoteEffect error:', e);
      }
    };

    if (isProjectile) {
      setTimeout(play, 380);
    } else {
      play();
    }
  }
}

export const soundEngine = new SoundEngine();
