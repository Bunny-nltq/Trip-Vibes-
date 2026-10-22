import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST as planPost } from "./route";
import { POST as parseRequestPost } from "../parse-request/route";
import { POST as extractBillPost } from "../extract-bill/route";
import { POST as planRegeneratePost } from "./regenerate/route";
import { GET as aiPingGet } from "../ai-ping/route";

describe("Kiểm tra API Lập kế hoạch bằng Quy tắc & Ca biên (Không gọi Gemini)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.VERCEL = "1";
    process.env.DATA_MODE = "snapshot";
    process.env.LIVE_AI_ENABLED = "false";
    delete process.env.GEMINI_API_KEY; // Hoàn toàn không có khóa
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("Nhóm 1: Các route AI khi LIVE_AI_ENABLED=false hoặc thiếu khóa", () => {
    it("/api/parse-request trả 503 ai_tat, không rò rỉ .env hay GEMINI_API_KEY", async () => {
      const req = new Request("http://localhost:3000/api/parse-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "tôi muốn đi Hà Nội 3 ngày" }),
      });
      const res = await parseRequestPost(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.maLoi).toBe("ai_tat");

      const bodyStr = JSON.stringify(data);
      expect(bodyStr).not.toContain(".env");
      expect(bodyStr).not.toContain("GEMINI_API_KEY");
    });

    it("/api/extract-bill trả 503 ai_tat, không rò rỉ .env hay GEMINI_API_KEY", async () => {
      const formData = new FormData();
      formData.append("image", new Blob(["fake-image"], { type: "image/jpeg" }));
      const req = new Request("http://localhost:3000/api/extract-bill", {
        method: "POST",
        body: formData,
      });
      const res = await extractBillPost(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.maLoi).toBe("ai_tat");

      const bodyStr = JSON.stringify(data);
      expect(bodyStr).not.toContain(".env");
      expect(bodyStr).not.toContain("GEMINI_API_KEY");
    });

    it("/api/plan/regenerate trả 503 ai_tat, không rò rỉ .env hay GEMINI_API_KEY", async () => {
      const req = new Request("http://localhost:3000/api/plan/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: { soNgay: 3 },
          selection: {},
        }),
      });
      const res = await planRegeneratePost(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.maLoi).toBe("ai_tat");

      const bodyStr = JSON.stringify(data);
      expect(bodyStr).not.toContain(".env");
      expect(bodyStr).not.toContain("GEMINI_API_KEY");
    });

    it("/api/ai-ping trả 503 ai_tat khi AI tắt", async () => {
      const res = await aiPingGet();
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.maLoi).toBe("ai_tat");
    });
  });

  describe("Quy tắc lập kế hoạch: Thiếu GEMINI_API_KEY & LIVE_AI_ENABLED=false", () => {
    it("/api/plan chạy quy tắc thành công khi KHÔNG CÓ GEMINI_API_KEY (không lỗi 500)", async () => {
      const req = new Request("http://localhost:3000/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: {
            diemDen: {
              ten: "Hà Nội",
              quocGia: "Việt Nam",
              maQuocGia: "VN",
              toaDo: { lat: 21.0285, lng: 105.8542 },
              tienTe: "VND",
              nguon: "nominatim",
              ngayLay: "2026-10-21T00:00:00.000Z",
            },
            diemDi: {
              ten: "Đà Nẵng",
              quocGia: "Việt Nam",
              maQuocGia: "VN",
              toaDo: { lat: 16.0544, lng: 108.2022 },
              tienTe: "VND",
              nguon: "nominatim",
              ngayLay: "2026-10-21T00:00:00.000Z",
            },
            soNgay: 3,
            soNguoi: 2,
            ngansachTongVND: 12000000,
            sothich: [],
            tranh: [],
            ghiChu: [],
            thieu: [],
            cauHoiLamRo: [],
            canhBao: [],
          },
        }),
      });

      const res = await planPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.phuongThucLap).toBe("quy_tac");
      expect(data.lyDoDuPhong).toBe("live_ai_tat");
      expect(data.soLanGoiAI).toBe(0);
      expect(data.plan).toBeDefined();
      expect(data.plan.items.length).toBeGreaterThan(0);
    });

    it("/api/plan hoạt động với diemDen là chuỗi 'Hà Nội' có trong snapshot", async () => {
      const req = new Request("http://localhost:3000/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: {
            diemDen: "Hà Nội",
            diemDi: "Đà Nẵng",
            soNgay: 3,
            soNguoi: 2,
            ngansachTongVND: 12000000,
            sothich: [],
            tranh: [],
            ghiChu: [],
            thieu: [],
            cauHoiLamRo: [],
            canhBao: [],
          },
        }),
      });

      const res = await planPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.phuongThucLap).toBe("quy_tac");
      expect(data.plan).toBeDefined();
      expect((data.plan.request.diemDen as any).ten).toBe("Hà Nội");
    });

    it("/api/plan hoạt động với diemDen là chuỗi 'Đà Nẵng' có trong snapshot", async () => {
      const req = new Request("http://localhost:3000/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: {
            diemDen: "Đà Nẵng",
            diemDi: "Hà Nội",
            soNgay: 2,
            soNguoi: 2,
            ngansachTongVND: 10000000,
            sothich: [],
            tranh: [],
            ghiChu: [],
            thieu: [],
            cauHoiLamRo: [],
            canhBao: [],
          },
        }),
      });

      const res = await planPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.phuongThucLap).toBe("quy_tac");
      expect(data.plan).toBeDefined();
    });
  });

  describe("Các ca biên (Edge cases)", () => {
    it("Ca biên 1: Ngân sách quá thấp -> trả về khong_the_dat_ngan_sach và toiThieuVND", async () => {
      const req = new Request("http://localhost:3000/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: {
            diemDen: "Hà Nội",
            diemDi: "Đà Nẵng",
            soNgay: 3,
            soNguoi: 2,
            ngansachTongVND: 300000, // 300k cho 2 người 3 ngày là bất khả thi
            sothich: [],
            tranh: [],
            ghiChu: [],
            thieu: [],
            cauHoiLamRo: [],
            canhBao: [],
          },
        }),
      });

      const res = await planPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.status).toBe("khong_the_dat_ngan_sach");
      expect(data.toiThieuVND).toBeGreaterThan(1000000);
      expect(data.hard.some((v: any) => v.code === "ngan_sach_toi_thieu")).toBe(true);
    });

    it("Ca biên 2: Điểm đến chưa có snapshot ở môi trường Production -> trả HTTP 409", async () => {
      const req = new Request("http://localhost:3000/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: {
            diemDen: "Phú Quốc", // Chưa có snapshot
            soNgay: 3,
            soNguoi: 2,
            ngansachTongVND: 10000000,
            sothich: [],
            tranh: [],
            ghiChu: [],
            thieu: [],
            cauHoiLamRo: [],
            canhBao: [],
          },
        }),
      });

      const res = await planPost(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.maLoi).toBe("khong_co_du_lieu_luu_san");
    });

    it("Ca biên 3: Gửi 'text' khi AI tắt -> trả HTTP 503 ai_tat (không gọi Gemini)", async () => {
      const req = new Request("http://localhost:3000/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Tôi muốn đi du lịch Hà Nội 3 ngày",
        }),
      });

      const res = await planPost(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.maLoi).toBe("ai_tat");
    });

    it("Ca biên 4: Request thiếu các trường bắt buộc (thiếu ngân sách, thiếu số người) -> schema validation trả 400", async () => {
      const req = new Request("http://localhost:3000/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: {
            diemDen: "Hà Nội",
            soNgay: 3,
            // Thiếu soNguoi và ngansachTongVND
          },
        }),
      });

      const res = await planPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.ok).toBe(false);
    });
  });
});
