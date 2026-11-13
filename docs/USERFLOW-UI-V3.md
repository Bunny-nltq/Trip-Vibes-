# Trip Vibes – cải tạo giao diện và userflow V3

Ngày kiểm tra: 26/10/2026. Bản chạy Windows hiện tại: http://localhost:3001. Kiểm thử giao diện với LIVE_AI_ENABLED=false.

## Những lỗi đã sửa

| Vấn đề | Cách xử lý |
|---|---|
| Khách chưa đăng nhập vẫn thấy kế hoạch Đà Nẵng 10 ngày và chi phí thử nghiệm | Bỏ kế hoạch mẫu khỏi khởi tạo ứng dụng; chặn khôi phục dữ liệu thuộc tài khoản vào phiên khách. Nhật ký khách chỉ có lời mời đăng nhập/đăng ký. |
| Màn hình xem trước có thể tự tạo thay đổi giả | Chỉ hiện xem trước từ thao tác thay đổi thực tế; truy cập trực tiếp khi chưa có dữ liệu hiện trạng thái trống. |
| Chọn tạo mới nhưng kế hoạch API cũ tự quay lại | Khởi tạo lịch sử một lần theo kết quả thực tế; tạo mới xóa đúng bản nháp. Bản nháp khách tự tạo vẫn giữ được khi tải lại. |
| Tìm chuyến đi mới trên Home bị bản nháp cũ ghi đè | Ưu tiên yêu cầu điểm đến/số ngày từ Home; tiêu thụ tham số sau khi nhận để tải lại không xóa nhầm bản nháp mới. |
| Banner dữ liệu mẫu, dòng mặc định 2 người/10 triệu và các bước kỹ thuật gây rối | Bỏ banner và dòng mặc định; Home chỉ yêu cầu điểm đến/số ngày do khách chọn. Ngân sách ban đầu để trống. |
| Thiếu đăng nhập/đăng ký trên trang công khai | Thống nhất thanh điều hướng và liên kết tài khoản; tài khoản đã đăng nhập có lối vào nhật ký. |
| Home ít nội dung khám phá | Bổ sung bộ lọc vui chơi, ăn uống, cà phê theo 5 điểm đến snapshot, có liên kết vị trí và thông tin nguồn trong phần mở rộng. |
| Thông tin khách sạn nghèo nàn; API ghi đè tiện ích thành false | Giữ đúng giá trị từ nguồn; thêm địa chỉ, tiện ích được ghi nhận, lưu ý và ngày dữ liệu. Thiếu thông tin không được diễn giải thành chắc chắn không có tiện ích. |
| Ghi công ảnh đè trực tiếp lên ảnh | Tập trung vào trang Nguồn ảnh & ghi công; bổ sung các nhánh ảnh hoạt động. Ảnh không rõ tác giả trong nhánh dự phòng được thay bằng minh họa AI. Điểm đến chưa biết không tự lấy ảnh Đà Nẵng. |
| Bố cục nặng, chữ xuống dòng/giữ vị trí cuộn cũ | Nền biển–núi minh họa mới, thẻ nội dung thoáng hơn, chỉnh menu/khoảng cách/trạng thái focus; đổi màn hình đưa vùng nội dung về đầu. |
| Footer có nội dung kỹ thuật, mốc cập nhật cố định và liên kết thừa | Footer theo nhóm khám phá/hành trình/thông tin, có quyền riêng tư, điều khoản và nguồn ảnh. |

## Userflow sử dụng

1. **Khám phá:** khách vào Home, xem điểm đến, địa điểm và nơi lưu trú. Không tự phát sinh lịch trình, hóa đơn hay nhật ký.
2. **Nhập yêu cầu:** tự chọn nơi đến và số ngày trên Home; hoàn thiện điểm xuất phát, số người, ngân sách và sở thích trong khu lập kế hoạch. Không dùng lại ngầm yêu cầu của chuyến trước.
3. **Tạo hành trình:** yêu cầu hệ thống tạo kế hoạch, hoặc mở quản lý hành trình để tạo bản trống bằng thông tin tự nhập. Bản trống có 0 hoạt động và 0 chi phí; không tự điền khách sạn/điểm xuất phát.
4. **Chỉnh sửa:** thêm/sửa/xóa điểm dừng, xem trước thay đổi và ghi chi tiêu thực tế. Tiền đọc từ hóa đơn cần xác nhận trước khi ghi sổ.
5. **Lưu cá nhân:** khách được lập bản nháp; đăng nhập/đăng ký để chủ động lưu vào nhật ký riêng. Không tự tạo một chuyến đã lưu khi chỉ mở nhật ký hoặc tìm kiếm trên Home.
6. **Đồng hành:** mở đúng chuyến trong nhật ký, chuyển trạng thái đang thực hiện, chỉnh lộ trình và chi tiêu khi cần.
7. **Hoàn thành:** đánh dấu hoàn thành để xem lại nhật ký và thống kê theo dữ liệu đã lưu của tài khoản.
8. **Đăng xuất:** chỉ xóa trạng thái riêng trên trình duyệt sau khi máy chủ xác nhận đăng xuất; không để dữ liệu tài khoản xuất hiện trong phiên khách.

