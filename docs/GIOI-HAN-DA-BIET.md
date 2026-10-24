# Danh mục Các Giới hạn Đã biết (Known Limitations)

Tài liệu này ghi nhận trung thực và minh bạch toàn bộ các giới hạn kỹ thuật và vận hành hiện tại của hệ thống Trip Vibes:

---

### 1. Dữ liệu OpenStreetMap (OSM) có thể bị thiếu thông tin
- Dữ liệu địa điểm (POI) được thu thập từ cộng đồng OpenStreetMap thông qua Nominatim và Overpass API.
- Một số địa điểm du lịch, quán ăn, quán cà phê hoặc khách sạn có thể thiếu thông tin chi tiết như: giờ đóng/mở cửa, xếp hạng số sao chính thức, khoảng giá chi tiết, số điện thoại hoặc mô tả.
- Hệ thống giải quyết bằng các giá trị danh nghĩa an toàn và nhãn `giaLaUocTinh` trong `src/core/assumptions.ts`.

---

### 2. Giá dịch vụ là ước tính tham khảo
- Mọi mức giá hiển thị trong ứng dụng (giá vé máy bay, tàu hỏa, xe khách, phòng khách sạn theo đêm, chi phí bữa ăn và hoạt động tham quan) đều là **giá ước tính tham khảo phục vụ bài toán cân đối ngân sách**.
- Trip Vibes không phải là đại lý lữ hành, không giữ chỗ, không bán vé và không thực hiện bất kỳ giao dịch thanh toán tài chính thật nào.

---

### 3. Hạn mức API của Google Gemini
- Gói API Gemini sử dụng model `gemini-3.5-flash-lite` chịu sự điều tiết hạn mức số lượng yêu cầu mỗi phút (RPM) và mỗi ngày (RPD) từ nhà cung cấp Google AI Studio.
- Trong các đợt chạy đánh giá dồn dập hoặc tải cao, hệ thống có thể gặp lỗi `429 RESOURCE_EXHAUSTED`. Khi đó, Trip Vibes sẽ kích hoạt thuật toán dự phòng quy tắc (`lapKeHoachTuDong`) để đảm bảo không gây gián đoạn trải nghiệm người dùng.

---

### 4. Máy chủ Overpass công cộng hay hết thời gian chờ (Timeout)
- Các máy chủ Overpass công cộng (`overpass-api.de`, `overpass.kumi.systems`, `maps.mail.ru`) thường xuyên chịu tải nặng hoặc bị giới hạn băng thông, dẫn đến thời gian chờ quá 3.5 giây hoặc phản hồi 0 kết quả (đặc biệt đối với truy vấn khách sạn tại các đô thị lớn như Hà Nội, Đà Nẵng, Seoul).
- Hệ thống đã cài đặt cơ chế thử lại (retry với nhiều máy chủ khác nhau), song ở chế độ trực tuyến thuần (`live-only`), hiện tượng thiếu dữ liệu vẫn có thể xảy ra.

---

### 5. Điểm đến Phú Quốc chưa có Snapshot chính thức
- Hiện tại trong thư mục `src/data/snapshots/`, điểm đến Phú Quốc chưa có tệp snapshot lưu trữ đạt chuẩn kiểm toán (do dữ liệu quét mạng Overpass trước đó không đủ số lượng POI tối thiểu theo quy định).
- Người dùng khi chọn Phú Quốc trên môi trường triển khai tĩnh (chế độ snapshot) sẽ nhận được thông báo rõ ràng về việc cần chạy ở chế độ cục bộ để lấy dữ liệu.

---

### 6. Bộ đếm lượt gọi AI nằm trong bộ nhớ tạm (In-Memory Counter)
- Bộ đếm số lượt gọi AI hàng ngày (`GEMINI_DAILY_CAP`) và bộ đếm trong phiên (`PLAN_MAX_AI_CALLS`) được duy trì trong bộ nhớ tiến trình Node.js (`src/ai/planAgent.ts`).
- Trên môi trường serverless phân tán (như Vercel), do các hàm serverless chạy độc lập trên nhiều worker riêng biệt, bộ đếm này chỉ mang tính giới hạn tương đối trên từng tiến trình, không đồng bộ toàn cục.

---

### 7. Thời gian thu thập dữ liệu cho một điểm đến mới
- Khi người dùng nhập một điểm đến hoàn toàn mới chưa từng có trong bộ nhớ đệm (cache) hoặc snapshot:
  - Hệ thống phải thực hiện chuỗi tuần tự: Định vị Nominatim (giãn cách tối thiểu 1.000 ms) + Truy vấn Overpass đa bán kính (3 - 5 giây) + Lấy tỷ giá ngoại tệ + Tìm kiếm phương tiện web.
  - Tổng thời gian phản hồi ở lần khởi tạo đầu tiên có thể mất từ **5 đến 15 giây** trước khi dữ liệu sẵn sàng cho AI lập kế hoạch.

---

### 8. Chi phí ăn uống tính theo ngày, không phụ thuộc giờ đến
- Chi phí ăn uống tính theo ngày, không phụ thuộc giờ đến: khi đến sau nửa đêm, bữa trưa ngày đến vẫn xếp lúc 12:00 dù khách chưa đến.
- Danh sách thành phố có ga tàu (src/data/reference/tuyen-tau.json) đã được đối chiếu theo mạng lưới dsvn.vn (loại bỏ TP Hà Tĩnh do không có ga trực tiếp, ngày 23/10/2026).
- Phương tiện là ước tính theo quãng đường chim bay (tàu và xe khách nhân hệ số đường bộ 1,5); giá và thời gian không phải số liệu của hãng.
- Hạn mức Gemini miễn phí đã quan sát: khoảng 20 lượt gọi mỗi ngày; các bộ eval phải chạy rải nhiều ngày.
- Trên bản triển khai mặc định AI tắt; kế hoạch lập bằng quy tắc (phuongThucLap quy_tac).
- Ảnh minh họa đã có cho 5 điểm đến (Wikimedia Commons, có ghi công, xem `/nguon-anh`); chưa có ảnh cho khách sạn và từng địa điểm nhỏ. Trang `/lich-trinh` (lịch trình mẫu) đã có; trang chủ chưa có khối lịch trình mẫu.


