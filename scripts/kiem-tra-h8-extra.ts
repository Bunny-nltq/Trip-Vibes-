import fs from "node:fs";
import path from "node:path";
import { auditSnapshotData } from "../src/data/snapshots/snapshotAudit";

const PORT = process.env.PORT || "3012";
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function run() {
  console.log(`=== BẮT ĐẦU KIỂM TRA BỔ SUNG H8 TẠI ${BASE_URL} ===`);
  const logs: string[] = [];

  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  const routes = [
    "/diem-den",
    "/diem-den/da-nang",
    "/khach-san",
    "/api/diem-chon",
  ];

  let ok = true;
  for (const r of routes) {
    try {
      const res = await fetch(`${BASE_URL}${r}`);
      if (res.status === 200) {
        log(`✅ GET ${r}: HTTP 200 OK`);
      } else {
        log(`❌ GET ${r}: HTTP ${res.status}`);
        ok = false;
      }
    } catch (err: any) {
      log(`❌ GET ${r}: Lỗi kết nối: ${err.message}`);
      ok = false;
    }
  }

  // Kiểm tra /api/diem-chon và snapshot hợp lệ
  try {
    const res = await fetch(`${BASE_URL}/api/diem-chon`);
    const data = await res.json();
    log(`\nKiểm tra dữ liệu /api/diem-chon:`);
    log(`- Số điểm đi: ${data.diemDi?.length || 0}`);
    log(`- Số điểm đến: ${data.diemDen?.length || 0}`);

    if (!data.diemDen || data.diemDen.length === 0) {
      log(`❌ Không có điểm đến nào trong /api/diem-chon`);
      ok = false;
    }

    const snapshotDir = path.resolve(process.cwd(), "src/data/snapshots");
    const snapshotFiles = fs.readdirSync(snapshotDir).filter((f) => f.endsWith(".json"));

    for (const d of data.diemDen || []) {
      const ten = d.ten;
      // Tìm snapshot tương ứng
      const matchedFile = snapshotFiles.find((f) => {
        try {
          const raw = JSON.parse(fs.readFileSync(path.join(snapshotDir, f), "utf-8"));
          const snapshotTen = typeof raw.diemDen === "string" ? raw.diemDen : raw.diemDen?.ten;
          return snapshotTen === ten || f.includes(ten.toLowerCase().replace(/\s+/g, "_"));
        } catch {
          return false;
        }
      });

      if (matchedFile) {
        const raw = JSON.parse(fs.readFileSync(path.join(snapshotDir, matchedFile), "utf-8"));
        const audit = auditSnapshotData(raw, matchedFile);
        if (audit.status === "HỢP LỆ") {
          log(`✅ Điểm đến "${ten}": Snapshot ${matchedFile} HỢP LỆ (status: ${audit.status})`);
        } else {
          log(`❌ Điểm đến "${ten}": Snapshot ${matchedFile} KHÔNG HỢP LỆ (${audit.status}: ${audit.errors.join(", ")})`);
          ok = false;
        }
      } else {
        log(`❌ Điểm đến "${ten}": Không tìm thấy tệp snapshot!`);
        ok = false;
      }
    }
  } catch (err: any) {
    log(`❌ Lỗi khi kiểm tra snapshot /api/diem-chon: ${err.message}`);
    ok = false;
  }

  const outDir = path.resolve(process.cwd(), "docs/bang-chung/ui-v2/H8");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "kiem-tra-extra.txt"), logs.join("\n"), "utf-8");

  if (!ok) {
    console.error("❌ KIỂM TRA BỔ SUNG H8 THẤT BẠI");
    process.exit(1);
  } else {
    console.log("✅ TOÀN BỘ KIỂM TRA BỔ SUNG H8 ĐẠT!");
  }
}

run();
