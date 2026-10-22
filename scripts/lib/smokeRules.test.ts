import { describe, it, expect } from "vitest";
import { danhGiaHealth, danhGiaPlan, chuaChuoi } from "./smokeRules";

describe("scripts/lib/smokeRules", () => {
  describe("danhGiaHealth", () => {
    it("trả về true khi snapshots có 5 phần tử", () => {
      const input = {
        mode: "snapshot",
        snapshots: [1, 2, 3, 4, 5],
      };
      expect(danhGiaHealth(input)).toBe(true);
      expect(danhGiaHealth(JSON.stringify(input))).toBe(true);
    });

    it("trả về false khi snapshots rỗng", () => {
      const input = {
        mode: "snapshot",
        snapshots: [],
      };
      expect(danhGiaHealth(input)).toBe(false);
      expect(danhGiaHealth(JSON.stringify(input))).toBe(false);
    });

    it("trả về false khi chuỗi không phải JSON", () => {
      expect(danhGiaHealth("khong phai json")).toBe(false);
    });
  });

  describe("danhGiaPlan", () => {
    it("trả về true với {ok:true,dataSourceUsed:'snapshot',soLanGoiAI:0,plan:{items:[{}]}}", () => {
      const input = {
        ok: true,
        dataSourceUsed: "snapshot",
        soLanGoiAI: 0,
        plan: { items: [{}] },
      };
      expect(danhGiaPlan(input)).toBe(true);
      expect(danhGiaPlan(JSON.stringify(input))).toBe(true);
    });

    it("trả về false khi dataSourceUsed là 'live'", () => {
      const input = {
        ok: true,
        dataSourceUsed: "live",
        soLanGoiAI: 0,
        plan: { items: [{}] },
      };
      expect(danhGiaPlan(input)).toBe(false);
    });

    it("trả về false khi ok false", () => {
      const input = {
        ok: false,
        dataSourceUsed: "snapshot",
        soLanGoiAI: 0,
        plan: { items: [{}] },
      };
      expect(danhGiaPlan(input)).toBe(false);
    });

    it("trả về false khi items rỗng", () => {
      const input = {
        ok: true,
        dataSourceUsed: "snapshot",
        soLanGoiAI: 0,
        plan: { items: [] },
      };
      expect(danhGiaPlan(input)).toBe(false);
    });
  });

  describe("chuaChuoi", () => {
    it("trả về true khi body chứa chuoi và chuoi dài từ 8 ký tự trở lên", () => {
      expect(chuaChuoi("day la noi dung chua khoa bi mat 12345678 o day", "12345678")).toBe(true);
    });

    it("trả về false khi chuoi rỗng", () => {
      expect(chuaChuoi("noi dung bat ky", "")).toBe(false);
    });

    it("trả về false khi chuoi ngắn hơn 8 ký tự", () => {
      expect(chuaChuoi("noi dung chua 1234567", "1234567")).toBe(false);
    });
  });
});
