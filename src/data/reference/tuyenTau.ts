/**
 * src/data/reference/tuyenTau.ts
 *
 * Kiểm tra tuyến tàu hỏa giữa hai điểm đi và điểm đến.
 * Tuân thủ AGENTS.md và nhiệm vụ B3b:
 * - Hàm thuần coTuyenTau(tenDi, tenDen)
 * - Đọc danh sách từ tuyen-tau.json
 */

import tuyenTauData from "./tuyen-tau.json";

function boDau(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

export function chuanHoaTen(ten: string): string {
  if (!ten) return "";
  let s = boDau(ten.toLowerCase()).trim();
  // Bỏ dấu chấm, phẩy và ký tự đặc biệt
  s = s.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ");
  s = s.replace(/\s+/g, " ").trim();

  // "sai gon", "tphcm", "tp hcm", "ho chi minh" thành "ho chi minh"
  s = s.replace(/\b(sai gon|tphcm|tp hcm|ho chi minh)\b/g, "ho chi minh");

  // bỏ tiền tố "thanh pho", "tp", "tinh"
  s = s.replace(/^(thanh pho|tp|tinh)\s+/g, "");

  // Đảm bảo lại alias nếu sau khi bỏ tiền tố còn lại hcm/tphcm
  s = s.replace(/\b(sai gon|tphcm|tp hcm|ho chi minh)\b/g, "ho chi minh");

  return s.trim();
}

export const DANH_SACH_THANH_PHO_CHUAN_HOA: string[] =
  tuyenTauData.thanhPho.map(chuanHoaTen);

export function coTuyenTau(tenDi: string, tenDen: string): boolean {
  const cDi = chuanHoaTen(tenDi);
  const cDen = chuanHoaTen(tenDen);
  if (!cDi || !cDen) return false;

  const coDi = DANH_SACH_THANH_PHO_CHUAN_HOA.some((tp) => cDi.includes(tp));
  const coDen = DANH_SACH_THANH_PHO_CHUAN_HOA.some((tp) => cDen.includes(tp));

  return coDi && coDen;
}
