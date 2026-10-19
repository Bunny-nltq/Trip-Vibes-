import { describe, it, expect } from "vitest";
import {
  layTyGiaSangVND,
  writeExchangeCache,
} from "./tyGiaClient";

describe("tyGiaClient", () => {
  it("tỷ giá hết hạn khi mạng lỗi thì dùng cache và gắn nhãn ngày", async () => {
    // Giả lập cache cũ đã hết hạn
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 giờ trước
    writeExchangeCache({
      rates: {
        USD: 1,
        VND: 25400,
        THB: 36,
      },
      timeNextUpdateUnix: expiredTimestamp,
      lastUpdateDate: "2026-10-15",
      fetchedAtMs: Date.now() - 3600000,
    });

    // Mock mạng bị lỗi (500 hoặc 429)
    const failingFetch = async () => {
      throw new Error("429 Too Many Requests");
    };

    const res = await layTyGiaSangVND("USD", { fetchFn: failingFetch as any });
    expect(res.tyGia).toBe(25400);
    expect(res.ngayTyGia).toBe("2026-10-15");
    expect(res.laCacheCu).toBe(true);
    expect(res.nguon).toBe("Rates By Exchange Rate API");
  });
});
