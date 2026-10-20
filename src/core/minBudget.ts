import type { TripRequest, Transport, Hotel } from "@/contracts";
import type { PlanData } from "./buildPlan";
import { calculateTransportFlags } from "./flags";
import {
  AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA,
  NGUOI_MOI_PHONG,
  HOTEL_GIA_MAC_DINH,
  HOTEL_GIA_THEO_SAO,
} from "./assumptions";

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

export function isTransportValidForAvoidance(
  t: Transport,
  tranh: string[]
): boolean {
  const flags = calculateTransportFlags(t.departureTime, t.durationMinutes);
  const tranhDaySom = tranh.includes("khong_day_som") || tranh.includes("sang");
  const tranhDiDem = tranh.includes("khong_di_dem") || tranh.includes("dem");
  const tranhDiChuyenLau =
    tranh.includes("tranh_di_chuyen_lau") || tranh.includes("lau");

  if (tranhDaySom && (flags.khoiHanhSom || flags.denSom)) return false;
  if (tranhDiDem && flags.diDem) return false;
  if (tranhDiChuyenLau && flags.diChuyenLau) return false;
  return true;
}

export function getHotelPricePerNight(h: Hotel | any): number {
  if ("pricePerNight" in h && typeof h.pricePerNight === "number") {
    return h.pricePerNight;
  }
  if (h.khoangGiaDemVND) {
    return Math.round((h.khoangGiaDemVND.min + h.khoangGiaDemVND.max) / 2);
  }
  if (h.giaUocTinhNguoi !== null && h.giaUocTinhNguoi !== undefined) {
    return h.giaUocTinhNguoi;
  }
  const sao = h.soSao;
  return sao !== null && sao !== undefined && HOTEL_GIA_THEO_SAO[sao] !== undefined
    ? HOTEL_GIA_THEO_SAO[sao]
    : HOTEL_GIA_MAC_DINH;
}

export function findCheapestHotel(data: {
  hotels?: Hotel[];
  khachSans?: any[];
}): { hotelId: string; minGiaDem: number } | null {
  if (data.khachSans && data.khachSans.length > 0) {
    let cheapest = Infinity;
    let minGiaDem = HOTEL_GIA_MAC_DINH;
    let minHotelId = data.khachSans[0].id;
    for (const ks of data.khachSans) {
      const giaDem = getHotelPricePerNight(ks);
      if (giaDem < cheapest) {
        cheapest = giaDem;
        minGiaDem = giaDem;
        minHotelId = ks.id;
      }
    }
    return { hotelId: minHotelId, minGiaDem };
  }
  if (data.hotels && data.hotels.length > 0) {
    let cheapest = Infinity;
    let minGiaDem = HOTEL_GIA_MAC_DINH;
    let minHotelId = data.hotels[0].id;
    for (const h of data.hotels) {
      const giaDem = h.pricePerNight;
      if (giaDem < cheapest) {
        cheapest = giaDem;
        minGiaDem = giaDem;
        minHotelId = h.id;
      }
    }
    return { hotelId: minHotelId, minGiaDem };
  }
  return null;
}

export function tinhNganSachToiThieu(
  request: TripRequest,
  data: PlanData
): MinBudgetResult {
  const soNguoi = request.soNguoi ?? 2;
  const soNgay = request.soNgay ?? 3;
  const soDem = soNgay - 1;
  const soPhong = Math.ceil(soNguoi / NGUOI_MOI_PHONG);
  const ngansach = request.ngansachTongVND ?? 0;

  // 1. Lọc phương tiện
  const tranhList = request.tranh ?? [];
  const validDi = data.transports.filter(
    (t) => t.huong === "di" && isTransportValidForAvoidance(t, tranhList)
  );
  const validVe = data.transports.filter(
    (t) => t.huong === "ve" && isTransportValidForAvoidance(t, tranhList)
  );

  if (validDi.length === 0 || validVe.length === 0) {
    return {
      khaThi: false,
      toiThieuVND: 0,
      lyDo: "khong_co_phuong_tien_phu_hop",
    };
  }

  // Lấy phương tiện rẻ nhất
  const minDi = validDi.reduce(
    (min, curr) => (curr.pricePerPerson < min.pricePerPerson ? curr : min),
    validDi[0]
  );
  const minVe = validVe.reduce(
    (min, curr) => (curr.pricePerPerson < min.pricePerPerson ? curr : min),
    validVe[0]
  );

  // Khách sạn rẻ nhất
  const cheapestHotel = findCheapestHotel(data);
  if (!cheapestHotel) {
    return { khaThi: false, toiThieuVND: 0, lyDo: "khong_co_khach_san" };
  }
  const { minHotelId, minGiaDem } = {
    minHotelId: cheapestHotel.hotelId,
    minGiaDem: cheapestHotel.minGiaDem,
  };

  const chiPhiDi = minDi.pricePerPerson * soNguoi;
  const chiPhiVe = minVe.pricePerPerson * soNguoi;
  const chiPhiKhachSan = minGiaDem * soDem * soPhong;
  // Ăn uống: 2 bữa/ngày/người
  const chiPhiAnUong = AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA * 2 * soNguoi * soNgay;

  const toiThieuVND = chiPhiDi + chiPhiVe + chiPhiKhachSan + chiPhiAnUong;
  const combo = {
    transportDiId: minDi.id,
    transportVeId: minVe.id,
    hotelId: minHotelId,
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
