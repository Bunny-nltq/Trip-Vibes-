import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  geocodeDestination,
  parseNominatimItem,
  scheduleRateLimited,
  resetGeocodeRateLimiter,
} from "./geocodeClient";

describe("geocodeClient", () => {
  const originalUserAgent = process.env.NOMINATIM_USER_AGENT;

  beforeEach(() => {
    process.env.NOMINATIM_USER_AGENT = "TripVibesTest/1.0 (contact@tripvibes.vn)";
    resetGeocodeRateLimiter();
  });

  afterEach(() => {
    process.env.NOMINATIM_USER_AGENT = originalUserAgent;
    vi.useRealTimers();
  });

  it("thiếu User-Agent thì ném lỗi rõ ràng", async () => {
    delete process.env.NOMINATIM_USER_AGENT;
    await expect(
      geocodeDestination("Bangkok", { skipCache: true })
    ).rejects.toThrow(/NOMINATIM_USER_AGENT|User-Agent/i);
  });

  it("User-Agent chứa .local hoặc example thì ném lỗi rõ ràng", async () => {
    process.env.NOMINATIM_USER_AGENT = "TripVibes/1.0 (test@tripvibes.local)";
    await expect(
      geocodeDestination("Bangkok", { skipCache: true })
    ).rejects.toThrow(/\.local|example/i);

    process.env.NOMINATIM_USER_AGENT = "TripVibes/1.0 (user@example.com)";
    await expect(
      geocodeDestination("Bangkok", { skipCache: true })
    ).rejects.toThrow(/\.local|example/i);
  });

  it("kết quả Nominatim mẫu được phân tích đúng ten, maQuocGia, toaDo", () => {
    const rawSample = {
      place_id: 12345,
      name: "Bangkok",
      display_name: "Bangkok, Phra Nakhon, Thailand",
      lat: "13.7563",
      lon: "100.5018",
      type: "city",
      address: {
        city: "Bangkok",
        country: "Thái Lan",
        country_code: "th",
      },
    };

    const parsed = parseNominatimItem(rawSample, "2026-10-19T00:00:00.000Z");
    expect(parsed.ten).toBe("Bangkok");
    expect(parsed.maQuocGia).toBe("TH");
    expect(parsed.toaDo.lat).toBe(13.7563);
    expect(parsed.toaDo.lng).toBe(100.5018);
    expect(parsed.tienTe).toBe("THB");
  });

  it("lần gọi thứ hai cùng truy vấn không gọi mạng", async () => {
    let networkCallCount = 0;
    const mockFetch = vi.fn(async () => {
      networkCallCount++;
      return {
        ok: true,
        json: async () => [
          {
            place_id: 999,
            name: "Hà Nội",
            display_name: "Hà Nội, Việt Nam",
            lat: "21.0285",
            lon: "105.8542",
            type: "city",
            address: {
              city: "Hà Nội",
              country: "Việt Nam",
              country_code: "vn",
            },
          },
        ],
      } as any;
    });

    const q = `HaNoi_CacheTest_${Date.now()}_${Math.random()}`;
    const res1 = await geocodeDestination(q, { fetchFn: mockFetch });
    expect(res1.status).toBe("thanh_cong");
    expect(networkCallCount).toBe(1);

    const res2 = await geocodeDestination(q, { fetchFn: mockFetch });
    expect(res2.status).toBe("thanh_cong");
    expect(networkCallCount).toBe(1); // không gọi mạng lần hai
  });

  it("geocode hai lần trong dưới 1 giây thì lần hai cách lần một tối thiểu 1000 ms", async () => {
    vi.useFakeTimers();

    const executionTimes: number[] = [];

    // Gọi lần 1
    const p1 = scheduleRateLimited(async () => {
      executionTimes.push(Date.now());
      return 1;
    });

    // Gọi lần 2 ngay lập tức
    const p2 = scheduleRateLimited(async () => {
      executionTimes.push(Date.now());
      return 2;
    });

    await vi.advanceTimersByTimeAsync(0);
    await p1;

    // Lúc này lần 1 đã chạy, lần 2 chưa chạy vì phải đợi 1000ms
    expect(executionTimes.length).toBe(1);

    // Tiến thời gian thêm 1000ms
    await vi.advanceTimersByTimeAsync(1000);
    await p2;

    expect(executionTimes.length).toBe(2);
    expect(executionTimes[1] - executionTimes[0]).toBeGreaterThanOrEqual(1000);
  });

  describe("Hợp nhất kết quả trùng (G1, G2, G3, G4)", () => {
    it("G1: hai kết quả Đà Lạt cùng tên, cùng vn, cách nhau ~1.9km -> HỢP NHẤT thành 1 ứng viên (chọn importance 0.6)", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            place_id: 1,
            class: "boundary",
            type: "administrative",
            display_name: "Đà Lạt, Lâm Đồng, Việt Nam",
            lat: "11.9404",
            lon: "108.4583",
            importance: 0.6,
            address: { country_code: "vn" },
          },
          {
            place_id: 2,
            class: "place",
            type: "city",
            display_name: "Đà Lạt, Lâm Đồng, Việt Nam",
            lat: "11.9465",
            lon: "108.4419",
            importance: 0.55,
            address: { country_code: "vn" },
          },
        ],
      })) as any;

      const res = await geocodeDestination("Đà Lạt Mock G1", {
        skipCache: true,
        fetchFn: mockFetch,
      });

      expect(res.status).toBe("thanh_cong");
      if (res.status === "thanh_cong") {
        expect(res.ungVien.length).toBe(1);
        expect(res.diemDen.toaDo.lat).toBe(11.9404);
        expect(res.diemDen.toaDo.lng).toBe(108.4583);
        expect(res.ungVien[0].importance).toBe(0.6);
      }
    });

    it("G2: hai kết quả cùng tên 'Victoria' nhưng country_code 'ca' và 'au' -> 2 ứng viên, can_lam_ro", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            place_id: 11,
            type: "city",
            display_name: "Victoria, BC, Canada",
            lat: "48.4284",
            lon: "-123.3656",
            importance: 0.7,
            address: { country_code: "ca" },
          },
          {
            place_id: 12,
            type: "administrative",
            display_name: "Victoria, Australia",
            lat: "-37.4713",
            lon: "144.7852",
            importance: 0.8,
            address: { country_code: "au" },
          },
        ],
      })) as any;

      const res = await geocodeDestination("Victoria Mock G2", {
        skipCache: true,
        fetchFn: mockFetch,
      });

      expect(res.status).toBe("can_lam_ro");
      expect(res.ungVien.length).toBe(2);
    });

    it("G3: hai kết quả cùng tên, cùng country_code 'vn', tọa độ cách nhau 122 km -> 2 ứng viên, can_lam_ro", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            place_id: 21,
            type: "city",
            display_name: "Thị trấn X, Tỉnh A, Việt Nam",
            lat: "12.0",
            lon: "108.0",
            importance: 0.5,
            address: { country_code: "vn" },
          },
          {
            place_id: 22,
            type: "city",
            display_name: "Thị trấn X, Tỉnh B, Việt Nam",
            lat: "13.1",
            lon: "108.0",
            importance: 0.5,
            address: { country_code: "vn" },
          },
        ],
      })) as any;

      const res = await geocodeDestination("Thị trấn X Mock G3", {
        skipCache: true,
        fetchFn: mockFetch,
      });

      expect(res.status).toBe("can_lam_ro");
      expect(res.ungVien.length).toBe(2);
    });

    it("G4: một kết quả duy nhất -> 1 ứng viên, không hỏi lại", async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            place_id: 31,
            type: "city",
            display_name: "Đà Nẵng, Việt Nam",
            lat: "16.0685",
            lon: "108.2240",
            importance: 0.85,
            address: { country_code: "vn" },
          },
        ],
      })) as any;

      const res = await geocodeDestination("Đà Nẵng Mock G4", {
        skipCache: true,
        fetchFn: mockFetch,
      });

      expect(res.status).toBe("thanh_cong");
      if (res.status === "thanh_cong") {
        expect(res.ungVien.length).toBe(1);
        expect(res.diemDen.ten).toBe("Đà Nẵng");
      }
    });
  });
});
