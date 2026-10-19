/**
 * src/contracts/destinations.ts
 *
 * Danh sách điểm đến và điểm khởi hành phổ biến
 */

import type { DiemDen } from "./index";

export interface DestinationPreset {
  ten: string;
  quocGia: string;
  maQuocGia: string;
  toaDo: { lat: number; lng: number };
  tienTe: string;
}

export const POPULAR_DESTINATIONS: DestinationPreset[] = [
  { ten: "Đà Nẵng", quocGia: "Việt Nam", maQuocGia: "VN", toaDo: { lat: 16.0544, lng: 108.2022 }, tienTe: "VND" },
  { ten: "Hà Nội", quocGia: "Việt Nam", maQuocGia: "VN", toaDo: { lat: 21.0285, lng: 105.8542 }, tienTe: "VND" },
  { ten: "Đà Lạt", quocGia: "Việt Nam", maQuocGia: "VN", toaDo: { lat: 11.9404, lng: 108.4583 }, tienTe: "VND" },
  { ten: "Phú Quốc", quocGia: "Việt Nam", maQuocGia: "VN", toaDo: { lat: 10.2899, lng: 103.9840 }, tienTe: "VND" },
  { ten: "Nha Trang", quocGia: "Việt Nam", maQuocGia: "VN", toaDo: { lat: 12.2388, lng: 109.1967 }, tienTe: "VND" },
  { ten: "Bangkok", quocGia: "Thái Lan", maQuocGia: "TH", toaDo: { lat: 13.7563, lng: 100.5018 }, tienTe: "THB" },
  { ten: "Seoul", quocGia: "Hàn Quốc", maQuocGia: "KR", toaDo: { lat: 37.5665, lng: 126.9780 }, tienTe: "KRW" },
  { ten: "Tokyo", quocGia: "Nhật Bản", maQuocGia: "JP", toaDo: { lat: 35.6762, lng: 139.6503 }, tienTe: "JPY" },
];

export const POPULAR_ORIGINS: DestinationPreset[] = [
  { ten: "TP.HCM", quocGia: "Việt Nam", maQuocGia: "VN", toaDo: { lat: 10.7769, lng: 106.7009 }, tienTe: "VND" },
  { ten: "Hà Nội", quocGia: "Việt Nam", maQuocGia: "VN", toaDo: { lat: 21.0285, lng: 105.8542 }, tienTe: "VND" },
  { ten: "Đà Nẵng", quocGia: "Việt Nam", maQuocGia: "VN", toaDo: { lat: 16.0544, lng: 108.2022 }, tienTe: "VND" },
];

export function toDiemDen(preset: DestinationPreset): DiemDen {
  return {
    ten: preset.ten,
    quocGia: preset.quocGia,
    maQuocGia: preset.maQuocGia,
    toaDo: preset.toaDo,
    tienTe: preset.tienTe,
    nguon: "nominatim",
    ngayLay: new Date().toISOString().slice(0, 10),
  };
}
