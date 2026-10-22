CHẾ ĐỘ GIAO DIỆN V2. Làm theo AGENTS.md. Lệnh chạy lại được: đọc docs/bang-chung/ui-v2/TIEN-DO.md và BỎ QUA việc đã XONG. Không hỏi lại: điều không rõ thì chọn phương án an toàn nhất và ghi vào TIEN-DO.md. Làm lần lượt H0 đến H8.

LUẬT CỨNG
- Làm trên nhánh ui-v2. CẤM merge vào main, CẤM push main. Sau mỗi việc XONG: push origin ui-v2.
- CẤM: gọi Gemini (LIVE_AI_ENABLED=false mọi lúc), git push --force, git reset --hard, git clean, xóa hay dời tag hoặc nhánh, cài thư viện mới, sửa src/ai, prompt, eval, đáp án test của người dùng, đọc hay in .env*. Ngoại lệ DUY NHẤT: H3 được sửa src/contracts và src/core ĐÚNG phần giới hạn số ngày.
- Chỉ icon SVG, không emoji; màu và font chỉ từ tokens; ui không import ai hay data (trang trong src/app đọc dữ liệu rồi truyền props).
- Mỗi việc tối đa 90 phút. Quá giờ hoặc lỗi sau 2 lần sửa: git stash push -u -m "that-bai-<MÃ>", ghi LỖI, sang việc kế tiếp độc lập. Trước mỗi việc git status sạch.
- Sau mỗi việc: powershell -File scripts/cong-kiem-tra.ps1 -MaNV <MÃ>; chỉ commit khi dòng TONG trong KET-QUA.txt (đường dẫn script in ra) là DAT. Đầu ra thô ghi bằng [System.IO.File]::WriteAllText với UTF8Encoding($false). Ghi một dòng vào TIEN-DO.md sau mỗi việc (giờ, mã, XONG/LỖI/BỎ QUA, mã commit, lý do).
- Máy chủ thử phải dừng sau khi dùng; xác nhận cổng trống.

H0. git switch main; git pull; git switch -c ui-v2 (nếu đã có thì git switch ui-v2). Chép nguyên văn lệnh này vào docs/LENH-UI-V2.md. cong-kiem-tra H0; commit và push ui-v2.

H1. SỬA LỖI API (ưu tiên cao nhất)
a) TÁI HIỆN trước khi sửa: VERCEL=1 DATA_MODE=snapshot, LIVE_AI_ENABLED không đặt. Viết scripts/kiem-tra-luong.ts mô phỏng chuỗi lệnh UI gọi: GET /api/health; POST /api/destination/prepare rồi GET /api/destination/status cho Hà Nội; POST /api/parse-request với ghi chú "tôi cần tìm villa" (Đà Nẵng đến Hà Nội, 2 người, 2 ngày, 5 triệu); POST /api/plan (diemDi, diemDen là đối tượng có toaDo, đọc schemaVersion từ src/contracts/index.ts); gọi route tìm điểm đến (geocode) cho "Hà Nội". Lưu mã trạng thái và thân thô vào docs/bang-chung/ui-v2/H1/truoc/. git grep -n các nơi UI gọi parse-request, extract-bill, plan/regenerate, destination và nơi hiển thị lỗi; dán đầu ra thô.
b) SỬA:
 1. Mọi route dùng Gemini (parse-request, extract-bill, plan/regenerate, ai-ping): khi LIVE_AI_ENABLED khác "true" hoặc thiếu khóa, trả HTTP 503 JSON {ok:false, maLoi:"ai_tat", thongBao:"Tính năng này đang tắt trên bản hiện tại."}. Thân KHÔNG chứa ".env", "GEMINI", tên biến môi trường hay stack. Chi tiết chỉ console.error phía máy chủ.
 2. Hook useTrangThaiAI đọc /api/health một lần. AI tắt: KHÔNG gọi parse-request (lập kế hoạch thẳng từ giá trị form); ẩn ô ghi chú, tab "Ảnh bill" (còn "Nhập tay"), nút "Hợp gu hơn", khối "AI hiểu bạn muốn gì".
 3. AI bật mà parse-request lỗi (503, timeout, 429): KHÔNG chặn; bỏ qua phân tích ghi chú, giữ ghi chú trong ghiChu, tiếp tục lập kế hoạch, hiện một dòng nhỏ "Chưa đọc được ghi chú; kế hoạch lập theo các lựa chọn của bạn".
 4. src/ui/messages/loi.ts: thông báo người dùng không bao giờ chứa ".env", "GEMINI" hay mã lỗi thô.
