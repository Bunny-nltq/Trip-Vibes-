import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { parseRequest, PARSE_PROMPT_VERSION } from "../src/ai/parseRequest";
import { normalizeRequest, removeVietnameseDiacritics } from "../src/core/normalizeRequest";
import { GeminiProvider } from "../src/ai/provider";
import type { TripRequest, RawTripRequest, MissingField, Preference, Avoidance } from "../src/contracts";

// Nạp biến môi trường từ .env.local mà không in hay đọc thô nội dung
loadEnvConfig(process.cwd());

interface ExpectedCase {
  soNguoi: number | null;
  soNgay: number | null;
  ngansachTongVND: number | null;
  diemDen: string;
  sothichBaoGom: Preference[];
  tranh: Avoidance[];
  thieu: MissingField[];
  canhBaoBaoGom: string[];
}

interface TestCase {
  id: string;
  text: string;
  expected: ExpectedCase;
}

interface CaseEvalResult {
  id: string;
  passed: boolean;
  mismatches: string[];
  ms: number;
  fromCache: boolean;
  retried: boolean;
  request?: TripRequest;
  raw?: RawTripRequest;
  error?: string;
}

function setEquals<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((item) => setB.has(item));
}

function isSubset<T>(sub: T[], superSet: T[]): boolean {
  const set = new Set(superSet);
  return sub.every((item) => set.has(item));
}

function getCacheKey(text: string, modelName: string, promptVersion: string): string {
  return crypto
    .createHash("sha256")
    .update(`${text}|${modelName}|${promptVersion}`)
    .digest("hex");
}

