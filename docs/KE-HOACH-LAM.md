# KẾ HOẠCH LÀM: Trip Vibes (21/10 đến 15/11/2026)

Tệp này dành cho AI trong IDE. Đặt tại `docs/KE-HOACH-LAM.md`. Người dùng chỉ cần dán:

```
Làm theo AGENTS.md và docs/KE-HOACH-LAM.md. Thực hiện nhiệm vụ <MÃ>. Không làm nhiệm vụ khác.
```

Mục tiêu cuối: một **website** Trip Vibes hoàn chỉnh (Home, trang điểm đến, lịch trình mẫu, khu lập kế hoạch), chạy trực tuyến, có số liệu đánh giá thật, có kết quả test người dùng, nộp trước 15/11/2026.

---

## 0. Luật chạy (bắt buộc, áp dụng cho mọi nhiệm vụ)

1. Đọc `AGENTS.md` trước. Mỗi lần chỉ làm **một** nhiệm vụ. Không làm trước nhiệm vụ sau.
2. **Không gọi Gemini** trừ nhiệm vụ có cột Gemini = CÓ (nhóm C). Chạy thử giao diện phải đặt `LIVE_AI_ENABLED=false`. Gặp lỗi 429 thì **dừng**, không thử lại dồn dập.
3. Đọc mã liên quan trước khi sửa. Nếu một giả định trong nhiệm vụ không khớp mã thật thì **dừng và báo**, không tự suy diễn.
4. Đáp án test do người dùng đặt: **không sửa cho khớp code**. Mọi thay đổi test phải khai báo: tệp, tên test, trước, sau, lý do, loại (A: đổi có chủ đích theo chỉ định; B: đổi chưa được chỉ định; C: test mới; D: test bị xóa).
5. Không viết tay hay sửa tay snapshot, dữ liệu địa điểm, ảnh, số liệu eval. Mọi bảng số liệu trong báo cáo phải là **đầu ra nguyên văn của lệnh**, không gõ lại.
5b. Mọi kết quả dán vào báo cáo phải là đầu ra thô copy từ lệnh. Cấm dựng lại JSON hay bảng từ trí nhớ, cấm viết tóm tắt trong khối mã. Mọi tệp và số dòng trích dẫn phải có bằng chứng bằng git grep -n (đầu ra thô). Lệnh không có đầu ra thì ghi "không có đầu ra". Không chắc thì viết "không chắc". Nếu đầu ra quá dài, dán 120 dòng đầu và nói rõ đã cắt.
6. **Sau mốc đóng băng lõi (nhiệm vụ B2)** không sửa `src/core`, `src/ai`, prompt, `QUY_TAC_VERSION`, `AGENT_PROMPT_VERSION`, `PLAN_MAX_AI_CALLS`. Muốn sửa phải xin người dùng và nêu lý do. Sửa kiểu lint không đổi logic không tính là sửa lõi, nhưng phải khai báo và mọi test phải đạt.
7. Giao diện: chỉ icon SVG (lucide-react), **không emoji**; màu, chữ, bo góc, bóng đổ chỉ từ `src/design/tokens.json`. `check:colors`, `check:contrast`, `check:emoji` phải đạt.
8. `src/ui` không import `src/ai` hay `src/data`. Trang trong `src/app` được đọc dữ liệu rồi truyền xuống `ui` qua props.
9. Không thêm thư viện mới nếu nhiệm vụ không ghi cho phép.
10. Ảnh chụp màn hình phải từ **luồng thật** (không tham số URL giả), mỗi trạng thái một ảnh riêng, kiểm tra không có hai ảnh trùng hash, không dùng `Copy-Item` để đặt tên ảnh cho trạng thái khác.
11. Kết thúc mỗi nhiệm vụ chạy: `npx vitest run` (toàn dự án), `npm run typecheck`, `npm run build`, `npm run check:colors`, `npm run check:contrast`, `npm run check:emoji`; rồi `git log -3 --oneline`. Commit với thông điệp bắt đầu bằng mã nhiệm vụ, **chỉ** commit tệp thuộc nhiệm vụ. Push, **không force push**. Không tạo tag trừ nhiệm vụ B2 và G3.
12. Báo cáo theo mẫu ở mục 6.

**Dừng ngay và báo khi:** test đỏ không rõ nguyên nhân; cần sửa lõi sau mốc đóng băng; cần khóa API hoặc tài khoản; thay đổi ngoài phạm vi nhiệm vụ; kết quả `git status` có tệp lạ (đặc biệt `.env*`, ảnh bill thật, `.cache`).

---

## 1. Trạng thái xuất phát (xác nhận bằng mã và lệnh trước khi tin)

- Commit mới nhất đã biết: `0ef9c3c Tài liệu và kiểm tra triển khai` (trước đó `3d133aa` chạy `eval:ai-rate` 4 ca). Chạy `git log -1 --oneline`; nếu khác, báo.
- Kiểm thử: khoảng 295 test (47 tệp) đạt; typecheck, build 45 trang sạch.
- Snapshot hợp lệ: Bangkok, Đà Lạt, Đà Nẵng, Hà Nội, Seoul (ngày 20/10). **Phú Quốc chưa có** (Overpass lỗi).
- `eval:ai-rate`: mới 4/10 ca với `QUY_TAC_VERSION` "3"; AI tự hoàn thành 1/4; 3/4 rơi về quy tắc. Ca Hà Nội dùng 3.742 phút di chuyển (62 giờ) trong chuyến 3 ngày vì kế hoạch dự phòng chọn phương án rẻ nhất.
- `eval:bill`: 4/4 hóa đơn thật đúng; b05 đạt sau khi sửa bộ chấm (chấm lại 21/10, chạy AI gốc 19/10). `eval:likes`: 2 tăng, 2 giữ nguyên, 1 tệ đi (chạy 19/10, chưa ghi phiên bản). `eval:parse`, `repair`, `data`: chưa chạy. `diadiem` live-only 3/6; có dự phòng 5/6.
- Đã làm: B1 đến B11 nối thật, dự phòng bằng quy tắc, giới hạn lượt AI, `/api/health`, chế độ test `?test=1`, tokens và `check:*`.
- **Lỗi nền chưa sửa:** cài đặt phụ thuộc báo `ERESOLVE` (vitest cần `@types/node` ^22, dự án đang ^20); `.gitignore` có dòng cuối mã hóa UTF-16 nên `eval/bills-real/` không được bỏ qua.

---

## 2. Quyết định đã chốt (đổi được, nhưng phải báo người dùng)

