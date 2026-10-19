import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  geocodeDestination,
  parseNominatimItem,
  scheduleRateLimited,
  resetGeocodeRateLimiter,
} from "./geocodeClient";
import fs from "node:fs";
import path from "node:path";

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
});
