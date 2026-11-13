# Trip Vibes — kết quả nâng cấp V4

Ghi nhận ngày 27/10/2026, chạy trên máy Windows hiện tại. Phiên bản hợp đồng dữ liệu: **18**. Đây là báo cáo phạm vi đã triển khai và kiểm tra, không phải cam kết mọi thông tin của mọi cơ sở đã được xác minh.

## Giao diện và luồng sử dụng

- Trang chủ, trải nghiệm, lưu trú, đăng nhập/đăng ký và khu vực lập kế hoạch dùng điều hướng, header/footer chung. Trang chủ có nền minh họa mới cùng các nhóm tham quan, ăn uống, cà phê và lưu trú.
- Điểm đến và trải nghiệm được gom trong khu vực Trải nghiệm. Các lựa chọn khám phá trên trang chủ lấy dữ liệu nguồn, phân bổ giữa các địa phương.
- Biểu mẫu yêu cầu dùng ngày đi/ngày về, một trường số người, phương tiện đi xa và tại điểm đến, ngân sách/dự phòng, cùng hộp chat mong muốn. Không dùng hai thẻ nhóm cùng được chọn vì trùng số người.
- Nhu cầu → lập kế hoạch → xem tổng quan/chỉnh sửa → lưu nhật ký sau đăng nhập → bắt đầu chuyến đi → theo dõi toàn bộ hạng mục, ghi chi tiêu → hoàn thành và xem lại nhật ký.
- Nhật ký khách chưa đăng nhập hiển thị lời mời đăng nhập; không tự xuất hiện chuyến Đà Nẵng 10 ngày hoặc lịch trình thử.
- Hành trình, chi tiêu/hóa đơn và ngân sách nằm trong các phần của chuyến đi. Hành trình hiển thị cả di chuyển, lưu trú, ăn uống, cà phê và tham quan.
- Nút ghi chi từ hành trình điền sẵn nội dung, hạng mục, ngày và số tiền dự kiến để người dùng kiểm tra. Không tự coi đánh dấu hoàn thành là đã thanh toán.
- Thông tin cách lập, nguồn và cảnh báo được đặt sau phần tổng dự toán. Không đặt nguồn ảnh đè lên ảnh; ghi công tập trung tại trang nguồn ảnh.

## Logic đã sửa

- Ngày đi/về được kiểm tra, suy ra số ngày/đêm; không khóa sản phẩm ở 2–7 ngày. Bản local có giới hạn tài nguyên 90 ngày/lượt lập tự động; lịch trình thủ công hỗ trợ dài hơn.
- Phân bổ tham khảo 40/25/15/7/8/5 cho di chuyển xa/lưu trú/ăn uống/di chuyển nội địa/trải nghiệm/mua sắm. Dự phòng cộng trên phần chi phí cơ sở; tổng đầu vào bao gồm dự phòng, không cộng trùng.
- Phương tiện người dùng chỉ định được giữ khi chọn ứng viên. Di chuyển nội bộ có loại phương tiện, thời gian và chi phí ước tính.
- Sửa lỗi ngày chi tiêu lùi về ngày UTC hôm trước; khoản chi từ hành trình theo ngày tương ứng của chuyến đi.
- Sửa cộng trùng vé/phòng trong tổng ngân sách đồng hành; đó là một phần của thực chi.
- Không hiển thị bảng chênh lệch -100% hoặc nạp khoản chi mẫu khi sổ chưa có dữ liệu.
- Giá vé chưa rõ được phân biệt với miễn phí. Dự toán hiện có và số khoản chưa có giá được trình bày riêng.
- Chọn đúng chặng đi/về thay vì nhầm một chặng taxi nội bộ. Giờ đến qua đêm được hiển thị theo đồng hồ, có cảnh báo chặng về đến sau ngày khởi hành.
- Tránh đề xuất nhiều mảnh OSM cùng tên như các điểm tham quan khác nhau; giữ nguyên bản ghi nguồn để đối chiếu.

## Dữ liệu đã thu thập

**668 bản ghi nguồn** tại sáu địa phương:

| Địa phương | Bản ghi |
| --- | ---: |
| Đà Nẵng | 60 |
| Hà Nội | 60 |
| Đà Lạt | 60 |
| Huế | 60 |
| Nha Trang | 103 |
| Hội An | 325 |

