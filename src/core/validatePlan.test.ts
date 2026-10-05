import { describe, it, expect } from "vitest";
import { validatePlan } from "./validatePlan";
import { buildPlan } from "./buildPlan";
import type { TripRequest, Selection } from "@/contracts";

function createMockData() {
  return {
    transports: [
      {
        schemaVersion: 4,
        id: "T_DI_0630",
        huong: "di" as const,
        type: "PLANE" as const,
        provider: "Hãng A",
        origin: "TP.HCM",
        destination: "Đà Nẵng",
        departureTime: "06:30",
        durationMinutes: 85,
        pricePerPerson: 980000,
        seatClass: "Phổ thông",
        boardingPoint: "Sân bay",
        dropOffPoint: "Sân bay",
      },
      {
        schemaVersion: 4,
        id: "T_DI_0915",
        huong: "di" as const,
        type: "PLANE" as const,
        provider: "Hãng A",
        origin: "TP.HCM",
        destination: "Đà Nẵng",
        departureTime: "09:15",
        durationMinutes: 85,
        pricePerPerson: 980000,
        seatClass: "Phổ thông",
        boardingPoint: "Sân bay",
        dropOffPoint: "Sân bay",
      },
      {
        schemaVersion: 4,
        id: "T_DI_2240",
        huong: "di" as const,
        type: "PLANE" as const,
        provider: "Hãng A",
        origin: "TP.HCM",
        destination: "Đà Nẵng",
        departureTime: "22:40",
        durationMinutes: 85,
        pricePerPerson: 980000,
        seatClass: "Phổ thông",
        boardingPoint: "Sân bay",
        dropOffPoint: "Sân bay",
      },
      {
        schemaVersion: 4,
        id: "T_DI_TAU",
        huong: "di" as const,
        type: "TRAIN" as const,
        provider: "Tàu",
        origin: "TP.HCM",
        destination: "Đà Nẵng",
        departureTime: "11:30",
        durationMinutes: 1060, // đến 05:10 hôm sau
        pricePerPerson: 980000,
        seatClass: "Nằm",
        boardingPoint: "Ga",
        dropOffPoint: "Ga",
      },
      {
        schemaVersion: 4,
        id: "T_VE",
        huong: "ve" as const,
        type: "PLANE" as const,
        provider: "Hãng A",
        origin: "Đà Nẵng",
        destination: "TP.HCM",
        departureTime: "18:00",
        durationMinutes: 85,
        pricePerPerson: 980000,
        seatClass: "Phổ thông",
        boardingPoint: "Sân bay",
        dropOffPoint: "Sân bay",
      },
      {
        schemaVersion: 4,
        id: "T_VE_BUS",
        huong: "ve" as const,
        type: "BUS" as const,
        provider: "Xe",
        origin: "Đà Nẵng",
        destination: "TP.HCM",
        departureTime: "16:30",
        durationMinutes: 1050,
        pricePerPerson: 520000,
        seatClass: "Nằm",
        boardingPoint: "Bến",
        dropOffPoint: "Bến",
      },
    ],
    hotels: [
      {
        schemaVersion: 4,
        id: "H1",
        name: "Khách sạn H1",
        stars: 4,
        pricePerNight: 1100000,
        area: "Mỹ Khê",
        includesBreakfast: true,
        hasPool: true,
        rating: 9.0,
        reviewCount: 500,
        praised: [],
        watchOut: [],
      },
    ],
    activities: [
      {
        schemaVersion: 4,
        id: "A1",
        ten: "Hoạt động A1",
        khuVuc: "Mỹ Khê",
        giaVeNguoi: 0,
        thoiLuongPhut: 120,
        tuKhoaBanDo: "A1",
        nhan: [],
        dongNguoi: false,
        diBoNhieu: false,
      },
      {
        schemaVersion: 4,
        id: "A2",
        ten: "Hoạt động A2",
        khuVuc: "Hải Châu",
        giaVeNguoi: 40000,
        thoiLuongPhut: 150,
        tuKhoaBanDo: "A2",
        nhan: [],
        dongNguoi: false,
        diBoNhieu: false,
      },
      {
        schemaVersion: 4,
        id: "A3",
        ten: "Hoạt động A3",
        khuVuc: "Sơn Trà",
        giaVeNguoi: 120000,
        thoiLuongPhut: 240,
        tuKhoaBanDo: "A3",
        nhan: [],
        dongNguoi: false,
        diBoNhieu: false,
      },
      {
        schemaVersion: 4,
        id: "A4",
        ten: "Hoạt động A4",
        khuVuc: "Bà Nà",
        giaVeNguoi: 650000,
        thoiLuongPhut: 360,
        tuKhoaBanDo: "A4",
        nhan: [],
        dongNguoi: true,
        diBoNhieu: true,
      },
    ],
  };
}

