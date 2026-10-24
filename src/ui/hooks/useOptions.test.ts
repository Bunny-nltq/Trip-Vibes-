import { describe, it, expect } from "vitest";
import { chuanHoaPhuongTien } from "./useOptions";

describe("chuanHoaPhuongTien", () => {
  const base = {
    id: "est_di_may_bay_0",
    huong: "di",
    type: "PLANE",
    provider: "Ước tính theo quãng đường 609 km",
    departureTime: "08:00",
    durationMinutes: 140,
    pricePerPerson: 1269790,
    tongTienNhom: 2539580,
    giaLaUocTinh: true,
  };

  it("đổi cờ dạng đối tượng của core thành mảng mã, không ném lỗi khi gọi includes", () => {
    const r = chuanHoaPhuongTien({
      ...base,
      flags: { gioDen: "10:20", khoiHanhSom: true, diDem: false, denSom: false, diChuyenLau: false },
    });
    expect(Array.isArray(r.flags)).toBe(true);
    expect(r.flags).toContain("KHOI_HANH_SOM");
    expect(r.flags).toContain("GIA_UOC_TINH");
    expect(r.flags.includes("XE_DEM")).toBe(false);
  });

  it("đi đêm thành XE_DEM", () => {
    const r = chuanHoaPhuongTien({ ...base, flags: { diDem: true } });
    expect(r.flags).toContain("XE_DEM");
  });

  it("lấy carrier từ provider, giờ đến từ cờ khi thiếu arrivalTime", () => {
    const r = chuanHoaPhuongTien({ ...base, flags: { gioDen: "10:20" } });
    expect(r.carrier).toBe(base.provider);
    expect(r.arrivalTime).toBe("10:20");
    expect(r.code).toBe("");
  });

  it("giữ nguyên mảng cờ nếu máy chủ đã trả dạng mảng", () => {
    const r = chuanHoaPhuongTien({ ...base, giaLaUocTinh: false, flags: ["XE_DEM"] });
    expect(r.flags).toEqual(["XE_DEM"]);
  });

  it("không có flags vẫn trả mảng", () => {
    const r = chuanHoaPhuongTien({ ...base, giaLaUocTinh: false });
    expect(r.flags).toEqual([]);
  });
});
