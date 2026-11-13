# Quy tắc dự án Trip Vibes

Ứng dụng: **Trip Vibes** — AI Agent lập kế hoạch du lịch thông minh  
Công nghệ: **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + SQLite cục bộ + Google Gemini API**.  
Cấu trúc module: `src/contracts`, `src/core`, `src/ai`, `src/data`, `src/app/api`, `src/design`, `src/ui`, `eval`.

---

## 1. Phạm vi sản phẩm & Mục tiêu đồ án AI

- **Phạm vi điểm đến**:
  - Tập trung chuyên sâu các điểm đến tại **Việt Nam**.
  - **Bộ dữ liệu snapshot chính thức**: Hỗ trợ 6 địa phương trọng điểm đã được chuẩn hóa và làm giàu dữ liệu thực tế từ OpenStreetMap: **Đà Nẵng, Hà Nội, Đà Lạt, Hội An, Huế, Nha Trang** (hơn 660 bản ghi POI thực tế).
  - **Điểm đến mới bất kỳ trong nước**: Tự động thu thập thời gian thực qua OpenStreetMap (Overpass API) và Nominatim Geocoding.
- **Thời lượng chuyến đi**: Người dùng tự chọn từ 1 ngày trở lên; các chuyến đi dài được hệ thống khuyến nghị chia chặng để tối ưu ngân sách và độ chính xác.
- **Mô hình người dùng & Lưu trữ**:
  - Mặc định sử dụng ở **chế độ Khách (Guest mode)**: Không bắt buộc tạo tài khoản vẫn có thể lập lịch trình, tùy biến và theo dõi chi tiêu trên thiết bị.
  - Hỗ trợ **Đăng ký / Đăng nhập cá nhân**: Lưu trữ dữ liệu an toàn vào SQLite cục bộ (`node:sqlite`), quản lý lịch sử nhiều chuyến đi, xem lại và quản lý sổ chi tiêu trên thiết bị.
- **Cấu trúc phân vùng ứng dụng**:
  1. *Khu vực trang công khai*: Trang chủ (`/`), Điểm đến (`/diem-den`, `/diem-den/[slug]`), Khách sạn tham khảo (`/khach-san`), Cảm hứng lịch trình (`/lich-trinh`), Thông tin dữ liệu (`/gioi-han`), Nguồn ảnh & Ghi công (`/nguon-anh`), Trợ giúp (`/tro-giup`), Điều khoản & Quyền riêng tư.
  2. *Khu vực ứng dụng lập kế hoạch*: `/lap-ke-hoach` (luồng 11 bước từ chọn nhu cầu B1, AI lập lịch trình B2, tổng quan kế hoạch B3, tùy chọn phương tiện/khách sạn B4–B7, theo dõi chuyến đi B8, chỉ đường B9, quét hóa đơn B10 và sổ ngân sách B11).
- **Phạm vi không thực hiện**: Không đặt vé thật, không thanh toán tiền thật, không tư vấn visa, không đồng bộ đám mây thời gian thực đa thiết bị, không tự ý nhúng tile bản đồ tương tác khi chưa có giấy phép ô bản đồ hợp lệ.

---

## 2. Nguồn dữ liệu & Tính minh bạch

- **Địa điểm & POI**:
  - Dữ liệu địa phương lấy từ OpenStreetMap (Overpass API) và Geocoding Nominatim.
  - Tuân thủ nghiêm ngặt giới hạn Nominatim: Tối đa 1 yêu cầu/giây, User-Agent định danh rõ ràng kèm email liên hệ.
- **Minh bạch tài chính & Đánh giá**:
  - Mọi dữ liệu động phải luôn có nguồn và ngày thu thập; giá phòng, giá vé và suất ăn là **giá ước tính** và phải luôn được gắn nhãn rõ ràng trên giao diện.
  - Tuyệt đối không tự bịa đặt đánh giá sao hoặc review giả mạo Google Maps khi chưa có Google Places API chính thức.
- **Tỷ giá ngoại tệ**: Sử dụng tỷ giá tham khảo có ngày cập nhật và nguồn minh bạch.
- **Bản quyền hình ảnh**:
  - Chỉ sử dụng ảnh từ Wikimedia Commons (có đầy đủ liên kết Wikidata/Commons, ghi công tác giả và giấy phép CC) hoặc ảnh minh họa tự chuẩn bị.
  - Tuyệt đối không cào trộm ảnh từ Google Places, Airbnb, Expedia, Wanderlog.
- **Bảo mật hóa đơn & Chi tiêu**:
  - Ảnh hóa đơn tải lên chỉ được xử lý tạm thời trong bộ nhớ (in-memory buffer), tuyệt đối không lưu file ảnh xuống đĩa và không ghi log dữ liệu nhạy cảm của người dùng.
  - Số tiền và thông tin do AI bóc tách từ hóa đơn luôn cần người dùng xem lại và xác nhận trước khi ghi vào sổ chi tiêu.

---

## 3. Kiến trúc tách lớp & Nguyên tắc kỹ thuật

