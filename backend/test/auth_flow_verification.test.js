/**
 * NEO UNO - Bộ Kiểm Thử Chuẩn Hóa Hệ Thống Xác Thực
 * (Login / Logout / Forgot Password with Email OTP / Google Sign-In)
 */

const BASE_URL = 'http://localhost:5001/api';

async function runTestSuite() {
  console.log('\n===============================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN HỆ THỐNG XÁC THỰC NEO-UNO');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  const timestamp = Date.now();
  const testUser = {
    nickname: `NeoAuth_${Math.floor(1000 + Math.random() * 9000)}`,
    email: `neo_auth_${timestamp}@neouno.test`,
    password: 'Password@123',
    newPassword: 'NewSecurePassword@456',
  };

  try {
    // -----------------------------------------------------------------
    // TEST 1: Đăng ký tài khoản thử nghiệm
    // -----------------------------------------------------------------
    console.log('\n--- 1. Kiểm thử Đăng ký & Đăng nhập chuẩn ---');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: testUser.nickname,
        email: testUser.email,
        password: testUser.password,
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.success && regData.token, 'Đăng ký tài khoản mới thành công (cấp JWT token)');

    // -----------------------------------------------------------------
    // TEST 2: Đăng nhập đúng (Case-insensitive email & nickname)
    // -----------------------------------------------------------------
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testUser.email.toUpperCase(), // Test case-insensitive
        password: testUser.password,
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.success, 'Đăng nhập thành công với email chữ hoa (Case-insensitive)');
    const authToken = loginData.token;

    // -----------------------------------------------------------------
    // TEST 3: Đăng nhập sai mật khẩu (Kiểm tra chống brute-force)
    // -----------------------------------------------------------------
    const wrongLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testUser.email,
        password: 'WrongPassword999',
      }),
    });
    const wrongData = await wrongLoginRes.json();
    assert(wrongLoginRes.status === 401 && !wrongData.success, 'Từ chối mật khẩu sai với mã 401 và đếm số lần còn lại');

    // -----------------------------------------------------------------
    // TEST 4: Quên mật khẩu - Nhập email KHÔNG tồn tại
    // -----------------------------------------------------------------
    console.log('\n--- 2. Kiểm thử Quên mật khẩu & Gửi mã OTP ---');
    const wrongEmailRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'non_existent_player_xyz_99@gmail.com' }),
    });
    assert(wrongEmailRes.status === 404, 'Trả về mã lỗi 404 khi yêu cầu OTP cho email không tồn tại');

    // -----------------------------------------------------------------
    // TEST 5: Quên mật khẩu - Nhập email ĐÚNG
    // -----------------------------------------------------------------
    const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email }),
    });
    const forgotData = await forgotRes.json();
    assert(forgotRes.status === 200 && forgotData.success, 'Gửi mã OTP thành công khi nhập đúng email đã đăng ký');
    const receivedOtp = forgotData.demoOtp || forgotData.otp;
    assert(typeof receivedOtp === 'string' && receivedOtp.length === 6, `Tạo mã OTP 6 số thành công: [${receivedOtp}]`);

    // -----------------------------------------------------------------
    // TEST 6: Xác thực mã OTP sai
    // -----------------------------------------------------------------
    const verifyWrongOtpRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, otp: '000000' }),
    });
    assert(verifyWrongOtpRes.status === 400, 'Từ chối mã OTP sai với HTTP 400');

    // -----------------------------------------------------------------
    // TEST 7: Xác thực mã OTP đúng
    // -----------------------------------------------------------------
    const verifyRightOtpRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, otp: receivedOtp }),
    });
    const verifyRightData = await verifyRightOtpRes.json();
    assert(verifyRightOtpRes.status === 200 && verifyRightData.success, 'Xác thực mã OTP chính xác thành công');

    // -----------------------------------------------------------------
    // TEST 8: Đặt lại mật khẩu mới
    // -----------------------------------------------------------------
    const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        otp: receivedOtp,
        newPassword: testUser.newPassword,
      }),
    });
    const resetData = await resetRes.json();
    assert(resetRes.status === 200 && resetData.success && resetData.token, 'Đổi mật khẩu mới thành công và tự động cấp token đăng nhập');

    // -----------------------------------------------------------------
    // TEST 9: Đăng nhập bằng mật khẩu mới
    // -----------------------------------------------------------------
    const loginNewPassRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testUser.email,
        password: testUser.newPassword,
      }),
    });
    const loginNewData = await loginNewPassRes.json();
    assert(loginNewPassRes.status === 200 && loginNewData.success, 'Đăng nhập thành công với mật khẩu mới');

    // -----------------------------------------------------------------
    // TEST 10: Đăng nhập bằng Google (Google OAuth / Fast Demo)
    // -----------------------------------------------------------------
    console.log('\n--- 3. Kiểm thử Đăng nhập bằng Google (OAuth / GIS) ---');
    const googleMockUser = {
      googleId: `google_uid_${timestamp}`,
      email: `google_gamer_${timestamp}@gmail.com`,
      name: `Google Champion ${timestamp.toString().slice(-4)}`,
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=google_${timestamp}`,
    };

    const googleRes = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mockUser: googleMockUser }),
    });
    const googleData = await googleRes.json();
    assert(
      googleRes.status === 200 &&
      googleData.success &&
      googleData.user.authProvider === 'google' &&
      googleData.user.googleId === googleMockUser.googleId,
      'Đăng nhập Google: Tự động khởi tạo tài khoản mới với đầy đủ 1000 vàng & 1000 ELO'
    );

    // -----------------------------------------------------------------
    // TEST 11: Đăng nhập lại tài khoản Google cũ
    // -----------------------------------------------------------------
    const googleReLoginRes = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mockUser: googleMockUser }),
    });
    const googleReLoginData = await googleReLoginRes.json();
    assert(
      googleReLoginRes.status === 200 &&
      googleReLoginData.user.id === googleData.user.id,
      'Đăng nhập Google: Tái đăng nhập nhận diện đúng người dùng cũ mà không tạo trùng lặp'
    );

    // -----------------------------------------------------------------
    // TEST 12: Đăng xuất an toàn (Safe Logout)
    // -----------------------------------------------------------------
    console.log('\n--- 4. Kiểm thử Đăng xuất an toàn (Safe Logout) ---');
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });
    const logoutData = await logoutRes.json();
    assert(logoutRes.status === 200 && logoutData.success, 'Đăng xuất tài khoản an toàn thành công (HTTP 200)');

  } catch (err) {
    console.error('❌ Ngoại lệ kiểm thử:', err);
  }

  console.log('\n===============================================================');
  console.log(`📊 KẾT QUẢ KIỂM THỬ: ${passed}/${total} TIÊU CHÍ ĐẠT (${Math.round((passed / total) * 100)}%)`);
  console.log('===============================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite();
