import React, { useState, useMemo } from 'react';
import UnoCardBadge from './UnoCardBadge';
import AuthTabs from './AuthTabs';
import SocialLoginButtons from './SocialLoginButtons';
import ServerStatusBadge from './ServerStatusBadge';
import TermsModal from './TermsModal';
import { useAuth } from '../../../hooks/useAuth';
import {
  validateNickname,
  validateEmail,
  calculatePasswordStrength,
  validateConfirmPassword,
} from '../helpers/authValidation';

export default function AuthCard({ onEnterGameWithBot }) {
  const { login, register, guestLogin } = useAuth();

  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Form states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerNickname, setRegisterNickname] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  // Touched states for realtime validation feedback
  const [touched, setTouched] = useState({
    loginIdentifier: false,
    loginPassword: false,
    registerNickname: false,
    registerEmail: false,
    registerPassword: false,
    registerConfirmPassword: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Real-time Validations
  const nicknameStatus = useMemo(() => validateNickname(registerNickname), [registerNickname]);
  const emailStatus = useMemo(() => validateEmail(registerEmail), [registerEmail]);
  const passwordStrength = useMemo(() => calculatePasswordStrength(registerPassword), [registerPassword]);
  const confirmPasswordStatus = useMemo(
    () => validateConfirmPassword(registerPassword, registerConfirmPassword),
    [registerPassword, registerConfirmPassword]
  );

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Nút tiện ích: Điền nhanh tài khoản test mẫu
  const handleQuickFillTest = () => {
    if (activeTab === 'login') {
      setLoginIdentifier('player@neouno.com');
      setLoginPassword('Password@123');
      setStatusMessage({
        type: 'info',
        text: '⚡ Đã tự động điền tài khoản mẫu: player@neouno.com / Password@123',
      });
    } else {
      const rand = Math.floor(100 + Math.random() * 900);
      setRegisterNickname(`CyberAce_${rand}`);
      setRegisterEmail(`player_${rand}@neouno.com`);
      setRegisterPassword('Password@123');
      setRegisterConfirmPassword('Password@123');
      setStatusMessage({
        type: 'info',
        text: '⚡ Đã tạo ngẫu nhiên thông tin đăng ký mẫu đạt chuẩn!',
      });
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setStatusMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ tài khoản và mật mã!' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(loginIdentifier, loginPassword);
      setIsSubmitting(false);

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: res.message || 'Đăng nhập thành công! Đang chuyển vào Đấu trường...',
        });
        setTimeout(() => {
          if (onEnterGameWithBot) {
            onEnterGameWithBot(res.user);
          }
        }, 800);
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || 'Đăng nhập thất bại, vui lòng thử lại!',
        });
      }
    } catch {
      setIsSubmitting(false);
      setStatusMessage({
        type: 'error',
        text: 'Không thể kết nối đến máy chủ Backend (Port 5001)!',
      });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);

    setTouched({
      registerNickname: true,
      registerEmail: true,
      registerPassword: true,
      registerConfirmPassword: true,
    });

    if (!nicknameStatus.isValid) {
      setStatusMessage({ type: 'error', text: nicknameStatus.error });
      return;
    }
    if (!emailStatus.isValid) {
      setStatusMessage({ type: 'error', text: emailStatus.error });
      return;
    }
    if (!passwordStrength.isValid) {
      setStatusMessage({
        type: 'error',
        text: 'Mật khẩu phải từ 8 ký tự trở lên và bao gồm cả chữ và số!',
      });
      return;
    }
    if (!confirmPasswordStatus.isMatch) {
      setStatusMessage({ type: 'error', text: 'Mật khẩu xác nhận không trùng khớp!' });
      return;
    }
    if (!agreedTerms) {
      setStatusMessage({ type: 'error', text: 'Bạn cần đồng ý với Quy chế Đấu trường để tiếp tục!' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register(registerNickname, registerEmail, registerPassword);
      setIsSubmitting(false);

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: res.message || 'Khởi tạo tài khoản thành công! Đang chuyển vào Đấu trường...',
        });
        setTimeout(() => {
          if (onEnterGameWithBot) {
            onEnterGameWithBot(res.user);
          }
        }, 800);
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || 'Đăng ký thất bại, vui lòng thử lại!',
        });
      }
    } catch {
      setIsSubmitting(false);
      setStatusMessage({
        type: 'error',
        text: 'Không thể kết nối đến máy chủ Backend (Port 5001)!',
      });
    }
  };

  const handleBotPlay = async () => {
    setIsBotLoading(true);
    setStatusMessage(null);

    try {
      const res = await guestLogin();
      setIsBotLoading(false);
      if (res.success && onEnterGameWithBot) {
        onEnterGameWithBot(res.user);
      } else {
        alert('Bàn đấu PvE sẵn sàng! Đang tải bộ bài UNO 108 lá...');
      }
    } catch {
      setIsBotLoading(false);
      if (onEnterGameWithBot) {
        onEnterGameWithBot({ nickname: 'Đấu thủ Khách', elo: 1000 });
      }
    }
  };

  return (
    <>
      <div className="relative w-full max-w-[420px] mx-auto px-4 sm:px-0">
        {/* Background Soft Glows */}
        <div className="absolute -top-8 -left-8 w-48 h-48 bg-secondary-container/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-primary-container/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Main Container */}
        <div className="relative bg-[#111520]/90 backdrop-blur-2xl rounded-[28px] p-5 sm:p-7 shadow-2xl border border-outline-variant/30 overflow-hidden">
          {/* Top subtle neon runner line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-secondary-container via-primary-container to-tertiary-container opacity-90"></div>

          {/* Header: 4 Mini Cards + Title */}
          <div className="flex flex-col items-center text-center mb-4">
            <UnoCardBadge />

            <div className="flex items-center justify-center gap-1.5">
              <span className="font-headline text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
                NEO <span className="text-primary-container">UNO</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-primary-container text-[11px] font-semibold tracking-wider uppercase mt-1">
              <span className="h-[1px] w-6 bg-primary-container/40"></span>
              <span>DIGITAL CARD ARENA</span>
              <span className="h-[1px] w-6 bg-primary-container/40"></span>
            </div>
          </div>

          {/* Tab Switcher */}
          <AuthTabs
            activeTab={activeTab}
            onChangeTab={(tab) => {
              setActiveTab(tab);
              setStatusMessage(null);
            }}
          />

          {/* Quick Test Accounts Fill Chip */}
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={handleQuickFillTest}
              className="text-[10px] py-1 px-2.5 rounded-full bg-surface-container-high hover:bg-surface-variant text-primary-container font-semibold flex items-center gap-1 border border-primary-container/30 transition-all hover:scale-105 cursor-pointer shadow-sm"
              title="Tự động điền tài khoản mẫu để test nhanh"
            >
              <span className="material-symbols-outlined text-xs">bolt</span>
              <span>Điền nhanh tài khoản test</span>
            </button>
          </div>

          {/* Status Alert Banner */}
          {statusMessage && (
            <div
              className={`mb-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
                statusMessage.type === 'error'
                  ? 'bg-secondary-container/20 border border-secondary-container text-secondary'
                  : statusMessage.type === 'info'
                  ? 'bg-primary-container/15 border border-primary-container/40 text-primary-container'
                  : 'bg-tertiary-container/20 border border-tertiary-container text-tertiary'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {statusMessage.type === 'error'
                  ? 'error'
                  : statusMessage.type === 'info'
                  ? 'info'
                  : 'check_circle'}
              </span>
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Form Content */}
          {activeTab === 'login' ? (
            /* ================= LOGIN FORM ================= */
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              {/* Field 1: Email / Username */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>EMAIL LIÊN KẾT / TÀI KHOẢN</span>
                  <span className="text-slate-500">P1</span>
                </div>
                <div className="relative flex items-center bg-[#171b26] rounded-full px-3.5 py-2.5 border border-outline-variant/30 focus-within:border-primary-container/80 transition-colors">
                  <span className="material-symbols-outlined text-slate-400 text-lg mr-2.5">
                    person
                  </span>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    onBlur={() => handleBlur('loginIdentifier')}
                    placeholder="vidu@example.com"
                    className="w-full bg-transparent text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none"
                  />
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#202533] text-slate-400 font-bold">
                    P1
                  </span>
                </div>
              </div>

              {/* Field 2: Password */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>MẬT MÃ BẢO MẬT</span>
                </div>
                <div className="relative flex items-center bg-[#171b26] rounded-full px-3.5 py-2.5 border border-outline-variant/30 focus-within:border-primary-container/80 transition-colors">
                  <span className="material-symbols-outlined text-slate-400 text-lg mr-2.5">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onBlur={() => handleBlur('loginPassword')}
                    placeholder="••••••••••••"
                    className="w-full bg-transparent text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-white ml-2 focus:outline-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs py-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-primary-container cursor-pointer"
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Tài khoản mẫu để test: player@neouno.com / Mật khẩu: Password@123');
                  }}
                  className="text-primary-container font-semibold hover:underline"
                >
                  Quên mật khẩu?
                </a>
              </div>

              {/* CTA Login Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full bg-primary-container text-black font-headline text-sm font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:shadow-[0_0_25px_rgba(0,210,255,0.6)] hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-xl animate-spin">autorenew</span>
                    <span>ĐANG KẾT NỐI MÁY CHỦ...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">swords</span>
                    <span>VÀO BÀN ĐẤU</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ================= REGISTER FORM ================= */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {/* Field 1: Nickname */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">sports_esports</span>
                    TÊN TÀI KHOẢN / BIỆT DANH ĐẤU TRƯỜNG
                  </span>
                  <span
                    className={`font-semibold flex items-center gap-0.5 ${
                      nicknameStatus.isValid && registerNickname
                        ? 'text-primary-container'
                        : 'text-slate-500'
                    }`}
                  >
                    {nicknameStatus.isValid && registerNickname ? '✓ P1 TAG' : 'P1 TAG'}
                  </span>
                </div>
                <div
                  className={`relative flex items-center bg-[#171b26] rounded-full px-3.5 py-2 border transition-colors ${
                    touched.registerNickname && !nicknameStatus.isValid
                      ? 'border-red-500/80'
                      : 'border-outline-variant/30 focus-within:border-primary-container/80'
                  }`}
                >
                  <span className="material-symbols-outlined text-slate-400 text-lg mr-2.5">
                    account_circle
                  </span>
                  <input
                    type="text"
                    required
                    value={registerNickname}
                    onChange={(e) => setRegisterNickname(e.target.value)}
                    onBlur={() => handleBlur('registerNickname')}
                    placeholder="Ví dụ: CyberStriker_99"
                    className="w-full bg-transparent text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none"
                  />
                  {registerNickname && (
                    <span className="material-symbols-outlined text-sm text-slate-400">
                      {nicknameStatus.isValid ? (
                        <span className="text-emerald-400">check_circle</span>
                      ) : (
                        <span className="text-red-400">cancel</span>
                      )}
                    </span>
                  )}
                </div>
                {touched.registerNickname && !nicknameStatus.isValid && (
                  <p className="text-[10px] text-red-400 pl-3 pt-0.5 animate-fadeIn">
                    {nicknameStatus.error}
                  </p>
                )}
              </div>

              {/* Field 2: Email */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">alternate_email</span>
                    EMAIL LIÊN KẾT / KHÔI PHỤC
                  </span>
                  <span
                    className={`font-semibold ${
                      emailStatus.isValid && registerEmail ? 'text-primary-container' : 'text-slate-500'
                    }`}
                  >
                    {emailStatus.isValid && registerEmail ? '✓ BẢO MẬT 2FA' : 'BẢO MẬT 2FA'}
                  </span>
                </div>
                <div
                  className={`relative flex items-center bg-[#171b26] rounded-full px-3.5 py-2 border transition-colors ${
                    touched.registerEmail && !emailStatus.isValid
                      ? 'border-red-500/80'
                      : 'border-outline-variant/30 focus-within:border-primary-container/80'
                  }`}
                >
                  <span className="material-symbols-outlined text-slate-400 text-lg mr-2.5">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    onBlur={() => handleBlur('registerEmail')}
                    placeholder="email@example.com"
                    className="w-full bg-transparent text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none"
                  />
                  {registerEmail && (
                    <span className="material-symbols-outlined text-sm">
                      {emailStatus.isValid ? (
                        <span className="text-emerald-400">check_circle</span>
                      ) : (
                        <span className="text-red-400">cancel</span>
                      )}
                    </span>
                  )}
                </div>
                {touched.registerEmail && !emailStatus.isValid && (
                  <p className="text-[10px] text-red-400 pl-3 pt-0.5 animate-fadeIn">
                    {emailStatus.error}
                  </p>
                )}
              </div>

              {/* Field 3: Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">lock</span>
                    MẬT KHẨU BẢO MẬT
                  </span>
                  <span className={`font-semibold ${passwordStrength.textColor}`}>
                    {registerPassword ? `ĐỘ MẠNH: ${passwordStrength.label.toUpperCase()}` : 'ĐỘ DÀI: 8+'}
                  </span>
                </div>
                <div
                  className={`relative flex items-center bg-[#171b26] rounded-full px-3.5 py-2 border transition-colors ${
                    touched.registerPassword && !passwordStrength.isValid
                      ? 'border-yellow-500/60'
                      : 'border-outline-variant/30 focus-within:border-primary-container/80'
                  }`}
                >
                  <span className="material-symbols-outlined text-slate-400 text-lg mr-2.5">
                    key
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    onBlur={() => handleBlur('registerPassword')}
                    placeholder="Tối thiểu 8 ký tự (chữ hoa, số, ký tự đặc biệt)..."
                    className="w-full bg-transparent text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-white ml-2 focus:outline-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                {/* Password Strength Meter Bar */}
                {registerPassword && (
                  <div className="pt-1 px-1 space-y-1 animate-fadeIn">
                    <div className="w-full bg-[#1e2330] h-1.5 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: passwordStrength.width }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[9px] text-slate-400 text-center pt-0.5">
                      <span className={passwordStrength.hasMinLength ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        ✓ 8+ ký tự
                      </span>
                      <span className={passwordStrength.hasUpper ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        ✓ Chữ hoa
                      </span>
                      <span className={passwordStrength.hasNumber ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        ✓ Số
                      </span>
                      <span className={passwordStrength.hasSpecial ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        ✓ Ký tự đặc biệt
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Field 4: Confirm Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">shield</span>
                    XÁC NHẬN MẬT KHẨU
                  </span>
                  <span
                    className={`font-semibold flex items-center gap-0.5 ${
                      confirmPasswordStatus.isMatch
                        ? 'text-tertiary-container'
                        : registerConfirmPassword
                        ? 'text-red-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {confirmPasswordStatus.isMatch
                      ? '✓ KHỚP MÃ'
                      : registerConfirmPassword
                      ? '✕ CHƯA KHỚP'
                      : 'KHỚP MÃ'}
                  </span>
                </div>
                <div
                  className={`relative flex items-center bg-[#171b26] rounded-full px-3.5 py-2 border transition-colors ${
                    registerConfirmPassword && !confirmPasswordStatus.isMatch
                      ? 'border-red-500/80'
                      : 'border-outline-variant/30 focus-within:border-primary-container/80'
                  }`}
                >
                  <span className="material-symbols-outlined text-slate-400 text-lg mr-2.5">
                    history
                  </span>
                  <input
                    type="password"
                    required
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    onBlur={() => handleBlur('registerConfirmPassword')}
                    placeholder="Nhập lại mật khẩu để xác nhận..."
                    className="w-full bg-transparent text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none"
                  />
                  {registerConfirmPassword && (
                    <span className="material-symbols-outlined text-sm">
                      {confirmPasswordStatus.isMatch ? (
                        <span className="text-emerald-400">check_circle</span>
                      ) : (
                        <span className="text-red-400">cancel</span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] text-slate-300">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="w-3.5 h-3.5 mt-0.5 rounded accent-primary-container cursor-pointer"
                  />
                  <span>
                    Tôi đồng ý với{' '}
                    <button
                      type="button"
                      onClick={() => setIsTermsModalOpen(true)}
                      className="text-primary-container underline hover:text-white transition-colors cursor-pointer"
                    >
                      Quy chế Đấu trường & Chính sách bảo mật NEO UNO
                    </button>
                    .
                  </span>
                </label>
              </div>

              {/* CTA Register Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full bg-primary-container text-black font-headline text-xs sm:text-sm font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:shadow-[0_0_25px_rgba(0,210,255,0.6)] hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">autorenew</span>
                    <span>ĐANG KHỞI TẠO TÀI KHOẢN...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">swords</span>
                    <span>TẠO TÀI KHOẢN & VÀO BÀN ĐẤU</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Instant Bot Access Button */}
          <button
            type="button"
            onClick={handleBotPlay}
            disabled={isBotLoading}
            className="w-full py-2.5 px-3 rounded-full bg-[#18202d] hover:bg-[#20293a] text-tertiary-container text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md border border-tertiary-container/30 transition-all cursor-pointer group mt-2"
          >
            {isBotLoading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">autorenew</span>
                <span>ĐANG KHỞI TẠO TÀI KHOẢN KHÁCH...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base group-hover:rotate-12 transition-transform">
                  smart_toy
                </span>
                <span>CHƠI NGAY VỚI BOT (CHẾ ĐỘ KHÁCH)</span>
                <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary-container font-black uppercase">
                  ● OFFLINE
                </span>
              </>
            )}
          </button>

          {/* Divider & Social Logins */}
          <SocialLoginButtons
            dividerText={activeTab === 'login' ? 'ĐĂNG NHẬP ĐỒNG BỘ NHANH' : 'HOẶC ĐĂNG KÝ NHANH'}
            onGoogleClick={() => alert('Đang kết nối cổng Google Play Games...')}
            onDiscordClick={() => alert('Đang kết nối cổng Discord Gaming Gateway...')}
          />

          {/* Real-time Server Status Badge */}
          <ServerStatusBadge />

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-3 pt-2 text-[10px] text-slate-500 font-medium gap-1 border-t border-outline-variant/10">
            <span>© 2025 NEO UNO</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Điều khoản Arena
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                Chính sách bảo mật
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Privacy Modal */}
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />
    </>
  );
}
