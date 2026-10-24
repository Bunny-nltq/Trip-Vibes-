import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { extractBill, BILL_PROMPT_VERSION } from "../src/ai/extractBill";
import { checkBill } from "../src/core/bill/checkBill";
import { GeminiProvider } from "../src/ai/provider";
import type { BillExtractionRaw } from "../src/contracts";
import { taoMetaEval } from "./lib/meta";
import { QUY_TAC_VERSION } from "../src/core/assumptions";
import { AGENT_PROMPT_VERSION } from "../src/ai/planAgent";

loadEnvConfig(process.cwd());

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Hàm thuần so sánh loại chứng từ giữa thực tế trích xuất và đáp án mong đợi.
 * Quy tắc Bước 23: chỉ so loại chứng từ khi đáp án KHÔNG null.
 * - (actual "khac", expected null) -> khớp (true)
 * - (actual "hoa_don", expected "hoa_don") -> khớp (true)
 * - (actual "khac", expected "hoa_don") -> KHÔNG khớp (false)
 */
export function soSanhLoaiChungTu(
  actual: string | null | undefined,
  expected: string | null | undefined
): boolean {
  if (expected === null || expected === undefined) {
    return true; // Đáp án không yêu cầu cụ thể loại chứng từ
  }
  return actual === expected;
}

export interface ChamBillItemResult {
  isCorrect: boolean;
  errors: string[];
  dangerous: boolean;
}

/**
 * Hàm thuần chấm điểm một ca hóa đơn dựa trên kết quả trích xuất và expected.
 */
