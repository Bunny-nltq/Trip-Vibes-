import { describe, it, expect } from "vitest";
import { buildPlan, type PlanData } from "./buildPlan";
import type { TripRequest, Selection } from "@/contracts";

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

describe("buildPlan – Ăn uống mặc định", () => {
  /**
   * Fixture A: 2 người, 3 ngày, ngân sách 10 triệu
   * Mọi bữa là null → dùng mặc định 150.000/người/bữa
   * Ăn uống = 150.000 x 2 x 2 bữa x 3 ngày = 1.800.000
   * Di chuyển = 980.000 x 2 x 2 chiều = 3.920.000
   * Chỗ ở = 1.100.000 x 2 đêm x 1 phòng = 2.200.000
   * Vui chơi = (0+40.000+120.000+650.000) x 2 = 1.620.000
   * Tổng = 3.920.000 + 2.200.000 + 1.800.000 + 1.620.000 = 9.540.000
   */
  it("FixtureA mọi bữa null: Ăn uống = 1.800.000, tổng = 9.540.000", () => {
    const data = createMockData();
    const selection: Selection = {
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

    const result = buildPlan(baseRequest, selection, data);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const { tongKet } = result.plan;
      expect(tongKet.theoHangMuc["Ăn uống"]).toBe(1_800_000);
      expect(tongKet.tongVND).toBe(9_540_000);
      expect(tongKet.conLaiVND).toBe(460_000);
    }
  });

  /**
   * Fixture A không có buaAnTheoNgay (undefined) → tương đương mọi bữa null
   */
  it("FixtureA không có buaAnTheoNgay: Ăn uống = 1.800.000", () => {
    const data = createMockData();
    const selection: Selection = {
      transportDiId: "T_DI",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [["A1"], ["A2", "A3"], ["A4"]],
    };

    const result = buildPlan(baseRequest, selection, data);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.tongKet.theoHangMuc["Ăn uống"]).toBe(1_800_000);
      expect(result.plan.tongKet.tongVND).toBe(9_540_000);
      expect(result.plan.tongKet.conLaiVND).toBe(460_000);
    }
  });
});

describe("buildPlan – Ăn uống có giá quán", () => {
  /**
   * Fixture A với trưa 120.000/người và tối 180.000/người (tất cả ngày):
   * Ăn uống = (120.000 + 180.000) x 2 x 3 = 1.800.000
   * (Trùng hợp giống mặc định vì 150k*2 = 300k/ngày/người)
   */
  it("FixtureA trưa 120k, tối 180k: Ăn uống = 1.800.000", () => {
    const data = createMockData();
    // Thêm quán ăn vào dữ liệu
    data.quanAns = [
      {
        id: "QA_TRUA",
        osmId: "osm:node:1",
        ten: "Quán trưa",
        khuVuc: "Mỹ Khê",
        diaChi: null,
        toaDo: { lat: 16.06, lng: 108.24 },
        loai: "quan_an",
        gioMoCua: null,
        soSao: null,
        giaUocTinhNguoi: 120_000,
        nguon: "https://example.com/trua",
        ngayLay: "2026-10-19T00:00:00.000Z",
        doTinCay: "uoc_tinh",
        giaLaUocTinh: true,
        amThuc: "hai_san",
      },
      {
        id: "QA_TOI",
        osmId: "osm:node:2",
        ten: "Quán tối",
        khuVuc: "Mỹ Khê",
        diaChi: null,
        toaDo: { lat: 16.06, lng: 108.24 },
        loai: "quan_an",
        gioMoCua: null,
        soSao: null,
        giaUocTinhNguoi: 180_000,
        nguon: "https://example.com/toi",
        ngayLay: "2026-10-19T00:00:00.000Z",
        doTinCay: "uoc_tinh",
        giaLaUocTinh: true,
        amThuc: "hai_san",
      },
    ];

    const selection: Selection = {
      transportDiId: "T_DI",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [["A1"], ["A2", "A3"], ["A4"]],
      buaAnTheoNgay: [
        { trua: "QA_TRUA", toi: "QA_TOI", cafe: null },
        { trua: "QA_TRUA", toi: "QA_TOI", cafe: null },
        { trua: "QA_TRUA", toi: "QA_TOI", cafe: null },
      ],
    };

    const result = buildPlan(baseRequest, selection, data);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.tongKet.theoHangMuc["Ăn uống"]).toBe(1_800_000);
      expect(result.plan.tongKet.tongVND).toBe(9_540_000);
    }
  });

  /**
   * Fixture A với cafe 50.000/người cả 3 ngày:
   * Ăn uống = (150k + 150k + 50k) x 2 x 3 = 2.100.000
   * Tổng = 3.920.000 + 2.200.000 + 2.100.000 + 1.620.000 = 9.840.000
   * Còn lại = 10.000.000 - 9.840.000 = 160.000
   * phanTramDaDung = 98.4
   */
  it("FixtureA cafe 50k/người x3 ngày: Ăn uống = 2.100.000, tổng = 9.840.000", () => {
    const data = createMockData();
    data.cafes = [
      {
        id: "CAFE1",
        osmId: "osm:node:3",
        ten: "Cafe test",
        khuVuc: "Mỹ Khê",
        diaChi: null,
        toaDo: { lat: 16.06, lng: 108.24 },
        loai: "cafe",
        gioMoCua: null,
        soSao: null,
        giaUocTinhNguoi: 50_000,
        nguon: "https://example.com/cafe",
        ngayLay: "2026-10-19T00:00:00.000Z",
        doTinCay: "uoc_tinh",
        giaLaUocTinh: true,
      },
    ];

    const selection: Selection = {
      transportDiId: "T_DI",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [["A1"], ["A2", "A3"], ["A4"]],
      buaAnTheoNgay: [
        { trua: null, toi: null, cafe: "CAFE1" },
        { trua: null, toi: null, cafe: "CAFE1" },
        { trua: null, toi: null, cafe: "CAFE1" },
      ],
    };

    const result = buildPlan(baseRequest, selection, data);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.tongKet.theoHangMuc["Ăn uống"]).toBe(2_100_000);
      expect(result.plan.tongKet.tongVND).toBe(9_840_000);
      expect(result.plan.tongKet.conLaiVND).toBe(160_000);
      expect(result.plan.tongKet.phanTramDaDung).toBe(98.4);
    }
  });
});

