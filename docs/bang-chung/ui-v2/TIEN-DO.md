# NHẬT KÝ TIẾN ĐỘ GIAO DIỆN V2 (H0 - H8)

| Thời gian (GMT+7) | Mã NV | Trạng thái | Mã commit | Ghi chú ngắn |
|---|---|---|---|---|
| 2026-10-22 11:14:00 | H0 | XONG | 4d0a165 | Chuyển sang nhánh ui-v2, lưu LENH-UI-V2.md, cong-kiem-tra H0 đạt |
| 2026-10-22 11:36:00 | H1 | XONG | 23343fd | Sửa lỗi API AI tắt trả 503 ai_tat, hook useTrangThaiAI, cong-kiem-tra H1 đạt |
| 2026-10-22 12:12:00 | H2 | XONG | 26d2267 | Vỏ khu lập kế hoạch, gỡ bỏ trang trí và chuỗi cấm, cong-kiem-tra H2 đạt |
| 2026-10-22 12:35:00 | H3 | XONG | 6419393 | Danh sách chọn điểm đi/đến, nâng số ngày lên 7, component ChonDiem, cong-kiem-tra H3 đạt |
| 2026-10-22 12:46:00 | H4 | XONG | ac068e7 | Trang chủ: SiteHeader, HeroSearch, ThuDiemDen 3 cột, KhachSanThamKhao 4 thẻ, dải OpenStreetMap, SiteFooter 3 cột, cong-kiem-tra H4 đạt |
| 2026-10-22 12:51:00 | H5 | XONG | d157057 | Trang điểm đến: /diem-den (lưới) và /diem-den/[slug] (SSG 5 điểm đến), 12 vui chơi, 6 quán ăn, 6 cafe, 6 khách sạn, sitemap, cong-kiem-tra H5 đạt |
| 2026-10-22 12:58:00 | H6 | XONG | f22e8e9 | Trang khách sạn: /khach-san, ChonDiem chọn điểm đến, lưới khách sạn, lọc số sao, xếp theo giá, Google Maps, OpenStreetMap, cong-kiem-tra H6 đạt |
| 2026-10-22 13:10:00 | H7 | XONG | d806d08 | Nhật ký chuyến đi: màn trống "Chưa có chuyến nào" kèm nút "Lập kế hoạch", 3 tab Hành trình / Chi tiêu / Ngân sách, cong-kiem-tra H7 đạt |
| 2026-10-22 13:18:00 | H8 | XONG | 4ea6ef4 | Nghiệm thu tổng thể: kiểm tra UI, kiểm tra luồng, chụp 10 ảnh tại 1440 & 390 (hash khác nhau), cong-kiem-tra H8 đạt |

## Ghi chú công việc H8 (Nghiệm thu tổng thể)
1. **Kiểm tra UI và Chuỗi cấm (`scripts/kiem-tra-ui.ts`)**:
   - `http://localhost:3012/` và `http://localhost:3012/lap-ke-hoach` hoàn toàn sạch 8 chuỗi cấm.
2. **Kiểm tra Luồng API (`scripts/kiem-tra-luong.ts`)**:
   - GET `/api/health` trả 200.
   - POST `/api/destination/prepare` và GET `/api/destination/status` trả 200.
   - POST `/api/parse-request` trả 503 (`ai_tat`), UI không gọi khi AI tắt.
   - POST `/api/plan` trả 200 (`phuongThucLap: "quy_tac"`).
   - GET `/api/destination?q=Hà Nội` trả 200 geocode.
   - Kết quả thô lưu tại `docs/bang-chung/ui-v2/H8/luong/`.
3. **Kiểm tra các tuyến bổ sung (`scripts/kiem-tra-h8-extra.ts`)**:
   - GET `/diem-den`: 200 OK.
   - GET `/diem-den/da-nang`: 200 OK.
   - GET `/khach-san`: 200 OK.
   - GET `/api/diem-chon`: 200 OK, gồm 8 điểm đi và 5 điểm đến. Toàn bộ 5 điểm đến (Đà Nẵng, Hà Nội, Đà Lạt, Bangkok, Seoul) đều có snapshot hợp lệ và vượt qua audit.
