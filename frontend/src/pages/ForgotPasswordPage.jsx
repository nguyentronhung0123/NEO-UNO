import React, { useState, useEffect, useRef } from 'react';
import { authApi } from '../apis/authApi';

export default function ForgotPasswordPage({ onBackToLogin, onSuccessLogin }) {
  // step: 1 = Email, 2 = Verify OTP, 3 = Reset Password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [demoOtpHint, setDemoOtpHint] = useState('');
  
  // Timers & loading
  const [countdown, setCountdown] = useState(59);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Step 3 Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [logoutOtherDevices, setLogoutOtherDevices] = useState(true);

  const otpInputsRef = useRef([]);

  // Đếm ngược 59s cho bước 2
  useEffect(() => {
    let timer = null;
    if (isTimerActive && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(timer);
  }, [isTimerActive, countdown]);

  // BƯỚC 1: GỬI MÃ XÁC THỰC OTP
  const handleSendRecoveryEmail = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !email.includes('@')) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ!');
      return;
    }

    setLoading(true);
    const res = await authApi.forgotPassword({ email: email.trim() });
    setLoading(false);

    if (res?.success) {
      setStep(2);
      setCountdown(59);
      setIsTimerActive(true);
      if (res.demoOtp) {
        setDemoOtpHint(res.demoOtp);
        // Tự điền demoOtp cho người dùng trải nghiệm tiện lợi nếu muốn
        const digits = res.demoOtp.split('');
        setOtp(digits);
      }
    } else {
      setErrorMessage(res?.message || 'Không tìm thấy tài khoản với email này!');
    }
  };

  // GỬI LẠI MÃ OTP
  const handleResendOtp = async () => {
    if (isTimerActive && countdown > 0) return;
    setErrorMessage('');
    setLoading(true);
    const res = await authApi.forgotPassword({ email: email.trim() });
    setLoading(false);

    if (res?.success) {
      setCountdown(59);
      setIsTimerActive(true);
      if (res.demoOtp) {
        setDemoOtpHint(res.demoOtp);
        setOtp(res.demoOtp.split(''));
      }
    } else {
      setErrorMessage(res?.message || 'Lỗi khi gửi lại mã OTP!');
    }
  };

  // BƯỚC 2: XỬ LÝ NHẬP 6 Ô OTP
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Tự động focus sang ô kế tiếp
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      setOtp(pasteData.split(''));
      otpInputsRef.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã OTP!');
      return;
    }

    setLoading(true);
    const res = await authApi.verifyOtp({ email: email.trim(), otp: fullOtp });
    setLoading(false);

    if (res?.success) {
      setStep(3);
    } else {
      setErrorMessage(res?.message || 'Mã xác thực không chính xác!');
    }
  };

  // BƯỚC 3: KIỂM TRA ĐỘ MẠNH MẬT KHẨU
  const hasLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasSpecialOrNum = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);

  let strengthScore = 0;
  if (hasLen) strengthScore++;
  if (hasUpper) strengthScore++;
  if (hasLower) strengthScore++;
  if (hasSpecialOrNum) strengthScore++;

  const isPasswordMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // ĐẶT LẠI MẬT KHẨU
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (strengthScore < 3) {
      setErrorMessage('Vui lòng tạo mật khẩu mạnh hơn để bảo vệ tài khoản!');
      return;
    }

    if (!isPasswordMatch) {
      setErrorMessage('Mật khẩu xác nhận không khớp với mật khẩu mới!');
      return;
    }

    setLoading(true);
    const res = await authApi.resetPassword({
      email: email.trim(),
      otp: otp.join(''),
      newPassword,
    });
    setLoading(false);

    if (res?.success) {
      setShowToast(true);
      setTimeout(() => {
        if (onSuccessLogin) {
          onSuccessLogin();
        } else if (onBackToLogin) {
          onBackToLogin();
        }
      }, 2000);
    } else {
      setErrorMessage(res?.message || 'Lỗi khi cập nhật mật khẩu mới!');
    }
  };

  return (
    <div className="bg-[#0b0e17] font-body text-slate-100 min-h-screen relative overflow-x-hidden selection:bg-primary-container selection:text-black flex flex-col justify-between py-6">
      
      {/* Background Soft Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-container/10 blur-[130px]"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary-container/15 blur-[130px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,14,24,0.85)_100%)]"></div>
      </div>

      {/* Main Card Center */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-[500px] rounded-3xl bg-[#121622]/95 border border-primary-container/30 backdrop-blur-2xl p-6 sm:p-9 shadow-[0_0_60px_-15px_rgba(0,210,255,0.25)] flex flex-col items-center">
          
          {/* 4 Thẻ UNO Trang Trí Đỉnh Thẻ (-12deg, -6deg, 6deg, 12deg) */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 pointer-events-none">
            <div className="w-8 h-12 -rotate-12 rounded-lg bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.6)] flex items-center justify-center text-white font-headline font-black text-xs border border-white/20">
              +2
            </div>
            <div className="w-8 h-12 -rotate-6 rounded-lg bg-primary-container shadow-[0_0_15px_rgba(0,210,255,0.6)] flex items-center justify-center text-black font-headline font-black text-xs border border-white/20">
              ★
            </div>
            <div className="w-8 h-12 rotate-6 rounded-lg bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] flex items-center justify-center text-black font-headline font-black text-xs border border-white/20">
              ⟲
            </div>
            <div className="w-8 h-12 rotate-12 rounded-lg bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] flex items-center justify-center text-black font-headline font-black text-xs border border-white/20">
              ✦
            </div>
          </div>

          {/* ======================================================== */}
          {/* BƯỚC 1: NHẬP EMAIL KHÔI PHỤC                             */}
          {/* ======================================================== */}
          {step === 1 && (
            <div className="w-full flex flex-col items-center animate-fade-in mt-3">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/80 mb-2 border border-white/5 shadow-inner">
                  <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse shadow-[0_0_8px_#00d2ff]"></span>
                  <span className="text-[10px] font-mono font-bold text-primary-container tracking-widest uppercase">
                    NEO CLASH SYSTEM
                  </span>
                </div>
                <h1 className="font-headline font-black text-2xl sm:text-3xl text-white tracking-wide uppercase">
                  QUÊN MẬT KHẨU
                </h1>
                <p className="text-xs text-slate-400 max-w-[360px] mt-1.5 leading-relaxed">
                  Nhập email đăng ký của bạn để nhận mã xác thực khôi phục tài khoản.
                </p>
              </div>

              {errorMessage && (
                <div className="w-full mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSendRecoveryEmail} className="w-full flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 w-full text-left">
                  <label className="text-xs font-mono font-bold text-primary-container tracking-wider uppercase flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">mail</span>
                    Địa chỉ email khôi phục
                  </label>
                  <div className="relative w-full">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                      alternate_email
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@gmail.com"
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0f131d] text-white placeholder:text-slate-500 text-sm border border-white/10 outline-none focus:border-primary-container focus:shadow-[0_0_20px_rgba(0,210,255,0.3)] transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary-container to-cyan-400 text-black font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,210,255,0.4)] hover:shadow-[0_0_35px_rgba(0,210,255,0.6)] hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-base">autorenew</span>
                      <span>Đang gửi mã...</span>
                    </>
                  ) : (
                    <>
                      <span>GỬI MÃ XÁC NHẬN</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* BƯỚC 2: XÁC THỰC MÃ BẢO MẬT (6 Ô OTP)                    */}
          {/* ======================================================== */}
          {step === 2 && (
            <div className="w-full flex flex-col items-center animate-fade-in mt-3">
              <div className="mb-5 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/80 mb-2 border border-white/5 shadow-inner">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00d2ff]"></span>
                  <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-widest uppercase">
                    BẢO MẬT 2 LỚP
                  </span>
                </div>
                <h1 className="font-headline font-black text-xl sm:text-2xl text-white tracking-wide uppercase">
                  XÁC THỰC MÃ BẢO MẬT
                </h1>
                <p className="text-xs text-slate-400 max-w-[360px] mt-1.5 leading-relaxed">
                  Nhập mã 6 chữ số vừa được gửi đến email: <strong className="text-white font-mono">{email}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMessage('');
                  }}
                  className="text-[11px] text-primary-container font-semibold hover:underline mt-1 cursor-pointer"
                >
                  Đổi email nhận mã
                </button>
              </div>

              {demoOtpHint && (
                <div className="w-full mb-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] text-center font-mono font-bold flex items-center justify-center gap-1.5">
                  <span>💡 Mã xác thực test:</span>
                  <span className="text-xs tracking-widest bg-black/40 px-2 py-0.5 rounded border border-amber-500/30 text-white">
                    {demoOtpHint}
                  </span>
                </div>
              )}

              {errorMessage && (
                <div className="w-full mb-3 p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="w-full flex flex-col gap-4">
                {/* 6 Ô NHẬP OTP */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 my-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-mono font-black rounded-2xl bg-[#0f131d] text-primary-container border outline-none transition-all ${
                        digit
                          ? 'border-primary-container shadow-[0_0_15px_rgba(0,210,255,0.4)]'
                          : 'border-white/10 focus:border-cyan-400'
                      }`}
                    />
                  ))}
                </div>

                {/* Đếm ngược 59s & Nút gửi lại */}
                <div className="flex items-center justify-between text-xs px-1 text-slate-400 font-mono">
                  <div className="flex items-center gap-1">
                    <span>⏱</span>
                    <span className="font-bold text-white">
                      00:{countdown < 10 ? `0${countdown}` : countdown}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isTimerActive && countdown > 0}
                    className={`font-semibold transition-colors cursor-pointer ${
                      isTimerActive && countdown > 0
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-primary-container hover:underline'
                    }`}
                  >
                    Gửi lại mã
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary-container to-cyan-400 text-black font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,210,255,0.4)] hover:shadow-[0_0_35px_rgba(0,210,255,0.6)] hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-base">autorenew</span>
                      <span>Đang xác minh...</span>
                    </>
                  ) : (
                    <>
                      <span>XÁC MINH MÃ & TIẾP TỤC</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* BƯỚC 3: TẠO MẬT KHẨU MỚI                                 */}
          {/* ======================================================== */}
          {step === 3 && (
            <div className="w-full flex flex-col items-center animate-fade-in mt-3">
              <div className="mb-4 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/80 mb-2 border border-white/5 shadow-inner">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
                  <span className="text-[10px] font-mono font-bold text-emerald-300 tracking-widest uppercase">
                    THIẾT LẬP AN TOÀN
                  </span>
                </div>
                <h1 className="font-headline font-black text-xl sm:text-2xl text-white tracking-wide uppercase">
                  TẠO MẬT KHẨU MỚI
                </h1>
                <p className="text-xs text-slate-400 max-w-[360px] mt-1 leading-relaxed">
                  Vui lòng thiết lập mật khẩu mới đủ an toàn để bảo vệ tài khoản của bạn.
                </p>
              </div>

              {errorMessage && (
                <div className="w-full mb-3 p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="w-full flex flex-col gap-3.5">
                {/* Ô 1: Mật khẩu mới */}
                <div className="flex flex-col gap-1 w-full text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-slate-300 tracking-wider uppercase">
                      Mật khẩu mới
                    </label>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase ${
                        strengthScore <= 1
                          ? 'text-rose-400'
                          : strengthScore === 2
                          ? 'text-amber-400'
                          : strengthScore === 3
                          ? 'text-primary-container'
                          : 'text-emerald-400'
                      }`}
                    >
                      {newPassword.length === 0
                        ? ''
                        : strengthScore <= 1
                        ? 'Yếu'
                        : strengthScore === 2
                        ? 'Trung bình'
                        : strengthScore === 3
                        ? 'Mạnh'
                        : 'Rất mạnh'}
                    </span>
                  </div>

                  <div className="relative w-full">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-[#0f131d] text-white placeholder:text-slate-500 text-sm border border-white/10 outline-none focus:border-primary-container focus:shadow-[0_0_20px_rgba(0,210,255,0.3)] transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showNewPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Thanh đo độ mạnh mật khẩu 4 nấc */}
                  <div className="flex gap-1.5 mt-1">
                    {[1, 2, 3, 4].map((barIdx) => (
                      <div
                        key={barIdx}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          strengthScore >= barIdx
                            ? strengthScore <= 1
                              ? 'bg-rose-500'
                              : strengthScore === 2
                              ? 'bg-amber-400'
                              : strengthScore === 3
                              ? 'bg-primary-container'
                              : 'bg-emerald-400'
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Ô 2: Xác nhận mật khẩu mới */}
                <div className="flex flex-col gap-1 w-full text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-slate-300 tracking-wider uppercase">
                      Xác nhận mật khẩu mới
                    </label>
                    {confirmPassword.length > 0 && (
                      <span
                        className={`text-[10px] font-mono font-bold uppercase flex items-center gap-0.5 ${
                          isPasswordMatch ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {isPasswordMatch ? 'check_circle' : 'cancel'}
                        </span>
                        <span>{isPasswordMatch ? 'Khớp 100%' : 'Chưa khớp'}</span>
                      </span>
                    )}
                  </div>

                  <div className="relative w-full">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full px-4 py-3 rounded-2xl bg-[#0f131d] text-white placeholder:text-slate-500 text-sm border border-white/10 outline-none focus:border-primary-container focus:shadow-[0_0_20px_rgba(0,210,255,0.3)] transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showConfirmPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Checklist quy tắc bảo mật */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-1.5 text-[11px] text-slate-400 text-left">
                  <div className={`flex items-center gap-2 ${hasLen ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className="material-symbols-outlined text-sm">
                      {hasLen ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>Tối thiểu 8 ký tự</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className="material-symbols-outlined text-sm">
                      {hasUpper ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>Ít nhất 1 chữ hoa (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className="material-symbols-outlined text-sm">
                      {hasLower ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>Ít nhất 1 chữ thường (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${hasSpecialOrNum ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className="material-symbols-outlined text-sm">
                      {hasSpecialOrNum ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>Ít nhất 1 số hoặc ký tự đặc biệt (!@#$)</span>
                  </div>
                </div>

                {/* Checkbox Đăng xuất khỏi thiết bị khác */}
                <label className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none text-left pt-1">
                  <input
                    type="checkbox"
                    checked={logoutOtherDevices}
                    onChange={(e) => setLogoutOtherDevices(e.target.checked)}
                    className="w-4 h-4 rounded accent-primary-container cursor-pointer"
                  />
                  <span>Đăng xuất khỏi tất cả các thiết bị khác</span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-primary-container to-cyan-400 text-black font-headline font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,210,255,0.4)] hover:shadow-[0_0_35px_rgba(0,210,255,0.6)] hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-base">autorenew</span>
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <span>CẬP NHẬT MẬT KHẨU & ĐĂNG NHẬP NGAY</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Nút quay lại đăng nhập ở chân thẻ */}
          <div className="mt-6 pt-3 border-t border-white/10 w-full text-center">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-xs text-slate-400 hover:text-primary-container font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Quay lại đăng nhập</span>
            </button>
          </div>

        </div>
      </main>

      {/* TOAST THÔNG BÁO THÀNH CÔNG */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-[#121622] border border-emerald-400/60 shadow-[0_0_30px_rgba(16,185,129,0.5)] text-emerald-300 flex items-center gap-2 text-xs font-bold animate-fade-in">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>Mật khẩu đã cập nhật! Đang đưa bạn về màn hình đăng nhập...</span>
        </div>
      )}

      {/* Footer copyright */}
      <footer className="relative z-10 w-full text-center text-[10px] text-slate-600 font-mono">
        © 2025 NEO CLASH SYSTEM • Bảo mật đa tầng SHA-256 & bcrypt
      </footer>

    </div>
  );
}
