# Trip Vibes

AI Agent lập kế hoạch du lịch thông minh – Next.js 16 + TypeScript + Tailwind CSS + Google Gemini API.

---

## 1. Cài đặt

Yêu cầu môi trường: **Node.js >= 20.11** và **npm**.

```bash
git clone https://github.com/Bunny-nltq/Trip-Vibes-.git
cd Trip_Vibes
npm install
```

---

## 2. Cấu hình Biến Môi trường

Sao chép file mẫu `.env.example` thành `.env.local`:

```bash
cp .env.example .env.local
```

### Danh mục Biến Môi trường Chi tiết:

| Tên biến | Bắt buộc | Mặc định | Mô tả |
|:---|:---:|:---:|:---|
| `GEMINI_API_KEY` | Khi bật AI | - | Khóa API Google Gemini từ Google AI Studio (bảo mật, không ghi vào code). |
| `GEMINI_MODEL` | Không | `gemini-2.5-flash` | Tên mô hình Gemini sử dụng để phân tích và lập kế hoạch. |
| `LIVE_AI_ENABLED` | Không | `false` | Bật/tắt gọi AI thật trên môi trường chạy. Khi `false` hoặc gặp lỗi/vượt hạn mức, hệ thống tự động kích hoạt kế hoạch dự phòng bằng thuật toán quy tắc thuần túy (`lapKeHoachTuDong`). |
| `GEMINI_DAILY_CAP` | Không | `40` | Hạn mức tổng số lượt gọi AI tối đa mỗi ngày trên toàn hệ thống (bộ nhớ tạm). |
| `PLAN_MAX_AI_CALLS` | Không | `8` | Số lượt gọi AI tối đa cho mỗi phiên lập kế hoạch (bao gồm cả vòng tự sửa lỗi). |
| `PLAN_TIME_BUDGET_MS` | Không | `50000` | Ngân sách thời gian tối đa (ms) cho một phiên lập kế hoạch trước khi chuyển sang kế hoạch dự phòng. |
| `DATA_MODE` | Không | `snapshot` | Chế độ nguồn dữ liệu: `snapshot` (dùng dữ liệu lưu trữ đã kiểm toán), `live` (truy vấn OSM/Nominatim trực tiếp), hoặc `mock` (dữ liệu giả lập test). |
| `LIVE_DATA_ENABLED` | Không | `false` | Cho phép truy vấn dữ liệu trực tuyến ngoài mạng khi triển khai. |
| `DATA_FALLBACK` | Không | `on` | Bật/tắt cơ chế tự động rơi về snapshot khi dữ liệu live gặp lỗi (`on` hoặc `off`). |
| `DATA_TTL_HOURS` | Không | `24` | Thời gian sống (giờ) của dữ liệu cache Overpass/khách sạn/phương tiện. |
| `DATA_MAX_SEARCH_PER_DAY` | Không | `30` | Số lượt tìm kiếm web tối đa mỗi ngày cho dữ liệu địa điểm. |
| `NOMINATIM_USER_AGENT` | Không | `TripVibes/1.0 (contact@tripvibes.vn)` | User-Agent hợp lệ kèm email liên hệ gửi đến dịch vụ OpenStreetMap Nominatim. |
| `OVERPASS_ENDPOINTS` | Không | - | Danh sách URL máy chủ Overpass tùy chỉnh, ngăn cách bởi dấu phẩy. |
| `NEXT_PUBLIC_SHOW_DEMO` | Không | `false` | Cho phép hiển thị thanh điều hướng các màn hình `/demo/*`. Mặc định trả về 404 khi deploy. |
| `SITE_URL` | Không | `http://localhost:3000` | Địa chỉ URL gốc của website phục vụ SEO metadata, sitemap và chia sẻ (dùng từ nhiệm vụ E8). |
| `TAVILY_API_KEY` | Không | - | Khóa tìm kiếm web Tavily hỗ trợ tìm kiếm phương tiện (tùy chọn). |
| `UNSPLASH_ACCESS_KEY` | Không | - | Khóa truy cập Unsplash API để tìm kiếm và đề xuất ảnh điểm đến (dùng từ nhiệm vụ D5). |
| `DATA_SNAPSHOT_NAME` | Không | - | Tên tệp snapshot chỉ định trực tiếp thay vì tự động phát hiện theo điểm đến. |
| `GOOGLE_API_KEY` | Không | - | Khóa Google API thay thế hoặc dự phòng cho `GEMINI_API_KEY`. |
| `NEXT_PUBLIC_VERCEL_ENV` | Không | - | Môi trường triển khai Vercel (`production`, `preview`, `development`). |
| `NO_AGENT_CACHE` | Không | - | Đặt bằng `"1"` để tắt bộ nhớ đệm kết quả trung gian của AI agent khi đánh giá. |
| `OVERPASS_RUN_ID` | Không | - | Định danh lần chạy truy vấn Overpass để phân tách dữ liệu lưu tạm. |
| `RUN_ID` | Không | - | Định danh phiên chạy tổng thể của các kịch bản kiểm tra/đánh giá dữ liệu. |
| `TOI_DA` | Không | - | Số lượng kịch bản đánh giá tối đa mỗi lần chạy (`eval:ai-rate`). |
| `npm_config_toi_da` | Không | - | Biến nội bộ npm nhận cờ `--toi-da=N` khi chạy script eval. |

