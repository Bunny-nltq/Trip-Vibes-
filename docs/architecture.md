# Kiến trúc Hệ thống Trip Vibes

## 1. Tổng quan Dự án
Trip Vibes là AI Agent lập kế hoạch du lịch thông minh xây dựng trên Next.js (App Router), TypeScript, Tailwind CSS, và Google Gemini API (model `gemini-3.5-flash-lite`).

**Phạm vi hệ thống**:
- Hỗ trợ điểm đến bất kỳ (trong nước và quốc tế), số ngày từ 2 đến 5 ngày.
- Hệ thống quy đổi ngoại tệ tự động sang VND với nhãn nguồn và ngày cập nhật.
- Định vị địa lý qua OpenStreetMap Nominatim API với hàng đợi tốc độ tối đa 1 yêu cầu/giây.
- Thu thập dữ liệu địa điểm POI động qua Overpass API đa bán kính (8 km cho lưu trú/ẩm thực, 30 km cho tham quan) kết hợp cơ chế dự phòng Snapshot tĩnh chính thức.
- Mô hình AI kép: Tự động lập kế hoạch qua Gemini Agent kết hợp thuật toán dự phòng quy tắc thuần túy (`lapKeHoachTuDong`), đảm bảo luôn có kế hoạch hợp lệ ngay cả khi không có kết nối AI hoặc hết hạn mức.

---

## 2. Mô hình 5 Lớp và 5 Quy tắc Bắt buộc

Hệ thống Trip Vibes được tổ chức nghiêm ngặt theo mô hình 5 lớp tách biệt trách nhiệm:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. GIAO DIỆN (UI & Presentation Layer)                      │
│    - src/ui/screens (B1 -> B11, Login, Welcome)             │
│    - src/ui/components (SideNav, TopBar, BudgetBox, Badge)  │
│    - src/app (Next.js Pages, Layouts, CSS tokens)           │
└──────────────────────────────┬──────────────────────────────┘
                               │ (chỉ giao tiếp qua hooks/HTTP)
