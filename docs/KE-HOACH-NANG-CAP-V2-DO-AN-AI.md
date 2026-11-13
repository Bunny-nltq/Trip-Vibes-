# Trip Vibes V2 — Kế hoạch đồ án AI lập kế hoạch và đồng hành du lịch

Ngày cập nhật: 25/10/2026. Trạng thái: đặc tả/kế hoạch, chưa triển khai V2.

Tài liệu này thay thế kế hoạch trước, giữ các lỗi đã được kiểm chứng trong `bang-chung/QA-2026-10-25.md` làm backlog bắt buộc. Yêu cầu mới của người dùng là căn cứ thay đổi phạm vi cũ, đặc biệt giới hạn 2–7 ngày. Không coi các tính năng phụ thuộc API là đã hoạt động khi chưa kiểm thử tích hợp thật.

## 1. Định hướng sản phẩm và phạm vi chốt

Trip Vibes hỗ trợ trọn vòng đời: nhập nhu cầu → lập kế hoạch → người dùng chỉnh sửa → bắt đầu chuyến đi → cập nhật chi phí/thực tế → AI gợi ý phần hành trình còn lại → hoàn thành → nhật ký/thống kê → gợi ý chuyến tiếp theo.

| Yêu cầu | Quyết định V2 |
|---|---|
| Thời lượng | Người dùng chọn ngày bắt đầu/kết thúc hoặc số ngày nguyên dương; hỗ trợ đi trong ngày, bỏ giới hạn cố định 2–7 |
| Chuyến dài | Tạo/lưu toàn chuyến, sinh lịch trình theo chặng với tiến trình và tiếp tục khi lỗi; giới hạn tài nguyên từng tác vụ tách khỏi thời lượng chuyến |
| Điểm đến | Một hoặc nhiều chặng/điểm đến; 5 snapshot vẫn là bộ dữ liệu kiểm thử chính thức, không phải danh sách duy nhất được phép nhập |
| Địa điểm tự thêm | Nhập thủ công hoặc dán Google Maps URL; xác nhận địa điểm trước khi đưa vào lịch trình |
| Tài khoản | Đăng ký, đăng nhập, đăng xuất, hồ sơ, phiên xác thực server; phục hồi tài khoản qua email khi cấu hình dịch vụ |
| Nhật ký | Lưu/xem chuyến chuẩn bị, đang diễn ra, đã hoàn thành; dữ liệu riêng theo tài khoản |
| Đang đi | Thêm/sửa/xóa/đổi thứ tự điểm đến, đánh dấu đã ghé/bỏ qua, điều chỉnh giờ và giá thực tế |
| Chi tiêu | Nhập tay luôn có; OCR bill khi API khả dụng, xác nhận trước ghi sổ |
| AI thích ứng | Đề xuất điểm tiếp theo hoặc thay thế khi đổi lộ trình, chậm giờ, thiếu ngân sách hoặc đóng cửa |
| Gần đây | Gợi ý cà phê, ăn uống, vui chơi quanh điểm đang chọn hoặc vị trí người dùng chủ động cung cấp |
| Thống kê | Trong từng chuyến và toàn bộ lịch sử; phân biệt dự toán, thực chi, đã trả, còn phải trả và giá chưa biết |
| Cá nhân hóa | Sở thích chủ động + phản hồi/lịch sử; ngày sinh, giới tính tùy chọn, không suy diễn sở thích bằng định kiến giới |
| Guest | Vẫn lập và dùng chuyến cục bộ; có thể chuyển chuyến khách vào tài khoản sau đăng nhập |

Giữ các giới hạn nghiệp vụ còn phù hợp: không đặt vé, thanh toán hay tư vấn visa; không tự tạo sao/giá/địa điểm; không tự nhúng bản đồ khi chưa có cấu hình và quyền sử dụng phù hợp; không thu thập vị trí nền mặc định. Ảnh giao diện tiếp tục dùng nguồn được dự án cho phép, không lấy ảnh Google Places.

## 2. Tiêu chuẩn “hoàn chỉnh” của đồ án

Một chức năng chỉ được đánh dấu hoàn thành khi có UI/API/lưu trữ thật, kiểm tra đầu vào/quyền truy cập, loading/error/empty states, đường phục hồi, kiểm thử và bằng chứng runtime. Nút demo, dữ liệu giả hoặc API luôn trả thành công không thay cho chức năng thật.

