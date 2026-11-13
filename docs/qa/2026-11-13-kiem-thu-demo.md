# Kiểm thử Trip Vibes trước buổi demo 14/11/2026

Kiểm tra ngày 13/11/2026 trên máy chủ Next.js tại `127.0.0.1:3012`. `/api/health` báo chế độ snapshot, Gemini và dữ liệu trực tiếp đang tắt. `npm test` đạt **568/568 bài trên 85 tệp**. Các lỗi dưới đây được quan sát trên trình duyệt. Báo cáo chỉ đề xuất sửa, mã ứng dụng chưa được chỉnh.

## Lỗi cần xử lý trước buổi demo

| Ưu tiên | Cách tái hiện và nội dung xuất hiện | Cách khắc phục đề xuất |
| --- | --- | --- |
| P0 nếu trình chiếu `/demo` hoặc cần build | Mở `/demo`, sau đó vào màn B1 hoặc B10a. Next.js phủ màn hình bằng `Build Error` và `Module not found: Can't resolve '@/app/wireframes.css'`. Có 28 trang con import tệp này. Trong phiên thử, màn đăng nhập cũng hiện overlay sau khi điều hướng từ một trang demo lỗi. | Khôi phục stylesheet đúng của các màn minh họa và xác minh lại các trang con. Nếu quyết định bỏ các màn cũ, gỡ các route và liên kết tương ứng khỏi bản demo. Dùng `/lap-ke-hoach` để trình bày luồng đã thử. Chưa chạy production build. |
| P1 · Thiếu ngân sách | TP.HCM → Đà Nẵng, 14–16/11/2026, 2 khách, 500.000 đ. B2 báo “Chưa tìm được lịch trình trong ngân sách”, nêu phương án 4.268.600 đ và chỉ có “Quay lại chỉnh lịch trình”. B1 giữ 500.000 đ và thiếu nút điền mức gợi ý. | Trong `B2AgentScreen` dùng `toiThieuVND` để cung cấp “Áp dụng mức tối thiểu & Tạo lại lịch trình”. Trong `B1ChonNhanhScreen` giữ cảnh báo cùng nút điền nhanh khi quay lại. Gắn nhãn ước tính cho số tiền. |
| P1 · Gợi ý sai ngày khi nhập chi | Chốt chuyến → chọn Ngày 2 → “Chi tiêu & hóa đơn”. Màn ghi “Chi tiêu ngày 2” nhưng mọi gợi ý mang nhãn `N1`, trong đó “Khách sạn Bốn Mùa” và “Đèo Hải Vân” xuất hiện lặp. Chọn gợi ý sẽ đổi ngày chi theo mục đó. Console báo thiếu khóa React duy nhất và Next.js hiện `Issue`. | Trong `B10ChonNguonScreen`, lọc các mục theo ngày đang ghi và ưu tiên hoạt động có thể phát sinh chi tiêu. Dùng định danh ổn định, duy nhất cho từng dòng, kể cả các mục cũ thiếu ID hoặc nhiều dòng cùng điểm đến. |
| P1 · Chuyển màn tài khoản | Mở `/lap-ke-hoach?screen=register`, bấm “Đã có tài khoản? Đăng nhập”. Màn vẫn hiện “Đăng ký tài khoản” và URL vẫn là `screen=register`. | Đồng bộ điều hướng tài khoản với tham số `screen`, xử lý nút Back và kiểm lại hai chiều từ liên kết ở đầu và cuối trang. |
| P1 nếu cần trình diễn OCR | Với cấu hình demo hiện tại, tab “Chi tiêu & hóa đơn” và các nút thêm chi chỉ đưa tới nhập tay, thiếu thông báo giải thích vì sao không thấy quét ảnh. | Hiển thị “Quét hóa đơn chưa khả dụng trong phiên này. Bạn vẫn có thể nhập tay.” Nếu cần demo OCR, bật cấu hình Gemini và thử trước với hóa đơn giả, đối chiếu kết quả trước khi xác nhận lưu. |
| P2 · Dữ liệu và nhãn khách sạn | “Đổi khách sạn” ở Đà Nẵng có các mục như `VTV`, `CaPhe Giai Khat 78` và `139nguyễn đucedm` dưới loại “Khách sạn”. 15 thẻ đều hiện 700.000 đ/đêm/phòng và `Độ tin cậy: tham_khao`. | Kiểm lại loại và tên POI từ dữ liệu nguồn. Gắn “Giá ước tính” ngay cạnh số tiền, nêu nguồn/ngày và dùng “Chưa xác minh” khi thiếu dữ liệu tiện nghi. Đổi `tham_khao` thành nhãn tiếng Việt. |
| P2 · Phản hồi khi khóa điểm | “Lịch trình & chỉnh sửa” → “Khóa điểm” tại Đèo Hải Vân. Dòng vẫn ghi “Khóa điểm”, “Hoàn tác” vẫn tắt, còn khối “Xem trước thay đổi” ở cuối trang chỉ ghi “Cập nhật: Đèo Hải Vân”. | Giữ bước xem trước, hiện ngay gần mục vừa thao tác hoặc cuộn đến khối xem trước. Nêu rõ “Khóa Đèo Hải Vân” và phản hồi “Đã khóa” sau khi áp dụng. |

