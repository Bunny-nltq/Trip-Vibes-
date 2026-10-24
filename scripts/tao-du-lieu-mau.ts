/**
 * scripts/tao-du-lieu-mau.ts
 *
 * Tạo dữ liệu lịch trình mẫu (E7) cho 5 điểm đến snapshot:
 * - Sử dụng lapKeHoachTuDong (thuần quy tắc, tuyệt đối không gọi Gemini AI, không gọi mạng Overpass)
 * - Đọc trực tiếp từ file snapshot_*.json trong src/data/snapshots/
 * - 2 người, 3 ngày, ngân sách = 2.0 * minBudgetVND (làm tròn lên 100.000 đ)
 * - Lưu kết quả tại src/data/mau/<slug>-3ngay.json và src/data/mau/index.json
 */

import fs from "node:fs";
import path from "node:path";
import { DEFAULT_DIEM_DI, type TripRequest } from "../src/contracts";
import { getSnapshotDiemDen } from "../src/data/prepareDestination";
import { taoPhuongTienUocLuong } from "../src/data/live/researchTransport";
import { tinhNganSachToiThieu } from "../src/core/minBudget";
import { lapKeHoachTuDong } from "../src/core/lapKeHoachTuDong";
import { tiLeThoiGianDiChuyen } from "../src/core/tiLeDiChuyen";
import type { PlanData } from "../src/core/buildPlan";

const DESTINATIONS = [
  { slug: "da-nang", snapshotId: "da_nang", name: "Đà Nẵng", tieuDe: "Khám phá Đà Nẵng 3N2Đ: Biển Mỹ Khê & Bán Đảo Sơn Trà" },
  { slug: "ha-noi", snapshotId: "ha_noi", name: "Hà Nội", tieuDe: "Hà Nội 3N2Đ: 36 Phố Phường & Tinh Hoa Ẩm Thực Cổ Truyền" },
  { slug: "da-lat", snapshotId: "da_lat", name: "Đà Lạt", tieuDe: "Nghỉ Dưỡng Đà Lạt 3N2Đ: Thành Phố Ngàn Hoa Sương Mù" },
  { slug: "bangkok", snapshotId: "bangkok", name: "Bangkok", tieuDe: "Bangkok 3N2Đ: Chùa Vàng, Chợ Đêm & Thiên Đường Ẩm Thực" },
  { slug: "seoul", snapshotId: "seoul", name: "Seoul", tieuDe: "Trải Nghiệm Seoul 3N2Đ: Cung Điện Cổ Kính & Nhịp Sống Hiện Đại" },
];

