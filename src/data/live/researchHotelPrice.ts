/**
 * src/data/live/researchHotelPrice.ts
 *
 * Ước tính giá phòng cho tối đa 6 khách sạn live:
 * - Tìm web "giá phòng <tên> Đà Nẵng" qua Tavily.
 * - MỘT lần gọi Gemini để trích khoangGiaDemVND cho cả nhóm.
 * - Không có nguồn → dùng HOTEL_GIA_THEO_SAO và giaLaUocTinh = true.
 */

import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { KhachSan } from "@/contracts";
import {
  HOTEL_GIA_THEO_SAO,
  HOTEL_GIA_MAC_DINH,
} from "@/core/assumptions";
import { tavilySearch, isTavilyLimitReached } from "./searchClient";

const DATA_TTL_MS =
  parseInt(process.env.DATA_TTL_HOURS ?? "24", 10) * 60 * 60 * 1000;
const MAX_HOTELS_TO_RESEARCH = 6;

function getCachePath(): string {
  const dir = path.join(process.cwd(), ".cache", "data");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "hotel_prices.json");
}

interface CachedPrices {
  timestamp: number;
  prices: Record<string, { min: number; max: number; nguon: string[] }>;
}

function readPriceCache(): CachedPrices["prices"] | null {
  const p = getCachePath();
  if (!fs.existsSync(p)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(p, "utf-8")) as CachedPrices;
    if (Date.now() - data.timestamp > DATA_TTL_MS) return null;
    return data.prices;
  } catch {
    return null;
  }
}

function writePriceCache(prices: CachedPrices["prices"]): void {
  fs.writeFileSync(
    getCachePath(),
    JSON.stringify({ timestamp: Date.now(), prices }, null, 2),
    "utf-8"
  );
}

// Schema kết quả Gemini
const PriceResultSchema = z.object({
  ketQua: z.array(
    z.object({
      id: z.string(),
      min: z.number().int().positive().nullable(),
      max: z.number().int().positive().nullable(),
      nguon: z.array(z.string()),
    })
  ),
});

let geminiCallCount = 0;
export function getGeminiHotelCallCount(): number {
  return geminiCallCount;
}

async function extractPricesWithGemini(
  hotels: KhachSan[],
  searchResults: Record<string, string>
): Promise<Record<string, { min: number; max: number; nguon: string[] }>> {
  const { GoogleGenAI } = await import("@google/genai");
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash-lite";

  if (!apiKey) return {};

  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== apiKey) {
    delete process.env.GOOGLE_API_KEY;
  }

  const client = new GoogleGenAI({ apiKey });
  geminiCallCount++;

  const hotelInfos = hotels.map((h) => ({
    id: h.id,
    ten: h.ten,
    snippets: searchResults[h.id] ?? "(không có kết quả)",
  }));

  const prompt = `Từ các kết quả tìm kiếm web dưới đây, trích xuất khoảng giá phòng/đêm (VND) cho từng khách sạn.
Chỉ điền min/max nếu có URL nguồn rõ ràng trong snippet. KHÔNG bịa giá. Nếu không tìm thấy, để min và max là null.
Trả về JSON: { "ketQua": [ { "id": "...", "min": số_hoặc_null, "max": số_hoặc_null, "nguon": ["url1",...] } ] }

Danh sách khách sạn cần trích xuất:
${hotelInfos.map((h) => `ID: ${h.id}\nTên: ${h.ten}\nSnippets:\n${h.snippets}`).join("\n\n---\n\n")}`;

  try {
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0,
      } as never,
    });

    const text = response.text;
    if (!text) return {};
    const parsed = PriceResultSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return {};

    const result: Record<string, { min: number; max: number; nguon: string[] }> = {};
    for (const item of parsed.data.ketQua) {
      if (item.min !== null && item.max !== null && item.nguon.length > 0) {
        result[item.id] = {
          min: item.min,
          max: item.max,
          nguon: item.nguon,
        };
      }
    }
    return result;
  } catch {
    return {};
  }
}

