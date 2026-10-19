/**
 * src/data/live/researchTransport.ts
 *
 * Nghiên cứu phương tiện di chuyển tổng quát theo (diemDi, diemDen, soNgay):
 * 1. Nếu người dùng tự nhập giá: trả phương án người dùng nhập với doTinCay = "nguoi_dung_nhap".
 * 2. Tìm kiếm web qua Tavily và MỘT lần gọi Gemini trích xuất phương án, đổi tiền sang VND, doTinCay = "uoc_tinh".
 * 3. Nếu không có kết quả web dùng được: dùng uocLuongPhuongTien theo cacLoaiPhuongTienUocLuong (nhãn "Ước tính theo quãng đường").
 * 4. Nếu tuyến không có phương án nào: trả trạng thái "khong_co_phuong_an" cho phép người dùng nhập giá tay.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { z } from "zod";
import type { Transport, DiemDen } from "@/contracts";
import { tavilySearch, isTavilyLimitReached } from "./searchClient";
import {
  cacLoaiPhuongTienUocLuong,
  uocLuongPhuongTien,
  type LoaiPhuongTienUocLuong,
} from "@/core/uocLuongPhuongTien";
import { khoangCachKm } from "@/core/haversine";
import { layTyGiaSangVND } from "./tyGiaClient";
import { quyDoiVND } from "@/core/quyDoiTien";

const DATA_TTL_MS =
  parseInt(process.env.DATA_TTL_HOURS ?? "24", 10) * 60 * 60 * 1000;

export interface ResearchTransportResult {
  transports: Transport[];
  status: "thanh_cong" | "khong_co_phuong_an";
}

function getCacheDir(): string {
  const dir = path.join(process.cwd(), ".cache", "data");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getCachePath(diemDiTen: string, diemDenTen: string): string {
  const key = `${diemDiTen}_${diemDenTen}`.toLowerCase().trim();
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return path.join(getCacheDir(), `transport_${hash}.json`);
}

function readCache(diemDiTen: string, diemDenTen: string): Transport[] | null {
  const p = getCachePath(diemDiTen, diemDenTen);
  if (!fs.existsSync(p)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(p, "utf-8")) as {
      timestamp: number;
      transports: Transport[];
    };
    if (Date.now() - data.timestamp > DATA_TTL_MS) return null;
    return data.transports;
  } catch {
    return null;
  }
}

function writeCache(diemDiTen: string, diemDenTen: string, transports: Transport[]): void {
  try {
    fs.writeFileSync(
      getCachePath(diemDiTen, diemDenTen),
      JSON.stringify({ timestamp: Date.now(), transports }, null, 2),
      "utf-8"
    );
  } catch {
    // ignore
  }
}

const ExtractedOptionSchema = z.object({
  loai: z.enum(["PLANE", "TRAIN", "BUS"]),
  huong: z.enum(["di", "ve"]),
  nhaCungCap: z.string(),
  gioDi: z.string(),
  thoiLuongPhut: z.number().int().positive(),
  giaNguoi: z.number().int().positive(),
  tienTe: z.string().default("VND"),
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
  searchResults: string,
  diemDiTen: string,
  diemDenTen: string
): Promise<ExtractedOption[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  const { GoogleGenAI } = await import("@google/genai");
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash-lite";

  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== apiKey) {
    delete process.env.GOOGLE_API_KEY;
  }

  const client = new GoogleGenAI({ apiKey });
  geminiCallCount++;

  const prompt = `Từ các kết quả tìm kiếm web dưới đây về giá vé và lịch trình phương tiện giữa "${diemDiTen}" và "${diemDenTen}", hãy trích xuất các phương án di chuyển (cả chiều đi và chiều về).
Chỉ lấy các phương án có URL nguồn rõ ràng. KHÔNG bịa thông tin.
Nếu giá bằng ngoại tệ thì ghi rõ tiền tệ tương ứng ("tienTe": "USD", "THB", ...).
Trần định dạng JSON: { "phuongTien": [ { "loai": "PLANE"|"TRAIN"|"BUS", "huong": "di"|"ve", "nhaCungCap": "...", "gioDi": "HH:mm", "thoiLuongPhut": số, "giaNguoi": số, "tienTe": "VND"|..., "nguon": ["url1", ...] } ] }

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
    return parsed.data.phuongTien.filter((p) => p.nguon && p.nguon.length > 0);
  } catch {
    return [];
  }
}

/**
 * Tạo phương án di chuyển từ ước lượng quãng đường
 */
