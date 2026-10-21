# SỐ LIỆU TỔNG HỢP CÁC BỘ ĐÁNH GIÁ (EVALUATION REPORT)

> Ngày tổng hợp: 2026-10-21 | Phiên bản quy tắc chuẩn: `QUY_TAC_VERSION = "3"` | Agent Prompt: `AGENT_PROMPT_VERSION = "v4"`

## 1. Bảng tổng quan trạng thái các bộ kiểm thử

| STT | Bộ đánh giá | Trạng thái | Đánh giá độ mới | Kết quả tổng quát | Model | Prompt Version | Quy tắc Version (file) | Ngày chạy |
|:---:|:---|:---:|:---|:---|:---|:---:|:---:|:---:|
| 1 | **Phân tích yêu cầu tự nhiên (Parse Request)** (`parse`) | **CHƯA CHẠY** | - | **CHƯA CHẠY** | - | - | - | - |
| 2 | **Tự sửa kế hoạch vi phạm (Repair Plan)** (`repair`) | **CHƯA CHẠY** | - | **CHƯA CHẠY** | - | - | - | - |
| 3 | **Nhận diện hóa đơn (Bill Extraction)** (`bill`) | Đã chạy | **CU_KHONG_GHI_PHIEN_BAN** | **Hóa đơn thật: 4/4; Không phải hóa đơn: 1/1** | gemini-3.5-flash-lite | v1 | (không ghi) | 2026-10-19 |
| 4 | **Tối ưu sở thích người dùng (Preference Matching)** (`likes`) | Đã chạy | **CU_KHONG_GHI_PHIEN_BAN** | **2 tăng, 2 giữ nguyên, 1 tệ đi** | gemini-3.5-flash-lite | v1 | (không ghi) | 2026-10-19 |
| 5 | **Kiểm tra dữ liệu Live (Data Quality)** (`data`) | **CHƯA CHẠY** | - | **CHƯA CHẠY** | - | - | - | - |
| 6 | **Kiểm tra chất lượng địa điểm (Location Data)** (`diadiem`) | Đã chạy | **CU_KHONG_GHI_PHIEN_BAN** | **Live: 3/6 CÓ NỘI DUNG; 0 CÓ VI PHẠM; 0 CHƯA LẤP ĐỦ Ô; 3 THIẾU DỮ LIỆU | Có dự phòng: 5/6 CÓ NỘI DUNG; 0 CÓ VI PHẠM; 0 CHƯA LẤP ĐỦ Ô; 1 THIẾU DỮ LIỆU** | Nominatim + Overpass OSM | N/A | (không ghi) | 2026-10-20 |
| 7 | **Đánh giá chất lượng lập kế hoạch AI (AI Rate)** (`ai-rate`) | Đã chạy | **CU_KHONG_GHI_PHIEN_BAN** | **0/10 kịch bản đã chạy với quy tắc hiện tại** | gemini-3.5-flash-lite | (không ghi) | (không ghi) | 2026-10-20 |

---

## 2. Chi tiết từng bộ đánh giá

### 2.1. Phân tích yêu cầu tự nhiên (Parse Request) (`parse`)

> **Định nghĩa đạt**: Số yêu cầu parse đúng toàn bộ các trường (điểm đến, số ngày, ngân sách, số người, sở thích) trên tổng số ca kiểm thử.

**Trạng thái**: **CHƯA CHẠY**

- Chưa có kết quả kiểm thử trong `eval/results/`.

### 2.2. Tự sửa kế hoạch vi phạm (Repair Plan) (`repair`)

> **Định nghĩa đạt**: Số kế hoạch có vi phạm ban đầu được AI sửa thành công (0 lỗi hard, ngân sách hợp lệ) trên tổng số ca.

**Trạng thái**: **CHƯA CHẠY**

- Chưa có kết quả kiểm thử trong `eval/results/`.

### 2.3. Nhận diện hóa đơn (Bill Extraction) (`bill`)

> **Định nghĩa đạt**: Số hóa đơn thật đúng trên số hóa đơn thật; số 'không phải hóa đơn' xử lý đúng trên số ca.

- **Tập tin kết quả**: `bill-2026-10-19.json`
- **Ngày chạy**: 2026-10-19
- **Trường quy tắc ghi nhận từ file**: `(không ghi)` *(hiện tại: `3`)*
- **Trường prompt ghi nhận từ file**: `v1` *(hiện tại: `v4`)*
- **Đánh giá độ mới**: `CU_KHONG_GHI_PHIEN_BAN` — ⚠️ CŨ: Tập tin kết quả không ghi trường phiên bản quy tắc
- **Kết quả**: **Hóa đơn thật: 4/4; Không phải hóa đơn: 1/1**