Có 100 hotel, 2 resort, 1 villa, 1 homestay, 17 nhà khách, 1 căn hộ; 245 nhà hàng, 27 quán ăn, 169 quán cà phê; 19 bảo tàng, 5 khu tưởng niệm, 6 tượng đài, 2 di tích, 47 điểm tham quan, 2 khu vui chơi, 6 công viên, 3 bãi biển, 2 điểm ngắm cảnh, 5 phòng trưng bày và 8 bản ghi chưa xác nhận loại hình. Đây là phân loại theo thẻ nguồn và các đối chiếu bổ sung, không suy diễn chỉ từ chữ “resort/villa” trong tên.

| Trường thông tin | Có dữ liệu | Chưa có |
| --- | ---: | ---: |
| Địa chỉ | 366 | 302 |
| Trong đó địa chỉ cụ thể | 351 | — |
| Điện thoại | 127 | 541 |
| Website | 82 | 586 |
| Giờ hoạt động theo nguồn | 130 | 538 |
| Mô tả theo nguồn/đối chiếu | 23 | 645 |

- Tên giữ theo nguồn, chuẩn Unicode; ưu tiên tên tiếng Việt chính thức nếu nguồn có. Không tự điền tên, địa chỉ gần nhất hay tọa độ giả.
- Maps dùng tên + địa chỉ thực có + địa phương; không đưa cặp tọa độ trần làm đích hiển thị. Bản ghi thiếu địa chỉ vẫn tìm theo tên và địa phương, chưa bảo đảm xác định duy nhất chi nhánh cùng thương hiệu.
- Bốn hồ sơ được đối chiếu bổ sung: Emerald Hoi An Riverside Resort, Bel Marina Hoi An Resort, Hoi An TNT Villa, D Central Hoi An Homestay. TNT Villa bán theo phòng, không được mặc định là thuê nguyên căn.
- Đã thử đối chiếu 79 bản ghi có website công khai. 13 bản ghi website lỗi DNS được đánh dấu và không hiện như liên kết đang hoạt động. Các trang không có dữ liệu có cấu trúc phù hợp được giữ trạng thái chưa xác minh.
- Không tự gán địa chỉ trụ sở/chi nhánh đầu tiên cho một thương hiệu có nhiều chi nhánh. Hoi An Roastery được đưa vào diện cần đối chiếu riêng, không nhập địa chỉ chi nhánh vào bản ghi chưa xác định.
- Các ID OSM có thể mô tả nhiều thành phần của cùng một địa điểm hoặc các chi nhánh cùng tên. 668 là số bản ghi nguồn, không phải 668 cơ sở đã được kiểm định thủ công.
- Chỉ hiển thị số sao lưu trú khi nguồn có; không coi đó là điểm đánh giá Google. Theo lựa chọn của bạn, bỏ qua lấy sao Google khi chưa có Places API; thay bằng liên kết xem đánh giá trên Google Maps.

Báo cáo máy đọc được: [chất lượng dữ liệu](bang-chung/V4-data-quality.json), [kiểm tra website](bang-chung/V4-website-enrichment.json). Các mốc ISO trong báo cáo nguồn dùng UTC.

## AI và bản chạy

- Gemini chỉ gọi phía server; khóa không đưa vào trình duyệt hay mã nguồn.
- Đã truyền ngày cụ thể, phương tiện, mong muốn qua chat và giới hạn sau dự phòng vào ngữ cảnh AI.
- Mỗi công cụ trả tối đa 12 ứng viên sau lọc; các truy vấn độc lập được yêu cầu gọi song song. Dữ liệu công khai vẫn xem được qua bộ lọc/phân trang, không bị xóa vì giới hạn ngữ cảnh AI.
- Cache phân biệt toàn bộ yêu cầu, dữ liệu ứng viên, model và phiên bản prompt. Đổi mong muốn/ngày/phương tiện không dùng nhầm lựa chọn trước.
- Các phép tính nhóm, tiền phòng và ngân sách nằm ở core. Vé chưa có giá gửi sang AI là null, không phải 0 đồng.
- Đếm lượt gọi kể cả khi quá thời gian; cache không được tính như một lượt gọi mới. Khi Gemini lỗi/quá hạn mức/quá thời gian, giữ phương án quy tắc và lý do dự phòng.
- Lượt xác nhận production Hội An: **HTTP 200, phương thức AI, 2 lượt Gemini, 5.032 giây, 18 hạng mục, không có lỗi cứng**. Đó là phép thử tổng hợp, không lưu vào tài khoản hoặc nhật ký người dùng. Xem [bằng chứng AI thật](bang-chung/V4-live-ai-final.json).
- Máy chủ bàn giao dùng production, `LIVE_AI_ENABLED=true`, dữ liệu snapshot để trình diễn ổn định. Không mở cổng ra ngoài máy hiện tại.

