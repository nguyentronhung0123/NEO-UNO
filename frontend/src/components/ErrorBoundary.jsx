import React from 'react';

/**
 * Global React Error Boundary - Chống sập ứng dụng / trắng màn hình tuyệt đối
 * Khi bất kỳ component con nào gặp ngoại lệ JavaScript trong quá trình render,
 * Error Boundary sẽ bắt lại và hiển thị giao diện Cyberpunk an toàn kèm nút quay về Sảnh.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] 🚨 Đã phát hiện sự cố giao diện:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetToLobby = () => {
    try {
      sessionStorage.removeItem('neo_online_room');
      sessionStorage.removeItem('neo_active_match');
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#0b0e17] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-body select-none relative overflow-hidden">
          {/* Background Ambient Glows */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 w-full max-w-lg bg-[#111728]/95 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(244,63,94,0.3)] backdrop-blur-xl flex flex-col items-center text-center">
            {/* Warning Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-500/40 text-rose-400 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(244,63,94,0.4)] animate-pulse">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>

            <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-mono font-bold tracking-wider uppercase mb-2">
              BẢO VỆ GIAO DIỆN NEO-UNO
            </span>

            <h2 className="font-headline font-black text-xl sm:text-2xl text-white tracking-wide uppercase mb-2">
              ĐÃ XẢY RA SỰ CỐ HIỂN THỊ
            </h2>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Hệ thống đã tự động ngăn chặn sự cố sập màn hình trắng. Dữ liệu trận đấu và tài khoản của bạn được giữ nguyên vẹn.
            </p>

            {/* Error Message Box */}
            <div className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-rose-300 font-mono text-[11px] text-left mb-6 overflow-x-auto max-h-32">
              <code>{this.state.error?.message || 'Lỗi không xác định khi dựng giao diện'}</code>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary-container to-cyan-400 text-black font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                <span>TẢI LẠI TRANG</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetToLobby}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-surface-container-high/60 hover:bg-surface-container-high border border-white/15 text-slate-200 font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">home</span>
                <span>QUAY VỀ SẢNH</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
