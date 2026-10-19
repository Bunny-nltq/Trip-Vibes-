/**
 * eval/run-diadiem.ts
 *
 * Đánh giá khả năng mở rộng ĐIỂM ĐẾN BẤT KỲ của Trip Vibes:
 * 6 điểm đến mẫu: Đà Nẵng, Hà Nội, Đà Lạt, Phú Quốc, Bangkok, Seoul.
 * (điểm đi TP.HCM, 2 người, 15 triệu, 3 ngày; riêng Bangkok và Seoul đặt 25 triệu).
 *
 * Hỗ trợ chế độ --live-only (DATA_FALLBACK=off) để đo ĐỘ TIN CẬY THẬT của mạng
 * và in 2 bảng: (a) live-only, (b) có dự phòng.
 */

import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

if (!process.env.NOMINATIM_USER_AGENT) {
  process.env.NOMINATIM_USER_AGENT = "TripVibes/1.0 (student-project@tripvibes.vn)";
}

import { geocodeDestination } from "../src/data/live/geocodeClient";
import { LiveDataSource } from "../src/data/live/LiveDataSource";
import { planWithRepair } from "../src/ai/planWithRepair";
import { DEFAULT_DIEM_DI, type TripRequest, type DiemDen } from "../src/contracts";
import { isTavilyLimitReached } from "../src/data/live/searchClient";
import {
  getLastOverpassStatsSummary,
  lastOverpassStats,
} from "../src/data/live/overpassClient";

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
  trangThaiNoiDung: "CÓ NỘI DUNG" | "THIẾU DỮ LIỆU";
  dataSourceUsed: string;
  ngayDuLieu: string;
  snapshotDate?: string;
  ghiChuNguon?: string;
  tyLeLapHD: number;
  tyLeLapAn: number;
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