## Kiểm thử

- **555/555 kiểm thử** qua, gồm hợp đồng, core, auth, quyền sở hữu chuyến đi, API, dữ liệu, cache, công cụ AI và bộ đánh giá.
- Production build webpack thành công, gồm kiểm tra TypeScript.
- ESLint không có lỗi chặn; còn các cảnh báo cần dọn tiếp trong mã nguồn. Số liệu cuối ghi trong `v4-lint.log`.
- Kiểm tra trực tiếp desktop: trang chủ, đăng nhập có header/footer, nhật ký khách trống, biểu mẫu, luồng tạo/xem/chốt hành trình, đủ các loại hạng mục, điền khoản chi từ hành trình, sổ chi trống, lọc resort và Maps theo tên/địa chỉ.
- Ở viewport desktop đã kiểm tra, không thấy ảnh hỏng hoặc tràn ngang trên Home/danh mục. Kiểm thử UI dùng AI tắt; sau đó mới chuyển sang production và kiểm tra AI qua API.
- Không tạo tài khoản hoặc ghi chi tiêu giả vào cơ sở dữ liệu chính trong lượt QA này. Phiên hành trình thử trên trình duyệt đã đóng.

## Giới hạn cần giữ rõ

1. Chưa có điểm/số lượt đánh giá Google trong ứng dụng, theo yêu cầu bỏ qua bước thiếu khóa API.
2. Các trường thiếu nguồn ở bảng trên còn trống; chưa thể gọi bộ dữ liệu là đầy đủ cho mọi cơ sở hoặc toàn Việt Nam.
3. Giá, thời gian đi đường và giờ mở cửa chưa phải báo giá/tình trạng trực tiếp. Chưa có dữ liệu giao thông hay xác nhận đóng cửa thời gian thực; các điểm thiếu giá chưa được cộng đủ vào dự toán.
4. Cần kiểm tra thêm trên điện thoại thực và thao tác popup lịch native của trình duyệt. Không coi các kiểm tra desktop/API là nghiệm thu mobile đầy đủ.
5. Có 8 bản ghi chưa xác nhận loại hình và một số tên trùng cần xem xét từng cơ sở; không gộp bừa các chi nhánh khác nhau.
6. Production có giới hạn bảo vệ chi phí AI: mặc định 5 lượt lập kế hoạch/IP/giờ và 40 lượt/ngày; khi đạt ngưỡng sẽ dùng dự phòng và ghi lý do.
7. Ảnh minh họa không được coi là ảnh thực đã xác minh của từng cơ sở. Nguồn/ghi công vẫn được lưu.

## Chạy lại trên máy hiện tại

Mở **http://localhost:3001/**. Nếu đang mở tab bản cũ, tải lại bằng Ctrl+F5.

- `CHAY-TRIP-VIBES.cmd`: kiểm tra cổng, build rồi chạy production với AI bật. Giữ cửa sổ khi tự chạy; Ctrl+C để dừng.
- `KIEM-THU-KHONG-AI.cmd`: chạy kiểm thử giao diện với AI tắt. Cần dừng máy chủ đang chiếm cổng trước khi đổi chế độ.
- Không xóa cơ sở dữ liệu tài khoản/nhật ký để xử lý lỗi cổng. Launcher không tự kill các tiến trình Node khác.
- Khi bổ sung dữ liệu nguồn/đối chiếu, cần build lại bản production. Không sửa hoặc đưa khóa trong `.env.local` vào báo cáo/chat.

## Nguồn đối chiếu chính

- [OpenStreetMap API](https://wiki.openstreetmap.org/wiki/API_0.6) và [Nominatim](https://nominatim.org/release-docs/latest/api/Search/).
- [Emerald Hoi An Riverside](https://emeraldhoianriverside.com/), [Bel Marina](https://www.belmarinahoian.com/), [TNT Villa](https://tntvillahoian.vn/).
- [Thông tin cơ sở D Central do cơ sở công bố trên Booking](https://www.booking.com/hotel/vn/d-central-hoi-an-homestay.html), không lấy ảnh hoặc điểm đánh giá.
- [Hoi An Roastery — danh sách chi nhánh](https://hoianroastery.com/).
- [Google: mức suy luận Gemini](https://ai.google.dev/gemini-api/docs/thinking), dùng cấu hình LOW cho Gemini 3 Flash; core vẫn kiểm tra số tiền và ràng buộc.