4. **Bằng chứng chụp ảnh giao diện 1440px và 390px**:
   - Toàn bộ 10 ảnh chụp được lưu tại `docs/bang-chung/ui-v2/H8/`:
     * `desktop_home_1440.png` (SHA256: 8CBA49758021AC650914FDC86044F01ADFAE17526D7144D0A8FBFF5E4C47AAD3)
     * `desktop_diem_den_1440.png` (SHA256: 6A1D1030B3AE748A52098EEE0B2CC05FEB973000B824FCD83074DA1605D3DFD7)
     * `desktop_diem_den_da_nang_1440.png` (SHA256: CD34ADCD96719DAB4A8FBA1B6FB0FE1A2AEC73717A6DB357B4A23127B81D2632)
     * `desktop_khach_san_1440.png` (SHA256: 1608041A22D609ECEB62002228593A31BF28BCC680C5BCFECE2FDA48D349E42B)
     * `desktop_lap_ke_hoach_1440.png` (SHA256: 0564829FFF3DEBB22A1F8469EDDFD98A08274F4E47A98D1CDD75C2C6F4B2F52A)
     * `mobile_home_390.png` (SHA256: 618A72118CFEF2BE4006D5FABB9FCC82A9E68A823868DC3E47012979AA443A15)
     * `mobile_diem_den_390.png` (SHA256: 612A4A1AF82381A09F95B284E005245216AF96CF5B12CE09E3F3E2B6C03B4006)
     * `mobile_diem_den_da_nang_390.png` (SHA256: A0FCE9AD3FD8D8F039B921C4EB1546CB32DBF8388D5008678D7D5282830623B1)
     * `mobile_khach_san_390.png` (SHA256: 881726E42ADB72AF8918E04C7C10CAA20373C23AC041FC4F54CAD228F082F4E1)
     * `mobile_lap_ke_hoach_390.png` (SHA256: 264FBA148503F9810F7C0FB47C2CD03CA2753D3FCD18B1B69D2C9BD99A5E9A2D)
   - Tất cả 10 mã băm SHA256 đều khác nhau hoàn toàn.
5. **Cổng kiểm tra `cong-kiem-tra.ps1 -MaNV H8`**:
   - vitest: DAT (exit 0, 58 test files, 377 passed)
   - typecheck: DAT (exit 0)
   - build: DAT (exit 0)
   - check-colors: DAT (exit 0)
   - check-contrast: DAT (exit 0)
   - check-emoji: DAT (exit 0)
   - check-env: DAT (exit 0)
   - TONG: DAT


## Ghi chú công việc H7 (Nhật ký chuyến đi)
1. **Component `NhatKyTabBar` (`src/ui/components/NhatKyTabBar.tsx`)**:
   - Thanh điều hướng gồm 3 tab: "Hành trình" (B8), "Chi tiêu" (B10; khi AI tắt chỉ hiển thị "Nhập tay"), "Ngân sách" (B11).
   - Thiết kế sử dụng hoàn toàn CSS variables/tokens (`var(--color-surface)`, `var(--color-primary-main)`, v.v.), icon SVG từ `lucide-react`.
2. **Trạng thái chưa xác nhận kế hoạch (`!confirmed`)**:
   - Màn hình trống "Chưa có chuyến nào" với icon `BookOpen` và nút "Lập kế hoạch" (chuyển về `b1-chon-nhanh`) được hiển thị nhất quán trên cả `B8ChuyenDiScreen` và `B11NganSachScreen`.
   - `SideNav`: mục "Nhật ký chuyến đi" mở và bấm được bất kỳ lúc nào để xem màn trống hoặc chuyển vào hành trình.
