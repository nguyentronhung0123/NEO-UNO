import React, { useState, useEffect, useMemo } from 'react';
import { AvatarFrame } from './AvatarFrame';
import { profileApi } from '../apis/profileApi';
import { soundEngine } from '../utils/audioFx';

/**
 * 6 Trục Radar Phân Tích Kỹ Năng Đấu Thủ
 */
const RADAR_AXES = [
  { key: 'winRate', label: 'Tỷ Lệ Thắng', icon: '🎯', desc: 'Khả năng kết liễu ván đấu & tỷ lệ win' },
  { key: 'aggression', label: 'Công Phạt', icon: '⚔️', desc: 'Độ gắt của lá +2, +4, Skip và đổi màu' },
  { key: 'speed', label: 'Tốc Độ / APM', icon: '⚡', desc: 'Phản xạ ra bài & độ nhanh nhạy hô UNO' },
  { key: 'defense', label: 'Phòng Thủ', icon: '🛡️', desc: 'Khả năng chặn chuỗi phạt & sinh tồn' },
  { key: 'synergy', label: 'Đồng Đội', icon: '🤝', desc: 'Phối hợp Tag-Team 2v2 & hoạt động Bang' },
  { key: 'comeback', label: 'Lật Kèo', icon: '🔥', desc: 'Bản lĩnh lội ngược dòng từ thế hiểm' },
];

