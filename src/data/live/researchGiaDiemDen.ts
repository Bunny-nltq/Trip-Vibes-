/**
 * src/data/live/researchGiaDiemDen.ts
 *
 * MỘT lượt Tavily và MỘT lượt Gemini cho mỗi điểm đến (cache 168 giờ) để trích:
 * - Khoảng giá khách sạn theo số sao (2 đến 5 sao)
 * - Giá một bữa ăn trung bình
 * - Quy đổi ngoại tệ sang VND (nếu có)
 * - Không có nguồn thì dùng giả định sẵn từ assumptions.ts (giaLaUocTinh = true)
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { z } from "zod";
import type { DiemDen } from "@/contracts";
import {
  HOTEL_GIA_THEO_SAO,
  AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA,
} from "@/core/assumptions";
import { tavilySearch, isTavilyLimitReached } from "./searchClient";
import { layTyGiaSangVND } from "./tyGiaClient";
import { quyDoiVND } from "@/core/quyDoiTien";

const CACHE_TTL_MS = 168 * 60 * 60 * 1000; // 168 giờ (7 ngày)

export interface GiaDiemDenResult {
  giaKhachSanTheoSao: Record<number, number>;
  giaBuaAnTrungBinh: number;
  giaLaUocTinh: boolean;
  nguon: string[];
}

function getCacheDir(): string {
  const dir = path.join(process.cwd(), ".cache", "data");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getCachePath(tenDiemDen: string): string {
  const hash = crypto.createHash("sha256").update(tenDiemDen.toLowerCase().trim()).digest("hex");
  return path.join(getCacheDir(), `gia_diem_den_${hash}.json`);
}

function readCache(tenDiemDen: string): GiaDiemDenResult | null {
  const p = getCachePath(tenDiemDen);
  if (!fs.existsSync(p)) return null;
  const stat = fs.statSync(p);
  if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as GiaDiemDenResult;
  } catch {
    return null;
  }
}

function writeCache(tenDiemDen: string, data: GiaDiemDenResult): void {
  try {
    fs.writeFileSync(getCachePath(tenDiemDen), JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // ignore
  }
}

const ExtractedPriceSchema = z.object({
  sao2: z.number().nullable().optional(),
  sao3: z.number().nullable().optional(),
  sao4: z.number().nullable().optional(),
  sao5: z.number().nullable().optional(),
  giaBuaAn: z.number().nullable().optional(),
  tienTe: z.string().default("VND"),
});

const inFlightResearch = new Map<string, Promise<GiaDiemDenResult>>();

export async function researchGiaDiemDen(diemDen: DiemDen): Promise<GiaDiemDenResult> {
  const cached = readCache(diemDen.ten);
  if (cached) return cached;

  const key = diemDen.ten.toLowerCase().trim();
  const existing = inFlightResearch.get(key);
  if (existing) return existing;

  const promise = doResearchGiaDiemDen(diemDen);
  inFlightResearch.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlightResearch.delete(key);
  }
}

async function doResearchGiaDiemDen(diemDen: DiemDen): Promise<GiaDiemDenResult> {

  const fallbackResult: GiaDiemDenResult = {
    giaKhachSanTheoSao: { ...HOTEL_GIA_THEO_SAO },
    giaBuaAnTrungBinh: AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA,
    giaLaUocTinh: true,
    nguon: [],
  };

  // Nếu không có Tavily key hoặc đã chạm hạn mức
  if (!process.env.TAVILY_API_KEY || isTavilyLimitReached()) {
    writeCache(diemDen.ten, fallbackResult);
    return fallbackResult;
  }

  // 1. MỘT lượt Tavily tìm kiếm
  const query = `giá phòng khách sạn theo sao và chi phí một bữa ăn tại ${diemDen.ten} ${diemDen.quocGia} 2025`;
  const searchRes = await tavilySearch(query, 5);

  if (!searchRes.ok || searchRes.results.length === 0) {
    writeCache(diemDen.ten, fallbackResult);
    return fallbackResult;
  }

  const sources: string[] = [];
  const snippets: string[] = [];
  for (const r of searchRes.results) {
    sources.push(r.url);
    snippets.push(`[${r.url}]\n${r.title}\n${r.content.slice(0, 300)}`);
  }

  // 2. MỘT lần gọi Gemini để trích xuất giá
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    writeCache(diemDen.ten, fallbackResult);
    return fallbackResult;
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash-lite";

    if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== apiKey) {
      delete process.env.GOOGLE_API_KEY;
    }

    const client = new GoogleGenAI({ apiKey });
    const prompt = `Từ các kết quả tìm kiếm sau về chi phí du lịch tại "${diemDen.ten}" (${diemDen.quocGia}), hãy ước lượng:
- Giá phòng khách sạn 1 đêm (theo số sao: 2 sao, 3 sao, 4 sao, 5 sao)
- Giá trung bình một bữa ăn cho 1 người
- Đơn vị tiền tệ (ví dụ VND, USD, THB, KRW, JPY).
Chỉ trích xuất theo thông tin thực tế, không bịa. Trả về JSON:
{
  "sao2": số hoặc null,
  "sao3": số hoặc null,
  "sao4": số hoặc null,
  "sao5": số hoặc null,
  "giaBuaAn": số hoặc null,
  "tienTe": "VND" | "USD" | ...
}

Nội dung web:
${snippets.join("\n\n---\n\n")}`;

    const resp = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0,
      } as never,
    });

    const text = resp.text;
    if (!text) {
      writeCache(diemDen.ten, fallbackResult);
      return fallbackResult;
    }

    const parsed = ExtractedPriceSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      writeCache(diemDen.ten, fallbackResult);
      return fallbackResult;
    }

    const raw = parsed.data;
    const tienTe = raw.tienTe || diemDen.tienTe || "VND";

    // Tỷ giá quy đổi
    let tyGia = 1;
    if (tienTe !== "VND") {
      try {
        const rateInfo = await layTyGiaSangVND(tienTe);
        tyGia = rateInfo.tyGia;
      } catch {
        tyGia = 1;
      }
    }

    const finalTheoSao: Record<number, number> = {
      2: raw.sao2 ? quyDoiVND(raw.sao2, tyGia) : HOTEL_GIA_THEO_SAO[2],
      3: raw.sao3 ? quyDoiVND(raw.sao3, tyGia) : HOTEL_GIA_THEO_SAO[3],
      4: raw.sao4 ? quyDoiVND(raw.sao4, tyGia) : HOTEL_GIA_THEO_SAO[4],
      5: raw.sao5 ? quyDoiVND(raw.sao5, tyGia) : HOTEL_GIA_THEO_SAO[5],
    };

    const finalBuaAn = raw.giaBuaAn
      ? quyDoiVND(raw.giaBuaAn, tyGia)
      : AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA;

    const result: GiaDiemDenResult = {
      giaKhachSanTheoSao: finalTheoSao,
      giaBuaAnTrungBinh: finalBuaAn,
      giaLaUocTinh: true,
      nguon: sources,
    };

    writeCache(diemDen.ten, result);
    return result;
  } catch {
    writeCache(diemDen.ten, fallbackResult);
    return fallbackResult;
  }
}
