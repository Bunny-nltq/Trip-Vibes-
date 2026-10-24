/**
 * src/core/lapOTrong.ts
 *
 * Hàm thuần lấp các ô khả dụng còn trống theo thứ tự ngày rồi ô:
 * - Chọn ứng viên theo: khopSoThich giảm dần, rồi tổng tiền tăng dần, rồi id tăng dần.
 * - Bỏ qua ứng viên: đã dùng, vi phạm điều cần tránh (dongNguoi, diBoNhieu),
 *   vượt ngân sách còn lại, hoặc không kịp giờ:
 *     + Ô thứ hai của ngày: hoạt động thứ nhất phải có thoiLuong <= 330 phút.
 *     + Ô ngày cuối: 570 + thoiLuong + 120 <= giờ khởi hành chiều về.
 * - Không đủ điều kiện thì để trống và thêm cảnh báo nhẹ "o_trong_do_rang_buoc".
 */

import type {
  Selection,
  Plan,
  TripRequest,
  HoatDong,
  Activity,
  Transport,
} from "@/contracts";
import { BUFFER_RA_BEN_PHUT } from "./assumptions";
import { tinhOKhaDungTheoNgay } from "./oKhaDung";

const GIO_HOAT_DONG_1_PHUT = 570; // 09:30

export interface LapOTrongResult {
  selection: Selection;
  daLap: boolean;
  canhBao: string[];
}

function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function getGiaNguoi(item: HoatDong | Activity): number {
  if ("giaVeNguoi" in item && typeof item.giaVeNguoi === "number") {
    return item.giaVeNguoi;
  }
  if ("gia" in item && typeof item.gia === "number") {
    return item.gia;
  }
  if ("giaUocTinhNguoi" in item && typeof item.giaUocTinhNguoi === "number") {
    return item.giaUocTinhNguoi;
  }
  return 0;
}

function getThoiLuong(item: HoatDong | Activity): number {
  if ("thoiLuongPhut" in item && typeof item.thoiLuongPhut === "number") {
    return item.thoiLuongPhut;
  }
  if ("thoiLuong" in item && typeof item.thoiLuong === "number") {
    return item.thoiLuong;
  }
  return 90;
}

