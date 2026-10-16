import React from 'react';

export default function SocialLoginButtons({ dividerText = 'ĐĂNG NHẬP ĐỒNG BỘ NHANH', onGoogleClick, onDiscordClick }) {
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
        {/* Google Social Button */}
        <button
          type="button"
          onClick={onGoogleClick}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-[#181d2a] hover:bg-[#22293b] text-slate-200 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-outline-variant/20"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.8 5 12 5z" fill="#EA4335" />
            <path d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z" fill="#4285F4" />
            <path d="M5.3 14.7c-.2-.7-.4-1.6-.4-2.7s.1-1.9.4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z" fill="#FBBC05" />
            <path d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z" fill="#34A853" />
          </svg>
          <span>Google Play</span>
        </button>

        {/* Discord Social Button */}
        <button
          type="button"
          onClick={onDiscordClick}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-[#181d2a] hover:bg-[#22293b] text-slate-200 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-outline-variant/20"
        >
          <svg className="w-3.5 h-3.5 fill-[#5865F2]" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          <span>Discord Arena</span>
        </button>
      </div>
    </div>
  );
}
