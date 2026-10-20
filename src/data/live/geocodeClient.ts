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
import { khoangCachKm } from "@/core/haversine";

export interface GeocodeCandidate {
  ten: string;
  quocGia: string;
  maQuocGia: string;
  toaDo: { lat: number; lng: number };
  tienTe: string;
  loai: string;
  moTa: string;
  importance?: number;
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
  const countryCode = (address.country_code || item.country_code || "vn").toUpperCase();
  const country = address.country || (countryCode === "VN" ? "Việt Nam" : countryCode);

  const name =
    item.name ||
    address.city ||
    address.town ||
    address.municipality ||
    address.state ||
    (item.display_name ? item.display_name.split(",")[0].trim() : "Điểm đến");

  const rawImportance = item.importance;
  const importance =
    typeof rawImportance === "number"
      ? rawImportance
      : typeof rawImportance === "string"
      ? parseFloat(rawImportance) || 0
      : 0;

  return {
    ten: name,
    quocGia: country,
    maQuocGia: countryCode,
    toaDo: {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    },
    tienTe: suyRaTienTeTuMaQuocGia(countryCode),
    loai: item.type || item.class || "place",
    moTa: item.display_name || name,
    importance,
    nguon: "nominatim",
    ngayLay: nowIso,
  };
}

export function chuanHoaTen(tenHoacDisplayName: string): string {
  const first = tenHoacDisplayName.split(",")[0].trim().toLowerCase();
  const noDiacritics = first
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

  return noDiacritics
    .replace(/^(thanh pho|dac khu|tinh|quan|huyen|thi xa|thi tran|city of)\s+/i, "")
    .trim();
}

export function getLoaiPriority(loai: string): number {
  const l = loai.toLowerCase();
  if (l === "city") return 4;
  if (l === "town") return 3;
  if (l === "administrative") return 2;
  if (l === "village") return 1;
  return 0;
}

export function chonUngVienTotHon(a: GeocodeCandidate, b: GeocodeCandidate): GeocodeCandidate {
  const impA = a.importance ?? 0;
  const impB = b.importance ?? 0;
  if (impA > impB) return a;
  if (impB > impA) return b;
  const prioA = getLoaiPriority(a.loai);
  const prioB = getLoaiPriority(b.loai);
  if (prioA >= prioB) return a;
  return b;
}

export function hopNhatUngVien(danhSach: GeocodeCandidate[]): GeocodeCandidate[] {
  const ketQua: GeocodeCandidate[] = [];

  for (const cand of danhSach) {
    const tenCand = chuanHoaTen(cand.moTa || cand.ten);
    let daHopNhat = false;

    for (let i = 0; i < ketQua.length; i++) {
      const existing = ketQua[i];
      const tenExist = chuanHoaTen(existing.moTa || existing.ten);

      const cungQuocGia = cand.maQuocGia.toUpperCase() === existing.maQuocGia.toUpperCase();
      const cungTen = tenCand === tenExist;
      const cachNhauKm = khoangCachKm(cand.toaDo, existing.toaDo);

      if (cungQuocGia && cungTen && cachNhauKm <= 25) {
        ketQua[i] = chonUngVienTotHon(existing, cand);
        daHopNhat = true;
        break;
      }
    }

    if (!daHopNhat) {
      ketQua.push(cand);
    }
  }

  return ketQua.slice(0, 3);
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
  const rawCandidates: GeocodeCandidate[] = rawData.map((item) => parseNominatimItem(item, nowIso));
  const ungVien = hopNhatUngVien(rawCandidates);

  if (ungVien.length === 0) {
    const result: GeocodeResult = {
      status: "khong_tim_thay",
      ungVien: [],
      nguon: "OpenStreetMap contributors",
    };
    writeCache(cleanQuery, result);
    return result;
  }

  // Nếu sau khi hợp nhất vẫn còn từ 2 ứng viên khác nhau -> cần làm rõ
  if (ungVien.length >= 2) {
    const result: GeocodeResult = {
      status: "can_lam_ro",
      lyDo: "diem_den_mo_ho",
      ungVien,
      nguon: "OpenStreetMap contributors",
    };
    writeCache(cleanQuery, result);
    return result;
  }

  // 1 ứng viên duy nhất -> Thành công!
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
