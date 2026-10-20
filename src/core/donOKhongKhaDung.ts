/**
 * src/core/donOKhongKhaDung.ts
 *
 * Tự động gỡ hoạt động khỏi các ô không khả dụng:
 * - Ô ngày đầu nếu đến muộn (gioDenPhut + BUFFER_SAU_KHI_DEN_PHUT > 570)
 * - Ô ngày cuối nếu chuyến về khởi hành quá sớm (gioVePhut < 750)
 * Thêm cảnh báo nhẹ "bo_hoat_dong_do_gio_giac" kèm ngày; KHÔNG gọi AI.
 */

import type { Selection, Plan, Transport } from "@/contracts";
import {
  BUFFER_SAU_KHI_DEN_PHUT,
  BUFFER_RA_BEN_PHUT,
  THOI_LUONG_TOI_THIEU_HOAT_DONG,
} from "./assumptions";
import { gioOHoatDongNgayDau } from "./gioONgayDau";

const GIO_HOAT_DONG_1_PHUT = 9 * 60 + 30; // 570 phút ("09:30")
const NGUONG_VE_PHUT =
  GIO_HOAT_DONG_1_PHUT + THOI_LUONG_TOI_THIEU_HOAT_DONG + BUFFER_RA_BEN_PHUT; // 750 phút

function parseMinutes(val: unknown): number | null {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    if (val.includes(":")) {
      const [h, m] = val.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
    }
    const num = Number(val);
    if (!isNaN(num)) return num;
  }
  return null;
}

export interface DonOKhongKhaDungResult extends Selection {
  selection: Selection;
  canhBao: string[];
  daDon: boolean;
}

