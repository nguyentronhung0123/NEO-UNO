import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../apis/adminApi';
import MatchReplayModal from './MatchReplayModal';

export default function AdminSecurityModal({ isOpen, onClose, currentUser }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, users, logs, reports

  // 1. Dashboard State
  const [dashboardStats, setDashboardStats] = useState(null);
  const [serverMetrics, setServerMetrics] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // 2. Users Management State
  const [usersList, setUsersList] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all'); // all, banned, flagged, admin, player
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // User Action Modals State
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState(null); // 'ban', 'adjust', 'role'
  const [banReasonInput, setBanReasonInput] = useState('');
  const [coinAdjustmentInput, setCoinAdjustmentInput] = useState('');
  const [eloAdjustmentInput, setEloAdjustmentInput] = useState('');
  const [adjustReasonInput, setAdjustReasonInput] = useState('');
  const [roleSelectInput, setRoleSelectInput] = useState('player');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // 3. Security Audit Logs State
  const [logsList, setLogsList] = useState([]);
  const [logsPagination, setLogsPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [logSeverityFilter, setLogSeverityFilter] = useState('all');
  const [logActionFilter, setLogActionFilter] = useState('all');
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  // 4. Player Reports State (Task 3 - Tuần 4)
  const [reportsList, setReportsList] = useState([]);
  const [reportsPagination, setReportsPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [reportStatusFilter, setReportStatusFilter] = useState('all');
  const [reportReasonFilter, setReportReasonFilter] = useState('all');
  const [isReportsLoading, setIsReportsLoading] = useState(false);

  // Sub-modal Report Resolution State
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolveAction, setResolveAction] = useState('deduct_elo'); // 'none', 'warning', 'deduct_elo', 'temp_ban', 'perm_ban'
  const [resolvePenaltyInput, setResolvePenaltyInput] = useState('50');
  const [resolveNotesInput, setResolveNotesInput] = useState('');
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);
  const [resolveMessage, setResolveMessage] = useState(null);
  const [socReplayMatchId, setSocReplayMatchId] = useState(null);

  // Load Dashboard Data & Real-time Metrics (Task 4)
  const loadDashboard = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const [statsRes, metricsRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getServerMetrics(),
      ]);
      if (statsRes && statsRes.success) {
        setDashboardStats(statsRes.stats);
        setRecentLogs(statsRes.recentLogs || []);
      }
      if (metricsRes && metricsRes.success) {
        setServerMetrics(metricsRes);
      }
    } catch (err) {
      console.warn('[AdminSecurityModal] loadDashboard error:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Load Users Data
  const loadUsers = useCallback(async (page = 1) => {
    setIsUsersLoading(true);
    const res = await adminApi.getUsers({
      page,
      limit: 10,
      search: userSearch,
      filter: userFilter,
    });
    if (res && res.success) {
      setUsersList(res.users || []);
      setUsersPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    }
    setIsUsersLoading(false);
  }, [userSearch, userFilter]);

  // Load Logs Data
  const loadLogs = useCallback(async (page = 1) => {
    setIsLogsLoading(true);
    const res = await adminApi.getSecurityLogs({
      page,
      limit: 15,
      severity: logSeverityFilter,
      action: logActionFilter,
    });
    if (res && res.success) {
      setLogsList(res.logs || []);
      setLogsPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    }
    setIsLogsLoading(false);
  }, [logSeverityFilter, logActionFilter]);

  // Load Reports Data (Task 3 - Tuần 4)
  const loadReports = useCallback(async (page = 1) => {
    setIsReportsLoading(true);
    const res = await adminApi.getReports({
      page,
      limit: 10,
      status: reportStatusFilter,
      reason: reportReasonFilter,
    });
    if (res && res.success) {
      setReportsList(res.reports || []);
      setReportsPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    }
    setIsReportsLoading(false);
  }, [reportStatusFilter, reportReasonFilter]);

  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === 'dashboard') {
      loadDashboard();
    } else if (activeTab === 'users') {
      loadUsers(1);
    } else if (activeTab === 'logs') {
      loadLogs(1);
    } else if (activeTab === 'reports') {
      loadReports(1);
    }
  }, [isOpen, activeTab, loadDashboard, loadUsers, loadLogs, loadReports]);

  // Xử lý Giải quyết Tố cáo Vi phạm (Task 3 - Tuần 4)
  const handleConfirmResolve = async () => {
    if (!selectedReport) return;
    setIsSubmittingResolve(true);
    setResolveMessage(null);
    const res = await adminApi.resolveReport(selectedReport._id, {
      action: resolveAction,
      penaltyAmount: parseInt(resolvePenaltyInput) || 0,
      notes: resolveNotesInput.trim(),
    });
    setIsSubmittingResolve(false);
    if (res && res.success) {
      setResolveMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        setResolveMessage(null);
        setSelectedReport(null);
        loadReports(reportsPagination.page);
        loadDashboard();
      }, 1200);
    } else {
      setResolveMessage({ type: 'error', text: res?.message || 'Lỗi khi xử lý tố cáo!' });
    }
  };

  if (!isOpen) return null;

  // Xử lý Khóa tài khoản
  const handleConfirmBan = async () => {
    if (!selectedUser) return;
    setIsSubmittingAction(true);
    const res = await adminApi.banUser({
      userId: selectedUser._id,
      reason: banReasonInput.trim() || 'Vi phạm điều khoản an toàn và chống gian lận',
    });
    setIsSubmittingAction(false);
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        setActionMessage(null);
        setSelectedUser(null);
        setActionType(null);
        loadUsers(usersPagination.page);
        loadDashboard();
      }, 1200);
    } else {
      setActionMessage({ type: 'error', text: res.message || 'Lỗi khi khóa tài khoản!' });
    }
  };

  // Xử lý Mở khóa tài khoản
  const handleQuickUnban = async (u) => {
    if (!confirm(`Bạn có chắc chắn muốn MỞ KHÓA cho tài khoản [${u.nickname}]?`)) return;
    const res = await adminApi.unbanUser({ userId: u._id });
    if (res.success) {
      loadUsers(usersPagination.page);
      loadDashboard();
    } else {
      alert(res.message || 'Lỗi khi mở khóa tài khoản!');
    }
  };

  // Xử lý Điều chỉnh số dư
  const handleConfirmAdjust = async () => {
    if (!selectedUser) return;
    setIsSubmittingAction(true);
    const res = await adminApi.adjustBalance({
      userId: selectedUser._id,
      coinAdjustment: coinAdjustmentInput ? parseInt(coinAdjustmentInput) : 0,
      eloAdjustment: eloAdjustmentInput ? parseInt(eloAdjustmentInput) : 0,
      reason: adjustReasonInput.trim() || 'Quản trị viên điều chỉnh thủ công',
    });
    setIsSubmittingAction(false);
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        setActionMessage(null);
        setSelectedUser(null);
        setActionType(null);
        setCoinAdjustmentInput('');
        setEloAdjustmentInput('');
        setAdjustReasonInput('');
        loadUsers(usersPagination.page);
        loadDashboard();
      }, 1200);
    } else {
      setActionMessage({ type: 'error', text: res.message || 'Lỗi khi điều chỉnh số dư!' });
    }
  };

  // Xử lý Phân quyền vai trò
  const handleConfirmRole = async () => {
    if (!selectedUser) return;
    setIsSubmittingAction(true);
    const res = await adminApi.setUserRole({
      userId: selectedUser._id,
      role: roleSelectInput,
    });
    setIsSubmittingAction(false);
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        setActionMessage(null);
        setSelectedUser(null);
        setActionType(null);
        loadUsers(usersPagination.page);
      }, 1200);
    } else {
      setActionMessage({ type: 'error', text: res.message || 'Lỗi khi đổi quyền!' });
    }
  };

  // Xử lý Gỡ cờ cảnh báo
  const handleQuickClearFlag = async (u) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa cờ cảnh báo nghi vấn cho [${u.nickname}]?`)) return;
    const res = await adminApi.clearUserFlag({ userId: u._id });
    if (res.success) {
      loadUsers(usersPagination.page);
      loadDashboard();
    } else {
      alert(res.message || 'Lỗi khi xóa cờ cảnh báo!');
    }
  };

  const threatColor =
    dashboardStats?.threatLevel === 'HIGH'
      ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
      : dashboardStats?.threatLevel === 'MEDIUM'
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-body">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0b0f19] border-2 border-cyan-500/50 rounded-3xl shadow-[0_0_80px_rgba(0,210,255,0.25)] overflow-hidden">
        
        {/* ================= MODAL HEADER ================= */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#12192c] via-[#0d1424] to-[#12192c] border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-400/50 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,210,255,0.4)]">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-headline font-black text-lg sm:text-xl text-white tracking-wide uppercase">
                  HỆ QUẢN TRỊ BẢO MẬT & CHỐNG GIAN LẬN
                </h3>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${threatColor}`}>
                  ● THREAT LEVEL: {dashboardStats?.threatLevel || 'NORMAL'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Giám sát luồng điểm số, số dư Vàng, ngăn chặn hành vi Speedrun & Double-spending
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
            title="Đóng cửa sổ quản trị"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* ================= NAVIGATION TABS ================= */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/5 bg-[#0e1322]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#151c30] text-cyan-300 border-t-2 border-x border-cyan-400 border-b-transparent shadow-[0_-5px_15px_rgba(0,210,255,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-base">monitoring</span>
            <span>Tổng Quan An Ninh</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#151c30] text-cyan-300 border-t-2 border-x border-cyan-400 border-b-transparent shadow-[0_-5px_15px_rgba(0,210,255,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-base">manage_accounts</span>
            <span>Quản Trị Người Chơi</span>
            {dashboardStats?.flaggedUsers > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-mono font-bold">
                {dashboardStats.flaggedUsers}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-[#151c30] text-cyan-300 border-t-2 border-x border-cyan-400 border-b-transparent shadow-[0_-5px_15px_rgba(0,210,255,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-base">receipt_long</span>
            <span>Nhật Ký Kiểm Toán (Logs)</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-[#151c30] text-rose-300 border-t-2 border-x border-rose-500 border-b-transparent shadow-[0_-5px_15px_rgba(244,63,94,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-base">report</span>
            <span>Báo Cáo Tố Cáo</span>
            {dashboardStats?.pendingReports > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold animate-pulse">
                {dashboardStats.pendingReports}
              </span>
            )}
          </button>
        </div>

        {/* ================= TAB 1: TỔNG QUAN AN NINH ================= */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isStatsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <span className="material-symbols-outlined animate-spin text-4xl text-cyan-400">sync</span>
                <span>Đang đồng bộ dữ liệu an ninh thời gian thực...</span>
              </div>
            ) : (
              <>
                {/* 7 Thẻ Metric Chính (Bao gồm Tố cáo vi phạm) */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#141b2e] border border-cyan-500/20 flex flex-col">
                    <span className="text-[11px] font-medium text-slate-400">Tổng Người Chơi</span>
                    <span className="font-headline font-black text-2xl text-white mt-1">
                      {dashboardStats?.totalUsers ?? '--'}
                    </span>
                    <span className="text-[10px] text-cyan-400 mt-1">Đã kích hoạt</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#141b2e] border border-rose-500/30 flex flex-col">
                    <span className="text-[11px] font-medium text-slate-400">Tài Khoản Bị Khóa</span>
                    <span className="font-headline font-black text-2xl text-rose-400 mt-1">
                      {dashboardStats?.bannedUsers ?? 0}
                    </span>
                    <span className="text-[10px] text-rose-300/80 mt-1">Vi phạm điều khoản</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#141b2e] border border-amber-500/30 flex flex-col">
                    <span className="text-[11px] font-medium text-slate-400">Cờ Nghi Vấn (Flag)</span>
                    <span className="font-headline font-black text-2xl text-amber-400 mt-1">
                      {dashboardStats?.flaggedUsers ?? 0}
                    </span>
                    <span className="text-[10px] text-amber-300/80 mt-1">Cảnh báo gian lận</span>
                  </div>

                  <div
                    onClick={() => setActiveTab('reports')}
                    className="p-3.5 rounded-2xl bg-[#181324] border border-rose-500/50 hover:border-rose-400 flex flex-col cursor-pointer transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                  >
                    <span className="text-[11px] font-medium text-rose-300">Tố Cáo Chờ Duyệt</span>
                    <span className="font-headline font-black text-2xl text-rose-400 mt-1 flex items-center gap-1.5">
                      {dashboardStats?.pendingReports ?? 0}
                      {(dashboardStats?.pendingReports || 0) > 0 && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      )}
                    </span>
                    <span className="text-[10px] text-rose-300/80 mt-1">Bấm để duyệt ngay ➔</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#141b2e] border border-emerald-500/30 flex flex-col">
                    <span className="text-[11px] font-medium text-slate-400">Vàng Lưu Thông</span>
                    <span className="font-headline font-black text-xl text-amber-300 mt-1 truncate">
                      🪙 {(dashboardStats?.totalCoinsInCirculation || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-400 mt-1">Bảo vệ âm tiền</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#141b2e] border border-indigo-500/30 flex flex-col">
                    <span className="text-[11px] font-medium text-slate-400">ELO Trung Bình</span>
                    <span className="font-headline font-black text-2xl text-cyan-300 mt-1">
                      {dashboardStats?.averageElo || 1000}
                    </span>
                    <span className="text-[10px] text-indigo-300/80 mt-1">
                      Max: {dashboardStats?.highestElo || 1000}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#141b2e] border border-purple-500/30 flex flex-col">
                    <span className="text-[11px] font-medium text-slate-400">Cảnh Báo (24h)</span>
                    <span className="font-headline font-black text-2xl text-purple-400 mt-1">
                      {dashboardStats?.securityAlerts24h ?? 0}
                    </span>
                    <span className="text-[10px] text-purple-300/80 mt-1">Nguy cơ đã chặn</span>
                  </div>
                </div>

                {/* Task 4: Giám Sát Hiệu Năng & Tải Máy Chủ Thời Gian Thực (Socket & Resources) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-[#12182b] border border-cyan-500/30 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-cyan-400 text-lg animate-pulse">speed</span>
                      <h4 className="font-headline font-black text-sm text-cyan-300 uppercase tracking-wide">
                        GIÁM SÁT HIỆU NĂNG & TẢI MÁY CHỦ THỜI GIAN THỰC (SOCKET ENGINE)
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        ONLINE: {serverMetrics?.server?.uptimeFormatted || '0h 0m 0s'}
                      </span>
                      <button
                        onClick={loadDashboard}
                        title="Làm mới thông số máy chủ"
                        className="px-2.5 py-1 rounded-xl bg-cyan-950/70 border border-cyan-600/40 hover:border-cyan-400 text-cyan-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        Làm mới
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {/* Socket Clients */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Socket Kết Nối</span>
                      <span className="font-mono font-black text-xl text-cyan-300 mt-1">
                        {serverMetrics?.sockets?.connectedClients ?? 0}
                      </span>
                      <span className="text-[10px] text-cyan-500/80 mt-0.5">Active WebSocket</span>
                    </div>

                    {/* Active Rooms */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phòng Đang Mở</span>
                      <span className="font-mono font-black text-xl text-indigo-300 mt-1">
                        {serverMetrics?.sockets?.activeRooms ?? 0}
                      </span>
                      <span className="text-[10px] text-indigo-400/80 mt-0.5">GameEngine Memory</span>
                    </div>

                    {/* Active Matches */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Trận Đang Đấu</span>
                      <span className="font-mono font-black text-xl text-amber-300 mt-1">
                        {serverMetrics?.sockets?.activeMatches ?? 0}
                      </span>
                      <span className="text-[10px] text-amber-400/80 mt-0.5">Trạng thái in_game</span>
                    </div>

                    {/* Spectators */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Khán Giả Live</span>
                      <span className="font-mono font-black text-xl text-pink-300 mt-1">
                        {serverMetrics?.sockets?.totalSpectators ?? 0}
                      </span>
                      <span className="text-[10px] text-pink-400/80 mt-0.5">Spectator Streams</span>
                    </div>

                    {/* RAM RSS */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">RAM RSS</span>
                      <span className="font-mono font-black text-xl text-emerald-300 mt-1">
                        {serverMetrics?.memory?.rssMb ?? '--'} <span className="text-xs text-slate-400 font-normal">MB</span>
                      </span>
                      <span className="text-[10px] text-emerald-400/80 mt-0.5">Tiến trình Node.js</span>
                    </div>

                    {/* Heap Memory */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Heap Memory</span>
                      <span className="font-mono font-black text-base text-yellow-300 mt-1">
                        {serverMetrics?.memory?.heapUsedMb ?? '--'} <span className="text-xs text-slate-400 font-normal">/ {serverMetrics?.memory?.heapTotalMb ?? '--'} MB</span>
                      </span>
                      <span className="text-[10px] text-yellow-500/80 mt-0.5">Tối ưu Garbage Collection</span>
                    </div>
                  </div>
                </div>

                {/* Banner Ràng Buộc Bảo Mật Hệ Thống */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/30 border border-cyan-500/40">
                  <h4 className="font-headline font-black text-sm text-cyan-300 uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">verified_user</span>
                    CÁC RÀNG BUỘC BẢO MẬT ĐANG KÍCH HOẠT
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 text-xs text-slate-300">
                    <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <div>
                        <strong className="text-white">Chặn Tiền Âm (Zero-Floor)</strong>
                        <p className="text-[11px] text-slate-400 mt-0.5">Coins min 0 ở cấp độ Schema, chống hack tiêu âm tiền.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <div>
                        <strong className="text-white">Giao Dịch Atomic (No Double-Spend)</strong>
                        <p className="text-[11px] text-slate-400 mt-0.5">findOneAndUpdate có kiểm tra số dư, triệt tiêu race condition.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <div>
                        <strong className="text-white">Anti-Speedrun (Min 12s)</strong>
                        <p className="text-[11px] text-slate-400 mt-0.5">Trận dưới 12s tự động gắn cờ nghi vấn và hủy toàn bộ phần thưởng.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <div>
                        <strong className="text-white">Rate-Limit Cooldown</strong>
                        <p className="text-[11px] text-slate-400 mt-0.5">Chặn spam ghi nhận kết quả liên tục giữa các trận (HTTP 429).</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danh Sách Sự Kiện An Ninh Gần Đây */}
                <div className="bg-[#12182b] rounded-2xl border border-white/10 p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-headline font-black text-sm text-white uppercase flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-cyan-400">history</span>
                      Sự Kiện An Ninh & Kiểm Toán Gần Nhất
                    </h4>
                    <button
                      onClick={() => setActiveTab('logs')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Xem toàn bộ nhật ký</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>

                  {recentLogs.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">Chưa có bản ghi nhật ký an ninh nào.</div>
                  ) : (
                    <div className="space-y-2">
                      {recentLogs.map((log) => {
                        const isWarn = log.severity === 'warning';
                        const isCrit = log.severity === 'critical';
                        const dotColor = isCrit ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-400';
                        return (
                          <div
                            key={log._id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs hover:border-cyan-500/30 transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}></span>
                              <span className="font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 shrink-0">
                                {log.action}
                              </span>
                              <span className="text-slate-300 truncate">
                                Người chơi: <strong>{log.userId?.nickname || log.performedBy || 'System'}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 text-slate-400 text-[11px] font-mono">
                              <span>{new Date(log.createdAt).toLocaleTimeString('vi-VN')}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= TAB 2: QUẢN TRỊ NGƯỜI CHƠI ================= */}
        {activeTab === 'users' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {/* Bộ Lọc & Tìm Kiếm */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#12182b] p-3 rounded-2xl border border-white/10">
              <div className="relative w-full sm:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm Tên hoặc Email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers(1)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'banned', label: 'Bị Khóa 🚫' },
                  { id: 'flagged', label: 'Cờ Nghi Vấn 🚩' },
                  { id: 'admin', label: 'Admin 🛡️' },
                  { id: 'player', label: 'Người chơi' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setUserFilter(f.id)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                      userFilter === f.id
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bảng Danh Sách Người Chơi */}
            {isUsersLoading ? (
              <div className="flex-1 flex items-center justify-center py-20 text-slate-400">
                <span className="material-symbols-outlined animate-spin text-3xl text-cyan-400">sync</span>
              </div>
            ) : usersList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 text-sm">
                Không tìm thấy người chơi nào phù hợp.
              </div>
            ) : (
              <div className="space-y-2.5">
                {usersList.map((u) => {
                  const isCurrentAdmin = String(u._id) === String(currentUser?._id || currentUser?.id);
                  return (
                    <div
                      key={u._id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        u.isBanned
                          ? 'bg-rose-950/20 border-rose-500/40'
                          : u.isFlagged
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-[#12182b] border-white/10 hover:border-cyan-500/30'
                      }`}
                    >
                      {/* Avatar & User Info */}
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.nickname}`}
                          alt="Avatar"
                          className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-headline font-bold text-sm text-white">{u.nickname}</h5>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                                u.role === 'admin'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-slate-700/50 text-slate-300'
                              }`}
                            >
                              {u.role}
                            </span>
                            {u.isBanned && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-black uppercase">
                                ĐÃ KHÓA
                              </span>
                            )}
                            {u.isFlagged && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black uppercase animate-pulse">
                                NGHI VẤN
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[240px]">
                            {u.email}
                          </p>
                          {u.isBanned && u.banReason && (
                            <p className="text-[11px] text-rose-300 font-mono mt-1">Lý do: {u.banReason}</p>
                          )}
                          {u.isFlagged && u.cheatWarnings?.length > 0 && (
                            <p className="text-[11px] text-amber-300 font-mono mt-1">
                              Cảnh báo: {u.cheatWarnings[u.cheatWarnings.length - 1]}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* ELO & Coins Balance */}
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400">Số Dư Vàng</span>
                          <span className="font-bold text-amber-300">🪙 {(u.coins ?? 1000).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400">Điểm ELO</span>
                          <span className="font-bold text-cyan-300">🏆 {u.elo ?? 1000}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400">Cấp Độ</span>
                          <span className="font-bold text-slate-300">⭐ Lv.{u.level ?? 1}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Nút Điều Chỉnh Số Dư */}
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setActionType('adjust');
                            setCoinAdjustmentInput('');
                            setEloAdjustmentInput('');
                            setAdjustReasonInput('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold cursor-pointer transition-all"
                          title="Cộng/Trừ tiền Vàng và ELO"
                        >
                          Số Dư
                        </button>

                        {/* Nút Gỡ Cờ Cảnh Báo */}
                        {u.isFlagged && (
                          <button
                            onClick={() => handleQuickClearFlag(u)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-pointer transition-all"
                            title="Xóa cảnh báo nghi vấn gian lận"
                          >
                            Gỡ Cờ
                          </button>
                        )}

                        {/* Nút Phân Quyền */}
                        {!isCurrentAdmin && (
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setActionType('role');
                              setRoleSelectInput(u.role === 'admin' ? 'player' : 'admin');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold cursor-pointer transition-all"
                            title="Phân quyền quản trị"
                          >
                            Quyền
                          </button>
                        )}

                        {/* Nút Khóa / Mở Khóa */}
                        {!isCurrentAdmin && u.role !== 'admin' && (
                          u.isBanned ? (
                            <button
                              onClick={() => handleQuickUnban(u)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold cursor-pointer transition-all"
                            >
                              Mở Khóa
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setActionType('ban');
                                setBanReasonInput('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold cursor-pointer transition-all"
                            >
                              Khóa
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {usersPagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                <span>Tổng cộng: {usersPagination.total} tài khoản</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={usersPagination.page <= 1}
                    onClick={() => loadUsers(usersPagination.page - 1)}
                    className="px-3 py-1 rounded bg-white/5 disabled:opacity-30 hover:bg-white/10 cursor-pointer"
                  >
                    Trước
                  </button>
                  <span className="font-mono">
                    Trang {usersPagination.page} / {usersPagination.totalPages}
                  </span>
                  <button
                    disabled={usersPagination.page >= usersPagination.totalPages}
                    onClick={() => loadUsers(usersPagination.page + 1)}
                    className="px-3 py-1 rounded bg-white/5 disabled:opacity-30 hover:bg-white/10 cursor-pointer"
                  >
                    Tiếp
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: NHẬT KÝ KIỂM TOÁN (LOGS) ================= */}
        {activeTab === 'logs' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {/* Bộ lọc Logs */}
            <div className="flex flex-wrap items-center gap-3 bg-[#12182b] p-3 rounded-2xl border border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Mức Độ:</span>
                <select
                  value={logSeverityFilter}
                  onChange={(e) => setLogSeverityFilter(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">Tất cả</option>
                  <option value="info">Info (Bình thường)</option>
                  <option value="warning">Warning (Cảnh báo)</option>
                  <option value="critical">Critical (Nguy hiểm)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Hành Động:</span>
                <select
                  value={logActionFilter}
                  onChange={(e) => setLogActionFilter(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">Tất cả hành động</option>
                  <option value="RECORD_MATCH_POINTS">RECORD_MATCH_POINTS</option>
                  <option value="SHOP_BUY">SHOP_BUY</option>
                  <option value="SHOP_EQUIP">SHOP_EQUIP</option>
                  <option value="ADMIN_ADJUST_COINS">ADMIN_ADJUST_COINS</option>
                  <option value="ADMIN_ADJUST_ELO">ADMIN_ADJUST_ELO</option>
                  <option value="ADMIN_BAN_USER">ADMIN_BAN_USER</option>
                  <option value="ADMIN_UNBAN_USER">ADMIN_UNBAN_USER</option>
                  <option value="ADMIN_ROLE_CHANGE">ADMIN_ROLE_CHANGE</option>
                  <option value="SUSPICIOUS_EXPLOIT_ATTEMPT">SUSPICIOUS_EXPLOIT_ATTEMPT</option>
                  <option value="RATE_LIMIT_EXCEEDED">RATE_LIMIT_EXCEEDED</option>
                </select>
              </div>

              <button
                onClick={() => loadLogs(1)}
                className="ml-auto px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/30 flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span>Làm Mới</span>
              </button>
            </div>

            {/* Danh Sách Logs */}
            {isLogsLoading ? (
              <div className="flex-1 flex items-center justify-center py-20 text-slate-400">
                <span className="material-symbols-outlined animate-spin text-3xl text-cyan-400">sync</span>
              </div>
            ) : logsList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 text-sm">
                Không tìm thấy bản ghi an ninh nào.
              </div>
            ) : (
              <div className="space-y-2">
                {logsList.map((log) => {
                  const isWarn = log.severity === 'warning';
                  const isCrit = log.severity === 'critical';
                  const badgeColor = isCrit
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : isWarn
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

                  return (
                    <div
                      key={log._id}
                      className="p-3 rounded-xl bg-[#12182b] border border-white/5 hover:border-cyan-500/30 transition-all text-xs font-mono"
                    >
                      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-bold uppercase border ${badgeColor}`}>
                            {log.severity}
                          </span>
                          <span className="text-white font-bold">{log.action}</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>

                      <div className="mt-2 text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                        <span>
                          Người chơi:{' '}
                          <strong className="text-cyan-300">
                            {log.userId?.nickname || log.performedBy || 'System'}
                          </strong>
                        </span>
                        <span>
                          Thực hiện bởi: <strong className="text-white">{log.performedBy || 'System'}</strong>
                        </span>
                        {log.ipAddress && <span className="text-slate-500">IP: {log.ipAddress}</span>}
                      </div>

                      {log.details && (
                        <pre className="mt-2 p-2 rounded-lg bg-black/50 border border-white/5 text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Logs Pagination */}
            {logsPagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                <span>Tổng cộng: {logsPagination.total} bản ghi</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={logsPagination.page <= 1}
                    onClick={() => loadLogs(logsPagination.page - 1)}
                    className="px-3 py-1 rounded bg-white/5 disabled:opacity-30 hover:bg-white/10 cursor-pointer"
                  >
                    Trước
                  </button>
                  <span className="font-mono">
                    Trang {logsPagination.page} / {logsPagination.totalPages}
                  </span>
                  <button
                    disabled={logsPagination.page >= logsPagination.totalPages}
                    onClick={() => loadLogs(logsPagination.page + 1)}
                    className="px-3 py-1 rounded bg-white/5 disabled:opacity-30 hover:bg-white/10 cursor-pointer"
                  >
                    Tiếp
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: BÁO CÁO TỐ CÁO VI PHẠM (SOC REPORTS - TASK 3) ================= */}
        {activeTab === 'reports' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {/* Bộ lọc Reports */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12182b] p-3 rounded-2xl border border-white/10 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Trạng Thái:</span>
                  <select
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value)}
                    className="bg-[#182035] border border-white/10 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="all">Tất Cả</option>
                    <option value="pending">⏳ Chờ Thẩm Tra</option>
                    <option value="resolved_penalized">⚖️ Đã Xử Phạt</option>
                    <option value="dismissed">✕ Đã Bác Bỏ</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Lý Do:</span>
                  <select
                    value={reportReasonFilter}
                    onChange={(e) => setReportReasonFilter(e.target.value)}
                    className="bg-[#182035] border border-white/10 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="all">Tất Cả Lý Do</option>
                    <option value="afk_delay">⏱️ AFK / Câu Giờ</option>
                    <option value="cheating_exploit">⚡ Nghi Vấn Gian Lận</option>
                    <option value="toxic_chat">🤬 Xúc Phạm / Toxic</option>
                    <option value="teaming">🤝 Thông Đồng</option>
                    <option value="other">❓ Khác</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => loadReports(1)}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span>Làm mới</span>
              </button>
            </div>

            {/* Danh sách Reports */}
            {isReportsLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <span className="material-symbols-outlined animate-spin text-3xl text-rose-500">sync</span>
                <span>Đang tải danh sách phiếu tố cáo vi phạm...</span>
              </div>
            ) : reportsList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500 text-sm">
                <span className="text-4xl mb-2">🛡️</span>
                <span>Không có phiếu tố cáo nào phù hợp với bộ lọc.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {reportsList.map((rep) => {
                  const isPending = rep.status === 'pending';
                  const isPenalized = rep.status === 'resolved_penalized';
                  const statusBadge = isPending
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : isPenalized
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-slate-500/20 text-slate-300 border-slate-500/40';

                  const reasonLabel =
                    rep.reason === 'afk_delay'
                      ? '⏱️ AFK / Câu Giờ'
                      : rep.reason === 'cheating_exploit'
                      ? '⚡ Nghi Vấn Gian Lận'
                      : rep.reason === 'toxic_chat'
                      ? '🤬 Xúc Phạm / Toxic'
                      : rep.reason === 'teaming'
                      ? '🤝 Thông Đồng'
                      : '❓ Lý Do Khác';

                  return (
                    <div
                      key={rep._id}
                      className={`p-4 rounded-2xl border transition-all text-xs ${
                        isPending
                          ? 'bg-[#151a2d] border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
                          : 'bg-[#101524] border-white/5'
                      }`}
                    >
                      {/* Top Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase border ${statusBadge}`}>
                            {isPending ? '⏳ Chờ Xử Lý' : isPenalized ? '⚖️ Đã Xử Phạt' : '✕ Đã Bác Bỏ'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-gray-300 font-bold border border-white/10">
                            {reasonLabel}
                          </span>
                          {rep.evidenceTurn && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono font-bold border border-purple-500/30">
                              Lượt #{rep.evidenceTurn}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400">
                          Mã phòng: <span className="font-mono text-cyan-400 font-bold">{rep.roomCode}</span> •{' '}
                          {new Date(rep.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>

                      {/* Content: Reporter vs Target */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-400 font-bold">Người tố cáo:</span>
                          <span className="font-bold text-cyan-300">{rep.reporterName}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-400 font-bold">Đối tượng bị tố cáo:</span>
                          <span className="font-bold text-rose-400 flex items-center gap-1.5">
                            <span>{rep.targetUserName}</span>
                            {rep.targetUser?.isBanned && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[9px] font-bold">
                                BANNED
                              </span>
                            )}
                            {rep.targetUser?.isFlagged && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-bold">
                                CỜ CẢNH BÁO
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="py-2.5">
                        <span className="text-slate-400 font-bold block mb-1">Mô tả vi phạm:</span>
                        <p className="text-slate-200 bg-black/30 p-2.5 rounded-xl border border-white/5 text-xs italic">
                          "{rep.description || 'Không có mô tả chi tiết kèm theo.'}"
                        </p>
                      </div>

                      {/* Resolution Result if not pending */}
                      {!isPending && rep.resolution && (
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-[11px] text-slate-300 mt-2">
                          <span className="text-emerald-400 font-bold">✓ Kết quả thẩm định: </span>
                          <span className="font-bold text-white">{rep.resolution.notes}</span>
                          <span className="text-slate-500 ml-2">
                            (Bởi: {rep.resolution.resolvedBy} • {rep.resolution.resolvedAt ? new Date(rep.resolution.resolvedAt).toLocaleTimeString('vi-VN') : ''})
                          </span>
                        </div>
                      )}

                      {/* Actions Footer */}
                      <div className="flex items-center justify-end gap-2.5 pt-3">
                        {rep.matchId && (
                          <button
                            onClick={() => setSocReplayMatchId(rep.matchId)}
                            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,210,255,0.2)] cursor-pointer"
                          >
                            <span>▶️</span>
                            <span>Mở Replay Xem Bằng Chứng</span>
                          </button>
                        )}

                        {isPending && (
                          <button
                            onClick={() => {
                              setSelectedReport(rep);
                              setResolveAction('deduct_elo');
                              setResolvePenaltyInput('50');
                              setResolveNotesInput(`Phạt vi phạm quy tắc: ${rep.reason}`);
                            }}
                            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black tracking-wide shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <span>⚖️</span>
                            <span>Phán Quyết / Xử Phạt</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Reports Pagination */}
            {reportsPagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                <span>Tổng cộng: {reportsPagination.total} phiếu tố cáo</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={reportsPagination.page <= 1}
                    onClick={() => loadReports(reportsPagination.page - 1)}
                    className="px-3 py-1 rounded bg-white/5 disabled:opacity-30 hover:bg-white/10 cursor-pointer"
                  >
                    Trước
                  </button>
                  <span className="font-mono">
                    Trang {reportsPagination.page} / {reportsPagination.totalPages}
                  </span>
                  <button
                    disabled={reportsPagination.page >= reportsPagination.totalPages}
                    onClick={() => loadReports(reportsPagination.page + 1)}
                    className="px-3 py-1 rounded bg-white/5 disabled:opacity-30 hover:bg-white/10 cursor-pointer"
                  >
                    Tiếp
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= SUB-MODAL ACTION HANDLERS ================= */}
        {selectedUser && actionType && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-[#13192c] border-2 border-cyan-400/80 rounded-2xl p-5 shadow-[0_0_50px_rgba(0,210,255,0.4)]">
              
              {/* ACTION: KHÓA TÀI KHOẢN */}
              {actionType === 'ban' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-rose-400">
                    <span className="material-symbols-outlined text-2xl">block</span>
                    <h4 className="font-headline font-black text-base text-white">
                      Khóa Tài Khoản [{selectedUser.nickname}]
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300">
                    Người chơi này sẽ bị ngắt kết nối ngay lập tức và không thể đăng nhập hoặc tham gia bất kỳ trận đấu nào.
                  </p>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Lý do khóa tài khoản:</label>
                    <textarea
                      rows={3}
                      value={banReasonInput}
                      onChange={(e) => setBanReasonInput(e.target.value)}
                      placeholder="VD: Nghi vấn gian lận hack điểm ELO, speedrun trận đấu..."
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  {actionMessage && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-bold ${
                        actionMessage.type === 'success'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {actionMessage.text}
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setActionType(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      disabled={isSubmittingAction}
                      onClick={handleConfirmBan}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-headline font-bold text-xs uppercase cursor-pointer transition-all shadow-md active:scale-95"
                    >
                      {isSubmittingAction ? 'Đang khóa...' : 'Xác nhận Khóa'}
                    </button>
                  </div>
                </div>
              )}

              {/* ACTION: ĐIỀU CHỈNH SỐ DƯ */}
              {actionType === 'adjust' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-cyan-400">
                    <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                    <h4 className="font-headline font-black text-base text-white">
                      Điều Chỉnh Số Dư [{selectedUser.nickname}]
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 p-3 bg-black/40 rounded-xl text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block">Vàng hiện tại:</span>
                      <strong className="text-amber-300 text-sm">🪙 {(selectedUser.coins ?? 1000).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">ELO hiện tại:</span>
                      <strong className="text-cyan-300 text-sm">🏆 {selectedUser.elo ?? 1000}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 font-bold block mb-1">Cộng/Trừ Vàng:</label>
                      <input
                        type="number"
                        placeholder="VD: +500 hoặc -200"
                        value={coinAdjustmentInput}
                        onChange={(e) => setCoinAdjustmentInput(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-bold block mb-1">Cộng/Trừ ELO:</label>
                      <input
                        type="number"
                        placeholder="VD: +50 hoặc -30"
                        value={eloAdjustmentInput}
                        onChange={(e) => setEloAdjustmentInput(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Lý do điều chỉnh:</label>
                    <input
                      type="text"
                      placeholder="VD: Đền bù lỗi mạng hoặc xử phạt gian lận"
                      value={adjustReasonInput}
                      onChange={(e) => setAdjustReasonInput(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {actionMessage && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-bold ${
                        actionMessage.type === 'success'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {actionMessage.text}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setActionType(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      disabled={isSubmittingAction}
                      onClick={handleConfirmAdjust}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-headline font-black text-xs uppercase cursor-pointer transition-all shadow-md active:scale-95"
                    >
                      {isSubmittingAction ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                    </button>
                  </div>
                </div>
              )}

              {/* ACTION: PHÂN QUYỀN VAI TRÒ */}
              {actionType === 'role' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-purple-400">
                    <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                    <h4 className="font-headline font-black text-base text-white">
                      Phân Quyền Vai Trò [{selectedUser.nickname}]
                    </h4>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-2">Chọn vai trò mới:</label>
                    <select
                      value={roleSelectInput}
                      onChange={(e) => setRoleSelectInput(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="player">Player (Người chơi bình thường)</option>
                      <option value="admin">Admin (Quản trị viên cấp cao)</option>
                    </select>
                  </div>

                  {actionMessage && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-bold ${
                        actionMessage.type === 'success'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {actionMessage.text}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setActionType(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      disabled={isSubmittingAction}
                      onClick={handleConfirmRole}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-headline font-bold text-xs uppercase cursor-pointer transition-all shadow-md active:scale-95"
                    >
                      {isSubmittingAction ? 'Đang cập nhật...' : 'Cập Nhật Quyền'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ================= SUB-MODAL: XỬ LÝ PHIẾU TỐ CÁO ================= */}
        {selectedReport && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-[#13192c] border-2 border-rose-500/80 rounded-3xl p-6 shadow-[0_0_60px_rgba(244,63,94,0.4)] text-white space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5 text-rose-400">
                  <span className="material-symbols-outlined text-2xl">gavel</span>
                  <h4 className="font-headline font-black text-base text-white">
                    Thẩm Định & Xử Phạt Vi Phạm
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {resolveMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    resolveMessage.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {resolveMessage.text}
                </div>
              )}

              <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs space-y-1">
                <div>
                  <span className="text-slate-400 font-bold">Người vi phạm:</span>{' '}
                  <span className="text-rose-400 font-bold">{selectedReport.targetUserName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">Người tố cáo:</span>{' '}
                  <span className="text-cyan-300 font-bold">{selectedReport.reporterName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold">Lý do:</span>{' '}
                  <span className="text-amber-300">{selectedReport.reason}</span>
                  {selectedReport.evidenceTurn && ` (Lượt #${selectedReport.evidenceTurn})`}
                </div>
              </div>

              {/* Lựa chọn hình thức xử phạt */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 uppercase">
                  Biện pháp chế tài:
                </label>
                <div className="space-y-1.5 text-xs">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/10 bg-[#161d30] cursor-pointer hover:border-cyan-400">
                    <input
                      type="radio"
                      name="resolveAction"
                      value="deduct_elo"
                      checked={resolveAction === 'deduct_elo'}
                      onChange={(e) => setResolveAction(e.target.value)}
                      className="accent-rose-500"
                    />
                    <span className="font-bold text-rose-300">Phạt trừ điểm xếp hạng (Trừ ELO)</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/10 bg-[#161d30] cursor-pointer hover:border-cyan-400">
                    <input
                      type="radio"
                      name="resolveAction"
                      value="warning"
                      checked={resolveAction === 'warning'}
                      onChange={(e) => setResolveAction(e.target.value)}
                      className="accent-amber-500"
                    />
                    <span className="font-bold text-amber-300">Cảnh cáo tài khoản (Gắn cờ kiểm soát)</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/10 bg-[#161d30] cursor-pointer hover:border-cyan-400">
                    <input
                      type="radio"
                      name="resolveAction"
                      value="temp_ban"
                      checked={resolveAction === 'temp_ban'}
                      onChange={(e) => setResolveAction(e.target.value)}
                      className="accent-red-500"
                    />
                    <span className="font-bold text-red-400">Khóa tài khoản tạm thời (Ban)</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/10 bg-[#161d30] cursor-pointer hover:border-cyan-400">
                    <input
                      type="radio"
                      name="resolveAction"
                      value="none"
                      checked={resolveAction === 'none'}
                      onChange={(e) => setResolveAction(e.target.value)}
                      className="accent-slate-500"
                    />
                    <span className="font-bold text-slate-300">Bác bỏ tố cáo (Không đủ bằng chứng)</span>
                  </label>
                </div>
              </div>

              {/* Nếu chọn deduct_elo: nhập số điểm */}
              {resolveAction === 'deduct_elo' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Số điểm ELO phạt trừ:
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={resolvePenaltyInput}
                    onChange={(e) => setResolvePenaltyInput(e.target.value)}
                    className="w-full bg-[#0d1220] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400 font-mono"
                  />
                </div>
              )}

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Ghi chú kết luận thẩm tra:
                </label>
                <textarea
                  rows={2}
                  value={resolveNotesInput}
                  onChange={(e) => setResolveNotesInput(e.target.value)}
                  placeholder="Ghi rõ lý do xử phạt để lưu vào nhật ký an ninh..."
                  className="w-full bg-[#0d1220] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isSubmittingResolve}
                  onClick={handleConfirmResolve}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-headline font-black text-xs uppercase cursor-pointer transition-all shadow-md active:scale-95"
                >
                  {isSubmittingResolve ? 'Đang xử lý...' : 'Xác Nhận Phán Quyết'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL XEM REPLAY TRONG SOC ================= */}
        {socReplayMatchId && (
          <MatchReplayModal
            isOpen={Boolean(socReplayMatchId)}
            onClose={() => setSocReplayMatchId(null)}
            matchId={socReplayMatchId}
          />
        )}

      </div>
    </div>
  );
}
