# Trip Vibes V2 — bản chạy local phục vụ bảo vệ đồ án

Cập nhật: 26/10/2026. Môi trường mục tiêu đã được người dùng chọn: máy Windows hiện tại. Đây là kết quả triển khai phần cốt lõi của kế hoạch V2; các hạng mục chưa hoàn tất được liệt kê riêng, không coi toàn bộ đề án đã hoàn thành.

## Chạy chương trình

1. Mở thư mục `D:\Trip_Vibes`, chạy **CHAY-TRIP-VIBES.cmd**.
2. Mở **http://localhost:3001/** hoặc **http://localhost:3001/lap-ke-hoach?screen=workspace**.
3. Giữ cửa sổ máy chủ mở trong lúc trình diễn. Dừng bằng `Ctrl+C`.

Yêu cầu Node.js **22.14 trở lên** và thư viện trong `node_modules`. File chạy đặt `LIVE_AI_ENABLED=false`, `DATA_MODE=snapshot` và dùng Webpack. Lập kế hoạch có cấu trúc và gợi ý quy tắc chạy được mà không gọi Gemini. Nhập yêu cầu bằng văn bản tự do và đọc bill bằng AI cần Gemini; không được giới thiệu hai chức năng này là đang chạy AI trong chế độ tắt AI.

Cách chạy tương đương trong PowerShell:

```powershell
cd D:\Trip_Vibes
$env:LIVE_AI_ENABLED="false"
$env:DATA_MODE="snapshot"
node node_modules/next/dist/bin/next dev --webpack --port 3001
```

Nếu báo cổng đã được dùng, mở địa chỉ máy chủ đang chạy. Nếu Next báo một `next dev` khác đang giữ dự án, dừng đúng cửa sổ máy chủ đó bằng `Ctrl+C` rồi chạy lại. Không xóa khóa `.next` khi máy chủ vẫn chạy và không tắt hàng loạt mọi tiến trình Node.

## Những phần đã triển khai

