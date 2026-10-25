import { type Expense, ExpenseCategorySchema } from "@/contracts";

function isValidDay(year: number, month: number, day: number): boolean {
  if (year < 1000 || year > 9999 || month === 0 || month > 12) return false;
  const monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
    monthLength[1] = 29;
  }
  return day > 0 && day <= monthLength[month - 1];
}

function parseAndValidateDate(dateString: string): { isValid: boolean; normalized: string | null } {
  // 1. Kiểm tra định dạng ISO YYYY-MM-DD
  const regexIso = /^(\d{4})-(\d{2})-(\d{2})$/;
  const matchIso = dateString.match(regexIso);
  if (matchIso) {
    const year = parseInt(matchIso[1], 10);
    const month = parseInt(matchIso[2], 10);
    const day = parseInt(matchIso[3], 10);
    if (isValidDay(year, month, day)) {
      return {
        isValid: true,
        normalized: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      };
    }
  }

  // 2. Hỗ trợ định dạng Việt Nam / thân thiện DD/MM/YYYY hoặc DD-MM-YYYY
  const regexDmy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
  const matchDmy = dateString.match(regexDmy);
  if (matchDmy) {
    const day = parseInt(matchDmy[1], 10);
    const month = parseInt(matchDmy[2], 10);
    const year = parseInt(matchDmy[3], 10);
    if (isValidDay(year, month, day)) {
      return {
        isValid: true,
        normalized: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      };
    }
  }

  return { isValid: false, normalized: null };
}

export interface ConfirmExpenseInput {
  nguon: "anh_bill" | "nhap_tay";
  tenCuaHang: string | null;
  ngay: string | null;
  ngayTrongChuyen: number | null;
  hangMuc: string;
  soTienVND: number;
  giaTriAIDoc: number | null;
  ghiChu: string | null;
}

export function confirmExpense(
  input: ConfirmExpenseInput,
  id: string
): { ok: true; expense: Expense } | { ok: false; loi: string[] } {
  const loi: string[] = [];

  const parsedHangMuc = ExpenseCategorySchema.safeParse(input.hangMuc);
  if (!parsedHangMuc.success) {
    loi.push("hang_muc_khong_hop_le");
  }

  if (
    !Number.isInteger(input.soTienVND) ||
    input.soTienVND <= 0 ||
    input.soTienVND > 1000000000
  ) {
    loi.push("so_tien_khong_hop_le");
  }

  let normalizedDate: string | null = null;
  if (input.ngay) {
    const dateCheck = parseAndValidateDate(input.ngay);
    if (!dateCheck.isValid) {
      loi.push("ngay_khong_hop_le");
    } else {
      normalizedDate = dateCheck.normalized;
    }
  }

  if (
    input.ngayTrongChuyen !== null &&
    (input.ngayTrongChuyen < 1 || input.ngayTrongChuyen > 7)
  ) {
    loi.push("ngay_trong_chuyen_khong_hop_le");
  }

  if (input.tenCuaHang && input.tenCuaHang.length > 80) {
    loi.push("ten_cua_hang_qua_dai");
  }

  if (input.nguon === "nhap_tay" && input.giaTriAIDoc !== null) {
    loi.push("nhap_tay_khong_co_gia_tri_ai_doc");
  }

  if (loi.length > 0) return { ok: false, loi };

  const daSuaTay =
    input.nguon === "anh_bill" &&
    input.giaTriAIDoc !== null &&
    input.giaTriAIDoc !== input.soTienVND;

  const expense: Expense = {
    id,
    nguon: input.nguon,
    tenCuaHang: input.tenCuaHang,
    ngay: normalizedDate,
    ngayTrongChuyen: input.ngayTrongChuyen,
    hangMuc: parsedHangMuc.data!,
    soTienVND: input.soTienVND,
    giaTriAIDoc: input.giaTriAIDoc,
    daSuaTay,
    ghiChu: input.ghiChu,
  };

  return { ok: true, expense };
}
