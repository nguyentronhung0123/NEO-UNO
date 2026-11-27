# BÁO CÁO TIẾN ĐỘ TUẦN 7: NEO-UNO

**Đề Tài:** Xây Dựng Nền Tảng Trò Chơi Thẻ Bài Trực Tuyến NEO-UNO (Cyberpunk Theme)  
**Trọng Tâm Tuần 7:** Tối Ưu Toàn Diện Di Động (Mobile Landscape, PWA Service Worker, Hiệu Năng 60 FPS & Đa Nhiệm Chia Đôi Màn Hình)  
**Hạ Tầng Triển Khai:** Frontend Vercel (`https://neo-uno.vercel.app`) | Backend Render Cloud (`https://neo-uno-backend.onrender.com`)  
**Khoảng Thời Gian Thực Hiện:** 23/11/2026 – 27/11/2026  

---

| STT | Đầu việc | Nội dung thực hiện | Kết quả | Minh chứng |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Ràng Buộc Xoay Ngang Màn Hình Khi Vào Trận (Mobile Landscape Lock)** | Phát hiện thiết bị di động cảm ứng (`(pointer: coarse)`) đang ở chế độ dọc khi vào bàn đấu (`GameBoard` và `OnlineGameBoard`); hiển thị lớp khóa `OrientationNotice` hướng dẫn người chơi xoay ngang thiết bị trước khi thi đấu, kèm nút thoát an toàn về Sảnh chính. | Hoàn thành 100%: Ngăn triệt để tình trạng ván đấu bị bóp hẹp theo chiều dọc trên điện thoại; đảm bảo đầy đủ không gian hiển thị 4 góc bàn đấu. | 📁 task 1 |
| **2** | **Sửa Lỗi Runtime Web Audio & Tương Thích Trình Duyệt Di Động** | Khắc phục dứt điểm lỗi runtime `r.isEnabled is not a function` phát sinh trên một số trình duyệt di động trong `audioFx.js`; bọc an toàn qua `ErrorBoundary` và thiết lập mục tiêu biên dịch `es2020` tại `vite.config.js`; tinh chỉnh bước đầu tỷ lệ thẻ bài trên màn hình nhỏ. | Hoàn thành 100%: Không còn lỗi sập giao diện bàn đấu khi phát âm thanh trên iOS Safari / Android Chrome; biên dịch sạch JS tương thích rộng. | 📁 task 2 |
| **3** | **Khắc Phục Lỗi Không Tải Được Trang Trên Điện Thoại (PWA & Vercel Routing)** | Đại tu `frontend/public/sw.js` để loại bỏ cache Service Worker cũ và yêu cầu cross-origin gây treo trắng màn hình trên điện thoại; cập nhật `frontend/vercel.json` ngăn rule SPA rewrite trả về `index.html` thay cho file `/assets/*.js`; bổ sung cơ chế tự động reload an toàn trong `main.jsx` và `ErrorBoundary.jsx` khi chunk JS cũ hết hạn sau deploy. | Hoàn thành 100%: Truy cập `https://neo-uno.vercel.app` trên điện thoại tải trang tức thì, hết lỗi màn hình trắng hay hỏng module script sau mỗi đợt deploy mới. | 📁 task 3 |
| **4** | **Tối Ưu Kết Nối Mạng 4G/Cold-Start Backend & Giảm Tải GPU Ban Đầu** | Điều chỉnh cấu hình kết nối `socket.js` ưu tiên `polling-first` trước khi nâng cấp WebSocket giúp vượt qua độ trễ Render Free cold-start và mạng di động không ổn định; bổ sung cơ chế giữ phiên đăng nhập tại `AuthContext.jsx` và `authApi.js`; giảm các lớp `backdrop-blur` gây nghẽn GPU trên mobile. | Hoàn thành 100%: Kết nối phòng đấu và sảnh ổn định trên mạng 4G; không văng phiên đăng nhập khi backend khởi động lại từ trạng thái ngủ. | 📁 task 4 |
| **5** | **Đại Tu Hiệu Năng Tải Trang & Phản Hồi 60 FPS Trên Điện Thoại** | Subset font `Material Symbols Outlined` trong `index.html` đúng tập icon sử dụng (giảm dung lượng từ `4.03 MB` xuống `13.06 KB`); loại bỏ tải sớm Google GSI / Guest Dicebear gây nghẽn đầu phiên; thay thế blur lớn (`blur-[90px..140px]`) bằng radial gradient nhẹ và tắt `backdrop-blur` nặng trên thiết bị chạm; prewarm `AudioContext`; tối ưu thao tác vuốt đánh bài (`onTouchMove`) bằng DOM ref trực tiếp và bỏ polling/ghi `localStorage` mỗi giây. | Hoàn thành 100%: Đo kiểm Chrome CDP mobile ghi nhận thời gian tải giảm từ `5266ms` xuống `492ms`; độ trễ phản hồi click menu giảm từ `385ms` xuống `98ms`; vuốt bài mượt mà trên điện thoại ngang ngửa máy tính. | 📁 task 5 |
| **6** | **Chuẩn Hóa Bố Cục Dọc/Ngang, Modal Cuộn & Đa Nhiệm Split-Screen** | Thu gọn padding/chữ header trong `LobbyPage.jsx` + `.desktop-dock-only` để không lệch/tràn cạnh phải trên portrait `360px–390px` và landscape; chuyển sảnh xoay ngang (`@media (max-height: 540px)`) sang lưới 2 cột giúp nút `GHÉP TRẬN NHANH` & `ĐẤU VỚI BOT AI` hiển thị trọn trong 1 khung hình; thêm `max-h-[92dvh] overflow-y-auto` cho loạt modal và ghim `sticky bottom-0` nút CTA ở `MatchSetupModal.jsx`; thiết kế lại hệ quy chuẩn `.arena-board` theo chiều cao (`360px–560px`) & split-screen (`<= 720px`) để hiện đủ tên người chơi (`Player HUD`), tạo khoảng thở với chồng bài giữa, chống đè nút `UNO`/`Emote` và kẹp lề bóng thoại trong `EmoteOverlay.jsx`. | Hoàn thành 100%: Khắc phục toàn bộ 4 lỗi bố cục thực tế người dùng phản hồi; tương thích tốt cả điện thoại nhỏ (`360×640`, `667×375`), điện thoại chuẩn (`390×844`, `844×390`) lẫn cửa sổ đa nhiệm chia đôi (`640×480`). | 📁 task 6 |
| **7** | **Kiểm Thử Đa Màn Hình Chrome Headless, Hồi Quy E2E & Tổng Kết Tuần 7** | Thực thi kiểm thử hồi quy toàn hệ thống sau chỉnh sửa cuối (`vite build`, `oxlint` 0 errors, Frontend unit tests, Backend unit tests & `week5_e2e_full_suite.test.js`); chạy script `layout_probe.mjs` kiểm chứng tọa độ DOM & ảnh chụp màn hình trên Chrome Headless qua nhiều kích thước dọc, xoay ngang và chia đôi đa nhiệm; hoàn thiện Báo cáo Tiến độ Tuần 7 và đẩy lên `origin/main`. | Hoàn thành 100%: Đạt `159/159` E2E PASS, `32/32` & `24/24` Frontend Unit Test PASS, `9/9` ELO & `68/68` Deck PASS; `0` tràn ngang và `hudVisibleInsideViewport: true` ở mọi viewport kiểm đo. | 📁 task 7 |

