import { describe, it, expect } from "vitest";
import { tiLeThoiGianDiChuyen, coCanhBaoDiChuyen } from "./tiLeDiChuyen";
import { DI_CHUYEN_TOI_DA_TI_LE } from "./assumptions";

describe("Cảnh báo thời gian di chuyển (tiLeDiChuyen)", () => {
  it("hằng số DI_CHUYEN_TOI_DA_TI_LE trong assumptions phải là 0.35", () => {
    expect(DI_CHUYEN_TOI_DA_TI_LE).toBe(0.35);
  });

  // 6 ca test của USER (đáp án cố định không sửa):
  // 1) (2494, 3 ngày) = 57,7% và có cảnh báo
  it("ca 1: (2494, 3 ngày) = 57,7% và có cảnh báo", () => {
    expect(tiLeThoiGianDiChuyen(2494, 3)).toBe(57.7);
    expect(coCanhBaoDiChuyen(2494, 3)).toBe(true);
  });

  // 2) (1334, 3 ngày) = 30,9% và KHÔNG
  it("ca 2: (1334, 3 ngày) = 30,9% và KHÔNG có cảnh báo", () => {
    expect(tiLeThoiGianDiChuyen(1334, 3)).toBe(30.9);
    expect(coCanhBaoDiChuyen(1334, 3)).toBe(false);
  });

  // 3) (278, 3 ngày) = 6,4% và KHÔNG
  it("ca 3: (278, 3 ngày) = 6,4% và KHÔNG có cảnh báo", () => {
    expect(tiLeThoiGianDiChuyen(278, 3)).toBe(6.4);
    expect(coCanhBaoDiChuyen(278, 3)).toBe(false);
  });

  // 4) (1334, 2 ngày) = 46,3% và có cảnh báo
  it("ca 4: (1334, 2 ngày) = 46,3% và có cảnh báo", () => {
    expect(tiLeThoiGianDiChuyen(1334, 2)).toBe(46.3);
    expect(coCanhBaoDiChuyen(1334, 2)).toBe(true);
  });

  // 5) (1512, 3 ngày) = 35,0% và KHÔNG (bằng ngưỡng, không lớn hơn)
  it("ca 5: (1512, 3 ngày) = 35,0% và KHÔNG có cảnh báo (bằng ngưỡng)", () => {
    expect(tiLeThoiGianDiChuyen(1512, 3)).toBe(35.0);
    expect(coCanhBaoDiChuyen(1512, 3)).toBe(false);
  });

  // 6) (1513, 3 ngày) = 35,0% và có cảnh báo (1513 lớn hơn 1512)
  it("ca 6: (1513, 3 ngày) = 35,0% và có cảnh báo (1513 lớn hơn 1512)", () => {
    expect(tiLeThoiGianDiChuyen(1513, 3)).toBe(35.0);
    expect(coCanhBaoDiChuyen(1513, 3)).toBe(true);
  });
});
