/**
 * src/core/maps.ts
 *
 * Hàm thuần tạo URL bản đồ cho địa điểm.
 * Không import AI hay UI.
 */

export interface MapsUrls {
  /** Google Maps tìm kiếm địa điểm theo tên */
  xem: string;
  /** Google Maps chỉ đường đến toạ độ */
  chiDuong: string;
  /** Apple Maps chỉ đường */
  apple: string;
}

export interface PlaceForMaps {
  ten: string;
  toaDo: { lat: number; lng: number };
}

/**
 * buildMapsUrls: Tạo bộ URL Google Maps và Apple Maps cho một địa điểm.
 *
 * - xem: https://www.google.com/maps/search/?api=1&query=<ten>, Đà Nẵng
 * - chiDuong: https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>
 * - apple: https://maps.apple.com/?daddr=<lat>,<lng>
 */
export function buildMapsUrls(place: PlaceForMaps): MapsUrls {
  const queryStr = `${place.ten}, Đà Nẵng`;
  const latLngStr = `${place.toaDo.lat},${place.toaDo.lng}`;

  return {
    xem: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryStr)}`,
    chiDuong: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(latLngStr)}`,
    apple: `https://maps.apple.com/?daddr=${place.toaDo.lat},${place.toaDo.lng}`,
  };
}