describe("buildPlan – Khách sạn live (KhachSan)", () => {
  /**
   * Khách sạn 4 sao không có giá → dùng HOTEL_GIA_THEO_SAO[4] = 1.300.000
   * giaLaUocTinh = true
   */
  it("Khách sạn 4 sao không có giá → giaDem = 1.300.000, giaLaUocTinh = true", () => {
    const data = createMockData();
    data.khachSans = [
      {
        id: "KS_LIVE",
        osmId: "osm:node:99",
        ten: "Khách sạn Live 4 sao",
        khuVuc: "Mỹ Khê",
        diaChi: null,
        toaDo: { lat: 16.06, lng: 108.24 },
        loai: "khach_san",
        gioMoCua: null,
        soSao: 4,
        giaUocTinhNguoi: null,
        nguon: null,
        ngayLay: "2026-10-19T00:00:00.000Z",
        doTinCay: "tham_khao",
        giaLaUocTinh: true,
        khoangGiaDemVND: null,
        includesBreakfast: false,
        hasPool: false,
        nguonGia: [],
      },
    ];

    const selection: Selection = {
      transportDiId: "T_DI",
      transportVeId: "T_VE",
      hotelId: "KS_LIVE",
      hoatDongTheoNgay: [[], [], []],
    };

    const result = buildPlan(baseRequest, selection, data);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const choOItem = result.plan.items.find((i) => i.hangMuc === "Chỗ ở");
      expect(choOItem).toBeDefined();
      // 2 đêm x 1 phòng x 1.300.000 = 2.600.000
      expect(choOItem!.donGia).toBe(1_300_000);
      expect(choOItem!.giaLaUocTinh).toBe(true);
    }
  });

  /**
   * Khách sạn không có số sao → dùng HOTEL_GIA_MAC_DINH = 700.000
   */
  it("Khách sạn không có số sao → giaDem = 700.000", () => {
    const data = createMockData();
    data.khachSans = [
      {
        id: "KS_NOSAO",
        osmId: "osm:node:100",
        ten: "Khách sạn Không Sao",
        khuVuc: "Hải Châu",
        diaChi: null,
        toaDo: { lat: 16.07, lng: 108.22 },
        loai: "khach_san",
        gioMoCua: null,
        soSao: null,
        giaUocTinhNguoi: null,
        nguon: null,
        ngayLay: "2026-10-19T00:00:00.000Z",
        doTinCay: "tham_khao",
        giaLaUocTinh: true,
        khoangGiaDemVND: null,
        includesBreakfast: false,
        hasPool: false,
        nguonGia: [],
      },
    ];

    const selection: Selection = {
      transportDiId: "T_DI",
      transportVeId: "T_VE",
      hotelId: "KS_NOSAO",
      hoatDongTheoNgay: [[], [], []],
    };

    const result = buildPlan(baseRequest, selection, data);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const choOItem = result.plan.items.find((i) => i.hangMuc === "Chỗ ở");
      expect(choOItem!.donGia).toBe(700_000);
    }
  });
});

