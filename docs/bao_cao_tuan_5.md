# BÁO CÁO TIẾN ĐỘ TUẦN 5: NEO-UNO

| STT | Đầu việc | Nội dung thực hiện | Kết quả | Minh chứng |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Đấu Giải Cúp Vô Địch 8 Đấu Thủ (Tournament Knockout Cup) | Thiết kế sơ đồ cây phân nhánh Knockout 3 vòng (Tứ kết, Bán kết, Chung kết); thuật toán xếp hạt giống (Seed 1-8); mô phỏng nhánh Bot thông minh; trao Cúp Vô Địch, Vàng, ELO và Season EXP. | Hoàn thành 100%: Cây phân nhánh hiển thị trực quan; luồng đấu liên tục chuyển vòng mượt mà; trao thưởng chính xác; Pass 28/28 tests automated. | 📁 task 1 |
| **2** | Chế Độ Đồng Đội 2v2 (Duo Tag-Team Mode & Co-op AI) | Phân chia 4 ghế ngồi đối xứng (Team Alpha: Ghế 0 & 2; Team Omega: Ghế 1 & 3); lập trình Co-op Victory Condition (1 người hết bài cả đội thắng); cơ chế luật hết giờ 5 phút cộng dồn bài; Bot AI nhận thức đồng đội không phạt nhau. | Hoàn thành 100%: Trận đấu 2v2 kịch tính cao; AI chiến thuật ăn ý bảo vệ đồng đội; giao diện phân màu neon theo phe; Pass 17/17 tests automated. | 📁 task 2 |
| **3** | Cyber Lucky Wheel & Điểm Danh 7 Ngày Streak | Xây dựng Vòng quay may mắn 8 cung thưởng (Tỷ lệ thực tế, cooldown 24h); hệ thống Điểm danh 7 ngày tích lũy chuỗi Streak (Reset nếu đứt mạch); giao diện Neon Wheel với âm thanh kim quay sống động. | Hoàn thành 100%: Tăng trưởng chỉ số giữ chân người chơi (Retention Rate); chống nhận lặp an toàn trên MongoDB; Pass 25/25 tests automated. | 📁 task 3 |
| **4** | Sổ Sứ Mệnh Cyber Mùa 1: Neon Overdrive (Battle Pass) | Thiết lập 30 cấp độ Sổ Sứ Mệnh với 2 tuyến song song (Miễn Phí & Tuyến VIP Premium); cơ chế tích lũy Season EXP từ trận đấu & Tournament; nút "Nhận Tất Cả" tối ưu UX; phần thưởng Khung Vương Miện & Skin độc quyền. | Hoàn thành 100%: Hệ thống kinh tế mở rộng mạnh mẽ; người chơi có động lực cày cuốc thăng cấp dài hạn; Pass 28/28 tests automated. | 📁 task 4 |
| **5** | Bang Hội & Quân Đoàn Cyberpunk (Guild / Clan System) | Lập trình tính năng thành lập Bang (Phí 2,000 Vàng, Tag 3-6 ký tự); Quỹ cống hiến Bang nâng cấp Level; Kênh chat nội bộ thời gian thực; Bảng xếp hạng vinh danh Bang Hội toàn server; Trao quyền Bang Chủ tự động khi rời. | Hoàn thành 100%: Xây dựng cộng đồng gắn kết; hệ thống phân quyền Leader/Officer/Member chặt chẽ; Pass 29/29 tests automated. | 📁 task 5 |
| **6** | Hồ Sơ Sự Nghiệp Đấu Thủ & Radar Kỹ Năng 6 Trục (Career Profile) | Lập trình biểu đồ đa giác SVG Radar 6 trục chuẩn hóa (Tỷ lệ thắng, Công phạt, Tốc độ APM, Phòng thủ, Đồng đội, Lật kèo); Lực chiến Esports PTS; Kho 8 Danh Hiệu Cyberpunk mở khóa tự động; Thẻ Căn Cước Số chia sẻ Clipboard. | Hoàn thành 100%: Giao diện hồ sơ Esports đẳng cấp; hiển thị danh hiệu trên Header; sao chép thẻ căn cước 1-click; Pass 32/32 tests automated. | 📁 task 6 |
| **7** | Kiểm Thử E2E Toàn Diện Hệ Thống & Triển Khai Mạng Thật (Cloud Production) | Tự động hóa bộ kiểm thử E2E Full Suite liên hoàn 6 module (159/159 tests PASS tuyệt đối); Kiểm định đồng bộ Production Vercel (`neo-uno.vercel.app`) và Render Cloud (`neo-uno-backend.onrender.com`); Biên soạn tài liệu tiến độ Tuần 5. | Hoàn thành 100%: Hệ thống vận hành trơn tru 24/7 trên môi trường Production đám mây; 0% lỗi hồi quy; hoàn tất trọn vẹn mục tiêu Tuần 5. | 📁 task 7 |

