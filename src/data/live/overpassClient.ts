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
import { logger } from "@/lib/logger";

const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ||
  "TripVibes/1.0 (https://github.com/TripVibes; educational project)";
function getCacheTtlMs(): number {
  return parseInt(process.env.DATA_TTL_HOURS ?? "24", 10) * 60 * 60 * 1000;
}
const MAX_PER_TYPE = 15;

export const DEFAULT_OVERPASS_ENDPOINTS = [
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];

export interface BoundingBoxResult {
  south: number;
  north: number;
  west: number;
  east: number;
}

/**
 * Tính bounding box từ tâm và nửa cạnh vĩ độ
 * Nửa cạnh kinh độ = nuaCanhVi / cos(vĩ độ tâm)
 */
export function boundingBox(
  tam: { lat: number; lng: number },
  nuaCanhVi: number
): BoundingBoxResult {
  const south = tam.lat - nuaCanhVi;
  const north = tam.lat + nuaCanhVi;
  const cosLat = Math.cos((tam.lat * Math.PI) / 180);
  const nuaCanhKinh = nuaCanhVi / cosLat;
  const west = tam.lng - nuaCanhKinh;
  const east = tam.lng + nuaCanhKinh;

  return {
    south: Number(south.toFixed(5)),
    north: Number(north.toFixed(5)),
    west: Number(west.toFixed(5)),
    east: Number(east.toFixed(5)),
  };
}

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
  fromCache?: boolean;
  cacheAgeHours?: number;
  cacheMetadata?: CacheMetadata;
}

export const lastOverpassStats: OverpassExecutionStats[] = [];

export function getLastOverpassStatsSummary(): string {
  if (lastOverpassStats.length === 0) return "Chưa có lượt gọi Overpass nào.";
  return lastOverpassStats
    .map((s) => {
      if (s.fromCache) {
        const originServer = s.cacheMetadata?.mayChu ? ` từ ${s.cacheMetadata.mayChu}` : "";
        const runIdInfo = s.cacheMetadata?.runId ? ` [${s.cacheMetadata.runId}]` : "";
        return `[${s.loai}] Cache (${s.itemCount} mục, tuổi ${s.cacheAgeHours}h${originServer}${runIdInfo})`;
      }
      return `[${s.loai}] Server: ${s.server} (${s.attempts} lần thử, status: ${s.status}, ${s.itemCount} mục)`;
    })
    .join("; ");
}

function getCacheDir(): string {
  const dir = path.join(process.cwd(), ".cache", "data");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function clearAllOverpassCache(): void {
  const dir = getCacheDir();
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (f.startsWith("osm_") && f.endsWith(".json")) {
        try {
          fs.unlinkSync(path.join(dir, f));
        } catch {
          // ignore
        }
      }
    }
  }
}

function getCacheKey(
  lat: number,
  lng: number,
  nuaCanhVi: number,
  loai: string
): string {
  return crypto
    .createHash("sha256")
    .update(`${lat.toFixed(4)},${lng.toFixed(4)}_${nuaCanhVi.toFixed(4)}_${loai}`)
    .digest("hex");
}

function getCachePath(key: string): string {
  return path.join(getCacheDir(), `osm_${key}.json`);
}

export interface CacheMetadata {
  ngay: string;
  mayChu: string;
  runId: string;
}

export interface CacheResult<T> {
  data: T;
  ageHours: number;
  metadata?: CacheMetadata;
}

