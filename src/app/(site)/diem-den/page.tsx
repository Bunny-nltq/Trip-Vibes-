import React from "react";
import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { DiemDenDanhSachScreen } from "@/ui/screens/DiemDenDanhSachScreen";
import type { DiemDenThe } from "@/ui/components/site/ThuDiemDen";

export const metadata: Metadata = {
  title: "Khám Phá Điểm Đến",
  description: "Danh sách các điểm đến du lịch được hỗ trợ chính thức trên nền tảng Trip Vibes.",
};

const DEST_ORDER = [
  { slug: "da-nang", id: "da_nang", snapshotPrefix: "snapshot_da_nang_" },
  { slug: "ha-noi", id: "ha_noi", snapshotPrefix: "snapshot_ha_noi_" },
  { slug: "da-lat", id: "da_lat", snapshotPrefix: "snapshot_da_lat_" },
  { slug: "bangkok", id: "bangkok", snapshotPrefix: "snapshot_bangkok_" },
  { slug: "seoul", id: "seoul", snapshotPrefix: "snapshot_seoul_" },
];

function docDanhSachDiemDen(): { diemDens: DiemDenThe[]; ngayDuLieu: string } {
  const dir = path.join(process.cwd(), "src/data/snapshots");
  const moTaPath = path.join(process.cwd(), "src/data/site/mo-ta-diem-den.json");

  let moTaMap: Record<string, any> = {};
  if (fs.existsSync(moTaPath)) {
    try {
      moTaMap = JSON.parse(fs.readFileSync(moTaPath, "utf-8"));
    } catch {
      // bỏ qua nếu file lỗi
    }
  }

  if (!fs.existsSync(dir)) {
    return { diemDens: [], ngayDuLieu: "20/10/2026" };
  }

  const files = fs.readdirSync(dir);
  const diemDens: DiemDenThe[] = [];
  let ngayChung = "20/10/2026";

  for (const item of DEST_ORDER) {
    const file = files.find(
      (f) => f.startsWith(item.snapshotPrefix) && f.endsWith(".json")
    );
    if (file) {
      try {
        const fullPath = path.join(dir, file);
        const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        const rawDate = data.createdAt || "2026-10-20T00:00:00Z";
        const d = new Date(rawDate);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        const formatted = `${day}/${month}/${year}`;
        ngayChung = formatted;

        const info = moTaMap[item.slug] || {};
        const ten = info.ten || data.diemDen || item.slug;
        const quocGia = info.quocGia || "Việt Nam";
        const moTa = info.moTa || "";

        diemDens.push({
          id: item.id,
          slug: item.slug,
          ten,
          quocGia,
          ngayDuLieuFormatted: formatted,
          moTaNgan: moTa,
        });
      } catch {
        // bỏ qua nếu lỗi
      }
    }
  }

  return { diemDens, ngayDuLieu: ngayChung };
}

export default function DiemDenPage() {
  const { diemDens, ngayDuLieu } = docDanhSachDiemDen();
  return <DiemDenDanhSachScreen diemDens={diemDens} ngayDuLieu={ngayDuLieu} />;
}
