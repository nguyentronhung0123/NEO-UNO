import React, { useState, useEffect, useRef, useMemo } from 'react';
import { matchApi } from '../apis/matchApi';

const CARD_COLORS = {
  red: { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-400', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.4)]' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-400', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]' },
  green: { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-400', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]' },
  yellow: { bg: 'bg-amber-400', text: 'text-amber-400', border: 'border-amber-400', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.4)]' },
  wild: { bg: 'bg-gradient-to-tr from-rose-500 via-amber-400 to-blue-500', text: 'text-purple-400', border: 'border-purple-400', glow: 'shadow-[0_0_25px_rgba(168,85,247,0.5)]' },
};

export default function MatchReplayModal({ isOpen, onClose, matchId, onOpenReport }) {
  const [loading, setLoading] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1); // 1, 1.5, 2
  const feedListRef = useRef(null);
  const timerRef = useRef(null);

  // 1. Tải dữ liệu Replay từ API
  useEffect(() => {
    if (!isOpen || !matchId) return;

    let isMounted = true;
    setLoading(true);
    setCurrentStep(0);
    setIsPlaying(false);

    matchApi.getMatchReplay(matchId).then((res) => {
      if (!isMounted) return;
      setLoading(false);
      if (res && res.success && res.match) {
        setMatchData(res.match);
      } else {
        setMatchData(null);
      }
    });

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, matchId]);

  // Danh sách lượt đánh
  const turnLogs = useMemo(() => {
    return matchData?.turnLogs || [];
  }, [matchData]);

  const maxSteps = turnLogs.length > 0 ? turnLogs.length - 1 : 0;
  const activeLog = turnLogs[currentStep] || null;

  // 2. Tự động phát Replay theo tốc độ
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(400, Math.floor(1400 / playSpeed));
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= maxSteps) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, maxSteps, playSpeed]);

  // 3. Tự động cuộn danh sách Feed theo bước đang xem
  useEffect(() => {
    if (feedListRef.current) {
      const activeEl = feedListRef.current.querySelector(`[data-step="${currentStep}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentStep]);

  // 4. Phím tắt tiện lợi (Space, ArrowLeft, ArrowRight, Esc)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'ArrowLeft') {
        setIsPlaying(false);
        setCurrentStep((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setIsPlaying(false);
        setCurrentStep((prev) => Math.min(maxSteps, prev + 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, maxSteps, onClose]);

  if (!isOpen) return null;

  // Trạng thái bài của từng người chơi tại bước `currentStep`
  const playerStates = (matchData?.players || []).map((p) => {
    // Tìm log gần nhất của người này
    let remaining = 7;
    for (let i = 0; i <= currentStep; i++) {
      const item = turnLogs[i];
      if (item && (item.playerId === p.id || item.playerName === p.name)) {
        remaining = item.cardsRemaining;
      }
    }
    const isCurrentTurnPlayer = activeLog && (activeLog.playerId === p.id || activeLog.playerName === p.name);
    return {
      ...p,
      currentCards: remaining,
      isCurrentTurn: Boolean(isCurrentTurnPlayer),
    };
  });

  // Lá bài trên cùng hiển thị ở giữa bàn
  const topCard = activeLog?.cardPlayed || activeLog?.topDiscardCard || matchData?.initialState?.startCard || {
    color: 'red',
    value: '0',
  };
  const activeColor = activeLog?.currentColor || topCard.color || 'red';
  const colorTheme = CARD_COLORS[topCard.color] || CARD_COLORS.red;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0b0f19] border border-cyan-500/40 rounded-3xl shadow-[0_0_80px_rgba(0,210,255,0.22)] overflow-hidden animate-in zoom-in-95 duration-200 text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-950/40 via-[#0e172a] to-purple-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 text-xl shadow-[0_0_15px_rgba(0,210,255,0.3)]">
              ▶️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">
                  XEM LẠI TRẬN ĐẤU (MATCH REPLAY)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black uppercase">
                  {matchData?.mode || '4P'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Phòng: <span className="font-mono text-cyan-400 font-bold">{matchData?.roomCode}</span> • Người thắng:{' '}
                <span className="font-bold text-amber-300">🏆 {matchData?.winner?.name || 'Chưa rõ'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút tố cáo người chơi ở lượt này */}
            {activeLog && onOpenReport && (
              <button
                onClick={() => {
                  setIsPlaying(false);
                  onOpenReport({
                    id: activeLog.playerId,
                    name: activeLog.playerName,
                    matchId: matchData?._id,
                    roomCode: matchData?.roomCode,
                    evidenceTurn: activeLog.turnNumber,
                  });
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all shadow-[0_0_12px_rgba(244,63,94,0.2)]"
              >
                <span>⚠️</span>
                <span>Tố cáo lượt này</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 gap-4">
            <div className="w-12 h-12 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(0,210,255,0.5)]" />
            <p className="text-xs font-bold text-cyan-300 animate-pulse">Đang nạp dữ liệu Replay ván đấu...</p>
          </div>
        ) : !matchData ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
            <div className="text-5xl mb-3">📂</div>
            <p className="text-sm font-bold text-gray-400">Không tìm thấy dữ liệu Replay cho ván đấu này.</p>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
            {/* Cột Trái: Bàn Cờ Ảo & Video Player (8 cols) */}
            <div className="lg:col-span-8 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10 bg-[#080c14] p-4 sm:p-6 overflow-y-auto">
              {/* Vòng người chơi trên bàn cờ */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
                {playerStates.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className={`p-3 rounded-2xl border transition-all ${
                      p.isCurrentTurn
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(0,210,255,0.3)] scale-[1.02]'
                        : 'bg-[#101625]/70 border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-xl">{p.avatar || '👤'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                          {p.name}
                          {p.isHuman === false && (
                            <span className="text-[9px] px-1 rounded bg-purple-500/30 text-purple-300 font-mono">
                              BOT
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {p.rank === 1 ? '🏆 Hạng 1' : `Hạng ${p.rank}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-white/5">
                      <span className="text-gray-400 text-[10px]">Bài trên tay:</span>
                      <span
                        className={`font-black text-xs px-2 py-0.5 rounded-lg ${
                          p.currentCards === 1
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                            : 'bg-white/10 text-cyan-300'
                        }`}
                      >
                        {p.currentCards} lá
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trung Tâm Bàn Cờ: Lá Bài Trên Cùng (Discard Top) */}
              <div className="flex-1 flex flex-col items-center justify-center py-6 bg-radial from-[#131b2e] via-transparent to-transparent rounded-3xl border border-white/5 relative overflow-hidden">
                <div className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                  <span>BÀN ĐẤU HIỆN TẠI</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                </div>

                {/* Card Display */}
                <div
                  className={`w-28 h-40 sm:w-32 sm:h-48 rounded-2xl border-2 ${colorTheme.border} ${colorTheme.glow} ${colorTheme.bg} flex flex-col items-center justify-between p-3 text-white shadow-2xl transition-all duration-300 transform hover:scale-105`}
                >
                  <div className="w-full flex justify-between items-center text-sm font-black">
                    <span>{topCard.value}</span>
                    <span className="text-[10px] uppercase font-mono">{topCard.color}</span>
                  </div>
                  <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-full bg-black/25 flex items-center justify-center text-2xl sm:text-3xl font-black shadow-inner border border-white/20">
                    {topCard.value}
                  </div>
                  <div className="w-full text-right text-sm font-black">{topCard.value}</div>
                </div>

                {/* Màu đang chọn */}
                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span className="text-gray-400">Màu chủ đạo:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] border ${
                      CARD_COLORS[activeColor]?.text || 'text-cyan-400'
                    } ${CARD_COLORS[activeColor]?.border || 'border-cyan-400'}`}
                  >
                    {activeColor}
                  </span>
                </div>

                {/* Thông tin mô tả nước đi hiện tại */}
                <div className="mt-3 text-center px-4 max-w-md">
                  <p className="text-xs font-semibold text-cyan-200">
                    {activeLog ? activeLog.description : 'Bắt đầu ván đấu.'}
                  </p>
                </div>
              </div>

              {/* Thanh Điều Khiển Video Player */}
              <div className="mt-4 p-4 rounded-2xl bg-[#0f1422] border border-white/10 space-y-3">
                {/* Timeline Scrubber */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono font-bold text-gray-400 w-12 text-left">
                    #{currentStep + 1}/{turnLogs.length}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={maxSteps}
                    value={currentStep}
                    onChange={(e) => {
                      setIsPlaying(false);
                      setCurrentStep(Number(e.target.value));
                    }}
                    className="flex-1 accent-cyan-400 cursor-pointer h-2 rounded-lg bg-gray-700"
                  />
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">
                    {Math.round(((currentStep + 1) / turnLogs.length) * 100)}%
                  </span>
                </div>

                {/* Nút bấm Playback */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Đầu ván */}
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentStep(0);
                      }}
                      title="Về đầu ván (Home)"
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 flex items-center justify-center text-xs font-bold transition-colors"
                    >
                      ⏮
                    </button>
                    {/* Lùi 1 bước */}
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentStep((p) => Math.max(0, p - 1));
                      }}
                      title="Lùi 1 lượt (Mũi tên Trái)"
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 flex items-center justify-center text-sm font-bold transition-colors"
                    >
                      ◀
                    </button>
                    {/* Play/Pause */}
                    <button
                      onClick={() => setIsPlaying((p) => !p)}
                      title="Phát / Tạm dừng (Phím Cách)"
                      className="px-4 h-9 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,210,255,0.4)] transition-all"
                    >
                      <span>{isPlaying ? '⏸' : '▶'}</span>
                      <span>{isPlaying ? 'DỪNG' : 'PHÁT'}</span>
                    </button>
                    {/* Tiến 1 bước */}
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentStep((p) => Math.min(maxSteps, p + 1));
                      }}
                      title="Tiến 1 lượt (Mũi tên Phải)"
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 flex items-center justify-center text-sm font-bold transition-colors"
                    >
                      ▶
                    </button>
                    {/* Cuối ván */}
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentStep(maxSteps);
                      }}
                      title="Tới kết thúc ván (End)"
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 flex items-center justify-center text-xs font-bold transition-colors"
                    >
                      ⏭
                    </button>
                  </div>

                  {/* Bộ chọn Tốc độ phát */}
                  <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5">
                    {[1, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaySpeed(spd)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                          playSpeed === spd
                            ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(0,210,255,0.2)]'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cột Phải: Feed Nhật Ký Từng Nước Đi (4 cols) */}
            <div className="lg:col-span-4 flex flex-col bg-[#0b0e17] min-h-0">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
                  <span>📜</span>
                  <span>DIỄN BIẾN TỪNG LƯỢT</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold">
                  {turnLogs.length} nước đi
                </span>
              </div>

              {/* Danh sách cuộn các lượt */}
              <div ref={feedListRef} className="flex-1 p-3 overflow-y-auto space-y-2">
                {turnLogs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">Chưa có nhật ký nước đi.</div>
                ) : (
                  turnLogs.map((log, idx) => {
                    const isSelected = idx === currentStep;
                    return (
                      <div
                        key={idx}
                        data-step={idx}
                        onClick={() => {
                          setIsPlaying(false);
                          setCurrentStep(idx);
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                          isSelected
                            ? 'bg-gradient-to-r from-cyan-950/60 to-purple-950/40 border-cyan-400/80 shadow-[0_0_15px_rgba(0,210,255,0.2)]'
                            : 'bg-[#121827]/60 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                          <span className="font-mono font-bold text-cyan-400">Lượt #{log.turnNumber}</span>
                          <span className="text-gray-500">
                            {log.isBot ? '🤖 Bot' : '👤 Người chơi'}
                          </span>
                        </div>
                        <div className="font-medium text-gray-200 leading-snug">
                          {log.description}
                        </div>
                        {log.cardPlayed && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                CARD_COLORS[log.cardPlayed.color]?.bg || 'bg-gray-600'
                              } text-white`}
                            >
                              {log.cardPlayed.color} {log.cardPlayed.value}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Còn {log.cardsRemaining} lá
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