function readCacheWithInfo<T>(
  key: string,
  loaiKey?: string,
  lat?: number,
  lng?: number
): CacheResult<T> | null {
  const p = getCachePath(key);
  if (fs.existsSync(p)) {
    const stat = fs.statSync(p);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs <= getCacheTtlMs()) {
      try {
        const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
        if (raw && typeof raw === "object" && "metadata" in raw && "data" in raw) {
          return {
            data: raw.data as T,
            ageHours: ageMs / (1000 * 3600),
            metadata: raw.metadata as CacheMetadata,
          };
        }
        return { data: raw as T, ageHours: ageMs / (1000 * 3600) };
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
          const stat = fs.statSync(legacyPath);
          const ageMs = Date.now() - stat.mtimeMs;
          try {
            const raw = JSON.parse(fs.readFileSync(legacyPath, "utf-8"));
            if (raw && typeof raw === "object" && "metadata" in raw && "data" in raw) {
              return {
                data: raw.data as T,
                ageHours: ageMs / (1000 * 3600),
                metadata: raw.metadata as CacheMetadata,
              };
            }
            return { data: raw as T, ageHours: ageMs / (1000 * 3600) };
          } catch {
            // ignore
          }
        }
      }
    }
  }

  return null;
}function writeCache(
  key: string,
  data: unknown,
  mayChu: string = "unknown"
): void {
  try {
    const payload = {
      metadata: {
        ngay: new Date().toISOString(),
        mayChu,
        runId:
          process.env.RUN_ID ||
          process.env.OVERPASS_RUN_ID ||
          "run_" + new Date().toISOString().slice(0, 10),
      },
      data,
    };
    fs.writeFileSync(getCachePath(key), JSON.stringify(payload, null, 2), "utf-8");
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
  const cachedHit = readCacheWithInfo<OsmElement[]>(cacheKey, loaiKey, toaDo?.lat, toaDo?.lng);
  if (cachedHit) {
    const originInfo = cachedHit.metadata?.mayChu ? ` từ ${cachedHit.metadata.mayChu}` : "";
    logger.debug(`[Overpass] [${loai}] Lấy từ cache (${cachedHit.data.length} phần tử, tuổi: ${cachedHit.ageHours.toFixed(1)}h${originInfo}).`);
    lastOverpassStats.push({
      server: cachedHit.metadata?.mayChu || "cache",
      attempts: 0,
      status: 200,
      durationMs: 0,
      itemCount: cachedHit.data.length,
      loai,
      fromCache: true,
      cacheAgeHours: Number(cachedHit.ageHours.toFixed(1)),
      cacheMetadata: cachedHit.metadata,
    });
    return cachedHit.data;
  }

  const runQuery = async (): Promise<OsmElement[]> => {
    const doubleCheck = readCacheWithInfo<OsmElement[]>(cacheKey, loaiKey, toaDo?.lat, toaDo?.lng);
    if (doubleCheck) {
      lastOverpassStats.push({
        server: doubleCheck.metadata?.mayChu || "cache",
        attempts: 0,
        status: 200,
        durationMs: 0,
        itemCount: doubleCheck.data.length,
        loai,
        fromCache: true,
        cacheAgeHours: Number(doubleCheck.ageHours.toFixed(1)),
        cacheMetadata: doubleCheck.metadata,
      });
      return doubleCheck.data;
    }

    const body = `[out:json][timeout:20];\n${ql}\nout center qt 30;`;
    const endpoints = getOverpassEndpoints();
    const bestElements: OsmElement[] = [];

    for (const endpoint of endpoints) {
      for (let attempt = 1; attempt <= 3; attempt++) {
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
            signal: AbortSignal.timeout(30000),
          });

          const durationMs = Date.now() - startTime;

          // Nếu gặp mã lỗi có thể retry: 429, 502, 503, 504
          if (
            response.status === 429 ||
            response.status === 502 ||
            response.status === 503 ||
            response.status === 504
          ) {
            logger.debug(
              `[Overpass] [${loai}] ${endpoint} | ${durationMs}ms | 0 phần tử | status: ${response.status} (lần ${attempt})`
            );
            if (attempt <= 1) {
              await sleep(1000);
              continue;
            }
            break; // Chuyển máy chủ kế tiếp
          }

          if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
          }

          const json = (await response.json()) as OsmResponse;
          const elements = json.elements ?? [];

          // Log mỗi truy vấn: máy chủ, thời gian ms, số phần tử, status
          logger.debug(
            `[Overpass] [${loai}] ${endpoint} | ${durationMs}ms | ${elements.length} phần tử | status: ${response.status}`
          );

          // Nếu máy chủ trả 0 phần tử, thử máy chủ kế tiếp trước khi kết luận là 0
          if (elements.length === 0 && endpoints.indexOf(endpoint) < endpoints.length - 1) {
            logger.warn(
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

          lastOverpassStats.push({
            server: endpoint,
            attempts: attempt,
            status: response.status,
            durationMs,
            itemCount: elements.length,
            loai,
          });

          writeCache(cacheKey, elements, endpoint);
          return elements;
        } catch (err: unknown) {
          const durationMs = Date.now() - startTime;
          const errorMsg = err instanceof Error ? err.message : String(err);
          logger.debug(
            `[Overpass] [${loai}] ${endpoint} | ${durationMs}ms | 0 phần tử | status: ERR | lỗi: ${errorMsg} (lần ${attempt})`
          );

          // Nếu lỗi không thể kết nối mạng (fetch failed / connect timeout), chuyển ngay máy chủ khác
          const isConnectionDead =
            errorMsg.includes("fetch failed") ||
            errorMsg.includes("CONNECT_TIMEOUT") ||
            errorMsg.includes("ECONNREFUSED");

          if (!isConnectionDead && attempt <= 1) {
            await sleep(1000);
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

// ─── Khách sạn (bbox 0.03 độ, thử hộp nhỏ hơn một nửa nếu lỗi/0) ──────────────

export async function fetchKhachSansOSM(
  toaDo: { lat: number; lng: number },
  tenDiemDen: string = ""
): Promise<KhachSan[]> {
  let nuaCanhVi = 0.03;
  let b = boundingBox(toaDo, nuaCanhVi);
  let ql = `
(
  node["tourism"~"hotel|hostel|guest_house"]["name"](${b.south},${b.west},${b.north},${b.east});
  way["tourism"~"hotel|hostel|guest_house"]["name"](${b.south},${b.west},${b.north},${b.east});
);`;

  let cacheKey = getCacheKey(toaDo.lat, toaDo.lng, nuaCanhVi, "hotels");
  let elements = await queryOverpass(ql, cacheKey, "khach_san", "hotels", toaDo);

  // Nếu 0 phần tử hoặc lỗi timeout mọi server: thử MỘT lần với hộp nhỏ hơn một nửa
  if (elements.length === 0) {
    nuaCanhVi = 0.015;
    b = boundingBox(toaDo, nuaCanhVi);
    ql = `
(
  node["tourism"~"hotel|hostel|guest_house"]["name"](${b.south},${b.west},${b.north},${b.east});
  way["tourism"~"hotel|hostel|guest_house"]["name"](${b.south},${b.west},${b.north},${b.east});
);`;
    cacheKey = getCacheKey(toaDo.lat, toaDo.lng, nuaCanhVi, "hotels");
    elements = await queryOverpass(ql, cacheKey, "khach_san_half", "hotels", toaDo);
    if (elements.length === 0) {
      logger.warn(`[Overpass] [khach_san] Thiếu dữ liệu sau khi thử cả hộp nhỏ hơn một nửa.`);
    }
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

// ─── Quán ăn (bbox 0.03 độ, thử hộp nhỏ hơn một nửa nếu lỗi/0) ─────────────────

export async function fetchQuanAnsOSM(
  toaDo: { lat: number; lng: number },
  _tenDiemDen: string = ""
): Promise<QuanAn[]> {
  let nuaCanhVi = 0.03;
  let b = boundingBox(toaDo, nuaCanhVi);
  let ql = `
(
  node["amenity"="restaurant"]["name"](${b.south},${b.west},${b.north},${b.east});
  way["amenity"="restaurant"]["name"](${b.south},${b.west},${b.north},${b.east});
  node["amenity"="food_court"]["name"](${b.south},${b.west},${b.north},${b.east});
);`;

  let cacheKey = getCacheKey(toaDo.lat, toaDo.lng, nuaCanhVi, "restaurants");
  let elements = await queryOverpass(ql, cacheKey, "quan_an", "restaurants", toaDo);

  // Nếu 0 phần tử, thử MỘT lần với hộp nhỏ hơn một nửa
  if (elements.length === 0) {
    nuaCanhVi = 0.015;
    b = boundingBox(toaDo, nuaCanhVi);
    ql = `
(
  node["amenity"="restaurant"]["name"](${b.south},${b.west},${b.north},${b.east});
  way["amenity"="restaurant"]["name"](${b.south},${b.west},${b.north},${b.east});
  node["amenity"="food_court"]["name"](${b.south},${b.west},${b.north},${b.east});
);`;
    cacheKey = getCacheKey(toaDo.lat, toaDo.lng, nuaCanhVi, "restaurants");
    elements = await queryOverpass(ql, cacheKey, "quan_an_half", "restaurants", toaDo);
    if (elements.length === 0) {
      logger.warn(`[Overpass] [quan_an] Thiếu dữ liệu sau khi thử cả hộp nhỏ hơn một nửa.`);
    }
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

// ─── Cafe (bbox 0.03 độ, thử hộp nhỏ hơn một nửa nếu lỗi/0) ───────────────────

export async function fetchCafesOSM(
  toaDo: { lat: number; lng: number },
  _tenDiemDen: string = ""
): Promise<Cafe[]> {
  let nuaCanhVi = 0.03;
  let b = boundingBox(toaDo, nuaCanhVi);
  let ql = `
(
  node["amenity"="cafe"]["name"](${b.south},${b.west},${b.north},${b.east});
  way["amenity"="cafe"]["name"](${b.south},${b.west},${b.north},${b.east});
);`;

  let cacheKey = getCacheKey(toaDo.lat, toaDo.lng, nuaCanhVi, "cafes");
  let elements = await queryOverpass(ql, cacheKey, "cafe", "cafes", toaDo);

  // Nếu 0 phần tử, thử MỘT lần với hộp nhỏ hơn một nửa
  if (elements.length === 0) {
    nuaCanhVi = 0.015;
    b = boundingBox(toaDo, nuaCanhVi);
    ql = `
(
  node["amenity"="cafe"]["name"](${b.south},${b.west},${b.north},${b.east});
  way["amenity"="cafe"]["name"](${b.south},${b.west},${b.north},${b.east});
);`;
    cacheKey = getCacheKey(toaDo.lat, toaDo.lng, nuaCanhVi, "cafes");
    elements = await queryOverpass(ql, cacheKey, "cafe_half", "cafes", toaDo);
    if (elements.length === 0) {
      logger.warn(`[Overpass] [cafe] Thiếu dữ liệu sau khi thử cả hộp nhỏ hơn một nửa.`);
    }
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

// ─── Hoạt động / Điểm tham quan (bbox 0.15 độ, thử hộp nhỏ hơn một nửa nếu lỗi/0) ──

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
  let nuaCanhVi = 0.15;
  let b = boundingBox(toaDo, nuaCanhVi);
  let ql = `
(
  node["tourism"~"attraction|museum|viewpoint|theme_park|gallery"]["name"](${b.south},${b.west},${b.north},${b.east});
  way["tourism"~"attraction|museum|viewpoint|theme_park|gallery"]["name"](${b.south},${b.west},${b.north},${b.east});
  node["natural"="beach"]["name"](${b.south},${b.west},${b.north},${b.east});
  way["natural"="beach"]["name"](${b.south},${b.west},${b.north},${b.east});
);`;

  let cacheKey = getCacheKey(toaDo.lat, toaDo.lng, nuaCanhVi, "attractions");
  let elements = await queryOverpass(ql, cacheKey, "hoat_dong", "attractions", toaDo);

  // Nếu 0 phần tử, thử MỘT lần với hộp nhỏ hơn một nửa (0.075 độ)
  if (elements.length === 0) {
    nuaCanhVi = 0.075;
    b = boundingBox(toaDo, nuaCanhVi);
    ql = `
(
  node["tourism"~"attraction|museum|viewpoint|theme_park|gallery"]["name"](${b.south},${b.west},${b.north},${b.east});
  way["tourism"~"attraction|museum|viewpoint|theme_park|gallery"]["name"](${b.south},${b.west},${b.north},${b.east});
  node["natural"="beach"]["name"](${b.south},${b.west},${b.north},${b.east});
  way["natural"="beach"]["name"](${b.south},${b.west},${b.north},${b.east});
);`;
    cacheKey = getCacheKey(toaDo.lat, toaDo.lng, nuaCanhVi, "attractions");
    elements = await queryOverpass(ql, cacheKey, "hoat_dong_half", "attractions", toaDo);
    if (elements.length === 0) {
      logger.warn(`[Overpass] [hoat_dong] Thiếu dữ liệu sau khi thử cả hộp nhỏ hơn một nửa.`);
    }
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
