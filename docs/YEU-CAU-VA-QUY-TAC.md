# YÊU CẦU VÀ QUY TẮC DỰ ÁN: Trip Vibes

Bản 23/10/2026. Hạn nộp 15/11/2026. Đặt tại `docs/YEU-CAU-VA-QUY-TAC.md`.

## 0. Cách dùng tài liệu này

- Đây là **nguồn sự thật duy nhất**. Khi `AGENTS.md`, `KE-HOACH-LAM.md` hay lệnh cũ mâu thuẫn với tài liệu này thì tài liệu này thắng.
- Mỗi yêu cầu có mã `YC-xx`, mỗi quy tắc có mã `QT-xx`. Giao việc bằng mã, ví dụ: *"Làm theo AGENTS.md và docs/YEU-CAU-VA-QUY-TAC.md. Thực hiện YC-09. Tuân thủ QT-01 đến QT-45."*
- Chỉ **người dùng** được đổi tài liệu này. AI không tự sửa. Mỗi lần đổi ghi vào Phụ lục A (ngày, đổi gì, lý do).
- Nhãn trạng thái: **[CÓ]** đã làm, **[CHƯA]** chưa làm nhưng nằm trong phạm vi, **[HOÃN]** không làm trước 15/11.
- Những chỗ chưa kiểm chứng bằng mã hay lệnh thật được đánh dấu **[chưa xác minh]**.

---

## 1. Sản phẩm

### 1.1 Mô tả

Trip Vibes là **website lập kế hoạch du lịch có giá**. Người dùng chọn điểm đi, điểm đến, số ngày, số người, ngân sách và điều muốn tránh. Hệ thống đưa ra kế hoạch theo ngày (di chuyển, chỗ ở, ăn uống, địa điểm vui chơi) với tổng tiền không vượt ngân sách, hoặc nói rõ vì sao không thể. Người dùng đổi từng phần có xem trước chênh lệch, xác nhận kế hoạch, rồi theo dõi chuyến đi và chi tiêu.

### 1.2 Mục tiêu đồ án

Đồ án AI tốt nghiệp CNTT. Điểm chính cần chứng minh: **AI chọn và hiểu; code tính tiền và kiểm tra**; dữ liệu có nguồn minh bạch; chất lượng được đo bằng bộ đánh giá (eval) với số liệu thật, kể cả ca xấu.

### 1.3 Người dùng và phạm vi sử dụng

Sinh viên, nhóm bạn, cặp đôi, gia đình đi **2 đến 7 ngày**, trong nước và một vài điểm nước ngoài. Dùng trên máy tính và điện thoại. Giao diện tiếng Việt. Dùng ở **chế độ khách** (không tài khoản).

### 1.4 Năm nguyên tắc cốt lõi

1. Tiền và giờ do code tính; AI không cộng tiền.
2. Mọi thay đổi đều xem trước (trước, sau, chênh lệch) rồi mới áp dụng.
3. Mọi số liệu có nguồn; giá ước tính luôn có nhãn.
4. Không hứa tính năng chưa có: chưa làm thì ghi "Sắp có" hoặc không hiện.
5. Luôn có đường chạy khi AI tắt, hết lượt hoặc quá thời gian: kế hoạch lập bằng quy tắc, có thông báo rõ lý do.

### 1.5 Không làm trong đồ án (HOÃN)

Đặt vé và thanh toán thật; tư vấn visa; tài khoản và đăng nhập thật; cộng tác nhóm; dùng offline; đa ngôn ngữ; bản đồ nhúng; điểm đến Phú Quốc (không có snapshot); Tavily; Google Places; bản chat đối chứng; trang "Cách hoạt động" riêng; khối "Tính năng nổi bật".

---

## 2. Yêu cầu chức năng

### 2.1 Cấu trúc website

- **YC-01 [CÓ]** Thanh trên trang công khai: logo "Trip Vibes", **Trang chủ, Điểm đến, Khách sạn**, nút "Lập kế hoạch". Không có Đăng nhập, không có "Cách hoạt động", không có "Tính năng nổi bật".
- **YC-02 [CÓ]** Hai khu: trang công khai (`/`, `/diem-den`, `/diem-den/[slug]`, `/khach-san`, các trang giới hạn, nguồn, điều khoản) và khu lập kế hoạch (`/lap-ke-hoach`). Logo ở khu lập kế hoạch dẫn về `/`.
- **YC-03 [CÓ]** Chế độ khách: không hiện tên người dùng, avatar, chuông thông báo, thẻ người dùng.
- **YC-04 [CÓ]** Chân trang gọn 3 cột; có dòng nguồn "Dữ liệu: OpenStreetMap contributors" và ngày dữ liệu; có liên kết "Giới hạn dữ liệu"; khi có ảnh thì có liên kết ghi công ảnh.

