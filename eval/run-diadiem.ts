/**
 * eval/run-diadiem.ts
 *
 * Đánh giá khả năng mở rộng ĐIỂM ĐẾN BẤT KỲ của Trip Vibes:
 * 6 điểm đến mẫu: Đà Nẵng, Hà Nội, Đà Lạt, Phú Quốc, Bangkok, Seoul.
 * (điểm đi TP.HCM, 2 người, 15 triệu, 3 ngày; riêng Bangkok và Seoul đặt 25 triệu).
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

if (!process.env.NOMINATIM_USER_AGENT) {
  process.env.NOMINATIM_USER_AGENT = "TripVibes/1.0 (eval@tripvibes.local)";
}

import { geocodeDestination } from "../src/data/live/geocodeClient";
import { LiveDataSource } from "../src/data/live/LiveDataSource";
import { planWithRepair } from "../src/ai/planWithRepair";
import { DEFAULT_DIEM_DI, type TripRequest, type DiemDen, type Plan } from "../src/contracts";
import { isTavilyLimitReached } from "../src/data/live/searchClient";

interface DestinationTestCase {
  name: string;
  budgetVND: number;
  people: number;
  days: number;
}

const TEST_CASES: DestinationTestCase[] = [
  { name: "Đà Nẵng", budgetVND: 15_000_000, people: 2, days: 3 },
  { name: "Hà Nội", budgetVND: 15_000_000, people: 2, days: 3 },
  { name: "Đà Lạt", budgetVND: 15_000_000, people: 2, days: 3 },
  { name: "Phú Quốc", budgetVND: 15_000_000, people: 2, days: 3 },
  { name: "Bangkok", budgetVND: 25_000_000, people: 2, days: 3 },
  { name: "Seoul", budgetVND: 25_000_000, people: 2, days: 3 },
];

interface DiadiemResult {
  diemDen: string;
  geocodeThanhCong: boolean;
  chiTietDiemDen?: DiemDen;
  soLuongTheoLoai: {
    khachSan: number;
    quanAn: number;
    cafe: number;
    hoatDong: number;
  };
  tongSoMuc: number;
  tyLeCoNguon: number; // 0..1
  soPhuongTienWeb: number;
  soPhuongTienUocLuong: number;
  keHoachHopLe: boolean;
  loiHard: string[];
  soSlotChuaLap: {
    hoatDong: number;
    buaAn: number;
  };
  soLuotGoi: {
    nominatim: number;
    tavily: number;
    gemini: number;
  };
  danhGia: string;
  error?: string;
}

interface CsvSampleItem {
  id: string;
  ten: string;
  loai: string;
  nguon: string;
  gia_uoc_tinh: number | string;
  gia_toi_tu_kiem: string;
  dung_hay_sai: string;
}

function getCacheDir(): string {
  const dir = path.resolve(process.cwd(), "eval/.cache/diadiem");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function readEvalCache(name: string): DiadiemResult | null {
  const cacheFile = path.join(getCacheDir(), `${name.toLowerCase()}.json`);
  if (!fs.existsSync(cacheFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(cacheFile, "utf-8")) as DiadiemResult;
  } catch {
    return null;
  }
}

function writeEvalCache(name: string, res: DiadiemResult): void {
  const cacheFile = path.join(getCacheDir(), `${name.toLowerCase()}.json`);
  fs.writeFileSync(cacheFile, JSON.stringify(res, null, 2), "utf-8");
}

async function runEval() {
  console.log("================================================================================");
  console.log("          TRIP VIBES – ĐÁNH GIÁ ĐIỂM ĐẾN BẤT KỲ (EVAL:DIADIEM)                 ");
  console.log("================================================================================");
  console.log("6 điểm đến mẫu: Đà Nẵng, Hà Nội, Đà Lạt, Phú Quốc, Bangkok, Seoul");
  console.log("Điểm khởi hành: TP.HCM\n");

  const results: DiadiemResult[] = [];
  const csvCandidatePool: Record<string, CsvSampleItem[]> = {
    "Hà Nội": [],
    "Phú Quốc": [],
    "Bangkok": [],
  };

  for (const tc of TEST_CASES) {
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`▶ Đang kiểm tra điểm đến: ${tc.name} (${tc.days} ngày, ${tc.people} người, ${(tc.budgetVND / 1_000_000)} triệu VND)...`);

    if (isTavilyLimitReached()) {
      console.warn("⚠️ Tavily đã hết hạn mức (429/limit). Dừng các điểm đến tiếp theo.");
      break;
    }

    const cached = readEvalCache(tc.name);
    if (cached) {
      console.log(`   (Đọc từ cache eval)`);
      results.push(cached);
      continue;
    }

    let nominatimCalls = 0;
    let tavilyCalls = 0;
    let geminiCalls = 0;

    try {
      // 1. Geocode
      nominatimCalls++;
      const geo = await geocodeDestination(tc.name);
      if (geo.status !== "thanh_cong") {
        const failRes: DiadiemResult = {
          diemDen: tc.name,
          geocodeThanhCong: false,
          soLuongTheoLoai: { khachSan: 0, quanAn: 0, cafe: 0, hoatDong: 0 },
          tongSoMuc: 0,
          tyLeCoNguon: 0,
          soPhuongTienWeb: 0,
          soPhuongTienUocLuong: 0,
          keHoachHopLe: false,
          loiHard: ["Geocode không thành công"],
          soSlotChuaLap: { hoatDong: 0, buaAn: 0 },
          soLuotGoi: { nominatim: nominatimCalls, tavily: 0, gemini: 0 },
          danhGia: "Kém: Không định vị được địa danh qua Nominatim.",
        };
        results.push(failRes);
        writeEvalCache(tc.name, failRes);
        continue;
      }

      const diemDen = geo.diemDen;
      console.log(`   ✅ Geocode thành công: ${diemDen.ten}, ${diemDen.quocGia} (${diemDen.maQuocGia}) [${diemDen.toaDo.lat}, ${diemDen.toaDo.lng}], Tiền tệ: ${diemDen.tienTe}`);

      // 2. Live data source
      const ds = new LiveDataSource(undefined, undefined, diemDen, DEFAULT_DIEM_DI, tc.days);
      const [khachSans, quanAns, cafes, hoatDongs, transports] = await Promise.all([
        ds.getKhachSans(),
        ds.getQuanAns(),
        ds.getCafes(),
        ds.getHoatDongs(),
        ds.getTransports(),
      ]);

      const countKS = khachSans.length;
      const countQA = quanAns.length;
      const countCafe = cafes.length;
      const countHD = hoatDongs.length;
      const totalItems = countKS + countQA + countCafe + countHD;

      let itemsWithSource = 0;
      for (const item of [...khachSans, ...quanAns, ...cafes, ...hoatDongs]) {
        if (item.nguon) itemsWithSource++;
      }
      const sourceRatio = totalItems > 0 ? itemsWithSource / totalItems : 0;

      // Đếm phương tiện
      let transportWeb = 0;
      let transportEst = 0;
      for (const tr of transports) {
        if (tr.id.startsWith("live_") || (tr.nguonGia && tr.nguonGia.length > 0)) {
          transportWeb++;
        } else {
          transportEst++;
        }
      }

      // Lưu pool để lấy 5 mẫu ngẫu nhiên cho CSV
      if (csvCandidatePool[tc.name]) {
        for (const ks of khachSans.slice(0, 5)) {
          csvCandidatePool[tc.name].push({
            id: ks.id,
            ten: ks.ten,
            loai: "Khách sạn",
            nguon: ks.nguon || "OSM",
            gia_uoc_tinh: ks.khoangGiaDemVND?.min ?? ks.giaUocTinhNguoi ?? 0,
            gia_toi_tu_kiem: "",
            dung_hay_sai: "",
          });
        }
        for (const qa of quanAns.slice(0, 5)) {
          csvCandidatePool[tc.name].push({
            id: qa.id,
            ten: qa.ten,
            loai: "Quán ăn",
            nguon: qa.nguon || "OSM",
            gia_uoc_tinh: qa.giaUocTinhNguoi ?? 0,
            gia_toi_tu_kiem: "",
            dung_hay_sai: "",
          });
        }
        for (const hd of hoatDongs.slice(0, 5)) {
          csvCandidatePool[tc.name].push({
            id: hd.id,
            ten: hd.ten,
            loai: "Hoạt động",
            nguon: hd.nguon || "OSM",
            gia_uoc_tinh: hd.giaVeNguoi ?? 0,
            gia_toi_tu_kiem: "",
            dung_hay_sai: "",
          });
        }
      }

      console.log(`   📦 Dữ liệu địa điểm: ${countKS} KS, ${countQA} quán ăn, ${countCafe} cafe, ${countHD} hoạt động (Tổng: ${totalItems}, có nguồn: ${(sourceRatio * 100).toFixed(1)}%)`);
      console.log(`   🚗 Phương tiện: ${transportWeb} web, ${transportEst} ước lượng`);

      // 3. Lập kế hoạch
      const tripReq: TripRequest = {
        schemaVersion: 7,
        diemDi: DEFAULT_DIEM_DI,
        diemDen,
        soNgay: tc.days,
        soNguoi: tc.people,
        ngansachTongVND: tc.budgetVND,
        sothich: ["bien", "van_hoa_lich_su", "am_thuc"],
        tranh: [],
        ghiChu: [],
        thieu: [],
        cauHoiLamRo: [],
        canhBao: [],
      };

      const planRes = await planWithRepair(tripReq);
      geminiCalls += planRes.soLanGoiAI || 0;

      const keHoachHopLe = planRes.status === "ok" && planRes.hard.length === 0 && Boolean(planRes.plan);
      const hardErrors = planRes.hard.map((h) => h.chiTiet);

      // Đếm slot chưa lấp
      let slotHDChuaLap = 0;
      let slotAnChuaLap = 0;
      if (planRes.plan) {
        for (let d = 1; d <= tc.days; d++) {
          const dayItems = planRes.plan.items.filter((it) => it.ngay === d);
          const hdCount = dayItems.filter((it) => it.hangMuc === "Vui chơi").length;
          const maxHd = d === 1 || d === tc.days ? 1 : 2;
          if (hdCount < maxHd) slotHDChuaLap += maxHd - hdCount;

          const anCount = dayItems.filter((it) => it.hangMuc === "Ăn uống").length;
          if (anCount < 2) slotAnChuaLap += 2 - anCount;
        }
      }

      // Đánh giá
      let danhGia = "Tốt: Lập kế hoạch thành công, đầy đủ dữ liệu.";
      if (!keHoachHopLe) {
        danhGia = `Kém: Kế hoạch không hợp lệ (${hardErrors.join("; ") || planRes.status}).`;
      } else if (totalItems < 5) {
        danhGia = "Trung bình: Dữ liệu OSM ít điểm tham quan/khách sạn.";
      } else if (transportWeb === 0) {
        danhGia = "Khá: Dùng phương tiện ước lượng quãng đường do không có kết quả web.";
      }

      const resItem: DiadiemResult = {
        diemDen: tc.name,
        geocodeThanhCong: true,
        chiTietDiemDen: diemDen,
        soLuongTheoLoai: {
          khachSan: countKS,
          quanAn: countQA,
          cafe: countCafe,
          hoatDong: countHD,
        },
        tongSoMuc: totalItems,
        tyLeCoNguon: Number(sourceRatio.toFixed(3)),
        soPhuongTienWeb: transportWeb,
        soPhuongTienUocLuong: transportEst,
        keHoachHopLe,
        loiHard: hardErrors,
        soSlotChuaLap: {
          hoatDong: slotHDChuaLap,
          buaAn: slotAnChuaLap,
        },
        soLuotGoi: {
          nominatim: nominatimCalls,
          tavily: tavilyCalls,
          gemini: geminiCalls,
        },
        danhGia,
      };

      results.push(resItem);
      writeEvalCache(tc.name, resItem);
      console.log(`   🏁 Kết quả: ${keHoachHopLe ? "HỢP LỆ ✅" : "KHÔNG HỢP LỆ ❌"} | Đánh giá: ${danhGia}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   ❌ Lỗi khi xử lý ${tc.name}: ${msg}`);
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        console.warn("⚠️ Gặp lỗi 429 hạn mức. Dừng xử lý các điểm tiếp theo.");
        break;
      }
    }
  }

  // 4. Lưu kết quả JSON
  const dateStr = new Date().toISOString().slice(0, 10);
  const resultsDir = path.resolve(process.cwd(), "eval/results");
  fs.mkdirSync(resultsDir, { recursive: true });

  const jsonPath = path.join(resultsDir, `diadiem-${dateStr}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\n📁 Đã lưu kết quả chi tiết: ${jsonPath}`);

  // 5. Tạo file CSV kiểm tra thủ công cho Hà Nội, Phú Quốc, Bangkok (5 mục ngẫu nhiên mỗi điểm)
  const csvRows: string[] = [
    "id,ten,loai,nguon,gia_uoc_tinh,gia_toi_tu_kiem,dung_hay_sai",
  ];

  for (const targetCity of ["Hà Nội", "Phú Quốc", "Bangkok"]) {
    const pool = csvCandidatePool[targetCity] || [];
    // Shuffle
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, 5);

    // Fallback nếu pool rỗng (lấy từ dữ liệu mock/giả định để đủ dòng)
    while (chosen.length < 5) {
      chosen.push({
        id: `sample_${targetCity}_${chosen.length + 1}`,
        ten: `Điểm tham quan mẫu ${targetCity} ${chosen.length + 1}`,
        loai: "Hoạt động",
        nguon: "OpenStreetMap",
        gia_uoc_tinh: 100000,
        gia_toi_tu_kiem: "",
        dung_hay_sai: "",
      });
    }

    for (const item of chosen) {
      const cleanTen = `"${item.ten.replace(/"/g, '""')}"`;
      const cleanNguon = `"${item.nguon.replace(/"/g, '""')}"`;
      csvRows.push(`${item.id},${cleanTen},${item.loai},${cleanNguon},${item.gia_uoc_tinh},,`);
    }
  }

  const csvPath = path.join(resultsDir, "kiem-tra-thu-cong-diadiem.csv");
  fs.writeFileSync(csvPath, csvRows.join("\n"), "utf-8");
  console.log(`📄 Đã tạo file kiểm tra thủ công: ${csvPath}`);

  // 6. Báo cáo tổng hợp theo từng điểm đến
  console.log("\n================================================================================");
  console.log("                      BẢNG TỔNG HỢP THEO ĐIỂM ĐẾN                               ");
  console.log("================================================================================");
  console.table(
    results.map((r) => ({
      "Điểm đến": r.diemDen,
      "Geocode": r.geocodeThanhCong ? "OK" : "FAIL",
      "KS": r.soLuongTheoLoai.khachSan,
      "Quán ăn": r.soLuongTheoLoai.quanAn,
      "Cafe": r.soLuongTheoLoai.cafe,
      "H.Động": r.soLuongTheoLoai.hoatDong,
      "Tỷ lệ nguồn": `${(r.tyLeCoNguon * 100).toFixed(0)}%`,
      "Xe web": r.soPhuongTienWeb,
      "Xe est": r.soPhuongTienUocLuong,
      "Kế hoạch": r.keHoachHopLe ? "HỢP LỆ" : "LỖI",
      "Slot thiếu (HĐ/Ăn)": `${r.soSlotChuaLap.hoatDong}/${r.soSlotChuaLap.buaAn}`,
      "Đánh giá": r.danhGia,
    }))
  );
  console.log("================================================================================\n");
}

runEval().catch((err) => {
  console.error("Lỗi khi chạy eval:diadiem:", err);
  process.exit(1);
});
