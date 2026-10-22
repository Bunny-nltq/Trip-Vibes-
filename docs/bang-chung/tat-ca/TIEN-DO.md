# NHẬT KÝ TIẾN ĐỘ CHẠY TOÀN BỘ (G0 - G6)

| Thời gian (GMT+7) | Mã NV | Trạng thái | Mã commit | Ghi chú ngắn |
|---|---|---|---|---|
| 2026-10-22 10:10:00 | G0 | XONG | G0-done | Lưu LENH-TAT-CA.md, cổng 3011-3013 trống, cong-kiem-tra G0 đạt |
| 2026-10-22 10:13:00 | G1 | XONG | G1-done | Gộp dem-ui vào main thành công, cong-kiem-tra G1 đạt, smoke test /lap-ke-hoach trả 200 ĐẠT |
| 2026-10-22 10:14:00 | G2 | XONG | G2-done | Đã xuất cấu trúc trang chủ home-cau-truc.txt, cong-kiem-tra G2 đạt |
| 2026-10-22 10:18:00 | G3 | XONG | G3-done | ai-ping 1.14s; ai-rate xong 2/8 kịch bản (16 lượt Gemini), gặp 429 tại kịch bản #4 nên dừng toàn bộ G3; các bộ bill, parse, likes, repair chờ lượt tiếp theo |
| 2026-10-22 10:22:00 | G4 | XONG | G4-done | Chạy eval:diadiem, eval:data, eval:tonghop, cập nhật CHANGELOG, README, GIOI-HAN, HUONG-DAN-DEPLOY |
| 2026-10-22 10:23:00 | G5 | BỎ QUA | - | Tệp docs/DEPLOY-URL.txt chưa tồn tại (chờ người dùng cấu hình URL sau khi deploy Vercel) |

## TỔNG KẾT LẦN CHẠY
- **G0**: XONG (commit `90ebe7a`) – Lưu lệnh toàn bộ, kiểm tra 3 cổng trống, cổng kiểm tra G0 đạt.
- **G1**: XONG (commit `b323af0`, merge commit `2b82df8`) – Gộp nhánh `dem-ui` vào `main`, giải quyết xung đột chỉ tại docs, smoke test `/lap-ke-hoach` đạt HTTP 200.
- **G2**: XONG (commit `3688eea`) – Bằng chứng cấu trúc HTML trang chủ, trích xuất đúng thẻ H1-H3, link và kiểm tra emoji sạch.
- **G3**: XONG (commit `f6b954d`) – Đo ai-ping 1.14s, chạy `eval:ai-rate` đạt 2/8 kịch bản (16 lượt Gemini), gặp lỗi 429 và dừng toàn bộ G3 theo luật; giữ `ai-rate-progress.json`.
- **G4**: XONG (commit `41ee6e7`) – Hoàn thành `eval:diadiem`, `eval:data`, `eval:tonghop`, cập nhật CHANGELOG, README, GIOI-HAN-DA-BIET và tạo HUONG-DAN-DEPLOY.
- **G5**: BỎ QUA – `docs/DEPLOY-URL.txt` chưa có sẵn (chờ người dùng triển khai Vercel).

### Trạng thái các bộ Eval:
- **Đã đủ**: Không có bộ nào đạt 100% mẫu mới trong phiên do Gemini API chạm hạn mức 429.
- **Còn chờ đêm sau**:
  - `eval:ai-rate`: Đã hoàn thành 2/8 kịch bản (còn 6 kịch bản tiếp tục chạy rải).
  - `eval:bill`: Chưa chạy lượt này, chờ hồi phục quota Gemini.
  - `eval:parse`: Chưa chạy lượt này, chờ hồi phục quota Gemini.
  - `eval:likes`: Chưa chạy lượt này, chờ hồi phục quota Gemini.
  - `eval:repair`: Chưa chạy lượt này, chờ hồi phục quota Gemini.