### 2.2 Trang chủ

- **YC-05 [CÓ]** Hero tiêu đề trung tính (không dùng chữ "AI", "thông minh"), kèm thanh tìm: Đi từ (danh sách), Đến (danh sách), Số ngày 2 đến 7, Số người, Ngân sách, nút "Lập kế hoạch". Giá trị được chuyển sang B1 đã điền sẵn.
- **YC-06 [CÓ khung, CHƯA ảnh]** Khối "Điểm đến": thẻ có ảnh minh họa, tên, quốc gia, mô tả một câu, nút "Xem điểm đến". Chỉ hiện điểm đến có snapshot hợp lệ.
- **YC-07 [CÓ]** Khối "Khách sạn tham khảo" lấy từ snapshot, liên kết sang `/khach-san`.
- **YC-08 [CÓ]** Một dải minh bạch một dòng: nguồn dữ liệu, giá là ước tính, liên kết "Giới hạn dữ liệu".

### 2.3 Trang Điểm đến

- **YC-09 [CÓ khung, CHƯA ảnh]** `/diem-den` (lưới) và `/diem-den/[slug]` (dựng sẵn từ snapshot): ảnh hero, mô tả (nội dung biên tập trong `mo-ta-diem-den.json`, cần người dùng rà soát), địa điểm vui chơi (tối đa 12), quán ăn (6), cà phê (6), khách sạn (6), liên kết "Xem trên Google Maps", nút "Lập kế hoạch đi X" mở khu lập kế hoạch đã điền sẵn điểm đến. Không có sao đánh giá.

### 2.4 Trang Khách sạn

- **YC-10 [CÓ khung]** `/khach-san`: chọn điểm đến bằng danh sách; lưới khách sạn từ snapshot gồm tên, số sao (nếu có), giá mỗi đêm có nhãn "ước tính" (dùng hàm giá của core), khu vực, "Xem trên Google Maps", nhãn nguồn. Có lọc theo số sao và sắp xếp theo giá. Không bịa đánh giá.

### 2.5 Khu lập kế hoạch

- **YC-11 [CÓ]** Menu trái chỉ có hai mục: "Lên kế hoạch" và "Nhật ký chuyến đi" (khóa, kèm một dòng chú thích, cho tới khi có kế hoạch được xác nhận). Không có "Cài đặt", "Ngân sách" trong menu.
- **YC-12 [CÓ]** B1 gồm 5 bước: (1) Điểm đi, điểm đến **chọn từ danh sách**, không nhập tay, không nút "Tìm"; (2) Số người 1 đến 10; (3) Ngân sách tổng hoặc mỗi người; (4) Thời gian **2 đến 7 ngày**; (5) Điều muốn tránh (không dậy sớm, không đi đêm, tránh đi lâu, tránh chỗ đông, tránh đi bộ nhiều). Ô ghi chú chỉ hiện khi AI bật. Thanh dưới chỉ có một dòng tóm tắt và nút "Lập kế hoạch", lý do bị tắt là một câu ngắn.
- **YC-13 [CÓ]** Lỗi form hiện ngay dưới ô, bằng lời Việt cụ thể (thiếu gì, sai chỗ nào).
- **YC-14 [CÓ]** B2: bước A chuẩn bị dữ liệu (tiến trình thật theo hạng mục); bước B lập kế hoạch. Có nút Hủy. Lỗi thân thiện, có "Thử lại", **không bao giờ nêu tên biến môi trường, tên tệp hay mã lỗi thô**.
- **YC-15 [CÓ]** B3 hiện: tổng tiền, còn lại, 4 hạng mục, từng ngày, nhãn "ước tính", cảnh báo bằng lời Việt, nguồn dữ liệu và ngày, banner khi kế hoạch lập bằng quy tắc, Hoàn tác, Làm lại, Xác nhận.
- **YC-16 [CÓ]** B4, B5 đổi phương tiện và khách sạn. B6 xem trước: bảng trước, sau, chênh lệch; ngày bị ảnh hưởng; "Cảnh báo mới" và "Cảnh báo đã hết"; thay đổi gây vi phạm nặng cần xác nhận riêng.
- **YC-17 [CÓ]** B7 xác nhận: tóm tắt đầy đủ, cảnh báo còn lại, dòng "Trip Vibes không đặt vé thật". Sau khi chốt: Hoàn tác bị khóa; có "Mở lại để sửa".
- **YC-18 [CÓ]** "Hợp gu hơn" chỉ hiện khi AI bật; luôn đi qua B6.

