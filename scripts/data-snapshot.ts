#!/usr/bin/env tsx
/**
 * scripts/data-snapshot.ts
 * npm run data:snapshot -- --name=<tên>
 *
 * Đóng băng dữ liệu live vào src/data/snapshots/<tên>.json
 */

import { loadEnvConfig } from "@next/env";
import { LiveDataSource } from "../src/data/live/LiveDataSource";

loadEnvConfig(process.cwd());

async function main() {
  const args = process.argv.slice(2);
  const nameArg = args.find((a) => a.startsWith("--name="));
  const name = nameArg?.split("=")[1] ?? `snapshot_${new Date().toISOString().slice(0, 10)}`;

  console.log(`\n📸 Đang tạo snapshot: ${name}`);

  const ds = new LiveDataSource("live");
  const filePath = await ds.saveSnapshot(name);

  console.log(`✅ Đã lưu snapshot tại: ${filePath}`);
  console.log(`   Dùng DATA_MODE=snapshot DATA_SNAPSHOT_NAME=${name} để tải snapshot này.`);
}

main().catch((err) => {
  console.error("❌ Lỗi:", err instanceof Error ? err.message : err);
  process.exit(1);
});
