# Trip Vibes V4 – kế hoạch nâng cấp giao diện và logic AI

Ngày: 26/10/2026. Trạng thái: kế hoạch triển khai, chưa phải danh sách tính năng đã hoàn thành. Yêu cầu mới của người dùng ưu tiên hơn phạm vi cũ: tập trung Việt Nam, chọn ngày đi/ngày về, giao diện thống nhất, nhật ký quản lý toàn bộ vòng đời chuyến đi.

## 1. Những vấn đề đã xác nhận từ mã và máy chủ

- B1 có hai preset nhóm bạn/gia đình cùng people=4; trạng thái được chọn so sánh `soNguoi === preset.people`, nên hai thẻ sáng đồng thời.
- `/api/health` máy chủ cổng 3001 trả liveAiEnabled=false, mode=snapshot. `.env.local` có LIVE_AI_ENABLED=true và khóa/model được cấu hình. Phiên chạy kiểm thử được khởi động với biến môi trường ghi đè false; nội dung file không chứng minh trạng thái tiến trình đang chạy. Chưa kiểm chứng khóa có gọi Gemini thành công.
- PlanItemCategory hiện chỉ có Di chuyển/Chỗ ở/Ăn uống/Vui chơi; thiếu ngữ nghĩa riêng cho cà phê, bảo tàng, tham quan và chi phí di chuyển nội vùng.
- B1 còn nội dung gợi ý điểm đến có sẵn dữ liệu đầy đủ. Điều này không phù hợp yêu cầu mới.
- Sidebar nhiều mục quản lý trùng nhiệm vụ; hình thức khu lập kế hoạch khác trang công khai. Những phản ánh về hành trình thiếu hạng mục và chi tiêu bất tiện phải được tái hiện thành ca hồi quy trước khi sửa.

## 2. Kiến trúc thông tin và giao diện

Điều hướng chính: Trang chủ | Trải nghiệm | Lưu trú | Lên kế hoạch | Nhật ký chuyến đi. Khu tài khoản nằm trong menu người dùng, không là một mục chức năng ngang hàng với hành trình.

- Trải nghiệm gộp điểm đến và nội dung khám phá: nơi đến, tham quan, bảo tàng, thiên nhiên, vui chơi, ăn uống, cà phê. Bộ lọc thành phố/tỉnh và loại hoạt động; không tạo nhiều trang danh sách trùng nhau.
- Lưu trú phân biệt hotel, resort, villa, homestay, căn hộ dịch vụ; thêm loại chưa xác định để không đoán theo tên cơ sở.
- Đăng nhập/đăng ký có header/footer dùng chung, nền sáng, thẻ form gọn, báo lỗi ngay tại trường, hiển thị mật khẩu, trạng thái đang gửi và liên kết chuyển form. Khi đăng nhập để lưu phải giữ bản nháp và quay về đúng chuyến; không ngầm tạo chuyến mới.
- Lên kế hoạch dùng cùng khung trang, thương hiệu, độ rộng và typography với Home. Header/footer nhất quán; phần thao tác dài có thanh hành động gọn. Không chuyển sang một ứng dụng có sidebar khác hẳn.
- Nhật ký là điểm vào duy nhất cho các chuyến. Trong một chuyến có các tab Tổng quan | Lịch trình | Chi tiêu & hóa đơn | Thống kê. Tính năng đồng hành nằm trong Lịch trình khi chuyến đang diễn ra. Hồ sơ chỉ còn trang Tài khoản; bỏ mục quản lý hành trình trùng với nhật ký.
- Phong cách theo ảnh người dùng: xanh biển/trắng, ảnh toàn cảnh sáng, chuyển nền mềm, thẻ bo góc vừa phải, đường viền nhẹ, ảnh có tỷ lệ nhất quán, khoảng cách thoáng. Xây một bộ token dùng chung cho Home, form, trang danh sách, chi tiết, xác thực và nhật ký; không chỉ thay riêng banner.
- Giữ nguồn dữ liệu/ngày lấy trong phần chi tiết có thể mở; nguồn ảnh ở trang ghi công. Không sao chép số sao, số lượt đánh giá, giảm giá hay nhãn bán chạy từ mockup nếu không có bằng chứng.

