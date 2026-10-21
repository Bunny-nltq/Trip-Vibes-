/**
 * eval/tonghopRules.ts
 *
 * Hàm thuần đánh giá độ mới và định dạng báo cáo tổng hợp kết quả eval.
 * Không gọi Gemini, không import UI hoặc data.
 */

export type DoMoiKetQua =
  | "HOP_LE"
  | "CU_KHONG_GHI_PHIEN_BAN"
  | "CU_KHAC_PHIEN_BAN"
  | "CU_QUA_7_NGAY";

export interface DanhGiaDoMoiParams {
  ngayChay: string;
  quyTacVersion?: string | null;
  ngayHienTai: string;
  quyTacHienTai: string;
}

/**
 * Đánh giá độ mới của một bộ kết quả kiểm thử.
 * Thứ tự ưu tiên:
 * 1. Thiếu quyTacVersion (null, undefined, rỗng) -> "CU_KHONG_GHI_PHIEN_BAN"
 * 2. Khác quyTacHienTai -> "CU_KHAC_PHIEN_BAN"
 * 3. (ngayHienTai - ngayChay) lớn hơn 7 ngày -> "CU_QUA_7_NGAY"
 * 4. Ngược lại -> "HOP_LE"
 */
export function danhGiaDoMoi({
  ngayChay,
  quyTacVersion,
  ngayHienTai,
  quyTacHienTai,
}: DanhGiaDoMoiParams): DoMoiKetQua {
  // 1. Thiếu quyTacVersion thì CU_KHONG_GHI_PHIEN_BAN
  if (quyTacVersion === undefined || quyTacVersion === null || quyTacVersion.trim() === "") {
    return "CU_KHONG_GHI_PHIEN_BAN";
  }

  // 2. Khác quyTacHienTai thì CU_KHAC_PHIEN_BAN
  if (quyTacVersion.trim() !== quyTacHienTai.trim()) {
    return "CU_KHAC_PHIEN_BAN";
  }

  // 3. (ngayHienTai - ngayChay) lớn hơn 7 ngày thì CU_QUA_7_NGAY
  const parseUtcDate = (d: string) => {
    const parts = d.slice(0, 10).split("-").map(Number);
    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
  };

  const diffMs = parseUtcDate(ngayHienTai) - parseUtcDate(ngayChay);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 7) {
    return "CU_QUA_7_NGAY";
  }

  // 4. Ngược lại HOP_LE
  return "HOP_LE";
}

/**
 * Định dạng chuỗi trạng thái địa điểm theo định nghĩa kiểm thử:
 * ["CÓ NỘI DUNG","CÓ NỘI DUNG","CÓ VI PHẠM","THIẾU DỮ LIỆU","CÓ NỘI DUNG","THIẾU DỮ LIỆU"]
 * -> "3/6 CÓ NỘI DUNG; 1 CÓ VI PHẠM; 0 CHƯA LẤP ĐỦ Ô; 2 THIẾU DỮ LIỆU"
 */
export function dinhDangTrangThaiDiaDiem(danhSach: string[]): string {
  const tong = danhSach.length;
  let coNoiDung = 0;
  let coViPham = 0;
  let chuaLapDuO = 0;
  let thieuDuLieu = 0;

  for (const item of danhSach) {
    const norm = item.trim().toUpperCase();
    if (norm === "CÓ NỘI DUNG" || norm.startsWith("CÓ NỘI DUNG")) coNoiDung++;
    else if (norm === "CÓ VI PHẠM" || norm.startsWith("CÓ VI PHẠM")) coViPham++;
    else if (norm === "CHƯA LẤP ĐỦ Ô" || norm.startsWith("CHƯA LẤP ĐỦ Ô")) chuaLapDuO++;
    else if (norm === "THIẾU DỮ LIỆU" || norm.startsWith("THIẾU DỮ LIỆU")) thieuDuLieu++;
  }

  return `${coNoiDung}/${tong} CÓ NỘI DUNG; ${coViPham} CÓ VI PHẠM; ${chuaLapDuO} CHƯA LẤP ĐỦ Ô; ${thieuDuLieu} THIẾU DỮ LIỆU`;
}

/**
 * Định dạng kết quả likes theo định nghĩa kiểm thử:
 * ["TĂNG","GIỮ NGUYÊN","TỆ ĐI","TĂNG","GIỮ NGUYÊN"] -> "2 tăng, 2 giữ nguyên, 1 tệ đi"
 */
