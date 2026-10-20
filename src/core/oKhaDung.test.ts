import { describe, it, expect } from "vitest";
import { soOKhaDung } from "./oKhaDung";

describe("soOKhaDung", () => {
  it("3 ngày, đến 475 (07:55), về 1080 (18:00) => 4 ô", () => {
    expect(soOKhaDung(3, 475, 1080)).toBe(4);
  });

  // Bước 16: Người dùng đổi từ 3 thành 4 vì ngày 1 nay có ô chiều 15:30 (gioDen 619 + 60 = 679 <= 930)
  it("3 ngày, đến 619 (10:19), về 1080 (18:00) => 4 ô", () => {
    expect(soOKhaDung(3, 619, 1080)).toBe(4);
  });

  // Bước 16: Người dùng đổi từ 2 thành 3 vì ngày 1 nay có ô chiều 15:30
  it("3 ngày, đến 619 (10:19), về 660 (11:00) => 3 ô", () => {
    expect(soOKhaDung(3, 619, 660)).toBe(3);
  });

  it("3 ngày, đến 475 (07:55), về 660 (11:00) => 3 ô", () => {
    expect(soOKhaDung(3, 475, 660)).toBe(3);
  });

  it("2 ngày, đến 475 (07:55), về 1080 (18:00) => 2 ô", () => {
    expect(soOKhaDung(2, 475, 1080)).toBe(2);
  });

  it("4 ngày, đến 475 (07:55), về 1080 (18:00) => 6 ô", () => {
    expect(soOKhaDung(4, 475, 1080)).toBe(6);
  });

  it("3 ngày, đến 1087 (18:07), về 960 (16:00) => 3 ô", () => {
    expect(soOKhaDung(3, 1087, 960)).toBe(3);
  });

  it("3 ngày, đến 900 (15:00), về 1080 (18:00) => 3 ô", () => {
    expect(soOKhaDung(3, 900, 1080)).toBe(3);
  });

  it("3 ngày, đến 1667 (03:47 ngày hôm sau), về 960 (16:00) => 3 ô", () => {
    expect(soOKhaDung(3, 1667, 960)).toBe(3);
  });
});
