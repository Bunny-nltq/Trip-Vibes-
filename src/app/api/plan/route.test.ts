import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock GeminiProvider so it never calls Gemini
vi.mock("@/ai/provider", () => {
  return {
    GeminiProvider: vi.fn().mockImplementation(() => ({
      generateJson: vi.fn(),
      isConfigured: vi.fn().mockReturnValue(true),
    })),
  };
});

// Mock planWithRepair to test the route handler logic cleanly without network calls
vi.mock("@/ai/planWithRepair", () => {
  return {
    planWithRepair: vi.fn(async (tripRequest, options) => {
      if (options?.forceRulesOnly) {
        return {
          status: "ok",
          request: tripRequest,
          hard: [],
          soft: [],
          lichSu: [],
          soVongSua: 0,
          soLanGoiAI: 0,
          soLan429: 0,
          ms: 10,
          phuongThucLap: "quy_tac" as const,
          lyDoDuPhong: options.lyDoDuPhong,
          dataSourceUsed: "snapshot",
        };
      }
      return {
        status: "ok",
        request: tripRequest,
        hard: [],
        soft: [],
        lichSu: [],
        soVongSua: 1,
        soLanGoiAI: 1,
        soLan429: 0,
        ms: 20,
        phuongThucLap: "ai" as const,
        dataSourceUsed: "snapshot",
      };
    }),
  };
});

import { POST } from "./route";

describe("POST /api/plan - Giới hạn lượt AI theo IP", () => {
  beforeEach(() => {
    process.env.VERCEL = "1";
    process.env.LIVE_AI_ENABLED = "true";
    process.env.DATA_MODE = "snapshot";
  });

  it("gọi 6 lần với cùng IP 1.2.3.4: lần 1-5 có phuongThucLap 'ai', lần 6 có phuongThucLap 'quy_tac' và lyDoDuPhong 'gioi_han_ip' và soLanGoiAI = 0", async () => {
    const payload = {
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
          ten: "TP.HCM",
          quocGia: "Việt Nam",
          maQuocGia: "VN",
          toaDo: { lat: 10.7769, lng: 106.7009 },
          tienTe: "VND",
          nguon: "nominatim",
          ngayLay: "2026-10-21T00:00:00.000Z",
        },
        soNgay: 3,
        soNguoi: 2,
        ngansachTongVND: 15000000,
        sothich: [],
        tranh: [],
        ghiChu: [],
        thieu: [],
        cauHoiLamRo: [],
        canhBao: [],
      },
    };

    const clientIp = "1.2.3.4";

    // Gọi lần 1 đến 5
    for (let i = 1; i <= 5; i++) {
      const req = new Request("http://localhost:3000/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": clientIp,
        },
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.phuongThucLap).toBe("ai");
    }

    // Gọi lần 6
    const req6 = new Request("http://localhost:3000/api/plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": clientIp,
      },
      body: JSON.stringify(payload),
    });

    const res6 = await POST(req6);
    expect(res6.status).toBe(200);
    const json6 = await res6.json();
    expect(json6.ok).toBe(true);
    expect(json6.phuongThucLap).toBe("quy_tac");
    expect(json6.lyDoDuPhong).toBe("gioi_han_ip");
    expect(json6.soLanGoiAI).toBe(0);
  });
});