c) TEST (đáp án người dùng): handler parse-request, extract-bill, plan/regenerate khi LIVE_AI_ENABLED không đặt cho status 503, body.maLoi "ai_tat", JSON.stringify(body) không chứa ".env" và không chứa "GEMINI_API_KEY". Hàm thuần quyetDinhGoiParse({aiBat, ghiChu}): (false,"x") false; (true,"") false; (true,"   ") false; (true,"tôi cần villa") true. Hàm thuongBaoLoiThanThien: lỗi chứa "GEMINI_API_KEY" và ".env.local" cho chuỗi không chứa "GEMINI" và không chứa ".env".
d) Chạy lại kiem-tra-luong, lưu vào .../H1/sau/. Kỳ vọng: health 200; prepare và status ok; parse-request 503 ai_tat (UI không gọi); plan 200, ok true, phuongThucLap "quy_tac". cong-kiem-tra H1; commit; push ui-v2.

H2. VỎ KHU LẬP KẾ HOẠCH VÀ XÓA TRANG TRÍ
- Xóa ở CẢ trang chủ và /lap-ke-hoach: thanh tìm "Bạn muốn đi đâu hôm nay?", chuông thông báo, avatar, thẻ người dùng "Bunny / Khám phá thế giới", khối "Mỗi chuyến đi là một câu chuyện đẹp!", mọi lớp trang trí (chữ viết tay xanh "Đi để thấy thế giới...", ảnh sân bay, hình khối xanh, thanh đen "Travel", hoa vàng, cây xanh, chữ "Good trip Good mood"). Tìm nguồn: git grep -n -i -E "Good trip|Good mood|Bunny|Đi để thấy|Travel|art-" kèm các lớp CSS position:fixed/absolute trang trí trong globals.css, ThemeProvider.tsx, layout.tsx. Tìm và xóa luôn dải mỏng màu hồng trên cùng trang chủ.
- Dải tiêu đề đen "Bạn muốn đi đâu?": thay bằng thanh tiêu đề nền gradient từ token (primary sang sky), chữ trắng, cao khoảng 120px; thêm cặp "chữ trắng trên gradient" vào check-contrast (đo ở màu sáng nhất của gradient), phải đạt 4,5:1.
- Menu trái CHỈ còn hai mục: "Lên kế hoạch", "Nhật ký chuyến đi" (khóa kèm đúng một dòng chú thích cho tới khi có kế hoạch xác nhận). Xóa "Cài đặt" và "Ngân sách" khỏi menu. Logo dẫn về "/".
- Thanh dưới: một dòng tóm tắt các giá trị đã chọn, nút "Lập kế hoạch" bên phải, lý do bị tắt là một câu ngắn dưới nút (không lặp "Chưa chọn...").
- Gỡ chữ "AI", "thông minh", "Agent", icon lấp lánh ở mọi chuỗi hiển thị, trừ nơi tính năng thật sự dùng AI (đọc ảnh hóa đơn tự động); thay chữ trung tính. In danh sách chuỗi đã đổi vào TIEN-DO.md.
- scripts/kiem-tra-ui.ts: GET "/" và "/lap-ke-hoach"; HTML KHÔNG được chứa (không phân biệt hoa thường): "Bunny", "Cài đặt", "Bạn muốn đi đâu hôm nay", "Good trip", "Đi để thấy thế giới", "Tính năng nổi bật", "AI Agent", "thông minh". Hàm thuần chuoiCam(html) kèm test: "Xin chào Bunny" cho ["Bunny"]; "ok" cho []. Nếu HTML khu lập kế hoạch chỉ hiện sau khi chạy JS thì dùng Browser task của IDE để chụp và ghi nhận.

