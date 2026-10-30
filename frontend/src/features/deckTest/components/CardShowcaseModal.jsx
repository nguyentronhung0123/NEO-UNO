import React, { useState, useMemo } from 'react';
import UnoCard from '../../../components/UnoCard';

// Helper tạo danh sách 108 lá bài trên frontend phục vụ Showcase kiểm thử
function generateShowcaseDeck() {
  const COLORS = ['red', 'blue', 'green', 'yellow'];
  const ACTION_VALUES = ['skip', 'reverse', 'draw_two'];
  const deck = [];
  let count = 0;

  COLORS.forEach((color) => {
    deck.push({ id: `c_${color}_0_${++count}`, color, value: '0' });
    for (let set = 1; set <= 2; set++) {
      for (let num = 1; num <= 9; num++) {
        deck.push({ id: `c_${color}_${num}_s${set}_${++count}`, color, value: String(num) });
      }
    }
    for (let set = 1; set <= 2; set++) {
      ACTION_VALUES.forEach((act) => {
        deck.push({ id: `c_${color}_${act}_s${set}_${++count}`, color, value: act });
      });
    }
  });

  for (let i = 1; i <= 4; i++) {
    deck.push({ id: `c_wild_${i}_${++count}`, color: 'wild', value: 'wild' });
  }
  for (let i = 1; i <= 4; i++) {
    deck.push({ id: `c_wild_d4_${i}_${++count}`, color: 'wild', value: 'wild_draw_four' });
  }

  return deck;
}

export default function CardShowcaseModal({ isOpen, onClose }) {
  const [deck, setDeck] = useState(() => generateShowcaseDeck());
  const [filterColor, setFilterColor] = useState('all'); // 'all' | 'red' | 'blue' | 'green' | 'yellow' | 'wild'
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [testDisabled, setTestDisabled] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  // Lọc danh sách hiển thị
  const filteredCards = useMemo(() => {
    if (filterColor === 'all') return deck;
    return deck.filter((c) => c.color === filterColor);
  }, [deck, filterColor]);

  if (!isOpen) return null;

  // Thử nghiệm xáo bài trực tiếp trên UI
  const handleShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
      const shuffled = [...deck];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setDeck(shuffled);
      setIsShuffling(false);
    }, 250);
  };

  const handleReset = () => {
    setDeck(generateShowcaseDeck());
    setSelectedCardId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-[#0f1420] border border-primary-container/40 rounded-3xl shadow-[0_0_60px_rgba(0,210,255,0.25)] flex flex-col overflow-hidden">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 bg-[#141926]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-primary-container shadow-md">
              <span className="material-symbols-outlined text-2xl">style</span>
            </div>
            <div>
              <h2 className="text-white font-headline text-lg sm:text-xl font-black uppercase tracking-wide flex items-center gap-2">
                BỘ SƯU TẬP 108 LÁ BÀI UNO
              </h2>
              <p className="text-slate-400 text-xs">
                Xác thực giao diện Neo Glassmorphism, góc xoay 180°, hiệu ứng hover và bộ bài 108 lá
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer border border-outline-variant/30"
            title="Đóng cửa sổ"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Thanh công cụ lọc & tương tác */}
        <div className="px-6 py-3 bg-[#111622] border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Bộ lọc màu */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Lọc Màu:</span>
            {[
              { id: 'all', label: 'Tất cả (108)', bg: 'bg-[#1b2130] text-white border-outline-variant/40' },
              { id: 'red', label: 'Đỏ (25)', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
              { id: 'blue', label: 'Xanh dương (25)', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
              { id: 'green', label: 'Xanh lá (25)', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
              { id: 'yellow', label: 'Vàng (25)', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
              { id: 'wild', label: 'Wild Đổi Màu (8)', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterColor(f.id)}
                className={`px-3 py-1.5 rounded-full font-bold border transition-all cursor-pointer ${f.bg} ${
                  filterColor === f.id
                    ? 'ring-2 ring-primary-container shadow-md scale-105'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Công cụ thử nghiệm trạng thái */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTestDisabled(!testDisabled)}
              className={`px-3 py-1.5 rounded-full font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                testDisabled
                  ? 'bg-amber-500/30 text-amber-300 border-amber-400'
                  : 'bg-[#1b2130] text-slate-300 border-outline-variant/40 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {testDisabled ? 'check_box' : 'check_box_outline_blank'}
              </span>
              <span>Test Trạng Thái Khóa (Disabled)</span>
            </button>

            <button
              onClick={handleShuffle}
              disabled={isShuffling}
              className="px-3.5 py-1.5 rounded-full bg-primary-container hover:bg-cyan-300 text-black font-headline font-black uppercase text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-sm ${isShuffling ? 'animate-spin' : ''}`}>
                shuffle
              </span>
              <span>Xáo Trộn Bài (Fisher-Yates)</span>
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-full bg-[#1b2130] hover:bg-[#252e42] text-slate-400 hover:text-white border border-outline-variant/30 text-xs font-semibold transition-colors cursor-pointer"
              title="Đặt lại thứ tự gốc"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Thông tin lá bài đang chọn */}
        <div className="px-6 py-2 bg-[#0c101a] border-b border-outline-variant/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>
              Đang hiển thị: <strong className="text-white">{filteredCards.length}</strong> lá bài
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              Mẹo: Di chuột để kiểm tra hover nổi lên & góc xoay 180°, click vào lá bài để kiểm tra trạng thái Selected
            </span>
          </div>

          {selectedCardId && (
            <div className="text-primary-container font-semibold animate-fadeIn">
              Đang chọn: <code className="bg-[#192233] px-2 py-0.5 rounded text-white">{selectedCardId}</code>
            </div>
          )}
        </div>

        {/* Khu vực hiển thị Grid Lá bài */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-primary-container/20">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 justify-items-center">
            {filteredCards.map((card) => {
              const isSelected = selectedCardId === card.id;
              return (
                <div key={card.id} className="flex flex-col items-center">
                  <UnoCard
                    color={card.color}
                    value={card.value}
                    disabled={testDisabled}
                    selected={isSelected}
                    onClick={() => setSelectedCardId(isSelected ? null : card.id)}
                  />
                  <span className="mt-1.5 text-[10px] text-slate-500 font-mono tracking-tight text-center">
                    {card.color} • {card.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#111622] border-t border-outline-variant/30 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">✔ Chuẩn 108 Lá</span>
            <span>•</span>
            <span className="text-sky-400 font-bold">✔ Góc quay 180° đối xứng</span>
            <span>•</span>
            <span className="text-purple-400 font-bold">✔ Neon Glassmorphism</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-full bg-[#1c2333] hover:bg-[#283247] text-white font-semibold transition-colors cursor-pointer"
          >
            Đóng Kiểm Thử
          </button>
        </div>

      </div>
    </div>
  );
}
