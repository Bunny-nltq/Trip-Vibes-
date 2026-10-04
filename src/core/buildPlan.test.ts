import { describe, it, expect } from "vitest";
import { buildPlan, type PlanData } from "./buildPlan";
import type { TripRequest, Selection } from "@/contracts";

function createMockData(): PlanData {
  return {
    transports: [
      {
        schemaVersion: 3,
        id: "T_DI",
        huong: "di",
        type: "PLANE",
        provider: "Hãng A",
        origin: "TP.HCM",
        destination: "Đà Nẵng",
        departureTime: "06:30",
        durationMinutes: 85,
        pricePerPerson: 980000,
        seatClass: "Phổ thông",
        boardingPoint: "Sân bay Tân Sơn Nhất",
        dropOffPoint: "Sân bay Đà Nẵng",
      },
      {
        schemaVersion: 3,
        id: "T_VE",
        huong: "ve",
        type: "PLANE",
        provider: "Hãng A",
        origin: "Đà Nẵng",
        destination: "TP.HCM",
        departureTime: "18:00",
        durationMinutes: 85,
        pricePerPerson: 980000,
        seatClass: "Phổ thông",
        boardingPoint: "Sân bay Đà Nẵng",
        dropOffPoint: "Sân bay Tân Sơn Nhất",
      },
    ],
    hotels: [
      {
        schemaVersion: 3,
        id: "H1",
        name: "Khách sạn H1",
        stars: 4,
        pricePerNight: 1100000,
        area: "Mỹ Khê",
        includesBreakfast: true,
        hasPool: true,
        rating: 9.0,
        reviewCount: 500,
        praised: ["Sạch sẽ"],
        watchOut: [],
      },
    ],
    activities: [
      {
        schemaVersion: 3,
        id: "A1",
        ten: "Hoạt động A1",
        khuVuc: "Mỹ Khê",
        giaVeNguoi: 0,
        thoiLuongPhut: 60,
        tuKhoaBanDo: "A1",
        nhan: ["bien"],
        dongNguoi: false,
        diBoNhieu: false,
      },
      {
        schemaVersion: 3,
        id: "A2",
        ten: "Hoạt động A2",
        khuVuc: "Hải Châu",
        giaVeNguoi: 40000,
        thoiLuongPhut: 90,
        tuKhoaBanDo: "A2",
        nhan: ["am_thuc"],
        dongNguoi: false,
        diBoNhieu: false,
      },
      {
        schemaVersion: 3,
        id: "A3",
        ten: "Hoạt động A3",
        khuVuc: "Sơn Trà",
        giaVeNguoi: 120000,
        thoiLuongPhut: 120,
        tuKhoaBanDo: "A3",
        nhan: ["thien_nhien"],
        dongNguoi: false,
        diBoNhieu: false,
      },
      {
        schemaVersion: 3,
        id: "A4",
        ten: "Hoạt động A4",
        khuVuc: "Bà Nà",
        giaVeNguoi: 650000,
        thoiLuongPhut: 300,
        tuKhoaBanDo: "A4",
        nhan: ["giai_tri_vui_choi"],
        dongNguoi: true,
        diBoNhieu: true,
      },
    ],
  };
}

