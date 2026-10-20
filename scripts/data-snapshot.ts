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

function slugify(str: string): string {
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

const DEFAULT_6_DESTINATIONS = [
  "Đà Nẵng",
  "Hà Nội",
  "Đà Lạt",
  "Phú Quốc",
  "Bangkok",
  "Seoul",
];

async function processOneDestination(tenDiemDen: string, customName?: string): Promise<void> {
  const name =
    customName ??
    `snapshot_${slugify(tenDiemDen)}_${new Date().toISOString().slice(0, 10)}`;

  console.log(`\n================================================================`);
  console.log(`📍 Đang xử lý snapshot cho: ${tenDiemDen} -> ${name}`);
  console.log(`================================================================`);

  console.log(`🔍 Đang tìm tọa độ cho điểm đến: ${tenDiemDen}...`);
  const geo = await geocodeDestination(tenDiemDen);
  let diemDen: DiemDen | undefined;
  if (geo.status === "thanh_cong") {
    diemDen = geo.diemDen;
    console.log(`📍 Tìm thấy: ${diemDen.ten} (${diemDen.quocGia}), tọa độ: ${diemDen.toaDo.lat}, ${diemDen.toaDo.lng}`);
  } else {
    console.warn(`⚠️ Không thể geocode chính xác: ${tenDiemDen}. Bỏ qua snapshot này.`);
    return;
  }

  console.log(`📸 Đang kiểm tra dữ liệu mạng cho snapshot: ${name}`);

  const ds = new LiveDataSource("live", undefined, diemDen);
  const [khachSans, quanAns, cafes, hoatDongs, transports] =
    await Promise.all([
      ds.getKhachSans(),
      ds.getQuanAns(),
      ds.getCafes(),
      ds.getHoatDongs(),
      ds.getTransports(),
    ]);

  const missingTypes: string[] = [];
  if (khachSans.length === 0) missingTypes.push("Khách sạn");
  if (quanAns.length === 0) missingTypes.push("Quán ăn");
  if (cafes.length === 0) missingTypes.push("Cafe");
  if (hoatDongs.length === 0) missingTypes.push("Hoạt động");

  if (missingTypes.length > 0) {
    console.warn(
      `⚠️ Điểm đến ${tenDiemDen} THIẾU LOẠI DỮ LIỆU: ${missingTypes.join(
        ", "
      )}. QUY TẮC: KHÔNG tạo snapshot cho điểm đến bị thiếu loại!`
    );
    return;
  }

  const filePath = await ds.saveSnapshot(name);

  console.log(`✅ Đã lưu snapshot tại: ${filePath}`);
  console.log(`   Số lượng: KS: ${khachSans.length}, Quán ăn: ${quanAns.length}, Cafe: ${cafes.length}, HĐ: ${hoatDongs.length}, Phương tiện: ${transports.length}`);
}

async function main() {
  const args = process.argv.slice(2);
  const nameArg = args.find((a) => a.startsWith("--name="));
  const diemDenArg = args.find((a) => a.startsWith("--diemDen="));

  const customName = nameArg?.split("=")[1];
  const singleDiemDen = diemDenArg?.split("=").slice(1).join("=").replace(/^["']|["']$/g, "").trim();

  if (singleDiemDen) {
    await processOneDestination(singleDiemDen, customName);
  } else {
    console.log("📸 Chạy tạo snapshot tuần tự cho 6 điểm đến mẫu (nghỉ 5 giây giữa các điểm đến)...");
    for (let i = 0; i < DEFAULT_6_DESTINATIONS.length; i++) {
      const dest = DEFAULT_6_DESTINATIONS[i];
      await processOneDestination(dest);
      if (i < DEFAULT_6_DESTINATIONS.length - 1) {
        console.log(`\n⏳ Nghỉ 5 giây trước điểm đến kế tiếp...`);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

main().catch((err) => {
  console.error("❌ Lỗi:", err instanceof Error ? err.message : err);
  process.exit(1);
});
