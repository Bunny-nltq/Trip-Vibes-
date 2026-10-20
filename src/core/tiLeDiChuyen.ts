/**
 * src/core/tiLeDiChuyen.ts
 *
 * Hàm thuần tính tỉ lệ thời gian di chuyển so với tổng thời gian chuyến đi:
 * - tiLeThoiGianDiChuyen(tongPhut, soNgay) = tongPhut / (soNgay x 1440),
 *   làm tròn 1 chữ số theo phần trăm kiểu nửa lên (round half-up).
 * - coCanhBaoDiChuyen(tongPhut, soNgay): kiểm tra tỉ lệ LỚN HƠN DI_CHUYEN_TOI_DA_TI_LE (0.35).
 */

import { DI_CHUYEN_TOI_DA_TI_LE } from "./assumptions";

/**
 * Tính tỉ lệ thời gian di chuyển làm tròn 1 chữ số thập phân theo phần trăm (nửa lên).
 * Ví dụ: 2494 phút, 3 ngày -> 57.7 (%)
 */
export function tiLeThoiGianDiChuyen(tongPhut: number, soNgay: number): number {
  if (soNgay <= 0 || tongPhut <= 0) return 0;
  const tongPhutChuyenDi = soNgay * 1440;
  const tiLe = tongPhut / tongPhutChuyenDi;
  // Làm tròn 1 chữ số theo phần trăm kiểu nửa lên:
  // Math.round(x + Number.EPSILON) hoặc Math.round(tiLe * 1000) / 10
  return Math.round((tiLe * 100 + Number.EPSILON) * 10) / 10;
}

/**
 * Kiểm tra xem thời gian di chuyển có vượt ngưỡng tối đa khuyến nghị (> 0.35) hay không.
 */
export function coCanhBaoDiChuyen(tongPhut: number, soNgay: number): boolean {
  if (soNgay <= 0 || tongPhut <= 0) return false;
  const tongPhutChuyenDi = soNgay * 1440;
  const tiLe = tongPhut / tongPhutChuyenDi;
  return tiLe > DI_CHUYEN_TOI_DA_TI_LE;
}
