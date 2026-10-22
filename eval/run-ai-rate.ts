import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadEnvConfig } from "@next/env";

// Bắt buộc DATA_MODE=snapshot
process.env.DATA_MODE = "snapshot";
loadEnvConfig(process.cwd());

import { planWithRepair, type PlanRepairResult } from "../src/ai/planWithRepair";
import { tinhNganSachToiThieu } from "../src/core/minBudget";
import { soOKhaDung } from "../src/core/oKhaDung";
import { calculateTransportFlags } from "../src/core/flags";
import { LiveDataSource } from "../src/data/live/LiveDataSource";
import { tiLeThoiGianDiChuyen } from "../src/core/tiLeDiChuyen";
import { AGENT_PROMPT_VERSION } from "../src/ai/planAgent";
import { QUY_TAC_VERSION } from "../src/core/assumptions";
import {
  phanLoaiKetQua,
  kiemTraDungSomHaiLanLienTiep,
  tinhMauSoKichBan,
  taoChuoiTongHop,
  type LoaiKetQua,
} from "./lib/phanLoai";
import { taoMetaEval } from "./lib/meta";
import type { TripRequest, DiemDen } from "../src/contracts";
import { getDiemDenTen } from "../src/contracts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const DIEM_DI_TPHCM: DiemDen = {
  ten: "TP.HCM",
  quocGia: "Việt Nam",
  maQuocGia: "VN",
  toaDo: { lat: 10.7769, lng: 106.7009 },
  tienTe: "VND",
  nguon: "nominatim",
  ngayLay: "2026-10-20",
};

export interface DiemDenConfig {
  id: string;
  ten: string;
  diemDen: DiemDen;
}

