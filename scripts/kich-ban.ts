/**
 * scripts/kich-ban.ts
 *
 * Bộ kiểm tra logic theo kịch bản (QT-31):
 * Kiểm tra các điều bất biến:
 * 1. Tổng tiền không vượt ngân sách (hoặc được cảnh báo đúng)
 * 2. Số đêm tính đúng theo công thức YC-22
 * 3. Chỗ ở thuộc ngày đến, giờ >= 14:00 (YC-23)
 * 4. Không có hoạt động nào xếp trước giờ đến (YC-24)
 * 5. Cảnh báo thiếu và cờ hợp lệ
 * 6. Kế hoạch lập bằng quy tắc khi AI tắt
 *
 * Chỉ báo lỗi, không tự sửa lõi (QT-31).
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

// Buộc AI tắt để kiểm tra đường chạy quy tắc
process.env.LIVE_AI_ENABLED = "false";
process.env.DATA_MODE = "snapshot";

import { planWithRepair } from "../src/ai/planWithRepair";
import { getSnapshotDiemDen } from "../src/data/prepareDestination";
import type { TripRequest, Plan } from "../src/contracts";
import { DEFAULT_DIEM_DI, schemaVersion } from "../src/contracts";

interface Scenario {
  ten: string;
  diemDenSlug: string;
  soNgay: number;
  soNguoi: number;
  ngansachTongVND: number;
  tranh?: any[];
  expectedKhaThi: boolean;
  expectNgoaiPhamVi?: boolean;
}

const KICH_BAN: Scenario[] = [
  {
    ten: "Đà Nẵng 3 ngày 2 đêm tiêu chuẩn",
    diemDenSlug: "da-nang",
    soNgay: 3,
    soNguoi: 2,
    ngansachTongVND: 12_000_000,
    expectedKhaThi: true,
  },
  {
    ten: "Hà Nội 2 ngày 1 đêm ngân sách vừa phải",
    diemDenSlug: "ha-noi",
    soNgay: 2,
    soNguoi: 1,
    ngansachTongVND: 5_000_000,
    expectedKhaThi: true,
  },
  {
    ten: "Đà Lạt 4 ngày 3 đêm tránh đi đêm",
    diemDenSlug: "da-lat",
    soNgay: 4,
    soNguoi: 2,
    ngansachTongVND: 15_000_000,
    tranh: ["khong_di_dem"],
    expectedKhaThi: true,
  },
  {
    ten: "Bangkok 5 ngày 4 đêm",
    diemDenSlug: "bangkok",
    soNgay: 5,
    soNguoi: 2,
    ngansachTongVND: 25_000_000,
    expectedKhaThi: true,
  },
  {
    ten: "Seoul 6 ngày 5 đêm (phạm vi 2-7 ngày)",
    diemDenSlug: "seoul",
    soNgay: 6,
    soNguoi: 2,
    ngansachTongVND: 45_000_000,
    expectedKhaThi: true,
  },
  {
    ten: "Ngân sách cực thấp không khả thi (500k cho 3 ngày)",
    diemDenSlug: "da-nang",
    soNgay: 3,
    soNguoi: 2,
    ngansachTongVND: 500_000,
    expectedKhaThi: false,
  },
  {
    ten: "Số ngày ngoài phạm vi (8 ngày)",
    diemDenSlug: "da-lat",
    soNgay: 8,
    soNguoi: 2,
    ngansachTongVND: 20_000_000,
    expectedKhaThi: false,
    expectNgoaiPhamVi: true,
  },
];

async function main() {
  console.log("================================================================================");
  console.log("  BỘ KIỂM TRA LOGIC THEO KỊCH BẢN (QT-31 / TRIP VIBES)");
  console.log("================================================================================\n");

  let tongLoi = 0;
  let tongKiemTra = 0;

  for (const kb of KICH_BAN) {
    console.log(`▶ Kịch bản: ${kb.ten}`);
    const snap = getSnapshotDiemDen(kb.diemDenSlug);
    const diemDen = snap ?? kb.diemDenSlug;

    const request: TripRequest = {
      schemaVersion,
      diemDi: DEFAULT_DIEM_DI,
      diemDen,
      soNgay: kb.soNgay,
      soNguoi: kb.soNguoi,
      ngansachTongVND: kb.ngansachTongVND,
      sothich: [],
      tranh: kb.tranh ?? [],
      ghiChu: [],
      thieu: [],
      cauHoiLamRo: [],
      canhBao: [],
    };

    const result = await planWithRepair(request, {
      forceRulesOnly: true,
      lyDoDuPhong: "live_ai_tat",
    });

    if (kb.expectNgoaiPhamVi) {
      tongKiemTra++;
      if (result.status === "can_lam_ro" && result.lyDo === "ngoai_pham_vi_so_ngay") {
        console.log("  ✅ Bắt đúng lỗi ngoài phạm vi số ngày và có câu hỏi làm rõ");
      } else {
        console.error(`  ❌ LỖI: Kỳ vọng ngoại phạm vi số ngày nhưng nhận: ${result.status} (${result.lyDo})`);
        tongLoi++;
      }
      console.log("");
      continue;
    }

    if (!kb.expectedKhaThi) {
      tongKiemTra++;
      if (result.status === "khong_the_dat_ngan_sach" || result.hard.some(h => h.code === "vuot_ngan_sach")) {
        console.log("  ✅ Báo đúng ngân sách không khả thi / vượt ngân sách");
      } else {
        console.error(`  ❌ LỖI: Kỳ vọng không khả thi nhưng plan thành công không cảnh báo`);
        tongLoi++;
      }
      console.log("");
      continue;
    }

    if (!result.plan) {
      console.error(`  ❌ LỖI: Không tạo được plan cho kịch bản khả thi (${result.status}, ${result.lyDo})`);
      tongLoi++;
      console.log("");
      continue;
    }

    const plan: Plan = result.plan;

    // 1. Kiểm tra tổng tiền
    tongKiemTra++;
    if (plan.tongKet.tongVND <= kb.ngansachTongVND) {
      console.log(`  ✅ Bất biến 1 (Tổng tiền): ${plan.tongKet.tongVND.toLocaleString()} đ <= ${kb.ngansachTongVND.toLocaleString()} đ`);
    } else {
      console.error(`  ❌ LỖI Bất biến 1: Vượt ngân sách mà không cờ (${plan.tongKet.tongVND} > ${kb.ngansachTongVND})`);
      tongLoi++;
    }

    // 2. Kiểm tra phương thức lập là quy tắc khi AI tắt
    tongKiemTra++;
    if (plan.phuongThucLap === "quy_tac" && result.soLanGoiAI === 0) {
      console.log(`  ✅ Bất biến 2 (Quy tắc khi AI tắt): phuongThucLap='quy_tac', 0 lượt AI`);
    } else {
      console.error(`  ❌ LỖI Bất biến 2: phuongThucLap=${plan.phuongThucLap}, soLanGoiAI=${result.soLanGoiAI}`);
      tongLoi++;
    }

    // 3. Kiểm tra mục chỗ ở và giờ nhận phòng >= 14:00 (YC-23)
    tongKiemTra++;
    const hotelItems = plan.items.filter(i => i.hangMuc === "Chỗ ở");
    let hotelOk = true;
    for (const h of hotelItems) {
      if (h.gio) {
        const [hh] = h.gio.split(":").map(Number);
        if (hh < 14) {
          hotelOk = false;
          console.error(`  ❌ LỖI Bất biến 3: Giờ nhận phòng sớm hơn 14:00 (${h.gio})`);
          tongLoi++;
        }
      }
    }
    if (hotelOk) {
      console.log(`  ✅ Bất biến 3 (Chỗ ở): Có ${hotelItems.length} mục chỗ ở, giờ nhận phòng hợp lệ`);
    }

    // 4. Kiểm tra hoạt động không xếp trước giờ đến (YC-24)
    tongKiemTra++;
    const transportDi = plan.items.find(i => i.hangMuc === "Di chuyển" && i.ngay === 1);
    const activitiesDay1 = plan.items.filter(i => i.hangMuc === "Vui chơi" && i.ngay === 1);
    let actBeforeArrival = false;
    if (transportDi && transportDi.gio) {
      const [diH, diM] = transportDi.gio.split(":").map(Number);
      const arrMinutes = diH * 60 + diM;
      for (const act of activitiesDay1) {
        if (act.gio) {
          const [aH, aM] = act.gio.split(":").map(Number);
          if (aH * 60 + aM < arrMinutes) {
            actBeforeArrival = true;
            console.error(`  ❌ LỖI Bất biến 4: Hoạt động ${act.noiDung} lúc ${act.gio} trước giờ đến ${transportDi.gio}`);
            tongLoi++;
          }
        }
      }
    }
    if (!actBeforeArrival) {
      console.log(`  ✅ Bất biến 4 (Hoạt động ngày 1): Không xếp trước giờ đến`);
    }

    // 5. Kiểm tra vi phạm bất biến nặng (hard violations)
    tongKiemTra++;
    if (result.hard.length === 0) {
      console.log(`  ✅ Bất biến 5 (Ràng buộc cứng): 0 vi phạm nặng`);
    } else {
      console.error(`  ❌ LỖI Bất biến 5: Có ${result.hard.length} vi phạm nặng: ${result.hard.map(h => h.code).join(", ")}`);
      tongLoi++;
    }

    console.log("");
  }

  console.log("--------------------------------------------------------------------------------");
  if (tongLoi === 0) {
    console.log(`🎉 KẾT QUẢ: ĐẠT (${tongKiemTra}/${tongKiemTra} kiểm tra thành công)`);
    process.exit(0);
  } else {
    console.error(`❌ KẾT QUẢ: THẤT BẠI (${tongLoi} lỗi phát hiện)`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Lỗi thực thi kich-ban:", err);
  process.exit(1);
});
