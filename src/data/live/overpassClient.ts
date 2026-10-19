/**
 * src/data/live/overpassClient.ts
 *
 * Gọi Overpass API công khai (miễn phí, không cần key) để lấy dữ liệu OSM
 * theo toạ độ điểm đến bất kỳ (bán kính quanh tâm).
 *
 * - Khách sạn, quán ăn, cà phê: bán kính 8 km (8000m).
 * - Điểm tham quan / hoạt động: bán kính 30 km (30000m).
 * - khuVuc: lấy từ addr:suburb hoặc addr:district, không có thì "Trung tâm".
 * - Cache theo hash(tọa độ, bán kính, loại), TTL 168 giờ.
 * - Giữ User-Agent và rate limiting tuần tự 1.5s giữa các yêu cầu.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { KhachSan, QuanAn, Cafe, HoatDong, Preference } from "@/contracts";
import { buildMapsUrls } from "@/core/maps";
import { CAFE_MAC_DINH_MOI_NGUOI } from "@/core/assumptions";

const USER_AGENT = "TripVibes/1.0 (https://github.com/TripVibes; educational project)";
const CACHE_TTL_MS = 168 * 60 * 60 * 1000; // 168 giờ
const MAX_PER_TYPE = 15;

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
];

function getCacheDir(): string {
  const dir = path.join(process.cwd(), ".cache", "data");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getCacheKey(lat: number, lng: number, radiusM: number, loai: string): string {
  return crypto
    .createHash("sha256")
    .update(`${lat.toFixed(4)},${lng.toFixed(4)}_${radiusM}_${loai}`)
    .digest("hex");
}

function getCachePath(key: string): string {
  return path.join(getCacheDir(), `osm_${key}.json`);
}

function readCache<T>(key: string): T | null {
  const p = getCachePath(key);
  if (!fs.existsSync(p)) return null;
  const stat = fs.statSync(p);
  if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
  } catch {
    return null;
  }
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

let queryQueue = Promise.resolve();

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function queryOverpass(ql: string, cacheKey: string): Promise<OsmElement[]> {
  const cached = readCache<OsmElement[]>(cacheKey);
  if (cached) return cached;

  const runQuery = async (): Promise<OsmElement[]> => {
    const doubleCheck = readCache<OsmElement[]>(cacheKey);
    if (doubleCheck) return doubleCheck;

    const body = `[out:json][timeout:25];\n${ql}\nout center 50;`;
    let lastError: Error | null = null;

    for (const endpoint of OVERPASS_ENDPOINTS.slice(0, 2)) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": USER_AGENT,
          },
          body: `data=${encodeURIComponent(body)}`,
          signal: AbortSignal.timeout(3500),
        });

        if (response.status === 429) {
          continue;
        }

        if (!response.ok) {
          throw new Error(`Overpass API lỗi: ${response.status} ${response.statusText}`);
        }

        const json = (await response.json()) as OsmResponse;
        const elements = json.elements ?? [];
        writeCache(cacheKey, elements);
        return elements;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    return [];
  };

  const currentRun = queryQueue.then(runQuery);
  queryQueue = currentRun.then(() => {}).catch(() => {});
  return currentRun;
}

function getCoord(el: OsmElement, defaultCoord: { lat: number; lng: number }): { lat: number; lng: number } {
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

// ─── Khách sạn (bán kính 8 km quanh tâm) ──────────────────────────────────────

export async function fetchKhachSansOSM(
  toaDo: { lat: number; lng: number },
  tenDiemDen: string = ""
): Promise<KhachSan[]> {
  const radius = 8000;
  const ql = `
(
  node["tourism"~"hotel|hostel|guest_house"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  way["tourism"~"hotel|hostel|guest_house"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  relation["tourism"~"hotel|hostel|guest_house"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
);`;

  const cacheKey = getCacheKey(toaDo.lat, toaDo.lng, radius, "hotels");
  const elements = await queryOverpass(ql, cacheKey);
  const filtered = sortByRichness(
    elements.filter((el) => el.tags?.name)
  ).slice(0, MAX_PER_TYPE);

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

// ─── Quán ăn (bán kính 8 km quanh tâm) ────────────────────────────────────────

export async function fetchQuanAnsOSM(
  toaDo: { lat: number; lng: number },
  tenDiemDen: string = ""
): Promise<QuanAn[]> {
  const radius = 8000;
  const ql = `
(
  node["amenity"="restaurant"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  way["amenity"="restaurant"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  node["amenity"="food_court"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
);`;

  const cacheKey = getCacheKey(toaDo.lat, toaDo.lng, radius, "restaurants");
  const elements = await queryOverpass(ql, cacheKey);
  const filtered = sortByRichness(
    elements.filter((el) => el.tags?.name)
  ).slice(0, MAX_PER_TYPE);

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

// ─── Cafe (bán kính 8 km quanh tâm) ───────────────────────────────────────────

export async function fetchCafesOSM(
  toaDo: { lat: number; lng: number },
  tenDiemDen: string = ""
): Promise<Cafe[]> {
  const radius = 8000;
  const ql = `
(
  node["amenity"="cafe"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  way["amenity"="cafe"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
);`;

  const cacheKey = getCacheKey(toaDo.lat, toaDo.lng, radius, "cafes");
  const elements = await queryOverpass(ql, cacheKey);
  const filtered = sortByRichness(
    elements.filter((el) => el.tags?.name)
  ).slice(0, MAX_PER_TYPE);

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

// ─── Hoạt động / Điểm tham quan (bán kính 30 km quanh tâm) ───────────────────

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
  const radius = 30000;
  const ql = `
(
  node["tourism"~"attraction|museum|viewpoint|theme_park|gallery"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  way["tourism"~"attraction|museum|viewpoint|theme_park|gallery"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  node["natural"="beach"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
  way["natural"="beach"]["name"](around:${radius},${toaDo.lat},${toaDo.lng});
);`;

  const cacheKey = getCacheKey(toaDo.lat, toaDo.lng, radius, "attractions");
  const elements = await queryOverpass(ql, cacheKey);
  const filtered = sortByRichness(
    elements.filter((el) => el.tags?.name)
  ).slice(0, MAX_PER_TYPE);

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