### 2.6 Nhật ký chuyến đi (ba tab)

- **YC-19 [CÓ]** Hành trình (B8, B9): theo ngày, tick địa điểm, tiến độ; chỉ đường qua Google Maps, Apple Maps hoặc sao chép địa chỉ.
- **YC-20 [CÓ]** Chi tiêu (B10): nhập tay luôn có; tab "Ảnh bill" chỉ hiện khi AI bật; số tiền AI đọc **luôn cần người dùng xác nhận** trước khi ghi sổ; sửa và xóa được.
- **YC-21 [CÓ]** Ngân sách (B11): ngân sách, đã đặt trước, đã chi, còn lại; so sánh kế hoạch với thực tế theo hạng mục; dự báo ngày còn lại.

### 2.7 Luật nghiệp vụ lập kế hoạch (do code thực hiện)

- **YC-22 [CÓ]** Số đêm khách sạn = `max(0, soNgay - (floor(giờ đến tuyệt đối / 1440) + 1))`. Giờ đến tuyệt đối = giờ khởi hành chiều đi (phút từ 00:00 ngày 1) + thời lượng. Tổ hợp 0 đêm không khả thi.
- **YC-23 [CÓ]** Mục "Chỗ ở" thuộc **ngày đến**, giờ không sớm hơn 14:00.
- **YC-24 [CÓ]** Ô hoạt động: ngày đầu tối đa 1 ô (09:30 nếu đến trước 08:30; 15:30 nếu đến trước 14:30; ngược lại 0 ô); ngày giữa 2 ô (09:30 và 15:30); ngày cuối 1 ô nếu chiều về khởi hành từ 12:30; khi đến sau nửa đêm chỉ còn các ô sau giờ đến cộng 60 phút. Hoạt động xếp trước giờ đến là **vi phạm nặng**.
- **YC-25 [CÓ]** Cảnh báo nhẹ, hiện bằng lời Việt (không hiện mã): di chuyển chiếm hơn 35% thời gian chuyến; đến hoặc về vào ngày hôm sau (kèm câu nêu số đêm khách sạn thực tính); đến sớm hơn giờ nhận phòng 14:00; sắp hết ngân sách (trên 95%); còn ô trống do ràng buộc. Danh sách mã nằm ở `DANH_SACH_MA_CANH_BAO`; thêm mã phải thêm thông điệp.
- **YC-26 [CÓ]** Vi phạm nặng: vượt ngân sách, hoạt động trước giờ đến, trái điều cần tránh người dùng đã chọn.
- **YC-27 [CÓ]** Phương tiện: ước lượng theo quãng đường chim bay, **tính lúc đọc, không lưu trong snapshot**; nguồn ghi `uoc_luong:khoang_cach:<km>km`; thời gian tàu và xe khách nhân hệ số đường bộ; điểm đến nước ngoài chỉ có máy bay; **tàu chỉ khi cả hai thành phố có ga** theo `src/data/reference/tuyen-tau.json` **[chưa xác minh với dsvn.vn]**.
- **YC-28 [CÓ]** Mức ngân sách tối thiểu (`minBudget`) là phương án rẻ nhất khả thi. Ngân sách nhỏ hơn thì báo mức tối thiểu kèm hai lối ra: nâng ngân sách, bỏ bớt điều muốn tránh.
- **YC-29 [CÓ]** Kế hoạch dự phòng (AI tắt, hết lượt, quá thời gian, không sửa được ngân sách): chọn tổ hợp có **tổng thời lượng di chuyển ngắn nhất** trong ngân sách còn đủ sau dự trữ 10% cho hoạt động; không tổ hợp nào thì dùng phương án rẻ nhất. Luôn chạy `validatePlan` và trả đầy đủ cảnh báo. Giao diện nêu rõ lý do và có "Thử lại bằng AI" khi AI bật.
- **YC-30 [CÓ]** Giới hạn lượt AI: `PLAN_MAX_AI_CALLS` = 8 mỗi lần lập; `PLAN_TIME_BUDGET_MS` = 50.000; `GEMINI_DAILY_CAP` = 40 mỗi ngày; 5 lượt mỗi IP mỗi giờ. Vượt thì dùng kế hoạch quy tắc và nói rõ.

