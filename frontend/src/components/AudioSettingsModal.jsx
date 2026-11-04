import React, { useState, useEffect } from 'react';
import { soundEngine } from '../utils/audioFx';

/**
 * AudioSettingsModal - Bộ trộn âm thanh đa kênh Cyberpunk Audio Mixer (Task 1 - Tuần 4)
 * Điều khiển Master Volume, Nhạc nền BGM (Lobby & Battle) và Hiệu ứng SFX
 */
export default function AudioSettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState(() => soundEngine.getSettings());

  useEffect(() => {
    // Đăng ký lắng nghe sự kiện thay đổi từ soundEngine
    const unsubscribe = soundEngine.subscribe((newSettings) => {
      setSettings(newSettings);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleMasterChange = (e) => {
    const val = parseFloat(e.target.value) / 100;
    soundEngine.setMasterVolume(val);
  };

  const handleBgmChange = (e) => {
    const val = parseFloat(e.target.value) / 100;
    soundEngine.setBgmVolume(val);
  };

  const handleSfxChange = (e) => {
    const val = parseFloat(e.target.value) / 100;
    soundEngine.setSfxVolume(val);
  };

  const handleToggleMute = () => {
    soundEngine.toggleMute();
  };

  const handleToggleBgm = () => {
    soundEngine.toggleBgm();
  };

  const handlePlayLobbyTrack = () => {
    soundEngine.playLobbyBGM();
  };

  const handlePlayBattleTrack = () => {
    soundEngine.playBattleBGM();
  };

  const handleStopBGM = () => {
    soundEngine.stopBGM(false);
  };

  const handlePreset = (preset) => {
    soundEngine.applyPreset(preset);
    soundEngine.playCardSlide();
  };

  const handleReset = () => {
    soundEngine.resetDefaults();
    soundEngine.playUnoAlert();
  };

  const masterPercent = Math.round((settings.isMuted ? 0 : settings.masterVolume) * 100);
  const bgmPercent = Math.round((settings.bgmEnabled ? settings.bgmVolume : 0) * 100);
  const sfxPercent = Math.round(settings.sfxVolume * 100);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0f172a] via-[#090d16] to-[#040711] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[92vh] overflow-hidden text-slate-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER ================= */}
        <div className="relative p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <span className="material-symbols-outlined text-2xl animate-pulse">tune</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-purple-300 tracking-wide uppercase">
                Cài Đặt Âm Thanh
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Bộ trộn âm thanh đa kênh & Nhạc nền Cyberpunk
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playCardSlide();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* ================= BODY CONTENT ================= */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm">
          
          {/* 1. MASTER VOLUME */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-xl ${settings.isMuted || settings.masterVolume === 0 ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {settings.isMuted || settings.masterVolume === 0 ? 'volume_off' : settings.masterVolume < 0.5 ? 'volume_down' : 'volume_up'}
                </span>
                <span className="font-bold text-slate-200 text-sm">Âm Lượng Tổng (Master)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-cyan-400 text-sm px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/30">
                  {masterPercent}%
                </span>
                <button
                  onClick={handleToggleMute}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    settings.isMuted 
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30' 
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {settings.isMuted ? 'BẬT ÂM' : 'TẮT TIẾNG'}
                </button>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={masterPercent}
              onChange={handleMasterChange}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400">Chọn nhanh:</span>
              <button
                onClick={() => handlePreset('silent')}
                className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                🔇 Im lặng (0%)
              </button>
              <button
                onClick={() => handlePreset('normal')}
                className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                🔉 Vừa đủ (50%)
              </button>
              <button
                onClick={() => handlePreset('max')}
                className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                🔊 Tối đa (100%)
              </button>
            </div>
          </div>

          {/* 2. BACKGROUND MUSIC (BGM) */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-purple-400">graphic_eq</span>
                <span className="font-bold text-slate-200 text-sm">Nhạc Nền (BGM Synthesizer)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-purple-400 text-sm px-2 py-0.5 rounded bg-purple-950/50 border border-purple-500/30">
                  {bgmPercent}%
                </span>
                <button
                  onClick={handleToggleBgm}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    settings.bgmEnabled
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {settings.bgmEnabled ? 'BẬT' : 'TẮT'}
                </button>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              disabled={!settings.bgmEnabled || settings.isMuted}
              value={bgmPercent}
              onChange={handleBgmChange}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400 disabled:opacity-40"
            />

            {/* Track selector preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* Lobby track */}
              <button
                onClick={handlePlayLobbyTrack}
                disabled={!settings.bgmEnabled || settings.isMuted}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  settings.currentTrack === 'lobby'
                    ? 'bg-cyan-500/20 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🎧</span>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Sảnh Chờ Cyberpunk</div>
                    <div className="text-[10px] text-slate-400">Synthwave 90 BPM Chill</div>
                  </div>
                </div>
                {settings.currentTrack === 'lobby' ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    ĐANG PHÁT
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-sm text-slate-400">play_arrow</span>
                )}
              </button>

              {/* Battle track */}
              <button
                onClick={handlePlayBattleTrack}
                disabled={!settings.bgmEnabled || settings.isMuted}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  settings.currentTrack === 'battle'
                    ? 'bg-emerald-500/20 border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🍃</span>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Bàn Đấu Êm Dịu</div>
                    <div className="text-[10px] text-slate-400">Ambient Lo-Fi Thư Thái</div>
                  </div>
                </div>
                {settings.currentTrack === 'battle' ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    ĐANG PHÁT
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-sm text-slate-400">play_arrow</span>
                )}
              </button>
            </div>

            {settings.currentTrack && (
              <div className="flex justify-end pt-0.5">
                <button
                  onClick={handleStopBGM}
                  className="text-[11px] text-slate-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">stop_circle</span>
                  Dừng nhạc nền
                </button>
              </div>
            )}
          </div>

          {/* 3. SOUND EFFECTS (SFX) */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-amber-400">notifications_active</span>
                <span className="font-bold text-slate-200 text-sm">Hiệu Ứng Bàn Cờ (SFX)</span>
              </div>
              <span className="font-mono font-bold text-amber-400 text-sm px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/30">
                {sfxPercent}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={sfxPercent}
              onChange={handleSfxChange}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />

            {/* Test SFX buttons */}
            <div>
              <div className="text-[11px] text-slate-400 mb-1.5">Nghe thử âm thanh hiệu ứng:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  onClick={() => soundEngine.playCardSlam()}
                  className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <span>🃏</span> Đánh bài
                </button>
                <button
                  onClick={() => soundEngine.playShuffle()}
                  className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <span>🔀</span> Xáo bài
                </button>
                <button
                  onClick={() => soundEngine.playUnoVoice()}
                  className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <span>📢</span> Hô UNO!
                </button>
                <button
                  onClick={() => soundEngine.playTickTock(true)}
                  className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <span>⏳</span> Đếm giờ
                </button>
              </div>
            </div>
          </div>

          {/* 4. ENGINE SPECS INFO */}
          <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-sm">memory</span>
              <span>Web Audio API 64-bit • Tự tổng hợp bằng mã lệnh (0 MB Data)</span>
            </div>
            <button
              onClick={handleReset}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Khôi phục mặc định
            </button>
          </div>

        </div>

        {/* ================= FOOTER ================= */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-end">
          <button
            onClick={() => {
              soundEngine.playCardSlide();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
          >
            Hoàn Tất & Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