async function main() {
  const outDir = path.join(process.cwd(), "src", "data", "mau");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const results: any[] = [];
  const reportRows: any[] = [];

  console.log("================================================================================");
  console.log("BẮT ĐẦU TẠO LỊCH TRÌNH MẪU (E7 - KHÔNG GỌI AI - 100% OFFLINE TỪ SNAPSHOT)");
  console.log("================================================================================");

  for (const item of DESTINATIONS) {
    const diemDen = getSnapshotDiemDen(item.name);
    if (!diemDen) {
      console.error(`[LỖI] Không tìm thấy snapshot cho điểm đến: ${item.name}`);
      continue;
    }

    const snapPath = path.join(
      process.cwd(),
      "src",
      "data",
      "snapshots",
      `snapshot_${item.snapshotId}_2026-10-20.json`
    );
    if (!fs.existsSync(snapPath)) {
      console.error(`[LỖI] Không tìm thấy file snapshot: ${snapPath}`);
      continue;
    }

    const snap = JSON.parse(fs.readFileSync(snapPath, "utf-8"));
    const transports = taoPhuongTienUocLuong(DEFAULT_DIEM_DI, diemDen);

    const planData: PlanData = {
      transports,
      hotels: snap.khachSans ?? [],
      activities: snap.hoatDongs ?? [],
      khachSans: snap.khachSans ?? [],
      quanAns: snap.quanAns ?? [],
      cafes: snap.cafes ?? [],
      hoatDongs: snap.hoatDongs ?? [],
    };

    const reqBase: TripRequest = {
      schemaVersion: 14,
      diemDi: DEFAULT_DIEM_DI,
      diemDen,
      soNguoi: 2,
      soNgay: 3,
      ngansachTongVND: 0,
      sothich: [],
      tranh: [],
      ghiChu: [],
      thieu: [],
      cauHoiLamRo: [],
      canhBao: [],
    };

    const minRes = tinhNganSachToiThieu(reqBase, planData);
    if (!minRes.khaThi) {
      console.error(`[LỖI] Không tính được ngân sách tối thiểu cho ${item.name}:`, minRes.lyDo);
      continue;
    }

    // Ngân sách bằng 2.0 lần mức tối thiểu, làm tròn lên 100.000 đ
    const ngansachTongVND = Math.ceil((minRes.toiThieuVND * 2.0) / 100_000) * 100_000;

    const autoRes = lapKeHoachTuDong(
      {
        ...reqBase,
        ngansachTongVND,
      },
      planData,
      3
    );

    if (autoRes.status !== "ok" || !autoRes.khaThi) {
      console.error(`[LỖI] Không lập được kế hoạch cho ${item.name}:`, autoRes);
      continue;
    }

    const tiLeDiChuyen = tiLeThoiGianDiChuyen(
      autoRes.plan.tongKet.tongThoiGianDiChuyenPhut,
      3
    );

    if (tiLeDiChuyen > 35) {
      console.warn(`[CẢNH BÁO] Tỉ lệ di chuyển của ${item.name} vượt 35%: ${tiLeDiChuyen}%`);
    }

    const transportDi = autoRes.plan.items.find((it) => it.hangMuc === "Di chuyển");
    const gioDen = transportDi?.gio || "10:00";

    const sampleItem = {
      slug: item.slug,
      tieuDe: item.tieuDe,
      tenDiemDen: item.name,
      quocGia: diemDen.quocGia,
      soNgay: 3,
      soDem: 2,
      soNguoi: 2,
      ngansachTongVND,
      tongTienVND: autoRes.tongVND,
      tiLeDiChuyen,
      gioDen,
      canhBao: autoRes.canhBao,
      plan: autoRes.plan,
      nguon: "OpenStreetMap contributors (snapshot 2026-10-20)",
      ngayTao: "2026-10-22",
      quyTacVersion: "4",
      giaLaUocTinh: true,
    };

    const filePath = path.join(outDir, `${item.slug}-3ngay.json`);
    fs.writeFileSync(filePath, JSON.stringify(sampleItem, null, 2), "utf-8");

    results.push({
      slug: item.slug,
      tieuDe: item.tieuDe,
      tenDiemDen: item.name,
      quocGia: diemDen.quocGia,
      soNgay: 3,
      soDem: 2,
      soNguoi: 2,
      ngansachTongVND,
      tongTienVND: autoRes.tongVND,
      tiLeDiChuyen,
      gioDen,
      soHoatDong: autoRes.plan.items.filter((it) => it.hangMuc === "Vui chơi").length,
      soQuanAn: autoRes.plan.items.filter((it) => it.hangMuc === "Ăn uống").length,
      soCafe: autoRes.plan.items.filter((it) => it.hangMuc === "Ăn uống" && it.noiDung.toLowerCase().includes("cafe")).length,
      khachSanTen: autoRes.plan.items.find((it) => it.hangMuc === "Chỗ ở")?.noiDung || "",
    });

    reportRows.push({
      "Điểm đến": item.name,
      "Ngân sách (VND)": ngansachTongVND.toLocaleString("vi-VN"),
      "Tổng tiền (VND)": autoRes.tongVND.toLocaleString("vi-VN"),
      "% Ngân sách": `${((autoRes.tongVND / ngansachTongVND) * 100).toFixed(1)}%`,
      "Tỉ lệ DC": `${tiLeDiChuyen}%`,
      "Giờ đến": gioDen,
      "Tình trạng": "Thành công",
    });
  }

  // Ghi tệp index.json tổng hợp
  fs.writeFileSync(
    path.join(outDir, "index.json"),
    JSON.stringify(
      {
        ngayTao: "2026-10-22",
        danhSach: results,
      },
      null,
      2
    ),
    "utf-8"
  );

  console.table(reportRows);
  console.log(`\nĐã tạo thành công ${results.length}/5 lịch trình mẫu tại: src/data/mau/`);
}

main().catch((err) => {
  console.error("Lỗi khi tạo dữ liệu mẫu:", err);
  process.exit(1);
});