describe("buildPlan – Maps URLs (core/maps.ts)", () => {
  it("buildMapsUrls tạo URL đúng cho 'Bãi biển Mỹ Khê'", async () => {
    const { buildMapsUrls } = await import("./maps");
    const place = {
      ten: "Bãi biển Mỹ Khê",
      toaDo: { lat: 16.0617, lng: 108.2478 },
    };
    const urls = buildMapsUrls(place, "Đà Nẵng");
    expect(urls.xem).toBe(
      "https://www.google.com/maps/search/?api=1&query=B%C3%A3i%20bi%E1%BB%83n%20M%E1%BB%B9%20Kh%C3%AA%2C%20%C4%90%C3%A0%20N%E1%BA%B5ng"
    );
    expect(urls.chiDuong).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=16.0617%2C108.2478"
    );
    expect(urls.apple).toBe("https://maps.apple.com/?daddr=16.0617,108.2478");
  });
});

describe("buildPlan – Lỗi validation", () => {
  const data = createMockData();

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
        transportVeId: "T_DI",
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
        hoatDongTheoNgay: [["A1"], ["A1"], []],
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
        hoatDongTheoNgay: [["A1"], ["A2"]],
      },
      data
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.loi.some((l) => l.includes("khác soNgay"))).toBe(true);
    }
  });
});

describe("buildPlan – FixtureB (3 người)", () => {
  it("3 người, 3 ngày: Chỗ ở 2 phòng, vẫn tính đúng", () => {
    const data = createMockData();
    const request3: TripRequest = {
      ...baseRequest,
      soNguoi: 3,
      ngansachTongVND: 15000000,
    };
    const selection: Selection = {
      transportDiId: "T_DI",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [["A1"], ["A2", "A3"], ["A4"]],
    };

    const result = buildPlan(request3, selection, data);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const { tongKet } = result.plan;
      expect(tongKet.theoHangMuc["Di chuyển"]).toBe(5_880_000);
      expect(tongKet.theoHangMuc["Chỗ ở"]).toBe(4_400_000); // 2 phòng
      expect(tongKet.theoHangMuc["Ăn uống"]).toBe(2_700_000);
      expect(tongKet.theoHangMuc["Vui chơi"]).toBe(2_430_000);
    }
  });
});