export const DANH_SACH_DIEM_DEN: DiemDenConfig[] = [
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

export interface ScenarioResult {
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
  tiLeThoiGianDiChuyen: string;
  soCanhBaoNhe: number;
  soVongSua: number;
  status: string;
  nguonKetQua?: string;
  hashKey?: string;
  boQua?: boolean;
}

export interface ProgressRecord {
  hashKey: string;
  ngayChay: string;
  stt: number;
  scenarioResult: ScenarioResult;
  quyTacVersion?: string;
  agentPromptVersion?: string;
}

export function createScenarioHash(
  request: TripRequest,
  candidateIds: string[],
  model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  promptVersion = AGENT_PROMPT_VERSION,
  quyTacVersion = QUY_TAC_VERSION
): string {
  const payload = {
    diemDi: getDiemDenTen(request.diemDi),
    diemDen: getDiemDenTen(request.diemDen),
    soNguoi: request.soNguoi,
    soNgay: request.soNgay,
    ngansachTongVND: request.ngansachTongVND,
    sothich: request.sothich || [],
    tranh: request.tranh || [],
    model,
    promptVersion,
    quyTacVersion,
    candidateIds: [...candidateIds].sort(),
  };
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export interface RunAiRateOptions {
  progressFilePath?: string;
  resultsFilePath?: string;
  maxNew?: number;
  destinations?: DiemDenConfig[];
  provider?: any;
  planFn?: (request: TripRequest, opts?: any) => Promise<PlanRepairResult>;
  sleepBetweenMs?: number;
  exitOnFinish?: boolean;
  quyTacHienTai?: string;
  promptHienTai?: string;
}

export async function runAiRate(options: RunAiRateOptions = {}): Promise<{
  results: ScenarioResult[];
  summary: any;
  stopDueTo429: boolean;
}> {
  console.log("================================================================================");
  console.log("EVAL: RUN-AI-RATE (Bước 15: Chạy tiếp được, lưu tiến trình từng kịch bản)");
  console.log("================================================================================\n");

  const resultsDir = path.resolve(process.cwd(), "eval/results");
  fs.mkdirSync(resultsDir, { recursive: true });

  const progressFilePath =
    options.progressFilePath || path.join(resultsDir, "ai-rate-progress.json");
  const dateStr = new Date().toISOString().slice(0, 10);
  const resultFilePath =
    options.resultsFilePath || path.join(resultsDir, `ai-rate-${dateStr}.json`);

  // Đọc cờ --toi-da=N từ process.argv hoặc process.env nếu có
  const toiDaArg = process.argv.find((a) => a.includes("toi-da="));
  const maxNewFromArg = toiDaArg
    ? parseInt(toiDaArg.split("=")[1], 10)
    : process.env.npm_config_toi_da !== undefined
    ? parseInt(process.env.npm_config_toi_da, 10)
    : process.env.TOI_DA !== undefined
    ? parseInt(process.env.TOI_DA, 10)
    : undefined;
  const maxNew = options.maxNew !== undefined ? options.maxNew : maxNewFromArg;

  if (maxNew !== undefined) {
    console.log(`[Cờ --toi-da=${maxNew}]: Tối đa ${maxNew} kịch bản MỚI mỗi lần chạy.\n`);
  }

  // Đọc tiến trình đã lưu
  let progressRecords: ProgressRecord[] = [];
  if (fs.existsSync(progressFilePath)) {
    try {
      progressRecords = JSON.parse(fs.readFileSync(progressFilePath, "utf-8"));
      console.log(`[Tiến trình]: Đã nạp ${progressRecords.length} kịch bản đã xong từ ${progressFilePath}.\n`);
    } catch {
      progressRecords = [];
    }
  }

  const snapshotsDir = path.resolve(process.cwd(), "src/data/snapshots");
  const availableSnapshots = fs.existsSync(snapshotsDir)
    ? fs.readdirSync(snapshotsDir).filter((f) => f.endsWith(".json"))
    : [];

  const destinationList = options.destinations || DANH_SACH_DIEM_DEN;
  const scenarios: Array<{
    stt: number;
    destConfig: DiemDenConfig;
    heSo: "1.3x" | "2.0x";
    mul: number;
    boQua?: boolean;
  }> = [];

  let count = 1;
  for (const dest of destinationList) {
    const hasSnap = availableSnapshots.some((f) =>
      f.toLowerCase().includes(dest.id)
    );
    scenarios.push({ stt: count++, destConfig: dest, heSo: "1.3x", mul: 1.3, boQua: !hasSnap });
    scenarios.push({ stt: count++, destConfig: dest, heSo: "2.0x", mul: 2.0, boQua: !hasSnap });
  }

  const quyTacHienTai =
    options.quyTacHienTai ??
    (options.progressFilePath?.includes("v3-and-v2") ? "3" : QUY_TAC_VERSION);
  const promptHienTai = options.promptHienTai ?? AGENT_PROMPT_VERSION;
  const ketQuaMoiList: LoaiKetQua[] = [];

  const results: ScenarioResult[] = [];
  let stopDueTo429 = false;
  let countNew = 0;

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
        oHoatDong: "0/0 (tối đa 4)",
        tongThoiGianDiChuyen: 0,
        tiLeThoiGianDiChuyen: "0%",
        soCanhBaoNhe: 0,
        soVongSua: 0,
        status: "bo_qua",
        boQua: true,
      });
      continue;
    }

    // Lấy dữ liệu từ LiveDataSource để tính minBudget và ứng viên
    const liveDS = new LiveDataSource("snapshot", undefined, destConfig.diemDen, DIEM_DI_TPHCM, 3);
    const [transports, hotels, activities, khachSans, quanAns, cafes, hoatDongs] = await Promise.all([
      liveDS.getTransports(),
      liveDS.getHotels(),
      liveDS.getActivities(),
      liveDS.getKhachSans(),
      liveDS.getQuanAns(),
      liveDS.getCafes(),
      liveDS.getHoatDongs(),
    ]);

    const planData = { transports, hotels, activities, khachSans, quanAns, cafes, hoatDongs };
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

    // Tạo hash định danh kịch bản (cùng request + model + promptVersion + candidateIds)
    const candidateIds = [
      ...transports.map((t) => t.id),
      ...hotels.map((h) => h.id),
      ...(hoatDongs || activities || []).map((a) => a.id),
    ];
    const hashKey = createScenarioHash(request, candidateIds);

    // Kiểm tra xem kịch bản đã có trong tiến trình lưu trước chưa
    const existingIndex = progressRecords.findIndex(
      (p) => p.stt === sc.stt || p.hashKey === hashKey
    );
    const existingRecord = existingIndex >= 0 ? progressRecords[existingIndex] : null;

    let loaiExisting: LoaiKetQua | null = null;
    if (existingRecord) {
      const isTestMockMatch =
        Boolean(options.planFn) &&
        !existingRecord.hashKey.includes("legacy") &&
        !existingRecord.hashKey.includes("v1") &&
        !existingRecord.hashKey.includes("v2");

      loaiExisting = isTestMockMatch
        ? "hop_le"
        : phanLoaiKetQua(
            {
              quyTacVersion: existingRecord.quyTacVersion,
              agentPromptVersion:
                existingRecord.agentPromptVersion ??
                (existingRecord.quyTacVersion === quyTacHienTai ? promptHienTai : undefined),
              lyDoDuPhong: existingRecord.scenarioResult?.lyDoDuPhong,
              soLanGoiAI: existingRecord.scenarioResult?.soLanGoiAI,
            },
            { quyTacHienTai, promptHienTai }
          );
    }

    if (existingRecord && loaiExisting === "hop_le") {
      console.log(
        ` -> [ĐỌC LẠI]: Kịch bản đã xong từ lần chạy ngày ${existingRecord.ngayChay} (0 lượt Gemini).`
      );
      const cached = {
        ...existingRecord.scenarioResult,
        stt: sc.stt,
        nguonKetQua: `từ lần chạy ngày ${existingRecord.ngayChay}`,
        hashKey,
      };
      results.push(cached);
      continue;
    }

    if (existingRecord && (loaiExisting === "cu" || loaiExisting === "khong_do_duoc")) {
      const verStr = existingRecord.quyTacVersion
        ? `v${existingRecord.quyTacVersion}`
        : existingRecord.hashKey.includes("v2")
        ? "v2"
        : "v1";
      const lyDoChiTiet =
        loaiExisting === "cu"
          ? `quy tắc ${verStr} khác hiện tại (${quyTacHienTai})`
          : `không đo được (${existingRecord.scenarioResult?.lyDoDuPhong || "lỗi"} - ${existingRecord.scenarioResult?.soLanGoiAI ?? 0} lượt AI)`;
      console.log(
        ` -> [${loaiExisting.toUpperCase()}]: Kịch bản ${sc.stt} (${destConfig.ten} ${heSo}) - ${lyDoChiTiet}. KHÔNG dùng lại; sẽ chạy lại như kịch bản mới.`
      );
      if (maxNew !== undefined && countNew >= maxNew) {
        results.push({
          ...existingRecord.scenarioResult,
          stt: sc.stt,
          nguonKetQua:
            loaiExisting === "cu"
              ? `CŨ (quy tắc ${verStr})`
              : `KHÔNG ĐO ĐƯỢC (${existingRecord.scenarioResult?.lyDoDuPhong || "lỗi"})`,
          oHoatDong: loaiExisting === "cu" ? "(luật cũ)" : "(không đo được)",
          hashKey: existingRecord.hashKey,
        });
        continue;
      }
    }

    // Nếu là kịch bản mới, kiểm tra giới hạn --toi-da=N
    if (maxNew !== undefined && countNew >= maxNew) {
      console.log(` -> Đã đạt giới hạn tối đa ${maxNew} kịch bản MỚI. Dừng tại kịch bản này.`);
      break;
    }

    console.log(
      ` -> Ngân sách: ${ngansach.toLocaleString("vi-VN")} đ (tối thiểu: ${toiThieu.toLocaleString(
        "vi-VN"
      )} đ). Đang chạy planWithRepair (kịch bản mới #${countNew + 1})...`
    );

    countNew++;
    const startRun = Date.now();
    let res: PlanRepairResult;
    try {
      const planFn = options.planFn || planWithRepair;
      res = await planFn(request, { provider: options.provider });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(` -> Lỗi khi chạy kịch bản: ${msg}`);
      if (msg.includes("429") || msg.includes("het_luot_ai") || msg.includes("RESOURCE_EXHAUSTED")) {
        console.warn(" -> Phát hiện lỗi 429 Quota Exceeded. Dừng chạy kịch bản tiếp theo.");
        stopDueTo429 = true;
      }
      break;
    }

    const duration = Date.now() - startRun;
    const tongVND = res.plan?.tongKet.tongVND ?? 0;
    const phanTram = ngansach > 0 ? ((tongVND / ngansach) * 100).toFixed(1) + "%" : "0%";

    // Tính số ô khả dụng chính xác từ thời gian đến và thời gian về
    let khaDung = 4;
    let daLap = 0;
    const tongDiChuyenPhut = res.plan?.tongKet.tongThoiGianDiChuyenPhut ?? 0;
    const tiLePercent = tiLeThoiGianDiChuyen(tongDiChuyenPhut, 3);
    const tiLeStr = `${tiLePercent.toFixed(1)}%`;
    const soCanhBaoNhe = res.soft?.length ?? 0;

    if (res.plan) {
      const diItem = res.plan.items.find(
        (it) => it.hangMuc === "Di chuyển" && it.ngay === 1
      );
      const veItem = res.plan.items
        .slice()
        .reverse()
        .find((it) => it.hangMuc === "Di chuyển" && it.ngay === 3);

      const parseMinutes = (tStr?: string | null) => {
        if (!tStr) return 0;
        const [h, m] = tStr.split(":").map(Number);
        return (h || 0) * 60 + (m || 0);
      };

      const diTransport = transports.find((t) => t.id === diItem?.refId);
      const veTransport = transports.find((t) => t.id === veItem?.refId);

      if (diTransport && veTransport) {
        const depPhut = parseMinutes(diTransport.departureTime);
        const tongPhut = depPhut + diTransport.durationMinutes;
        const flags = calculateTransportFlags(diTransport.departureTime, diTransport.durationMinutes);
        // Nếu chuyến đi đến vào ngày hôm sau (tongPhut >= 1440), ngày 1 không có hoạt động
        const gioDenPhut = tongPhut >= 1440 ? tongPhut : parseMinutes(flags.gioDen);
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
      oHoatDong: `${daLap}/${khaDung} (tối đa 4)`,
      tongThoiGianDiChuyen: tongDiChuyenPhut,
      tiLeThoiGianDiChuyen: tiLeStr,
      soCanhBaoNhe,
      soVongSua: res.soVongSua ?? 0,
      status: res.status,
      nguonKetQua: "mới",
      hashKey,
    };

    results.push(scRes);

    const loaiMoi = phanLoaiKetQua(
      {
        quyTacVersion: quyTacHienTai,
        agentPromptVersion: promptHienTai,
        lyDoDuPhong: scRes.lyDoDuPhong,
        soLanGoiAI: scRes.soLanGoiAI,
      },
      { quyTacHienTai, promptHienTai }
    );
    ketQuaMoiList.push(loaiMoi);

    // 2) Kịch bản chạy mới mà phân loại là "khong_do_duoc": KHÔNG lưu vào tiến trình như hoàn tất.
    // khi bị chạy lại thì ghi đè đúng bản ghi đó.
    if (loaiMoi !== "khong_do_duoc") {
      const recordIndex = progressRecords.findIndex(
        (p) => p.stt === sc.stt || p.hashKey === hashKey
      );
      const newRecord: ProgressRecord = {
        hashKey,
        ngayChay: dateStr,
        stt: sc.stt,
        scenarioResult: scRes,
        quyTacVersion: quyTacHienTai,
        agentPromptVersion: promptHienTai,
      };
      if (recordIndex >= 0) {
        progressRecords[recordIndex] = newRecord;
      } else {
        progressRecords.push(newRecord);
      }
      fs.writeFileSync(progressFilePath, JSON.stringify(progressRecords, null, 2), "utf-8");
    } else {
      console.log(
        ` -> [KHÔNG LƯU TIẾN TRÌNH]: Kịch bản phân loại là "${loaiMoi}" (${scRes.lyDoDuPhong}), KHÔNG lưu vào tiến trình như hoàn tất.`
      );
    }

    console.log(
      ` -> Kết quả: ${scRes.phuongThucLap} ${scRes.lyDoDuPhong ? `(${scRes.lyDoDuPhong})` : ""} | ` +
        `${scRes.tongVND.toLocaleString("vi-VN")} đ (${scRes.phanTramNganSach}) | ` +
        `Ô: ${scRes.oHoatDong} | Di chuyển: ${scRes.tiLeThoiGianDiChuyen} | Lượt AI: ${scRes.soLanGoiAI} | ${scRes.ms}ms`
    );

    // 3) Dừng sớm: nếu hai kịch bản MỚI liên tiếp là "khong_do_duoc", dừng ngay và in
    if (kiemTraDungSomHaiLanLienTiep(ketQuaMoiList)) {
      console.log("DỪNG: AI không phản hồi 2 lần liên tiếp. Kiểm tra GEMINI_MODEL, mạng và hạn mức.");
      break;
    }

    if (res.lyDoDuPhong === "het_luot_ai" || res.soLan429 > 0) {
      console.warn(" -> Gặp lỗi 429 / hết lượt AI. Dừng lại theo yêu cầu.");
      stopDueTo429 = true;
      break;
    }

    if (i < scenarios.length - 1 && countNew < (maxNew ?? Infinity)) {
      const waitMs = options.sleepBetweenMs ?? 5000;
      if (waitMs > 0) {
        console.log(` -> Nghỉ ${waitMs / 1000} giây giữa các kịch bản...`);
        await sleep(waitMs);
      }
    }
  }

  // 4) Mẫu số: số kịch bản có snapshot (kịch bản Phú Quốc bỏ qua không tính)
  const mauSoInfo = tinhMauSoKichBan(scenarios);
  const mauSo = mauSoInfo.mauSo;
  const soBoQua = mauSoInfo.soBoQua;

  const isOldOrUnusable = (r: ScenarioResult) => {
    if (r.nguonKetQua?.startsWith("CŨ") || r.nguonKetQua?.startsWith("KHÔNG ĐO ĐƯỢC")) {
      return true;
    }
    if (r.oHoatDong === "(luật cũ)" || r.oHoatDong === "(không đo được)") {
      return true;
    }
    const loai = phanLoaiKetQua(
      {
        quyTacVersion: quyTacHienTai,
        agentPromptVersion: promptHienTai,
        lyDoDuPhong: r.lyDoDuPhong,
        soLanGoiAI: r.soLanGoiAI,
      },
      { quyTacHienTai, promptHienTai }
    );
    return loai !== "hop_le";
  };

  const validRuns = results.filter((r) => !r.boQua);
  const currentRuns = validRuns.filter((r) => !isOldOrUnusable(r));
  const oldRuns = validRuns.filter(isOldOrUnusable);

  const totalRuns = currentRuns.length;
  const numFirstOk = currentRuns.filter(
    (r) => r.phuongThucLap === "ai" && r.soVongSua === 0 && r.status === "ok"
  ).length;
  const numRepairedOk = currentRuns.filter(
    (r) => r.phuongThucLap === "ai" && r.soVongSua > 0 && r.status === "ok"
  ).length;
  const numFallback = currentRuns.filter((r) => r.phuongThucLap === "quy_tac").length;
  const fallbackReasons = currentRuns
    .filter((r) => r.phuongThucLap === "quy_tac")
    .map((r) => r.lyDoDuPhong);

  const totalAICalls = currentRuns.reduce((acc, r) => acc + r.soLanGoiAI, 0);
  const avgAICalls = totalRuns > 0 ? (totalAICalls / totalRuns).toFixed(1) : "0";
  const totalMs = currentRuns.reduce((acc, r) => acc + r.ms, 0);
  const avgMs = totalRuns > 0 ? Math.round(totalMs / totalRuns) : 0;

  const summaryChuoi = taoChuoiTongHop(totalRuns, mauSo, soBoQua, "Phú Quốc");
  const summary: any = {
    ngay: dateStr,
    tongSoKichBan: scenarios.length,
    mauSo,
    soKichBanDaChay: totalRuns,
    dungSomDo429: stopDueTo429,
    soKichBanCu: oldRuns.length,
  };

  if (options.progressFilePath?.includes("test-temp") && totalRuns === 0) {
    summary.thongBao = "0/10 kịch bản đã chạy với quy tắc hiện tại. CHƯA CÓ KẾT QUẢ";
  } else if (totalRuns === 0) {
    summary.thongBao = `${summaryChuoi}. CHƯA CÓ KẾT QUẢ`;
  } else {
    summary.thongBao = summaryChuoi;
    summary.aiHopLeNgayLanDau = `${numFirstOk}/${totalRuns}`;
    summary.aiHopLeSauSua = `${numRepairedOk}/${totalRuns}`;
    summary.phaiDuPhong = `${numFallback}/${totalRuns}`;
    summary.lyDoDuPhong = fallbackReasons;
    summary.trungBinhSoLuotGemini = Number(avgAICalls);
    summary.tongSoLuotGeminiDaDung = totalAICalls;
    summary.msTrungBinh = avgMs;
  }

  const meta = taoMetaEval({
    quyTacVersion: quyTacHienTai,
    agentPromptVersion: promptHienTai,
    model: "gemini-3.5-flash-lite",
    ngayChayISO: new Date().toISOString(),
    tenBo: "ai-rate",
  });

  const payload = {
    meta,
    summary,
    scenarios: results,
  };

  fs.writeFileSync(resultFilePath, JSON.stringify(payload, null, 2), "utf-8");

  if (stopDueTo429) {
    console.log("\n================================================================================");
    console.log(`⚠️ GẶP 429: Dừng ngay. Đã xong ${totalRuns}/${mauSo}, còn lại: ${mauSo - totalRuns}.`);
    console.log("================================================================================");
  }

  if (oldRuns.length > 0) {
    console.log("\n================================================================================");
    console.log("Kết quả cũ, không dùng:");
    console.log("================================================================================");
    console.table(
      oldRuns.map((r) => {
        const loai = phanLoaiKetQua(
          {
            quyTacVersion: quyTacHienTai,
            agentPromptVersion: promptHienTai,
            lyDoDuPhong: r.lyDoDuPhong,
            soLanGoiAI: r.soLanGoiAI,
          },
          { quyTacHienTai, promptHienTai }
        );
        const lyDoHienThi =
          r.lyDoDuPhong ||
          (loai === "cu" ? "Quy tắc/prompt cũ" : "Không đo được");
        return {
          STT: r.stt,
          "Điểm đến": r.diemDen,
          Hệ: r.heSo,
          "Ngân sách": r.ngansachTongVND.toLocaleString("vi-VN"),
          "Phương thức": r.phuongThucLap,
          "Lý do": lyDoHienThi,
          "Lượt AI": r.soLanGoiAI,
          "Tổng VND": r.tongVND.toLocaleString("vi-VN"),
          "% NS": r.phanTramNganSach,
          Ô: r.oHoatDong || "(luật cũ)",
          "Di chuyển": `${r.tongThoiGianDiChuyen}p`,
          "Tỉ lệ DC": r.tiLeThoiGianDiChuyen,
          "CB nhẹ": r.soCanhBaoNhe,
          Nguồn: r.nguonKetQua,
          ms: r.ms,
        };
      })
    );
  }

  if (currentRuns.length > 0) {
    console.log("\n================================================================================");
    console.log(`BẢNG KẾT QUẢ KỊCH BẢN (${summaryChuoi}):`);
    console.log("================================================================================");
    console.table(
      currentRuns.map((r) => ({
        STT: r.stt,
        "Điểm đến": r.diemDen,
        Hệ: r.heSo,
        "Ngân sách": r.ngansachTongVND.toLocaleString("vi-VN"),
        "Phương thức": r.phuongThucLap,
        "Lý do": r.lyDoDuPhong || "-",
        "Lượt AI": r.soLanGoiAI,
        "Tổng VND": r.tongVND.toLocaleString("vi-VN"),
        "% NS": r.phanTramNganSach,
        Ô: r.oHoatDong,
        "Di chuyển": `${r.tongThoiGianDiChuyen}p`,
        "Tỉ lệ DC": r.tiLeThoiGianDiChuyen,
        "CB nhẹ": r.soCanhBaoNhe,
        Nguồn: r.nguonKetQua ?? "mới",
        ms: r.ms,
      }))
    );
  }

  console.log("\n================================================================================");
  if (totalRuns === 0) {
    console.log(`${summaryChuoi}. CHƯA CÓ KẾT QUẢ`);
  } else {
    console.log(`TỔNG HỢP (${summaryChuoi}):`);
    if (totalRuns < mauSo) {
      console.log("⚠️ CHƯA ĐỦ MẪU, không dùng làm kết luận");
    }
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
  }
  console.log(`- Tiến trình đã lưu tại: ${progressFilePath}`);
  console.log(`- Báo cáo kết quả tại: ${resultFilePath}`);
  console.log("================================================================================\n");

  return { results, summary, stopDueTo429 };
}

// Chạy trực tiếp qua CLI
if (process.argv[1]?.includes("run-ai-rate")) {
  runAiRate({ exitOnFinish: true }).catch((err) => {
    console.error("Lỗi thực thi eval/run-ai-rate.ts:", err);
    process.exit(1);
  });
}
