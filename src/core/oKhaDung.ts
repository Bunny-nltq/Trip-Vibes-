/**
 * src/core/oKhaDung.ts
 *
 * Tính số ô hoạt động khả dụng theo thời gian đến và thời gian về của chuyến đi.
 * - Ngày giữa (từ ngày 2 đến ngày N-1): luôn có 2 ô hoạt động.
 * - Ngày đầu (ngày 1): có 1 ô nếu gioDenPhutNgay1 + BUFFER_SAU_KHI_DEN_PHUT <= GIO_HOAT_DONG_1 (570 phút), ngược lại 0 ô.
 * - Ngày cuối (ngày N): có 1 ô nếu gioKhoiHanhVePhut >= GIO_HOAT_DONG_1 + THOI_LUONG_TOI_THIEU_HOAT_DONG + BUFFER_RA_BEN_PHUT (570 + 60 + 120 = 750 phút), ngược lại 0 ô.
 * - Với soNgay = 2: chỉ có ngày đầu và ngày cuối (không có ngày giữa).
 */

import {
  BUFFER_RA_BEN_PHUT,
  THOI_LUONG_TOI_THIEU_HOAT_DONG,
} from "./assumptions";
import { gioOHoatDongNgayDau } from "./gioONgayDau";

const GIO_HOAT_DONG_1_PHUT = 9 * 60 + 30; // 570 phút ("09:30")

export function soOKhaDung(
  soNgay: number,
  gioDenPhutNgay1: number,
  gioKhoiHanhVePhut: number
): number {
  if (soNgay <= 0) return 0;

  // 1. Ngày đầu
  const oNgayDau = gioOHoatDongNgayDau(gioDenPhutNgay1) !== null ? 1 : 0;

  // Với số ngày = 1 (nếu có)
  if (soNgay === 1) {
    return oNgayDau;
  }

  // 2. Ngày cuối
  const nguongNgayCuoi =
    GIO_HOAT_DONG_1_PHUT + THOI_LUONG_TOI_THIEU_HOAT_DONG + BUFFER_RA_BEN_PHUT; // 750 phút
  const oNgayCuoi = gioKhoiHanhVePhut >= nguongNgayCuoi ? 1 : 0;

  // 3. Các ngày giữa (mỗi ngày 2 ô)
  const soNgayGiua = Math.max(0, soNgay - 2);
  const oNgayGiua = soNgayGiua * 2;

  return oNgayDau + oNgayGiua + oNgayCuoi;
}