---

## I. TỔNG HỢP KẾT QUẢ KIỂM THỬ TỰ ĐỘNG TUẦN 5 (159/159 TESTS PASS)

Hệ thống kiểm thử tự động của Tuần 5 được cấu trúc thành kịch bản tổng hợp liên hoàn `backend/test/week5_e2e_full_suite.test.js`, chạy trực tiếp trên CSDL kiểm thử và kiểm định 100% các ràng buộc logic, chống gian lận và tính toàn vẹn dữ liệu:

| Kịch Bản Kiểm Thử | File Kiểm Thử | Số Lượng Assertions | Kết Quả | Đánh Giá |
| :--- | :--- | :---: | :---: | :---: |
| **Task 1: Đấu Giải Cúp Vô Địch 8 Đấu Thủ** | `backend/test/tournament_flow.test.js` | 28 / 28 | ✅ PASS 100% | Phân nhánh Knockout, mô phỏng Bot, trao Cúp chuẩn xác |
| **Task 2: Chế Độ Đồng Đội Tag-Team 2v2** | `backend/test/team_mode_2v2.test.js` | 17 / 17 | ✅ PASS 100% | Seating đối xứng, Co-op Victory, Timeout 5 phút |
| **Task 3: Vòng Quay & Điểm Danh 7 Ngày** | `backend/test/lucky_wheel_and_checkin.test.js` | 25 / 25 | ✅ PASS 100% | Cooldown 24h, bảo toàn streak, chống nhận trùng |
| **Task 4: Sổ Sứ Mệnh Cyber Mùa 1** | `backend/test/battle_pass.test.js` | 28 / 28 | ✅ PASS 100% | 30 Cấp độ, 2 luồng thưởng, mở khóa VIP, Claim All |
| **Task 5: Bang Hội & Quân Đoàn Cyber** | `backend/test/guild_flow.test.js` | 29 / 29 | ✅ PASS 100% | Tạo bang, quỹ cống hiến, kênh chat, thăng cấp, rời bang |
| **Task 6: Hồ Sơ Sự Nghiệp & Radar 6 Trục** | `backend/test/career_profile.test.js` | 32 / 32 | ✅ PASS 100% | Radar 6 trục 0-100 bounds, mở khóa 8 danh hiệu, CSDL |
| **TỔNG CỘNG TOÀN TUẦN 5** | `week5_e2e_full_suite.test.js` | **159 / 159** | ✅ **PASS 100%** | **HOÀN HẢO - 0% FAIL RATE** |

---

## II. CHI TIẾT KỸ THUẬT CÁC TÍNH NĂNG ĐÃ TRIỂN KHAI

### 1. Task 1: Giải Đấu Knockout Cup 8 Đấu Thủ (Tournament)
- **Cơ chế phân nhánh**: 8 đấu thủ chia thành 4 cặp Tứ kết ($Q_1: 1\text{ vs }8, Q_2: 4\text{ vs }5, Q_3: 2\text{ vs }7, Q_4: 3\text{ vs }6$).
- **Mô phỏng nhánh Bot thông minh**: Khi người chơi kết thúc trận của mình, các cặp đấu Bot song song được mô phỏng tự động theo chỉ số ELO và tỷ lệ bất ngờ để xác định đối thủ tiến vào Bán kết và Chung kết.
- **Phần thưởng Quán Quân**: 5,000 Vàng, 800 EXP, +60 ELO, Cúp Vô Địch lưu vĩnh viễn vào hồ sơ và 300 Season EXP cho Sổ Sứ Mệnh.

### 2. Task 2: Chế Độ Đồng Đội Tag-Team 2v2 (Duo Mode)
- **Ghế ngồi chiến thuật**:
  - Phe ALPHA (Neon Cyan): Ghế 0 (Người chơi) và Ghế 2 (Đồng đội Bot Neon).
  - Phe OMEGA (Crimson Rose): Ghế 1 (Bot Titan) và Ghế 3 (Bot Cyber).