| Nhóm | Hành vi hiện có |
|---|---|
| Thời lượng | Nhập số ngày từ 1, không còn danh sách bắt buộc 2–7 ngày. Chuyến 1 ngày không mặc định tính thêm một đêm khách sạn. Chi tiêu hỗ trợ ngày thứ 8 trở đi. |
| Giới hạn tài nguyên local | Tạo tự động/chuẩn bị dữ liệu tối đa 90 ngày mỗi lượt; dài hơn cần chia chặng thủ công. Lưu lịch trình tối đa 3.660 ngày để chặn đầu vào bất thường. Chưa có tác vụ nền tự chia rồi ghép chuyến dài. |
| Tài khoản | Đăng ký, đăng nhập, đăng xuất thật; mật khẩu băm scrypt với salt riêng. Phiên ngẫu nhiên lưu hash trong SQLite, cookie HttpOnly; phía server xác định chủ dữ liệu. Không tin `userId` gửi từ trình duyệt. |
| Lưu trữ | SQLite giao dịch, kiểm tra phiên bản khi cập nhật để tránh ghi đè bản mới. Có lịch sử phiên bản trong cơ sở dữ liệu. Tải lại trang giữ bản đang làm gồm kế hoạch và sổ chi tiêu. |
| Nhật ký | Lưu/xem lại chuyến chuẩn bị, đang diễn ra, đã hoàn thành, đã hủy; ngày bắt đầu, tên và ghi chú. Mở lại chuyến đang lưu để cập nhật thay vì tạo bản sao mỗi lần. |
| Lịch trình đang đi | Thêm/sửa/xóa, đổi ngày/giờ/thời lượng/giá/số lượng, chặng/thành phố, tọa độ; đổi thứ tự; đánh dấu đã ghé/bỏ qua/đóng cửa; khóa điểm. Có xem trước các mục thay đổi và tổng giá trước khi áp dụng, hoàn tác/làm lại trong phiên hiện tại. |
| Chuyến hoàn thành | Lịch trình chuyển sang xem; chọn “Đang diễn ra” và lưu để mở lại chỉnh sửa. Sổ chi tiêu vẫn cho bổ sung khoản thanh toán muộn. |
| Google Maps | Dán URL Maps và xác nhận tên/tọa độ trước khi thêm. Chỉ lấy tọa độ địa điểm rõ ràng; không nhầm tọa độ camera `@...` là tọa độ điểm đến. Short link không tự truy cập; có thể cần nhập tên/tọa độ thủ công. |
| Chi tiêu | Nhập tay theo ngày thực tế, sửa/xóa qua sổ chi tiêu; số tiền từ bill vẫn phải xác nhận. Ảnh bill xử lý trong bộ nhớ, không lưu ảnh xuống đĩa. Không ghi khoản chi giả khi API xác nhận lỗi. |
| Ngân sách | Server tính lại tổng từ số lượng × đơn giá. Không tự coi vé/phòng dự kiến là đã thanh toán và không trừ hai lần cùng khoản chi. Phần vé/phòng chưa đối chiếu vẫn được giữ trong dự báo. Giá chưa biết và chồng giờ có cảnh báo. |
| Gợi ý gần đây | Cà phê, ăn uống, vui chơi; lọc theo thời gian có thể dành, ngân sách cả nhóm, khoảng cách đường thẳng và các điểm đã có trong lịch trình. Giá, nguồn và ngày lấy hiển thị kèm. Có thể xem trước việc thêm hoặc thay điểm đã báo đóng cửa. |
| AI gợi ý | Quy tắc lọc ứng viên trước. Khi bật Gemini, AI chỉ được sắp xếp các ID có sẵn, không tạo giá/địa điểm/giờ mở cửa. Sai JSON, thêm ID lạ, trùng ID hoặc lỗi nhà cung cấp đều quay về quy tắc. |
| Thống kê | Số chuyến, đang đi/hoàn thành, thực chi theo hạng mục/tháng; loại chuyến hủy khỏi tổng thực chi. Không coi chưa nhập chi tiêu là đã tiết kiệm. |
| Chuyến tiếp theo | Ý tưởng từ 5 điểm đến có snapshot, ưu tiên sở thích khai báo và điểm chưa có trong nhật ký hoàn thành. Đây là quy tắc minh bạch, chưa phải mô hình học gợi ý. |
| Hồ sơ | Ngày sinh, giới tính không bắt buộc; sở thích và tùy chọn bật/tắt cá nhân hóa. Kiểm tra ngày sinh không hợp lệ/tương lai. Hiện gợi ý dùng sở thích; chưa triển khai gợi ý riêng theo tuổi/giới tính. |
| Giao diện | Trang chỉnh sửa, hồ sơ và thống kê dùng design tokens; bổ sung cách bố trí responsive và cuộn riêng cho bảng rộng. Loại nút Google đăng nhập giả và dữ liệu điền mẫu tài khoản. |

## Kịch bản trình diễn đề xuất

1. Đăng ký bằng tài khoản của bạn. Hồ sơ là tùy chọn; có thể nhập sở thích “cà phê”.
2. Tạo chuyến tự động từ biểu mẫu hoặc tạo lịch trình thủ công 10 ngày trong **Chỉnh sửa & gợi ý**. Với điểm chưa có snapshot, dùng lịch trình thủ công.
3. Chuyển tới ngày 8, thêm địa điểm từ Google Maps; kiểm tra tọa độ, giá và số lượng. Xem trước rồi áp dụng.
4. Lưu trạng thái **Đang diễn ra**, nhập một khoản chi 50.000đ ngày 8; đối chiếu sổ ngân sách.
5. Chọn một điểm làm gốc tìm gần đây. Báo điểm đóng cửa → xem trước/áp dụng → tìm ứng viên thay thế → xem trước/áp dụng.
6. Đánh dấu đã ghé, ghi nhật ký, chọn **Đã hoàn thành** và lưu.
7. Tải lại, mở Nhật ký & thống kê, kiểm tra chuyến, khoản chi và số địa điểm đã ghé. Đăng xuất rồi đăng nhập lại để chứng minh dữ liệu gắn với tài khoản.

