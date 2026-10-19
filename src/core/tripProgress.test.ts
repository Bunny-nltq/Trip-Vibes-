import { describe, it, expect } from "vitest";
import { gomDiaDiemTheoNgay, tinhTienDo } from "./tripProgress";
import type { Plan } from "@/contracts";

/**
 * Fixture A theo quy định đề bài:
 * - Ngày 1: Bãi biển Mỹ Khê (act-my-khe)
 * - Ngày 2: Ngũ Hành Sơn (act-ngu-hanh-son), Phố cổ Hội An (act-hoi-an)
 * - Ngày 3: Bà Nà (act-ba-na)
 * - Các bữa ăn đều null
 * Tổng cộng: 4 địa điểm.
 */
function createFixtureAPlan(): Plan {
  return {
    schemaVersion: 6,
    request: {
      schemaVersion: 6,
      diemDi: "TP.HCM",
      diemDen: "Đà Nẵng",
      soNguoi: 2,
      soNgay: 3,
      ngansachTongVND: 10_000_000,
      sothich: [],
      tranh: [],
      ghiChu: [],
      thieu: [],
      cauHoiLamRo: [],
      canhBao: [],
    },
    items: [
      // Ngày 1
      {
        ngay: 1,
        gio: "06:30",
        hangMuc: "Di chuyển",
        noiDung: "Di chuyển chiều đi: Máy bay TP.HCM → Đà Nẵng",
        soLuong: 2,
        donGia: 980_000,
        thanhTien: 1_960_000,
        refId: "T_DI",
      },
      {
        ngay: 1,
        gio: "14:00",
        hangMuc: "Chỗ ở",
        noiDung: "Lưu trú: Khách sạn H1 (2 đêm, 1 phòng)",
        soLuong: 2,
        donGia: 1_100_000,
        thanhTien: 2_200_000,
        refId: "H1",
      },
      {
        ngay: 1,
        gio: "15:30",
        hangMuc: "Vui chơi",
        noiDung: "Bãi biển Mỹ Khê",
        soLuong: 2,
        donGia: 0,
        thanhTien: 0,
        refId: "act-my-khe",
      },
      // Ngày 2
      {
        ngay: 2,
        gio: "08:30",
        hangMuc: "Vui chơi",
        noiDung: "Ngũ Hành Sơn",
        soLuong: 2,
        donGia: 40_000,
        thanhTien: 80_000,
        refId: "act-ngu-hanh-son",
      },
      {
        ngay: 2,
        gio: "15:00",
        hangMuc: "Vui chơi",
        noiDung: "Phố cổ Hội An",
        soLuong: 2,
        donGia: 120_000,
        thanhTien: 240_000,
        refId: "act-hoi-an",
      },
      // Ngày 3
      {
        ngay: 3,
        gio: "08:30",
        hangMuc: "Vui chơi",
        noiDung: "Bà Nà",
        soLuong: 2,
        donGia: 650_000,
        thanhTien: 1_300_000,
        refId: "act-ba-na",
      },
      {
        ngay: 3,
        gio: "18:00",
        hangMuc: "Di chuyển",
        noiDung: "Di chuyển chiều về: Máy bay Đà Nẵng → TP.HCM",
        soLuong: 2,
        donGia: 980_000,
        thanhTien: 1_960_000,
        refId: "T_VE",
      },
    ],
    tongKet: {
      tongVND: 7_740_000,
      conLaiVND: 2_260_000,
      phanTramDaDung: 77.4,
      theoHangMuc: {
        "Di chuyển": 3_920_000,
        "Chỗ ở": 2_200_000,
        "Ăn uống": 0,
        "Vui chơi": 1_620_000,
      },
      tongThoiGianDiChuyenPhut: 170,
      trangThaiNganSach: "trong",
    },
    canhBao: [],
  };
}

describe("src/core/tripProgress.ts", () => {
  it("gomDiaDiemTheoNgay: trích xuất đúng 4 địa điểm theo từng ngày cho Fixture A", () => {
    const plan = createFixtureAPlan();
    const theoNgay = gomDiaDiemTheoNgay(plan);

    expect(Object.keys(theoNgay)).toHaveLength(3);
    expect(theoNgay[1]).toHaveLength(1);
    expect(theoNgay[1][0].id).toBe("act-my-khe");
    expect(theoNgay[1][0].ten).toBe("Bãi biển Mỹ Khê");

    expect(theoNgay[2]).toHaveLength(2);
    expect(theoNgay[2][0].id).toBe("act-ngu-hanh-son");
    expect(theoNgay[2][1].id).toBe("act-hoi-an");

    expect(theoNgay[3]).toHaveLength(1);
    expect(theoNgay[3][0].id).toBe("act-ba-na");
  });

  describe("tinhTienDo với Fixture A (4 địa điểm)", () => {
    const plan = createFixtureAPlan();
    const diaDiem = gomDiaDiemTheoNgay(plan);

    it("Không tick: daDen 0, tong 4, phanTram 0", () => {
      const res = tinhTienDo(diaDiem, []);
      expect(res).toEqual({ daDen: 0, tong: 4, phanTram: 0 });
    });

    it("Tick 2 trên 4: daDen 2, tong 4, phanTram 50", () => {
      const res = tinhTienDo(diaDiem, ["act-my-khe", "act-hoi-an"]);
      expect(res).toEqual({ daDen: 2, tong: 4, phanTram: 50 });
    });

    it("Tick id không tồn tại: bỏ qua id lạ, vẫn chỉ đếm id hợp lệ", () => {
      // 2 id hợp lệ + 2 id không tồn tại
      const res = tinhTienDo(diaDiem, [
        "act-my-khe",
        "act-ngu-hanh-son",
        "id-la-1",
        "id-la-2",
      ]);
      expect(res).toEqual({ daDen: 2, tong: 4, phanTram: 50 });

      // Chỉ tick id không tồn tại
      const resRong = tinhTienDo(diaDiem, ["id-khong-ton-tai"]);
      expect(resRong).toEqual({ daDen: 0, tong: 4, phanTram: 0 });
    });

    it("Tick đủ 4: daDen 4, tong 4, phanTram 100", () => {
      const res = tinhTienDo(diaDiem, [
        "act-my-khe",
        "act-ngu-hanh-son",
        "act-hoi-an",
        "act-ba-na",
      ]);
      expect(res).toEqual({ daDen: 4, tong: 4, phanTram: 100 });
    });

    it("Hỗ trợ đối tượng Record<string, boolean> và Set<string>", () => {
      // Dùng Record<string, boolean>
      const resRecord = tinhTienDo(diaDiem, {
        "act-my-khe": true,
        "act-ba-na": true,
        "act-hoi-an": false,
      });
      expect(resRecord).toEqual({ daDen: 2, tong: 4, phanTram: 50 });

      // Dùng Set<string>
      const resSet = tinhTienDo(
        diaDiem,
        new Set(["act-my-khe", "act-ngu-hanh-son", "act-hoi-an", "act-ba-na"])
      );
      expect(resSet).toEqual({ daDen: 4, tong: 4, phanTram: 100 });
    });
  });
});