export function CareerProfileModal({ isOpen, onClose, user, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'titles' | 'shareCard'
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [equippingId, setEquippingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedCard, setCopiedCard] = useState(false);

  // Tải dữ liệu hồ sơ từ API
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    const targetUserId = user?._id || user?.id || 'guest_user';
    profileApi.getProfile(targetUserId).then((res) => {
      if (isMounted) {
        if (res && res.success) {
          setProfileData(res);
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  // Phím Escape đóng Modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Trang bị danh hiệu
  const handleEquipTitle = async (title) => {
    if (equippingId || title.isEquipped || !title.isUnlocked) return;
    try {
      soundEngine.playCardSlide();
      setEquippingId(title.id);
      const targetUserId = user?._id || user?.id;
      const res = await profileApi.equipTitle({ titleId: title.id, userId: targetUserId });

      if (res && res.success) {
        soundEngine.playUnoChime();
        showToast(`✨ Đã trang bị danh hiệu: [${title.name}]`);

        // Cập nhật state nội bộ
        setProfileData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            user: { ...prev.user, equippedTitle: title.name },
            titles: prev.titles.map((t) => ({
              ...t,
              isEquipped: t.id === title.id,
            })),
          };
        });

        // Đồng bộ lên Lobby / Parent Component
        if (onUpdateUser) {
          onUpdateUser({ equippedTitle: title.name });
        }
      } else {
        showToast(`❌ ${res?.message || 'Không thể trang bị danh hiệu'}`);
      }
    } catch {
      showToast('❌ Đã xảy ra lỗi khi trang bị danh hiệu!');
    } finally {
      setEquippingId(null);
    }
  };

  // Tính tọa độ Radar SVG (Bán kính R=90, Tâm cx=140, cy=140)
  const radarSvgPoints = useMemo(() => {
    const radar = profileData?.radar || {
      winRate: 50,
      aggression: 50,
      speed: 50,
      defense: 50,
      synergy: 50,
      comeback: 50,
    };
    const cx = 140;
    const cy = 140;
    const R = 85;

    const dataPoints = RADAR_AXES.map((axis, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 6;
      const val = Math.max(15, Math.min(100, radar[axis.key] || 50)) / 100;
      const x = cx + R * val * Math.cos(angle);
      const y = cy + R * val * Math.sin(angle);
      return { x, y, val: radar[axis.key] || 50, angle };
    });

    const polygonStr = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    // Grid concentric polygons (levels: 0.25, 0.5, 0.75, 1.0)
    const gridLevels = [0.25, 0.5, 0.75, 1.0].map((level) => {
      const pts = RADAR_AXES.map((_, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 6;
        const x = cx + R * level * Math.cos(angle);
        const y = cy + R * level * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      return pts;
    });

    return { cx, cy, R, dataPoints, polygonStr, gridLevels };
  }, [profileData]);

  // Sao chép Thẻ Căn Cước Số Cyberpunk
  const handleCopyCard = () => {
    if (!profileData) return;
    try {
      soundEngine.playCardSlide();
      const u = profileData.user;
      const r = profileData.radar;
      const s = profileData.stats;
      const rank = profileData.rank;

      const cardText = `
╔══════════════════════════════════════════════╗
║        NEO UNO - HỒ SƠ SỰ NGHIỆP CYBER       ║
╠══════════════════════════════════════════════╣
  👤 Đấu Thủ: ${u.nickname}
  🏷️ Mã Căn Cước: #${u.accountId}
  🎖️ Danh Hiệu: [${u.equippedTitle || 'Tân Thủ Cyber'}]
  🛡️ Quân Đoàn: ${u.guild?.tag ? `[${u.guild.tag}] ${u.guild.name}` : 'Tự Do'}
  🏆 Hạng Rank: ${rank.badge} ${rank.name} (${u.elo} ELO)
  ⭐ Cấp Độ: Lv.${u.level} | 🪙 Số Dư: ${(u.coins || 0).toLocaleString()} Vàng
  ──────────── CHỈ SỐ RADAR 6 TRỤC ────────────
  🎯 Tỷ Lệ Thắng : ${r.winRate}/100
  ⚔️ Công Phạt     : ${r.aggression}/100
  ⚡ Tốc Độ APM    : ${r.speed}/100
  🛡️ Phòng Thủ    : ${r.defense}/100
  🤝 Đồng Đội      : ${r.synergy}/100
  🔥 Lật Kèo       : ${r.comeback}/100
  💥 Lực Chiến Tổng: ${r.overallPower} PTS
  ──────────── THỐNG KÊ CHIẾN TÍCH ────────────
  📊 Tổng Trận: ${s.totalMatches} | 🏆 Thắng: ${s.wins} (${s.winRate}%)
  ⚡ Chuỗi Thắng Max: ${s.highestWinStreak} trận
  👑 Cúp Vô Địch Tournament: ${u.tournamentsWon || 0} Cúp
  🃏 Thẻ Bài Đã Đánh: ${s.totalCardsPlayed} | 📢 UNO Hô: ${s.unoCallsSuccess}
╚══════════════════════════════════════════════╝
Trải nghiệm ngay tại: https://neo-uno.vercel.app
`.trim();

      navigator.clipboard.writeText(cardText).then(() => {
        setCopiedCard(true);
        soundEngine.playUnoChime();
        showToast('📋 Đã sao chép Thẻ Đấu Thủ vào Clipboard!');
        setTimeout(() => setCopiedCard(false), 3000);
      });
    } catch {
      showToast('❌ Không thể sao chép thẻ');
    }
  };

  if (!isOpen) return null;

  const displayUser = profileData?.user || user || {};
  const stats = profileData?.stats || {};
  const radar = profileData?.radar || {
    winRate: 50,
    aggression: 50,
    speed: 50,
    defense: 50,
    synergy: 50,
    comeback: 50,
    overallPower: 50,
  };
  const rank = profileData?.rank || { name: 'Tập Sự Cyber', badge: '🔰', color: '#10b981' };
  const titles = profileData?.titles || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      style={{ overscrollBehavior: 'contain' }}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-gradient-to-b from-[#131b2e] via-[#0d121f] to-[#0a0d17] border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.18)] overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER: HOLOGRAPHIC CYBER ID CARD ================= */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-cyan-950/60 via-purple-950/40 to-slate-950/80 border-b border-cyan-500/20 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          {/* Nền hiệu ứng vi mạch / scan line */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Avatar + Khung Viền + Tên & Danh Hiệu */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left z-10 min-w-0">
            <div className="relative shrink-0">
              <AvatarFrame frameId={displayUser.equippedAvatarFrame || 'frame_default'} size="xl">
                <img
                  src={
                    displayUser.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${displayUser.nickname || 'Player'}`
                  }
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </AvatarFrame>
              <span
                className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-black border shadow-lg"
                style={{
                  backgroundColor: `${rank.color}22`,
                  borderColor: rank.color,
                  color: rank.color,
                }}
              >
                Lv.{displayUser.level || 1}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black font-headline tracking-wide truncate text-white drop-shadow">
                  {displayUser.nickname || 'Đấu Thủ NEO'}
                </h2>
                {displayUser.guild?.tag && (
                  <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-mono font-black">
                    [{displayUser.guild.tag}]
                  </span>
                )}
              </div>

              {/* Danh Hiệu Đang Trang Bị */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-amber-500/20 border border-cyan-400/40 text-xs font-black text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.2)]">
                  <span>🎖️</span>
                  <span>{displayUser.equippedTitle || 'Tân Thủ Cyber'}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  #{displayUser.accountId || 'NEO_CYBER'}
                </span>
              </div>

              {/* Hạng Rank & ELO */}
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 text-xs">
                <span className="flex items-center gap-1 font-bold" style={{ color: rank.color }}>
                  <span>{rank.badge}</span>
                  <span>{rank.name}</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-mono font-bold text-cyan-300">
                  ⚡ {displayUser.elo || 1000} ELO
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-amber-300">
                  🪙 {(displayUser.coins ?? 1000).toLocaleString()} Vàng
                </span>
              </div>
            </div>
          </div>

          {/* Lực Chiến Tổng Hợp & Nút Đóng */}
          <div className="flex items-center gap-4 z-10">
            <div className="flex flex-col items-center sm:items-end bg-black/40 border border-cyan-500/30 px-3.5 py-2 rounded-2xl">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                Lực Chiến Esports
              </span>
              <div className="flex items-center gap-1 text-2xl font-black font-headline text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                <span>💥</span>
                <span>{radar.overallPower}</span>
                <span className="text-xs text-cyan-200 font-sans font-medium">PTS</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer"
              title="Đóng cửa sổ (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ================= TAB NAVIGATION ================= */}
        <div className="flex items-center border-b border-white/10 bg-[#0d1322] px-5 gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              soundEngine.playCardSlide();
              setActiveTab('radar');
            }}
            className={`py-3 px-4 font-headline text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'radar'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>📊</span>
            <span>Biểu Đồ Radar & Lực Chiến</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playCardSlide();
              setActiveTab('titles');
            }}
            className={`py-3 px-4 font-headline text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'titles'
                ? 'border-purple-400 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>🎖️</span>
            <span>Kho Danh Hiệu Cyber</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold">
              {titles.filter((t) => t.isUnlocked).length}/{titles.length}
            </span>
          </button>

          <button
            onClick={() => {
              soundEngine.playCardSlide();
              setActiveTab('shareCard');
            }}
            className={`py-3 px-4 font-headline text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'shareCard'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>🪪</span>
            <span>Thẻ Căn Cước Số</span>
          </button>
        </div>

        {/* ================= MAIN CONTENT BODY ================= */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
              <div className="w-10 h-10 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
              <span className="font-headline font-bold text-sm tracking-wide">
                Đang quét dữ liệu sự nghiệp & phân tích 6 trục...
              </span>
            </div>
          ) : (
            <>
              {/* TAB 1: RADAR & STATS */}
              {activeTab === 'radar' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* CỘT TRÁI: BIỂU ĐỒ RADAR 6 TRỤC SVG CHUẨN XÁC */}
                  <div className="lg:col-span-6 flex flex-col items-center bg-[#0e1526]/80 p-5 rounded-3xl border border-cyan-500/20 relative shadow-inner">
                    <div className="text-center mb-3">
                      <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold">
                        PHÂN TÍCH KỸ NĂNG ĐẤU THỦ 6 TRỤC
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Đánh giá toàn diện dựa trên phong cách thi đấu thực chiến
                      </p>
                    </div>

                    <div className="relative w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] flex items-center justify-center">
                      <svg
                        className="w-full h-full overflow-visible"
                        viewBox="0 0 280 280"
                        style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.3))' }}
                      >
                        {/* Lưới đa giác đồng tâm */}
                        {radarSvgPoints.gridLevels.map((pts, idx) => (
                          <polygon
                            key={idx}
                            points={pts}
                            fill={idx % 2 === 0 ? 'rgba(6, 182, 212, 0.04)' : 'transparent'}
                            stroke="rgba(6, 182, 212, 0.2)"
                            strokeWidth="1"
                            strokeDasharray={idx === 3 ? 'none' : '2,2'}
                          />
                        ))}

                        {/* Các đường nan hoa từ tâm ra 6 đỉnh */}
                        {RADAR_AXES.map((_, i) => {
                          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 6;
                          const x2 = radarSvgPoints.cx + radarSvgPoints.R * Math.cos(angle);
                          const y2 = radarSvgPoints.cy + radarSvgPoints.R * Math.sin(angle);
                          return (
                            <line
                              key={i}
                              x1={radarSvgPoints.cx}
                              y1={radarSvgPoints.cy}
                              x2={x2}
                              y2={y2}
                              stroke="rgba(6, 182, 212, 0.25)"
                              strokeWidth="1"
                            />
                          );
                        })}

                        {/* Đa giác Dữ liệu Người Chơi (Glowing Data Polygon) */}
                        <polygon
                          points={radarSvgPoints.polygonStr}
                          fill="rgba(6, 182, 212, 0.35)"
                          stroke="#22d3ee"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />

                        {/* Các điểm mốc vertex pulsing */}
                        {radarSvgPoints.dataPoints.map((pt, i) => (
                          <g key={i}>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="4.5"
                              fill="#22d3ee"
                              stroke="#ffffff"
                              strokeWidth="2"
                              className="animate-pulse"
                            />
                          </g>
                        ))}

                        {/* Nhãn văn bản 6 trục */}
                        {RADAR_AXES.map((axis, i) => {
                          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 6;
                          const labelRadius = radarSvgPoints.R + 28;
                          const lx = radarSvgPoints.cx + labelRadius * Math.cos(angle);
                          const ly = radarSvgPoints.cy + labelRadius * Math.sin(angle);
                          const score = radar[axis.key] || 50;

                          return (
                            <g key={i} transform={`translate(${lx}, ${ly})`}>
                              <text
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-[10px] font-mono font-black fill-cyan-300 drop-shadow"
                              >
                                {axis.icon} {score}
                              </text>
                              <text
                                y="11"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-[9px] font-sans fill-slate-400"
                              >
                                {axis.label}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Chi tiết 6 tiêu chí thu nhỏ */}
                    <div className="grid grid-cols-2 gap-2 w-full mt-4 pt-3 border-t border-white/5">
                      {RADAR_AXES.map((ax) => (
                        <div
                          key={ax.key}
                          className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/5 text-xs"
                        >
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <span>{ax.icon}</span>
                            <span className="font-semibold">{ax.label}</span>
                          </span>
                          <span className="font-mono font-black text-cyan-400">
                            {radar[ax.key] || 50}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CỘT PHẢI: LƯỚI THỐNG KÊ CHIẾN TÍCH SỰ NGHIỆP */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">
                        BẢNG CHIẾN TÍCH TRỌN ĐỜI
                      </span>
                      <span className="text-xs text-slate-400">
                        Cập nhật theo thời gian thực
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {/* Thẻ 1: Tổng số trận */}
                      <div className="bg-[#11192e] border border-cyan-500/20 p-3.5 rounded-2xl flex flex-col justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Tổng Ván Đấu</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-black font-headline text-white">
                            {stats.totalMatches || 0}
                          </span>
                          <span className="text-xs text-slate-400">trận</span>
                        </div>
                        <span className="text-[10px] text-cyan-400 mt-1 font-mono">
                          ⚔️ Chiến trường NEO
                        </span>
                      </div>

                      {/* Thẻ 2: Số trận thắng */}
                      <div className="bg-[#11192e] border border-emerald-500/20 p-3.5 rounded-2xl flex flex-col justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Trận Thắng</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-black font-headline text-emerald-400">
                            {stats.wins || 0}
                          </span>
                          <span className="text-xs text-slate-400">trận</span>
                        </div>
                        <span className="text-[10px] text-emerald-300 mt-1 font-mono">
                          🏆 Tỷ lệ: {stats.winRate || 0}%
                        </span>
                      </div>

                      {/* Thẻ 3: Chuỗi thắng đỉnh cao */}
                      <div className="bg-[#11192e] border border-amber-500/20 p-3.5 rounded-2xl flex flex-col justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Chuỗi Thắng Max</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-black font-headline text-amber-400">
                            {stats.highestWinStreak || 0}
                          </span>
                          <span className="text-xs text-slate-400">liên tiếp</span>
                        </div>
                        <span className="text-[10px] text-amber-300 mt-1 font-mono">
                          🔥 Hiện tại: {stats.winStreak || 0}
                        </span>
                      </div>

                      {/* Thẻ 4: Cúp Tournament */}
                      <div className="bg-[#11192e] border border-fuchsia-500/20 p-3.5 rounded-2xl flex flex-col justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Cúp Knockout</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-black font-headline text-fuchsia-400">
                            {displayUser.tournamentsWon || 0}
                          </span>
                          <span className="text-xs text-slate-400">cúp</span>
                        </div>
                        <span className="text-[10px] text-fuchsia-300 mt-1 font-mono">
                          👑 Vô địch 8 người
                        </span>
                      </div>

                      {/* Thẻ 5: Lá bài đã đánh */}
                      <div className="bg-[#11192e] border border-blue-500/20 p-3.5 rounded-2xl flex flex-col justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Thẻ Bài Đã Ra</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-black font-headline text-blue-400">
                            {stats.totalCardsPlayed || 0}
                          </span>
                          <span className="text-xs text-slate-400">lá</span>
                        </div>
                        <span className="text-[10px] text-blue-300 mt-1 font-mono">
                          🃏 Mật độ thực chiến
                        </span>
                      </div>

                      {/* Thẻ 6: Lần hô UNO thành công */}
                      <div className="bg-[#11192e] border border-purple-500/20 p-3.5 rounded-2xl flex flex-col justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">Hô UNO Chuẩn</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-black font-headline text-purple-400">
                            {stats.unoCallsSuccess || 0}
                          </span>
                          <span className="text-xs text-slate-400">lần</span>
                        </div>
                        <span className="text-[10px] text-purple-300 mt-1 font-mono">
                          📢 Phản xạ tức thì
                        </span>
                      </div>
                    </div>

                    {/* Thẻ Cúp Vô Địch Sở Hữu */}
                    {displayUser.tournamentCups && displayUser.tournamentCups.length > 0 && (
                      <div className="bg-[#11192e]/60 border border-fuchsia-500/30 p-3.5 rounded-2xl">
                        <span className="text-[11px] uppercase font-mono font-bold text-fuchsia-300 block mb-2">
                          🏆 Bộ Sưu Tập Cúp Vô Địch Tournament
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {displayUser.tournamentCups.map((cup, cIdx) => (
                            <span
                              key={cIdx}
                              className="px-2.5 py-1 rounded-xl bg-fuchsia-950/40 border border-fuchsia-500/40 text-xs text-fuchsia-200 font-semibold flex items-center gap-1.5"
                            >
                              <span>🏆</span>
                              <span>{cup}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: KHO DANH HIỆU CYBER */}
              {activeTab === 'titles' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-headline font-bold text-base text-white">
                        Kho Danh Hiệu Cyberpunk
                      </h3>
                      <p className="text-xs text-slate-400">
                        Mở khóa qua giải đấu Tournament, Bang Hội, chuỗi thắng và Sổ Sứ Mệnh
                      </p>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 rounded-xl">
                      Đang dùng: <strong>[{displayUser.equippedTitle || 'Tân Thủ Cyber'}]</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {titles.map((title) => {
                      const isEquipped = title.isEquipped;
                      const isUnlocked = title.isUnlocked;

                      return (
                        <div
                          key={title.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                            isEquipped
                              ? 'bg-gradient-to-r from-cyan-950/40 to-purple-950/40 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                              : isUnlocked
                              ? 'bg-[#12192c] hover:bg-[#162138] border-white/10 hover:border-cyan-500/40'
                              : 'bg-[#0a0d16]/70 border-white/5 opacity-60'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{title.badge}</span>
                                <div>
                                  <h4 className="font-headline font-black text-sm text-white flex items-center gap-2">
                                    <span>{title.name}</span>
                                    {isEquipped && (
                                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold uppercase tracking-wider">
                                        Đang Dùng
                                      </span>
                                    )}
                                  </h4>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {title.id}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-slate-300 mt-2">
                              {title.description}
                            </p>

                            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-300/90 font-medium">
                              <span>🎯</span>
                              <span>{title.requirement}</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                            <span className="text-xs font-mono font-bold">
                              {isUnlocked ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <span>✔</span> Đã Mở Khóa
                                </span>
                              ) : (
                                <span className="text-rose-400/80 flex items-center gap-1">
                                  <span>🔒</span> Chưa Mở Khóa
                                </span>
                              )}
                            </span>

                            <button
                              onClick={() => handleEquipTitle(title)}
                              disabled={!isUnlocked || isEquipped || equippingId === title.id}
                              className={`px-3 py-1.5 rounded-xl font-headline font-bold text-xs transition-all cursor-pointer ${
                                isEquipped
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 cursor-default'
                                  : isUnlocked
                                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-md hover:scale-105 active:scale-95'
                                  : 'bg-white/5 text-slate-400 cursor-not-allowed border border-white/5'
                              }`}
                            >
                              {equippingId === title.id
                                ? 'Đang Đổi...'
                                : isEquipped
                                ? 'Đang Dùng'
                                : isUnlocked
                                ? 'Trang Bị'
                                : 'Bị Khóa'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: THẺ CĂN CƯỚC SỐ (SHARE CARD) */}
              {activeTab === 'shareCard' && (
                <div className="flex flex-col items-center justify-center space-y-6 py-4">
                  <div className="text-center max-w-md">
                    <h3 className="font-headline font-black text-lg text-white">
                      Thẻ Căn Cước Đấu Thủ Cyberpunk
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Chia sẻ thành tích và chỉ số Radar của bạn lên Discord, Telegram, Zalo hoặc Facebook!
                    </p>
                  </div>

                  {/* THẺ PREVIEW SẮC NÉT */}
                  <div className="relative w-full max-w-md p-6 rounded-3xl bg-gradient-to-br from-[#12192d] via-[#0d1220] to-[#070a13] border-2 border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.25)] overflow-hidden">
                    {/* Hiệu ứng tia sáng Hologram */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-4">
                      {/* Brand Bar */}
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎴</span>
                          <span className="font-headline font-black text-sm text-cyan-300 tracking-wider">
                            NEO UNO CYBER CARD
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-bold">
                          #{displayUser.accountId || 'NEO_ID'}
                        </span>
                      </div>

                      {/* Thông tin chính */}
                      <div className="flex items-center gap-4">
                        <AvatarFrame frameId={displayUser.equippedAvatarFrame || 'frame_default'} size="lg">
                          <img
                            src={
                              displayUser.avatar ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${displayUser.nickname || 'Player'}`
                            }
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        </AvatarFrame>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-headline font-black text-lg text-white truncate">
                            {displayUser.nickname || 'Đấu Thủ NEO'}
                          </h4>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[11px] font-black text-cyan-300 mt-1">
                            <span>🎖️</span>
                            <span>{displayUser.equippedTitle || 'Tân Thủ Cyber'}</span>
                          </div>
                          <div className="text-xs text-amber-300 font-bold mt-1">
                            {rank.badge} {rank.name} • {displayUser.elo || 1000} ELO
                          </div>
                        </div>
                      </div>

                      {/* Tóm tắt 6 Radar */}
                      <div className="bg-black/40 p-3 rounded-2xl border border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/5 font-mono">
                          <span className="text-slate-400">💥 LỰC CHIẾN ESPORTS</span>
                          <span className="font-black text-cyan-300 text-sm">{radar.overallPower} PTS</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono pt-1 text-slate-300">
                          <div>🎯 Thắng: <strong className="text-cyan-400">{radar.winRate}</strong></div>
                          <div>⚔️ Phạt: <strong className="text-amber-400">{radar.aggression}</strong></div>
                          <div>⚡ APM: <strong className="text-yellow-400">{radar.speed}</strong></div>
                          <div>🛡️ Thủ: <strong className="text-emerald-400">{radar.defense}</strong></div>
                          <div>🤝 Đội: <strong className="text-blue-400">{radar.synergy}</strong></div>
                          <div>🔥 Lật: <strong className="text-purple-400">{radar.comeback}</strong></div>
                        </div>
                      </div>

                      {/* Footer thẻ */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-white/5">
                        <span>Trận: {stats.totalMatches || 0} ({stats.winRate || 0}% Win)</span>
                        <span>Cúp: {displayUser.tournamentsWon || 0} 🏆</span>
                      </div>
                    </div>
                  </div>

                  {/* Nút Sao Chép Thẻ */}
                  <button
                    onClick={handleCopyCard}
                    className="py-3 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-headline font-black text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span>{copiedCard ? '✔' : '📋'}</span>
                    <span>{copiedCard ? 'Đã Sao Chép Thẻ Thành Công!' : 'Sao Chép Thẻ Đấu Thủ'}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* TOAST THÔNG BÁO TỨC THỜI */}
        {toastMessage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/90 border border-cyan-400 text-cyan-300 font-headline font-bold text-xs shadow-2xl backdrop-blur-md animate-bounce">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(CareerProfileModal);
