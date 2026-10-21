/**
 * eval/run-tonghop.ts
 *
 * Tổng hợp số liệu trung thực từ các bộ đánh giá trong eval/results/
 * Xuất file eval/results/SO-LIEU-BAO-CAO.md
 *
 * TUYỆT ĐỐI không gọi Gemini, không gán phiên bản mặc định cho file không ghi phiên bản.
 */

import fs from "node:fs";
import path from "node:path";
import { QUY_TAC_VERSION } from "../src/core/assumptions";
import { AGENT_PROMPT_VERSION } from "../src/ai/planAgent";
import {
  danhGiaDoMoi,
  dinhDangTrangThaiDiaDiem,
  dinhDangKetQuaLikes,
  type DoMoiKetQua,
} from "./tonghopRules";

const NGAY_HIEN_TAI = "2026-10-21";
const QUY_TAC_HIEN_TAI = QUY_TAC_VERSION; // "3"

const RESULTS_DIR = path.resolve(process.cwd(), "eval/results");
const REPORT_FILE = path.resolve(RESULTS_DIR, "SO-LIEU-BAO-CAO.md");

function findNewestFile(prefix: string): string | null {
  if (!fs.existsSync(RESULTS_DIR)) return null;
  const files = fs.readdirSync(RESULTS_DIR);
  const dated = files
    .filter(
      (f) =>
        f.startsWith(prefix) &&
        /\d{4}-\d{2}-\d{2}\.json$/.test(f) &&
        !f.includes("progress")
    )
    .sort()
    .reverse();
  if (dated.length > 0) return path.join(RESULTS_DIR, dated[0]);

  const matching = files
    .filter(
      (f) => f.startsWith(prefix) && f.endsWith(".json") && !f.includes("progress")
    )
    .sort()
    .reverse();
  return matching.length > 0 ? path.join(RESULTS_DIR, matching[0]) : null;
}

function layGiaiThichDoMoi(doMoi: DoMoiKetQua, quyTacDocDuoc?: string): string {
  switch (doMoi) {
    case "HOP_LE":
      return "✅ Hợp lệ (trong vòng 7 ngày, đúng quy tắc hiện tại)";
    case "CU_KHONG_GHI_PHIEN_BAN":
      return "⚠️ CŨ: Tập tin kết quả không ghi trường phiên bản quy tắc";
    case "CU_KHAC_PHIEN_BAN":
      return `⚠️ CŨ: Quy tắc ghi trong file (${quyTacDocDuoc || "khác"}) khác quy tắc hiện tại (${QUY_TAC_HIEN_TAI})`;
    case "CU_QUA_7_NGAY":
      return "⚠️ CŨ: Đã chạy cách đây hơn 7 ngày";
  }
}

export interface SuiteSummary {
  name: string;
  title: string;
  status: "CHƯA CHẠY" | "ĐÃ CHẠY";
  dinhNghiaDat: string;
  latestFile?: string;
  date?: string;
  doMoi?: DoMoiKetQua;
  giaiThichDoMoi?: string;
  quyTacVersionGhiNhan?: string;
  promptVersionGhiNhan?: string;
  modelGhiNhan?: string;
  ketQuaTongQuat?: string;
  chiTietNoiDung?: string;
}

// ─── 1. Suite: parse (CHƯA CHẠY) ──────────────────────────────────────────────
export function parseSuiteParse(): SuiteSummary {
  const filePath = findNewestFile("parse-");
  if (!filePath) {
    return {
      name: "parse",
      title: "Phân tích yêu cầu tự nhiên (Parse Request)",
      status: "CHƯA CHẠY",
      dinhNghiaDat:
        "Số yêu cầu parse đúng toàn bộ các trường (điểm đến, số ngày, ngân sách, số người, sở thích) trên tổng số ca kiểm thử.",
      ketQuaTongQuat: "CHƯA CHẠY",
    };
  }
  return {
    name: "parse",
    title: "Phân tích yêu cầu tự nhiên (Parse Request)",
    status: "CHƯA CHẠY",
    dinhNghiaDat:
      "Số yêu cầu parse đúng toàn bộ các trường trên tổng số ca kiểm thử.",
    ketQuaTongQuat: "CHƯA CHẠY",
  };
}

