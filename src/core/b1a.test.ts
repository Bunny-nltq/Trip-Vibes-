import { describe, it, expect } from "vitest";
import { tinhNganSachToiThieu } from "./minBudget";
import { buildPlan, type PlanData } from "./buildPlan";
import { validatePlan } from "./validatePlan";
import { donOKhongKhaDung } from "./donOKhongKhaDung";
import { lapOTrong } from "./lapOTrong";
import type { TripRequest, Selection } from "@/contracts";

describe("B1a - Test tiền: số đêm theo giờ đến", () => {
  const reqBase: TripRequest = {
    schemaVersion: 9,
    diemDi: "TP.HCM",
    diemDen: "Hà Nội",
    soNguoi: 2,
    soNgay: 3,
    ngansachTongVND: 10000000,
    sothich: [],
    tranh: [],
    ghiChu: [],
    thieu: [],
    cauHoiLamRo: [],
    canhBao: [],
  };

  const ptV_C: any = {
    schemaVersion: 4,
    id: "PT_C",
    huong: "ve",
    type: "PLANE",
    provider: "Hãng C",
    origin: "Hà Nội",
    destination: "TP.HCM",
    departureTime: "18:00",
    durationMinutes: 85,
    pricePerPerson: 980000,
    seatClass: "Phổ thông",
    boardingPoint: "Sân bay",
    dropOffPoint: "Sân bay",
  };

  const hotelH2: any = {
    schemaVersion: 4,
    id: "H2",
    name: "Khách sạn H2",
    pricePerNight: 780000,
    stars: 3,
    area: "Hà Nội",
    amenities: [],
    source: "reference",
  };

  it("PT_G khởi hành 19:00 (đến 05:00 ngày 2): chỗ ở 780.000 (1 đêm), Di chuyển 2.860.000, Ăn uống 1.800.000, tổng 5.440.000", () => {
    const ptG_1900: any = {
      schemaVersion: 4,
      id: "PT_G",
      huong: "di",
      type: "TRAIN",
      provider: "Đường sắt G",
      origin: "TP.HCM",
      destination: "Hà Nội",
      departureTime: "19:00",
      durationMinutes: 600, // đến 05:00 ngày 2 (1140 + 600 = 1740)
      pricePerPerson: 450000,
      seatClass: "Phổ thông",
      boardingPoint: "Ga",
      dropOffPoint: "Ga",
    };

    const data: PlanData = {
      transports: [ptG_1900, ptV_C],
      hotels: [hotelH2],
      activities: [],
      quanAns: [],
      cafes: [],
    };

    const sel: Selection = {
      transportDiId: "PT_G",
      transportVeId: "PT_C",
      hotelId: "H2",
      hoatDongTheoNgay: [[], [], []],
    };

    // 1. minBudget
    const minRes = tinhNganSachToiThieu(reqBase, data);
    expect(minRes.toiThieuVND).toBe(5440000);

    // 2. buildPlan
    const planRes = buildPlan(reqBase, sel, data);
    expect(planRes.ok).toBe(true);
    if (!planRes.ok) return;

    const plan = planRes.plan;
    expect(plan.tongKet.theoHangMuc["Chỗ ở"]).toBe(780000);
    expect(plan.tongKet.theoHangMuc["Di chuyển"]).toBe(2860000);
    expect(plan.tongKet.theoHangMuc["Ăn uống"]).toBe(1800000);
    expect(plan.tongKet.tongVND).toBe(5440000);

    const choOItem = plan.items.find((i) => i.hangMuc === "Chỗ ở");
    expect(choOItem?.noiDung).toContain("1 đêm");
  });

  it("Cùng ca nhưng PT_G khởi hành 07:00 (đến 17:00 cùng ngày): chỗ ở 1.560.000, toiThieuVND 6.220.000", () => {
    const ptG_0700: any = {
      schemaVersion: 4,
      id: "PT_G",
      huong: "di",
      type: "TRAIN",
      provider: "Đường sắt G",
      origin: "TP.HCM",
      destination: "Hà Nội",
      departureTime: "07:00",
      durationMinutes: 600, // đến 17:00 cùng ngày (420 + 600 = 1020)
      pricePerPerson: 450000,
      seatClass: "Phổ thông",
      boardingPoint: "Ga",
      dropOffPoint: "Ga",
    };

    const data: PlanData = {
      transports: [ptG_0700, ptV_C],
      hotels: [hotelH2],
      activities: [],
      quanAns: [],
      cafes: [],
    };

    const sel: Selection = {
      transportDiId: "PT_G",
      transportVeId: "PT_C",
      hotelId: "H2",
      hoatDongTheoNgay: [[], [], []],
    };

    // 1. minBudget
    const minRes = tinhNganSachToiThieu(reqBase, data);
    expect(minRes.toiThieuVND).toBe(6220000);

    // 2. buildPlan
    const planRes = buildPlan(reqBase, sel, data);
    expect(planRes.ok).toBe(true);
    if (!planRes.ok) return;

    const plan = planRes.plan;
    expect(plan.tongKet.theoHangMuc["Chỗ ở"]).toBe(1560000);
    expect(plan.tongKet.tongVND).toBe(6220000);

    const choOItem = plan.items.find((i) => i.hangMuc === "Chỗ ở");
    expect(choOItem?.noiDung).toContain("2 đêm");
  });
});