┌──────────────────────────────▼──────────────────────────────┐
│ 2. GIAO TIẾP API (App/API Route Handlers)                   │
│    - src/app/api (plan, destination, options, health, ...)   │
│    - Kiểm soát rate limit, xác thực request, che giấu khóa  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 3. HỢP ĐỒNG DỮ LIỆU (Contracts Layer)                       │
│    - src/contracts (Zod schemas, schemaVersion = 9)          │
│    - Kiểm thực kiểu dữ liệu vào/ra nghiêm ngặt              │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────┐
│ 4. AI & DATA PROVIDERS                                      │
│    - src/ai (Gemini client, PlanAgent, repair loops)        │
│    - src/data (LiveDataSource, Nominatim, Overpass, Tavily, │
│                ExchangeRate, Snapshots chính thức)          │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 5. LOGIC THUẦN TÚY (Core Pure Domain Logic)                 │
│    - src/core (minBudget, flags, assumptions, tiLeDiChuyen, │
│                haversine, quyDoiTien, lapOTrong, ...)       │
│    - 100% pure functions, độc lập hoàn toàn với UI/AI/Data  │
└─────────────────────────────────────────────────────────────┘
```

### 5 Quy tắc Bắt buộc Cốt lõi (theo AGENTS.md):
1. **Phân lập UI**: `src/ui` không import trực tiếp `src/ai` hoặc `src/data`; chỉ gọi API qua `src/ui/hooks`. Component trong `src/ui/components` chỉ nhận props, không tự gọi API.
2. **Logic Core thuần túy**: `src/core` là hàm thuần, không import `src/ai` hoặc `src/ui`. Mọi phép tính tiền, tính thời gian và cờ cảnh báo đều nằm ở `src/core`. AI tuyệt đối không tính toán số học.
3. **Bảo toàn Hợp đồng Dữ liệu**: Mọi dữ liệu vào ra hệ thống đều đi qua `src/contracts` (Zod). Khi thay đổi cấu trúc dữ liệu, phải tăng `schemaVersion`.
4. **Hệ thống Token Thiết kế**: Màu sắc, cỡ chữ, khoảng cách, bo góc chỉ lấy từ `src/design/tokens.json` (thông qua biến CSS sinh tự động), tuyệt đối không viết cứng mã màu hex hay tên font.
5. **AI có Kiểm soát & Bảo mật**: AI chỉ chọn và hiểu dữ liệu; không để AI cộng tiền hay tự tạo khách sạn, giá, đánh giá ngoài dữ liệu có sẵn. Không gọi Gemini từ trình duyệt, không ghi API key vào code, chỉ dùng biến môi trường. Ảnh hóa đơn (bill) chỉ xử lý trong bộ nhớ, không lưu đĩa, không ghi log.

---

## 3. Luồng Dữ liệu từ Bước B1 đến B11

Quy trình trải nghiệm và luồng dữ liệu của Trip Vibes được phân rã thành 11 bước nhất quán:

1. **B1: Chọn nhanh / Nhập yêu cầu du lịch (`B1ChonNhanhScreen`)**:
   - Người dùng nhập điểm đi, điểm đến, số ngày (2 đến 5 ngày), số người, ngân sách VND, sở thích và điều cần tránh.
   - Dữ liệu được xác thực theo `TripRequestSchema` (schemaVersion 9).

2. **B2: Chuẩn bị dữ liệu (`B2AgentScreen`)**:
   - Gọi `/api/destination/prepare` để định vị địa lý (Nominatim), kiểm tra múi giờ, tỷ giá ngoại tệ.
   - Khởi tạo dữ liệu POI từ `LiveDataSource` (theo chế độ `DATA_MODE`).
   - Tính toán ngân sách tối thiểu (`tinhNganSachToiThieu`). Nếu ngân sách người dùng nhập thấp hơn ngưỡng tối thiểu, hệ thống yêu cầu xác nhận hoặc điều chỉnh.

3. **B3: Kế hoạch tổng quan (`B3KeHoachScreen`)**:
   - Gọi `/api/plan` để kích hoạt `planWithRepair`.
   - AI thực hiện chọn lọc phương tiện, khách sạn, quán ăn, cafe, điểm tham quan và xếp lịch trình theo ngày.
   - Trường hợp không bật AI (`LIVE_AI_ENABLED=false`) hoặc lỗi/vượt hạn mức, thuật toán quy tắc (`lapKeHoachTuDong`) sẽ tự động lập kế hoạch dự phòng với 0 lỗi hard.

4. **B4: Chọn phương tiện (`B4PhuongTienScreen`)**:
   - Hiển thị danh sách phương tiện chiều đi và chiều về (máy bay, tàu hỏa, xe khách) với giờ khởi hành, giờ đến, thời gian di chuyển và giá vé tương ứng.
   - Cho phép người dùng linh hoạt đổi phương tiện theo nhu cầu.

5. **B5: Chọn khách sạn (`B5KhachSanScreen`)**:
   - Hiển thị danh sách khách sạn đạt chuẩn với số sao, địa chỉ, khoảng giá ước tính và số đêm lưu trú tương ứng số ngày chuyến đi.

6. **B6: Xem trước thay đổi & Cảnh báo (`B6XemTruocScreen`)**:
   - Kiểm tra các ràng buộc cứng (hard) và mềm (soft) qua `src/core/flags.ts`.
   - Hiển thị chi tiết các cảnh báo nhẹ (ví dụ: tỷ lệ di chuyển chiếm nhiều thời gian, khởi hành sớm, đến trước giờ nhận phòng).

7. **B7: Xác nhận chuyến đi (`B7XacNhanScreen`)**:
   - Tóm tắt toàn bộ lịch trình, tổng chi phí dự kiến, phân bổ ngân sách và xác nhận chốt kế hoạch.

8. **B8: Bắt đầu chuyến đi (`B8ChuyenDiScreen`)**:
   - Chế độ đồng hành theo thời gian thực: xem lịch trình theo từng ngày, đánh dấu các hoạt động đã hoàn thành.

9. **B9: Chỉ đường & Vị trí (`B9ChiDuongPopover` / `B9to11Screens`)**:
   - Xem khoảng cách địa lý và định tuyến di chuyển giữa các địa điểm bằng công thức Haversine thuần túy.

10. **B10: Quản lý chi tiêu thực tế (`B10ChonNguonScreen` / `B9to11Screens`)**:
    - B10a: Chọn nguồn tải ảnh hóa đơn (camera / tải tệp) hoặc nhập tay.
    - B10b: OCR nhận diện thông tin hóa đơn qua Gemini Vision, trích xuất cấu trúc JSON (`laChungTu`, `loaiChungTu`, `tongTienVND`, `dongChiTiet`).
    - B10c: Bắt buộc người dùng kiểm tra và bấm xác nhận số tiền trước khi ghi nhận.

11. **B11: Sổ chi tiêu & Ngân sách thực tế (`B11NganSachScreen`)**:
    - Đối chiếu ngân sách dự tính ban đầu với tổng tiền thực tế từ sổ chi tiêu đã xác nhận.
    - Phân tích chênh lệch thừa/thiếu theo từng hạng mục (di chuyển, lưu trú, ăn uống, tham quan).

---

## 4. Các Chế độ Dữ liệu (`DATA_MODE`) và Snapshot

Hệ thống hỗ trợ 3 chế độ hoạt động được điều khiển qua biến môi trường `DATA_MODE`:

1. **`snapshot` (Mặc định trong môi trường Production/Vercel)**:
   - Đọc dữ liệu từ các tệp JSON đã được kiểm toán và lưu trữ sẵn trong thư mục `src/data/snapshots/`.
   - Ưu điểm: Tốc độ phản hồi cực nhanh (< 50ms), ổn định 100%, không phụ thuộc mạng ngoài, không bị lỗi 429 hay timeout từ Overpass công cộng.

2. **`live`**:
   - Gọi trực tiếp các dịch vụ mạng thực tế:
     - Nominatim OpenStreetMap (hàng đợi tốc độ 1 request/giây).
     - Overpass API đa bán kính (timeout 3.5 giây cho mỗi cụm điểm).
     - ExchangeRate API lấy tỷ giá tiền tệ.
     - Tavily Search API tìm kiếm phương tiện.
   - Khi mạng ngoài bị lỗi hoặc timeout, hệ thống tự động fallback về dữ liệu cache hoặc snapshot tương ứng.

3. **`mock`**:
   - Sử dụng tập dữ liệu giả lập tĩnh trong `src/data/mock/` phục vụ việc chạy nhanh các bài unit test tự động.

### Danh sách Snapshot Chính thức Hiện có:
- [src/data/snapshots/snapshot_da_nang_2026-10-20.json](file:///e:/Trip_Vibes/src/data/snapshots/snapshot_da_nang_2026-10-20.json) (Đà Nẵng)
- [src/data/snapshots/snapshot_ha_noi_2026-10-20.json](file:///e:/Trip_Vibes/src/data/snapshots/snapshot_ha_noi_2026-10-20.json) (Hà Nội)
- [src/data/snapshots/snapshot_da_lat_2026-10-20.json](file:///e:/Trip_Vibes/src/data/snapshots/snapshot_da_lat_2026-10-20.json) (Đà Lạt)
- [src/data/snapshots/snapshot_bangkok_2026-10-20.json](file:///e:/Trip_Vibes/src/data/snapshots/snapshot_bangkok_2026-10-20.json) (Bangkok)
- [src/data/snapshots/snapshot_seoul_2026-10-20.json](file:///e:/Trip_Vibes/src/data/snapshots/snapshot_seoul_2026-10-20.json) (Seoul)
*(Lưu ý: Điểm đến Phú Quốc hiện chưa có snapshot đạt chuẩn kiểm toán).*

### Quy trình Tạo và Kiểm toán Snapshot:
1. Chạy script tạo snapshot:
   ```bash
   npm run data:snapshot -- --dest=da_nang
   # hoặc tạo toàn bộ:
   npm run data:snapshot:all
   ```
2. Script sẽ gọi dữ liệu mạng thật từ Overpass/Nominatim, xác thực bắt buộc có đủ 4 loại danh mục (khách sạn, quán ăn, cafe, hoạt động tham quan), tạo mã băm SHA-256 và gắn metadata:
   ```json
   {
     "meta": {
       "taoBoi": "scripts/data-snapshot.ts",
       "ngayTao": "2026-10-20",
       "diemDen": "Đà Nẵng",
       "checksum": "sha256-..."
     }
   }
   ```
3. Chạy lệnh kiểm toán tính nguyên vẹn:
   ```bash
   npm run audit:snapshots
   ```

---

## 5. Danh mục Hằng số và Giả định trong `src/core/assumptions.ts`

Toàn bộ các giá trị tính toán danh nghĩa và ngưỡng nghiệp vụ được khai báo tập trung tại [src/core/assumptions.ts](file:///e:/Trip_Vibes/src/core/assumptions.ts):

| Tên Hằng số | Kiểu & Giá trị thật | Ý nghĩa nghiệp vụ | Phân loại giả định |
|:---|:---|:---|:---|
| `AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA` | `number = 150_000` | Chi phí ăn uống mặc định mỗi người một bữa (VND) | **Giả định chưa hiệu chỉnh** (ước tính trung bình đồ án) |
| `CAFE_MAC_DINH_MOI_NGUOI` | `number = 50_000` | Chi phí cà phê mặc định mỗi người (VND) | **Giả định chưa hiệu chỉnh** (ước tính trung bình đồ án) |
| `HOTEL_GIA_THEO_SAO` | `Record<number, number> = { 2: 450_000, 3: 750_000, 4: 1_300_000, 5: 2_600_000 }` | Giá phòng khách sạn theo số sao mỗi đêm (VND) | **Giả định chưa hiệu chỉnh** (ước tính khi POI không có giá) |
| `HOTEL_GIA_MAC_DINH` | `number = 700_000` | Giá phòng khách sạn mặc định khi không rõ số sao (VND) | **Giả định chưa hiệu chỉnh** |
| `AN_UONG_MOI_NGUOI_MOI_NGAY` | `number = 300_000` | Chi phí ăn uống mỗi người mỗi ngày (VND) | Hằng số dẫn xuất (alias tương thích cũ) |
| `NGUOI_MOI_PHONG` | `number = 2` | Số người tiêu chuẩn tối đa ở ghép 1 phòng khách sạn | Chuẩn nghiệp vụ lưu trú |
| `SO_HOAT_DONG_TOI_DA_MOI_NGAY` | `number = 2` | Số lượng hoạt động tham quan tối đa mỗi ngày | Quy tắc nghiệp vụ |
| `NGUONG_DI_CHUYEN_LAU_PHUT` | `number = 360` | Ngưỡng thời lượng di chuyển bị coi là lâu (360 phút = 6 giờ) | Quy tắc cảnh báo mềm |
| `DI_CHUYEN_TOI_DA_TI_LE` | `number = 0.35` | Tỷ lệ thời gian di chuyển tối đa khuyến nghị (35% chuyến đi) | Quy tắc cảnh báo mềm |
| `GIO_KHOI_HANH_SOM` | `string = "08:00"` | Ngưỡng giờ khởi hành bị coi là sớm | Quy tắc cảnh báo mềm |
| `GIO_DI_DEM_TU` | `string = "22:00"` | Giờ bắt đầu khung giờ đi đêm | Quy tắc cảnh báo mềm |
| `GIO_DI_DEM_DEN` | `string = "05:00"` | Giờ kết thúc khung giờ đi đêm | Quy tắc cảnh báo mềm |
| `GIO_DEN_SOM` | `string = "06:00"` | Ngưỡng giờ đến nơi bị coi là quá sớm | Quy tắc cảnh báo mềm |
| `QUY_TAC_VERSION` | `string = "3"` | Phiên bản quy tắc lập kế hoạch và eval hiện hành | Phiên bản chuẩn đồ án |
| `HE_SO_DUONG_BO` | `number = 1.5` | Hệ số uốn lượn đường bộ so với khoảng cách Haversine | **Giả định chưa hiệu chỉnh** |
| `GIO_HOAT_DONG_1` | `number = 570` | Giờ danh nghĩa hoạt động 1 (570 phút = 09:30 sáng) | Giờ danh nghĩa chuẩn |
| `GIO_HOAT_DONG_2` | `number = 930` | Giờ danh nghĩa hoạt động 2 (930 phút = 15:30 chiều) | Giờ danh nghĩa chuẩn |
| `GIO_NHAN_PHONG` | `string = "14:00"` | Giờ nhận phòng khách sạn chuẩn quốc tế | Chuẩn khách sạn |
| `BUFFER_SAU_KHI_DEN_PHUT` | `number = 60` | Thời gian đệm sau khi đến nơi trước khi bắt đầu hoạt động | Giờ đệm nghiệp vụ |
| `BUFFER_RA_BEN_PHUT` | `number = 120` | Thời gian đệm ra bến tàu/xe/sân bay trước khi khởi hành | Giờ đệm nghiệp vụ |
| `BUFFER_GIUA_HOAT_DONG_PHUT` | `number = 30` | Thời gian đệm tối thiểu giữa 2 hoạt động cùng ngày | Giờ đệm nghiệp vụ |
| `THOI_LUONG_TOI_THIEU_HOAT_DONG` | `number = 60` | Thời lượng tối thiểu cho 1 hoạt động tham quan (phút) | **Giả định chưa hiệu chỉnh** |
| `MAX_REPAIR_ROUNDS` | `number = 2` | Số vòng tối đa AI được thử sửa lỗi tự động | Cấu hình Agent |
| `NGUONG_GAN_HET_NGAN_SACH_PHAN_TRAM` | `number = 95` | Ngưỡng phần trăm kích hoạt cảnh báo gần hết ngân sách (%) | Quy tắc cảnh báo mềm |
| `VAN_TOC_XE_KHACH_KMH` | `number = 50` | Vận tốc ước lượng trung bình của xe khách (km/h) | **Giả định chưa hiệu chỉnh** |
| `DON_GIA_XE_KHACH_D_KM` | `number = 1_000` | Đơn giá ước lượng của xe khách (VND/km) | **Giả định chưa hiệu chỉnh** |
| `VAN_TOC_TAU_KMH` | `number = 55` | Vận tốc ước lượng trung bình của tàu hỏa (km/h) | **Giả định chưa hiệu chỉnh** |
| `DON_GIA_TAU_D_KM` | `number = 1_000` | Đơn giá ước lượng của tàu hỏa (VND/km) | **Giả định chưa hiệu chỉnh** |
| `VAN_TOC_MAY_BAY_KMH` | `number = 750` | Vận tốc bay danh nghĩa trung bình (km/h) | **Giả định chưa hiệu chỉnh** |
| `THOI_GIAN_CO_DINH_MAY_BAY_PHUT` | `number = 90` | Thời gian cố định làm thủ tục & cất/hạ cánh máy bay (phút) | **Giả định chưa hiệu chỉnh** |
| `GIA_CO_DINH_MAY_BAY_VND` | `number = 600_000` | Chi phí vé máy bay cố định (thuế phí sân bay danh nghĩa VND) | **Giả định chưa hiệu chỉnh** |
| `DON_GIA_MAY_BAY_D_KM` | `number = 1_100` | Đơn giá biến đổi theo cự ly bay (VND/km) | **Giả định chưa hiệu chỉnh** |
| `DANH_SACH_MA_CANH_BAO` | `string[23]` | 23 mã định danh cảnh báo hệ thống (hard và soft) | Tập mã cảnh báo chuẩn |
