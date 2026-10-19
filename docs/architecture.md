# Kiến trúc Hệ thống Trip Vibes

## 1. Tổng quan dự án
Trip Vibes là AI Agent lập kế hoạch du lịch thông minh xây dựng trên Next.js (App Router), TypeScript, Tailwind CSS, và Google Gemini API (model `gemini-3.5-flash-lite`).

Phạm vi Bước 9:
- Hỗ trợ **điểm đến bất kỳ** (trong nước và quốc tế), số ngày từ **2 đến 5 ngày**.
- Hệ thống quy đổi ngoại tệ tự động sang VND với nhãn nguồn và ngày cập nhật.
- Định vị địa lý qua OpenStreetMap Nominatim API với hàng đợi tốc độ tối đa 1 yêu cầu/giây.
- Thu thập dữ liệu địa điểm POI động qua Overpass API đa bán kính (8 km cho lưu trú/ẩm thực, 30 km cho tham quan).
- Tìm kiếm phương án di chuyển web (Tavily + Gemini) kết hợp ước lượng quãng đường thuần qua công thức Haversine.

---

## 2. Cấu trúc thư mục & Trách nhiệm (Separation of Concerns)

```
Trip_Vibes/
├── src/
│   ├── contracts/     # Zod schema cho mọi dữ liệu trao đổi (schemaVersion = 7)
│   ├── core/          # Hàm toán học/logic thuần túy (không import UI hoặc AI/Data)
│   ├── data/          # Client gọi API ngoài (Nominatim, Overpass, ExchangeRate, Tavily) & Snapshots
│   ├── ai/            # Gemini client & AI Agent (kèm in-flight deduplication & retry)
│   ├── app/           # Next.js App Router & API Route Handlers
│   ├── design/        # Design system tokens (src/design/tokens.json)
│   └── ui/            # React UI components & Screens (B1 -> B11), Hooks
├── eval/              # Bộ đánh giá tự động (parse-cases, benchmark, diadiem)
└── docs/              # Tài liệu kiến trúc và ảnh chụp màn hình
```

---

## 3. Kiến trúc Luồng Dữ liệu Bước 9

### 3.1. Định vị Địa lý (Geocoding & Disambiguation)
- **Nominatim OpenStreetMap**:
  - Endpoint: `https://nominatim.openstreetmap.org/search` (format `jsonv2`, `addressdetails=1`, `accept-language=vi`).
  - Hàng đợi tuần tự đảm bảo giãn cách tối thiểu 1.000 ms giữa 2 request (tuân thủ OpenStreetMap Usage Policy).
  - Cache file 30 ngày (`.cache/geocode/`).
  - Phân tích ứng viên: Nếu trả về nhiều địa điểm ở các quốc gia khác nhau hoặc loại hành chính khác nhau, hệ thống trả về trạng thái `can_lam_ro` với lý do `diem_den_mo_ho` (tối đa 3 ứng viên) để người dùng tự chọn.

### 3.2. Tỷ giá Ngoại tệ (Exchange Rates)
- **Open.er-api**:
  - Endpoint: `https://open.er-api.com/v6/latest/USD` hoặc `latest/VND`.
  - Không cần khóa API, không tốn phí.
  - Tự động cache theo Unix timestamp của `time_next_update_unix`.
  - Fallback khi lỗi/429 sang cache cũ nhất có sẵn (kèm nhãn ngày) hoặc báo lỗi rõ ràng.
  - Tích hợp nhãn nguồn: *"Rates By Exchange Rate API"* (liên kết `exchangerate-api.com`).

### 3.3. Dữ liệu Địa phương Động (Overpass POI)
- Bán kính xung quanh tọa độ tâm của điểm đến:
  - Khách sạn, ẩm thực, quán cà phê: bán kính 8 km.
  - Điểm tham quan, danh lam: bán kính 30 km.
  - Khu vực lấy từ tag `addr:suburb` hoặc `addr:district`, mặc định "Trung tâm".
  - Timeout 3.5 giây cho mỗi endpoint (fallback sang snapshot an toàn khi Overpass mạng công cộng chậm).

### 3.4. Nghiên cứu Phương tiện & Chi phí
- **Research Transport**:
  - Tìm kiếm web qua Tavily + 1 lượt Gemini trích xuất phương án theo schema `PhuongTienSchema`.
  - Fallback tức thì sang ước lượng quãng đường (`cacLoaiPhuongTienUocLuong`):
    - Máy bay: luôn có (750 km/h + 90 phút cố định, 600.000 + 1.100 đ/km).
    - Xe khách (50 km/h, 1.000 đ/km) và Tàu hỏa (55 km/h, 1.000 đ/km): chỉ khi cả 2 điểm thuộc mã quốc gia `"VN"`.
    - Khoảng cách < 15 km: không đề xuất phương tiện đường dài.
  - Nếu tuyến đường không có phương án nào: trạng thái `khong_co_phuong_an`, giao diện mở form nhập giá vé 2 chiều tay (nhãn `nguoi_dung_nhap`).

### 3.5. Nghiên cứu Chi phí Điểm đến
- **Research Giá Điểm đến**:
  - Tìm kiếm khoảng giá khách sạn (2 đến 5 sao) và giá ăn uống trung bình.
  - Đổi ngoại tệ sang VND theo tỷ giá hiện hành.
  - Cache 168 giờ. Fallback về giả định trong `src/core/assumptions.ts` (`giaLaUocTinh = true`).

---

## 4. Nguyên tắc Bất biến (Core Invariants)
1. **Core là hàm thuần túy**: Toàn bộ phép tính tiền, tính thời gian, Haversine, so sánh thực tế, diff plan đều nằm trong `src/core/` và có unit test độc lập. AI tuyệt đối không tính toán số học.
2. **Tiền tệ chuẩn**: Toàn bộ ngân sách, chi phí trong `TripPlan` được chuẩn hóa thành VND (số nguyên, làm tròn nửa lên qua `quyDoiVND`). Các trường ngoại tệ được lưu kèm trong `giaGoc` để hiển thị minh bạch.
3. **UI không gọi trực tiếp AI hoặc Data**: Chỉ giao tiếp qua HTTP API Handlers (`/api/destination`, `/api/plan`, `/api/options`).
4. **Không phụ thuộc dịch vụ trả phí**: Hoàn toàn dùng các dịch vụ miễn phí hoặc tier miễn phí có kiểm soát chặt chẽ.
