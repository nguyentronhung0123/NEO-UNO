import React, { useState, useEffect, useMemo } from 'react';
import { matchApi } from '../apis/matchApi';

export default function MatchHistoryModal({ isOpen, onClose, onOpenAuth, onPlayNow }) {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'win', 'loss'
  const [modeFilter, setModeFilter] = useState('all'); // 'all', '1v1', '3p', '4p'
  const [expandedMatchId, setExpandedMatchId] = useState(null);

  // Lấy dữ liệu lịch sử đấu từ API
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await matchApi.getMyMatchHistory({
        limit: 30,
        page: 1,
        filter,
        mode: modeFilter,
      });
      if (res.success) {
        setMatches(res.matches || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      console.warn('Lỗi khi tải lịch sử:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, filter, modeFilter]);

  // Đóng modal khi bấm phím ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Format thời gian hiển thị thân thiện
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Vừa xong';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now - d;
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffMin < 1) return 'Vừa xong';
      if (diffMin < 60) return `${diffMin} phút trước`;
      if (diffHour < 24) return `${diffHour} giờ trước`;
      if (diffDay < 7) return `${diffDay} ngày trước`;
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Format thời lượng trận đấu (giây sang mm:ss)
  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0:45';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  // Toggle xem chi tiết ván đấu
  const toggleExpand = (matchId) => {
    setExpandedMatchId((prev) => (prev === matchId ? null : matchId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Nền mờ Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Container Modal Chính */}
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0d111a] border border-cyan-500/30 rounded-3xl shadow-[0_0_80px_rgba(0,210,255,0.18)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ================= HEADER ================= */}
        <div className="relative px-6 py-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#121826] via-[#101522] to-[#121826]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              📜
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black font-headline tracking-wide uppercase bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent">
                  LỊCH SỬ ĐẤU TRƯỜNG
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-bold uppercase tracking-wider">
                  MongoDB Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Nhật ký ván đấu, biến động điểm Rank ELO & thành tích đối đầu
              </p>
            </div>
          </div>

          {/* Nút Đóng & Nút Làm mới */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchHistory}
              disabled={loading}
              title="Làm mới dữ liệu"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
            <button
              onClick={onClose}
              title="Đóng cửa sổ"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-rose-500/20 hover:border-rose-400/50 border border-white/10 flex items-center justify-center text-slate-300 hover:text-rose-400 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* ================= THÔNG BÁO CHO CHẾ ĐỘ KHÁCH ================= */}
        {summary && summary.elo === 1000 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>
                <strong>Chế độ Khách (Guest):</strong> Kết quả được lưu tạm thời. Hãy <strong>Đăng nhập tài khoản</strong> để tích lũy điểm ELO và lưu trữ lịch sử thi đấu vĩnh viễn!
              </span>
            </div>
            {onOpenAuth && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shadow-sm transition-transform hover:scale-105 cursor-pointer whitespace-nowrap ml-3"
              >
                Đăng Nhập Ngay 🚪
              </button>
            )}
          </div>
        )}

        {/* ================= THANH TỔNG HỢP CHỈ SỐ (STATS STRIP) ================= */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:px-6 bg-[#090d15] border-b border-white/5">
            {/* Tổng số trận */}
            <div className="bg-[#121724] border border-white/10 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center font-black text-lg">
                🎮
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Tổng Số Trận
                </span>
                <span className="text-lg font-black text-white font-headline">
                  {summary.totalMatches} <span className="text-xs font-normal text-slate-400">trận</span>
                </span>
              </div>
            </div>

            {/* Tỷ lệ thắng */}
            <div className="bg-[#121724] border border-white/10 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-black text-lg">
                🏆
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Tỷ Lệ Thắng
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-emerald-400 font-headline">
                    {summary.winRate}%
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({summary.wins} Thắng / {summary.losses} Thua)
                  </span>
                </div>
              </div>
            </div>

            {/* Phân bổ thứ hạng */}
            <div className="bg-[#121724] border border-white/10 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-black text-lg">
                🥇
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Số Lần Top 1
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-amber-300 font-headline">
                    {summary.rank1Count}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (Top 2: {summary.rank2Count} | Top 3: {summary.rank3Count})
                  </span>
                </div>
              </div>
            </div>

            {/* Điểm ELO & Chuỗi thắng */}
            <div className="bg-[#121724] border border-white/10 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-black text-lg">
                ⚡
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Điểm ELO Hiện Tại
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-purple-300 font-headline">
                    {summary.elo}
                  </span>
                  {summary.highestWinStreak > 0 && (
                    <span className="text-[10px] text-amber-400 font-bold">
                      🔥 Chuỗi {summary.highestWinStreak}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= BỘ LỌC TÌM KIẾM (FILTERS) ================= */}
        <div className="px-6 py-3 bg-[#0d121c] border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
          {/* Lọc kết quả: Tất cả / Thắng / Thua */}
          <div className="flex items-center gap-1.5 bg-[#141a26] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả ({matches.length})
            </button>
            <button
              onClick={() => setFilter('win')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filter === 'win'
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <span>🏆</span>
              <span>Chiến Thắng</span>
            </button>
            <button
              onClick={() => setFilter('loss')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filter === 'loss'
                  ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <span>💥</span>
              <span>Thất Bại</span>
            </button>
          </div>

          {/* Lọc chế độ: 1v1 / 3p / 4p */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-[11px] font-semibold text-slate-500">Chế độ:</span>
            <button
              onClick={() => setModeFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                modeFilter === 'all'
                  ? 'bg-white/15 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setModeFilter('1v1')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                modeFilter === '1v1'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Solo 1v1
            </button>
            <button
              onClick={() => setModeFilter('3p')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                modeFilter === '3p'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bàn 3 người
            </button>
            <button
              onClick={() => setModeFilter('4p')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                modeFilter === '4p'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bàn 4 người
            </button>
          </div>
        </div>

        {/* ================= DANH SÁCH TRẬN ĐẤU (SCROLLABLE LIST) ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-4xl text-cyan-400 animate-spin">
                progress_activity
              </span>
              <p className="text-sm text-slate-400">Đang tải lịch sử đấu từ MongoDB Atlas...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-3 shadow-inner">
                📭
              </div>
              <h3 className="text-base font-bold text-white mb-1">Chưa Có Ván Đấu Nào</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Bạn chưa tham gia trận đấu nào ở chế độ này. Hãy bắt đầu một trận mới để ghi danh vào sử sách!
              </p>
              {onPlayNow && (
                <button
                  onClick={() => {
                    onClose();
                    onPlayNow();
                  }}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all hover:scale-105 cursor-pointer"
                >
                  Tham Gia Trận Đấu Ngay 🚀
                </button>
              )}
            </div>
          ) : (
            matches.map((m, idx) => {
              const my = m.myResult || {};
              const isWin = my.isWin;
              const isExpanded = expandedMatchId === m._id;

              // Cấu hình theme theo thứ hạng
              let rankBadge = {
                title: 'TOP 1 - CHIẾN THẮNG',
                icon: '🥇',
                border: 'border-yellow-400/60',
                glow: 'shadow-[0_0_20px_rgba(250,204,21,0.15)]',
                bg: 'bg-gradient-to-r from-yellow-500/10 via-[#131926] to-[#121622]',
                textColor: 'text-yellow-300',
                tagBg: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40',
              };

              if (my.rank === 2) {
                rankBadge = {
                  title: 'HẠNG 2',
                  icon: '🥈',
                  border: 'border-slate-300/40',
                  glow: '',
                  bg: 'bg-gradient-to-r from-slate-400/10 via-[#131926] to-[#121622]',
                  textColor: 'text-slate-200',
                  tagBg: 'bg-slate-300/20 text-slate-200 border-slate-300/40',
                };
              } else if (my.rank === 3) {
                rankBadge = {
                  title: 'HẠNG 3',
                  icon: '🥉',
                  border: 'border-amber-600/40',
                  glow: '',
                  bg: 'bg-gradient-to-r from-amber-600/10 via-[#131926] to-[#121622]',
                  textColor: 'text-amber-400',
                  tagBg: 'bg-amber-600/20 text-amber-300 border-amber-600/40',
                };
              } else if (my.rank >= 4) {
                rankBadge = {
                  title: 'HẠNG 4 - THẤT BẠI',
                  icon: '💥',
                  border: 'border-rose-500/40',
                  glow: 'shadow-[0_0_20px_rgba(244,63,94,0.1)]',
                  bg: 'bg-gradient-to-r from-rose-500/10 via-[#131926] to-[#121622]',
                  textColor: 'text-rose-400',
                  tagBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                };
              }

              // Mode label
              const modeLabel =
                m.mode === '1v1'
                  ? '⚡ Solo 1v1'
                  : m.mode === '3p'
                  ? '👥 Bàn 3 Người'
                  : '🛡️ Bàn 4 Người (Chuẩn)';

              return (
                <div
                  key={m._id || idx}
                  className={`border rounded-2xl transition-all duration-200 overflow-hidden ${rankBadge.border} ${rankBadge.bg} ${rankBadge.glow} hover:border-cyan-400/40`}
                >
                  {/* Dòng tóm tắt chính */}
                  <div className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Cột 1: Huy hiệu kết quả & Thời gian */}
                    <div className="flex items-center gap-3.5 min-w-[200px]">
                      <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                        {rankBadge.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black uppercase font-headline tracking-wider ${rankBadge.textColor}`}>
                            {rankBadge.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{modeLabel}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(m.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cột 2: Đối thủ trong bàn & Lý do kết thúc */}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Người cùng chơi:
                        </span>
                        <div className="flex items-center -space-x-1.5">
                          {m.players &&
                            m.players.map((p, pIdx) => (
                              <div
                                key={pIdx}
                                title={`${p.name} (Hạng ${p.rank})`}
                                className="w-6 h-6 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-xs shadow-sm overflow-hidden"
                              >
                                {p.avatar && p.avatar.startsWith('http') ? (
                                  <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{p.avatar || '👤'}</span>
                                )}
                              </div>
                            ))}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          ({m.players?.length || 4} đấu thủ)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="material-symbols-outlined text-xs text-slate-400">
                          schedule
                        </span>
                        <span>Thời lượng: <strong>{formatDuration(m.durationSeconds)}</strong></span>
                        <span>•</span>
                        <span>
                          {m.reason === 'timeout'
                            ? '⏱️ Hết 5 phút (Xét điểm bài)'
                            : '🏁 Đánh hết bài'}
                        </span>
                      </div>
                    </div>

                    {/* Cột 3: Biến động ELO & Tiền thưởng */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 min-w-[210px] pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      {/* ELO Delta */}
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">
                            Rank ELO:
                          </span>
                          <span
                            className={`font-black font-headline text-base ${
                              my.eloDelta > 0
                                ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                                : my.eloDelta < 0
                                ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                                : 'text-slate-400'
                            }`}
                          >
                            {my.eloDelta > 0 ? `+${my.eloDelta}` : my.eloDelta} ELO
                          </span>
                        </div>
                        <div className="flex items-center gap-2 justify-end text-[10px] text-slate-400 mt-0.5">
                          {my.coinsDelta > 0 && (
                            <span className="text-amber-300 font-bold">
                              +{my.coinsDelta} 🪙
                            </span>
                          )}
                          {my.expDelta > 0 && (
                            <span className="text-cyan-300 font-bold">
                              +{my.expDelta} EXP
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Nút Xem Chi Tiết Accordion */}
                      <button
                        onClick={() => toggleExpand(m._id)}
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                          isExpanded
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 rotate-180'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                        title="Xem chi tiết các người chơi trong ván"
                      >
                        <span className="material-symbols-outlined text-sm">
                          keyboard_arrow_down
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* ================= ACCORDION CHI TIẾT TỪNG NGƯỜI CHƠI ================= */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-white/10 bg-[#0a0e16]/80 animate-in fade-in duration-150">
                      <div className="text-[11px] font-bold uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-cyan-400">
                          groups
                        </span>
                        <span>Bảng Tổng Kết Ván Đấu:</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                        {m.players &&
                          m.players.map((p, pIdx) => {
                            const isMe = p.isHuman || p.id === 'player';
                            return (
                              <div
                                key={pIdx}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                                  isMe
                                    ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-200'
                                    : 'bg-white/5 border-white/5 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-xs flex-shrink-0 overflow-hidden">
                                    {p.avatar && p.avatar.startsWith('http') ? (
                                      <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{p.avatar || '👤'}</span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold truncate">
                                      {p.name} {isMe && '(Bạn)'}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      Còn: <strong>{p.cardsRemaining || 0} lá</strong>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                  <div className="text-[11px] font-black text-amber-300">
                                    Hạng {p.rank}
                                  </div>
                                  <div
                                    className={`text-[10px] font-bold ${
                                      p.eloDelta > 0
                                        ? 'text-emerald-400'
                                        : p.eloDelta < 0
                                        ? 'text-rose-400'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {p.eloDelta > 0 ? `+${p.eloDelta}` : p.eloDelta} ELO
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#0c101a] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Đồng bộ thời gian thực với Cloud Database</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all cursor-pointer border border-white/10"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
