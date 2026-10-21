/**
 * eval/run-diadiem.ts
 *
 * Đánh giá khả năng mở rộng ĐIỂM ĐẾN BẤT KỲ của Trip Vibes:
 * 6 điểm đến mẫu: Đà Nẵng, Hà Nội, Đà Lạt, Phú Quốc, Bangkok, Seoul.
 * (điểm đi TP.HCM, 2 người, 15 triệu, 3 ngày; riêng Bangkok và Seoul đặt 25 triệu).
 *
 * Hỗ trợ cờ:
 *   --live-only: chỉ chạy bảng Live-Only (DATA_FALLBACK=off) và xóa cache Overpass trước khi chạy để đo mạng thật.
 *   --no-agent-cache: bỏ qua cache lựa chọn agent.
 */

import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

if (!process.env.NOMINATIM_USER_AGENT) {
  process.env.NOMINATIM_USER_AGENT = "TripVibes/1.0 (student-project@tripvibes.vn)";
}

const args = process.argv.slice(2);
const isLiveOnlyFlag = args.includes("--live-only");
const isNoAgentCacheFlag = args.includes("--no-agent-cache");

if (isNoAgentCacheFlag) {
  process.env.NO_AGENT_CACHE = "1";
}

import { geocodeDestination } from "../src/data/live/geocodeClient";
import { LiveDataSource } from "../src/data/live/LiveDataSource";
import { planWithRepair } from "../src/ai/planWithRepair";
import { DEFAULT_DIEM_DI, type TripRequest, type DiemDen } from "../src/contracts";
import { isTavilyLimitReached } from "../src/data/live/searchClient";
import {
  getLastOverpassStatsSummary,
  lastOverpassStats,
  clearAllOverpassCache,
  getOverpassEndpoints,
  type OverpassExecutionStats,
} from "../src/data/live/overpassClient";
import { soOKhaDung } from "../src/core/oKhaDung";
import { taoMetaEval } from "./lib/meta";
import { QUY_TAC_VERSION } from "../src/core/assumptions";
import { AGENT_PROMPT_VERSION } from "../src/ai/planAgent";

interface DestinationTestCase {
  name: string;
  budgetVND: number;
  people: number;
  days: number;
}

const TEST_CASES: DestinationTestCase[] = [
  { name: "Đà Nẵng", budgetVND: 15_000_000, people: 2, days: 3 },
  { name: "Hà Nội", budgetVND: 15_000_000, people: 2, days: 3 },
  { name: "Đà Lạt", budgetVND: 15_000_000, people: 2, days: 3 },
  { name: "Phú Quốc", budgetVND: 15_000_000, people: 2, days: 3 },
  { name: "Bangkok", budgetVND: 25_000_000, people: 2, days: 3 },
  { name: "Seoul", budgetVND: 25_000_000, people: 2, days: 3 },
];

export interface DiadiemResult {
  diemDen: string;
  geocodeThanhCong: boolean;
  chiTietDiemDen?: DiemDen;
  durationMs: number;
  soLuongTheoLoai: {
    khachSan: number;
    quanAn: number;
    cafe: number;
    hoatDong: number;
  };
  tongSoMuc: number;
  tyLeCoNguon: number;
  soPhuongTienWeb: number;
  soPhuongTienUocLuong: number;
  keHoachHopLe: boolean;
  coNoiDung: boolean;
  trangThaiNoiDung: "CÓ NỘI DUNG" | "CHƯA LẤP ĐỦ Ô" | "CÓ VI PHẠM" | "THIẾU DỮ LIỆU";
  nguonDL: "mới từ mạng" | string;
  ngayDuLieu: string;
  snapshotDate?: string;
  ghiChuNguon?: string;
  tyLeLapHD: number;
  tyLeLapAn: number;
  hienThiAn: string;
  chiTietCache: string[];
  overpassSummary: string;
  overpassServer: string;
  overpassAttempts: number;
  overpassError?: string;
  loiHard: string[];
  soSlotChuaLap: {
    hoatDong: number;
    buaAn: number;
  };
  soLuotGoi: {
    nominatim: number;
    tavily: number;
    gemini: number;
  };
  danhGia: string;
  error?: string;
}

function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
  }
  return null;
}

