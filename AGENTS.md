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