| Mã | Quyết định |
|---|---|
| D1 | Kế hoạch dự phòng đổi từ "rẻ nhất" sang **"nhanh nhất trong ngân sách còn đủ"** (nhiệm vụ B1). Không đổi agent hay prompt |
| D2 | Website có hai khu: trang công khai (Home, Khám phá, Lịch trình mẫu, Trợ giúp) và khu lập kế hoạch (`/lap-ke-hoach`). **Không có trang "Cách hoạt động"**; giới thiệu tính năng nằm trên Home |
| D3 | Ảnh lưu **tệp riêng** `src/data/images/*.json`, không ghi vào snapshot (để không phải lấy lại dữ liệu Overpass) |
| D4 | Nguồn ảnh: Wikimedia Commons (địa danh có liên kết Wikidata hoặc Commons), Unsplash (ảnh hero và thẻ điểm đến, người dùng chọn tay), ảnh tự chụp. Không dùng ảnh từ Google, Airbnb, Expedia, Wanderlog |
| D5 | Không làm: Phú Quốc, Tavily, Google Places, bản chat đối chứng, đăng nhập thật, cộng tác, offline, đa ngôn ngữ, đặt chỗ thật, bản đồ nhúng (chỉ khi người dùng đồng ý, nhiệm vụ E11) |
| D6 | Bản nộp dùng chế độ khách (không tài khoản). Nút Đăng nhập, Đăng ký hiện nhưng ghi "Sắp có" |
| D7 | Khi deploy: `DATA_MODE=snapshot`, `LIVE_DATA_ENABLED=false`, `LIVE_AI_ENABLED=false` (chỉ bật AI khi demo) |
| D8 | Đóng băng lõi (`src/core`, `src/ai`): hết ngày **23/10**. Đóng băng tính năng giao diện: hết ngày **3/11**. Sau đó chỉ sửa lỗi |

---

## 3. Lịch theo ngày

Mỗi ngày tối đa 3 nhiệm vụ cần viết mã cho AI. "Gemini" chỉ có ở nhóm C, mỗi ngày một lượt chạy.

| Ngày | AI làm | BẠN làm | Gemini |
|---|---|---|---|
| 21/10 | A1, A2, A3 | U1 (khóa mới) | Không |
| 22/10 | A4, B1a | U2 (khóa Unsplash), U3 (Figma, mỗi ngày 1 đến 2 giờ đến 31/10) | Không |
| 23/10 | B1b, B2, C1, D1, D2, E1 | Kiểm tra Usage trước khi chạy C1 | Có (C1) |
| 24/10 | C2, D3, E2 | | Có |
| 25/10 | C3, D4, D5 | | Có |
| 26/10 | C4a, C4, D6, E3 | U4 (chọn ảnh, 30 phút) | Có (C4) |
| 27/10 | C5, D7, E4 | | Có |
| 28/10 | C6, E5 | Bắt đầu viết báo cáo (khung) | Có |
| 29/10 | C7, E6, E7 | | Có |
| 30/10 | C8 (dự phòng), E8 | U5 (duyệt lịch trình mẫu) | Có nếu cần |
| 31/10 | C9, E9 | | Không |
| 1/11 | F1, F2 | F1 (deploy Vercel) | Không |
| 2/11 | E10, F3 | F3 (Lighthouse) | Không |
| 3/11 | C10; **đóng băng tính năng** | F4 bắt đầu (test 3 người) | Không |
| 4 đến 6/11 | F5, F6 | F4 (thu CSV) | Không |
| 7 đến 8/11 | F6, G1 | Báo cáo, slide | Không |
| 9 đến 10/11 | G2 | Báo cáo, slide, video | Không |
| 11 đến 13/11 | G3 (kiểm tra cuối, tag) | Hoàn thiện, dự phòng lỗi | Không |
| 14 đến 15/11 | | U6 (nộp) | Không |

---

## 4. Bảng nhiệm vụ tổng

| Mã | Nhiệm vụ | Ai | Hạn | Phụ thuộc | Gemini |
|---|---|---|---|---|---|
| A1 | Sửa `.gitignore`, kiểm tra lộ dữ liệu | AI | 21/10 | | Không |
| A2 | Sửa xung đột phụ thuộc, `npm ci` sạch | AI | 21/10 | | Không |
| A3 | Cập nhật `AGENTS.md`, `.env.example`, README | AI | 21/10 | A1 | Không |
| A4 | Đóng gói snapshot và dữ liệu cho Vercel | AI | 22/10 | A3 | Không |
| U1 | Tạo khóa Gemini mới, thu hồi khóa cũ | BẠN | 21/10 | | Không |
| U2 | Đăng ký Unsplash, lấy Access Key | BẠN | 22/10 | | Không |
| U3 | Figma: nhập wireframe, token, prototype | BẠN | 31/10 | | Không |
| B1a | Sửa 3 lỗi: số đêm, ô hoạt động đến sau nửa đêm, cảnh báo quy tắc | AI | 22/10 | A2 | Không |
| B1b | Kế hoạch dự phòng "nhanh nhất trong ngân sách" | AI | 23/10 | B1a | Không |
| B2 | Đóng băng lõi, tag `core-frozen-4` | AI | 23/10 | B1b | Không |
| C1 | `eval:ai-rate` 4 ca | AI chạy | 23/10 | B2, U1 | CÓ |
| C2 | `eval:ai-rate` 4 ca tiếp | AI chạy | 24/10 | C1 | CÓ |
| C3 | `eval:ai-rate` 2 ca cuối (đủ 10) | AI chạy | 25/10 | C2 | CÓ |
| C4a | Kiểm tra cách chấm của `eval:parse` | AI | 26/10 | B2 | Không |
| C4 | `eval:parse` | AI chạy | 26/10 | C4a | CÓ |
| C5 | `eval:bill` (chạy AI thật, có meta) | AI chạy | 27/10 | B2 | CÓ |
| C6 | `eval:likes` | AI chạy | 28/10 | B2 | CÓ |
| C7 | `eval:repair` | AI chạy | 29/10 | B2 | CÓ |
| C8 | Chạy lại bộ nào bị 429 hoặc dừng sớm | AI chạy | 30/10 | C1 đến C7 | CÓ |
| C9 | `eval:diadiem` live và `eval:data` | AI chạy | 31/10 | | Không |
| C10 | `eval:tonghop` lần cuối | AI | 3/11 | C1 đến C9 | Không |
| D1 | Hợp đồng ảnh và hàm nhãn ghi công | AI | 23/10 | A3 | Không |
| D2 | Đo độ phủ ảnh trong snapshot | AI | 23/10 | D1 | Không |
| D3 | Client Wikimedia Commons | AI | 24/10 | D2 | Không |
| D4 | `data:images` và `audit:images` | AI | 25/10 | D3 | Không |
| D5 | Ứng viên ảnh Unsplash cho điểm đến | AI | 25/10 | U2, D1 | Không |
| U4 | Chọn ảnh hero, thẻ cho 5 điểm đến | BẠN | 26/10 | D5 | Không |
| D6 | Component `AnhCoGhiCong`, dùng trong kế hoạch | AI | 26/10 | D4, U4 | Không |
| D7 | Trang `/nguon-anh` | AI | 27/10 | D6 | Không |
| E1 | Token mới cho site | AI | 23/10 | A3 | Không |
| E2 | Tách route, header, footer, 404 | AI | 24/10 | E1 | Không |
| E3 | Home: hero, tìm kiếm, dải tin cậy, thẻ điểm đến | AI | 26/10 | E2, D6 | Không |
| E4 | Home: khối tính năng có ảnh chụp thật, lưới tính năng | AI | 27/10 | E3 | Không |
| E5 | Home: lịch trình mẫu, chủ đề, minh bạch, hỏi nhanh, chân trang | AI | 28/10 | E4 | Không |
| E6 | Trang `/kham-pha` và `/kham-pha/[slug]` | AI | 29/10 | E3, D6 | Không |
| E7 | Lịch trình mẫu `data:mau` và trang `/lich-trinh` | AI | 29/10 | B2, E6 | Không |
| U5 | Duyệt lịch trình mẫu | BẠN | 30/10 | E7 | Không |
| E8 | SEO, pháp lý, trợ giúp | AI | 30/10 | E2 | Không |
| E9 | Thẻ địa điểm có ảnh trong B3, B8; chỉnh khu lập kế hoạch | AI | 31/10 | D6 | Không |
| E10 | Kiểm tra responsive và truy cập | AI | 2/11 | E3 đến E9 | Không |
| E11 | Bản đồ cạnh lịch trình (chỉ khi người dùng đồng ý) | AI | tùy | | Không |
| F1 | Deploy Vercel | BẠN | 1/11 | E8 | Không |
| F2 | Kiểm tra nhanh bản triển khai (smoke test) | AI | 1/11 | F1 | Không |
| F3 | Lighthouse và sửa nhanh | BẠN rồi AI | 2/11 | F1 | Không |
| F4 | Test 3 người dùng | BẠN | 3 đến 6/11 | F1 | Không |
| F5 | Báo cáo số liệu người dùng `eval:nguoidung` | AI | 6/11 | F4 | Không |
| F6 | Sửa lỗi sau F2 đến F5 (tối đa 2 vòng) | AI | 7 đến 8/11 | F5 | Không |
| G1 | Tài liệu cuối | AI | 8/11 | F6 | Không |
| G2 | Gói số liệu và ảnh cho báo cáo | AI | 10/11 | G1 | Không |
| G3 | Kiểm tra cuối, tag `v1.0-doan` | AI | 12/11 | G2 | Không |
| U6 | Báo cáo, slide, video, nộp | BẠN | 14/11 | G3 | Không |

