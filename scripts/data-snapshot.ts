#!/usr/bin/env tsx
/**
 * scripts/data-snapshot.ts
 *
 * Quy trình đóng băng dữ liệu live vào src/data/snapshots/<tên>.json
 *
 * Lệnh sử dụng:
 *   - Tạo 1 điểm đến: npm run data:snapshot -- --diemDen="Hà Nội"
 *   - Tạo tất cả:      npm run data:snapshot:all
 *   - Chạy một phần:   npm run data:snapshot:all -- --diemDen="Hà Nội,Đà Lạt"
 *   - Bỏ qua đã có:    npm run data:snapshot:all -- --boQuaDaCo
 *
 * Tuân thủ AGENTS.md & Bước 20:
 *   - Không gọi Gemini.
 *   - Tuần tự, nghỉ 5 giây giữa các điểm đến.
 *   - Xóa cache dữ liệu của điểm đến trước khi lấy mới từ mạng.
 *   - Ngưỡng tối thiểu: KS >= 3, Quán ăn >= 3, Hoạt động >= 3, Cafe >= 1.
 *   - Snapshot KHÔNG chứa phương tiện est_* hay nguon uoc_luong:*.
 */

import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { LiveDataSource } from "../src/data/live/LiveDataSource";
import { geocodeDestination } from "../src/data/live/geocodeClient";
import {
  getLastOverpassStatsSummary,
  lastOverpassStats,
} from "../src/data/live/overpassClient";
import { auditSnapshotData } from "../src/data/snapshots/snapshotAudit";
import type { DiemDen } from "../src/contracts";

loadEnvConfig(process.cwd());

export const DEFAULT_6_DESTINATIONS = [
  "Đà Nẵng",
  "Hà Nội",
  "Đà Lạt",
  "Phú Quốc",
  "Bangkok",
  "Seoul",
];

export function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Xóa cache dữ liệu của điểm đến trong .cache/data trước khi lấy mới từ mạng
 */
export function clearCacheForDestination(diemDen: DiemDen): number {
  const cacheDir = path.join(process.cwd(), ".cache", "data");
  if (!fs.existsSync(cacheDir)) return 0;

  let clearedCount = 0;
  const files = fs.readdirSync(cacheDir);

  for (const f of files) {
    const fullPath = path.join(cacheDir, f);
    if (f.startsWith("osm_") && f.endsWith(".json")) {
      try {
        const raw = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        const items = Array.isArray(raw) ? raw : raw.data;
        if (Array.isArray(items) && items.length > 0) {
          const first = items[0];
          const lat = first.toaDo?.lat ?? first.lat;
          const lng = first.toaDo?.lng ?? first.lon;
          if (typeof lat === "number" && typeof lng === "number") {
            const dLat = Math.abs(lat - diemDen.toaDo.lat);
            const dLng = Math.abs(lng - diemDen.toaDo.lng);
            // Bán kính khoảng ~0.5 độ quanh điểm đến
            if (dLat < 0.5 && dLng < 0.5) {
              fs.unlinkSync(fullPath);
              clearedCount++;
            }
          }
        }
      } catch {
        // ignore
      }
    } else if (f.startsWith("transport_") && f.endsWith(".json")) {
      try {
        const raw = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        const str = JSON.stringify(raw);
        if (str.includes(diemDen.ten)) {
          fs.unlinkSync(fullPath);
          clearedCount++;
        }
      } catch {
        // ignore
      }
    }
  }

  return clearedCount;
}

/**
 * Kiểm tra xem điểm đến đã có snapshot HỢP LỆ trong src/data/snapshots hay chưa
 */
export function findValidExistingSnapshot(tenDiemDen: string): string | null {
  const snapshotsDir = path.join(process.cwd(), "src", "data", "snapshots");
  if (!fs.existsSync(snapshotsDir)) return null;

  const files = fs.readdirSync(snapshotsDir).filter((f) => f.endsWith(".json"));
  const slug = slugify(tenDiemDen);

  for (const f of files) {
    if (f.includes(slug)) {
      try {
        const raw = JSON.parse(
          fs.readFileSync(path.join(snapshotsDir, f), "utf-8")
        );
        const audit = auditSnapshotData(raw, f);
        if (audit.status === "HỢP LỆ") {
          return f;
        }
      } catch {
        // ignore
      }
    }
  }

  return null;
}

export interface DestinationProcessResult {
  diemDen: string;
  ketQua: "Thành công" | "Không đủ ngưỡng" | "Lỗi geocode" | "Bỏ qua đã có" | "Lỗi";
  soMuc: string;
  mayChuOverpass: string;
  thoiGian: string;
  chiTietLoi?: string;
}

/**
 * Xử lý tạo snapshot cho một điểm đến duy nhất qua LiveDataSource chính thức
 */
