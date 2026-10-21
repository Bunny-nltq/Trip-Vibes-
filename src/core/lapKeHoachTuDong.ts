/**
 * src/core/lapKeHoachTuDong.ts
 *
 * Lập kế hoạch dự phòng bằng quy tắc tự động (không gọi AI):
 * - Chọn phương tiện chiều đi, chiều về và khách sạn RẺ NHẤT thỏa điều cần tránh
 *   (dùng chung logic lọc và tính của minBudget).
 * - Bữa ăn dùng giá mặc định.
 * - Lấp hoạt động bằng lapOTrong với ngân sách còn lại.
 * - Nếu ngân sách nhỏ hơn mức tối thiểu thì trả khong_the_dat_ngan_sach.
 */

import type {
  TripRequest,
  Selection,
  Plan,
  Transport,
} from "@/contracts";
import type { PlanData } from "./buildPlan";
import { buildPlan } from "./buildPlan";
import { lapOTrong } from "./lapOTrong";
import {
  DU_TRU_HOAT_DONG_TI_LE,
  AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA,
  NGUOI_MOI_PHONG,
} from "./assumptions";
import { soDemOKhachSan } from "./soDem";
import {
  tinhNganSachToiThieu,
  isTransportValidForAvoidance,
  findCheapestHotel,
  getHotelPricePerNight,
  parseTimeToMinutes,
} from "./minBudget";

export type LapKeHoachTuDongSuccess = Selection & {
  status: "ok";
  khaThi: true;
  selection: Selection;
  plan: Plan;
  tongVND: number;
  theoHangMuc: {
    diChuyen: number;
    choO: number;
    anUong: number;
    vuiChoi: number;
  };
  toiThieuVND: number;
  canhBao: string[];
};

export type LapKeHoachTuDongFailure = {
  status: "khong_the_dat_ngan_sach";
  khaThi: false;
  toiThieuVND: number;
  lyDo?: string;
};

export type LapKeHoachTuDongResult =
  | LapKeHoachTuDongSuccess
  | LapKeHoachTuDongFailure;

