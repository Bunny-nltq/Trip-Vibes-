/**
 * src/data/live/geocodeClient.ts
 *
 * Client Nominatim Geocoding API (OpenStreetMap).
 * - Sử dụng endpoint: https://nominatim.openstreetmap.org/search
 * - Tham số: format=jsonv2, limit=3, addressdetails=1, accept-language=vi
 * - User-Agent định danh: bắt buộc hợp lệ (phải có email/URL thực tế, KHÔNG chấp nhận .local hoặc example)
 * - TỐI ĐA 1 yêu cầu mỗi giây (sequential queue rate-limited)
 * - Cache file trên đĩa 30 ngày (TTL 30 days)
 * - Thử lại khi 0 kết quả:
 *   (a) q gốc (accept-language=vi)
 *   (b) q + ", Việt Nam" (accept-language=vi)
 *   (c) q gốc (bỏ accept-language)
 *   (Gặp 403 hoặc 429 thì dừng ngay, báo lỗi rõ và không thử dồn)
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

export function validateNominatimUserAgent(ua?: string): string {
  if (!ua || !ua.trim()) {
    throw new Error(
      "Thiếu biến môi trường NOMINATIM_USER_AGENT. Vui lòng cấu hình User-Agent định danh theo chính sách của OpenStreetMap Nominatim."
    );
  }
  const trimmed = ua.trim();
  const lower = trimmed.toLowerCase();
  const hasContact = trimmed.includes("@") || trimmed.includes("http://") || trimmed.includes("https://");
  const hasForbidden = lower.includes(".local") || lower.includes("example");

  if (!hasContact || hasForbidden) {
    throw new Error(
      "NOMINATIM_USER_AGENT không hợp lệ: Phải chứa thông tin liên hệ thực tế (email hoặc URL hợp lệ, không chấp nhận tên miền .local hoặc example). Cách sửa: cấu hình ví dụ 'TripVibes/1.0 (contact@tripvibes.vn)' trong .env.local"
    );
  }
  return trimmed;
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
    // ignore
  }
}

// ─── Parser Nominatim Raw Item ───────────────────────────────────────────────

export function parseNominatimItem(item: any, nowIso: string = new Date().toISOString()): GeocodeCandidate {
  const address = item.address || {};
  const countryCode = (address.country_code || "vn").toUpperCase();
  const country = address.country || (countryCode === "VN" ? "Việt Nam" : countryCode);

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

function normalizePlaceName(s: string): string {
  return s
    .toLowerCase()
    .replace(/^thành phố\s+/i, "")
    .replace(/^đặc khu\s+/i, "")
    .replace(/^tỉnh\s+/i, "")
    .replace(/^quận\s+/i, "")
    .replace(/^huyện\s+/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
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
  const userAgent = validateNominatimUserAgent(process.env.NOMINATIM_USER_AGENT);
  const fetcher = options?.fetchFn ?? fetch;

  // 3. Thực hiện thử lần lượt:
  // (a) q gốc (accept-language=vi)
  // (b) q + ", Việt Nam" (accept-language=vi)
  // (c) q gốc (bỏ accept-language)
  const attempts = [
    {
      url: `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=jsonv2&limit=3&addressdetails=1&accept-language=vi`,
      desc: "q gốc vi",
    },
    {
      url: `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery + ", Việt Nam")}&format=jsonv2&limit=3&addressdetails=1&accept-language=vi`,
      desc: "q + Việt Nam vi",
    },
    {
      url: `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=jsonv2&limit=3&addressdetails=1`,
      desc: "q gốc no-lang",
    },
  ];

  let rawData: any[] = [];

  for (const att of attempts) {
    const data = await scheduleRateLimited(async () => {
      const res = await fetcher(att.url, {
        headers: {
          "User-Agent": userAgent,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (res.status === 403 || res.status === 429) {
        throw new Error(
          `Nominatim API từ chối truy cập (HTTP ${res.status}: ${res.statusText}). Đã dừng để tránh gửi dồn yêu cầu.`
        );
      }

      if (!res.ok) {
        throw new Error(`Nominatim API returned HTTP ${res.status}: ${res.statusText}`);
      }

      return res.json();
    });

    if (Array.isArray(data) && data.length > 0) {
      rawData = data;
      break;
    }
  }

  if (rawData.length === 0) {
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
  // Mơ hồ khi các ứng viên thuộc các quốc gia khác nhau
  const distinctCountries = new Set(ungVien.map((u) => u.maQuocGia));
  let isAmbiguous = distinctCountries.size > 1;

  if (!isAmbiguous && ungVien.length > 1) {
    // Nếu cùng quốc gia: kiểm tra xem có phải cùng tên thành phố/địa danh không
    const normalizedNames = new Set(ungVien.map((u) => normalizePlaceName(u.ten)));
    if (normalizedNames.size > 1) {
      // Tên chuẩn hóa khác nhau -> Có nhiều địa danh khác nhau cùng từ khóa tìm kiếm
      isAmbiguous = true;
    }
  }

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

  // Chọn ứng viên ưu tiên nhất: ưu tiên city/administrative hơn historic
  const sorted = [...ungVien].sort((a, b) => {
    const score = (u: GeocodeCandidate) => (u.loai === "city" || u.loai === "administrative" ? 2 : 1);
    return score(b) - score(a);
  });

  const primary = sorted[0];
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
