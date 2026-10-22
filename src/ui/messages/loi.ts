/**
 * src/ui/messages/loi.ts
 *
 * Bảng thông báo lỗi cụ thể và hành động điều hướng/khắc phục.
 * Tuân thủ quy tắc: Không dùng emoji, chỉ dùng chuỗi văn bản rõ ràng,
 * mỗi lỗi có hành động cụ thể.
 */

export interface ThongBaoLoi {
  tieuDe: string;
  noiDung: string;
  hanhDong?: {
    nhan: string;
    loai:
      | "thu_lai"
      | "sua_yeu_cau"
      | "chon_diem_den_khac"
      | "nhap_gia_tay"
      | "tang_ngan_sach"
      | "dong";
  };
}

export const BANG_MA_LOI: Record<string, ThongBaoLoi> = {
  // ─── Lỗi Form B1 cục bộ ───
  diem_di_thieu: {
    tieuDe: "Thiếu điểm khởi hành",
    noiDung: "Vui lòng chọn hoặc nhập điểm đi của chuyến đi.",
    hanhDong: { nhan: "Chọn điểm đi", loai: "sua_yeu_cau" },
  },
  diem_den_thieu: {
    tieuDe: "Thiếu điểm đến",
    noiDung: "Vui lòng chọn hoặc nhập điểm đến bạn muốn tới.",
    hanhDong: { nhan: "Chọn điểm đến", loai: "sua_yeu_cau" },
  },
  diem_di_trung_diem_den: {
    tieuDe: "Điểm đi trùng điểm đến",
    noiDung: "Điểm khởi hành và điểm đến nằm cùng khu vực (dưới 15 km). Vui lòng chọn điểm đến khác.",
    hanhDong: { nhan: "Đổi điểm đến", loai: "chon_diem_den_khac" },
  },
  so_nguoi_ngoai_pham_vi: {
    tieuDe: "Số người không hợp lệ",
    noiDung: "Số người đi phải nằm trong khoảng từ 1 đến 10 người.",
    hanhDong: { nhan: "Sửa số người", loai: "sua_yeu_cau" },
  },
  ngan_sach_khong_hop_le: {
    tieuDe: "Ngân sách không hợp lệ",
    noiDung: "Ngân sách dự kiến phải là số nguyên dương hợp lệ (lớn hơn 0 đ).",
    hanhDong: { nhan: "Nhập lại ngân sách", loai: "sua_yeu_cau" },
  },
  so_ngay_ngoai_pham_vi: {
    tieuDe: "Số ngày nằm ngoài phạm vi",
    noiDung: "Chuyến đi hỗ trợ từ 2 đến 5 ngày (tương ứng 1 đến 4 đêm).",
    hanhDong: { nhan: "Chọn lại thời gian", loai: "sua_yeu_cau" },
  },
  ghi_chu_qua_dai: {
    tieuDe: "Ghi chú vượt quá độ dài",
    noiDung: "Nội dung ghi chú tối đa 500 ký tự. Vui lòng rút gọn lại.",
    hanhDong: { nhan: "Rút gọn ghi chú", loai: "sua_yeu_cau" },
  },

  // ─── Lỗi dịch vụ Geocoding / Điểm đến ───
  geocode_khong_thay: {
    tieuDe: "Không tìm thấy địa điểm",
    noiDung: "Không tìm thấy địa điểm này. Thử gõ tên đầy đủ hoặc thêm tên nước.",
    hanhDong: { nhan: "Thử tìm lại", loai: "thu_lai" },
  },
  geocode_mo_ho: {
    tieuDe: "Tên địa điểm mơ hồ",
    noiDung: "Tìm thấy nhiều địa điểm có tên tương tự. Vui lòng chọn cụ thể từ danh sách.",
    hanhDong: { nhan: "Chọn từ danh sách", loai: "sua_yeu_cau" },
  },
  geocode_ban: {
    tieuDe: "Dịch vụ đang bận",
    noiDung: "Dịch vụ tìm địa điểm đang bận, thử lại sau vài giây.",
    hanhDong: { nhan: "Thử lại", loai: "thu_lai" },
  },

  // ─── Lỗi mạng và API AI ───
  mang_loi: {
    tieuDe: "Lỗi kết nối mạng",
    noiDung: "Không kết nối được máy chủ. Vui lòng kiểm tra lại đường truyền internet.",
    hanhDong: { nhan: "Thử lại", loai: "thu_lai" },
  },
  gemini_het_luot: {
    tieuDe: "Hạn mức AI tạm thời hết",
    noiDung: "Hết lượt AI hôm nay, thử lại sau hoặc ngày mai.",
    hanhDong: { nhan: "Đóng", loai: "dong" },
  },

  // ─── Lỗi dữ liệu & Kế hoạch ───
  khong_du_du_lieu: {
    tieuDe: "Thiếu dữ liệu điểm đến",
    noiDung: "Hệ thống chưa đủ dữ liệu địa điểm (khách sạn, quán ăn hoặc hoạt động) để lập kế hoạch.",
    hanhDong: { nhan: "Thử lại phần còn thiếu", loai: "thu_lai" },
  },
  khong_co_du_lieu_luu_san: {
    tieuDe: "Chưa có dữ liệu lưu sẵn",
    noiDung: "Điểm đến này chưa có dữ liệu đã lưu. Hãy chạy chương trình trên máy để chuẩn bị dữ liệu.",
    hanhDong: { nhan: "Chọn điểm đến khác", loai: "chon_diem_den_khac" },
  },
  du_lieu_chua_san_sang: {
    tieuDe: "Dữ liệu đang được chuẩn bị",
    noiDung: "Dữ liệu cho điểm đến này đang được thu thập. Vui lòng đợi quá trình chuẩn bị hoàn tất.",
    hanhDong: { nhan: "Chờ dữ liệu", loai: "thu_lai" },
  },
  khong_co_phuong_an: {
    tieuDe: "Chưa có giá vé tự động",
    noiDung: "Không tìm thấy chuyến xe/vé máy bay phù hợp theo ngày dự kiến. Bạn có thể tự nhập giá vé.",
    hanhDong: { nhan: "Nhập giá vé tay", loai: "nhap_gia_tay" },
  },
  ngan_sach_khong_du: {
    tieuDe: "Ngân sách chưa đủ",
    noiDung: "Ngân sách dự kiến thấp hơn chi phí tối thiểu ước tính cho số người và số ngày đi.",
    hanhDong: { nhan: "Tăng ngân sách", loai: "tang_ngan_sach" },
  },
  loi_khong_ro: {
    tieuDe: "Đã xảy ra sự cố",
    noiDung: "Đã xảy ra lỗi không xác định trong quá trình xử lý.",
    hanhDong: { nhan: "Thử lại", loai: "thu_lai" },
  },
};

