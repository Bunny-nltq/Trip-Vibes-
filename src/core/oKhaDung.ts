/**
 * src/core/oKhaDung.ts
 *
 * Tính số ô hoạt động khả dụng theo thời gian đến và thời gian về của chuyến đi.
 * - Ngày 1 nếu đến ngày 1: giữ luật hiện tại (tối đa 1 ô, theo gioOHoatDongNgayDau).
 * - Nếu đến ngày d >= 2 (d < soNgay):
 *   + ngày trước d: 0 ô;
 *   + ngày d: số ô trong {570, 930} thỏa (phút trong ngày của giờ đến + 60) <= ô;
 *   + ngày giữa sau d: 2 ô;
 *   + ngày cuối: 1 ô nếu gioKhoiHanhVe >= 750.
 * - Đến ngày cuối trở đi: 0 ô.
 */

import {
  BUFFER_RA_BEN_PHUT,
  THOI_LUONG_TOI_THIEU_HOAT_DONG,
} from "./assumptions";
import { gioOHoatDongNgayDau } from "./gioONgayDau";

const GIO_HOAT_DONG_1_PHUT = 9 * 60 + 30; // 570 phút ("09:30")
const NGUONG_VE_PHUT =
  GIO_HOAT_DONG_1_PHUT + THOI_LUONG_TOI_THIEU_HOAT_DONG + BUFFER_RA_BEN_PHUT; // 750 phút

/**
 * Trả về mảng số ô khả dụng cho từng ngày (chỉ số 0 tương ứng Ngày 1)
 */
export function tinhOKhaDungTheoNgay(
  soNgay: number,
  gioDenTuyetDoi: number,
  gioKhoiHanhVe: number
): number[] {
  if (soNgay <= 0) return [];
  const result: number[] = [];

  // 1. Trường hợp đến trong ngày 1
  if (gioDenTuyetDoi < 1440) {
    const oNgayDau = gioOHoatDongNgayDau(gioDenTuyetDoi) !== null ? 1 : 0;
    result.push(oNgayDau);

    if (soNgay === 1) return result;

    for (let d = 2; d < soNgay; d++) {
      result.push(2);
    }

    const oNgayCuoi = gioKhoiHanhVe >= NGUONG_VE_PHUT ? 1 : 0;
    result.push(oNgayCuoi);

    return result;
  }

  // 2. Trường hợp đến từ ngày 2 trở đi
  const d = Math.floor(gioDenTuyetDoi / 1440) + 1;

  // Đến ngày cuối trở đi: 0 ô
  if (d >= soNgay) {
    return Array(soNgay).fill(0);
  }

  // Các ngày trước d: 0 ô
  for (let day = 1; day < d; day++) {
    result.push(0);
  }

  // Ngày d: số ô trong {570, 930} thỏa (phút trong ngày + 60) <= ô
  const phutTrongNgay = gioDenTuyetDoi % 1440;
  let oNgayD = 0;
  if (phutTrongNgay + 60 <= 570) {
    oNgayD = 2;
  } else if (phutTrongNgay + 60 <= 930) {
    oNgayD = 1;
  } else {
    oNgayD = 0;
  }
  result.push(oNgayD);

  // Các ngày giữa sau d (từ d + 1 đến soNgay - 1): mỗi ngày 2 ô
  for (let day = d + 1; day < soNgay; day++) {
    result.push(2);
  }

  // Ngày cuối: 1 ô nếu gioKhoiHanhVe >= 750
  const oNgayCuoi = gioKhoiHanhVe >= NGUONG_VE_PHUT ? 1 : 0;
  result.push(oNgayCuoi);

  return result;
}

export function soOKhaDung(
  soNgay: number,
  gioDenTuyetDoi: number,
  gioKhoiHanhVe: number
): number {
  return tinhOKhaDungTheoNgay(soNgay, gioDenTuyetDoi, gioKhoiHanhVe).reduce(
    (acc, curr) => acc + curr,
    0
  );
}
