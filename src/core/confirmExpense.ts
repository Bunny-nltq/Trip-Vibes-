import { type Expense, ExpenseCategorySchema } from "@/contracts";

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const parts = dateString.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (year < 1000 || year > 9999 || month === 0 || month > 12) return false;
  const monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
    monthLength[1] = 29;
  }
  return day > 0 && day <= monthLength[month - 1];
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

  if (input.ngay && !isValidDate(input.ngay)) {
    loi.push("ngay_khong_hop_le");
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
    ngay: input.ngay,
    ngayTrongChuyen: input.ngayTrongChuyen,
    hangMuc: parsedHangMuc.data!,
    soTienVND: input.soTienVND,
    giaTriAIDoc: input.giaTriAIDoc,
    daSuaTay,
    ghiChu: input.ghiChu,
  };

  return { ok: true, expense };
}
