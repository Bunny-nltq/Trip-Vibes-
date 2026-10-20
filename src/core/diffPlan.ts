/**
 * src/core/diffPlan.ts
 *
 * Tính chênh lệch giữa hai kế hoạch (truoc/sau) sau khi người dùng đổi lựa chọn.
 * Hàm thuần: không dùng Date.now(), không import AI hay UI.
 *
 * Quy tắc:
 * - Tiền/thời gian do core tính, không để AI tự cộng.
 * - ngayAnhHuong: ngày có hoạt động hoặc bữa ăn đổi;
 *   nếu chiều về đến nơi sang ngày sau thì thêm ngày đó với lý do "đến nơi vào ngày sau".
 * - canhBaoMoi: mã vi phạm (hard+soft) có trong "sau" mà không có trong "truoc".
 */

import type { Plan, TripRequest } from "@/contracts";
import { validatePlan } from "./validatePlan";
import type { PlanData } from "./buildPlan";

// ─── Output types ─────────────────────────────────────────────────────────────

export interface TruocSau<T> {
  truoc: T;
  sau: T;
  chenh: T;
}

export interface HangMucRow {
  ten: string;
  truoc: number;
  sau: number;
  chenh: number;
}

export interface DoiMuc {
  loai:
    | "phuong_tien_di"
    | "phuong_tien_ve"
    | "khach_san"
    | "hoat_dong"
    | "bua_an";
  truoc: string; // mô tả ngắn (noiDung hoặc id)
  sau: string;
}

export interface NgayAnhHuong {
  ngay: number;
  lyDo: string;
}

