import React, { useState, useEffect, useMemo } from 'react';
import { shopApi } from '../apis/shopApi';
import { CardBack } from './CardBack';
import { AvatarFrame } from './AvatarFrame';
import { soundEngine } from '../utils/audioFx';

/**
 * Helper render Mặt Trước (Card Front) 3D cho từng bộ Skin
 * Hỗ trợ 2 chế độ xem trước:
 * - 'number': Lá Số Đặc Trưng (Signature Number Card)
 * - 'action': Lá Kỹ Năng / Wild Độc Quyền (Special Action / Wild Card)
 */
function CardFrontPreview({ skinId, mode = 'number' }) {
  // =========================================================================
  // 1. HALLOWEEN SPOOKY 2026 (Jack-o'-Lantern Edition)
  // =========================================================================
  if (skinId === 'skin_halloween') {
    if (mode === 'action') {
      // Haunted Castle Wild Moon Card
      return (
        <div className="relative w-full h-full rounded-[24px] p-2 bg-gradient-to-br from-purple-600 via-indigo-900 to-amber-950 shadow-2xl flex flex-col justify-between select-none">
          <div className="relative w-full h-full rounded-[18px] bg-gradient-to-b from-[#13072b] via-black to-[#220d04] overflow-hidden flex flex-col justify-between p-2.5 border border-purple-500/40">
            {/* Top Left Corner */}
            <div className="flex flex-col items-center self-start leading-none z-10">
              <span className="font-headline text-lg font-black text-amber-300 drop-shadow-[0_0_8px_#f59e0b]">
                WILD
              </span>
              <span className="text-xs">🦇</span>
            </div>

            {/* Center Moon & Castle */}
            <div className="absolute inset-0 m-auto w-34 h-48 rounded-[50%] -rotate-12 bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-400 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.7)] flex items-center justify-center">
              <div className="w-full h-full rounded-[50%] bg-gradient-to-b from-stone-950 via-purple-950 to-black flex flex-col items-center justify-center overflow-hidden relative p-2">
                <svg className="w-16 h-16 rotate-12 drop-shadow-[0_0_12px_#fef08a]" fill="none" viewBox="0 0 100 100">
                  <circle cx="50" cy="42" fill="#fef08a" opacity="0.95" r="28" />
                  <path d="M26 80 L32 55 L38 55 L38 80 L44 80 L44 48 L48 42 L52 42 L56 48 L56 80 L62 80 L62 55 L68 55 L74 80 Z" fill="#0f0728" />
                  <polygon fill="#0f0728" points="50,30 46,42 54,42" />
                  <path d="M22 28 Q26 24 30 28 Q28 30 26 28 Z" fill="#0f0728" />
                  <path d="M70 20 Q74 16 78 20 Q76 22 74 20 Z" fill="#0f0728" />
                </svg>
                <span className="rotate-12 mt-1 font-headline text-[10px] text-amber-200 tracking-widest font-black uppercase drop-shadow">
                  SPOOKY WILD
                </span>
              </div>
            </div>

            {/* Bottom Right Corner */}
            <div className="flex flex-col items-center self-end leading-none rotate-180 z-10">
              <span className="font-headline text-lg font-black text-amber-300 drop-shadow-[0_0_8px_#f59e0b]">
                WILD
              </span>
              <span className="text-xs">🦇</span>
            </div>
          </div>
        </div>
      );
    }

    // Default Number 7 Spooky Pumpkin
    return (
      <div className="relative w-full h-full rounded-[24px] p-2 bg-gradient-to-br from-amber-500 via-orange-600 to-amber-950 shadow-2xl flex flex-col justify-between select-none">
        <div className="relative w-full h-full rounded-[18px] bg-gradient-to-b from-orange-950/90 via-black/95 to-amber-950/95 overflow-hidden flex flex-col justify-between p-2.5 border border-amber-500/40">
          <div className="flex flex-col items-center self-start leading-none z-10">
            <span className="font-headline text-2xl font-black text-amber-300 drop-shadow-[0_2px_8px_rgba(249,115,22,0.8)]">
              7
            </span>
            <span className="text-[10px]">🎃</span>
          </div>

          <div className="absolute inset-0 m-auto w-32 h-44 rounded-[50%] -rotate-12 bg-gradient-to-tr from-amber-600 to-orange-400 p-0.5 shadow-[0_0_20px_rgba(249,115,22,0.6)] flex items-center justify-center">
            <div className="w-full h-full rounded-[50%] bg-gradient-to-b from-black via-stone-900 to-amber-950 flex flex-col items-center justify-center overflow-hidden relative">
              <svg className="w-16 h-16 rotate-12 drop-shadow-[0_0_12px_#fbbf24]" fill="none" viewBox="0 0 100 100">
                <path d="M48 12C50 6 56 5 58 4C56 9 53 13 52 16" stroke="#4ade80" strokeLinecap="round" strokeWidth="4" />
                <polygon fill="#fef08a" points="30,38 42,42 34,48" />
                <polygon fill="#fef08a" points="70,38 58,42 66,48" />
                <polygon fill="#fde047" points="50,49 44,57 56,57" />
                <path d="M25,65 Q50,90 75,65 Q70,75 64,72 L62,67 L56,71 L51,66 L46,71 L40,67 L36,73 Q30,73 25,65 Z" fill="#fde047" />
                <ellipse cx="50" cy="54" opacity="0.5" rx="42" ry="34" stroke="#f97316" strokeDasharray="4 2" strokeWidth="2.5" />
              </svg>
              <span className="rotate-12 mt-0.5 font-headline text-[9px] text-amber-200 tracking-widest font-black">
                SPOOKY 7
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center self-end leading-none rotate-180 z-10">
            <span className="font-headline text-2xl font-black text-amber-300 drop-shadow-[0_2px_8px_rgba(249,115,22,0.8)]">
              7
            </span>
            <span className="text-[10px]">🎃</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. CYBERPUNK 2077 (Glitch Future Sci-Fi)
  // =========================================================================
  if (skinId === 'skin_cyberpunk') {
    if (mode === 'action') {
      // Cyber Matrix Wild +4 Card
      return (
        <div className="relative w-full h-full rounded-[24px] p-2 bg-gradient-to-br from-cyan-400 via-fuchsia-600 to-indigo-950 shadow-2xl flex flex-col justify-between select-none">
          <div className="relative w-full h-full rounded-[18px] bg-gradient-to-b from-[#020b18] via-black to-[#15021a] overflow-hidden flex flex-col justify-between p-2.5 border border-cyan-400/50">
            <div className="flex flex-col items-center self-start leading-none z-10">
              <span className="font-mono font-black text-xl text-cyan-300 drop-shadow-[0_0_8px_#00d2ff]">
                +4
              </span>
              <span className="text-[7px] font-mono text-fuchsia-400 font-black">WILD</span>
            </div>

            <div className="absolute inset-0 m-auto w-34 h-48 rounded-[50%] -rotate-12 bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-yellow-300 p-0.5 shadow-[0_0_25px_rgba(0,210,255,0.8)] flex items-center justify-center">
              <div className="w-full h-full rounded-[50%] bg-[#020b18] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,#00d2ff_1px,transparent_1px),linear-gradient(to_bottom,#ff007f_1px,transparent_1px)] bg-[size:6px_6px]"></div>
                <div className="rotate-12 flex flex-col items-center leading-none z-10">
                  <span className="font-headline text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-yellow-300 drop-shadow-[0_0_12px_#00d2ff]">
                    +4
                  </span>
                  <span className="font-mono text-[8px] font-black tracking-widest text-cyan-300 mt-1 uppercase">
                    CYBER MATRIX
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center self-end leading-none rotate-180 z-10">
              <span className="font-mono font-black text-xl text-cyan-300 drop-shadow-[0_0_8px_#00d2ff]">
                +4
              </span>
              <span className="text-[7px] font-mono text-fuchsia-400 font-black">WILD</span>
            </div>
          </div>
        </div>
      );
    }

    // Default Number 9 Cyber Card
    return (
      <div className="relative w-full h-full rounded-[24px] p-2 bg-gradient-to-br from-cyan-400 via-sky-600 to-blue-950 shadow-2xl flex flex-col justify-between select-none">
        <div className="relative w-full h-full rounded-[18px] bg-gradient-to-b from-[#020b18] via-black to-[#05132b] overflow-hidden flex flex-col justify-between p-2.5 border border-cyan-400/50">
          <div className="flex flex-col items-center self-start leading-none z-10">
            <span className="font-mono font-black text-2xl text-cyan-300 drop-shadow-[0_0_8px_#38bdf8]">
              9
            </span>
            <span className="text-[8px] font-mono text-cyan-400 font-bold">CYBER</span>
          </div>

          <div className="absolute inset-0 m-auto w-32 h-44 rounded-[50%] -rotate-12 bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-sky-300 p-0.5 shadow-[0_0_20px_rgba(6,182,212,0.8)] flex items-center justify-center">
            <div className="w-full h-full rounded-[50%] bg-[#020b18] flex flex-col items-center justify-center">
              <span className="rotate-12 font-headline text-4xl font-black text-cyan-300 drop-shadow-[0_0_12px_#00d2ff]">
                9
              </span>
              <span className="rotate-12 font-mono text-[8px] text-fuchsia-400 font-bold tracking-widest mt-0.5">
                NEO 2077
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center self-end leading-none rotate-180 z-10">
            <span className="font-mono font-black text-2xl text-cyan-300 drop-shadow-[0_0_8px_#38bdf8]">
              9
            </span>
            <span className="text-[8px] font-mono text-cyan-400 font-bold">CYBER</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. GALAXY (Thiên Hà Vũ Trụ Tím)
  // =========================================================================
  if (skinId === 'skin_galaxy') {
    if (mode === 'action') {
      // Supernova Galaxy Wild Card
      return (
        <div className="relative w-full h-full rounded-[24px] p-2 bg-gradient-to-br from-purple-500 via-indigo-700 to-slate-950 shadow-2xl flex flex-col justify-between select-none">
          <div className="relative w-full h-full rounded-[18px] bg-gradient-to-b from-[#0e0326] via-black to-[#050014] overflow-hidden flex flex-col justify-between p-2.5 border border-purple-400/50">
            <div className="flex flex-col items-center self-start leading-none z-10">
              <span className="font-headline text-lg font-black text-purple-200 drop-shadow-[0_0_8px_#c084fc]">
                WILD
              </span>
              <span className="text-xs">✨</span>
            </div>

            <div className="absolute inset-0 m-auto w-34 h-48 rounded-[50%] -rotate-12 bg-gradient-to-tr from-purple-500 via-pink-400 to-cyan-300 p-0.5 shadow-[0_0_25px_rgba(192,132,252,0.85)] flex items-center justify-center">
              <div className="w-full h-full rounded-[50%] bg-[#100424] flex flex-col items-center justify-center relative overflow-hidden p-2">
                <svg className="w-16 h-16 rotate-12 drop-shadow-[0_0_12px_#38bdf8]" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="18" fill="#e0e7ff" opacity="0.9" />
                  <ellipse cx="50" cy="50" rx="38" ry="12" stroke="#a855f7" strokeWidth="2.5" transform="rotate(-25 50 50)" />
                  <ellipse cx="50" cy="50" rx="34" ry="10" stroke="#38bdf8" strokeWidth="1.5" transform="rotate(35 50 50)" />
                </svg>
                <span className="rotate-12 mt-1 font-headline text-[9px] text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-pink-200 to-purple-300 tracking-widest font-black uppercase">
                  SUPERNOVA
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center self-end leading-none rotate-180 z-10">
              <span className="font-headline text-lg font-black text-purple-200 drop-shadow-[0_0_8px_#c084fc]">
                WILD
              </span>
              <span className="text-xs">✨</span>
            </div>
          </div>
        </div>
      );
    }

    // Default Number 5 Galaxy Card
    return (
      <div className="relative w-full h-full rounded-[24px] p-2 bg-gradient-to-br from-indigo-500 via-purple-700 to-slate-950 shadow-2xl flex flex-col justify-between select-none">
        <div className="relative w-full h-full rounded-[18px] bg-gradient-to-b from-[#0b0320] via-black to-[#050012] overflow-hidden flex flex-col justify-between p-2.5 border border-purple-400/50">
          <div className="flex flex-col items-center self-start leading-none z-10">
            <span className="font-headline text-2xl font-black text-purple-200 drop-shadow-[0_0_8px_#c084fc]">
              5
            </span>
            <span className="text-[10px]">✨</span>
          </div>

          <div className="absolute inset-0 m-auto w-32 h-44 rounded-[50%] -rotate-12 bg-gradient-to-tr from-purple-500 via-indigo-400 to-pink-400 p-0.5 shadow-[0_0_20px_rgba(168,85,247,0.7)] flex items-center justify-center">
            <div className="w-full h-full rounded-[50%] bg-[#0e0424] flex flex-col items-center justify-center">
              <span className="rotate-12 font-headline text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-pink-200 to-purple-300 drop-shadow-[0_0_12px_#c084fc]">
                5
              </span>
              <span className="rotate-12 font-headline text-[8px] text-cyan-300 font-bold tracking-widest mt-0.5">
                GALAXY
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center self-end leading-none rotate-180 z-10">
            <span className="font-headline text-2xl font-black text-purple-200 drop-shadow-[0_0_8px_#c084fc]">
              5
            </span>
            <span className="text-[10px]">✨</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. DRAGON FIRE (Hỏa Long Rực Lửa - Dragon Flame Scales)
  // =========================================================================
  if (skinId === 'skin_dragon_fire' || skinId === 'skin_dragon') {
    if (mode === 'action') {
      // Cataclysmic Dragon Inferno Wild Card
      return (
        <div className="relative w-full h-full rounded-[24px] p-2 bg-gradient-to-br from-red-600 via-orange-600 to-neutral-950 shadow-2xl flex flex-col justify-between select-none">
          <div className="relative w-full h-full rounded-[18px] bg-gradient-to-b from-[#240404] via-black to-[#120000] overflow-hidden flex flex-col justify-between p-2.5 border border-orange-500/60">
            <div className="flex flex-col items-center self-start leading-none z-10">
              <span className="font-headline text-lg font-black text-amber-300 drop-shadow-[0_0_8px_#ea580c]">
                +4
              </span>
              <span className="text-xs">🔥</span>
            </div>

            <div className="absolute inset-0 m-auto w-34 h-48 rounded-[50%] -rotate-12 bg-gradient-to-tr from-red-600 via-orange-500 to-amber-300 p-0.5 shadow-[0_0_25px_rgba(234,88,12,0.9)] flex items-center justify-center">
              <div className="w-full h-full rounded-[50%] bg-[#180303] flex flex-col items-center justify-center relative overflow-hidden p-2">
                <svg className="w-16 h-16 rotate-12 drop-shadow-[0_0_12px_#f97316]" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M50 10 C55 25 70 30 75 45 C78 55 72 65 65 72 C60 65 58 55 52 50 C50 65 42 75 30 70 C25 60 28 45 35 35 C38 40 42 42 45 38 C40 25 45 15 50 10 Z" fill="#f97316" />
                  <path d="M50 35 C52 42 60 45 62 52 C60 58 52 62 48 55 C46 50 48 45 50 35 Z" fill="#fde047" />
                </svg>
                <span className="rotate-12 font-headline text-2xl font-black text-amber-300 drop-shadow -mt-1">
                  +4
                </span>
                <span className="rotate-12 font-headline text-[8px] text-orange-200 tracking-widest font-black uppercase">
                  DRAGON INFERNO
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center self-end leading-none rotate-180 z-10">
              <span className="font-headline text-lg font-black text-amber-300 drop-shadow-[0_0_8px_#ea580c]">
                +4
              </span>
              <span className="text-xs">🔥</span>
            </div>
          </div>
        </div>
      );
    }

    // Default Number 8 Dragon Card
    return (
      <div className="relative w-full h-full rounded-[24px] p-2 bg-gradient-to-br from-red-600 via-orange-600 to-stone-950 shadow-2xl flex flex-col justify-between select-none">
        <div className="relative w-full h-full rounded-[18px] bg-gradient-to-b from-[#1f0404] via-black to-[#0e0101] overflow-hidden flex flex-col justify-between p-2.5 border border-orange-500/50">
          <div className="flex flex-col items-center self-start leading-none z-10">
            <span className="font-headline text-2xl font-black text-amber-300 drop-shadow-[0_2px_8px_rgba(234,88,12,0.9)]">
              8
            </span>
            <span className="text-[10px]">🔥</span>
          </div>

          <div className="absolute inset-0 m-auto w-32 h-44 rounded-[50%] -rotate-12 bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 p-0.5 shadow-[0_0_22px_rgba(249,115,22,0.8)] flex items-center justify-center">
            <div className="w-full h-full rounded-[50%] bg-[#1a0303] flex flex-col items-center justify-center">
              <span className="rotate-12 font-headline text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-orange-400 to-red-600 drop-shadow-[0_2px_8px_rgba(234,88,12,0.95)]">
                8
              </span>
              <span className="rotate-12 font-headline text-[8px] text-amber-300 font-bold tracking-widest mt-0.5 uppercase">
                HỎA LONG
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center self-end leading-none rotate-180 z-10">
            <span className="font-headline text-2xl font-black text-amber-300 drop-shadow-[0_2px_8px_rgba(234,88,12,0.9)]">
              8
            </span>
            <span className="text-[10px]">🔥</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 5. GOLD LUXURY (Hoàng Gia Mạ Vàng 24K - Luxury 24K Gold Plated)
  // =========================================================================
  if (skinId === 'skin_gold_luxury' || skinId === 'skin_gold_24k' || skinId === 'skin_gold') {
    if (mode === 'action') {
      // Sovereign Imperial 24K Crown Wild Card
      return (
        <div className="relative w-full h-full rounded-[24px] p-2 bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-800 shadow-2xl flex flex-col justify-between select-none">
          <div className="relative w-full h-full rounded-[18px] bg-gradient-to-b from-[#1e1503] via-[#0c0901] to-[#2b1f05] overflow-hidden flex flex-col justify-between p-2.5 border border-amber-300/70">
            <div className="flex flex-col items-center self-start leading-none z-10">
              <span className="font-serif font-black text-base text-amber-200 drop-shadow-[0_0_8px_#fbbf24]">
                WILD
              </span>
              <span className="text-xs">👑</span>
            </div>

            <div className="absolute inset-0 m-auto w-34 h-48 rounded-[50%] -rotate-12 bg-gradient-to-tr from-yellow-200 via-amber-400 to-yellow-600 p-0.5 shadow-[0_0_26px_rgba(251,191,36,0.95)] flex items-center justify-center">
              <div className="w-full h-full rounded-[50%] bg-[#150e02] flex flex-col items-center justify-center relative overflow-hidden p-2">
                <svg className="w-16 h-16 rotate-12 drop-shadow-[0_0_12px_#fbbf24]" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M15 65 L25 35 L40 50 L50 20 L60 50 L75 35 L85 65 Z" fill="#fbbf24" />
                  <rect x="15" y="68" width="70" height="8" rx="2" fill="#fde047" />
                  <circle cx="50" cy="20" r="4" fill="#fef08a" />
                  <circle cx="25" cy="35" r="3.5" fill="#fef08a" />
                  <circle cx="75" cy="35" r="3.5" fill="#fef08a" />
                </svg>
                <span className="rotate-12 font-headline text-lg font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-500 drop-shadow mt-0.5">
                  24K ROYAL
                </span>
                <span className="rotate-12 font-mono text-[7px] text-amber-300 font-extrabold tracking-widest uppercase">
                  SOVEREIGN WILD
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center self-end leading-none rotate-180 z-10">
              <span className="font-serif font-black text-base text-amber-200 drop-shadow-[0_0_8px_#fbbf24]">
                WILD
              </span>
              <span className="text-xs">👑</span>
            </div>
          </div>
        </div>
      );
    }

    // Default Number 1 Royal Ace Gold Card
    return (
      <div className="relative w-full h-full rounded-[24px] p-2 bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-800 shadow-2xl flex flex-col justify-between select-none">
        <div className="relative w-full h-full rounded-[18px] bg-gradient-to-b from-[#1a1202] via-[#0a0701] to-[#241a04] overflow-hidden flex flex-col justify-between p-2.5 border border-amber-300/60">
          <div className="flex flex-col items-center self-start leading-none z-10">
            <span className="font-serif font-black text-2xl text-amber-200 drop-shadow-[0_2px_8px_rgba(251,191,36,0.9)]">
              1
            </span>
            <span className="text-[10px]">👑</span>
          </div>

          <div className="absolute inset-0 m-auto w-32 h-44 rounded-[50%] -rotate-12 bg-gradient-to-tr from-yellow-200 via-amber-400 to-yellow-600 p-0.5 shadow-[0_0_24px_rgba(251,191,36,0.9)] flex items-center justify-center">
            <div className="w-full h-full rounded-[50%] bg-[#120d02] flex flex-col items-center justify-center">
              <span className="rotate-12 font-serif font-black text-4xl text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-500 drop-shadow-[0_2px_8px_rgba(251,191,36,0.95)]">
                I
              </span>
              <span className="rotate-12 font-headline text-[8px] text-amber-300 font-bold tracking-widest mt-0.5 uppercase">
                ROYAL 24K
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center self-end leading-none rotate-180 z-10">
            <span className="font-serif font-black text-2xl text-amber-200 drop-shadow-[0_2px_8px_rgba(251,191,36,0.9)]">
              1
            </span>
            <span className="text-[10px]">👑</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 6. MẶC ĐỊNH: ĐỎ RUBY (Classic Uno Red Neo-Glassmorphism)
  // =========================================================================
  if (mode === 'action') {
    // Prismatic Crystalline Gem Wild Card
    return (
      <div className="relative w-full h-full rounded-[24px] p-2 bg-gradient-to-br from-slate-900 via-rose-950 to-slate-950 shadow-2xl flex flex-col justify-between select-none">
        <div className="relative w-full h-full rounded-[18px] bg-black/80 overflow-hidden flex flex-col justify-between p-2.5 border border-white/20">
          <div className="flex flex-col items-center self-start leading-none z-10">
            <span className="font-headline text-lg font-black text-white drop-shadow">
              WILD
            </span>
            <span className="text-xs">💎</span>
          </div>

          <div className="absolute inset-0 m-auto w-34 h-48 rounded-[50%] -rotate-12 bg-white/20 border border-white/30 backdrop-blur-xs flex items-center justify-center shadow-lg">
            <div className="rotate-12 flex flex-col items-center leading-none">
              <div className="w-14 h-14 rounded-full overflow-hidden grid grid-cols-2 grid-rows-2 shadow-xl border-2 border-white/90">
                <div className="bg-rose-500"></div>
                <div className="bg-sky-400"></div>
                <div className="bg-amber-400"></div>
                <div className="bg-emerald-500"></div>
              </div>
              <span className="mt-1 font-headline text-[10px] text-white font-black tracking-widest uppercase">
                NEO WILD
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center self-end leading-none rotate-180 z-10">
            <span className="font-headline text-lg font-black text-white drop-shadow">
              WILD
            </span>
            <span className="text-xs">💎</span>
          </div>
        </div>
      </div>
    );
  }

  // Default Classic 7 Ruby Card
  return (
    <div className="relative w-full h-full rounded-[24px] p-2 bg-gradient-to-br from-rose-500 via-red-600 to-rose-700 shadow-2xl flex flex-col justify-between select-none">
      <div className="relative w-full h-full rounded-[18px] bg-rose-600/90 overflow-hidden flex flex-col justify-between p-2.5 border border-white/25">
        <div className="flex flex-col items-center self-start leading-none z-10">
          <span className="font-headline text-3xl font-black text-white drop-shadow">
            7
          </span>
        </div>
        <div className="absolute inset-0 m-auto w-32 h-44 rounded-[50%] -rotate-12 bg-white/20 border border-white/30 backdrop-blur-xs flex items-center justify-center">
          <span className="rotate-12 font-headline text-5xl font-black text-white italic drop-shadow-md">
            7
          </span>
        </div>
        <div className="flex flex-col items-center self-end leading-none rotate-180 z-10">
          <span className="font-headline text-3xl font-black text-white drop-shadow">
            7
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Component Modal Cửa Hàng Trang Bị (Shop & Customization)
 */
export function ShopModal({ isOpen, onClose, user, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('card_skin'); // 'card_skin' | 'avatar_frame' | 'inventory'
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [previewMode, setPreviewMode] = useState('number'); // 'number' | 'action'
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Số dư Vàng hiện tại
  const currentCoins = user?.coins ?? 1000;
  const equippedCardSkin = user?.equippedCardSkin || 'skin_classic';
  const equippedAvatarFrame = user?.equippedAvatarFrame || 'frame_default';
  const userInventory = user?.inventory || ['skin_classic', 'frame_default'];

  // Tải danh mục khi mở modal
  const fetchCatalog = async () => {
    setIsLoading(true);
    const res = await shopApi.getItems();
    if (res && res.success && Array.isArray(res.items)) {
      setItems(res.items);
      if (!selectedItem) {
        const defaultSelect = res.items.find((it) => it.id === 'skin_halloween') || res.items[0];
        setSelectedItem(defaultSelect);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchCatalog();
    }
  }, [isOpen]);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Mua vật phẩm
  const handleBuy = async (item) => {
    if (currentCoins < item.price) {
      showToast('Bạn không đủ Vàng để mua vật phẩm này!', 'error');
      return;
    }

    setActionLoadingId(item.id);
    const res = await shopApi.buyItem(item.id);
    setActionLoadingId(null);

    if (res.success) {
      soundEngine.playVictory();
      showToast(`Mua thành công ${item.name}!`, 'success');

      if (onUpdateUser) {
        onUpdateUser({
          coins: res.coins,
          inventory: res.inventory,
          equippedCardSkin: res.equippedCardSkin,
          equippedAvatarFrame: res.equippedAvatarFrame,
        });
      }
      fetchCatalog();
    } else {
      showToast(res.message || 'Giao dịch thất bại!', 'error');
    }
  };

  // Trang bị vật phẩm
  const handleEquip = async (item) => {
    setActionLoadingId(item.id);
    const res = await shopApi.equipItem(item.id);
    setActionLoadingId(null);

    if (res.success) {
      soundEngine.playEquip();
      showToast(`Đã trang bị ${item.name}!`, 'success');

      if (onUpdateUser) {
        onUpdateUser({
          equippedCardSkin: res.equippedCardSkin,
          equippedAvatarFrame: res.equippedAvatarFrame,
          inventory: res.inventory,
        });
      }
      fetchCatalog();
    } else {
      showToast(res.message || 'Trang bị thất bại!', 'error');
    }
  };

  // Lọc items theo Tab
  const filteredItems = useMemo(() => {
    if (activeTab === 'inventory') {
      return items.filter((it) => it.isDefault || userInventory.includes(it.id));
    }
    return items.filter((it) => it.type === activeTab);
  }, [items, activeTab, userInventory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-60 px-5 py-2.5 rounded-full font-headline font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-rose-600 text-white shadow-rose-900/50'
              : 'bg-emerald-600 text-white shadow-emerald-900/50'
          }`}
        >
          <span>{toastMessage.type === 'error' ? '⚠️' : '🎉'}</span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-[#0c101a] border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,210,255,0.2)] flex flex-col overflow-hidden text-slate-100">
        
        {/* ================= MODAL HEADER ================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-8 py-4 border-b border-white/10 bg-[#101524]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <span className="material-symbols-outlined text-black font-black text-2xl">
                storefront
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline font-black text-lg sm:text-xl text-white tracking-wide">
                  CỬA HÀNG & TÚI ĐỒ
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Halloween '26
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sưu tầm Mặt Lưng Bài & Khung Avatar độc quyền để thể hiện đẳng cấp
              </p>
            </div>
          </div>

          {/* VÍ TIỀN VÀNG & NÚT ĐÓNG */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-amber-400/40 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
              <span className="text-lg animate-pulse">🪙</span>
              <span className="font-headline font-black text-amber-300 text-sm sm:text-base">
                {currentCoins.toLocaleString()} <span className="text-[10px] text-amber-400/80">VÀNG</span>
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-all flex items-center justify-center cursor-pointer"
              title="Đóng cửa hàng"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* ================= TAB NAVIGATION ================= */}
        <div className="flex items-center justify-start gap-2 px-5 sm:px-8 py-2.5 bg-[#0a0e18] border-b border-white/5 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('card_skin');
              const firstSkin = items.find((i) => i.type === 'card_skin');
              if (firstSkin) setSelectedItem(firstSkin);
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-headline text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'card_skin'
                ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-black shadow-lg shadow-cyan-500/30 font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🃏</span>
            <span>Mặt Lưng Bài ({items.filter((i) => i.type === 'card_skin').length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('avatar_frame');
              const firstFrame = items.find((i) => i.type === 'avatar_frame');
              if (firstFrame) setSelectedItem(firstFrame);
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-headline text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'avatar_frame'
                ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-black shadow-lg shadow-cyan-500/30 font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🖼️</span>
            <span>Khung Avatar ({items.filter((i) => i.type === 'avatar_frame').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-headline text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-lg shadow-amber-500/30 font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🎒</span>
            <span>Túi Đồ Đã Sở Hữu ({userInventory.length})</span>
          </button>
        </div>

        {/* ================= MODAL BODY: 2 CỘT (LIST & 3D PREVIEW) ================= */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* CỘT TRÁI: DANH SÁCH VẬT PHẨM (LG: 7 CỘT) */}
          <div className="lg:col-span-7 p-4 sm:p-6 overflow-y-auto max-h-[58vh] lg:max-h-[70vh] space-y-3.5 pr-2">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-4xl animate-spin text-cyan-400">
                  progress_activity
                </span>
                <p className="mt-3 text-sm">Đang tải danh mục Cửa Hàng...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <span className="text-4xl">🎒</span>
                <p className="mt-2 text-sm font-bold">Không có vật phẩm nào!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredItems.map((item) => {
                  const isOwned = item.isDefault || userInventory.includes(item.id);
                  const isEquipped =
                    item.type === 'card_skin'
                      ? equippedCardSkin === item.id
                      : equippedAvatarFrame === item.id;
                  const isSelected = selectedItem?.id === item.id;
                  const canAfford = currentCoins >= item.price;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        soundEngine.playCardSlide();
                      }}
                      className={`
                        relative group p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between
                        ${isSelected
                          ? 'bg-[#182035] border-cyan-400 shadow-[0_0_20px_rgba(0,210,255,0.3)] scale-[1.02]'
                          : 'bg-[#101524]/90 border-white/10 hover:border-white/30 hover:bg-[#141b2e]'
                        }
                      `}
                    >
                      {/* Huy hiệu Góc */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            item.rarity === 'legendary'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : item.rarity === 'epic'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : item.rarity === 'rare'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                          }`}
                        >
                          {item.rarity === 'legendary'
                            ? '⭐ Huyền Thoại'
                            : item.rarity === 'epic'
                            ? '✨ Sử Thi'
                            : item.rarity === 'rare'
                            ? '💎 Hiếm'
                            : 'Cơ Bản'}
                        </span>

                        {isEquipped && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <span>✓</span> Đang dùng
                          </span>
                        )}
                      </div>

                      {/* Thông tin vật phẩm */}
                      <div className="flex items-center gap-3 my-1">
                        {item.type === 'card_skin' ? (
                          <div className="w-12 h-16 shrink-0 flex items-center justify-center">
                            <CardBack skinId={item.id} size="sm" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                            <AvatarFrame frameId={item.id} size="md">
                              <img
                                src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.nickname || 'Guest'}`}
                                alt="Demo"
                                className="w-full h-full object-cover"
                              />
                            </AvatarFrame>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="font-headline font-bold text-sm text-white truncate group-hover:text-cyan-300 transition-colors">
                            {item.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.subtitle}
                          </p>
                          <div className="mt-1 flex items-center gap-1">
                            {isOwned ? (
                              <span className="text-[11px] font-bold text-emerald-400">
                                Đã sở hữu
                              </span>
                            ) : (
                              <span className="text-[11px] font-black text-amber-300 flex items-center gap-1">
                                <span>🪙</span> {item.price.toLocaleString()} Vàng
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nút Hành Động Nhanh */}
                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          {item.type === 'card_skin' ? 'Mặt Lưng' : 'Khung Viền'}
                        </span>

                        {isEquipped ? (
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                            ✓ Đã trang bị
                          </span>
                        ) : isOwned ? (
                          <button
                            type="button"
                            disabled={actionLoadingId === item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEquip(item);
                            }}
                            className="px-3 py-1 rounded-full bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-400/40 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                          >
                            {actionLoadingId === item.id ? 'Đang lưu...' : 'Trang Bị'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!canAfford || actionLoadingId === item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuy(item);
                            }}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              canAfford
                                ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-md shadow-amber-500/30'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                            }`}
                          >
                            {actionLoadingId === item.id
                              ? 'Đang mua...'
                              : canAfford
                              ? 'Mua Ngay'
                              : 'Thiếu Vàng'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: 3D CARD FLIP PREVIEW & CHI TIẾT (LG: 5 CỘT) */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-[#0e1320] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col items-center justify-between overflow-y-auto">
            {selectedItem ? (
              <div className="w-full flex flex-col items-center">
                {/* Tiêu đề & Rarity */}
                <div className="text-center mb-3">
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full inline-block mb-1.5 ${
                      selectedItem.rarity === 'legendary'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                        : selectedItem.rarity === 'epic'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : selectedItem.rarity === 'rare'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                    }`}
                  >
                    {selectedItem.rarity === 'legendary'
                      ? '⭐ Phiên Bản Giới Hạn Huyền Thoại'
                      : selectedItem.rarity === 'epic'
                      ? '✨ Sử Thi Độc Quyền'
                      : selectedItem.rarity === 'rare'
                      ? '💎 Hiếm'
                      : 'Cơ Bản'}
                  </span>
                  <h3 className="font-headline font-black text-xl text-white">
                    {selectedItem.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedItem.subtitle}
                  </p>
                </div>

                {/* KHU VỰC PREVIEW (3D FLIP CHO CARD SKIN / KHUNG CHO AVATAR) */}
                <div className="my-1 flex flex-col items-center">
                  {selectedItem.type === 'card_skin' ? (
                    <div className="flex flex-col items-center">
                      {/* Thẻ 3D Flip Container */}
                      <div
                        onClick={() => {
                          setIsFlipped((prev) => !prev);
                          soundEngine.playCardSlide();
                        }}
                        className="relative w-48 h-72 sm:w-52 sm:h-78 perspective-1000 cursor-pointer group"
                        title="Bấm vào thẻ bài để lật xem Mặt Trước / Mặt Sau 3D"
                      >
                        <div
                          className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                            isFlipped ? 'rotate-y-180' : ''
                          }`}
                        >
                          {/* MẶT SAU (LƯNG BÀI - DEFAULT) */}
                          <div className="absolute inset-0 w-full h-full backface-hidden flex items-center justify-center">
                            <CardBack
                              skinId={selectedItem.id}
                              size="custom"
                              className="w-full h-full"
                              interactive
                            />
                          </div>

                          {/* MẶT TRƯỚC (BÀI SỐ / WILD 3D) */}
                          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 flex items-center justify-center">
                            <CardFrontPreview skinId={selectedItem.id} mode={previewMode} />
                          </div>
                        </div>
                      </div>

                      {/* Nút lật xem trước & Tùy chọn Mặt Trước */}
                      <div className="flex flex-col items-center gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsFlipped((prev) => !prev);
                            soundEngine.playCardSlide();
                          }}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer border border-white/10 shadow-md"
                        >
                          <span className="material-symbols-outlined text-sm">
                            3d_rotation
                          </span>
                          <span>{isFlipped ? '🔄 Lật Xem Mặt Lưng Bài' : '🔄 Lật Xem Mặt Trước Thẻ Bài'}</span>
                        </button>

                        {/* Tùy chọn xem Mặt Trước: Lá Số vs Lá Kỹ Năng */}
                        {isFlipped && (
                          <div className="flex items-center gap-1.5 p-1 bg-black/60 rounded-full border border-white/10 animate-in fade-in duration-200">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewMode('number');
                                soundEngine.playCardSlide();
                              }}
                              className={`px-3 py-1 rounded-full text-[10px] font-headline font-bold transition-all cursor-pointer ${
                                previewMode === 'number'
                                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              🃏 Lá Số Đặc Trưng
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewMode('action');
                                soundEngine.playCardSlide();
                              }}
                              className={`px-3 py-1 rounded-full text-[10px] font-headline font-bold transition-all cursor-pointer ${
                                previewMode === 'action'
                                  ? 'bg-amber-500/30 text-amber-300 border border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              ✨ Lá Kỹ Năng / Wild
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Preview Khung Viền Avatar */
                    <div className="flex flex-col items-center py-6">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                        <AvatarFrame frameId={selectedItem.id} size="xl">
                          <img
                            src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.nickname || 'Guest'}`}
                            alt="Avatar Preview"
                            className="w-full h-full object-cover"
                          />
                        </AvatarFrame>
                      </div>
                      <span className="mt-4 text-xs text-slate-400 font-bold">
                        Xem thử với Avatar của bạn
                      </span>
                    </div>
                  )}
                </div>

                {/* Mô tả chi tiết */}
                <div className="w-full mt-3 p-3.5 rounded-2xl bg-black/40 border border-white/5 text-xs text-slate-300 leading-relaxed text-center">
                  {selectedItem.description}
                </div>

                {/* NÚT MUA HOẶC TRANG BỊ CHÍNH */}
                <div className="w-full mt-4">
                  {(() => {
                    const isOwned = selectedItem.isDefault || userInventory.includes(selectedItem.id);
                    const isEquipped =
                      selectedItem.type === 'card_skin'
                        ? equippedCardSkin === selectedItem.id
                        : equippedAvatarFrame === selectedItem.id;
                    const canAfford = currentCoins >= selectedItem.price;

                    if (isEquipped) {
                      return (
                        <button
                          disabled
                          className="w-full py-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-headline font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-default"
                        >
                          <span>✓</span>
                          <span>ĐANG ĐƯỢC TRANG BỊ</span>
                        </button>
                      );
                    }

                    if (isOwned) {
                      return (
                        <button
                          disabled={actionLoadingId === selectedItem.id}
                          onClick={() => handleEquip(selectedItem)}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-headline font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        >
                          {actionLoadingId === selectedItem.id
                            ? 'Đang cập nhật...'
                            : 'TRANG BỊ VẬT PHẨM NÀY'}
                        </button>
                      );
                    }

                    return (
                      <button
                        disabled={!canAfford || actionLoadingId === selectedItem.id}
                        onClick={() => handleBuy(selectedItem)}
                        className={`w-full py-3 rounded-2xl font-headline font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-black hover:scale-[1.02] active:scale-[0.98] shadow-amber-500/30 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        {actionLoadingId === selectedItem.id ? (
                          'Đang xử lý giao dịch...'
                        ) : canAfford ? (
                          <>
                            <span>MỞ KHÓA NGAY VỚI</span>
                            <span>🪙 {selectedItem.price.toLocaleString()} VÀNG</span>
                          </>
                        ) : (
                          <>
                            <span>KHÔNG ĐỦ VÀNG (THIẾU 🪙 {(selectedItem.price - currentCoins).toLocaleString()})</span>
                          </>
                        )}
                      </button>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-500">
                Chọn một vật phẩm để xem trước
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ShopModal);
