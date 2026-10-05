import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { extractBill, BILL_PROMPT_VERSION } from "../src/ai/extractBill";
import { checkBill } from "../src/core/bill/checkBill";
import { GeminiProvider } from "../src/ai/provider";
import type { BillExtractionRaw, BillExtraction } from "../src/contracts";

loadEnvConfig(process.cwd());

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const args = process.argv.slice(2);
  let dir = path.resolve(process.cwd(), "eval/bills");
  const dirIdx = args.indexOf("--dir");
  if (dirIdx >= 0 && dirIdx + 1 < args.length) {
    dir = path.resolve(process.cwd(), args[dirIdx + 1]);
  }
  const noCache = args.includes("--no-cache");

  if (!fs.existsSync(dir)) {
    console.error(`Thư mục không tồn tại: ${dir}`);
    process.exit(1);
  }

  const expectedPath = path.join(dir, "expected.json");
  const hasExpected = fs.existsSync(expectedPath);
  let expected: Record<string, Partial<BillExtraction>> = {};
  if (hasExpected) {
    expected = JSON.parse(fs.readFileSync(expectedPath, "utf-8"));
  }

  const cacheDir = path.resolve(process.cwd(), "eval/.cache");
  fs.mkdirSync(cacheDir, { recursive: true });

  const resultsDir = path.resolve(process.cwd(), "eval/results");
  fs.mkdirSync(resultsDir, { recursive: true });

  let provider: GeminiProvider;
  try {
    provider = new GeminiProvider();
  } catch (err: any) {
    console.error("Lỗi khởi tạo GeminiProvider:", err);
    process.exit(1);
  }
  const modelName = provider.modelName;

  const files = fs
    .readdirSync(dir)
    .filter((f) => [".jpg", ".jpeg", ".png", ".webp"].includes(path.extname(f).toLowerCase()));

  if (files.length === 0) {
    console.log("Không có ảnh nào trong thư mục.");
    return;
  }

  const results = [];
  let numRealBills = 0;
  let correctRealBills = 0;
  let numNotBills = 0;
  let correctNotBills = 0;
  let dangerousErrors = 0; // sai số tiền nhưng KHÔNG cảnh báo và doTinCay khác thap
  let totalTime = 0;
  let numSuccessCalls = 0;
  let stoppedBy429 = false;

  console.log(`\n======================================================`);
  console.log(`Bắt đầu đọc ảnh trong: ${dir}`);
  console.log(`Số ảnh: ${files.length} | Có expected.json: ${hasExpected}`);
  console.log(`Model: ${modelName} | Prompt: ${BILL_PROMPT_VERSION}`);
  console.log(`======================================================\n`);

  for (const file of files) {
    if (stoppedBy429) {
      console.log(`Bỏ qua ${file} do lỗi 429 trước đó.`);
      continue;
    }

    const filePath = path.join(dir, file);
    const bytes = fs.readFileSync(filePath);
    const base64Bytes = bytes.toString("base64");
    const ext = path.extname(file).toLowerCase();
    let mimeType = "image/jpeg";
    if (ext === ".png") mimeType = "image/png";
    if (ext === ".webp") mimeType = "image/webp";

    const cacheKey = crypto
      .createHash("sha256")
      .update(base64Bytes + modelName + BILL_PROMPT_VERSION)
      .digest("hex");
    const cacheFile = path.join(cacheDir, `bill-${cacheKey}.json`);

    let raw: BillExtractionRaw | null = null;
    let fromCache = false;
    let ms = 0;

    if (!noCache && fs.existsSync(cacheFile)) {
      try {
        const cached = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
        raw = cached.raw;
        ms = cached.ms;
        fromCache = true;
      } catch {}
    }

    if (!raw) {
      try {
        console.log(`Chạy AI cho ${file}...`);
        const start = Date.now();
        raw = await extractBill({ bytes: base64Bytes, mimeType }, { provider });
        ms = Date.now() - start;
        fs.writeFileSync(cacheFile, JSON.stringify({ raw, ms }, null, 2), "utf-8");
        await sleep(4000);
      } catch (err: any) {
        if (err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
          console.error(`❌ Lỗi 429 khi xử lý ${file}. Dừng toàn bộ.`);
          stoppedBy429 = true;
          break;
        }
        console.error(`Lỗi không mong muốn ở ${file}:`, err);
        continue;
      }
    } else {
      console.log(`Tải cache cho ${file}.`);
    }

    const extraction = checkBill(raw!);
    totalTime += ms;
    numSuccessCalls++;

    let isCorrect = true;
    const errors: string[] = [];
    let isRealBill = false;
    let isNotBill = false;
    let dangerous = false;

    if (hasExpected) {
      const exp = expected[file];
      if (exp) {
        if (exp.laChungTu === true) isRealBill = true;
        if (exp.laChungTu === false) isNotBill = true;

        if (exp.laChungTu !== undefined && exp.laChungTu !== extraction.laChungTu) {
          isCorrect = false;
          errors.push(`laChungTu: mong đợi ${exp.laChungTu}, thực tế ${extraction.laChungTu}`);
        }
        if (exp.loaiChungTu !== undefined && exp.loaiChungTu !== extraction.loaiChungTu) {
          isCorrect = false;
          errors.push(`loaiChungTu: mong đợi ${exp.loaiChungTu}, thực tế ${extraction.loaiChungTu}`);
        }
        if (exp.tongTienVND !== undefined && exp.tongTienVND !== extraction.tongTienVND) {
          isCorrect = false;
          errors.push(`tongTienVND: mong đợi ${exp.tongTienVND}, thực tế ${extraction.tongTienVND}`);
          
          if (extraction.canhBao.length === 0 && extraction.doTinCay !== "thap") {
            dangerous = true;
          }
        }
        if (exp.hangMucGoiY !== undefined && exp.hangMucGoiY !== extraction.hangMucGoiY) {
          isCorrect = false;
          errors.push(`hangMucGoiY: mong đợi ${exp.hangMucGoiY}, thực tế ${extraction.hangMucGoiY}`);
        }
        if (exp.ngay !== undefined && exp.ngay !== extraction.ngay) {
          isCorrect = false;
          errors.push(`ngay: mong đợi ${exp.ngay}, thực tế ${extraction.ngay}`);
        }
        if (exp.khopCacDong !== undefined && exp.khopCacDong !== extraction.khopCacDong) {
          isCorrect = false;
          errors.push(`khopCacDong: mong đợi ${exp.khopCacDong}, thực tế ${extraction.khopCacDong}`);
        }
        if (exp.tenCuaHang !== undefined && exp.tenCuaHang !== null && typeof exp.tenCuaHang === "string") {
          const ten = extraction.tenCuaHang?.toLowerCase() || "";
          const required = exp.tenCuaHang.toLowerCase();
          if (!ten.includes(required)) {
            isCorrect = false;
            errors.push(`tenCuaHang: mong đợi chứa "${required}", thực tế "${extraction.tenCuaHang}"`);
          }
        }
      }

      if (isRealBill) {
        numRealBills++;
        if (isCorrect) correctRealBills++;
      }
      if (isNotBill) {
        numNotBills++;
        if (isCorrect) correctNotBills++;
      }
      if (dangerous) dangerousErrors++;
    }

    results.push({
      file,
      extraction,
      errors,
      dangerous,
      ms,
      isCorrect,
    });
  }

  console.log("\n========================================================");
  for (const r of results) {
    console.log(`\n📄 File: ${r.file}`);
    if (!hasExpected) {
      console.log(`   - laChungTu: ${r.extraction.laChungTu} | tongTienVND: ${r.extraction.tongTienVND}`);
      console.log(`   - tenCuaHang: ${r.extraction.tenCuaHang} | ngay: ${r.extraction.ngay}`);
      console.log(`   - Cảnh báo: ${r.extraction.canhBao.join(", ") || "Không"}`);
      console.log(`   - Độ tin cậy: ${r.extraction.doTinCay}`);
      continue;
    }

    if (r.isCorrect) {
      console.log(`   ✅ Đúng chuẩn`);
    } else {
      console.log(`   ❌ Có lỗi:`);
      r.errors.forEach((e: string) => console.log(`      - ${e}`));
      if (r.dangerous) {
        console.log(`      ⚠️ LỖI NGUY HIỂM: Sai số tiền nhưng không cảnh báo và tin cậy cao/trung bình!`);
      }
    }
    console.log(`   - Cảnh báo từ core: ${r.extraction.canhBao.join(", ") || "Không"}`);
    console.log(`   - Độ tin cậy (AI báo): ${r.extraction.doTinCay}`);
  }

  if (hasExpected && numSuccessCalls > 0) {
    console.log("\n========================================================");
    console.log(`TỔNG HỢP (dựa trên expected.json):`);
    console.log(`- Số hóa đơn thật đúng: ${correctRealBills}/${numRealBills} (Tối đa 4 hóa đơn thật)`);
    console.log(`- Xử lý đúng "không phải hóa đơn": ${correctNotBills}/${numNotBills}`);
    if (dangerousErrors > 0) {
      console.log(`- 🚨 LỖI NGUY HIỂM: Có ${dangerousErrors} ca sai số tiền mà không có cảnh báo!`);
    } else {
      console.log(`- Không có lỗi nguy hiểm nào (sai số tiền đều có cảnh báo hợp lý).`);
    }
    console.log(`- Thời gian xử lý trung bình: ${Math.round(totalTime / numSuccessCalls)} ms`);
    console.log(`- Tên model: ${modelName}`);
    console.log(`- Phiên bản prompt: ${BILL_PROMPT_VERSION}`);
    console.log(`- Lần chạy: ${new Date().toISOString()}`);
    console.log("========================================================\n");

    const dateStr = new Date().toISOString().slice(0, 10);
    const outPath = path.join(resultsDir, `bill-${dateStr}.json`);
    const summary = {
      correctRealBills,
      numRealBills,
      correctNotBills,
      numNotBills,
      dangerousErrors,
      avgTime: Math.round(totalTime / numSuccessCalls),
      modelName,
      promptVersion: BILL_PROMPT_VERSION,
      timestamp: new Date().toISOString(),
      details: results,
    };
    fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), "utf-8");
    console.log(`Đã lưu kết quả tại ${outPath}`);
  }
}

main().catch((err) => {
  console.error("Lỗi chương trình:", err);
  process.exit(1);
});
