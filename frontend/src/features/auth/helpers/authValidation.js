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

// 3. Hàm kiểm tra độ mạnh mật khẩu và bắt buộc thỏa mãn 5 tiêu chí bảo mật
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
      missingRequirements: ['Tối thiểu 8 ký tự', 'Chữ hoa (A-Z)', 'Chữ số (0-9)', 'Ký tự đặc biệt (@, #, $...)'],
    };
  }

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const missingRequirements = [];
  if (!hasMinLength) missingRequirements.push('Tối thiểu 8 ký tự');
  if (!hasUpper) missingRequirements.push('Ít nhất 1 chữ hoa (A-Z)');
  if (!hasLetter) missingRequirements.push('Ít nhất 1 chữ thường (a-z)');
  if (!hasNumber) missingRequirements.push('Ít nhất 1 chữ số (0-9)');
  if (!hasSpecial) missingRequirements.push('Ít nhất 1 ký tự đặc biệt (@, #, $...)');

  // ĐIỀU KIỆN HỢP LỆ CHẮC CHẮN: Phải thỏa mãn toàn bộ 5 tiêu chí
  const isStrong = hasMinLength && hasUpper && hasLetter && hasNumber && hasSpecial;

  // MỨC TRUNG BÌNH: Đạt chiều dài và 3 tiêu chí con (nhưng vẫn CHƯA ĐỦ để đăng ký)
  const scoreCount = [hasMinLength, hasLetter, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (isStrong) {
    return {
      score: 3,
      label: 'Mạnh (Hợp lệ)',
      color: 'bg-emerald-400',
      textColor: 'text-emerald-400',
      width: '100%',
      hasMinLength,
      hasLetter,
      hasUpper,
      hasNumber,
      hasSpecial,
      isValid: true,
      missingRequirements: [],
    };
  }

  if (scoreCount >= 3) {
    return {
      score: 2,
      label: 'Trung bình (Chưa đủ điều kiện)',
      color: 'bg-yellow-400',
      textColor: 'text-yellow-400',
      width: `${Math.round((scoreCount / 5) * 100)}%`,
      hasMinLength,
      hasLetter,
      hasUpper,
      hasNumber,
      hasSpecial,
      isValid: false, // Bắt buộc phải đạt Mạnh mới được đăng ký!
      missingRequirements,
    };
  }

  return {
    score: 1,
    label: 'Yếu',
    color: 'bg-red-500',
    textColor: 'text-red-400',
    width: `${Math.max(20, Math.round((scoreCount / 5) * 100))}%`,
    hasMinLength,
    hasLetter,
    hasUpper,
    hasNumber,
    hasSpecial,
    isValid: false,
    missingRequirements,
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

// 4. Kiểm tra hợp lệ cho form Đăng nhập
export function validateLoginIdentifier(identifier) {
  if (!identifier || identifier.trim() === '') {
    return { isValid: false, error: 'Vui lòng nhập Email hoặc Tên tài khoản' };
  }
  if (identifier.trim().length < 3) {
    return { isValid: false, error: 'Tài khoản hoặc email phải từ 3 ký tự trở lên' };
  }
  return { isValid: true, error: null };
}

export function validateLoginPassword(password) {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Vui lòng nhập mật mã bảo mật' };
  }
  if (password.length < 6) {
    return { isValid: false, error: 'Mật mã tối thiểu từ 6 ký tự' };
  }
  return { isValid: true, error: null };
}