| Hạng mục | Đạt / Tổng | Tỷ lệ |
|:---|:---:|:---:|
| Hóa đơn thật hợp lệ | **4/4** | 100% |
| Không phải hóa đơn | **1/1** | 100% |

#### ✅ Chi tiết ca b05 (ảnh thực đơn):
- Tập tin: `b05_thuc_don_khong_phai_hoa_don.jpg`
- Trạng thái: **ĐẠT** (xử lý đúng không phải hóa đơn)
- Ghi chú: **AI xử lý đúng, bộ chấm đã sửa ngày 2026-10-21** (AI phát hiện ra đây là thực đơn `status: "khong_phai_chung_tu"` và trường `loaiChungTu` được chấp nhận khớp khi đáp án mong đợi là null).

### 2.4. Tối ưu sở thích người dùng (Preference Matching) (`likes`)

> **Định nghĩa đạt**: Ba số riêng biệt: số kịch bản tăng điểm sở thích, số kịch bản giữ nguyên và số kịch bản tệ đi (KHÔNG dùng 'hợp lệ' làm tiêu đề kết quả).

- **Tập tin kết quả**: `likes-2026-10-19.json`
- **Ngày chạy**: 2026-10-19
- **Trường quy tắc ghi nhận từ file**: `(không ghi)` *(hiện tại: `3`)*
- **Trường prompt ghi nhận từ file**: `v1` *(hiện tại: `v4`)*
- **Đánh giá độ mới**: `CU_KHONG_GHI_PHIEN_BAN` — ⚠️ CŨ: Tập tin kết quả không ghi trường phiên bản quy tắc
- **Kết quả**: **2 tăng, 2 giữ nguyên, 1 tệ đi**

| Kịch bản | Sở thích | Điểm trước | Điểm sau | Kết quả |
|:---|:---|:---:|:---:|:---:|
| 1. [bien, hai_san] | ["bien","hai_san"] | 0.5 | 0.5 | Giữ nguyên |
| 2. [van_hoa_lich_su, am_thuc] | ["van_hoa_lich_su","am_thuc"] | 0.5 | 1 | **Tăng** |
| 3. [thien_nhien, check_in_chup_anh] | ["thien_nhien","check_in_chup_anh"] | 0.5 | 0 | ⚠️ **Tệ đi** |
| 4. [thu_gian_spa] | ["thu_gian_spa"] | 0.25 | 0.5 | **Tăng** |
| 5. [] + không muốn đi bộ nhiều | [] | 0 | 0 | Giữ nguyên |

**Tổng kết**: 2 tăng, 2 giữ nguyên, 1 tệ đi

### 2.5. Kiểm tra dữ liệu Live (Data Quality) (`data`)

> **Định nghĩa đạt**: Số điểm đến có đủ khách sạn, quán ăn, hoạt động và phương tiện live mà không bị lỗi mạng hay rỗng dữ liệu.

**Trạng thái**: **CHƯA CHẠY**

- Chưa có kết quả kiểm thử trong `eval/results/`.

### 2.6. Kiểm tra chất lượng địa điểm (Location Data) (`diadiem`)

> **Định nghĩa đạt**: Số điểm đến 'CÓ NỘI DUNG' trên tổng, kèm số 'CÓ VI PHẠM', 'CHƯA LẤP ĐỦ Ô', 'THIẾU DỮ LIỆU'. Hai bảng riêng: 'live-only' và 'có dự phòng'. KHÔNG đếm 'định vị được' (geocodeThanhCong) như thành công.

- **Tập tin kết quả**: `diadiem-live-2026-10-20.json`
- **Ngày chạy**: 2026-10-20
- **Trường quy tắc ghi nhận từ file**: `(không ghi)` *(hiện tại: `3`)*
- **Trường prompt ghi nhận từ file**: `N/A` *(hiện tại: `v4`)*
- **Đánh giá độ mới**: `CU_KHONG_GHI_PHIEN_BAN` — ⚠️ CŨ: Tập tin kết quả không ghi trường phiên bản quy tắc
- **Kết quả**: **Live: 3/6 CÓ NỘI DUNG; 0 CÓ VI PHẠM; 0 CHƯA LẤP ĐỦ Ô; 3 THIẾU DỮ LIỆU | Có dự phòng: 5/6 CÓ NỘI DUNG; 0 CÓ VI PHẠM; 0 CHƯA LẤP ĐỦ Ô; 1 THIẾU DỮ LIỆU**

#### Bảng 1: Kết quả chế độ Trực tiếp thuần (live-only)