export function dinhDangKetQuaLikes(danhSach: string[]): string {
  let tang = 0;
  let giuNguyen = 0;
  let teDi = 0;

  for (const item of danhSach) {
    const norm = item.trim().toUpperCase();
    if (norm === "TĂNG") tang++;
    else if (norm === "GIỮ NGUYÊN") giuNguyen++;
    else if (norm === "TỆ ĐI") teDi++;
  }

  return `${tang} tăng, ${giuNguyen} giữ nguyên, ${teDi} tệ đi`;
}

export interface DiadiemFallbackItem {
  diemDen: string;
  geocodeThanhCong?: boolean;
  trangThaiNoiDung?: string;
  coNoiDung?: boolean;
  nguonDL?: string;
  soLuongTheoLoai?: {
    khachSan: number;
    quanAn: number;
    cafe: number;
    hoatDong: number;
  };
  soSlotChuaLap?: {
    hoatDong: number;
    buaAn: number;
  };
  keHoachHopLe?: boolean;
}

export interface ValidSnapshotRef {
  file: string;
  diemDen?: string;
}

/**
 * Kiểm tra điểm đến có snapshot hợp lệ hay không dựa trên danh sách snapshot hợp lệ.
 */
export function coSnapshotHopLeChoDiemDen(
  diemDen: string,
  danhSachHopLe: ValidSnapshotRef[]
): boolean {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/^(thanh pho|tp|tinh|quan|huyen|city of)\s+/i, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();

  const target = norm(diemDen);
  if (!target) return false;

  return danhSachHopLe.some((item) => {
    const fileTarget = norm(item.file.replace(".json", ""));
    const nameTarget = item.diemDen ? norm(item.diemDen) : "";
    return (
      (fileTarget && (fileTarget.includes(target) || target.includes(fileTarget))) ||
      (nameTarget && (nameTarget.includes(target) || target.includes(nameTarget)))
    );
  });
}

export interface KetQuaXuLyDiadiemFallback {
  statuses: string[];
  summary: string;
  rows: Array<{
    diemDen: string;
    geocodeThanhCong: boolean;
    trangThaiHienThi: string;
    nguonDL: string;
    sl: string;
    oChuaLapHienThi: string;
    ketQuaKeHoach: string;
  }>;
}

/**
 * Xử lý dữ liệu bảng có dự phòng của diadiem:
 * - Điểm đến KHÔNG có snapshot hợp lệ -> trạng thái = "THIẾU DỮ LIỆU (không có snapshot)", ô chưa lấp = "—"
 * - Điểm đến có snapshot hợp lệ -> giữ trạng thái ghi nhận kèm ghi chú "(từ lần chạy ngày X)"
 */
export function xuLyBangDiadiemFallback(
  items: DiadiemFallbackItem[],
  validSnapshots: ValidSnapshotRef[],
  dateStr: string
): KetQuaXuLyDiadiemFallback {
  const statuses: string[] = [];
  const rows = items.map((it) => {
    const coSnap = coSnapshotHopLeChoDiemDen(it.diemDen, validSnapshots);
    const sl = it.soLuongTheoLoai
      ? `${it.soLuongTheoLoai.khachSan}/${it.soLuongTheoLoai.quanAn}/${it.soLuongTheoLoai.cafe}/${it.soLuongTheoLoai.hoatDong}`
      : "-";

    if (!coSnap) {
      const statusText = "THIẾU DỮ LIỆU (không có snapshot)";
      statuses.push(statusText);
      return {
        diemDen: it.diemDen,
        geocodeThanhCong: Boolean(it.geocodeThanhCong),
        trangThaiHienThi: `**${statusText}**`,
        nguonDL: "—",
        sl: "—",
        oChuaLapHienThi: "—",
        ketQuaKeHoach: "❌ Thiếu snapshot hợp lệ trong src/data/snapshots",
      };
    }

    const recordedStatus =
      it.trangThaiNoiDung || (it.coNoiDung ? "CÓ NỘI DUNG" : "THIẾU DỮ LIỆU");
    statuses.push(recordedStatus);

    const oChuaLap = it.soSlotChuaLap
      ? `HĐ:${it.soSlotChuaLap.hoatDong}, Ăn:${it.soSlotChuaLap.buaAn}`
      : "0";

    return {
      diemDen: it.diemDen,
      geocodeThanhCong: Boolean(it.geocodeThanhCong),
      trangThaiHienThi: `**${recordedStatus}** (từ lần chạy ngày ${dateStr})`,
      nguonDL: it.nguonDL || "snapshot",
      sl,
      oChuaLapHienThi: oChuaLap,
      ketQuaKeHoach: it.keHoachHopLe ? "✅ Hợp lệ, đủ ô" : "❌ Chưa đạt",
    };
  });

  const summary = dinhDangTrangThaiDiaDiem(statuses);
  return { statuses, summary, rows };
}