## Kết quả theo nhóm chức năng

- **Trang công khai**. Mở được trang chủ, danh sách điểm đến, chi tiết Đà Nẵng, khách sạn tham khảo, lịch trình mẫu, thông tin dữ liệu, nguồn ảnh, trợ giúp, quyền riêng tư và điều khoản. “Dùng mẫu này” của Đà Nẵng nạp được kế hoạch mẫu. Chưa mở hết chi tiết các tỉnh, thử mọi bộ lọc hoặc đối chiếu mọi ảnh và liên kết ngoài.
- **B1–B3**. Form trống báo “Vui lòng nhập nơi xuất phát”. Ca Đà Nẵng 10 triệu cho 2 khách chạy đến tổng quan bằng snapshot, dự toán **9.599.160 đ** và dự phòng **400.840 đ**, kèm cảnh báo 4 hạng mục chưa xác nhận đủ giá. Ca 500.000 đ dừng tại cảnh báo B2.
- **B4–B7**. Lọc tàu hỏa, chọn phương án, xem trước, áp dụng và hoàn tác về máy bay thành công. Màn đổi khách sạn tải danh sách. Đã mở xem lại, chốt chuyến và nhận “Lịch trình đã chốt”. Chưa hoàn thành một lượt thay khách sạn hoặc thử tất cả thao tác chỉnh lịch.
- **B8–B9**. Mở tiến độ, lọc Ngày 2, mở hộp chỉ đường với lựa chọn bản đồ và sao chép địa chỉ. Chưa mở bản đồ bên ngoài hoặc kiểm thử quyền GPS.
- **B10–B11**. Số tiền trống bị chặn bằng “Vui lòng nhập số tiền hợp lệ lớn hơn 0.” Ghi tay “Cà phê demo” **85.000 đ** thành công và bảng hiển thị đúng Ngày 2, Ăn uống, Nhập tay. Chưa thử quét ảnh thật, sửa/xóa chi hoặc lưu qua lần tải lại.
- **Tài khoản và nhật ký**. Mở được các biểu mẫu đăng ký, đăng nhập và nhật ký khách. “Lưu nhật ký” khi đang là khách dẫn tới đăng nhập. Vitest có ca API tài khoản và chuyến đi. Chưa tạo tài khoản hoặc xác minh toàn bộ vòng đời tài khoản và chuyến lưu trên trình duyệt.
- **Còn cần xác minh**. Gemini thật, Reflection / Repair với dịch vụ thật, OCR và quyền camera, Overpass/Nominatim với điểm đến mới, in/PDF, viewport điện thoại và bản build production.

## Kịch bản demo đã thử

1. Từ trang chủ chọn “Bắt đầu lên kế hoạch”. Nhập **TP.HCM → Đà Nẵng · 14–16/11/2026 · 2 khách · 10 triệu**.
2. Tạo hành trình, giải thích dự toán và phần chưa có giá. Ở mục di chuyển chiều đi, chọn tàu hỏa, xem chênh lệch, áp dụng rồi hoàn tác.
3. Chốt kế hoạch, mở tiến độ và chọn Ngày 2. Mở hộp chỉ đường.
4. Ghi tay **Cà phê demo · 85.000 đ**, sau đó mở “Ngân sách thực tế” để đối chiếu với dự toán. Có thể dùng “Dùng mẫu này” tại trang Lịch trình mẫu để mở nhanh một kế hoạch Đà Nẵng.