3. **Trạng thái đã xác nhận kế hoạch (`confirmed`)**:
   - Hiển thị thanh `NhatKyTabBar` ở đầu màn hình cho phép người dùng chuyển đổi linh hoạt giữa Hành trình (`b8-chuyen-di`), Chi tiêu (`b10-chon-nguon`), và Ngân sách (`b11-ngan-sach`).
   - Giữ nguyên toàn bộ logic tính toán, sổ chi tiêu (ledger), so sánh thực tế và dữ liệu kế hoạch.

1. **Tuyến đường `/khach-san` (`KhachSanScreen.tsx`, `/app/(site)/khach-san/page.tsx`)**:
   - Chọn điểm đến bằng component `ChonDiem` (mặc định điểm đến đầu tiên, đồng bộ với query URL `?diem-den=<slug>`).
   - Lưới khách sạn từ snapshot: tên khách sạn, số sao (nếu có; không bịa đánh giá), khu vực.
   - Giá mỗi đêm tính bằng hàm chuẩn của core `getHotelPricePerNight` kèm nhãn "(ước tính)".
   - Nút "Xem trên Google Maps" mở liên kết ngoài an toàn.
   - Nhãn nguồn minh bạch: "Nguồn: OpenStreetMap contributors".
   - Khung ảnh tỉ lệ cố định 16:10 với nền thay thế gradient token và icon `Building2`.
   - Bộ lọc số sao dạng dropdown (Tất cả, 5 sao, 4 sao, 3 sao, Chưa xếp hạng).
   - Bộ sắp xếp giá dạng dropdown (Mặc định, Giá tăng dần, Giá giảm dần).
2. **Cấu hình Next.js (`next.config.ts`)**:
   - Bổ sung `/khach-san` vào `outputFileTracingIncludes`.

## Ghi chú công việc H5 (Trang điểm đến)
1. **Tuyến đường `/diem-den` (`DiemDenDanhSachScreen.tsx`, `/app/(site)/diem-den/page.tsx`)**:
   - Hiển thị danh sách 5 điểm đến chính thức dưới dạng thẻ lớn với khung ảnh tỉ lệ 16:10, icon và nút dẫn sang trang chi tiết.
2. **Tuyến đường `/diem-den/[slug]` (`DiemDenChiTietScreen.tsx`, `/app/(site)/diem-den/[slug]/page.tsx`)**:
   - `generateStaticParams` từ snapshot hỗ trợ đúng 5 slug: `da-nang`, `ha-noi`, `da-lat`, `bangkok`, `seoul`.
   - Tiêu đề, quốc gia và mô tả biên tập lấy từ `src/data/site/mo-ta-diem-den.json`.
   - Nút nổi bật "Lập kế hoạch đi X" mở `/lap-ke-hoach?den=...`.
   - Khối "Địa điểm vui chơi": tối đa 12 địa điểm từ snapshot, nút "Xem trên Google Maps", nhãn loại, tuyệt đối không sao đánh giá.
   - Khối "Ẩm thực": 6 quán ăn và 6 quán cà phê có liên kết Google Maps.
   - Khối "Khách sạn": 6 thẻ khách sạn kèm giá ước tính (tính bằng `getHotelPricePerNight`), liên kết `/khach-san?diem-den=<slug>`.
   - Mỗi thẻ có khung ảnh tỉ lệ cố định 16:10 với nền thay thế gradient token và icon SVG tương ứng.
3. **Sitemap (`src/app/sitemap.ts`)**:
   - Đã tạo sitemap.ts bổ sung các route: `/`, `/diem-den`, `/diem-den/[slug]` (5 slug), `/khach-san`, `/lap-ke-hoach`.

## Ghi chú công việc H4 (Trang chủ)
1. **Thanh trên (`SiteHeader.tsx`)**:
   - Logo "Trip Vibes" (gỡ bỏ phụ đề).
   - Menu liên kết: "Trang chủ" (`/`), "Điểm đến" (`/diem-den`), "Khách sạn" (`/khach-san`).
   - Nút "Lập kế hoạch" (`/lap-ke-hoach`).
   - Gỡ bỏ hoàn toàn nút "Đăng nhập" và huy hiệu "Sắp có".
