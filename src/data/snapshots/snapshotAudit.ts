/**
 * src/data/snapshots/snapshotAudit.ts
 *
 * Cơ chế chống dữ liệu dựng sẵn:
 * - Kiểm tra tính toàn vẹn (checksum)
 * - Kiểm tra nguồn gốc dữ liệu (nguon OSM hoặc web thật, cấm "AI" hoặc rỗng)
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export interface SnapshotHeader {
  taoBoi: string;
  ngayTao: string;
  diemDen: string;
  checksum: string;
}

export function computeSnapshotChecksum(content: {
  khachSans?: any[];
  quanAns?: any[];
  cafes?: any[];
  hoatDongs?: any[];
  transports?: any[];
  diemDen?: any;
}): string {
  const payload = JSON.stringify({
    khachSans: content.khachSans ?? [],
    quanAns: content.quanAns ?? [],
    cafes: content.cafes ?? [],
    hoatDongs: content.hoatDongs ?? [],
    transports: content.transports ?? [],
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export function isValidNguon(
  nguon?: string | null,
  context?: { doTinCay?: string; nguonGia?: string[] } | null
): boolean {
  if (!nguon || typeof nguon !== "string") return false;
  const trimmed = nguon.trim();
  if (trimmed === "" || trimmed.toUpperCase() === "AI") return false;

  // 1. OSM node, way, relation
  if (/^osm:(node|way|relation):\d+$/i.test(trimmed)) return true;

  // 2. Ước lượng theo khoảng cách: uoc_luong:khoang_cach:<số>km
  if (/^uoc_luong:khoang_cach:\d+(\.\d+)?km$/i.test(trimmed)) return true;

  // 3. Đường dẫn web thật: URL web chỉ được chấp nhận khi mục có nguonGia thật và doTinCay không phải ước lượng
  if (/^https?:\/\/.+/i.test(trimmed)) {
    if (context) {
      if (context.doTinCay === "uoc_tinh") return false;
      if (!Array.isArray(context.nguonGia) || context.nguonGia.length === 0) return false;
    }
    return true;
  }

  return false;
}

export interface AuditItemResult {
  file: string;
  status: "HỢP LỆ" | "CHƯA XÁC THỰC" | "THẤT BẠI" | "CŨ";
  ngayTao?: string;
  diemDen?: string;
  counts: {
    khachSan: number;
    quanAn: number;
    cafe: number;
    hoatDong: number;
    transport: number;
  };
  errors: string[];
}

export function auditSnapshotData(
  data: any,
  fileName: string = "snapshot.json"
): AuditItemResult {
  const counts = {
    khachSan: Array.isArray(data.khachSans) ? data.khachSans.length : 0,
    quanAn: Array.isArray(data.quanAns) ? data.quanAns.length : 0,
    cafe: Array.isArray(data.cafes) ? data.cafes.length : 0,
    hoatDong: Array.isArray(data.hoatDongs) ? data.hoatDongs.length : 0,
    transport: Array.isArray(data.transports) ? data.transports.length : 0,
  };

  const errors: string[] = [];

  // 1. Kiểm tra header và checksum
  const hasValidHeader = data.taoBoi === "script data:snapshot";
  const isOldSnapshot = !data.taoBoi && fileName.includes("2026-10-19");

  if (!hasValidHeader) {
    if (isOldSnapshot) {
      // Snapshot cũ thiếu đầu file -> Liệt kê là "CHƯA XÁC THỰC"
    } else {
      errors.push("Thiếu đầu file hợp lệ (bắt buộc taoBoi: 'script data:snapshot')");
    }
  } else {
    // Có header thì bắt buộc checksum phải đúng
    const expectedChecksum = computeSnapshotChecksum(data);
    if (data.checksum !== expectedChecksum) {
      errors.push(
        `Checksum sai (dữ liệu có thể đã bị can thiệp thủ công: mong đợi ${expectedChecksum.slice(
          0,
          10
        )}..., thực tế ${String(data.checksum).slice(0, 10)}...)`
      );
    }
  }

  // 2. Kiểm tra mẫu nguồn của từng mục dữ liệu
  const checkList = [
    { name: "khách sạn", items: data.khachSans },
    { name: "quán ăn", items: data.quanAns },
    { name: "cafe", items: data.cafes },
    { name: "hoạt động", items: data.hoatDongs },
    { name: "phương tiện", items: data.transports },
  ];

  for (const group of checkList) {
    if (!Array.isArray(group.items)) continue;
    for (const item of group.items) {
      if (!isValidNguon(item.nguon, item)) {
        errors.push(
          `Mục ${group.name} id="${item.id || item.ten || "không_id"}" có nguồn không hợp lệ: "${item.nguon}"`
        );
      }
    }
  }

  const hasEstTransports =
    Array.isArray(data.transports) &&
    data.transports.some((t: any) => t.id?.startsWith("est_"));

  let status: "HỢP LỆ" | "CHƯA XÁC THỰC" | "THẤT BẠI" | "CŨ";
  if (errors.length > 0) {
    status = "THẤT BẠI";
  } else if (hasEstTransports) {
    status = "CŨ";
  } else if (!hasValidHeader) {
    status = "CHƯA XÁC THỰC";
  } else {
    status = "HỢP LỆ";
  }

  const diemDenStr =
    typeof data.diemDen === "string"
      ? data.diemDen
      : data.diemDen?.ten ?? "Chưa rõ";

  return {
    file: fileName,
    status,
    ngayTao: data.ngayTao ?? data.createdAt ?? "N/A",
    diemDen: diemDenStr,
    counts,
    errors,
  };
}

export function auditAllSnapshots(snapshotsDir?: string): {
  results: AuditItemResult[];
  allPassed: boolean;
} {
  const dir = snapshotsDir ?? path.join(process.cwd(), "src", "data", "snapshots");
  if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) {
    return { results: [], allPassed: true };
  }

  const files = fs.readdirSync(/*turbopackIgnore: true*/ dir).filter((f) => f.endsWith(".json"));
  const results: AuditItemResult[] = [];
  let allPassed = true;

  for (const f of files) {
    const fullPath = path.join(/*turbopackIgnore: true*/ dir, f);
    try {
      const raw = fs.readFileSync(/*turbopackIgnore: true*/ fullPath, "utf-8");
      const data = JSON.parse(raw);
      const res = auditSnapshotData(data, f);
      results.push(res);
      if (res.status === "THẤT BẠI") {
        allPassed = false;
      }
    } catch (err) {
      results.push({
        file: f,
        status: "THẤT BẠI",
        counts: { khachSan: 0, quanAn: 0, cafe: 0, hoatDong: 0, transport: 0 },
        errors: [`Lỗi đọc/parse file JSON: ${err instanceof Error ? err.message : String(err)}`],
      });
      allPassed = false;
    }
  }

  return { results, allPassed };
}