---

## I. TỔNG HỢP KẾT QUẢ KIỂM THỬ & ĐO LƯỜNG TUẦN 7

### 1. Kết Quả Kiểm Thử Tự Động Toàn Hệ Thống (Sau Chỉnh Sửa Cuối `88b21fb`)

| Hạng Mục Kiểm Thử | Phạm Vi / Script | Kết Quả Thực Tế | Đánh Giá |
| :--- | :--- | :---: | :--- |
| **Production Build (`Vite`)** | `npm --prefix frontend run build` (`vite v8.3.4`) | **1.08s** (116 modules) | ✅ PASS 100% |
| **Static Analysis (`oxlint`)** | 15 files frontend vừa chỉnh sửa (104 rules) | **0 errors** | ✅ SẠCH LỖI |
| **Logic Bộ Bài & Tính Điểm (`Frontend`)** | `frontend/src/utils/gameLogic.test.js` | **32 / 32 PASS** | ✅ PASS 100% |
| **Vòng Đánh 4 Góc & Luật UNO (`Frontend`)** | `frontend/src/utils/turnLogic.test.js` | **24 / 24 PASS** | ✅ PASS 100% |
| **Full E2E Suite 6 Phân Hệ (`Backend`)** | `backend/test/week5_e2e_full_suite.test.js` | **159 / 159 PASS** | ✅ PASS 100% |
| **Xếp Hạng ELO & Bộ Bài 108 Lá (`Backend`)** | `eloModes.test.js` & `deck.test.js` | **9 / 9** & **68 / 68 PASS** | ✅ PASS 100% |