---

## 5. Thẻ nhiệm vụ chi tiết

### Nhóm A: vệ sinh repo (21/10)

**A1. Sửa `.gitignore`, kiểm tra lộ dữ liệu**
- Làm: chạy `git ls-files eval/bills-real` và `git log --all --oneline -- eval/bills-real .env.local`. Nếu **có kết quả**: dừng, báo nguyên văn. Nếu trống: thay `.gitignore` bằng bản UTF-8 (xóa dòng bị UTF-16, thêm `/.cache/`, `eval/.cache`, `/scratch/`, `eval/bills-real/`, giữ các mục mặc định của Next).
- Xong khi: `.gitignore` không chứa byte NUL; `git check-ignore -v eval/bills-real/x.jpg` khớp một dòng; `git status` sạch.

**A2. Sửa xung đột phụ thuộc**
- Làm: `npm install -D @types/node@^22`; thêm script `"test": "vitest run"` nếu chưa có; thêm `"engines": {"node": ">=20.11"}`. Xóa `node_modules`, chạy `npm ci`.
- Xong khi: `npm ci` thành công, **không** có `ERESOLVE`; vitest, typecheck, build đạt; chỉ `package.json` và `package-lock.json` đổi.

**A3. Cập nhật `AGENTS.md`, `.env.example`, README**
- Làm: hợp nhất các mục "Phạm vi sản phẩm", "Dữ liệu và nguồn", "Cách làm việc" vào `AGENTS.md` (giữ nguyên khối Next.js tự sinh). `.env.example` đủ biến, thêm `UNSPLASH_ACCESS_KEY` (tùy chọn) và `SITE_URL`. README: bảng biến môi trường và scripts đọc từ `package.json`.
- Xong khi: không biến nào trong README thiếu trong `.env.example` và ngược lại; không có giá trị khóa thật.

**A4. Đóng gói snapshot và dữ liệu cho Vercel (22/10, sau A3, trước B1)**
- Làm: đọc `next.config.ts` và tài liệu trong `node_modules/next/dist/docs/` về việc đưa tệp đọc lúc chạy vào gói triển khai (tùy chọn tên `outputFileTracingIncludes`, kiểm tra tên đúng cho phiên bản 16.3.8). Các route đọc snapshot: `/api/plan`, `/api/plan/preview`, `/api/plan/regenerate`, `/api/options`, `/api/destination`, `/api/destination/prepare`, `/api/data/status`, `/api/health`. Nếu chưa khai báo thì thêm `src/data/snapshots/**`, `src/data/reference/**` (sau này thêm `src/data/images/**`, `src/data/mau/**`).
- Kiểm chứng cục bộ: sau `next build`, liệt kê các tệp `.next/server/**/*.nft.json` của từng route trên và nêu route nào chứa `snapshot_*.json`. Chạy `VERCEL=1 next start`, gọi `GET /api/health` (phải liệt kê 5 snapshot) và `POST /api/plan` cho Hà Nội (phải `dataSourceUsed: "snapshot"`).
- Bằng chứng cuối cùng phải lấy từ bản triển khai thật (F2): `/api/health` trên địa chỉ Vercel phải liệt kê đủ 5 snapshot. Thêm kiểm tra này vào F2.

### Nhóm B: lõi (22/10 đến 23/10)

**B1a. Sửa 3 lỗi: số đêm, ô hoạt động khi đến sau nửa đêm, và cảnh báo quy tắc**
- Sửa hàm `soDemOKhachSan` tính số đêm theo giờ đến nơi (`src/core/soDem.ts`).
- Lọc ô hoạt động khả dụng theo ngày thực tế khi đến sau nửa đêm (`tinhOKhaDungTheoNgay` trong `src/core/oKhaDung.ts`).
- `fallbackToRules` trả về danh sách cảnh báo `hard` và `soft` thật từ `validatePlan` thay vì mảng rỗng (`src/ai/planWithRepair.ts`).
- Đổi câu cảnh báo `den_vao_ngay_sau`: "Chuyến đi đến nơi vào ngày thứ {d} (sau nửa đêm). Kế hoạch chỉ tính {n} đêm khách sạn vì {d-1} đêm đầu nằm trên phương tiện."
- Sửa 3 test minBudget (loại A đã được duyệt).