describe("validatePlan", () => {
  const data = createMockData();

  it("FixtureA, tranh []: hard rỗng, soft có gan_het_ngan_sach và den_truoc_gio_nhan_phong", () => {
    const req: TripRequest = {
      schemaVersion: 4,
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
    };
    const sel: Selection = {
      transportDiId: "T_DI_0630",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [["A1"], ["A2", "A3"], ["A4"]],
    };
    const plan = buildPlan(req, sel, data);
    if (plan.ok) {
      const v = validatePlan(req, plan.plan, data);
      expect(v.hard.length).toBe(0);
      expect(v.soft.some((s) => s.code === "gan_het_ngan_sach")).toBe(true);
      expect(v.soft.some((s) => s.code === "den_truoc_gio_nhan_phong")).toBe(true);
    } else {
      expect.fail("buildPlan failed");
    }
  });

  it("FixtureB (ngân sách 15tr, dùng 15.41tr): vuot_ngan_sach", () => {
    const req: TripRequest = {
      schemaVersion: 4,
      diemDi: "TP.HCM",
      diemDen: "Đà Nẵng",
      soNguoi: 3,
      soNgay: 3,
      ngansachTongVND: 15000000,
      sothich: [],
      tranh: [],
      ghiChu: [],
      thieu: [],
      cauHoiLamRo: [],
      canhBao: [],
    };
    const sel: Selection = {
      transportDiId: "T_DI_0630",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [["A1"], ["A2", "A3"], ["A4"]],
    };
    const plan = buildPlan(req, sel, data);
    if (plan.ok) {
      const v = validatePlan(req, plan.plan, data);
      expect(v.hard.some((h) => h.code === "vuot_ngan_sach")).toBe(true);
      const vuot = v.hard.find((h) => h.code === "vuot_ngan_sach");
      expect(vuot?.duLieu.vuotVND).toBe(410000);
    }
  });

  it("ngay_cuoi_khong_kip: chiều về 16:30, hđ A4", () => {
    const req: TripRequest = {
      schemaVersion: 4,
      diemDi: "TP.HCM",
      diemDen: "Đà Nẵng",
      soNguoi: 2,
      soNgay: 3,
      ngansachTongVND: 15000000,
      sothich: [],
      tranh: [],
      ghiChu: [],
      thieu: [],
      cauHoiLamRo: [],
      canhBao: [],
    };
    const sel: Selection = {
      transportDiId: "T_DI_0630",
      transportVeId: "T_VE_BUS",
      hotelId: "H1",
      hoatDongTheoNgay: [[], [], ["A4"]],
    };
    const plan = buildPlan(req, sel, data);
    if (plan.ok) {
      const v = validatePlan(req, plan.plan, data);
      expect(v.hard.some((h) => h.code === "ngay_cuoi_khong_kip")).toBe(true);
    }
  });

  it("ngay_dau_den_muon: đi 09:15 có A1 vs không có hoạt động", () => {
    const req: TripRequest = {
      schemaVersion: 4,
      diemDi: "TP.HCM",
      diemDen: "Đà Nẵng",
      soNguoi: 2,
      soNgay: 3,
      ngansachTongVND: 15000000,
      sothich: [],
      tranh: [],
      ghiChu: [],
      thieu: [],
      cauHoiLamRo: [],
      canhBao: [],
    };
    
    // Có A1
    let sel: Selection = {
      transportDiId: "T_DI_0915",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [["A1"], [], []],
    };
    let plan = buildPlan(req, sel, data);
    if (plan.ok) {
      let v = validatePlan(req, plan.plan, data);
      expect(v.hard.some((h) => h.code === "ngay_dau_den_muon")).toBe(true);
    }

    // Không có hoạt động
    sel = {
      transportDiId: "T_DI_0915",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [[], [], []],
    };
    plan = buildPlan(req, sel, data);
    if (plan.ok) {
      let v = validatePlan(req, plan.plan, data);
      expect(v.hard.some((h) => h.code === "ngay_dau_den_muon")).toBe(false);
    }
  });

  it("hoat_dong_chong_len: [A4, A2] bị chồng, [A3, A2] không bị", () => {
    const req: TripRequest = {
      schemaVersion: 4,
      diemDi: "TP.HCM",
      diemDen: "Đà Nẵng",
      soNguoi: 2,
      soNgay: 3,
      ngansachTongVND: 15000000,
      sothich: [],
      tranh: [],
      ghiChu: [],
      thieu: [],
      cauHoiLamRo: [],
      canhBao: [],
    };

    // [A4, A2]
    let sel: Selection = {
      transportDiId: "T_DI_0630",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [[], ["A4", "A2"], []],
    };
    let plan = buildPlan(req, sel, data);
    if (plan.ok) {
      let v = validatePlan(req, plan.plan, data);
      expect(v.hard.some((h) => h.code === "hoat_dong_chong_len")).toBe(true);
    }

    // [A3, A2]
    sel = {
      transportDiId: "T_DI_0630",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [[], ["A3", "A2"], []],
    };
    plan = buildPlan(req, sel, data);
    if (plan.ok) {
      let v = validatePlan(req, plan.plan, data);
      expect(v.hard.some((h) => h.code === "hoat_dong_chong_len")).toBe(false);
    }
  });

  it("tranh [khong_day_som] với 06:30, 09:15, Tàu 11:30", () => {
    const req: TripRequest = {
      schemaVersion: 4,
      diemDi: "TP.HCM",
      diemDen: "Đà Nẵng",
      soNguoi: 2,
      soNgay: 3,
      ngansachTongVND: 15000000,
      sothich: [],
      tranh: ["khong_day_som"],
      ghiChu: [],
      thieu: [],
      cauHoiLamRo: [],
      canhBao: [],
    };

    // 06:30
    let sel: Selection = { transportDiId: "T_DI_0630", transportVeId: "T_VE", hotelId: "H1", hoatDongTheoNgay: [[], [], []] };
    let plan = buildPlan(req, sel, data);
    if (plan.ok) {
      expect(validatePlan(req, plan.plan, data).hard.some(h => h.code === "vi_pham_khong_day_som")).toBe(true);
    }

    // 09:15
    sel = { transportDiId: "T_DI_0915", transportVeId: "T_VE", hotelId: "H1", hoatDongTheoNgay: [[], [], []] };
    plan = buildPlan(req, sel, data);
    if (plan.ok) {
      expect(validatePlan(req, plan.plan, data).hard.some(h => h.code === "vi_pham_khong_day_som")).toBe(false);
    }

    // Tàu 11:30
    sel = { transportDiId: "T_DI_TAU", transportVeId: "T_VE", hotelId: "H1", hoatDongTheoNgay: [[], [], []] };
    plan = buildPlan(req, sel, data);
    if (plan.ok) {
      expect(validatePlan(req, plan.plan, data).hard.some(h => h.code === "vi_pham_khong_day_som")).toBe(true);
    }
  });

  it("tranh [khong_di_dem], tranh [tranh_di_chuyen_lau], tranh_dong_nguoi, tranh_di_bo_nhieu", () => {
    const req: TripRequest = {
      schemaVersion: 4,
      diemDi: "TP.HCM",
      diemDen: "Đà Nẵng",
      soNguoi: 2,
      soNgay: 3,
      ngansachTongVND: 15000000,
      sothich: [],
      tranh: ["khong_di_dem", "tranh_di_chuyen_lau", "tranh_dong_nguoi", "tranh_di_bo_nhieu"],
      ghiChu: [],
      thieu: [],
      cauHoiLamRo: [],
      canhBao: [],
    };

    const sel: Selection = {
      transportDiId: "T_DI_2240",
      transportVeId: "T_VE_BUS",
      hotelId: "H1",
      hoatDongTheoNgay: [["A4"], [], []],
    };

    const plan = buildPlan(req, sel, data);
    if (plan.ok) {
      const v = validatePlan(req, plan.plan, data);
      expect(v.hard.some(h => h.code === "vi_pham_khong_di_dem")).toBe(true);
      expect(v.hard.some(h => h.code === "vi_pham_tranh_di_chuyen_lau")).toBe(true);
      expect(v.hard.some(h => h.code === "vi_pham_tranh_dong_nguoi")).toBe(true);
      expect(v.hard.some(h => h.code === "vi_pham_tranh_di_bo_nhieu")).toBe(true);
    }
  });
});
