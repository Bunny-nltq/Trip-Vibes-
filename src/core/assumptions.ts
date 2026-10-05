/**
 * src/core/assumptions.ts
 *
 * CÁC HẰNG SỐ GIẢ ĐỊNH CỦA ĐỒ ÁN TRIP VIBES
 *
 * Mọi tính toán chi phí, thời gian và ngưỡng giới hạn trong core
 * đều sử dụng tập trung từ file này, không viết cứng số vào mã nguồn khác.
 */

/** Chi phí ăn uống giả định cho một người trong một ngày (VND) */
export const AN_UONG_MOI_NGUOI_MOI_NGAY = 300000;

/** Số người tiêu chuẩn tối đa ở ghép trong 1 phòng khách sạn */
export const NGUOI_MOI_PHONG = 2;

/** Số lượng hoạt động tối đa được xếp trong một ngày */
export const SO_HOAT_DONG_TOI_DA_MOI_NGAY = 2;

/** Ngưỡng thời lượng di chuyển bị coi là lâu (phút) - 360 phút = 6 giờ */
export const NGUONG_DI_CHUYEN_LAU_PHUT = 360;

/** Ngưỡng giờ khởi hành bị coi là sớm (trước 08:00 sáng) */
export const GIO_KHOI_HANH_SOM = "08:00";

/** Bắt đầu khung giờ đi đêm (từ 22:00 đêm) */
export const GIO_DI_DEM_TU = "22:00";

/** Kết thúc khung giờ đi đêm (đến 05:00 sáng) */
export const GIO_DI_DEM_DEN = "05:00";

/** Ngưỡng giờ đến nơi bị coi là quá sớm (trước 06:00 sáng) */
export const GIO_DEN_SOM = "06:00";

/** Giờ danh nghĩa cho hoạt động thứ nhất trong ngày */
export const GIO_HOAT_DONG_1 = "09:30";

/** Giờ danh nghĩa cho hoạt động thứ hai trong ngày */
export const GIO_HOAT_DONG_2 = "15:30";

/** Giờ nhận phòng khách sạn chuẩn */
export const GIO_NHAN_PHONG = "14:00";

/** Thời gian dự phòng (phút) sau khi đến nơi trước khi có thể bắt đầu hoạt động */
export const BUFFER_SAU_KHI_DEN_PHUT = 60;

/** Thời gian dự phòng (phút) cần thiết để di chuyển ra bến tàu/xe/sân bay trước giờ khởi hành */
export const BUFFER_RA_BEN_PHUT = 120;

/** Thời gian dự phòng tối thiểu (phút) giữa hai hoạt động trong cùng một ngày */
export const BUFFER_GIUA_HOAT_DONG_PHUT = 30;

/** Số vòng tối đa AI được phép thử sửa lỗi tự động */
export const MAX_REPAIR_ROUNDS = 2;

/** Ngưỡng phần trăm ngân sách bị coi là gần hết (để cảnh báo soft) */
export const NGUONG_GAN_HET_NGAN_SACH_PHAN_TRAM = 95;
