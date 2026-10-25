# SỐ LIỆU TỔNG HỢP CÁC BỘ ĐÁNH GIÁ (EVALUATION REPORT)

> Ngày tổng hợp: 2026-10-21 | Phiên bản quy tắc chuẩn: `QUY_TAC_VERSION = "5"` | Agent Prompt: `AGENT_PROMPT_VERSION = "v4"`

## 1. Bảng tổng quan trạng thái các bộ kiểm thử

| STT | Bộ đánh giá | Trạng thái | Đánh giá độ mới | Kết quả tổng quát | Model | Prompt Version | Quy tắc Version (file) | Ngày chạy |
|:---:|:---|:---:|:---|:---|:---|:---:|:---:|:---:|
| 1 | **Phân tích yêu cầu tự nhiên (Parse Request)** (`parse`) | Đã chạy | HOP_LE | **Đạt 10/10 ca** | gemini-3-flash-preview | v4 | 5 | 2026-10-25 |
| 2 | **Tự sửa kế hoạch vi phạm (Repair Plan)** (`repair`) | Đã chạy | HOP_LE | **ĐÃ CHẠY** | gemini-3-flash-preview | v4 | 5 | 2026-10-25 |
| 3 | **Nhận diện hóa đơn (Bill Extraction)** (`bill`) | Đã chạy | **CU_KHAC_PHIEN_BAN** | **Hóa đơn thật: 4/4; Không phải hóa đơn: 1/1** | gemini-3.5-flash-lite | v4 | 3 | 2026-10-19 (chấm lại ngày 2026-10-21) |
| 4 | **Tối ưu sở thích người dùng (Preference Matching)** (`likes`) | Đã chạy | HOP_LE | **0 tăng, 0 giữ nguyên, 0 tệ đi** | gemini-3-flash-preview | v1 | 5 | 2026-10-22 |
| 5 | **Kiểm tra dữ liệu Live (Data Quality)** (`data`) | Đã chạy | HOP_LE | **Tổng địa điểm: 0** | khong_dung_ai | v4 | 5 | 2026-10-22 |
| 6 | **Kiểm tra chất lượng địa điểm (Location Data)** (`diadiem`) | Đã chạy | HOP_LE | **Live: 5/6 CÓ NỘI DUNG; 0 CÓ VI PHẠM; 0 CHƯA LẤP ĐỦ Ô; 1 THIẾU DỮ LIỆU | Có dự phòng: 5/6 CÓ NỘI DUNG; 0 CÓ VI PHẠM; 0 CHƯA LẤP ĐỦ Ô; 1 THIẾU DỮ LIỆU** | khong_dung_ai | v4 | 5 | 2026-10-22 |
| 7 | **Đánh giá chất lượng lập kế hoạch AI (AI Rate)** (`ai-rate`) | Đã chạy | HOP_LE | **2/10 kịch bản đã chạy với quy tắc hiện tại** | gemini-3.5-flash-lite | v4 | 5 | 2026-10-22 |

---

## 2. Chi tiết từng bộ đánh giá

### 2.1. Phân tích yêu cầu tự nhiên (Parse Request) (`parse`)

> **Định nghĩa đạt**: Số yêu cầu parse đúng toàn bộ các trường trên tổng số ca kiểm thử.

- **Tập tin kết quả**: `parse-2026-10-25.json`
- **Ngày chạy**: 2026-10-25
- **Trường quy tắc ghi nhận từ file**: `5` *(hiện tại: `5`)*
- **Trường prompt ghi nhận từ file**: `v4` *(hiện tại: `v4`)*
- **Đánh giá độ mới**: `HOP_LE` — ✅ Hợp lệ (trong vòng 7 ngày, đúng quy tắc hiện tại)
- **Kết quả**: **Đạt 10/10 ca**

### 2.2. Tự sửa kế hoạch vi phạm (Repair Plan) (`repair`)

> **Định nghĩa đạt**: Số kế hoạch có vi phạm ban đầu được AI sửa thành công trên tổng số ca.

- **Tập tin kết quả**: `repair-2026-10-25.json`
- **Ngày chạy**: 2026-10-25
- **Trường quy tắc ghi nhận từ file**: `5` *(hiện tại: `5`)*
- **Trường prompt ghi nhận từ file**: `v4` *(hiện tại: `v4`)*
- **Đánh giá độ mới**: `HOP_LE` — ✅ Hợp lệ (trong vòng 7 ngày, đúng quy tắc hiện tại)
- **Kết quả**: **ĐÃ CHẠY**

