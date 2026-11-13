import {
  GIO_KHOI_HANH_SOM,
  GIO_DI_DEM_TU,
  GIO_DI_DEM_DEN,
  GIO_DEN_SOM,
  NGUONG_DI_CHUYEN_LAU_PHUT,
} from "./assumptions";
import type { PlanItem } from "@/contracts";

export function workspaceFlags(items: PlanItem[], budget: number): string[] {
  const flags: string[] = [];
  if (items.some(i => i.priceKnown === false)) flags.push("workspace_missing_prices");
  if (items.some(i => i.state === "closed")) flags.push("workspace_closed_place");
  if (items.reduce((sum, i) => sum + i.donGia * i.soLuong, 0) > budget) flags.push("workspace_over_budget");
  const timed = items.filter(i => i.gio && i.durationMinutes && i.state !== "skipped").sort((a, b) => a.ngay - b.ngay || a.gio!.localeCompare(b.gio!));
  for (let index = 1; index < timed.length; index++) {
    const a = timed[index - 1], b = timed[index];
    const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
    if (a.ngay === b.ngay && minutes(a.gio!) + a.durationMinutes! > minutes(b.gio!)) { flags.push("workspace_time_overlap"); break; }
  }
  return flags;
}

export interface TransportFlags {
  /** Số phút tính từ 00:00 của ngày đi */
  denLuc: number;
  /** Số ngày lệch giữa ngày đến và ngày đi (0 = trong ngày, 1 = hôm sau, ...) */
  soNgayLech: number;
  /** Giờ đến định dạng HH:MM */
  gioDen: string;
  /** Khởi hành sớm nếu gioDi < 08:00 */
  khoiHanhSom: boolean;
  /** Đi đêm nếu gioDi >= 22:00 hoặc gioDi < 05:00 */
  diDem: boolean;
  /** Đến sớm nếu gioDen < 06:00 */
  denSom: boolean;
  /** Di chuyển lâu nếu thoiLuongPhut > 360 phút (6 tiếng) */
  diChuyenLau: boolean;
}

/**
 * Tính toán thời gian đến thực tế và các cờ cảnh báo cho phương tiện.
 * Tuyệt đối không tin chuỗi arrivalTime trong dữ liệu; luôn tính từ gioDi + thoiLuongPhut.
 */
export function calculateTransportFlags(
  gioDi: string,
  thoiLuongPhut: number
): TransportFlags {
  const parts = gioDi.split(":");
  const gio = parseInt(parts[0], 10);
  const phut = parseInt(parts[1], 10);

  const phutKhoiHanh = gio * 60 + phut;
  const denLuc = phutKhoiHanh + thoiLuongPhut;

  const soNgayLech = Math.floor(denLuc / 1440);
  const phutTrongNgay = denLuc % 1440;

  const gioDenNum = Math.floor(phutTrongNgay / 60);
  const phutDenNum = phutTrongNgay % 60;

  const gioDen = `${String(gioDenNum).padStart(2, "0")}:${String(
    phutDenNum
  ).padStart(2, "0")}`;

  const khoiHanhSom = gioDi < GIO_KHOI_HANH_SOM;
  const diDem = gioDi >= GIO_DI_DEM_TU || gioDi < GIO_DI_DEM_DEN;
  const denSom = gioDen < GIO_DEN_SOM;
  const diChuyenLau = thoiLuongPhut > NGUONG_DI_CHUYEN_LAU_PHUT;

  return {
    denLuc,
    soNgayLech,
    gioDen,
    khoiHanhSom,
    diDem,
    denSom,
    diChuyenLau,
  };
}

/** Local route duration is estimated; show a review warning when it overlaps a stop. */
export function localRouteWarnings(items:import("@/contracts").PlanItem[]):string[]{
 const minutes=(time:string)=>Number(time.slice(0,2))*60+Number(time.slice(3));
 for(const leg of items){if(leg.experienceType!=="local_transfer"||!leg.gio)continue;const departure=minutes(leg.gio);
 for(const stop of items){if(stop.ngay!==leg.ngay||stop.hangMuc==="Di chuyển"||!stop.gio)continue;const start=minutes(stop.gio);if(start<=departure&&start+(stop.durationMinutes??30)>departure)return ["Cần rà soát thời gian dừng và di chuyển nội vùng; một số chặng ước tính có thể chồng giờ."];}}
 return [];
}