async function runSingleEval(allowFallback: boolean): Promise<DiadiemResult[]> {
  process.env.DATA_FALLBACK = allowFallback ? "on" : "off";
  const modeTitle = allowFallback ? "CÓ DỰ PHÒNG SNAPSHOT" : "LIVE-ONLY (TẮT DỰ PHÒNG)";
  console.log(`\n================================================================================`);
  console.log(`▶ BẮT ĐẦU CHẠY ĐÁNH GIÁ CHẾ ĐỘ: ${modeTitle}`);
  console.log(`================================================================================`);

  const results: DiadiemResult[] = [];

  for (const tc of TEST_CASES) {
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
          soLuongTheoLoai: { khachSan: 0, quanAn: 0, cafe: 0, hoatDong: 0 },
          tongSoMuc: 0,
          tyLeCoNguon: 0,
          soPhuongTienWeb: 0,
          soPhuongTienUocLuong: 0,
          keHoachHopLe: false,
          coNoiDung: false,
          trangThaiNoiDung: "THIẾU DỮ LIỆU",
          dataSourceUsed: "none",
          ngayDuLieu: new Date().toISOString(),
          tyLeLapHD: 0,
          tyLeLapAn: 0,
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
      const hardErrors = planRes.hard.map((h) => h.chiTiet);

      // Đếm slot chưa lấp
      let slotHDChuaLap = 0;
      let slotAnChuaLap = 0;
      if (planRes.plan) {
        for (let d = 1; d <= tc.days; d++) {
          const dayItems = planRes.plan.items.filter((it) => it.ngay === d);
          const hdCount = dayItems.filter((it) => it.hangMuc === "Vui chơi").length;
          const maxHd = d === 1 || d === tc.days ? 1 : 2;
          if (hdCount < maxHd) slotHDChuaLap += maxHd - hdCount;

          const anCount = dayItems.filter((it) => it.hangMuc === "Ăn uống").length;
          if (anCount < 2) slotAnChuaLap += 2 - anCount;
        }
      }

      const tongSlotHD = tc.days === 1 ? 1 : tc.days === 2 ? 2 : (tc.days - 2) * 2 + 2;
      const tongSlotAn = tc.days * 2;
      const tyLeLapHD = Math.max(0, (tongSlotHD - slotHDChuaLap) / tongSlotHD);
      const tyLeLapAn = Math.max(0, (tongSlotAn - slotAnChuaLap) / tongSlotAn);

      // Định nghĩa "CÓ NỘI DUNG" = không có vi phạm hard VÀ lấp được ít nhất 80% ô hoạt động và 80% bữa ăn
      const coNoiDung = keHoachHopLe && tyLeLapHD >= 0.8 && tyLeLapAn >= 0.8;
      const trangThaiNoiDung: "CÓ NỘI DUNG" | "THIẾU DỮ LIỆU" = coNoiDung ? "CÓ NỘI DUNG" : "THIẾU DỮ LIỆU";

      // Thống kê Overpass
      const currentStats = [...lastOverpassStats];
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

      let danhGia = coNoiDung
        ? "Tốt: Lập kế hoạch CÓ NỘI DUNG (đạt >= 80% hoạt động và ăn uống, không vi phạm hard)."
        : `THIẾU DỮ LIỆU: ${hardErrors.join("; ") || planRes.status || "Chưa lấp đủ 80% slot hoạt động hoặc ăn uống"}`;

      const resItem: DiadiemResult = {
        diemDen: tc.name,
        geocodeThanhCong: true,
        chiTietDiemDen: diemDen,
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
        dataSourceUsed: dsUsedInfo.source,
        ngayDuLieu: dsUsedInfo.ngayDuLieu,
        snapshotDate: dsUsedInfo.snapshotDate,
        ghiChuNguon,
        tyLeLapHD: Number(tyLeLapHD.toFixed(2)),
        tyLeLapAn: Number(tyLeLapAn.toFixed(2)),
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
      console.log(`   🏁 Kết quả: ${trangThaiNoiDung} | Nguồn: ${dsUsedInfo.source} | Máy chủ Overpass: ${overpassServer} (${overpassAttempts} lần thử)`);
      if (overpassError) console.log(`   ℹ️ Lý do lỗi/thiếu: ${overpassError}`);
      console.log(`   📊 Tỷ lệ lấp: HĐ ${(tyLeLapHD * 100).toFixed(0)}%, Ăn ${(tyLeLapAn * 100).toFixed(0)}% | Đánh giá: ${danhGia}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   ❌ Lỗi khi xử lý ${tc.name}: ${msg}`);
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        console.warn("⚠️ Gặp lỗi 429 hạn mức. Dừng xử lý các điểm tiếp theo.");
        break;
      }
    }

    // Nghỉ 5 giây giữa các điểm đến theo yêu cầu B.5
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

  // 1. Chạy lượt Live-Only (đo độ tin cậy thực tế từ mạng, không snapshot, không mock)
  const resultsLive = await runSingleEval(false);

  // 2. Chạy lượt Có Dự Phòng (nếu live rỗng thì fallback snapshot nếu có)
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
      "Nguồn DL": r.dataSourceUsed,
      "Lấp (HĐ/Ăn)": `${(r.tyLeLapHD * 100).toFixed(0)}% / ${(r.tyLeLapAn * 100).toFixed(0)}%`,
      "Máy chủ Overpass / Thử": `${r.overpassServer} (${r.overpassAttempts} lần)`,
      "Lý do lỗi (nếu có)": r.overpassError ?? (r.loiHard.length > 0 ? r.loiHard.join("; ") : ""),
    }))
  );

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
      "Nguồn DL": r.dataSourceUsed,
      "Lấp (HĐ/Ăn)": `${(r.tyLeLapHD * 100).toFixed(0)}% / ${(r.tyLeLapAn * 100).toFixed(0)}%`,
      "Máy chủ Overpass / Thử": `${r.overpassServer} (${r.overpassAttempts} lần)`,
      "Ghi chú nguồn / Lý do": r.ghiChuNguon ?? (r.overpassError ?? (r.loiHard.length > 0 ? r.loiHard.join("; ") : "")),
    }))
  );
  console.log("================================================================================\n");

  // Lưu file kết quả
  const dateStr = new Date().toISOString().slice(0, 10);
  const resultsDir = path.resolve(process.cwd(), "eval/results");
  fs.mkdirSync(resultsDir, { recursive: true });
  fs.writeFileSync(
    path.join(resultsDir, `diadiem-live-${dateStr}.json`),
    JSON.stringify(resultsLive, null, 2),
    "utf-8"
  );
  fs.writeFileSync(
    path.join(resultsDir, `diadiem-fallback-${dateStr}.json`),
    JSON.stringify(resultsFallback, null, 2),
    "utf-8"
  );
}

main().catch((err) => {
  console.error("Lỗi khi chạy eval:diadiem:", err);
  process.exit(1);
});
