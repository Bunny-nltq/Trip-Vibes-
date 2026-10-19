/**
 * src/data/live/geocodeClient.ts
 *
 * Client Nominatim Geocoding API (OpenStreetMap).
 * - Sử dụng endpoint: https://nominatim.openstreetmap.org/search
 * - Tham số: format=jsonv2, limit=3, addressdetails=1, accept-language=vi
 * - User-Agent định danh đọc từ biến môi trường NOMINATIM_USER_AGENT (báo lỗi nếu thiếu)
 * - TỐI ĐA 1 yêu cầu mỗi giây (sequential queue rate-limited)
 * - Cache file trên đĩa 30 ngày (TTL 30 days)
 * - Ghi nhận bản quyền: "Data © OpenStreetMap contributors"
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { DiemDen } from "@/contracts";

export interface GeocodeCandidate {
  ten: string;
  quocGia: string;
  maQuocGia: string;
  toaDo: { lat: number; lng: number };
  tienTe: string;
  loai: string;
  moTa: string;
  nguon: "nominatim";
  ngayLay: string;
}

export type GeocodeResult =
  | {
      status: "thanh_cong";
      diemDen: DiemDen;
      ungVien: GeocodeCandidate[];
      nguon: "OpenStreetMap contributors";
    }
  | {
      status: "can_lam_ro";
      lyDo: "diem_den_mo_ho";
      ungVien: GeocodeCandidate[];
      nguon: "OpenStreetMap contributors";
    }
  | {
      status: "khong_tim_thay";
      ungVien: GeocodeCandidate[];
      nguon: "OpenStreetMap contributors";
    };

const CACHE_DIR = path.join(process.cwd(), ".cache", "geocode");
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 ngày

const MA_QUOC_GIA_TIEN_TE: Record<string, string> = {
  VN: "VND",
  TH: "THB",
  KR: "KRW",
  JP: "JPY",
  US: "USD",
  SG: "SGD",
  MY: "MYR",
  ID: "IDR",
  PH: "PHP",
  CN: "CNY",
  TW: "TWD",
  HK: "HKD",
  GB: "GBP",
  EU: "EUR",
  FR: "EUR",
  DE: "EUR",
  IT: "EUR",
  AU: "AUD",
  LA: "LAK",
  KH: "KHR",
};

export function suyRaTienTeTuMaQuocGia(maQuocGia: string): string {
  const code = maQuocGia.toUpperCase();
  return MA_QUOC_GIA_TIEN_TE[code] ?? (code === "VN" ? "VND" : "USD");
}

// ─── Rate Limiter (Tối đa 1 request mỗi giây, tuần tự) ─────────────────────────

let lastRequestTime = 0;
let queuePromise: Promise<void> = Promise.resolve();

export function resetGeocodeRateLimiter(): void {
  lastRequestTime = 0;
  queuePromise = Promise.resolve();
}

export async function scheduleRateLimited<T>(fn: () => Promise<T>): Promise<T> {
  let execute: () => Promise<T>;
  const next = new Promise<T>((resolve, reject) => {
    execute = async () => {
      try {
        const now = Date.now();
        const elapsed = now - lastRequestTime;
        if (elapsed < 1000) {
          await new Promise((r) => setTimeout(r, 1000 - elapsed));
        }
        lastRequestTime = Date.now();
        const res = await fn();
        resolve(res);
        return res;
      } catch (err) {
        reject(err);
        throw err;
      }
    };
  });

  queuePromise = queuePromise.then(() => execute()).then(() => {}, () => {});
  return next;
}

// ─── Cache helpers ───────────────────────────────────────────────────────────

function getCachePath(query: string): string {
  const hash = crypto.createHash("sha256").update(query.toLowerCase().trim()).digest("hex");
  return path.join(CACHE_DIR, `${hash}.json`);
}

function readCache(query: string): GeocodeResult | null {
  try {
    const file = getCachePath(query);
    if (!fs.existsSync(file)) return null;
    const stat = fs.statSync(file);
    if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) return null;
    return JSON.parse(fs.readFileSync(file, "utf-8")) as GeocodeResult;
  } catch {
    return null;
  }
}

function writeCache(query: string, data: GeocodeResult): void {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(getCachePath(query), JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // ignore cache write error
  }
}

// ─── Parser Nominatim Raw Item ───────────────────────────────────────────────

export function parseNominatimItem(item: any, nowIso: string = new Date().toISOString()): GeocodeCandidate {
  const address = item.address || {};
  const countryCode = (address.country_code || "vn").toUpperCase();
  const country = address.country || (countryCode === "VN" ? "Việt Nam" : countryCode);
  
  // Tên điểm đến gọn: ưu tiên tên cụ thể hoặc tên thành phố/địa danh
  const name =
    item.name ||
    address.city ||
    address.town ||
    address.municipality ||
    address.state ||
    item.display_name.split(",")[0].trim();

  return {
    ten: name,
    quocGia: country,
    maQuocGia: countryCode,
    toaDo: {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    },
    tienTe: suyRaTienTeTuMaQuocGia(countryCode),
    loai: item.type || "place",
    moTa: item.display_name,
    nguon: "nominatim",
    ngayLay: nowIso,
  };
}

// ─── Main Geocode Function ───────────────────────────────────────────────────

export async function geocodeDestination(
  query: string,
  options?: { fetchFn?: typeof fetch; skipCache?: boolean }
): Promise<GeocodeResult> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return {
      status: "khong_tim_thay",
      ungVien: [],
      nguon: "OpenStreetMap contributors",
    };
  }

  // 1. Kiểm tra cache
  if (!options?.skipCache) {
    const cached = readCache(cleanQuery);
    if (cached) return cached;
  }

  // 2. Kiểm tra User-Agent
  const userAgent = process.env.NOMINATIM_USER_AGENT;
  if (!userAgent || userAgent.trim().length === 0) {
    throw new Error(
      "Thiếu biến môi trường NOMINATIM_USER_AGENT. Vui lòng cấu hình User-Agent định danh theo chính sách của OpenStreetMap Nominatim."
    );
  }

  // 3. Thực hiện gọi mạng qua Sequential Rate Limiter
  const fetcher = options?.fetchFn ?? fetch;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    cleanQuery
  )}&format=jsonv2&limit=3&addressdetails=1&accept-language=vi`;

  const rawData = await scheduleRateLimited(async () => {
    const res = await fetcher(url, {
      headers: {
        "User-Agent": userAgent,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      throw new Error(`Nominatim API returned HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  });

  if (!Array.isArray(rawData) || rawData.length === 0) {
    const result: GeocodeResult = {
      status: "khong_tim_thay",
      ungVien: [],
      nguon: "OpenStreetMap contributors",
    };
    writeCache(cleanQuery, result);
    return result;
  }

  const nowIso = new Date().toISOString();
  const ungVien: GeocodeCandidate[] = rawData.slice(0, 3).map((item) => parseNominatimItem(item, nowIso));

  // Kiểm tra mơ hồ:
  // Nếu có nhiều ứng viên và chúng khác quốc gia hoặc khác loại địa danh
  const distinctCountries = new Set(ungVien.map((u) => u.maQuocGia));
  const distinctTypes = new Set(ungVien.map((u) => u.loai));
  const isAmbiguous = ungVien.length > 1 && (distinctCountries.size > 1 || distinctTypes.size > 1);

  if (isAmbiguous) {
    const result: GeocodeResult = {
      status: "can_lam_ro",
      lyDo: "diem_den_mo_ho",
      ungVien,
      nguon: "OpenStreetMap contributors",
    };
    writeCache(cleanQuery, result);
    return result;
  }

  const primary = ungVien[0];
  const diemDen: DiemDen = {
    ten: primary.ten,
    quocGia: primary.quocGia,
    maQuocGia: primary.maQuocGia,
    toaDo: primary.toaDo,
    tienTe: primary.tienTe,
    nguon: "nominatim",
    ngayLay: primary.ngayLay,
  };

  const result: GeocodeResult = {
    status: "thanh_cong",
    diemDen,
    ungVien,
    nguon: "OpenStreetMap contributors",
  };

  writeCache(cleanQuery, result);
  return result;
}