### 2.8 Dữ liệu và ảnh

- **YC-31 [CÓ]** Dữ liệu địa điểm từ OpenStreetMap (Overpass) và Nominatim. Snapshot hợp lệ cho 5 điểm đến: Đà Nẵng, Hà Nội, Đà Lạt, Bangkok, Seoul (ngày 20/10/2026). Mỗi mục có `nguon`, `ngayLay`, `doTinCay`, `giaLaUocTinh`.
- **YC-32 [CHƯA]** Ảnh minh họa cho thẻ điểm đến, trang điểm đến, trang khách sạn, kèm ghi công. Nguồn: xem QT-24.

### 2.9 Vai trò của AI

- **YC-33 [CÓ]** AI **được làm**: hiểu ghi chú thành JSON; chọn từ ứng viên đã lọc theo ngân sách; chọn lại hoạt động theo sở thích; đọc ảnh hóa đơn thành JSON. AI **không được làm**: cộng tiền, đặt giá, tạo khách sạn hay địa điểm, gán cờ cảnh báo, ghi sổ chi tiêu.
- **YC-34 [CÓ]** Khi AI tắt: ẩn ô ghi chú, tab "Ảnh bill", "Hợp gu hơn"; các API cần Gemini trả HTTP 503 với `maLoi: "ai_tat"`; thông báo không chứa tên biến hay tên tệp.
- **YC-35 [CÓ]** Lỗi AI không chặn lập kế hoạch: bỏ qua ghi chú, vẫn lập kế hoạch từ các giá trị người dùng chọn, hiện một dòng nhỏ báo đã bỏ qua.

---

## 3. Yêu cầu phi chức năng

- **NF-01 Hiệu năng.** Kế hoạch bằng quy tắc dưới 3 giây. Lập kế hoạch bằng AI tối đa 50 giây. Trang công khai tải dưới 3 giây trên 4G (mục tiêu mềm, đo bằng Lighthouse).
- **NF-02 Responsive.** Đạt ở 1440, 768, 390; không tràn ngang.
- **NF-03 Truy cập.** Tương phản đạt WCAG AA (`check:contrast`); điều hướng bằng bàn phím; ảnh có `alt`; mỗi trang một `h1`; liên kết "Bỏ qua đến nội dung chính".
- **NF-04 Bảo mật.** Khóa chỉ ở biến môi trường; `/api/health` không lộ khóa; ảnh bill chỉ xử lý trong bộ nhớ, không lưu, không log; không commit `.env*` và ảnh bill thật.
- **NF-05 Riêng tư.** Chế độ test người dùng `?test=1` chỉ chạy khi có đồng ý, ghi cục bộ, không gửi đi đâu.
- **NF-06 Độ tin cậy.** Mọi ghi tệp bọc `try/catch`; lỗi mạng có "Thử lại"; `/demo` trả 404 ở môi trường triển khai.
- **NF-07 Môi trường.** Node từ 20.11 (khuyến nghị 22); Next.js 16.3.8; chạy được trên Vercel với dữ liệu snapshot.
- **NF-08 Bảo trì.** Cổng kiểm tra tự động (QT-26); không có mã nào chỉ để thỏa test.

---

## 4. Quy tắc giao diện

- **QT-01** Website chuyên nghiệp, **không phô trương**: không dùng chữ "AI", "thông minh", "Agent" (trừ chỗ một tính năng thật sự dùng AI, như đọc ảnh hóa đơn); không icon lấp lánh; không khối quảng cáo; không khẩu hiệu thừa.
- **QT-02** Không trang trí: không chữ viết tay, ảnh nền lạc, hình khối, cây, hoa, câu "Good trip, Good mood", thẻ người dùng giả.
- **QT-03** Chọn điểm đi, điểm đến bằng **danh sách thả xuống** (có thể gõ để lọc nhưng chỉ chọn trong danh sách). Danh sách điểm đến lấy từ snapshot hợp lệ, không gõ tay.
- **QT-04** Chỉ icon SVG (lucide-react). **Không emoji** (`check:emoji`).
- **QT-05** Màu, font, cỡ chữ, bo góc, bóng, khoảng cách chỉ lấy từ `src/design/tokens.json` (`check:colors`). Chữ trên ảnh hoặc gradient phải có lớp phủ và đạt tỉ lệ 4,5:1 (`check:contrast`).
- **QT-06** Mọi chuỗi hiển thị bằng tiếng Việt, câu ngắn, nêu việc cần làm. Không lộ mã lỗi, tên biến, tên tệp.
- **QT-07** Mọi ảnh có dòng ghi công (tác giả, giấy phép, nguồn). Chưa có ảnh thật thì dùng nền gradient kèm icon; **không dùng ảnh gần giống**.
- **QT-08** Tính năng chưa có thì ghi "Sắp có" hoặc ẩn; không hứa.
- **QT-09** Mỗi màn hình có một hành động chính. Menu chỉ chứa mục thật sự cần.
- **QT-10** Thiết kế theo phong cách xanh trời đã chọn; font Be Vietnam Pro cho nội dung; Dancing Script nếu dùng thì chỉ cho một cụm chữ nhấn, không dùng cho đoạn văn.

