import { describe, it, expect } from "vitest";
import {
  uocLuongPhuongTien,
  cacLoaiPhuongTienUocLuong,
} from "./uocLuongPhuongTien";
import type { DiemDen } from "@/contracts";

describe("uocLuongPhuongTien", () => {
  it("khoangCach = 600: xe_khach {1080 phút, 600.000 đ}", () => {
    const res = uocLuongPhuongTien(600, "xe_khach");
    expect(res.thoiLuongPhut).toBe(1080);
    expect(res.giaNguoi).toBe(600_000);
    expect(res.doTinCay).toBe("uoc_tinh");
  });

  it("khoangCach = 600: tau {982 phút, 600.000 đ}", () => {
    const res = uocLuongPhuongTien(600, "tau");
    expect(res.thoiLuongPhut).toBe(982);
    expect(res.giaNguoi).toBe(600_000);
    expect(res.doTinCay).toBe("uoc_tinh");
  });

  it("khoangCach = 600: may_bay {138 phút, 1.260.000 đ}", () => {
    const res = uocLuongPhuongTien(600, "may_bay");
    expect(res.thoiLuongPhut).toBe(138);
    expect(res.giaNguoi).toBe(1_260_000);
    expect(res.doTinCay).toBe("uoc_tinh");
  });

  it("khoangCach = 1000: xe_khach {1800 phút, 1.000.000 đ}; tau {1636 phút, 1.000.000 đ}", () => {
    const resXe = uocLuongPhuongTien(1000, "xe_khach");
    expect(resXe.thoiLuongPhut).toBe(1800);
    expect(resXe.giaNguoi).toBe(1_000_000);

    const resTau = uocLuongPhuongTien(1000, "tau");
    expect(resTau.thoiLuongPhut).toBe(1636);
    expect(resTau.giaNguoi).toBe(1_000_000);
  });
});

describe("cacLoaiPhuongTienUocLuong", () => {
  const hcm: DiemDen = {
    ten: "TP.HCM",
    quocGia: "Việt Nam",
    maQuocGia: "VN",
    toaDo: { lat: 10.7769, lng: 106.7009 },
    tienTe: "VND",
    nguon: "nominatim",
    ngayLay: "2026-10-19T00:00:00.000Z",
  };

  const daNang: DiemDen = {
    ten: "Đà Nẵng",
    quocGia: "Việt Nam",
    maQuocGia: "VN",
    toaDo: { lat: 16.0544, lng: 108.2022 },
    tienTe: "VND",
    nguon: "nominatim",
    ngayLay: "2026-10-19T00:00:00.000Z",
  };

  const bangkok: DiemDen = {
    ten: "Bangkok",
    quocGia: "Thái Lan",
    maQuocGia: "TH",
    toaDo: { lat: 13.7563, lng: 100.5018 },
    tienTe: "THB",
    nguon: "nominatim",
    ngayLay: "2026-10-19T00:00:00.000Z",
  };

  it("TP.HCM tới Đà Nẵng gồm máy bay, tàu, xe khách", () => {
    const res = cacLoaiPhuongTienUocLuong(hcm, daNang);
    expect(res).toContain("may_bay");
    expect(res).toContain("tau");
    expect(res).toContain("xe_khach");
    expect(res.length).toBe(3);
  });

  it("TP.HCM tới Bangkok chỉ máy bay", () => {
    const res = cacLoaiPhuongTienUocLuong(hcm, bangkok);
    expect(res).toEqual(["may_bay"]);
  });

  it("hai điểm cách 10 km trả rỗng", () => {
    const diemGan: DiemDen = {
      ten: "Thủ Đức",
      quocGia: "Việt Nam",
      maQuocGia: "VN",
      // Cách TP.HCM ~10 km (10.82, 106.75)
      toaDo: { lat: 10.82, lng: 106.75 },
      tienTe: "VND",
      nguon: "nominatim",
      ngayLay: "2026-10-19T00:00:00.000Z",
    };
    const res = cacLoaiPhuongTienUocLuong(hcm, diemGan);
    expect(res).toEqual([]);
  });
});