## 3. Form yêu cầu lập kế hoạch

Một form ngắn gồm:

1. Nơi xuất phát và điểm đến trong Việt Nam, tìm theo tên với gợi ý địa lý. Không có bộ chọn 'ngoài danh sách', không quảng cáo 'đủ dữ liệu'. Tra cứu POI/Maps bổ sung đặt tại bước xem và sửa kế hoạch. Gợi ý địa lý chỉ giúp nhập tên, không có nghĩa chỉ được chọn các thành phố snapshot.
2. Ngày đi, ngày về và giờ dự kiến tùy chọn. Tính số ngày/số đêm bằng hàm ngày thuần, tránh lệch múi giờ. Cùng ngày có thể là chuyến đi trong ngày; ngày về trước ngày đi bị chặn. Chuyến dài xử lý theo giai đoạn, không quay lại giới hạn cứng 2–7 ngày.
3. Số khách bằng một bộ tăng/giảm/nhập số. Không có nhóm bạn/gia đình/cặp đôi làm lựa chọn bắt buộc. Trẻ em và số phòng là tùy chọn mở rộng nếu có dữ liệu tính giá phù hợp.
4. Tổng ngân sách, lựa chọn quỹ dự phòng, mức ưu tiên cơ bản. Không tự điền lại ngân sách mẫu từ phiên trước.
5. Phương tiện đi xa: tự đề xuất, máy bay, tàu hỏa, xe khách, ô tô cá nhân, xe máy; phương tiện nội vùng: taxi/xe công nghệ, xe máy thuê, ô tô, công cộng, đi bộ. Chặn/gợi ý lại phương tiện không phù hợp tuyến, không giả có tàu hoặc chuyến bay.
6. Ô hội thoại mong muốn thay cho nhóm 'muốn tránh gì'. Ví dụ thích bảo tàng, muốn cà phê đẹp, đi cùng người lớn tuổi, không dậy sớm. AI trích xuất nhu cầu thành các thẻ có thể chỉnh/xóa, hỏi lại thông tin còn thiếu và phân biệt sở thích với điều bắt buộc.

Nút chính tạo bản đề xuất, hiển thị tiến trình thu thập dữ liệu → hiểu nhu cầu → xếp lịch → kiểm tra lịch/chi phí. Hủy/tạo lại không xóa bản đã lưu.

## 4. Ngân sách tham khảo và chi phí thực tế

Tỷ lệ người dùng đưa là các khoảng tham khảo, không thể cộng toàn bộ cận trên vì vượt 100%. Preset mặc định cho phần chi phí cơ sở: đi xa 40%, lưu trú 25%, ăn uống/cà phê 15%, nội vùng 7%, tham quan/vui chơi 8%, mua sắm 5% = 100%. Cho phép chỉnh ưu tiên; chuyến không lưu trú hoặc không đi xa sẽ phân bổ lại minh bạch.

Quỹ dự phòng là phần cộng trên chi phí cơ sở. Nếu tổng tiền người dùng nhập đã là giới hạn trọn gói B và chọn dự phòng r, chi phí cơ sở = B/(1+r), dự phòng = B - chi phí cơ sở. Nếu người dùng nhập chi phí cơ sở, tổng cần chuẩn bị = cơ sở × (1+r). Giao diện phải ghi rõ chế độ; không cộng hai lần hoặc âm thầm vượt ngân sách. Các khoảng 10–15% là lựa chọn tham khảo, không là cam kết chi phí thực tế.