*Tổng kết live-only*: **3/6 CÓ NỘI DUNG; 0 CÓ VI PHẠM; 0 CHƯA LẤP ĐỦ Ô; 3 THIẾU DỮ LIỆU**

| STT | Điểm đến | Định vị | Trạng thái nội dung | KS / Ăn / Cafe / HĐ | Ô chưa lấp | Lỗi vi phạm / Ghi chú |
|:---:|:---|:---:|:---:|:---:|:---:|:---|
| 1 | **Đà Nẵng** | Thành công | **THIẾU DỮ LIỆU** | 0/15/0/15 | HĐ:0, Ăn:0 | Overpass: The operation was aborted due to timeout |
| 2 | **Hà Nội** | Thành công | **THIẾU DỮ LIỆU** | 0/15/0/15 | HĐ:0, Ăn:0 | Overpass: The operation was aborted due to timeout |
| 3 | **Đà Lạt** | Thành công | **CÓ NỘI DUNG** | 15/15/15/15 | HĐ:0, Ăn:0 | Overpass: The operation was aborted due to timeout |
| 4 | **Phú Quốc** | Thành công | **CÓ NỘI DUNG** | 15/15/0/15 | HĐ:0, Ăn:0 | Overpass: The operation was aborted due to timeout |
| 5 | **Bangkok** | Thành công | **CÓ NỘI DUNG** | 15/15/15/15 | HĐ:0, Ăn:0 | Tốt: Lập kế hoạch CÓ NỘI DUNG (đạt >= 80% ô khả dụng, không vi phạm hard). |
| 6 | **Seoul** | Thành công | **THIẾU DỮ LIỆU** | 15/15/15/0 | HĐ:0, Ăn:0 | Overpass: The operation was aborted due to timeout |

> *Ghi chú cảnh báo*: Ở chế độ live-only, máy chủ Overpass thường xuyên bị timeout hoặc trả về 0 mục đối với khách sạn (Đà Nẵng, Hà Nội, Seoul), dẫn đến trạng thái THIẾU DỮ LIỆU.

#### Bảng 2: Kết quả khi có cơ chế Dự phòng (có dự phòng snapshot / cache)

*Tổng kết có dự phòng*: **5/6 CÓ NỘI DUNG; 0 CÓ VI PHẠM; 0 CHƯA LẤP ĐỦ Ô; 1 THIẾU DỮ LIỆU**

| STT | Điểm đến | Định vị | Trạng thái nội dung | Nguồn dữ liệu | KS / Ăn / Cafe / HĐ | Ô chưa lấp | Kết quả kế hoạch |
|:---:|:---|:---:|:---:|:---|:---:|:---:|:---|
| 1 | **Đà Nẵng** | Thành công | **CÓ NỘI DUNG** (từ lần chạy ngày 2026-10-20) | cache (tuổi 0.4 giờ) | 15/15/15/15 | HĐ:0, Ăn:0 | ✅ Hợp lệ, đủ ô |
| 2 | **Hà Nội** | Thành công | **CÓ NỘI DUNG** (từ lần chạy ngày 2026-10-20) | cache (tuổi 0.3 giờ) | 15/15/15/15 | HĐ:0, Ăn:0 | ✅ Hợp lệ, đủ ô |
| 3 | **Đà Lạt** | Thành công | **CÓ NỘI DUNG** (từ lần chạy ngày 2026-10-20) | cache (tuổi 0.2 giờ) | 15/15/15/15 | HĐ:0, Ăn:0 | ✅ Hợp lệ, đủ ô |
| 4 | **Phú Quốc** | Thành công | **THIẾU DỮ LIỆU (không có snapshot)** | — | — | — | ❌ Thiếu snapshot hợp lệ trong src/data/snapshots |
| 5 | **Bangkok** | Thành công | **CÓ NỘI DUNG** (từ lần chạy ngày 2026-10-20) | cache (tuổi 0.1 giờ) | 15/15/15/15 | HĐ:0, Ăn:0 | ✅ Hợp lệ, đủ ô |
| 6 | **Seoul** | Thành công | **CÓ NỘI DUNG** (từ lần chạy ngày 2026-10-20) | cache (tuổi 0.1 giờ) | 15/15/15/15 | HĐ:0, Ăn:0 | ✅ Hợp lệ, đủ ô |

### 2.7. Đánh giá chất lượng lập kế hoạch AI (AI Rate) (`ai-rate`)

> **Định nghĩa đạt**: 'x/10 kịch bản đã chạy với quy tắc hiện tại' (chỉ tính HOP_LE); đọc ĐÚNG trường phiên bản prompt agent (hiện AGENT_PROMPT_VERSION = 'v4'); nêu rõ nếu file ghi khác.

