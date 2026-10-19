/**
 * src/data/live/researchTransport.ts
 *
 * Tìm giá phương tiện TP.HCM - Đà Nẵng (2 chiều) bằng Tavily,
 * rồi MỘT lần gọi Gemini trích xuất các phương án theo schema zod.
 *
 * Nguyên tắc:
 * - Luôn doTinCay = "uoc_tinh"
 * - Không có nguồn thì bỏ
 * - Thất bại thì dùng src/data/reference/timetable.json (doTinCay = "tham_khao")
 */

import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { Transport } from "@/contracts";
import { tavilySearch, isTavilyLimitReached } from "./searchClient";

const DATA_TTL_MS =
  parseInt(process.env.DATA_TTL_HOURS ?? "24", 10) * 60 * 60 * 1000;

function getCachePath(): string {
  const dir = path.join(process.cwd(), ".cache", "data");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "transport_research.json");
}

interface CachedTransport {
  timestamp: number;
  transports: Transport[];
}

function readCache(): Transport[] | null {
  const p = getCachePath();
  if (!fs.existsSync(p)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(p, "utf-8")) as CachedTransport;
    if (Date.now() - data.timestamp > DATA_TTL_MS) return null;
    return data.transports;
  } catch {
    return null;
  }
}

function writeCache(transports: Transport[]): void {
  fs.writeFileSync(
    getCachePath(),
    JSON.stringify({ timestamp: Date.now(), transports }, null, 2),
    "utf-8"
  );
}

function loadFallback(): Transport[] {
  const refPath = path.join(
    process.cwd(),
    "src",
    "data",
    "reference",
    "timetable.json"
  );
  try {
    const raw = JSON.parse(fs.readFileSync(refPath, "utf-8")) as Array<{
      id: string;
      huong: "di" | "ve";
      loai: "PLANE" | "TRAIN" | "BUS";
      nhaCungCap: string;
      gioDi: string;
      thoiLuongPhut: number;
      giaNguoi: number;
      seatClass: string;
      nguon: string[];
      doTinCay: string;
    }>;

    return raw.map((r) => ({
      schemaVersion: 6 as const,
      id: r.id,
      huong: r.huong,
      type: r.loai,
      provider: r.nhaCungCap,
      origin: r.huong === "di" ? "TP.HCM" : "Đà Nẵng",
      destination: r.huong === "di" ? "Đà Nẵng" : "TP.HCM",
      departureTime: r.gioDi,
      durationMinutes: r.thoiLuongPhut,
      pricePerPerson: r.giaNguoi,
      seatClass: r.seatClass,
      boardingPoint:
        r.loai === "PLANE"
          ? r.huong === "di"
            ? "Sân bay Tân Sơn Nhất"
            : "Sân bay Đà Nẵng"
          : r.huong === "di"
          ? "Bến xe Miền Đông"
          : "Bến xe Đà Nẵng",
      dropOffPoint:
        r.loai === "PLANE"
          ? r.huong === "di"
            ? "Sân bay Đà Nẵng"
            : "Sân bay Tân Sơn Nhất"
          : r.huong === "di"
          ? "Bến xe Đà Nẵng"
          : "Bến xe Miền Đông",
      nguon: r.nguon[0] ?? null,
      ngayLay: new Date().toISOString(),
      doTinCay: "tham_khao" as const,
      giaLaUocTinh: true,
      nguonGia: r.nguon,
    }));
  } catch {
    return [];
  }
}

// Schema kết quả Gemini trích xuất
const ExtractedOptionSchema = z.object({
  loai: z.enum(["PLANE", "TRAIN", "BUS"]),
  huong: z.enum(["di", "ve"]),
  nhaCungCap: z.string(),
  gioDi: z.string(),
  thoiLuongPhut: z.number().int().positive(),
  giaNguoi: z.number().int().positive(),
  nguon: z.array(z.string()),
});

type ExtractedOption = z.infer<typeof ExtractedOptionSchema>;

const ExtractedListSchema = z.object({
  phuongTien: z.array(ExtractedOptionSchema),
});

let geminiCallCount = 0;

export function getGeminiCallCount(): number {
  return geminiCallCount;
}

