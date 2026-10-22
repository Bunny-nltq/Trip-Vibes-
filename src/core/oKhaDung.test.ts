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

  // Ca test mới theo B1a
  it("9 ca test theo đáp án B1a của người dùng", () => {
    expect(soOKhaDung(3, 2291, 960)).toBe(2);
    expect(soOKhaDung(3, 1667, 960)).toBe(3);
    expect(soOKhaDung(3, 1500, 960)).toBe(3);
    expect(soOKhaDung(3, 1980, 960)).toBe(2);
    expect(soOKhaDung(3, 2310, 960)).toBe(2);
    expect(soOKhaDung(3, 2311, 960)).toBe(1);
    expect(soOKhaDung(3, 2880, 960)).toBe(0);
    expect(soOKhaDung(4, 2291, 960)).toBe(4);
    expect(soOKhaDung(4, 1087, 1080)).toBe(5);
  });

  it("H3 test: soOKhaDung(7,475,1080) = 12 và soOKhaDung(6,475,1080) = 10", () => {
    expect(soOKhaDung(7, 475, 1080)).toBe(12);
    expect(soOKhaDung(6, 475, 1080)).toBe(10);
  });
});