export interface PlanDiff {
  tongVND: TruocSau<number>;
  conLaiVND: TruocSau<number>;
  theoHangMuc: HangMucRow[];
  thoiGianDiChuyenPhut: TruocSau<number>;
  doiMuc: DoiMuc[];
  ngayAnhHuong: NgayAnhHuong[];
  canhBaoMoi: string[];
  canhBaoDaSua: string[];
  trangThaiNganSach: { truoc: "trong" | "vuot"; sau: "trong" | "vuot" };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const HANG_MUCKS: Array<"Di chuyển" | "Chỗ ở" | "Ăn uống" | "Vui chơi"> = [
  "Di chuyển",
  "Chỗ ở",
  "Ăn uống",
  "Vui chơi",
];

/** Trả tập mã vi phạm (hard + soft) của một plan */
function allCodes(plan: Plan, data: PlanData): Set<string> {
  const { hard, soft } = validatePlan(plan.request, plan, data);
  return new Set([...hard.map((v) => v.code), ...soft.map((v) => v.code)]);
}

/**
 * So sánh items ngày d giữa truoc và sau để phát hiện thay đổi.
 * Trả true nếu có bất kỳ item nào khác nhau (theo refId hoặc thanhTien).
 */
function itemsChanged(truoc: Plan, sau: Plan, ngay: number): boolean {
  const itemsTruoc = truoc.items.filter((i) => i.ngay === ngay);
  const itemsSau = sau.items.filter((i) => i.ngay === ngay);

  if (itemsTruoc.length !== itemsSau.length) return true;

  for (let i = 0; i < itemsTruoc.length; i++) {
    const a = itemsTruoc[i];
    const b = itemsSau[i];
    if (a.refId !== b.refId || a.thanhTien !== b.thanhTien || a.noiDung !== b.noiDung) {
      return true;
    }
  }
  return false;
}

/**
 * Tính phút đến nơi của chiều về (tính từ 00:00 ngày về).
 * Nếu >= 1440 → đến nơi sang ngày hôm sau.
 */
function tinhPhutDenVe(sau: Plan): number {
  const tVeItem = sau.items.find(
    (i) => i.hangMuc === "Di chuyển" && i.ngay === sau.request.soNgay
  );
  if (!tVeItem || !tVeItem.gio) return 0;

  // Phút khởi hành theo gio của item (danh nghĩa)
  const [h, m] = tVeItem.gio.split(":").map(Number);
  const phutKhoiHanh = h * 60 + m;

  // Lấy durationMinutes từ noiDung hoặc để 0 (không có thông tin)
  // Thực tế cần data, nhưng hàm này chỉ dùng để kiểm tra "đến nơi sang ngày sau"
  // → dùng thoiGianDiChuyenPhut của tongKet (tổng = di + ve)
  // Thay vào đó ta dùng tongThoiGianDiChuyenPhut của SAU trừ TRUOC để lấy tVe.duration
  // Không có trực tiếp. Ta dùng logic khác:
  // Chiều về sang ngày sau khi: phutKhoiHanh + durationVe >= 1440
  // Vì không có duration riêng của ve trong Plan, ta dùng conservative approach:
  // Nếu thoiGianDiChuyenPhut > 720 phút (12h) thì rất có thể sang ngày sau.
  // NHƯNG mô tả yêu cầu: "nếu giờ đến của chiều về sang ngày sau" → cần duration
  // → Ta khai thác thông tin từ noiDung bằng cách kiểm tra tVe.gio + diff của tongThoiGianDiChuyenPhut

  return phutKhoiHanh; // placeholder, xem bên dưới
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * diffPlan(truoc, sau, request, data) → PlanDiff
 *
 * @param truoc   Kế hoạch trước khi thay đổi
 * @param sau     Kế hoạch sau khi thay đổi (đã qua buildPlan + validatePlan)
 * @param request TripRequest (dùng để validatePlan cho canhBaoMoi)
 * @param data    PlanData (dùng để validatePlan cho canhBaoMoi)
 * @param durationVePhut  Thời lượng chiều về (phút) – cần để tính sang ngày sau
 */
export function diffPlan(
  truoc: Plan,
  sau: Plan,
  data: PlanData,
  durationVePhut?: number
): PlanDiff {
  // 1. Tiền
  const tongVND: TruocSau<number> = {
    truoc: truoc.tongKet.tongVND,
    sau: sau.tongKet.tongVND,
    chenh: sau.tongKet.tongVND - truoc.tongKet.tongVND,
  };

  const conLaiVND: TruocSau<number> = {
    truoc: truoc.tongKet.conLaiVND,
    sau: sau.tongKet.conLaiVND,
    chenh: sau.tongKet.conLaiVND - truoc.tongKet.conLaiVND,
  };

  // 2. Theo hạng mục
  const theoHangMuc: HangMucRow[] = HANG_MUCKS.map((ten) => {
    const t = truoc.tongKet.theoHangMuc[ten] ?? 0;
    const s = sau.tongKet.theoHangMuc[ten] ?? 0;
    return { ten, truoc: t, sau: s, chenh: s - t };
  });

  // 3. Thời gian di chuyển
  const thoiGianDiChuyenPhut: TruocSau<number> = {
    truoc: truoc.tongKet.tongThoiGianDiChuyenPhut,
    sau: sau.tongKet.tongThoiGianDiChuyenPhut,
    chenh: sau.tongKet.tongThoiGianDiChuyenPhut - truoc.tongKet.tongThoiGianDiChuyenPhut,
  };

  // 4. Phát hiện các thay đổi mục
  const doiMuc: DoiMuc[] = [];

  // So sánh phương tiện chiều đi
  const tDiTruoc = truoc.items.find((i) => i.hangMuc === "Di chuyển" && i.ngay === 1);
  const tDiSau = sau.items.find((i) => i.hangMuc === "Di chuyển" && i.ngay === 1);
  if (tDiTruoc?.refId !== tDiSau?.refId) {
    doiMuc.push({
      loai: "phuong_tien_di",
      truoc: tDiTruoc?.noiDung ?? tDiTruoc?.refId ?? "",
      sau: tDiSau?.noiDung ?? tDiSau?.refId ?? "",
    });
  }

  // So sánh phương tiện chiều về
  const soNgay = sau.request.soNgay ?? truoc.request.soNgay ?? 3;
  const tVeTruoc = truoc.items.find((i) => i.hangMuc === "Di chuyển" && i.ngay === soNgay);
  const tVeSau = sau.items.find((i) => i.hangMuc === "Di chuyển" && i.ngay === soNgay);
  if (tVeTruoc?.refId !== tVeSau?.refId) {
    doiMuc.push({
      loai: "phuong_tien_ve",
      truoc: tVeTruoc?.noiDung ?? tVeTruoc?.refId ?? "",
      sau: tVeSau?.noiDung ?? tVeSau?.refId ?? "",
    });
  }

  // So sánh khách sạn
  const hTruoc = truoc.items.find((i) => i.hangMuc === "Chỗ ở");
  const hSau = sau.items.find((i) => i.hangMuc === "Chỗ ở");
  if (hTruoc?.refId !== hSau?.refId) {
    doiMuc.push({
      loai: "khach_san",
      truoc: hTruoc?.noiDung ?? hTruoc?.refId ?? "",
      sau: hSau?.noiDung ?? hSau?.refId ?? "",
    });
  }

  // So sánh hoạt động (Vui chơi)
  const actTruoc = truoc.items
    .filter((i) => i.hangMuc === "Vui chơi")
    .map((i) => i.refId)
    .join(",");
  const actSau = sau.items
    .filter((i) => i.hangMuc === "Vui chơi")
    .map((i) => i.refId)
    .join(",");
  if (actTruoc !== actSau) {
    const actsTruoc = truoc.items.filter((i) => i.hangMuc === "Vui chơi");
    const actsSau = sau.items.filter((i) => i.hangMuc === "Vui chơi");
    const maxLen = Math.max(actsTruoc.length, actsSau.length);
    for (let idx = 0; idx < maxLen; idx++) {
      const a = actsTruoc[idx];
      const b = actsSau[idx];
      if (a?.refId !== b?.refId) {
        doiMuc.push({
          loai: "hoat_dong",
          truoc: a?.noiDung ?? a?.refId ?? "",
          sau: b?.noiDung ?? b?.refId ?? "",
        });
      }
    }
  }

  // So sánh bữa ăn (Ăn uống)
  const buaTruoc = truoc.items.filter((i) => i.hangMuc === "Ăn uống");
  const buaSau = sau.items.filter((i) => i.hangMuc === "Ăn uống");
  const buaMaxLen = Math.max(buaTruoc.length, buaSau.length);
  for (let idx = 0; idx < buaMaxLen; idx++) {
    const a = buaTruoc[idx];
    const b = buaSau[idx];
    if (a?.refId !== b?.refId || a?.donGia !== b?.donGia) {
      doiMuc.push({
        loai: "bua_an",
        truoc: a?.noiDung ?? a?.refId ?? "(không có)",
        sau: b?.noiDung ?? b?.refId ?? "(không có)",
      });
    }
  }

  // 5. Ngày bị ảnh hưởng
  const ngayAnhHuong: NgayAnhHuong[] = [];
  const seenDays = new Set<number>();

  // Kiểm tra từng ngày xem items có thay đổi không
  for (let d = 1; d <= soNgay; d++) {
    if (itemsChanged(truoc, sau, d) && !seenDays.has(d)) {
      // Tìm lý do cụ thể
      const doiTruocNgay = doiMuc.filter((dm) => {
        // phương tiện chiều đi → ngày 1
        if (dm.loai === "phuong_tien_di" && d === 1) return true;
        // phương tiện chiều về → ngày cuối
        if (dm.loai === "phuong_tien_ve" && d === soNgay) return true;
        // khách sạn → ngày 1 (thêm vào items[])
        if (dm.loai === "khach_san" && d === 1) return true;
        return false;
      });

      let lyDo = "thay đổi lịch trình";
      if (doiTruocNgay.some((dm) => dm.loai === "phuong_tien_di")) {
        lyDo = "đổi phương tiện chiều đi";
      } else if (doiTruocNgay.some((dm) => dm.loai === "phuong_tien_ve")) {
        lyDo = "đổi phương tiện chiều về";
      } else if (doiTruocNgay.some((dm) => dm.loai === "khach_san")) {
        lyDo = "đổi khách sạn";
      } else if (doiMuc.some((dm) => dm.loai === "hoat_dong")) {
        lyDo = "đổi hoạt động";
      } else if (doiMuc.some((dm) => dm.loai === "bua_an")) {
        lyDo = "đổi bữa ăn";
      }

      ngayAnhHuong.push({ ngay: d, lyDo });
      seenDays.add(d);
    }
  }

  // Kiểm tra chiều về có đến nơi sang ngày sau không
  if (tVeSau && tVeSau.gio && durationVePhut !== undefined) {
    const [h, m] = tVeSau.gio.split(":").map(Number);
    const phutKhoiHanh = h * 60 + m;
    const phutDen = phutKhoiHanh + durationVePhut;
    if (phutDen >= 1440) {
      // Ngày sau = soNgay + 1
      const ngaySau = soNgay + 1;
      if (!seenDays.has(ngaySau)) {
        ngayAnhHuong.push({ ngay: ngaySau, lyDo: "đến nơi vào ngày sau" });
        seenDays.add(ngaySau);
      }
    }
  }

  // Sắp xếp theo ngày
  ngayAnhHuong.sort((a, b) => a.ngay - b.ngay);

  // 6. Cảnh báo mới & Cảnh báo đã sửa:
  const codesTruoc = allCodes(truoc, data);
  const codesSau = allCodes(sau, data);
  const canhBaoMoi = Array.from(codesSau).filter((c) => !codesTruoc.has(c));
  const canhBaoDaSua = Array.from(codesTruoc).filter((c) => !codesSau.has(c));

  // 7. Trạng thái ngân sách
  const trangThaiNganSach = {
    truoc: truoc.tongKet.trangThaiNganSach,
    sau: sau.tongKet.trangThaiNganSach,
  };

  return {
    tongVND,
    conLaiVND,
    theoHangMuc,
    thoiGianDiChuyenPhut,
    doiMuc,
    ngayAnhHuong,
    canhBaoMoi,
    canhBaoDaSua,
    trangThaiNganSach,
  };
}