---

## 3. Danh mục Scripts (Từ `package.json`)

Toàn bộ 26 lệnh phát triển, kiểm tra chất lượng và đánh giá được khai báo trong `package.json`:

### 3.1. Phát triển & Vận hành
- `npm run dev`: Khởi chạy máy chủ phát triển cục bộ (`next dev`) tại [http://localhost:3000](http://localhost:3000).
- `npm run build`: Tạo bản build production tối ưu với Turbopack (`next build`).
- `npm run start`: Khởi chạy ứng dụng production sau khi build (`next start`).
- `npm run lint`: Kiểm tra mã nguồn và phát hiện lỗi cú pháp với ESLint (`eslint`).
- `npm run typecheck`: Kiểm tra kiểu dữ liệu toàn bộ dự án với TypeScript compiler (`tsc --noEmit`).

### 3.2. Kiểm thử Tự động (Testing)
- `npm run test`: Chạy toàn bộ bài kiểm thử tự động toàn dự án với Vitest (`vitest run`).
- `npm run test:core`: Chạy riêng bộ kiểm thử cho tầng logic cốt lõi domain (`vitest run src/core`).

### 3.3. Kiểm tra Chuẩn Thiết kế & Dữ liệu
- `npm run check:colors`: Quét sạch mã màu hex và font cứng trong `src/ui` và `src/app` (đảm bảo 100% dùng CSS tokens).
- `npm run check:contrast`: Kiểm tra độ tương phản màu sắc toàn diện theo chuẩn WCAG 2.1 (15/15 cặp màu đạt chuẩn).
- `npm run check:emoji`: Quét và ngăn chặn emoji cứng trong giao diện, tuân thủ quy tắc chỉ dùng icon SVG của `AGENTS.md`.
- `npm run check:env`: Quét và đối chiếu sự đồng bộ giữa các biến môi trường đọc trong mã nguồn với `.env.example`.
- `npm run check:data`: Kiểm tra tính toàn vẹn và hợp lệ của dữ liệu điểm đến (`npx tsx scripts/check-data.ts`).
- `npm run build:tokens`: Biên dịch Design Tokens từ `src/design/tokens.json` thành biến CSS `src/app/tokens.css`.
- `npm run verify:keys`: Quét chống rò rỉ khóa bí mật (API key leak) ra ngoài client bundle.

### 3.4. Quản lý Dữ liệu Điểm đến & Snapshot
- `npm run data:snapshot`: Tạo snapshot dữ liệu chính thức cho điểm đến (`tsx scripts/data-snapshot.ts`).
- `npm run data:snapshot:all`: Tạo dữ liệu snapshot cho toàn bộ các điểm đến chính thức.
- `npm run audit:snapshots`: Kiểm toán tính nguyên vẹn, cấu trúc và mã băm SHA-256 của các snapshot.
- `npm run data:refresh`: Làm mới dữ liệu bộ nhớ đệm cache điểm đến (`tsx scripts/data-refresh.ts`).

### 3.5. Bộ Đánh giá Độc lập (Evaluation Suite)
- `npm run eval:tonghop`: Chạy tổng hợp toàn bộ số liệu các bộ đánh giá vào `eval/results/SO-LIEU-BAO-CAO.md`.
- `npm run eval:ai-rate`: Đánh giá tỷ lệ và độ hiệu quả lập kế hoạch của AI Agent (`tsx eval/run-ai-rate.ts`).
- `npm run eval:bill`: Đánh giá độ chính xác OCR và bóc tách dữ liệu hóa đơn chi tiêu (`tsx eval/run-bill.ts`).
- `npm run eval:parse`: Đánh giá trích xuất thông số từ yêu cầu ngôn ngữ tự nhiên (`tsx eval/run-parse.ts`).
- `npm run eval:repair`: Đánh giá cơ chế tự sửa vi phạm kế hoạch của AI (`tsx eval/run-repair.ts`).
- `npm run eval:likes`: Đánh giá thuật toán khớp sở thích người dùng (`tsx eval/run-likes.ts`).
- `npm run eval:diadiem`: Đánh giá chất lượng dữ liệu địa điểm POI (`tsx eval/run-diadiem.ts`).
- `npm run eval:data`: Đánh giá chất lượng dữ liệu trực tiếp Live (`tsx eval/run-data.ts`).
- `npm run try:plan`: Chạy thử nghiệm luồng lập kế hoạch với yêu cầu mẫu (`tsx eval/try-plan.ts`).

---

## 4. Hướng dẫn Chạy Kiểm thử và Đánh giá

### Chạy Unit Test:
```bash
npm run test
```

### Chạy Kiểm tra Chất lượng Mã nguồn:
```bash
npm run typecheck
npm run check:colors
npm run check:contrast
npm run check:emoji
npm run verify:keys
```

### Chạy Bộ Đánh giá Tổng hợp:
```bash
npm run eval:tonghop
```
Báo cáo chi tiết sẽ được tự động cập nhật tại [eval/results/SO-LIEU-BAO-CAO.md](file:///e:/Trip_Vibes/eval/results/SO-LIEU-BAO-CAO.md).

---

## 5. Triển khai lên Vercel (Deployment)

Trip Vibes được thiết kế tối ưu hóa cho mô hình serverless trên nền tảng **Vercel**:

1. Đẩy mã nguồn lên kho chứa GitHub.
2. Trên Vercel, chọn **Add New Project** và nhập kho chứa `Trip_Vibes`.
3. Cấu hình cài đặt:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. Khai báo các biến môi trường:
   - `DATA_MODE`: `snapshot` (bảo đảm tốc độ phản hồi và độ ổn định cao nhất).
   - `LIVE_AI_ENABLED`: `false` (ngoài buổi demo, hệ thống chạy cơ chế quy tắc dự phòng an toàn không tốn chi phí).
   - `NEXT_PUBLIC_SHOW_DEMO`: `false`
5. Nhấn **Deploy** và kiểm tra trạng thái tại `/api/health`.

---

## 6. Cấu trúc Thư mục Dự án

```
Trip_Vibes/
├── src/
│   ├── app/           # Next.js App Router (pages, layouts, API routes)
│   ├── contracts/     # Zod schemas và định nghĩa kiểu dữ liệu (schemaVersion = 9)
│   ├── core/          # Domain logic thuần túy (tính tiền, thời gian, cờ cảnh báo, quy tắc)
│   ├── ai/            # Gemini client, PlanAgent và vòng lặp tự sửa kế hoạch
│   ├── data/          # DataSource, Nominatim, Overpass client và Snapshots chính thức
│   ├── design/        # Design Tokens (src/design/tokens.json)
│   └── ui/            # React UI components (chỉ nhận props) và screens (B1 -> B11)
├── eval/              # Bộ runners và tệp đánh giá tự động độc lập
├── scripts/           # Scripts kiểm tra tương phản, màu, emoji, snapshot và tokens
└── docs/              # Tài liệu kiến trúc, ánh xạ thiết kế, roadmap và giới hạn đã biết
```
