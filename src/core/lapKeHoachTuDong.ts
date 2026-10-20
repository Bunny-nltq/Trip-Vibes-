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
} from "@/contracts";
import type { PlanData } from "./buildPlan";
import { buildPlan } from "./buildPlan";
import { lapOTrong } from "./lapOTrong";
import {
  tinhNganSachToiThieu,
  isTransportValidForAvoidance,
  findCheapestHotel,
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

  // 2. Lọc phương tiện rẻ nhất thỏa mãn điều cần tránh
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

  const minDi = validDi.reduce(
    (min, curr) => (curr.pricePerPerson < min.pricePerPerson ? curr : min),
    validDi[0]
  );
  const minVe = validVe.reduce(
    (min, curr) => (curr.pricePerPerson < min.pricePerPerson ? curr : min),
    validVe[0]
  );

  // 3. Khách sạn rẻ nhất
  const cheapestHotel = findCheapestHotel(planData);
  if (!cheapestHotel) {
    return {
      status: "khong_the_dat_ngan_sach",
      khaThi: false,
      toiThieuVND: minBudgetRes.toiThieuVND,
      lyDo: "khong_co_khach_san",
    };
  }

  // 4. Khởi tạo Selection cơ bản
  const hoatDongTheoNgay: string[][] = Array.from({ length: soNgay }, () => []);
  const baseSelection: Selection = {
    transportDiId: minDi.id,
    transportVeId: minVe.id,
    hotelId: cheapestHotel.hotelId,
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
