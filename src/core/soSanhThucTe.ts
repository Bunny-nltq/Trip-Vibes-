import type { Plan, Ledger } from "@/contracts";

export interface HangMucSoSanh {
  hangMuc: "Ăn uống" | "Vui chơi" | "Khác";
  keHoachVND: number;
  thucTeVND: number;
  chenhVND: number;
  chenhPhanTram: number;
}

export interface SoSanhKeHoachThucTeResult {
  denHetNgayHieuLuc: number;
  datTruocVND: number;
  thucTeTongVND: number;
  conLaiVND: number;
  bang: HangMucSoSanh[];
  tong: {
    keHoachVND: number;
    thucTeVND: number;
    chenhVND: number;
    chenhPhanTram: number;
  };
  duBao: {
    keHoachNgayConLaiVND: number;
    conLaiSauChiTieuVND: number;
    chenhDuBaoVND: number;
    trangThai: "du" | "thieu";
  };
}

function roundHalfUp1Dec(val: number): number {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  return sign * (Math.round((abs + Number.EPSILON) * 10) / 10);
}

export function soSanhKeHoachThucTe(
  plan: Plan,
  ledger: Ledger,
  denHetNgay: number
): SoSanhKeHoachThucTeResult {
  // 1. denHetNgayHieuLuc = max(denHetNgay, ngày lớn nhất của các khoản chi)
  const maxNgayChi = ledger.expenses.reduce((max, exp) => {
    return exp.ngayTrongChuyen != null ? Math.max(max, exp.ngayTrongChuyen) : max;
  }, 0);
  const denHetNgayHieuLuc = Math.max(denHetNgay, maxNgayChi);

  // 2. datTruocVND = tổng Di chuyển + Chỗ ở của kế hoạch
  const datTruocVND =
    (plan.tongKet?.theoHangMuc?.["Di chuyển"] ?? 0) +
    (plan.tongKet?.theoHangMuc?.["Chỗ ở"] ?? 0);

  // 3. Ngân sách lấy từ plan.tongKet
  const nganSachVND =
    plan.tongKet.tongVND + plan.tongKet.conLaiVND;

  // 4. thucTeTongVND = tổng MỌI khoản chi trong sổ
  const thucTeTongVND = ledger.expenses.reduce(
    (sum, exp) => sum + exp.soTienVND,
    0
  );

  // 5. conLaiVND = ngân sách - datTruocVND - thucTeTongVND
  const conLaiVND = nganSachVND - datTruocVND - thucTeTongVND;

  // 6. Tính thực tế theo các khoản có ngayTrongChuyen <= denHetNgayHieuLuc
  // (ngayTrongChuyen null tính vào denHetNgayHieuLuc, tức là được tính vào đây)
  let thucTeAnUong = 0;
  let thucTeVuiChoi = 0;
  let thucTeKhac = 0;

  for (const exp of ledger.expenses) {
    const ngay = exp.ngayTrongChuyen ?? denHetNgayHieuLuc;
    if (ngay <= denHetNgayHieuLuc) {
      if (exp.hangMuc === "an_uong") {
        thucTeAnUong += exp.soTienVND;
      } else if (exp.hangMuc === "vui_choi") {
        thucTeVuiChoi += exp.soTienVND;
      } else {
        // di_chuyen, cho_o, khac gộp thành "Khác"
        thucTeKhac += exp.soTienVND;
      }
    }
  }

  // 7. Kế hoạch tính từ ngày 1 đến denHetNgayHieuLuc
  let keHoachAnUong = 0;
  let keHoachVuiChoi = 0;

  for (const item of plan.items) {
    if (item.ngay >= 1 && item.ngay <= denHetNgayHieuLuc) {
      if (item.hangMuc === "Ăn uống") {
        keHoachAnUong += item.thanhTien;
      } else if (item.hangMuc === "Vui chơi") {
        keHoachVuiChoi += item.thanhTien;
      }
    }
  }

  const keHoachKhac = 0; // Hàng "Khác" kế hoạch = 0

  const calcRow = (
    hangMuc: "Ăn uống" | "Vui chơi" | "Khác",
    keHoach: number,
    thucTe: number
  ): HangMucSoSanh => {
    const chenhVND = thucTe - keHoach;
    const chenhPhanTram =
      keHoach === 0 ? 0 : roundHalfUp1Dec((chenhVND / keHoach) * 100);
    return {
      hangMuc,
      keHoachVND: keHoach,
      thucTeVND: thucTe,
      chenhVND,
      chenhPhanTram,
    };
  };

  const bang: HangMucSoSanh[] = [
    calcRow("Ăn uống", keHoachAnUong, thucTeAnUong),
    calcRow("Vui chơi", keHoachVuiChoi, thucTeVuiChoi),
    calcRow("Khác", keHoachKhac, thucTeKhac),
  ];

  // 8. Hàng tổng
  const tongKeHoachVND = keHoachAnUong + keHoachVuiChoi + keHoachKhac;
  const tongThucTeVND = thucTeAnUong + thucTeVuiChoi + thucTeKhac;
  const tongChenhVND = tongThucTeVND - tongKeHoachVND;
  const tongChenhPhanTram =
    tongKeHoachVND === 0
      ? 0
      : roundHalfUp1Dec((tongChenhVND / tongKeHoachVND) * 100);

  const tong = {
    keHoachVND: tongKeHoachVND,
    thucTeVND: tongThucTeVND,
    chenhVND: tongChenhVND,
    chenhPhanTram: tongChenhPhanTram,
  };

  // 9. Dự báo: Ăn uống + Vui chơi theo kế hoạch của các ngày SAU denHetNgayHieuLuc
  let keHoachNgayConLaiVND = 0;
  for (const item of plan.items) {
    if (item.ngay > denHetNgayHieuLuc) {
      if (item.hangMuc === "Ăn uống" || item.hangMuc === "Vui chơi") {
        keHoachNgayConLaiVND += item.thanhTien;
      }
    }
  }

  const chenhDuBaoVND = conLaiVND - keHoachNgayConLaiVND;
  const trangThai: "du" | "thieu" = chenhDuBaoVND >= 0 ? "du" : "thieu";

  return {
    denHetNgayHieuLuc,
    datTruocVND,
    thucTeTongVND,
    conLaiVND,
    bang,
    tong,
    duBao: {
      keHoachNgayConLaiVND,
      conLaiSauChiTieuVND: conLaiVND,
      chenhDuBaoVND,
      trangThai,
    },
  };
}