function determineNguonDL(
  totalItems: number,
  dsSource: string,
  snapshotDate: string | undefined,
  stats: OverpassExecutionStats[]
): string {
  if (totalItems === 0) return "không có";
  if (dsSource === "snapshot") {
    const d = snapshotDate ? snapshotDate.slice(0, 10) : "2026-10-19";
    return `snapshot (ngày ${d})`;
  }
  const fromNetwork = stats.some((s) => !s.fromCache && s.itemCount > 0);
  if (fromNetwork) {
    return "mới từ mạng";
  }
  const cachedStats = stats.filter((s) => s.fromCache);
  if (cachedStats.length > 0) {
    const avgAge = (
      cachedStats.reduce((sum, s) => sum + (s.cacheAgeHours ?? 0), 0) /
      cachedStats.length
    ).toFixed(1);
    return `cache (tuổi ${avgAge} giờ)`;
  }
  return "không có";
}

async function runSingleEval(allowFallback: boolean): Promise<DiadiemResult[]> {
  process.env.DATA_FALLBACK = allowFallback ? "on" : "off";
  const modeTitle = allowFallback ? "CÓ DỰ PHÒNG SNAPSHOT" : "LIVE-ONLY (TẮT DỰ PHÒNG)";
  console.log(`\n================================================================================`);
  console.log(`▶ BẮT ĐẦU CHẠY ĐÁNH GIÁ CHẾ ĐỘ: ${modeTitle}`);
  console.log(`================================================================================`);

  if (!allowFallback) {
    console.log("🧹 Xóa cache Overpass trước lượt chạy LIVE-ONLY để đo mạng thật...");
    clearAllOverpassCache();
  }

  const results: DiadiemResult[] = [];

  for (const tc of TEST_CASES) {
    const startCaseTime = Date.now();
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`▶ [${modeTitle}] Đang kiểm tra: ${tc.name} (${tc.days} ngày, ${tc.people} người, ${(tc.budgetVND / 1_000_000)} triệu VND)...`);

    if (isTavilyLimitReached()) {
      console.warn("⚠️ Tavily đã hết hạn mức (429/limit). Dừng các điểm đến tiếp theo.");
      break;
    }

    lastOverpassStats.length = 0;
    let nominatimCalls = 0;
    let tavilyCalls = 0;
    let geminiCalls = 0;

    try {
      // 1. Geocode
      nominatimCalls++;
      const geo = await geocodeDestination(tc.name);
      if (geo.status !== "thanh_cong") {
        const failRes: DiadiemResult = {
          diemDen: tc.name,
          geocodeThanhCong: false,
          durationMs: Date.now() - startCaseTime,
          soLuongTheoLoai: { khachSan: 0, quanAn: 0, cafe: 0, hoatDong: 0 },
          tongSoMuc: 0,
          tyLeCoNguon: 0,
          soPhuongTienWeb: 0,
          soPhuongTienUocLuong: 0,
          keHoachHopLe: false,
          coNoiDung: false,
          trangThaiNoiDung: "THIẾU DỮ LIỆU",
          nguonDL: "không có",
          ngayDuLieu: new Date().toISOString(),
          tyLeLapHD: 0,
          tyLeLapAn: 0,
          hienThiAn: "không có quán",
          chiTietCache: [],
          overpassSummary: "Không gọi (geocode thất bại)",
          overpassServer: "N/A",
          overpassAttempts: 0,
          overpassError: "Geocode không thành công qua Nominatim",
          loiHard: ["Geocode không thành công"],
          soSlotChuaLap: { hoatDong: 0, buaAn: 0 },
          soLuotGoi: { nominatim: nominatimCalls, tavily: 0, gemini: 0 },
          danhGia: "THIẾU DỮ LIỆU: Không định vị được địa danh qua Nominatim.",
        };
        results.push(failRes);
        console.log(`   ⏳ Nghỉ 5 giây trước điểm đến kế tiếp...`);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }

      const diemDen = geo.diemDen;
      console.log(`   ✅ Geocode thành công: ${diemDen.ten}, ${diemDen.quocGia} (${diemDen.maQuocGia}) [${diemDen.toaDo.lat}, ${diemDen.toaDo.lng}], Tiền tệ: ${diemDen.tienTe}`);

      // 2. Live data source
      const ds = new LiveDataSource(undefined, undefined, diemDen, DEFAULT_DIEM_DI, tc.days);
      const [khachSans, quanAns, cafes, hoatDongs, transports] = await Promise.all([
        ds.getKhachSans(),
        ds.getQuanAns(),
        ds.getCafes(),
        ds.getHoatDongs(),
        ds.getTransports(),
      ]);

      const dsUsedInfo = ds.getDataSourceUsed();
      const countKS = khachSans.length;
      const countQA = quanAns.length;
      const countCafe = cafes.length;
      const countHD = hoatDongs.length;
      const totalItems = countKS + countQA + countCafe + countHD;

      let itemsWithSource = 0;
      for (const item of [...khachSans, ...quanAns, ...cafes, ...hoatDongs]) {
        if (item.nguon) itemsWithSource++;
      }
      const sourceRatio = totalItems > 0 ? itemsWithSource / totalItems : 0;

      let transportWeb = 0;
      let transportEst = 0;
      for (const tr of transports) {
        if (tr.id.startsWith("live_") || (tr.nguonGia && tr.nguonGia.length > 0)) {
          transportWeb++;
        } else {
          transportEst++;
        }
      }

      console.log(`   📦 Dữ liệu địa điểm: ${countKS} KS, ${countQA} quán ăn, ${countCafe} cafe, ${countHD} hoạt động (Tổng: ${totalItems}, nguồn: ${dsUsedInfo.source})`);
      console.log(`   🚗 Phương tiện: ${transportWeb} web, ${transportEst} ước lượng`);

      // 3. Lập kế hoạch
      const tripReq: TripRequest = {
        schemaVersion: 7,
        diemDi: DEFAULT_DIEM_DI,
        diemDen,
        soNgay: tc.days,
        soNguoi: tc.people,
        ngansachTongVND: tc.budgetVND,
        sothich: ["bien", "van_hoa_lich_su", "am_thuc"],
        tranh: [],
        ghiChu: [],
        thieu: [],
        cauHoiLamRo: [],
        canhBao: [],
      };

      const planRes = await planWithRepair(tripReq);
      geminiCalls += planRes.soLanGoiAI || 0;

      const keHoachHopLe = planRes.status === "ok" && planRes.hard.length === 0 && Boolean(planRes.plan);
      const hardCodes = planRes.hard.map((h) => h.code);
      const hardErrors = planRes.hard.map((h) => `[${h.code}] ${h.chiTiet || ""}`);

      // 4. Tính toán số ô khả dụng theo hàm chuẩn core soOKhaDung
      let gioDenPhutNgay1 = 475; // default 07:55
      const diItem = planRes.plan?.items.find(
        (it) => it.hangMuc === "Di chuyển" && it.ngay === 1
      );
      if (diItem) {
        const tDi = transports.find((t) => t.id === diItem.refId);
        if (tDi?.departureTime) {
          const dep = parseTimeToMinutes(tDi.departureTime);
          const dur = tDi.durationMinutes ?? 120;
          if (dep !== null) gioDenPhutNgay1 = dep + dur;
        } else if (diItem.gio) {
          const dep = parseTimeToMinutes(diItem.gio);
          if (dep !== null) gioDenPhutNgay1 = dep + 120;
        }
      }

      let gioKhoiHanhVePhut = 1080; // default 18:00
      const veItem = planRes.plan?.items.find(
        (it) => it.hangMuc === "Di chuyển" && it.ngay === tc.days
      );
      if (veItem) {
        const tVe = transports.find((t) => t.id === veItem.refId);
        if (tVe?.departureTime) {
          const dep = parseTimeToMinutes(tVe.departureTime);
          if (dep !== null) gioKhoiHanhVePhut = dep;
        } else if (veItem.gio) {
          const dep = parseTimeToMinutes(veItem.gio);
          if (dep !== null) gioKhoiHanhVePhut = dep;
        }
      }

      const oKhaDungHD = soOKhaDung(tc.days, gioDenPhutNgay1, gioKhoiHanhVePhut);
      const hdDaXep = planRes.plan
        ? planRes.plan.items.filter((it) => it.hangMuc === "Vui chơi").length
        : 0;
      const tyLeLapHD = oKhaDungHD > 0 ? Math.min(1, hdDaXep / oKhaDungHD) : 1;
      const slotHDChuaLap = Math.max(0, oKhaDungHD - hdDaXep);

      const tongSlotAn = tc.days * 2;
      const anDaXep = planRes.plan
        ? planRes.plan.items.filter((it) => it.hangMuc === "Ăn uống" && Boolean(it.refId)).length
        : 0;
      const tyLeLapAn = countQA > 0 ? Math.min(1, anDaXep / tongSlotAn) : 0;
      const slotAnChuaLap = Math.max(0, tongSlotAn - anDaXep);
      const hienThiAn = countQA > 0 ? `${(tyLeLapAn * 100).toFixed(0)}%` : "không có quán";

      // 5. Xác định TRẠNG THÁI (4 loại) và NGUỒN DL (4 giá trị)
      // "CÓ NỘI DUNG"; "CHƯA LẤP ĐỦ Ô" (không có hard, đủ dữ liệu nhưng lấp < 80% ô khả dụng); "CÓ VI PHẠM" (còn hard, kèm mã); "THIẾU DỮ LIỆU" (kho dưới ngưỡng)
      const isKhoDuLieuThieu = countKS < 1 || countQA < 1 || countHD < 1;
      let trangThaiNoiDung: "CÓ NỘI DUNG" | "CHƯA LẤP ĐỦ Ô" | "CÓ VI PHẠM" | "THIẾU DỮ LIỆU";

      if (isKhoDuLieuThieu || planRes.status === "khong_du_du_lieu") {
        trangThaiNoiDung = "THIẾU DỮ LIỆU";
      } else if (planRes.hard.length > 0) {
        trangThaiNoiDung = "CÓ VI PHẠM";
      } else if (tyLeLapHD < 0.8) {
        trangThaiNoiDung = "CHƯA LẤP ĐỦ Ô";
      } else {
        trangThaiNoiDung = "CÓ NỘI DUNG";
      }

      const coNoiDung = trangThaiNoiDung === "CÓ NỘI DUNG";

      const currentStats = [...lastOverpassStats];
      const nguonDL = determineNguonDL(
        totalItems,
        dsUsedInfo.source,
        dsUsedInfo.snapshotDate,
        currentStats
      );

      const chiTietCache = currentStats
        .filter((s) => s.fromCache)
        .map((s) => {
          const originSv = s.cacheMetadata?.mayChu
            ? ` từ ${s.cacheMetadata.mayChu}`
            : s.server !== "cache"
            ? ` từ ${s.server}`
            : "";
          const run = s.cacheMetadata?.runId ? ` [${s.cacheMetadata.runId}]` : "";
          return `${s.loai}: tuổi ${s.cacheAgeHours}h${originSv}${run}`;
        });

      // Thống kê Overpass
      const successfulStats = currentStats.filter((s) => s.itemCount > 0);
      let overpassServer = "N/A";
      if (successfulStats.length > 0) {
        try {
          overpassServer = successfulStats
            .map((s) => new URL(s.server).hostname)
            .filter((v, i, a) => a.indexOf(v) === i)
            .join(", ");
        } catch {
          overpassServer = successfulStats[0].server;
        }
      } else if (currentStats.length > 0) {
        try {
          overpassServer = new URL(currentStats[0].server).hostname;
        } catch {
          overpassServer = currentStats[0].server;
        }
      }
      const overpassAttempts = currentStats.reduce((acc, cur) => Math.max(acc, cur.attempts), 0);
      const overpassError = currentStats.find((s) => s.error)?.error || (planRes.status === "khong_du_du_lieu" ? planRes.hard[0]?.chiTiet : undefined);
      const overpassSummary = getLastOverpassStatsSummary();

      let ghiChuNguon: string | undefined = undefined;
      if (allowFallback && dsUsedInfo.source === "snapshot") {
        const snapDate = dsUsedInfo.snapshotDate?.slice(0, 10) || "2026-10-19";
        const liveDate = dsUsedInfo.ngayDuLieu.slice(0, 10);
        ghiChuNguon = `từ snapshot ngày ${snapDate}, dữ liệu live lấy ngày ${liveDate}`;
      }

      let danhGia = "";
      if (trangThaiNoiDung === "CÓ NỘI DUNG") {
        danhGia = "Tốt: Lập kế hoạch CÓ NỘI DUNG (đạt >= 80% ô khả dụng, không vi phạm hard).";
      } else if (trangThaiNoiDung === "CHƯA LẤP ĐỦ Ô") {
        danhGia = "CHƯA LẤP ĐỦ Ô: Chưa lấp đủ 80% ô khả dụng (không vi phạm hard).";
      } else if (trangThaiNoiDung === "CÓ VI PHẠM") {
        danhGia = `CÓ VI PHẠM: còn lỗi hard [${hardCodes.join(", ")}]`;
      } else {
        danhGia = `THIẾU DỮ LIỆU: kho địa điểm thiếu hoặc chưa đủ tối thiểu`;
      }

      const resItem: DiadiemResult = {
        diemDen: tc.name,
        geocodeThanhCong: true,
        chiTietDiemDen: diemDen,
        durationMs: Date.now() - startCaseTime,
        soLuongTheoLoai: {
          khachSan: countKS,
          quanAn: countQA,
          cafe: countCafe,
          hoatDong: countHD,
        },
        tongSoMuc: totalItems,
        tyLeCoNguon: Number(sourceRatio.toFixed(3)),
        soPhuongTienWeb: transportWeb,
        soPhuongTienUocLuong: transportEst,
        keHoachHopLe,
        coNoiDung,
        trangThaiNoiDung,
        nguonDL,
        ngayDuLieu: dsUsedInfo.ngayDuLieu,
        snapshotDate: dsUsedInfo.snapshotDate,
        ghiChuNguon,
        tyLeLapHD: Number(tyLeLapHD.toFixed(2)),
        tyLeLapAn: Number(tyLeLapAn.toFixed(2)),
        hienThiAn,
        chiTietCache,
        overpassSummary,
        overpassServer,
        overpassAttempts,
        overpassError,
        loiHard: hardErrors,
        soSlotChuaLap: {
          hoatDong: slotHDChuaLap,
          buaAn: slotAnChuaLap,
        },
        soLuotGoi: {
          nominatim: nominatimCalls,
          tavily: tavilyCalls,
          gemini: geminiCalls,
        },
        danhGia,
      };

      results.push(resItem);
      console.log(`   🏁 Kết quả: ${trangThaiNoiDung} | Nguồn: ${nguonDL} | Thời gian: ${resItem.durationMs}ms | Máy chủ Overpass: ${overpassServer} (${overpassAttempts} lần thử)`);
      if (overpassError) console.log(`   ℹ️ Lý do lỗi/thiếu: ${overpassError}`);
      console.log(`   📊 Tỷ lệ lấp: HĐ ${(tyLeLapHD * 100).toFixed(0)}% (${hdDaXep}/${oKhaDungHD} ô khả dụng), Ăn: ${hienThiAn} | Đánh giá: ${danhGia}`);
      if (chiTietCache.length > 0) {
        console.log(`   💾 Nguồn gốc cache: ${chiTietCache.join("; ")}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   ❌ Lỗi khi xử lý ${tc.name}: ${msg}`);
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        console.warn("⚠️ Gặp lỗi 429 hạn mức. Dừng xử lý các điểm tiếp theo.");
        break;
      }
    }

    // Nghỉ 5 giây giữa các điểm đến theo yêu cầu
    console.log(`   ⏳ Nghỉ 5 giây trước điểm đến kế tiếp...`);
    await new Promise((r) => setTimeout(r, 5000));
  }

  return results;
}