**B1b. Kế hoạch dự phòng "nhanh nhất trong ngân sách còn đủ"**
- Tệp: `src/core/lapKeHoachTuDong.ts`, `src/core/assumptions.ts`, test mới. `minBudget` **không đổi**.
- Luật: trong các tổ hợp (chiều đi, chiều về, khách sạn) thỏa điều cần tránh và có chi phí cố định (Di chuyển + Chỗ ở + Ăn uống mặc định) nhỏ hơn hoặc bằng `ngân sách x (1 - DU_TRU_HOAT_DONG_TI_LE)`, chọn tổ hợp có **tổng thời lượng hai chiều ngắn nhất**; bằng nhau thì **rẻ hơn**; bằng nhau nữa thì theo thứ tự đầu vào. Khách sạn: rẻ nhất thỏa điều cần tránh. Không có tổ hợp nào dưới ngưỡng dự trữ thì dùng tổ hợp **rẻ nhất** còn nằm trong ngân sách (như cũ). Ngân sách nhỏ hơn mức tối thiểu thì trả `khong_the_dat_ngan_sach` kèm `toiThieuVND`.
- Hằng số: `DU_TRU_HOAT_DONG_TI_LE = 0.10` (giả định, ghi chú "chưa hiệu chỉnh"); `QUY_TAC_VERSION = "4"`.
- Test: đáp án ở Phụ lục A (do người dùng đặt, không sửa). Sáu ca của Bước 13 vẫn phải đạt nguyên đáp án. Bổ sung Fixture M (đến sau nửa đêm).
- Báo cáo thêm: với 10 kịch bản của `eval:ai-rate` (dùng snapshot, chế độ quy tắc, **không gọi AI**), in bảng: điểm đến, hệ số, ngân sách, phương tiện đi và về đã chọn, tổng phút di chuyển, tỉ lệ di chuyển, tổng tiền. Nêu rõ ca nào vẫn chọn tàu hoặc xe vì ngân sách chỉ đủ phương án đó (ví dụ Hà Nội 1,3 lần mức tối thiểu); đó là giới hạn có thật, không phải lỗi, và cảnh báo "di chuyển chiếm nhiều thời gian" đã có sẵn.

**B2. Đóng băng lõi**
- Làm: chạy bộ kiểm tra đầy đủ; cập nhật CHANGELOG; `git tag core-frozen-4` và push tag.
- Xong khi: mọi kiểm tra xanh; báo `QUY_TAC_VERSION`, `AGENT_PROMPT_VERSION`, `PLAN_MAX_AI_CALLS`, số test. Từ đây áp dụng luật 6.

### Nhóm C: đánh giá bằng Gemini (23/10 đến 31/10)

**Điều kiện chung cho C1 đến C8** (bạn kiểm tra trước, AI xác nhận lại):
- Google AI Studio, mục Usage, còn lượt trong ngày.
- `git status` sạch; `QUY_TAC_VERSION = "4"`; **không** đặt biến môi trường ghi đè `PLAN_MAX_AI_CALLS`.
- Chỉ commit tệp trong `eval/results/`. Nếu `git status` có tệp khác thì dừng.
- Báo cáo: dán **đầu ra nguyên văn** của lệnh (từ bảng kết quả đến hết phần tổng hợp), số lượt Gemini đã dùng, số lần 429 và kịch bản bị dừng, thời gian từng ca. Ca nào vẫn vi phạm hoặc rơi về quy tắc thì nêu lý do và mã `hard`.
- **Không sửa mã để cải thiện kết quả.** Kết quả xấu thì báo trung thực; đó là số liệu cho báo cáo.

**C1.** `npm run eval:ai-rate -- --toi-da=4`
**C2.** `npm run eval:ai-rate -- --toi-da=4`
**C3.** `npm run eval:ai-rate -- --toi-da=2` (đủ 10 kịch bản; tổng hợp phải không còn dòng "CHƯA ĐỦ MẪU")
**C4a. Kiểm tra cách chấm của `eval:parse` (trước C4, không gọi Gemini)**
- Làm: đọc `eval/run-parse.ts`. Biến `correctNganSach` được đổi thành `const ... = 0` ở commit `7020b5e` vì không bao giờ gán lại. Xác định bộ chấm ngân sách thật sự nằm ở đâu và có tăng đúng khi trích đúng không. Nếu sai thì sửa bộ chấm (**không sửa** `eval/parse-cases` hay đáp án), tách thành hàm thuần nếu chưa có.
- Test (đáp án do người dùng đặt): (trích 20.000.000, kỳ vọng 20.000.000) khớp; (19.000.000 so với 20.000.000) không khớp; (null so với 20.000.000) không khớp; (null so với null) khớp.
- Báo cáo: nêu rõ lỗi có thật hay không; nếu có thì ảnh hưởng đến kết quả nào. Tìm các biến đếm tương tự ở các runner khác: `git diff 0ef9c3c..7020b5e -- eval` cho thấy chỉ hai chỗ đổi `let` thành `const ... = 0` (`tavilyCalls`, `correctNganSach`).

**C4.** `npm run eval:parse`
**C5.** `npm run eval:bill` (chỉ dùng ảnh trong `eval/bills/`; tệp kết quả phải có `meta`)
**C6.** `npm run eval:likes`
**C7.** `npm run eval:repair`
**C8.** Chạy lại bộ nào dừng vì 429 hoặc thiếu ca (dùng cờ `--toi-da`). Nếu mọi bộ đã đủ thì bỏ qua.

**C9. `eval:diadiem` và `eval:data` (không gọi Gemini, cần mạng)**
- Làm: chạy `npm run eval:diadiem` và `npm run eval:data` ngoài giờ cao điểm, không chạy cùng lúc với lệnh khác dùng Overpass.
- Xong khi: tệp kết quả có `meta`; báo bảng nguyên văn.

**C10. `eval:tonghop` lần cuối**
- Làm: `npm run eval:tonghop`, dán nguyên văn `eval/results/SO-LIEU-BAO-CAO.md`.
- Xong khi: bộ nào còn "CŨ" hoặc "CHƯA CHẠY" thì liệt kê lý do; không ghi số nào không đọc từ tệp kết quả.

### Nhóm D: ảnh địa điểm (23/10 đến 27/10)

