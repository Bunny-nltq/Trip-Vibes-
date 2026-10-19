export interface ToaDo {
  lat: number;
  lng: number;
}

/**
 * Tính khoảng cách đường chim bay giữa hai toạ độ theo công thức Haversine
 * Bán kính Trái Đất: 6371 km
 * Làm tròn 1 chữ số thập phân kiểu nửa lên (round half up)
 */
export function khoangCachKm(a: ToaDo, b: ToaDo): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sinDLat2 = Math.sin(dLat / 2);
  const sinDLng2 = Math.sin(dLng / 2);

  const h =
    sinDLat2 * sinDLat2 +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng2 * sinDLng2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  const d = R * c;

  // Làm tròn 1 chữ số kiểu nửa lên
  return Math.floor(d * 10 + 0.5) / 10;
}
