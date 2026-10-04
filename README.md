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