Ba lớp nghiệm thu: (1) tính đúng của nghiệp vụ và dữ liệu; (2) chất lượng gợi ý AI được đo; (3) trải nghiệm người dùng trên desktop/mobile. Mọi giới hạn dữ liệu và phần phụ thuộc nhà cung cấp phải hiển thị đúng.

## 3. Tài khoản, hồ sơ và quyền riêng tư

### 3.1. Tài khoản cơ bản bắt buộc

- Đăng ký họ tên/email/mật khẩu/xác nhận mật khẩu, kiểm tra trùng email; phản hồi lỗi rõ ràng.
- Đăng nhập, đăng xuất, duy trì phiên qua reload; hết hạn phiên có đường đăng nhập lại không mất bản nháp.
- Hash mật khẩu bằng cơ chế phù hợp, không ghi log; cookie phiên HttpOnly, Secure ở production, thời hạn rõ.
- Backend suy ra user từ phiên; không tin userId do trình duyệt gửi. Kiểm tra ownership trên mọi API hồ sơ/chuyến đi/chi tiêu/thống kê.
- Rate limit, kiểm tra origin/CSRF phù hợp với cookie, lỗi trả về không chứa exception nội bộ.
- Quên mật khẩu/xác minh email có token dùng một lần, hết hạn; chỉ báo gửi thành công khi dịch vụ email nhận yêu cầu. Nếu chưa cấu hình email, trạng thái chưa khả dụng phải rõ.
- Google OAuth không phải điều kiện để hoàn thành đăng nhập cơ bản. Nút Google chỉ xuất hiện khi có OAuth thật; bỏ thao tác điền tài khoản demo giả đăng nhập Google.

### 3.2. Hồ sơ cá nhân

Họ tên, email, ảnh đại diện nếu có nguồn phù hợp; ngày sinh và giới tính tùy chọn (có “không muốn cung cấp”); ngôn ngữ, tiền tệ, sở thích, nhịp độ, ngân sách, nhu cầu tiếp cận, thành phần nhóm đi cùng. Không suy ra sức khỏe hay năng lực vận động từ ngày sinh/giới tính.

Giá trị dùng để cá nhân hóa chủ yếu là sở thích người dùng chọn. Tuổi có thể giúp tôn trọng hạn chế tuổi được nguồn xác nhận; giới tính không tự động loại điểm hoặc gán nhóm sở thích. Cho phép xem/sửa/xóa trường tùy chọn và tắt cá nhân hóa từ lịch sử. Không đưa email/ngày sinh đầy đủ/giới tính vào prompt nếu không cần; ưu tiên thuộc tính tối thiểu như nhóm tuổi phù hợp.

## 4. Vòng đời chuyến đi và nhật ký

Trạng thái nghiệp vụ: `draft` → `planned` → `in_progress` → `completed`; có `cancelled`. Trạng thái tác vụ AI (queued/running/failed/ready) tách riêng.

- **Nháp:** nhập nhu cầu, thêm địa điểm, lưu dở.
- **Đã lập:** xem/sửa lịch trình, xem trước chênh lệch, chốt bản dùng để đi.
- **Đang diễn ra:** chọn ngày hiện tại, thực hiện/đổi/bỏ điểm, ghi chi tiêu, nhận gợi ý thích ứng.
- **Hoàn thành:** người dùng xác nhận kết thúc; lưu bản kế hoạch cuối và diễn biến thực tế, nhật ký ghi chú, khoản chi, phản hồi.
- **Xem lại:** lọc theo trạng thái/thời gian/điểm đến; tìm kiếm, mở chi tiết, xuất dữ liệu, sao chép làm chuyến mới.
- **Sửa chuyến hoàn thành:** có chế độ chỉnh nhật ký rõ ràng và lịch sử thay đổi, không tự trở thành chuyến đang đi.

Mỗi chuyến có ID ổn định, phiên bản cập nhật và dữ liệu riêng. Ghi theo transaction; xử lý cập nhật cũ từ tab khác bằng cảnh báo xung đột, không ghi đè im lặng. Đồng bộ thông thường khi tải/lưu qua server; không hứa đồng bộ thời gian thực.

Guest dùng lưu trữ cục bộ có version và hiển thị giới hạn thiết bị. Sau đăng nhập, có thao tác nhập chuyến khách và chống nhập trùng. Reload không đổi plan sang mẫu, không trộn ledger của chuyến khác.