H3. DANH SÁCH CHỌN VÀ SỐ NGÀY
- GET /api/diem-chon trả {diemDi:[...], diemDen:[...]}. diemDen = các điểm đến có snapshot hợp lệ, đọc từ snapshot (KHÔNG gõ tay tên và tọa độ). diemDi: TP.HCM, Hà Nội, Đà Nẵng, Hải Phòng, Cần Thơ, Huế, Nha Trang, Đà Lạt, tọa độ trong src/data/reference/diem-di.json (ghi chú "tọa độ tham khảo do người dùng cung cấp"): TP.HCM 10.7769,106.7009; Hà Nội 21.0285,105.8542; Đà Nẵng 16.0544,108.2022; Hải Phòng 20.8449,106.6881; Cần Thơ 10.0452,105.7469; Huế 16.4637,107.5909; Nha Trang 12.2388,109.1967; Đà Lạt 11.9404,108.4583. Trường nguon của DiemDen: "danh_sach_co_dinh" (nếu schema là enum thì thêm giá trị, tăng schemaVersion, test kiểm schemaVersion đổi là loại A, khai báo). Thêm route vào outputFileTracingIncludes nếu đọc bằng fs.
- Component ChonDiem (src/ui/components, chỉ nhận props): danh sách thả xuống, có thể gõ để lọc nhưng CHỈ chọn trong danh sách; bàn phím mũi tên, Enter, Esc; aria; mục đã chọn ở ô kia bị vô hiệu. Dùng ở ô tìm của trang chủ và B1. Bỏ nút "Tìm" và các chip gợi ý.
- Số ngày: danh sách thả xuống 2 đến 7 ("3 ngày 2 đêm"). Nâng giới hạn từ 5 lên 7 (git grep -n tìm giới hạn trong contracts, formB1, core, ui; KHÔNG đổi logic nào khác; QUY_TAC_VERSION KHÔNG đổi; test kiểm giới hạn 5 thì đổi, loại A, khai báo).
 TEST (đáp án người dùng): kiemTraFormB1 với soNgay 7 hợp lệ; soNgay 8 và soNgay 1 không hợp lệ; soOKhaDung(7,475,1080) = 12; soOKhaDung(6,475,1080) = 10; soDemOKhachSan(7,565) = 6; buildPlan 7 ngày (snapshot Đà Nẵng, 2 người, ngân sách đủ lớn) cho Chỗ ở 6 đêm, mọi mục có ngay trong 1..7.
- Cổng H3 phải DAT trước khi sang H4.

H4. TRANG CHỦ
- Thanh trên: logo "Trip Vibes" (bỏ dòng "AI TRAVEL AGENT"), liên kết "Trang chủ", "Điểm đến", "Khách sạn", nút "Lập kế hoạch". Bỏ nút "Đăng nhập".
- Hero: nền gradient token (nếu đã có ảnh hero ở src/data/images thì dùng ảnh phủ lớp tối), tiêu đề trung tính "Lên kế hoạch du lịch theo ngân sách của bạn" cỡ 44 đến 56px, một dòng phụ. Thanh tìm: ChonDiem cho Đi từ và Đến, Số ngày (thả xuống), Số người, Ngân sách, nút "Lập kế hoạch". Chuyển giá trị sang B1 bằng taoGoiChuyenB1 đã có. Bỏ nhãn "AI Agent...", icon lấp lánh.
- Khối "Điểm đến": thẻ lớn cho mỗi điểm đến có snapshot (khung ảnh tỉ lệ cố định, chưa có ảnh thì nền gradient kèm icon), tên, quốc gia, một câu mô tả, nút "Xem điểm đến" dẫn /diem-den/<slug>. Lưới 3 cột trên máy tính (hàng cuối canh giữa), 1 cột trên điện thoại.
- Khối "Khách sạn tham khảo": 4 thẻ lấy từ snapshot (khác điểm đến) và liên kết sang /khach-san.
- XÓA: toàn bộ "Tính năng nổi bật", khối "Cam kết minh bạch" dài, FAQ có chữ AI. Thay bằng một dải một dòng: "Dữ liệu: OpenStreetMap contributors. Giá là ước tính." và liên kết "Giới hạn dữ liệu".
- Chân trang gọn 3 cột: Điểm đến, Khách sạn, Thông tin. Tăng cỡ chữ cơ bản trang công khai lên 16px, container tối đa 1200px, khoảng cách theo token.
- Chụp bằng Browser task của IDE ở 1440 và 390; không chụp được thì ghi "chưa chụp".

