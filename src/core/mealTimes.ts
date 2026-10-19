/**
 * src/core/mealTimes.ts
 *
 * Quy tắc giờ hiển thị bữa ăn và cà phê:
 * - Không hiển thị giờ trùng hay trước giờ đến (chiều đi, ngày 1).
 * - Không hiển thị giờ sau giờ khởi hành chiều về (ngày cuối).
 * - Nếu vi phạm → trả null (UI hiển thị "—").
 *
 * Hàm thuần, không dùng Date.now, không import AI hay UI.
 */

import { BUFFER_SAU_KHI_DEN_PHUT } from "./assumptions";

/** Chuyển chuỗi "HH:mm" thành số phút từ 00:00 */
export function hhmm2min(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Chuyển số phút thành chuỗi "HH:mm" (không quá 23:59) */
export function min2hhmm(mins: number): string {
  const clamped = Math.max(0, Math.min(mins, 23 * 60 + 59));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface MealTimeContext {
  /** Phút đến nơi ngày 1 (gioDi phút + durationMinutes), tính từ 00:00 ngày 1 */
  gioDenNgay1Phut?: number;
  /** Giờ khởi hành chiều về, VD "18:00" */
  gioKhoiHanhVe?: string;
  /** Ngày đang tính (1-based) */
  ngay: number;
  /** Tổng số ngày chuyến */
  soNgay: number;
}

/**
 * Trả về giờ hợp lệ cho bữa ăn/cà phê, hoặc null nếu vi phạm.
 *
 * @param gioDanhNghia  Giờ danh nghĩa mong muốn, VD "09:00", "12:00", "18:30"
 * @param ctx           Ngữ cảnh chuyến đi (giờ đến, giờ về, ngày)
 * @returns             Chuỗi giờ hợp lệ hoặc null
 */
export function mealTimeOrNull(
  gioDanhNghia: string,
  ctx: MealTimeContext
): string | null {
  const targetMin = hhmm2min(gioDanhNghia);

  // Ngày 1: bữa ăn không được trước (giờ đến + BUFFER)
  if (ctx.ngay === 1 && ctx.gioDenNgay1Phut !== undefined) {
    const earliestMin = ctx.gioDenNgay1Phut + BUFFER_SAU_KHI_DEN_PHUT;
    // Nếu giờ ăn <= earliestMin, vi phạm → null
    if (targetMin <= earliestMin) {
      return null;
    }
  }

  // Ngày cuối: bữa ăn không được sau giờ khởi hành chiều về
  if (ctx.ngay === ctx.soNgay && ctx.gioKhoiHanhVe) {
    const departureMin = hhmm2min(ctx.gioKhoiHanhVe);
    if (targetMin >= departureMin) {
      return null;
    }
  }

  return gioDanhNghia;
}
