# Kế hoạch Phát triển Trip Vibes (Roadmap)

Kế hoạch phát triển các phiên bản tiếp theo của hệ thống Trip Vibes, tập trung vào tính ổn định, độ tin cậy và trải nghiệm người dùng thực tế:

---

## Phiên bản 1.1 (v1.1)

- Bổ sung bộ dữ liệu snapshot chính thức cho điểm đến Phú Quốc khi nguồn Overpass công cộng ổn định và đạt chuẩn kiểm toán.
- Mở rộng tập dữ liệu mẫu hóa đơn thực tế (eval:bill) nhằm nâng cao độ chính xác nhận diện hóa đơn phức tạp.
- Tối ưu hóa cơ chế lưu cache cho Nominatim và Overpass để giảm thời gian phản hồi ở chế độ Live.
- Cải thiện hiển thị giao diện và các bảng tổng hợp trên màn hình di động nhỏ (< 375px).
- Bổ sung bộ test hồi quy tự động cho quy trình xác nhận ngân sách B10/B11.

---

## Phiên bản 2.0 (v2.0)

- Hỗ trợ lưu trữ trạng thái người dùng và lịch sử chuyến đi thông qua cơ sở dữ liệu bền vững (PostgreSQL).
- Cho phép nhiều người dùng cùng tham gia lên kế hoạch trong một chuyến đi (cộng tác nhóm).
- Mở rộng phạm vi số ngày chuyến đi lên trên 5 ngày (hỗ trợ lịch trình dài ngày 6 đến 14 ngày).
- Tích hợp liên kết đối tác đặt chỗ trực tiếp (khách sạn, vé máy bay) khi có thỏa thuận API chính thức.
- Bổ sung tính năng xuất lịch trình chuyến đi sang định dạng PDF và chia sẻ liên kết web.

---

## Phiên bản 3.0 (v3.0)

- Áp dụng mô hình AI đa phương thức cá nhân hóa theo thói quen và sở thích du lịch thực tế của từng người dùng.
- Tự động điều chỉnh lịch trình chuyến đi theo thời gian thực dựa trên điều kiện thời tiết và tình hình giao thông tại điểm đến.
- Hệ thống theo dõi chi tiêu đa tiền tệ thông minh với khả năng tự động cập nhật biến động tỷ giá hối đoái liên tục.
- Tích hợp bản đồ tương tác ngoại tuyến (offline map vector) hỗ trợ điều hướng trực tiếp không cần kết nối mạng.