describe("B1a - Test Fixture D2", () => {
  const reqD2: TripRequest = {
    schemaVersion: 9,
    diemDi: "TP.HCM",
    diemDen: "Hà Nội",
    soNguoi: 2,
    soNgay: 3,
    ngansachTongVND: 10000000,
    sothich: [],
    tranh: [],
    ghiChu: [],
    thieu: [],
    cauHoiLamRo: [],
    canhBao: [],
  };

  const tTau: any = {
    schemaVersion: 4,
    id: "T_TAU",
    huong: "di",
    type: "TRAIN",
    provider: "Đường sắt SE",
    origin: "TP.HCM",
    destination: "Hà Nội",
    departureTime: "07:00",
    durationMinutes: 1871, // 420 + 1871 = 2291 phút (đến 14:11 ngày 2)
    pricePerPerson: 1000000,
    seatClass: "Giường nằm",
    boardingPoint: "Ga Sài Gòn",
    dropOffPoint: "Ga Hà Nội",
  };

  const tVe: any = {
    schemaVersion: 4,
    id: "T_VE",
    huong: "ve",
    type: "PLANE",
    provider: "Hãng V",
    origin: "Hà Nội",
    destination: "TP.HCM",
    departureTime: "16:00", // 960 phút
    durationMinutes: 120,
    pricePerPerson: 1000000,
    seatClass: "Phổ thông",
    boardingPoint: "Nội Bài",
    dropOffPoint: "Tân Sơn Nhất",
  };

  const hotelH1: any = {
    schemaVersion: 4,
    id: "H1",
    name: "Khách sạn 1",
    pricePerNight: 500000,
    stars: 3,
    area: "Hà Nội",
    amenities: [],
    source: "reference",
  };

  const acts = [
    { id: "A1", name: "Hoạt động A1", pricePerPerson: 0, durationMinutes: 120, tags: [] },
    { id: "A2", name: "Hoạt động A2", pricePerPerson: 0, durationMinutes: 120, tags: [] },
    { id: "A3", name: "Hoạt động A3", pricePerPerson: 0, durationMinutes: 120, tags: [] },
    { id: "A4", name: "Hoạt động A4", pricePerPerson: 0, durationMinutes: 120, tags: [] },
  ];

  const dataD2: PlanData = {
    transports: [tTau, tVe],
    hotels: [hotelH1],
    activities: acts as any,
    quanAns: [],
    cafes: [],
  };

  it("selection ngày 1 [A1], ngày 2 [A2, A3], ngày 3 [A4]: validatePlan hard chứa ngay_dau_den_muon với chi tiết chứa 14:11", () => {
    const sel: Selection = {
      transportDiId: "T_TAU",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [["A1"], ["A2", "A3"], ["A4"]],
    };

    const planRes = buildPlan(reqD2, sel, dataD2);
    expect(planRes.ok).toBe(true);
    if (!planRes.ok) return;

    const valRes = validatePlan(reqD2, planRes.plan, dataD2);
    const hardDenMuon = valRes.hard.find((h) => h.code === "ngay_dau_den_muon");
    expect(hardDenMuon).toBeDefined();
    expect(hardDenMuon?.chiTiet).toContain("14:11");
  });

  it("donOKhongKhaDung cho ngày 1 [], ngày 2 [A2], ngày 3 [A4], có cảnh báo bo_hoat_dong_do_gio_giac", () => {
    const sel: Selection = {
      transportDiId: "T_TAU",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [["A1"], ["A2", "A3"], ["A4"]],
    };

    const res = donOKhongKhaDung(sel, undefined, [tTau, tVe]);
    expect(res.hoatDongTheoNgay[0]).toEqual([]);
    expect(res.hoatDongTheoNgay[1]).toEqual(["A2"]);
    expect(res.hoatDongTheoNgay[2]).toEqual(["A4"]);
    expect(res.canhBao).toContain("bo_hoat_dong_do_gio_giac");
  });

  it("buildPlan sau dọn: hoạt động ngày 2 giờ 15:30", () => {
    const selDon: Selection = {
      transportDiId: "T_TAU",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [[], ["A2"], ["A4"]],
    };

    const planRes = buildPlan(reqD2, selDon, dataD2);
    expect(planRes.ok).toBe(true);
    if (!planRes.ok) return;

    const actNgay2 = planRes.plan.items.find(
      (i) => i.hangMuc === "Vui chơi" && i.ngay === 2
    );
    expect(actNgay2).toBeDefined();
    expect(actNgay2?.gio).toBe("15:30");
  });

  it("lapOTrong từ selection rỗng: số hoạt động ngày 1 = 0, ngày 2 = 1, ngày 3 = 1", () => {
    const selRong: Selection = {
      transportDiId: "T_TAU",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [[], [], []],
    };

    const planRes = buildPlan(reqD2, selRong, dataD2);
    expect(planRes.ok).toBe(true);
    if (!planRes.ok) return;

    const res = lapOTrong(selRong, planRes.plan, acts as any, reqD2, [tTau, tVe]);
    expect(res.selection.hoatDongTheoNgay[0].length).toBe(0);
    expect(res.selection.hoatDongTheoNgay[1].length).toBe(1);
    expect(res.selection.hoatDongTheoNgay[2].length).toBe(1);
  });
});
