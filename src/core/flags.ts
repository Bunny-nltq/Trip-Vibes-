import {
  GIO_KHOI_HANH_SOM,
  GIO_DI_DEM_TU,
  GIO_DI_DEM_DEN,
  GIO_DEN_SOM,
  NGUONG_DI_CHUYEN_LAU_PHUT,
} from "./assumptions";

export interface TransportFlags {
  /** Số phút tính từ 00:00 của ngày đi */
  denLuc: number;
  /** Số ngày lệch giữa ngày đến và ngày đi (0 = trong ngày, 1 = hôm sau, ...) */
  soNgayLech: number;
  /** Giờ đến định dạng HH:MM */
  gioDen: string;
  /** Khởi hành sớm nếu gioDi < 08:00 */
  khoiHanhSom: boolean;
  /** Đi đêm nếu gioDi >= 22:00 hoặc gioDi < 05:00 */
  diDem: boolean;
  /** Đến sớm nếu gioDen < 06:00 */
  denSom: boolean;
  /** Di chuyển lâu nếu thoiLuongPhut > 360 phút (6 tiếng) */
  diChuyenLau: boolean;
}

/**
 * Tính toán thời gian đến thực tế và các cờ cảnh báo cho phương tiện.
 * Tuyệt đối không tin chuỗi arrivalTime trong dữ liệu; luôn tính từ gioDi + thoiLuongPhut.
 */
export function calculateTransportFlags(
  gioDi: string,
  thoiLuongPhut: number
): TransportFlags {
  const parts = gioDi.split(":");
  const gio = parseInt(parts[0], 10);
  const phut = parseInt(parts[1], 10);

  const phutKhoiHanh = gio * 60 + phut;
  const denLuc = phutKhoiHanh + thoiLuongPhut;

  const soNgayLech = Math.floor(denLuc / 1440);
  const phutTrongNgay = denLuc % 1440;

  const gioDenNum = Math.floor(phutTrongNgay / 60);
  const phutDenNum = phutTrongNgay % 60;

  const gioDen = `${String(gioDenNum).padStart(2, "0")}:${String(
    phutDenNum
  ).padStart(2, "0")}`;

  const khoiHanhSom = gioDi < GIO_KHOI_HANH_SOM;
  const diDem = gioDi >= GIO_DI_DEM_TU || gioDi < GIO_DI_DEM_DEN;
  const denSom = gioDen < GIO_DEN_SOM;
  const diChuyenLau = thoiLuongPhut > NGUONG_DI_CHUYEN_LAU_PHUT;

  return {
    denLuc,
    soNgayLech,
    gioDen,
    khoiHanhSom,
    diDem,
    denSom,
    diChuyenLau,
  };
}