## 5. Quy tắc kiến trúc và mã nguồn

- **QT-11** Năm lớp: `contracts`, `core`, `ai`, `data`, `app/api` cùng `ui`. `ui` không import `ai` hay `data`. `core` là hàm thuần, không import `ai` hay `ui`. Component trong `src/ui/components` chỉ nhận props, không tự gọi API.
- **QT-12** Mọi dữ liệu đi qua zod trong `src/contracts`. Đổi dữ liệu thì tăng `schemaVersion`.
- **QT-13** Hằng số giả định chỉ nằm ở `src/core/assumptions.ts`, ghi rõ cái nào chưa hiệu chỉnh.
- **QT-14** Cờ cảnh báo do code tính (`flags.ts`, `validatePlan.ts`), không để AI gán.
- **QT-15** Không gọi Gemini từ trình duyệt. Không ghi khóa vào mã.
- **QT-16** Trang trong `src/app` (phía máy chủ) được đọc dữ liệu rồi truyền xuống `ui` qua props.
- **QT-17** Không có mã dò môi trường test trong mã sản phẩm; không giữ nhánh tương thích chỉ để thỏa test.
- **QT-18** Mọi biến môi trường mã đọc phải có trong `.env.example` (`check:env`).

## 6. Quy tắc dữ liệu

- **QT-19** Nguồn dữ liệu: OpenStreetMap (Overpass), Nominatim (tối đa 1 yêu cầu mỗi giây, `NOMINATIM_USER_AGENT` có email thật), tỷ giá `open.er-api.com`. Không dùng dịch vụ **bắt buộc** trả phí.
- **QT-20** Mỗi mục có `nguon`, `ngayLay`, `doTinCay`, `giaLaUocTinh`. Không có nguồn thì ghi rõ là ước tính hoặc `null`; không bịa giá, đánh giá, địa điểm.
- **QT-21** Snapshot chỉ do `npm run data:snapshot` ghi; **không viết tay, không sửa tay**, không dùng script tạm ghi vào `src/data/snapshots`; có checksum; không chứa phương tiện ước lượng.
- **QT-22** Không dùng dữ liệu mẫu làm dự phòng ngầm. Dữ liệu mẫu chỉ khi `DATA_MODE=mock` được đặt rõ, và khi đó giao diện hiện dải "DỮ LIỆU MẪU".
- **QT-23** Thứ tự dự phòng: live hoặc cache, rồi snapshot **đúng điểm đến đó**, rồi báo "không đủ dữ liệu" nêu loại thiếu. Không dùng snapshot của điểm đến khác.
- **QT-24** Ảnh chỉ lấy từ: Wikimedia Commons (có liên kết Wikidata hoặc Commons, ghi công tác giả và giấy phép), Unsplash (chọn tay, theo đúng điều khoản API: dùng URL do API trả về, ghi công, báo lượt tải), hoặc ảnh tự chụp. **Cấm** ảnh từ Google, Airbnb, Expedia, Wanderlog, Tripadvisor. Ảnh lưu tệp riêng, không ghi vào snapshot.
- **QT-25** Ảnh hóa đơn thật không vào Git (`eval/bills-real/` nằm trong `.gitignore`).

## 7. Quy tắc kiểm thử và chất lượng

