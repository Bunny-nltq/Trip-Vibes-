#!/usr/bin/env tsx
/**
 * scripts/data-refresh.ts
 * npm run data:refresh
 *
 * Làm mới toàn bộ dữ liệu live: xoá cache cũ, gọi lại OSM + Tavily + Gemini.
 */

import { loadEnvConfig } from "@next/env";
import path from "node:path";
import fs from "node:fs";
import { LiveDataSource } from "../src/data/live/LiveDataSource";

loadEnvConfig(process.cwd());

async function main() {
  console.log("\n=========================================");
  console.log("   TRIP VIBES – LÀM MỚI DỮ LIỆU LIVE");
  console.log("=========================================\n");

  // Xoá cache cũ
  const cacheDir = path.join(process.cwd(), ".cache", "data");
  if (fs.existsSync(cacheDir)) {
    for (const f of fs.readdirSync(cacheDir)) {
      fs.unlinkSync(path.join(cacheDir, f));
    }
    console.log("🗑️  Đã xoá cache cũ\n");
  }

  const ds = new LiveDataSource("live");

  console.log("📡 Đang lấy dữ liệu từ OpenStreetMap...");
  const t1 = Date.now();

  console.log("  → Khách sạn...");
  const khachSans = await ds.getKhachSans();
  console.log(`    Lấy được ${khachSans.length} khách sạn`);

  console.log("  → Quán ăn...");
  const quanAns = await ds.getQuanAns();
  console.log(`    Lấy được ${quanAns.length} quán ăn`);

  console.log("  → Cafe...");
  const cafes = await ds.getCafes();
  console.log(`    Lấy được ${cafes.length} quán cafe`);

  console.log("  → Hoạt động...");
  const hoatDongs = await ds.getHoatDongs();
  console.log(`    Lấy được ${hoatDongs.length} hoạt động`);

  console.log("  → Phương tiện (Tavily + Gemini)...");
  const transports = await ds.getTransports();
  console.log(`    Lấy được ${transports.length} phương án di chuyển`);

  const elapsed = Date.now() - t1;

  console.log(`✅ Hoàn thành (${elapsed} ms)\n`);
  console.log(`📊 KẾT QUẢ:`);
  console.log(`   - Khách sạn:     ${khachSans.length} mục`);
  console.log(`   - Quán ăn:       ${quanAns.length} mục`);
  console.log(`   - Cafe:          ${cafes.length} mục`);
  console.log(`   - Hoạt động:     ${hoatDongs.length} mục`);
  console.log(`   - Phương tiện:   ${transports.length} mục`);

  // Thống kê nguồn
  const allItems = [...khachSans, ...quanAns, ...cafes, ...hoatDongs];
  const coNguon = allItems.filter((i) => i.nguon).length;
  const giaUocTinh = allItems.filter((i) => i.giaLaUocTinh).length;

  console.log(`\n📋 THỐNG KÊ NGUỒN:`);
  console.log(`   - Tỷ lệ có nguồn:      ${allItems.length > 0 ? Math.round(coNguon / allItems.length * 100) : 0}%`);
  console.log(`   - Tỷ lệ giá ước tính:  ${allItems.length > 0 ? Math.round(giaUocTinh / allItems.length * 100) : 0}%`);

  console.log(`\n✅ Dữ liệu đã được cache tại: .cache/data/`);
}

main().catch((err) => {
  console.error("❌ Lỗi:", err instanceof Error ? err.message : err);
  process.exit(1);
});