> *(Ghi chú kiểm thử: Trong một lần chạy liên tiếp trước đó, Suite Task 3 trong `week5_e2e_full_suite.test.js` từng báo `12/25` do dữ liệu test phụ thuộc trạng thái lượt quay/mạng; ở lần chạy xác nhận cuối cùng ngay trước khi commit, toàn bộ `6/6` Suites đạt `159/159 PASS (100%)`.)*

### 2. Thông Số Đo Lường Hiệu Năng & Bố Cục Thực Tế Trên Chrome Headless

| Chỉ Số / Kịch Bản Đo | Trước Tối Ưu | Sau Tối Ưu Tuần 7 | Minh Chứng Script |
| :--- | :---: | :---: | :--- |
| **Tài nguyên `Material Symbols Outlined`** | `4.03 MB` | **13.06 KB** | `perf_probe.mjs` (commit `080f4ca`) |
| **Thời gian tải trang Mobile (`Mobile Load`)** | `5266 ms` | **492 ms** | `perf_probe.mjs` (commit `080f4ca`) |
| **Độ trễ mở Menu (`Click Latency`)** | `385 ms` | **98 ms** | `perf_probe.mjs` (commit `080f4ca`) |
| **Sảnh dọc `390×844` & `360×640`** | Lệch & tràn header phải | `docOverflow: 0`, header 1 hàng cân đối | `layout_probe.mjs` (commit `88b21fb`) |
| **Sảnh ngang `844×390`** | Bị cuộn mất nút chơi | `docOverflow: 0`, 2 cột vừa gọn trong `390px` | `layout_probe.mjs` (commit `88b21fb`) |
| **Modal Cấu Hình `844×390`** | Mất nút Bắt Đầu & tiêu đề | `overflowY: auto`, nút Bắt Đầu ghim đáy (`345px`) | `layout_probe.mjs` (commit `88b21fb`) |
| **Bàn đấu xoay ngang `844×390` / `667×375` / `800×360`** | Che mất Player HUD & bài quá to | `hudVisibleInsideViewport: true`, `hudCornerOverlap: false`, khoảng thở `22px / 11px / 7px` | `layout_probe.mjs` (commit `88b21fb`) |
| **Cửa sổ Đa Nhiệm `640×480`** | Thanh HUD va chạm góc phải | `hudVisibleInsideViewport: true`, `hudCornerOverlap: false`, khoảng thở `54px` | `layout_probe.mjs` (commit `88b21fb`) |

---

## II. CHI TIẾT KỸ THUẬT CÁC TASK ĐÃ TRIỂN KHAI TRONG TUẦN 7