## 5. Lịch trình linh hoạt và chỉnh sửa khi đang đi

### 5.1. Thời gian không còn cố định 2–7 ngày

- Chọn ngày bắt đầu/kết thúc; mặc định một ngày nếu đi trong ngày, không bắt buộc khách sạn.
- Chọn số ngày khi chưa biết ngày khởi hành; giờ mở cửa tương lai phải ghi là dự kiến/chưa kiểm tra được.
- Lưu timezone theo địa điểm/chặng; tính số đêm theo chặng lưu trú và giờ đến/về, không lấy tổng ngày trừ một cho mọi tình huống.
- Chuyến dài chia chặng, sinh từng phần, cho xem/sửa phần đã có, hủy hoặc tiếp tục tác vụ; không gửi toàn bộ chuyến dài vào một prompt.
- Rà toàn bộ contract, core, AI, form, ledger, biểu đồ, API, thông báo và tests đang hardcode 7. Hiện TripRequest/Expense và validation đều có ràng buộc này; không chỉ sửa dropdown.

### 5.2. Trình chỉnh sửa

- Thêm điểm từ tìm kiếm, địa điểm lưu, Google Maps URL hoặc nhập tay.
- Sửa ngày/giờ bắt đầu, thời lượng, thứ tự, chặng, ghi chú, giá dự kiến/thực tế; kéo thả kèm nút chuyển lên/xuống hỗ trợ bàn phím.
- Đặt điểm bắt buộc, khóa khung giờ, đánh dấu đã đến/đã xong/bỏ qua/đóng cửa.
- Xóa khỏi lịch trình không xóa khoản chi đã ghi cho điểm đó; giữ liên kết lịch sử hoặc đánh dấu điểm đã bỏ.
- Kiểm tra trùng điểm, chồng giờ, thời gian di chuyển, giờ hoạt động và khả năng hoàn thành.
- Mọi thay đổi có tác động hiển thị trước/sau: ngân sách, giờ kết thúc, đoạn di chuyển, điểm bị dời/bỏ và dữ liệu còn thiếu.
- Hoàn tác/làm lại trong phiên, lưu revision bền vững; dùng version để xử lý xung đột. Không sửa tự động phần đã thực hiện.

## 6. Google Maps và tự thêm địa điểm

### 6.1. Chức năng hoạt động không phụ thuộc Google API

Người dùng dán liên kết Google Maps hoặc nhập tên/địa chỉ/tọa độ. Hệ thống phân tích các dạng URL được hỗ trợ, hiển thị dữ liệu nhận diện được, cho xác nhận/sửa/chọn ngày trước khi lưu. Chỉ URL không phải lúc nào cũng đủ để xác định một POI; tâm bản đồ không được mặc nhiên coi là tọa độ địa điểm.

Nếu không phân giải được short link hoặc URL thiếu dữ liệu, giữ đường dẫn tham chiếu và yêu cầu tên/tọa độ hoặc tìm đối chiếu nguồn độc lập; không đoán Place ID/giờ mở cửa. Địa điểm người dùng nhập có nhãn nguồn `user`, không đổi nhãn thành Google/OSM. Chưa có tọa độ thì có thể lưu điểm nhưng không xếp hạng khoảng cách/chỉ đường chính xác.

