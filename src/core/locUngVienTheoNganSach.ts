/**
 * src/core/locUngVienTheoNganSach.ts
 *
 * Hàm thuần lọc ứng viên theo ngân sách (Bước 14):
 * - Tái sử dụng logic lọc và tính chi phí của minBudget/lapKeHoachTuDong, không viết lặp.
 * - Một ứng viên được GIỮ nếu nó nằm trong ít nhất MỘT tổ hợp (chiều đi, chiều về, khách sạn)
 *   thỏa điều cần tránh và có tổng chi phí cố định (Di chuyển + Chỗ ở + Ăn uống mặc định) <= ngân sách.
 * - Không có tổ hợp nào thì khaThi = false (và toiThieuVND là mức thấp nhất, giống minBudget).
 * - Giữ nguyên thứ tự đầu vào.
 */

import type { TripRequest, Transport, Hotel } from "@/contracts";
import {
  isTransportValidForAvoidance,
  getHotelPricePerNight,
} from "./minBudget";
import {
  AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA,
  NGUOI_MOI_PHONG,
} from "./assumptions";
import { soDemOKhachSan } from "./soDem";

export interface LocUngVienResult<
  TTransport = Transport,
  THotel extends { id: string } = any
> {
  phuongTienDi: TTransport[];
  phuongTienVe: TTransport[];
  khachSan: THotel[];
  toiThieuVND: number;
  khaThi: boolean;
}

export function locUngVienTheoNganSach<
  TTransport extends Transport = Transport,
  THotel extends { id: string } = any
>(
  request: TripRequest,
  ungVien: {
    transports?: TTransport[];
    hotels?: any[];
    khachSans?: any[];
    [key: string]: any;
  }
): LocUngVienResult<TTransport, THotel> {
  const soNguoi = request.soNguoi ?? 2;
  const soNgay = request.soNgay ?? 3;
  const soPhong = Math.ceil(soNguoi / NGUOI_MOI_PHONG);
  const ngansachTongVND = request.ngansachTongVND ?? 0;
  const tranhList = request.tranh ?? [];

  const allTransports = ungVien.transports ?? [];
  const rawDi = allTransports.filter((t) => t.huong === "di");
  const rawVe = allTransports.filter((t) => t.huong === "ve");

  // Danh sách khách sạn (hỗ trợ cả ungVien.khachSans hoặc ungVien.hotels)
  const rawHotels: THotel[] = (ungVien.khachSans && ungVien.khachSans.length > 0)
    ? ungVien.khachSans
    : (ungVien.hotels ?? []);

  // Lọc theo điều cần tránh (tranh)
  const validDi = rawDi.filter((t) => isTransportValidForAvoidance(t, tranhList));
  const validVe = rawVe.filter((t) => isTransportValidForAvoidance(t, tranhList));
  const validHotels = rawHotels; // Khách sạn hiện không bị ràng buộc bởi tranhList

  // Chi phí ăn uống mặc định cố định: 2 bữa/ngày/người
  const chiPhiAnUong =
    AN_UONG_MAC_DINH_MOI_NGUOI_MOI_BUA * 2 * soNguoi * soNgay;

  // Tính chi phí cố định cho từng tổ hợp và tìm mức tối thiểu
  let minCost = Infinity;
  const validDiIds = new Set<string>();
  const validVeIds = new Set<string>();
  const validHotelIds = new Set<string>();

  function parseTimeToMinutes(timeStr?: string): number {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  for (const di of validDi) {
    const depDiPhut = parseTimeToMinutes(di.departureTime);
    const gioDenTuyetDoi = depDiPhut + (di.durationMinutes || 0);
    const soDem = soDemOKhachSan(soNgay, gioDenTuyetDoi);
    if (soDem < 1) continue; // Tổ hợp có 0 đêm: không khả thi, bỏ qua

    const costDi = di.pricePerPerson * soNguoi;
    for (const ve of validVe) {
      const costVe = ve.pricePerPerson * soNguoi;
      for (const h of validHotels) {
        const giaDem = getHotelPricePerNight(h);
        const costHotel = giaDem * soDem * soPhong;
        const totalFixedCost = costDi + costVe + costHotel + chiPhiAnUong;

        if (totalFixedCost < minCost) {
          minCost = totalFixedCost;
        }

        if (ngansachTongVND > 0 && totalFixedCost <= ngansachTongVND) {
          validDiIds.add(di.id);
          validVeIds.add(ve.id);
          validHotelIds.add(h.id);
        }
      }
    }
  }

  const toiThieuVND = minCost === Infinity ? 0 : minCost;

  // Nếu không có tổ hợp nào vừa ngân sách (hoặc không có tổ hợp hợp lệ)
  if (
    validDiIds.size === 0 ||
    validVeIds.size === 0 ||
    validHotelIds.size === 0 ||
    (ngansachTongVND > 0 && toiThieuVND > ngansachTongVND)
  ) {
    return {
      phuongTienDi: [],
      phuongTienVe: [],
      khachSan: [],
      toiThieuVND,
      khaThi: false,
    };
  }

  // Giữ nguyên thứ tự đầu vào của rawDi, rawVe, rawHotels
  const phuongTienDi = rawDi.filter((t) => validDiIds.has(t.id));
  const phuongTienVe = rawVe.filter((t) => validVeIds.has(t.id));
  const khachSan = rawHotels.filter((h) => validHotelIds.has(h.id));

  return {
    phuongTienDi,
    phuongTienVe,
    khachSan,
    toiThieuVND,
    khaThi: true,
  };
}
