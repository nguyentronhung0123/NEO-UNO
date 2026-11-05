import React, { useEffect, useRef, useState } from 'react';

export default function SocialLoginButtons({
  dividerText = 'ĐĂNG NHẬP ĐỒNG BỘ NHANH',
  onGoogleClick,
  isLoadingGoogle = false,
  onGoogleSuccess,
}) {
  const googleBtnRef = useRef(null);
  const [hasOfficialButton, setHasOfficialButton] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    let mounted = true;
    const initGoogleButton = () => {
      if (window.google?.accounts?.id && googleBtnRef.current && mounted) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => {
              if (response.credential && onGoogleSuccess) {
                onGoogleSuccess(response.credential);
              }
            },
          });

          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_black',
            size: 'large',
            type: 'standard',
            shape: 'pill',
            text: 'signin_with',
            logo_alignment: 'left',
            width: 330,
          });

          setHasOfficialButton(true);

          try {
            window.google.accounts.id.prompt();
          } catch {}
        } catch (err) {
          console.warn('[GIS] Error rendering Google button:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleButton();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogleButton();
        }
      }, 250);
      return () => {
        clearInterval(interval);
        mounted = false;
      };
    }

    return () => {
      mounted = false;
    };
  }, [clientId, onGoogleSuccess]);

  return (
    <div className="w-full">
      {/* Divider */}
      <div className="relative flex items-center my-4">
        <div className="flex-grow h-[1px] bg-outline-variant/30"></div>
        <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
          {dividerText}
        </span>
        <div className="flex-grow h-[1px] bg-outline-variant/30"></div>
      </div>

      {/* Google Login Section - Centered & Full Width */}
      <div className="flex flex-col items-center justify-center w-full">
        <div className="relative group w-full flex justify-center items-center">
          {/* Subtle Cyber Neon Ambient Glow Behind */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4285F4]/30 via-[#EA4335]/30 to-[#34A853]/30 rounded-full blur opacity-40 group-hover:opacity-75 transition-opacity duration-300 pointer-events-none"></div>

          {/* Official Google Button Container */}
          <div
            ref={googleBtnRef}
            className={`relative z-10 flex justify-center items-center w-full min-h-[44px] transition-transform duration-200 group-hover:scale-[1.01] ${
              hasOfficialButton ? 'flex' : 'hidden'
            }`}
          />

          {/* Fallback Cyberpunk Button (Shown until GIS loads or on click) */}
          {!hasOfficialButton && (
            <button
              type="button"
              onClick={onGoogleClick}
              disabled={isLoadingGoogle}
              className="relative z-10 w-full max-w-[330px] flex items-center justify-center gap-3 py-2.5 px-4 rounded-full bg-[#131724] hover:bg-[#1a2030] text-slate-100 text-xs sm:text-sm font-semibold shadow-lg border border-white/10 hover:border-[#00d2ff]/50 transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-50 min-h-[44px]"
            >
              {isLoadingGoogle ? (
                <span className="material-symbols-outlined text-lg animate-spin text-[#00d2ff]">autorenew</span>
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.8 5 12 5z" fill="#EA4335" />
                  <path d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z" fill="#4285F4" />
                  <path d="M5.3 14.7c-.2-.7-.4-1.6-.4-2.7s.1-1.9.4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z" fill="#FBBC05" />
                  <path d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z" fill="#34A853" />
                </svg>
              )}
              <span className="tracking-wide">Đăng nhập bằng Google</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