/**
 * Lấy thông báo lỗi kèm nội dung động nếu có (ví dụ tên địa điểm X, mức tối thiểu, requestId)
 */
export function layThongBaoLoi(
  maLoi: string,
  thamSo?: {
    tenDiaDiem?: string;
    nganSachToiThieu?: number;
    loaiThieu?: string;
    requestId?: string;
  }
): ThongBaoLoi {
  const goc = BANG_MA_LOI[maLoi] || BANG_MA_LOI.loi_khong_ro;
  let noiDung = goc.noiDung;

  if (maLoi === "geocode_khong_thay" && thamSo?.tenDiaDiem) {
    noiDung = `Không tìm thấy '${thamSo.tenDiaDiem}'. Thử gõ tên đầy đủ hoặc thêm tên nước.`;
  } else if (maLoi === "ngan_sach_khong_du" && thamSo?.nganSachToiThieu) {
    noiDung = `Ngân sách tối thiểu cần thiết ước tính là ${thamSo.nganSachToiThieu.toLocaleString("vi-VN")} đ.`;
  } else if (maLoi === "khong_du_du_lieu" && thamSo?.loaiThieu) {
    noiDung = `Thiếu dữ liệu ${thamSo.loaiThieu}. Hãy thử lại phần còn thiếu hoặc chọn điểm đến khác.`;
  } else if (maLoi === "loi_khong_ro" && thamSo?.requestId) {
    noiDung = `Đã xảy ra lỗi (Mã tham chiếu: ${thamSo.requestId}). Vui lòng gửi mã này để được hỗ trợ.`;
  }

  return {
    tieuDe: goc.tieuDe,
    noiDung,
    hanhDong: goc.hanhDong,
  };
}

/**
 * Làm sạch thông báo lỗi, tuyệt đối không lộ GEMINI_API_KEY, .env hoặc chi tiết nhạy cảm
 */
export function thongBaoLoiThanThien(rawMessage: string): string {
  if (!rawMessage || typeof rawMessage !== "string") {
    return "Đã xảy ra sự cố kết nối. Vui lòng thử lại sau.";
  }
  if (rawMessage.includes("GEMINI") || rawMessage.includes(".env")) {
    return "Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.";
  }
  if (rawMessage.includes("429") || rawMessage.includes("RESOURCE_EXHAUSTED")) {
    return "Hệ thống đang bận do nhiều yêu cầu. Vui lòng thử lại sau ít phút.";
  }
  return rawMessage;
}

export const thuongBaoLoiThanThien = thongBaoLoiThanThien;

