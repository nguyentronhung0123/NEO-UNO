import React, { useState, useEffect } from 'react';

/**
 * PWA Install Prompt & Button
 * Bắt sự kiện beforeinstallprompt của trình duyệt
 * Cho phép người dùng bấm 1 chạm để cài đặt game ra Màn hình chính (Home Screen)
 */
export default function PwaInstallPrompt({ onInstalled }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('neo_pwa_dismissed') === 'true';
  });

  // Kiểm tra nếu app đã chạy trong chế độ PWA Standalone
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  // Kiểm tra thiết bị iOS Safari
  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  useEffect(() => {
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
      console.log('[PWA] 🚀 Sẵn sàng cài đặt ứng dụng web!');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      console.log('[PWA] 🎉 Đã cài đặt ứng dụng NEO-UNO thành công!');
      if (typeof onInstalled === 'function') onInstalled();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone, onInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        console.log('[PWA] Người dùng đã chấp nhận cài đặt!');
      } else {
        console.log('[PWA] Người dùng đã từ chối cài đặt!');
      }
      setDeferredPrompt(null);
      setCanInstall(false);
    } else if (isIos && !isStandalone) {
      setShowIosGuide(true);
    }
  };

  const handleDismissBanner = () => {
    setIsDismissed(true);
    sessionStorage.setItem('neo_pwa_dismissed', 'true');
  };

  // Nếu đã cài đặt hoặc đang ở standalone mode, không cần hiện banner
  if (isInstalled || isStandalone) {
    return null;
  }

  return (
    <>
      {/* 1. NÚT CÀI ĐẶT NHANH (NẾU ĐỦ ĐIỀU KIỆN TRÊN NAVBAR HOẶC SẢNH) */}
      {(canInstall || (isIos && !isStandalone)) && !isDismissed && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[75] w-[92%] max-w-md animate-fade-in">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#0c1020]/95 border border-cyan-500/50 backdrop-blur-xl shadow-[0_0_35px_rgba(0,210,255,0.35)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-md shrink-0">
                <img
                  src="/icons/icon-192.png"
                  alt="NEO-UNO"
                  className="w-full h-full object-cover rounded-[10px]"
                  onError={(e) => {
                    e.currentTarget.src = '/favicon.svg';
                  }}
                />
              </div>
              <div className="flex flex-col text-left">
                <div className="text-xs font-black text-white font-headline flex items-center gap-1.5">
                  <span>Cài Đặt NEO-UNO</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-mono border border-cyan-400/40">
                    APP
                  </span>
                </div>
                <div className="text-[10px] text-slate-300">
                  Chơi mượt 60fps, toàn màn hình không viền
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-headline font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(0,210,255,0.5)] active:scale-95 hover:scale-105"
              >
                Cài Đặt
              </button>
              <button
                onClick={handleDismissBanner}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Đóng thông báo"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL HƯỚNG DẪN CÀI ĐẶT CHO IPHONE / IPAD (IOS SAFARI) */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0f1424] border border-cyan-500/40 p-5 shadow-2xl text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-3xl mb-3 shadow-lg">
              📱
            </div>

            <h3 className="font-headline font-black text-base text-white uppercase mb-2">
              Cài Đặt Trên iPhone / iPad
            </h3>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Trình duyệt Safari trên iOS cần 2 bước đơn giản để thêm game ra Màn hình chính như một App độc lập:
            </p>

            <div className="w-full space-y-2.5 text-left text-xs mb-5 bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs shrink-0 border border-cyan-400/30">
                  1
                </span>
                <span className="text-slate-200">
                  Nhấn vào nút <b className="text-cyan-300">Chia Sẻ (Share)</b> ở thanh dưới cùng Safari:
                  <span className="inline-block ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[11px]">⎋</span>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs shrink-0 border border-cyan-400/30">
                  2
                </span>
                <span className="text-slate-200">
                  Cuộn xuống chọn <b className="text-amber-300">"Thêm vào Màn hình chính"</b> (Add to Home Screen):
                  <span className="inline-block ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[11px]">➕</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-headline font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:brightness-110 active:scale-95"
            >
              Đã Hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Nút Icon PWA đặt trên Top Header hoặc Profile Dropdown
 */
export function PwaInstallHeaderButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  useEffect(() => {
    if (isStandalone) return;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isStandalone]);

  if (isStandalone) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setCanInstall(false);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#131826]/90 hover:bg-[#1c2336] border border-cyan-500/40 hover:border-cyan-300 text-cyan-300 font-headline font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md group relative hover:scale-105 active:scale-95"
        title="Cài đặt App NEO-UNO ra màn hình chính"
      >
        <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform text-cyan-400">
          install_mobile
        </span>
        <span className="hidden lg:inline">Cài App</span>
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
      </button>

      {/* Guide cho iOS nếu nhấn nút header */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0f1424] border border-cyan-500/40 p-5 shadow-2xl text-center flex flex-col items-center">
            <h3 className="font-headline font-black text-base text-white uppercase mb-2">
              Cài Đặt Trên iOS
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Bấm nút Chia Sẻ <b className="text-cyan-300">⎋</b> của Safari và chọn <b className="text-amber-300">"Thêm vào Màn hình chính" ➕</b> để cài game thành App!
            </p>
            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-headline font-black text-xs uppercase tracking-wider cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
}
