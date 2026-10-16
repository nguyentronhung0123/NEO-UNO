// Hàm kiểm tra tính hợp lệ của Form theo thời gian thực (Real-time Validation)

export function validateNickname(nickname) {
  if (!nickname || nickname.trim() === '') {
    return { isValid: false, error: 'Vui lòng nhập biệt danh đấu trường' };
  }
  if (nickname.length < 3) {
    return { isValid: false, error: 'Biệt danh phải có ít nhất 3 ký tự' };
  }
  if (nickname.length > 20) {
    return { isValid: false, error: 'Biệt danh không được vượt quá 20 ký tự' };
  }
  const validPattern = /^[a-zA-Z0-9_]+$/;
  if (!validPattern.test(nickname)) {
    return { isValid: false, error: 'Chỉ chấp nhận chữ cái, số và dấu gạch dưới (_)' };
  }
  return { isValid: true, error: null };
}

export function validateEmail(email) {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Vui lòng nhập địa chỉ email' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Định dạng email không hợp lệ (vd: player@neouno.com)' };
  }
  return { isValid: true, error: null };
}

export function calculatePasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: 'Chưa nhập',
      color: 'bg-slate-700',
      textColor: 'text-slate-500',
      width: '0%',
      hasMinLength: false,
      hasLetter: false,
      hasUpper: false,
      hasNumber: false,
      hasSpecial: false,
      isValid: false,
    };
  }

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  // MỨC MẠNH: Bắt buộc tối thiểu 8 ký tự, có chữ hoa VÀ ký tự đặc biệt, kèm chữ thường và số
  const isStrong = hasMinLength && hasUpper && hasLetter && hasNumber && hasSpecial;

  // MỨC TRUNG BÌNH: Đủ 8 ký tự, có cơ bản chữ + số (hoặc thiếu 1 trong 2: chữ hoa hoặc ký tự đặc biệt)
  const isMedium = hasMinLength && ((hasLetter && hasNumber) || (hasUpper && hasNumber) || (hasLetter && hasSpecial));

  if (isStrong) {
    return {
      score: 3,
      label: 'Mạnh',
      color: 'bg-emerald-400',
      textColor: 'text-emerald-400',
      width: '100%',
      hasMinLength,
      hasLetter,
      hasUpper,
      hasNumber,
      hasSpecial,
      isValid: true,
    };
  }

  if (isMedium) {
    return {
      score: 2,
      label: 'Trung bình',
      color: 'bg-yellow-400',
      textColor: 'text-yellow-400',
      width: '66%',
      hasMinLength,
      hasLetter,
      hasUpper,
      hasNumber,
      hasSpecial,
      isValid: true,
    };
  }

  return {
    score: 1,
    label: 'Yếu',
    color: 'bg-red-500',
    textColor: 'text-red-400',
    width: '33%',
    hasMinLength,
    hasLetter,
    hasUpper,
    hasNumber,
    hasSpecial,
    isValid: false,
  };
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) {
    return { isMatch: false, error: null };
  }
  if (password !== confirmPassword) {
    return { isMatch: false, error: 'Mật khẩu xác nhận không trùng khớp' };
  }
  return { isMatch: true, error: null };
}
