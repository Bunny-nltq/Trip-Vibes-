/**
 * src/core/soDem.ts
 *
 * Tính số đêm ở khách sạn dựa vào số ngày của chuyến đi và thời điểm đến thực tế.
 * - gioDenTuyetDoiPhut: Phút tính từ 00:00 của ngày 1 (giờ khởi hành chiều đi + thời lượng di chuyển).
 * - Nếu đến cùng ngày 1 (gioDenTuyetDoiPhut < 1440): soDem = soNgay - 1.
 * - Nếu đến sau nửa đêm (ngày 2, 3...): trừ bớt các đêm đã nằm trên phương tiện di chuyển.
 * Công thức: Math.max(0, soNgay - (Math.floor(gioDenTuyetDoiPhut / 1440) + 1))
 */

export function soDemOKhachSan(
  soNgay: number,
  gioDenTuyetDoiPhut: number
): number {
  if (soNgay <= 0) return 0;
  return Math.max(0, soNgay - (Math.floor(gioDenTuyetDoiPhut / 1440) + 1));
}