## Bật Gemini cho phần trình diễn AI

Bản kiểm thử giao diện luôn dùng `LIVE_AI_ENABLED=false`. Để trình diễn AI thật sau khi kiểm thử, cấu hình `GEMINI_API_KEY` và `GEMINI_MODEL` phía server trong `.env.local`, dừng máy chủ cũ rồi chạy:

```powershell
$env:LIVE_AI_ENABLED="true"
$env:DATA_MODE="snapshot"
node node_modules/next/dist/bin/next dev --webpack --port 3001
```

Khóa không được đưa vào trình duyệt hoặc Git. Lượt gọi dùng quota của tài khoản Gemini được cấu hình. Khi không có khóa/quota hoặc nhà cung cấp lỗi, chức năng có cơ chế dự phòng vẫn dùng quy tắc; đọc ảnh bill cần AI thì phải báo chưa thể đọc và cho nhập tay.

## Dữ liệu và sao lưu

Cơ sở dữ liệu mặc định: `.cache/trip-vibes.sqlite`. Có thể cấu hình đường dẫn tuyệt đối bằng biến server `TRIP_VIBES_DB`. Đây là cơ sở dữ liệu một máy; chưa phải cơ chế triển khai nhiều máy chủ.

Sao lưu nhất quán bằng SQLite, kể cả khi máy chủ đang chạy:

```powershell
npm run backup:local
```

File được ghi vào `.cache/backups/`. Khi khôi phục: dừng **mọi máy chủ Trip Vibes** trước, sao lưu bản hiện tại, rồi thay file SQLite bằng bản sao mong muốn. Chuyển các file `trip-vibes.sqlite-wal`/`trip-vibes.sqlite-shm` cũ sang thư mục giữ riêng nếu còn tồn tại, không để chúng đi cùng cơ sở dữ liệu được phục hồi. Khởi động lại và kiểm tra đăng nhập/nhật ký. Giữ các file sao lưu riêng tư vì chứa tài khoản và nhật ký.

Ảnh bill không nằm trong bản sao lưu vì không được lưu trên đĩa. Bản đang sửa chưa bấm lưu tài khoản nằm trong phiên trình duyệt; lưu nhật ký trước khi đổi máy hoặc đóng phiên.

V1 dùng JSON trong `.cache/auth`; V2 **không tự xóa, tự nhập một phần hoặc ghi đè** dữ liệu đó. Xem trước chuyển đổi:

```powershell
npm run migrate:auth
# Chỉ áp dụng khi báo cáo không còn rejectedUsers / rejectedTrips:
npm run migrate:auth -- --apply
```

Lần kiểm tra hiện tại phát hiện một bản ghi chuyến cũ không đúng hợp đồng ở chỉ số 0; chưa áp dụng chuyển đổi. File nguồn vẫn nguyên vẹn. Cần sửa bản ghi lỗi trước khi chuyển tài khoản/nhật ký cũ sang SQLite. Các tài khoản V2 đăng ký mới dùng SQLite ngay.

## Kiểm tra đã thực hiện

