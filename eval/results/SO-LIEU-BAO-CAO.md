# SỐ LIỆU TỔNG HỢP CÁC BỘ ĐÁNH GIÁ (EVALUATION REPORT)

> Ngày tổng hợp: 2026-10-21 | Phiên bản quy tắc chuẩn: QUY_TAC_VERSION = "3"

## 1. Bảng tổng quan trạng thái các bộ kiểm thử

| STT | Bộ đánh giá | Trạng thái | Tỷ lệ ca thành công | Model | Phiên bản Prompt | Quy tắc Version | Ngày chạy |
|:---:|:---|:---:|:---:|:---|:---:|:---:|:---:|
| 1 | **Phân tích yêu cầu tự nhiên (Parse Request)** (parse) | **CHƯA CHẠY** | - | - | - | - | - |
| 2 | **Tự sửa kế hoạch vi phạm (Repair Plan)** (repair) | **CHƯA CHẠY** | - | - | - | - | - |
| 3 | **Nhận diện hóa đơn (Bill Extraction)** (bill) | Đã chạy | **4/5** | gemini-3.5-flash-lite | v1 | 3 | 2026-10-19 |
| 4 | **Tối ưu sở thích người dùng (Preference Matching)** (likes) | Đã chạy | **5/5 hợp lệ; 2/5 điểm tăng** | gemini-3.5-flash-lite | v1 | 3 | 2026-10-19 |
| 5 | **Kiểm tra dữ liệu Live (Data Quality)** (data) | **CHƯA CHẠY** | - | - | - | - | - |
| 6 | **Kiểm tra chất lượng địa điểm (Location Data)** (diadiem) | Đã chạy | **6/6** | N/A (Nominatim + Overpass OSM) | N/A | 3 | 2026-10-20 |
| 7 | **Đánh giá chất lượng lập kế hoạch AI (AI Rate)** (ai-rate) | Đã chạy | **0/10** | gemini-3.5-flash-lite | v3 | v1 (CŨ) | 2026-10-20 **(CŨ)** |

---

## 2. Chi tiết từng bộ đánh giá

### 2.1. Phân tích yêu cầu tự nhiên (Parse Request) (`parse`)

**Trạng thái: CHƯA CHẠY**

- Chưa tìm thấy tập tin kết quả kiểm thử trong `eval/results/`.

### 2.2. Tự sửa kế hoạch vi phạm (Repair Plan) (`repair`)

**Trạng thái: CHƯA CHẠY**

- Chưa tìm thấy tập tin kết quả kiểm thử trong `eval/results/`.

### 2.3. Nhận diện hóa đơn (Bill Extraction) (`bill`)

- **Tập tin kết quả mới nhất**: `bill-2026-10-19.json`
- **Ngày chạy**: 2026-10-19 ✅ (Hợp lệ)
- **Model**: `gemini-3.5-flash-lite`
- **Prompt Version**: `v1`
- **Quy tắc Version**: `3` (Hiện tại: `3`)
- **Kết quả**: **4/5** ca đạt

| Chỉ số | Giá trị |
|:---|:---|
| Hóa đơn thật hợp lệ | 4/4 |
| Không phải hóa đơn | 0/1 |
| Lỗi nguy hiểm (lệch tiền/bịa đặt) | 0 |
| Thời gian trung bình | 2594 ms |

#### ⚠️ Danh sách ca xấu / chưa đạt:
- Tập tin "b05_thuc_don_khong_phai_hoa_don.jpg": Nhận diện sai (Lỗi: loaiChungTu: mong đợi null, thực tế khac)

### 2.4. Tối ưu sở thích người dùng (Preference Matching) (`likes`)

- **Tập tin kết quả mới nhất**: `likes-2026-10-19.json`
- **Ngày chạy**: 2026-10-19 ✅ (Hợp lệ)
- **Model**: `gemini-3.5-flash-lite`
- **Prompt Version**: `v1`
- **Quy tắc Version**: `3` (Hiện tại: `3`)
- **Kết quả**: **5/5 hợp lệ; 2/5 điểm tăng** ca đạt

| Chỉ số | Giá trị |
|:---|:---|
| Kế hoạch hợp lệ | 5/5 |
| Điểm sở thích tăng | 2/5 |
| Dừng sớm do lỗi 429 | Không |
| Số lượt gọi AI trung bình | 1 |

