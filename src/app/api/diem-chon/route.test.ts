import { describe, it, expect } from "vitest";
import { GET } from "./route";
import { DiemDenSchema } from "@/contracts";

describe("GET /api/diem-chon", () => {
  it("trả về danh sách diemDi và diemDen hợp lệ", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty("diemDi");
    expect(json).toHaveProperty("diemDen");

    // Kiểm tra diemDi
    expect(Array.isArray(json.diemDi)).toBe(true);
    expect(json.diemDi.length).toBe(8);
    const diemDiNames = json.diemDi.map((d: any) => d.ten);
    expect(diemDiNames).toContain("TP.HCM");
    expect(diemDiNames).toContain("Hà Nội");
    expect(diemDiNames).toContain("Đà Nẵng");
    expect(diemDiNames).toContain("Hải Phòng");
    expect(diemDiNames).toContain("Cần Thơ");
    expect(diemDiNames).toContain("Huế");
    expect(diemDiNames).toContain("Nha Trang");
    expect(diemDiNames).toContain("Đà Lạt");

    for (const d of json.diemDi) {
      expect(d.nguon).toBe("danh_sach_co_dinh");
      expect(() => DiemDenSchema.parse(d)).not.toThrow();
    }

    // Kiểm tra diemDen đọc từ snapshot
    expect(Array.isArray(json.diemDen)).toBe(true);
    expect(json.diemDen.length).toBeGreaterThanOrEqual(5);

    for (const d of json.diemDen) {
      expect(d.nguon).toBe("danh_sach_co_dinh");
      expect(() => DiemDenSchema.parse(d)).not.toThrow();
      expect(d.toaDo.lat).toBeTypeOf("number");
      expect(d.toaDo.lng).toBeTypeOf("number");
      expect(d.quocGia).toBeTypeOf("string");
      expect(d.maQuocGia).toBeTypeOf("string");
      expect(d.tienTe).toBeTypeOf("string");
    }
  });
});
