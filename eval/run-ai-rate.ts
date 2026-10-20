import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

// Bắt buộc DATA_MODE=snapshot
process.env.DATA_MODE = "snapshot";
loadEnvConfig(process.cwd());

import { planWithRepair } from "../src/ai/planWithRepair";
import { tinhNganSachToiThieu } from "../src/core/minBudget";
import { soOKhaDung } from "../src/core/oKhaDung";
import { calculateTransportFlags } from "../src/core/flags";
import { LiveDataSource } from "../src/data/live/LiveDataSource";
import type { TripRequest, DiemDen } from "../src/contracts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const DIEM_DI_TPHCM: DiemDen = {
  ten: "TP.HCM",
  quocGia: "Việt Nam",
  maQuocGia: "VN",
  toaDo: { lat: 10.7769, lng: 106.7009 },
  tienTe: "VND",
  nguon: "nominatim",
  ngayLay: "2026-10-20",
};

interface DiemDenConfig {
  id: string;
  ten: string;
  diemDen: DiemDen;
}

const DANH_SACH_DIEM_DEN: DiemDenConfig[] = [
  {
    id: "da_nang",
    ten: "Đà Nẵng",
    diemDen: {
      ten: "Đà Nẵng",
      quocGia: "Việt Nam",
      maQuocGia: "VN",
      toaDo: { lat: 16.0544, lng: 108.2022 },
      tienTe: "VND",
      nguon: "nominatim",
      ngayLay: "2026-10-20",
    },
  },
  {
    id: "ha_noi",
    ten: "Hà Nội",
    diemDen: {
      ten: "Hà Nội",
      quocGia: "Việt Nam",
      maQuocGia: "VN",
      toaDo: { lat: 21.0285, lng: 105.8542 },
      tienTe: "VND",
      nguon: "nominatim",
      ngayLay: "2026-10-20",
    },
  },
  {
    id: "da_lat",
    ten: "Đà Lạt",
    diemDen: {
      ten: "Đà Lạt",
      quocGia: "Việt Nam",
      maQuocGia: "VN",
      toaDo: { lat: 11.9404, lng: 108.4583 },
      tienTe: "VND",
      nguon: "nominatim",
      ngayLay: "2026-10-20",
    },
  },
  {
    id: "phu_quoc",
    ten: "Phú Quốc",
    diemDen: {
      ten: "Phú Quốc",
      quocGia: "Việt Nam",
      maQuocGia: "VN",
      toaDo: { lat: 10.2899, lng: 103.984 },
      tienTe: "VND",
      nguon: "nominatim",
      ngayLay: "2026-10-20",
    },
  },
  {
    id: "bangkok",
    ten: "Bangkok",
    diemDen: {
      ten: "Bangkok",
      quocGia: "Thái Lan",
      maQuocGia: "TH",
      toaDo: { lat: 13.7563, lng: 100.5018 },
      tienTe: "THB",
      nguon: "nominatim",
      ngayLay: "2026-10-20",
    },
  },
];

interface ScenarioResult {
  stt: number;
  diemDen: string;
  heSo: "1.3x" | "2.0x";
  ngansachTongVND: number;
  phuongThucLap: string;
  lyDoDuPhong: string;
  soLanGoiAI: number;
  ms: number;
  tongVND: number;
  phanTramNganSach: string;
  oHoatDong: string;
  tongThoiGianDiChuyen: number;
  soVongSua: number;
  status: string;
  boQua?: boolean;
}