- **QT-26** Cổng kiểm tra trước mỗi commit (`scripts/cong-kiem-tra.ps1`): `npx vitest run` toàn dự án, `typecheck`, `build`, `check:colors`, `check:contrast`, `check:emoji`, `check:env`. Chỉ commit khi cổng đạt.
- **QT-27** **Đáp án test do người dùng đặt: AI không sửa cho khớp mã.** Muốn đổi phải khai báo: tệp, tên test, trước, sau, lý do, loại (A đổi có chủ đích theo chỉ định, B đổi chưa được chỉ định, C test mới, D test bị xóa). Test của người dùng đỏ ngoài các ca đã duyệt thì dừng và báo.
- **QT-28** Số liệu trong báo cáo là **đầu ra nguyên văn của lệnh**, lưu tệp UTF-8 (ghi bằng `[System.IO.File]::WriteAllText` với `UTF8Encoding($false)`; không dùng `Tee-Object` hay `>` vì sinh UTF-16). Không gõ tay lại bảng, không dựng JSON từ trí nhớ.
- **QT-29** Mọi kết quả eval ghi `meta` (`quyTacVersion`, `agentPromptVersion`, `model`, ngày chạy). Kết quả khác phiên bản hiện tại hoặc không ghi phiên bản là **CŨ** và không tính vào tổng hợp.
- **QT-30** Bộ đánh giá: `eval:ai-rate` (các kịch bản có snapshot; Phú Quốc bỏ qua), `eval:bill`, `eval:parse`, `eval:likes`, `eval:repair`, `eval:diadiem`, `eval:data`, rồi `eval:tonghop`. Ca xấu giữ nguyên, không làm đẹp số liệu; ca không đo được (hết lượt, quá thời gian khi 0 lượt AI) tách riêng, không tính là AI thất bại.
- **QT-31** Bộ kiểm tra logic theo kịch bản (`npm run kich-ban`): kiểm các điều bất biến (tổng tiền, số đêm, chỗ ở, hoạt động trước giờ đến, cảnh báo thiếu, cấu hình AI tắt). Chỉ báo lỗi, không tự sửa lõi.
- **QT-32** Test người dùng: 3 người, `?test=1`, có đồng ý, thu JSON và CSV, hỏi 3 câu (dễ dùng 1 đến 5, chỗ khó hiểu, có dùng không).

## 8. Quy tắc làm việc với AI trong IDE

- **QT-33** Mỗi lần giao một nhiệm vụ có mã. AI đọc `AGENTS.md` và tài liệu này trước khi làm.
- **QT-34** **Hạn mức Gemini rất chặt** (khoảng 20 lượt mỗi ngày): chỉ chạy một bộ eval mỗi ngày; gặp 429 thì dừng, không thử lại dồn dập; mọi chỗ khác đặt `LIVE_AI_ENABLED=false`. Không gọi Gemini ngoài nhiệm vụ cho phép.
- **QT-35** Nhánh: việc lớn làm trên nhánh riêng; **chỉ người dùng quyết định gộp vào `main`**. Cấm `git push --force`, `git reset --hard`, `git clean`, xóa hay dời tag và nhánh (trừ ngoại lệ ghi rõ trong lệnh). Tag `core-frozen-5` giữ nguyên.
- **QT-36** Lõi (`src/core`, `src/ai`, prompt, `QUY_TAC_VERSION`, `AGENT_PROMPT_VERSION`, `PLAN_MAX_AI_CALLS`) chỉ sửa khi người dùng cho phép bằng lệnh rõ ràng. Sửa kiểu lint không đổi logic không tính là sửa lõi nhưng phải khai báo và mọi test phải đạt. Sửa lõi phải tăng `QUY_TAC_VERSION` nếu đổi hành vi.
- **QT-37** Mỗi việc tối đa 90 phút. Quá hạn hoặc lỗi sau hai lần sửa thì `git stash push -u` kèm tên, ghi LỖI, sang việc độc lập kế tiếp.
- **QT-38** Ghi tiến độ vào `TIEN-DO.md` sau mỗi việc (giờ, mã, XONG hoặc LỖI hoặc BỎ QUA, mã commit, lý do). Commit chỉ tệp thuộc nhiệm vụ; thông điệp bắt đầu bằng mã nhiệm vụ.
- **QT-39** Báo cáo cho người dùng ngắn (tối đa 8 dòng) kèm tệp bằng chứng; nêu thẳng việc chưa làm hoặc chưa kiểm chứng. Nếu phát hiện báo cáo trước sai, mở đầu bằng "BÁO CÁO TRƯỚC SAI Ở:".
- **QT-40** Cấm: đọc hoặc in nội dung `.env*`; cài thư viện mới khi chưa xin phép; `npm audit fix`; viết tay hoặc sửa tay snapshot và kết quả eval; dựng bảng hay JSON theo trí nhớ.
- **QT-41** Chạy xuyên đêm: bật chế độ tự chạy lệnh; lệnh phải chạy lại được (đọc `TIEN-DO.md`, bỏ qua việc đã xong); lưu lệnh vào `docs/LENH-*.md` để AI đọc lại nếu mất ngữ cảnh; dừng hết máy chủ thử và xác nhận cổng trống khi xong.

