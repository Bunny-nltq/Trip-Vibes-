import { describe, it, expect } from "vitest";
import { donOKhongKhaDung } from "./donOKhongKhaDung";
import type { Selection, Plan } from "@/contracts";

describe("donOKhongKhaDung", () => {
  it("chiều đi đến 10:19, ngày 1 có [A1] -> sau dọn, ngày 1 là [] và có cảnh báo bo_hoat_dong_do_gio_giac", () => {
    const selection: Selection = {
      transportDiId: "t_di",
      transportVeId: "t_ve",
      hotelId: "h1",
      hoatDongTheoNgay: [["A1"], ["A2", "A3"], ["A4"]],
    };

    const plan: any = {
      request: { soNgay: 3 },
      items: [
        {
          hangMuc: "Di chuyển",
          ngay: 1,
          gio: "10:19",
          arrivalTime: "10:19",
        },
        {
          hangMuc: "Di chuyển",
          ngay: 3,
          gio: "18:00",
        },
        {
          hangMuc: "Vui chơi",
          ngay: 1,
          noiDung: "Hoạt động A1",
          refId: "A1",
        },
      ],
      canhBao: [],
    };

    const res = donOKhongKhaDung(selection, plan);

    expect(res.selection.hoatDongTheoNgay[0]).toEqual([]);
    expect(res.hoatDongTheoNgay[0]).toEqual([]);
    expect(selection.hoatDongTheoNgay[0]).toEqual([]);
    expect(res.canhBao.some((cb) => cb.includes("bo_hoat_dong_do_gio_giac"))).toBe(true);
    expect(res.daDon).toBe(true);
  });

  it("chiều đi đến 07:55, ngày 1 có [A1] -> sau dọn, ngày 1 không đổi gì", () => {
    const selection: Selection = {
      transportDiId: "t_di",
      transportVeId: "t_ve",
      hotelId: "h1",
      hoatDongTheoNgay: [["A1"], ["A2", "A3"], ["A4"]],
    };

    const plan: any = {
      request: { soNgay: 3 },
      items: [
        {
          hangMuc: "Di chuyển",
          ngay: 1,
          gio: "07:55",
          arrivalTime: "07:55",
        },
        {
          hangMuc: "Di chuyển",
          ngay: 3,
          gio: "18:00",
        },
      ],
      canhBao: [],
    };

    const res = donOKhongKhaDung(selection, plan);

    expect(res.selection.hoatDongTheoNgay[0]).toEqual(["A1"]);
    expect(res.hoatDongTheoNgay[0]).toEqual(["A1"]);
    expect(selection.hoatDongTheoNgay[0]).toEqual(["A1"]);
    expect(res.daDon).toBe(false);
  });
});