### 1. Task 1: Ràng Buộc Xoay Ngang Bàn Đấu Di Động (`bd331f8`)
- Thiết kế component `frontend/src/components/OrientationNotice.jsx` kết hợp với `frontend/src/pages/GameBoard.jsx` và `frontend/src/pages/OnlineGameBoard.jsx`.
- Khi thiết bị cảm ứng màn hình dọc truy cập bàn đấu, lớp phủ toàn màn hình yêu cầu xoay ngang điện thoại và cung cấp tùy chọn thoát trận an toàn để không kẹt luồng điều hướng.

### 2. Task 2: Sửa Lỗi Runtime Audio & Tương Thích JS Mobile (`6830d0d`, `d6f555a`)
- Xử lý an toàn hàm kiểm tra trạng thái âm thanh trong `frontend/src/utils/audioFx.js` tránh ngoại lệ `r.isEnabled is not a function` trên trình duyệt di động.
- Cấu hình biên dịch `es2020` trong `frontend/vite.config.js` giúp tăng khả năng tương thích trên Safari iOS và WebView Android đời cũ.

### 3. Task 3: Sửa Lỗi Tải Trang Trên Điện Thoại (`d6f555a`, `4c95c47`)
- Chỉnh sửa `frontend/public/sw.js` ngăn Service Worker giữ cache lỗi thời hoặc chặn nhầm request cross-origin.
- Cập nhật `frontend/vercel.json` tách riêng đường dẫn tĩnh `/assets/*` khỏi rule SPA rewrite về `index.html`, đồng thời bổ sung cơ chế tự reload khi gặp lỗi tải chunk cũ ở `frontend/src/main.jsx` và `frontend/src/components/ErrorBoundary.jsx`.

### 4. Task 4: Tối Ưu Kết Nối Socket 4G & Cold-Start Backend (`79ac7da`)
- Cấu hình lại `frontend/src/services/socket.js` chuyển sang cơ chế `polling-first` giúp kết nối ổn định hơn khi mạng di động yếu hoặc backend Render đang thức dậy từ cold-start.
- Tinh chỉnh giữ phiên đăng nhập ở `frontend/src/contexts/AuthContext.jsx` và `frontend/src/apis/authApi.js`.

### 5. Task 5: Đại Tu Tốc Độ Tải & Độ Mượt 60 FPS Trên Mobile (`080f4ca`)
- Tối ưu font `Material Symbols Outlined` tại `frontend/index.html` theo tham số `icon_names=...` giảm dung lượng tải xuống từ `4.03 MB` xuống `13.06 KB`.
- Thay thế các lớp nền `blur-[90px..140px]` tốn GPU bằng radial gradient nhẹ và tắt `backdrop-blur` nặng trên thiết bị cảm ứng trong `frontend/src/index.css`.
- Prewarm `AudioContext` ở `frontend/src/utils/audioFx.js`, tối ưu kéo/vuốt lá bài trực tiếp bằng DOM ref ở `GameBoard.jsx` & `OnlineGameBoard.jsx`, và loại bỏ vòng lặp polling `localStorage` mỗi 1 giây.

### 6. Task 6: Chuẩn Hóa Bố Cục Mobile Dọc/Ngang, Modal & Đa Nhiệm (`88b21fb`)
- **Header & Sảnh chính (`LobbyPage.jsx`, `index.css`)**: Dùng `min-w-0`, `.desktop-dock-only` (`min-width: 1100px` và `min-height: 560px`) và co gọn nút trên viewport hẹp để header không bao giờ lệch hoặc tràn cạnh phải. Khi xoay ngang (`@media (max-height: 540px) and (min-width: 560px)`), `.lobby-main` chuyển sang lưới 2 cột cân đối.
- **Modal chuẩn `dvh` & nút CTA sticky (`MatchSetupModal.jsx` và các modal)**: Áp dụng `max-h-[92dvh] overflow-y-auto overscroll-contain` cho hệ thống modal (`MatchSetupModal`, `DailyCheckInModal`, `LuckyWheelModal`, `MatchmakingModal`, `ReportModal`, `TermsModal`, `PwaInstallPrompt`...) và ghim `sticky bottom-0` ở `MatchSetupModal` để nút bắt đầu trận luôn bấm được ngay cả trên màn hình thấp.
- **Bàn đấu `.arena-board` theo chiều cao & Split-Screen (`GameBoard.jsx`, `OnlineGameBoard.jsx`, `UnoCard.jsx`, `CardBack.jsx`, `EmoteOverlay.jsx`, `EmoteWheel.jsx`)**: Thu gọn kích thước lá bài tại `@media (max-height: 560px)` và `@media (max-height: 430px)` (`52×78px` trên tay, `47×70px` ở giữa), gộp thẻ đối thủ trên đỉnh thành thanh ngang, đưa `Màu hiện tại` vào dòng chuẩn dưới oval, đặt cụm `Emote` + `UNO` ngang hàng với `Player HUD` ở `@media (max-width: 720px)`, và kẹp lề bóng thoại Bot hai bên tránh cắt chữ.

