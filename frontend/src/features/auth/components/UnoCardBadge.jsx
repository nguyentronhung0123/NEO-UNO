import React from 'react';

export default function UnoCardBadge() {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-3">
      {/* Red Card 7 */}
      <div 
        className="w-7 h-10 rounded-md bg-secondary-container text-white flex flex-col items-center justify-center shadow-md border border-white/20 select-none hover:-translate-y-1 transition-transform"
        title="Lá Đỏ 7"
      >
        <span className="font-headline text-[11px] font-black italic">7</span>
      </div>

      {/* Cyan Card ⚡ */}
      <div 
        className="w-7 h-10 rounded-md bg-primary-container text-black flex flex-col items-center justify-center shadow-md border border-white/20 select-none hover:-translate-y-1 transition-transform"
        title="Lá Xanh ⚡"
      >
        <span className="font-headline text-[11px] font-black">⚡</span>
      </div>

      {/* Green Card +2 */}
      <div 
        className="w-7 h-10 rounded-md bg-tertiary-container text-black flex flex-col items-center justify-center shadow-md border border-white/20 select-none hover:-translate-y-1 transition-transform"
        title="Lá Xanh Lá +2"
      >
        <span className="font-headline text-[10px] font-black">+2</span>
      </div>

      {/* Yellow Card ★ */}
      <div 
        className="w-7 h-10 rounded-md bg-yellow-400 text-black flex flex-col items-center justify-center shadow-md border border-white/20 select-none hover:-translate-y-1 transition-transform"
        title="Lá Vàng ★"
      >
        <span className="font-headline text-[11px] font-black">★</span>
      </div>
    </div>
  );
}
