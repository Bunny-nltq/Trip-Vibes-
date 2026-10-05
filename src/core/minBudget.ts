import type { TripRequest, Transport, Hotel } from "@/contracts";
import type { PlanData } from "./buildPlan";
import { calculateTransportFlags } from "./flags";
import { AN_UONG_MOI_NGUOI_MOI_NGAY, NGUOI_MOI_PHONG } from "./assumptions";

export interface MinBudgetResult {
  khaThi: boolean;
  toiThieuVND: number;
  combo?: {
    transportDiId: string;
    transportVeId: string;
    hotelId: string;
  };
  lyDo?: string;
}

export function tinhNganSachToiThieu(
  request: TripRequest,
  data: PlanData
): MinBudgetResult {
  const soNguoi = request.soNguoi ?? 2;
  const soNgay = request.soNgay ?? 3;
  const soDem = Math.max(1, soNgay - 1);
  const soPhong = Math.ceil(soNguoi / NGUOI_MOI_PHONG);
  const ngansach = request.ngansachTongVND ?? 0;

  // 1. Lọc phương tiện
  let validDi = data.transports.filter((t) => t.huong === "di");
  let validVe = data.transports.filter((t) => t.huong === "ve");

  function isValidTransport(t: Transport): boolean {
    const flags = calculateTransportFlags(t.departureTime, t.durationMinutes);
    if (request.tranh.includes("khong_day_som") && (flags.khoiHanhSom || flags.denSom)) return false;
    if (request.tranh.includes("khong_di_dem") && flags.diDem) return false;
    if (request.tranh.includes("tranh_di_chuyen_lau") && flags.diChuyenLau) return false;
    return true;
  }

  validDi = validDi.filter(isValidTransport);
  validVe = validVe.filter(isValidTransport);

  if (validDi.length === 0 || validVe.length === 0) {
    return {
      khaThi: false,
      toiThieuVND: 0,
      lyDo: "khong_co_phuong_tien_phu_hop",
    };
  }

  // Lấy phương tiện rẻ nhất
  const minDi = validDi.reduce((min, curr) => (curr.pricePerPerson < min.pricePerPerson ? curr : min), validDi[0]);
  const minVe = validVe.reduce((min, curr) => (curr.pricePerPerson < min.pricePerPerson ? curr : min), validVe[0]);

  // Khách sạn rẻ nhất
  if (data.hotels.length === 0) {
    return { khaThi: false, toiThieuVND: 0, lyDo: "khong_co_khach_san" };
  }
  const minHotel = data.hotels.reduce((min, curr) => (curr.pricePerNight < min.pricePerNight ? curr : min), data.hotels[0]);

  const chiPhiDi = minDi.pricePerPerson * soNguoi;
  const chiPhiVe = minVe.pricePerPerson * soNguoi;
  const chiPhiKhachSan = minHotel.pricePerNight * soDem * soPhong;
  const chiPhiAnUong = AN_UONG_MOI_NGUOI_MOI_NGAY * soNguoi * soNgay;

  const toiThieuVND = chiPhiDi + chiPhiVe + chiPhiKhachSan + chiPhiAnUong;
  const combo = {
    transportDiId: minDi.id,
    transportVeId: minVe.id,
    hotelId: minHotel.id,
  };

  if (ngansach > 0 && toiThieuVND > ngansach) {
    return {
      khaThi: false,
      toiThieuVND,
      combo,
      lyDo: "ngan_sach_khong_du",
    };
  }

  return {
    khaThi: true,
    toiThieuVND,
    combo,
  };
}