describe("buildPlan – N ngày, Fixture A", () => {
  const data = createMockData();

  it("4 ngày, hoạt động [[A1],[A2,A3],[],[]]", () => {
    const req4: TripRequest = {
      ...baseRequest,
      soNgay: 4,
      soNguoi: 2,
      ngansachTongVND: 10_000_000,
    };
    const selection: Selection = {
      transportDiId: "T_DI",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [["A1"], ["A2", "A3"], [], []],
    };

    const res = buildPlan(req4, selection, data);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const { tongKet } = res.plan;
      expect(tongKet.theoHangMuc["Di chuyển"]).toBe(3_920_000);
      expect(tongKet.theoHangMuc["Chỗ ở"]).toBe(3_300_000);
      expect(tongKet.theoHangMuc["Ăn uống"]).toBe(2_400_000);
      expect(tongKet.theoHangMuc["Vui chơi"]).toBe(320_000);
      expect(tongKet.tongVND).toBe(9_940_000);
      expect(tongKet.conLaiVND).toBe(60_000);
      expect(tongKet.phanTramDaDung).toBe(99.4);
    }
  });

  it("2 ngày, hoạt động [[A1],[A2]]", () => {
    const req2: TripRequest = {
      ...baseRequest,
      soNgay: 2,
      soNguoi: 2,
      ngansachTongVND: 10_000_000,
    };
    const selection: Selection = {
      transportDiId: "T_DI",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [["A1"], ["A2"]],
    };

    const res = buildPlan(req2, selection, data);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const { tongKet } = res.plan;
      expect(tongKet.theoHangMuc["Chỗ ở"]).toBe(1_100_000);
      expect(tongKet.theoHangMuc["Ăn uống"]).toBe(1_200_000);
      expect(tongKet.theoHangMuc["Vui chơi"]).toBe(80_000);
      expect(tongKet.tongVND).toBe(6_300_000);
    }
  });

  it("5 ngày, hoạt động [[A1],[A2,A3],[],[],[]]", () => {
    const req5: TripRequest = {
      ...baseRequest,
      soNgay: 5,
      soNguoi: 2,
      ngansachTongVND: 10_000_000,
    };
    const selection: Selection = {
      transportDiId: "T_DI",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [["A1"], ["A2", "A3"], [], [], []],
    };

    const res = buildPlan(req5, selection, data);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const { tongKet, canhBao } = res.plan;
      expect(tongKet.theoHangMuc["Chỗ ở"]).toBe(4_400_000);
      expect(tongKet.theoHangMuc["Ăn uống"]).toBe(3_000_000);
      expect(tongKet.theoHangMuc["Vui chơi"]).toBe(320_000);
      expect(tongKet.tongVND).toBe(11_640_000);
      expect(tongKet.conLaiVND).toBe(-1_640_000);
      expect(canhBao).toContain("vuot_ngan_sach");
    }
  });

  it("Số ô hoạt động sai (ngày giữa 3 hoạt động; ngày đầu 2 hoạt động) trả lỗi", () => {
    const req3: TripRequest = {
      ...baseRequest,
      soNgay: 3,
      soNguoi: 2,
      ngansachTongVND: 10_000_000,
    };

    // Ngày đầu 2 hoạt động
    const selNgayDau2: Selection = {
      transportDiId: "T_DI",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [["A1", "A2"], ["A3"], []],
    };
    const resNgayDau = buildPlan(req3, selNgayDau2, data);
    expect(resNgayDau.ok).toBe(false);

    // Ngày giữa 3 hoạt động
    const selNgayGiua3: Selection = {
      transportDiId: "T_DI",
      transportVeId: "T_VE",
      hotelId: "H1",
      hoatDongTheoNgay: [["A1"], ["A2", "A3", "A4"], []],
    };
    const resNgayGiua = buildPlan(req3, selNgayGiua3, data);
    expect(resNgayGiua.ok).toBe(false);
  });

  describe("Giờ hoạt động thống nhất (Bước 17)", () => {
    it("Fixture A, 3 ngày, chiều đi đến 07:55: ngày 1 hoạt động giờ 09:30; ngày 2 hai hoạt động giờ 09:30 và 15:30; ngày 3 giờ 09:30", () => {
      const data = createMockData();
      const selection: Selection = {
        transportDiId: "T_DI", // 06:30 + 85 = 07:55
        transportVeId: "T_VE",
        hotelId: "H1",
        hoatDongTheoNgay: [["A1"], ["A2", "A3"], ["A4"]],
      };
      const res = buildPlan(baseRequest, selection, data);
      expect(res.ok).toBe(true);
      if (res.ok) {
        const vuiChoi = res.plan.items.filter((i) => i.hangMuc === "Vui chơi");
        const actNgay1 = vuiChoi.filter((i) => i.ngay === 1);
        const actNgay2 = vuiChoi.filter((i) => i.ngay === 2);
        const actNgay3 = vuiChoi.filter((i) => i.ngay === 3);

        expect(actNgay1[0].gio).toBe("09:30");
        expect(actNgay2[0].gio).toBe("09:30");
        expect(actNgay2[1].gio).toBe("15:30");
        expect(actNgay3[0].gio).toBe("09:30");
      }
    });

    it("Với chiều đi đến 10:19: ngày 1 hoạt động giờ 15:30", () => {
      const data = createMockData();
      data.transports = [
        {
          ...data.transports[0],
          departureTime: "08:54",
          durationMinutes: 85, // 08:54 + 85 = 10:19 (619 phút)
        },
        data.transports[1],
      ];
      const selection: Selection = {
        transportDiId: "T_DI",
        transportVeId: "T_VE",
        hotelId: "H1",
        hoatDongTheoNgay: [["A1"], ["A2", "A3"], ["A4"]],
      };
      const res = buildPlan(baseRequest, selection, data);
      expect(res.ok).toBe(true);
      if (res.ok) {
        const vuiChoi = res.plan.items.filter((i) => i.hangMuc === "Vui chơi");
        const actNgay1 = vuiChoi.filter((i) => i.ngay === 1);
        expect(actNgay1[0].gio).toBe("15:30");
      }
    });
  });
});

