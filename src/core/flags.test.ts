import { describe, it, expect } from "vitest";
import { calculateTransportFlags } from "./flags";

describe("calculateTransportFlags (Test cờ)", () => {
  it("gioDi '11:30' + 1060 phút -> gioDen '05:10', soNgayLech 1, denSom true, diDem false", () => {
    const flags = calculateTransportFlags("11:30", 1060);
    expect(flags.gioDen).toBe("05:10");
    expect(flags.soNgayLech).toBe(1);
    expect(flags.denSom).toBe(true);
    expect(flags.diDem).toBe(false);
  });

  it("gioDi '22:40' + 85 phút -> diDem true, gioDen '00:05'", () => {
    const flags = calculateTransportFlags("22:40", 85);
    expect(flags.diDem).toBe(true);
    expect(flags.gioDen).toBe("00:05");
  });

  it("gioDi '06:30' -> khoiHanhSom true", () => {
    const flags = calculateTransportFlags("06:30", 90);
    expect(flags.khoiHanhSom).toBe(true);
  });

  it("gioDi '09:15' -> khoiHanhSom false", () => {
    const flags = calculateTransportFlags("09:15", 90);
    expect(flags.khoiHanhSom).toBe(false);
  });

  it("thoiLuongPhut 1050 -> diChuyenLau true", () => {
    const flags = calculateTransportFlags("16:30", 1050);
    expect(flags.diChuyenLau).toBe(true);
  });
});