2. **Hero Section (`HomePageView.tsx`)**:
   - Tiêu đề trung tính: "Lên kế hoạch du lịch theo ngân sách của bạn" (cỡ clamp 36px-52px, font-weight 800).
   - Một dòng phụ: "Tự do lựa chọn điểm đến, tối ưu chi phí di chuyển, lưu trú và điểm tham quan bám sát ngân sách thực tế."
   - Nền gradient token; form `HeroSearch` dùng `ChonDiem`, dropdown số ngày 2-7, số người, ngân sách, nút "Lập kế hoạch".
3. **Khối Điểm đến (`ThuDiemDen.tsx`)**:
   - Thẻ lớn cho 5 điểm đến từ snapshot (Đà Nẵng, Hà Nội, Đà Lạt, Bangkok, Seoul).
   - Khung ảnh tỉ lệ cố định 16:10, nền gradient token và icon `MapPin`.
   - Nút "Xem điểm đến" dẫn `/diem-den/<slug>`.
   - Lưới 3 cột trên máy tính (hàng cuối canh giữa nhờ flex wrap + justify-content center), 1 cột trên điện thoại.
   - Biên tập mô tả điểm đến lưu tại `src/data/site/mo-ta-diem-den.json`.
4. **Khối Khách sạn tham khảo (`KhachSanThamKhao.tsx`)**:
   - 4 thẻ khách sạn lấy từ 4 snapshot khác nhau (Đà Nẵng, Hà Nội, Đà Lạt, Bangkok).
   - Khung ảnh tỉ lệ cố định 16:10, tên khách sạn, địa bàn, số sao (nếu có), giá mỗi đêm tính bằng hàm `getHotelPricePerNight` của core kèm nhãn "ước tính".
   - Nút dẫn sang `/khach-san`.
5. **Dải minh bạch một dòng**:
   - Thay thế toàn bộ "Tính năng nổi bật", khối "Cam kết minh bạch" dài và FAQ bằng dải 1 dòng: "Dữ liệu: OpenStreetMap contributors. Giá là ước tính." cùng nút mở modal "Giới hạn dữ liệu".
6. **Chân trang (`SiteFooter.tsx`)**:
   - Gọn 3 cột: Điểm đến, Khách sạn, Thông tin.
   - Cỡ chữ cơ bản 16px, container tối đa 1200px, khoảng cách theo token.
7. **Bằng chứng chụp giao diện**:
   - Đã chụp giao diện máy tính (1440px) và điện thoại (390px) lưu tại `docs/bang-chung/ui-v2/H4/desktop_homepage_1440.png` và `docs/bang-chung/ui-v2/H4/mobile_homepage_390.png`.

## Khai báo thay đổi Loại A (H3)
1. `src/contracts/index.ts`: Tăng `schemaVersion` từ 12 lên 13 do bổ sung giá trị `"danh_sach_co_dinh"` vào trường `nguon` của `DiemDenSchema` và nâng giới hạn `soNgay` tối đa từ 5 lên 7.
2. Các bài test kiểm tra giới hạn số ngày tối đa (cũ là 5, mới là 7) được cập nhật kỳ vọng (loại A):
   - `src/core/formB1.test.ts`: kiểm tra `soNgay 7` hợp lệ; `soNgay 8` và `soNgay 1` không hợp lệ (`so_ngay_ngoai_pham_vi`).
   - `src/core/normalizeRequest.test.ts`: cập nhật dải 2-7 ngày giữ nguyên, 1 và 8 trả cảnh báo `ngoai_pham_vi_so_ngay`.
   - `src/ui/lib/chuyenB1.test.ts`: cập nhật kiểm tra ngoài dải 2-7 ngày trả lỗi `so_ngay`.
