import React from "react";
import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { LichTrinhDanhSachScreen } from "@/ui/screens/LichTrinhDanhSachScreen";

export const metadata: Metadata = {
  title: "Lịch Trình Mẫu Tham Khảo - Trip Vibes",
  description: "Các lịch trình mẫu du lịch 3 ngày 2 đêm tối ưu chi phí từ dữ liệu OpenStreetMap cho 5 điểm đến phổ biến.",
};

export default function LichTrinhPage() {
  const indexPath = path.join(process.cwd(), "src", "data", "mau", "index.json");
  let danhSach: any[] = [];
  let ngayDuLieu = "20/10/2026";

  if (fs.existsSync(indexPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
      danhSach = parsed.danhSach || [];
      ngayDuLieu = parsed.ngayTao || "20/10/2026";
    } catch {
      // fallback
    }
  }

  return <LichTrinhDanhSachScreen danhSach={danhSach} ngayDuLieu={ngayDuLieu} />;
}
