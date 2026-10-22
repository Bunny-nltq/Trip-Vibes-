import React from "react";
import fs from "node:fs";
import path from "node:path";
import { HomePageView } from "@/ui/screens/HomePageView";
import type { DiemDenThe } from "@/ui/components/site/ThuDiemDen";
import type { KhachSanThe } from "@/ui/components/site/KhachSanThamKhao";
import { getHotelPricePerNight } from "@/core/minBudget";

const DEST_ORDER = [
  { slug: "da-nang", id: "da_nang", snapshotPrefix: "snapshot_da_nang_" },
  { slug: "ha-noi", id: "ha_noi", snapshotPrefix: "snapshot_ha_noi_" },
  { slug: "da-lat", id: "da_lat", snapshotPrefix: "snapshot_da_lat_" },
  { slug: "bangkok", id: "bangkok", snapshotPrefix: "snapshot_bangkok_" },
  { slug: "seoul", id: "seoul", snapshotPrefix: "snapshot_seoul_" },
];

function docDanhSachDiemDenVaKhachSan(): {
  diemDens: DiemDenThe[];
  khachSans: KhachSanThe[];
  ngayDuLieu: string;
} {
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
    return { diemDens: [], khachSans: [], ngayDuLieu: "20/10/2026" };
  }

  const files = fs.readdirSync(dir);
  const diemDens: DiemDenThe[] = [];
  const khachSans: KhachSanThe[] = [];
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

        // Lấy 1 khách sạn từ mỗi điểm đến (tối đa 4 khách sạn từ 4 điểm đến khác nhau)
        if (khachSans.length < 4 && data.khachSans && data.khachSans.length > 0) {
          const ks = data.khachSans.find((h: any) => h.soSao && h.soSao > 0) || data.khachSans[0];
          const giaDemUocTinh = getHotelPricePerNight(ks);
          khachSans.push({
            id: ks.id,
            ten: ks.ten,
            diemDenTen: ten,
            diemDenSlug: item.slug,
            khuVuc: ks.khuVuc || "",
            soSao: ks.soSao ?? null,
            giaDemUocTinh,
          });
        }
      } catch {
        // bỏ qua nếu file hỏng
      }
    }
  }

  return { diemDens, khachSans, ngayDuLieu: ngayChung };
}

export default function HomePage() {
  const { diemDens, khachSans, ngayDuLieu } = docDanhSachDiemDenVaKhachSan();
  return <HomePageView diemDens={diemDens} khachSans={khachSans} ngayDuLieu={ngayDuLieu} />;
}
