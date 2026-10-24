/**
 * src/data/live/tyGiaClient.ts
 *
 * Client lấy tỷ giá hối đoái ngoại tệ sang VND qua Exchange Rate API (miễn phí, không cần key).
 * Endpoint: https://open.er-api.com/v6/latest/USD
 * Cache đến thời điểm cập nhật tiếp theo (time_next_update_unix).
 * Nếu lỗi mạng hoặc 429: fallback dùng cache gần nhất (gắn nhãn ngày), nếu không có thì báo "chưa có tỷ giá".
 * Nguồn bắt buộc ghi nhận: "Rates By Exchange Rate API" (https://www.exchangerate-api.com).
 */

import fs from "node:fs";
import path from "node:path";

export interface ExchangeRateInfo {
  tyGia: number;               // 1 đơn vị ngoại tệ = bao nhiêu VND
  ngayTyGia: string;           // YYYY-MM-DD
  nguon: "Rates By Exchange Rate API";
  laCacheCu?: boolean;
}

interface CacheFormat {
  rates: Record<string, number>; // base USD: rates[CODE] = số CODE trên 1 USD
  timeNextUpdateUnix: number;    // giây
  lastUpdateDate: string;        // YYYY-MM-DD
  fetchedAtMs: number;
}

const CACHE_FILE = path.join(process.cwd(), ".cache", "data", "exchange_rates.json");

export function readExchangeCache(): CacheFormat | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) as CacheFormat;
  } catch {
    return null;
  }
}

export function writeExchangeCache(cache: CacheFormat): void {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

/**
 * Lấy tỷ giá quy đổi 1 đơn vị `tienTe` sang VND
 */
export async function layTyGiaSangVND(
  tienTe: string,
  options?: { fetchFn?: typeof fetch; forceRefresh?: boolean }
): Promise<ExchangeRateInfo> {
  const code = tienTe.toUpperCase().trim();
  const today = new Date().toISOString().slice(0, 10);

  if (code === "VND") {
    return {
      tyGia: 1,
      ngayTyGia: today,
      nguon: "Rates By Exchange Rate API",
    };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const cache = readExchangeCache();

  // Kiểm tra cache còn hạn
  if (cache && !options?.forceRefresh && cache.timeNextUpdateUnix > nowSec) {
    const rateVND = cache.rates["VND"];
    const rateTarget = cache.rates[code];

    if (rateVND && rateTarget) {
      const tyGia = rateVND / rateTarget;
      return {
        tyGia,
        ngayTyGia: cache.lastUpdateDate,
        nguon: "Rates By Exchange Rate API",
        laCacheCu: false,
      };
    }
  }

  // Gọi API mạng
  const fetcher = options?.fetchFn ?? fetch;
  try {
    const res = await fetcher("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.result !== "success" || !data.rates) {
      throw new Error("Dữ liệu tỷ giá không hợp lệ");
    }

    const rates = data.rates as Record<string, number>;
    const timeNextUpdateUnix = data.time_next_update_unix || nowSec + 86400;
    const updateDate = data.time_last_update_utc
      ? new Date(data.time_last_update_utc).toISOString().slice(0, 10)
      : today;

    const newCache: CacheFormat = {
      rates,
      timeNextUpdateUnix,
      lastUpdateDate: updateDate,
      fetchedAtMs: Date.now(),
    };
    writeExchangeCache(newCache);

    const rateVND = rates["VND"];
    const rateTarget = rates[code];
    if (rateVND && rateTarget) {
      return {
        tyGia: rateVND / rateTarget,
        ngayTyGia: updateDate,
        nguon: "Rates By Exchange Rate API",
        laCacheCu: false,
      };
    }
    throw new Error(`Không tìm thấy mã tiền tệ ${code}`);
  } catch {
    // Khi lỗi mạng hoặc 429: fallback sang cache gần nhất nếu có
    if (cache && cache.rates["VND"] && cache.rates[code]) {
      const tyGia = cache.rates["VND"] / cache.rates[code];
      return {
        tyGia,
        ngayTyGia: cache.lastUpdateDate,
        nguon: "Rates By Exchange Rate API",
        laCacheCu: true,
      };
    }
    throw new Error("chưa có tỷ giá");
  }
}
