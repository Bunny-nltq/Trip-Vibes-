/**
 * src/data/live/overpassClient.ts
 *
 * Gọi Overpass API công khai (miễn phí, không cần key) để lấy dữ liệu OSM
 * cho Đà Nẵng và Hội An.
 *
 * - Đặt User-Agent rõ ràng.
 * - Cache file TTL 168 giờ (dữ liệu OSM thay đổi chậm).
 * - Mỗi loại tối đa 15 mục, ưu tiên mục có nhiều tag thông tin.
 */

import fs from "node:fs";
import path from "node:path";
import type { KhachSan, QuanAn, Cafe, HoatDong } from "@/contracts";
import { buildMapsUrls } from "@/core/maps";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "TripVibes/1.0 (https://github.com/TripVibes; educational project)";
const CACHE_TTL_MS = 168 * 60 * 60 * 1000; // 168 giờ
const MAX_PER_TYPE = 15;

// Bounding box Đà Nẵng + Hội An (south, west, north, east)
const DA_NANG_BBOX = "15.9,107.9,16.2,108.4";
const HOI_AN_BBOX = "15.8,108.2,15.95,108.5";
const COMBINED_BBOX = "15.8,107.9,16.2,108.5";

function getCacheDir(): string {
  const dir = path.join(process.cwd(), ".cache", "data");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
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
  fs.writeFileSync(getCachePath(key), JSON.stringify(data, null, 2), "utf-8");
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

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
];

// Throttling: tôn trọng giới hạn sử dụng (không gọi dồn dập, cách nhau ít nhất 1.5s)
let queryQueue = Promise.resolve();

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function queryOverpass(ql: string, cacheKey: string): Promise<OsmElement[]> {
  const cached = readCache<OsmElement[]>(cacheKey);
  if (cached) return cached;

  // Xếp hàng tuần tự để không gọi đồng thời
  const runQuery = async (): Promise<OsmElement[]> => {
    // Kiểm tra lại cache sau khi đợi hàng đợi
    const doubleCheck = readCache<OsmElement[]>(cacheKey);
    if (doubleCheck) return doubleCheck;

    const body = `[out:json][timeout:25];\n${ql}\nout center 50;`;
    let lastError: Error | null = null;

    for (const endpoint of OVERPASS_ENDPOINTS) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          await sleep(1500); // Tôn trọng giới hạn kết nối
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": USER_AGENT,
            },
            body: `data=${encodeURIComponent(body)}`,
          });

          if (response.status === 429) {
            await sleep(2500);
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
    }

    throw lastError ?? new Error("Không thể kết nối đến máy chủ Overpass nào.");
  };

  const currentRun = queryQueue.then(runQuery);
  // Cập nhật queryQueue, bắt lỗi để không làm gãy hàng đợi cho các query sau
  queryQueue = currentRun.then(() => {}).catch(() => {});
  return currentRun;
}

function getCoord(el: OsmElement): { lat: number; lng: number } | null {
  if (el.lat !== undefined && el.lon !== undefined) {
    return { lat: el.lat, lng: el.lon };
  }
  if (el.center) {
    return { lat: el.center.lat, lng: el.center.lon };
  }
  return null;
}

function getOsmId(el: OsmElement): string {
  return `osm:${el.type}:${el.id}`;
}

/** Tính điểm "phong phú" của element để ưu tiên mục có nhiều thông tin */
function richness(el: OsmElement): number {
  return Object.keys(el.tags ?? {}).length;
}

function sortByRichness(els: OsmElement[]): OsmElement[] {
  return [...els].sort((a, b) => richness(b) - richness(a));
}

const NOW_ISO = () => new Date().toISOString();

// ─── Khách sạn ───────────────────────────────────────────────────────────────

export async function fetchKhachSansOSM(): Promise<KhachSan[]> {
  const ql = `
(
  node["tourism"~"hotel|hostel|guest_house"]["name"](${COMBINED_BBOX});
  way["tourism"~"hotel|hostel|guest_house"]["name"](${COMBINED_BBOX});
  relation["tourism"~"hotel|hostel|guest_house"]["name"](${COMBINED_BBOX});
);`;

  const elements = await queryOverpass(ql, "hotels");
  const filtered = sortByRichness(
    elements.filter((el) => el.tags?.name)
  ).slice(0, MAX_PER_TYPE);

  const ngayLay = NOW_ISO();

  return filtered.map((el): KhachSan => {
    const tags = el.tags ?? {};
    const coord = getCoord(el) ?? { lat: 16.047, lng: 108.2062 };
    const stars = tags.stars ? parseInt(tags.stars, 10) : null;

    return {
      id: getOsmId(el),
      osmId: getOsmId(el),
      ten: tags.name ?? "Khách sạn",
      khuVuc: tags["addr:suburb"] ?? tags["addr:city"] ?? "Đà Nẵng",
      diaChi: tags["addr:street"]
        ? `${tags["addr:housenumber"] ?? ""} ${tags["addr:street"]}`.trim()
        : null,
      toaDo: coord,
      loai: "khach_san",
      gioMoCua: null,
      soSao: Number.isNaN(stars) ? null : stars,
      giaUocTinhNguoi: null,         // sẽ do researchHotelPrice.ts điền
      nguon: getOsmId(el),
      ngayLay,
      doTinCay: "tham_khao",
      giaLaUocTinh: true,
      khoangGiaDemVND: null,          // sẽ do researchHotelPrice.ts điền
      includesBreakfast: false,
      hasPool: false,
      mapsUrls: buildMapsUrls({ ten: tags.name ?? "Khách sạn", toaDo: coord }),
      nguonGia: [],
    };
  });
}