**D1. Hợp đồng ảnh**
- Tệp mới `src/contracts/anh.ts`: `AnhDiaDiemSchema` gồm `url`, `urlNho`, `tacGia`, `tacGiaLink`, `giayPhep`, `nguon` (`wikimedia_commons` | `unsplash` | `tu_chup`), `trangGoc`, `altVi`, `ngayLay`. Không đổi `Plan` hay `Request`, nên **không tăng `schemaVersion`**; ghi lý do trong báo cáo.
- Hàm thuần `nhanAnh(anh)` trong `src/ui/lib/nhanAnh.ts`. Test (đáp án do người dùng đặt): `{tacGia:"Nguyen A", giayPhep:"CC BY-SA 4.0", nguon:"wikimedia_commons"}` cho "Ảnh: Nguyen A · CC BY-SA 4.0 · Wikimedia Commons"; `{tacGia:"Tran B", nguon:"unsplash"}` cho "Ảnh: Tran B · Unsplash"; `{nguon:"tu_chup"}` cho "Ảnh: nhóm Trip Vibes"; `null` cho `null`.

**D2. Đo độ phủ ảnh**
- Làm: với 5 snapshot, đếm địa điểm có thẻ `wikidata` hoặc `wikimedia_commons` theo từng loại (khách sạn, quán ăn, cà phê, hoạt động). Nếu snapshot không giữ thẻ, viết script **chỉ để đo** truy vấn Overpass theo `osmId` (tuần tự, thử lại, nghỉ giữa lần). Ghi `eval/results/do-phu-anh-<ngày>.json`.
- Xong khi: báo bảng phần trăm theo điểm đến và loại. Nếu hoạt động dưới 20% thì báo; **không** chuyển sang tìm ảnh theo tên (dễ sai địa điểm).

**D3. Client Wikimedia Commons**
- Tệp: `src/data/images/commonsClient.ts` + test (mock mạng, có fixture).
- Làm: từ tên tệp Commons hoặc từ mục `image` của Wikidata, gọi API `imageinfo` lấy URL thu nhỏ (rộng 640 và 1280), tên tác giả, giấy phép, trang gốc, cờ hạn chế. Đổi HTML trong trường tác giả thành văn bản và liên kết. **Bỏ** ảnh có hạn chế hoặc không rõ giấy phép. `User-Agent` lấy từ biến môi trường (có email thật). Tối đa 1 yêu cầu mỗi giây, có cache 30 ngày.
- Xong khi: test đạt với ít nhất 4 ca: tác giả là HTML có liên kết; giấy phép CC BY-SA; có hạn chế thì bị loại; lỗi mạng thì trả `null`, không ném lỗi.

**D4. `data:images` và `audit:images`**
- Làm: `npm run data:images` tạo `src/data/images/poi-anh.json` (khóa `osmId`) cho 5 điểm đến, **không ghi snapshot**, có `ngayLay` và checksum. `npm run audit:images` thất bại nếu mục nào thiếu `nguon`, `tacGia`, `giayPhep` hoặc `trangGoc`, hoặc `url` không thuộc `upload.wikimedia.org` hay `images.unsplash.com`.
- Xong khi: báo bảng số ảnh theo điểm đến và loại; `audit:images` đạt.

**D5. Ứng viên ảnh Unsplash**
- Điều kiện: có `UNSPLASH_ACCESS_KEY` (U2).
- Làm: `npm run data:images:goiy` ghi `src/data/images/ung-vien/<slug>.json` gồm 8 ứng viên cho mỗi điểm đến (chỉ metadata: id, URL dùng đúng như API trả về, tác giả, liên kết có `utm_source=<tên ứng dụng>&utm_medium=referral`). Tổng yêu cầu API phải ít hơn 50 trong một giờ. Script `npm run data:images:chon -- --slug=da-nang --hero=<id> --the=<id>` ghi `src/data/images/diem-den-anh.json` và gọi điểm cuối `download` của ảnh được chọn (đúng hướng dẫn của Unsplash).
- Không tự chọn ảnh thay người dùng. Không tải ảnh về tự lưu.

**U4 (BẠN).** Mở các tệp ứng viên (hoặc liên kết ảnh), chọn 1 ảnh hero và 1 ảnh thẻ cho mỗi điểm đến, chạy lệnh `data:images:chon`. Chọn ảnh thể hiện đúng nơi đó, không có người nhận diện được rõ mặt.

**D6. Component `AnhCoGhiCong`**
- Làm: component chỉ nhận props (`anh`, `ti_le`, `loai`), hiển thị ảnh kèm dòng ghi công từ `nhanAnh`; chưa có ảnh thì hiện hình minh họa SVG theo loại (khách sạn, quán ăn, cà phê, điểm tham quan) dùng màu token, **không dùng ảnh gần giống**. Khung chờ khi tải; `alt` lấy từ `altVi`. `next.config.ts`: `images.remotePatterns` chỉ cho `upload.wikimedia.org` và `images.unsplash.com`.
- Xong khi: ảnh chụp thật của thẻ địa điểm ở B3 (có ảnh, không có ảnh) ở 1440 và 390; hash khác nhau.

**D7. Trang `/nguon-anh`**
- Làm: liệt kê mọi ảnh đang dùng kèm tác giả, giấy phép, liên kết gốc, sinh từ các tệp JSON. Chân trang có liên kết tới trang này.

### Nhóm E: website (23/10 đến 2/11)

**E1. Token mới cho site**
- Làm: thêm vào `tokens.json` các token: `radius-card` (16), `radius-pill`, `shadow-card`, `shadow-card-hover`, `overlay-anh` (lớp phủ tối nhẹ cho chữ trên ảnh), cỡ chữ tiêu đề lớn của hero, khoảng cách khối (`space-section`). `npm run build:tokens`.
- Xong khi: `check:colors` và `check:contrast` đạt; thêm cặp "chữ trắng trên lớp phủ ảnh" vào `check:contrast` và đạt 4,5:1 (tính với trường hợp nền ảnh sáng nhất).

**E2. Tách route, vỏ site**
- Làm: dùng route group: trang công khai có `SiteHeader` (logo, Khám phá, Lịch trình mẫu, Chuyến của tôi, Đăng nhập với nhãn "Sắp có", nút "Lập kế hoạch") và `SiteFooter`; khu lập kế hoạch ở `/lap-ke-hoach` (gắn `TripVibesApp` hiện có, giữ menu trái). Logo ở khu lập kế hoạch dẫn về `/`. Thêm `lang="vi"`, liên kết "Bỏ qua đến nội dung chính", trang 404 thân thiện. Không đổi API.
- Xong khi: danh sách route khi build; Home tạm có chữ giữ chỗ; ảnh chụp khu lập kế hoạch cho thấy luồng B1 đến B3 vẫn chạy; `?test=1` vẫn hoạt động ở `/lap-ke-hoach`.