export async function processOneDestination(
  tenDiemDen: string,
  options: {
    customName?: string;
    boQuaDaCo?: boolean;
  } = {}
): Promise<DestinationProcessResult> {
  const startMs = Date.now();
  const slug = slugify(tenDiemDen);
  const name =
    options.customName ??
    `snapshot_${slug}_${new Date().toISOString().slice(0, 10)}`;

  console.log(`\n================================================================`);
  console.log(`📍 Đang xử lý snapshot cho: ${tenDiemDen} -> ${name}`);
  console.log(`================================================================`);

  // 1. Kiểm tra cờ --boQuaDaCo
  if (options.boQuaDaCo) {
    const existingValid = findValidExistingSnapshot(tenDiemDen);
    if (existingValid) {
      console.log(`⏩ [BỎ QUA]: Điểm đến ${tenDiemDen} đã có snapshot HỢP LỆ (${existingValid}).`);
      return {
        diemDen: tenDiemDen,
        ketQua: "Bỏ qua đã có",
        soMuc: "Đã có snapshot hợp lệ",
        mayChuOverpass: "-",
        thoiGian: `${Date.now() - startMs}ms`,
      };
    }
  }

  // 2. Geocode tọa độ
  console.log(`🔍 Đang tìm tọa độ cho điểm đến: ${tenDiemDen}...`);
  const geo = await geocodeDestination(tenDiemDen);
  let diemDen: DiemDen | undefined;
  if (geo.status === "thanh_cong") {
    diemDen = geo.diemDen;
    console.log(
      `📍 Tìm thấy: ${diemDen.ten} (${diemDen.quocGia}), tọa độ: ${diemDen.toaDo.lat}, ${diemDen.toaDo.lng}`
    );
  } else {
    console.warn(`⚠️ Không thể geocode chính xác: ${tenDiemDen}. Bỏ qua snapshot này.`);
    return {
      diemDen: tenDiemDen,
      ketQua: "Lỗi geocode",
      soMuc: "0",
      mayChuOverpass: "-",
      thoiGian: `${Date.now() - startMs}ms`,
      chiTietLoi: "Geocode không thành công",
    };
  }

  // 3. Xóa cache của điểm đến trước khi lấy mới từ mạng
  const cleared = clearCacheForDestination(diemDen);
  console.log(`🧹 Đã dọn ${cleared} mục cache cũ của ${tenDiemDen} để lấy mới từ mạng.`);

  // 4. Lấy dữ liệu qua LiveDataSource chính thức
  console.log(`🌐 Đang gọi mạng lấy dữ liệu live cho snapshot: ${name}`);
  // Xóa stats cũ để ghi nhận chính xác máy chủ đã thử cho lượt gọi này
  lastOverpassStats.length = 0;

  const ds = new LiveDataSource("live", undefined, diemDen);
  let khachSans: any[] = [];
  let quanAns: any[] = [];
  let cafes: any[] = [];
  let hoatDongs: any[] = [];
  let transports: any[] = [];

  try {
    [khachSans, quanAns, cafes, hoatDongs, transports] = await Promise.all([
      ds.getKhachSans(),
      ds.getQuanAns(),
      ds.getCafes(),
      ds.getHoatDongs(),
      ds.getTransports(),
    ]);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Lỗi khi tải dữ liệu cho ${tenDiemDen}: ${errMsg}`);
    return {
      diemDen: tenDiemDen,
      ketQua: "Lỗi",
      soMuc: "0",
      mayChuOverpass: getLastOverpassStatsSummary(),
      thoiGian: `${Date.now() - startMs}ms`,
      chiTietLoi: errMsg,
    };
  }

  const overpassSummary = getLastOverpassStatsSummary();

  // 5. Kiểm tra ngưỡng tối thiểu: KS >= 3, Quán ăn >= 3, Hoạt động >= 3, Cafe >= 1
  const thieuList: string[] = [];
  if (khachSans.length < 3) thieuList.push(`Khách sạn (${khachSans.length}/3)`);
  if (quanAns.length < 3) thieuList.push(`Quán ăn (${quanAns.length}/3)`);
  if (hoatDongs.length < 3) thieuList.push(`Hoạt động (${hoatDongs.length}/3)`);
  if (cafes.length < 1) thieuList.push(`Cafe (${cafes.length}/1)`);

  const soMucStr = `KS: ${khachSans.length}, QA: ${quanAns.length}, Cafe: ${cafes.length}, HĐ: ${hoatDongs.length}, PT: ${transports.length}`;

  if (thieuList.length > 0) {
    console.warn(
      `⚠️ Điểm đến ${tenDiemDen} KHÔNG ĐỦ NGƯỠNG: thiếu ${thieuList.join(", ")}.`
    );
    console.warn(`   Máy chủ Overpass đã thử: ${overpassSummary}`);
    console.warn(`   QUY TẮC BƯỚC 20: KHÔNG ghi snapshot khi chưa đủ ngưỡng!`);

    return {
      diemDen: tenDiemDen,
      ketQua: "Không đủ ngưỡng",
      soMuc: soMucStr,
      mayChuOverpass: overpassSummary,
      thoiGian: `${Date.now() - startMs}ms`,
      chiTietLoi: `Thiếu ${thieuList.join(", ")}`,
    };
  }

  // 6. Ghi snapshot qua hàm LiveDataSource.saveSnapshot chính thức
  // (Đã đảm bảo loại bỏ mọi phương tiện ước lượng est_* hoặc uoc_luong:*)
  const filePath = await ds.saveSnapshot(name);

  // Kiểm toán ngay file vừa ghi
  const savedData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const audit = auditSnapshotData(savedData, path.basename(filePath));

  console.log(`✅ Đã lưu snapshot tại: ${filePath}`);
  console.log(`   Trạng thái kiểm toán: ${audit.status}`);
  console.log(`   Số lượng: ${soMucStr}`);

  return {
    diemDen: tenDiemDen,
    ketQua: "Thành công",
    soMuc: soMucStr,
    mayChuOverpass: overpassSummary,
    thoiGian: `${Date.now() - startMs}ms`,
  };
}

async function main() {
  const rawArgs = process.argv.slice(2).filter((a) => a !== "--");
  let diemDenParam: string | undefined;
  let customName: string | undefined;
  let boQuaDaCo = false;

  for (let i = 0; i < rawArgs.length; i++) {
    const a = rawArgs[i];
    if (a.startsWith("--diemDen=")) {
      diemDenParam = a.slice("--diemDen=".length);
    } else if (a === "--diemDen" && i + 1 < rawArgs.length) {
      diemDenParam = rawArgs[i + 1];
    } else if (a.startsWith("--name=")) {
      customName = a.slice("--name=".length);
    } else if (a === "--boQuaDaCo" || a.startsWith("--boQuaDaCo")) {
      boQuaDaCo = true;
    }
  }

  if (diemDenParam) {
    diemDenParam = diemDenParam.replace(/^["']|["']$/g, "").trim();
  }
  if (customName) {
    customName = customName.replace(/^["']|["']$/g, "").trim();
  }

  let destinationsToProcess: string[] = [];

  if (diemDenParam) {
    // Cho phép danh sách phân tách bằng dấu phẩy: --diemDen="Hà Nội,Đà Lạt"
    destinationsToProcess = diemDenParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  } else {
    // Mặc định chạy toàn bộ 6 điểm đến
    destinationsToProcess = DEFAULT_6_DESTINATIONS;
  }

  console.log("================================================================================");
  console.log(`📸 QUY TRÌNH DATA:SNAPSHOT:ALL (Bước 20)`);
  console.log(`   Số điểm đến dự kiến: ${destinationsToProcess.length} (${destinationsToProcess.join(", ")})`);
  console.log(`   Bỏ qua đã có: ${boQuaDaCo ? "BẬT (--boQuaDaCo)" : "TẮT"}`);
  console.log("================================================================================");

  const reportResults: DestinationProcessResult[] = [];

  for (let i = 0; i < destinationsToProcess.length; i++) {
    const dest = destinationsToProcess[i];
    const res = await processOneDestination(dest, {
      customName: destinationsToProcess.length === 1 ? customName : undefined,
      boQuaDaCo,
    });
    reportResults.push(res);

    if (i < destinationsToProcess.length - 1) {
      console.log(`\n⏳ Nghỉ 5 giây trước điểm đến kế tiếp theo quy định...`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.log("\n================================================================================");
  console.log("📊 BẢNG TỔNG HỢP DATA:SNAPSHOT:ALL:");
  console.log("================================================================================");
  console.table(
    reportResults.map((r) => ({
      "Điểm đến": r.diemDen,
      "Kết quả": r.ketQua,
      "Số mục": r.soMuc,
      "Máy chủ Overpass": r.mayChuOverpass || "N/A",
      "Thời gian": r.thoiGian,
    }))
  );
  console.log("================================================================================\n");

  const anyFailed = reportResults.some(
    (r) => r.ketQua === "Không đủ ngưỡng" || r.ketQua === "Lỗi" || r.ketQua === "Lỗi geocode"
  );
  if (anyFailed) {
    console.warn("⚠️ Có một số điểm đến chưa đạt ngưỡng snapshot hoặc gặp lỗi.");
  } else {
    console.log("🎉 Toàn bộ snapshot đã được tạo hoặc bỏ qua hợp lệ!");
  }
}

if (process.argv[1] && process.argv[1].includes("data-snapshot")) {
  main().catch((err) => {
    console.error("❌ Lỗi nghiêm trọng:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
