import {
  VAN_TOC_XE_KHACH_KMH,
  DON_GIA_XE_KHACH_D_KM,
  VAN_TOC_TAU_KMH,
  DON_GIA_TAU_D_KM,
  VAN_TOC_MAY_BAY_KMH,
  THOI_GIAN_CO_DINH_MAY_BAY_PHUT,
  GIA_CO_DINH_MAY_BAY_VND,
  DON_GIA_MAY_BAY_D_KM,
  HE_SO_DUONG_BO,
} from "./assumptions";
import { khoangCachKm } from "./haversine";
import type { DiemDen } from "@/contracts";

export type LoaiPhuongTienUocLuong = "xe_khach" | "tau" | "may_bay";

export interface KetQuaUocLuong {
  thoiLuongPhut: number;
  giaNguoi: number;
  doTinCay: "uoc_tinh";
}

/**
 * Làm tròn số nguyên theo kiểu nửa lên (round half up)
 */
function roundHalfUp(val: number): number {
  return Math.floor(val + 0.5);
}

/**
 * Ước lượng thời lượng và giá vé cho một loại phương tiện dựa trên khoảng cách km
 */
export function uocLuongPhuongTien(
  khoangCachKmVal: number,
  loai: LoaiPhuongTienUocLuong
): KetQuaUocLuong {
  let thoiLuongPhut = 0;
  let giaNguoi = 0;

  switch (loai) {
    case "xe_khach": {
      thoiLuongPhut = roundHalfUp(
        ((khoangCachKmVal * HE_SO_DUONG_BO) / VAN_TOC_XE_KHACH_KMH) * 60
      );
      giaNguoi = roundHalfUp(khoangCachKmVal * DON_GIA_XE_KHACH_D_KM);
      break;
    }
    case "tau": {
      thoiLuongPhut = roundHalfUp(
        ((khoangCachKmVal * HE_SO_DUONG_BO) / VAN_TOC_TAU_KMH) * 60
      );
      giaNguoi = roundHalfUp(khoangCachKmVal * DON_GIA_TAU_D_KM);
      break;
    }
    case "may_bay": {
      thoiLuongPhut = roundHalfUp(
        (khoangCachKmVal / VAN_TOC_MAY_BAY_KMH) * 60 + THOI_GIAN_CO_DINH_MAY_BAY_PHUT
      );
      giaNguoi = roundHalfUp(GIA_CO_DINH_MAY_BAY_VND + DON_GIA_MAY_BAY_D_KM * khoangCachKmVal);
      break;
    }
  }

  return {
    thoiLuongPhut,
    giaNguoi,
    doTinCay: "uoc_tinh",
  };
}

/**
 * Xác định các loại phương tiện có thể ước lượng giữa hai điểm đến
 * - Khoảng cách dưới 15 km: trả rỗng []
 * - Máy bay luôn có (khi d >= 15 km)
 * - Xe khách và tàu chỉ khi cả hai điểm thuộc mã quốc gia "VN"
 */
export function cacLoaiPhuongTienUocLuong(
  diemDi: DiemDen,
  diemDen: DiemDen
): LoaiPhuongTienUocLuong[] {
  const d = khoangCachKm(diemDi.toaDo, diemDen.toaDo);
  if (d < 15) {
    return [];
  }

  const res: LoaiPhuongTienUocLuong[] = ["may_bay"];

  if (diemDi.maQuocGia === "VN" && diemDen.maQuocGia === "VN") {
    res.push("tau", "xe_khach");
  }

  return res;
}