- Toàn bộ Vitest: **498/498 đạt**, gồm core, API, tài khoản, chống truy cập chéo tài khoản, phiên bị thu hồi, xung đột phiên bản, dữ liệu chi tiêu không hợp lệ, Maps, gợi ý và 5 lịch trình mẫu.
- AI ranking được kiểm tra bằng nhà cung cấp giả lập: giữ nguyên giá/nguồn, từ chối ID bịa/trùng/thiếu và quay về quy tắc khi lỗi. Đây không phải kết quả đo chất lượng Gemini trực tiếp.
- TypeScript không báo lỗi; production build thành công. Quét 28 file JS/source map public không tìm thấy Gemini API key. Kiểm tra HTTP cuối: trang chủ, workspace, health, mẫu Đà Nẵng/Seoul và auth/me đều trả 200.
- ESLint: **0 lỗi, 255 cảnh báo** toàn dự án ở lần chạy ghi nhận. Còn nợ dọn cảnh báo ảnh, kiểu `any`, dependency/effect và mã cũ.
- Trình duyệt: đăng ký → lưu chuyến 10 ngày → cập nhật trạng thái → nhập chi ngày 8 → xem trước đánh dấu đã ghé → hoàn thành → tải lại → thống kê đúng 50.000đ và 1 địa điểm. Gợi ý cà phê có nguồn/ngày được trả về từ snapshot.
- Bản sao lưu SQLite đã được tạo và `PRAGMA integrity_check` trả `ok`.
- Trong lúc thay CSS trực tiếp, Webpack HMR có phát sinh lỗi `removeChild` thuộc bộ nạp CSS của Next. Cần tải lại trang sau cập nhật. Đã mở bản production riêng trên cổng 3002, tải được nhật ký và không ghi nhận lỗi console trong lần kiểm tra đó.
- Chưa có bằng chứng kiểm thử trực quan trên màn hình điện thoại trong lượt này; responsive đã chỉnh trong CSS nhưng chưa coi là nghiệm thu mobile đầy đủ.

## Phần còn lại để hoàn thiện toàn bộ kế hoạch V2

1. **Nguồn trực tiếp:** tích hợp Google Places có khóa/quota, kiểm chứng giờ mở cửa vào ngày đến. Hiện không scrape Google Maps; liên kết Maps nhập tay không đồng nghĩa đã có dữ liệu Places.
2. **Tối ưu lại lộ trình:** tính lại đường đi/thời gian di chuyển, cửa sổ mở cửa, thời tiết và phần hành trình còn lại sau thay đổi. Hiện có CRUD, cảnh báo chồng giờ và gợi ý thay điểm; chưa có bộ tối ưu toàn tuyến theo thời gian thực.
3. **Chuyến rất dài:** tác vụ nền chia/ghép chặng, tiến độ, hủy và khôi phục tác vụ. Hiện người dùng tự chia chặng khi vượt 90 ngày tự động mỗi lượt.
4. **Đánh giá AI cho luận văn:** bộ dữ liệu gán nhãn, so sánh quy tắc với Gemini, tỷ lệ vi phạm ràng buộc, độ phù hợp gợi ý, chi phí/độ trễ và sai số OCR trên ảnh bill thật. Unit test không thay thế thí nghiệm này.
5. **Tài khoản mở rộng:** xác minh email, quên mật khẩu qua email, Google OAuth; không thuộc đăng nhập/đăng ký cơ bản đã hoàn thành.
6. **Đồng bộ tiến độ:** đồng bộ đầy đủ cách đánh dấu địa điểm giữa màn đồng hành cũ và editor V2; giao diện phục hồi phiên bản, lưu lịch sử undo qua lần khởi động. Hiện lịch sử phiên bản đã có ở SQLite nhưng chưa có màn phục hồi.
7. **Chia sẻ:** chưa có liên kết chia sẻ chứa snapshot chuyến công khai. Nút cũ đã đổi thành “Chép địa chỉ” và ghi rõ không kèm dữ liệu, tránh gây hiểu nhầm.
8. **Hoàn thiện nghiệm thu:** sửa bản ghi JSON cũ bị lỗi trước chuyển đổi; dọn cảnh báo lint; kiểm thử mobile/khả năng truy cập; kiểm tra ảnh bill thật và chất lượng Gemini với cấu hình được phép sử dụng.

Không cần đặt vé, thanh toán, tư vấn visa hoặc triển khai đồng bộ nhiều máy để bảo vệ bản local này. Những hạng mục trên vẫn cần được thực hiện nếu muốn tuyên bố hoàn thành toàn bộ V2.

Metadata ảnh dành cho UI được đóng gói tại `src/design/anh-diem-den.json`, cùng tác giả/giấy phép của manifest nguồn. Khi thay metadata nguồn, đồng bộ bản đóng gói trước build bằng `npm run sync:ui-images`.

Bằng chứng: [báo cáo kiểm thử](bang-chung/V2-kiem-thu.json) và [ảnh thống kê production](bang-chung/V2-nhat-ky-local.png).