```
[ Giao diện (src/ui) ]  <--->  [ API Routes (src/app/api) ]
        |                                   |
 [ Hooks / Context ]                        |
                                [ Tầng AI Agent (src/ai) ]
                                            |  (Tool Calling)
[ Tầng Hợp đồng (src/contracts) ] <---> [ Tầng Lõi (src/core) ]
                                            |
                                [ Nguồn dữ liệu (src/data) ]
```

1. **`src/contracts` (Data Contracts & Schemas)**:
   - Mọi dữ liệu vào/ra toàn hệ thống bắt buộc phải đi qua Zod schema để kiểm tra tính toàn vẹn.
   - Khi thay đổi cấu trúc dữ liệu, bắt buộc phải tăng `schemaVersion` tương ứng.
2. **`src/core` (Business Logic & Pure Functions)**:
   - Chứa 100% logic tính toán chi phí, tiền phòng, phân bổ ngân sách, thời gian di chuyển, cờ cảnh báo (`flags.ts`) và quy tắc dự phòng (`lapKeHoachTuDong.ts`).
   - Là các hàm thuần túy (pure functions), tuyệt đối **không import `src/ai` hay `src/ui`**.
   - Mọi hằng số giả định tập trung tại `src/core/assumptions.ts`.
3. **`src/ai` (AI Agent & Multimodal Vision)**:
   - AI đóng vai trò người hiểu ngữ cảnh, chọn lọc ID phù hợp từ dữ liệu công cụ và đưa ra gợi ý thông minh; **không để AI tự cộng trừ tiền hay tự bịa đặt giá cả/khách sạn ngoài dữ liệu**.
   - Vòng lặp Agent sử dụng Function Calling với 6 công cụ tìm kiếm dữ liệu thực tế.
   - Bắt buộc có cơ chế tự sửa lỗi (**Reflection / Repair Loop**) và kế hoạch dự phòng thuật toán thuần (`lapKeHoachTuDong`) khi AI gặp lỗi mạng, quá thời gian hoặc chạm hạn mức (429 Rate Limit).
   - Bảo mật API: Tuyệt đối không gọi Gemini trực tiếp từ trình duyệt; không ghi API key vào mã nguồn, chỉ sử dụng qua biến môi trường phía server.
4. **`src/data` (Data Access & Persistence)**:
   - Quản lý bộ dữ liệu snapshot tĩnh và truy vấn trực tiếp Live OpenStreetMap.
   - Quản trị cơ sở dữ liệu SQLite cục bộ (`src/data/database.ts`) cho tài khoản, phiên làm việc và lịch sử hành trình.
5. **`src/ui` (Presentation Layer)**:
   - Component chỉ nhận props và render giao diện, không tự gọi trực tiếp API backend hay import từ `src/ai` / `src/data`; giao tiếp thông qua `src/ui/hooks` và `AppContext`.
   - **Chuẩn giao diện**: Chỉ sử dụng icon SVG (`lucide-react`), tuyệt đối **không dùng emoji**. Màu sắc, cỡ chữ, khoảng cách, bo góc 100% lấy từ Design Tokens (`src/design/tokens.json`), không viết cứng mã hex.
   - Khi chỉnh sửa giao diện chỉ sửa các file trong `src/ui` và `src/design`.

---

## 4. Trải nghiệm người dùng & Xử lý lỗi (UX Rules)

- **Không văng màn hình im lặng**: Khi ngân sách dự kiến không đủ (`khong_the_dat_ngan_sach`) hoặc thông tin cần làm rõ (`can_lam_ro`), hệ thống tuyệt đối không tự ý chuyển màn hình đột ngột về B1 mà không có thông báo.
- **Phản hồi rõ ràng & Hỗ trợ 1 chạm**:
  - Tại màn hình tạo lịch trình (B2): Phải hiển thị thẻ thông báo lỗi chi tiết, nêu rõ chi phí tối thiểu cần thiết (`toiThieuVND`) và cung cấp nút bấm 1 chạm: *`Áp dụng mức tối thiểu & Tạo lại lịch trình`*.
  - Tại màn hình nhập liệu (B1): Hiển thị Banner cảnh báo nổi bật kèm nút điền nhanh số tiền tối thiểu hợp lệ.
- **Giữ gìn không gian làm việc**: Không tạo bản sao lồng thư mục dự án (như `Trip_Vibes/`), không để lại các file log rác (`qa-*.log`, `qa-*.json`) ở thư mục gốc sau khi thử nghiệm.

---

## 5. Quy tắc kiểm thử (Chỉ theo lệnh người dùng)

- **Không tự ý chạy kiểm thử**: Tuyệt đối không tự khởi chạy test runner (`vitest`), build (`next build`), typecheck (`tsc`), lint (`eslint`), eval, hoặc gọi AI thật trừ khi người dùng ra lệnh rõ ràng.
- **Phạm vi kiểm thử**: Khi được yêu cầu kiểm thử, chỉ kiểm thử những tính năng hoặc phạm vi được người dùng chỉ định; không tự ý mở rộng kiểm thử hồi quy toàn bộ hệ thống nếu không được yêu cầu.
- **Khi hoàn thành thay đổi mà chưa có lệnh kiểm thử**: Ghi rõ trạng thái mã nguồn và nêu rõ chưa chạy kiểm thử theo quy tắc này; không tự ý yêu cầu chạy lại các bài kiểm thử đã hoàn thành trước đó.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
