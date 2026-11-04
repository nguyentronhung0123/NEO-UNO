import React, { useState } from 'react';
import { reportApi } from '../apis/reportApi';

const REASON_OPTIONS = [
  { id: 'afk_delay', label: '⏱️ AFK / Câu giờ', desc: 'Không chịu đánh bài hoặc cố ý kéo dài thời gian lượt' },
  { id: 'cheating_exploit', label: '⚡ Nghi vấn gian lận', desc: 'Sử dụng công cụ can thiệp hoặc khai thác bug/exploit' },
  { id: 'toxic_chat', label: '🤬 Xúc phạm / Toxic', desc: 'Dùng từ ngữ thô tục, khiêu khích tiêu cực trong trận' },
  { id: 'teaming', label: '🤝 Thông đồng (Teaming)', desc: 'Hai hoặc nhiều người chơi thông đồng nhường bài nhau' },
  { id: 'other', label: '❓ Lý do khác', desc: 'Các vi phạm điều khoản dịch vụ khác' },
];

export default function ReportModal({
  isOpen,
  onClose,
  targetUser,
  matchId,
  roomCode,
  evidenceTurn,
}) {
  const [selectedReason, setSelectedReason] = useState('afk_delay');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetUser || !targetUser.id) {
      setStatusMessage({ type: 'error', text: 'Không xác định được người chơi cần tố cáo!' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const res = await reportApi.createReport({
      targetUserId: targetUser.id,
      matchId: matchId || null,
      roomCode: roomCode || 'UNKNOWN',
      reason: selectedReason,
      description: description.trim(),
      evidenceTurn: typeof evidenceTurn === 'number' ? evidenceTurn : null,
    });

    setIsSubmitting(false);

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: '✓ Phiếu tố cáo đã được gửi tới Ban Quản Trị (SOC) để thẩm tra và xử lý!',
      });
      setTimeout(() => {
        setStatusMessage(null);
        setDescription('');
        onClose();
      }, 2000);
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message || 'Không thể gửi tố cáo lúc này. Vui lòng thử lại sau!',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#0e1320] border border-rose-500/40 rounded-3xl shadow-[0_0_60px_rgba(244,63,94,0.25)] overflow-hidden animate-in zoom-in-95 duration-200 text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-500/20 bg-gradient-to-r from-rose-950/40 via-red-900/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 text-xl shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              ⚠️
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide text-white flex items-center gap-2">
                TỐ CÁO VI PHẠM
              </h3>
              <p className="text-xs text-rose-300/80">
                Đối tượng: <span className="font-bold text-white">{targetUser?.name || 'Người chơi'}</span>
                {evidenceTurn ? ` • Nước đi: #${evidenceTurn}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-white flex items-center justify-center transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-medium border flex items-center gap-2.5 animate-in fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
              }`}
            >
              <span>{statusMessage.type === 'success' ? '🛡️' : '⚠️'}</span>
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Lý do vi phạm */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Lý do tố cáo:
            </label>
            <div className="space-y-2">
              {REASON_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                    selectedReason === opt.id
                      ? 'bg-rose-500/15 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                      : 'bg-[#141a29]/80 border-white/5 hover:border-white/15'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={opt.id}
                    checked={selectedReason === opt.id}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mt-1 accent-rose-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{opt.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Chi tiết bổ sung */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Mô tả chi tiết (Tùy chọn):
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cung cấp thêm chi tiết giúp Admin SOC thẩm tra trận đấu nhanh hơn..."
              maxLength={500}
              className="w-full bg-[#141a29] border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/60 transition-colors resize-none"
            />
            <div className="text-right text-[10px] text-gray-500 mt-1">
              {description.length}/500 ký tự
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black tracking-wide shadow-[0_0_20px_rgba(244,63,94,0.4)] disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang gửi...
                </>
              ) : (
                'GỬI TỐ CÁO'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
