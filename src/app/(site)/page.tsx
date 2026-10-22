import React from "react";
import fs from "node:fs";
import path from "node:path";
import { HomePageView } from "@/ui/screens/HomePageView";
import type { DiemDenThe } from "@/ui/components/site/ThuDiemDen";

const DEST_CONFIGS = [
  {
    id: "da_nang",
    ten: "Đà Nẵng",
    quocGia: "Việt Nam",
    moTa: "Thành phố đáng sống với biển Mỹ Khê, bán đảo Sơn Trà và cầu Rồng thơ mộng.",
  },
  {
    id: "ha_noi",
    ten: "Hà Nội",
    quocGia: "Việt Nam",
    moTa: "Thủ đô ngàn năm văn hiến với 36 phố phường, hồ Hoàn Kiếm và nét ẩm thực tinh tế.",
  },
  {
    id: "da_lat",
    ten: "Đà Lạt",
    quocGia: "Việt Nam",
    moTa: "Thành phố sương mù ngàn hoa với khí hậu se lạnh và đồi thông lãng mạn.",
  },
  {
    id: "bangkok",
    ten: "Bangkok",
    quocGia: "Thái Lan",
    moTa: "Đại đô thị Đông Nam Á sôi động với chùa vàng tráng lệ và ẩm thực phong phú.",
  },
  {
    id: "seoul",
    ten: "Seoul",
    quocGia: "Hàn Quốc",
    moTa: "Thủ đô giao hòa giữa cung điện cổ kính Joseon và nhịp sống K-Wave hiện đại.",
  },
];

function docDanhSachDiemDen(): { diemDens: DiemDenThe[]; ngayDuLieu: string } {
  const dir = path.join(process.cwd(), "src/data/snapshots");
  if (!fs.existsSync(dir)) {
    return { diemDens: [], ngayDuLieu: "20/10/2026" };
  }

  const files = fs.readdirSync(dir);
  const diemDens: DiemDenThe[] = [];
  let ngayChung = "20/10/2026";

  for (const cfg of DEST_CONFIGS) {
    const file = files.find(
      (f) => f.startsWith(`snapshot_${cfg.id}_`) && f.endsWith(".json")
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

        diemDens.push({
          id: cfg.id,
          ten: cfg.ten,
          quocGia: cfg.quocGia,
          ngayDuLieuFormatted: formatted,
          moTaNgan: cfg.moTa,
        });
      } catch {
        // bỏ qua nếu file hỏng
      }
    }
  }

  return { diemDens, ngayDuLieu: ngayChung };
}

export default function HomePage() {
  const { diemDens, ngayDuLieu } = docDanhSachDiemDen();
  return <HomePageView diemDens={diemDens} ngayDuLieu={ngayDuLieu} />;
}