- **Quy tắc Co-op Victory**: Chỉ cần bất kỳ thành viên nào trong đội đánh hết bài, toàn đội lập tức giành chiến thắng ván đấu.
- **Luật Hết Giờ (Timeout 5 Phút)**: Tổng số bài còn lại trên tay cả 2 thành viên được cộng dồn; đội có tổng số lá bài ít hơn sẽ thắng.
- **AI Chiến Thuật Đồng Đội**: Bot đồng đội ưu tiên đổi màu sang màu đồng đội sở hữu nhiều nhất và không bao giờ tung bài phạt (+2, +4, Skip) vào đồng đội của mình.

### 3. Task 3: Vòng Quay May Mắn Cyber & Điểm Danh 7 Ngày
- **Vòng Quay May Mắn (Lucky Wheel)**:
  - 8 cung phần thưởng với tỷ lệ xác suất thực: 100 Vàng (35%), 200 Vàng (25%), 500 Vàng (15%), 1,000 Vàng (10%), 2,000 Vàng (5%), Khung Neon (4%), Thẻ Mặt Lưng Ma Trận (4%), Jackpot 5,000 Vàng (2%).
  - Cơ chế quay miễn phí mỗi 24 giờ và hỗ trợ quay thêm bằng Vàng (500 Vàng/lượt).
- **Điểm Danh 7 Ngày Tích Lũy (Daily Check-in Streak)**:
  - Điểm danh liên tục nhận quà tăng dần từ Ngày 1 (100 Vàng) đến Ngày 7 (Đại thưởng 3,000 Vàng + Khung Avatar Vàng Hoàng Kim).
  - Tự động reset về Ngày 1 nếu đứt mạch quá 48 giờ.

### 4. Task 4: Sổ Sứ Mệnh Cyber Mùa 1: Neon Overdrive
- **Kiến trúc 30 Cấp Độ**: Mỗi cấp yêu cầu 200 Season EXP (tổng 6,000 EXP cho toàn mùa).
- **Hai Tuyến Phần Thưởng Song Song**:
  - Tuyến Miễn Phí (Free Pass): Nhận tổng 4,500 Vàng, 1,200 EXP và Danh hiệu `[CHIẾN THẦN CYBER]`.
  - Tuyến VIP (Premium Pass - 5,000 Vàng mở khóa): Nhận thêm 18,500 Vàng, Skin Thẻ Mặt Lưng Cyber Matrix (Cấp 10), và Đại Thưởng Mùa Khung Vương Miện Điện Tử + Danh Hiệu `[HOÀNG ĐẾ CYBER]` (Cấp 30).
- **Tính năng "Nhận Tất Cả" (Claim All)**: 1-click thu thập toàn bộ các mốc thưởng đã mở khóa, có âm thanh hân hoan.

### 5. Task 5: Bang Hội & Quân Đoàn Cyberpunk (Guild / Clan System)
- **Thành lập Bang Hội**: Chi phí 2,000 Vàng; Tên Bang 3-20 ký tự; Tag Bang độc nhất từ 3-6 ký tự (Ví dụ: `[CYBER]`, `[TITAN]`).
- **Quỹ Cống Hiến & Thăng Hạng**: Thành viên cống hiến Vàng vào Quỹ Bang; mỗi 1 Vàng = 1 EXP Bang; Bang thăng cấp mở rộng giới hạn thành viên (Level 1: 15, Level 2: 25, Level 3: 40 thành viên).
- **Kênh Chat Nội Bộ**: Kênh chat riêng biệt giữa các thành viên Bang Hội với bộ lọc từ cấm an toàn.
- **Bảo Vệ Quyền Lợi & Tự Động Kế Thừa**: Khi Bang Chủ rời Bang, quyền lực tự động chuyển giao cho Phó Bang hoặc thành viên gia nhập lâu nhất.

### 6. Task 6: Hồ Sơ Sự Nghiệp Đấu Thủ & Biểu Đồ Radar 6 Trục
- **Đồ thị Vector SVG 6 Trục (0 - 100 PTS)**:
  1. *Tỷ Lệ Thắng*: Tần suất về nhất được cân bằng theo số trận.
  2. *Sát Thương Công Phạt*: Mật độ lá phạt +2, +4 và đổi màu.
  3. *Tốc Độ / APM*: Tốc độ đánh bài và phản xạ hô UNO.
  4. *Phòng Thủ Kiên Cố*: Khả năng sinh tồn và thành tích Tournament.
  5. *Đồng Đội / Hợp Tác*: Hoạt động Bang Hội và kết quả 2v2 Tag-Team.
  6. *Bản Lĩnh Lật Kèo*: Chuỗi thắng đỉnh cao và leo thang ELO.
