import type { PlanItem } from "@/contracts";
import { hhmm2min, min2hhmm } from "./mealTimes";
import { BUFFER_RA_BEN_PHUT } from "./assumptions";

export const tripPeriods = {
  morning: { label: "Sáng", from: 7 * 60, to: 11 * 60 + 30 },
  noon: { label: "Trưa", from: 11 * 60 + 30, to: 14 * 60 },
  afternoon: { label: "Chiều", from: 14 * 60, to: 18 * 60 },
  evening: { label: "Tối", from: 18 * 60, to: 22 * 60 },
} as const;
export type TripPeriod = keyof typeof tripPeriods;

export function findTripTimeSlot(items: PlanItem[], day: number, period: TripPeriod, duration: number) {
  const { from, to } = tripPeriods[period];
  const dayStart = (day - 1) * 1440;
  const departure = items.find(item => item.hangMuc === "Di chuyển" && /chiều về/i.test(item.noiDung));
  const limit = departure?.ngay === day && departure.gio ? Math.min(to, hhmm2min(departure.gio) - BUFFER_RA_BEN_PHUT) : to;
  const occupied = items.flatMap(item => {
    if (!item.gio || item.state === "closed" || item.state === "skipped") return [];
    const start = (item.ngay - 1) * 1440 + hhmm2min(item.gio) - dayStart;
    const minutes = item.durationMinutes ?? (item as PlanItem & { thoiLuongPhut?: number }).thoiLuongPhut ?? 30;
    return [{ start: start - 15, end: start + minutes + 15 }];
  }).sort((a, b) => a.start - b.start);
  let slot = from;
  for (const block of occupied) {
    if (block.start >= slot + duration) break;
    if (block.end > slot) slot = block.end;
  }
  return slot + duration <= limit ? min2hhmm(slot) : null;
}