- Tách số tiền mục tiêu, dự toán theo dữ liệu và đã trả. Tỷ lệ tạo mục tiêu phân bổ, không tạo ra giá vé/giá phòng có thật.
- Giá chưa biết không tính là 0/miễn phí. Tổng hiển thị 'phần đã có giá' và số hạng mục chưa xác nhận; không khẳng định còn dư an toàn khi thiếu giá.
- Ăn uống/cà phê có thể chung nhóm ngân sách nhưng lịch trình vẫn có loại riêng. Mua sắm và dự phòng không phải điểm dừng bắt buộc.
- Tính toán tại core, làm tròn tiền có quy tắc, tổng các nhóm bằng tổng cơ sở. Không để mô hình AI cộng tiền.

## 5. Pipeline AI và dữ liệu trong nước

Luồng: yêu cầu đã xác thực → AI hiểu hội thoại → thu thập danh sách địa điểm có nguồn → lọc ràng buộc → AI chọn/xếp các ID hợp lệ → core xếp thời gian/tính tiền → kiểm định → sửa hoặc trả gợi ý cần người dùng quyết định.

AI phải tạo khác biệt nhìn thấy được: hiểu nhu cầu, chọn loại trải nghiệm, giải thích lựa chọn, thay đổi lịch theo hội thoại, đề xuất thay thế khi điểm đóng cửa/bỏ qua, giữ các mục đã khóa. Các thay đổi qua hội thoại phải có xem trước và xác nhận; không tự ghi chi tiêu hoặc xóa lịch đã lưu.

- Mở rộng nội địa theo đợt: củng cố Đà Nẵng, Hà Nội, Đà Lạt; tiếp đến Huế, Hội An, Nha Trang, TP.HCM, Hạ Long; sau đó Cần Thơ, Sa Pa, Phú Quốc nếu nguồn truy vấn/kiểm chứng đạt. Đây là danh sách ưu tiên thu thập, không tuyên bố đã hỗ trợ đầy đủ.
- Bỏ nước ngoài khỏi danh sách đề xuất và tạo chuyến mới. Chuyến quốc tế đã lưu vẫn đọc/xuất được; không xóa dữ liệu người dùng cũ.
- Mỗi nơi có ID, tọa độ, loại/subtype, nguồn, ngày lấy, thời lượng, giá/mức tin cậy, giờ mở cửa khi có, ảnh được phép dùng. Không suy đoán chắc chắn còn mở khi không có giờ.
- Bảo tàng, danh thắng, khu du lịch, khu vui chơi, công viên, quán cà phê phải xuất hiện trong ứng viên và lịch theo nhu cầu, không ép đủ mọi loại vào mọi chuyến. Nếu thiếu dữ liệu, nêu rõ và cho bổ sung ở bước xem kế hoạch.
- Không lấp đầy lịch bằng bữa ăn giả hoặc lặp một địa điểm cho đủ ngày. Tách thời gian tham quan và thời gian di chuyển, tính tuyến theo phương tiện đã chọn; dữ liệu chưa có dùng ước tính có nhãn.
- Không coi snapshot là mẫu lịch trình: snapshot là danh mục nguồn dự phòng. AI có thể sử dụng dữ liệu mới có nguồn khi dịch vụ cho phép; vẫn tuân thủ Nominatim 1 yêu cầu/giây và cache.
- Google Maps trong kế hoạch: tìm vị trí, mở chỉ đường, nhập URL/tọa độ được xác nhận. Không thu thập trái phép ảnh/đánh giá, không hứa đọc được mọi link rút gọn khi không thể phân giải.

Hai chế độ vận hành riêng: kiểm thử tự động/UI luôn LIVE_AI_ENABLED=false; trình diễn AI bật trên tiến trình được cấu hình riêng và có kiểm tra thực tế khóa, timeout, quota, schema đầu ra. Thêm trạng thái AI an toàn ở trang kiểm tra hệ thống; không lộ khóa. Mỗi kết quả lưu phương thức và lý do fallback. Không bật nhãn 'AI' chỉ vì có khóa trong file.

## 6. Kế hoạch, nhật ký và đồng hành