async function main() {
  console.log("================================================================================");
  console.log("EVAL: RUN-AI-RATE (Bước 14: 10 kịch bản cố định trên DATA_MODE=snapshot)");
  console.log("================================================================================\n");

  const resultsDir = path.resolve(process.cwd(), "eval/results");
  fs.mkdirSync(resultsDir, { recursive: true });

  const snapshotsDir = path.resolve(process.cwd(), "src/data/snapshots");
  const availableSnapshots = fs.existsSync(snapshotsDir)
    ? fs.readdirSync(snapshotsDir).filter((f) => f.endsWith(".json"))
    : [];

  const scenarios: Array<{
    stt: number;
    destConfig: DiemDenConfig;
    heSo: "1.3x" | "2.0x";
    mul: number;
  }> = [];

  let count = 1;
  for (const dest of DANH_SACH_DIEM_DEN) {
    scenarios.push({ stt: count++, destConfig: dest, heSo: "1.3x", mul: 1.3 });
    scenarios.push({ stt: count++, destConfig: dest, heSo: "2.0x", mul: 2.0 });
  }

  const results: ScenarioResult[] = [];
  let stopDueTo429 = false;

  for (let i = 0; i < scenarios.length; i++) {
    const sc = scenarios[i];
    const { destConfig, heSo, mul } = sc;
    console.log(`[${sc.stt}/10] Chuẩn bị kịch bản: ${destConfig.ten} (${heSo})...`);

    // Kiểm tra snapshot
    const hasSnap = availableSnapshots.some((f) =>
      f.toLowerCase().includes(destConfig.id)
    );
    if (!hasSnap) {
      console.log(` -> Bỏ qua ${destConfig.ten} vì không tìm thấy file snapshot.`);
      results.push({
        stt: sc.stt,
        diemDen: destConfig.ten,
        heSo,
        ngansachTongVND: 0,
        phuongThucLap: "bo_qua",
        lyDoDuPhong: "thieu_snapshot",
        soLanGoiAI: 0,
        ms: 0,
        tongVND: 0,
        phanTramNganSach: "0%",
        oHoatDong: "0/0",
        tongThoiGianDiChuyen: 0,
        soVongSua: 0,
        status: "bo_qua",
        boQua: true,
      });
      continue;
    }

    // Lấy dữ liệu từ LiveDataSource để tính minBudget
    const liveDS = new LiveDataSource("snapshot", undefined, destConfig.diemDen, DIEM_DI_TPHCM, 3);
    const [transports, hotels, khachSans, quanAns, cafes, hoatDongs] = await Promise.all([
      liveDS.getTransports(),
      liveDS.getHotels(),
      liveDS.getKhachSans(),
      liveDS.getQuanAns(),
      liveDS.getCafes(),
      liveDS.getHoatDongs(),
    ]);

    const planData = { transports, hotels, khachSans, quanAns, cafes, hoatDongs };
    const tempReq: TripRequest = {
      schemaVersion: 9,
      diemDi: DIEM_DI_TPHCM,
      diemDen: destConfig.diemDen,
      soNguoi: 2,
      soNgay: 3,
      ngansachTongVND: 100_000_000,
      sothich: [],
      tranh: [],
      ghiChu: [],
      thieu: [],
      cauHoiLamRo: [],
      canhBao: [],
    };

    const minRes = tinhNganSachToiThieu(tempReq, planData as any);
    const toiThieu = minRes.toiThieuVND || 5_000_000;
    const ngansach = Math.ceil((toiThieu * mul) / 100_000) * 100_000;

    const request: TripRequest = {
      ...tempReq,
      ngansachTongVND: ngansach,
    };

    console.log(
      ` -> Ngân sách: ${ngansach.toLocaleString("vi-VN")} đ (tối thiểu: ${toiThieu.toLocaleString(
        "vi-VN"
      )} đ). Đang chạy planWithRepair...`
    );

    const startRun = Date.now();
    let res;
    try {
      res = await planWithRepair(request);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(` -> Lỗi khi chạy kịch bản: ${msg}`);
      if (msg.includes("429") || msg.includes("het_luot_ai")) {
        console.warn(" -> Phát hiện lỗi 429 Quota Exceeded. Dừng chạy kịch bản tiếp theo.");
        stopDueTo429 = true;
      }
      break;
    }

    const duration = Date.now() - startRun;
    const tongVND = res.plan?.tongKet.tongVND ?? 0;
    const phanTram = ngansach > 0 ? ((tongVND / ngansach) * 100).toFixed(1) + "%" : "0%";

    // Tính số ô khả dụng
    let khaDung = 4;
    let daLap = 0;
    if (res.plan) {
      const diItem = res.plan.items.find(
        (it) => it.hangMuc === "Di chuyển" && it.refId?.startsWith("PT_")
      );
      const veItem = res.plan.items
        .slice()
        .reverse()
        .find((it) => it.hangMuc === "Di chuyển" && it.refId?.startsWith("PT_"));

      const parseMinutes = (tStr?: string | null) => {
        if (!tStr) return 0;
        const [h, m] = tStr.split(":").map(Number);
        return (h || 0) * 60 + (m || 0);
      };

      const diTransport = transports.find((t) => t.id === diItem?.refId);
      const veTransport = transports.find((t) => t.id === veItem?.refId);

      if (diTransport && veTransport) {
        const flags = calculateTransportFlags(diTransport.departureTime, diTransport.durationMinutes);
        const gioDenPhut = parseMinutes(flags.gioDen);
        const gioVePhut = parseMinutes(veTransport.departureTime);
        khaDung = soOKhaDung(3, gioDenPhut, gioVePhut);
      }

      daLap = res.plan.items.filter((it) => it.hangMuc === "Vui chơi").length;
    }

    const scRes: ScenarioResult = {
      stt: sc.stt,
      diemDen: destConfig.ten,
      heSo,
      ngansachTongVND: ngansach,
      phuongThucLap: res.phuongThucLap ?? "ai",
      lyDoDuPhong: res.lyDoDuPhong ?? "",
      soLanGoiAI: res.soLanGoiAI ?? 0,
      ms: duration,
      tongVND,
      phanTramNganSach: phanTram,
      oHoatDong: `${daLap}/${khaDung}`,
      tongThoiGianDiChuyen: res.plan?.tongKet.tongThoiGianDiChuyenPhut ?? 0,
      soVongSua: res.soVongSua ?? 0,
      status: res.status,
    };

    results.push(scRes);
    console.log(
      ` -> Kết quả: ${scRes.phuongThucLap} ${scRes.lyDoDuPhong ? `(${scRes.lyDoDuPhong})` : ""} | ` +
        `${scRes.tongVND.toLocaleString("vi-VN")} đ (${scRes.phanTramNganSach}) | ` +
        `Ô: ${scRes.oHoatDong} | Lượt AI: ${scRes.soLanGoiAI} | ${scRes.ms}ms`
    );

    if (res.lyDoDuPhong === "het_luot_ai" || res.soLan429 > 0) {
      console.warn(" -> Gặp lỗi 429 / hết lượt AI. Dừng lại theo yêu cầu.");
      stopDueTo429 = true;
      break;
    }

    if (i < scenarios.length - 1) {
      console.log(" -> Nghỉ 5 giây giữa các kịch bản...");
      await sleep(5000);
    }
  }

  // Lưu file kết quả JSON
  const dateStr = new Date().toISOString().slice(0, 10);
  const resultFilePath = path.join(resultsDir, `ai-rate-${dateStr}.json`);

  // Tổng hợp thống kê
  const validRuns = results.filter((r) => !r.boQua);
  const totalRuns = validRuns.length;
  const numFirstOk = validRuns.filter(
    (r) => r.phuongThucLap === "ai" && r.soVongSua === 0 && r.status === "ok"
  ).length;
  const numRepairedOk = validRuns.filter(
    (r) => r.phuongThucLap === "ai" && r.soVongSua > 0 && r.status === "ok"
  ).length;
  const numFallback = validRuns.filter((r) => r.phuongThucLap === "quy_tac").length;
  const fallbackReasons = validRuns
    .filter((r) => r.phuongThucLap === "quy_tac")
    .map((r) => r.lyDoDuPhong);

  const totalAICalls = validRuns.reduce((acc, r) => acc + r.soLanGoiAI, 0);
  const avgAICalls = totalRuns > 0 ? (totalAICalls / totalRuns).toFixed(1) : "0";
  const totalMs = validRuns.reduce((acc, r) => acc + r.ms, 0);
  const avgMs = totalRuns > 0 ? Math.round(totalMs / totalRuns) : 0;

  const summary = {
    ngay: dateStr,
    tongSoKichBan: scenarios.length,
    soKichBanDaChay: totalRuns,
    dungSomDo429: stopDueTo429,
    aiHopLeNgayLanDau: `${numFirstOk}/${totalRuns}`,
    aiHopLeSauSua: `${numRepairedOk}/${totalRuns}`,
    phaiDuPhong: `${numFallback}/${totalRuns}`,
    lyDoDuPhong: fallbackReasons,
    trungBinhSoLuotGemini: Number(avgAICalls),
    tongSoLuotGeminiDaDung: totalAICalls,
    msTrungBinh: avgMs,
  };

  const payload = {
    summary,
    scenarios: results,
  };

  fs.writeFileSync(resultFilePath, JSON.stringify(payload, null, 2), "utf-8");

  console.log("\n================================================================================");
  console.log("BẢNG KẾT QUẢ 10 KỊCH BẢN:");
  console.log("================================================================================");
  console.table(
    results.map((r) => ({
      STT: r.stt,
      "Điểm đến": r.diemDen,
      Hệ: r.heSo,
      "Ngân sách": r.ngansachTongVND.toLocaleString("vi-VN"),
      "Phương thức": r.phuongThucLap,
      "Lý do": r.lyDoDuPhong || "-",
      "Lượt AI": r.soLanGoiAI,
      "Tổng VND": r.tongVND.toLocaleString("vi-VN"),
      "% NS": r.phanTramNganSach,
      "Ô HĐ": r.oHoatDong,
      "Di chuyển (phút)": r.tongThoiGianDiChuyen,
      ms: r.ms,
    }))
  );

  console.log("\n================================================================================");
  console.log("TỔNG HỢP (dạng x/y):");
  console.log(`- Số ca AI lập hợp lệ ngay lần đầu: ${summary.aiHopLeNgayLanDau}`);
  console.log(`- Số ca AI lập hợp lệ sau sửa: ${summary.aiHopLeSauSua}`);
  console.log(
    `- Số ca phải dự phòng: ${summary.phaiDuPhong} (${
      fallbackReasons.length > 0 ? fallbackReasons.join(", ") : "không có"
    })`
  );
  console.log(`- Trung bình số lượt Gemini: ${summary.trungBinhSoLuotGemini}`);
  console.log(`- Tổng số lượt Gemini đã dùng: ${summary.tongSoLuotGeminiDaDung}`);
  console.log(`- ms trung bình: ${summary.msTrungBinh} ms`);
  console.log(`- Kết quả đã lưu tại: ${resultFilePath}`);
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("Lỗi thực thi eval/run-ai-rate.ts:", err);
  process.exit(1);
});
