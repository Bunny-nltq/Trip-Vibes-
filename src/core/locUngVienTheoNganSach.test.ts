import { describe, it, expect } from "vitest";
import { locUngVienTheoNganSach } from "./locUngVienTheoNganSach";
import type { TripRequest, Transport, Hotel } from "@/contracts";

describe("locUngVienTheoNganSach (Mục 1 - Bước 14)", () => {
  const transports: any[] = [
    {
      id: "PT_A",
      name: "PT_A",
      provider: "Hãng A",
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
      name: "PT_B",
      provider: "Hãng B",
      huong: "di",
      origin: "Hà Nội",
      destination: "Đà Lạt",
      departureTime: "09:15",
      durationMinutes: 85,
      pricePerPerson: 1_350_000,
      type: "PLANE",
    },
    {
      id: "PT_C",
      name: "PT_C",
      provider: "Hãng C",
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
      name: "PT_D",
      provider: "Hãng D",
      huong: "ve",
      origin: "Đà Lạt",
      destination: "Hà Nội",
      departureTime: "22:40",
      durationMinutes: 85,
      pricePerPerson: 790_000,
      type: "PLANE",
    },
  ];

  const hotels: any[] = [
    {
      id: "H1",
      name: "Khách sạn H1",
      pricePerNight: 1_100_000,
      source: "test",
    },
    {
      id: "H2",
      name: "Khách sạn H2",
      pricePerNight: 780_000,
      source: "test",
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
    ngansachTongVND: 7_500_000,
    sothich: [],
    tranh: [],
    ghiChu: [],
    thieu: [],
    cauHoiLamRo: [],
    canhBao: [],
  };

  it("Ngân sách 7.500.000, không tránh gì: phuongTienDi [A]; phuongTienVe [C, D]; khachSan [H2]; khaThi true; toiThieuVND 6.900.000", () => {
    const req = { ...baseRequest, ngansachTongVND: 7_500_000, tranh: [] };
    const res = locUngVienTheoNganSach(req, { transports, hotels });

    expect(res.khaThi).toBe(true);
    expect(res.toiThieuVND).toBe(6_900_000);
    expect(res.phuongTienDi.map((t) => t.id)).toEqual(["PT_A"]);
    expect(res.phuongTienVe.map((t) => t.id)).toEqual(["PT_C", "PT_D"]);
    expect(res.khachSan.map((h) => h.id)).toEqual(["H2"]);
  });

  it("Ngân sách 8.000.000, không tránh gì: phuongTienDi [A, B]; phuongTienVe [C, D]; khachSan [H1, H2]", () => {
    const req = { ...baseRequest, ngansachTongVND: 8_000_000, tranh: [] };
    const res = locUngVienTheoNganSach(req, { transports, hotels });

    expect(res.khaThi).toBe(true);
    expect(res.phuongTienDi.map((t) => t.id)).toEqual(["PT_A", "PT_B"]);
    expect(res.phuongTienVe.map((t) => t.id)).toEqual(["PT_C", "PT_D"]);
    expect(res.khachSan.map((h) => h.id)).toEqual(["H1", "H2"]);
  });

  it("Ngân sách 6.800.000: khaThi false, toiThieuVND 6.900.000, các danh sách rỗng", () => {
    const req = { ...baseRequest, ngansachTongVND: 6_800_000, tranh: [] };
    const res = locUngVienTheoNganSach(req, { transports, hotels });

    expect(res.khaThi).toBe(false);
    expect(res.toiThieuVND).toBe(6_900_000);
    expect(res.phuongTienDi).toEqual([]);
    expect(res.phuongTienVe).toEqual([]);
    expect(res.khachSan).toEqual([]);
  });

  it("Tránh 'sang' (loại A vì khởi hành sớm và D vì đến sớm), ngân sách 8.100.000: phuongTienDi [B]; phuongTienVe [C]; khachSan [H2]", () => {
    const req = { ...baseRequest, ngansachTongVND: 8_100_000, tranh: ["sang"] as any };
    const res = locUngVienTheoNganSach(req, { transports, hotels });

    expect(res.khaThi).toBe(true);
    expect(res.phuongTienDi.map((t) => t.id)).toEqual(["PT_B"]);
    expect(res.phuongTienVe.map((t) => t.id)).toEqual(["PT_C"]);
    expect(res.khachSan.map((h) => h.id)).toEqual(["H2"]);
  });

  it("Tránh 'dem' (loại D), ngân sách 7.500.000: phuongTienDi [A]; phuongTienVe [C]; khachSan [H2]", () => {
    const req = { ...baseRequest, ngansachTongVND: 7_500_000, tranh: ["dem"] as any };
    const res = locUngVienTheoNganSach(req, { transports, hotels });

    expect(res.khaThi).toBe(true);
    expect(res.phuongTienDi.map((t) => t.id)).toEqual(["PT_A"]);
    expect(res.phuongTienVe.map((t) => t.id)).toEqual(["PT_C"]);
    expect(res.khachSan.map((h) => h.id)).toEqual(["H2"]);
  });
});
