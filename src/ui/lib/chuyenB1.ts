/**
 * src/ui/lib/chuyenB1.ts
 *
 * Hàm thuần tạo và xử lý gói chuyển dữ liệu từ Home sang B1 (lập kế hoạch).
 * Tuân thủ AGENTS.md và nhiệm vụ N3:
 * - Không import AI hay Data.
 * - Test thuần đạt các điều kiện: 4 người x 3.500.000 = 14.000.000; số người 0 -> so_nguoi; điểm đến rỗng -> thieu_diem_den.
 */

export interface FormHomeChuyen {
  diemDi?: string | null;
  diemDen?: string | null;
  soNguoi?: number | null;
  soNgay?: number | null;
  nganSach?: {
    soTien?: number | null;
    theo?: "tong" | "moi_nguoi";
  } | null;
}

export interface GoiChuyenB1Data {
  diemDiTen: string;
  diemDenTen: string;
  soNguoi: number;
  soNgay: number;
  nganSachSoTien: number;
  nganSachTheo: "tong" | "moi_nguoi";
  tongVND: number;
}

export type GoiChuyenB1Result =
  | {
      ok: true;
      data: GoiChuyenB1Data;
    }
  | {
      ok: false;
      loi: "thieu_diem_den" | "so_nguoi" | "so_ngay" | "ngan_sach";
    };

export function taoGoiChuyenB1(form: FormHomeChuyen): GoiChuyenB1Result {
  const diemDen = form.diemDen?.trim();
  if (!diemDen) {
    return { ok: false, loi: "thieu_diem_den" };
  }

  const soNguoi = form.soNguoi ?? 0;
  if (!Number.isInteger(soNguoi) || soNguoi < 1 || soNguoi > 10) {
    return { ok: false, loi: "so_nguoi" };
  }

  const soNgay = form.soNgay ?? 0;
  if (!Number.isInteger(soNgay) || soNgay < 2 || soNgay > 7) {
    return { ok: false, loi: "so_ngay" };
  }

  const soTien = form.nganSach?.soTien ?? 0;
  if (typeof soTien !== "number" || isNaN(soTien) || soTien <= 0) {
    return { ok: false, loi: "ngan_sach" };
  }

  const theo = form.nganSach?.theo ?? "tong";
  const tongVND = theo === "tong" ? soTien : soTien * soNguoi;

  return {
    ok: true,
    data: {
      diemDiTen: form.diemDi?.trim() || "TP.HCM",
      diemDenTen: diemDen,
      soNguoi,
      soNgay,
      nganSachSoTien: soTien,
      nganSachTheo: theo,
      tongVND,
    },
  };
}

export const SESSION_STORAGE_KEY_HOME_B1 = "trip_vibes_home_to_b1";

export function luuGoiChuyenVaoSession(data: GoiChuyenB1Data): boolean {
  if (typeof window === "undefined") return false;
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY_HOME_B1, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function docGoiChuyenTuSession(): GoiChuyenB1Data | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY_HOME_B1);
    if (!raw) return null;
    sessionStorage.removeItem(SESSION_STORAGE_KEY_HOME_B1);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
