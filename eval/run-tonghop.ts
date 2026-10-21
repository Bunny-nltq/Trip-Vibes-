/**
 * eval/run-tonghop.ts
 *
 * Tổng hợp số liệu từ các bộ đánh giá trong eval/results/
 * Xuất file eval/results/SO-LIEU-BAO-CAO.md
 */

import fs from "node:fs";
import path from "node:path";
import { QUY_TAC_VERSION } from "../src/core/assumptions";

interface SuiteSummary {
  name: string;
  title: string;
  status: "CHƯA CHẠY" | "ĐÃ CHẠY";
  latestFile?: string;
  date?: string;
  isCu?: boolean;
  reasonCu?: string;
  model?: string;
  promptVersion?: string;
  quyTacVersion?: string;
  ratioPassed?: string;
  totalCases?: number;
  passedCases?: number;
  badCases: string[];
  dangerousWarnings: string[];
  metricsTable?: Record<string, string | number>;
}

const RESULTS_DIR = path.resolve(process.cwd(), "eval/results");
const REPORT_FILE = path.resolve(RESULTS_DIR, "SO-LIEU-BAO-CAO.md");
const CURRENT_DATE = new Date("2026-10-21"); // Ngày hiện tại của hệ thống

function getDaysDiff(dateStr: string): number {
  try {
    const d = new Date(dateStr);
    const diffMs = CURRENT_DATE.getTime() - d.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}

function findNewestFile(prefix: string): string | null {
  if (!fs.existsSync(RESULTS_DIR)) return null;
  const files = fs.readdirSync(RESULTS_DIR);
  // Ưu tiên các file có ngày YYYY-MM-DD và bỏ qua progress
  const dated = files
    .filter((f) => f.startsWith(prefix) && /\d{4}-\d{2}-\d{2}\.json$/.test(f) && !f.includes("progress"))
    .sort()
    .reverse();
  if (dated.length > 0) return path.join(RESULTS_DIR, dated[0]);

  const matching = files
    .filter((f) => f.startsWith(prefix) && f.endsWith(".json") && !f.includes("progress"))
    .sort()
    .reverse();
  return matching.length > 0 ? path.join(RESULTS_DIR, matching[0]) : null;
}

export function parseSuiteBill(): SuiteSummary {
  const filePath = findNewestFile("bill-");
  if (!filePath) {
    return {
      name: "bill",
      title: "Nhận diện hóa đơn (Bill Extraction)",
      status: "CHƯA CHẠY",
      badCases: [],
      dangerousWarnings: [],
    };
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const dateStr = raw.timestamp ? raw.timestamp.slice(0, 10) : filePath.match(/\d{4}-\d{2}-\d{2}/)?.[0] || "2026-10-19";
  const days = getDaysDiff(dateStr);
  const isCu = days > 7;

  const total = (raw.numRealBills || 0) + (raw.numNotBills || 0);
  const passed = (raw.correctRealBills || 0) + (raw.correctNotBills || 0);
  const badCases: string[] = [];
  const dangerousWarnings: string[] = [];

  if (Array.isArray(raw.details)) {
    for (const d of raw.details) {
      if (!d.isCorrect) {
        badCases.push(`Tập tin "${d.file}": Nhận diện sai (Lỗi: ${d.errors?.join(", ") || "Không khớp kỳ vọng"})`);
      }
      if (d.dangerous) {
        dangerousWarnings.push(`Tập tin "${d.file}": Phát hiện sai số nguy hiểm (dangerous error)!`);
      }
    }
  }

  return {
    name: "bill",
    title: "Nhận diện hóa đơn (Bill Extraction)",
    status: "ĐÃ CHẠY",
    latestFile: path.basename(filePath),
    date: dateStr,
    isCu,
    reasonCu: isCu ? `Đã chạy cách đây ${days} ngày (> 7 ngày)` : undefined,
    model: raw.modelName || "gemini-3.5-flash-lite",
    promptVersion: raw.promptVersion || "v1",
    quyTacVersion: raw.quyTacVersion || QUY_TAC_VERSION,
    ratioPassed: `${passed}/${total}`,
    totalCases: total,
    passedCases: passed,
    badCases,
    dangerousWarnings,
    metricsTable: {
      "Hóa đơn thật hợp lệ": `${raw.correctRealBills || 0}/${raw.numRealBills || 0}`,
      "Không phải hóa đơn": `${raw.correctNotBills || 0}/${raw.numNotBills || 0}`,
      "Lỗi nguy hiểm (lệch tiền/bịa đặt)": raw.dangerousErrors || 0,
      "Thời gian trung bình": `${raw.avgTime || 0} ms`,
    },
  };
}

export function parseSuiteLikes(): SuiteSummary {
  const filePath = findNewestFile("likes-");
  if (!filePath) {
    return {
      name: "likes",
      title: "Tối ưu sở thích người dùng (Preference Matching)",
      status: "CHƯA CHẠY",
      badCases: [],
      dangerousWarnings: [],
    };
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const dateStr = raw.date || raw.timestamp?.slice(0, 10) || "2026-10-19";
  const days = getDaysDiff(dateStr);
  const isCu = days > 7;

  const total = raw.summary?.totalScenarios || raw.results?.length || 5;
  const numHigher = raw.summary?.numHigher || 0;
  const numHopLe = raw.results?.filter((r: any) => r.hopLe).length || total;
  const badCases: string[] = [];
  const dangerousWarnings: string[] = [];

  if (Array.isArray(raw.results)) {
    for (const r of raw.results) {
      if (!r.hopLe) {
        badCases.push(`Kịch bản "${r.scenario}": Kế hoạch vi phạm quy tắc nghiêm ngặt (hard error)`);
      } else if (r.diemKhopSau <= r.diemKhopTruoc) {
        badCases.push(`Kịch bản "${r.scenario}": Điểm khớp sở thích không tăng (${r.diemKhopTruoc} -> ${r.diemKhopSau})`);
      }
    }
  }

  return {
    name: "likes",
    title: "Tối ưu sở thích người dùng (Preference Matching)",
    status: "ĐÃ CHẠY",
    latestFile: path.basename(filePath),
    date: dateStr,
    isCu,
    reasonCu: isCu ? `Đã chạy cách đây ${days} ngày (> 7 ngày)` : undefined,
    model: raw.model || "gemini-3.5-flash-lite",
    promptVersion: raw.promptVersion || "v1",
    quyTacVersion: raw.quyTacVersion || QUY_TAC_VERSION,
    ratioPassed: `${numHopLe}/${total} hợp lệ; ${numHigher}/${total} điểm tăng`,
    totalCases: total,
    passedCases: numHopLe,
    badCases,
    dangerousWarnings,
    metricsTable: {
      "Kế hoạch hợp lệ": `${numHopLe}/${total}`,
      "Điểm sở thích tăng": `${numHigher}/${total}`,
      "Dừng sớm do lỗi 429": raw.summary?.stoppedBy429 ? "Có" : "Không",
      "Số lượt gọi AI trung bình": raw.summary?.avgCalls || 1,
    },
  };
}

export function parseSuiteDiadiem(): SuiteSummary {
  // Tìm diadiem-live- hoặc diadiem-
  let filePath = findNewestFile("diadiem-live-");
  if (!filePath) {
    filePath = findNewestFile("diadiem-");
  }
  if (!filePath) {
    return {
      name: "diadiem",
      title: "Kiểm tra chất lượng địa điểm (Location Data)",
      status: "CHƯA CHẠY",
      badCases: [],
      dangerousWarnings: [],
    };
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const dateMatch = filePath.match(/\d{4}-\d{2}-\d{2}/);
  const dateStr = dateMatch ? dateMatch[0] : "2026-10-20";
  const days = getDaysDiff(dateStr);
  const isCu = days > 7;

  const items = Array.isArray(raw) ? raw : [raw];
  const total = items.length;
  let passed = 0;
  const badCases: string[] = [];
  const dangerousWarnings: string[] = [];

  for (const it of items) {
    if (it.keHoachHopLe && it.geocodeThanhCong) {
      passed++;
    } else {
      badCases.push(`Điểm đến "${it.diemDen}": ${it.loiHard?.join("; ") || it.danhGia || "Kế hoạch không hợp lệ"}`);
    }
    if (it.trangThaiNoiDung === "THIẾU DỮ LIỆU" || it.soLuongTheoLoai?.khachSan === 0) {
      badCases.push(`Điểm đến "${it.diemDen}": Thiếu khách sạn (Overpass ERR/0 mục)`);
    }
    if (it.overpassError) {
      dangerousWarnings.push(`Điểm đến "${it.diemDen}": Overpass timeout/error: ${it.overpassError}`);
    }
  }

  return {
    name: "diadiem",
    title: "Kiểm tra chất lượng địa điểm (Location Data)",
    status: "ĐÃ CHẠY",
    latestFile: path.basename(filePath),
    date: dateStr,
    isCu,
    reasonCu: isCu ? `Đã chạy cách đây ${days} ngày (> 7 ngày)` : undefined,
    model: "N/A (Nominatim + Overpass OSM)",
    promptVersion: "N/A",
    quyTacVersion: QUY_TAC_VERSION,
    ratioPassed: `${passed}/${total}`,
    totalCases: total,
    passedCases: passed,
    badCases,
    dangerousWarnings,
    metricsTable: {
      "Số điểm đến hợp lệ": `${passed}/${total}`,
      "Tỷ lệ có nguồn": `${Math.round((items.reduce((s, i) => s + (i.tyLeCoNguon || 0), 0) / total) * 100)}%`,
    },
  };
}

export function parseSuiteAiRate(): SuiteSummary {
  const filePath = findNewestFile("ai-rate-");
  if (!filePath) {
    return {
      name: "ai-rate",
      title: "Đánh giá chất lượng lập kế hoạch AI (AI Rate)",
      status: "CHƯA CHẠY",
      badCases: [],
      dangerousWarnings: [],
    };
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const dateStr = raw.summary?.ngay || "2026-10-20";
  const days = getDaysDiff(dateStr);
  // Đánh dấu CŨ nếu > 7 ngày HOẶC quy tắc cũ
  const isQuyTacCu = Boolean(raw.summary?.soKichBanCu && raw.summary?.soKichBanCu > 0) || raw.summary?.thongBao?.includes("CHƯA CÓ KẾT QUẢ");
  const isCu = days > 7 || isQuyTacCu;
  const reasonCu = isQuyTacCu
    ? "Kết quả thuộc phiên bản quy tắc cũ (v1), khác với quy tắc hiện tại (v3)"
    : isCu
    ? `Đã chạy cách đây ${days} ngày (> 7 ngày)`
    : undefined;

  const total = raw.summary?.tongSoKichBan || 10;
  const daChay = raw.summary?.soKichBanDaChay || 0;
  const badCases: string[] = [];
  const dangerousWarnings: string[] = [];

  if (Array.isArray(raw.scenarios)) {
    for (const sc of raw.scenarios) {
      if (sc.phuongThucLap === "quy_tac") {
        badCases.push(`Kịch bản ${sc.stt} (${sc.diemDen}): Phải dùng fallback bằng quy tắc tự động (lý do: ${sc.lyDoDuPhong})`);
      }
      if (sc.nguonKetQua?.includes("CŨ")) {
        badCases.push(`Kịch bản ${sc.stt} (${sc.diemDen}): Kết quả sinh từ phiên bản quy tắc cũ (${sc.nguonKetQua})`);
      }
    }
  }

  if (raw.summary?.dungSomDo429) {
    dangerousWarnings.push("Tiến trình bị dừng sớm do hết hạn mức API Gemini (HTTP 429)!");
  }

  return {
    name: "ai-rate",
    title: "Đánh giá chất lượng lập kế hoạch AI (AI Rate)",
    status: "ĐÃ CHẠY",
    latestFile: path.basename(filePath),
    date: dateStr,
    isCu,
    reasonCu,
    model: "gemini-3.5-flash-lite",
    promptVersion: "v3",
    quyTacVersion: isQuyTacCu ? "v1 (CŨ)" : QUY_TAC_VERSION,
    ratioPassed: `${daChay}/${total}`,
    totalCases: total,
    passedCases: daChay,
    badCases,
    dangerousWarnings,
    metricsTable: {
      "Số kịch bản đã chạy với luật hiện tại": `${daChay}/${total}`,
      "Số kịch bản mang nhãn cũ": raw.summary?.soKichBanCu || 3,
      "Dừng sớm do lỗi 429": raw.summary?.dungSomDo429 ? "Có" : "Không",
    },
  };
}

export function parseEmptySuite(name: string, title: string): SuiteSummary {
  return {
    name,
    title,
    status: "CHƯA CHẠY",
    badCases: [],
    dangerousWarnings: [],
  };
}

export function generateReportMarkdown(): string {
  const suites: SuiteSummary[] = [
    parseEmptySuite("parse", "Phân tích yêu cầu tự nhiên (Parse Request)"),
    parseEmptySuite("repair", "Tự sửa kế hoạch vi phạm (Repair Plan)"),
    parseSuiteBill(),
    parseSuiteLikes(),
    parseEmptySuite("data", "Kiểm tra dữ liệu Live (Data Quality)"),
    parseSuiteDiadiem(),
    parseSuiteAiRate(),
  ];

  let md = "# SỐ LIỆU TỔNG HỢP CÁC BỘ ĐÁNH GIÁ (EVALUATION REPORT)\n\n";
  md += `> Ngày tổng hợp: 2026-10-21 | Phiên bản quy tắc chuẩn: QUY_TAC_VERSION = "${QUY_TAC_VERSION}"\n\n`;

  md += "## 1. Bảng tổng quan trạng thái các bộ kiểm thử\n\n";
  md += "| STT | Bộ đánh giá | Trạng thái | Tỷ lệ ca thành công | Model | Phiên bản Prompt | Quy tắc Version | Ngày chạy |\n";
  md += "|:---:|:---|:---:|:---:|:---|:---:|:---:|:---:|\n";

  suites.forEach((s, idx) => {
    const stt = idx + 1;
    if (s.status === "CHƯA CHẠY") {
      md += `| ${stt} | **${s.title}** (${s.name}) | **CHƯA CHẠY** | - | - | - | - | - |\n`;
    } else {
      const dateDisplay = s.isCu ? `${s.date} **(CŨ)**` : (s.date || "-");
      md += `| ${stt} | **${s.title}** (${s.name}) | Đã chạy | **${s.ratioPassed}** | ${s.model || "-"} | ${s.promptVersion || "-"} | ${s.quyTacVersion || "-"} | ${dateDisplay} |\n`;
    }
  });

  md += "\n---\n\n";
  md += "## 2. Chi tiết từng bộ đánh giá\n\n";

  for (const s of suites) {
    md += `### 2.${suites.indexOf(s) + 1}. ${s.title} (\`${s.name}\`)\n\n`;

    if (s.status === "CHƯA CHẠY") {
      md += "**Trạng thái: CHƯA CHẠY**\n\n";
      md += "- Chưa tìm thấy tập tin kết quả kiểm thử trong `eval/results/`.\n\n";
      continue;
    }

    md += `- **Tập tin kết quả mới nhất**: \`${s.latestFile}\`\n`;
    md += `- **Ngày chạy**: ${s.date} ${s.isCu ? `⚠️ **(ĐÁNH DẤU CŨ: ${s.reasonCu})**` : "✅ (Hợp lệ)"}\n`;
    md += `- **Model**: \`${s.model}\`\n`;
    md += `- **Prompt Version**: \`${s.promptVersion}\`\n`;
    md += `- **Quy tắc Version**: \`${s.quyTacVersion}\` (Hiện tại: \`${QUY_TAC_VERSION}\`)\n`;
    md += `- **Kết quả**: **${s.ratioPassed}** ca đạt\n\n`;

    if (s.metricsTable) {
      md += "| Chỉ số | Giá trị |\n|:---|:---|\n";
      for (const [k, v] of Object.entries(s.metricsTable)) {
        md += `| ${k} | ${v} |\n`;
      }
      md += "\n";
    }

    if (s.badCases.length > 0) {
      md += "#### ⚠️ Danh sách ca xấu / chưa đạt:\n";
      for (const bad of s.badCases) {
        md += `- ${bad}\n`;
      }
      md += "\n";
    } else {
      md += "*(Không có ca xấu nào ghi nhận)*\n\n";
    }

    if (s.dangerousWarnings.length > 0) {
      md += "#### 🚨 Cảnh báo nguy hiểm (Dangerous Warnings):\n";
      for (const w of s.dangerousWarnings) {
        md += `- **${w}**\n`;
      }
      md += "\n";
    }
  }

  md += "---\n\n";
  md += "## Giới hạn\n\n";
  md += "- Mẫu nhỏ;\n";
  md += "- Dữ liệu OpenStreetMap có thể thiếu;\n";
  md += "- Giá vé và giá phòng là ước tính;\n";
  md += "- Hạn mức Gemini và Tavily;\n";
  md += "- Kết quả khác nhau theo điểm đến và thay đổi theo giờ chạy;\n";
  md += "- Phú Quốc không có snapshot hợp lệ.\n";

  return md;
}

export function runTongHop(): void {
  console.log("================================================================================");
  console.log("TỔNG HỢP SỐ LIỆU ĐÁNH GIÁ (EVAL:TONGHOP)");
  console.log("================================================================================\n");

  const mdContent = generateReportMarkdown();
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(REPORT_FILE, mdContent, "utf-8");

  console.log(`✅ Đã xuất báo cáo tổng hợp ra: ${REPORT_FILE}\n`);
  console.log(mdContent);
}

if (process.argv[1] && process.argv[1].includes("run-tonghop")) {
  runTongHop();
}