function applyFallbackPrice(hotel: KhachSan): KhachSan {
  const sao = hotel.soSao;
  const giaDem =
    sao !== null && HOTEL_GIA_THEO_SAO[sao] !== undefined
      ? HOTEL_GIA_THEO_SAO[sao]
      : HOTEL_GIA_MAC_DINH;
  return {
    ...hotel,
    khoangGiaDemVND: { min: giaDem, max: giaDem },
    giaUocTinhNguoi: giaDem,
    giaLaUocTinh: true,
    doTinCay: "tham_khao",
    nguonGia: [],
  };
}

/**
 * enrichHotelPrices: Điền khoangGiaDemVND cho danh sách khách sạn.
 * Tối đa MAX_HOTELS_TO_RESEARCH (6) khách sạn được tra giá web.
 */
export async function enrichHotelPrices(
  hotels: KhachSan[]
): Promise<KhachSan[]> {
  if (hotels.length === 0) return hotels;

  // 1. Kiểm tra cache giá
  const priceCache = readPriceCache();

  const toResearch = hotels.slice(0, MAX_HOTELS_TO_RESEARCH);
  const rest = hotels.slice(MAX_HOTELS_TO_RESEARCH);

  // Nếu đã có cache cho tất cả
  if (priceCache) {
    const allCached = toResearch.every((h) => priceCache[h.id]);
    if (allCached) {
      return [
        ...toResearch.map((h) => applyPrice(h, priceCache[h.id])),
        ...rest.map(applyFallbackPrice),
      ];
    }
  }

  // 2. Kiểm tra Tavily
  if (!process.env.TAVILY_API_KEY || isTavilyLimitReached()) {
    return [...toResearch.map(applyFallbackPrice), ...rest.map(applyFallbackPrice)];
  }

  // 3. Tìm web cho từng khách sạn (tuần tự để không spam)
  const searchResults: Record<string, string> = {};
  for (const hotel of toResearch) {
    if (isTavilyLimitReached()) break;

    // Nếu đã có cache thì bỏ qua
    if (priceCache?.[hotel.id]) {
      searchResults[hotel.id] = "(cached)";
      continue;
    }

    const res = await tavilySearch(`giá phòng ${hotel.ten} Đà Nẵng 2025`, 3);
    if (res.ok && res.results.length > 0) {
      searchResults[hotel.id] = res.results
        .map((r) => `[${r.url}] ${r.title}: ${r.content.slice(0, 200)}`)
        .join("\n");
    } else {
      searchResults[hotel.id] = "";
    }
  }

  // 4. MỘT lần gọi Gemini cho cả nhóm
  const hotelsNeedingExtraction = toResearch.filter(
    (h) => searchResults[h.id] && searchResults[h.id] !== "(cached)"
  );

  let extracted: Record<string, { min: number; max: number; nguon: string[] }> = {};
  if (hotelsNeedingExtraction.length > 0) {
    extracted = await extractPricesWithGemini(
      hotelsNeedingExtraction,
      searchResults
    );
  }

  // Gộp với cache cũ
  const allPrices: CachedPrices["prices"] = { ...(priceCache ?? {}), ...extracted };
  writePriceCache(allPrices);

  return [
    ...toResearch.map((h) => {
      const p = allPrices[h.id];
      return p ? applyPrice(h, p) : applyFallbackPrice(h);
    }),
    ...rest.map(applyFallbackPrice),
  ];
}

function applyPrice(
  hotel: KhachSan,
  price: { min: number; max: number; nguon: string[] }
): KhachSan {
  return {
    ...hotel,
    khoangGiaDemVND: { min: price.min, max: price.max },
    giaUocTinhNguoi: Math.round((price.min + price.max) / 2),
    giaLaUocTinh: true,
    doTinCay: "uoc_tinh",
    nguon: price.nguon[0] ?? hotel.nguon,
    nguonGia: price.nguon,
  };
}