describe("buildPlan", () => {
  it("FixtureA: 2 người, 3 ngày, ngân sách 10 triệu", () => {
    const data = createMockData();

    const request: TripRequest = {
      schemaVersion: 3,
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

    const selection: Selection = {
      transportDiId: "T_DI",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [["A1"], ["A2", "A3"], ["A4"]],
    };

    const result = buildPlan(request, selection, data);
    expect(result.ok).toBe(true);

    if (result.ok) {
      const { tongKet } = result.plan;
      expect(tongKet.theoHangMuc["Di chuyển"]).toBe(3920000);
      expect(tongKet.theoHangMuc["Chỗ ở"]).toBe(2200000);
      expect(tongKet.theoHangMuc["Ăn uống"]).toBe(1800000);
      expect(tongKet.theoHangMuc["Vui chơi"]).toBe(1620000);
      expect(tongKet.tongVND).toBe(9540000);
      expect(tongKet.conLaiVND).toBe(460000);
      expect(tongKet.phanTramDaDung).toBe(95.4);
      expect(tongKet.tongThoiGianDiChuyenPhut).toBe(170);
      expect(tongKet.trangThaiNganSach).toBe("trong");
      expect(result.plan.canhBao).not.toContain("vuot_ngan_sach");
    }
  });

  it("FixtureB: như A nhưng soNguoi 3 và ngansachTongVND 15000000", () => {
    const data = createMockData();

    const request: TripRequest = {
      schemaVersion: 3,
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

    const selection: Selection = {
      transportDiId: "T_DI",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [["A1"], ["A2", "A3"], ["A4"]],
    };

    const result = buildPlan(request, selection, data);
    expect(result.ok).toBe(true);

    if (result.ok) {
      const { tongKet } = result.plan;
      expect(tongKet.theoHangMuc["Di chuyển"]).toBe(5880000);
      expect(tongKet.theoHangMuc["Chỗ ở"]).toBe(4400000); // 2 phòng
      expect(tongKet.theoHangMuc["Ăn uống"]).toBe(2700000);
      expect(tongKet.theoHangMuc["Vui chơi"]).toBe(2430000);
      expect(tongKet.tongVND).toBe(15410000);
      expect(tongKet.conLaiVND).toBe(-410000);
      expect(tongKet.trangThaiNganSach).toBe("vuot");
      expect(result.plan.canhBao).toContain("vuot_ngan_sach");
    }
  });

  describe("Test lỗi", () => {
    const data = createMockData();
    const baseRequest: TripRequest = {
      schemaVersion: 3,
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

    it("lỗi khi có id lạ không tồn tại", () => {
      const result = buildPlan(
        baseRequest,
        {
          transportDiId: "UNKNOWN_T",
          transportVeId: "T_VE",
          hotelId: "H1",
          hoatDongTheoNgay: [["A1"], ["A2"], ["A3"]],
        },
        data
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.loi.some((l) => l.includes("không tồn tại"))).toBe(true);
      }
    });

    it("lỗi khi dùng chuyến chiều đi làm chiều về", () => {
      const result = buildPlan(
        baseRequest,
        {
          transportDiId: "T_DI",
          transportVeId: "T_DI", // T_DI là huong "di", không phải "ve"
          hotelId: "H1",
          hoatDongTheoNgay: [["A1"], ["A2"], ["A3"]],
        },
        data
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.loi.some((l) => l.includes("không phải huong 've'"))).toBe(true);
      }
    });

    it("lỗi khi có 3 hoạt động trong một ngày", () => {
      const result = buildPlan(
        baseRequest,
        {
          transportDiId: "T_DI",
          transportVeId: "T_VE",
          hotelId: "H1",
          hoatDongTheoNgay: [["A1", "A2", "A3"], [], []],
        },
        data
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.loi.some((l) => l.includes("vượt quá mức tối đa"))).toBe(true);
      }
    });

    it("lỗi khi có hoạt động trùng", () => {
      const result = buildPlan(
        baseRequest,
        {
          transportDiId: "T_DI",
          transportVeId: "T_VE",
          hotelId: "H1",
          hoatDongTheoNgay: [["A1"], ["A1"], []], // A1 lặp lại
        },
        data
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.loi.some((l) => l.includes("trùng lặp"))).toBe(true);
      }
    });

    it("lỗi khi hoatDongTheoNgay sai độ dài", () => {
      const result = buildPlan(
        baseRequest,
        {
          transportDiId: "T_DI",
          transportVeId: "T_VE",
          hotelId: "H1",
          hoatDongTheoNgay: [["A1"], ["A2"]], // 2 ngày thay vì 3
        },
        data
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.loi.some((l) => l.includes("khác soNgay"))).toBe(true);
      }
    });
  });
});
