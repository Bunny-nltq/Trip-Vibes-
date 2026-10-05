import { describe, it, expect } from "vitest";
import { checkBill } from "./checkBill";
import type { BillExtractionRaw } from "@/contracts";

function mockRaw(overrides: Partial<BillExtractionRaw> = {}): BillExtractionRaw {
  return {
    laChungTu: true,
    loaiChungTu: "hoa_don",
    tenCuaHang: "Test",
    ngay: "2026-10-05",
    tongTienVND: 108000,
    tamTinhVND: null,
    giamGiaVND: 20000,
    phuThuVND: null,
    thueVND: null,
    dongChiTiet: [
      { ten: "Món 1", soLuong: 1, thanhTienVND: 58000 },
      { ten: "Món 2", soLuong: 1, thanhTienVND: 25000 },
      { ten: "Món 3", soLuong: 1, thanhTienVND: 45000 },
    ],
    hangMucGoiY: "an_uong",
    doTinCay: "cao",
    ghiChu: [],
    ...overrides,
  };
}

describe("checkBill", () => {
  it("T1: dòng [58000, 25000, 45000], giamGiaVND 20000, tong 108000 -> khopCacDong true", () => {
    const raw = mockRaw();
    const res = checkBill(raw);
    expect(res.khopCacDong).toBe(true);
    expect(res.chenhLechVND).toBe(0);
    expect(res.status).toBe("can_xac_nhan");
  });

  it("T2: cùng dòng, giamGiaVND 20000, tong 128000 -> khop false, chenhLech 20000, canhBao", () => {
    const raw = mockRaw({ tongTienVND: 128000 });
    const res = checkBill(raw);
    expect(res.khopCacDong).toBe(false);
    expect(res.chenhLechVND).toBe(20000);
    expect(res.canhBao).toContain("tong_khong_khop_cac_dong");
  });

  it("T3: dòng [90000, 100000, 50000, 40000], phuThuVND 28000, tong 308000 -> khopCacDong true", () => {
    const raw = mockRaw({
      giamGiaVND: null,
      tongTienVND: 308000,
      phuThuVND: 28000,
      dongChiTiet: [
        { ten: "Món 1", soLuong: null, thanhTienVND: 90000 },
        { ten: "Món 2", soLuong: null, thanhTienVND: 100000 },
        { ten: "Món 3", soLuong: null, thanhTienVND: 50000 },
        { ten: "Món 4", soLuong: null, thanhTienVND: 40000 },
      ],
    });
    const res = checkBill(raw);
    expect(res.khopCacDong).toBe(true);
  });

  it("T4: tong 620 -> so_tien_qua_nho; tong 60000000 -> so_tien_qua_lon", () => {
    const r1 = checkBill(mockRaw({ tongTienVND: 620 }));
    expect(r1.canhBao).toContain("so_tien_qua_nho");

    const r2 = checkBill(mockRaw({ tongTienVND: 60000000 }));
    expect(r2.canhBao).toContain("so_tien_qua_lon");
  });

  it("T5: tong 560000.5 và tong -5000 -> tongTienVND null, so_tien_khong_hop_le:tongTienVND, khong_doc_duoc_so_tien", () => {
    const r1 = checkBill(mockRaw({ tongTienVND: 560000.5 }));
    expect(r1.tongTienVND).toBeNull();
    expect(r1.canhBao).toContain("so_tien_khong_hop_le:tongTienVND");
    expect(r1.status).toBe("khong_doc_duoc_so_tien");

    const r2 = checkBill(mockRaw({ tongTienVND: -5000 }));
    expect(r2.tongTienVND).toBeNull();
    expect(r2.canhBao).toContain("so_tien_khong_hop_le:tongTienVND");
    expect(r2.status).toBe("khong_doc_duoc_so_tien");
  });

  it("T6: laChungTu false -> status khong_phai_chung_tu", () => {
    const res = checkBill(mockRaw({ laChungTu: false }));
    expect(res.status).toBe("khong_phai_chung_tu");
  });

  it("T7: ngay hợp lệ và không hợp lệ", () => {
    const r1 = checkBill(mockRaw({ ngay: "2026-02-29" }));
    expect(r1.ngay).toBeNull();
    expect(r1.canhBao).toContain("ngay_khong_hop_le");

    const r2 = checkBill(mockRaw({ ngay: "2024-02-29" }));
    expect(r2.ngay).toBe("2024-02-29");

    const r3 = checkBill(mockRaw({ ngay: "2026-09-22" }));
    expect(r3.ngay).toBe("2026-09-22");

    const r4 = checkBill(mockRaw({ ngay: "22/09/2026" }));
    expect(r4.ngay).toBeNull();
    expect(r4.canhBao).toContain("ngay_khong_hop_le");
  });

  it("T8: không có dòng -> khopCacDong null và khong_du_dong_de_doi_chieu", () => {
    const res = checkBill(mockRaw({ dongChiTiet: [] }));
    expect(res.khopCacDong).toBeNull();
    expect(res.canhBao).toContain("khong_du_dong_de_doi_chieu");
  });

  it("T9: một dòng thiếu thanhTienVND -> khopCacDong null và dong_thieu_thanh_tien", () => {
    const raw = mockRaw();
    raw.dongChiTiet[0].thanhTienVND = null;
    const res = checkBill(raw);
    expect(res.khopCacDong).toBeNull();
    expect(res.canhBao).toContain("dong_thieu_thanh_tien");
  });
});
