import React, { useState, useEffect, useCallback } from 'react';
import { soundEngine } from '../utils/audioFx';

/**
 * Emote Overlay - Quản lý toàn bộ hiệu ứng thị giác và âm thanh biểu cảm trên bàn cờ
 */
export default function EmoteOverlay({
  activeEmotes = [], // Mảng các emote đang hiển thị [{ id, senderSeatIndex, senderName, emote, targetSeatIndex, timestamp }]
  getSeatPosition = () => ({ x: 50, y: 50 }), // Helper lấy tọa độ % (x, y) của ghế ngồi
}) {
  return (
    <div className="absolute inset-0 pointer-events-none z-45 overflow-hidden font-body">
      {activeEmotes.map((item) => {
        const isProjectile = item.emote?.type === 'projectile' && item.targetSeatIndex !== null && item.targetSeatIndex !== undefined;

        if (isProjectile) {
          const fromPos = getSeatPosition(item.senderSeatIndex);
          const toPos = getSeatPosition(item.targetSeatIndex);

          return (
            <React.Fragment key={item.id}>
              {/* VẬT THỂ BAY TỪ A -> B */}
              <div
                className="absolute z-50 text-3xl animate-projectile transform-gpu transition-all"
                style={{
                  '--start-x': `${fromPos.x}%`,
                  '--start-y': `${fromPos.y}%`,
                  '--end-x': `${toPos.x}%`,
                  '--end-y': `${toPos.y}%`,
                  left: `${fromPos.x}%`,
                  top: `${fromPos.y}%`,
                }}
              >
                {item.emote.icon}
              </div>

              {/* HIỆU ỨNG TÁC ĐỘNG / ĐẬP BẸP TRÊN AVATAR ĐÍCH (Sau khi bay đến) */}
              <div
                className="absolute z-50 -translate-x-1/2 -translate-y-1/2 animate-impact flex flex-col items-center"
                style={{
                  left: `${toPos.x}%`,
                  top: `${toPos.y}%`,
                  animationDelay: '400ms',
                }}
              >
                <div className="text-4xl filter drop-shadow-[0_0_20px_rgba(244,63,94,0.9)] animate-bounce">
                  {item.emote.icon}
                </div>
                <div className="px-2 py-0.5 rounded-full bg-rose-600/90 border border-white text-white font-headline font-black text-[10px] uppercase tracking-wider shadow-xl whitespace-nowrap mt-1">
                  {item.emote.label}
                </div>
              </div>
            </React.Fragment>
          );
        }

        // BÓNG THOẠI BAY NỔI TRÊN ĐẦU AVATAR NGƯỜI NÓI (Quick Chat & Emoji)
        const senderPos = getSeatPosition(item.senderSeatIndex);

        return (
          <div
            key={item.id}
            className="absolute z-50 -translate-x-1/2 -translate-y-full mb-3 animate-speech-bubble"
            style={{
              left: `${senderPos.x}%`,
              top: `${senderPos.y}%`,
            }}
          >
            <div className="relative px-3 py-1.5 rounded-2xl bg-[#121829]/95 border-2 border-yellow-400 text-white shadow-[0_0_25px_rgba(251,191,36,0.5)] flex items-center gap-1.5 whitespace-nowrap backdrop-blur-md">
              <span className="text-xl animate-pulse">{item.emote?.icon}</span>
              <span className="text-xs font-headline font-black text-yellow-300">
                {item.emote?.label}
              </span>
              {/* Mũi tên chỉ xuống avatar */}
              <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-8 border-t-yellow-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
