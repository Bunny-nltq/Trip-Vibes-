/**
 * src/core/chiSoTest.ts
 *
 * Tính toán các chỉ số kiểm thử người dùng từ chuỗi sự kiện cục bộ (session log).
 * Hàm thuần, không import AI hoặc UI.
 */

export interface SessionEvent {
  type:
    | "start"
    | "plan_ok"
    | "change_applied"
    | "undo"
    | "regenerate"
    | "confirm"
    | "expense_added";
  t: number;
  loai?: string;
  soCanhBaoConLai?: number;
  trangThaiNganSach?: "trong_han_muc" | "vuot" | string;
  nguon?: "anh_bill" | "nhap_tay" | string;
  daSuaTay?: boolean;
}

export interface ChiSoTestResult {
  thoiGianTaoKeHoachMs: number;
  soLanDoi: number;
  soLanHoanTac: number;
  thoiGianToiChotMs: number;
  vuotKhiChot: boolean;
  soExpense: number;
  soExpenseDaSuaSo: number;
}

/**
 * Tính các chỉ số kiểm thử từ danh sách sự kiện (hoặc JSON string).
 */
export function tinhChiSoTest(
  input: SessionEvent[] | string | null | undefined
): ChiSoTestResult {
  const defaultResult: ChiSoTestResult = {
    thoiGianTaoKeHoachMs: 0,
    soLanDoi: 0,
    soLanHoanTac: 0,
    thoiGianToiChotMs: 0,
    vuotKhiChot: false,
    soExpense: 0,
    soExpenseDaSuaSo: 0,
  };

  if (!input) {
    return defaultResult;
  }

  let events: SessionEvent[] = [];
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) {
      return defaultResult;
    }
    try {
      events = JSON.parse(trimmed);
    } catch {
      return defaultResult;
    }
  } else if (Array.isArray(input)) {
    events = input;
  }

  if (!Array.isArray(events) || events.length === 0) {
    return defaultResult;
  }

  const startEvent = events.find((e) => e.type === "start");
  const planOkEvent = events.find((e) => e.type === "plan_ok");
  const confirmEvent = events.find((e) => e.type === "confirm");

  // Thời gian tạo kế hoạch: từ start tới plan_ok
  const thoiGianTaoKeHoachMs =
    startEvent && planOkEvent && planOkEvent.t >= startEvent.t
      ? planOkEvent.t - startEvent.t
      : 0;

  // Số lần đổi: số sự kiện change_applied
  const soLanDoi = events.filter((e) => e.type === "change_applied").length;

  // Số lần hoàn tác: số sự kiện undo
  const soLanHoanTac = events.filter((e) => e.type === "undo").length;

  // Thời gian tới chốt: từ start tới confirm
  const thoiGianToiChotMs =
    startEvent && confirmEvent && confirmEvent.t >= startEvent.t
      ? confirmEvent.t - startEvent.t
      : 0;

  // Vượt khi chốt: trạng thái ngân sách ở thời điểm confirm là "vuot"
  const vuotKhiChot = confirmEvent?.trangThaiNganSach === "vuot";

  // Chi tiêu
  const expenseEvents = events.filter((e) => e.type === "expense_added");
  const soExpense = expenseEvents.length;
  const soExpenseDaSuaSo = expenseEvents.filter((e) => e.daSuaTay === true).length;

  return {
    thoiGianTaoKeHoachMs,
    soLanDoi,
    soLanHoanTac,
    thoiGianToiChotMs,
    vuotKhiChot,
    soExpense,
    soExpenseDaSuaSo,
  };
}
