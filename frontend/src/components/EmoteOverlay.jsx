import React from 'react';

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
              {/* ĐẠO CỤ BAY THEO HÌNH CUNG PARABOLIC TỪ GỐC ĐẾN ĐÍCH */}
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

              {/* TÁC ĐỘNG VA CHẠM / ĐẬP BẸP TRÊN AVATAR ĐÍCH */}
              {item.emote.id === 'tomato' && (
                <div
                  className="absolute z-50 -translate-x-1/2 -translate-y-1/2 animate-impact flex flex-col items-center"
                  style={{ left: `${toPos.x}%`, top: `${toPos.y}%`, animationDelay: '460ms' }}
                >
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-24 h-24 rounded-full bg-rose-600/40 filter blur-md animate-ping" />
                    <div className="text-6xl filter drop-shadow-[0_0_25px_rgba(225,29,72,0.95)] transform rotate-12 scale-125">
                      🍅
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 border border-white text-white font-headline font-black text-[11px] uppercase tracking-wider shadow-[0_0_20px_rgba(225,29,72,0.8)] mt-1 animate-bounce whitespace-nowrap">
                    💥 BẸP! NÉM CÀ CHUA!
                  </div>
                </div>
              )}

              {item.emote.id === 'zap' && (
                <div
                  className="absolute z-50 -translate-x-1/2 -translate-y-1/2 animate-lightning flex flex-col items-center"
                  style={{ left: `${toPos.x}%`, top: `${toPos.y}%`, animationDelay: '460ms' }}
                >
                  <div className="text-7xl filter drop-shadow-[0_0_35px_rgba(56,189,248,1)] animate-pulse">
                    ⚡
                  </div>
                  <div className="px-3 py-1 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 border border-white text-white font-headline font-black text-[11px] uppercase tracking-wider shadow-[0_0_25px_rgba(56,189,248,0.9)] mt-1 whitespace-nowrap">
                    ⚡ GIẬT TÊ TÁI!
                  </div>
                </div>
              )}

              {item.emote.id === 'poop' && (
                <div
                  className="absolute z-50 -translate-x-1/2 -translate-y-1/2 animate-impact flex flex-col items-center"
                  style={{ left: `${toPos.x}%`, top: `${toPos.y}%`, animationDelay: '460ms' }}
                >
                  <div className="text-6xl filter drop-shadow-[0_0_25px_rgba(180,83,9,0.9)] animate-bounce">
                    💩
                  </div>
                  <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-700 to-yellow-900 border border-amber-300 text-yellow-200 font-headline font-black text-[11px] uppercase tracking-wider shadow-lg mt-1 whitespace-nowrap">
                    💩 THÚI QUẮC!
                  </div>
                </div>
              )}

              {item.emote.id === 'firework' && (
                <div
                  className="absolute z-50 -translate-x-1/2 -translate-y-1/2 animate-impact flex flex-col items-center"
                  style={{ left: `${toPos.x}%`, top: `${toPos.y}%`, animationDelay: '460ms' }}
                >
                  <div className="text-6xl filter drop-shadow-[0_0_30px_rgba(251,191,36,0.9)] animate-pulse">
                    🎉
                  </div>
                  <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 border border-white text-white font-headline font-black text-[11px] uppercase tracking-wider shadow-lg mt-1 whitespace-nowrap">
                    ✨ BẮN PHÁO HOA!
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        }

        // BÓNG THOẠI BAY NỔI TRÊN ĐẦU AVATAR NGƯỜI NÓI (Quick Chat & Emoji)
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
