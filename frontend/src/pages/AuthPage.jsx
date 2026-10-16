import React from 'react';
import { AuthBackground, AuthCard } from '../features/auth';

export default function AuthPage({ onEnterGameWithBot }) {
  return (
    <div className="bg-[#0b0e17] font-body text-slate-100 min-h-screen relative overflow-x-hidden selection:bg-primary-container selection:text-black flex flex-col justify-between py-4">
      {/* Background Neon Lights */}
      <AuthBackground />

      {/* Top Header Pill */}
      <header className="relative z-10 w-full flex items-center justify-center pt-2 pb-2">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#131722]/80 backdrop-blur-md shadow-md border border-outline-variant/20">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ff3b5c] shadow-[0_0_8px_rgba(255,59,92,0.8)]"></span>
            <span className="w-2 h-2 rounded-full bg-[#00d2ff] shadow-[0_0_8px_rgba(0,210,255,0.8)]"></span>
            <span className="w-2 h-2 rounded-full bg-[#00e676] shadow-[0_0_8px_rgba(0,230,118,0.8)]"></span>
          </div>
          <span className="font-headline text-xs sm:text-sm font-extrabold tracking-widest uppercase text-white ml-1">
            NEO <span className="text-primary-container">UNO</span>
          </span>
        </div>
      </header>

      {/* Main Form Center */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center my-2">
        <AuthCard onEnterGameWithBot={onEnterGameWithBot} />
      </main>

      <div className="relative z-10"></div>
    </div>
  );
}
