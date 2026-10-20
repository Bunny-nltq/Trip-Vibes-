import { describe, it, expect } from "vitest";
import { lapOTrong } from "./lapOTrong";
import { buildPlan } from "./buildPlan";
import type { TripRequest, Selection, HoatDong, Transport, Hotel } from "@/contracts";

describe("lapOTrong - Fixture A", () => {
  const diemDen = {
    ten: "Đà Nẵng",
    quocGia: "Việt Nam",
    maQuocGia: "VN",
    toaDo: { lat: 16.0544, lng: 108.2022 },
    tienTe: "VND",
    nguon: "nominatim" as const,
    ngayLay: "2026-10-20",
  };

  const transports: Transport[] = [
    {
      id: "T_DI",
      name: "Vé đi",
      provider: "Vietjet",
      origin: "TP.HCM",
      destination: "Đà Nẵng",
      type: "PLANE",
      huong: "di",
      departureTime: "06:30",
      pricePerPerson: 980_000,
      priceVND: 980_000,
      durationMinutes: 85, // đến lúc 07:55 (475p)
    } as any,
    {
      id: "T_VE",
      name: "Vé về",
      provider: "Vietjet",
      origin: "Đà Nẵng",
      destination: "TP.HCM",
      type: "PLANE",
      huong: "ve",
      departureTime: "18:00", // 1080p
      pricePerPerson: 980_000,
      priceVND: 980_000,
      durationMinutes: 85,
    } as any,
  ];

  const hotels: Hotel[] = [
    {
      id: "H1",
      name: "Khách sạn A",
      stars: 3,
      pricePerNight: 1_100_000,
      district: "Trung tâm",
    } as any,
  ];

  const ungVien: HoatDong[] = [
    {
      id: "A1",
      ten: "Hoạt động A1",
      osmId: "1",
      khuVuc: "Biển",
      diaChi: null,
      toaDo: { lat: 16.0, lng: 108.0 },
      loai: "attraction",
      gioMoCua: null,
      soSao: null,
      giaUocTinhNguoi: 0,
      giaVeNguoi: 0,
      thoiLuongPhut: 120,
      nhan: ["bien"],
      dongNguoi: false,
      diBoNhieu: false,
      nguon: "osm",
      ngayLay: "2026-10-20",
      doTinCay: "tham_khao",
      giaLaUocTinh: false,
    },
    {
      id: "A2",
      ten: "Hoạt động A2",
      osmId: "2",
      khuVuc: "Núi",
      diaChi: null,
      toaDo: { lat: 16.0, lng: 108.0 },
      loai: "attraction",
      gioMoCua: null,
      soSao: null,
      giaUocTinhNguoi: 40_000,
      giaVeNguoi: 40_000,
      thoiLuongPhut: 150,
      nhan: ["thien_nhien", "van_hoa_lich_su"],
      dongNguoi: false,
      diBoNhieu: false,
      nguon: "osm",
      ngayLay: "2026-10-20",
      doTinCay: "tham_khao",
      giaLaUocTinh: false,
    },
    {
      id: "A3",
      ten: "Hoạt động A3",
      osmId: "3",
      khuVuc: "Phố cổ",
      diaChi: null,
      toaDo: { lat: 16.0, lng: 108.0 },
      loai: "attraction",
      gioMoCua: null,
      soSao: null,
      giaUocTinhNguoi: 120_000,
      giaVeNguoi: 120_000,
      thoiLuongPhut: 240,
      nhan: ["van_hoa_lich_su", "am_thuc"],
      dongNguoi: false,
      diBoNhieu: false,
      nguon: "osm",
      ngayLay: "2026-10-20",
      doTinCay: "tham_khao",
      giaLaUocTinh: false,
    },
    {
      id: "A4",
      ten: "Hoạt động A4",
      osmId: "4",
      khuVuc: "Công viên",
      diaChi: null,
      toaDo: { lat: 16.0, lng: 108.0 },
      loai: "attraction",
      gioMoCua: null,
      soSao: null,
      giaUocTinhNguoi: 650_000,
      giaVeNguoi: 650_000,
      thoiLuongPhut: 360,
      nhan: ["giai_tri_vui_choi"],
      dongNguoi: false,
      diBoNhieu: false,
      nguon: "osm",
      ngayLay: "2026-10-20",
      doTinCay: "tham_khao",
      giaLaUocTinh: false,
    },
    {
      id: "A5",
      ten: "Hoạt động A5",
      osmId: "5",
      khuVuc: "Cầu",
      diaChi: null,
      toaDo: { lat: 16.0, lng: 108.0 },
      loai: "attraction",
      gioMoCua: null,
      soSao: null,
      giaUocTinhNguoi: 60_000,
      giaVeNguoi: 60_000,
      thoiLuongPhut: 90,
      nhan: ["check_in_chup_anh"],
      dongNguoi: false,
      diBoNhieu: false,
      nguon: "osm",
      ngayLay: "2026-10-20",
      doTinCay: "tham_khao",
      giaLaUocTinh: false,
    },
  ];

  function taoRequest(ngansachTongVND = 10_000_000, sothich: any[] = []): TripRequest {
    return {
      schemaVersion: 7,
      diemDi: "TP.HCM",
      diemDen,
      soNgay: 3,
      soNguoi: 2,
      ngansachTongVND,
      sothich,
      tranh: [],
      ghiChu: [],
      thieu: [],
      cauHoiLamRo: [],
      canhBao: [],
    };
  }

  const selectionBanDau: Selection = {
    transportDiId: "T_DI",
    transportVeId: "T_VE",
    hotelId: "H1",
    hoatDongTheoNgay: [["A1"], ["A2"], []],
    buaAnTheoNgay: [
      { trua: null, toi: null, cafe: null },
      { trua: null, toi: null, cafe: null },
      { trua: null, toi: null, cafe: null },
    ],
  };

  it("soThich []: kết quả ngày 2 [A2, A5], ngày 3 [A3]; Vui chơi 440.000; tongVND 8.360.000; conLaiVND 1.640.000", () => {
    const req = taoRequest(10_000_000, []);
    const build1 = buildPlan(req, selectionBanDau, {
      transports,
      hotels,
      activities: [],
      hoatDongs: ungVien,
    });
    if (!build1.ok) {
      console.log("BUILD1 LOI:", build1.loi);
    }
    expect(build1.ok).toBe(true);
    if (!build1.ok) return;

    expect(build1.plan.tongKet.tongVND).toBe(8_000_000);
    expect(build1.plan.tongKet.conLaiVND).toBe(2_000_000);

    const res = lapOTrong(selectionBanDau, build1.plan, ungVien, req);
    expect(res.daLap).toBe(true);
    expect(res.selection.hoatDongTheoNgay[1]).toEqual(["A2", "A5"]);
    expect(res.selection.hoatDongTheoNgay[2]).toEqual(["A3"]);

    const build2 = buildPlan(req, res.selection, {
      transports,
      hotels,
      activities: [],
      hoatDongs: ungVien,
    });
    expect(build2.ok).toBe(true);
    if (!build2.ok) return;

    const tongVuiChoi = build2.plan.items
      .filter((it) => it.hangMuc === "Vui chơi")
      .reduce((s, it) => s + it.thanhTien, 0);

    expect(tongVuiChoi).toBe(440_000);
    expect(build2.plan.tongKet.tongVND).toBe(8_360_000);
    expect(build2.plan.tongKet.conLaiVND).toBe(1_640_000);
  });

  it("soThich [van_hoa_lich_su, am_thuc]: kết quả ngày 2 [A2, A3], ngày 3 [A5]; tongVND 8.360.000", () => {
    const req = taoRequest(10_000_000, ["van_hoa_lich_su", "am_thuc"]);
    const build1 = buildPlan(req, selectionBanDau, {
      transports,
      hotels,
      activities: [],
      hoatDongs: ungVien,
    });
    expect(build1.ok).toBe(true);
    if (!build1.ok) return;

    const res = lapOTrong(selectionBanDau, build1.plan, ungVien, req);
    expect(res.daLap).toBe(true);
    expect(res.selection.hoatDongTheoNgay[1]).toEqual(["A2", "A3"]);
    expect(res.selection.hoatDongTheoNgay[2]).toEqual(["A5"]);

    const build2 = buildPlan(req, res.selection, {
      transports,
      hotels,
      activities: [],
      hoatDongs: ungVien,
    });
    expect(build2.ok).toBe(true);
    if (!build2.ok) return;

    expect(build2.plan.tongKet.tongVND).toBe(8_360_000);
  });

  it("ngân sách 8.100.000 (còn lại 100.000): không ứng viên nào vừa, selection giữ nguyên và có cảnh báo 'o_trong_do_rang_buoc'", () => {
    const req = taoRequest(8_100_000, []);
    const build1 = buildPlan(req, selectionBanDau, {
      transports,
      hotels,
      activities: [],
      hoatDongs: ungVien,
    });
    expect(build1.ok).toBe(true);
    if (!build1.ok) return;

    expect(build1.plan.tongKet.conLaiVND).toBe(100_000);

    const res = lapOTrong(selectionBanDau, build1.plan, ungVien, req);
    expect(res.selection.hoatDongTheoNgay[1]).toEqual(["A2"]);
    expect(res.selection.hoatDongTheoNgay[2]).toEqual([]);
    expect(res.canhBao).toContain("o_trong_do_rang_buoc");
  });

  it("chiều đi đến 10:19 (619): lấp ô ngày 1 lúc 15:30: ngày 1 [A1], ngày 2 [A2, A5], ngày 3 [A3]; Vui chơi 440.000; tongVND 8.360.000; conLaiVND 1.640.000", () => {
    const transportsMuon: Transport[] = [
      {
        ...transports[0],
        departureTime: "08:19",
        durationMinutes: 120, // đến lúc 10:19 (619p)
      },
      transports[1],
    ];

    const selNgay1Trong: Selection = {
      ...selectionBanDau,
      hoatDongTheoNgay: [[], ["A2"], []],
    };

    const req = taoRequest(10_000_000, []);
    const build1 = buildPlan(req, selNgay1Trong, {
      transports: transportsMuon,
      hotels,
      activities: [],
      hoatDongs: ungVien,
    });
    expect(build1.ok).toBe(true);
    if (!build1.ok) return;

    const res = lapOTrong(selNgay1Trong, build1.plan, ungVien, req);
    expect(res.selection.hoatDongTheoNgay[0]).toEqual(["A1"]);
    expect(res.selection.hoatDongTheoNgay[1]).toEqual(["A2", "A5"]);
    expect(res.selection.hoatDongTheoNgay[2]).toEqual(["A3"]);

    const build2 = buildPlan(req, res.selection, {
      transports: transportsMuon,
      hotels,
      activities: [],
      hoatDongs: ungVien,
    });
    expect(build2.ok).toBe(true);
    if (!build2.ok) return;

    const itemNgay1 = build2.plan.items.find(
      (it) => it.hangMuc === "Vui chơi" && it.ngay === 1
    );
    expect(itemNgay1?.gio).toBe("15:30");

    const tongVuiChoi = build2.plan.items
      .filter((it) => it.hangMuc === "Vui chơi")
      .reduce((s, it) => s + it.thanhTien, 0);

    expect(tongVuiChoi).toBe(440_000);
    expect(build2.plan.tongKet.tongVND).toBe(8_360_000);
    expect(build2.plan.tongKet.conLaiVND).toBe(1_640_000);
  });

  it("chiều đi đến 15:00 (900): ngày 1 [] (không có ô); ngày 2 [A2, A1]; ngày 3 [A5]; Vui chơi 200.000; tongVND 8.120.000; conLaiVND 1.880.000", () => {
    const transportsChieu: Transport[] = [
      {
        ...transports[0],
        departureTime: "13:00",
        durationMinutes: 120, // đến lúc 15:00 (900p)
      },
      transports[1],
    ];

    const selNgay1Trong: Selection = {
      ...selectionBanDau,
      hoatDongTheoNgay: [[], ["A2"], []],
    };

    const req = taoRequest(10_000_000, []);
    const build1 = buildPlan(req, selNgay1Trong, {
      transports: transportsChieu,
      hotels,
      activities: [],
      hoatDongs: ungVien,
    });
    expect(build1.ok).toBe(true);
    if (!build1.ok) return;

    const res = lapOTrong(selNgay1Trong, build1.plan, ungVien, req);
    expect(res.selection.hoatDongTheoNgay[0]).toEqual([]);
    expect(res.selection.hoatDongTheoNgay[1]).toEqual(["A2", "A1"]);
    expect(res.selection.hoatDongTheoNgay[2]).toEqual(["A5"]);

    const build2 = buildPlan(req, res.selection, {
      transports: transportsChieu,
      hotels,
      activities: [],
      hoatDongs: ungVien,
    });
    expect(build2.ok).toBe(true);
    if (!build2.ok) return;

    const tongVuiChoi = build2.plan.items
      .filter((it) => it.hangMuc === "Vui chơi")
      .reduce((s, it) => s + it.thanhTien, 0);

    expect(tongVuiChoi).toBe(200_000);
    expect(build2.plan.tongKet.tongVND).toBe(8_120_000);
    expect(build2.plan.tongKet.conLaiVND).toBe(1_880_000);
  });
});