// ─── Quán ăn ─────────────────────────────────────────────────────────────────

export async function fetchQuanAnsOSM(): Promise<QuanAn[]> {
  const ql = `
(
  node["amenity"="restaurant"]["name"](${COMBINED_BBOX});
  way["amenity"="restaurant"]["name"](${COMBINED_BBOX});
  node["amenity"="food_court"]["name"](${COMBINED_BBOX});
);`;

  const elements = await queryOverpass(ql, "restaurants");
  const filtered = sortByRichness(
    elements.filter((el) => el.tags?.name)
  ).slice(0, MAX_PER_TYPE);

  const ngayLay = NOW_ISO();

  return filtered.map((el): QuanAn => {
    const tags = el.tags ?? {};
    const coord = getCoord(el) ?? { lat: 16.047, lng: 108.2062 };

    return {
      id: getOsmId(el),
      osmId: getOsmId(el),
      ten: tags.name ?? "Quán ăn",
      khuVuc: tags["addr:suburb"] ?? tags["addr:city"] ?? "Đà Nẵng",
      diaChi: tags["addr:street"]
        ? `${tags["addr:housenumber"] ?? ""} ${tags["addr:street"]}`.trim()
        : null,
      toaDo: coord,
      loai: "quan_an",
      gioMoCua: tags.opening_hours ?? null,
      soSao: null,   // KHÔNG tự điền sao Google
      giaUocTinhNguoi: null,   // sẽ do agent ước tính
      nguon: getOsmId(el),
      ngayLay,
      doTinCay: "tham_khao",
      giaLaUocTinh: true,
      amThuc: tags.cuisine ?? null,
    };
  });
}

// ─── Cafe ────────────────────────────────────────────────────────────────────

export async function fetchCafesOSM(): Promise<Cafe[]> {
  const ql = `
(
  node["amenity"="cafe"]["name"](${COMBINED_BBOX});
  way["amenity"="cafe"]["name"](${COMBINED_BBOX});
);`;

  const elements = await queryOverpass(ql, "cafes");
  const filtered = sortByRichness(
    elements.filter((el) => el.tags?.name)
  ).slice(0, MAX_PER_TYPE);

  const ngayLay = NOW_ISO();

  return filtered.map((el): Cafe => {
    const tags = el.tags ?? {};
    const coord = getCoord(el) ?? { lat: 16.047, lng: 108.2062 };

    return {
      id: getOsmId(el),
      osmId: getOsmId(el),
      ten: tags.name ?? "Quán cà phê",
      khuVuc: tags["addr:suburb"] ?? tags["addr:city"] ?? "Đà Nẵng",
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

// ─── Hoạt động / Điểm tham quan ─────────────────────────────────────────────

import { CAFE_MAC_DINH_MOI_NGUOI } from "@/core/assumptions";
import type { Preference } from "@/contracts";

const ATTRACTION_NHAN: Record<string, Preference[]> = {
  attraction: ["giai_tri_vui_choi"],
  museum: ["van_hoa_lich_su"],
  viewpoint: ["check_in_chup_anh", "bien"],
  beach: ["bien"],
  theme_park: ["giai_tri_vui_choi"],
  gallery: ["van_hoa_lich_su"],
};

export async function fetchHoatDongsOSM(): Promise<HoatDong[]> {
  const ql = `
(
  node["tourism"~"attraction|museum|viewpoint|theme_park|gallery"]["name"](${COMBINED_BBOX});
  way["tourism"~"attraction|museum|viewpoint|theme_park|gallery"]["name"](${COMBINED_BBOX});
  node["natural"="beach"]["name"](${DA_NANG_BBOX});
  way["natural"="beach"]["name"](${DA_NANG_BBOX});
);`;

  const elements = await queryOverpass(ql, "attractions");
  const filtered = sortByRichness(
    elements.filter((el) => el.tags?.name)
  ).slice(0, MAX_PER_TYPE);

  const ngayLay = NOW_ISO();

  return filtered.map((el): HoatDong => {
    const tags = el.tags ?? {};
    const coord = getCoord(el) ?? { lat: 16.047, lng: 108.2062 };
    const loaiOsm = tags.tourism ?? tags.natural ?? "attraction";
    const nhan: Preference[] = ATTRACTION_NHAN[loaiOsm] ?? ["giai_tri_vui_choi"];

    // Phí vào cửa (nếu có tag fee)
    const fee = tags.fee === "yes" ? 50_000 : 0;

    return {
      id: getOsmId(el),
      osmId: getOsmId(el),
      ten: tags.name ?? "Điểm tham quan",
      khuVuc: tags["addr:suburb"] ?? tags["addr:city"] ?? "Đà Nẵng",
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
      // HoatDong specific
      giaVeNguoi: fee,
      thoiLuongPhut: loaiOsm === "beach" ? 120 : 90,
      nhan,
      dongNguoi: loaiOsm === "beach" || loaiOsm === "theme_park",
      diBoNhieu: loaiOsm === "museum" || loaiOsm === "attraction",
      mapsUrls: buildMapsUrls({ ten: tags.name ?? "Điểm tham quan", toaDo: coord }),
    };
  });
}
