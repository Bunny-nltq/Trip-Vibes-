# Quy tắc dự án Trip Vibes

Ứng dụng: Trip Vibes, AI Agent lập kế hoạch du lịch thông minh (Next.js 16 + TypeScript + Tailwind CSS, Gemini API).
Cấu trúc: `src/contracts`, `src/core`, `src/ai`, `src/data`, `src/app/api`, `src/design`, `src/ui`, `eval`.

---

## 1. Phạm vi sản phẩm
- **Điểm đến**: Hỗ trợ bất kỳ điểm đến du lịch nào. Bộ dữ liệu snapshot chính thức hỗ trợ 5 điểm đến: Đà Nẵng, Hà Nội, Đà Lạt, Bangkok, Seoul. (Phú Quốc chưa hỗ trợ do Overpass không truy vấn được).
- **Độ dài chuyến đi**: Từ 2 đến 7 ngày.
- **Mô hình người dùng**: Sử dụng ở chế độ khách (Guest mode mặc định, không bắt buộc tài khoản); hỗ trợ đăng nhập/đăng ký để lưu trữ nhật ký chuyến đi cá nhân và xem lại trên thiết bị.
- **Khu vực website**: Gồm 2 khu vực chính:
  1. Khu vực trang công khai: Trang chủ (`/`), Điểm đến (`/diem-den`, `/diem-den/[slug]`), Khách sạn (`/khach-san`), Lịch trình mẫu (`/lich-trinh`), Trợ giúp / Giới hạn / Nguồn ảnh / Điều khoản. Không có trang "Cách hoạt động" riêng (tính năng được giới thiệu trực tiếp trên Home).
  2. Khu vực ứng dụng lập kế hoạch: `/lap-ke-hoach`.
- **Phạm vi không thực hiện**: Không đặt vé thật, không tư vấn visa, không thanh toán thật, không đồng bộ đa thiết bị thời gian thực, không nhúng bản đồ tương tác khi chưa có thỏa thuận cấp phép ô bản đồ.

---

## 2. Dữ liệu và nguồn
- **Địa điểm & POI**: OpenStreetMap (Overpass API) và Nominatim geocoding. Giới hạn Nominatim tối đa 1 yêu cầu mỗi giây, User-Agent hợp lệ kèm email liên hệ.
- **Tính minh bạch dữ liệu**: Mọi dữ liệu động phải luôn có nguồn và ngày lấy; giá ước tính và tỷ giá phải luôn được gắn nhãn rõ ràng; không tự bịa đặt đánh giá sao Google Maps.
- **Tỷ giá ngoại tệ**: Dùng tỷ giá có nguồn và ngày cập nhật (ExchangeRate-API hoặc tỷ giá tham khảo).
- **Nguồn ảnh**: Chỉ sử dụng ảnh từ Wikimedia Commons (có liên kết Wikidata/Commons, ghi công tác giả và giấy phép CC), Unsplash (người dùng chọn tay qua script, có UTM tracking), hoặc ảnh tự chụp. Tuyệt đối không dùng ảnh từ Google Places, Airbnb, Expedia, Wanderlog.
- **Hóa đơn & Chi tiêu**: Ảnh hóa đơn chỉ xử lý trong bộ nhớ (in-memory buffer), không lưu xuống đĩa, không ghi log dữ liệu nhạy cảm. Số tiền bóc tách được luôn cần người dùng xác nhận trước khi lưu vào sổ chi tiêu.

---

## 3. Cách làm việc & Kiến trúc tách lớp
- **`src/ui`**: Component chỉ nhận props, không tự gọi API. Giao diện không import trực tiếp `src/ai` hay `src/data`; chỉ giao tiếp qua API hoặc `src/ui/hooks`.
- **Chuẩn giao diện**: Chỉ sử dụng icon SVG (`lucide-react`), tuyệt đối **không dùng emoji**. Màu sắc, cỡ chữ, khoảng cách, bo góc 100% lấy từ Design Tokens (`src/design/tokens.json`), không viết cứng mã hex.
- **`src/core`**: Hàm thuần túy (pure functions), tính toán ngân sách, chi phí, thời gian và cờ cảnh báo (`src/core/flags.ts`). Không import `src/ai` hay `src/ui`. Hằng số giả định tập trung tại `src/core/assumptions.ts`.
- **`src/contracts`**: Mọi dữ liệu vào/ra đi qua Zod schema. Khi thay đổi cấu trúc dữ liệu, bắt buộc phải tăng `schemaVersion`.
- **`src/ai`**: AI chỉ đóng vai trò chọn lọc và hiểu ngữ cảnh; không để AI tự ý cộng tiền hay bịa đặt khách sạn/giá ngoài dữ liệu. Kế hoạch dự phòng bằng quy tắc thuật toán thuần túy khi AI vượt hạn mức hoặc gặp lỗi.
- **Bảo mật API**: Không gọi Gemini từ trình duyệt. Không ghi API key vào mã nguồn, chỉ sử dụng qua biến môi trường phía server. Khi chạy thử giao diện phải đặt `LIVE_AI_ENABLED=false`.

---

## 4. Quy tắc bắt buộc
- ui không import trực tiếp ai hoặc data; chỉ gọi API qua src/ui/hooks.
- core là hàm thuần, không import ai hoặc ui. Mọi phép tính tiền và thời gian nằm ở core.
- Mọi dữ liệu đi qua src/contracts (zod). Khi đổi dữ liệu, tăng schemaVersion.
- Màu, cỡ chữ, khoảng cách, bo góc chỉ lấy từ src/design/tokens.json, không viết cứng.
- Component trong src/ui/components chỉ nhận props, không tự gọi API.
- Không gọi Gemini từ trình duyệt. Không ghi API key vào code, chỉ dùng biến môi trường.
- AI chỉ chọn và hiểu; không để AI cộng tiền hay tạo khách sạn, giá, đánh giá ngoài dữ liệu.
- Khi sửa giao diện chỉ sửa file trong src/ui và src/design.
- Hằng số giả định nằm trong src/core/assumptions.ts.
- Cờ cảnh báo tính ở src/core/flags.ts, không để AI tự gán.
- Số tiền đọc từ bill luôn cần người dùng xác nhận trước khi ghi vào sổ chi tiêu.
- Ảnh bill chỉ xử lý trong bộ nhớ: không lưu đĩa, không log.
- Dữ liệu động luôn có nguồn và ngày lấy; giá ước tính phải gắn nhãn; không tự điền sao Google.
- Phạm vi: điểm đến bất kỳ, 2 đến 7 ngày; giá ước tính và tỷ giá phải gắn nhãn và nguồn; Nominatim tối đa 1 yêu cầu mỗi giây.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