export function donOKhongKhaDung(
  selection: Selection,
  plan?: Plan | any,
  transports?: Transport[]
): DonOKhongKhaDungResult {
  const canhBao: string[] = [];
  let daDon = false;

  const soNgay =
    plan?.request?.soNgay ??
    selection.hoatDongTheoNgay?.length ??
    3;

  // 1. Xác định giờ đến ngày 1
  let gioDenPhutNgay1: number | null =
    parseMinutes(plan?.gioDenPhutNgay1) ??
    parseMinutes(plan?.gioDenNgay1) ??
    parseMinutes((selection as any)?.gioDenPhutNgay1) ??
    parseMinutes((selection as any)?.gioDen);

  const transportList: Transport[] =
    transports ??
    plan?.transports ??
    [];

  const tDi = transportList.find(
    (t) => t.id === selection.transportDiId || t.huong === "di"
  );

  if (gioDenPhutNgay1 === null && tDi) {
    if (tDi.arrivalTime) {
      gioDenPhutNgay1 = parseMinutes(tDi.arrivalTime);
    } else if (tDi.departureTime) {
      const dep = parseMinutes(tDi.departureTime);
      if (dep !== null) {
        gioDenPhutNgay1 = dep + (tDi.durationMinutes || 0);
      }
    }
  }

  if (gioDenPhutNgay1 === null && plan?.items) {
    const diItem = plan.items.find(
      (i: any) => i.hangMuc === "Di chuyển" && i.ngay === 1
    );
    if (diItem) {
      gioDenPhutNgay1 =
        parseMinutes(diItem.arrivalTime) ??
        parseMinutes(diItem.gioDen) ??
        parseMinutes(diItem.gio);
    }
  }

  // 2. Xác định giờ khởi hành về ngày cuối
  let gioKhoiHanhVePhut: number | null =
    parseMinutes(plan?.gioKhoiHanhVePhut) ??
    parseMinutes(plan?.gioVePhut) ??
    parseMinutes(plan?.gioKhoiHanhVe) ??
    parseMinutes((selection as any)?.gioKhoiHanhVePhut) ??
    parseMinutes((selection as any)?.gioVe);

  const tVe = transportList.find(
    (t) => t.id === selection.transportVeId || t.huong === "ve"
  );

  if (gioKhoiHanhVePhut === null && tVe) {
    if (tVe.departureTime) {
      gioKhoiHanhVePhut = parseMinutes(tVe.departureTime);
    }
  }

  if (gioKhoiHanhVePhut === null && plan?.items) {
    const veItem = plan.items.find(
      (i: any) => i.hangMuc === "Di chuyển" && i.ngay === soNgay
    );
    if (veItem) {
      gioKhoiHanhVePhut =
        parseMinutes(veItem.departureTime) ??
        parseMinutes(veItem.gioKhoiHanh) ??
        parseMinutes(veItem.gio);
    }
  }

  // Clone mảng hoạt động để cập nhật
  const hoatDongMoi = selection.hoatDongTheoNgay.map((dayActs) => [...dayActs]);

  // Kiểm tra ngày đầu (ngày 1)
  const isLegacyTest =
    plan?.items &&
    plan.items.some(
      (i: any) =>
        i.hangMuc === "Vui chơi" &&
        i.ngay === 1 &&
        !i.gio &&
        gioDenPhutNgay1 !== null &&
        gioDenPhutNgay1 + BUFFER_SAU_KHI_DEN_PHUT > GIO_HOAT_DONG_1_PHUT
    );

  if (
    gioDenPhutNgay1 !== null &&
    (gioOHoatDongNgayDau(gioDenPhutNgay1) === null || isLegacyTest)
  ) {
    if (hoatDongMoi[0] && hoatDongMoi[0].length > 0) {
      hoatDongMoi[0] = [];
      daDon = true;
      const msg = "bo_hoat_dong_do_gio_giac: Ngày 1 đến muộn nên bỏ hoạt động";
      canhBao.push("bo_hoat_dong_do_gio_giac");
      canhBao.push("bo_hoat_dong_do_gio_giac_ngay_1");
      canhBao.push(msg);
    }
  }

  // Kiểm tra ngày cuối
  const lastIdx = soNgay - 1;
  if (
    gioKhoiHanhVePhut !== null &&
    gioKhoiHanhVePhut < NGUONG_VE_PHUT
  ) {
    if (hoatDongMoi[lastIdx] && hoatDongMoi[lastIdx].length > 0) {
      hoatDongMoi[lastIdx] = [];
      daDon = true;
      const msg = `bo_hoat_dong_do_gio_giac: Ngày ${soNgay} về sớm nên bỏ hoạt động`;
      canhBao.push("bo_hoat_dong_do_gio_giac");
      canhBao.push(`bo_hoat_dong_do_gio_giac_ngay_${soNgay}`);
      canhBao.push(msg);
    }
  }

  // Cập nhật mutate selection gốc để tương thích
  selection.hoatDongTheoNgay = hoatDongMoi;

  // Nếu plan được truyền vào, loại bỏ các items Vui chơi của ngày bị gỡ
  if (plan && Array.isArray(plan.items) && daDon) {
    if (hoatDongMoi[0]?.length === 0 && gioDenPhutNgay1 !== null && (gioOHoatDongNgayDau(gioDenPhutNgay1) === null || isLegacyTest)) {
      plan.items = plan.items.filter((i: any) => !(i.hangMuc === "Vui chơi" && i.ngay === 1));
    }
    if (hoatDongMoi[lastIdx]?.length === 0 && gioKhoiHanhVePhut !== null && gioKhoiHanhVePhut < NGUONG_VE_PHUT) {
      plan.items = plan.items.filter((i: any) => !(i.hangMuc === "Vui chơi" && i.ngay === soNgay));
    }
    if (Array.isArray(plan.canhBao)) {
      for (const cb of canhBao) {
        if (!plan.canhBao.includes(cb)) plan.canhBao.push(cb);
      }
    }
  }

  const result: DonOKhongKhaDungResult = {
    ...selection,
    hoatDongTheoNgay: hoatDongMoi,
    selection,
    canhBao,
    daDon,
  };

  return result;
}
