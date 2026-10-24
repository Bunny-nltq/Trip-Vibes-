import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { type TripRequest, type Selection, DEFAULT_DIEM_DI } from "../src/contracts";
import { LiveDataSource } from "../src/data/live/LiveDataSource";
import { getSnapshotDiemDen } from "../src/data/prepareDestination";
import { GeminiProvider } from "../src/ai/provider";
import { planRegenerate, REGEN_PROMPT_VERSION } from "../src/ai/planRegenerate";
import { taoMetaEval } from "./lib/meta";
import { QUY_TAC_VERSION } from "../src/core/assumptions";
import { AGENT_PROMPT_VERSION } from "../src/ai/planAgent";

loadEnvConfig(process.cwd());

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Scenario {
  name: string;
  sothich: string[];
  ghiChu: string[];
}

const SCENARIOS: Scenario[] = [
  {
    name: "1. [bien, hai_san]",
    sothich: ["bien", "hai_san"],
    ghiChu: [],
  },
  {
    name: "2. [van_hoa_lich_su, am_thuc]",
    sothich: ["van_hoa_lich_su", "am_thuc"],
    ghiChu: [],
  },
  {
    name: "3. [thien_nhien, check_in_chup_anh]",
    sothich: ["thien_nhien", "check_in_chup_anh"],
    ghiChu: [],
  },
  {
    name: "4. [thu_gian_spa]",
    sothich: ["thu_gian_spa"],
    ghiChu: [],
  },
  {
    name: "5. [] + không muốn đi bộ nhiều",
    sothich: [],
    ghiChu: ["không muốn đi bộ nhiều"],
  },
];

