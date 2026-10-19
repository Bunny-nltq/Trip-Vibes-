import type { Plan, Preference } from "@/contracts";

export function roundHalfUp2Dec(val: number): number {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  return sign * (Math.round((abs + Number.EPSILON) * 100) / 100);
}

/**
 * khopSoThich: Số nhãn của hoạt động có trong danh sách sở thích.
 */
export function khopSoThich(
  nhanHoatDong: Preference[] | readonly string[] | null | undefined,
  soThich: Preference[] | readonly string[] | null | undefined
): number {
  if (!nhanHoatDong || !soThich || soThich.length === 0 || nhanHoatDong.length === 0) {
    return 0;
  }
  const set = new Set(soThich);
  return nhanHoatDong.filter((t) => set.has(t as Preference)).length;
}

/**
 * diemKhopTrungBinh: (tổng khopSoThich của mọi hoạt động trong kế hoạch) / (số hoạt động),
 * 0 nếu không có hoạt động hoặc sở thích rỗng. Làm tròn 2 chữ số theo kiểu nửa lên.
 */
export function diemKhopTrungBinh(
  plan: Plan,
  soThich: Preference[] | readonly string[] | null | undefined,
  activitiesMap?:
    | Map<string, { nhan?: Preference[] }>
    | Record<string, { nhan?: Preference[] }>
): number {
  if (!soThich || soThich.length === 0) return 0;
  if (!plan || !plan.items) return 0;

  const activities = plan.items.filter((item) => item.hangMuc === "Vui chơi");
  if (activities.length === 0) return 0;

  let totalScore = 0;
  for (const act of activities) {
    let nhan: Preference[] | undefined = act.nhan;
    if (!nhan && activitiesMap && act.refId) {
      if (activitiesMap instanceof Map) {
        nhan = activitiesMap.get(act.refId)?.nhan;
      } else {
        nhan = activitiesMap[act.refId]?.nhan;
      }
    }
    totalScore += khopSoThich(nhan || [], soThich);
  }

  return roundHalfUp2Dec(totalScore / activities.length);
}
