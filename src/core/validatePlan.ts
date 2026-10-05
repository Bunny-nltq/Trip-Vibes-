import type { TripRequest, Plan } from "@/contracts";
import type { PlanData } from "./buildPlan";
import { calculateTransportFlags } from "./flags";
import {
  GIO_HOAT_DONG_1,
  GIO_HOAT_DONG_2,
  GIO_NHAN_PHONG,
  BUFFER_SAU_KHI_DEN_PHUT,
  BUFFER_RA_BEN_PHUT,
  BUFFER_GIUA_HOAT_DONG_PHUT,
  NGUONG_GAN_HET_NGAN_SACH_PHAN_TRAM,
} from "./assumptions";

export interface Violation {
  code: string;
  chiTiet: string;
  duLieu?: any;
}

export interface ValidatePlanResult {
  hard: Violation[];
  soft: Violation[];
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Kiểm tra ràng buộc của kế hoạch dựa trên logic mã hóa (code).
 * Quyết định tính hợp lệ tuyệt đối, AI không được phép tự gán.
 */
export function validatePlan(
  request: TripRequest,
  plan: Plan,
  data: PlanData
): ValidatePlanResult {
  const hard: Violation[] = [];
  const soft: Violation[] = [];

  const { tongKet } = plan;
  const ngansach = request.ngansachTongVND ?? 0;

  // 1. vuot_ngan_sach
  if (ngansach > 0 && tongKet.tongVND > ngansach) {
    hard.push({
      code: "vuot_ngan_sach",
      chiTiet: "Tổng chi phí vượt quá ngân sách cho phép.",
      duLieu: {
        vuotVND: tongKet.tongVND - ngansach,
        tongVND: tongKet.tongVND,
        ngansachTongVND: ngansach,
        theoHangMuc: tongKet.theoHangMuc,
      },
    });
  }

  // soft: gan_het_ngan_sach
  if (
    ngansach > 0 &&
    tongKet.tongVND <= ngansach &&
    tongKet.phanTramDaDung >= NGUONG_GAN_HET_NGAN_SACH_PHAN_TRAM
  ) {
    soft.push({
      code: "gan_het_ngan_sach",
      chiTiet: `Đã dùng ${tongKet.phanTramDaDung}% ngân sách.`,
      duLieu: { phanTramDaDung: tongKet.phanTramDaDung },
    });
  }

  // 2. Vi phạm điều cần tránh trên phương tiện
  const tDiItem = plan.items.find((i) => i.hangMuc === "Di chuyển" && i.ngay === 1);
  const tVeItem = plan.items.find((i) => i.hangMuc === "Di chuyển" && i.ngay === request.soNgay);

  const tDi = data.transports.find((t) => t.id === tDiItem?.refId);
  const tVe = data.transports.find((t) => t.id === tVeItem?.refId);

  let gioDenDiPhut = 0;

  if (tDi) {
    const flagsDi = calculateTransportFlags(tDi.departureTime, tDi.durationMinutes);
    gioDenDiPhut = timeToMinutes(tDi.departureTime) + tDi.durationMinutes;

    // soft: den_truoc_gio_nhan_phong
    if (flagsDi.gioDen < GIO_NHAN_PHONG) {
      soft.push({
        code: "den_truoc_gio_nhan_phong",
        chiTiet: `Giờ đến (${flagsDi.gioDen}) sớm hơn giờ nhận phòng (${GIO_NHAN_PHONG}).`,
      });
    }
  }

  const transportsToCheck = [tDi, tVe].filter(Boolean) as typeof data.transports;

  for (const t of transportsToCheck) {
    const flags = calculateTransportFlags(t.departureTime, t.durationMinutes);

    if (request.tranh.includes("khong_day_som") && (flags.khoiHanhSom || flags.denSom)) {
      hard.push({
        code: "vi_pham_khong_day_som",
        chiTiet: `Phương tiện ${t.id} khởi hành hoặc đến nơi quá sớm.`,
        duLieu: { id: t.id },
      });
    }
    if (request.tranh.includes("khong_di_dem") && flags.diDem) {
      hard.push({
        code: "vi_pham_khong_di_dem",
        chiTiet: `Phương tiện ${t.id} đi trong khung giờ đêm.`,
        duLieu: { id: t.id },
      });
    }
    if (request.tranh.includes("tranh_di_chuyen_lau") && flags.diChuyenLau) {
      hard.push({
        code: "vi_pham_tranh_di_chuyen_lau",
        chiTiet: `Phương tiện ${t.id} có thời gian di chuyển quá lâu.`,
        duLieu: { id: t.id },
      });
    }
  }

  // 3. Vi phạm điều cần tránh trên hoạt động và ràng buộc thời gian
  const hoatDongTheoNgay: Array<Array<{ act: NonNullable<typeof data.activities[0]>; gioThucTe: string }>> = 
    Array.from({ length: request.soNgay ?? 0 }, () => []);

  for (const item of plan.items) {
    if (item.hangMuc === "Vui chơi" && item.refId) {
      const act = data.activities.find((a) => a.id === item.refId);
      if (act) {
        hoatDongTheoNgay[item.ngay - 1].push({ act, gioThucTe: item.gio || "" });
        
        if (request.tranh.includes("tranh_dong_nguoi") && act.dongNguoi) {
          hard.push({
            code: "vi_pham_tranh_dong_nguoi",
            chiTiet: `Hoạt động ${act.id} thường đông người.`,
            duLieu: { id: act.id },
          });
        }
        if (request.tranh.includes("tranh_di_bo_nhieu") && act.diBoNhieu) {
          hard.push({
            code: "vi_pham_tranh_di_bo_nhieu",
            chiTiet: `Hoạt động ${act.id} đòi hỏi đi bộ nhiều.`,
            duLieu: { id: act.id },
          });
        }
      }
    }
  }

  // 4. Ràng buộc thời gian hoạt động ngày 1
  const hoatDongNgay1 = hoatDongTheoNgay[0] || [];
  if (hoatDongNgay1.length > 0 && tDi) {
    const gioHoatDong1Phut = timeToMinutes(GIO_HOAT_DONG_1);
    if (gioDenDiPhut + BUFFER_SAU_KHI_DEN_PHUT > gioHoatDong1Phut) {
      hard.push({
        code: "ngay_dau_den_muon",
        chiTiet: `Đến nơi lúc ${gioDenDiPhut} phút, không kịp tham gia hoạt động thứ nhất.`,
      });
    }
  }

  // 5. Ràng buộc chồng chéo hoạt động trong cùng 1 ngày
  for (let d = 0; d < hoatDongTheoNgay.length; d++) {
    const acts = hoatDongTheoNgay[d];
    if (acts.length >= 2) {
      const act1 = acts[0].act;
      const act1End = timeToMinutes(GIO_HOAT_DONG_1) + act1.thoiLuongPhut;
      const act2Start = timeToMinutes(GIO_HOAT_DONG_2);
      
      if (act1End + BUFFER_GIUA_HOAT_DONG_PHUT > act2Start) {
        hard.push({
          code: "hoat_dong_chong_len",
          chiTiet: `Hoạt động ${act1.id} kết thúc quá trễ, lấn sang hoạt động thứ hai của ngày ${d + 1}.`,
          duLieu: { ngay: d + 1, act1Id: act1.id, act2Id: acts[1].act.id },
        });
      }
    }
  }

  // 6. Ràng buộc thời gian hoạt động ngày cuối
  const hoatDongNgayCuoi = hoatDongTheoNgay[hoatDongTheoNgay.length - 1] || [];
  if (hoatDongNgayCuoi.length > 0 && tVe) {
    const gioVePhut = timeToMinutes(tVe.departureTime);
    for (const { act, gioThucTe } of hoatDongNgayCuoi) {
      if (gioThucTe) {
        const gioBatDauAct = timeToMinutes(gioThucTe);
        if (gioBatDauAct + act.thoiLuongPhut + BUFFER_RA_BEN_PHUT > gioVePhut) {
          hard.push({
            code: "ngay_cuoi_khong_kip",
            chiTiet: `Hoạt động ${act.id} kết thúc quá sát giờ khởi hành chuyến về.`,
            duLieu: { id: act.id },
          });
        }
      }
    }
  }

  return { hard, soft };
}