### 2.3. Nhận diện hóa đơn (Bill Extraction) (`bill`)

> **Định nghĩa đạt**: Số hóa đơn thật đúng trên số hóa đơn thật; số 'không phải hóa đơn' xử lý đúng trên số ca.

- **Tập tin kết quả**: `bill-cham-lai-2026-10-21.json`
- **Ngày chạy**: 2026-10-19 (chấm lại ngày 2026-10-21)
- **Trường quy tắc ghi nhận từ file**: `3` *(hiện tại: `5`)*
- **Trường prompt ghi nhận từ file**: `v4` *(hiện tại: `v4`)*
- **Đánh giá độ mới**: `CU_KHAC_PHIEN_BAN` — ⚠️ CŨ: Quy tắc ghi trong file (3) khác quy tắc hiện tại (5)
- **Kết quả**: **Hóa đơn thật: 4/4; Không phải hóa đơn: 1/1**

> **Lưu ý chấm lại**: Ngày gọi AI gốc: **2026-10-19**; Ngày chấm lại: **2026-10-21** (quy tắc 3).

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

- **Tập tin kết quả**: `likes-2026-10-22.json`
- **Ngày chạy**: 2026-10-22
- **Trường quy tắc ghi nhận từ file**: `5` *(hiện tại: `5`)*
- **Trường prompt ghi nhận từ file**: `v1` *(hiện tại: `v4`)*
- **Đánh giá độ mới**: `HOP_LE` — ✅ Hợp lệ (trong vòng 7 ngày, đúng quy tắc hiện tại)
- **Kết quả**: **0 tăng, 0 giữ nguyên, 0 tệ đi**

| Kịch bản | Sở thích | Điểm trước | Điểm sau | Kết quả |
|:---|:---|:---:|:---:|:---:|

**Tổng kết**: 0 tăng, 0 giữ nguyên, 0 tệ đi

### 2.5. Kiểm tra dữ liệu Live (Data Quality) (`data`)

> **Định nghĩa đạt**: Số điểm đến có đủ khách sạn, quán ăn, hoạt động và phương tiện live mà không bị lỗi mạng hay rỗng dữ liệu.

- **Tập tin kết quả**: `data-2026-10-22.json`
- **Ngày chạy**: 2026-10-22
- **Trường quy tắc ghi nhận từ file**: `5` *(hiện tại: `5`)*
- **Trường prompt ghi nhận từ file**: `v4` *(hiện tại: `v4`)*
- **Đánh giá độ mới**: `HOP_LE` — ✅ Hợp lệ (trong vòng 7 ngày, đúng quy tắc hiện tại)
- **Kết quả**: **Tổng địa điểm: 0**

### 2.6. Kiểm tra chất lượng địa điểm (Location Data) (`diadiem`)

> **Định nghĩa đạt**: Số điểm đến 'CÓ NỘI DUNG' trên tổng, kèm số 'CÓ VI PHẠM', 'CHƯA LẤP ĐỦ Ô', 'THIẾU DỮ LIỆU'. Hai bảng riêng: 'live-only' và 'có dự phòng'. KHÔNG đếm 'định vị được' (geocodeThanhCong) như thành công.

- **Tập tin kết quả**: `diadiem-live-2026-10-22.json`
- **Ngày chạy**: 2026-10-22
- **Trường quy tắc ghi nhận từ file**: `5` *(hiện tại: `5`)*
- **Trường prompt ghi nhận từ file**: `v4` *(hiện tại: `v4`)*
- **Đánh giá độ mới**: `HOP_LE` — ✅ Hợp lệ (trong vòng 7 ngày, đúng quy tắc hiện tại)
- **Kết quả**: **Live: 5/6 CÓ NỘI DUNG; 0 CÓ VI PHẠM; 0 CHƯA LẤP ĐỦ Ô; 1 THIẾU DỮ LIỆU | Có dự phòng: 5/6 CÓ NỘI DUNG; 0 CÓ VI PHẠM; 0 CHƯA LẤP ĐỦ Ô; 1 THIẾU DỮ LIỆU**

