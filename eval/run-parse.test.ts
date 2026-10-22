import { describe, it, expect } from "vitest";
import { soSanhNganSach } from "./run-parse";

describe("eval/run-parse.ts - Hàm thuần soSanhNganSach", () => {
  it("(20.000.000 với 20.000.000) -> khớp (true)", () => {
    expect(soSanhNganSach(20000000, 20000000)).toBe(true);
  });

  it("(19.000.000 với 20.000.000) -> không khớp (false)", () => {
    expect(soSanhNganSach(19000000, 20000000)).toBe(false);
  });

  it("(null với 20.000.000) -> không khớp (false)", () => {
    expect(soSanhNganSach(null, 20000000)).toBe(false);
  });

  it("(null với null) -> khớp (true)", () => {
    expect(soSanhNganSach(null, null)).toBe(true);
  });
});
