import { describe, it, expect } from "vitest";
import { nhanNguonDuLieu } from "./nhanNguon";

describe("nhanNguonDuLieu", () => {
  it('snapshot, ngay "2026-10-20T04:28:08Z" -> "Dữ liệu đã lưu ngày 20/10/2026"', () => {
    expect(
      nhanNguonDuLieu({
        dataSourceUsed: "snapshot",
        ngay: "2026-10-20T04:28:08Z",
      })
    ).toBe("Dữ liệu đã lưu ngày 20/10/2026");
  });

  it('live, ngay "2026-10-20T04:28:08Z" -> "Lấy mới từ OpenStreetMap ngày 20/10/2026"', () => {
    expect(
      nhanNguonDuLieu({
        dataSourceUsed: "live",
        ngay: "2026-10-20T04:28:08Z",
      })
    ).toBe("Lấy mới từ OpenStreetMap ngày 20/10/2026");
  });

  it('cache, tuoiGio 0,5 -> "Dữ liệu lưu tạm (0,5 giờ trước)"', () => {
    // Thử với số 0.5
    expect(
      nhanNguonDuLieu({
        dataSourceUsed: "cache",
        tuoiGio: 0.5,
      })
    ).toBe("Dữ liệu lưu tạm (0,5 giờ trước)");

    // Thử với chuỗi "0,5"
    expect(
      nhanNguonDuLieu({
        dataSourceUsed: "cache",
        tuoiGio: "0,5",
      })
    ).toBe("Dữ liệu lưu tạm (0,5 giờ trước)");
  });

  it('cache, tuoiGio 26 -> "Dữ liệu lưu tạm (26 giờ trước)"', () => {
    expect(
      nhanNguonDuLieu({
        dataSourceUsed: "cache",
        tuoiGio: 26,
      })
    ).toBe("Dữ liệu lưu tạm (26 giờ trước)");
  });

  it('mock -> "DỮ LIỆU MẪU"', () => {
    expect(
      nhanNguonDuLieu({
        dataSourceUsed: "mock",
      })
    ).toBe("DỮ LIỆU MẪU");
  });

  it('dataSourceUsed rỗng hoặc lạ -> "Không rõ nguồn dữ liệu"', () => {
    expect(nhanNguonDuLieu({ dataSourceUsed: "" })).toBe("Không rõ nguồn dữ liệu");
    expect(nhanNguonDuLieu({ dataSourceUsed: "unknown" })).toBe("Không rõ nguồn dữ liệu");
    expect(nhanNguonDuLieu({ dataSourceUsed: "random_val" })).toBe("Không rõ nguồn dữ liệu");
    expect(nhanNguonDuLieu(null)).toBe("Không rõ nguồn dữ liệu");
    expect(nhanNguonDuLieu(undefined)).toBe("Không rõ nguồn dữ liệu");
  });
});
