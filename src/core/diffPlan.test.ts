import { describe, it, expect } from "vitest";
import { buildPlan, type PlanData } from "./buildPlan";
import { diffPlan } from "./diffPlan";
import type { TripRequest, Selection, Plan } from "@/contracts";

// ─── Reuse Fixture A data from buildPlan.test.ts ────────────────────────────

function createMockData(): PlanData {
  return {
    transports: [
      {
        schemaVersion: 6,
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
        schemaVersion: 6,
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
      // Tàu chiều về – dùng trong test đổi phương tiện
      {
        schemaVersion: 6,
        id: "T_VE_TAU",
        huong: "ve",
        type: "TRAIN",
        provider: "Đường sắt VN",
        origin: "Đà Nẵng",
        destination: "TP.HCM",
        departureTime: "18:30",
        durationMinutes: 1050,
        pricePerPerson: 850000,
        seatClass: "Giường nằm",
        boardingPoint: "Ga Đà Nẵng",
        dropOffPoint: "Ga Sài Gòn",
      },
    ],
    hotels: [
      {
        schemaVersion: 6,
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
      {
        schemaVersion: 6,
        id: "H2",
        name: "Khách sạn H2",
        stars: 5,
        pricePerNight: 2450000,
        area: "Mỹ Khê",
        includesBreakfast: true,
        hasPool: true,
        rating: 9.5,
        reviewCount: 800,
        praised: ["Sang trọng"],
        watchOut: [],
      },
      {
        schemaVersion: 6,
        id: "H3",
        name: "Khách sạn H3",
        stars: 4,
        pricePerNight: 1350000,
        area: "Hải Châu",
        includesBreakfast: true,
        hasPool: false,
        rating: 8.5,
        reviewCount: 300,
        praised: ["Phòng rộng"],
        watchOut: [],
      },
    ],
    activities: [
      {
        schemaVersion: 6,
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
        schemaVersion: 6,
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
        schemaVersion: 6,
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
        schemaVersion: 6,
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
      // Hoạt động thay thế rẻ hơn
      {
        schemaVersion: 6,
        id: "A3_RẺ",
        ten: "Hoạt động A3 rẻ",
        khuVuc: "Sơn Trà",
        giaVeNguoi: 40000,
        thoiLuongPhut: 120,
        tuKhoaBanDo: "A3R",
        nhan: ["thien_nhien"],
        dongNguoi: false,
        diBoNhieu: false,
      },
    ],
  };
}

const baseRequest: TripRequest = {
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
};

const baseSelection: Selection = {
  transportDiId: "T_DI",
  transportVeId: "T_VE",
  hotelId: "H1",
  hoatDongTheoNgay: [["A1"], ["A2", "A3"], ["A4"]],
  buaAnTheoNgay: [
    { trua: null, toi: null, cafe: null },
    { trua: null, toi: null, cafe: null },
    { trua: null, toi: null, cafe: null },
  ],
};

/** Build plan từ selection, trả plan hoặc throw */
function mustBuild(
  request: TripRequest,
  selection: Selection,
  data: PlanData
): Plan {
  const res = buildPlan(request, selection, data);
  if (!res.ok) throw new Error("buildPlan thất bại: " + res.loi.join("; "));
  return res.plan;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("diffPlan – Fixture A (2 người, 3 ngày, 10 triệu)", () => {
  it("Đổi chiều về từ máy bay sang tàu: chenh = −260.000, ngày 4 bị ảnh hưởng", () => {
    const data = createMockData();

    const planTruoc = mustBuild(baseRequest, baseSelection, data);

    const selectionSau: Selection = {
      ...baseSelection,
      transportVeId: "T_VE_TAU",
    };
    const planSau = mustBuild(baseRequest, selectionSau, data);

    const diff = diffPlan(planTruoc, planSau, data, 1050);

    // tongVND.chenh = (850.000 - 980.000) x 2 = −260.000
    expect(diff.tongVND.chenh).toBe(-260_000);

    // conLaiVND.sau = 10.000.000 - (9.540.000 - 260.000) = 720.000
    expect(diff.conLaiVND.sau).toBe(720_000);

    // thoiGianDiChuyenPhut.chenh = 1050 - 85 = +965
    expect(diff.thoiGianDiChuyenPhut.chenh).toBe(965);

    // ngayAnhHuong phải có ngày 4 (đến nơi vào ngày sau vì 18:30 + 1050 > 1440)
    expect(diff.ngayAnhHuong.some((n) => n.ngay === 4)).toBe(true);

    // Trạng thái ngân sách
    expect(diff.trangThaiNganSach.sau).toBe("trong");

    // canhBaoMoi có ve_den_ngay_sau; canhBaoDaSua có gan_het_ngan_sach
    expect(diff.canhBaoMoi).toEqual(["ve_den_ngay_sau"]);
    expect(diff.canhBaoDaSua).toEqual(["gan_het_ngan_sach"]);
  });

  it("Đổi chiều về sang tàu VỚI tranh_di_chuyen_lau → canhBaoMoi có mã vi phạm", () => {
    const data = createMockData();
    const reqTranh: TripRequest = {
      ...baseRequest,
      tranh: ["tranh_di_chuyen_lau"],
    };

    const planTruoc = mustBuild(reqTranh, baseSelection, data);

    const selectionSau: Selection = {
      ...baseSelection,
      transportVeId: "T_VE_TAU",
    };
    const planSau = mustBuild(reqTranh, selectionSau, data);

    const diff = diffPlan(planTruoc, planSau, data, 1050);

    // canhBaoMoi phải chứa mã liên quan đến di chuyển lâu
    expect(
      diff.canhBaoMoi.some((c) => c.includes("tranh_di_chuyen_lau"))
    ).toBe(true);
  });

  it("Đổi khách sạn từ 1.100.000 sang 2.450.000: chenh = +2.700.000, vượt ngân sách", () => {
    const data = createMockData();

    const planTruoc = mustBuild(baseRequest, baseSelection, data);

    const selectionSau: Selection = {
      ...baseSelection,
      hotelId: "H2",
    };
    const planSau = mustBuild(baseRequest, selectionSau, data);

    const diff = diffPlan(planTruoc, planSau, data);

    // chenh = (2.450.000 - 1.100.000) x 2 đêm x 1 phòng = +2.700.000
    expect(diff.tongVND.chenh).toBe(2_700_000);

    // tongVND.sau = 9.540.000 + 2.700.000 = 12.240.000
    expect(diff.tongVND.sau).toBe(12_240_000);

    // conLaiVND.sau = 10.000.000 - 12.240.000 = −2.240.000
    expect(diff.conLaiVND.sau).toBe(-2_240_000);

    // canhBaoMoi phải có vuot_ngan_sach
    expect(diff.canhBaoMoi).toContain("vuot_ngan_sach");

    // trangThaiNganSach.sau = "vuot"
    expect(diff.trangThaiNganSach.sau).toBe("vuot");
  });

  it("Không đổi gì: mọi chênh lệch bằng 0, doiMuc rỗng", () => {
    const data = createMockData();

    const plan = mustBuild(baseRequest, baseSelection, data);

    const diff = diffPlan(plan, plan, data);

    expect(diff.tongVND.chenh).toBe(0);
    expect(diff.conLaiVND.chenh).toBe(0);
    expect(diff.thoiGianDiChuyenPhut.chenh).toBe(0);
    expect(diff.doiMuc).toEqual([]);
    expect(diff.ngayAnhHuong).toEqual([]);
    expect(diff.canhBaoMoi).toEqual([]);
  });

  it("Đổi hoạt động ngày 2 từ 120.000 sang 40.000: chenh = −160.000, ngày 2 bị ảnh hưởng", () => {
    const data = createMockData();

    const planTruoc = mustBuild(baseRequest, baseSelection, data);

    // Đổi A3 (120.000) thành A3_RẺ (40.000) ở ngày 2
    const selectionSau: Selection = {
      ...baseSelection,
      hoatDongTheoNgay: [["A1"], ["A2", "A3_RẺ"], ["A4"]],
    };
    const planSau = mustBuild(baseRequest, selectionSau, data);

    const diff = diffPlan(planTruoc, planSau, data);

    // chenh = (40.000 - 120.000) x 2 = −160.000
    expect(diff.tongVND.chenh).toBe(-160_000);

    // ngayAnhHuong phải có ngày 2
    expect(diff.ngayAnhHuong.some((n) => n.ngay === 2)).toBe(true);
  });
});

describe("diffPlan – 3 người, đổi khách sạn (2 phòng, 2 đêm)", () => {
  it("chenh = 2 phòng x 2 đêm x 250.000 = 1.000.000", () => {
    const request3: TripRequest = {
      ...baseRequest,
      soNguoi: 3,
    };
    const data = createMockData();

    const selection3: Selection = {
      ...baseSelection,
      // A3 giaVeNguoi=120.000 → soLuong 3 → thanhTien 360.000
    };

    const planTruoc = mustBuild(request3, selection3, data);
    // 3 người → ceil(3/2) = 2 phòng
    // H1: 1.100.000 x 2 đêm x 2 phòng = 4.400.000

    const selectionSau: Selection = {
      ...selection3,
      hotelId: "H3",
    };
    const planSau = mustBuild(request3, selectionSau, data);
    // H3: 1.350.000 x 2 đêm x 2 phòng = 5.400.000

    const diff = diffPlan(planTruoc, planSau, data);

    // chenh = (1.350.000 - 1.100.000) x 2 x 2 = 1.000.000
    expect(diff.tongVND.chenh).toBe(1_000_000);
  });
});
