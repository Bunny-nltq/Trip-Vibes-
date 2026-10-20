import { describe, it, expect } from "vitest";
import { soOKhaDung } from "./oKhaDung";

describe("soOKhaDung", () => {
  it("3 ngày, đến 475 (07:55), về 1080 (18:00) => 4 ô", () => {
    expect(soOKhaDung(3, 475, 1080)).toBe(4);
  });

  it("3 ngày, đến 619 (10:19), về 1080 (18:00) => 3 ô", () => {
    expect(soOKhaDung(3, 619, 1080)).toBe(3);
  });

  it("3 ngày, đến 619 (10:19), về 660 (11:00) => 2 ô", () => {
    expect(soOKhaDung(3, 619, 660)).toBe(2);
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
});