export function lapOTrong(
  selection: Selection,
  plan: Plan,
  ungVien: (HoatDong | Activity)[],
  request: TripRequest,
  transports?: Transport[]
): LapOTrongResult {
  const soNgay = request.soNgay ?? 3;
  const soNguoi = request.soNguoi ?? 2;
  let conLaiVND = plan.tongKet.conLaiVND;

  // 1. Xác định giờ đến ngày 1 và giờ về ngày cuối
  let gioDenPhutNgay1 = 475; // default 07:55
  let gioKhoiHanhVePhut = 1080; // default 18:00

  const diItem = plan.items.find(
    (it) => it.hangMuc === "Di chuyển" && it.ngay === 1
  );
  const veItem = plan.items.find(
    (it) => it.hangMuc === "Di chuyển" && it.ngay === soNgay
  );

  const transportList: Transport[] =
    transports ??
    (plan as any)?.transports ??
    [];

  const tDi = transportList.find(
    (t) => t.id === selection.transportDiId || t.id === diItem?.refId
  );
  const tVe = transportList.find(
    (t) => t.id === selection.transportVeId || t.id === veItem?.refId
  );

  if (tDi) {
    const dep = parseTimeToMinutes(tDi.departureTime) ?? 420;
    gioDenPhutNgay1 = dep + tDi.durationMinutes;
  } else if ((plan as any)?.gioDenPhutNgay1 != null) {
    gioDenPhutNgay1 = Number((plan as any).gioDenPhutNgay1);
  } else if ((plan as any)?.gioDenNgay1Phut != null) {
    gioDenPhutNgay1 = Number((plan as any).gioDenNgay1Phut);
  } else if (diItem?.gio) {
    const dep = parseTimeToMinutes(diItem.gio);
    const dur = (diItem as any).thoiLuongPhut ?? (diItem as any).durationMinutes ?? 120;
    if (dep !== null) {
      gioDenPhutNgay1 = dep + dur;
    }
  }

  if (tVe) {
    const dep = parseTimeToMinutes(tVe.departureTime);
    if (dep !== null) {
      gioKhoiHanhVePhut = dep;
    }
  } else if (veItem?.gio) {
    const dep = parseTimeToMinutes(veItem.gio);
    if (dep !== null) {
      gioKhoiHanhVePhut = dep;
    }
  }

  // 2. Xác định số ô khả dụng từng ngày
  const oKhaDungTheoNgay = tinhOKhaDungTheoNgay(
    soNgay,
    gioDenPhutNgay1,
    gioKhoiHanhVePhut
  );

  // 3. Khởi tạo mảng hoạt động
  const hoatDongTheoNgay: string[][] = [];
  for (let d = 0; d < soNgay; d++) {
    const arr = selection.hoatDongTheoNgay?.[d] ? [...selection.hoatDongTheoNgay[d]] : [];
    hoatDongTheoNgay.push(arr);
  }

  const usedIds = new Set<string>();
  for (const arr of hoatDongTheoNgay) {
    for (const id of arr) {
      usedIds.add(id);
    }
  }

  const sothichUser = request.sothich || [];
  const tranhDongNguoi = (request.tranh || []).some(
    (t) => (t as string) === "dong_nguoi" || t === "tranh_dong_nguoi"
  );
  const tranhDiBoNhieu = (request.tranh || []).some(
    (t) => (t as string) === "di_bo_nhieu" || t === "tranh_di_bo_nhieu"
  );

  function tinhKhopSoThich(item: HoatDong | Activity): number {
    if (sothichUser.length === 0) return 0;
    const nhan = "nhan" in item ? item.nhan : (item as any).tags || [];
    let count = 0;
    for (const st of sothichUser) {
      if (nhan.includes(st)) count++;
    }
    return count;
  }

  function viPhamTranh(item: HoatDong | Activity): boolean {
    if (tranhDongNguoi && item.dongNguoi) return true;
    if (tranhDiBoNhieu && item.diBoNhieu) return true;
    return false;
  }

  let daLap = false;
  let coOTrongDoRangBuoc = false;

  // 4. Lần lượt lấp các ô khả dụng còn trống theo thứ tự ngày rồi ô
  for (let d = 1; d <= soNgay; d++) {
    const soOKD = oKhaDungTheoNgay[d - 1];
    const currentHds = hoatDongTheoNgay[d - 1];

    for (let slot = 0; slot < soOKD; slot++) {
      if (currentHds[slot]) {
        // Ô này đã có hoạt động
        continue;
      }

      // Ô này đang trống, tìm ứng viên phù hợp
      const candidates = ungVien.filter((item) => {
        // Chưa dùng
        if (usedIds.has(item.id)) return false;
        // Vi phạm điều cần tránh
        if (viPhamTranh(item)) return false;

        // Vượt ngân sách còn lại
        const cost = getGiaNguoi(item) * soNguoi;
        if (cost > conLaiVND) return false;

        const dur = getThoiLuong(item);

        // Ràng buộc giờ giấc:
        // a) Ô thứ hai của ngày: hoạt động thứ nhất phải có thoiLuong <= 330 phút
        if (slot === 1) {
          const firstHdId = currentHds[0];
          const firstItem = ungVien.find((u) => u.id === firstHdId);
          if (firstItem && getThoiLuong(firstItem) > 330) {
            return false;
          }
        }

        // b) Ô ngày cuối: 570 + thoiLuong + 120 <= giờ khởi hành chiều về
        if (d === soNgay) {
          if (GIO_HOAT_DONG_1_PHUT + dur + BUFFER_RA_BEN_PHUT > gioKhoiHanhVePhut) {
            return false;
          }
        }

        return true;
      });

      if (candidates.length === 0) {
        // Không có ứng viên nào vừa điều kiện
        coOTrongDoRangBuoc = true;
        continue;
      }

      // Sắp xếp: khopSoThich giảm dần -> tổng tiền tăng dần -> id tăng dần
      candidates.sort((a, b) => {
        const matchA = tinhKhopSoThich(a);
        const matchB = tinhKhopSoThich(b);
        if (matchB !== matchA) {
          return matchB - matchA;
        }

        const costA = getGiaNguoi(a) * soNguoi;
        const costB = getGiaNguoi(b) * soNguoi;
        if (costA !== costB) {
          return costA - costB;
        }

        return a.id.localeCompare(b.id);
      });

      const chosen = candidates[0];
      currentHds.push(chosen.id);
      usedIds.add(chosen.id);
      conLaiVND -= getGiaNguoi(chosen) * soNguoi;
      daLap = true;
    }
  }

  const canhBao: string[] = [];
  if (coOTrongDoRangBuoc) {
    canhBao.push("o_trong_do_rang_buoc");
  }

  return {
    selection: {
      ...selection,
      hoatDongTheoNgay,
    },
    daLap,
    canhBao,
  };
}
