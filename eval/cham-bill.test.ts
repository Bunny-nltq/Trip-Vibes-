import { describe, it, expect } from "vitest";
import { soSanhLoaiChungTu, chamKetQuaBillItem } from "./run-bill";

describe("eval/run-bill.ts - Bộ chấm hóa đơn và ca b05", () => {
  describe("Hàm chấm thuần soSanhLoaiChungTu", () => {
    it("(actual 'khac', expected null) -> khớp (true)", () => {
      expect(soSanhLoaiChungTu("khac", null)).toBe(true);
    });

    it("(actual 'hoa_don', expected 'hoa_don') -> khớp (true)", () => {
      expect(soSanhLoaiChungTu("hoa_don", "hoa_don")).toBe(true);
    });

    it("(actual 'khac', expected 'hoa_don') -> KHÔNG khớp (false)", () => {
      expect(soSanhLoaiChungTu("khac", "hoa_don")).toBe(false);
    });
  });

  describe("Chấm điểm ca b05 (thực đơn không phải hóa đơn)", () => {
    it("b05 đạt khi AI trả laChungTu: false, status: 'khong_phai_chung_tu', loaiChungTu: 'khac' và expected.loaiChungTu là null", () => {
      const extraction = {
        laChungTu: false,
        loaiChungTu: "khac",
        status: "khong_phai_chung_tu",
        tongTienVND: null,
        ngay: null,
        canhBao: [],
      };
      const expected = {
        file: "b05_thuc_don_khong_phai_hoa_don.jpg",
        laChungTu: false,
        loaiChungTu: null,
        tenCuaHangChua: null,
        ngay: null,
        tongTienVND: null,
        hangMuc: null,
        tongKhopCacDong: null,
      };

      const result = chamKetQuaBillItem("b05_thuc_don_khong_phai_hoa_don.jpg", extraction, expected);
      expect(result.isCorrect).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.dangerous).toBe(false);
    });
  });
});
