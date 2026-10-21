/**
 * src/core/gioiHanAI.ts
 *
 * Hàm thuần kiểm tra giới hạn lượt gọi AI:
 * - Tối đa moiIpMoiGio (mặc định 5) lượt trong 1 giờ cho mỗi IP.
 * - Tối đa tongMoiNgay (mặc định 40) lượt trong ngày cho toàn hệ thống.
 * Hàm thuần, không import AI, không import UI.
 */

export interface CauHinhGioiHanAI {
  moiIpMoiGio: number;
  tongMoiNgay: number;
}

export interface TrangThaiGioiHanAI {
  cacIp?: Record<string, { firstCallMs: number; count: number }>;
  daily?: { day: string; count: number };
  [key: string]: any;
}

export interface KetQuaGioiHanAI {
  choPhep: boolean;
  lyDo?: "gioi_han_ip" | "gioi_han_ngay";
}

export function taoTrangThaiGioiHanAI(): TrangThaiGioiHanAI {
  return {
    cacIp: {},
    daily: { day: "", count: 0 },
  };
}

export function kiemTraGioiHanAI(
  trangThai: TrangThaiGioiHanAI,
  ip: string,
  nowMs: number,
  cauHinh: CauHinhGioiHanAI = { moiIpMoiGio: 5, tongMoiNgay: 40 }
): KetQuaGioiHanAI {
  const moiIpMoiGio = cauHinh?.moiIpMoiGio ?? 5;
  const tongMoiNgay = cauHinh?.tongMoiNgay ?? 40;

  // 1. Kiểm tra giới hạn ngày toàn hệ thống
  const today = new Date(nowMs).toISOString().slice(0, 10);
  if (!trangThai.daily || trangThai.daily.day !== today) {
    trangThai.daily = { day: today, count: 0 };
  }

  if (trangThai.daily.count >= tongMoiNgay) {
    return { choPhep: false, lyDo: "gioi_han_ngay" };
  }

  // 2. Kiểm tra giới hạn theo IP
  if (!trangThai.cacIp) {
    trangThai.cacIp = {};
  }

  let ipRecord = trangThai.cacIp[ip];
  if (ipRecord) {
    const elapsed = nowMs - ipRecord.firstCallMs;
    if (elapsed > 3_600_000) {
      // Đã qua 3.600.000 ms kể từ lần đầu của IP này -> reset cửa sổ mới
      ipRecord = { firstCallMs: nowMs, count: 0 };
      trangThai.cacIp[ip] = ipRecord;
    }
  } else {
    ipRecord = { firstCallMs: nowMs, count: 0 };
    trangThai.cacIp[ip] = ipRecord;
  }

  if (ipRecord.count >= moiIpMoiGio) {
    return { choPhep: false, lyDo: "gioi_han_ip" };
  }

  // Cả hai đều thỏa mãn: tăng bộ đếm và cho phép
  ipRecord.count++;
  trangThai.daily.count++;

  return { choPhep: true };
}
