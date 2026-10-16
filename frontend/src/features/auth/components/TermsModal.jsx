import React from 'react';

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#131722] rounded-[24px] border border-primary-container/40 p-6 shadow-[0_0_40px_rgba(0,210,255,0.25)] text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-xl">gavel</span>
            <h3 className="font-headline text-base font-bold text-white tracking-wide uppercase">
              QUY CHẾ ĐẤU TRƯỜNG NEO UNO
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <div className="p-3 rounded-xl bg-[#1a202c]/70 border border-outline-variant/20">
            <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
              <span className="text-primary-container font-black">01.</span> Luật thi đấu Fair-Play
            </h4>
            <p className="text-slate-400">
              Mọi đấu thủ tham gia Đấu trường NEO UNO phải tuân thủ luật bài UNO chuẩn quốc tế. Nghiêm cấm mọi hành vi can thiệp dữ liệu bộ bài hoặc sử dụng phần mềm thứ ba.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#1a202c]/70 border border-outline-variant/20">
            <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
              <span className="text-primary-container font-black">02.</span> Bảo mật danh tính & Tài khoản
            </h4>
            <p className="text-slate-400">
              Mật khẩu tài khoản của bạn được mã hóa an toàn bằng thuật toán băm bảo mật. Chúng tôi không bao giờ chia sẻ thông tin tài khoản hay email của bạn cho bên thứ ba.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#1a202c]/70 border border-outline-variant/20">
            <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
              <span className="text-primary-container font-black">03.</span> Cơ chế tính điểm ELO & Cấp bậc
            </h4>
            <p className="text-slate-400">
              Mỗi trận đấu với Bot AI hoặc đối thủ sẽ ảnh hưởng trực tiếp đến chỉ số ELO và chuỗi thắng của Đấu thủ. Thoát giữa trận sẽ bị xử thua tự động.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-3 border-t border-outline-variant/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-primary-container text-black font-headline text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(0,210,255,0.4)] hover:shadow-[0_0_20px_rgba(0,210,255,0.6)] hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
          >
            ĐÃ HIỂU VÀ ĐỒNG Ý
          </button>
        </div>
      </div>
    </div>
  );
}
