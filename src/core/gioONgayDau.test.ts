import { describe, it, expect } from "vitest";
import { gioOHoatDongNgayDau } from "./gioONgayDau";

describe("gioOHoatDongNgayDau", () => {
  it("475 -> 570 (kịp ô sáng 09:30)", () => {
    expect(gioOHoatDongNgayDau(475)).toBe(570);
  });

  it("510 -> 570 (510 + 60 = 570, vừa đúng ngưỡng ô sáng)", () => {
    expect(gioOHoatDongNgayDau(510)).toBe(570);
  });

  it("511 -> 930 (511 + 60 = 571 > 570, chuyển sang ô chiều 15:30)", () => {
    expect(gioOHoatDongNgayDau(511)).toBe(930);
  });

  it("619 -> 930 (10:19 đến, kịp ô chiều 15:30)", () => {
    expect(gioOHoatDongNgayDau(619)).toBe(930);
  });

  it("870 -> 930 (870 + 60 = 930, vừa đúng ngưỡng ô chiều)", () => {
    expect(gioOHoatDongNgayDau(870)).toBe(930);
  });

  it("871 -> null (871 + 60 = 931 > 930, không kịp ô nào)", () => {
    expect(gioOHoatDongNgayDau(871)).toBeNull();
  });

  it("1087 -> null (18:07 đến, không kịp ô nào)", () => {
    expect(gioOHoatDongNgayDau(1087)).toBeNull();
  });

  it("1667 -> null (chuyến đi đến vào ngày hôm sau >= 1440)", () => {
    expect(gioOHoatDongNgayDau(1667)).toBeNull();
  });
});