## 9. Quy tắc triển khai

- **QT-42** Biến môi trường trên Vercel: `DATA_MODE=snapshot`, `LIVE_DATA_ENABLED=false`, `LIVE_AI_ENABLED=false` (chỉ bật AI khi demo), `GEMINI_MODEL=gemini-3.5-flash-lite` (đặt tường minh), `NOMINATIM_USER_AGENT` có email thật. Không đặt `NEXT_PUBLIC_SHOW_DEMO`.
- **QT-43** Sau mỗi lần triển khai: `/api/health` liệt kê đủ 5 snapshot và không lộ khóa; `/demo` trả 404; chạy `npm run smoke -- <địa chỉ>`.
- **QT-44** Khóa Gemini đã từng lộ trong hội thoại: **người dùng tạo khóa mới và thu hồi khóa cũ**. Không dán khóa vào hội thoại hay lệnh.
- **QT-45** Bộ đếm giới hạn lượt AI nằm trong bộ nhớ nên trên Vercel chỉ là giới hạn tương đối; khuyến nghị tắt AI ngoài buổi demo.

---

## 10. Việc hoãn (không làm trước 15/11)

Đăng nhập và tài khoản thật; chia sẻ chuyến bằng liên kết; cộng tác nhóm; chia tiền nhóm; dùng offline; đa ngôn ngữ; bản đồ nhúng cạnh lịch trình; kéo thả và "Tối ưu lộ trình"; đặt chỗ thật; Phú Quốc; lịch trình mẫu; "Đề xuất điều chỉnh khi lệch ngân sách"; ảnh cho từng địa điểm nhỏ (chỉ làm nếu còn thời gian).

## 11. Giới hạn đã biết (phải ghi trung thực trong báo cáo)

- Dữ liệu OpenStreetMap có thể thiếu; Overpass công cộng hay quá thời gian (Phú Quốc đã thất bại nhiều lần).
- Giá vé, giá phòng, giá bữa ăn là **ước tính** theo công thức; không phải giá của hãng.
- Hạn mức Gemini miễn phí khoảng 20 lượt mỗi ngày; số liệu AI phải đo rải nhiều ngày.
- Với ngân sách thấp, kế hoạch bắt buộc đi tàu hoặc xe khách rất dài (ví dụ TP.HCM đến Hà Nội trên 47% thời gian chuyến); đây là giới hạn thật, có cảnh báo.
- Danh sách thành phố có ga tàu chưa đối chiếu với dsvn.vn.
- Chi phí ăn uống tính theo ngày, không theo giờ đến: khi đến muộn, bữa trưa ngày đến vẫn xếp lúc 12:00.
- Tọa độ điểm đến trong danh sách chọn có thể là **trung bình tọa độ các địa điểm trong snapshot** thay vì tọa độ định vị thật, nên khoảng cách và giá vé ước tính lệch nhẹ **[chưa xác minh, cần kiểm tra mã]**.
- Mỗi điểm đến chỉ có khoảng 15 địa điểm mỗi loại nên chuyến 6 đến 7 ngày có thể còn ô trống.
- Kết quả `eval:likes` đã đo ở phiên bản cũ: 2 tăng, 2 giữ nguyên, 1 tệ đi.

## 12. Tiêu chí nghiệm thu bản nộp (15/11/2026)

