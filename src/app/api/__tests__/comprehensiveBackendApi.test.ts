import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GET as getHealth } from "../health/route";
import { GET as getDataStatus } from "../data/status/route";
import { GET as getAiPing } from "../ai-ping/route";
import { POST as postParseRequest } from "../parse-request/route";
import { POST as postExtractBill } from "../extract-bill/route";
import { POST as postExpenseConfirm } from "../expenses/confirm/route";
import { GET as getDestination } from "../destination/route";
import { GET as getDestinationStatus } from "../destination/status/route";
import { POST as postDestinationPrepare } from "../destination/prepare/route";
import { GET as getOptions } from "../options/route";
import { POST as postPlanPreview } from "../plan/preview/route";
import { POST as postPlan } from "../plan/route";
import { POST as postPlanRegenerate } from "../plan/regenerate/route";
import { NextRequest } from "next/server";

describe("Toàn diện Backend API Routes (Comprehensive Backend Test Suite)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.DATA_MODE = "snapshot";
    process.env.LIVE_AI_ENABLED = "false";
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("1. Hệ thống & Giám sát (/api/health, /api/data/status, /api/ai-ping)", () => {
    it("GET /api/health: trả về 200, snapshot mode và danh sách các điểm đến snapshot (LƯU Ý: thiếu trường 'ok: true' so với các API khác)", async () => {
      const res = await getHealth();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.mode).toBe("snapshot");
      expect(data.snapshots).toBeInstanceOf(Array);
      expect(data.snapshots.length).toBeGreaterThanOrEqual(5);

      const snapshotNames = data.snapshots.map((s: { ten: string }) => s.ten.toLowerCase());
      expect(snapshotNames.some((t: string) => t.includes("đà nẵng"))).toBe(true);
      expect(snapshotNames.some((t: string) => t.includes("hà nội"))).toBe(true);
      expect(snapshotNames.some((t: string) => t.includes("đà lạt"))).toBe(true);
      expect(snapshotNames.some((t: string) => t.includes("băng cốc") || t.includes("bangkok"))).toBe(true);
      expect(snapshotNames.some((t: string) => t.includes("seoul"))).toBe(true);

      // Điểm bất đồng bộ thiết kế API: /api/health không có `ok: true`
      expect(data.ok).toBeUndefined();
    });

    it("GET /api/data/status: trả về 200, nguồn OSM (LƯU Ý: LiveDataSource không có destination mặc định nên đếm trả về 0)", async () => {
      const res = await getDataStatus();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.nguon).toContain("OpenStreetMap");
      expect(data.mode).toBe("snapshot");
      // Phát hiện thiết kế: LiveDataSource không nhận destination nên trả về 0 cho tất cả số lượng
      expect(data.soKhachSan).toBe(0);
      expect(data.soQuanAn).toBe(0);
      expect(data.soCafe).toBe(0);
      expect(data.soHoatDong).toBe(0);
    });

    it("GET /api/ai-ping: khi LIVE_AI_ENABLED=false trả HTTP 503 với mã lỗi 'ai_tat'", async () => {
      const res = await getAiPing();
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.maLoi).toBe("ai_tat");
      expect(data.thongBao).toContain("tắt");
    });
  });

  describe("2. Xử lý yêu cầu tự nhiên (/api/parse-request)", () => {
    it("trả về 503 khi LIVE_AI_ENABLED=false", async () => {
      const req = new Request("http://localhost/api/parse-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Đi Đà Nẵng 3 ngày 2 đêm 2 người 10 triệu" }),
      });
      const res = await postParseRequest(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.maLoi).toBe("ai_tat");
    });

    it("trả về 400 khi body không phải JSON hợp lệ", async () => {
      process.env.LIVE_AI_ENABLED = "true";
      process.env.GEMINI_API_KEY = "test_key";

      const req = new Request("http://localhost/api/parse-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "NOT_JSON_BODY{",
      });
      const res = await postParseRequest(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toContain("JSON");
    });

    it("trả về 400 khi thiếu trường text hoặc text rỗng", async () => {
      process.env.LIVE_AI_ENABLED = "true";
      process.env.GEMINI_API_KEY = "test_key";

      const reqEmpty = new Request("http://localhost/api/parse-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "   " }),
      });
      const resEmpty = await postParseRequest(reqEmpty);
      expect(resEmpty.status).toBe(400);

      const reqMissing = new Request("http://localhost/api/parse-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ other: 123 }),
      });
      const resMissing = await postParseRequest(reqMissing);
      expect(resMissing.status).toBe(400);
    });

    it("trả về 400 khi text dài quá 500 ký tự", async () => {
      process.env.LIVE_AI_ENABLED = "true";
      process.env.GEMINI_API_KEY = "test_key";

      const longText = "a".repeat(501);
      const req = new Request("http://localhost/api/parse-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: longText }),
      });
      const res = await postParseRequest(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toContain("500");
    });
  });

  describe("3. Bóc tách hóa đơn (/api/extract-bill)", () => {
    it("trả về 503 khi LIVE_AI_ENABLED=false", async () => {
      const formData = new FormData();
      formData.append("image", new Blob(["abc"], { type: "image/jpeg" }));
      const req = new Request("http://localhost/api/extract-bill", {
        method: "POST",
        body: formData,
      });
      const res = await postExtractBill(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.maLoi).toBe("ai_tat");
    });

    it("trả về 400 khi thiếu file ảnh", async () => {
      process.env.LIVE_AI_ENABLED = "true";
      process.env.GEMINI_API_KEY = "test_key";

      const formData = new FormData();
      const req = new Request("http://localhost/api/extract-bill", {
        method: "POST",
        body: formData,
      });
      const res = await postExtractBill(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toContain("Thiếu file");
    });

    it("trả về 400 khi định dạng MIME không được hỗ trợ", async () => {
      process.env.LIVE_AI_ENABLED = "true";
      process.env.GEMINI_API_KEY = "test_key";

      const formData = new FormData();
      formData.append("image", new Blob(["abc"], { type: "application/pdf" }));
      const req = new Request("http://localhost/api/extract-bill", {
        method: "POST",
        body: formData,
      });
      const res = await postExtractBill(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toContain("jpeg, png, webp");
    });

    it("trả về 400 khi byte thực tế (magic bytes) không khớp với MIME type", async () => {
      process.env.LIVE_AI_ENABLED = "true";
      process.env.GEMINI_API_KEY = "test_key";

      const formData = new FormData();
      formData.append("image", new Blob([new Uint8Array([0x00, 0x01, 0x02])], { type: "image/jpeg" }));
      const req = new Request("http://localhost/api/extract-bill", {
        method: "POST",
        body: formData,
      });
      const res = await postExtractBill(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toContain("hợp lệ");
    });

    it("trả về 413 khi kích thước ảnh vượt quá 5MB", async () => {
      process.env.LIVE_AI_ENABLED = "true";
      process.env.GEMINI_API_KEY = "test_key";

      const largeBuffer = new Uint8Array(5 * 1024 * 1024 + 10);
      const formData = new FormData();
      formData.append("image", new Blob([largeBuffer], { type: "image/jpeg" }));
      const req = new Request("http://localhost/api/extract-bill", {
        method: "POST",
        body: formData,
      });
      const res = await postExtractBill(req);
      expect(res.status).toBe(413);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toContain("5MB");
    });
  });

  describe("4. Xác nhận chi tiêu (/api/expenses/confirm) & Kiểm tra tính tương thích định dạng", () => {
    it("trả về 200 khi dữ liệu nhập tay đầy đủ và đúng định dạng ngày YYYY-MM-DD", async () => {
      const payload = {
        nguon: "nhap_tay",
        tenCuaHang: "Cơm niêu Đà Nẵng",
        ngay: "2026-10-25",
        ngayTrongChuyen: 2,
        hangMuc: "an_uong",
        soTienVND: 350000,
        giaTriAIDoc: null,
        ghiChu: "Ăn trưa 2 người",
      };
      const req = new Request("http://localhost/api/expenses/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const res = await postExpenseConfirm(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.expense.soTienVND).toBe(350000);
      expect(data.expense.hangMuc).toBe("an_uong");
      expect(data.expense.daSuaTay).toBe(false);
    });

    it("trả về 200 khi bóc tách từ bill và người dùng sửa số tiền (daSuaTay=true)", async () => {
      const payload = {
        nguon: "anh_bill",
        tenCuaHang: "Quán cà phê Góc Phố",
        ngay: "2026-10-25",
        ngayTrongChuyen: 1,
        hangMuc: "an_uong",
        soTienVND: 95000,
        giaTriAIDoc: 90000,
        ghiChu: null,
      };
      const req = new Request("http://localhost/api/expenses/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const res = await postExpenseConfirm(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.expense.daSuaTay).toBe(true);
    });

    it("ĐÃ ĐƯỢC FIX: Ngày định dạng 'DD/MM/YYYY' (từ frontend) được backend confirmExpense tự động chuẩn hóa thành công 200", async () => {
      const payload = {
        nguon: "nhap_tay",
        tenCuaHang: "Bánh tráng cuốn thịt heo",
        ngay: "25/10/2026", // Chuỗi do toLocaleDateString('vi-VN') sinh ra trên giao diện
        ngayTrongChuyen: 2,
        hangMuc: "an_uong",
        soTienVND: 180000,
        giaTriAIDoc: null,
      };
      const req = new Request("http://localhost/api/expenses/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const res = await postExpenseConfirm(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.expense.ngay).toBe("2026-10-25");
    });

    it("trả về 400 khi số tiền không hợp lệ (số âm, bằng 0 hoặc > 1 tỷ VND)", async () => {
      const base = {
        nguon: "nhap_tay",
        tenCuaHang: "Quán ăn",
        ngay: "2026-10-25",
        ngayTrongChuyen: 1,
        hangMuc: "an_uong",
        giaTriAIDoc: null,
      };

      for (const invalidAmount of [0, -50000, 1000000001, 12.34]) {
        const req = new Request("http://localhost/api/expenses/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...base, soTienVND: invalidAmount }),
        });
        const res = await postExpenseConfirm(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.loi).toContain("so_tien_khong_hop_le");
      }
    });

    it("trả về 400 khi hạng mục chi tiêu không nằm trong danh mục hợp lệ", async () => {
      const req = new Request("http://localhost/api/expenses/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nguon: "nhap_tay",
          tenCuaHang: "Quán cà phê",
          ngay: "2026-10-25",
          ngayTrongChuyen: 1,
          hangMuc: "hang_muc_la_khong_hop_le",
          soTienVND: 50000,
          giaTriAIDoc: null,
        }),
      });
      const res = await postExpenseConfirm(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.loi).toContain("hang_muc_khong_hop_le");
    });

    it("trả về 400 khi ngayTrongChuyen ngoài phạm vi 1 đến 7", async () => {
      for (const invalidDay of [0, 8, -1]) {
        const req = new Request("http://localhost/api/expenses/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nguon: "nhap_tay",
            tenCuaHang: "Quán cà phê",
            ngay: "2026-10-25",
            ngayTrongChuyen: invalidDay,
            hangMuc: "an_uong",
            soTienVND: 50000,
            giaTriAIDoc: null,
          }),
        });
        const res = await postExpenseConfirm(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.loi).toContain("ngay_trong_chuyen_khong_hop_le");
      }
    });
  });

  describe("5. Chuẩn bị và Tìm kiếm Điểm đến (/api/destination, /api/destination/prepare, /api/destination/status)", () => {
    it("GET /api/destination: trả về 400 khi thiếu tham số 'q'", async () => {
      const req = new NextRequest("http://localhost/api/destination");
      const res = await getDestination(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("không được để trống");
    });

    it("GET /api/destination: tìm kiếm điểm đến phổ biến có sẵn trả về thông tin toạ độ", async () => {
      const req = new NextRequest("http://localhost/api/destination?q=Đà+Nẵng");
      const res = await getDestination(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("thanh_cong");
      expect(data.diemDen.ten).toContain("Đà Nẵng");
      expect(data.diemDen.toaDo.lat).toBeCloseTo(16.0544, 1);
    });

    it("GET /api/destination/status: trả về 400 khi thiếu jobId", async () => {
      const req = new NextRequest("http://localhost/api/destination/status");
      const res = await getDestinationStatus(req);
      expect(res.status).toBe(400);
    });

    it("GET /api/destination/status: trả về 'san_sang' cho jobId bắt đầu bằng 'ready_'", async () => {
      const req = new NextRequest("http://localhost/api/destination/status?jobId=ready_VN_12345");
      const res = await getDestinationStatus(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.trangThai).toBe("san_sang");
      expect(data.tienTrinh.khach_san.trangThai).toBe("xong");
    });

    it("GET /api/destination/status: trả về 404 cho jobId không tồn tại", async () => {
      const req = new NextRequest("http://localhost/api/destination/status?jobId=khong_ton_tai_9999");
      const res = await getDestinationStatus(req);
      expect(res.status).toBe(404);
    });

    it("POST /api/destination/prepare: trả về 200 'san_sang' ngay cho điểm đến đã có snapshot", async () => {
      const req = new NextRequest("http://localhost/api/destination/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diemDen: "Đà Nẵng",
          diemDi: "TP.HCM",
          soNgay: 3,
        }),
      });
      const res = await postDestinationPrepare(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.trangThai).toBe("san_sang");
      expect(data.jobId).toBeDefined();
    });

    it("POST /api/destination/prepare: trả về 400 khi thiếu trường diemDen", async () => {
      const req = new NextRequest("http://localhost/api/destination/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soNgay: 3 }),
      });
      const res = await postDestinationPrepare(req);
      expect(res.status).toBe(400);
    });
  });

  describe("6. Tra cứu phương tiện, khách sạn & Tùy chọn (/api/options)", () => {
    it("GET /api/options: trả về 400 khi thiếu tham số 'loai'", async () => {
      const req = new Request("http://localhost/api/options");
      const res = await getOptions(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toContain("loai");
    });

    it("GET /api/options?loai=phuong_tien&huong=di: trả về danh sách phương tiện chiều đi kèm nhãn giá", async () => {
      const req = new Request(
        "http://localhost/api/options?loai=phuong_tien&huong=di&diemDi=TP.HCM&diemDen=Đà+Nẵng&soNguoi=2&soNgay=3"
      );
      const res = await getOptions(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.items).toBeInstanceOf(Array);
      expect(data.items.length).toBeGreaterThan(0);
      const first = data.items[0];
      expect(first.id).toBeDefined();
      expect(first.provider).toBeDefined();
      expect(first.pricePerPerson).toBeGreaterThan(0);
      expect(first.durationMinutes).toBeGreaterThan(0);
    });

    it("GET /api/options?loai=khach_san: trả về danh sách khách sạn và sử dụng in-memory cache khi gọi lần 2", async () => {
      const url = "http://localhost/api/options?loai=khach_san&diemDen=Đà+Nẵng&soNguoi=2&soNgay=3";
      const req1 = new Request(url);
      const res1 = await getOptions(req1);
      expect(res1.status).toBe(200);
      const data1 = await res1.json();
      expect(data1.ok).toBe(true);
      expect(data1.items.length).toBeGreaterThan(0);

      // Gọi lần 2 kiểm tra in-memory cache
      const req2 = new Request(url);
      const res2 = await getOptions(req2);
      expect(res2.status).toBe(200);
      const data2 = await res2.json();
      expect(data2).toEqual(data1);
    });
  });

  describe("7. Lập kế hoạch du lịch & Dự phòng thuật toán thuần (/api/plan)", () => {
    it("POST /api/plan: trả về 400 khi gửi số ngày < 2 hoặc > 7", async () => {
      const reqUnder = new Request("http://localhost/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: {
            diemDi: "TP.HCM",
            diemDen: "Đà Nẵng",
            soNgay: 1, // Không hợp lệ
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
      const resUnder = await postPlan(reqUnder);
      expect(resUnder.status).toBe(400);
      const dataUnder = await resUnder.json();
      expect(dataUnder.error).toContain("2 đến 7 ngày");

      const reqOver = new Request("http://localhost/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: {
            diemDi: "TP.HCM",
            diemDen: "Đà Nẵng",
            soNgay: 8, // Không hợp lệ
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
      const resOver = await postPlan(reqOver);
      expect(resOver.status).toBe(400);
    });

    it("POST /api/plan: trong môi trường production, điểm đến không có snapshot (như Phú Quốc) bị từ chối 409", async () => {
      process.env.VERCEL = "1";
      const req = new Request("http://localhost/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: {
            diemDi: "TP.HCM",
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
      const res = await postPlan(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.maLoi).toBe("khong_co_du_lieu_luu_san");
    });

    it("POST /api/plan: lập kế hoạch thành công bằng quy tắc thuật toán thuần khi AI tắt", async () => {
      const req = new Request("http://localhost/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: {
            diemDi: "TP.HCM",
            diemDen: "Đà Nẵng",
            soNgay: 3,
            soNguoi: 2,
            ngansachTongVND: 10000000,
            sothich: ["bien", "am_thuc"],
            tranh: ["khong_day_som"],
            ghiChu: [],
            thieu: [],
            cauHoiLamRo: [],
            canhBao: [],
          },
        }),
      });
      const res = await postPlan(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.phuongThucLap).toBe("quy_tac");
      expect(data.lyDoDuPhong).toBe("live_ai_tat");
      expect(data.plan.items.length).toBeGreaterThan(0);
      expect(data.plan.tongKet.tongVND).toBeGreaterThan(0);
      expect(data.plan.tongKet.conLaiVND).toBeGreaterThanOrEqual(0);
    });

    it("POST /api/plan/preview: xem trước và tính toán diff chính xác khi đổi phương tiện đi", async () => {
      const { LiveDataSource } = await import("@/data/live/LiveDataSource");
      const { lapKeHoachTuDong } = await import("@/core/lapKeHoachTuDong");
      const { schemaVersion } = await import("@/contracts");

      const ds = new LiveDataSource("snapshot", undefined, {
        ten: "Đà Nẵng",
        quocGia: "Việt Nam",
        maQuocGia: "VN",
        toaDo: { lat: 16.0544, lng: 108.2022 },
        tienTe: "VND",
        nguon: "danh_sach_co_dinh",
        ngayLay: "2026-10-20",
      });
      const [transports, hotels, activities, khachSans, quanAns, cafes, hoatDongs] = await Promise.all([
        ds.getTransports(),
        ds.getHotels(),
        ds.getActivities(),
        ds.getKhachSans(),
        ds.getQuanAns(),
        ds.getCafes(),
        ds.getHoatDongs(),
      ]);
      const snapshotData = { transports, hotels, activities, khachSans, quanAns, cafes, hoatDongs };
      const tripReq = {
        schemaVersion,
        diemDi: "TP.HCM",
        diemDen: "Đà Nẵng",
        soNgay: 3,
        soNguoi: 2,
        ngansachTongVND: 15000000,
        sothich: [],
        tranh: [],
        ghiChu: [],
        thieu: [],
        cauHoiLamRo: [],
        canhBao: [],
      };
      const tuDong = lapKeHoachTuDong(tripReq, snapshotData);
      expect(tuDong.status).toBe("ok");
      const initialSelection = (tuDong as any).selection;
      const transDi = transports.filter((t) => t.huong === "di");
      const targetTransport = transDi.find((t) => t.id !== initialSelection.transportDiId) || transDi[1];

      const req = new Request("http://localhost/api/plan/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: tripReq,
          selection: initialSelection,
          thayDoi: {
            loai: "phuong_tien_di",
            idMoi: targetTransport.id,
          },
        }),
      });
      const res = await postPlanPreview(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.planSau).toBeDefined();
      expect(data.diff).toBeDefined();
      expect(data.diff.tongVND.truoc).toBeGreaterThan(0);
      expect(data.diff.tongVND.sau).toBeGreaterThan(0);
    });

    it("POST /api/plan/regenerate: trả 503 khi AI tắt", async () => {
      const req = new Request("http://localhost/api/plan/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: {
            diemDi: "TP.HCM",
            diemDen: "Đà Nẵng",
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
          selection: {
            transportDiId: "mb_vietjet_sg_dn_01",
            transportVeId: "mb_vietjet_dn_sg_01",
            hotelId: "ks_muongthanh_danang",
            hoatDongTheoNgay: [[], [], []],
          },
        }),
      });
      const res = await postPlanRegenerate(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.maLoi).toBe("ai_tat");
    });
  });
});