**E3. Home: hero, tìm kiếm, dải tin cậy, thẻ điểm đến**
- Làm: hero ảnh lớn (từ `diem-den-anh.json`, có ghi công); bảng tìm kiếm tab "Chọn nhanh" (Đi từ, Đến, Số ngày 2 đến 5, Số người, Ngân sách) dùng lại `formB1` (không viết lặp). Gợi ý khi gõ **chỉ lấy từ danh sách điểm đến đã có dữ liệu**, không gọi Nominatim lúc gõ. Tab "Mô tả bằng lời" chỉ hiện khi `/api/health` báo `liveAiEnabled`. Bấm "Lập kế hoạch" ghi gói giá trị vào `sessionStorage`, chuyển sang `/lap-ke-hoach`, B1 đọc rồi xóa. Dải tin cậy ghi 3 sự thật có thể kiểm. Hàng thẻ điểm đến: ảnh, tên, "3 ngày từ khoảng X đ cho 2 người (tính từ TP.HCM, ước tính)", nhãn ngày dữ liệu. Giá lấy từ `minBudget` trên snapshot, điểm đi mẫu là hằng `DIEM_DI_MAU` trong `assumptions.ts`, hiển thị công khai trên thẻ.
- Test: hàm thuần `taoGoiChuyenB1(form)` (trong `src/ui/lib`): với 4 người, mỗi người 3.500.000 đ thì `tongVND = 14.000.000`; số người 0 trả lỗi `so_nguoi`.
- Xong khi: ảnh chụp thật của Home ở 1440 và 390 (hero, thẻ), và một luồng thật: nhập ở hero, sang B1 đã điền, lập kế hoạch bằng quy tắc.

**E4. Home: khối tính năng và lưới**
- Làm: 4 khối xen kẽ (kế hoạch có giá đúng ngân sách; xem trước mọi thay đổi; bản đồ và chỉ đường; đọc bill và theo dõi chi tiêu), mỗi khối một tiêu đề, 2 dòng, một **ảnh chụp giao diện thật** (AI chụp từ luồng thật, snapshot, quy tắc, điểm đến Đà Nẵng 2 người; lưu `public/screens/home-*.png`, mỗi tệp nhỏ hơn 400 KB). Lưới 8 ô; tính năng chưa làm ghi nhãn "Sắp có".
- Xong khi: không có hai ảnh trùng hash; mọi tính năng nêu trên Home đều có thật trong bản chạy (kiểm tra bằng danh sách đối chiếu); báo cáo nêu tính năng nào bị ghi "Sắp có".

**E5. Home: các khối còn lại**
- Làm: lịch trình mẫu (3 thẻ, đọc từ E7; nếu E7 chưa xong thì ẩn khối), cảm hứng theo chủ đề (tệp biên tập `src/data/site/chu-de.json`: Biển, Núi, Văn hóa, Thành phố, mỗi chủ đề liệt kê điểm đến đã có snapshot), minh bạch (3 thẻ), hỏi nhanh (5 câu lấy từ `docs/GIOI-HAN-DA-BIET.md`), lời kêu gọi cuối, chân trang 4 cột (Khám phá, Lịch trình mẫu, Hỗ trợ, Pháp lý và nguồn gồm "Dữ liệu: OpenStreetMap contributors" và liên kết `/nguon-anh`).
- Khối "Đánh giá người dùng" **ẩn** khi `src/data/site/loi-nhan-xet.json` rỗng. Test: danh sách rỗng thì khối không hiện.

**E6. Trang điểm đến**
- Tệp: `src/app/(site)/kham-pha/page.tsx` và `[slug]/page.tsx`, dựng sẵn từ snapshot (`generateStaticParams`); slug lấy từ tên tệp snapshot. Test: `snapshot_da_nang_2026-10-20.json` cho `da-nang`; `snapshot_ha_noi_...` cho `ha-noi`; `snapshot_bangkok_...` cho `bangkok`.
- Nội dung: hero ảnh; mức chi tham khảo (`minBudget`, 2 người, 3 ngày, ghi ngày dữ liệu); 6 địa điểm, 6 quán ăn, 6 cà phê (kèm ảnh nếu có); liên kết "Xem trên Google Maps"; lịch trình mẫu liên quan; nút lớn "Lập kế hoạch đi X" mở `/lap-ke-hoach` đã điền điểm đến. `metadata` riêng cho từng trang. Điểm đến không có snapshot thì không dựng trang (404).

**E7. Lịch trình mẫu**
- Làm: `npm run data:mau` tạo `src/data/mau/<slug>-3ngay.json` cho 5 điểm đến bằng `lapKeHoachTuDong` (**không gọi AI**), 2 người, 3 ngày, ngân sách bằng **2,0 lần** mức tối thiểu làm tròn lên 100.000 đ. Mỗi mẫu ghi `nguon`, `ngayTao`, `quyTacVersion`, tổng tiền, tỉ lệ di chuyển. Script bỏ qua mẫu có tỉ lệ di chuyển trên 35% và báo. Trang `/lich-trinh` (lưới) và `/lich-trinh/[id]` (xem theo ngày, nhãn "giá ước tính", nút "Dùng làm điểm xuất phát" mở khu lập kế hoạch với giá trị đã điền).
- Xong khi: báo bảng từng mẫu (điểm đến, ngân sách, tổng tiền, tỉ lệ di chuyển, giờ đến).

**U5 (BẠN).** Xem 5 mẫu: giờ đến, thời gian di chuyển, địa điểm có hợp lý không. Nếu mẫu nào lạ thì báo mã mẫu để AI sinh lại với ngân sách cao hơn.

**E8. SEO, pháp lý, trợ giúp**
- Làm: `metadata` toàn site, `sitemap.ts`, `robots.ts`, ảnh chia sẻ (dùng ảnh hero đã chọn). Trang `/tro-giup` (hỏi đáp), `/gioi-han`, `/nguon-du-lieu`, `/dieu-khoan`, `/quyen-rieng-tu`, `/lien-he` (chỉ `mailto:`, không biểu mẫu). Nội dung lấy từ `docs/GIOI-HAN-DA-BIET.md` và thực tế mã (ảnh bill xử lý trong bộ nhớ, không đặt vé, không tư vấn visa, nguồn dữ liệu, ghi công ảnh). Trang điều khoản và quyền riêng tư ghi rõ "Bản dành cho đồ án, không phải tư vấn pháp lý".
- Xong khi: `sitemap.xml` liệt kê đúng các route công khai; mọi liên kết ở chân trang không trả 404.

