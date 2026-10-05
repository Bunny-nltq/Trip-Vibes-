import { describe, it, expect } from "vitest";
import { createLedger, addExpense, tinhThucTeTheoHangMuc, tongThucTe } from "./ledger";
import type { Expense } from "@/contracts";

describe("ledger", () => {
  it("L1: thêm các expense và tính tổng", () => {
    let ledger = createLedger();
    const e1: Expense = {
      id: "1",
      nguon: "nhap_tay",
      tenCuaHang: null,
      ngay: null,
      ngayTrongChuyen: null,
      hangMuc: "an_uong",
      soTienVND: 560000,
      giaTriAIDoc: null,
      daSuaTay: false,
      ghiChu: null,
    };
    const e2: Expense = {
      id: "2",
      nguon: "nhap_tay",
      tenCuaHang: null,
      ngay: null,
      ngayTrongChuyen: null,
      hangMuc: "an_uong",
      soTienVND: 108000,
      giaTriAIDoc: null,
      daSuaTay: false,
      ghiChu: null,
    };
    const e3: Expense = {
      id: "3",
      nguon: "nhap_tay",
      tenCuaHang: null,
      ngay: null,
      ngayTrongChuyen: null,
      hangMuc: "vui_choi",
      soTienVND: 80000,
      giaTriAIDoc: null,
      daSuaTay: false,
      ghiChu: null,
    };
    const e4: Expense = {
      id: "4",
      nguon: "nhap_tay",
      tenCuaHang: null,
      ngay: null,
      ngayTrongChuyen: null,
      hangMuc: "an_uong",
      soTienVND: 308000,
      giaTriAIDoc: null,
      daSuaTay: false,
      ghiChu: null,
    };

    const l1 = addExpense(ledger, e1);
    const l2 = addExpense(l1, e2);
    const l3 = addExpense(l2, e3);
    const l4 = addExpense(l3, e4);

    expect(ledger.expenses.length).toBe(0); // sổ cũ không đổi
    expect(l4.expenses.length).toBe(4);

    const theoHangMuc = tinhThucTeTheoHangMuc(l4);
    expect(theoHangMuc["an_uong"]).toBe(976000);
    expect(theoHangMuc["vui_choi"]).toBe(80000);

    const tong = tongThucTe(l4);
    expect(tong).toBe(1056000);
  });
});
