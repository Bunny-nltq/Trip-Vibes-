import React from "react";
import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import {
  KhachSanScreen,
  type DiemDenLuaChon,
  type KhachSanItem,
} from "@/ui/screens/KhachSanScreen";
import { getHotelPricePerNight } from "@/core/minBudget";

export const metadata: Metadata = {
  title: "Khách Sạn Tham Khảo",
  description:
    "Danh sách khách sạn tham khảo với mức giá ước tính minh bạch từ dữ liệu kiểm toán OpenStreetMap.",
};

const DEST_ORDER = [
  { slug: "da-nang", id: "da_nang", snapshotPrefix: "snapshot_da_nang_" },
  { slug: "ha-noi", id: "ha_noi", snapshotPrefix: "snapshot_ha_noi_" },
  { slug: "da-lat", id: "da_lat", snapshotPrefix: "snapshot_da_lat_" },
  { slug: "bangkok", id: "bangkok", snapshotPrefix: "snapshot_bangkok_" },
  { slug: "seoul", id: "seoul", snapshotPrefix: "snapshot_seoul_" },
];

function docDanhSachKhachSanTheoDiemDen(): {
  danhSachDiemDen: DiemDenLuaChon[];
  ngayDuLieu: string;
} {
  const dir = path.join(process.cwd(), "src/data/snapshots");
  const moTaPath = path.join(process.cwd(), "src/data/site/mo-ta-diem-den.json");

  let moTaMap: Record<string, any> = {};
  if (fs.existsSync(moTaPath)) {
    try {
      moTaMap = JSON.parse(fs.readFileSync(moTaPath, "utf-8"));
    } catch {
      // bỏ qua nếu lỗi
    }
  }

  if (!fs.existsSync(dir)) {
    return { danhSachDiemDen: [], ngayDuLieu: "20/10/2026" };
  }

  const files = fs.readdirSync(dir);
  const danhSachDiemDen: DiemDenLuaChon[] = [];
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

        const rawHotels: any[] = data.khachSans || [];
        const hotels: KhachSanItem[] = rawHotels.map((ks) => {
          const giaDemUocTinh = getHotelPricePerNight(ks);
          const mapUrl =
            ks.mapsUrls?.xem ||
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ks.ten + " " + ten)}`;
          return {
            id: ks.id,
            ten: ks.ten,
            khuVuc: ks.khuVuc || undefined,
            soSao: ks.soSao ?? null,
            giaDemUocTinh,
            mapUrl,
            nguon: "OpenStreetMap contributors",
          };
        });

        danhSachDiemDen.push({
          slug: item.slug,
          ten,
          quocGia,
          hotels,
        });
      } catch {
        // bỏ qua nếu file hỏng
      }
    }
  }

  return { danhSachDiemDen, ngayDuLieu: ngayChung };
}

export default async function KhachSanPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const initialSlug = typeof resolvedParams["diem-den"] === "string"
    ? resolvedParams["diem-den"]
    : undefined;

  const { danhSachDiemDen, ngayDuLieu } = docDanhSachKhachSanTheoDiemDen();

  return (
    <KhachSanScreen
      danhSachDiemDen={danhSachDiemDen}
      initialSlug={initialSlug}
      ngayDuLieu={ngayDuLieu}
    />
  );
}
