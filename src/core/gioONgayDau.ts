/**
 * src/core/gioONgayDau.ts
 *
 * Hàm thuần tính giờ bắt đầu hoạt động (nếu có) cho ngày đầu tiên:
 * - gioOHoatDongNgayDau(gioDenPhut) -> 570 nếu gioDenPhut + BUFFER_SAU_KHI_DEN_PHUT <= 570;
 *   ngược lại 930 nếu gioDenPhut + 60 <= 930;
 *   ngược lại null.
 * - gioDenPhut là số phút tính từ 00:00 ngày 1; nếu gioDenPhut >= 1440 (đến vào ngày sau) thì ngày 1 trả null.
 */

import {
  BUFFER_SAU_KHI_DEN_PHUT,
  GIO_HOAT_DONG_1,
  GIO_HOAT_DONG_2,
} from "./assumptions";

export function gioOHoatDongNgayDau(
  gioDenPhut: number | null | undefined
): 570 | 930 | null {
  if (gioDenPhut === null || gioDenPhut === undefined || isNaN(gioDenPhut)) {
    return null;
  }

  // Nếu đến vào ngày sau (>= 1440 phút), ngày 1 không có hoạt động
  if (gioDenPhut >= 1440) {
    return null;
  }

  const moc1 = typeof GIO_HOAT_DONG_1 === "number" ? GIO_HOAT_DONG_1 : 570;
  const moc2 = typeof GIO_HOAT_DONG_2 === "number" ? GIO_HOAT_DONG_2 : 930;

  // Nếu kịp ô sáng (09:30)
  if (gioDenPhut + BUFFER_SAU_KHI_DEN_PHUT <= moc1) {
    return 570;
  }

  // Ngược lại nếu kịp ô chiều (15:30)
  if (gioDenPhut + 60 <= moc2) {
    return 930;
  }

  // Quá muộn, không kịp ô nào
  return null;
}