async function extractWithGemini(
  searchResults: string
): Promise<ExtractedOption[]> {
  const { GoogleGenAI } = await import("@google/genai");
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash-lite";

  if (!apiKey) return [];

  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== apiKey) {
    delete process.env.GOOGLE_API_KEY;
  }

  const client = new GoogleGenAI({ apiKey });
  geminiCallCount++;

  const prompt = `Từ các kết quả tìm kiếm web dưới đây về giá vé/xe tuyến TP.HCM - Đà Nẵng, hãy trích xuất các phương án di chuyển.
Chỉ lấy các phương án có URL nguồn rõ ràng. KHÔNG bịa thông tin.
Trả về JSON theo schema: { "phuongTien": [ { "loai": "PLANE"|"TRAIN"|"BUS", "huong": "di"|"ve", "nhaCungCap": "...", "gioDi": "HH:mm", "thoiLuongPhut": số, "giaNguoi": số_VND, "nguon": ["url1", ...] } ] }

Kết quả tìm kiếm:
${searchResults}`;

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
    if (!text) return [];
    const parsed = ExtractedListSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return [];
    return parsed.data.phuongTien.filter((p) => p.nguon.length > 0);
  } catch {
    return [];
  }
}

function toTransport(opt: ExtractedOption, idx: number): Transport {
  const isPlane = opt.loai === "PLANE";
  return {
    schemaVersion: 6 as const,
    id: `live_${opt.huong}_${opt.loai.toLowerCase()}_${idx}`,
    huong: opt.huong,
    type: opt.loai,
    provider: opt.nhaCungCap,
    origin: opt.huong === "di" ? "TP.HCM" : "Đà Nẵng",
    destination: opt.huong === "di" ? "Đà Nẵng" : "TP.HCM",
    departureTime: opt.gioDi,
    durationMinutes: opt.thoiLuongPhut,
    pricePerPerson: opt.giaNguoi,
    seatClass: isPlane ? "Phổ thông" : opt.loai === "BUS" ? "Giường nằm" : "Ngồi mềm",
    boardingPoint: isPlane
      ? opt.huong === "di"
        ? "Sân bay Tân Sơn Nhất"
        : "Sân bay Đà Nẵng"
      : opt.huong === "di"
      ? "Bến xe Miền Đông"
      : "Bến xe Đà Nẵng",
    dropOffPoint: isPlane
      ? opt.huong === "di"
        ? "Sân bay Đà Nẵng"
        : "Sân bay Tân Sơn Nhất"
      : opt.huong === "di"
      ? "Bến xe Đà Nẵng"
      : "Bến xe Miền Đông",
    nguon: opt.nguon[0] ?? null,
    ngayLay: new Date().toISOString(),
    doTinCay: "uoc_tinh" as const,
    giaLaUocTinh: true,
    nguonGia: opt.nguon,
  };
}

/**
 * researchTransports: Tìm giá phương tiện tuyến TP.HCM - Đà Nẵng.
 * Ưu tiên cache → Tavily+Gemini → fallback tham khảo.
 */
export async function researchTransports(): Promise<Transport[]> {
  // 1. Kiểm tra cache
  const cached = readCache();
  if (cached && cached.length > 0) return cached;

  // 2. Nếu Tavily không khả dụng → fallback ngay
  if (
    !process.env.TAVILY_API_KEY ||
    isTavilyLimitReached()
  ) {
    return loadFallback();
  }

  // 3. Tìm kiếm Tavily (gom 2 truy vấn)
  const [resDi, resVe] = await Promise.all([
    tavilySearch("giá vé máy bay xe khách TP.HCM Đà Nẵng chiều đi 2025", 5),
    tavilySearch("giá vé máy bay xe khách Đà Nẵng TP.HCM chiều về 2025", 5),
  ]);

  const allSnippets: string[] = [];
  if (resDi.ok) {
    for (const r of resDi.results) {
      allSnippets.push(`[${r.url}]\n${r.title}\n${r.content.slice(0, 300)}`);
    }
  }
  if (resVe.ok) {
    for (const r of resVe.results) {
      allSnippets.push(`[${r.url}]\n${r.title}\n${r.content.slice(0, 300)}`);
    }
  }

  if (allSnippets.length === 0) {
    return loadFallback();
  }

  // 4. MỘT lần gọi Gemini để trích xuất
  const options = await extractWithGemini(allSnippets.join("\n\n---\n\n"));

  if (options.length === 0) {
    return loadFallback();
  }

  // Gộp với fallback để đảm bảo có đủ chiều đi và chiều về
  const liveTransports = options.map((opt, i) => toTransport(opt, i));
  const hasDi = liveTransports.some((t) => t.huong === "di");
  const hasVe = liveTransports.some((t) => t.huong === "ve");

  const fallback = loadFallback();
  const result: Transport[] = [...liveTransports];
  if (!hasDi) result.push(...fallback.filter((t) => t.huong === "di").slice(0, 2));
  if (!hasVe) result.push(...fallback.filter((t) => t.huong === "ve").slice(0, 2));

  writeCache(result);
  return result;
}