Maps URLs dùng để mở Google Maps/chỉ đường và không yêu cầu API key. Đây không phải API lấy dữ liệu POI. [Tài liệu Maps URLs](https://developers.google.com/maps/documentation/urls/get-started).

### 6.2. Tích hợp dữ liệu chính thức có cấu hình

- Adapter Google Places cho tìm/đối chiếu, Place Details và Nearby Search khi được cấu hình; key ở server, hạn chế API và quota.
- Chỉ lấy trường cần dùng, có timeout/rate limit; hạn mức ứng dụng và giới hạn request thực tế, không coi cảnh báo chi phí là cơ chế tự dừng.
- Place ID và dữ liệu do người dùng tạo được quản lý tách với nội dung do provider cấp. Không đổ toàn bộ response Places vào snapshot/nhật ký vĩnh viễn; xây chính sách lưu/tải lại từng trường theo điều khoản hiện hành.
- Hiển thị attribution phù hợp; không trộn dữ liệu Google lên bản đồ nền khác một cách mặc định. Dùng danh sách và link Maps khi chưa tích hợp bản đồ phù hợp.
- Không scrape trang Google Maps, không dùng ảnh/review/sao Google ngoài dữ liệu được phép; vẫn giữ quy tắc ảnh hiện tại của dự án.
- Phân giải URL trên server cần allowlist host chính xác, kiểm tra từng redirect/IP, giới hạn số redirect/kích thước/thời gian để tránh SSRF; không fetch URL tùy ý.

Google cho phép lưu Place ID nhưng hạn chế lưu/cache các nội dung Places khác và yêu cầu attribution. [Chính sách Places](https://developers.google.com/maps/documentation/places/web-service/policies). Nearby Search hỗ trợ tìm theo vùng và loại địa điểm, FieldMask ảnh hưởng dữ liệu và tính phí. [Nearby Search](https://developers.google.com/maps/documentation/places/web-service/nearby-search).

## 7. Chi tiêu, giá tự nhập và hóa đơn

- Tách **dự toán** với **giao dịch thực chi**; việc sửa giá dự kiến không tự tạo chi tiêu.
- Khoản chi có tripId, ngày lịch/ngày trong chuyến, hạng mục, số tiền, tiền tệ, tỷ giá có nguồn/thời điểm nếu quy đổi, địa điểm liên quan tùy chọn và ghi chú.
- Có thêm/sửa/xóa khoản chi, xác nhận thao tác, chống gửi trùng. Số tiền xác thực ở server; tổng tính trong core.
- Khoản đặt trước chỉ được ghi đã trả khi người dùng xác nhận hoặc có giao dịch tương ứng, không suy diễn mọi vé/phòng đều đã thanh toán.
- Một bill có thể có nhiều hạng mục nhưng chỉ cộng tổng một lần; hiển thị phần phân bổ chưa đủ.
- OCR đề xuất cửa hàng/ngày/tổng tiền/tiền tệ/hạng mục và độ tin cậy; người dùng sửa/xác nhận trước lưu. Không tự ghi sổ chỉ vì OCR đọc được.
- Ảnh bill xử lý trong memory, không lưu file/DB/log; xử lý object URL đúng vòng đời. Không hứa xem lại ảnh bill sau chuyến; chỉ lưu dữ liệu đã xác nhận.
- AI lỗi/tắt/quota hoặc ảnh không đọc được thì nhập tay vẫn hoàn chỉnh; dữ liệu OCR thật chỉ tuyên bố đạt sau eval live có cấu hình.

## 8. AI thích ứng trong chuyến đi

### 8.1. Hai loại gợi ý

**Điểm tiếp theo trong chuyến đang đi:** xét vị trí/điểm xuất phát người dùng chọn, thời gian hiện tại, lịch đã sửa, điểm khóa/đã ghé, thời lượng còn lại, chi tiêu và ngân sách, nguồn giờ mở cửa, sở thích.

**Chuyến đi mới trong tương lai:** dựa trên phản hồi và lịch sử được phép sử dụng để gợi ý điểm đến/phong cách/độ dài/ngân sách; không lấy giới tính làm đại diện cho sở thích, không huấn luyện cộng tác giả khi chưa có đủ người dùng.

### 8.2. Các tác nhân kích hoạt

- Người dùng thêm/bỏ/đổi thứ tự điểm hoặc thay thời lượng.
- Bắt đầu trễ, di chuyển lâu hơn dự kiến, ngân sách còn ít.
- Người dùng báo “địa điểm đóng cửa/không vào được”.
- Dữ liệu provider báo tạm đóng/vĩnh viễn hoặc giờ dự kiến đến ngoài giờ hoạt động.
- Người dùng chủ động bấm “Tìm cà phê/vui chơi gần đây” hay “Gợi ý lại phần còn lại”.

Không chạy định vị nền hoặc gọi provider liên tục. Kiểm tra khi người dùng mở màn đồng hành/chuẩn bị đi/bấm cập nhật, có thời gian kiểm tra gần nhất và tùy chọn kiểm tra lại.

### 8.3. Pipeline đề xuất

1. Thu thập ngữ cảnh tối thiểu của chuyến và phiên bản hiện tại.
2. Lấy ứng viên có nguồn từ snapshot/OSM/provider hoặc điểm người dùng thêm.
3. Core loại ứng viên vi phạm: đóng cửa đã biết, khung giờ không đủ, ngoài chặng, đã bỏ/đã ghé trừ khi cho phép, không đáp ứng điểm khóa.
4. Xếp hạng theo mức phù hợp sở thích, độ lệch tuyến, thời gian, giá đã biết, độ tin cậy dữ liệu và đa dạng. Trọng số là cấu hình cần hiệu chỉnh trên tập dev.
5. AI hiểu ngữ cảnh tự nhiên/chọn ID từ ứng viên/xây lời giải thích. Không sinh POI, giá, điểm đánh giá hoặc trạng thái đóng cửa không có nguồn.
6. Bộ lập lịch/core kiểm tra phương án và tính tiền/thời gian, tạo bản diff.
7. Hiển thị 3–5 phương án nếu đủ dữ liệu: vì sao hợp, khoảng cách/độ lệch tuyến, giá, giờ hoạt động, nguồn/ngày và điều chưa biết.
8. Người dùng áp dụng một phương án; lưu revision, sự kiện và phản hồi. Gợi ý cũ bị vô hiệu nếu trip version đã thay đổi.

Khi dữ liệu giờ hoạt động thiếu: hiển thị “chưa xác minh”, không coi là đang mở. Haversine chỉ là khoảng cách thẳng tham khảo; thời gian đường đi phải có nguồn tuyến đường hoặc nhãn giả định rõ.

Google Places có businessStatus và currentOpeningHours; giờ hiện tại chỉ phủ khoảng thời gian gần hiện tại theo tài liệu, không bảo đảm địa điểm sẽ mở trong mọi ngày tương lai. Kết quả phải hiển thị thời điểm kiểm tra, timezone và cho phép báo thực tế khác. [Place resource](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places). Trường giờ mở cửa có thể ảnh hưởng SKU; cần chốt FieldMask và quota trước chạy thật. [Place Details](https://developers.google.com/maps/documentation/places/web-service/place-details).

## 9. Thống kê và cá nhân hóa

### 9.1. Trong chuyến

- Dự toán ban đầu, dự toán sau chỉnh, thực chi, khoản đã trả, phần còn dự kiến phải trả và khoản chưa biết giá.
- Theo ngày/hạng mục/địa điểm; tỷ lệ dùng ngân sách, chi trung bình/ngày hoặc/người khi có đủ thông tin phân bổ.
- Tiến độ điểm đã ghé/bỏ/đổi; cảnh báo quá giờ, thay đổi và lý do.
- Dự báo phần còn lại có khoảng bất định, không khẳng định đủ tiền khi thiếu giá.

### 9.2. Toàn bộ lịch sử

- Số chuyến theo trạng thái, ngày đi, địa điểm đã ghé, tổng thực chi theo tháng/năm và hạng mục.
- So sánh dự toán/thực tế của chuyến hoàn thành, nhóm sở thích, phản hồi và gợi ý chuyến mới.
- Bộ lọc thời gian/điểm đến/trạng thái/tiền tệ; xuất CSV có mô tả cách tính.
- Không cộng các tiền tệ khác nhau trực tiếp, không cộng cùng khoản đặt trước hai lần, không coi chưa nhập chi tiêu là tiết kiệm 100%.
- Thống kê tài khoản chỉ dùng chuyến của chủ tài khoản, mặc định riêng tư; tránh đếm trùng chuyến sao chép hoặc hủy theo định nghĩa chỉ số.

## 10. Kiến trúc và mô hình dữ liệu

Giữ kiến trúc tách lớp hiện có, cải tạo dần thay vì viết lại toàn bộ:

- `contracts`: schema User/Profile/Session, Trip/Leg/Day/ItineraryItem, PlaceReference, Expense, ChangeEvent, Recommendation/Feedback, Statistics; version và migration.
- `core`: ngày/múi giờ, ngân sách, lịch trình, điểm khóa, khả thi, nearby score, diff và thống kê. Không import AI/UI.
- `data`: repository/transaction/migration, adapter POI/geocode/opening hours; metadata nguồn, hạn lưu và độ tin cậy theo trường.
- `ai`: parse nhu cầu, chọn ứng viên, giải thích, OCR; structured output và fallback. Không tự cộng tiền hay tạo dữ liệu giả.
- `app/api`: auth/profile, trip CRUD/state transition/revisions, item CRUD/reorder, expense CRUD/confirm, import Maps, nearby/recommend/replan, statistics; xác thực và Zod.
- `ui/hooks`: toàn bộ giao tiếp API, trạng thái tải/lỗi/retry; component nhận props và callback.
- `design/ui`: tokens dùng chung, mobile-first, input có label, focus/keyboard, bảng/chart có dữ liệu dạng text thay thế.

Thực thể lưu trữ dự kiến: Users, Profiles, Sessions, Trips, TripLegs, ItineraryItems, UserPlaceReferences, Expenses/Allocations, Revisions/Events, RecommendationFeedback, GenerationJobs. Tách nội dung được provider cấp khỏi bản ghi người dùng tự tạo; áp dụng chính sách lưu từng nguồn. DB cần transaction, migration, backup/restore, kiểm thử cập nhật đồng thời. Chốt engine theo hosting trước bước tích hợp; không triển khai JSON làm storage tài khoản production.

Mọi lệnh ghi có trip version/idempotency thích hợp. Không tin userId từ request. Xóa địa điểm và sửa lịch không phá dữ liệu chi tiêu lịch sử; xóa chuyến có xác nhận, quy trình phục hồi/xóa dữ liệu được đặc tả rõ trước thực hiện.

## 11. Backlog và mốc triển khai

| Mốc | Công việc | Đầu ra và tiêu chí đạt |
|---|---|---|
| M0 — Chuẩn hóa phạm vi/test | Cập nhật AGENTS/docs theo yêu cầu mới; xác định repo gốc; cô lập dữ liệu test; tạo test tái hiện TV-01/02/03/04; thiết kế contract/DB/state machine | Test lặp lại được, không tác động dữ liệu thật; thiết kế và migration dry-run review được |
| M1 — Auth và nền dữ liệu | DB/repository, auth/session/ownership, schema, register/login/logout/profile, chặn demo production; migration dữ liệu cũ | Hai tài khoản không truy cập chéo; phiên hết hạn/logout đúng; sai kiểu trả 400; đăng ký/đăng nhập thật qua UI và API |
| M2 — Chuyến linh hoạt | Bỏ 2–7 toàn hệ thống, ngày/chặng/timezone, guest storage/version, lưu tải trip, lifecycle và nhật ký | Đi trong ngày và 8/14/30 ngày hoạt động; reload giữ nguyên plan/ledger; danh sách đang đi/hoàn thành đúng; trip dài có job tiến trình |
| M3 — Sửa hành trình/địa điểm | Item CRUD/reorder/lock, import Maps/manual, kiểm trùng/giờ, revisions/undo/diff, quyền API và xử lý URL an toàn | Thêm/sửa/xóa/reorder lưu thật; xóa điểm không mất chi tiêu; URL thiếu dữ liệu có xác nhận, không tạo tọa độ giả |
| M4 — Chi tiêu và thống kê | Expense CRUD/allocations, giá và đặt trước minh bạch, OCR confirm/fallback, thống kê trip/account/CSV | Tổng đúng sau sửa/xóa, không trùng bill, không trộn trip/tiền tệ; biểu đồ khớp core; OCR không tự ghi sổ |
| M5 — AI đồng hành | Nearby, trạng thái đóng cửa, xếp hạng, replan phần chưa đi, explanations/feedback, cá nhân hóa/chuyến tiếp theo | Kịch bản đóng cửa/trễ giờ/đổi tuyến có phương án hợp lệ và preview; không sửa điểm đã đi/khóa; không key vẫn fallback rõ |
| M6 — Hoàn thiện UI và tích hợp thật | Đồng bộ trang công khai/planner/hồ sơ/dashboard, responsive/accessibility, email phục hồi, Places/AI/OCR live có quota | Không nút demo giả chức năng; không tràn ở kích thước mục tiêu; API mất mạng có phục hồi; bằng chứng live và giới hạn rõ |
| M7 — Đánh giá đồ án/phát hành | E2E production, security/ownership/concurrency, eval AI/OCR, load, backup/restore, tài liệu và demo bảo vệ | Báo cáo có baseline/metrics/lỗi còn lại, không còn lỗi nghiêm trọng/cao ở luồng lõi, staging review được và rollback đã thử |

Giao diện và test được làm trong từng mốc; M6 là vòng đồng bộ/nghiệm thu, không đợi đến cuối mới dựng UI. Thứ tự bắt buộc: M0→M1→M2→M3; M4/M5 dùng nền trip ổn định; M6/M7 hoàn thiện các phụ thuộc. Chưa ấn định lịch hoàn thành do chưa có hạn bảo vệ, hosting và ngân sách API; không coi số tuần ước đoán là cam kết.

## 12. Đánh giá AI cho đồ án

Câu hỏi nghiên cứu: gợi ý có phù hợp sở thích hơn baseline; replan có giữ ràng buộc và giảm ảnh hưởng khi đóng cửa/đổi tuyến; OCR có giảm công nhập liệu mà vẫn giữ tính đúng sau xác nhận?

Thiết kế so sánh:

1. Baseline quy tắc/điểm gần nhất có lọc ràng buộc.
2. Xếp hạng kết hợp sở thích và ràng buộc.
3. Phương án kết hợp AI hiểu yêu cầu/chọn ứng viên + core kiểm chứng.

Tạo tập train/dev/test hoặc dev/test phù hợp phương pháp sử dụng; nếu dùng mô hình có sẵn phải ghi rõ không tự huấn luyện mô hình nền. Tránh trùng người dùng/chuyến/POI gây rò rỉ giữa phần hiệu chỉnh và đánh giá. Cố định snapshot, phiên bản mô hình, prompt, seed khi khả dụng, thời điểm và nguồn.

| Nhóm | Chỉ số cần đo |
|---|---|
| Parse | Độ đúng trường dữ liệu, nhận ra thiếu thông tin, schema-valid rate |
| Recommendation | Precision@K/NDCG@K khi có nhãn phù hợp, đa dạng, tỷ lệ chấp nhận/đánh giá người dùng |
| Replan | Tỷ lệ giữ ràng buộc, tránh điểm đóng cửa đã biết, giữ điểm khóa/đã đi, độ lệch tuyến/thời gian/chi phí và số điểm bị đổi |
| Độ tin cậy | Tỷ lệ POI/giá/giờ không có nguồn, dữ liệu thiếu được báo đúng, tỷ lệ fallback |
| OCR | Độ đúng tổng tiền/tiền tệ/ngày, sai số số tiền, tỷ lệ phải sửa tay, thời gian xác nhận |
| Vận hành | Độ trễ p50/p95, số lượt gọi/chi phí mỗi tác vụ, timeout/quota và tỷ lệ phục hồi |

Đề xuất tập test tối thiểu để lập kế hoạch nguồn lực: 100 yêu cầu ngôn ngữ tự nhiên, 50 tình huống thích ứng, 30–50 bill giả lập hoặc được phép sử dụng, đánh giá sử dụng với 10–15 người nếu tuyển được. Đây là mục tiêu thu thập, chưa phải dữ liệu đã có; cần điều chỉnh theo pilot và khả năng gán nhãn. Tách test adversarial với ví dụ thông thường, công bố lỗi thay vì chỉ báo tỷ lệ tổng.

Các điều kiện đúng bắt buộc: tiền/tổng tính bằng core, không lưu bill trước xác nhận, không áp dụng plan vi phạm ràng buộc cứng đã biết, không bịa địa điểm/nguồn, không lộ key hay truy cập chéo tài khoản. Mục tiêu chất lượng mềm chốt sau pilot; không viết trước kết quả đạt.

## 13. Ma trận nghiệm thu chức năng

1. Đăng ký A/B, đăng nhập/đăng xuất/reload/phiên hết hạn; B không đọc/sửa/xóa dữ liệu A.
2. Đi trong ngày, qua đêm, 8/14/30 ngày, đổi timezone/chặng; thêm chi tiêu ngày 8+; ngày không hợp lệ bị chặn, chuyến dài không mất phần đã tạo khi timeout.
3. Guest tạo → sửa → đăng nhập → lưu → mở lại trên phiên khác; không nhập trùng, không chuyển thành mẫu sau reload.
4. Bắt đầu/hoàn thành/hủy chuyến; nhật ký giữ đúng phiên bản, thực chi và phản hồi; có thể sao chép làm chuyến mới.
5. Thêm Maps link dài/short link/URL sai/redirect nguy hiểm/thiếu tọa độ/điểm trùng; có xác nhận, không fetch host tùy ý.
6. Thêm/sửa/xóa/reorder điểm, xung đột giờ, điểm khóa, điểm đã đi, hai tab sửa cùng lúc; xem diff và hoàn tác.
7. Điểm đóng cửa/giờ thiếu/quota provider: có đề xuất khác hoặc thông báo không đủ dữ liệu; chỉ cập nhật phần tương lai sau xác nhận.
8. Cà phê/vui chơi gần điểm được chọn; từ chối quyền vị trí vẫn sử dụng được bằng điểm nhập tay; không trình bày khoảng cách thẳng là thời gian tuyến đường thật.
9. Chi tiêu nhập tay/OCR, bill trùng/nhiều hạng mục/ngoại tệ/sửa/xóa/mất mạng; tổng và thống kê đúng, không mất ảnh nhạy cảm xuống disk.
10. Hồ sơ ngày sinh/giới tính để trống vẫn đầy đủ luồng; thay sở thích làm gợi ý có thể giải thích, không áp định kiến giới.
11. Charts/thống kê: dữ liệu rỗng, nhiều trip, hủy/hoàn thành, giá thiếu, CSV; không coi chưa ghi chi là tiết kiệm.
12. Mobile 360/390/768 và desktop 1440px; bàn phím/label/focus, ảnh và link, print/PDF, production build; không hydration error hoặc tràn toàn trang.

Bộ test phải gồm core/unit, API integration với DB test riêng, E2E production, eval AI/OCR có nhãn, kiểm thử thủ công thiết bị thật và dữ liệu thời gian thực. Test live có budget/timeout và tách khỏi CI thông thường.

## 14. Điều kiện bên ngoài và cơ chế khi thiếu cấu hình

| Phụ thuộc | Cần chuẩn bị | Khi chưa có |
|---|---|---|
| Hosting/DB | Môi trường triển khai, DB, secrets, backup | Chạy dev với DB test/local phù hợp; không coi JSON là production |
| Google Places | Project/key, API bật đúng, billing/quota và quy tắc lưu/attribution | Maps link/manual + OSM/snapshot; giờ hoạt động chưa xác minh được ghi rõ |
| Gemini/OCR | Key server, model, bộ eval và hạn mức | Planner/recommendation theo quy tắc + nhập chi tiêu tay |
| Email | Dịch vụ gửi và URL ứng dụng | Register/login cơ bản chạy, reset/verify được ghi chưa cấu hình, không giả thông báo đã gửi |
| OAuth Google | Client credentials/callback | Không hiển thị nút Google hoạt động giả |
| Vị trí hiện tại | Người dùng chủ động cho phép | Dùng điểm hiện tại do người dùng chọn |

Không cần chờ các key để bắt đầu M0–M3 và chức năng nhập tay. Bổ sung cấu hình là phụ thuộc để nghiệm thu phần tích hợp tương ứng, không phải lý do để để nguyên lỗi bảo mật/persistence.

## 15. Hồ sơ bàn giao và tiêu chí hoàn tất

- Mã nguồn có cấu trúc, migration/version và dữ liệu mẫu phân biệt rõ; không chứa key.
- Hướng dẫn chạy Windows/dev/production, cấu hình API/DB/email, lỗi thường gặp, sao lưu và phục hồi.
- Đặc tả yêu cầu/use cases, mô hình DB, luồng trạng thái, API, kiến trúc AI, mô tả thuật toán và lý do chọn phương pháp.
- Dataset/eval manifest, nhãn và nguồn được phép; baseline, kết quả đo, phân tích lỗi, chi phí/độ trễ và giới hạn.
- Báo cáo kiểm thử thực thi, bằng chứng UI/mobile, kịch bản demo bảo vệ và danh sách phần chưa xác minh.
- Staging dùng dữ liệu thử, tài khoản demo giới hạn ở demo; quy trình triển khai/rollback và migration dữ liệu thật được review trước bước cuối.

Kịch bản demo cuối: đăng ký → tạo chuyến 10 ngày → thêm địa điểm từ Maps → sửa thứ tự → bắt đầu chuyến → báo điểm đóng cửa → AI đưa phương án gần tuyến và giải thích → xem diff/áp dụng → nhập chi tiêu/OCR và xác nhận → xem thống kê → hoàn thành → đăng nhập lại xem nhật ký → nhận gợi ý chuyến mới. Chạy lại kịch bản khi tắt AI/Places phải có fallback trung thực.
