/**
 * src/core/nhanNguon.ts
 *
 * Hàm thuần tạo nhãn hiển thị nguồn dữ liệu bằng tiếng Việt.
 * Tuân thủ AGENTS.md: không phụ thuộc UI, không gọi API, định dạng ngày theo UTC.
 */

export interface NhanNguonParams {
  dataSourceUsed?: string | null;
  ngay?: string | null;
  tuoiGio?: number | string | null;
}

function formatUtcDate(ngay?: string | null): string {
  if (!ngay) return "";
  const d = new Date(ngay);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function formatTuoiGio(tuoiGio?: number | string | null): string {
  if (tuoiGio === undefined || tuoiGio === null) return "";
  return String(tuoiGio).trim().replace(".", ",");
}

export function nhanNguonDuLieu(params?: NhanNguonParams | null): string {
  if (!params || !params.dataSourceUsed) {
    return "Không rõ nguồn dữ liệu";
  }

  const ds = params.dataSourceUsed.toLowerCase().trim();

  if (ds === "mock") {
    return "DỮ LIỆU MẪU";
  }

  if (ds === "snapshot") {
    const formattedDate = formatUtcDate(params.ngay);
    return formattedDate
      ? `Dữ liệu đã lưu ngày ${formattedDate}`
      : "Dữ liệu đã lưu";
  }

  if (ds === "live") {
    const formattedDate = formatUtcDate(params.ngay);
    return formattedDate
      ? `Lấy mới từ OpenStreetMap ngày ${formattedDate}`
      : "Lấy mới từ OpenStreetMap";
  }

  if (ds === "cache") {
    const formattedHours = formatTuoiGio(params.tuoiGio);
    return formattedHours
      ? `Dữ liệu lưu tạm (${formattedHours} giờ trước)`
      : "Dữ liệu lưu tạm";
  }

  return "Không rõ nguồn dữ liệu";
}
