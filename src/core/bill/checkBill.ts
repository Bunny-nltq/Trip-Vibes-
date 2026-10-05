import type { BillExtractionRaw, BillExtraction } from "@/contracts";

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const parts = dateString.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (year < 1000 || year > 9999 || month === 0 || month > 12) return false;
  const monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
    monthLength[1] = 29;
  }
  return day > 0 && day <= monthLength[month - 1];
}

export function checkBill(raw: BillExtractionRaw): BillExtraction {
  const canhBao: string[] = [];

  // Copy raw properties
  let {
    laChungTu,
    loaiChungTu,
    tenCuaHang,
    ngay,
    tongTienVND,
    tamTinhVND,
    giamGiaVND,
    phuThuVND,
    thueVND,
    dongChiTiet,
    hangMucGoiY,
    doTinCay,
    ghiChu,
  } = raw;

  // Validate number fields (must be integers >= 0)
  const checkNumber = (val: number | null, name: string): number | null => {
    if (val !== null && (!Number.isInteger(val) || val < 0)) {
      canhBao.push(`so_tien_khong_hop_le:${name}`);
      return null;
    }
    return val;
  };

  tongTienVND = checkNumber(tongTienVND, "tongTienVND");
  tamTinhVND = checkNumber(tamTinhVND, "tamTinhVND");
  giamGiaVND = checkNumber(giamGiaVND, "giamGiaVND");
  phuThuVND = checkNumber(phuThuVND, "phuThuVND");
  thueVND = checkNumber(thueVND, "thueVND");

  dongChiTiet = dongChiTiet.map(d => ({
    ten: d.ten,
    soLuong: checkNumber(d.soLuong, "soLuong"),
    thanhTienVND: checkNumber(d.thanhTienVND, "thanhTienVND"),
  }));

  // Validate date
  if (ngay) {
    if (!isValidDate(ngay)) {
      ngay = null;
      canhBao.push("ngay_khong_hop_le");
    }
  }

  // Check boundaries
  if (tongTienVND !== null) {
    if (tongTienVND < 1000) canhBao.push("so_tien_qua_nho");
    if (tongTienVND > 50000000) canhBao.push("so_tien_qua_lon");
  }

  if (doTinCay === "thap") {
    canhBao.push("do_tin_cay_thap");
  }

  // Determine status
  let status: BillExtraction["status"] = "can_xac_nhan";
  if (!laChungTu) {
    status = "khong_phai_chung_tu";
  } else if (laChungTu && tongTienVND === null) {
    status = "khong_doc_duoc_so_tien";
  }

  // Check rows sum
  let khopCacDong: boolean | null = null;
  let chenhLechVND: number | null = null;

  if (dongChiTiet.length === 0) {
    khopCacDong = null;
    canhBao.push("khong_du_dong_de_doi_chieu");
  } else {
    const hasNull = dongChiTiet.some(d => d.thanhTienVND === null);
    if (hasNull) {
      khopCacDong = null;
      canhBao.push("dong_thieu_thanh_tien");
    } else if (tongTienVND !== null) {
      const sum = dongChiTiet.reduce((acc, d) => acc + (d.thanhTienVND || 0), 0);
      const expected = sum + (phuThuVND || 0) + (thueVND || 0) - (giamGiaVND || 0);
      if (expected === tongTienVND) {
        khopCacDong = true;
        chenhLechVND = 0;
      } else {
        khopCacDong = false;
        chenhLechVND = tongTienVND - expected;
        canhBao.push("tong_khong_khop_cac_dong");
      }
    }
  }

  return {
    laChungTu,
    loaiChungTu,
    tenCuaHang,
    ngay,
    tongTienVND,
    tamTinhVND,
    giamGiaVND,
    phuThuVND,
    thueVND,
    dongChiTiet,
    hangMucGoiY,
    doTinCay,
    ghiChu,
    status,
    khopCacDong,
    chenhLechVND,
    canhBao,
  };
}
