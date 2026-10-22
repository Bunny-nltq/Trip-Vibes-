# NHẬT KÝ TIẾN ĐỘ GIAO DIỆN V2 (H0 - H8)

| Thời gian (GMT+7) | Mã NV | Trạng thái | Mã commit | Ghi chú ngắn |
|---|---|---|---|---|
| 2026-10-22 11:14:00 | H0 | XONG | 4d0a165 | Chuyển sang nhánh ui-v2, lưu LENH-UI-V2.md, cong-kiem-tra H0 đạt |
| 2026-10-22 11:36:00 | H1 | XONG | 23343fd | Sửa lỗi API AI tắt trả 503 ai_tat, hook useTrangThaiAI, cong-kiem-tra H1 đạt |
| 2026-10-22 12:12:00 | H2 | XONG | 26d2267 | Vỏ khu lập kế hoạch, gỡ bỏ trang trí và chuỗi cấm, cong-kiem-tra H2 đạt |

## Chi tiết H2: Danh sách chuỗi đã đổi
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

