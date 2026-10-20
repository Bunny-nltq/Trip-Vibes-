#!/usr/bin/env tsx
/**
 * scripts/audit-snapshots.ts
 * npm run audit:snapshots
 *
 * Kiểm tra tính toàn vẹn (checksum) và nguồn gốc dữ liệu của toàn bộ snapshot.
 * - Thất bại nếu thiếu đầu file hoặc checksum sai, hoặc có mục không khớp mẫu nguồn.
 * - Snapshot cũ thiếu đầu file được liệt kê là "CHƯA XÁC THỰC", không xóa, nhưng báo.
 */

import { auditAllSnapshots } from "../src/data/snapshots/snapshotAudit";

async function main() {
  console.log("================================================================================");
  console.log("              KIỂM TOÁN DỮ LIỆU SNAPSHOT (AUDIT:SNAPSHOTS)                     ");
  console.log("================================================================================\n");

  const { results, allPassed } = auditAllSnapshots();

  if (results.length === 0) {
    console.log("ℹ️ Không tìm thấy file snapshot nào trong src/data/snapshots.");
    return;
  }

  // In bảng thống kê mỗi snapshot
  console.table(
    results.map((r) => ({
      "Tập tin": r.file,
      "Trạng thái": r.status,
      "Điểm đến": r.diemDen,
      "Ngày tạo": r.ngayTao ? r.ngayTao.slice(0, 10) : "N/A",
      "KS": r.counts.khachSan,
      "Quán ăn": r.counts.quanAn,
      "Cafe": r.counts.cafe,
      "H.Động": r.counts.hoatDong,
      "P.Tiện": r.counts.transport,
      "Lỗi": r.errors.length > 0 ? r.errors.join("; ") : "Không có",
    }))
  );

  const chuaXacThuc = results.filter((r) => r.status === "CHƯA XÁC THỰC");
  if (chuaXacThuc.length > 0) {
    console.warn("\n⚠️ CẢNH BÁO: Phát hiện snapshot cũ thiếu đầu file hợp lệ:");
    for (const item of chuaXacThuc) {
      console.warn(`   - ${item.file}: CHƯA XÁC THỰC (Snapshot cũ trước bước 9c, không có chữ ký checksum từ script data:snapshot).`);
    }
  }

  const thatBai = results.filter((r) => r.status === "THẤT BẠI");
  if (thatBai.length > 0) {
    console.error("\n❌ KIỂM TOÁN THẤT BẠI: Một số snapshot không đạt tiêu chuẩn toàn vẹn/nguồn gốc:");
    for (const item of thatBai) {
      console.error(`   - ${item.file}:`);
      item.errors.forEach((e) => console.error(`     * ${e}`));
    }
    process.exit(1);
  }

  console.log("\n✅ KIỂM TOÁN HOÀN TẤT: Toàn bộ snapshot hợp lệ hoặc đã được cảnh báo đầy đủ.");
}

main().catch((err) => {
  console.error("Lỗi khi chạy audit:snapshots:", err);
  process.exit(1);
});