H5. TRANG ĐIỂM ĐẾN: /diem-den (lưới) và /diem-den/[slug] (generateStaticParams từ snapshot; slug lấy từ tên tệp snapshot: snapshot_da_nang cho "da-nang", snapshot_ha_noi cho "ha-noi", snapshot_da_lat cho "da-lat", bangkok cho "bangkok", seoul cho "seoul"). Mô tả ngắn: chuyển đúng các câu đang có ở trang chủ vào src/data/site/mo-ta-diem-den.json (ghi chú "nội dung biên tập, cần người dùng rà soát"). Nội dung: tiêu đề, mô tả, "Địa điểm vui chơi" (tối đa 12 từ snapshot: tên, nút "Xem trên Google Maps", nhãn loại nếu có; KHÔNG sao đánh giá), "Quán ăn" và "Cà phê" (6 mục mỗi loại), "Khách sạn" (6 thẻ, liên kết /khach-san?diem-den=<slug>), nút "Lập kế hoạch đi X" mở /lap-ke-hoach với điểm đến đã chọn. Mỗi thẻ có khung ảnh với nền thay thế (gradient và icon) để lượt sau gắn ảnh. Thêm các route vào sitemap.

H6. TRANG KHÁCH SẠN: /khach-san: ChonDiem chọn điểm đến (mặc định điểm đến đầu), lưới khách sạn từ snapshot: tên, số sao (nếu có), giá mỗi đêm kèm nhãn "ước tính" (dùng hàm lấy giá khách sạn có sẵn của core, KHÔNG viết lại công thức), khu vực nếu có, "Xem trên Google Maps", nhãn nguồn OpenStreetMap. Lọc theo số sao (thả xuống), sắp xếp theo giá. Khung ảnh có nền thay thế như H5. Không bịa đánh giá.

H7. NHẬT KÝ CHUYẾN ĐI: mục menu "Nhật ký chuyến đi" chưa có kế hoạch xác nhận: màn trống "Chưa có chuyến nào" kèm nút "Lập kế hoạch". Đã xác nhận: ba tab "Hành trình" (B8 hiện có), "Chi tiêu" (B10; AI tắt thì chỉ "Nhập tay"), "Ngân sách" (B11). KHÔNG đổi logic, chỉ đổi điều hướng và tên; các test cũ giữ nguyên.

H8. NGHIỆM THU: build; VERCEL=1 DATA_MODE=snapshot npx next start -p 3012. Chạy scripts/kiem-tra-ui.ts và scripts/kiem-tra-luong.ts; thêm kiểm tra: GET /diem-den, /diem-den/da-nang, /khach-san, /api/diem-chon trả 200, mọi điểm đến trong /api/diem-chon có snapshot hợp lệ. Dùng Browser task chụp "/", "/diem-den", "/diem-den/da-nang", "/khach-san", "/lap-ke-hoach" ở 1440 và 390 vào docs/bang-chung/ui-v2/H8/ (kiểm hash khác nhau; không chụp được thì ghi "chưa chụp", KHÔNG giả). Lưu đầu ra thô. Dừng máy chủ. git push origin ui-v2. KHÔNG merge main.

KẾT THÚC: git switch main (giữ nguyên, không đổi); git status sạch; cổng trống; git stash list. Báo cáo trong tin nhắn tối đa 8 dòng: mỗi việc H0 đến H8 XONG/LỖI/BỎ QUA kèm mã commit; vitest (số tệp, số test); git log -8 --oneline ui-v2. Ghi chi tiết vào TIEN-DO.md.