async function main() {
  const args = process.argv.slice(2);
  const noCache = args.includes("--no-cache");

  const cacheDir = path.resolve(process.cwd(), "eval/.cache");
  fs.mkdirSync(cacheDir, { recursive: true });

  const resultsDir = path.resolve(process.cwd(), "eval/results");
  fs.mkdirSync(resultsDir, { recursive: true });

  console.log("\n========================================================");
  console.log("       TRIP VIBES – ĐÁNH GIÁ GỢI Ý HỢP GU HƠN (BƯỚC 8)");
  console.log("========================================================");
  console.log(`Số kịch bản: ${SCENARIOS.length}`);
  console.log(`Dùng cache:  ${noCache ? "KHÔNG (--no-cache)" : "CÓ"}\n`);

  let provider: GeminiProvider;
  try {
    provider = new GeminiProvider();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ Không thể khởi tạo GeminiProvider: " + msg);
    process.exit(1);
  }

  const resolvedDiemDen = getSnapshotDiemDen("Đà Nẵng")!;
  const resolvedDiemDi = DEFAULT_DIEM_DI;
  const dataSource = new LiveDataSource(
    "snapshot",
    "snapshot_da_nang_2026-10-20.json",
    resolvedDiemDen,
    resolvedDiemDi,
    3
  );
  const [transports, hotels, activities, khachSans, quanAns, cafes, hoatDongs] =
    await Promise.all([
      dataSource.getTransports(),
      dataSource.getHotels(),
      dataSource.getActivities(),
      dataSource.getKhachSans(),
      dataSource.getQuanAns(),
      dataSource.getCafes(),
      dataSource.getHoatDongs(),
    ]);

  const allHotels = [...hotels, ...(khachSans || [])];
  const allActs = [...activities, ...(hoatDongs || [])];

  const data = {
    transports,
    hotels,
    activities,
    khachSans,
    quanAns,
    cafes,
    hoatDongs,
  };

  const transportDi =
    transports.find(
      (t: any) => t.huong === "di" && (t.pricePerPerson ?? t.giaVeNguoi ?? 0) <= 1_200_000
    ) || transports[0];
  const transportVe =
    transports.find(
      (t: any) => t.huong === "ve" && (t.pricePerPerson ?? t.giaVeNguoi ?? 0) <= 1_200_000
    ) || transports[transports.length - 1];
  const hotel =
    allHotels.find(
      (h: any) => (h.pricePerNight ?? h.giaPhongDem ?? 0) <= 1_500_000
    ) || allHotels[1] || allHotels[0];

  const act1 = allActs[0]?.id;
  const act2 = allActs[1]?.id;
  const act3 = allActs[2]?.id;
  const act4 = allActs[3]?.id;

  if (!transportDi || !transportVe || !hotel || !act1) {
    console.error("❌ Không đủ dữ liệu phương tiện, khách sạn hoặc hoạt động để lập kế hoạch gốc.");
    process.exit(1);
  }

  // Kế hoạch gốc (4 hoạt động: ngày 1 có 1, ngày 2 có 2, ngày 3 có 1)
  const baseSelection: Selection = {
    transportDiId: transportDi.id,
    transportVeId: transportVe.id,
    hotelId: hotel.id,
    hoatDongTheoNgay: [
      [act1],
      [act2, act3].filter(Boolean),
      [act4 || act1],
    ],
    buaAnTheoNgay: [
      { trua: null, toi: null, cafe: null },
      { trua: null, toi: null, cafe: null },
      { trua: null, toi: null, cafe: null },
    ],
  };

  const results: any[] = [];
  let stoppedBy429 = false;

  for (let idx = 0; idx < SCENARIOS.length; idx++) {
    const sc = SCENARIOS[idx];
    if (stoppedBy429) {
      console.log(`⚠️ Bỏ qua kịch bản "${sc.name}" do gặp lỗi 429 trước đó.`);
      continue;
    }

    const currentRequest: TripRequest = {
      schemaVersion: 6,
      diemDi: "TP.HCM",
      diemDen: "Đà Nẵng",
      soNguoi: 2,
      soNgay: 3,
      ngansachTongVND: 10_000_000,
      sothich: sc.sothich as any,
      tranh: sc.ghiChu.some((g) => g.includes("đi bộ")) ? ["tranh_di_bo_nhieu"] : [],
      ghiChu: sc.ghiChu,
      thieu: [],
      cauHoiLamRo: [],
      canhBao: [],
    };

    console.log(`▶ Đang chạy: ${sc.name}...`);

    try {
      const res = await planRegenerate({
        request: currentRequest,
        selection: baseSelection,
        data,
        provider,
        noCache,
      });

      const hopLe = res.hard.length === 0;
      const isHigher = res.diemKhopSau > res.diemKhopTruoc;

      console.log(`  ✓ Hợp lệ: ${hopLe ? "ĐẠT" : "KHÔNG (có vi phạm hard)"}`);
      console.log(`  ✓ Điểm khớp sở thích: trước ${res.diemKhopTruoc} -> sau ${res.diemKhopSau} (${isHigher ? "TĂNG" : "KHÔNG TĂNG"})`);
      console.log(`  ✓ Số lượt gọi AI: ${res.soLanGoiAI}`);

      results.push({
        scenario: sc.name,
        sothich: sc.sothich,
        ghiChu: sc.ghiChu,
        hopLe,
        hard: res.hard,
        soft: res.soft,
        diemKhopTruoc: res.diemKhopTruoc,
        diemKhopSau: res.diemKhopSau,
        soLanGoiAI: res.soLanGoiAI,
        planSauActivities: res.selection.hoatDongTheoNgay,
      });

      await sleep(1500);
    } catch (err: any) {
      const msg = err.message || String(err);
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        console.error(`❌ Gặp lỗi 429 khi chạy kịch bản "${sc.name}". Dừng lại.`);
        stoppedBy429 = true;
        break;
      } else {
        console.error(`❌ Lỗi kịch bản "${sc.name}":`, msg);
        results.push({
          scenario: sc.name,
          error: msg,
          hopLe: false,
        });
      }
    }
  }

  // Tổng hợp thống kê
  const totalRan = results.filter((r) => !r.error).length;
  const numHopLe = results.filter((r) => r.hopLe).length;
  const numHigher = results.filter((r) => r.diemKhopSau > r.diemKhopTruoc).length;
  const totalCalls = results.reduce((sum, r) => sum + (r.soLanGoiAI || 0), 0);
  const avgCalls = totalRan > 0 ? Number((totalCalls / totalRan).toFixed(2)) : 0;
  const passRate = totalRan > 0 ? Number(((numHopLe / totalRan) * 100).toFixed(1)) : 0;

  console.log("\n========================================================");
  console.log("                   BẢNG TỔNG HỢP KẾT QUẢ");
  console.log("========================================================");
  console.log(`• Số ca hoàn thành:               ${totalRan}/${SCENARIOS.length}`);
  console.log(`• Tỷ lệ hợp lệ (không vi phạm):  ${passRate}% (${numHopLe}/${totalRan})`);
  console.log(`• Số ca tăng độ khớp (sau > trước): ${numHigher}/${totalRan}`);
  console.log(`• Trung bình số lượt gọi Gemini:   ${avgCalls} lượt/ca`);

  if (stoppedBy429) {
    console.log(`⚠️ Lưu ý: Đã dừng do giới hạn hạn mức 429. Các ca đã xong: ${results.map((r) => r.scenario).join(", ")}`);
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const outputFile = path.join(resultsDir, `likes-${dateStr}.json`);

  const meta = taoMetaEval({
    quyTacVersion: QUY_TAC_VERSION,
    agentPromptVersion: AGENT_PROMPT_VERSION,
    model: provider.modelName,
    ngayChayISO: now.toISOString(),
    tenBo: "likes",
  });

  const outputData = {
    meta,
    date: dateStr,
    timestamp: now.toISOString(),
    promptVersion: REGEN_PROMPT_VERSION,
    model: provider.modelName,
    summary: {
      totalRan,
      totalScenarios: SCENARIOS.length,
      hopLeRate: passRate,
      numHigher,
      avgCalls,
      stoppedBy429,
    },
    results,
  };

  fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2), "utf-8");
  console.log(`\n💾 Đã lưu kết quả vào: ${outputFile}\n`);
}

main().catch((err) => {
  console.error("Lỗi chương trình:", err);
  process.exit(1);
});
