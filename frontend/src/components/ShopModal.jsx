import React, { useState, useEffect, useMemo } from 'react';
import { shopApi } from '../apis/shopApi';
import { CardBack } from './CardBack';
import { AvatarFrame } from './AvatarFrame';
import { soundEngine } from '../utils/audioFx';

/**
 * Helper render Mặt Trước (Card Front) xem trước 3D cho từng bộ Skin
 */
function CardFrontPreview({ skinId }) {
  if (skinId === 'skin_halloween') {
    // Thẻ Số 7 Bí Ngô Ma Quái (Chuẩn từ File Word của người dùng)
    return (
      <div className="relative w-full h-full rounded-[24px] p-2 bg-gradient-to-br from-amber-500 via-orange-600 to-amber-950 shadow-2xl flex flex-col justify-between select-none">
        <div className="relative w-full h-full rounded-[18px] bg-gradient-to-b from-orange-950/90 via-black/95 to-amber-950/95 overflow-hidden flex flex-col justify-between p-2.5">
          {/* Top Left Index */}
          <div className="flex flex-col items-center self-start leading-none z-10">
            <span className="font-headline text-2xl font-black text-amber-300 drop-shadow-[0_2px_8px_rgba(249,115,22,0.8)]">
              7
            </span>
            <span className="text-[10px]">🎃</span>
          </div>

          {/* Center Angled Oval with Jack-o'-lantern Carved Face SVG */}
          <div className="absolute inset-0 m-auto w-32 h-44 rounded-[50%] -rotate-12 bg-gradient-to-tr from-amber-600 to-orange-400 p-0.5 shadow-[0_0_20px_rgba(249,115,22,0.6)] flex items-center justify-center">
            <div className="w-full h-full rounded-[50%] bg-gradient-to-b from-black via-stone-900 to-amber-950 flex flex-col items-center justify-center overflow-hidden relative">
              <svg
                className="w-16 h-16 rotate-12 drop-shadow-[0_0_12px_#fbbf24]"
                fill="none"
                viewBox="0 0 100 100"
              >
                {/* Cuống bí ngô */}
                <path
                  d="M48 12C50 6 56 5 58 4C56 9 53 13 52 16"
                  stroke="#4ade80"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
                {/* Mắt phát sáng ma mị */}
                <polygon fill="#fef08a" points="30,38 42,42 34,48" />
                <polygon fill="#fef08a" points="70,38 58,42 66,48" />
                {/* Mũi răng cưa */}
                <polygon fill="#fde047" points="50,49 44,57 56,57" />
                {/* Nụ cười ma quái */}
                <path
                  d="M25,65 Q50,90 75,65 Q70,75 64,72 L62,67 L56,71 L51,66 L46,71 L40,67 L36,73 Q30,73 25,65 Z"
                  fill="#fde047"
                />
                <ellipse
                  cx="50"
                  cy="54"
                  opacity="0.5"
                  rx="42"
                  ry="34"
                  stroke="#f97316"
                  strokeDasharray="4 2"
                  strokeWidth="2.5"
                />
              </svg>
              <span className="rotate-12 mt-0.5 font-headline text-[9px] text-amber-200 tracking-widest font-black">
                SPOOKY 7
              </span>
            </div>
          </div>

          {/* Bottom Right Inverted Index */}
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

  if (skinId === 'skin_cyberpunk') {
    return (
      <div className="relative w-full h-full rounded-[24px] p-2 bg-gradient-to-br from-cyan-400 via-sky-600 to-blue-950 shadow-2xl flex flex-col justify-between select-none">
        <div className="relative w-full h-full rounded-[18px] bg-gradient-to-b from-[#020b18] via-black to-[#05132b] overflow-hidden flex flex-col justify-between p-2.5">
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
            </div>
          </div>
          <div className="flex flex-col items-center self-end leading-none rotate-180 z-10">
            <span className="font-mono font-black text-2xl text-cyan-300 drop-shadow-[0_0_8px_#38bdf8]">
              9
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Mặc định hoặc các skin khác: Card Front chuẩn UNO
  return (
    <div className="relative w-full h-full rounded-[24px] p-2 bg-gradient-to-br from-rose-500 via-red-600 to-rose-700 shadow-2xl flex flex-col justify-between select-none">
      <div className="relative w-full h-full rounded-[18px] bg-rose-600/90 overflow-hidden flex flex-col justify-between p-2.5">
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
      // Tự động chọn item đầu tiên nếu chưa chọn
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

  // Thông báo Toast ngắn
  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Mua vật phẩm
  const handleBuy = async (item) => {
    if (currentCoins < item.price) {
      showToast(`Số dư không đủ! Cần thêm 🪙 ${(item.price - currentCoins).toLocaleString()} Vàng.`, 'error');
      return;
    }

    setActionLoadingId(item.id);
    const res = await shopApi.buyItem(item.id);
    setActionLoadingId(null);

    if (res.success) {
      soundEngine.playCoinBuy();
      showToast(res.message || `Đã mở khóa thành công ${item.name}!`, 'success');
      
      // Cập nhật State người dùng ngay lập tức
      if (onUpdateUser) {
        onUpdateUser({
          coins: res.userCoins,
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
                ? 'bg-gradient-to-r from-primary-container to-cyan-400 text-black shadow-lg shadow-cyan-500/30 font-black'
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
                ? 'bg-gradient-to-r from-primary-container to-cyan-400 text-black shadow-lg shadow-cyan-500/30 font-black'
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
                <div className="text-center mb-4">
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
                <div className="my-2 flex flex-col items-center">
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
                            <CardFrontPreview skinId={selectedItem.id} />
                          </div>
                        </div>
                      </div>

                      {/* Nút lật xem trước */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsFlipped((prev) => !prev);
                          soundEngine.playCardSlide();
                        }}
                        className="mt-3.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">
                          3d_rotation
                        </span>
                        <span>{isFlipped ? 'Xem Mặt Lưng Bài' : 'Xem Mặt Trước Thẻ Bài'}</span>
                      </button>
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
                <div className="w-full mt-4 p-3.5 rounded-2xl bg-black/40 border border-white/5 text-xs text-slate-300 leading-relaxed text-center">
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