async function main() {
  console.log("================================================================================");
  console.log("          TRIP VIBES – ĐÁNH GIÁ ĐIỂM ĐẾN BẤT KỲ (EVAL:DIADIEM)                 ");
  console.log("================================================================================");
  console.log("6 điểm đến mẫu: Đà Nẵng, Hà Nội, Đà Lạt, Phú Quốc, Bangkok, Seoul");
  console.log("Điểm khởi hành: TP.HCM");
  console.log("🌐 Thứ tự máy chủ Overpass cấu hình: " + getOverpassEndpoints().join(" -> "));
  if (isLiveOnlyFlag) console.log("Cờ: --live-only (chỉ chạy bảng Live-Only)");
  if (isNoAgentCacheFlag) console.log("Cờ: --no-agent-cache (bỏ qua agent choice cache)");

  // 1. Chạy lượt Live-Only (đo độ tin cậy thực tế từ mạng, không snapshot, xóa cache trước khi chạy)
  const resultsLive = await runSingleEval(false);

  // 2. Chạy lượt Có Dự Phòng (sử dụng cache vừa thu được từ Live + snapshot nếu thiếu)
  const resultsFallback = await runSingleEval(true);

  // 3. In BẢNG A: LIVE-ONLY
  console.log("\n================================================================================");
  console.log("     BẢNG A: KẾT QUẢ ĐÁNH GIÁ LIVE-ONLY (ĐO ĐỘ TIN CẬY THỰC TẾ TỪ MẠNG)         ");
  console.log("================================================================================");
  console.table(
    resultsLive.map((r) => ({
      "Điểm đến": r.diemDen,
      "Geocode": r.geocodeThanhCong ? "OK" : "FAIL",
      "KS": r.soLuongTheoLoai.khachSan,
      "Quán ăn": r.soLuongTheoLoai.quanAn,
      "Cafe": r.soLuongTheoLoai.cafe,
      "H.Động": r.soLuongTheoLoai.hoatDong,
      "Trạng thái": r.trangThaiNoiDung,
      "Nguồn DL": r.nguonDL,
      "Lấp HĐ": `${(r.tyLeLapHD * 100).toFixed(0)}%`,
      "Ăn": r.hienThiAn,
      "Thời gian": `${r.durationMs}ms`,
      "Máy chủ Overpass / Thử": `${r.overpassServer} (${r.overpassAttempts} lần)`,
      "Lý do lỗi / vi phạm":
        r.loiHard.length > 0
          ? r.loiHard.join("; ")
          : (r.overpassError ?? ""),
    }))
  );

  // In chi tiết cache nếu có
  const liveWithCache = resultsLive.filter((r) => r.chiTietCache.length > 0);
  if (liveWithCache.length > 0) {
    console.log("\nChi tiết cache bảng Live-only:");
    for (const r of liveWithCache) {
      console.log(`- ${r.diemDen}: ${r.chiTietCache.join("; ")}`);
    }
  }

  // 4. In BẢNG B: CÓ DỰ PHÒNG SNAPSHOT
  console.log("\n================================================================================");
  console.log("     BẢNG B: KẾT QUẢ ĐÁNH GIÁ CÓ DỰ PHÒNG SNAPSHOT                              ");
  console.log("================================================================================");
  console.table(
    resultsFallback.map((r) => ({
      "Điểm đến": r.diemDen,
      "Geocode": r.geocodeThanhCong ? "OK" : "FAIL",
      "KS": r.soLuongTheoLoai.khachSan,
      "Quán ăn": r.soLuongTheoLoai.quanAn,
      "Cafe": r.soLuongTheoLoai.cafe,
      "H.Động": r.soLuongTheoLoai.hoatDong,
      "Trạng thái": r.trangThaiNoiDung,
      "Nguồn DL": r.nguonDL,
      "Lấp HĐ": `${(r.tyLeLapHD * 100).toFixed(0)}%`,
      "Ăn": r.hienThiAn,
      "Thời gian": `${r.durationMs}ms`,
      "Máy chủ Overpass / Thử": `${r.overpassServer} (${r.overpassAttempts} lần)`,
      "Ghi chú nguồn / Lý do":
        r.ghiChuNguon ??
        (r.loiHard.length > 0
          ? r.loiHard.join("; ")
          : (r.overpassError ?? "")),
    }))
  );

  // In chi tiết nguồn gốc cache từng loại ở bảng B
  console.log("\nChi tiết nguồn gốc và tuổi của cache (Bảng B):");
  for (const r of resultsFallback) {
    if (r.chiTietCache.length > 0) {
      console.log(`- ${r.diemDen}: ${r.chiTietCache.join("; ")}`);
    } else {
      console.log(`- ${r.diemDen}: dữ liệu live mới từ mạng hoặc snapshot trực tiếp.`);
    }
  }

  console.log("\nℹ️ Ghi chú máy chủ https://overpass-api.de: Thường xuyên gặp lỗi (fetch failed / timeout kết nối) do bị nghẽn mạng quốc tế hoặc quá tải. Hệ thống tự động ưu tiên máy chủ phản hồi nhanh https://maps.mail.ru và dự phòng https://overpass.private.coffee.");
  console.log("================================================================================\n");

  // Lưu file kết quả
  const dateStr = new Date().toISOString().slice(0, 10);
  const resultsDir = path.resolve(process.cwd(), "eval/results");
  fs.mkdirSync(resultsDir, { recursive: true });

  const meta = taoMetaEval({
    quyTacVersion: QUY_TAC_VERSION,
    agentPromptVersion: AGENT_PROMPT_VERSION,
    model: "khong_dung_ai",
    ngayChayISO: new Date().toISOString(),
    tenBo: "diadiem",
  });
  const payloadLive = {
    meta,
    results: resultsLive,
  };
  const payloadFallback = {
    meta,
    results: resultsFallback,
  };

  fs.writeFileSync(
    path.join(resultsDir, `diadiem-live-${dateStr}.json`),
    JSON.stringify(payloadLive, null, 2),
    "utf-8"
  );
  if (!isLiveOnlyFlag) {
    fs.writeFileSync(
      path.join(resultsDir, `diadiem-fallback-${dateStr}.json`),
      JSON.stringify(payloadFallback, null, 2),
      "utf-8"
    );
  }
}

main().catch((err) => {
  console.error("Lỗi khi chạy eval:diadiem:", err);
  process.exit(1);
});
