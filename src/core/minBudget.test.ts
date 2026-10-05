import { describe, it, expect } from "vitest";
import { tinhNganSachToiThieu } from "./minBudget";
import { validatePlan } from "./validatePlan";
import { buildPlan } from "./buildPlan";
import type { TripRequest, Selection } from "@/contracts";

function createFixtureM() {
  return {
    transports: [
      {
        schemaVersion: 4,
        id: "D1",
        huong: "di" as const,
        type: "PLANE" as const,
        provider: "Hãng A",
        origin: "SG",
        destination: "ĐN",
        departureTime: "06:30",
        durationMinutes: 85,
        pricePerPerson: 980000,
        seatClass: "PT",
        boardingPoint: "SG",
        dropOffPoint: "ĐN",
      },
      {
        schemaVersion: 4,
        id: "D2",
        huong: "di" as const,
        type: "PLANE" as const,
        provider: "Hãng B",
        origin: "SG",
        destination: "ĐN",
        departureTime: "09:15",
        durationMinutes: 85,
        pricePerPerson: 1350000,
        seatClass: "PT",
        boardingPoint: "SG",
        dropOffPoint: "ĐN",
      },
      {
        schemaVersion: 4,
        id: "D3",
        huong: "di" as const,
        type: "BUS" as const,
        provider: "Xe C",
        origin: "SG",
        destination: "ĐN",
        departureTime: "17:00",
        durationMinutes: 1050,
        pricePerPerson: 520000,
        seatClass: "GN",
        boardingPoint: "SG",
        dropOffPoint: "ĐN",
      },
      {
        schemaVersion: 4,
        id: "V1",
        huong: "ve" as const,
        type: "PLANE" as const,
        provider: "Hãng A",
        origin: "ĐN",
        destination: "SG",
        departureTime: "18:00",
        durationMinutes: 85,
        pricePerPerson: 980000,
        seatClass: "PT",
        boardingPoint: "ĐN",
        dropOffPoint: "SG",
      },
      {
        schemaVersion: 4,
        id: "V2",
        huong: "ve" as const,
        type: "BUS" as const,
        provider: "Xe C",
        origin: "ĐN",
        destination: "SG",
        departureTime: "16:30",
        durationMinutes: 1050,
        pricePerPerson: 520000,
        seatClass: "GN",
        boardingPoint: "ĐN",
        dropOffPoint: "SG",
      },
    ],
    hotels: [
      {
        schemaVersion: 4,
        id: "H1",
        name: "Khách sạn H1",
        stars: 4,
        pricePerNight: 1100000,
        area: "MK",
        includesBreakfast: true,
        hasPool: true,
        rating: 9,
        reviewCount: 500,
        praised: [],
        watchOut: [],
      },
      {
        schemaVersion: 4,
        id: "H2",
        name: "Khách sạn H2",
        stars: 3,
        pricePerNight: 650000,
        area: "MK",
        includesBreakfast: false,
        hasPool: false,
        rating: 8,
        reviewCount: 100,
        praised: [],
        watchOut: [],
      },
    ],
    activities: [],
  };
}

describe("minBudget", () => {
  const baseRequest: TripRequest = {
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

  it("Không điều cần tránh: toiThieuVND = 5180000", () => {
    const data = createFixtureM();
    const res = tinhNganSachToiThieu({ ...baseRequest, tranh: [] }, data);
    expect(res.toiThieuVND).toBe(5180000);
    expect(res.khaThi).toBe(true);
  });

  it("tranh [tranh_di_chuyen_lau]: 7020000", () => {
    const data = createFixtureM();
    const res = tinhNganSachToiThieu({ ...baseRequest, tranh: ["tranh_di_chuyen_lau"] }, data);
    expect(res.toiThieuVND).toBe(7020000); // D1 + V1 + H2 + ăn
  });

  it("tranh [khong_day_som]: 5180000", () => {
    const data = createFixtureM();
    const res = tinhNganSachToiThieu({ ...baseRequest, tranh: ["khong_day_som"] }, data);
    expect(res.toiThieuVND).toBe(5180000); // D3 + V2 + H2 + ăn (D3 chạy 17:00, không sớm)
  });

  it("tranh [khong_day_som, tranh_di_chuyen_lau]: 7760000", () => {
    const data = createFixtureM();
    const res = tinhNganSachToiThieu(
      { ...baseRequest, tranh: ["khong_day_som", "tranh_di_chuyen_lau"] },
      data
    );
    expect(res.toiThieuVND).toBe(7760000); // D2 + V1 + H2 + ăn
  });

  it("Chỉ còn D1 ở chiều đi và tranh [khong_day_som]: khaThi=false", () => {
    const data = createFixtureM();
    data.transports = data.transports.filter((t) => t.id === "D1" || t.huong === "ve");
    const res = tinhNganSachToiThieu({ ...baseRequest, tranh: ["khong_day_som"] }, data);
    expect(res.khaThi).toBe(false);
    expect(res.lyDo).toBe("khong_co_phuong_tien_phu_hop");
  });

  it("Với ngansachTongVND 5000000 và không điều cần tránh", () => {
    const data = createFixtureM();
    const res = tinhNganSachToiThieu({ ...baseRequest, ngansachTongVND: 5000000, tranh: [] }, data);
    expect(res.khaThi).toBe(false);
    expect(res.lyDo).toBe("ngan_sach_khong_du");
    expect(res.toiThieuVND).toBe(5180000);
  });
});
