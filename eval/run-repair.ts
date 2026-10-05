import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { planWithRepair } from "../src/ai/planWithRepair";
import { validatePlan } from "../src/core/validatePlan";
import { MAX_REPAIR_ROUNDS } from "../src/core/assumptions";
import { GeminiProvider } from "../src/ai/provider";
import { JsonDataSource } from "../src/data/JsonDataSource";
import { AGENT_PROMPT_VERSION } from "../src/ai/planAgent";
import type { TripRequest } from "../src/contracts";

loadEnvConfig(process.cwd());

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  const args = process.argv.slice(2);
  let targetCases: string[] = [];
  const casesIdx = args.indexOf("--cases");
  if (casesIdx >= 0 && casesIdx + 1 < args.length) {
    targetCases = args[casesIdx + 1].split(",").map(s => s.trim());
  } else if (args.length > 0 && !args[0].startsWith("--")) {
    targetCases = args.map(s => s.trim());
  }

  const casesPath = path.resolve(process.cwd(), "eval/repair-cases.json");
  const casesDict = JSON.parse(fs.readFileSync(casesPath, "utf-8")) as Record<string, TripRequest>;

  const casesToRun = targetCases.length > 0 ? targetCases : Object.keys(casesDict);
  
  const cacheDir = path.resolve(process.cwd(), "eval/.cache");
  fs.mkdirSync(cacheDir, { recursive: true });

  const resultsDir = path.resolve(process.cwd(), "eval/results");
  fs.mkdirSync(resultsDir, { recursive: true });

  console.log(`Bắt đầu chạy eval:repair cho ${casesToRun.length} ca: ${casesToRun.join(", ")}`);

  let provider: GeminiProvider;
  try {
    provider = new GeminiProvider();
  } catch (err: unknown) {
    console.error("Lỗi khởi tạo GeminiProvider:", err);
    process.exit(1);
  }

  const dataSource = new JsonDataSource();
  const [transports, hotels, activities] = await Promise.all([
    dataSource.getTransports(),
    dataSource.getHotels(),
    dataSource.getActivities(),
  ]);
  const data = { transports, hotels, activities };
  const modelName = provider.modelName;

  const results = [];
  let numFirstOk = 0;
  let numRepairedOk = 0;
  let numTotalAgentRuns = 0;
  let stoppedBy429 = false;

  for (const caseId of casesToRun) {
    if (stoppedBy429) {
      console.log(`Bỏ qua ${caseId} do lỗi 429 trước đó.`);
      continue;
    }

    const request = casesDict[caseId];
    if (!request) {
      console.error(`Ca ${caseId} không tồn tại.`);
      continue;
    }

    const cacheKey = crypto
      .createHash("sha256")
      .update(JSON.stringify(request) + modelName + AGENT_PROMPT_VERSION + "-repair-eval")
      .digest("hex");
    const cacheFile = path.join(cacheDir, `eval-repair-${cacheKey}.json`);

    let res: any = null;
    let fromCache = false;
    if (fs.existsSync(cacheFile)) {
      try {
        res = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
        fromCache = true;
      } catch {}
    }

    if (!res) {
      try {
        console.log(`Chạy ca ${caseId}...`);
        res = await planWithRepair(request, { provider });
        fs.writeFileSync(cacheFile, JSON.stringify(res, null, 2), "utf-8");
        await sleep(4000); // Nghỉ 4 giây giữa các ca
      } catch (err: any) {
        if (err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
          console.error("❌ Dừng lại do lỗi 429.");
          stoppedBy429 = true;
          break;
        }
        console.error(`Lỗi không mong muốn ở ca ${caseId}:`, err);
        continue;
      }
    } else {
      console.log(`Tải ca ${caseId} từ cache.`);
    }

    // Đánh giá độc lập
    let i1 = true, i2 = true, i3 = true, i4 = true, i5 = true;
    let finalHardCount = 0;
    
    if (res.plan) {
      const v = validatePlan(request, res.plan, data);
      finalHardCount = v.hard.length;
      
      if (res.status === "ok" && finalHardCount > 0) i1 = false;
      if (res.status === "co_vi_pham" && finalHardCount === 0) i2 = false;

      // I4: id tồn tại
      const allIds = [
        ...res.plan.items.filter((i: any) => i.hangMuc === "Di chuyển" || i.hangMuc === "Chỗ ở" || i.hangMuc === "Vui chơi").map((i: any) => i.refId)
      ];
      for (const id of allIds) {
        if (!id) continue;
        const exists = data.transports.some((t: any) => t.id === id) || data.hotels.some((h: any) => h.id === id) || data.activities.some((a: any) => a.id === id);
        if (!exists) i4 = false;
      }
    } else {
      if (res.status === "ok" || res.status === "co_vi_pham") {
        i1 = false;
        i2 = false;
      }
    }

    if (res.status === "khong_the_dat_ngan_sach") {
      if (!(res.toiThieuVND > (request.ngansachTongVND || 0) && res.soLanGoiAI === 0)) {
        i3 = false;
      }
    }

    if (res.soVongSua > MAX_REPAIR_ROUNDS) {
      i5 = false;
    }

    let initHardCount = 0;
    if (res.lichSu && res.lichSu.length > 0) {
      initHardCount = res.lichSu[0].soHard;
    } else if (res.hard) {
      initHardCount = res.hard.length;
    }

    if (res.soLanGoiAI > 0) {
      numTotalAgentRuns++;
      if (initHardCount === 0 && res.status === "ok") numFirstOk++;
      if (res.status === "ok") numRepairedOk++;
    }

    results.push({
      caseId,
      status: res.status,
      initHardCount,
      finalHardCount,
      soVongSua: res.soVongSua,
      soLanGoiAI: res.soLanGoiAI,
      tongVND: res.plan?.tongKet?.tongVND || 0,
      ms: res.ms,
      invariants: { I1: i1, I2: i2, I3: i3, I4: i4, I5: i5 }
    });
  }

  // In bảng
  console.log("\n========================================================");
  console.log("| Ca  | Status                 | H0 | H1 | V | AI | Tổng VND     | I1|I2|I3|I4|I5 |");
  console.log("|-----|------------------------|----|----|---|----|--------------|---|---|---|---|---|");
  for (const r of results) {
    const status = r.status.padEnd(22, " ");
    const h0 = String(r.initHardCount).padStart(2, " ");
    const h1 = String(r.finalHardCount).padStart(2, " ");
    const v = String(r.soVongSua).padStart(1, " ");
    const ai = String(r.soLanGoiAI).padStart(2, " ");
    const vnd = r.tongVND.toLocaleString("vi-VN").padStart(12, " ");
    const i1 = r.invariants.I1 ? "T" : "F";
    const i2 = r.invariants.I2 ? "T" : "F";
    const i3 = r.invariants.I3 ? "T" : "F";
    const i4 = r.invariants.I4 ? "T" : "F";
    const i5 = r.invariants.I5 ? "T" : "F";
    
    console.log(`| ${r.caseId.padEnd(3)} | ${status} | ${h0} | ${h1} | ${v} | ${ai} | ${vnd} | ${i1} | ${i2} | ${i3} | ${i4} | ${i5} |`);
  }
  console.log("========================================================\n");

  if (numTotalAgentRuns > 0) {
    const firstRate = (numFirstOk / numTotalAgentRuns * 100).toFixed(1);
    const repairRate = (numRepairedOk / numTotalAgentRuns * 100).toFixed(1);
    console.log(`Tỷ lệ hợp lệ ngay lần đầu: ${firstRate}% (${numFirstOk}/${numTotalAgentRuns})`);
    console.log(`Tỷ lệ hợp lệ sau sửa lỗi:  ${repairRate}% (${numRepairedOk}/${numTotalAgentRuns})`);
  }

  console.log(`\nModel: ${modelName} | Prompt: ${AGENT_PROMPT_VERSION}`);

  const dateStr = new Date().toISOString().slice(0, 10);
  const outPath = path.join(resultsDir, `repair-${dateStr}.json`);
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`Đã lưu kết quả tại ${outPath}`);
}

main().catch(err => {
  console.error("Lỗi eval:", err);
  process.exit(1);
});