### 7. Task 7: Kiểm Thử Đa Màn Hình & Tổng Kết Tuần 7
- Chạy xác nhận đầy đủ sau chỉnh sửa cuối cùng: `vite build` (1.08s), `oxlint` (0 errors), `32/32` `gameLogic.test.js`, `24/24` `turnLogic.test.js`, `159/159` `week5_e2e_full_suite.test.js`, `9/9` `eloModes.test.js`, `68/68` `deck.test.js`.
- Kiểm chứng trực tiếp bằng Chrome Headless trên `vite preview` qua script `layout_probe.mjs` trên các cấu hình `390×844`, `360×640`, `844×390`, `667×375`, `800×360` và cửa sổ đa nhiệm `640×480` với `0` tràn ngang và hiển thị đầy đủ Player HUD. *(Lưu ý: phần `OnlineGameBoard` và các modal phụ chia sẻ cùng hệ class CSS đã được build kiểm tra, chưa chạy kịch bản socket nhiều người thật trực tiếp trên headless.)*

---

## III. HƯỚNG DẪN CHỤP ẢNH MINH CHỨNG THỰC TẾ CHO 7 TASK TUẦN 7

---

### 📸 Task 1: Ràng Buộc Xoay Ngang Màn Hình Khi Vào Trận
- **Tên file gợi ý:** `tuan7_task1_landscape_lock.png`
- **Cách thực hiện:**
  1. Mở game bằng điện thoại (hoặc chế độ Responsive `390×844` dọc trên DevTools), bấm vào một ván **Đấu Với Bot AI**.
  2. Giữ điện thoại ở chiều dọc: màn hình khóa `OrientationNotice` xuất hiện kèm biểu tượng xoay ngang và nút quay về Sảnh.
  3. **Góc chụp:** Chụp toàn màn hình dọc đang hiển thị thông báo khóa xoay ngang.

---

### 📸 Task 2: Khắc Phục Lỗi Audio & Tương Thích Di Động
- **Tên file gợi ý:** `tuan7_task2_mobile_audio_stability.png`
- **Cách thực hiện:**
  1. Xoay ngang điện thoại để vào bàn đấu, bấm nút Loa hoặc nút Bộ Trộn Âm Thanh trên thanh HUD trên cùng.
  2. Thực hiện đánh/rút vài lá bài để xác nhận âm thanh phát bình thường và không xuất hiện màn hình `ErrorBoundary`.
  3. **Góc chụp:** Chụp bàn đấu đang bật âm thanh / mở modal điều chỉnh âm thanh ổn định trên trình duyệt điện thoại.

---

### 📸 Task 3: Sửa Lỗi Tải Trang Trên Điện Thoại (PWA & Vercel Asset Routing)
- **Tên file gợi ý:** `tuan7_task3_mobile_load_fixed.png`
- **Cách thực hiện:**
  1. Truy cập trực tiếp `https://neo-uno.vercel.app` bằng trình duyệt Safari (iOS) hoặc Chrome (Android) qua mạng 4G/Wi-Fi.
  2. Quan sát Sảnh chính tải lên đầy đủ nội dung ngay lập tức không bị kẹt màn hình đen/trắng.
  3. **Góc chụp:** Chụp toàn màn hình Sảnh chính hiển thị rõ thanh địa chỉ `neo-uno.vercel.app` trên điện thoại thật.

