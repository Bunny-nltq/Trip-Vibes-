/**
 * src/core/tripProgress.ts
 *
 * Hàm thuần tính tiến độ chuyến đi và gom địa điểm theo ngày.
 * Tuân thủ AGENTS.md:
 * - Không import AI hay UI.
 * - Mọi phép tính nằm ở core.
 */

import type { Plan } from "@/contracts";
import { getDiemDenTen } from "@/contracts";

export interface ProgressPlace {
  id: string;
  ngay: number;
  gio: string | null;
  hangMuc: string;
  ten: string;
  thanhTien: number;
  diaChi?: string;
  thoiGianDiChuyenPhut?: number;
  mapsUrl?: string;
  mapsUrls?: {
    xem?: string;
    chiDuong?: string;
    apple?: string;
  };
}

/**
 * Gom các địa điểm đến tham quan / trải nghiệm theo ngày từ kế hoạch.
 * Loại trừ phương tiện và chỗ ở (chỉ lấy hoạt động, quán ăn, cafe nếu có).
 */
export function gomDiaDiemTheoNgay(plan: Plan): Record<number, ProgressPlace[]> {
  const soNgay = plan.request.soNgay || 3;
  const tenDiemDen = getDiemDenTen(plan.request.diemDen);
  const locationSuffix = tenDiemDen ? `, ${tenDiemDen}` : "";

  const result: Record<number, ProgressPlace[]> = {};
  for (let d = 1; d <= soNgay; d++) {
    result[d] = [];
  }

  for (let i = 0; i < plan.items.length; i++) {
    const item = plan.items[i];
    const isPlace =
      item.hangMuc === "Vui chơi" ||
      (item.hangMuc === "Ăn uống" && Boolean(item.refId));

    if (!isPlace) continue;

    const d = item.ngay;
    if (!result[d]) result[d] = [];

    const cleanName = item.noiDung
      .replace(/^(Trưa:|Tối:|Cà phê:|Vui chơi:)\s*/i, "")
      .split("(")[0]
      .trim();

    const id = item.refId || `place-${item.ngay}-${i}`;

    const place: ProgressPlace = {
      id,
      ngay: d,
      gio: item.gio,
      hangMuc: item.hangMuc,
      ten: cleanName,
      thanhTien: item.thanhTien,
      diaChi: `${cleanName}${locationSuffix}`,
      mapsUrl: item.mapsUrl,
      mapsUrls: {
        xem: item.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cleanName}${locationSuffix}`)}`,
        chiDuong: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${cleanName}${locationSuffix}`)}`,
        apple: `http://maps.apple.com/?daddr=${encodeURIComponent(`${cleanName}${locationSuffix}`)}`,
      },
    };

    result[d].push(place);
  }

  return result;
}

/**
 * Tính tiến độ đến các địa điểm:
 * - diaDiem: danh sách địa điểm hoặc kết quả từ gomDiaDiemTheoNgay
 * - ticked: Set<string> | string[] | Record<string, boolean>
 * Trả: { daDen, tong, phanTram }
 */
export function tinhTienDo(
  diaDiem:
    | Array<{ id: string }>
    | Record<number, Array<{ id: string }>>,
  ticked: string[] | Set<string> | Record<string, boolean>
): { daDen: number; tong: number; phanTram: number } {
  const flatPlaces: Array<{ id: string }> = Array.isArray(diaDiem)
    ? diaDiem
    : Object.values(diaDiem).flat();

  const tong = flatPlaces.length;
  if (tong === 0) {
    return { daDen: 0, tong: 0, phanTram: 0 };
  }

  let tickedSet: Set<string>;
  if (ticked instanceof Set) {
    tickedSet = ticked;
  } else if (Array.isArray(ticked)) {
    tickedSet = new Set(ticked);
  } else if (typeof ticked === "object" && ticked !== null) {
    tickedSet = new Set(
      Object.keys(ticked).filter((k) => Boolean(ticked[k]))
    );
  } else {
    tickedSet = new Set();
  }

  const placeIds = new Set(flatPlaces.map((p) => p.id));
  let daDen = 0;
  for (const id of placeIds) {
    if (tickedSet.has(id)) {
      daDen++;
    }
  }

  const phanTram = Math.round((daDen / tong) * 100);

  return { daDen, tong, phanTram };
}