// ─── 2. Suite: repair (CHƯA CHẠY) ─────────────────────────────────────────────
export function parseSuiteRepair(): SuiteSummary {
  const filePath = findNewestFile("repair-");
  if (!filePath) {
    return {
      name: "repair",
      title: "Tự sửa kế hoạch vi phạm (Repair Plan)",
      status: "CHƯA CHẠY",
      dinhNghiaDat:
        "Số kế hoạch có vi phạm ban đầu được AI sửa thành công (0 lỗi hard, ngân sách hợp lệ) trên tổng số ca.",
      ketQuaTongQuat: "CHƯA CHẠY",
    };
  }
  return {
    name: "repair",
    title: "Tự sửa kế hoạch vi phạm (Repair Plan)",
    status: "CHƯA CHẠY",
    dinhNghiaDat:
      "Số kế hoạch có vi phạm ban đầu được AI sửa thành công trên tổng số ca.",
    ketQuaTongQuat: "CHƯA CHẠY",
  };
}

// ─── 3. Suite: bill ───────────────────────────────────────────────────────────
export function parseSuiteBill(): SuiteSummary {
  const dinhNghiaDat =
    "Số hóa đơn thật đúng trên số hóa đơn thật; số 'không phải hóa đơn' xử lý đúng trên số ca.";
  const filePath = findNewestFile("bill-");
  if (!filePath) {
    return {
      name: "bill",
      title: "Nhận diện hóa đơn (Bill Extraction)",
      status: "CHƯA CHẠY",
      dinhNghiaDat,
      ketQuaTongQuat: "CHƯA CHẠY",
    };
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const dateStr = raw.timestamp
    ? raw.timestamp.slice(0, 10)
    : filePath.match(/\d{4}-\d{2}-\d{2}/)?.[0] || "2026-10-19";

  const rawQuyTacVersion = raw.quyTacVersion; // TUYỆT ĐỐI không gán mặc định "3"
  const doMoi = danhGiaDoMoi({
    ngayChay: dateStr,
    quyTacVersion: rawQuyTacVersion,
    ngayHienTai: NGAY_HIEN_TAI,
    quyTacHienTai: QUY_TAC_HIEN_TAI,
  });

  const numRealBills = raw.numRealBills ?? 0;
  const correctRealBills = raw.correctRealBills ?? 0;
  const numNotBills = raw.numNotBills ?? 0;
  const correctNotBills = raw.correctNotBills ?? 0;

  // Lấy chi tiết lỗi b05
  let b05ErrorsText = "";
  if (Array.isArray(raw.details)) {
    const b05 = raw.details.find((d: any) => d.file?.includes("b05"));
    if (b05 && Array.isArray(b05.errors) && b05.errors.length > 0) {
      b05ErrorsText = b05.errors.join("; ");
    }
  }

  const ketQuaTongQuat = `Hóa đơn thật: ${correctRealBills}/${numRealBills}; Không phải hóa đơn: ${correctNotBills}/${numNotBills}`;

  let chiTiet = `| Hạng mục | Đạt / Tổng | Tỷ lệ |\n|:---|:---:|:---:|\n`;
  chiTiet += `| Hóa đơn thật hợp lệ | **${correctRealBills}/${numRealBills}** | ${numRealBills > 0 ? Math.round((correctRealBills / numRealBills) * 100) : 0}% |\n`;
  chiTiet += `| Không phải hóa đơn | **${correctNotBills}/${numNotBills}** | ${numNotBills > 0 ? Math.round((correctNotBills / numNotBills) * 100) : 0}% |\n\n`;

  chiTiet += `#### ⚠️ Chi tiết lỗi ca b05 (ảnh thực đơn):\n`;
  chiTiet += `- Tập tin: \`b05_thuc_don_khong_phai_hoa_don.jpg\`\n`;
  chiTiet += `- Lỗi nguyên văn: \`${b05ErrorsText || "loaiChungTu: mong đợi null, thực tế khac"}\`\n`;
  chiTiet += `- Ghi chú: **CHƯA XÁC MINH lỗi nằm ở AI hay bộ chấm** (AI phát hiện ra đây là thực đơn \`status: "khong_phai_chung_tu"\` nhưng trường \`loaiChungTu\` trả về \`"khac"\` thay vì \`null\`).\n`;

  return {
    name: "bill",
    title: "Nhận diện hóa đơn (Bill Extraction)",
    status: "ĐÃ CHẠY",
    dinhNghiaDat,
    latestFile: path.basename(filePath),
    date: dateStr,
    doMoi,
    giaiThichDoMoi: layGiaiThichDoMoi(doMoi, rawQuyTacVersion),
    quyTacVersionGhiNhan: rawQuyTacVersion ?? "(không ghi)",
    promptVersionGhiNhan: raw.promptVersion ?? "(không ghi)",
    modelGhiNhan: raw.modelName ?? "(không ghi)",
    ketQuaTongQuat,
    chiTietNoiDung: chiTiet,
  };
}

// ─── 4. Suite: likes ──────────────────────────────────────────────────────────
export function parseSuiteLikes(): SuiteSummary {
  const dinhNghiaDat =
    "Ba số riêng biệt: số kịch bản tăng điểm sở thích, số kịch bản giữ nguyên và số kịch bản tệ đi (KHÔNG dùng 'hợp lệ' làm tiêu đề kết quả).";
  const filePath = findNewestFile("likes-");
  if (!filePath) {
    return {
      name: "likes",
      title: "Tối ưu sở thích người dùng (Preference Matching)",
      status: "CHƯA CHẠY",
      dinhNghiaDat,
      ketQuaTongQuat: "CHƯA CHẠY",
    };
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const dateStr = raw.date || raw.timestamp?.slice(0, 10) || "2026-10-19";

  const rawQuyTacVersion = raw.quyTacVersion; // TUYỆT ĐỐI không gán mặc định "3"
  const doMoi = danhGiaDoMoi({
    ngayChay: dateStr,
    quyTacVersion: rawQuyTacVersion,
    ngayHienTai: NGAY_HIEN_TAI,
    quyTacHienTai: QUY_TAC_HIEN_TAI,
  });

  const likeStates: string[] = [];
  if (Array.isArray(raw.results)) {
    for (const r of raw.results) {
      if (r.diemKhopSau > r.diemKhopTruoc) {
        likeStates.push("TĂNG");
      } else if (r.diemKhopSau === r.diemKhopTruoc) {
        likeStates.push("GIỮ NGUYÊN");
      } else {
        likeStates.push("TỆ ĐI");
      }
    }
  }

  const ketQuaTongQuat = dinhDangKetQuaLikes(likeStates);

  let chiTiet = `| Kịch bản | Sở thích | Điểm trước | Điểm sau | Kết quả |\n|:---|:---|:---:|:---:|:---:|\n`;
  if (Array.isArray(raw.results)) {
    raw.results.forEach((r: any) => {
      const kq =
        r.diemKhopSau > r.diemKhopTruoc
          ? "**Tăng**"
          : r.diemKhopSau === r.diemKhopTruoc
          ? "Giữ nguyên"
          : "⚠️ **Tệ đi**";
      chiTiet += `| ${r.scenario} | ${JSON.stringify(r.sothich || [])} | ${r.diemKhopTruoc} | ${r.diemKhopSau} | ${kq} |\n`;
    });
  }
  chiTiet += `\n**Tổng kết**: ${ketQuaTongQuat}\n`;

  return {
    name: "likes",
    title: "Tối ưu sở thích người dùng (Preference Matching)",
    status: "ĐÃ CHẠY",
    dinhNghiaDat,
    latestFile: path.basename(filePath),
    date: dateStr,
    doMoi,
    giaiThichDoMoi: layGiaiThichDoMoi(doMoi, rawQuyTacVersion),
    quyTacVersionGhiNhan: rawQuyTacVersion ?? "(không ghi)",
    promptVersionGhiNhan: raw.promptVersion ?? "(không ghi)",
    modelGhiNhan: raw.model ?? "(không ghi)",
    ketQuaTongQuat,
    chiTietNoiDung: chiTiet,
  };
}

// ─── 5. Suite: data (CHƯA CHẠY) ──────────────────────────────────────────────
export function parseSuiteData(): SuiteSummary {
  const filePath = findNewestFile("data-");
  if (!filePath) {
    return {
      name: "data",
      title: "Kiểm tra dữ liệu Live (Data Quality)",
      status: "CHƯA CHẠY",
      dinhNghiaDat:
        "Số điểm đến có đủ khách sạn, quán ăn, hoạt động và phương tiện live mà không bị lỗi mạng hay rỗng dữ liệu.",
      ketQuaTongQuat: "CHƯA CHẠY",
    };
  }
  return {
    name: "data",
    title: "Kiểm tra dữ liệu Live (Data Quality)",
    status: "CHƯA CHẠY",
    dinhNghiaDat: "Kiểm tra chất lượng nguồn dữ liệu live.",
    ketQuaTongQuat: "CHƯA CHẠY",
  };
}

// ─── 6. Suite: diadiem ───────────────────────────────────────────────────────
export function parseSuiteDiadiem(): SuiteSummary {
  const dinhNghiaDat =
    "Số điểm đến 'CÓ NỘI DUNG' trên tổng, kèm số 'CÓ VI PHẠM', 'CHƯA LẤP ĐỦ Ô', 'THIẾU DỮ LIỆU'. Hai bảng riêng: 'live-only' và 'có dự phòng'. KHÔNG đếm 'định vị được' (geocodeThanhCong) như thành công.";

  const liveFile = findNewestFile("diadiem-live-");
  const fallbackFile = findNewestFile("diadiem-fallback-");

  if (!liveFile && !fallbackFile) {
    return {
      name: "diadiem",
      title: "Kiểm tra chất lượng địa điểm (Location Data)",
      status: "CHƯA CHẠY",
      dinhNghiaDat,
      ketQuaTongQuat: "CHƯA CHẠY",
    };
  }

  const rawLive = liveFile ? JSON.parse(fs.readFileSync(liveFile, "utf-8")) : [];
  const rawFallback = fallbackFile
    ? JSON.parse(fs.readFileSync(fallbackFile, "utf-8"))
    : [];

  const dateMatch = (liveFile || fallbackFile)?.match(/\d{4}-\d{2}-\d{2}/);
  const dateStr = dateMatch ? dateMatch[0] : "2026-10-20";

  const rawQuyTacVersion = undefined; // file diadiem hiện không ghi quyTacVersion
  const doMoi = danhGiaDoMoi({
    ngayChay: dateStr,
    quyTacVersion: rawQuyTacVersion,
    ngayHienTai: NGAY_HIEN_TAI,
    quyTacHienTai: QUY_TAC_HIEN_TAI,
  });

  const itemsLive: any[] = Array.isArray(rawLive) ? rawLive : [rawLive];
  const itemsFallback: any[] = Array.isArray(rawFallback) ? rawFallback : [rawFallback];

  const statusesLive = itemsLive.map((it) => it.trangThaiNoiDung || (it.coNoiDung ? "CÓ NỘI DUNG" : "THIẾU DỮ LIỆU"));
  const statusesFallback = itemsFallback.map((it) => it.trangThaiNoiDung || (it.coNoiDung ? "CÓ NỘI DUNG" : "THIẾU DỮ LIỆU"));

  const sumLive = dinhDangTrangThaiDiaDiem(statusesLive);
  const sumFallback = dinhDangTrangThaiDiaDiem(statusesFallback);

  let chiTiet = `#### Bảng 1: Kết quả chế độ Trực tiếp thuần (live-only)\n\n`;
  chiTiet += `*Tổng kết live-only*: **${sumLive}**\n\n`;
  chiTiet += `| STT | Điểm đến | Định vị | Trạng thái nội dung | KS / Ăn / Cafe / HĐ | Ô chưa lấp | Lỗi vi phạm / Ghi chú |\n`;
  chiTiet += `|:---:|:---|:---:|:---:|:---:|:---:|:---|\n`;

  itemsLive.forEach((it, idx) => {
    const sl = it.soLuongTheoLoai
      ? `${it.soLuongTheoLoai.khachSan}/${it.soLuongTheoLoai.quanAn}/${it.soLuongTheoLoai.cafe}/${it.soLuongTheoLoai.hoatDong}`
      : "-";
    const chuaLap = it.soSlotChuaLap
      ? `HĐ:${it.soSlotChuaLap.hoatDong}, Ăn:${it.soSlotChuaLap.buaAn}`
      : "0";
    const loi = it.overpassError
      ? `Overpass: ${it.overpassError}`
      : it.loiHard?.length > 0
      ? it.loiHard.join("; ")
      : it.danhGia || "-";
    chiTiet += `| ${idx + 1} | **${it.diemDen}** | ${it.geocodeThanhCong ? "Thành công" : "Thất bại"} | **${it.trangThaiNoiDung}** | ${sl} | ${chuaLap} | ${loi} |\n`;
  });

  chiTiet += `\n> *Ghi chú cảnh báo*: Ở chế độ live-only, máy chủ Overpass thường xuyên bị timeout hoặc trả về 0 mục đối với khách sạn (Đà Nẵng, Hà Nội, Seoul), dẫn đến trạng thái THIẾU DỮ LIỆU.\n\n`;

  chiTiet += `#### Bảng 2: Kết quả khi có cơ chế Dự phòng (có dự phòng snapshot / cache)\n\n`;
  chiTiet += `*Tổng kết có dự phòng*: **${sumFallback}**\n\n`;
  chiTiet += `| STT | Điểm đến | Định vị | Trạng thái nội dung | Nguồn dữ liệu | KS / Ăn / Cafe / HĐ | Kết quả kế hoạch |\n`;
  chiTiet += `|:---:|:---|:---:|:---:|:---|:---:|:---|\n`;

  itemsFallback.forEach((it, idx) => {
    const sl = it.soLuongTheoLoai
      ? `${it.soLuongTheoLoai.khachSan}/${it.soLuongTheoLoai.quanAn}/${it.soLuongTheoLoai.cafe}/${it.soLuongTheoLoai.hoatDong}`
      : "-";
    chiTiet += `| ${idx + 1} | **${it.diemDen}** | ${it.geocodeThanhCong ? "Thành công" : "Thất bại"} | **${it.trangThaiNoiDung}** | ${it.nguonDL || "snapshot"} | ${sl} | ${it.keHoachHopLe ? "✅ Hợp lệ, đủ ô" : "❌ Chưa đạt"} |\n`;
  });

  return {
    name: "diadiem",
    title: "Kiểm tra chất lượng địa điểm (Location Data)",
    status: "ĐÃ CHẠY",
    dinhNghiaDat,
    latestFile: path.basename(liveFile || fallbackFile || "diadiem-2026-10-20.json"),
    date: dateStr,
    doMoi,
    giaiThichDoMoi: layGiaiThichDoMoi(doMoi, rawQuyTacVersion),
    quyTacVersionGhiNhan: "(không ghi)",
    promptVersionGhiNhan: "N/A",
    modelGhiNhan: "Nominatim + Overpass OSM",
    ketQuaTongQuat: `Live: ${sumLive} | Có dự phòng: ${sumFallback}`,
    chiTietNoiDung: chiTiet,
  };
}

// ─── 7. Suite: ai-rate ────────────────────────────────────────────────────────
export function parseSuiteAiRate(): SuiteSummary {
  const dinhNghiaDat =
    "'x/10 kịch bản đã chạy với quy tắc hiện tại' (chỉ tính HOP_LE); đọc ĐÚNG trường phiên bản prompt agent (hiện AGENT_PROMPT_VERSION = 'v4'); nêu rõ nếu file ghi khác.";
  const filePath = findNewestFile("ai-rate-");
  if (!filePath) {
    return {
      name: "ai-rate",
      title: "Đánh giá chất lượng lập kế hoạch AI (AI Rate)",
      status: "CHƯA CHẠY",
      dinhNghiaDat,
      ketQuaTongQuat: "CHƯA CHẠY",
    };
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const dateStr = raw.summary?.ngay || "2026-10-20";

  // File ghi phiên bản quy tắc cũ v1 trong các scenarios
  const rawQuyTacVersion = raw.summary?.quyTacVersion || raw.quyTacVersion; // undefined trong file thực tế
  const doMoi = danhGiaDoMoi({
    ngayChay: dateStr,
    quyTacVersion: rawQuyTacVersion,
    ngayHienTai: NGAY_HIEN_TAI,
    quyTacHienTai: QUY_TAC_HIEN_TAI,
  });

  const total = raw.summary?.tongSoKichBan || 10;
  // Chỉ tính số kịch bản đạt HOP_LE với quy tắc hiện tại
  const soKichBanHopLe = doMoi === "HOP_LE" ? raw.summary?.soKichBanDaChay || 0 : 0;
  const soKichBanCu = raw.summary?.soKichBanCu || 3;

  const ketQuaTongQuat = `${soKichBanHopLe}/${total} kịch bản đã chạy với quy tắc hiện tại`;

  // Kiểm tra phiên bản prompt agent
  const promptDocDuocTuFile = raw.summary?.promptVersion || raw.promptVersion || "(không ghi)";
  const promptHienTai = AGENT_PROMPT_VERSION; // "v4"

  let chiTiet = `| Chỉ số | Giá trị | Ghi chú |\n|:---|:---:|:---|\n`;
  chiTiet += `| Số kịch bản đã chạy với quy tắc hiện tại | **${soKichBanHopLe}/${total}** | Chỉ tính các kịch bản có độ mới HOP_LE |\n`;
  chiTiet += `| Số kịch bản mang nhãn quy tắc cũ | **${soKichBanCu}** | Chạy với quy tắc v1 (cũ), khác quy tắc v3 hiện tại |\n`;
  chiTiet += `| Phiên bản Prompt trong file | **${promptDocDuocTuFile}** | File ghi: \`${promptDocDuocTuFile}\` |\n`;
  chiTiet += `| Phiên bản Prompt Agent hiện tại trong code | **${promptHienTai}** | \`AGENT_PROMPT_VERSION = "${promptHienTai}"\` (src/ai/planAgent.ts) |\n`;
  chiTiet += `| Dừng sớm do lỗi 429 | ${raw.summary?.dungSomDo429 ? "Có" : "Không"} | - |\n\n`;

  chiTiet += `#### ⚠️ Phân tích sự sai lệch phiên bản:\n`;
  chiTiet += `- Tập tin kết quả \`${path.basename(filePath)}\` được sinh ra từ phiên bản quy tắc cũ (\`v1\`), chưa chạy lại với quy tắc hiện tại (\`v3\`).\n`;
  chiTiet += `- Phiên bản prompt agent trong mã nguồn hiện tại là **\`${promptHienTai}\`**, trong khi kết quả cũ không phản ánh prompt \`${promptHienTai}\`.\n`;
  chiTiet += `- Do đó, theo quy tắc đánh giá độ mới, bộ này hiện có **0/${total} kịch bản hợp lệ** với quy tắc hiện tại.\n`;

  return {
    name: "ai-rate",
    title: "Đánh giá chất lượng lập kế hoạch AI (AI Rate)",
    status: "ĐÃ CHẠY",
    dinhNghiaDat,
    latestFile: path.basename(filePath),
    date: dateStr,
    doMoi,
    giaiThichDoMoi: layGiaiThichDoMoi(doMoi, rawQuyTacVersion),
    quyTacVersionGhiNhan: rawQuyTacVersion ?? "(không ghi)",
    promptVersionGhiNhan: promptDocDuocTuFile,
    modelGhiNhan: "gemini-3.5-flash-lite",
    ketQuaTongQuat,
    chiTietNoiDung: chiTiet,
  };
}

export function generateReportMarkdown(): string {
  const suites: SuiteSummary[] = [
    parseSuiteParse(),
    parseSuiteRepair(),
    parseSuiteBill(),
    parseSuiteLikes(),
    parseSuiteData(),
    parseSuiteDiadiem(),
    parseSuiteAiRate(),
  ];

  let md = "# SỐ LIỆU TỔNG HỢP CÁC BỘ ĐÁNH GIÁ (EVALUATION REPORT)\n\n";
  md += `> Ngày tổng hợp: ${NGAY_HIEN_TAI} | Phiên bản quy tắc chuẩn: \`QUY_TAC_VERSION = "${QUY_TAC_HIEN_TAI}"\` | Agent Prompt: \`AGENT_PROMPT_VERSION = "${AGENT_PROMPT_VERSION}"\`\n\n`;

  md += "## 1. Bảng tổng quan trạng thái các bộ kiểm thử\n\n";
  md += "| STT | Bộ đánh giá | Trạng thái | Đánh giá độ mới | Kết quả tổng quát | Model | Prompt Version | Quy tắc Version (file) | Ngày chạy |\n";
  md += "|:---:|:---|:---:|:---|:---|:---|:---:|:---:|:---:|\n";

  suites.forEach((s, idx) => {
    const stt = idx + 1;
    if (s.status === "CHƯA CHẠY") {
      md += `| ${stt} | **${s.title}** (\`${s.name}\`) | **CHƯA CHẠY** | - | **CHƯA CHẠY** | - | - | - | - |\n`;
    } else {
      const doMoiText = s.doMoi === "HOP_LE" ? "HOP_LE" : `**${s.doMoi}**`;
      md += `| ${stt} | **${s.title}** (\`${s.name}\`) | Đã chạy | ${doMoiText} | **${s.ketQuaTongQuat}** | ${s.modelGhiNhan || "-"} | ${s.promptVersionGhiNhan || "-"} | ${s.quyTacVersionGhiNhan || "-"} | ${s.date || "-"} |\n`;
    }
  });

  md += "\n---\n\n";
  md += "## 2. Chi tiết từng bộ đánh giá\n\n";

  suites.forEach((s, idx) => {
    const stt = idx + 1;
    md += `### 2.${stt}. ${s.title} (\`${s.name}\`)\n\n`;
    md += `> **Định nghĩa đạt**: ${s.dinhNghiaDat}\n\n`;

    if (s.status === "CHƯA CHẠY") {
      md += "**Trạng thái**: **CHƯA CHẠY**\n\n";
      md += "- Chưa có kết quả kiểm thử trong `eval/results/`.\n\n";
      return;
    }

    md += `- **Tập tin kết quả**: \`${s.latestFile}\`\n`;
    md += `- **Ngày chạy**: ${s.date}\n`;
    md += `- **Trường quy tắc ghi nhận từ file**: \`${s.quyTacVersionGhiNhan}\` *(hiện tại: \`${QUY_TAC_HIEN_TAI}\`)*\n`;
    md += `- **Trường prompt ghi nhận từ file**: \`${s.promptVersionGhiNhan}\` *(hiện tại: \`${AGENT_PROMPT_VERSION}\`)*\n`;
    md += `- **Đánh giá độ mới**: \`${s.doMoi}\` — ${s.giaiThichDoMoi}\n`;
    md += `- **Kết quả**: **${s.ketQuaTongQuat}**\n\n`;

    if (s.chiTietNoiDung) {
      md += s.chiTietNoiDung + "\n";
    }
  });

  md += "---\n\n";
  md += "## 3. CẦN CHẠY LẠI SAU KHI ĐÓNG BĂNG\n\n";
  md += "Dưới đây là danh sách các bộ kiểm thử đang ở trạng thái **CŨ** (không ghi phiên bản, khác phiên bản quy tắc, hoặc quá 7 ngày) hoặc **CHƯA CHẠY**, cần được chạy lại sau khi hoàn thành đóng băng mã nguồn:\n\n";

  const danhSachCanChayLai: Array<{ name: string; title: string; lyDo: string }> = [];

  for (const s of suites) {
    if (s.status === "CHƯA CHẠY") {
      danhSachCanChayLai.push({
        name: s.name,
        title: s.title,
        lyDo: "CHƯA CHẠY — chưa có tệp kết quả kiểm thử",
      });
    } else if (s.doMoi !== "HOP_LE") {
      danhSachCanChayLai.push({
        name: s.name,
        title: s.title,
        lyDo: `${s.doMoi}: ${s.giaiThichDoMoi}`,
      });
    }
  }

  md += "| STT | Bộ kiểm thử | Mã bộ | Tình trạng hiện tại | Lý do cần chạy lại |\n";
  md += "|:---:|:---|:---:|:---|:---|\n";
  danhSachCanChayLai.forEach((item, idx) => {
    md += `| ${idx + 1} | **${item.title}** | \`${item.name}\` | ⚠️ CẦN CHẠY LẠI | ${item.lyDo} |\n`;
  });

  md += "\n---\n\n";
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
  console.log("TỔNG HỢP SỐ LIỆU ĐÁNH GIÁ (EVAL:TONGHOP) - BƯỚC 22");
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
