# Ánh xạ Khung Thiết kế Figma và Mã nguồn (Figma Code Mapping)

Tài liệu này theo dõi sự tương ứng giữa các bản vẽ khung thiết kế (Figma / Wireframes HTML) với các component React trong mã nguồn `src/ui/`, các thành phần dùng chung trong `src/ui/components/` và hệ thống Design Tokens trong `src/design/tokens.json`.

---

## 1. Màn hình Nghiệp vụ Chính (Flow B1 đến B11)

| Bước | Mã Khung Wireframe / Figma | Tên Khung Giao Diện | Tệp Mã Nguồn Tương Ứng | Trạng thái triển khai | Ghi chú |
|:---:|:---|:---|:---|:---:|:---|
| **B1** | `01-B1-chon-nhanh` | Chọn nhanh & Nhập yêu cầu | [src/ui/screens/B1ChonNhanhScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/B1ChonNhanhScreen.tsx) | Đã triển khai | Nhập điểm đi/đến, ngày, người, ngân sách |
| **B1 (biến thể)** | `14-B1-can-lam-ro` | Điểm đến mơ hồ / Chọn lại | [src/ui/screens/B1ChonNhanhScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/B1ChonNhanhScreen.tsx) | Đã triển khai | Xử lý đa ứng viên Nominatim |
| **B1 (biến thể)** | `15-B1-ngan-sach-khong-du`| Cảnh báo ngân sách không đủ | [src/ui/screens/B1ChonNhanhScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/B1ChonNhanhScreen.tsx) | Đã triển khai | Cảnh báo khi nhập dưới `minBudget` |
| **B2** | `02-B2-agent-dang-chay` | AI Agent đang tìm kiếm & lập | [src/ui/screens/B2AgentScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/B2AgentScreen.tsx) | Đã triển khai | Hiệu ứng tiến trình chuẩn bị dữ liệu |
| **B3** | `03-B3-ke-hoach` | Lịch trình kế hoạch tổng quan | [src/ui/screens/B3KeHoachScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/B3KeHoachScreen.tsx) | Đã triển khai | Lịch trình 2-5 ngày, các buổi sáng/chiều/tối |
| **B3 (biến thể)** | `16-B3-co-vi-pham` | Kế hoạch có vi phạm / Cảnh báo | [src/ui/screens/B3KeHoachScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/B3KeHoachScreen.tsx) | Đã triển khai | Banner hiển thị cảnh báo soft |
| **B4** | `04-B4-chon-phuong-tien` | Lựa chọn phương tiện di chuyển | [src/ui/screens/B4PhuongTienScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/B4PhuongTienScreen.tsx) | Đã triển khai | Máy bay, tàu hỏa, xe khách 2 chiều |
| **B5** | `05-B5-chon-khach-san` | Lựa chọn khách sạn lưu trú | [src/ui/screens/B5KhachSanScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/B5KhachSanScreen.tsx) | Đã triển khai | Danh sách khách sạn theo sao và giá |
| **B6** | `06-B6-xem-truoc-thay-doi` | Xem trước thay đổi kế hoạch | [src/ui/screens/B6XemTruocScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/B6XemTruocScreen.tsx) | Đã triển khai | So sánh thay đổi, kiểm tra cờ ràng buộc |
| **B6 (biến thể)** | `17-B6-vi-pham-nang` | Cảnh báo vi phạm nghiêm trọng | [src/ui/screens/B6XemTruocScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/B6XemTruocScreen.tsx) | Đã triển khai | Cảnh báo vượt ngân sách hoặc lỗi hard |
| **B7** | `07-B7-xac-nhan` | Xác nhận và chốt chuyến đi | [src/ui/screens/B7XacNhanScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/B7XacNhanScreen.tsx) | Đã triển khai | Tóm tắt tổng chi phí & lịch trình chốt |
| **B7 (biến thể)** | `18-B7-da-chot` | Trạng thái chuyến đi đã chốt | [src/ui/screens/B7XacNhanScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/B7XacNhanScreen.tsx) | Đã triển khai | Khóa chỉnh sửa, sẵn sàng khởi hành |
| **B8** | `08-B8-chuyen-di` | Bắt đầu & Theo dõi chuyến đi | [src/ui/screens/B8ChuyenDiScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/B8ChuyenDiScreen.tsx) | Đã triển khai | Đồng hành theo từng ngày thực tế |
| **B9** | `09-B9-chi-duong` | Xem vị trí & Chỉ đường | [src/ui/components/B9ChiDuongPopover.tsx](file:///e:/Trip_Vibes/src/ui/components/B9ChiDuongPopover.tsx) | Đã triển khai | Popover định vị & khoảng cách Haversine |
| **B10a** | `10-B10a-chon-nguon` | Chọn nguồn hóa đơn chi tiêu | [src/ui/screens/B10ChonNguonScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/B10ChonNguonScreen.tsx) | Đã triển khai | Tải ảnh bill / Chụp ảnh / Nhập tay |
| **B10b** | `11-B10b-xac-nhan-ket-qua` | Xác nhận kết quả OCR hóa đơn | [src/ui/screens/B9to11Screens.tsx](file:///e:/Trip_Vibes/src/ui/screens/B9to11Screens.tsx) (`B10XacNhanModal`) | Đã triển khai | Người dùng kiểm tra & bấm duyệt số tiền |
| **B10c** | `12-B10c-nhap-tay` | Nhập tay khoản chi tiêu | [src/ui/screens/B9to11Screens.tsx](file:///e:/Trip_Vibes/src/ui/screens/B9to11Screens.tsx) (`B10NhapTayModal`) | Đã triển khai | Biểu mẫu nhập tay số tiền và danh mục |
| **B10 (lỗi)** | `19-B10-khong-doc-duoc` | Hóa đơn mờ / Không đọc được | [src/ui/screens/B9to11Screens.tsx](file:///e:/Trip_Vibes/src/ui/screens/B9to11Screens.tsx) | Đã triển khai | Hướng dẫn tải lại ảnh hoặc nhập tay |
| **B11** | `13-B11-ngan-sach-thuc-te` | Quản lý ngân sách thực chi | [src/ui/screens/B11NganSachScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/B11NganSachScreen.tsx) | Đã triển khai | Sổ chi tiêu đối chiếu ngân sách |
| **B11 (biến thể)**| `20-B11-lech-ngan-sach` | Cảnh báo bội chi thực tế | [src/ui/screens/B11NganSachScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/B11NganSachScreen.tsx) | Đã triển khai | Phân tích chênh lệch âm/dương |

---

## 2. Các Màn hình Khác và Trạng thái Triển khai

| Mã Khung Wireframe / Figma | Tên Khung Giao Diện | Tệp Mã Nguồn Tương Ứng | Trạng thái | Ghi chú |
|:---|:---|:---|:---:|:---|
| `24-W0-man-chao` | Màn hình chào mừng (Welcome) | [src/ui/screens/WelcomeScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/WelcomeScreen.tsx) | Đã triển khai | Giới thiệu ứng dụng & nút bắt đầu |
| `25-L1-dang-nhap` | Đăng nhập tài khoản | [src/ui/screens/LoginScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/LoginScreen.tsx) | Đã triển khai | Đăng nhập email / mật khẩu |
| `26-L2-dang-ky` | Đăng ký tài khoản | [src/ui/screens/LoginScreen.tsx](file:///e:/Trip_Vibes/src/ui/screens/LoginScreen.tsx) | Đã triển khai | Tích hợp chế độ Tab đăng ký trong LoginScreen |
| `27-L3-quen-mat-khau` | Quên mật khẩu | *chưa có* | Chưa có | Chưa có component riêng trong mã nguồn |
| `28-Ve-Trip-Vibes` | Về dự án Trip Vibes | *chưa có* | Chưa có | Trang giới thiệu tĩnh, chưa có component React riêng |
| `21-A1-chat` | Giao diện Chat AI tự do | *chưa có* | Chưa có | Ngoài phạm vi luồng agent B1-B11 |
| `22-A2-ket-qua-van-ban` | Kết quả văn bản chat AI | *chưa có* | Chưa có | Ngoài phạm vi luồng agent B1-B11 |
| `23-A3-chat-tiep` | Hội thoại tiếp diễn chat AI | *chưa có* | Chưa có | Ngoài phạm vi luồng agent B1-B11 |

---

## 3. Thành phần Giao diện Dùng chung (Shared Components)

Toàn bộ các component dùng chung nằm tại `src/ui/components/`:

| Component React | Tệp Mã Nguồn | Khung Figma tương ứng | Vai trò & Trách nhiệm |
|:---|:---|:---|:---|
| `SideNav` | [src/ui/components/SideNav.tsx](file:///e:/Trip_Vibes/src/ui/components/SideNav.tsx) | *chưa có Figma riêng* (thuộc Layout chung) | Menu điều hướng sidebar bước B1 đến B11, chế độ demo và thông tin phiên |
| `TopBar` | [src/ui/components/TopBar.tsx](file:///e:/Trip_Vibes/src/ui/components/TopBar.tsx) | *chưa có Figma riêng* (thuộc Header chung) | Thanh tiêu đề trên cùng, logo, nút chuyển theme và trạng thái kết nối |
| `BudgetBox` | [src/ui/components/BudgetBox.tsx](file:///e:/Trip_Vibes/src/ui/components/BudgetBox.tsx) | Khung ngân sách B1/B3/B7/B11 | Khối hiển thị tổng ngân sách, chi phí dự kiến, số tiền còn lại và thanh tỷ lệ |
| `Badge` | [src/ui/components/Badge.tsx](file:///e:/Trip_Vibes/src/ui/components/Badge.tsx) | Khung nhãn danh mục/cảnh báo | Huy hiệu hiển thị danh mục (di chuyển, lưu trú, ăn uống, vui chơi) và cảnh báo |
| `Card` | [src/ui/components/Card.tsx](file:///e:/Trip_Vibes/src/ui/components/Card.tsx) | Khung thẻ nội dung | Thẻ bọc nội dung có bo góc, viền và đổ bóng chuẩn token |
| `Button` | [src/ui/components/Button.tsx](file:///e:/Trip_Vibes/src/ui/components/Button.tsx) | Khung nút bấm chuẩn | Các nút bấm Primary, Secondary, Danger, Ghost |
| `B9ChiDuongPopover` | [src/ui/components/B9ChiDuongPopover.tsx](file:///e:/Trip_Vibes/src/ui/components/B9ChiDuongPopover.tsx) | Khung popover `09-B9-chi-duong` | Hộp thoại thông tin đường đi và khoảng cách Haversine giữa các điểm |
| `ThemeProvider` | [src/ui/components/ThemeProvider.tsx](file:///e:/Trip_Vibes/src/ui/components/ThemeProvider.tsx) | Hệ thống màu Light/Dark | Cung cấp ngữ cảnh theme và nạp biến CSS tokens |

---

## 4. Hệ thống Design Tokens (`src/design/tokens.json`)

Mọi thông số thị giác được định nghĩa duy nhất tại [src/design/tokens.json](file:///e:/Trip_Vibes/src/design/tokens.json), tự động biên dịch thành [src/app/tokens.css](file:///e:/Trip_Vibes/src/app/tokens.css):

- **Màu sắc (Colors)**:
  - `primary`: `--color-primary-50` đến `--color-primary-900`, `--color-primary-base` (`#2B55D6`).
  - `neutral`: `--color-neutral-0` (`#FFFFFF`), `--color-neutral-50` đến `--color-neutral-900`, `--color-neutral-navy` (`#1F2A44`).
  - `semantic`: `--color-success` (`#0B7A5C`), `--color-warning` (`#8A5300`), `--color-error` (`#C0213D`).
  - `categories`:
    - Di chuyển: `--color-cat-transport` (`#2B55D6`)
    - Lưu trú: `--color-cat-lodging` (`#0E8FB5`)
    - Ăn uống: `--color-cat-dining` (`#C77700`)
    - Vui chơi: `--color-cat-activity` (`#1E8E6E`)
- **Phông chữ (Typography)**:
  - `fontFamily`: `--font-sans` (`Be Vietnam Pro`), `--font-mono` (`monospace`), `--font-display` (`Dancing Script`).
  - `fontSize`: `--font-size-xs` (11px) đến `--font-size-3xl` (28px).
- **Khoảng cách & Bố cục (Spacing)**: `--spacing-1` (4px) đến `--spacing-12` (48px).
- **Bo góc (Border Radius)**: `--radius-sm` (4px), `--radius-md` (8px), `--radius-lg` (12px), `--radius-xl` (16px), `--radius-pill` (9999px).
- **Độ nổi & Đổ bóng (Shadows)**: `--shadow-card`, `--shadow-popover`.
