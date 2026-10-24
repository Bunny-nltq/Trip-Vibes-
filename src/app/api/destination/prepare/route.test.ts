import { describe, it, expect } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

describe("POST /api/destination/prepare", () => {
  it("trả về 400 nếu thiếu diemDen", async () => {
    const req = new NextRequest("http://localhost:3000/api/destination/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soNgay: 3 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("chuẩn bị thành công cho điểm đến có snapshot (string diemDen)", async () => {
    const req = new NextRequest("http://localhost:3000/api/destination/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diemDen: "Đà Nẵng",
        soNgay: 3,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.trangThai).toBe("san_sang");
    expect(json.jobId).toBeDefined();
  });

  it("chuẩn bị thành công cho điểm đến là đối tượng DiemDen", async () => {
    const req = new NextRequest("http://localhost:3000/api/destination/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diemDen: {
          ten: "Hà Nội",
          quocGia: "Việt Nam",
          maQuocGia: "VN",
          toaDo: { lat: 21.0285, lng: 105.8542 },
          tienTe: "VND",
          nguon: "danh_sach_co_dinh",
          ngayLay: "2026-10-20",
        },
        diemDi: {
          ten: "TP.HCM",
          quocGia: "Việt Nam",
          maQuocGia: "VN",
          toaDo: { lat: 10.7769, lng: 106.7009 },
          tienTe: "VND",
          nguon: "danh_sach_co_dinh",
          ngayLay: "2026-10-20",
        },
        soNgay: 4,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.trangThai).toBe("san_sang");
    expect(json.jobId).toBeDefined();
  });
});
