# Hướng dẫn Triển khai Vercel (Trip Vibes)

Tài liệu này hướng dẫn các bước chi tiết để người dùng triển khai ứng dụng Trip Vibes lên nền tảng đám mây Vercel một cách an toàn và đúng chuẩn.

---

## 1. Kết nối Kho lưu trữ (Repository)
1. Đăng nhập vào trang quản trị [Vercel Dashboard](https://vercel.com).
2. Chọn **Add New...** -> **Project**.
3. Kết nối với tài khoản GitHub và chọn kho lưu trữ `Bunny-nltq/Trip-Vibes-`.
4. Framework Preset: Để mặc định **Next.js**.

---

## 2. Cấu hình Phiên bản Node.js
- Trong phần cấu hình dự án (**Project Settings** -> **General** -> **Node.js Version**):
- Chọn phiên bản: **Node 22** (do `package.json` quy định `engines: { "node": ">=20.11" }` và `devDependencies` sử dụng các gói tương thích Node 22).

---

## 3. Bảng Biến Môi trường (Environment Variables)

Người dùng cần cấu hình các biến môi trường trong phần **Environment Variables** trên Vercel:

| Tên biến | Giá trị đề xuất | Ý nghĩa & Ghi chú |
|:---|:---|:---|
| `DATA_MODE` | `snapshot` | Bắt buộc: Sử dụng dữ liệu tĩnh snapshot chính thức đã kiểm toán. |
| `LIVE_DATA_ENABLED` | `false` | Bắt buộc: Tắt truy vấn trực tuyến Overpass ngoài mạng nhằm tránh timeout serverless. |
| `LIVE_AI_ENABLED` | `false` | Bắt buộc: Tắt gọi AI tự động mặc định, lập kế hoạch bằng thuật toán quy tắc (`lapKeHoachTuDong`). |
| `NOMINATIM_USER_AGENT` | `TripVibes/1.0 (contact@tripvibes.vn)` | User-Agent hợp lệ kèm email liên hệ thật theo chính sách Nominatim. |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Phiên bản mô hình AI Gemini chuẩn của dự án. |
| `GEMINI_API_KEY` | *(để trống)* | Không đặt khóa Gemini nếu để AI tắt (tránh rò rỉ khóa và phát sinh chi phí). |

---

## 4. Kiểm tra Sau khi Triển khai

Sau khi quá trình Build và Deploy hoàn tất, hãy thực hiện kiểm tra tính toàn vẹn của bản phát hành:

1. **Kiểm tra trạng thái hệ thống (`/api/health`)**:
   - Truy cập: `https://<ten-mien-cua-ban>/api/health`
   - Kỳ vọng: Trả về HTTP 200, trường `mode` là `"snapshot"`, và liệt kê đủ 5 snapshot chính thức:
     1. Băng Cốc (`2026-10-20`)
     2. Đà Lạt (`2026-10-20`)
     3. Thành phố Đà Nẵng (`2026-10-20`)
     4. Hà Nội (`2026-10-20`)
     5. Seoul (`2026-10-20`)

2. **Kiểm tra tuyến đường demo (`/demo`)**:
   - Truy cập: `https://<ten-mien-cua-ban>/demo`
   - Kỳ vọng: Trả về HTTP 404 (tuyến đường nội bộ phát triển bị chặn trên môi trường triển khai).

3. **Kiểm tra giao diện người dùng**:
   - Truy cập `/`: Trang chủ hiển thị đầy đủ 6 khối nội dung, không có lỗi JavaScript.
   - Truy cập `/lap-ke-hoach`: Trang lập kế hoạch du lịch phản hồi HTTP 200.

---

## 5. Hướng dẫn Chạy Kiểm tra Nhanh Tự động (Smoke Test)

Để tự động hóa việc xác minh bản trực tuyến:
1. Tạo tệp văn bản `docs/DEPLOY-URL.txt` ở thư mục gốc của dự án.
2. Dán duy nhất địa chỉ URL của bản triển khai (ví dụ: `https://trip-vibes.vercel.app`), không chứa khoảng trắng hay dấu `/` ở cuối.
3. Chạy lệnh smoke test từ máy cục bộ:
   ```bash
   npm run smoke -- https://trip-vibes.vercel.app
   ```
4. Kiểm tra bảng kết quả in ra trên terminal. Toàn bộ các tiêu chí phải đạt nhãn **ĐẠT**.
