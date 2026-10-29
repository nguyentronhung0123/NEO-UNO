import React from 'react';

// Cụm hạt hiệu ứng bùng nổ nhiều icon khi va chạm (Multi-Icon Burst)
const BURST_PARTICLES = [
  { id: 0, dx: '0px', dy: '0px', scale: 1.6, rotate: '0deg', delay: '460ms' },
  { id: 1, dx: '-45px', dy: '-38px', scale: 1.15, rotate: '-18deg', delay: '500ms' },
  { id: 2, dx: '45px', dy: '-42px', scale: 1.25, rotate: '15deg', delay: '540ms' },
  { id: 3, dx: '-55px', dy: '28px', scale: 1.0, rotate: '-12deg', delay: '580ms' },
  { id: 4, dx: '52px', dy: '32px', scale: 1.1, rotate: '22deg', delay: '520ms' },
  { id: 5, dx: '-12px', dy: '-68px', scale: 1.05, rotate: '-8deg', delay: '600ms' },
  { id: 6, dx: '15px', dy: '62px', scale: 0.95, rotate: '14deg', delay: '560ms' },
  { id: 7, dx: '-72px', dy: '-6px', scale: 0.9, rotate: '-25deg', delay: '620ms' },
  { id: 8, dx: '72px', dy: '-6px', scale: 0.9, rotate: '26deg', delay: '640ms' },
];

function getParticleIcon(itemId, baseIcon, index) {
  if (itemId === 'firework') {
    const list = ['🎉', '✨', '🎆', '🎉', '✨', '🎇', '🎉', '✨', '🎆'];
    return list[index % list.length];
  }
  return baseIcon;
}

/**
 * Emote Overlay - Hiển thị toàn bộ hiệu ứng thị giác đạn đạo bay (Projectile)
 * và bóng thoại biểu cảm (Speech Bubble) trên bàn cờ
 */
export default function EmoteOverlay({
  activeEmotes = [],
  getSeatPosition = () => ({ x: 50, y: 50 }),
}) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden font-body select-none">
      {activeEmotes.map((item) => {
        const isProjectile = item.emote?.type === 'projectile';

        if (isProjectile) {
          const fromPos = getSeatPosition(item.senderSeatIndex);
          // Nếu không chọn target hoặc target = null, tự động nhắm tới đối thủ chính ở đỉnh bàn cờ
          const targetIndex =
            item.targetSeatIndex !== null && item.targetSeatIndex !== undefined
              ? item.targetSeatIndex
              : item.senderSeatIndex === 0
              ? 1
              : 0;

          const toPos = getSeatPosition(targetIndex);
          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;

          return (
            <React.Fragment key={item.id}>
              {/* 1. ĐẠO CỤ BAY THEO HÌNH CUNG PARABOLIC TỪ GỐC ĐẾN ĐÍCH */}
              <div
                className="absolute z-50 text-4xl animate-projectile filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] transform-gpu"
                style={{
                  left: `${fromPos.x}%`,
                  top: `${fromPos.y}%`,
                  '--tx': `${dx}vw`,
                  '--ty': `${dy}vh`,
                }}
              >
                {item.emote.icon}
              </div>

              {/* 2. HIỆU ỨNG BÙNG NỔ NHIỀU ICON TRÊN MÀN HÌNH / AVATAR ĐÍCH (KHÔNG HIỆN CHỮ) */}
              {/* AURA PHÁT SÁNG NỀN TẠI VỊ TRÍ ĐÍCH */}
              <div
                className="absolute z-40 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: `${toPos.x}%`, top: `${toPos.y}%` }}
              >
                {item.emote.id === 'tomato' && (
                  <div className="w-32 h-32 rounded-full bg-rose-600/40 filter blur-xl animate-ping" />
                )}
                {item.emote.id === 'zap' && (
                  <div className="w-36 h-36 rounded-full bg-sky-400/50 filter blur-xl animate-pulse" />
                )}
                {item.emote.id === 'firework' && (
                  <div className="w-36 h-36 rounded-full bg-amber-400/40 filter blur-xl animate-ping" />
                )}
                {item.emote.id === 'poop' && (
                  <div className="w-32 h-32 rounded-full bg-amber-800/40 filter blur-xl animate-pulse" />
                )}
              </div>

              {/* CỤM NHIỀU ICON BÙNG NỔ LAN TỎA (MULTI-ICON BURST) */}
              {BURST_PARTICLES.map((particle, idx) => {
                const icon = getParticleIcon(item.emote.id, item.emote.icon, idx);
                const isCenter = idx === 0;

                return (
                  <div
                    key={`${item.id}_p_${particle.id}`}
                    className="absolute z-50 animate-multi-burst filter drop-shadow-[0_6px_20px_rgba(0,0,0,0.7)] transform-gpu pointer-events-none"
                    style={{
                      left: `${toPos.x}%`,
                      top: `${toPos.y}%`,
                      '--pdx': particle.dx,
                      '--pdy': particle.dy,
                      '--pscale': particle.scale,
                      '--prot': particle.rotate,
                      animationDelay: particle.delay,
                      fontSize: isCenter ? '4rem' : '2.8rem',
                    }}
                  >
                    {icon}
                  </div>
                );
              })}
            </React.Fragment>
          );
        }

        // BÓNG THOẠI BAY NỔI TRÊN ĐẦU AVATAR NGƯỜI NÓI (Quick Chat & Emoji - Thoại người chơi hoặc Bot)
        const senderPos = getSeatPosition(item.senderSeatIndex);

        return (
          <div
            key={item.id}
            className="absolute z-50 -translate-x-1/2 -translate-y-full mb-4 animate-speech-bubble"
            style={{
              left: `${senderPos.x}%`,
              top: `${senderPos.y}%`,
            }}
          >
            <div className="relative px-3.5 py-1.5 rounded-2xl bg-[#0b0f19]/95 border-2 border-amber-400 text-white shadow-[0_0_30px_rgba(251,191,36,0.6)] flex items-center gap-2 whitespace-nowrap backdrop-blur-xl">
              <span className="text-2xl animate-pulse shrink-0">{item.emote?.icon}</span>
              <span className="text-xs font-headline font-black text-yellow-300 tracking-wide">
                {item.emote?.label}
              </span>
              {/* Mũi tên chỉ xuống avatar */}
              <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-8 border-t-amber-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