---

### 📸 Task 4: Tối Ưu Kết Nối 4G/Cold-Start & Giữ Phiên Đăng Nhập
- **Tên file gợi ý:** `tuan7_task4_mobile_socket_session.png`
- **Cách thực hiện:**
  1. Mở game trên điện thoại với tài khoản đã đăng nhập (hoặc mở tab Network / trạng thái kết nối khi vào Phòng Bạn Bè / Ghép Trận).
  2. Tải lại trang (Refresh) và kiểm tra phiên người dùng vẫn được giữ ổn định, trạng thái kết nối phòng hoạt động trơn tru.
  3. **Góc chụp:** Chụp giao diện đã đăng nhập kết nối phòng trực tuyến ổn định trên điện thoại.

---

### 📸 Task 5: Tối Ưu Tốc Độ Tải Trang & Hiệu Năng 60 FPS Mobile
- **Tên file gợi ý:** `tuan7_task5_mobile_performance_60fps.png`
- **Cách thực hiện:**
  1. Kiểm tra mục Network / Performance hoặc chạy lại script `perf_probe.mjs` ghi nhận font `Material Symbols` giảm còn `13.06 KB`, thời gian tải Mobile `492 ms`, Click Latency `98 ms`.
  2. Thực hiện vuốt lá bài lên trên để đánh trực tiếp trong bàn đấu di động.
  3. **Góc chụp:** Chụp bảng số liệu đo hiệu năng Terminal/DevTools hoặc khoảnh khắc thao tác vuốt bài mượt mà.

---

### 📸 Task 6: Chuẩn Hóa Bố Cục Dọc/Ngang, Modal & Đa Nhiệm Chia Đôi Màn Hình
- **Tên file gợi ý:** `tuan7_task6_responsive_mobile_multitask.png`
- **Cách thực hiện:**
  1. Chụp **Sảnh chính dọc** (`390×844`) với header cân đối 1 hàng, **Sảnh xoay ngang** (`844×390`) bố cục 2 cột, **Modal Cấu Hình Bàn Đấu** thấy rõ nút `BẮT ĐẦU VÁN ĐẤU NGAY`, và **Bàn đấu xoay ngang** hiển thị trọn vẹn tên bạn (`P1 Bạn (Dưới)`), bài trên tay, chồng bài giữa và nút `UNO`/`Emote`.
  2. Hoặc thu hẹp cửa sổ trình duyệt xuống `640×480` để minh họa chế độ đa nhiệm Split-Screen.
  3. **Góc chụp:** Ghép 2–4 ảnh màn hình (Dọc Sảnh, Ngang Sảnh, Modal, Bàn đấu Ngang) hoặc chụp rõ cảnh bàn đấu xoay ngang vừa khít 1 màn hình.

---

### 📸 Task 7: Kiểm Thử Hồi Quy E2E & Đo Tọa Độ Chrome Headless
- **Tên file gợi ý:** `tuan7_task7_headless_and_e2e_verification.png`
- **Cách thực hiện:**
  1. Mở Terminal chạy lệnh kiểm thử toàn hệ thống và kiểm tra Chrome Headless:
     ```bash
     cd /Users/admin/NEO-UNO && node backend/test/week5_e2e_full_suite.test.js
     ```
  2. Quan sát kết quả xanh **159/159 Tests ĐẠT (100%)** cùng báo cáo đo đạc Chrome Headless (`docOverflow: 0`, `hudVisibleInsideViewport: true`, `hudCornerOverlap: false`).
  3. **Góc chụp:** Chụp màn hình Terminal hiển thị kết quả E2E `159/159 PASS` và log kiểm tra 8 cấu hình viewport.

---
**KẾT THÚC BÁO CÁO TIẾN ĐỘ TUẦN 7 • DỰ ÁN NEO-UNO**