- **Hệ Thống 8 Danh Hiệu Cyberpunk**: Mở khóa tự động khi người chơi đạt đủ điều kiện thành tích; trang bị thay đổi trực tiếp vào Header.
- **Thẻ Căn Cước Số (Shareable Cyber ID Card)**: Nút sao chép 1-click định dạng thẻ Cyberpunk để chia sẻ thành tích lên mạng xã hội.

### 7. Task 7: Kiểm Thử Toàn Diện Hệ Thống & Triển Khai Mạng Thật
- Chạy kịch bản tự động hóa Master Runner kiểm tra toàn diện 159 bài kiểm thử, 0 lỗi.
- Frontend biên dịch sạch bằng Vite trong 698ms (`CareerProfileModal.jsx` code-split 27.21 kB).
- Kiểm tra kết nối trực tiếp thành công với 2 hệ thống Cloud Production:
  - **Frontend Vercel**: `https://neo-uno.vercel.app` (HTTP/2 200 OK)
  - **Backend Render**: `https://neo-uno-backend.onrender.com` (Phản hồi nhanh, bảo mật SSL, HTTPS/WSS, Rate-Limiting, Helmet active).

---

## III. HƯỚNG DẪN CHỤP ẢNH MINH CHỨNG THỰC TẾ CHO 7 TASK

Dưới đây là kịch bản chi tiết giúp bạn chụp ảnh minh chứng sắc nét để đính kèm vào báo cáo hoặc nộp bài:

---

### 📸 Task 1: Đấu Giải Cúp Vô Địch 8 Đấu Thủ (Tournament Knockout Cup)
- **Tên file gợi ý:** `task1_tournament_knockout_cup.png`
- **Cách thực hiện:**
  1. Tại Sảnh chính (Lobby), bấm vào nút **"ĐẤU GIẢI CÚP VÔ ĐỊCH"** (biểu tượng 🏆).
  2. Chọn tham gia giải đấu để mở Modal **Sơ Đồ Phân Nhánh Knockout**.
  3. Màn hình hiển thị cây thi đấu 8 người (Hạt giống số 1 đến 8), 3 vòng Tứ kết $\rightarrow$ Bán kết $\rightarrow$ Chung kết tranh Cúp vàng rực rỡ.
  4. **Góc chụp:** Chụp toàn bộ Modal Sơ đồ nhánh đấu Tournament đang hiển thị các cặp đấu và cúp vô địch ở giữa.

---

### 📸 Task 2: Chế Độ Đồng Đội Tag-Team 2v2 (Duo Mode)
- **Tên file gợi ý:** `task2_team_mode_2v2.png`
- **Cách thực hiện:**
  1. Tại Sảnh chính, bấm nút **"ĐẤU VỚI MÁY (BOT)"** để mở Modal Thiết Lập Trận Đấu.
  2. Ở mục "Chế Độ Đấu", chọn tab **"ĐỒNG ĐỘI 2V2"** (biểu tượng 🤝).
  3. Bấm "Bắt Đầu Trận Đấu" để vào bàn cờ: Bạn và Đồng đội Bot Neon ở thế đối xứng thuộc **TEAM ALPHA** (viền xanh Cyan), 2 đối thủ thuộc **TEAM OMEGA** (viền hồng Rose).
  4. **Góc chụp:** Chụp bàn đấu 2v2 với các nhãn phe [ALPHA] và [OMEGA] hiển thị rõ ràng trên avatar người chơi và đồng đội.

---

### 📸 Task 3: Vòng Quay May Mắn & Điểm Danh 7 Ngày
- **Tên file gợi ý:** `task3_lucky_wheel_and_checkin.png`
- **Cách thực hiện:**
  1. Bấm vào biểu tượng Avatar góc trên phải để mở Menu Cá Nhân.
  2. Chọn mục **"Vòng Quay May Mắn"** (biểu tượng 🎡) để mở vòng quay Neon rực rỡ 8 cung thưởng với nút "QUAY MIỄN PHÍ".
  3. Hoặc chọn mục **"Điểm Danh 7 Ngày"** (biểu tượng 📅) hiển thị lộ trình nhận Vàng từ Ngày 1 đến Ngày 7.
  4. **Góc chụp:** Chụp Modal Vòng Quay May Mắn hoặc Bảng Điểm Danh 7 Ngày với các mốc thưởng đã nhận tích xanh.

