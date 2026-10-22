import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST as postParseRequest } from "./parse-request/route";
import { POST as postExtractBill } from "./extract-bill/route";
import { POST as postPlanRegenerate } from "./plan/regenerate/route";
import {
  quyetDinhGoiParse,
  thongBaoLoiThanThien,
  thuongBaoLoiThanThien,
} from "@/ui/messages/loi";

describe("H1: Kiểm thử an toàn API AI và các hàm thuần", () => {
  const origLiveAi = process.env.LIVE_AI_ENABLED;
  const origKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    delete process.env.LIVE_AI_ENABLED;
    process.env.GEMINI_API_KEY = "dummy-secret-key-12345";
  });

  afterEach(() => {
    if (origLiveAi !== undefined) process.env.LIVE_AI_ENABLED = origLiveAi;
    else delete process.env.LIVE_AI_ENABLED;

    if (origKey !== undefined) process.env.GEMINI_API_KEY = origKey;
    else delete process.env.GEMINI_API_KEY;
  });

  it("parse-request: khi LIVE_AI_ENABLED không đặt trả HTTP 503, maLoi 'ai_tat', không rò rỉ .env hay GEMINI_API_KEY", async () => {
    const req = new Request("http://localhost/api/parse-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "tôi cần tìm villa" }),
    });

    const res = await postParseRequest(req);
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.maLoi).toBe("ai_tat");

    const raw = JSON.stringify(body);
    expect(raw).not.toContain(".env");
    expect(raw).not.toContain("GEMINI_API_KEY");
  });

  it("extract-bill: khi LIVE_AI_ENABLED không đặt trả HTTP 503, maLoi 'ai_tat', không rò rỉ .env hay GEMINI_API_KEY", async () => {
    const req = new Request("http://localhost/api/extract-bill", {
      method: "POST",
      body: new FormData(),
    });

    const res = await postExtractBill(req);
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.maLoi).toBe("ai_tat");

    const raw = JSON.stringify(body);
    expect(raw).not.toContain(".env");
    expect(raw).not.toContain("GEMINI_API_KEY");
  });

  it("plan/regenerate: khi LIVE_AI_ENABLED không đặt trả HTTP 503, maLoi 'ai_tat', không rò rỉ .env hay GEMINI_API_KEY", async () => {
    const req = new Request("http://localhost/api/plan/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request: {}, selection: {} }),
    });

    const res = await postPlanRegenerate(req);
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.maLoi).toBe("ai_tat");

    const raw = JSON.stringify(body);
    expect(raw).not.toContain(".env");
    expect(raw).not.toContain("GEMINI_API_KEY");
  });

  it("quyetDinhGoiParse: kiểm tra 4 trường hợp đáp án người dùng", () => {
    // (false,"x") false
    expect(quyetDinhGoiParse({ aiBat: false, ghiChu: "x" })).toBe(false);

    // (true,"") false
    expect(quyetDinhGoiParse({ aiBat: true, ghiChu: "" })).toBe(false);

    // (true,"   ") false
    expect(quyetDinhGoiParse({ aiBat: true, ghiChu: "   " })).toBe(false);

    // (true,"tôi cần villa") true
    expect(quyetDinhGoiParse({ aiBat: true, ghiChu: "tôi cần villa" })).toBe(true);
  });

  it("thongBaoLoiThanThien / thuongBaoLoiThanThien: lỗi chứa 'GEMINI_API_KEY' và '.env.local' cho chuỗi không chứa 'GEMINI' và không chứa '.env'", () => {
    const loiGoc = "Lỗi xác thực: Chưa cấu hình GEMINI_API_KEY trong .env.local, vui lòng bổ sung.";

    const ketQua1 = thongBaoLoiThanThien(loiGoc);
    expect(ketQua1).not.toContain("GEMINI");
    expect(ketQua1).not.toContain(".env");

    const ketQua2 = thuongBaoLoiThanThien(loiGoc);
    expect(ketQua2).not.toContain("GEMINI");
    expect(ketQua2).not.toContain(".env");
  });
});
