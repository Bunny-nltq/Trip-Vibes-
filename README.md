# Trip Vibes

AI Agent lập kế hoạch du lịch – Next.js 16 + TypeScript + Tailwind CSS + Gemini API.

## Cài đặt

```bash
npm install
```

## Cấu hình biến môi trường

Sao chép file mẫu và điền key của bạn:

```bash
cp .env.example .env.local
```

Chỉnh sửa `.env.local`:

```
GEMINI_API_KEY=your_auth_key_here
GEMINI_MODEL=gemini-2.0-flash
```

> **Lưu ý:** Tạo auth key tại [Google AI Studio](https://aistudio.google.com/apikey).  
> Key tạo từ 28/5/2026 trở đi là **auth key** (loại mới, bảo mật hơn).

## Chạy phát triển

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Kiểm tra dữ liệu mẫu

```bash
npm run check:data
```

## Kiểm tra kết nối Gemini

Sau khi điền key vào `.env.local` và chạy `npm run dev`:

```
GET http://localhost:3000/api/ai-ping
```

## Build production

```bash
npm run build
npm run start
```

## Cấu trúc thư mục

```
src/
  app/          # Next.js App Router (pages, layouts, API routes)
  contracts/    # Zod schemas + TypeScript types
  core/         # Logic thuần (không import ai/ hoặc ui/)
  ai/           # LLM Provider (chỉ server)
  data/         # DataSource interface + JsonDataSource + mock/
  design/       # Design tokens (tokens.json từ Figma)
  ui/
    components/ # Components thuần props
    screens/    # Màn hình lớn
    hooks/      # Custom hooks (giao tiếp qua API)
eval/           # Evaluation scripts
docs/           # Tài liệu kiến trúc
scripts/        # Utility scripts
```

## Triển khai (Deployment lên Vercel)

Trip Vibes được thiết kế tối ưu để triển khai tĩnh và serverless trên nền tảng **Vercel**:

### Các bước thực hiện:
1. Đẩy mã nguồn lên kho chứa GitHub / GitLab.
2. Đăng nhập Vercel, chọn **Add New Project** và nhập kho chứa `Trip_Vibes`.
3. Cấu hình cài đặt dự án:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. Cấu hình các biến môi trường trong mục **Environment Variables** (xem bảng bên dưới).
5. Nhấn **Deploy** và kiểm tra trạng thái tại `/api/health`.

### Danh sách biến môi trường (Environment Variables)

> ⚠️ **LƯU Ý QUAN TRỌNG:** Tuyệt đối KHÔNG cam kết (commit) khóa thật hay token bảo mật vào mã nguồn.

| Tên biến | Bắt buộc | Mặc định | Mô tả |
|:---|:---:|:---:|:---|
| `GEMINI_API_KEY` | Khi bật AI | - | Khóa API Google Gemini AI từ Google AI Studio (bảo mật, không ghi vào code). |
| `GEMINI_MODEL` | Không | `gemini-2.0-flash` | Tên mô hình Gemini sử dụng để phân tích và lập kế hoạch. |
| `LIVE_AI_ENABLED` | Không | `false` | Bật/tắt AI trên production. Khi `false` hoặc vượt hạn mức, hệ thống tự động dự phòng bằng quy tắc (`lapKeHoachTuDong`) mà không làm gián đoạn người dùng. |
| `GEMINI_DAILY_CAP` | Không | `40` | Hạn mức tổng số lượt gọi AI tối đa mỗi ngày trên toàn hệ thống (bộ nhớ tạm). |
| `LIVE_DATA_ENABLED` | Không | `false` | Bật/tắt chế độ lấy dữ liệu trực tuyến trên Vercel. Mặc định dùng snapshot có sẵn để bảo đảm tốc độ và độ tin cậy. |
| `DATA_MODE` | Không | `snapshot` (trên Vercel) | Chế độ dữ liệu (`snapshot` / `live` / `mock`). Trên Vercel mặc định `snapshot`. |
| `NEXT_PUBLIC_SHOW_DEMO` | Không | `false` | Cho phép hiển thị các trang `/demo/*`. Mặc định ẩn (trả về trang 404). |
| `EXCHANGE_RATE_API_KEY` | Không | - | Khóa API tra cứu tỷ giá ngoại tệ từ ExchangeRate-API (tùy chọn). |
| `TAVILY_API_KEY` | Không | - | Khóa tìm kiếm web Tavily hỗ trợ tra cứu phương tiện (tùy chọn). |

---

## Giới hạn đã biết

- **Kích thước dữ liệu mẫu**: Bộ dữ liệu OpenStreetMap (OSM) cộng đồng có thể thiếu giờ mở cửa hoặc thông tin chi tiết ở một số khu vực.
- **Giá ước tính tham khảo**: Mọi giá vé phương tiện và giá phòng khách sạn hiển thị trên Trip Vibes là ước tính tham khảo phục vụ bài toán ngân sách; Trip Vibes không thực hiện giao dịch, giữ chỗ hay đặt vé thật.
- **Không tư vấn visa**: Trip Vibes không cung cấp dịch vụ hoặc tư vấn pháp lý về thị thực (visa), hộ chiếu hay thủ tục xuất nhập cảnh.
- **Bảo mật ảnh hóa đơn**: Ảnh hóa đơn (bill) chỉ được xử lý tạm thời trong bộ nhớ của phiên làm việc, không bao giờ lưu trữ trên đĩa hay ghi vào nhật ký hệ thống.
- **Hạn mức dịch vụ bên thứ ba**: Hạn mức gọi API của Gemini và Tavily có thể chạm ngưỡng vào giờ cao điểm; khi đó ứng dụng tự động kích hoạt kế hoạch dự phòng bằng thuật toán quy tắc tối ưu chi phí.
- **Điểm đến chưa có snapshot**: Hiện tại điểm đến Phú Quốc chưa có snapshot lưu sẵn đạt chuẩn kiểm toán (sẽ thông báo yêu cầu chạy cục bộ để tải dữ liệu).

