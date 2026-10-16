import React from 'react';

export default function AuthTabs({ activeTab, onChangeTab }) {
  return (
    <div className="w-full bg-[#161a24] rounded-full p-1 flex items-center justify-between mb-5 border border-outline-variant/30">
      <button
        type="button"
        onClick={() => onChangeTab('login')}
        className={`flex-1 py-2 px-3 rounded-full text-xs sm:text-sm font-bold tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer select-none ${
          activeTab === 'login'
            ? 'bg-primary-container text-black shadow-[0_0_15px_rgba(0,210,255,0.4)]'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <span className="material-symbols-outlined text-base">login</span>
        <span>ĐĂNG NHẬP</span>
      </button>

      <button
        type="button"
        onClick={() => onChangeTab('register')}
        className={`flex-1 py-2 px-3 rounded-full text-xs sm:text-sm font-bold tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer select-none ${
          activeTab === 'register'
            ? 'bg-primary-container text-black shadow-[0_0_15px_rgba(0,210,255,0.4)]'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <span className="material-symbols-outlined text-base">person_add</span>
        <span>ĐĂNG KÝ</span>
      </button>
    </div>
  );
}
