#!/usr/bin/env tsx
/**
 * scripts/data-snapshot.ts
 * npm run data:snapshot -- --name=<tên> --diemDen=<tên điểm đến>
 *
 * Đóng băng dữ liệu live vào src/data/snapshots/<tên>.json
 */

import { loadEnvConfig } from "@next/env";
import { LiveDataSource } from "../src/data/live/LiveDataSource";
import { geocodeDestination } from "../src/data/live/geocodeClient";
import type { DiemDen } from "../src/contracts";

loadEnvConfig(process.cwd());

async function main() {
  const args = process.argv.slice(2);
  const nameArg = args.find((a) => a.startsWith("--name="));
  const diemDenArg = args.find((a) => a.startsWith("--diemDen="));

  const tenDiemDen = diemDenArg?.split("=")[1]?.trim();
  const name =
    nameArg?.split("=")[1] ??
    `snapshot_${tenDiemDen ? tenDiemDen.toLowerCase().replace(/\s+/g, "_") + "_" : ""}${new Date()
      .toISOString()
      .slice(0, 10)}`;

  let diemDen: DiemDen | undefined;
  if (tenDiemDen) {
    console.log(`🔍 Đang tìm tọa độ cho điểm đến: ${tenDiemDen}...`);
    const geo = await geocodeDestination(tenDiemDen);
    if (geo.status === "thanh_cong") {
      diemDen = geo.diemDen;
      console.log(`📍 Tìm thấy: ${diemDen.ten} (${diemDen.quocGia}), tọa độ: ${diemDen.toaDo.lat}, ${diemDen.toaDo.lng}`);
    } else {
      console.warn(`⚠️ Không thể geocode chính xác: ${tenDiemDen}. Sử dụng điểm đến mặc định.`);
    }
  }

  console.log(`\n📸 Đang tạo snapshot: ${name}`);

  const ds = new LiveDataSource("live", undefined, diemDen);
  const filePath = await ds.saveSnapshot(name);

  console.log(`✅ Đã lưu snapshot tại: ${filePath}`);
  console.log(`   Dùng DATA_MODE=snapshot DATA_SNAPSHOT_NAME=${name} để tải snapshot này.`);
}

main().catch((err) => {
  console.error("❌ Lỗi:", err instanceof Error ? err.message : err);
  process.exit(1);
});