#### Bảng 1: Kết quả chế độ Trực tiếp thuần (live-only)

*Tổng kết live-only*: **5/6 CÓ NỘI DUNG; 0 CÓ VI PHẠM; 0 CHƯA LẤP ĐỦ Ô; 1 THIẾU DỮ LIỆU**

| STT | Điểm đến | Định vị | Trạng thái nội dung | KS / Ăn / Cafe / HĐ | Ô chưa lấp | Lỗi vi phạm / Ghi chú |
|:---:|:---|:---:|:---:|:---:|:---:|:---|
| 1 | **Đà Nẵng** | Thành công | **CÓ NỘI DUNG** | 15/15/15/15 | HĐ:0, Ăn:6 | Tốt: Lập kế hoạch CÓ NỘI DUNG (đạt >= 80% ô khả dụng, không vi phạm hard). |
| 2 | **Hà Nội** | Thành công | **CÓ NỘI DUNG** | 15/15/15/15 | HĐ:0, Ăn:0 | Tốt: Lập kế hoạch CÓ NỘI DUNG (đạt >= 80% ô khả dụng, không vi phạm hard). |
| 3 | **Đà Lạt** | Thành công | **CÓ NỘI DUNG** | 15/15/15/15 | HĐ:0, Ăn:6 | Tốt: Lập kế hoạch CÓ NỘI DUNG (đạt >= 80% ô khả dụng, không vi phạm hard). |
| 4 | **Phú Quốc** | Thành công | **THIẾU DỮ LIỆU** | 0/0/0/0 | — | thiếu khach_san, quan_an, hoat_dong - máy chủ N/A - Dữ liệu địa phương tại Đặc khu Phú Quốc chưa đủ để lập kế hoạch chất lượng: thiếu khách sạn (0/3), điểm tham quan (0/3), quán ăn (0/2). Nguồn: OpenStreetMap. Chi tiết máy chủ: Chưa có lượt gọi Overpass nào. |
| 5 | **Bangkok** | Thành công | **CÓ NỘI DUNG** | 15/15/15/15 | HĐ:0, Ăn:6 | Tốt: Lập kế hoạch CÓ NỘI DUNG (đạt >= 80% ô khả dụng, không vi phạm hard). |
| 6 | **Seoul** | Thành công | **CÓ NỘI DUNG** | 15/15/15/15 | HĐ:0, Ăn:6 | Tốt: Lập kế hoạch CÓ NỘI DUNG (đạt >= 80% ô khả dụng, không vi phạm hard). |

> *Ghi chú cảnh báo*: Ở chế độ live-only, máy chủ Overpass thường xuyên bị timeout hoặc trả về 0 mục đối với khách sạn (Đà Nẵng, Hà Nội, Seoul), dẫn đến trạng thái THIẾU DỮ LIỆU.

#### Bảng 2: Kết quả khi có cơ chế Dự phòng (có dự phòng snapshot / cache)

*Tổng kết có dự phòng*: **5/6 CÓ NỘI DUNG; 0 CÓ VI PHẠM; 0 CHƯA LẤP ĐỦ Ô; 1 THIẾU DỮ LIỆU**

| STT | Điểm đến | Định vị | Trạng thái nội dung | Nguồn dữ liệu | KS / Ăn / Cafe / HĐ | Ô chưa lấp | Kết quả kế hoạch |
|:---:|:---|:---:|:---:|:---|:---:|:---:|:---|
| 1 | **Đà Nẵng** | Thành công | **CÓ NỘI DUNG** (từ lần chạy ngày 2026-10-22) | snapshot (ngày 2026-10-20) | 15/15/15/15 | HĐ:0, Ăn:6 | ✅ Hợp lệ, đủ ô |
| 2 | **Hà Nội** | Thành công | **CÓ NỘI DUNG** (từ lần chạy ngày 2026-10-22) | snapshot (ngày 2026-10-20) | 15/15/15/15 | HĐ:0, Ăn:0 | ✅ Hợp lệ, đủ ô |
| 3 | **Đà Lạt** | Thành công | **CÓ NỘI DUNG** (từ lần chạy ngày 2026-10-22) | snapshot (ngày 2026-10-20) | 15/15/15/15 | HĐ:0, Ăn:6 | ✅ Hợp lệ, đủ ô |
| 4 | **Phú Quốc** | Thành công | **THIẾU DỮ LIỆU (không có snapshot)** | — | — | — | ❌ Thiếu snapshot hợp lệ trong src/data/snapshots |
| 5 | **Bangkok** | Thành công | **CÓ NỘI DUNG** (từ lần chạy ngày 2026-10-22) | snapshot (ngày 2026-10-20) | 15/15/15/15 | HĐ:0, Ăn:6 | ✅ Hợp lệ, đủ ô |
| 6 | **Seoul** | Thành công | **CÓ NỘI DUNG** (từ lần chạy ngày 2026-10-22) | snapshot (ngày 2026-10-20) | 15/15/15/15 | HĐ:0, Ăn:6 | ✅ Hợp lệ, đủ ô |