3. Bổ sung các test đáp án người dùng:
   - `soOKhaDung(7, 475, 1080) = 12` và `soOKhaDung(6, 475, 1080) = 10`.
   - `soDemOKhachSan(7, 565) = 6`.
   - `buildPlan 7 ngày` (snapshot Đà Nẵng, 2 người, ngân sách đủ lớn) cho Chỗ ở 6 đêm, mọi mục có ngay trong 1..7.
   - `GET /api/diem-chon` trả đúng 8 điểm đi (TP.HCM, Hà Nội, Đà Nẵng, Hải Phòng, Cần Thơ, Huế, Nha Trang, Đà Lạt) và các điểm đến từ snapshot hợp lệ.
1. `src/app/layout.tsx`:
   - "Trip Vibes – AI Agent Lập Kế Hoạch Du Lịch Thông Minh" -> "Trip Vibes – Lập Kế Hoạch Du Lịch Theo Ngân Sách"
   - "Ứng dụng AI Agent lập kế hoạch du lịch tự động, tối ưu chi phí và bám sát ngân sách thực tế. Tra cứu giá vé, khách sạn, lịch trình chi tiết và quét hóa đơn thông minh." -> "Ứng dụng lập kế hoạch du lịch tự động, tối ưu chi phí và bám sát ngân sách thực tế. Tra cứu giá vé, khách sạn, lịch trình chi tiết và bóc tách hóa đơn tiện lợi."
   - "AI travel agent" -> "lập kế hoạch du lịch"
   - Twitter title: "Trip Vibes – AI Agent Lập Kế Hoạch Du Lịch" -> "Trip Vibes – Lập Kế Hoạch Du Lịch"
   - Twitter description: "Lập kế hoạch du lịch tự động và tối ưu ngân sách cùng AI." -> "Lập kế hoạch du lịch tự động và tối ưu ngân sách."
2. `src/app/manifest.ts`:
   - "Trip Vibes - AI Agent Lập Kế Hoạch Du Lịch" -> "Trip Vibes - Lập Kế Hoạch Du Lịch"
   - "Lập kế hoạch du lịch thông minh, tối ưu ngân sách cùng AI Agent" -> "Lập kế hoạch du lịch theo ngân sách của bạn"
3. `src/ui/components/TopBar.tsx`:
   - Xóa form tìm kiếm chứa placeholder "Bạn muốn đi đâu hôm nay?"
   - Xóa chuông thông báo (Bell, Dot) và avatar (Me)
4. `src/ui/components/SideNav.tsx`:
   - Menu rút gọn còn đúng 2 mục: "Lên kế hoạch" và "Nhật ký chuyến đi" (kèm chú thích khóa "Nhật ký chuyến đi mở sau khi xác nhận kế hoạch.")
   - Xóa "Cài đặt" và "Ngân sách"; xóa popup SettingsModal
   - Xóa Promo ("Mỗi chuyến đi là một câu chuyện đẹp!"), Plant, UserBlock ("Bunny / Khám phá thế giới")
   - Logo bọc Link dẫn về "/"
