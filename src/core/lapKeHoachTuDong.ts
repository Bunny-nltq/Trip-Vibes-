import {isDiningVenue, uniqueNamedOsmVenues} from "./venueDiscovery";
import {budgetIncludingReserve, spendingLimit} from "./travelRequest";
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
  ECONOMY_COMBO_LIMIT,
  AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA,
  NGUOI_MOI_PHONG,
} from "./assumptions";
import { soDemOKhachSan } from "./soDem";
import { tinhNganSachToiThieu, isTransportValidForAvoidance, getHotelPricePerNight, parseTimeToMinutes } from "./minBudget";

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
    quanAns: ungVien.quanAns?.filter(isDiningVenue),
    cafes: ungVien.cafes,
    hoatDongs: ungVien.hoatDongs,
  };

  // 1. Tính ngân sách tối thiểu (dùng cùng logic lọc và tính của minBudget)
  const minBudgetRes = tinhNganSachToiThieu(currentRequest, planData);

  // Ngân sách nhỏ hơn mức tối thiểu hoặc không khả thi
  if (!minBudgetRes.khaThi && (currentRequest.reservePercent !== undefined || minBudgetRes.lyDo !== "ngan_sach_khong_du")) {
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
  const ngansachTongVND = spendingLimit(currentRequest);
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
    if (soDem < 1 && soNgay > 1) continue;

    for (const tVe of validVe) {
      if (soNgay === 1 && gioDenTuyetDoi >= parseTimeToMinutes(tVe.departureTime)) continue;
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

  const cheapestCombos = [...combos].sort((a, b) =>
    a.chiPhiCoDinh - b.chiPhiCoDinh || a.thoiLuong - b.thoiLuong
  );
  const cheapestMeal = (planData.quanAns ?? [])
    .filter(place => place.giaUocTinhNguoi != null)
    .reduce<NonNullable<PlanData["quanAns"]>[number] | undefined>((best, place) =>
      !best || place.giaUocTinhNguoi! < best.giaUocTinhNguoi! ? place : best, undefined);
  const mealId = cheapestMeal?.id ?? null;
  const meals = planData.quanAns ?? [];
  const notes = request.ghiChu.join(" ");
  const wantsCafe = /cà phê|cafe|coffee|chill/i.test(notes);
  const wantsLakesideCafe = wantsCafe && /bờ hồ|ven hồ|gần hồ|view hồ/i.test(notes);
  const cafes = [...(planData.cafes ?? [])];
  if (wantsLakesideCafe) {
    const lakeMatch = (place: (typeof cafes)[number]) =>
      /ven hồ|bờ hồ|hồ tây|hồ trúc bạch|bờ kè trúc bạch|hồ hoàn kiếm/i.test(`${place.ten} ${place.diaChi ?? ""}`);
    cafes.sort((a, b) => Number(lakeMatch(b)) - Number(lakeMatch(a)));
  }

  function makeSelection(combo: (typeof combos)[number], economy: boolean): Selection {
    return {
      transportDiId: combo.tDi.id,
      transportVeId: combo.tVe.id,
      hotelId: combo.hotel.id,
      hoatDongTheoNgay: Array.from({ length: soNgay }, () => []),
      buaAnTheoNgay: Array.from({ length: soNgay }, (_, day) => ({
        trua: economy ? mealId : meals[(day * 2) % meals.length]?.id ?? null,
        toi: economy ? mealId : meals[(day * 2 + 1) % meals.length]?.id ?? null,
        cafe: !economy && (wantsCafe || request.travelDates) ? cafes[day % cafes.length]?.id ?? null : null,
      })),
    };
  }

  const preferred = selectedCombo ? makeSelection(selectedCombo, false) : null;
  const preferredBuild = preferred ? buildPlan(currentRequest, preferred, planData) : null;
  let base = preferred && preferredBuild?.ok && preferredBuild.plan.tongKet.tongVND <= ngansachTongVND
    ? { selection: preferred, plan: preferredBuild.plan }
    : null;
  let lowestEstimate = Infinity;
  if (!base) {
    for (const combo of cheapestCombos.slice(0, ECONOMY_COMBO_LIMIT)) {
      const selection = makeSelection(combo, true);
      const built = buildPlan(currentRequest, selection, planData);
      if (!built.ok) continue;
      const cost = built.plan.tongKet.tongVND;
      if (cost >= lowestEstimate) continue;
      lowestEstimate = cost;
      if (cost <= ngansachTongVND) base = { selection, plan: built.plan };
    }
  }

  if (!base) {
    return {
      status: "khong_the_dat_ngan_sach",
      khaThi: false,
      toiThieuVND: Number.isFinite(lowestEstimate)
        ? budgetIncludingReserve(lowestEstimate, currentRequest.reservePercent)
        : minBudgetRes.toiThieuVND,
      lyDo: minBudgetRes.lyDo ?? "ngan_sach_khong_du",
    };
  }

  if ((wantsCafe || request.travelDates) && cafes.length && !base.plan.items.some(item => item.experienceType === "cafe")) {
    const firstCafe = cafes[0];
    for (let day = 0; day < soNgay; day++) {
      const selection: Selection = {
        ...base.selection,
        buaAnTheoNgay: base.selection.buaAnTheoNgay?.map((meal, index) =>
          index === day ? { ...meal, cafe: firstCafe.id } : meal
        ),
      };
      const built = buildPlan(currentRequest, selection, planData);
      if (built.ok && built.plan.tongKet.tongVND <= ngansachTongVND &&
          built.plan.items.some(item => item.experienceType === "cafe")) {
        base = { selection, plan: built.plan };
        break;
      }
    }
  }

  const availableActivities = uniqueNamedOsmVenues<PlanData["activities"][number] | NonNullable<PlanData["hoatDongs"]>[number]>(
    planData.hoatDongs?.length ? planData.hoatDongs : planData.activities
  );
  const lapRes = lapOTrong(
    base.selection,
    base.plan,
    availableActivities,
    currentRequest,
    planData.transports
  );
  // Tính lại cả di chuyển nội vùng. Khi vượt trần, giữ phần đầu của các hoạt động
  // đã xếp rồi thử lại với số điểm giảm dần.
  let finalSelection = base.selection;
  let plan = base.plan;
  const activityCount = lapRes.selection.hoatDongTheoNgay.flat().length;
  let kept = activityCount;
  while (kept > 0) {
    let slots = kept;
    const selection: Selection = {
      ...lapRes.selection,
      hoatDongTheoNgay: lapRes.selection.hoatDongTheoNgay.map(day => {
        const items = day.slice(0, slots);
        slots -= items.length;
        return items;
      }),
    };
    const built = buildPlan(currentRequest, selection, planData);
    if (built.ok && built.plan.tongKet.tongVND <= ngansachTongVND) {
      finalSelection = selection;
      plan = built.plan;
      break;
    }
    kept = Math.floor(kept / 2);
  }
  const canhBao = [...plan.canhBao];
  for (const cb of lapRes.canhBao) {
    if (!canhBao.includes(cb)) {
      canhBao.push(cb);
    }
  }
  if (kept < activityCount) canhBao.push("Đã giảm hoạt động tùy chọn để giữ chi phí trong ngân sách.");
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
    toiThieuVND: Math.min(
      minBudgetRes.toiThieuVND,
      budgetIncludingReserve(base.plan.tongKet.tongVND, currentRequest.reservePercent)
    ),
    canhBao,
  };
}