export function taoPhuongTienUocLuong(
  diemDi: DiemDen,
  diemDen: DiemDen
): Transport[] {
  const loaiList = cacLoaiPhuongTienUocLuong(diemDi, diemDen);
  if (loaiList.length === 0) return [];

  const distanceKm = khoangCachKm(diemDi.toaDo, diemDen.toaDo);
  const transports: Transport[] = [];
  const nowIso = new Date().toISOString();

  const configMap: Record<
    LoaiPhuongTienUocLuong,
    {
      type: "PLANE" | "TRAIN" | "BUS";
      tenLoai: string;
      gioDi: string;
      gioVe: string;
      seatClass: string;
      boardingDi: string;
      boardingVe: string;
    }
  > = {
    may_bay: {
      type: "PLANE",
      tenLoai: "Máy bay",
      gioDi: "08:00",
      gioVe: "17:30",
      seatClass: "Phổ thông",
      boardingDi: `Sân bay ${diemDi.ten}`,
      boardingVe: `Sân bay ${diemDen.ten}`,
    },
    tau: {
      type: "TRAIN",
      tenLoai: "Tàu hỏa",
      gioDi: "07:00",
      gioVe: "16:00",
      seatClass: "Ngồi mềm",
      boardingDi: `Ga ${diemDi.ten}`,
      boardingVe: `Ga ${diemDen.ten}`,
    },
    xe_khach: {
      type: "BUS",
      tenLoai: "Xe khách",
      gioDi: "08:30",
      gioVe: "16:30",
      seatClass: "Giường nằm",
      boardingDi: `Bến xe ${diemDi.ten}`,
      boardingVe: `Bến xe ${diemDen.ten}`,
    },
  };

  loaiList.forEach((loai, idx) => {
    const est = uocLuongPhuongTien(distanceKm, loai);
    const cfg = configMap[loai];

    // Chiều đi
    transports.push({
      schemaVersion: 7,
      id: `est_di_${loai}_${idx}`,
      huong: "di",
      type: cfg.type,
      provider: `Ước tính theo quãng đường (${cfg.tenLoai})`,
      origin: diemDi.ten,
      destination: diemDen.ten,
      departureTime: cfg.gioDi,
      durationMinutes: est.thoiLuongPhut,
      pricePerPerson: est.giaNguoi,
      seatClass: cfg.seatClass,
      boardingPoint: cfg.boardingDi,
      dropOffPoint: cfg.boardingVe,
      notes: "Ước tính theo quãng đường",
      nguon: null,
      ngayLay: nowIso,
      doTinCay: "uoc_tinh",
      giaLaUocTinh: true,
      nguonGia: [],
    });

    // Chiều về
    transports.push({
      schemaVersion: 7,
      id: `est_ve_${loai}_${idx}`,
      huong: "ve",
      type: cfg.type,
      provider: `Ước tính theo quãng đường (${cfg.tenLoai})`,
      origin: diemDen.ten,
      destination: diemDi.ten,
      departureTime: cfg.gioVe,
      durationMinutes: est.thoiLuongPhut,
      pricePerPerson: est.giaNguoi,
      seatClass: cfg.seatClass,
      boardingPoint: cfg.boardingVe,
      dropOffPoint: cfg.boardingDi,
      notes: "Ước tính theo quãng đường",
      nguon: null,
      ngayLay: nowIso,
      doTinCay: "uoc_tinh",
      giaLaUocTinh: true,
      nguonGia: [],
    });
  });

  return transports;
}

const inFlightTransports = new Map<string, Promise<ResearchTransportResult>>();

export async function researchTransports(
  diemDi: DiemDen,
  diemDen: DiemDen,
  soNgay: number = 3,
  giaVeNhapTay?: { chieuDiVND: number; chieuVeVND: number }
): Promise<ResearchTransportResult> {
  const cacheKey = `${diemDi.ten}_${diemDen.ten}_${soNgay}`.toLowerCase().trim();
  const existing = inFlightTransports.get(cacheKey);
  if (existing) return existing;

  const promise = doResearchTransports(diemDi, diemDen, soNgay, giaVeNhapTay);
  inFlightTransports.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    inFlightTransports.delete(cacheKey);
  }
}