### 2.7. Đánh giá chất lượng lập kế hoạch AI (AI Rate) (`ai-rate`)

> **Định nghĩa đạt**: 'x/10 kịch bản đã chạy với quy tắc hiện tại' (chỉ tính HOP_LE); đọc ĐÚNG trường phiên bản prompt agent (hiện AGENT_PROMPT_VERSION = 'v4'); nêu rõ nếu file ghi khác.

- **Tập tin kết quả**: `ai-rate-2026-10-22.json`
- **Ngày chạy**: 2026-10-22
- **Trường quy tắc ghi nhận từ file**: `5` *(hiện tại: `5`)*
- **Trường prompt ghi nhận từ file**: `v4` *(hiện tại: `v4`)*
- **Đánh giá độ mới**: `HOP_LE` — ✅ Hợp lệ (trong vòng 7 ngày, đúng quy tắc hiện tại)
- **Kết quả**: **2/10 kịch bản đã chạy với quy tắc hiện tại**

| Chỉ số | Giá trị | Ghi chú |
|:---|:---:|:---|
| Số kịch bản đã chạy với quy tắc hiện tại | **2/10** | Chỉ tính các kịch bản có độ mới HOP_LE |
| Số kịch bản mang nhãn quy tắc cũ | **1** | Chạy với quy tắc v1 (cũ), khác quy tắc v3 hiện tại |
| Phiên bản Prompt trong file | **v4** | File ghi: `v4` |
| Phiên bản Prompt Agent hiện tại trong code | **v4** | `AGENT_PROMPT_VERSION = "v4"` (src/ai/planAgent.ts) |
| Dừng sớm do lỗi 429 | Có | - |

#### ⚠️ Phân tích sự sai lệch phiên bản:
- Tập tin kết quả `ai-rate-2026-10-22.json` được sinh ra từ phiên bản quy tắc cũ (`v1`), chưa chạy lại với quy tắc hiện tại (`v3`).
- Phiên bản prompt agent trong mã nguồn hiện tại là **`v4`**, trong khi kết quả cũ không phản ánh prompt `v4`.
- Do đó, theo quy tắc đánh giá độ mới, bộ này hiện có **0/10 kịch bản hợp lệ** với quy tắc hiện tại.

---

## 3. CẦN CHẠY LẠI SAU KHI ĐÓNG BĂNG

Dưới đây là danh sách các bộ kiểm thử đang ở trạng thái **CŨ** (không ghi phiên bản, khác phiên bản quy tắc, hoặc quá 7 ngày) hoặc **CHƯA CHẠY**, cần được chạy lại sau khi hoàn thành đóng băng mã nguồn:

| STT | Bộ kiểm thử | Mã bộ | Tình trạng hiện tại | Lý do cần chạy lại |
|:---:|:---|:---:|:---|:---|
| 1 | **Nhận diện hóa đơn (Bill Extraction)** | `bill` | ⚠️ CẦN CHẠY LẠI | CU_KHAC_PHIEN_BAN: ⚠️ CŨ: Quy tắc ghi trong file (3) khác quy tắc hiện tại (5) |

---

## Giới hạn

- Mẫu nhỏ;
- Dữ liệu OpenStreetMap có thể thiếu;
- Giá vé và giá phòng là ước tính;
- Hạn mức Gemini và Tavily;
- Kết quả khác nhau theo điểm đến và thay đổi theo giờ chạy;
- Phú Quốc không có snapshot hợp lệ.
