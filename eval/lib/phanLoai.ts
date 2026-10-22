/**
 * eval/lib/phanLoai.ts
 *
 * Hàm thuần phân loại kết quả kịch bản eval:ai-rate và các hàm hỗ trợ đánh giá.
 */

export type LoaiKetQua = "cu" | "khong_do_duoc" | "hop_le";

export interface RecordPhanLoai {
  quyTacVersion?: string;
  agentPromptVersion?: string;
  promptVersion?: string;
  prompt?: string;
  lyDoDuPhong?: string | null;
  lyDo?: string | null;
  soLanGoiAI?: number;
  scenarioResult?: {
    lyDoDuPhong?: string | null;
    soLanGoiAI?: number;
  };
}

export interface ContextPhanLoai {
  quyTacHienTai: string;
  promptHienTai: string;
}

/**
 * Phân loại một bản ghi kết quả kịch bản:
 * - "cu": nếu quyTacVersion hoặc agentPromptVersion khác giá trị hiện tại.
 * - "khong_do_duoc": nếu lyDoDuPhong là "het_luot_ai", hoặc là "qua_thoi_gian" mà soLanGoiAI bằng 0.
 * - còn lại: "hop_le".
 */
export function phanLoaiKetQua(
  record: RecordPhanLoai,
  context: ContextPhanLoai
): LoaiKetQua {
  const quyTac = record.quyTacVersion;
  const prompt =
    record.agentPromptVersion ?? record.prompt ?? record.promptVersion;

  if (quyTac !== context.quyTacHienTai || prompt !== context.promptHienTai) {
    return "cu";
  }

  const lyDo =
    record.lyDoDuPhong !== undefined
      ? record.lyDoDuPhong
      : record.lyDo !== undefined
      ? record.lyDo
      : record.scenarioResult?.lyDoDuPhong;

  const soLanGoiAI =
    record.soLanGoiAI !== undefined
      ? record.soLanGoiAI
      : record.scenarioResult?.soLanGoiAI !== undefined
      ? record.scenarioResult.soLanGoiAI
      : 0;

  if (lyDo === "het_luot_ai" || (lyDo === "qua_thoi_gian" && soLanGoiAI === 0)) {
    return "khong_do_duoc";
  }

  return "hop_le";
}

/**
 * Kiểm tra dừng sớm nếu hai kịch bản MỚI liên tiếp là "khong_do_duoc".
 */
export function kiemTraDungSomHaiLanLienTiep(danhSach: LoaiKetQua[]): boolean {
  for (let i = 0; i < danhSach.length - 1; i++) {
    if (danhSach[i] === "khong_do_duoc" && danhSach[i + 1] === "khong_do_duoc") {
      return true;
    }
  }
  return false;
}

/**
 * Tính mẫu số kịch bản: số kịch bản có snapshot (loại bỏ kịch bản bị bỏ qua ví dụ Phú Quốc).
 */
export interface KichBanMauSo {
  boQua?: boolean;
  [key: string]: any;
}

export function tinhMauSoKichBan(scenarios: KichBanMauSo[]): {
  tongSo: number;
  soBoQua: number;
  mauSo: number;
} {
  const tongSo = scenarios.length;
  const soBoQua = scenarios.filter((s) => Boolean(s.boQua)).length;
  const mauSo = tongSo - soBoQua;
  return {
    tongSo,
    soBoQua,
    mauSo,
  };
}

/**
 * Tạo chuỗi tổng hợp kết quả theo mẫu số hợp lệ.
 */
export function taoChuoiTongHop(
  soHopLe: number,
  mauSo: number,
  soBoQua: number = 2,
  tenBoQua: string = "Phú Quốc"
): string {
  return `${soHopLe}/${mauSo} kịch bản hợp lệ với quy tắc hiện tại (bỏ qua ${soBoQua} kịch bản ${tenBoQua}: không có snapshot)`;
}
