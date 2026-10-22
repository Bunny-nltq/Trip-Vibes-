# NHẬT KÝ TIẾN ĐỘ CHẠY HÔM NAY (P0 - P5)

| Thời gian (GMT+7) | Mã NV | Trạng thái | Mã commit | Ghi chú ngắn |
|---|---|---|---|---|
| 2026-10-22 08:12:00 | P0 | XONG | cf5d172 | Đã gỡ cờ Gemini, người dùng tạo lại khi cần chạy eval, lưu LENH-HOM-NAY.md |
| 2026-10-22 08:15:00 | P1 | XONG | 9589216 | Áp dụng stash chuan-bi-eval-parse (soSanhNganSach và 4 test đạt), không sửa parse-cases/đáp án |
| 2026-10-22 08:24:00 | P2 | XONG | P2-done | Thu hẹp outputFileTracingIncludes sang *.json, 5 snapshot và timetable được gói, health 200 |
| 2026-10-22 08:26:00 | P3 | XONG | P3-done | scripts/smoke.ts và smokeRules.ts (10 unit test đạt), chạy smoke test local cổng 3012 đạt |
| 2026-10-22 08:28:00 | P4 | XONG | P4-done | Cập nhật tài liệu GIOI-HAN-DA-BIET.md và KE-HOACH-LAM.md (mục Trạng thái 22/10) |
| 2026-10-22 08:29:00 | P5 | LỖI | P5-done | Thử gộp dem-ui xung đột tại docs/bang-chung/dem/TIEN-DO.md; đã abort và xóa nhánh tạm tam-gop-thu |

### Tóm tắt stash@{0} (P1)
- `eval/run-parse.ts`: Thêm hàm thuần `soSanhNganSach`, đổi `const correctNganSach = 0` thành `let` và tăng đếm khi ngân sách trích xuất khớp, bọc `main()` tránh tự chạy khi import.
- `eval/run-parse.test.ts`: Thêm 4 test case cho `soSanhNganSach` (20M với 20M: true, 19M với 20M: false, null với 20M: false, null với null: true).
- Không sửa `eval/parse-cases.ts` hay đáp án test của người dùng.

### Chi tiết xung đột gộp thử dem-ui (P5)
- Tệp bị xung đột nội dung: `docs/bang-chung/dem/TIEN-DO.md`.
- Đã thực hiện `git merge --abort`, switch về `main` và xóa nhánh tạm `tam-gop-thu` bằng `git branch -D`.


