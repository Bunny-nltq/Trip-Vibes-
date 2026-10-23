import React from "react";
import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  DiemDenChiTietScreen,
  type DiaDiemVuiChoiItem,
  type QuanAnItem,
  type CafeItem,
  type KhachSanDiemDenItem,
} from "@/ui/screens/DiemDenChiTietScreen";
import { getHotelPricePerNight } from "@/core/minBudget";

const SLUG_MAPPING: Record<string, { snapshotPrefix: string; defaultName: string; country: string }> = {
  "da-nang": { snapshotPrefix: "snapshot_da_nang_", defaultName: "Đà Nẵng", country: "Việt Nam" },
  "ha-noi": { snapshotPrefix: "snapshot_ha_noi_", defaultName: "Hà Nội", country: "Việt Nam" },
  "da-lat": { snapshotPrefix: "snapshot_da_lat_", defaultName: "Đà Lạt", country: "Việt Nam" },
  bangkok: { snapshotPrefix: "snapshot_bangkok_", defaultName: "Bangkok", country: "Thái Lan" },
  seoul: { snapshotPrefix: "snapshot_seoul_", defaultName: "Seoul", country: "Hàn Quốc" },
};

export async function generateStaticParams() {
  return Object.keys(SLUG_MAPPING).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = SLUG_MAPPING[slug];
  if (!config) {
    return { title: "Không tìm thấy điểm đến | Trip Vibes" };
  }
  return {
    title: `Khám phá ${config.defaultName}`,
    description: `Khám phá địa điểm tham quan, ẩm thực và khách sạn tại ${config.defaultName} cùng Trip Vibes.`,
  };
}

function loadSnapshotData(slug: string) {
  const config = SLUG_MAPPING[slug];
  if (!config) return null;

  const dir = path.join(process.cwd(), "src/data/snapshots");
  const moTaPath = path.join(process.cwd(), "src/data/site/mo-ta-diem-den.json");
  const anhPath = path.join(process.cwd(), "src/data/site/anh-diem-den.json");

  let moTaMap: Record<string, any> = {};
  if (fs.existsSync(moTaPath)) {
    try {
      moTaMap = JSON.parse(fs.readFileSync(moTaPath, "utf-8"));
    } catch {
      // bỏ qua nếu lỗi
    }
  }

  let anhMap: Record<string, any> = {};
  if (fs.existsSync(anhPath)) {
    try {
      anhMap = JSON.parse(fs.readFileSync(anhPath, "utf-8"));
    } catch {
      // bỏ qua nếu lỗi
    }
  }

  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir);
  const file = files.find(
    (f) => f.startsWith(config.snapshotPrefix) && f.endsWith(".json")
  );
  if (!file) return null;

  try {
    const fullPath = path.join(dir, file);
    const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"));

    const rawDate = data.createdAt || "2026-10-20T00:00:00Z";
    const d = new Date(rawDate);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    const info = moTaMap[slug] || {};
    const ten = info.ten || data.diemDen || config.defaultName;
    const quocGia = info.quocGia || config.country;
    const moTa = info.moTa || "";

    // 1. Tối đa 12 địa điểm vui chơi
    const rawHoatDongs: any[] = data.hoatDongs || [];
    const hoatDongs: DiaDiemVuiChoiItem[] = rawHoatDongs.slice(0, 12).map((hd) => ({
      id: hd.id,
      ten: hd.ten,
      khuVuc: hd.khuVuc || undefined,
      loai: hd.loai || null,
      mapUrl:
        hd.mapsUrls?.xem ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hd.ten + " " + ten)}`,
    }));

    // 2. 6 Quán ăn
    const rawQuanAns: any[] = data.quanAns || [];
    const quanAns: QuanAnItem[] = rawQuanAns.slice(0, 6).map((qa) => ({
      id: qa.id,
      ten: qa.ten,
      khuVuc: qa.khuVuc || undefined,
      amThuc: qa.amThuc || null,
      mapUrl:
        qa.mapsUrls?.xem ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(qa.ten + " " + ten)}`,
    }));

    // 3. 6 Cà phê
    const rawCafes: any[] = data.cafes || [];
    const cafes: CafeItem[] = rawCafes.slice(0, 6).map((cf) => ({
      id: cf.id,
      ten: cf.ten,
      khuVuc: cf.khuVuc || undefined,
      mapUrl:
        cf.mapsUrls?.xem ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cf.ten + " " + ten)}`,
    }));

    // 4. 6 Khách sạn
    const rawKhachSans: any[] = data.khachSans || [];
    const khachSans: KhachSanDiemDenItem[] = rawKhachSans.slice(0, 6).map((ks) => {
      const giaDemUocTinh = getHotelPricePerNight(ks);
      return {
        id: ks.id,
        ten: ks.ten,
        khuVuc: ks.khuVuc || undefined,
        soSao: ks.soSao ?? null,
        giaDemUocTinh,
      };
    });

    return {
      slug,
      ten,
      quocGia,
      moTa,
      ngayDuLieu: formattedDate,
      hoatDongs,
      quanAns,
      cafes,
      khachSans,
      hinhAnh: anhMap[slug] || undefined,
    };
  } catch {
    return null;
  }
}

export default async function DiemDenChiTietPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = loadSnapshotData(slug);
  if (!detail) {
    notFound();
  }

  return <DiemDenChiTietScreen {...detail} />;
}
