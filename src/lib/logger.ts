/**
 * Logger có cấp độ, thay cho console.log rải rác.
 *
 * Cấp độ lấy từ biến môi trường LOG_LEVEL (phía máy chủ) hoặc NEXT_PUBLIC_LOG_LEVEL (trình duyệt):
 * debug | info | warn | error | tat. Không đặt thì: production chỉ in warn trở lên;
 * môi trường phát triển in info trở lên. Nhờ vậy log chẩn đoán (debug) không bao giờ
 * ra console của người dùng trừ khi bật có chủ đích.
 *
 * Không dùng logger cho nội dung ảnh bill hay dữ liệu cá nhân (QT-04: không log).
 */

export type CapLog = "debug" | "info" | "warn" | "error" | "tat";

const THU_TU: Record<CapLog, number> = { debug: 10, info: 20, warn: 30, error: 40, tat: 99 };

function capHienTai(): number {
  const raw = (process.env.LOG_LEVEL ?? process.env.NEXT_PUBLIC_LOG_LEVEL ?? "").trim().toLowerCase();
  if (raw in THU_TU) return THU_TU[raw as CapLog];
  return process.env.NODE_ENV === "production" ? THU_TU.warn : THU_TU.info;
}

function ghi(cap: Exclude<CapLog, "tat">, args: unknown[]): void {
  if (THU_TU[cap] < capHienTai()) return;
  const dich = cap === "debug" || cap === "info" ? console.log : cap === "warn" ? console.warn : console.error;
  dich(...args);
}

export const logger = {
  debug: (...args: unknown[]) => ghi("debug", args),
  info: (...args: unknown[]) => ghi("info", args),
  warn: (...args: unknown[]) => ghi("warn", args),
  error: (...args: unknown[]) => ghi("error", args),
};