export function lapKeHoachTuDong(
  request: TripRequest,
  ungVien: any,
  soNgayInput?: number
): LapKeHoachTuDongResult {
  const soNgay = soNgayInput ?? request.soNgay ?? 3;
  const currentRequest: TripRequest = {
    ...request,
    soNgay,
  };

  // Chuẩn hóa ứng viên thành PlanData
  const planData: PlanData = {
    transports: ungVien.transports ?? [],
    hotels: ungVien.hotels ?? [],
    activities: ungVien.activities ?? [],
    khachSans: ungVien.khachSans,
    quanAns: ungVien.quanAns,
    cafes: ungVien.cafes,
    hoatDongs: ungVien.hoatDongs,
  };

  // 1. Tính ngân sách tối thiểu (dùng cùng logic lọc và tính của minBudget)
  const minBudgetRes = tinhNganSachToiThieu(currentRequest, planData);

  // Ngân sách nhỏ hơn mức tối thiểu hoặc không khả thi
  if (!minBudgetRes.khaThi) {
    return {
      status: "khong_the_dat_ngan_sach",
      khaThi: false,
      toiThieuVND: minBudgetRes.toiThieuVND,
      lyDo: minBudgetRes.lyDo,
    };
  }

  // 2. Lọc phương tiện thỏa mãn điều cần tránh
  const tranhList = currentRequest.tranh ?? [];
  const validDi = planData.transports.filter(
    (t) => t.huong === "di" && isTransportValidForAvoidance(t, tranhList)
  );
  const validVe = planData.transports.filter(
    (t) => t.huong === "ve" && isTransportValidForAvoidance(t, tranhList)
  );

  if (validDi.length === 0 || validVe.length === 0) {
    return {
      status: "khong_the_dat_ngan_sach",
      khaThi: false,
      toiThieuVND: minBudgetRes.toiThieuVND,
      lyDo: "khong_co_phuong_tien_phu_hop",
    };
  }

  // 3. Khách sạn
  const hotelList =
    planData.khachSans && planData.khachSans.length > 0
      ? planData.khachSans
      : planData.hotels && planData.hotels.length > 0
      ? planData.hotels
      : [];

  if (hotelList.length === 0) {
    return {
      status: "khong_the_dat_ngan_sach",
      khaThi: false,
      toiThieuVND: minBudgetRes.toiThieuVND,
      lyDo: "khong_co_khach_san",
    };
  }

  const soNguoi = currentRequest.soNguoi ?? 2;
  const soPhong = Math.ceil(soNguoi / NGUOI_MOI_PHONG);
  const ngansachTongVND = currentRequest.ngansachTongVND ?? 0;
  const nguongDuTru =
    ngansachTongVND > 0
      ? ngansachTongVND * (1 - DU_TRU_HOAT_DONG_TI_LE)
      : Infinity;

  // Thu thập mọi tổ hợp (tDi, tVe, ks) thỏa mãn ràng buộc (1 <= soDem)
  const combos: Array<{
    tDi: Transport;
    tVe: Transport;
    hotel: any;
    chiPhiCoDinh: number;
    thoiLuong: number;
    index: number;
  }> = [];

  let idx = 0;
  for (const tDi of validDi) {
    const depDi = parseTimeToMinutes(tDi.departureTime);
    const gioDenTuyetDoi = depDi + tDi.durationMinutes;
    const soDem = soDemOKhachSan(soNgay, gioDenTuyetDoi);
    if (soDem < 1) continue;

    for (const tVe of validVe) {
      for (const hotel of hotelList) {
        const giaDem = getHotelPricePerNight(hotel);
        const chiPhiCoDinh =
          (tDi.pricePerPerson + tVe.pricePerPerson) * soNguoi +
          giaDem * soDem * soPhong +
          AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA * 2 * soNguoi * soNgay;
        const thoiLuong = tDi.durationMinutes + tVe.durationMinutes;

        combos.push({
          tDi,
          tVe,
          hotel,
          chiPhiCoDinh,
          thoiLuong,
          index: idx++,
        });
      }
    }
  }

  if (combos.length === 0) {
    return {
      status: "khong_the_dat_ngan_sach",
      khaThi: false,
      toiThieuVND: minBudgetRes.toiThieuVND,
      lyDo: "khong_co_phuong_tien_phu_hop",
    };
  }

  // Nhóm 1: các tổ hợp có chiPhiCoDinh <= nguongDuTru
  const nhom1 = combos.filter((c) => c.chiPhiCoDinh <= nguongDuTru);

  let selectedCombo: (typeof combos)[0] | undefined;

  if (nhom1.length > 0) {
    // Sắp xếp nhóm 1: thoiLuong nhỏ nhất -> chiPhiCoDinh nhỏ nhất -> thứ tự ban đầu
    nhom1.sort((a, b) => {
      if (a.thoiLuong !== b.thoiLuong) {
        return a.thoiLuong - b.thoiLuong;
      }
      if (a.chiPhiCoDinh !== b.chiPhiCoDinh) {
        return a.chiPhiCoDinh - b.chiPhiCoDinh;
      }
      return a.index - b.index;
    });
    selectedCombo = nhom1[0];
  } else {
    // Nhóm 2 (khi nhóm 1 rỗng): các tổ hợp có chiPhiCoDinh <= ngansachTongVND
    const nhom2 = combos.filter((c) =>
      ngansachTongVND > 0 ? c.chiPhiCoDinh <= ngansachTongVND : true
    );
    if (nhom2.length > 0) {
      // Sắp xếp nhóm 2: chiPhiCoDinh nhỏ nhất -> thứ tự ban đầu
      nhom2.sort((a, b) => {
        if (a.chiPhiCoDinh !== b.chiPhiCoDinh) {
          return a.chiPhiCoDinh - b.chiPhiCoDinh;
        }
        return a.index - b.index;
      });
      selectedCombo = nhom2[0];
    }
  }

  if (!selectedCombo) {
    return {
      status: "khong_the_dat_ngan_sach",
      khaThi: false,
      toiThieuVND: minBudgetRes.toiThieuVND,
      lyDo: minBudgetRes.lyDo ?? "ngan_sach_khong_du",
    };
  }

  // 4. Khởi tạo Selection cơ bản từ combo được chọn
  const hoatDongTheoNgay: string[][] = Array.from({ length: soNgay }, () => []);
  const baseSelection: Selection = {
    transportDiId: selectedCombo.tDi.id,
    transportVeId: selectedCombo.tVe.id,
    hotelId: selectedCombo.hotel.id,
    hoatDongTheoNgay,
  };

  // 5. Xây dựng kế hoạch nền để xác định số tiền còn lại
  const baseBuild = buildPlan(currentRequest, baseSelection, planData);
  if (!baseBuild.ok) {
    return {
      status: "khong_the_dat_ngan_sach",
      khaThi: false,
      toiThieuVND: minBudgetRes.toiThieuVND,
      lyDo: baseBuild.loi.join("; "),
    };
  }

  // 6. Lấp hoạt động bằng lapOTrong với ngân sách còn lại
  const availableActivities =
    planData.hoatDongs && planData.hoatDongs.length > 0
      ? planData.hoatDongs
      : planData.activities;

  const lapRes = lapOTrong(
    baseSelection,
    baseBuild.plan,
    availableActivities,
    currentRequest,
    planData.transports
  );

  const finalSelection = lapRes.selection;
  const finalBuild = buildPlan(currentRequest, finalSelection, planData);

  if (!finalBuild.ok) {
    return {
      status: "khong_the_dat_ngan_sach",
      khaThi: false,
      toiThieuVND: minBudgetRes.toiThieuVND,
      lyDo: finalBuild.loi.join("; "),
    };
  }

  const plan = finalBuild.plan;
  const canhBao = [...plan.canhBao];
  for (const cb of lapRes.canhBao) {
    if (!canhBao.includes(cb)) {
      canhBao.push(cb);
    }
  }
  plan.canhBao = canhBao;

  const theoHangMuc = {
    diChuyen: plan.tongKet.theoHangMuc["Di chuyển"] ?? 0,
    choO: plan.tongKet.theoHangMuc["Chỗ ở"] ?? 0,
    anUong: plan.tongKet.theoHangMuc["Ăn uống"] ?? 0,
    vuiChoi: plan.tongKet.theoHangMuc["Vui chơi"] ?? 0,
  };

  return {
    ...finalSelection,
    status: "ok",
    khaThi: true,
    selection: finalSelection,
    plan,
    tongVND: plan.tongKet.tongVND,
    theoHangMuc,
    toiThieuVND: minBudgetRes.toiThieuVND,
    canhBao,
  };
}
