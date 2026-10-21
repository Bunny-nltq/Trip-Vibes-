import { describe, it, expect } from "vitest";
import { validatePlan } from "./validatePlan";
import { buildPlan, type PlanData } from "./buildPlan";
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

  it("đến 10:40, ngày 1 có A1 (giờ 15:30): không vi phạm", () => {
    const req: TripRequest = {
      schemaVersion: 9,
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
      const v = validatePlan(req, plan.plan, data);
      expect(v.hard.some((h) => h.code === "ngay_dau_den_muon")).toBe(false);
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
      const v = validatePlan(req, plan.plan, data);
      expect(v.hard.some((h) => h.code === "ngay_dau_den_muon")).toBe(false);
    }
  });

  it("chuyến đi đến 15:00 (900 phút), ngày 1 có A1: hard chứa ngay_dau_den_muon và chi tiết chứa 15:00", () => {
    const req: TripRequest = {
      schemaVersion: 9,
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
    const tDi1500: any = {
      id: "T_DI_1500",
      huong: "di",
      type: "PLANE",
      provider: "Hãng A",
      origin: "TP.HCM",
      destination: "Đà Nẵng",
      departureTime: "13:00",
      durationMinutes: 120, // 13:00 + 120 = 15:00 (900 phút)
      pricePerPerson: 980000,
      seatClass: "Phổ thông",
      boardingPoint: "Sân bay",
      dropOffPoint: "Sân bay",
    };
    const customData: PlanData = {
      ...data,
      transports: [tDi1500, ...data.transports.filter((t) => t.id !== "T_DI_1500")],
    };
    const sel: Selection = {
      transportDiId: "T_DI_1500",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [["A1"], [], []],
    };
    const plan = buildPlan(req, sel, customData);
    if (plan.ok) {
      const v = validatePlan(req, plan.plan, customData);
      const err = v.hard.find((h) => h.code === "ngay_dau_den_muon");
      expect(err).toBeDefined();
      expect(err?.chiTiet).toContain("15:00");
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
      const v = validatePlan(req, plan.plan, data);
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
      const v = validatePlan(req, plan.plan, data);
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

  describe("canh_bao_den_ngay_sau", () => {
    const req: TripRequest = {
      schemaVersion: 9,
      diemDi: "TP.HCM",
      diemDen: {
        ten: "Đà Nẵng",
        quocGia: "Việt Nam",
        maQuocGia: "VN",
        toaDo: { lat: 16, lng: 108 },
        tienTe: "VND",
        nguon: "nominatim",
        ngayLay: "2026-10-20",
      },
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

    function minToTime(min: number): string {
      const h = Math.floor(min / 60) % 24;
      const m = min % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    function testDi(dep: number, dur: number): boolean {
      const tDi: any = {
        id: "T_DI_TEST",
        huong: "di",
        departureTime: minToTime(dep),
        durationMinutes: dur,
        pricePerPerson: 100000,
      };
      const tVe: any = {
        id: "T_VE_TEST",
        huong: "ve",
        departureTime: "12:00",
        durationMinutes: 60,
        pricePerPerson: 100000,
      };
      const mockPlan: any = {
        schemaVersion: 9,
        request: req,
        items: [
          { hangMuc: "Di chuyển", refId: "T_DI_TEST", ngay: 1 },
          { hangMuc: "Di chuyển", refId: "T_VE_TEST", ngay: 3 },
        ],
        tongKet: {
          tongVND: 1000000,
          conLaiVND: 14000000,
          theoHangMuc: {},
          tongThoiGianDiChuyenPhut: 0,
          trangThaiNganSach: "trong",
        },
        canhBao: [],
      };
      const mockData: any = {
        transports: [tDi, tVe],
        hotels: [],
        activities: [],
      };
      const res = validatePlan(req, mockPlan, mockData);
      return res.soft.some((s) => s.code === "den_vao_ngay_sau");
    }

    function testVe(dep: number, dur: number): boolean {
      const tDi: any = {
        id: "T_DI_TEST",
        huong: "di",
        departureTime: "08:00",
        durationMinutes: 60,
        pricePerPerson: 100000,
      };
      const tVe: any = {
        id: "T_VE_TEST",
        huong: "ve",
        departureTime: minToTime(dep),
        durationMinutes: dur,
        pricePerPerson: 100000,
      };
      const mockPlan: any = {
        schemaVersion: 9,
        request: req,
        items: [
          { hangMuc: "Di chuyển", refId: "T_DI_TEST", ngay: 1 },
          { hangMuc: "Di chuyển", refId: "T_VE_TEST", ngay: 3 },
        ],
        tongKet: {
          tongVND: 1000000,
          conLaiVND: 14000000,
          theoHangMuc: {},
          tongThoiGianDiChuyenPhut: 0,
          trangThaiNganSach: "trong",
        },
        canhBao: [],
      };
      const mockData: any = {
        transports: [tDi, tVe],
        hotels: [],
        activities: [],
      };
      const res = validatePlan(req, mockPlan, mockData);
      return res.soft.some((s) => s.code === "ve_den_ngay_sau");
    }

    it("chiều đi (420, 1247) có den_vao_ngay_sau", () => {
      expect(testDi(420, 1247)).toBe(true);
    });

    it("chiều đi (390, 85) không có den_vao_ngay_sau", () => {
      expect(testDi(390, 85)).toBe(false);
    });

    it("chiều đi (1380, 60) có den_vao_ngay_sau (đúng 1440)", () => {
      expect(testDi(1380, 60)).toBe(true);
    });

    it("chiều về (960, 1247) có ve_den_ngay_sau", () => {
      expect(testVe(960, 1247)).toBe(true);
    });

    it("chiều về (1080, 85) không có ve_den_ngay_sau", () => {
      expect(testVe(1080, 85)).toBe(false);
    });

    it("chiều về (1320, 120) có ve_den_ngay_sau (đúng 1440)", () => {
      expect(testVe(1320, 120)).toBe(true);
    });
  });

  describe("Giờ dạng HH:MM trong cảnh báo (Bước 17)", () => {
    it("gioDen 1087 cho chuỗi chứa 18:07 (ngay_dau_den_muon)", () => {
      const req: TripRequest = {
        schemaVersion: 9,
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
      const tDi: any = {
        id: "T_DI_1087",
        huong: "di",
        departureTime: "17:07",
        durationMinutes: 60, // 17:07 + 60 = 18:07 (1087 phút)
        pricePerPerson: 100000,
      };
      const tVe: any = {
        id: "T_VE",
        huong: "ve",
        departureTime: "18:00",
        durationMinutes: 60,
        pricePerPerson: 100000,
      };
      const plan: any = {
        schemaVersion: 9,
        request: req,
        items: [
          { hangMuc: "Di chuyển", refId: "T_DI_1087", ngay: 1 },
          { hangMuc: "Di chuyển", refId: "T_VE", ngay: 3 },
          { hangMuc: "Vui chơi", refId: "A1", ngay: 1 },
        ],
        tongKet: {
          tongVND: 1000000,
          conLaiVND: 14000000,
          theoHangMuc: {},
          tongThoiGianDiChuyenPhut: 120,
          trangThaiNganSach: "trong",
        },
        canhBao: [],
      };
      const mockData: any = {
        transports: [tDi, tVe],
        hotels: [],
        activities: [{ id: "A1", ten: "Hoạt động A1", thoiLuongPhut: 60 }],
      };
      const res = validatePlan(req, plan, mockData);
      const v = res.hard.find((h) => h.code === "ngay_dau_den_muon");
      expect(v).toBeDefined();
      expect(v?.chiTiet).toContain("18:07");
    });

    it("gioDen 619 cho chuỗi chứa 10:19 (den_truoc_gio_nhan_phong)", () => {
      const req: TripRequest = {
        schemaVersion: 9,
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
      const tDi: any = {
        id: "T_DI_619",
        huong: "di",
        departureTime: "08:54",
        durationMinutes: 85, // 08:54 + 85 = 10:19 (619 phút)
        pricePerPerson: 100000,
      };
      const tVe: any = {
        id: "T_VE",
        huong: "ve",
        departureTime: "18:00",
        durationMinutes: 60,
        pricePerPerson: 100000,
      };
      const plan: any = {
        schemaVersion: 9,
        request: req,
        items: [
          { hangMuc: "Di chuyển", refId: "T_DI_619", ngay: 1 },
          { hangMuc: "Di chuyển", refId: "T_VE", ngay: 3 },
        ],
        tongKet: {
          tongVND: 1000000,
          conLaiVND: 14000000,
          theoHangMuc: {},
          tongThoiGianDiChuyenPhut: 145,
          trangThaiNganSach: "trong",
        },
        canhBao: [],
      };
      const mockData: any = {
        transports: [tDi, tVe],
        hotels: [],
        activities: [],
      };
      const res = validatePlan(req, plan, mockData);
      const v = res.soft.find((s) => s.code === "den_truoc_gio_nhan_phong");
      expect(v).toBeDefined();
      expect(v?.chiTiet).toContain("10:19");
    });
  });
});