**E9. Khu lập kế hoạch: thẻ có ảnh, chỉnh giao diện**
- Làm: thẻ địa điểm ở B3, B4, B5, B8 dùng `AnhCoGhiCong`; khung chờ; đảm bảo điều hướng bàn phím và vòng focus; tinh chỉnh khoảng cách theo token. **Không đổi logic.**
- Xong khi: ảnh chụp thật B3, B5, B8 ở 1440 và 390, có và không có ảnh.

**E10. Kiểm tra responsive và truy cập**
- Làm: dùng trình duyệt tự động chụp `/`, `/kham-pha`, `/kham-pha/da-nang`, `/lich-trinh`, `/lap-ke-hoach` ở 1440, 768, 390. Kiểm tra: không tràn ngang, không lỗi console, không yêu cầu mạng thất bại, mọi ảnh có `alt`, thứ tự tiêu đề (h1 duy nhất), thứ tự Tab hợp lý.
- Xong khi: bảng kết quả theo trang và khổ rộng; sửa mọi lỗi tìm được; liệt kê lỗi chưa sửa và lý do.

**E11 (chỉ khi người dùng đồng ý, và còn trên 5 ngày trước 15/11).** Bản đồ cạnh lịch trình ở B3. Cần thêm thư viện bản đồ và chọn nguồn ô bản đồ (kiểm tra chính sách sử dụng hiện hành); **dừng và xin phép** trước khi cài.

### Nhóm F: triển khai và kiểm tra (1/11 đến 8/11)

**F1 (BẠN). Deploy Vercel.** Kết nối repo, Node 22, biến môi trường theo D7 (không đặt `NEXT_PUBLIC_SHOW_DEMO`), `NOMINATIM_USER_AGENT` có email thật, khóa Gemini mới. Gửi lại địa chỉ.

**F2. Smoke test bản triển khai**
- Làm: `scripts/smoke.ts <URL>` kiểm tra: `/`, `/kham-pha`, `/kham-pha/da-nang`, `/lich-trinh`, `/gioi-han`, `/sitemap.xml`, `/robots.txt` trả 200; `/api/health` không chứa khóa và trên Vercel phải liệt kê đủ 5 snapshot; `/demo` trả 404; `POST /api/plan` cho Hà Nội trả kế hoạch bằng quy tắc dưới 5 giây; ảnh mẫu (Wikimedia, Unsplash) trả 200; không lỗi console. In bảng nguyên văn.
- Không gọi Gemini.

**F3 (BẠN rồi AI). Lighthouse.** Bạn chạy Lighthouse (desktop và mobile) cho `/` và `/lap-ke-hoach`, gửi điểm 4 mục. AI sửa các lỗi nhanh (kích thước ảnh, `font-display`, nhãn thiếu). Mục tiêu mềm: Accessibility và SEO từ 90, Best Practices từ 90, Performance mobile từ 70; điểm thấp hơn thì ghi trung thực vào báo cáo.

**F4 (BẠN). Test 3 người dùng.** Mở `<URL>/lap-ke-hoach?test=1` (hoặc từ Home thêm `?test=1`). Ba nhiệm vụ cho mỗi người: (1) từ Home lập kế hoạch đi một điểm đến với một ngân sách cho trước; (2) đổi một khách sạn, xem trước, áp dụng; (3) chốt kế hoạch và thêm một chi tiêu nhập tay. Không giúp trong lúc làm. Sau đó hỏi 3 câu: "Dễ dùng từ 1 đến 5?", "Chỗ nào khó hiểu?", "Bạn có dùng không?". Lưu tệp JSON và CSV (nút "Tải kết quả") vào `eval/test-nguoi-dung/nguoi-1.csv`...; trả lời 3 câu ghi vào `eval/test-nguoi-dung/nhan-xet.csv` (không ghi tên); phải có sự đồng ý của người tham gia.

**F5. `eval:nguoidung`**
- Làm: script đọc các CSV, ghi bảng: thời gian tạo kế hoạch, số lần đổi, số hoàn tác, thời gian tới lúc chốt, có vượt ngân sách khi chốt không, số khoản chi, số khoản chi sửa số; kèm nhận xét (trích nguyên văn ngắn từ tệp). Ghi vào `SO-LIEU-BAO-CAO.md` một mục riêng. Test với CSV mẫu.

**F6. Sửa lỗi (tối đa 2 vòng)**
- Làm: chỉ sửa **lỗi** từ F2 đến F5 và E10, mỗi lỗi kèm test hồi quy. Lỗi nằm ở lõi thì dừng và xin phép (luật 6). Không thêm tính năng.

### Nhóm G: báo cáo và nộp (8/11 đến 15/11)

**G1. Tài liệu cuối**
- Làm: cập nhật `docs/architecture.md` (route mới, nguồn ảnh), `docs/figma-code-mapping.md` (thêm trang công khai), `docs/GIOI-HAN-DA-BIET.md` (độ phủ ảnh theo D2, Phú Quốc, chính sách Unsplash demo), `docs/roadmap.md`, `CHANGELOG.md` (từ `git log`), `README.md` (địa chỉ triển khai, scripts, cách chạy, cách tạo ảnh và snapshot).

**G2. Gói số liệu cho báo cáo**
- Làm: `eval:tonghop` lần cuối; ảnh chụp chuẩn từ luồng thật vào `docs/screens/bao-cao/` kèm bảng "tên tệp, nội dung, ngày chụp" (hash không trùng); bảng truy vết "yêu cầu, tính năng, tệp, test, kết quả" lập từ mã thật; bảng "ca xấu và giới hạn" (b05 chấm lại, likes tệ đi 1 ca, ai-rate tự hoàn thành x/10, Hà Nội ngân sách chỉ đủ tàu, Phú Quốc, độ phủ ảnh).

**G3. Kiểm tra cuối và tag**
- Làm: `npx vitest run`, typecheck, build, `check:colors`, `check:contrast`, `check:emoji`, `audit:snapshots`, `audit:images`, `npm run verify:keys`, smoke test bản triển khai; `git status` sạch; không có `.env*`, ảnh bill thật hay `.cache` trong lịch sử; `git tag v1.0-doan`, push tag; ghi ghi chú phát hành (số test, số điểm đến, giới hạn).
- Xong khi: mọi kiểm tra xanh; báo `git log -3` và danh sách tệp lớn nhất trong repo (phát hiện tệp lỡ commit).

**U6 (BẠN). Nộp.** Địa chỉ website, repo và tag, báo cáo, slide, video demo, tệp Figma, bản sao lưu (zip bằng `git archive`).

---

## 6. Mẫu báo cáo cuối mỗi nhiệm vụ