1. Website chạy trực tuyến hoặc có bản chạy cục bộ kèm video; luồng từ trang chủ đến kế hoạch, đổi, xem trước, xác nhận, nhật ký chuyến đi chạy hết, **không** báo lỗi vì thiếu khóa AI.
2. Trang chủ, Điểm đến, Khách sạn đúng YC-01 đến YC-10; **không** có phần trang trí, "Bunny", "Tính năng nổi bật", ô nhập tay điểm đến.
3. Có ảnh minh họa cho điểm đến, kèm ghi công đúng QT-24 (YC-32).
4. `npm run kich-ban` không còn vi phạm bất biến nặng; vi phạm còn lại được ghi trong mục Giới hạn.
5. `eval:ai-rate` đủ các kịch bản có snapshot với quy tắc hiện tại; `bill`, `parse`, `likes`, `repair` đã chạy; `SO-LIEU-BAO-CAO.md` không còn mục CŨ ngoài ca đã giải thích.
6. Cổng kiểm tra QT-26 đạt; `audit:snapshots` đạt; không có khóa hay ảnh bill thật trong lịch sử Git.
7. Test 3 người dùng đã làm và có bảng kết quả.
8. Tài liệu: README, kiến trúc, giới hạn, hướng dẫn triển khai, nhật ký thay đổi; tag `v1.0-doan`.
9. Báo cáo, slide, video demo, tệp Figma.

## 13. Quyết định còn mở

| Mục | Phương án mặc định |
|---|---|
| Nguồn ảnh | Wikimedia Commons cho địa danh (không cần khóa) và Unsplash chọn tay cho ảnh hero điểm đến (cần khóa miễn phí). Chờ người dùng xác nhận |
| Tọa độ điểm đến | Sửa sang tọa độ định vị thật đã có trong bộ nhớ đệm (cần lệnh mở khóa lõi hoặc dữ liệu) |
| Gộp nhánh `ui-v2` vào `main` | Chờ người dùng xem thử và duyệt |
| Danh sách tuyến tàu | Người dùng đối chiếu dsvn.vn rồi đổi `trangThai` thành "da_doi_chieu" |
| Nội dung mô tả điểm đến | Người dùng rà soát `mo-ta-diem-den.json` |

## 14. Hằng số giả định tham chiếu

Nguồn sự thật là `src/core/assumptions.ts`; nếu bảng này khác tệp thì **tệp thắng**.

| Hằng số | Giá trị |
|---|---|
| Ăn uống mặc định | 150.000 đ mỗi người mỗi bữa; cà phê 50.000 đ mỗi người |
| Giờ ô hoạt động | 09:30 và 15:30 |
| Đệm sau khi đến, ra bến, giữa hoạt động | 60, 120, 30 phút |
| Giờ nhận phòng | 14:00 |
| Ngưỡng di chuyển nhiều, đi lâu | 35% thời gian chuyến; 360 phút |
| Dậy sớm, đi đêm, đến sớm | trước 08:00; 22:00 đến 05:00; trước 06:00 |
| Sắp hết ngân sách | trên 95% |
| Hệ số đường bộ cho thời gian tàu và xe khách | 1,5 |
| Vận tốc ước lượng | xe khách 50, tàu 55, máy bay 750 km/h |
| Giá ước lượng | tàu và xe khách 1.000 đ mỗi km; máy bay 600.000 đ cộng 1.100 đ mỗi km |
| Dự trữ cho hoạt động khi lập kế hoạch dự phòng | 10% |
| `QUY_TAC_VERSION`, `AGENT_PROMPT_VERSION` | "5", "v4" |

---

## Phụ lục A: nhật ký thay đổi tài liệu

| Ngày | Thay đổi | Lý do |
|---|---|---|
| 23/10/2026 | Tạo bản này, gộp từ `AGENTS.md`, `KE-HOACH-LAM.md` và các lệnh trước | Thống nhất một nguồn sự thật |
| 23/10/2026 | Số ngày 2 đến 5 thành 2 đến 7 | Yêu cầu của người dùng; dữ liệu đủ cho khoảng 12 ô hoạt động |
| 23/10/2026 | Bỏ Đăng nhập, "Cách hoạt động", "Tính năng nổi bật", thanh tìm "Bạn muốn đi đâu hôm nay", Cài đặt, Ngân sách khỏi menu | Yêu cầu của người dùng: website chuyên nghiệp, không phô trương |
| 23/10/2026 | Thêm trang Điểm đến và Khách sạn; chọn điểm đi, đến bằng danh sách thả xuống | Yêu cầu của người dùng |

## Phụ lục B: câu lệnh mẫu giao việc

```
Làm theo AGENTS.md và docs/YEU-CAU-VA-QUY-TAC.md. Thực hiện <YC-xx>. Tuân thủ QT-01 đến QT-45.
Không gọi Gemini. Không sửa lõi (QT-36). Đáp án test do người dùng đặt không được sửa (QT-27).
Làm trên nhánh <tên nhánh>. Cuối việc chạy cổng kiểm tra (QT-26) và báo tối đa 8 dòng (QT-39).
```
