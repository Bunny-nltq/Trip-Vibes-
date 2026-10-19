/**
 * Quy đổi số tiền ngoại tệ sang VND theo tỷ giá
 * Làm tròn số nguyên theo kiểu nửa lên (round half up)
 */
export function quyDoiVND(soTien: number, tyGiaSangVND: number): number {
  return Math.floor(soTien * tyGiaSangVND + 0.5);
}
