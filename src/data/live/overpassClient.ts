/**
 * src/data/live/overpassClient.ts
 *
 * Gọi Overpass API công khai để lấy dữ liệu OSM theo toạ độ điểm đến bất kỳ:
 * - OVERPASS_ENDPOINTS: Đọc từ biến môi trường (phân tách dấu phẩy) hoặc mặc định:
 *   https://overpass-api.de/api/interpreter, https://overpass.private.coffee/api/interpreter, https://maps.mail.ru/osm/tools/overpass/api/interpreter
 * - Retry: Khi timeout, 429, 502, 503, 504: thử lại tối đa 2 lần mỗi server (chờ 2s rồi 5s) trước khi sang server kế tiếp.
 * - Chỉ chạy TUẦN TỰ, tối đa 1 truy vấn cùng lúc. Mỗi truy vấn [timeout:25].
 * - Tách thành 4 truy vấn riêng: KS (5km), Quán ăn (5km), Cafe (5km), Tham quan (20km).
 *   Nếu 1 loại trả 0 phần tử, mở rộng gấp đôi bán kính MỘT lần.
 * - Cache TỪNG LOẠI riêng: hash(lat, lng, radius, loai), TTL 168 giờ.
 * - Nếu 1 máy chủ trả 0 phần tử thì thử máy chủ kế tiếp trước khi kết luận là 0.
 * - Log rõ máy chủ nào đã trả kết quả và số lần thử.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { KhachSan, QuanAn, Cafe, HoatDong, Preference } from "@/contracts";
import { buildMapsUrls } from "@/core/maps";
import { CAFE_MAC_DINH_MOI_NGUOI } from "@/core/assumptions";

const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ||
  "TripVibes/1.0 (https://github.com/TripVibes; educational project)";
const CACHE_TTL_MS = 168 * 60 * 60 * 1000; // 168 giờ
const MAX_PER_TYPE = 15;

export const DEFAULT_OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

export function getOverpassEndpoints(): string[] {
  const envEndpoints = process.env.OVERPASS_ENDPOINTS;
  if (envEndpoints && envEndpoints.trim()) {
    const list = envEndpoints
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    if (list.length > 0) return list;
  }
  return DEFAULT_OVERPASS_ENDPOINTS;
}

export interface OverpassExecutionStats {
  server: string;
  attempts: number;
  status: number | string;
  durationMs: number;
  itemCount: number;
  loai: string;
  error?: string;
}

export const lastOverpassStats: OverpassExecutionStats[] = [];

export function getLastOverpassStatsSummary(): string {
  if (lastOverpassStats.length === 0) return "Chưa có lượt gọi Overpass nào.";
  return lastOverpassStats
    .map(
      (s) =>
        `[${s.loai}] Server: ${s.server} (${s.attempts} lần thử, status: ${s.status}, ${s.itemCount} mục)`
    )
    .join("; ");
}

function getCacheDir(): string {
  const dir = path.join(process.cwd(), ".cache", "data");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getCacheKey(
  lat: number,
  lng: number,
  radiusM: number,
  loai: string
): string {
  return crypto
    .createHash("sha256")
    .update(`${lat.toFixed(4)},${lng.toFixed(4)}_${radiusM}_${loai}`)
    .digest("hex");
}

function getCachePath(key: string): string {
  return path.join(getCacheDir(), `osm_${key}.json`);
}

function readCache<T>(
  key: string,
  loaiKey?: string,
  lat?: number,
  lng?: number
): T | null {
  const p = getCachePath(key);
  if (fs.existsSync(p)) {
    const stat = fs.statSync(p);
    if (Date.now() - stat.mtimeMs <= CACHE_TTL_MS) {
      try {
        return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
      } catch {
        // ignore
      }
    }
  }

  // Tương thích ngược với file cache cũ: osm_hotels.json, osm_restaurants.json, osm_cafes.json, osm_attractions.json
  if (loaiKey && lat !== undefined && lng !== undefined) {
    const isNearDaNang =
      Math.abs(lat - 16.0685) < 0.25 && Math.abs(lng - 108.224) < 0.25;
    if (isNearDaNang) {
      const legacyMap: Record<string, string> = {
        hotels: "osm_hotels.json",
        restaurants: "osm_restaurants.json",
        cafes: "osm_cafes.json",
        attractions: "osm_attractions.json",
      };
      const legacyFile = legacyMap[loaiKey];
      if (legacyFile) {
        const legacyPath = path.join(getCacheDir(), legacyFile);
        if (fs.existsSync(legacyPath)) {
          try {
            return JSON.parse(fs.readFileSync(legacyPath, "utf-8")) as T;
          } catch {
            // ignore
          }
        }
      }
    }
  }

  return null;
}

function writeCache(key: string, data: unknown): void {
  try {
    fs.writeFileSync(getCachePath(key), JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OsmResponse {
  elements: OsmElement[];
}

// ─── Queue Tuần tự 1 truy vấn cùng lúc ────────────────────────────────────────

let queryQueue: Promise<unknown> = Promise.resolve();

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function queryOverpass(
  ql: string,
  cacheKey: string,
  loai: string,
  loaiKey?: string,
  toaDo?: { lat: number; lng: number }
): Promise<OsmElement[]> {
  const cached = readCache<OsmElement[]>(cacheKey, loaiKey, toaDo?.lat, toaDo?.lng);
  if (cached) {
    console.log(`[Overpass] [${loai}] Lấy từ cache (${cached.length} phần tử).`);
    return cached;
  }

  const runQuery = async (): Promise<OsmElement[]> => {
    const doubleCheck = readCache<OsmElement[]>(cacheKey, loaiKey, toaDo?.lat, toaDo?.lng);
    if (doubleCheck) return doubleCheck;

    const body = `[out:json][timeout:25];\n${ql}\nout center 50;`;
    const endpoints = getOverpassEndpoints();
    let bestElements: OsmElement[] = [];

    for (const endpoint of endpoints) {
      let serverAttempts = 0;
      const retryDelays = [2000, 5000];

      for (let attempt = 1; attempt <= 3; attempt++) {
        serverAttempts = attempt;
        const startTime = Date.now();
        try {
          // Giãn cách nhẹ giữa các cuộc gọi mạng
          await sleep(500);

          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": USER_AGENT,
            },
            body: `data=${encodeURIComponent(body)}`,
            signal: AbortSignal.timeout(8000),
          });

          const durationMs = Date.now() - startTime;

          // Nếu gặp mã lỗi có thể retry: 429, 502, 503, 504
          if (
            response.status === 429 ||
            response.status === 502 ||
            response.status === 503 ||
            response.status === 504
          ) {
            console.warn(
              `[Overpass] [${loai}] ${endpoint} trả HTTP ${response.status} (lần ${attempt}).`
            );
            if (attempt <= 2) {
              const delay = retryDelays[attempt - 1] ?? 5000;
              await sleep(delay);
              continue;
            }
            break; // Chuyển máy chủ kế tiếp
          }

          if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
          }

          const json = (await response.json()) as OsmResponse;
          const elements = json.elements ?? [];

          // Nếu máy chủ trả 0 phần tử, thử máy chủ kế tiếp trước khi kết luận là 0
          if (elements.length === 0 && endpoints.indexOf(endpoint) < endpoints.length - 1) {
            console.warn(
              `[Overpass] [${loai}] ${endpoint} trả 0 phần tử, đang thử máy chủ kế tiếp...`
            );
            lastOverpassStats.push({
              server: endpoint,
              attempts: attempt,
              status: response.status,
              durationMs,
              itemCount: 0,
              loai,
            });
            break; // chuyển sang endpoint kế tiếp
          }

          // Thành công có kết quả hoặc là máy chủ cuối cùng
          console.log(
            `[Overpass] [${loai}] Thành công từ ${endpoint} (lần thử ${attempt}, ${durationMs}ms, ${elements.length} phần tử).`
          );

          lastOverpassStats.push({
            server: endpoint,
            attempts: attempt,
            status: response.status,
            durationMs,
            itemCount: elements.length,
            loai,
          });

          writeCache(cacheKey, elements);
          return elements;
        } catch (err: unknown) {
          const durationMs = Date.now() - startTime;
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.warn(
            `[Overpass] [${loai}] Lỗi kết nối tới ${endpoint} (lần ${attempt}): ${errorMsg}`
          );

          if (attempt <= 2) {
            const delay = retryDelays[attempt - 1] ?? 5000;
            await sleep(delay);
            continue;
          }

          lastOverpassStats.push({
            server: endpoint,
            attempts: attempt,
            status: "ERR",
            durationMs,
            itemCount: 0,
            loai,
            error: errorMsg,
          });
          break; // chuyển sang endpoint kế tiếp
        }
      }
    }

    return bestElements;
  };

  const currentRun = queryQueue.then(runQuery);
  queryQueue = currentRun.then(() => {}, () => {});
  return currentRun as Promise<OsmElement[]>;
}

function getCoord(
  el: OsmElement,
  defaultCoord: { lat: number; lng: number }
): { lat: number; lng: number } {
  if (el.lat !== undefined && el.lon !== undefined) {
    return { lat: el.lat, lng: el.lon };
  }
  if (el.center) {
    return { lat: el.center.lat, lng: el.center.lon };
  }
  return defaultCoord;
}

function getOsmId(el: OsmElement): string {
  return `osm:${el.type}:${el.id}`;
}

function richness(el: OsmElement): number {
  return Object.keys(el.tags ?? {}).length;
}

function sortByRichness(els: OsmElement[]): OsmElement[] {
  return [...els].sort((a, b) => richness(b) - richness(a));
}

function extractKhuVuc(tags: Record<string, string>): string {
  return tags["addr:suburb"] ?? tags["addr:district"] ?? "Trung tâm";
}

const NOW_ISO = () => new Date().toISOString();

// ─── Khách sạn (5 km ban đầu, nhân đôi nếu 0) ─────────────────────────────────

export async function fetchKhachSansOSM(
  toaDo: { lat: number; lng: number },
  tenDiemDen: string = ""
): Promise<KhachSan[]> {
  let radius = 5000;
  let ql = `
(
  node["tourism"~"hotel|hostel|guest_house"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  way["tourism"~"hotel|hostel|guest_house"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  relation["tourism"~"hotel|hostel|guest_house"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
);`;

  let cacheKey = getCacheKey(toaDo.lat, toaDo.lng, radius, "hotels");
  let elements = await queryOverpass(ql, cacheKey, "khach_san", "hotels", toaDo);

  // Nếu 0 phần tử, mở rộng bán kính gấp đôi 1 lần (10.000m)
  if (elements.length === 0) {
    radius = 10000;
    ql = `
(
  node["tourism"~"hotel|hostel|guest_house"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  way["tourism"~"hotel|hostel|guest_house"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  relation["tourism"~"hotel|hostel|guest_house"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
);`;
    cacheKey = getCacheKey(toaDo.lat, toaDo.lng, radius, "hotels");
    elements = await queryOverpass(ql, cacheKey, "khach_san_expanded", "hotels", toaDo);
  }

  const filtered = sortByRichness(elements.filter((el) => el.tags?.name)).slice(
    0,
    MAX_PER_TYPE
  );

  const ngayLay = NOW_ISO();

  return filtered.map((el): KhachSan => {
    const tags = el.tags ?? {};
    const coord = getCoord(el, toaDo);
    const stars = tags.stars ? parseInt(tags.stars, 10) : null;
    const ten = tags.name ?? "Khách sạn";

    return {
      id: getOsmId(el),
      osmId: getOsmId(el),
      ten,
      khuVuc: extractKhuVuc(tags),
      diaChi: tags["addr:street"]
        ? `${tags["addr:housenumber"] ?? ""} ${tags["addr:street"]}`.trim()
        : null,
      toaDo: coord,
      loai: "khach_san",
      gioMoCua: null,
      soSao: Number.isNaN(stars) ? null : stars,
      giaUocTinhNguoi: null,
      nguon: getOsmId(el),
      ngayLay,
      doTinCay: "tham_khao",
      giaLaUocTinh: true,
      khoangGiaDemVND: null,
      includesBreakfast: false,
      hasPool: false,
      mapsUrls: buildMapsUrls({ ten, toaDo: coord }, tenDiemDen),
      nguonGia: [],
    };
  });
}

// ─── Quán ăn (5 km ban đầu, nhân đôi nếu 0) ───────────────────────────────────

export async function fetchQuanAnsOSM(
  toaDo: { lat: number; lng: number },
  tenDiemDen: string = ""
): Promise<QuanAn[]> {
  let radius = 5000;
  let ql = `
(
  node["amenity"="restaurant"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  way["amenity"="restaurant"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  node["amenity"="food_court"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
);`;

  let cacheKey = getCacheKey(toaDo.lat, toaDo.lng, radius, "restaurants");
  let elements = await queryOverpass(ql, cacheKey, "quan_an", "restaurants", toaDo);

  // Nếu 0 phần tử, mở rộng gấp đôi (10.000m)
  if (elements.length === 0) {
    radius = 10000;
    ql = `
(
  node["amenity"="restaurant"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  way["amenity"="restaurant"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  node["amenity"="food_court"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
);`;
    cacheKey = getCacheKey(toaDo.lat, toaDo.lng, radius, "restaurants");
    elements = await queryOverpass(ql, cacheKey, "quan_an_expanded", "restaurants", toaDo);
  }

  const filtered = sortByRichness(elements.filter((el) => el.tags?.name)).slice(
    0,
    MAX_PER_TYPE
  );

  const ngayLay = NOW_ISO();

  return filtered.map((el): QuanAn => {
    const tags = el.tags ?? {};
    const coord = getCoord(el, toaDo);
    const ten = tags.name ?? "Quán ăn";

    return {
      id: getOsmId(el),
      osmId: getOsmId(el),
      ten,
      khuVuc: extractKhuVuc(tags),
      diaChi: tags["addr:street"]
        ? `${tags["addr:housenumber"] ?? ""} ${tags["addr:street"]}`.trim()
        : null,
      toaDo: coord,
      loai: "quan_an",
      gioMoCua: tags.opening_hours ?? null,
      soSao: null,
      giaUocTinhNguoi: null,
      nguon: getOsmId(el),
      ngayLay,
      doTinCay: "tham_khao",
      giaLaUocTinh: true,
      amThuc: tags.cuisine ?? null,
    };
  });
}

// ─── Cafe (5 km ban đầu, nhân đôi nếu 0) ──────────────────────────────────────

export async function fetchCafesOSM(
  toaDo: { lat: number; lng: number },
  tenDiemDen: string = ""
): Promise<Cafe[]> {
  let radius = 5000;
  let ql = `
(
  node["amenity"="cafe"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  way["amenity"="cafe"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
);`;

  let cacheKey = getCacheKey(toaDo.lat, toaDo.lng, radius, "cafes");
  let elements = await queryOverpass(ql, cacheKey, "cafe", "cafes", toaDo);

  // Nếu 0 phần tử, mở rộng gấp đôi (10.000m)
  if (elements.length === 0) {
    radius = 10000;
    ql = `
(
  node["amenity"="cafe"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  way["amenity"="cafe"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
);`;
    cacheKey = getCacheKey(toaDo.lat, toaDo.lng, radius, "cafes");
    elements = await queryOverpass(ql, cacheKey, "cafe_expanded", "cafes", toaDo);
  }

  const filtered = sortByRichness(elements.filter((el) => el.tags?.name)).slice(
    0,
    MAX_PER_TYPE
  );

  const ngayLay = NOW_ISO();

  return filtered.map((el): Cafe => {
    const tags = el.tags ?? {};
    const coord = getCoord(el, toaDo);
    const ten = tags.name ?? "Quán cà phê";

    return {
      id: getOsmId(el),
      osmId: getOsmId(el),
      ten,
      khuVuc: extractKhuVuc(tags),
      diaChi: tags["addr:street"]
        ? `${tags["addr:housenumber"] ?? ""} ${tags["addr:street"]}`.trim()
        : null,
      toaDo: coord,
      loai: "cafe",
      gioMoCua: tags.opening_hours ?? null,
      soSao: null,
      giaUocTinhNguoi: CAFE_MAC_DINH_MOI_NGUOI,
      nguon: getOsmId(el),
      ngayLay,
      doTinCay: "tham_khao",
      giaLaUocTinh: true,
    };
  });
}

// ─── Hoạt động / Điểm tham quan (20 km ban đầu, nhân đôi nếu 0) ──────────────

const ATTRACTION_NHAN: Record<string, Preference[]> = {
  attraction: ["giai_tri_vui_choi"],
  museum: ["van_hoa_lich_su"],
  viewpoint: ["check_in_chup_anh", "bien"],
  beach: ["bien"],
  theme_park: ["giai_tri_vui_choi"],
  gallery: ["van_hoa_lich_su"],
};

export async function fetchHoatDongsOSM(
  toaDo: { lat: number; lng: number },
  tenDiemDen: string = ""
): Promise<HoatDong[]> {
  let radius = 20000;
  let ql = `
(
  node["tourism"~"attraction|museum|viewpoint|theme_park|gallery"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  way["tourism"~"attraction|museum|viewpoint|theme_park|gallery"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  node["natural"="beach"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  way["natural"="beach"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
);`;

  let cacheKey = getCacheKey(toaDo.lat, toaDo.lng, radius, "attractions");
  let elements = await queryOverpass(ql, cacheKey, "hoat_dong", "attractions", toaDo);

  // Nếu 0 phần tử, mở rộng gấp đôi (40.000m)
  if (elements.length === 0) {
    radius = 40000;
    ql = `
(
  node["tourism"~"attraction|museum|viewpoint|theme_park|gallery"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  way["tourism"~"attraction|museum|viewpoint|theme_park|gallery"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  node["natural"="beach"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  way["natural"="beach"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
);`;
    cacheKey = getCacheKey(toaDo.lat, toaDo.lng, radius, "attractions");
    elements = await queryOverpass(ql, cacheKey, "hoat_dong_expanded", "attractions", toaDo);
  }

  const filtered = sortByRichness(elements.filter((el) => el.tags?.name)).slice(
    0,
    MAX_PER_TYPE
  );

  const ngayLay = NOW_ISO();

  return filtered.map((el): HoatDong => {
    const tags = el.tags ?? {};
    const coord = getCoord(el, toaDo);
    const loaiOsm = tags.tourism ?? tags.natural ?? "attraction";
    const nhan: Preference[] = ATTRACTION_NHAN[loaiOsm] ?? ["giai_tri_vui_choi"];
    const ten = tags.name ?? "Điểm tham quan";
    const fee = tags.fee === "yes" ? 50_000 : 0;

    return {
      id: getOsmId(el),
      osmId: getOsmId(el),
      ten,
      khuVuc: extractKhuVuc(tags),
      diaChi: null,
      toaDo: coord,
      loai: loaiOsm,
      gioMoCua: tags.opening_hours ?? null,
      soSao: null,
      giaUocTinhNguoi: fee,
      nguon: getOsmId(el),
      ngayLay,
      doTinCay: "tham_khao",
      giaLaUocTinh: false,
      giaVeNguoi: fee,
      thoiLuongPhut: loaiOsm === "beach" ? 120 : 90,
      nhan,
      dongNguoi: loaiOsm === "beach" || loaiOsm === "theme_park",
      diBoNhieu: loaiOsm === "museum" || loaiOsm === "attraction",
      mapsUrls: buildMapsUrls({ ten, toaDo: coord }, tenDiemDen),
    };
  });
}
