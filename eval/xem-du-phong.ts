import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

process.env.DATA_MODE = "snapshot";
loadEnvConfig(process.cwd());

import { lapKeHoachTuDong } from "../src/core/lapKeHoachTuDong";
import { tinhNganSachToiThieu } from "../src/core/minBudget";
import { validatePlan } from "../src/core/validatePlan";
import { tiLeThoiGianDiChuyen } from "../src/core/tiLeDiChuyen";
import { LiveDataSource } from "../src/data/live/LiveDataSource";
import { DANH_SACH_DIEM_DEN, DIEM_DI_TPHCM } from "./run-ai-rate";
import type { TripRequest } from "../src/contracts";

async function main() {
  console.log("================================================================================");
  console.log("EVAL: XEM-DU-PHONG (10 kịch bản quy tắc dự phòng với Snapshot)");
  console.log("================================================================================\n");

  const snapshotsDir = path.resolve(process.cwd(), "src/data/snapshots");
  const availableSnapshots = fs.existsSync(snapshotsDir)
    ? fs.readdirSync(snapshotsDir).filter((f) => f.endsWith(".json"))
    : [];

  const scenarios: Array<{
    stt: number;
    destConfig: (typeof DANH_SACH_DIEM_DEN)[number];
    heSo: "1.3x" | "2.0x";
    mul: number;
  }> = [];

  let count = 1;
  for (const dest of DANH_SACH_DIEM_DEN) {
    scenarios.push({ stt: count++, destConfig: dest, heSo: "1.3x", mul: 1.3 });
    scenarios.push({ stt: count++, destConfig: dest, heSo: "2.0x", mul: 2.0 });
  }

  const tableRows: Array<{
    stt: number;
    diemDen: string;
    heSo: string;
    toiThieu: string;
    ngansach: string;
    kiemNganSach: string;
    phuongTien: string;
    thoiLuong: string;
    tiLeDiChuyen: string;
    tongTien: string;
    softCodes: string;
    vuot35: boolean;
  }> = [];

  for (const sc of scenarios) {
    const { destConfig, heSo, mul } = sc;
    const hasSnap = availableSnapshots.some((f) =>
      f.toLowerCase().includes(destConfig.id)
    );

    if (!hasSnap) {
      tableRows.push({
        stt: sc.stt,
        diemDen: destConfig.ten,
        heSo,
        toiThieu: "—",
        ngansach: "—",
        kiemNganSach: "—",
        phuongTien: "Bỏ qua (không có snapshot)",
        thoiLuong: "—",
        tiLeDiChuyen: "—",
        tongTien: "—",
        softCodes: "—",
        vuot35: false,
      });
      continue;
    }

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

    const result = lapKeHoachTuDong(request, planData, 3);

    if (result.status === "ok") {
      const p = result.plan;
      const vRes = validatePlan(request, p, planData as any);
      const soft = vRes.soft.map((s) => s.code);

      // Tính tổng thời lượng di chuyển 2 chiều
      const tDi = transports.find((t) => t.id === result.selection.transportDiId);
      const tVe = transports.find((t) => t.id === result.selection.transportVeId);
      const totalTravelMinutes = (tDi?.durationMinutes ?? 0) + (tVe?.durationMinutes ?? 0);
      const travelRatio = tiLeThoiGianDiChuyen(totalTravelMinutes, 3);
      const vuot35 = travelRatio > 35;

      const kiemNganSach = ngansach === Math.ceil((toiThieu * mul) / 100_000) * 100_000 ? "khớp" : "LỆCH";

      tableRows.push({
        stt: sc.stt,
        diemDen: destConfig.ten,
        heSo,
        toiThieu: toiThieu.toLocaleString("vi-VN") + " đ",
        ngansach: ngansach.toLocaleString("vi-VN") + " đ",
        kiemNganSach,
        phuongTien: `${result.selection.transportDiId} / ${result.selection.transportVeId}`,
        thoiLuong: `${totalTravelMinutes}p`,
        tiLeDiChuyen: `${travelRatio}%`,
        tongTien: result.tongVND.toLocaleString("vi-VN") + " đ",
        softCodes: soft.length > 0 ? soft.join(", ") : "[]",
        vuot35,
      });
    } else {
      tableRows.push({
        stt: sc.stt,
        diemDen: destConfig.ten,
        heSo,
        toiThieu: "—",
        ngansach: "—",
        kiemNganSach: "—",
        phuongTien: `Không khả thi: ${result.lyDo ?? "ngan_sach"}`,
        thoiLuong: "—",
        tiLeDiChuyen: "—",
        tongTien: "—",
        softCodes: "—",
        vuot35: false,
      });
    }
  }

  console.log("| STT | Điểm đến | Hệ số | Tối thiểu (toiThieuVND) | Ngân sách | Kiểm NS | Phương tiện đi / về | Thời lượng | Tỉ lệ di chuyển | Tổng tiền | Mã soft |");
  console.log("|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of tableRows) {
    console.log(`| ${r.stt} | ${r.diemDen} | ${r.heSo} | ${r.toiThieu} | ${r.ngansach} | ${r.kiemNganSach} | ${r.phuongTien} | ${r.thoiLuong} | ${r.tiLeDiChuyen} | ${r.tongTien} | ${r.softCodes} |`);
  }

  console.log("\n--- PHÂN TÍCH TỈ LỆ DI CHUYỂN > 35% ---");
  const highRatio = tableRows.filter((r) => r.vuot35);
  if (highRatio.length === 0) {
    console.log("Không có kịch bản nào có tỉ lệ di chuyển > 35%.");
  } else {
    for (const r of highRatio) {
      console.log(`- ${r.diemDen} (${r.heSo}): Tỉ lệ ${r.tiLeDiChuyen} (thời lượng ${r.thoiLuong}). Phương tiện: ${r.phuongTien}.`);
    }
  }
}

main().catch(console.error);