async function main() {
  const noCache = process.argv.includes("--no-cache");
  const cacheDir = path.resolve(process.cwd(), "eval/.cache");
  const resultsDir = path.resolve(process.cwd(), "eval/results");
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.mkdirSync(resultsDir, { recursive: true });

  const casesPath = path.resolve(process.cwd(), "eval/parse-cases.json");
  if (!fs.existsSync(casesPath)) {
    console.error("❌ Không tìm thấy file eval/parse-cases.json");
    process.exit(1);
  }

  const cases: TestCase[] = JSON.parse(fs.readFileSync(casesPath, "utf-8"));
  let provider: GeminiProvider;

  try {
    provider = new GeminiProvider();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ Không thể khởi tạo GeminiProvider:");
    console.error("   " + msg);
    console.error("\n👉 Hãy kiểm tra và cấu hình GEMINI_API_KEY và GEMINI_MODEL trong .env.local");
    process.exit(1);
  }

  const modelName = provider.modelName;
  const runDate = new Date().toISOString().split("T")[0];

  console.log("\n========================================================");
  console.log("   TRIP VIBES – ĐÁNH GIÁ TRÍCH XUẤT YÊU CẦU (BƯỚC 2)");
  console.log("========================================================");
  console.log(`Model:                 ${modelName}`);
  console.log(`PARSE_PROMPT_VERSION:  ${PARSE_PROMPT_VERSION}`);
  console.log(`Ngày chạy:             ${runDate}`);
  console.log(`Số ca kiểm tra:        ${cases.length}`);
  console.log(`Dùng cache:            ${noCache ? "KHÔNG (--no-cache)" : "CÓ"}\n`);

  const results: CaseEvalResult[] = [];
  let totalSchemaRetries = 0;
  let totalFirstCallSchemaErrors = 0;
  const completedIds: string[] = [];
  const pendingIds: string[] = cases.map((c) => c.id);

  for (let i = 0; i < cases.length; i++) {
    const testCase = cases[i];
    const cacheFile = path.join(cacheDir, `${getCacheKey(testCase.text, modelName, PARSE_PROMPT_VERSION)}.json`);

    let raw: RawTripRequest | null = null;
    let request: TripRequest | null = null;
    let duration = 0;
    let fromCache = false;
    let retried = false;

    if (!noCache && fs.existsSync(cacheFile)) {
      try {
        const cachedData = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
        raw = cachedData.raw;
        request = cachedData.request;
        duration = cachedData.ms ?? 0;
        retried = cachedData.retried ?? false;
        fromCache = true;
      } catch {
        // Cache hỏng thì gọi lại
      }
    }

    if (!raw || !request) {
      if (i > 0 && !fromCache) {
        // Nghỉ 4 giây giữa các ca khi gọi trực tiếp API
        process.stdout.write("  ⏳ Nghỉ 4 giây tránh rate limit...");
        await new Promise((resolve) => setTimeout(resolve, 4000));
        process.stdout.write("\r                                     \r");
      }

      const start = Date.now();
      let caseRetried = false;

      try {
        raw = await parseRequest(testCase.text, {
          provider,
          onRetry: () => {
            caseRetried = true;
            totalFirstCallSchemaErrors++;
            totalSchemaRetries++;
          },
        });
        request = normalizeRequest(raw);
        duration = Date.now() - start;
        retried = caseRetried;

        // Lưu cache
        fs.writeFileSync(
          cacheFile,
          JSON.stringify({ raw, request, ms: duration, retried }, null, 2),
          "utf-8"
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const isQuota = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");

        if (isQuota) {
          console.error(`\n🚨 DỪNG: Hết hạn mức gọi API (Quota / 429) tại ca ${testCase.id}!`);
          console.log(`   - Các ca đã xong:  ${completedIds.join(", ") || "(chưa có)"}`);
          console.log(`   - Các ca chưa xong: ${pendingIds.join(", ")}`);
          process.exit(1);
        }

        results.push({
          id: testCase.id,
          passed: false,
          mismatches: [`Lỗi thực thi: ${msg}`],
          ms: Date.now() - start,
          fromCache: false,
          retried: caseRetried,
          error: msg,
        });
        completedIds.push(testCase.id);
        pendingIds.shift();
        continue;
      }
    }

    // Chấm điểm
    const mismatches: string[] = [];
    const exp = testCase.expected;

    if (request.soNguoi !== exp.soNguoi) {
      mismatches.push(`soNguoi: mong đợi ${exp.soNguoi}, thực tế ${request.soNguoi}`);
    }

    if (request.soNgay !== exp.soNgay) {
      mismatches.push(`soNgay: mong đợi ${exp.soNgay}, thực tế ${request.soNgay}`);
    }

    if (request.ngansachTongVND !== exp.ngansachTongVND) {
      mismatches.push(`ngansachTongVND: mong đợi ${exp.ngansachTongVND}, thực tế ${request.ngansachTongVND}`);
    }

    const normExpDiemDen = removeVietnameseDiacritics(exp.diemDen);
    const normActDiemDen = removeVietnameseDiacritics(request.diemDen);
    if (normExpDiemDen !== normActDiemDen) {
      mismatches.push(`diemDen: mong đợi "${exp.diemDen}", thực tế "${request.diemDen}"`);
    }

    if (!isSubset(exp.sothichBaoGom, request.sothich)) {
      mismatches.push(`sothich: mong đợi chứa [${exp.sothichBaoGom.join(", ")}], thực tế [${request.sothich.join(", ")}]`);
    }

    if (!setEquals(exp.tranh, request.tranh)) {
      mismatches.push(`tranh: mong đợi [${exp.tranh.join(", ")}], thực tế [${request.tranh.join(", ")}]`);
    }

    if (!setEquals(exp.thieu, request.thieu)) {
      mismatches.push(`thieu: mong đợi [${exp.thieu.join(", ")}], thực tế [${request.thieu.join(", ")}]`);
    }

    if (!isSubset(exp.canhBaoBaoGom, request.canhBao)) {
      mismatches.push(`canhBao: mong đợi chứa [${exp.canhBaoBaoGom.join(", ")}], thực tế [${request.canhBao.join(", ")}]`);
    }

    if (request.thieu.length > 0 && request.cauHoiLamRo.length === 0) {
      mismatches.push(`cauHoiLamRo: thiếu thông tin nhưng không có câu hỏi làm rõ`);
    }

    const passed = mismatches.length === 0;

    results.push({
      id: testCase.id,
      passed,
      mismatches,
      ms: duration,
      fromCache,
      retried,
      request,
      raw,
    });

    completedIds.push(testCase.id);
    pendingIds.shift();

    const tag = passed ? "✅ ĐẠT" : "❌ KHÔNG ĐẠT";
    const cacheTag = fromCache ? " (từ cache)" : "";
    console.log(`[${testCase.id}] ${tag} (${duration}ms)${cacheTag}`);
    if (!passed) {
      for (const m of mismatches) {
        console.log(`      ↳ ${m}`);
      }
    }
  }

  // Bảng tổng hợp và độ chính xác từng trường
  console.log("\n========================================================");
  console.log("                  BẢNG KẾT QUẢ CHI TIẾT");
  console.log("========================================================");

  let correctSoNguoi = 0;
  let correctSoNgay = 0;
  let correctNganSach = 0;
  let correctDiemDen = 0;
  let correctSothich = 0;
  let correctTranh = 0;
  let correctThieu = 0;
  let correctCanhBao = 0;
  let correctCauHoi = 0;
  let totalPassed = 0;
  let totalTime = 0;

  cases.forEach((c, idx) => {
    const res = results[idx];
    if (res.passed) totalPassed++;
    totalTime += res.ms;

    if (res.request) {
      if (res.request.soNguoi === c.expected.soNguoi) correctSoNguoi++;
      if (res.request.soNgay === c.expected.soNgay) correctSoNgay++;
      if (res.request.ngansachTongVND === c.expected.ngansachTongVND) correctNganSach++;
      if (removeVietnameseDiacritics(res.request.diemDen) === removeVietnameseDiacritics(c.expected.diemDen)) correctDiemDen++;
      if (isSubset(c.expected.sothichBaoGom, res.request.sothich)) correctSothich++;
      if (setEquals(c.expected.tranh, res.request.tranh)) correctTranh++;
      if (setEquals(c.expected.thieu, res.request.thieu)) correctThieu++;
      if (isSubset(c.expected.canhBaoBaoGom, res.request.canhBao)) correctCanhBao++;
      if (res.request.thieu.length === 0 || res.request.cauHoiLamRo.length > 0) correctCauHoi++;
    }
  });

  const avgTime = Math.round(totalTime / cases.length);

  console.log(`\n📊 KẾT QUẢ TỔNG QUAN:`);
  console.log(`- Tổng số ca đạt:                    ${totalPassed}/${cases.length} (${Math.round((totalPassed / cases.length) * 100)}%)`);
  console.log(`- Thời gian trung bình:             ${avgTime} ms/ca`);
  console.log(`- Lỗi schema ở lần gọi đầu:          ${totalFirstCallSchemaErrors}`);
  console.log(`- Số lần thử lại (retries):          ${totalSchemaRetries}`);
  console.log(`- Model:                             ${modelName}`);
  console.log(`- PARSE_PROMPT_VERSION:              ${PARSE_PROMPT_VERSION}`);
  console.log(`- Ngày chạy:                         ${runDate}`);

  console.log(`\n🎯 ĐỘ CHÍNH XÁC TỪNG TRƯỜNG:`);
  console.log(`- soNguoi:         ${correctSoNguoi}/${cases.length} (${Math.round((correctSoNguoi / cases.length) * 100)}%)`);
  console.log(`- soNgay:          ${correctSoNgay}/${cases.length} (${Math.round((correctSoNgay / cases.length) * 100)}%)`);
  console.log(`- ngansachTongVND: ${correctNganSach}/${cases.length} (${Math.round((correctNganSach / cases.length) * 100)}%)`);
  console.log(`- diemDen:         ${correctDiemDen}/${cases.length} (${Math.round((correctDiemDen / cases.length) * 100)}%)`);
  console.log(`- sothich:         ${correctSothich}/${cases.length} (${Math.round((correctSothich / cases.length) * 100)}%)`);
  console.log(`- tranh:           ${correctTranh}/${cases.length} (${Math.round((correctTranh / cases.length) * 100)}%)`);
  console.log(`- thieu:           ${correctThieu}/${cases.length} (${Math.round((correctThieu / cases.length) * 100)}%)`);
  console.log(`- canhBao:         ${correctCanhBao}/${cases.length} (${Math.round((correctCanhBao / cases.length) * 100)}%)`);
  console.log(`- cauHoiLamRo:     ${correctCauHoi}/${cases.length} (${Math.round((correctCauHoi / cases.length) * 100)}%)`);

  // Lưu file kết quả
  const outputFilePath = path.join(resultsDir, `parse-${runDate}.json`);
  const fullOutput = {
    date: runDate,
    model: modelName,
    promptVersion: PARSE_PROMPT_VERSION,
    totalPassed,
    totalCases: cases.length,
    accuracyRate: totalPassed / cases.length,
    averageDurationMs: avgTime,
    firstCallSchemaErrors: totalFirstCallSchemaErrors,
    schemaRetries: totalSchemaRetries,
    fieldAccuracy: {
      soNguoi: correctSoNguoi / cases.length,
      soNgay: correctSoNgay / cases.length,
      ngansachTongVND: correctNganSach / cases.length,
      diemDen: correctDiemDen / cases.length,
      sothich: correctSothich / cases.length,
      tranh: correctTranh / cases.length,
      thieu: correctThieu / cases.length,
      canhBao: correctCanhBao / cases.length,
      cauHoiLamRo: correctCauHoi / cases.length,
    },
    results,
  };

  fs.writeFileSync(outputFilePath, JSON.stringify(fullOutput, null, 2), "utf-8");
  console.log(`\n💾 Đã lưu kết quả chi tiết vào: ${outputFilePath}\n`);
}

main().catch((err) => {
  console.error("Lỗi chương trình:", err);
  process.exit(1);
});