export function chamKetQuaBillItem(
  file: string,
  extraction: any,
  exp?: any
): ChamBillItemResult {
  let isCorrect = true;
  const errors: string[] = [];
  let dangerous = false;

  if (exp) {
    if (exp.laChungTu !== undefined && exp.laChungTu !== extraction.laChungTu) {
      isCorrect = false;
      errors.push(`laChungTu: mong đợi ${exp.laChungTu}, thực tế ${extraction.laChungTu}`);
    }

    // SỬA Bước 23: chỉ so loaiChungTu khi đáp án KHÔNG null
    if (!soSanhLoaiChungTu(extraction.loaiChungTu, exp.loaiChungTu)) {
      isCorrect = false;
      errors.push(`loaiChungTu: mong đợi ${exp.loaiChungTu}, thực tế ${extraction.loaiChungTu}`);
    }

    if (exp.tongTienVND !== undefined && exp.tongTienVND !== extraction.tongTienVND) {
      isCorrect = false;
      errors.push(`tongTienVND: mong đợi ${exp.tongTienVND}, thực tế ${extraction.tongTienVND}`);

      if (extraction.canhBao && extraction.canhBao.length === 0 && extraction.doTinCay !== "thap") {
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

  return { isCorrect, errors, dangerous };
}

/**
 * Xử lý cờ --cham-lai: đọc kết quả ĐÃ LƯU, không gọi AI, in bảng TRƯỚC và SAU.
 */
export function thucHienChamLai(savedFile?: string, ngayChamLaiISO: string = "2026-10-21") {
  const filePath =
    savedFile || path.resolve(process.cwd(), "eval/results/bill-2026-10-19.json");
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Không tìm thấy tệp kết quả để chấm lại: ${filePath}`);
    process.exit(1);
  }

  const expectedPath = path.resolve(process.cwd(), "eval/bills/expected.json");
  const rawExpected = JSON.parse(fs.readFileSync(expectedPath, "utf-8"));
  const expectedMap: Record<string, any> = {};
  if (rawExpected.cases && Array.isArray(rawExpected.cases)) {
    rawExpected.cases.forEach((c: any) => {
      expectedMap[c.file] = c;
    });
  }

  const rawSaved = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  console.log("================================================================================");
  console.log("       BẢNG KẾT QUẢ TRƯỚC KHI CHẤM LẠI (TỪ TỆP ĐÃ LƯU: " + path.basename(filePath) + ")");
  console.log("================================================================================");
  console.log(`- Hóa đơn thật đúng: ${rawSaved.correctRealBills}/${rawSaved.numRealBills}`);
  console.log(`- Xử lý đúng "không phải hóa đơn": ${rawSaved.correctNotBills}/${rawSaved.numNotBills}`);
  console.log(`- Số lỗi nguy hiểm: ${rawSaved.dangerousErrors}`);
  console.log();
  console.table(
    (rawSaved.details || []).map((d: any) => ({
      "Tập tin": d.file,
      "Kết quả": d.isCorrect ? "✅ Đúng" : "❌ Sai",
      "Lỗi": d.errors?.join("; ") || "Không có",
      "laChungTu": d.extraction?.laChungTu,
      "loaiChungTu": d.extraction?.loaiChungTu,
      "status": d.extraction?.status,
    }))
  );

  let numRealBills = 0;
  let correctRealBills = 0;
  let numNotBills = 0;
  let correctNotBills = 0;
  let dangerousErrors = 0;

  const newDetails = (rawSaved.details || []).map((d: any) => {
    const exp = expectedMap[d.file];
    const scored = chamKetQuaBillItem(d.file, d.extraction, exp);
    const isRealBill = exp?.laChungTu === true;
    const isNotBill = exp?.laChungTu === false;

    if (isRealBill) {
      numRealBills++;
      if (scored.isCorrect) correctRealBills++;
    }
    if (isNotBill) {
      numNotBills++;
      if (scored.isCorrect) correctNotBills++;
    }
    if (scored.dangerous) dangerousErrors++;

    return {
      ...d,
      errors: scored.errors,
      dangerous: scored.dangerous,
      isCorrect: scored.isCorrect,
    };
  });

  console.log("\n================================================================================");
  console.log("        BẢNG KẾT QUẢ SAU KHI CHẤM LẠI (ĐÃ SỬA BỘ CHẤM: " + path.basename(filePath) + ")");
  console.log("================================================================================");
  console.log(`- Hóa đơn thật đúng: ${correctRealBills}/${numRealBills}`);
  console.log(`- Xử lý đúng "không phải hóa đơn": ${correctNotBills}/${numNotBills}`);
  console.log(`- Số lỗi nguy hiểm: ${dangerousErrors}`);
  console.log();
  console.table(
    newDetails.map((d: any) => ({
      "Tập tin": d.file,
      "Kết quả": d.isCorrect ? "✅ Đúng" : "❌ Sai",
      "Lỗi": d.errors?.join("; ") || "Không có",
      "laChungTu": d.extraction?.laChungTu,
      "loaiChungTu": d.extraction?.loaiChungTu,
      "status": d.extraction?.status,
    }))
  );

  const ngayGoc = rawSaved.meta?.ngayChay
    ? rawSaved.meta.ngayChay.slice(0, 10)
    : rawSaved.timestamp
    ? rawSaved.timestamp.slice(0, 10)
    : "2026-10-19";

  const ngayChamLaiDate = ngayChamLaiISO.slice(0, 10);
  const outFileName = `bill-cham-lai-${ngayChamLaiDate}.json`;
  const outFilePath = path.resolve(process.cwd(), "eval/results", outFileName);

  const updatedPayload = {
    meta: {
      ngayChay: ngayGoc,
      chamLaiNgay: ngayChamLaiDate,
      quyTacVersion: QUY_TAC_VERSION,
      ghiChu: "chấm lại từ kết quả đã lưu, không gọi AI",
      agentPromptVersion: AGENT_PROMPT_VERSION,
      model: rawSaved.modelName || "gemini-3.5-flash-lite",
      tenBo: "bill",
    },
    correctRealBills,
    numRealBills,
    correctNotBills,
    numNotBills,
    dangerousErrors,
    avgTime: rawSaved.avgTime,
    modelName: rawSaved.modelName,
    promptVersion: rawSaved.promptVersion,
    timestamp: rawSaved.timestamp,
    daChamLaiNgay: ngayChamLaiDate,
    boChamDaSuaNgay: ngayChamLaiDate,
    details: newDetails,
  };

  fs.writeFileSync(outFilePath, JSON.stringify(updatedPayload, null, 2), "utf-8");
  console.log(`\n💾 Đã lưu kết quả chấm lại vào: ${outFilePath}`);
  console.log(`(Lưu ý: KHÔNG ghi đè tệp gốc ${path.basename(filePath)})\n`);
  return { outFilePath, payload: updatedPayload };
}

async function main() {
  const args = process.argv.slice(2);

  // Nếu truyền cờ --cham-lai: chạy thuần kiểm tra lại kết quả đã lưu, KHÔNG gọi AI
  if (args.includes("--cham-lai")) {
    thucHienChamLai();
    return;
  }

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
  let expected: Record<string, any> = {};
  if (hasExpected) {
    const rawExpected = JSON.parse(fs.readFileSync(expectedPath, "utf-8"));
    if (rawExpected.cases && Array.isArray(rawExpected.cases)) {
      rawExpected.cases.forEach((c: any) => {
        expected[c.file] = c;
      });
    } else {
      expected = rawExpected;
    }
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
  let dangerousErrors = 0;
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
    let ms = 0;

    if (!noCache && fs.existsSync(cacheFile)) {
      try {
        const cached = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
        raw = cached.raw;
        ms = cached.ms;
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
        if (
          err.message?.includes("429") ||
          err.message?.includes("RESOURCE_EXHAUSTED") ||
          err.message?.includes("503")
        ) {
          console.error(`❌ Lỗi API (Rate Limit/503) khi xử lý ${file}. Dừng toàn bộ.`);
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

    const exp = hasExpected ? expected[file] : undefined;
    const scored = chamKetQuaBillItem(file, extraction, exp);

    if (hasExpected) {
      if (exp?.laChungTu === true) {
        numRealBills++;
        if (scored.isCorrect) correctRealBills++;
      }
      if (exp?.laChungTu === false) {
        numNotBills++;
        if (scored.isCorrect) correctNotBills++;
      }
      if (scored.dangerous) dangerousErrors++;
    }

    results.push({
      file,
      extraction,
      errors: scored.errors,
      dangerous: scored.dangerous,
      ms,
      isCorrect: scored.isCorrect,
    });
  }

  console.log("\n========================================================");
  for (const r of results) {
    console.log(`\n📄 File: ${r.file}`);
    if (!hasExpected) {
      console.log(`   - laChungTu: ${r.extraction.laChungTu} | tongTienVND: ${r.extraction.tongTienVND}`);
      console.log(`   - tenCuaHang: ${r.extraction.tenCuaHang} | ngay: ${r.extraction.ngay}`);
      console.log(`   - Cảnh báo: ${r.extraction.canhBao?.join(", ") || "Không"}`);
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
    console.log(`   - Cảnh báo từ core: ${r.extraction.canhBao?.join(", ") || "Không"}`);
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
    const meta = taoMetaEval({
      quyTacVersion: QUY_TAC_VERSION,
      agentPromptVersion: AGENT_PROMPT_VERSION,
      model: modelName,
      ngayChayISO: new Date().toISOString(),
      tenBo: "bill",
    });
    const summary = {
      meta,
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

if (process.argv[1] && process.argv[1].includes("run-bill")) {
  main().catch((err) => {
    console.error("Lỗi chương trình:", err);
    process.exit(1);
  });
}
