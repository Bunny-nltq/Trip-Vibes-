import { describe, it, expect } from "vitest";
import {
  matchExpenseToPlan,
  normalizeVietnameseText,
  extractSignificantKeywords,
  mapPlanCategoryToExpenseCategory,
  type BillMatchingInput,
} from "./matchExpenseToPlan";
import type { Plan, PlanItem } from "@/contracts";

describe("matchExpenseToPlan - Multimodal Expense Semantic Matcher", () => {
  describe("Text normalization & keyword extraction", () => {
    it("normalizes Vietnamese text and removes accents/symbols", () => {
      expect(normalizeVietnameseText("Bánh Mì Phượng Đà Nẵng!")).toBe("banh mi phuong da nang");
      expect(normalizeVietnameseText("Cà phê Đen Đá - 25k")).toBe("ca phe den da 25k");
      expect(normalizeVietnameseText("")).toBe("");
    });

    it("extracts significant keywords and filters out common stopwords", () => {
      const keywords = extractSignificantKeywords("Nhà Hàng Quán Ăn Bếp Cuốn");
      expect(keywords).toEqual(["bep", "cuon"]);
      expect(keywords).not.toContain("nha");
      expect(keywords).not.toContain("hang");
      expect(keywords).not.toContain("quan");
    });

    it("correctly maps plan categories to expense categories", () => {
      expect(mapPlanCategoryToExpenseCategory("an_uong")).toBe("an_uong");
      expect(mapPlanCategoryToExpenseCategory("restaurant")).toBe("an_uong");
      expect(mapPlanCategoryToExpenseCategory("hoat_dong")).toBe("vui_choi");
      expect(mapPlanCategoryToExpenseCategory("museum")).toBe("vui_choi");
      expect(mapPlanCategoryToExpenseCategory("hotel")).toBe("cho_o");
      expect(mapPlanCategoryToExpenseCategory("di_chuyen")).toBe("di_chuyen");
      expect(mapPlanCategoryToExpenseCategory("other")).toBe("khac");
    });
  });

  describe("Matching logic with itinerary items", () => {
    const mockItems: PlanItem[] = [
      {
        id: "item-day1-lunch",
        ngay: 1,
        gio: "12:00",
        hangMuc: "Ăn uống",
        experienceType: "restaurant",
        noiDung: "Ăn trưa tại Bếp Cuốn Đà Nẵng",
        soLuong: 1,
        donGia: 200000,
        thanhTien: 200000,
        refId: "qa-1",
        destinationName: "Bếp Cuốn Đà Nẵng",
      },
      {
        id: "item-day1-museum",
        ngay: 1,
        gio: "14:30",
        hangMuc: "Vui chơi",
        experienceType: "museum",
        noiDung: "Tham quan Bảo tàng Điêu khắc Chăm",
        soLuong: 1,
        donGia: 60000,
        thanhTien: 60000,
        refId: "act-1",
        destinationName: "Bảo tàng Chăm",
      },
      {
        id: "item-day2-breakfast",
        ngay: 2,
        gio: "08:00",
        hangMuc: "Ăn uống",
        experienceType: "restaurant",
        noiDung: "Ăn sáng Mì Quảng Bà Mua",
        soLuong: 1,
        donGia: 90000,
        thanhTien: 90000,
        refId: "qa-2",
        destinationName: "Mì Quảng Bà Mua",
      },
      {
        id: "item-day2-dinner",
        ngay: 2,
        gio: "19:00",
        hangMuc: "Ăn uống",
        experienceType: "restaurant",
        noiDung: "Thưởng thức Hải Sản Bé Mặn",
        soLuong: 1,
        donGia: 500000,
        thanhTien: 500000,
        refId: "qa-3",
        destinationName: "Hải Sản Bé Mặn",
      },
    ];

    const mockPlan: Plan = {
      schemaVersion: 18,
      items: mockItems,
      canhBao: [],
      tongKet: {
        tongVND: 850000,
        conLaiVND: 4150000,
        phanTramDaDung: 17,
        theoHangMuc: {
          "Ăn uống": 790000,
          "Vui chơi": 60000,
          "Di chuyển": 0,
          "Chỗ ở": 0,
        },
        tongThoiGianDiChuyenPhut: 0,
        trangThaiNganSach: "trong",
      },
      request: {
        schemaVersion: 18,
        diemDi: "Hà Nội",
        diemDen: "Đà Nẵng",
        soNgay: 2,
        soNguoi: 2,
        ngansachTongVND: 5000000,
        sothich: [],
        tranh: [],
        ghiChu: [],
        thieu: [],
        cauHoiLamRo: [],
        canhBao: [],
        travelDates: {
          departureDate: "2026-06-01",
          returnDate: "2026-06-02",
        },
      },
    };

    it("returns null bestMatch if plan has no items or is null", () => {
      const res1 = matchExpenseToPlan(null, { tenCuaHang: "Bếp Cuốn" });
      expect(res1.bestMatch).toBeNull();
      expect(res1.candidates).toHaveLength(0);

      const res2 = matchExpenseToPlan({ ...mockPlan, items: [] }, { tenCuaHang: "Bếp Cuốn" });
      expect(res2.bestMatch).toBeNull();
    });

    it("accurately matches store name directly with itinerary item", () => {
      const bill: BillMatchingInput = {
        tenCuaHang: "Bếp Cuốn Đà Nẵng",
        ngay: "2026-06-01",
        hangMucGoiY: "an_uong",
        tongTienVND: 210000,
      };

      const result = matchExpenseToPlan(mockPlan, bill);
      expect(result.bestMatch).not.toBeNull();
      expect(result.bestMatch?.item.id).toBe("item-day1-lunch");
      expect(result.suggestedDay).toBe(1);
      expect(result.suggestedCategory).toBe("an_uong");
      expect(result.bestMatch?.score).toBeGreaterThanOrEqual(80);
      expect(result.bestMatch?.matchReasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining("Tên cửa hàng khớp trực tiếp"),
          expect.stringContaining("Khớp hạng mục chi tiêu"),
          expect.stringContaining("Khớp ngày 1"),
        ])
      );
    });

    it("matches Day 2 item when date and store name match Day 2", () => {
      const bill: BillMatchingInput = {
        tenCuaHang: "Quán Ăn Bà Mua",
        ngay: "2026-06-02",
        hangMucGoiY: "an_uong",
        tongTienVND: 90000,
      };

      const result = matchExpenseToPlan(mockPlan, bill);
      expect(result.bestMatch).not.toBeNull();
      expect(result.bestMatch?.item.id).toBe("item-day2-breakfast");
      expect(result.suggestedDay).toBe(2);
      expect(result.bestMatch?.matchReasons).toEqual(
        expect.arrayContaining([
          expect.stringContaining("mua"),
          expect.stringContaining("Khớp ngày 2"),
        ])
      );
    });

    it("matches via dish name in dongChiTiet if store name is generic", () => {
      const bill: BillMatchingInput = {
        tenCuaHang: "Hóa Đơn Ăn Uống",
        ngay: "2026-06-01",
        hangMucGoiY: "an_uong",
        dongChiTiet: [
          { ten: "Khay Bếp Cuốn đặc biệt", soLuong: 1, thanhTienVND: 180000 },
          { ten: "Trà chanh sả", soLuong: 2, thanhTienVND: 30000 },
        ],
        tongTienVND: 210000,
      };

      const result = matchExpenseToPlan(mockPlan, bill);
      expect(result.bestMatch).not.toBeNull();
      expect(result.bestMatch?.item.id).toBe("item-day1-lunch");
      expect(result.bestMatch?.matchReasons.some((r) => r.includes("Món trên hóa đơn"))).toBe(true);
    });

    it("gives bonus to unticked items over already ticked items", () => {
      const bill: BillMatchingInput = {
        tenCuaHang: "Hải Sản Bé Mặn",
        hangMucGoiY: "an_uong",
        tongTienVND: 500000,
      };

      // Unticked
      const resultUnticked = matchExpenseToPlan(mockPlan, bill, {});
      const scoreUnticked = resultUnticked.bestMatch?.score ?? 0;

      // Already ticked
      const resultTicked = matchExpenseToPlan(mockPlan, bill, { "item-day2-dinner": true });
      const scoreTicked = resultTicked.bestMatch?.score ?? 0;

      expect(scoreUnticked).toBeGreaterThan(scoreTicked);
    });

    it("identifies museum attraction correctly from ticket price and name", () => {
      const bill: BillMatchingInput = {
        tenCuaHang: "Bảo Tàng Điêu Khắc Chăm",
        hangMucGoiY: "vui_choi",
        tongTienVND: 60000,
        ngay: "2026-06-01",
      };

      const result = matchExpenseToPlan(mockPlan, bill);
      expect(result.bestMatch).not.toBeNull();
      expect(result.bestMatch?.item.id).toBe("item-day1-museum");
      expect(result.suggestedCategory).toBe("vui_choi");
    });
  });
});