- Trang xem kế hoạch có hero vừa phải, ngày đi/về, số khách, phương tiện; danh sách theo ngày thể hiện đầy đủ di chuyển, lưu trú, ăn uống, cà phê, tham quan và trải nghiệm.
- Di chuyển ghi tên phương tiện, điểm đầu/cuối, giờ và thời lượng; giá vé là tham khảo nếu chưa có báo giá. Kiểm tra không xếp hai việc cùng giờ, không đặt bữa tối sau thời gian phải rời điểm đến.
- Lưu trú nhiều đêm là một booking liên kết các ngày; không tính lại toàn bộ tiền phòng mỗi ngày.
- Tóm tắt tổng kế hoạch rõ tiền đã có giá/tiền chưa biết. Thông tin nguồn, phương thức tạo, lý do dự phòng và lưu ý đặt sau tóm tắt; cảnh báo chặn an toàn vẫn phải hiện sát thao tác liên quan.
- Nhật ký khách chỉ mời đăng nhập hoặc lập bản nháp. Tài khoản mới có trạng thái trống thật. Mỗi chuyến có draft/planned/ongoing/completed/cancelled và các hành động chuyển trạng thái hợp lệ.
- Trong chuyến đang đi, mặc định hiển thị toàn bộ ngày hiện tại, chọn ngày khác hoặc toàn bộ chuyến; loại hạng mục chỉ là bộ lọc, không làm mất phần lưu trú/di chuyển/ăn uống.
- Mỗi điểm có trạng thái chưa đến/đã đến/bỏ qua/đóng cửa. Đánh dấu đã đến không có nghĩa đã thanh toán. Đề xuất thay thế dùng vị trí/ngày/khung giờ/nhu cầu còn lại, không xáo trộn mục đã hoàn thành.
- Chi tiêu nhanh ngay tại hạng mục: tạo khoản từ dự toán, sửa số tiền, xác nhận đã trả. Có chụp/chọn ảnh bill → AI trích xuất → người dùng xác nhận → ghi sổ; vẫn có nhập nhanh khi không có bill. Không tự coi giá dự toán là tiền thực tế.
- Chống ghi trùng khi bấm hai lần hoặc đọc lại cùng bill; khoản chi có liên kết hạng mục, category, ngày, người nhập, trạng thái xác nhận. Ảnh hóa đơn chỉ xử lý trong bộ nhớ.
- Ngân sách rút gọn còn tổng giới hạn, đã chi, dự toán còn lại, dự phòng và nhóm vượt mục tiêu; bỏ bảng chênh lệch -100% vô nghĩa khi chưa phát sinh khoản chi. Khi cần mới mở chi tiết đối chiếu.
- Hoàn thành chuyến giữ lịch cuối cùng, nơi thực sự đã đến và chi tiêu đã xác nhận. Thống kê không cộng bản nháp chưa lưu hoặc hóa đơn chưa xác nhận.

## 7. Backend và migration

Contracts V18 dự kiến: TripRequest có khoảng ngày/giờ và phương tiện đi xa/nội vùng; sở thích hội thoại có bản cấu trúc; Place có subtype và Accommodation có accommodationType; PlanItem có stable ID, nhóm trải nghiệm, đoạn tuyến, thời gian, priceStatus; BudgetAllocation/ReservePolicy tách khỏi ActualExpense; generation metadata ghi AI/fallback và nguồn ứng viên.

- Lập migration từ schema 17, tăng version khi đổi dữ liệu. Chuyến cũ thiếu ngày cần người dùng xác nhận trước tính giờ mới, không tự gán ngày hôm nay. Subtype chưa biết giữ unknown. Giữ ID để bill/visited/locked không mất liên kết khi sửa kế hoạch.
- API theo nhiệm vụ: chuẩn hóa yêu cầu hội thoại, tạo kế hoạch, xem trước/sửa kế hoạch, tìm ứng viên gần, lifecycle chuyến, ghi/xác nhận/sửa/xóa chi tiêu và thống kê. Chỉ gọi nhà cung cấp AI phía server.
- SQLite có transaction, ownership tài khoản, phiên đăng nhập, revision để tránh ghi đè hai tab, idempotency cho ghi bill/chi phí. Backup trước migration; thử nâng cấp/rollback trên bản sao.
- UI chỉ gọi API qua hooks; component nhận props. Core độc lập AI/UI, tiền/thời gian tại core, assumptions/flags tập trung. Không mở đường gọi Gemini trực tiếp từ trình duyệt.

