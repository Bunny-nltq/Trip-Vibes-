import { describe, it, expect } from "vitest";
import { quyDoiVND } from "./quyDoiTien";

describe("quyDoiVND", () => {
  it("100 với tỷ giá 25.400 = 2.540.000", () => {
    expect(quyDoiVND(100, 25_400)).toBe(2_540_000);
  });

  it("99,5 với 25.400 = 2.527.300", () => {
    expect(quyDoiVND(99.5, 25_400)).toBe(2_527_300);
  });

  it("1.000 với 780 = 780.000", () => {
    expect(quyDoiVND(1_000, 780)).toBe(780_000);
  });
});
