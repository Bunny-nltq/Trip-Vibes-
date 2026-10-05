import { describe, it, expect } from "vitest";
import { confirmExpense, type ConfirmExpenseInput } from "./confirmExpense";

describe("confirmExpense", () => {
  it("C1: anh_bill, soTienVND 560000, giaTriAIDoc 560000 -> ok, daSuaTay false", () => {
    const input: ConfirmExpenseInput = {
      nguon: "anh_bill",
      tenCuaHang: "Test",
      ngay: "2026-10-05",
      ngayTrongChuyen: 1,
      hangMuc: "an_uong",
      soTienVND: 560000,
      giaTriAIDoc: 560000,
      ghiChu: null,
    };
    const res = confirmExpense(input, "id1");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.expense.daSuaTay).toBe(false);
    }
  });

  it("C2: anh_bill, soTienVND 580000, giaTriAIDoc 560000 -> ok, daSuaTay true", () => {
    const input: ConfirmExpenseInput = {
      nguon: "anh_bill",
      tenCuaHang: null,
      ngay: null,
      ngayTrongChuyen: null,
      hangMuc: "di_chuyen",
      soTienVND: 580000,
      giaTriAIDoc: 560000,
      ghiChu: null,
    };
    const res = confirmExpense(input, "id2");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.expense.daSuaTay).toBe(true);
    }
  });

  it("C3: nhap_tay, soTienVND 150000, giaTriAIDoc null -> ok; nhap_tay giaTriAIDoc 100000 -> lỗi", () => {
    const inputOk: ConfirmExpenseInput = {
      nguon: "nhap_tay",
      tenCuaHang: null,
      ngay: null,
      ngayTrongChuyen: null,
      hangMuc: "khac",
      soTienVND: 150000,
      giaTriAIDoc: null,
      ghiChu: null,
    };
    const resOk = confirmExpense(inputOk, "id3");
    expect(resOk.ok).toBe(true);
    if (resOk.ok) {
      expect(resOk.expense.daSuaTay).toBe(false);
    }

    const inputErr: ConfirmExpenseInput = {
      ...inputOk,
      giaTriAIDoc: 100000,
    };
    const resErr = confirmExpense(inputErr, "id4");
    expect(resErr.ok).toBe(false);
    if (!resErr.ok) {
      expect(resErr.loi).toContain("nhap_tay_khong_co_gia_tri_ai_doc");
    }
  });

  it("C4: soTienVND 0, -1, 1.5, 2000000000 -> lỗi", () => {
    const base: ConfirmExpenseInput = {
      nguon: "nhap_tay",
      tenCuaHang: null,
      ngay: null,
      ngayTrongChuyen: null,
      hangMuc: "vui_choi",
      soTienVND: 1000,
      giaTriAIDoc: null,
      ghiChu: null,
    };

    [0, -1, 1.5, 2000000000].forEach((val) => {
      const res = confirmExpense({ ...base, soTienVND: val }, "id");
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.loi).toContain("so_tien_khong_hop_le");
      }
    });
  });

  it("C5: hangMuc abc, ngayTrongChuyen 0 và 8, tenCuaHang 81 ký tự -> lỗi", () => {
    const base: ConfirmExpenseInput = {
      nguon: "nhap_tay",
      tenCuaHang: null,
      ngay: null,
      ngayTrongChuyen: null,
      hangMuc: "an_uong",
      soTienVND: 1000,
      giaTriAIDoc: null,
      ghiChu: null,
    };

    const r1 = confirmExpense({ ...base, hangMuc: "abc" }, "id");
    expect(r1.ok).toBe(false);
    if (!r1.ok) expect(r1.loi).toContain("hang_muc_khong_hop_le");

    const r2 = confirmExpense({ ...base, ngayTrongChuyen: 0 }, "id");
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.loi).toContain("ngay_trong_chuyen_khong_hop_le");

    const r3 = confirmExpense({ ...base, ngayTrongChuyen: 8 }, "id");
    expect(r3.ok).toBe(false);
    if (!r3.ok) expect(r3.loi).toContain("ngay_trong_chuyen_khong_hop_le");

    const r4 = confirmExpense({ ...base, tenCuaHang: "a".repeat(81) }, "id");
    expect(r4.ok).toBe(false);
    if (!r4.ok) expect(r4.loi).toContain("ten_cua_hang_qua_dai");
  });
});