5. `src/ui/screens/B1ChonNhanhScreen.tsx`:
   - Dải tiêu đề thay bằng `HeroGradientBanner` cao 120px nền gradient (primary #2B55D6 sang sky #1D6FA5), chữ trắng
   - Xóa tranh phong cảnh bờ biển/núi non SVG, mặt trời HeroSun, chữ viết tay "Good trip Good mood"
   - Xóa cột phải HomeRight (chữ viết tay "Đi để thấy thế giới rộng lớn...", cọc gỗ "Travel", "Explore", "Love", hoa, gradient mờ Fade)
   - Thanh dưới: 1 dòng tóm tắt thông tin đã chọn, nút "Lập kế hoạch" bên phải, lý do bị tắt hiển thị dưới nút (không lặp "Chưa chọn...")
6. `src/ui/components/site/SiteHeader.tsx`:
   - Phụ đề logo: "AI TRAVEL AGENT" -> "TRIP PLANNER"
   - Xóa icon Sparkles ở nút "Lập kế hoạch"
7. `src/ui/components/site/HeroSearch.tsx`:
   - Nút: "Tạo kế hoạch du lịch thông minh" -> "Lập kế hoạch" (kèm icon Send, xóa Sparkles)
8. `src/ui/screens/HomePageView.tsx`:
   - Huy hiệu Hero: "AI Agent Lập Kế Hoạch Du Lịch Thông Minh" -> "Lập Kế Hoạch Du Lịch Theo Ngân Sách" (xóa Sparkles, thêm Compass)
   - Nhãn danh mục: "Tính năng nổi bật" -> "Khám phá tính năng"
   - FAQ câu 4: "Hệ thống hoạt động thế nào khi AI gặp lỗi hoặc hết hạn mức?" -> "Hệ thống hoạt động thế nào khi dịch vụ gặp sự cố hoặc quá tải?"
   - Khối cam kết: "Trip Vibes là ứng dụng hỗ trợ lập kế hoạch thông minh..." -> "Trip Vibes là ứng dụng hỗ trợ lập kế hoạch du lịch..."
9. `src/ui/components/site/SiteFooter.tsx`:
   - "AI Agent lập kế hoạch du lịch thông minh..." -> "Nền tảng lập kế hoạch du lịch theo ngân sách thực tế..."
   - "Dự án ứng dụng AI Agent du lịch..." -> "Dự án lập kế hoạch du lịch..."
10. `src/ui/screens/WelcomeScreen.tsx`:
   - "Chụp bill, AI đọc giúp — bạn kiểm tra và xác nhận" -> "Bóc tách hóa đơn tự động — bạn kiểm tra và xác nhận"
   - "...và theo dõi chi tiêu thực tế thông minh." -> "...và theo dõi chi tiêu thực tế."
   - "Bản mô phỏng AI Agent · Nguồn dữ liệu minh bạch..." -> "Phiên bản thử nghiệm · Nguồn dữ liệu minh bạch..."
11. `src/ui/screens/B4PhuongTienScreen.tsx`:
   - "Xem và so sánh các phương án di chuyển thực tế. Không gọi lại AI, core tính toán tức thì." -> "Xem và so sánh các phương án di chuyển thực tế. Tính toán tức thì theo dữ liệu sẵn có."
12. `src/ui/screens/B3KeHoachScreen.tsx`:
   - "AI đã hết hạn mức lượt gọi" -> "hệ thống đã hết hạn mức lượt xử lý"
   - "thời gian xử lý của AI vượt quá giới hạn" -> "thời gian xử lý vượt quá giới hạn"
   - "lỗi kết nối mạng tới dịch vụ AI" -> "lỗi kết nối mạng tới dịch vụ phân tích"
   - "Hết lượt gợi ý bằng AI lúc này..." -> "Đã đạt giới hạn gợi ý lúc này..."
   - "Vui lòng chọn thông tin chuyến đi để AI đề xuất..." -> "Vui lòng chọn thông tin chuyến đi để xem lịch trình đề xuất..."
   - "Thử lại bằng AI" -> "Thử lại"
   - "Chọn điều bạn thích, AI sẽ gợi ý lại..." -> "Chọn điều bạn thích, hệ thống sẽ gợi ý lại..."
   - Thay Sparkles bằng SlidersHorizontal, RefreshCw, Send
13. `src/ui/screens/B2AgentScreen.tsx`:
   - Thay Sparkles bằng Compass
   - "Gemini AI đang tối ưu lịch trình..." -> "Đang tối ưu lịch trình phù hợp ngân sách và sở thích của bạn."
   - "AI hiểu bạn muốn gì" -> "Mong muốn chuyến đi của bạn"
14. `src/ui/screens/B5KhachSanScreen.tsx` & `B6XemTruocScreen.tsx`:
   - Thay icon Sparkles bằng Ticket và Check
15. `src/ui/messages/loi.ts`, `src/ui/messages/canhBao.ts`, `src/ui/hooks/usePlan.ts`:
   - "Hạn mức AI tạm thời hết" -> "Hạn mức tạm thời hết"
   - "Đã đạt giới hạn lượt dùng AI trong giờ này..." -> "Đã đạt giới hạn lượt dùng trong giờ này..."
   - "AI đã hết lượt gọi..." -> "Hệ thống đã hết lượt xử lý..."

