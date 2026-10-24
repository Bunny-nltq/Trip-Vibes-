import { describe, it, expect } from "vitest";
import { POST } from "./route";

describe("POST /api/expenses/confirm", () => {
  it("trả về 400 nếu dữ liệu JSON không hợp lệ", async () => {
    const req = new Request("http://localhost:3000/api/expenses/confirm", {
      method: "POST",
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("xác nhận thành công khoản chi nhập tay hợp lệ", async () => {
    const req = new Request("http://localhost:3000/api/expenses/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nguon: "nhap_tay",
        tenCuaHang: "Cơm niêu Đà Nẵng",
        ngay: "2026-10-22",
        ngayTrongChuyen: 2,
        hangMuc: "an_uong",
        soTienVND: 250000,
        giaTriAIDoc: null,
        ghiChu: "Bữa trưa ngon",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.expense).toBeDefined();
    expect(json.expense.hangMuc).toBe("an_uong");
    expect(json.expense.soTienVND).toBe(250000);
    expect(json.expense.daSuaTay).toBe(false);
    expect(json.expense.id).toBeDefined();
  });

  it("gắn cờ daSuaTay = true khi số tiền hóa đơn ảnh bị sửa", async () => {
    const req = new Request("http://localhost:3000/api/expenses/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nguon: "anh_bill",
        tenCuaHang: "Cafe Phố",
        ngay: "2026-10-22",
        ngayTrongChuyen: 1,
        hangMuc: "an_uong",
        soTienVND: 65000,
        giaTriAIDoc: 55000, // AI đọc 55k nhưng người dùng sửa thành 65k
        ghiChu: null,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.expense.daSuaTay).toBe(true);
  });

  it("trả về 400 nếu hạng mục hoặc số tiền không hợp lệ", async () => {
    const req = new Request("http://localhost:3000/api/expenses/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nguon: "nhap_tay",
        tenCuaHang: "Test",
        hangMuc: "hang_muc_bay_ba",
        soTienVND: -50000,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.loi).toContain("hang_muc_khong_hop_le");
    expect(json.loi).toContain("so_tien_khong_hop_le");
  });
});