#### ⚠️ Danh sách ca xấu / chưa đạt:
- Kịch bản "1. [bien, hai_san]": Điểm khớp sở thích không tăng (0.5 -> 0.5)
- Kịch bản "3. [thien_nhien, check_in_chup_anh]": Điểm khớp sở thích không tăng (0.5 -> 0)
- Kịch bản "5. [] + không muốn đi bộ nhiều": Điểm khớp sở thích không tăng (0 -> 0)

### 2.5. Kiểm tra dữ liệu Live (Data Quality) (`data`)

**Trạng thái: CHƯA CHẠY**

- Chưa tìm thấy tập tin kết quả kiểm thử trong `eval/results/`.

### 2.6. Kiểm tra chất lượng địa điểm (Location Data) (`diadiem`)

- **Tập tin kết quả mới nhất**: `diadiem-live-2026-10-20.json`
- **Ngày chạy**: 2026-10-20 ✅ (Hợp lệ)
- **Model**: `N/A (Nominatim + Overpass OSM)`
- **Prompt Version**: `N/A`
- **Quy tắc Version**: `3` (Hiện tại: `3`)
- **Kết quả**: **6/6** ca đạt

| Chỉ số | Giá trị |
|:---|:---|
| Số điểm đến hợp lệ | 6/6 |
| Tỷ lệ có nguồn | 100% |

#### ⚠️ Danh sách ca xấu / chưa đạt:
- Điểm đến "Đà Nẵng": Thiếu khách sạn (Overpass ERR/0 mục)
- Điểm đến "Hà Nội": Thiếu khách sạn (Overpass ERR/0 mục)
- Điểm đến "Seoul": Thiếu khách sạn (Overpass ERR/0 mục)

#### 🚨 Cảnh báo nguy hiểm (Dangerous Warnings):
- **Điểm đến "Đà Nẵng": Overpass timeout/error: The operation was aborted due to timeout**
- **Điểm đến "Hà Nội": Overpass timeout/error: The operation was aborted due to timeout**
- **Điểm đến "Đà Lạt": Overpass timeout/error: The operation was aborted due to timeout**
- **Điểm đến "Phú Quốc": Overpass timeout/error: The operation was aborted due to timeout**
- **Điểm đến "Seoul": Overpass timeout/error: The operation was aborted due to timeout**

### 2.7. Đánh giá chất lượng lập kế hoạch AI (AI Rate) (`ai-rate`)

- **Tập tin kết quả mới nhất**: `ai-rate-2026-10-20.json`
- **Ngày chạy**: 2026-10-20 ⚠️ **(ĐÁNH DẤU CŨ: Kết quả thuộc phiên bản quy tắc cũ (v1), khác với quy tắc hiện tại (v3))**
- **Model**: `gemini-3.5-flash-lite`
- **Prompt Version**: `v3`
- **Quy tắc Version**: `v1 (CŨ)` (Hiện tại: `3`)
- **Kết quả**: **0/10** ca đạt

| Chỉ số | Giá trị |
|:---|:---|
| Số kịch bản đã chạy với luật hiện tại | 0/10 |
| Số kịch bản mang nhãn cũ | 3 |
| Dừng sớm do lỗi 429 | Không |

#### ⚠️ Danh sách ca xấu / chưa đạt:
- Kịch bản 1 (Đà Nẵng): Kết quả sinh từ phiên bản quy tắc cũ (CŨ (quy tắc v1))
- Kịch bản 2 (Đà Nẵng): Kết quả sinh từ phiên bản quy tắc cũ (CŨ (quy tắc v1))
- Kịch bản 3 (Hà Nội): Phải dùng fallback bằng quy tắc tự động (lý do: het_luot_ai)
- Kịch bản 3 (Hà Nội): Kết quả sinh từ phiên bản quy tắc cũ (CŨ (quy tắc v1))

---

## Giới hạn

- Mẫu nhỏ;
- Dữ liệu OpenStreetMap có thể thiếu;
- Giá vé và giá phòng là ước tính;
- Hạn mức Gemini và Tavily;
- Kết quả khác nhau theo điểm đến và thay đổi theo giờ chạy;
- Phú Quốc không có snapshot hợp lệ.
