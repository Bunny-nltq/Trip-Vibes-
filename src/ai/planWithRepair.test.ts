import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { planWithRepair } from "./planWithRepair";
import { executeTimKhachSan } from "./tools";
import { locUngVienTheoNganSach } from "@/core/locUngVienTheoNganSach";
import { validatePlan } from "@/core/validatePlan";
import { LiveDataSource } from "@/data/live/LiveDataSource";
import type { TripRequest, Hotel } from "@/contracts";

describe("planWithRepair - Tích hợp giới hạn thời gian & dự phòng quy tắc (Mục 4)", () => {
  const transports: any[] = [
    {
      id: "PT_A",
      name: "Chuyến bay đi giá rẻ",
      provider: "VietJet",
      huong: "di",
      origin: "Hà Nội",
      destination: "Đà Lạt",
      departureTime: "06:30",
      durationMinutes: 85,
      pricePerPerson: 980_000,
      type: "PLANE",
    },
    {
      id: "PT_B",
      name: "Chuyến bay đi đắt",
      provider: "Vietnam Airlines",
      huong: "di",
      origin: "Hà Nội",
      destination: "Đà Lạt",
      departureTime: "09:15",
      durationMinutes: 85,
      pricePerPerson: 5_000_000,
      type: "PLANE",
    },
    {
      id: "PT_C",
      name: "Chuyến bay về thường",
      provider: "VietJet",
      huong: "ve",
      origin: "Đà Lạt",
      destination: "Hà Nội",
      departureTime: "18:00",
      durationMinutes: 85,
      pricePerPerson: 980_000,
      type: "PLANE",
    },
    {
      id: "PT_D",
      name: "Chuyến bay về rẻ",
      provider: "VietJet",
      huong: "ve",
      origin: "Đà Lạt",
      destination: "Hà Nội",
      departureTime: "22:40",
      durationMinutes: 85,
      pricePerPerson: 790_000,
      type: "PLANE",
    },
  ];

  const hotels: Hotel[] = [
    {
      id: "H1",
      name: "Khách sạn đắt",
      pricePerNight: 2_200_000,
      source: "test",
    },
    {
      id: "H2",
      name: "Khách sạn vừa túi",
      pricePerNight: 780_000,
      source: "test",
    },
    {
      id: "H3",
      name: "Khách sạn H3",
      pricePerNight: 900_000,
      source: "test",
    },
  ] as any;

  const khachSans: any[] = [
    {
      id: "H2",
      ten: "Khách sạn vừa túi",
      soSao: 3,
      khoangGiaDemVND: { min: 780_000, max: 780_000 },
      giaUocTinhNguoi: null,
      giaLaUocTinh: false,
      nguon: "osm:123",
      doTinCay: "xac_minh",
      diaChi: "Đà Lạt",
      toaDo: { lat: 11.94, lng: 108.45 },
      tienNghi: [],
      tags: [],
      nhanGia: "thuc_te",
      includesBreakfast: false,
      hasPool: false,
      nguonGia: [],
    },
    {
      id: "H1",
      ten: "Khách sạn đắt",
      soSao: 5,
      khoangGiaDemVND: { min: 2_200_000, max: 2_200_000 },
      giaUocTinhNguoi: null,
      giaLaUocTinh: false,
      nguon: "osm:124",
      doTinCay: "xac_minh",
      diaChi: "Đà Lạt",
      toaDo: { lat: 11.94, lng: 108.45 },
      tienNghi: [],
      tags: [],
      nhanGia: "thuc_te",
      includesBreakfast: false,
      hasPool: false,
      nguonGia: [],
    },
    {
      id: "H3",
      ten: "Khách sạn H3",
      soSao: 3,
      khoangGiaDemVND: { min: 900_000, max: 900_000 },
      giaUocTinhNguoi: null,
      giaLaUocTinh: false,
      nguon: "osm:125",
      doTinCay: "xac_minh",
      diaChi: "Đà Lạt",
      toaDo: { lat: 11.94, lng: 108.45 },
      tienNghi: [],
      tags: [],
      nhanGia: "thuc_te",
      includesBreakfast: false,
      hasPool: false,
      nguonGia: [],
    },
  ];

  const quanAns: any[] = [
    {
      id: "QA1",
      ten: "Quán Ăn 1",
      loaiHinh: "nha_hang",
      amThuc: "am_thuc",
      giaUocTinhNguoi: 150_000,
      giaLaUocTinh: true,
      nguon: "osm:201",
      doTinCay: "tham_khao",
      diaChi: "Đà Lạt",
      toaDo: { lat: 11.94, lng: 108.45 },
      tags: [],
      gioMoCua: "10:00",
      gioDongCua: "22:00",
    },
    {
      id: "QA2",
      ten: "Quán Ăn 2",
      loaiHinh: "nha_hang",
      amThuc: "am_thuc",
      giaUocTinhNguoi: 150_000,
      giaLaUocTinh: true,
      nguon: "osm:202",
      doTinCay: "tham_khao",
      diaChi: "Đà Lạt",
      toaDo: { lat: 11.94, lng: 108.45 },
      tags: [],
      gioMoCua: "10:00",
      gioDongCua: "22:00",
    },
  ];

  const hoatDongs: any[] = [
    {
      id: "HD1",
      ten: "Thung lũng tình yêu",
      nhom: "tham_quan",
      nhan: ["thien_nhien"],
      giaVeNguoi: 50_000,
      giaLaUocTinh: false,
      thoiLuongPhut: 120,
      nguon: "osm:301",
      doTinCay: "xac_minh",
      diaChi: "Đà Lạt",
      toaDo: { lat: 11.94, lng: 108.45 },
      tags: [],
    },
    {
      id: "HD2",
      ten: "Vườn hoa thành phố",
      nhom: "tham_quan",
      nhan: ["thien_nhien"],
      giaVeNguoi: 40_000,
      giaLaUocTinh: false,
      thoiLuongPhut: 90,
      nguon: "osm:302",
      doTinCay: "xac_minh",
      diaChi: "Đà Lạt",
      toaDo: { lat: 11.94, lng: 108.45 },
      tags: [],
    },
    {
      id: "HD3",
      ten: "Hồ Xuân Hương",
      nhom: "tham_quan",
      nhan: ["thien_nhien"],
      giaVeNguoi: 0,
      giaLaUocTinh: false,
      thoiLuongPhut: 60,
      nguon: "osm:303",
      doTinCay: "xac_minh",
      diaChi: "Đà Lạt",
      toaDo: { lat: 11.94, lng: 108.45 },
      tags: [],
    },
  ];

  const baseRequest: TripRequest = {
    schemaVersion: 8,
    diemDi: {
      ten: "Hà Nội",
      quocGia: "Việt Nam",
      maQuocGia: "VN",
      toaDo: { lat: 21.0285, lng: 105.8542 },
      tienTe: "VND",
      nguon: "nominatim",
      ngayLay: "2026-10-20",
    },
    diemDen: {
      ten: "Đà Lạt",
      quocGia: "Việt Nam",
      maQuocGia: "VN",
      toaDo: { lat: 11.9404, lng: 108.4583 },
      tienTe: "VND",
      nguon: "nominatim",
      ngayLay: "2026-10-20",
    },
    soNguoi: 2,
    soNgay: 3,
    ngansachTongVND: 10_000_000,
    sothich: [],
    tranh: [],
    ghiChu: [],
    thieu: [],
    cauHoiLamRo: [],
    canhBao: [],
  };

  beforeEach(() => {
    process.env.NO_AGENT_CACHE = "1";
    vi.restoreAllMocks();
    vi.spyOn(LiveDataSource.prototype, "getTransports").mockResolvedValue(transports);
    vi.spyOn(LiveDataSource.prototype, "getHotels").mockResolvedValue(hotels);
    vi.spyOn(LiveDataSource.prototype, "getActivities").mockResolvedValue(hoatDongs as any);
    vi.spyOn(LiveDataSource.prototype, "getKhachSans").mockResolvedValue(khachSans);
    vi.spyOn(LiveDataSource.prototype, "getQuanAns").mockResolvedValue(quanAns);
    vi.spyOn(LiveDataSource.prototype, "getCafes").mockResolvedValue([]);
    vi.spyOn(LiveDataSource.prototype, "getHoatDongs").mockResolvedValue(hoatDongs);
    vi.spyOn(LiveDataSource.prototype, "getDataSourceUsed").mockReturnValue({
      source: "snapshot",
      ngayDuLieu: "2026-10-20",
      snapshotDate: "2026-10-20",
      tuoiGio: 0,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("a) provider trả 429 mọi lần: phuongThucLap 'quy_tac', lyDoDuPhong 'het_luot_ai', soLanGoiAI nhỏ hơn hoặc bằng 2, tổng thời gian giả lập dưới 10 giây", async () => {
    vi.useFakeTimers();
    let callCount = 0;

    const mockProvider = {
      modelName: "test-model",
      client: {
        models: {
          generateContent: vi.fn().mockImplementation(async () => {
            callCount++;
            throw new Error("429 RESOURCE_EXHAUSTED: Quota exceeded");
          }),
        },
      },
    } as any;

    const promise = planWithRepair(baseRequest, { provider: mockProvider });
    // Chạy hết timers (thời gian chờ giữa lần 1 và lần 2 là 2000ms < 3000ms)
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.phuongThucLap).toBe("quy_tac");
    expect(result.lyDoDuPhong).toBe("het_luot_ai");
    expect(result.soLanGoiAI).toBeLessThanOrEqual(2);
    expect(callCount).toBeLessThanOrEqual(2);
    expect(result.plan).toBeDefined();
    const expectedVal = validatePlan(baseRequest, result.plan!, {
      transports,
      hotels,
      activities: hoatDongs as any,
      quanAns,
      cafes: [],
    });
    expect(result.soft).toEqual(expectedVal.soft);
  });

  it("b) provider treo vô hạn: sau PLAN_TIME_BUDGET_MS (giả lập 50.000 ms) trả 'quy_tac', lyDoDuPhong 'qua_thoi_gian'", async () => {
    vi.useFakeTimers();

    const mockProvider = {
      modelName: "test-model",
      client: {
        models: {
          generateContent: vi.fn().mockImplementation(() => new Promise(() => {})),
        },
      },
    } as any;

    const promise = planWithRepair(baseRequest, { provider: mockProvider });
    // Tua thời gian giả lập 50.000 ms
    await vi.advanceTimersByTimeAsync(50_000);
    const result = await promise;

    expect(result.phuongThucLap).toBe("quy_tac");
    expect(result.lyDoDuPhong).toBe("qua_thoi_gian");
  });

  it("c) provider trả kế hoạch vượt ngân sách 3 lần liên tiếp và toiThieuVND <= ngân sách: 'quy_tac', lyDoDuPhong 'ai_khong_sua_duoc_ngan_sach', tongVND <= ngân sách", async () => {
    let callStep = 0;
    // Kế hoạch của AI chọn khách sạn đắt H1 (8tr/đêm * 2 đêm = 16tr > ngân sách 10tr)
    const mockProvider = {
      modelName: "test-model",
      client: {
        models: {
          generateContent: vi.fn().mockImplementation(async () => {
            callStep++;
            if (callStep % 2 === 1) {
              return {
                candidates: [{ content: { parts: [] } }],
                functionCalls: [
                  { name: "timPhuongTien", args: { huong: "di" } },
                  { name: "timPhuongTien", args: { huong: "ve" } },
                  { name: "timKhachSan", args: {} },
                ],
              };
            }
            return {
              candidates: [{ content: { parts: [] } }],
              functionCalls: [
                {
                  name: "chotKeHoach",
                  args: {
                    transportDiId: "PT_A",
                    transportVeId: "PT_C",
                    hotelId: "H1",
                    hoatDongTheoNgay: [[], [], []],
                  },
                },
              ],
            };
          }),
        },
      },
    } as any;

    const result = await planWithRepair(baseRequest, { provider: mockProvider });

    expect(result.phuongThucLap).toBe("quy_tac");
    expect(result.lyDoDuPhong).toBe("ai_khong_sua_duoc_ngan_sach");
    expect(result.plan).toBeDefined();
    expect(result.plan!.tongKet.tongVND).toBeLessThanOrEqual(baseRequest.ngansachTongVND!);
  });

  it("d) provider trả kế hoạch hợp lệ: phuongThucLap 'ai', không gọi dự phòng", async () => {
    let callStep = 0;
    const mockProvider = {
      modelName: "test-model",
      client: {
        models: {
          generateContent: vi.fn().mockImplementation(async () => {
            callStep++;
            if (callStep === 1) {
              return {
                candidates: [{ content: { parts: [] } }],
                functionCalls: [
                  { name: "timPhuongTien", args: { huong: "di" } },
                  { name: "timPhuongTien", args: { huong: "ve" } },
                  { name: "timKhachSan", args: {} },
                ],
              };
            }
            return {
              candidates: [{ content: { parts: [] } }],
              functionCalls: [
                {
                  name: "chotKeHoach",
                  args: {
                    transportDiId: "PT_A",
                    transportVeId: "PT_D",
                    hotelId: "H2",
                    hoatDongTheoNgay: [[], [], []],
                  },
                },
              ],
            };
          }),
        },
      },
    } as any;

    const result = await planWithRepair(baseRequest, { provider: mockProvider });

    expect(result.status).toBe("ok");
    expect(result.phuongThucLap).toBe("ai");
    expect(result.lyDoDuPhong).toBeUndefined();
    expect(result.plan!.tongKet.tongVND).toBeLessThanOrEqual(baseRequest.ngansachTongVND!);
  });

  it("e) ngân sách nhỏ hơn mức tối thiểu: khong_the_dat_ngan_sach, soLanGoiAI = 0", async () => {
    const lowBudgetReq: TripRequest = {
      ...baseRequest,
      ngansachTongVND: 5_000_000, // Tối thiểu là 6.900.000
    };

    const generateFn = vi.fn();
    const mockProvider = {
      modelName: "test-model",
      client: {
        models: {
          generateContent: generateFn,
        },
      },
    } as any;

    const result = await planWithRepair(lowBudgetReq, { provider: mockProvider });

    expect(result.status).toBe("khong_the_dat_ngan_sach");
    expect(result.soLanGoiAI).toBe(0);
    expect(generateFn).not.toHaveBeenCalled();
  });

  it("Bước 14 (a) provider luôn trả lệnh công cụ và không bao giờ chốt: dừng sau đúng 8 lượt, phuongThucLap 'quy_tac', lyDoDuPhong 'vuot_so_luot_goi_ai', soLanGoiAI = 8", async () => {
    let callCount = 0;
    const mockProvider = {
      modelName: "test-model",
      client: {
        models: {
          generateContent: vi.fn().mockImplementation(async () => {
            callCount++;
            return {
              candidates: [{ content: { parts: [] } }],
              functionCalls: [
                { name: "timPhuongTien", args: { huong: "di" } },
              ],
            };
          }),
        },
      },
    } as any;

    const result = await planWithRepair(baseRequest, { provider: mockProvider });

    expect(result.phuongThucLap).toBe("quy_tac");
    expect(result.lyDoDuPhong).toBe("vuot_so_luot_goi_ai");
    expect(result.soLanGoiAI).toBe(8);
    expect(callCount).toBe(8);
  });

  it("Bước 14 (b) công cụ timKhachSan với ngân sách 7.500.000 và ứng viên ở mục 1 chỉ trả [H2]", async () => {
    const req = { ...baseRequest, ngansachTongVND: 7_500_000 };
    const testTransports = [
      { id: "PT_A", huong: "di", pricePerPerson: 980_000, departureTime: "06:30", durationMinutes: 85, type: "PLANE" },
      { id: "PT_B", huong: "di", pricePerPerson: 1_350_000, departureTime: "09:15", durationMinutes: 85, type: "PLANE" },
      { id: "PT_C", huong: "ve", pricePerPerson: 980_000, departureTime: "18:00", durationMinutes: 85, type: "PLANE" },
      { id: "PT_D", huong: "ve", pricePerPerson: 790_000, departureTime: "22:40", durationMinutes: 85, type: "PLANE" },
    ];
    const testHotels = [
      { id: "H1", name: "Khách sạn H1", pricePerNight: 1_100_000, stars: 4, area: "Đà Lạt" },
      { id: "H2", name: "Khách sạn H2", pricePerNight: 780_000, stars: 3, area: "Đà Lạt" },
    ];

    const ctx: any = {
      dataSource: {
        getTransports: vi.fn().mockResolvedValue(testTransports),
        getHotels: vi.fn().mockResolvedValue(testHotels),
      },
      liveDataSource: undefined,
      soNguoi: 2,
      soNgay: 3,
      soDem: 2,
      soPhong: 1,
      seenIds: new Set(),
      validFoodIds: new Set(),
    };

    const locRes = locUngVienTheoNganSach(req, {
      transports: testTransports as any,
      hotels: testHotels as any,
    });
    ctx.allowedHotelIds = new Set(locRes.khachSan.map((h) => h.id));

    const result = await executeTimKhachSan({}, ctx);
    expect(result.map((h) => h.id)).toEqual(["H2"]);
  });

  it("Bước 14 (c) khaThi false thì KHÔNG gọi provider (soLanGoiAI = 0) và trả khong_the_dat_ngan_sach", async () => {
    const lowBudgetReq: TripRequest = {
      ...baseRequest,
      ngansachTongVND: 6_800_000,
    };

    const generateFn = vi.fn();
    const mockProvider = {
      modelName: "test-model",
      client: {
        models: {
          generateContent: generateFn,
        },
      },
    } as any;

    const result = await planWithRepair(lowBudgetReq, { provider: mockProvider });

    expect(result.status).toBe("khong_the_dat_ngan_sach");
    expect(result.soLanGoiAI).toBe(0);
    expect(generateFn).not.toHaveBeenCalled();
  });
});