## 8. Thứ tự triển khai và điều kiện hoàn thành

| Đợt | Công việc và đầu ra | Điều kiện nghiệm thu |
|---|---|---|
| 1 – Chốt luồng | Sơ đồ màn hình, states, danh sách trường và wireframe Home/form/plan/nhật ký/auth | Không còn mục trùng nhiệm vụ; mỗi trạng thái guest/account/draft có đường đi rõ |
| 2 – Dữ liệu nền | Contracts V18, migration, date/transport/budget pure functions, taxonomy nội địa | Chuyển được bản dữ liệu cũ trên bản sao; không sai tổng, lệch ngày hoặc mất ID |
| 3 – Khung giao diện | Tokens, header/footer chung, auth, hợp nhất trải nghiệm/lưu trú, responsive | Home → auth → form → plan nhất quán; không tràn ngang ở 360/390/768/1280/1536px |
| 4 – Tạo kế hoạch AI | Form mới + chat nhu cầu, pipeline chọn ID hợp lệ, xếp lịch, phương tiện, hoạt động/cafe | Có test AI thật có kiểm soát và fallback; không tạo địa điểm/giá ngoài ứng viên |
| 5 – Nhật ký thống nhất | Lifecycle, timeline đầy đủ, đổi điểm đóng cửa, chi tiêu nhanh/OCR/thống kê | Đánh dấu đã đến không tự ghi tiền; bill cần xác nhận; không mất hạng mục |
| 6 – Mở rộng và nghiệm thu | Nội địa theo đợt, dữ liệu lưu trú phân loại, ảnh, hồi quy, tài liệu bảo vệ | Không dữ liệu test trong tài khoản thật; báo cáo rõ phần chưa có nguồn/giá/ảnh; quay lại được luồng từ đầu đến cuối |

Không chốt thời gian giả định trước khi đo khối lượng dữ liệu và migration. Mỗi đợt bàn giao được chạy và xem được, tránh vừa thay schema vừa vá màn hình trên dữ liệu thật.

## 9. Ma trận kiểm thử cần thực hiện

- Guest và account mới: không mẫu, không dữ liệu người khác; đăng nhập/đăng xuất/đăng ký giữ đúng bản nháp và return path.
- Form: một lựa chọn số khách; ngày về không trước ngày đi; qua tháng/năm; đi trong ngày; chuyến dài; giờ đến/về giới hạn lịch; không có một tuyến phương tiện không tồn tại bị coi là đã xác nhận.
- Budget: tổng mục tiêu 100%, reserve không tính hai lần, tổng tiền làm tròn khớp, không kết luận miễn phí/dư tiền khi giá chưa biết, không cộng phòng nhiều lần.
- AI: câu yêu cầu tự nhiên, thiếu thông tin, provider timeout/429/khóa không hợp lệ, output sai JSON/ID, sửa theo hội thoại, khóa hạng mục, cần cà phê/bảo tàng, điểm đóng cửa; đánh giá ràng buộc, đa dạng, đúng giờ, giải thích và đúng nguồn.
- Timeline/expense: đầy đủ mọi loại, lọc/ngày không mất mục; bill đọc sai cần sửa; gửi trùng/reload không nhân đôi chi phí; sửa/xóa khoản chi cập nhật thống kê; status ongoing/completed nhất quán.
- Security/data: schema validation, ownership, expired session, request retry/conflict, không lộ key, không lưu ảnh bill/log nhạy cảm, migration trên bản sao.
- UI thật: desktop/tablet/mobile, bàn phím, lỗi form, loading/empty/error, ảnh vỡ và caption, contrast, header/footer auth, back/refresh/deep link. Chỉ đánh dấu đạt sau khi có bằng chứng; 510 test V3 không thay thế kiểm thử V4.
