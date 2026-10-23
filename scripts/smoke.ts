import { loadEnvConfig } from "@next/env";
import { danhGiaHealth, danhGiaPlan, chuaChuoi } from "./lib/smokeRules";
import { schemaVersion } from "../src/contracts";

// Nạp cấu hình môi trường từ .env.local
loadEnvConfig(process.cwd());

interface SmokeRow {
  kiemTra: string;
  kyVong: string;
  thucTe: string;
  ketQua: "ĐẠT" | "LỖI" | "CẢNH BÁO";
}

async function runSmoke() {
  const defaultPort = process.env.PORT || "3012";
  const targetUrl = (process.argv[2] || `http://localhost:${defaultPort}`).replace(/\/$/, "");
  console.log(`Bắt đầu smoke test tại: ${targetUrl}`);

  const rows: SmokeRow[] = [];
  const responseBodies: string[] = [];

  // 1. GET /api/health
  try {
    const res = await fetch(`${targetUrl}/api/health`);
    const text = await res.text();
    responseBodies.push(text);

    let info = `HTTP ${res.status}`;
    let isOk = false;
    if (res.status === 200) {
      try {
        const json = JSON.parse(text);
        const count = Array.isArray(json.snapshots) ? json.snapshots.length : 0;
        info = `HTTP 200, ${count} snapshots, mode=${json.mode}`;
        isOk = danhGiaHealth(json);
      } catch {
        info = `HTTP 200 nhưng không phải JSON`;
      }
    }

    rows.push({
      kiemTra: "GET /api/health",
      kyVong: "200, ít nhất 5 snapshot, mode snapshot",
      thucTe: info,
      ketQua: isOk ? "ĐẠT" : "LỖI",
    });
  } catch (err) {
    rows.push({
      kiemTra: "GET /api/health",
      kyVong: "200, ít nhất 5 snapshot",
      thucTe: `Lỗi kết nối: ${err instanceof Error ? err.message : String(err)}`,
      ketQua: "LỖI",
    });
  }

  // 2. GET /demo
  try {
    const res = await fetch(`${targetUrl}/demo`);
    const text = await res.text();
    responseBodies.push(text);

    const showDemo = process.env.NEXT_PUBLIC_SHOW_DEMO === "true";
    const kyVong = showDemo ? "200 (NEXT_PUBLIC_SHOW_DEMO=true) hoặc 404" : "404";
    const isOk = showDemo ? (res.status === 200 || res.status === 404) : res.status === 404;

    rows.push({
      kiemTra: "GET /demo",
      kyVong,
      thucTe: `HTTP ${res.status}`,
      ketQua: isOk ? "ĐẠT" : "LỖI",
    });
  } catch (err) {
    rows.push({
      kiemTra: "GET /demo",
      kyVong: "404",
      thucTe: `Lỗi kết nối: ${err instanceof Error ? err.message : String(err)}`,
      ketQua: "LỖI",
    });
  }

  // 3. GET /
  try {
    const res = await fetch(`${targetUrl}/`);
    const text = await res.text();
    responseBodies.push(text);

    rows.push({
      kiemTra: "GET /",
      kyVong: "200",
      thucTe: `HTTP ${res.status}`,
      ketQua: res.status === 200 ? "ĐẠT" : "LỖI",
    });
  } catch (err) {
    rows.push({
      kiemTra: "GET /",
      kyVong: "200",
      thucTe: `Lỗi kết nối: ${err instanceof Error ? err.message : String(err)}`,
      ketQua: "LỖI",
    });
  }

  // 4. GET /lap-ke-hoach
  try {
    const res = await fetch(`${targetUrl}/lap-ke-hoach`);
    const text = await res.text();
    responseBodies.push(text);

    let ketQua: "ĐẠT" | "LỖI" | "CẢNH BÁO" = "LỖI";
    if (res.status === 200) {
      ketQua = "ĐẠT";
    } else if (res.status === 404) {
      ketQua = "CẢNH BÁO"; // tuyến này chỉ có trên nhánh dem-ui
    }

    rows.push({
      kiemTra: "GET /lap-ke-hoach",
      kyVong: "200 (404 ghi CẢNH BÁO)",
      thucTe: `HTTP ${res.status}`,
      ketQua,
    });
  } catch (err) {
    rows.push({
      kiemTra: "GET /lap-ke-hoach",
      kyVong: "200 (404 ghi CẢNH BÁO)",
      thucTe: `Lỗi kết nối: ${err instanceof Error ? err.message : String(err)}`,
      ketQua: "LỖI",
    });
  }

  // 5. POST /api/plan
  const planPayload = {
    request: {
      schemaVersion,
      diemDi: {
        ten: "TP.HCM",
        quocGia: "Việt Nam",
        maQuocGia: "VN",
        toaDo: { lat: 10.7769, lng: 106.7009 },
        tienTe: "VND",
        nguon: "nominatim",
        ngayLay: "2026-10-20",
      },
      diemDen: {
        ten: "Hà Nội",
        quocGia: "Việt Nam",
        maQuocGia: "VN",
        toaDo: { lat: 21.0285, lng: 105.8542 },
        tienTe: "VND",
        nguon: "nominatim",
        ngayLay: "2026-10-20",
      },
      soNguoi: 2,
      soNgay: 3,
      ngansachTongVND: 10000000,
      sothich: [],
      tranh: [],
      ghiChu: [],
      thieu: [],
      cauHoiLamRo: [],
      canhBao: [],
    },
  };

  try {
    const res = await fetch(`${targetUrl}/api/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(planPayload),
    });
    const text = await res.text();
    responseBodies.push(text);

    let info = `HTTP ${res.status}`;
    let isOk = false;
    if (res.status === 200) {
      try {
        const json = JSON.parse(text);
        const itemCount = json.plan?.items?.length ?? 0;
        info = `HTTP 200, ok=${json.ok}, dataSource=${json.dataSourceUsed}, soLanGoiAI=${json.soLanGoiAI}, items=${itemCount}`;
        isOk = danhGiaPlan(json);
      } catch {
        info = `HTTP 200 nhưng không phải JSON`;
      }
    }

    rows.push({
      kiemTra: "POST /api/plan",
      kyVong: "200, ok true, dataSource snapshot, soLanGoiAI 0, items >= 1",
      thucTe: info,
      ketQua: isOk ? "ĐẠT" : "LỖI",
    });
  } catch (err) {
    rows.push({
      kiemTra: "POST /api/plan",
      kyVong: "200, ok true, snapshot, 0 AI, items >= 1",
      thucTe: `Lỗi kết nối: ${err instanceof Error ? err.message : String(err)}`,
      ketQua: "LỖI",
    });
  }

  // 6. Kiểm rò khóa API
  const geminiKey = process.env.GEMINI_API_KEY;
  let soKhop = 0;
  if (geminiKey && geminiKey.trim().length >= 8) {
    const cleanKey = geminiKey.trim();
    for (const body of responseBodies) {
      if (chuaChuoi(body, cleanKey)) {
        soKhop++;
      }
    }
  }

  rows.push({
    kiemTra: "Kiểm rò khóa GEMINI_API_KEY",
    kyVong: "số khớp = 0",
    thucTe: `số khớp = ${soKhop}`,
    ketQua: soKhop === 0 ? "ĐẠT" : "LỖI",
  });

  // 7. In bảng kết quả
  console.log("\n| Kiểm tra | Kỳ vọng | Thực tế | Kết quả |");
  console.log("|---|---|---|---|");
  for (const r of rows) {
    console.log(`| ${r.kiemTra} | ${r.kyVong} | ${r.thucTe} | ${r.ketQua} |`);
  }
  console.log("");

  const hasError = rows.some((r) => r.ketQua === "LỖI");
  if (hasError) {
    console.error("KẾT QUẢ SMOKE TEST: CÓ LỖI");
    process.exit(1);
  } else {
    console.log("KẾT QUẢ SMOKE TEST: THÀNH CÔNG");
    process.exit(0);
  }
}

runSmoke().catch((err) => {
  console.error("Lỗi thực thi smoke test:", err);
  process.exit(1);
});