---

### 📸 Task 4: Sổ Sứ Mệnh Cyber Mùa 1: Neon Overdrive (Battle Pass)
- **Tên file gợi ý:** `task4_battle_pass_season1.png`
- **Cách thực hiện:**
  1. Trong Menu Cá Nhân hoặc trên thanh Banner Sảnh, bấm vào **"SỔ SỨ MỆNH MÙA 1"** (biểu tượng 🎖️).
  2. Màn hình mở ra giao diện Sổ Sứ Mệnh hiển thị thanh tiến trình 30 Cấp độ, 2 luồng thưởng song song Miễn Phí và Tuyến VIP Neon.
  3. Thấy rõ nút "Nâng Cấp VIP (5,000 🪙)" và nút "Nhận Tất Cả".
  4. **Góc chụp:** Chụp toàn cảnh Modal Battle Pass với các mốc thưởng Skin Ma Trận Cấp 10 và Khung Vương Miện Cấp 30.

---

### 📸 Task 5: Bang Hội & Quân Đoàn Cyberpunk (Guild System)
- **Tên file gợi ý:** `task5_guild_cyberpunk_system.png`
- **Cách thực hiện:**
  1. Mở Menu Cá Nhân, bấm vào mục **"Bang Hội & Quân Đoàn"** (biểu tượng 🛡️).
  2. Màn hình hiển thị giao diện Bang Hội với Danh sách Bang, nút "Lập Bang (2,000 🪙)", hoặc Bảng Xếp Hạng Bang Hội.
  3. Nếu đã gia nhập Bang: Hiển thị Thẻ Quân Đoàn, Quỹ Cống Hiến, Kênh Chat nội bộ và danh sách thành viên.
  4. **Góc chụp:** Chụp Modal Bang Hội đang hiển thị Bảng xếp hạng các Quân Đoàn hoặc Thẻ chi tiết Bang Hội.

---

### 📸 Task 6: Hồ Sơ Sự Nghiệp Đấu Thủ & Radar Kỹ Năng 6 Trục
- **Tên file gợi ý:** `task6_career_profile_radar.png`
- **Cách thực hiện:**
  1. Bấm vào Avatar của bạn hoặc chọn **"Hồ Sơ Sự Nghiệp & Radar"** trong Menu Cá Nhân.
  2. Modal Hồ Sơ mở ra hiển thị:
     - Biểu đồ **Radar SVG 6 Trục** phát sáng neon sắc nét cùng chỉ số Lực Chiến Esports (PTS).
     - Lưới 6 ô thống kê chiến tích sự nghiệp trọn đời (Tổng trận, Trận thắng, Chuỗi max, Cúp Tournament, Lá bài đã đánh, UNO hô).
     - Tab **"Kho Danh Hiệu Cyber"** với 8 danh hiệu phát sáng neon.
     - Tab **"Thẻ Căn Cước Số"** với nút "Sao Chép Thẻ Đấu Thủ".
  3. **Góc chụp:** Chụp tab Biểu Đồ Radar 6 Trục và Lưới Chiến Tích hiển thị trọn vẹn phong cách Cyberpunk.

---

### 📸 Task 7: Kiểm Thử Toàn Diện & Triển Khai Mạng Thật (Production Live)
- **Tên file gợi ý:** `task7_cloud_production_e2e.png`
- **Cách thực hiện:**
  - **Cách 1 (Kết quả Kiểm Thử E2E):** Mở Terminal và chạy lệnh:
    ```bash
    cd /Users/admin/NEO-UNO && node backend/test/week5_e2e_full_suite.test.js
    ```
    Terminal in ra bảng tổng kết xanh lá: **6/6 Suites thành công, 159/159 Tests ĐẠT (100%), 0.00% Fail Rate**. Chụp màn hình Terminal này.
  - **Cách 2 (Trang Web Chạy Thật Trên Internet):** Mở trình duyệt web truy cập `https://neo-uno.vercel.app`, thấy ổ khóa bảo mật SSL HTTPS, giao diện Sảnh NEO-UNO tải tức thì với đầy đủ các tính năng Tuần 5. Chụp thanh địa chỉ trình duyệt cùng giao diện game.
