import { describe, it, expect } from "vitest";
import { lapKeHoachTuDong } from "./lapKeHoachTuDong";
import type { TripRequest, Transport, Hotel, Activity } from "@/contracts";

describe("lapKeHoachTuDong (Quy tắc tự động)", () => {
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

  const hotels: Hotel[] = [
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
  ] as any;

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

  it("Ca 1: Không điều cần tránh: PT_A + PT_D + H2; Di chuyển 3.540.000; Chỗ ở 1.560.000; Ăn uống 1.800.000; tongVND 6.900.000", () => {
    const ungVien = { transports, hotels, activities: [] };
    const res = lapKeHoachTuDong(baseRequest, ungVien, 3);

    expect(res.status).toBe("ok");
    if (res.status === "ok") {
      expect(res.selection.transportDiId).toBe("PT_A");
      expect(res.selection.transportVeId).toBe("PT_D");
      expect(res.selection.hotelId).toBe("H2");
      expect(res.theoHangMuc.diChuyen).toBe(3_540_000);
      expect(res.theoHangMuc.choO).toBe(1_560_000);
      expect(res.theoHangMuc.anUong).toBe(1_800_000);
      expect(res.tongVND).toBe(6_900_000);
    }
  });

  it("Ca 2: Tránh 'dem' (không đi đêm): PT_A + PT_C + H2; Di chuyển 3.920.000; tongVND 7.280.000", () => {
    const req: TripRequest = { ...baseRequest, tranh: ["dem"] as any };
    const ungVien = { transports, hotels, activities: [] };
    const res = lapKeHoachTuDong(req, ungVien, 3);

    expect(res.status).toBe("ok");
    if (res.status === "ok") {
      expect(res.selection.transportDiId).toBe("PT_A");
      expect(res.selection.transportVeId).toBe("PT_C");
      expect(res.selection.hotelId).toBe("H2");
      expect(res.theoHangMuc.diChuyen).toBe(3_920_000);
      expect(res.tongVND).toBe(7_280_000);
    }
  });

  it("Ca 3: Tránh 'sang' (không dậy sớm): loại PT_A (khởi hành sớm) và PT_D (đến sớm); PT_B + PT_C + H2; Di chuyển 4.660.000; tongVND 8.020.000", () => {
    const req: TripRequest = { ...baseRequest, tranh: ["sang"] as any };
    const ungVien = { transports, hotels, activities: [] };
    const res = lapKeHoachTuDong(req, ungVien, 3);

    expect(res.status).toBe("ok");
    if (res.status === "ok") {
      expect(res.selection.transportDiId).toBe("PT_B");
      expect(res.selection.transportVeId).toBe("PT_C");
      expect(res.selection.hotelId).toBe("H2");
      expect(res.theoHangMuc.diChuyen).toBe(4_660_000);
      expect(res.tongVND).toBe(8_020_000);
    }
  });

  it("Ca 4: Tránh cả 'sang' và 'dem': giống ca trước, tongVND 8.020.000", () => {
    const req: TripRequest = { ...baseRequest, tranh: ["sang", "dem"] as any };
    const ungVien = { transports, hotels, activities: [] };
    const res = lapKeHoachTuDong(req, ungVien, 3);

    expect(res.status).toBe("ok");
    if (res.status === "ok") {
      expect(res.selection.transportDiId).toBe("PT_B");
      expect(res.selection.transportVeId).toBe("PT_C");
      expect(res.selection.hotelId).toBe("H2");
      expect(res.theoHangMuc.diChuyen).toBe(4_660_000);
      expect(res.tongVND).toBe(8_020_000);
    }
  });

  it("Ca 5: Ngân sách 6.800.000 đ, không tránh gì: khong_the_dat_ngan_sach, toiThieuVND 6.900.000", () => {
    const req: TripRequest = { ...baseRequest, ngansachTongVND: 6_800_000, tranh: [] };
    const ungVien = { transports, hotels, activities: [] };
    const res = lapKeHoachTuDong(req, ungVien, 3);

    expect(res.status).toBe("khong_the_dat_ngan_sach");
    expect(res.toiThieuVND).toBe(6_900_000);
  });

  it("Ca 6: Kho hoạt động có A1 (0 đ, 120 phút, nhãn bien) và A2 (40.000 đ/người, 150 phút, nhãn thien_nhien), sở thích rỗng, ngân sách 10.000.000, không tránh gì: ngày 1 [A1], ngày 2 [A2], còn 2 ô trống (cảnh báo o_trong_do_rang_buoc); Vui chơi 80.000; tongVND 6.980.000", () => {
    const activities: Activity[] = [
      {
        id: "A1",
        name: "Hoạt động A1",
        pricePerPerson: 0,
        durationMinutes: 120,
        tags: ["bien"],
        source: "test",
      },
      {
        id: "A2",
        name: "Hoạt động A2",
        pricePerPerson: 40_000,
        durationMinutes: 150,
        tags: ["thien_nhien"],
        source: "test",
      },
    ] as any;
    const ungVien = { transports, hotels, activities };
    const res = lapKeHoachTuDong(baseRequest, ungVien, 3);

    expect(res.status).toBe("ok");
    if (res.status === "ok") {
      expect(res.selection.hoatDongTheoNgay[0]).toEqual(["A1"]);
      expect(res.selection.hoatDongTheoNgay[1]).toEqual(["A2"]);
      expect(res.selection.hoatDongTheoNgay[2]).toEqual([]);
      expect(res.canhBao).toContain("o_trong_do_rang_buoc");
      expect(res.theoHangMuc.vuiChoi).toBe(80_000);
      expect(res.tongVND).toBe(6_980_000);
    }
  });
});