Lịch trình tham khảo vẫn là nội dung khám phá được người dùng chủ động chọn; không phải kế hoạch mặc định của khách. Fixture kế hoạch dùng cho kiểm thử nằm trong src/testing/fixtures, không được dùng để khởi tạo sản phẩm.

## Kiểm chứng

- 510/510 kiểm thử tự động đạt, gồm quyền sở hữu dữ liệu, API, tính toán, nhật ký khách, khôi phục bản nháp, tạo chuyến trống, chống kế hoạch mẫu và ảnh điểm đến chưa biết.
- TypeScript: không lỗi. Production build: đạt bằng `next build --webpack`.
- Build Turbopack trong sandbox gặp lỗi tạo tiến trình xử lý CSS; không tính lần chạy đó là đạt. Webpack build hoàn tất sau đó.
- ESLint: 0 lỗi, 251 cảnh báo còn tồn tại. Không coi dự án đã sạch toàn bộ cảnh báo.
- Trình duyệt desktop: Home có đăng nhập/đăng ký, ảnh tải được và không tràn ngang ở viewport 1274px; lọc cà phê có dữ liệu; khách sạn có địa chỉ thật; nhật ký khách không có chuyến mặc định.
- Đã tạo bản nháp khách 8 ngày với 0 hoạt động/0 chi tiêu, tải lại và xác nhận còn bản nháp; sau đó tạo mới để dọn bản thử. Không tạo thêm tài khoản kiểm thử trong lượt này.
- Home chọn Đà Nẵng 5 ngày chuyển đúng vào biểu mẫu với ngân sách chưa nhập; không tự sinh một kế hoạch.
- Dọn đúng tài khoản tổng hợp `qa-v2-20261026@example.test` và dữ liệu liên quan từ lượt QA trước; giữ dữ liệu tài khoản khác.
- Schema nâng lên 17 cho thông tin khách sạn. Bản sao lồng thư mục Trip_Vibes được giữ nguyên, loại khỏi phạm vi typecheck để không kiểm tra nhầm mã nguồn cũ.

Bằng chứng: [Home](bang-chung/UI-V3-home.png), [Nhật ký khách](bang-chung/UI-V3-guest-journal.png), [Kết quả kiểm thử](bang-chung/UI-V3-kiem-thu.json).

## Phần còn cần hoàn thiện/kiểm tra tiếp

- **P1 – Mobile trực quan:** đã có CSS responsive và menu thu gọn; chưa xác nhận bằng ảnh/test thao tác trên điện thoại. Công cụ Chrome native đã dừng vì không xác định chắc URL hiện tại, nên không tuyên bố đã đạt kiểm thử mobile.
- **P1 – AI trực tiếp:** lượt kiểm thử này tắt LIVE_AI_ENABLED; cần một phiên đánh giá Gemini có kiểm soát trước bảo vệ đồ án. Không dùng kết quả kiểm thử giao diện để khẳng định chất lượng AI trực tiếp.
- **P2 – Dữ liệu lưu trú:** nhiều nguồn OSM chưa có đủ tiện ích/giờ/ảnh riêng. Hiện ảnh lưu trú được ghi rõ là minh họa; cần bổ sung ảnh chính xác và dữ liệu được xác nhận nếu muốn mức hoàn thiện thương mại.
- **P2 – Khám phá:** hiện dựa trên snapshot 5 thành phố, không phải danh mục thương mại đầy đủ hoặc trạng thái mở cửa trực tiếp được xác nhận. Giá chưa biết không hiển thị thành miễn phí.
- **P2 – Chất lượng mã và khả năng truy cập:** xử lý tiếp 251 cảnh báo lint và rà soát bàn phím/trình đọc màn hình toàn ứng dụng; đã bổ sung bàn phím/focus cho nhóm lựa chọn chính nhưng chưa coi là kiểm định accessibility đầy đủ.

Đây là báo cáo hoàn thành đợt sửa giao diện/userflow hiện tại; không đồng nghĩa mọi tích hợp dữ liệu trực tiếp và kiểm định đa thiết bị đã hoàn tất.
