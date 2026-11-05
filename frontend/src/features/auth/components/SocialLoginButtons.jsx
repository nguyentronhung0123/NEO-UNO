import React, { useEffect, useState } from 'react';

export default function SocialLoginButtons({
  dividerText = 'ĐĂNG NHẬP ĐỒNG BỘ NHANH',
  onGoogleAuth,
  isLoadingGoogle = false,
  setStatusMessage,
}) {
  const [isClicking, setIsClicking] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Khởi tạo One-Tap ngầm nếu người dùng đã bật sẵn phiên Google trên trình duyệt
  useEffect(() => {
    if (!clientId) return;

    let mounted = true;
    const initOneTap = () => {
      if (window.google?.accounts?.id && mounted) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => {
              if (response.credential && onGoogleAuth) {
                onGoogleAuth({ credential: response.credential });
              }
            },
          });
          window.google.accounts.id.prompt();
        } catch (err) {
          console.warn('[GIS OneTap Error]:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initOneTap();
    } else {
      const timer = setTimeout(initOneTap, 1000);
      return () => clearTimeout(timer);
    }

    return () => {
      mounted = false;
    };
  }, [clientId, onGoogleAuth]);

  // Xử lý khi nhấn nút Đăng nhập bằng Google chuẩn Cyberpunk
  const handleGoogleClick = () => {
    if (!clientId) {
      if (setStatusMessage) {
        setStatusMessage({
          type: 'error',
          text: 'Chưa cấu hình Google Client ID trong file .env!',
        });
      }
      return;
    }

    setIsClicking(true);

    // Sử dụng Google Identity Services OAuth 2.0 Token Client (Mở popup chọn tài khoản chính thống của Google)
    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            setIsClicking(false);
            if (tokenResponse?.access_token && onGoogleAuth) {
              await onGoogleAuth({ accessToken: tokenResponse.access_token });
            }
          },
          error_callback: (err) => {
            setIsClicking(false);
            console.warn('[GIS OAuth2 Error]:', err);
          },
        });

        client.requestAccessToken();
        return;
      } catch (err) {
        console.warn('[GIS TokenClient Init Error]:', err);
      }
    }

    // Dự phòng qua One-Tap nếu oauth2 chưa sẵn sàng
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            setIsClicking(false);
            if (response.credential && onGoogleAuth) {
              await onGoogleAuth({ credential: response.credential });
            }
          },
        });
        window.google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn('[GIS Fallback Error]:', err);
      }
    }

    setIsClicking(false);
    if (setStatusMessage) {
      setStatusMessage({
        type: 'error',
        text: 'Không thể khởi động cổng xác thực Google. Vui lòng thử lại!',
      });
    }
  };

  const loading = isLoadingGoogle || isClicking;

  return (
    <div className="w-full">
      {/* Divider */}
      <div className="relative flex items-center my-4">
        <div className="flex-grow h-[1px] bg-outline-variant/30"></div>
        <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-500 tracking-widest uppercase">
          {dividerText}
        </span>
        <div className="flex-grow h-[1px] bg-outline-variant/30"></div>
      </div>

      {/* Cyberpunk Google Sign-In Button */}
      <div className="relative group w-full">
        {/* Soft Neon Ambient Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4285F4]/30 via-[#EA4335]/20 to-[#34A853]/30 rounded-full blur-md opacity-50 group-hover:opacity-100 transition duration-300 pointer-events-none"></div>

        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={loading}
          className="relative w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-[#141b2b] via-[#1a2337] to-[#141b2b] hover:from-[#182136] hover:via-[#202c44] hover:to-[#182136] text-white flex items-center justify-between shadow-[0_4px_20px_rgba(66,133,244,0.18)] hover:shadow-[0_0_25px_rgba(66,133,244,0.4)] border border-[#4285F4]/35 hover:border-[#4285F4]/80 transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-50"
        >
          {/* Left: Google G-Logo in Sleek Dark Bezel + Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#0c1018] flex items-center justify-center p-1 border border-white/10 group-hover:border-[#4285F4]/50 shadow-inner transition-colors">
              {loading ? (
                <span className="material-symbols-outlined text-sm animate-spin text-[#4285F4]">
                  autorenew
                </span>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.8 5 12 5z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.3 14.7c-.2-.7-.4-1.6-.4-2.7s.1-1.9.4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
                    fill="#34A853"
                  />
                </svg>
              )}
            </div>
            <span className="font-headline tracking-wider uppercase text-xs sm:text-sm font-bold text-slate-100 group-hover:text-white">
              {loading ? 'ĐANG KẾT NỐI GOOGLE...' : 'ĐĂNG NHẬP BẰNG GOOGLE'}
            </span>
          </div>

          {/* Right: Sleek Neon Cyber Tag */}
          <div className="flex items-center">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#4285F4]/15 text-[#4285F4] font-black uppercase tracking-wider border border-[#4285F4]/30 shadow-[0_0_8px_rgba(66,133,244,0.3)]">
              ● GOOGLE ID
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