async function doResearchTransports(
  diemDi: DiemDen,
  diemDen: DiemDen,
  soNgay: number = 3,
  giaVeNhapTay?: { chieuDiVND: number; chieuVeVND: number }
): Promise<ResearchTransportResult> {
  // 1. Nếu người dùng tự nhập giá tay
  if (giaVeNhapTay && giaVeNhapTay.chieuDiVND >= 0 && giaVeNhapTay.chieuVeVND >= 0) {
    const distanceKm = khoangCachKm(diemDi.toaDo, diemDen.toaDo);
    const est = uocLuongPhuongTien(Math.max(distanceKm, 50), "may_bay");
    const nowIso = new Date().toISOString();

    const manualTransports: Transport[] = [
      {
        schemaVersion: 7,
        id: "manual_di",
        huong: "di",
        type: "PLANE",
        provider: "Phương tiện tự nhập",
        origin: diemDi.ten,
        destination: diemDen.ten,
        departureTime: "08:00",
        durationMinutes: est.thoiLuongPhut,
        pricePerPerson: giaVeNhapTay.chieuDiVND,
        seatClass: "Tự chọn",
        boardingPoint: diemDi.ten,
        dropOffPoint: diemDen.ten,
        notes: "Giá do người dùng nhập thủ công",
        nguon: null,
        ngayLay: nowIso,
        doTinCay: "nguoi_dung_nhap",
        giaLaUocTinh: false,
        nguonGia: [],
      },
      {
        schemaVersion: 7,
        id: "manual_ve",
        huong: "ve",
        type: "PLANE",
        provider: "Phương tiện tự nhập",
        origin: diemDen.ten,
        destination: diemDi.ten,
        departureTime: "17:00",
        durationMinutes: est.thoiLuongPhut,
        pricePerPerson: giaVeNhapTay.chieuVeVND,
        seatClass: "Tự chọn",
        boardingPoint: diemDen.ten,
        dropOffPoint: diemDi.ten,
        notes: "Giá do người dùng nhập thủ công",
        nguon: null,
        ngayLay: nowIso,
        doTinCay: "nguoi_dung_nhap",
        giaLaUocTinh: false,
        nguonGia: [],
      },
    ];

    return { transports: manualTransports, status: "thanh_cong" };
  }

  // 2. Kiểm tra cache
  const cached = readCache(diemDi.ten, diemDen.ten);
  if (cached && cached.length > 0) {
    return { transports: cached, status: "thanh_cong" };
  }

  // 3. Nếu Tavily có thể gọi
  let liveOptions: ExtractedOption[] = [];
  if (process.env.TAVILY_API_KEY && !isTavilyLimitReached()) {
    try {
      const [resDi, resVe] = await Promise.all([
        tavilySearch(`giá vé máy bay tàu xe từ ${diemDi.ten} đi ${diemDen.ten} 2025`, 4),
        tavilySearch(`giá vé máy bay tàu xe từ ${diemDen.ten} về ${diemDi.ten} 2025`, 4),
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

      if (allSnippets.length > 0) {
        liveOptions = await extractWithGemini(
          allSnippets.join("\n\n---\n\n"),
          diemDi.ten,
          diemDen.ten
        );
      }
    } catch {
      // ignore, chuyển sang ước lượng
    }
  }

  // 4. Nếu trích xuất được phương án từ web
  if (liveOptions.length > 0) {
    const liveTransports: Transport[] = [];
    const nowIso = new Date().toISOString();

    for (let i = 0; i < liveOptions.length; i++) {
      const opt = liveOptions[i];
      let giaVND = opt.giaNguoi;
      if (opt.tienTe && opt.tienTe !== "VND") {
        try {
          const rateInfo = await layTyGiaSangVND(opt.tienTe);
          giaVND = quyDoiVND(opt.giaNguoi, rateInfo.tyGia);
        } catch {
          // giữ nguyên
        }
      }

      const isPlane = opt.loai === "PLANE";
      liveTransports.push({
        schemaVersion: 7,
        id: `live_${opt.huong}_${opt.loai.toLowerCase()}_${i}`,
        huong: opt.huong,
        type: opt.loai,
        provider: opt.nhaCungCap,
        origin: opt.huong === "di" ? diemDi.ten : diemDen.ten,
        destination: opt.huong === "di" ? diemDen.ten : diemDi.ten,
        departureTime: opt.gioDi,
        durationMinutes: opt.thoiLuongPhut,
        pricePerPerson: giaVND,
        seatClass: isPlane ? "Phổ thông" : opt.loai === "BUS" ? "Giường nằm" : "Ngồi mềm",
        boardingPoint: isPlane ? `Sân bay ${opt.huong === "di" ? diemDi.ten : diemDen.ten}` : `Bến xe ${opt.huong === "di" ? diemDi.ten : diemDen.ten}`,
        dropOffPoint: isPlane ? `Sân bay ${opt.huong === "di" ? diemDen.ten : diemDi.ten}` : `Bến xe ${opt.huong === "di" ? diemDen.ten : diemDi.ten}`,
        nguon: opt.nguon[0] ?? null,
        ngayLay: nowIso,
        doTinCay: "uoc_tinh",
        giaLaUocTinh: true,
        nguonGia: opt.nguon,
      });
    }

    const hasDi = liveTransports.some((t) => t.huong === "di");
    const hasVe = liveTransports.some((t) => t.huong === "ve");

    if (hasDi && hasVe) {
      writeCache(diemDi.ten, diemDen.ten, liveTransports);
      return { transports: liveTransports, status: "thanh_cong" };
    }
  }

  // 5. Fallback sang ước lượng quãng đường
  const estimated = taoPhuongTienUocLuong(diemDi, diemDen);
  if (estimated.length > 0) {
    writeCache(diemDi.ten, diemDen.ten, estimated);
    return { transports: estimated, status: "thanh_cong" };
  }

  // 6. Tuyến không có phương án nào
  return { transports: [], status: "khong_co_phuong_an" };
}
