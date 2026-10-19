# Quy tắc dự án
Ứng dụng: Trip Vibes, AI Agent lập kế hoạch du lịch (Next.js + TypeScript + Tailwind, Gemini API).
Cấu trúc: src/contracts, src/core, src/ai, src/data, src/app/api, src/design, src/ui, eval.
Quy tắc bắt buộc:
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
- Phạm vi: điểm đến bất kỳ, 2 đến 5 ngày; giá ước tính và tỷ giá phải gắn nhãn và nguồn; Nominatim tối đa 1 yêu cầu mỗi giây.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
