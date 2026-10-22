import { describe, it, expect } from "vitest";
import { soDemOKhachSan } from "./soDem";

describe("src/core/soDem - soDemOKhachSan", () => {
  it("kiểm tra 8 ca do người dùng tính tay", () => {
    expect(soDemOKhachSan(3, 1439)).toBe(2);
    expect(soDemOKhachSan(3, 1440)).toBe(1);
    expect(soDemOKhachSan(3, 2879)).toBe(1);
    expect(soDemOKhachSan(3, 2880)).toBe(0);
    expect(soDemOKhachSan(4, 1440)).toBe(2);
    expect(soDemOKhachSan(2, 0)).toBe(1);
    expect(soDemOKhachSan(2, 1440)).toBe(0);
    expect(soDemOKhachSan(5, 4000)).toBe(2);
    expect(soDemOKhachSan(7, 565)).toBe(6);
  });
});

