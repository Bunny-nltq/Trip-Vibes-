import { describe, it, expect } from "vitest";
import { mealTimeOrNull, hhmm2min, min2hhmm } from "./mealTimes";

// BUFFER_SAU_KHI_DEN_PHUT = 60 phút

describe("hhmm2min", () => {
  it("06:30 = 390", () => expect(hhmm2min("06:30")).toBe(390));
  it("12:00 = 720", () => expect(hhmm2min("12:00")).toBe(720));
  it("00:00 = 0", () => expect(hhmm2min("00:00")).toBe(0));
  it("23:59 = 1439", () => expect(hhmm2min("23:59")).toBe(1439));
});

describe("min2hhmm", () => {
  it("0 = 00:00", () => expect(min2hhmm(0)).toBe("00:00"));
  it("390 = 06:30", () => expect(min2hhmm(390)).toBe("06:30"));
  it("720 = 12:00", () => expect(min2hhmm(720)).toBe("12:00"));
  it("1439 = 23:59", () => expect(min2hhmm(1439)).toBe("23:59"));
});

describe("mealTimeOrNull – không có ngữ cảnh đặc biệt", () => {
  it("ngày giữa không có ràng buộc → trả giờ danh nghĩa", () => {
    const ctx = { ngay: 2, soNgay: 3 };
    expect(mealTimeOrNull("12:00", ctx)).toBe("12:00");
    expect(mealTimeOrNull("18:30", ctx)).toBe("18:30");
    expect(mealTimeOrNull("09:00", ctx)).toBe("09:00");
  });
});

describe("mealTimeOrNull – ngày 1, ràng buộc giờ đến", () => {
  /**
   * Chuyến đi: khởi hành 06:30, 85 phút → đến 07:55 = 475 phút
   * BUFFER = 60 → earliest = 535 phút = 08:55
   */
  const gioDenNgay1Phut = hhmm2min("06:30") + 85; // 475

  it("bữa cafe 09:00 (540 > 535) → hợp lệ", () => {
    const ctx = { ngay: 1, soNgay: 3, gioDenNgay1Phut };
    expect(mealTimeOrNull("09:00", ctx)).toBe("09:00");
  });

  it("bữa cafe 08:30 (510 <= 535) → null", () => {
    const ctx = { ngay: 1, soNgay: 3, gioDenNgay1Phut };
    expect(mealTimeOrNull("08:30", ctx)).toBeNull();
  });

  it("bữa trưa 12:00 → hợp lệ", () => {
    const ctx = { ngay: 1, soNgay: 3, gioDenNgay1Phut };
    expect(mealTimeOrNull("12:00", ctx)).toBe("12:00");
  });

  it("đúng ngưỡng earliest (08:55 → 535 phút, đúng bằng earliest) → null", () => {
    // earliest = 475 + 60 = 535 = 08:55
    // <= 535 → null
    const ctx = { ngay: 1, soNgay: 3, gioDenNgay1Phut };
    expect(mealTimeOrNull("08:55", ctx)).toBeNull();
  });

  it("1 phút sau earliest (08:56 → 536) → hợp lệ", () => {
    const ctx = { ngay: 1, soNgay: 3, gioDenNgay1Phut };
    expect(mealTimeOrNull("08:56", ctx)).toBe("08:56");
  });
});

describe("mealTimeOrNull – ngày cuối, ràng buộc giờ khởi hành về", () => {
  /**
   * Chiều về: khởi hành 18:00
   */
  const gioKhoiHanhVe = "18:00";

  it("bữa tối 18:30 (>= 18:00) → null", () => {
    const ctx = { ngay: 3, soNgay: 3, gioKhoiHanhVe };
    expect(mealTimeOrNull("18:30", ctx)).toBeNull();
  });

  it("bữa tối đúng 18:00 (>= 18:00) → null", () => {
    const ctx = { ngay: 3, soNgay: 3, gioKhoiHanhVe };
    expect(mealTimeOrNull("18:00", ctx)).toBeNull();
  });

  it("bữa trưa 12:00 (< 18:00) → hợp lệ", () => {
    const ctx = { ngay: 3, soNgay: 3, gioKhoiHanhVe };
    expect(mealTimeOrNull("12:00", ctx)).toBe("12:00");
  });

  it("bữa tối 17:59 (< 18:00) → hợp lệ", () => {
    const ctx = { ngay: 3, soNgay: 3, gioKhoiHanhVe };
    expect(mealTimeOrNull("17:59", ctx)).toBe("17:59");
  });
});

describe("mealTimeOrNull – chuyến 1 ngày (ngày 1 cũng là ngày cuối)", () => {
  const gioDenNgay1Phut = hhmm2min("06:30") + 85; // 475
  const gioKhoiHanhVe = "18:00";

  it("cafe 09:00 → hợp lệ (sau earliest 535, trước 18:00)", () => {
    const ctx = { ngay: 1, soNgay: 1, gioDenNgay1Phut, gioKhoiHanhVe };
    expect(mealTimeOrNull("09:00", ctx)).toBe("09:00");
  });

  it("bữa tối 18:30 → null (sau giờ về)", () => {
    const ctx = { ngay: 1, soNgay: 1, gioDenNgay1Phut, gioKhoiHanhVe };
    expect(mealTimeOrNull("18:30", ctx)).toBeNull();
  });

  it("cafe 08:00 → null (trước earliest)", () => {
    const ctx = { ngay: 1, soNgay: 1, gioDenNgay1Phut, gioKhoiHanhVe };
    expect(mealTimeOrNull("08:00", ctx)).toBeNull();
  });
});
