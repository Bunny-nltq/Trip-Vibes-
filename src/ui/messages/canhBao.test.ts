import { describe, it, expect } from "vitest";
import { DANH_SACH_MA_CANH_BAO } from "@/core/validatePlan";
import { BANG_ANH_XA_CANH_BAO, moTaCanhBao } from "./canhBao";

describe("canhBao messages", () => {
  it("mọi mã trong DANH_SACH_MA_CANH_BAO đều có thông điệp tiếng Việt khác rỗng và không chứa mã gốc", () => {
    expect(DANH_SACH_MA_CANH_BAO.length).toBeGreaterThan(0);

    for (const ma of DANH_SACH_MA_CANH_BAO) {
      const thongDiep = BANG_ANH_XA_CANH_BAO[ma];
      expect(
        thongDiep,
        `Mã cảnh báo '${ma}' chưa được định nghĩa trong BANG_ANH_XA_CANH_BAO`
      ).toBeDefined();

      expect(
        typeof thongDiep === "string" && thongDiep.trim().length > 0,
        `Thông điệp cho mã '${ma}' phải là chuỗi không rỗng`
      ).toBe(true);

      expect(
        thongDiep.includes(ma),
        `Thông điệp cho mã '${ma}' không được chứa mã gốc (thực tế: "${thongDiep}")`
      ).toBe(false);

      const moTa = moTaCanhBao(ma);
      expect(moTa).toBe(thongDiep);
      expect(moTa.includes(ma)).toBe(false);
    }
  });

  it("moTaCanhBao xử lý được mã động bo_hoat_dong_do_gio_giac_ngay_X", () => {
    const moTa = moTaCanhBao("bo_hoat_dong_do_gio_giac_ngay_1");
    expect(moTa).toBe("Đã bỏ bớt hoạt động ngày 1 vì giờ giấc");
    expect(moTa.includes("bo_hoat_dong_do_gio_giac")).toBe(false);
  });
});
