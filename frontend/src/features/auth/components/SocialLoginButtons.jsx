import React from 'react';

export default function SocialLoginButtons({
  dividerText = 'ĐĂNG NHẬP ĐỒNG BỘ NHANH',
  onGoogleClick,
  isLoadingGoogle = false,
  onFastGoogleDemo,
}) {
  return (
    <div>
      {/* Divider */}
      <div className="relative flex items-center my-4">
        <div className="flex-grow h-[1px] bg-outline-variant/30"></div>
        <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-500 tracking-widest uppercase">
          {dividerText}
        </span>
        <div className="flex-grow h-[1px] bg-outline-variant/30"></div>
      </div>

      {/* Social Logins Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Google Official Button */}
        <button
          type="button"
          onClick={onGoogleClick}
          disabled={isLoadingGoogle}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-[#181d2a] hover:bg-[#22293b] text-slate-200 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-outline-variant/20 disabled:opacity-50"
        >
          {isLoadingGoogle ? (
            <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
          ) : (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.8 5 12 5z" fill="#EA4335" />
              <path d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z" fill="#4285F4" />
              <path d="M5.3 14.7c-.2-.7-.4-1.6-.4-2.7s.1-1.9.4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z" fill="#FBBC05" />
              <path d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z" fill="#34A853" />
            </svg>
          )}
          <span>Google Sign-In</span>
        </button>

        {/* Fast Google Test Button */}
        <button
          type="button"
          onClick={onFastGoogleDemo || onGoogleClick}
          disabled={isLoadingGoogle}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-[#131926] hover:bg-[#1a2336] text-[#00d2ff] text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-[#00d2ff]/30 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm text-[#00d2ff]">bolt</span>
          <span>Google Test Acc</span>
        </button>
      </div>
    </div>
  );
}
