import { BudgetAlternativeSchema, type BudgetAlternative, type TripRequest } from "@/contracts";
import type { PlanData } from "./buildPlan";
import { MAX_BUDGET_ALTERNATIVES, MAX_BUDGET_SHORTENING_DAYS } from "./assumptions";
import { lapKeHoachTuDong } from "./lapKeHoachTuDong";
import { validatePlan } from "./validatePlan";

export function findBudgetAlternatives(request: TripRequest, data: PlanData): BudgetAlternative[] {
  const budget = request.ngansachTongVND ?? 0;
  if (budget <= 0) return [];
  const days = request.soNgay ?? 1;
  const modes: Array<Pick<TripRequest, "transportMode" | "localTransportMode">> = [{
    transportMode: request.transportMode,
    localTransportMode: request.localTransportMode,
  }];
  if (request.transportMode && request.transportMode !== "auto" && !request.giaVeTuNhap) {
    modes.push({ ...modes[0], transportMode: "auto" });
  }
  if (request.localTransportMode === "taxi" || request.localTransportMode === "car") {
    modes.push(...modes.map(mode => ({ ...mode, localTransportMode: "transit" as const })));
  }

  const alternatives: BudgetAlternative[] = [];
  // Ưu tiên giữ ngày về. Sau đó thử tối đa ba ngày về gần nhất.
  const maxShortening = Math.max(0, Math.min(MAX_BUDGET_SHORTENING_DAYS, days - 2));
  for (let shorterBy = 0; shorterBy <= maxShortening; shorterBy++) {
    const travelDates = request.travelDates;
    const returnDate = travelDates && shorterBy > 0
      ? new Date(Date.parse(travelDates.returnDate + "T00:00:00Z") - shorterBy * 86400000).toISOString().slice(0, 10)
      : travelDates?.returnDate;
    for (const mode of modes) {
      const changes: BudgetAlternative["changes"] = [];
      if (shorterBy) changes.push("shorter");
      if (mode.transportMode !== request.transportMode) changes.push("flexible_transport");
      if (mode.localTransportMode !== request.localTransportMode) changes.push("public_transit");
      if (!changes.length) continue;
      const candidate = {
        ...request, ...mode, soNgay: days - shorterBy,
        travelDates: travelDates && returnDate ? { ...travelDates, returnDate } : undefined,
      };
      const candidateData = {
        ...data,
        transports: data.transports.filter(t => !mode.transportMode || mode.transportMode === "auto" || t.type === mode.transportMode),
      };
      const result = lapKeHoachTuDong(candidate, candidateData);
      if (!result.khaThi || result.tongVND > budget || validatePlan(candidate, result.plan, candidateData).hard.length) continue;
      const parsed = BudgetAlternativeSchema.safeParse({
        changes,
        plan: { ...result.plan, phuongThucLap: "quy_tac" },
      });
      if (parsed.success) {
        alternatives.push(parsed.data);
        break;
      }
    }
    if (alternatives.length >= MAX_BUDGET_ALTERNATIVES) break;
  }
  return alternatives;
}
