/**
 * scripts/lib/chuoiCam.ts
 *
 * Hàm thuần kiểm tra chuỗi cấm trong HTML (không phân biệt hoa thường):
 * "Bunny", "Cài đặt", "Bạn muốn đi đâu hôm nay", "Good trip", "Đi để thấy thế giới",
 * "Tính năng nổi bật", "AI Agent", "thông minh"
 */

export const DANH_SACH_CAM = [
  "Bunny",
  "Cài đặt",
  "Bạn muốn đi đâu hôm nay",
  "Good trip",
  "Đi để thấy thế giới",
  "Tính năng nổi bật",
  "AI Agent",
  "thông minh",
];

export function chuoiCam(html: string): string[] {
  if (!html) return [];
  const lower = html.toLowerCase();
  const ketQua: string[] = [];
  for (const tu of DANH_SACH_CAM) {
    if (lower.includes(tu.toLowerCase())) {
      ketQua.push(tu);
    }
  }
  return ketQua;
}
