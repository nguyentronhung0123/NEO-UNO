# KỊCH BẢN QUAY VIDEO DEMO SẢN PHẨM NEO-UNO
## Cyberpunk Real-Time Online Card Game Platform (Phiên bản v1.0.0-final)

---

> **Thời lượng video mục tiêu:** 4 phút 30 giây – 5 phút 00 giây  
> **Định dạng video:** Full HD (1920x1080) @ 60 FPS, Âm thanh Stereo 48kHz  
> **Nền tảng triển khai thực tế:**
> - **Frontend (Vercel):** [https://neo-uno.vercel.app](https://neo-uno.vercel.app)
> - **Backend (Render):** [https://neo-uno-backend.onrender.com](https://neo-uno-backend.onrender.com)
> - **Sơ đồ trực quan:** [https://neo-uno.vercel.app/so_do_truc_quan.html](https://neo-uno.vercel.app/so_do_truc_quan.html)
> - **Slide thuyết trình tương tác:** [https://neo-uno.vercel.app/slide_thuyet_trinh.html](https://neo-uno.vercel.app/slide_thuyet_trinh.html)

---

## MỤC LỤC
1. [Checklist chuẩn bị kỹ thuật trước khi bấm máy](#1-checklist-chuẩn-bị-kỹ-thuật-trước-khi-bấm-máy)
2. [Thiết lập tài khoản & dữ liệu mẫu](#2-thiết-lập-tài-khoản--dữ-liệu-mẫu)
3. [Bảng phân cảnh Storyboard & Lời thoại Voiceover chi tiết](#3-bảng-phân-cảnh-storyboard--lời-thoại-voiceover-chi-tiết)
4. [Kỹ thuật dựng & hậu kỳ (Post-Production Guidelines)](#4-kỹ-thuật-dựng--hậu-kỳ-post-production-guidelines)
5. [Kế hoạch dự phòng sự cố khi quay (Contingency Plan)](#5-kế-hoạch-dự-phòng-sự-cố-khi-quay-contingency-plan)

---

## 1. CHECKLIST CHUẨN BỊ KỸ THUẬT TRƯỚC KHI BẤM MÁY

### 1.1. Cấu hình phần mềm quay màn hình (OBS Studio khuyến nghị)
| Tham số | Giá trị thiết lập tối ưu | Mục đích |
| :--- | :--- | :--- |
| **Base Canvas Resolution** | `1920x1080` | Độ phân giải gốc 16:9 sắc nét tiêu chuẩn YouTube |
| **Output Scaled Resolution** | `1920x1080` (Không nén) | Đảm bảo chữ số và text trên thẻ bài UNO không bị vỡ hạt |
| **FPS (Khung hình/giây)** | `60 FPS` | Các hiệu ứng lật thẻ bài, hạt Neon Canvas mượt mà nhất |
| **Video Encoder** | `Apple VideoToolbox H.264` (macOS) hoặc `NVIDIA NVENC` | Giảm tải CPU, tránh giật lag khi chạy 2 tab trình duyệt |
| **Rate Control & Bitrate** | `CBR 8000 Kbps` | Chất lượng hình ảnh trung thực, màu sắc neon rực rỡ |
| **Audio Sample Rate** | `48 kHz, Stereo` | Tương thích hoàn hảo với Web Audio API synthesizer |

### 1.2. Thiết lập âm thanh & micro
- [x] **Microphone Filter**: Bật bộ lọc `Noise Suppression` (chọn thuật toán RNNoise) và `Limiter` (Threshold -2dB) trong OBS để giọng nói ấm, không có tiếng quạt tản nhiệt hoặc tiếng click chuột côm cốp.
- [x] **Cân bằng âm lượng (Audio Mixer)**:
  - *Giọng nói thuyết minh (Mic)*: Đặt ở mức **-6 dB đến -3 dB** (vùng màu vàng/đỏ nhẹ).
  - *Âm thanh game (Desktop Audio)*: Đặt ở mức **-22 dB đến -18 dB** (vừa đủ nghe tiếng tick-tock, tiếng lật bài và nhạc nền synthwave mà không đè mất lời thoại).
- [x] **Unlock Web Audio**: Sau khi mở trang web, hãy click chuột 1 lần vào trang bất kỳ để kích hoạt AudioContext của trình duyệt.

### 1.3. Chuẩn bị trình duyệt (Chrome / Edge / Brave)
- [x] Đặt độ phân giải hiển thị màn hình ở **100% DPI zoom** (nhấn `Ctrl + 0` hoặc `Cmd + 0`).
- [x] Ẩn thanh Bookmarks Bar (`Cmd + Shift + B` hoặc `Ctrl + Shift + B`) và tiện ích mở rộng (Extensions).
- [x] Chuẩn bị **2 Cửa sổ trình duyệt riêng biệt** để quay phân cảnh 2 người chơi đấu Realtime:
  - *Cửa sổ 1 (Chính - Màn hình trái hoặc toàn màn hình)*: Đăng nhập tài khoản `Player_Alpha` (Đội trưởng).
  - *Cửa sổ 2 (Ẩn danh / Cửa sổ phụ)*: Đăng nhập tài khoản `Player_Beta` (Đồng đội hoặc Đối thủ).

---

## 2. THIẾT LẬP TÀI KHOẢN & DỮ LIỆU MẪU

Để video thể hiện trọn vẹn sự phong phú của sản phẩm mà không mất thời gian nạp tiền hay cày cuốc trong lúc quay:

| Tài khoản | Username mẫu | Vai trò trong Video | Trạng thái chuẩn bị sẵn |
| :--- | :--- | :--- | :--- |
| **Account 1** | `CyberMaster` | Tài khoản chính dẫn dắt video | Rank Master, có 15.000 Coins, sở hữu Avatar Neon Punk, Card Back Holo Dragon, Chủ Guild "One Piece" |
| **Account 2** | `NeonRunner` | Tài khoản phụ phối hợp 2v2 | Rank Kim Cương, cùng Guild hoặc bạn bè sẵn để nhận diện |
| **Account 3 & 4** | *(Tự động)* | AI Bot thông minh hoặc người chơi thật | Hệ thống Auto Matchmaking sẽ tự động điền Bot nếu sau 5 giây không đủ người |

---

## 3. BẢNG PHÂN CẢNH STORYBOARD & LỜI THOẠI VOICEOVER CHI TIẾT

```
+-----------------------------------------------------------------------------------------------+
|                               TIMELINE VIDEO DEMO (TỔNG: 4m45s)                               |
+-------------------+--------------------+--------------------+--------------------+------------+
| 00:00 - 00:40     | 00:40 - 01:25      | 01:25 - 02:05      | 02:05 - 03:35      | 03:35-04:45|
| SCENE 1: Intro    | SCENE 2: Lobby     | SCENE 3: Guild &   | SCENE 4: Real-time | SCENE 5-6: |
| & Tech Stack      | Profile & Shop     | Retention System   | 2v2 Match & UNO    | Tourney &  |
|                   |                    |                    | Shout Victory      | Test Suite |
+-------------------+--------------------+--------------------+--------------------+------------+
```

---

### PHÂN CẢNH 1: MỞ ĐẦU, KIẾN TRÚC & TRIỂN KHAI PRODUCTION (00:00 – 00:40)
* **Thời lượng:** 40 giây  
* **Góc quay:** Toàn màn hình trình duyệt hiển thị trang chủ `https://neo-uno.vercel.app` với giao diện Đăng nhập Cyberpunk phát sáng lung linh.

| Timecode | Hành động trực quan (Screen Action) | Lời thoại thuyết minh mẫu (Voiceover Script) | Ghi chú kỹ thuật |
| :---: | :--- | :--- | :--- |
| **00:00 – 00:15** | Hiển thị màn hình Login/Register. Di chuột lướt nhẹ qua hiệu ứng thẻ bài neon bay bổng và huy hiệu "Server Online" màu xanh neon. | *"Kính chào thầy cô và các bạn! Đây là video trình diễn thực tế sản phẩm **NEO-UNO** — Nền tảng game bài trực tuyến thời gian thực mang phong cách đồ họa Cyberpunk tương lai."* | Nhạc nền synthwave bắt đầu vang lên êm dịu. |
| **00:15 – 00:40** | Bấm mở tab [so_do_truc_quan.html](https://neo-uno.vercel.app/so_do_truc_quan.html), lướt nhanh qua Sơ đồ Kiến trúc Hệ thống đa tầng và Sơ đồ Thực thể ERD 11 Collections. | *"Hệ thống được xây dựng trên nền tảng Full-Stack hiện đại: Frontend React 19 tối ưu với Vite, Backend Node.js 20 kết hợp Socket.io kết nối Full-duplex WebSocket, và cơ sở dữ liệu MongoDB Atlas phân tán. Toàn bộ sản phẩm đã được đóng gói CI/CD và triển khai thực tế trên Vercel và Render với độ trễ phản hồi dưới 40 mili-giây."* | Chuyển tab dứt khoát, zoom nhẹ vào sơ đồ kiến trúc. |

---

### PHÂN CẢNH 2: XÁC THỰC, SẢNH CHÍNH & HỆ THỐNG TÙY BIẾN NHÂN VẬT (00:40 – 01:25)
* **Thời lượng:** 45 giây  
* **Góc quay:** Toàn màn hình tài khoản chính `CyberMaster`.

| Timecode | Hành động trực quan (Screen Action) | Lời thoại thuyết minh mẫu (Voiceover Script) | Ghi chú kỹ thuật |
| :---: | :--- | :--- | :--- |
| **00:40 – 00:55** | Đăng nhập tài khoản `CyberMaster` bằng JWT. Hiển thị màn hình Sảnh chính (Lobby) tràn ngập ánh sáng neon, âm thanh Click phản hồi tức thì. | *"Chúng ta đăng nhập vào game bằng cơ chế bảo mật JWT kết hợp mã hóa BCrypt. Tại Sảnh chính, người chơi lập tức cảm nhận được không khí sôi động với hệ thống âm thanh Web Audio API được tổng hợp động theo thời gian thực mà không cần tải file MP3 nặng nề."* | Thao tác click tự nhiên, không vội vã. |
| **00:55 – 01:10** | Mở trang **Profile Cá nhân** (Career Profile): Show lịch sử đấu, biểu đồ Win Rate, Huy hiệu Rank Master. | *"Hồ sơ cá nhân lưu trữ toàn bộ chỉ số chiến tích, lịch sử các ván bài và bảng ngọc vinh danh. Mọi thông tin đều được đồng bộ thời gian thực từ cơ sở dữ liệu."* | Dừng 2 giây ở biểu đồ tỉ lệ thắng. |
| **01:10 – 01:25** | Mở **Cửa hàng (Shop & Customization)**: Mua hoặc trang bị Mặt sau bài (Card Back) và Khung viền Neon Avatar mới. | *"Trong Cyber Shop, game thủ có thể sử dụng tiền vàng tích lũy để mở khóa các mẫu thẻ bài Hologram độc quyền và hiệu ứng khung đại diện, cá nhân hóa hoàn toàn trải nghiệm thi đấu."* | Click "Trang bị" để thấy UI cập nhật ngay lập tức. |

---

### PHÂN CẢNH 3: BANG HỘI (GUILD) & HỆ THỐNG GIỮ CHÂN RETENTION (01:25 – 02:05)
* **Thời lượng:** 40 giây  
* **Góc quay:** Màn hình chính thao tác các tính năng tương tác xã hội.

| Timecode | Hành động trực quan (Screen Action) | Lời thoại thuyết minh mẫu (Voiceover Script) | Ghi chú kỹ thuật |
| :---: | :--- | :--- | :--- |
| **01:25 – 01:45** | Mở **Guild Modal**: Hiển thị Clan "One Piece" (Tag: `OP`), danh sách thành viên, điểm năng động và quỹ cống hiến. Bấm thử tạo/sửa clan để chứng minh hệ thống cho phép đặt tên tự do, không gò bó ký tự. | *"Hệ thống Bang hội (Guild) cho phép người chơi tự do đặt tên và gắn kết cùng bạn bè. Các thành viên cùng nhau làm nhiệm vụ tuần để nâng cấp cấp độ bang và mở khóa đặc quyền chung."* | Làm nổi bật tính năng tên bang hội tự do vừa cập nhật. |
| **01:45 – 02:05** | Mở **Nhiệm vụ Hằng Ngày (Daily Quests)** & **Vòng Quay May Mắn (Lucky Wheel)**: Nhấn quay thưởng vòng quay neon Canvas, nhận 250 Coins. | *"Để tối ưu chỉ số giữ chân người chơi DAU, NEO-UNO tích hợp chuỗi tính năng Retention toàn diện bao gồm: Điểm danh hằng ngày, Vòng quay may mắn vật lý, và Vé Chiến Đấu Battle Pass 30 cấp độ với phần thưởng phong phú."* | Hiệu ứng kim quay dừng lại kèm âm thanh Ting Ting chiến thắng. |

---

### PHÂN CẢNH 4: ĐỈNH CAO: GHÉP TRẬN 2VS2 & VÁN ĐẤU THỰC CHIẾN REALTIME (02:05 – 03:35)
* **Thời lượng:** 1 phút 30 giây (Phân cảnh cốt lõi quan trọng nhất)  
* **Góc quay:** Chia đôi màn hình (Side-by-side) 2 cửa sổ trình duyệt: Trái là `CyberMaster`, Phải là `NeonRunner`.

| Timecode | Hành động trực quan (Screen Action) | Lời thoại thuyết minh mẫu (Voiceover Script) | Ghi chú kỹ thuật |
| :---: | :--- | :--- | :--- |
| **02:05 – 02:25** | Cả 2 tài khoản cùng nhấn nút **"Ghép Đội 2v2"**. Màn hình hiển thị radar tìm trận Cyberpunk. Sau 2.5 giây, Matchmaking Engine ghép thành công và tự động chuyển cả hai vào Bàn cờ Neon 4 người. | *"Bây giờ, chúng ta bước vào tính năng đột phá nhất: Đấu Đội 2vs2 Thời Gian Thực. Thuật toán ghép trận thông minh tự động kết nối 2 người chơi thành 1 đội để so tài cùng đối thủ, với cơ chế Bot Backfill tự động lấp chỗ trống nếu phòng chưa đủ người."* | Hai màn hình nhảy vào game cùng một tích tắc. |
| **02:25 – 02:50** | Trận đấu diễn ra: `CyberMaster` đánh bài số màu Đỏ $\rightarrow$ Màn hình bên phải cập nhật tức thì lá bài trên bàn. Người kế tiếp đánh lá **Skip**, lượt đi nhảy cóc qua đối thủ. Bắn thử 1 Cyber Emote "GG" hoặc "Fire" nổ tung trên màn hình. | *"Bàn cờ vận hành dựa trên kiến trúc Event-driven WebSocket. Mỗi lượt đi, quyền đánh và sự thay đổi bộ bài được đồng bộ trong vòng chưa đầy 15 mili-giây. Các lá bài chiến thuật như Skip, Reverse, Draw Two và Đổi màu Wild Card được máy chủ kiểm tra hợp lệ nghiêm ngặt để chống gian lận tuyệt đối."* | Bật âm thanh lật bài và tiếng phát nhạc lượt đi. |
| **02:50 – 03:10** | Đồng hồ đếm ngược lượt đi giảm xuống dưới 5 giây: **Âm thanh nhịp tim đập / Tick-tock vang lên dồn dập**. Người chơi nhanh tay đánh quân bài trước khi hết giờ. | *"Khi thời gian còn dưới 5 giây, hệ thống âm thanh nhịp tim cảnh báo lập tức kích hoạt, tạo cảm giác căng thẳng nghẹt thở. Nếu người chơi mất kết nối, cơ chế AFK AI sẽ tự động điều khiển thay thế nhằm bảo vệ tính toàn vẹn của ván đấu."* | Âm thanh tick-tock phát rõ ở thời điểm này. |
| **03:10 – 03:35** | `CyberMaster` còn đúng 1 lá bài trên tay $\rightarrow$ Nút **"UNO SHOUT!"** phát sáng rực rỡ $\rightarrow$ Người chơi bấm nút, âm thanh "UNO!" vang lên $\rightarrow$ Đánh lá bài cuối cùng $\rightarrow$ Màn hình **VICTORY** bùng nổ pháo hoa hạt neon, thông báo Team Đỏ chiến thắng và cộng điểm ELO Rank! | *"Khi còn đúng một lá bài, người chơi phải nhấn nút Hô UNO để tránh bị phạt rút thêm 2 lá. Và với lá bài quyết định này... Đội của chúng ta đã giành CHIẾN THẮNG! Hệ thống tự động tính điểm ELO, trao thưởng tiền vàng và lưu toàn bộ log ván đấu vào hệ cơ sở dữ liệu."* | Điểm nhấn cao trào của video! |

---

### PHÂN CẢNH 5: GIẢI ĐẤU (TOURNAMENT) & CÔNG CỤ XEM LẠI TRẬN ĐẤU (03:35 – 04:15)
* **Thời lượng:** 40 giây  
* **Góc quay:** Toàn màn hình tài khoản chính.

| Timecode | Hành động trực quan (Screen Action) | Lời thoại thuyết minh mẫu (Voiceover Script) | Ghi chú kỹ thuật |
| :---: | :--- | :--- | :--- |
| **03:35 – 03:55** | Mở trang **Giải Đấu (Tournament)**: Show Cây nhánh đấu 8 đội (Bracket Tree) tự động cập nhật kết quả Tứ kết, Bán kết, Chung kết. | *"NEO-UNO trang bị sẵn hệ thống Giải Đấu Tự Động Hóa. Người chơi có thể tham gia các bảng đấu Cúp Neon 8 đội theo thể thức loại trực tiếp, với bảng xếp hạng ELO được cập nhật công khai minh bạch."* | Di chuột qua các nhánh đấu của cây Bracket. |
| **03:55 – 04:15** | Mở **Lịch sử đấu** $\rightarrow$ Chọn ván vừa thắng $\rightarrow$ Bấm nút **"Xem lại trận đấu" (Replay Viewer)**. Tua nhanh qua các lượt đánh bằng thanh trượt thời gian. | *"Đặc biệt, hệ thống Replay Engine lưu vết sự kiện theo mô hình Deterministic Event Sourcing, cho phép trọng tài và người chơi có thể tua lại từng bước đi của bất kỳ ván đấu nào để phân tích chiến thuật và kiểm tra khiếu nại."* | Kéo thanh timeline tua lại 2-3 lượt đi. |

---

### PHÂN CẢNH 6: TỔNG KẾT, TEST SUITE E2E & KẾT THÚC (04:15 – 04:45)
* **Thời lượng:** 30 giây  
* **Góc quay:** Màn hình Terminal chạy Test Suite và màn hình Kết thúc (Outro).

| Timecode | Hành động trực quan (Screen Action) | Lời thoại thuyết minh mẫu (Voiceover Script) | Ghi chú kỹ thuật |
| :---: | :--- | :--- | :--- |
| **04:15 – 04:30** | Chuyển sang cửa sổ Terminal: Gõ lệnh chạy bộ test E2E `backend/test/week5_e2e_full_suite.test.js` $\rightarrow$ Kết quả hiển thị **159/159 tests PASS (100%)**. | *"Chất lượng phần mềm của NEO-UNO được bảo chứng bởi bộ kiểm thử tự động gồm 159 kịch bản End-to-End trải dài qua 7 module lõi, bảo đảm độ sẵn sàng 100% trước khi đưa vào sản xuất."* | Chữ xanh lá cây `PASS` chạy đều và kết thúc bằng 100%. |
| **04:30 – 04:45** | Chuyển về màn hình Slide kết thúc hoặc trang chủ với các đường dẫn GitHub Repo, Vercel Link. | *"Dự án đã hoàn thành trọn vẹn 100% kế hoạch đề ra sau 6 tuần nghiên cứu và phát triển. Xin trân trọng cảm ơn quý thầy cô và các bạn đã theo dõi!"* | Nhạc nền tăng âm lượng dần trong 2 giây cuối rồi fade out. |

---

## 4. KỸ THUẬT DỰNG & HẬU KỲ (POST-PRODUCTION GUIDELINES)

Nếu bạn dựng video bằng các phần mềm như **CapCut**, **Premiere Pro**, hoặc **DaVinci Resolve**, hãy áp dụng các mẹo sau để video đạt điểm số tối đa:

1. **Hiệu ứng Zoom & Pan (Ken Burns Effect)**:
   - Khi giới thiệu các chi tiết nhỏ (ví dụ: Nút hô UNO, bộ đếm ngược $\le 5$s, chỉ số Ping), phóng to nhẹ (Zoom 115% - 120%) trong 2 giây để người xem tập trung ánh nhìn.
2. **Tiêu đề phân đoạn (Lower Thirds / Chapter Titles)**:
   - Chèn thanh banner cyberpunk ở góc dưới bên trái mỗi khi đổi phân cảnh:
     - `00:00 - KIẾN TRÚC & TRIỂN KHAI PRODUCTION`
     - `00:40 - SẢNH CHÍNH & TÙY BIẾN CYBER SHOP`
     - `01:25 - HỆ SINH THÁI BANG HỘI & RETENTION`
     - `02:05 - THỰC CHIẾN REALTIME 2VS2 TEAM BATTLE`
     - `03:35 - GIẢI ĐẤU TOURNAMENT & REPLAY ENGINE`
     - `04:15 - KIỂM THỬ TỰ ĐỘNG E2E 159/159 PASS`
3. **Phụ đề tự động (Auto Captions)**:
   - Bật tính năng Auto Caption trong CapCut để tạo phụ đề chữ vàng/xanh neon chạy theo giọng nói. Điều này giúp hội đồng nghiệm thu dễ dàng theo dõi ngay cả khi xem trong phòng hội thảo ồn ào.
4. **Âm nhạc (Soundtrack)**:
   - Thể loại: *Synthwave / Retrowave / Cyberpunk Instrumental* không lời, nhịp độ 110-120 BPM, tiết tấu năng động, hiện đại.

---

## 5. KẾ HOẠCH DỰ PHÒNG SỰ CỐ KHI QUAY (CONTINGENCY PLAN)

| Tình huống rủi ro | Nguyên nhân tiềm ẩn | Giải pháp khắc phục ngay lập tức |
| :--- | :--- | :--- |
| **Đường truyền mạng chập chờn khi quay trực tiếp** | Render Backend sleep sau thời gian nhàn rỗi (Cold start) hoặc Wifi lag | **Chuyển sang quay môi trường Cục bộ Docker Compose**: Chạy lệnh `docker-compose up` tại máy local, mở `http://localhost:3000`. Tốc độ phản hồi đạt 0ms, không phụ thuộc đường truyền internet. |
| **Không ghép được 4 người chơi thật trong phân cảnh 2v2** | Thiếu thiết bị hoặc không kịp mở 4 tab trình duyệt | **Tận dụng tính năng Bot Backfill thông minh**: Hệ thống đã được lập trình sẵn cơ chế tự động điền AI Bot sau 5 giây nếu không đủ người chơi. 2 người chơi thật kết hợp 2 Bot vẫn thể hiện đầy đủ 100% luật 2v2 và cơ chế phối hợp đồng đội. |
| **Giọng nói bị rè hoặc có tiếng ồn nền** | Mic cắm chưa chặt hoặc phòng có tiếng quạt gió | Sử dụng tính năng "Enhance Voice" (Làm trong giọng) của CapCut Desktop hoặc Adobe Podcast AI Audio Enhancer miễn phí để lọc sạch tạp âm chỉ bằng 1 cú click. |

---

*Tài liệu kịch bản được biên soạn chuẩn xác theo cấu trúc dự án NEO-UNO v1.0.0-final.*