- **Tập tin kết quả**: `ai-rate-2026-10-20.json`
- **Ngày chạy**: 2026-10-20
- **Trường quy tắc ghi nhận từ file**: `(không ghi)` *(hiện tại: `3`)*
- **Trường prompt ghi nhận từ file**: `(không ghi)` *(hiện tại: `v4`)*
- **Đánh giá độ mới**: `CU_KHONG_GHI_PHIEN_BAN` — ⚠️ CŨ: Tập tin kết quả không ghi trường phiên bản quy tắc
- **Kết quả**: **0/10 kịch bản đã chạy với quy tắc hiện tại**

| Chỉ số | Giá trị | Ghi chú |
|:---|:---:|:---|
| Số kịch bản đã chạy với quy tắc hiện tại | **0/10** | Chỉ tính các kịch bản có độ mới HOP_LE |
| Số kịch bản mang nhãn quy tắc cũ | **3** | Chạy với quy tắc v1 (cũ), khác quy tắc v3 hiện tại |
| Phiên bản Prompt trong file | **(không ghi)** | File ghi: `(không ghi)` |
| Phiên bản Prompt Agent hiện tại trong code | **v4** | `AGENT_PROMPT_VERSION = "v4"` (src/ai/planAgent.ts) |
| Dừng sớm do lỗi 429 | Không | - |

#### ⚠️ Phân tích sự sai lệch phiên bản:
- Tập tin kết quả `ai-rate-2026-10-20.json` được sinh ra từ phiên bản quy tắc cũ (`v1`), chưa chạy lại với quy tắc hiện tại (`v3`).
- Phiên bản prompt agent trong mã nguồn hiện tại là **`v4`**, trong khi kết quả cũ không phản ánh prompt `v4`.
- Do đó, theo quy tắc đánh giá độ mới, bộ này hiện có **0/10 kịch bản hợp lệ** với quy tắc hiện tại.

---

## 3. CẦN CHẠY LẠI SAU KHI ĐÓNG BĂNG

Dưới đây là danh sách các bộ kiểm thử đang ở trạng thái **CŨ** (không ghi phiên bản, khác phiên bản quy tắc, hoặc quá 7 ngày) hoặc **CHƯA CHẠY**, cần được chạy lại sau khi hoàn thành đóng băng mã nguồn:

| STT | Bộ kiểm thử | Mã bộ | Tình trạng hiện tại | Lý do cần chạy lại |
|:---:|:---|:---:|:---|:---|
| 1 | **Phân tích yêu cầu tự nhiên (Parse Request)** | `parse` | ⚠️ CẦN CHẠY LẠI | CHƯA CHẠY — chưa có tệp kết quả kiểm thử |
| 2 | **Tự sửa kế hoạch vi phạm (Repair Plan)** | `repair` | ⚠️ CẦN CHẠY LẠI | CHƯA CHẠY — chưa có tệp kết quả kiểm thử |
| 3 | **Nhận diện hóa đơn (Bill Extraction)** | `bill` | ⚠️ CẦN CHẠY LẠI | CU_KHONG_GHI_PHIEN_BAN: ⚠️ CŨ: Tập tin kết quả không ghi trường phiên bản quy tắc |
| 4 | **Tối ưu sở thích người dùng (Preference Matching)** | `likes` | ⚠️ CẦN CHẠY LẠI | CU_KHONG_GHI_PHIEN_BAN: ⚠️ CŨ: Tập tin kết quả không ghi trường phiên bản quy tắc |
| 5 | **Kiểm tra dữ liệu Live (Data Quality)** | `data` | ⚠️ CẦN CHẠY LẠI | CHƯA CHẠY — chưa có tệp kết quả kiểm thử |
| 6 | **Kiểm tra chất lượng địa điểm (Location Data)** | `diadiem` | ⚠️ CẦN CHẠY LẠI | CU_KHONG_GHI_PHIEN_BAN: ⚠️ CŨ: Tập tin kết quả không ghi trường phiên bản quy tắc |
| 7 | **Đánh giá chất lượng lập kế hoạch AI (AI Rate)** | `ai-rate` | ⚠️ CẦN CHẠY LẠI | CU_KHONG_GHI_PHIEN_BAN: ⚠️ CŨ: Tập tin kết quả không ghi trường phiên bản quy tắc |

---

## Giới hạn

- Mẫu nhỏ;
- Dữ liệu OpenStreetMap có thể thiếu;
- Giá vé và giá phòng là ước tính;
- Hạn mức Gemini và Tavily;
- Kết quả khác nhau theo điểm đến và thay đổi theo giờ chạy;
- Phú Quốc không có snapshot hợp lệ.