```
NHIỆM VỤ: <mã> <tên>
1. Đã làm: <3 đến 8 dòng>
2. Tệp đã thêm hoặc sửa: <danh sách>
3. Thay đổi test: <bảng A/B/C/D hoặc "không có">
4. Kết quả lệnh (NGUYÊN VĂN): vitest toàn dự án (số tệp, số test), typecheck, build, check:colors, check:contrast, check:emoji
5. Bằng chứng riêng của nhiệm vụ: <đầu ra lệnh, ảnh chụp, bảng>
6. Số lượt Gemini đã dùng: <số>
7. Chưa làm hoặc chưa kiểm chứng: <danh sách, nói thẳng>
8. git log -3 --oneline
```

---

## 7. Rủi ro và thứ tự cắt giảm

| Rủi ro | Cách xử lý |
|---|---|
| Hết lượt Gemini hoặc 429 giữa chừng | Dừng, giữ `ai-rate-progress.json`, chạy tiếp hôm sau; có C8 làm ngày dự phòng |
| Overpass hoặc Wikimedia chậm | Chạy một phần (`--diemDen`), ngoài giờ cao điểm; không lấy lại dữ liệu đã có hợp lệ |
| Độ phủ ảnh thấp ở khách sạn, quán ăn | Dùng hình minh họa theo loại; ghi độ phủ thật vào báo cáo, không tìm ảnh theo tên |
| Unsplash demo 50 yêu cầu mỗi giờ | Chạy `data:images:goiy` một lần, ít hơn 50 yêu cầu; chỉ chạy lại khi cần |
| Trễ tiến độ | Cắt theo thứ tự: E11, lịch trình mẫu trên Home (E5 khối 7), E7, lưới tính năng "Sắp có", E9, rồi F3; **không cắt** C1 đến C3, F1, F4, G3 |

---

## Phụ lục A: đáp án test cho B1 (do người dùng đặt; không sửa)

Dùng chung cho mọi ca: 2 người, 3 ngày (2 đêm), 1 phòng, ăn uống mặc định 600.000 đ/ngày (1.800.000 cả chuyến), kho hoạt động rỗng, `DU_TRU_HOAT_DONG_TI_LE = 0.10`.

Ứng viên:
- Chiều đi: **PT_A** 06:30, 980.000 đ/người, 85 phút. **PT_B** 09:15, 1.350.000 đ/người, 85 phút. **PT_E** 07:00, 450.000 đ/người, 600 phút.
- Chiều về: **PT_C** 18:00, 980.000 đ/người, 85 phút. **PT_D** 22:40, 790.000 đ/người, 85 phút. **PT_F** 18:00, 450.000 đ/người, 600 phút.
- Khách sạn: **H1** 1.100.000 đ/đêm. **H2** 780.000 đ/đêm.

Chi phí cố định tham khảo: A đi 1.960.000; B đi 2.700.000; E đi 900.000; C về 1.960.000; D về 1.580.000; F về 900.000 (đã nhân 2 người); H2 2 đêm 1.560.000; ăn uống 1.800.000.

| # | Ngân sách | Điều cần tránh | Kết quả mong đợi |
|---|---|---|---|
| 1 | 10.000.000 | không | Đi PT_A, về PT_D, H2; tongVND 6.900.000 (tổng 170 phút; nhanh nhất; bằng nhau thì rẻ nhất). `minBudget` vẫn 5.160.000 (E + F + H2) |
| 2 | 7.000.000 | không | Ngưỡng cố định 6.300.000. Hợp lệ: A+F, E+C, E+D, E+F. Ngắn nhất là 685 phút (A+F, E+C, E+D), rẻ nhất trong ba: **đi PT_E, về PT_D, H2; tongVND 5.840.000** |
| 3 | 6.200.000 | không | Ngưỡng 5.580.000; chỉ E+F+H2 (5.160.000) hợp lệ. **Đi PT_E, về PT_F, H2; tongVND 5.160.000** |
| 4 | 5.500.000 | không | Không tổ hợp nào dưới ngưỡng 4.950.000, dùng rẻ nhất còn trong ngân sách: **Đi PT_E, về PT_F, H2; tongVND 5.160.000** |
| 5 | 5.000.000 | không | `khong_the_dat_ngan_sach`, `toiThieuVND` 5.160.000 |

Sáu ca của Bước 13 (không dùng PT_E, PT_F) giữ nguyên đáp án cũ: 6.900.000; 7.280.000 (tránh "dem"); 8.020.000 (tránh "sang"); 8.020.000 (tránh cả hai); `khong_the_dat_ngan_sach` với 6.800.000 và `toiThieuVND` 6.900.000; ca có A1 và A2 cho 6.980.000.

### Fixture M (Đến sau nửa đêm)
- PT_A: 06:30, 85m, 980k (đến ngày 1, soDem=2)
- PT_G: 19:00, 600m, 450k (đến ngày 2 lúc 05:00, soDem=1)
- PT_C: 18:00, 85m, 980k
- PT_F: 18:00, 600m, 450k
- H2: 780.000 đ/đêm
- Ăn uống: 1.800.000 đ (600.000 đ/ngày)
Các ca:
a. Ngân sách 10.000.000 đ: chọn PT_A + PT_C, H2 (170m), tongVND 7.280.000
b. Ngân sách 6.500.000 đ: chọn PT_G + PT_C, H2 (685m), tongVND 5.440.000
c. Ngân sách 6.000.000 đ: chọn PT_G + PT_F, H2 (1200m), tongVND 4.380.000
d. Ngân sách 4.000.000 đ: khong_the_dat_ngan_sach, toiThieuVND 4.380.000

## Phụ lục B: nguyên tắc Gemini

- Mỗi ngày chạy **một** bộ có dùng Gemini. Không chạy thử AI bằng tay trong cùng ngày.
- Thử giao diện: `LIVE_AI_ENABLED=false` (quy tắc, 0 lượt Gemini).
- Nếu `.env.local` đặt `PLAN_MAX_AI_CALLS` nhỏ để tiết kiệm khi phát triển, **gỡ** trước khi chạy `eval:ai-rate`.

## Phụ lục C: nhật ký thay đổi kế hoạch

| Ngày | Thay đổi | Lý do |
|---|---|---|
| 21/10 | Tạo kế hoạch | |
| 21/10 | Bổ sung nhiệm vụ A4 (đóng gói snapshot cho Vercel) và C4a (kiểm tra bộ chấm eval:parse) | Người dùng bổ sung |
| 22/10 | Tách B1 thành B1a và B1b; bổ sung Fixture M vào Phụ lục A; hạn đóng băng lõi 23/10 | Tách nhiệm vụ chẩn đoán & sửa lỗi số đêm/ô trống và hoàn thiện dự phòng nhanh nhất |
