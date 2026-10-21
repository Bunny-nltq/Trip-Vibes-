/**
 * src/ui/messages/canhBao.ts
 *
 * Bảng ánh xạ mã cảnh báo hệ thống sang lời Việt dễ hiểu.
 * Dùng tại B6, B3 và các màn hình hiển thị cảnh báo cho người dùng.
 */

export const BANG_ANH_XA_CANH_BAO: Record<string, string> = {
  ve_den_ngay_sau: "Chuyến về đến nơi vào ngày hôm sau",
  den_vao_ngay_sau: "Chuyến đi đến nơi vào ngày thứ hai, sau nửa đêm",
  di_chuyen_chiem_nhieu_thoi_gian: "Di chuyển chiếm nhiều thời gian của chuyến đi",
  den_truoc_gio_nhan_phong: "Đến sớm hơn giờ nhận phòng",
  gan_het_ngan_sach: "Sắp hết ngân sách",
  vuot_ngan_sach: "Vượt ngân sách",
  ngay_dau_den_muon: "Đến muộn, không kịp hoạt động ngày đầu",
  bo_hoat_dong_do_gio_giac: "Đã bỏ bớt hoạt động vì giờ giấc",
  o_trong_do_rang_buoc: "Còn ô trống do ràng buộc",
  vi_pham_khong_day_som: "Khởi hành hoặc đến nơi quá sớm",
  vi_pham_khong_di_dem: "Đi trong khung giờ đêm",
  vi_pham_tranh_di_chuyen_lau: "Thời gian di chuyển quá lâu",
  vi_pham_tranh_dong_nguoi: "Hoạt động thường đông người",
  vi_pham_tranh_di_bo_nhieu: "Hoạt động đòi hỏi đi bộ nhiều",
  hoat_dong_chong_len: "Hoạt động bị trùng hoặc sát giờ nhau",
  ngay_cuoi_khong_kip: "Hoạt động ngày cuối sát giờ khởi hành chuyến về",
  so_nguoi_khong_hop_le: "Số người không hợp lệ",
  ngoai_pham_vi_so_ngay: "Số ngày nằm ngoài phạm vi 2 đến 5 ngày",
  so_ngay_khong_hop_le: "Số ngày không hợp lệ",
  ngan_sach_khong_hop_le: "Ngân sách không hợp lệ",
  diem_den_mac_dinh: "Chưa rõ điểm đến",
  gioi_han_ip: "Đã đạt giới hạn lượt dùng AI trong giờ này; kế hoạch được lập bằng quy tắc tự động",
  gioi_han_ngay: "Đã đạt giới hạn lượt dùng AI trong ngày; kế hoạch được lập bằng quy tắc tự động",
};

/**
 * Trả về thông điệp tiếng Việt dễ hiểu cho một mã cảnh báo.
 * Nếu mã có hậu tố (như bo_hoat_dong_do_gio_giac_ngay_X) thì diễn giải tương ứng.
 */
export function moTaCanhBao(ma: string): string {
  if (BANG_ANH_XA_CANH_BAO[ma]) {
    return BANG_ANH_XA_CANH_BAO[ma];
  }
  if (ma.startsWith("bo_hoat_dong_do_gio_giac_ngay_")) {
    const ngay = ma.replace("bo_hoat_dong_do_gio_giac_ngay_", "");
    return `Đã bỏ bớt hoạt động ngày ${ngay} vì giờ giấc`;
  }
  return ma;
}
