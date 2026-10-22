import fs from "node:fs";
import path from "node:path";
import { schemaVersion } from "../src/contracts";

interface StepResult {
  step: string;
  url: string;
  method: string;
  status: number;
  headers: Record<string, string>;
  body: string;
}

const PORT = process.env.PORT || "3012";
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Xử lý cờ dòng lệnh
const args = process.argv.slice(2);
let outDir = "docs/bang-chung/ui-v2/H1/truoc";
const outIdx = args.indexOf("--out");
if (outIdx !== -1 && args[outIdx + 1]) {
  outDir = args[outIdx + 1];
}

const resolvedOutDir = path.resolve(process.cwd(), outDir);
fs.mkdirSync(resolvedOutDir, { recursive: true });

const diemDenHaNoi = {
  ten: "Hà Nội",
  quocGia: "Việt Nam",
  maQuocGia: "VN",
  toaDo: { lat: 21.0285, lng: 105.8542 },
  tienTe: "VND",
  nguon: "nominatim" as const,
  ngayLay: "2026-10-21T00:00:00.000Z",
};

const diemDiDaNang = {
  ten: "Đà Nẵng",
  quocGia: "Việt Nam",
  maQuocGia: "VN",
  toaDo: { lat: 16.0544, lng: 108.2022 },
  tienTe: "VND",
  nguon: "nominatim" as const,
  ngayLay: "2026-10-21T00:00:00.000Z",
};

async function executeStep(
  name: string,
  urlPath: string,
  options?: RequestInit
): Promise<StepResult> {
  const fullUrl = `${BASE_URL}${urlPath}`;
  const res = await fetch(fullUrl, options);
  const text = await res.text();
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => {
    headers[k] = v;
  });

  return {
    step: name,
    url: fullUrl,
    method: options?.method || "GET",
    status: res.status,
    headers,
    body: text,
  };
}

async function main() {
  console.log(`=== BẮT ĐẦU KIỂM TRA LUỒNG UI (Base: ${BASE_URL}) ===`);
  console.log(`Lưu kết quả vào: ${resolvedOutDir}`);

  const results: StepResult[] = [];

  // 1. GET /api/health
  console.log("1. Gọi GET /api/health...");
  const r1 = await executeStep("1-health", "/api/health");
  results.push(r1);

  // 2. POST /api/destination/prepare rồi GET /api/destination/status cho Hà Nội
  console.log("2a. Gọi POST /api/destination/prepare...");
  const r2a = await executeStep("2a-destination-prepare", "/api/destination/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      diemDen: diemDenHaNoi,
      diemDi: diemDiDaNang,
      soNgay: 2,
    }),
  });
  results.push(r2a);

  let jobId = "";
  try {
    const parsed = JSON.parse(r2a.body);
    jobId = parsed.jobId || "";
  } catch {}

  console.log(`2b. Gọi GET /api/destination/status?jobId=${jobId}...`);
  const r2b = await executeStep(
    "2b-destination-status",
    `/api/destination/status?jobId=${encodeURIComponent(jobId)}`
  );
  results.push(r2b);

  // 3. POST /api/parse-request với ghi chú "tôi cần tìm villa" (Đà Nẵng đến Hà Nội, 2 người, 2 ngày, 5 triệu)
  console.log("3. Gọi POST /api/parse-request...");
  const r3 = await executeStep("3-parse-request", "/api/parse-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "Đà Nẵng đến Hà Nội, 2 người, 2 ngày, 5 triệu. Ghi chú: tôi cần tìm villa",
    }),
  });
  results.push(r3);

  // 4. POST /api/plan
  console.log("4. Gọi POST /api/plan...");
  const r4 = await executeStep("4-plan", "/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      request: {
        schemaVersion,
        diemDi: diemDiDaNang,
        diemDen: diemDenHaNoi,
        soNgay: 2,
        soNguoi: 2,
        ngansachTongVND: 5000000,
        sothich: [],
        tranh: [],
        ghiChu: ["tôi cần tìm villa"],
        thieu: [],
        cauHoiLamRo: [],
        canhBao: [],
      },
    }),
  });
  results.push(r4);

  // 5. GET /api/destination?q=Hà Nội
  console.log("5. Gọi GET /api/destination?q=Hà Nội...");
  const r5 = await executeStep(
    "5-destination-geocode",
    `/api/destination?q=${encodeURIComponent("Hà Nội")}`
  );
  results.push(r5);

  // Ghi từng kết quả vào file
  const summaryLines: string[] = [];
  summaryLines.push(`Thời gian: ${new Date().toISOString()}`);
  summaryLines.push(`Môi trường: Base=${BASE_URL}`);
  summaryLines.push("--------------------------------------------------");

  for (const res of results) {
    const filename = `${res.step}.txt`;
    const filepath = path.join(resolvedOutDir, filename);
    const content = `HTTP/1.1 ${res.status}\nURL: ${res.url}\nMethod: ${res.method}\n\n${res.body}`;
    fs.writeFileSync(filepath, content, "utf-8");

    summaryLines.push(`[${res.status}] ${res.method} ${res.url} -> ${filename}`);
  }

  const summaryPath = path.join(resolvedOutDir, "SUMMARY.txt");
  fs.writeFileSync(summaryPath, summaryLines.join("\n"), "utf-8");
  console.log("\n=== TỔNG KẾT KIỂM TRA LUỒNG ===");
  console.log(summaryLines.join("\n"));
}

main().catch((err) => {
  console.error("Lỗi kiem-tra-luong:", err);
  process.exit(1);
});
