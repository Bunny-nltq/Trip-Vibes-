// scripts/lib/smokeRules.ts
// Các hàm thuần đánh giá kết quả smoke test

export function danhGiaHealth(input: unknown): boolean {
  let data: any = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch {
      return false;
    }
  }
  if (!data || typeof data !== "object") return false;
  if (data.mode !== "snapshot") return false;
  if (!Array.isArray(data.snapshots) || data.snapshots.length < 5) return false;
  return true;
}

export function danhGiaPlan(input: unknown): boolean {
  let data: any = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch {
      return false;
    }
  }
  if (!data || typeof data !== "object") return false;
  if (data.ok !== true) return false;
  if (data.dataSourceUsed !== "snapshot") return false;
  if (data.soLanGoiAI !== 0) return false;
  if (!data.plan || !Array.isArray(data.plan.items) || data.plan.items.length === 0) return false;
  return true;
}

export function chuaChuoi(body: unknown, chuoi: unknown): boolean {
  if (typeof chuoi !== "string" || chuoi.length < 8) return false;
  const strBody = typeof body === "string" ? body : (body ? JSON.stringify(body) : "");
  return strBody.includes(chuoi);
}
