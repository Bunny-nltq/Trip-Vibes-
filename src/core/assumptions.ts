/**
 * src/core/assumptions.ts
 *
 * CÁC HẰNG SỐ GIẢ ĐỊNH CỦA ĐỒ ÁN TRIP VIBES
 *
 * Mọi tính toán chi phí, thời gian và ngưỡng giới hạn trong core
 * đều sử dụng tập trung từ file này, không viết cứng số vào mã nguồn khác.
 */

// ─── Ăn uống ────────────────────────────────────────────────────────────────

/**
 * Chi phí ăn uống mặc định cho một người một bữa (VND).
 * GIẢ ĐỊNH đồ án: dùng khi quán ăn không có giá hoặc không chọn quán.
 */
export const AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA = 150_000;

/**
 * Chi phí cà phê mặc định cho một người (VND).
 * GIẢ ĐỊNH đồ án: dùng khi cafe không có giá hoặc không chọn quán.
 */
export const CAFE_MAC_DINH_MOI_NGUOI = 50_000;

/**
 * Giá phòng khách sạn mặc định theo số sao (VND mỗi đêm mỗi phòng).
 * GIẢ ĐỊNH đồ án: dùng khi khách sạn không có giá được xác minh.
 */
export const HOTEL_GIA_THEO_SAO: Record<number, number> = {
  2: 450_000,
  3: 750_000,
  4: 1_300_000,
  5: 2_600_000,
};

/**
 * Giá phòng khách sạn mặc định khi không biết số sao (VND mỗi đêm mỗi phòng).
 * GIẢ ĐỊNH đồ án.
 */
export const HOTEL_GIA_MAC_DINH = 700_000;

// ─── Legacy alias (giữ để backward compat với tests cũ) ─────────────────────

/** @deprecated dùng AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA * 2 thay thế */
export const AN_UONG_MOI_NGUOI_MOI_NGAY =
  AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA * 2;

// ─── Người ở chung phòng ─────────────────────────────────────────────────────

/** Số người tiêu chuẩn tối đa ở ghép trong 1 phòng khách sạn */
export const NGUOI_MOI_PHONG = 2;

// ─── Hoạt động ───────────────────────────────────────────────────────────────

/** Số lượng hoạt động tối đa được xếp trong một ngày */
export const SO_HOAT_DONG_TOI_DA_MOI_NGAY = 2;

// ─── Di chuyển ───────────────────────────────────────────────────────────────

/** Ngưỡng thời lượng di chuyển bị coi là lâu (phút) - 360 phút = 6 giờ */
export const NGUONG_DI_CHUYEN_LAU_PHUT = 360;

/**
 * Tỉ lệ thời gian di chuyển tối đa khuyến nghị so với tổng thời gian chuyến đi (35%).
 * GIẢ ĐỊNH đồ án: nếu vượt quá ngưỡng này sẽ kích hoạt cảnh báo soft "di_chuyen_chiem_nhieu_thoi_gian".
 */
export const DI_CHUYEN_TOI_DA_TI_LE = 0.35;

/** Ngưỡng giờ khởi hành bị coi là sớm (trước 08:00 sáng) */
export const GIO_KHOI_HANH_SOM = "08:00";

/** Bắt đầu khung giờ đi đêm (từ 22:00 đêm) */
export const GIO_DI_DEM_TU = "22:00";

/** Kết thúc khung giờ đi đêm (đến 05:00 sáng) */
export const GIO_DI_DEM_DEN = "05:00";

/** Ngưỡng giờ đến nơi bị coi là quá sớm (trước 06:00 sáng) */
export const GIO_DEN_SOM = "06:00";

// ─── Thời gian danh nghĩa ────────────────────────────────────────────────────

/** Phiên bản quy tắc lập kế hoạch dự phòng và eval */
export const QUY_TAC_VERSION = "3";

/** Hệ số uốn lượn đường bộ cho xe khách và tàu hỏa (giả định đồ án) */
export const HE_SO_DUONG_BO = 1.5;

/** Giờ danh nghĩa cho hoạt động thứ nhất trong ngày: 570 phút ("09:30") */
export const GIO_HOAT_DONG_1 = 570;

/** Giờ danh nghĩa cho hoạt động thứ hai trong ngày: 930 phút ("15:30") */
export const GIO_HOAT_DONG_2 = 930;

/** Giờ nhận phòng khách sạn chuẩn */
export const GIO_NHAN_PHONG = "14:00";

/** Thời gian dự phòng (phút) sau khi đến nơi trước khi có thể bắt đầu hoạt động */
export const BUFFER_SAU_KHI_DEN_PHUT = 60;

/** Thời gian dự phòng (phút) cần thiết để di chuyển ra bến tàu/xe/sân bay trước giờ khởi hành */
export const BUFFER_RA_BEN_PHUT = 120;

/** Thời gian dự phòng tối thiểu (phút) giữa hai hoạt động trong cùng một ngày */
export const BUFFER_GIUA_HOAT_DONG_PHUT = 30;

/** Thời lượng tối thiểu cho một hoạt động tham quan (phút). GIẢ ĐỊNH đồ án. */
export const THOI_LUONG_TOI_THIEU_HOAT_DONG = 60;

// ─── Agent & Repair ─────────────────────────────────────────────────────────

/** Số vòng tối đa AI được phép thử sửa lỗi tự động */
export const MAX_REPAIR_ROUNDS = 2;

// ─── Ngân sách ───────────────────────────────────────────────────────────────

/** Ngưỡng phần trăm ngân sách bị coi là gần hết (để cảnh báo soft) */
export const NGUONG_GAN_HET_NGAN_SACH_PHAN_TRAM = 95;

// ─── Ước lượng phương tiện di chuyển ─────────────────────────────────────────

export const VAN_TOC_XE_KHACH_KMH = 50;
export const DON_GIA_XE_KHACH_D_KM = 1_000;

export const VAN_TOC_TAU_KMH = 55;
export const DON_GIA_TAU_D_KM = 1_000;

export const VAN_TOC_MAY_BAY_KMH = 750;
export const THOI_GIAN_CO_DINH_MAY_BAY_PHUT = 90;
export const GIA_CO_DINH_MAY_BAY_VND = 600_000;
export const DON_GIA_MAY_BAY_D_KM = 1_100;

// ─── Danh sách mã cảnh báo hệ thống ─────────────────────────────────────────

export const DANH_SACH_MA_CANH_BAO = [
  "ve_den_ngay_sau",
  "den_vao_ngay_sau",
  "di_chuyen_chiem_nhieu_thoi_gian",
  "den_truoc_gio_nhan_phong",
  "gan_het_ngan_sach",
  "vuot_ngan_sach",
  "ngay_dau_den_muon",
  "bo_hoat_dong_do_gio_giac",
  "o_trong_do_rang_buoc",
  "vi_pham_khong_day_som",
  "vi_pham_khong_di_dem",
  "vi_pham_tranh_di_chuyen_lau",
  "vi_pham_tranh_dong_nguoi",
  "vi_pham_tranh_di_bo_nhieu",
  "hoat_dong_chong_len",
  "ngay_cuoi_khong_kip",
  "so_nguoi_khong_hop_le",
  "ngoai_pham_vi_so_ngay",
  "so_ngay_khong_hop_le",
  "ngan_sach_khong_hop_le",
  "diem_den_mac_dinh",
] as const;

export type MaCanhBao = (typeof DANH_SACH_MA_CANH_BAO)[number];

