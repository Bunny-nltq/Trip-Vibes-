/**
 * src/core/formB1.ts
 *
 * Hàm thuần quản lý và kiểm tra biểu mẫu B1 (Chọn nhanh nhu cầu du lịch).
 * Tuân thủ AGENTS.md:
 * - Không import AI hoặc UI.
 * - Mọi phép tính tiền và thời gian nằm ở core.
 */

import type { DiemDen } from "@/contracts";
import { khoangCachKm } from "./haversine";

export interface FormB1 {
  diemDi: DiemDen | null;
  diemDen: DiemDen | null;
  soNguoi: number;
  nganSach: {
    soTien: number;
    theo: "tong" | "moi_nguoi";
  };
  soNgay: number;
  tranh: string[];
  ghiChu: string;
}

export type FormB1ErrorCode =
  | "diem_di_thieu"
  | "diem_den_thieu"
  | "diem_di_trung_diem_den"
  | "so_nguoi_ngoai_pham_vi"
  | "ngan_sach_khong_hop_le"
  | "so_ngay_ngoai_pham_vi"
  | "ghi_chu_qua_dai";

/**
 * Kiểm tra tính hợp lệ của FormB1 theo thứ tự ưu tiên:
 * 1. diem_di_thieu
 * 2. diem_den_thieu
 * 3. diem_di_trung_diem_den (cùng mã quốc gia và cách nhau dưới 15 km)
 * 4. so_nguoi_ngoai_pham_vi (ngoài 1 đến 10)
 * 5. ngan_sach_khong_hop_le (không phải số nguyên dương)
 * 6. so_ngay_ngoai_pham_vi (ngoài 2 đến 5)
 * 7. ghi_chu_qua_dai (hơn 500 ký tự)
 */
export function kiemTraFormB1(form: FormB1): FormB1ErrorCode[] {
  const errors: FormB1ErrorCode[] = [];

  if (!form.diemDi) {
    errors.push("diem_di_thieu");
  }

  if (!form.diemDen) {
    errors.push("diem_den_thieu");
  }

  if (form.diemDi && form.diemDen) {
    const cungQuocGia =
      form.diemDi.maQuocGia &&
      form.diemDen.maQuocGia &&
      form.diemDi.maQuocGia.toUpperCase() === form.diemDen.maQuocGia.toUpperCase();

    const dKm = khoangCachKm(form.diemDi.toaDo, form.diemDen.toaDo);
    if (cungQuocGia && dKm < 15) {
      errors.push("diem_di_trung_diem_den");
    }
  }

  if (
    !Number.isInteger(form.soNguoi) ||
    form.soNguoi < 1 ||
    form.soNguoi > 10
  ) {
    errors.push("so_nguoi_ngoai_pham_vi");
  }

  const soTien = form.nganSach?.soTien;
  if (
    typeof soTien !== "number" ||
    !Number.isInteger(soTien) ||
    soTien <= 0
  ) {
    errors.push("ngan_sach_khong_hop_le");
  }

  if (
    !Number.isInteger(form.soNgay) ||
    form.soNgay < 2 ||
    form.soNgay > 7
  ) {
    errors.push("so_ngay_ngoai_pham_vi");
  }

  if (typeof form.ghiChu === "string" && form.ghiChu.length > 500) {
    errors.push("ghi_chu_qua_dai");
  }

  return errors;
}

/**
 * Chuyển dữ liệu FormB1 thành yêu cầu lập kế hoạch cho /api/plan
 */
export function taoYeuCauTuForm(form: FormB1) {
  const ngansachTongVND =
    form.nganSach.theo === "tong"
      ? form.nganSach.soTien
      : form.nganSach.soTien * form.soNguoi;

  return {
    ngansachTongVND,
    soNguoi: form.soNguoi,
    soNgay: form.soNgay,
    tranh: form.tranh,
    diemDi: form.diemDi,
    diemDen: form.diemDen,
    ghiChu: form.ghiChu,
  };
}

/**
 * Định dạng số nguyên thành chuỗi có dấu chấm phân cách hàng nghìn (ví dụ 10000000 -> "10.000.000")
 */
export function dinhDangTien(n: number): string {
  if (typeof n !== "number" || isNaN(n)) return "";
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Đọc chuỗi tiền VND thành số nguyên dương, trả null nếu không hợp lệ
 * Ví dụ "10.000.000" -> 10000000, "abc" -> null, "" -> null
 */
export function docTien(s: string): number | null {
  if (typeof s !== "string") return null;
  const trimmed = s.trim();
  if (!trimmed) return null;

  // Chỉ chấp nhận các ký tự số, dấu chấm, dấu phẩy, khoảng trắng
  if (!/^[\d.\s]+$/.test(trimmed)) {
    return null;
  }

  // Bỏ dấu chấm phân cách hàng nghìn và khoảng trắng
  const clean = trimmed.replace(/[.\s]/g, "");
  if (!clean || !/^\d+$/.test(clean)) {
    return null;
  }

  const val = parseInt(clean, 10);
  if (isNaN(val) || val <= 0) {
    return null;
  }

  return val;
}
