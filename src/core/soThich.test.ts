import { describe, it, expect } from "vitest";
import { khopSoThich, diemKhopTrungBinh } from "./soThich";
import type { Plan, Preference } from "@/contracts";

function createPlanFixtureA(): Plan {
  return {
    schemaVersion: 6,
    request: {
      schemaVersion: 6,
      diemDi: "TP.HCM",
      diemDen: "Đà Nẵng",
      soNguoi: 2,
      soNgay: 3,
      ngansachTongVND: 10000000,
      sothich: [],
      tranh: [],
      ghiChu: [],
      thieu: [],
      cauHoiLamRo: [],
      canhBao: [],
    },
    items: [
      {
        ngay: 1,
        gio: "06:30",
        hangMuc: "Di chuyển",
        noiDung: "Chiều đi",
        soLuong: 2,
        donGia: 980000,
        thanhTien: 1960000,
        refId: "t-di",
      },
      {
        ngay: 1,
        gio: "09:30",
        hangMuc: "Vui chơi",
        noiDung: "HD1",
        soLuong: 2,
        donGia: 0,
        thanhTien: 0,
        refId: "HD1",
        nhan: ["bien", "check_in_chup_anh"],
      },
      {
        ngay: 2,
        gio: "09:30",
        hangMuc: "Vui chơi",
        noiDung: "HD2",
        soLuong: 2,
        donGia: 40000,
        thanhTien: 80000,
        refId: "HD2",
        nhan: ["thien_nhien", "van_hoa_lich_su"],
      },
      {
        ngay: 2,
        gio: "15:30",
        hangMuc: "Vui chơi",
        noiDung: "HD3",
        soLuong: 2,
        donGia: 120000,
        thanhTien: 240000,
        refId: "HD3",
        nhan: ["van_hoa_lich_su", "am_thuc", "check_in_chup_anh", "mua_sam"],
      },
      {
        ngay: 3,
        gio: "09:30",
        hangMuc: "Vui chơi",
        noiDung: "HD4",
        soLuong: 2,
        donGia: 650000,
        thanhTien: 1300000,
        refId: "HD4",
        nhan: ["giai_tri_vui_choi", "thien_nhien", "check_in_chup_anh"],
      },
    ],
    tongKet: {
      tongVND: 9540000,
      conLaiVND: 460000,
      phanTramDaDung: 95.4,
      theoHangMuc: {
        "Di chuyển": 3920000,
        "Chỗ ở": 2200000,
        "Ăn uống": 1800000,
        "Vui chơi": 1620000,
      },
      tongThoiGianDiChuyenPhut: 170,
      trangThaiNganSach: "trong",
    },
    canhBao: [],
  };
}

describe("soThich", () => {
  const HD1: Preference[] = ["bien", "check_in_chup_anh"];
  const HD2: Preference[] = ["thien_nhien", "van_hoa_lich_su"];
  const HD3: Preference[] = ["van_hoa_lich_su", "am_thuc", "check_in_chup_anh", "mua_sam"];
  const HD4: Preference[] = ["giai_tri_vui_choi", "thien_nhien", "check_in_chup_anh"];

  it("khopSoThich và diemKhopTrungBinh với soThich [van_hoa_lich_su, am_thuc]", () => {
    const soThich: Preference[] = ["van_hoa_lich_su", "am_thuc"];
    expect(khopSoThich(HD1, soThich)).toBe(0);
    expect(khopSoThich(HD2, soThich)).toBe(1);
    expect(khopSoThich(HD3, soThich)).toBe(2);
    expect(khopSoThich(HD4, soThich)).toBe(0);

    const plan = createPlanFixtureA();
    expect(diemKhopTrungBinh(plan, soThich)).toBe(0.75);
  });

  it("khopSoThich và diemKhopTrungBinh với soThich [check_in_chup_anh]", () => {
    const soThich: Preference[] = ["check_in_chup_anh"];
    expect(khopSoThich(HD1, soThich)).toBe(1);
    expect(khopSoThich(HD2, soThich)).toBe(0);
    expect(khopSoThich(HD3, soThich)).toBe(1);
    expect(khopSoThich(HD4, soThich)).toBe(1);

    const plan = createPlanFixtureA();
    expect(diemKhopTrungBinh(plan, soThich)).toBe(0.75);
  });

  it("khopSoThich và diemKhopTrungBinh với soThich [bien, thien_nhien, check_in_chup_anh]", () => {
    const soThich: Preference[] = ["bien", "thien_nhien", "check_in_chup_anh"];
    expect(khopSoThich(HD1, soThich)).toBe(2);
    expect(khopSoThich(HD2, soThich)).toBe(1);
    expect(khopSoThich(HD3, soThich)).toBe(1);
    expect(khopSoThich(HD4, soThich)).toBe(2);

    const plan = createPlanFixtureA();
    expect(diemKhopTrungBinh(plan, soThich)).toBe(1.5);
  });

  it("soThich []: mọi giá trị bằng 0", () => {
    const soThich: Preference[] = [];
    expect(khopSoThich(HD1, soThich)).toBe(0);
    expect(khopSoThich(HD2, soThich)).toBe(0);
    expect(khopSoThich(HD3, soThich)).toBe(0);
    expect(khopSoThich(HD4, soThich)).toBe(0);

    const plan = createPlanFixtureA();
    expect(diemKhopTrungBinh(plan, soThich)).toBe(0);
  });

  it("Kế hoạch không có hoạt động: diemKhopTrungBinh = 0", () => {
    const plan = createPlanFixtureA();
    plan.items = plan.items.filter((i) => i.hangMuc !== "Vui chơi");
    expect(diemKhopTrungBinh(plan, ["bien", "van_hoa_lich_su"])).toBe(0);
  });
});
