import { describe, it, expect } from "vitest";
import {
  kiemTraFormB1,
  taoYeuCauTuForm,
  dinhDangTien,
  docTien,
  type FormB1,
} from "./formB1";
import type { DiemDen } from "@/contracts";

const TPHCM: DiemDen = {
  ten: "TP.HCM",
  quocGia: "Việt Nam",
  maQuocGia: "VN",
  toaDo: { lat: 10.7769, lng: 106.7009 },
  tienTe: "VND",
  nguon: "nominatim",
  ngayLay: "2026-10-20",
};

const DANANG: DiemDen = {
  ten: "Đà Nẵng",
  quocGia: "Việt Nam",
  maQuocGia: "VN",
  toaDo: { lat: 16.0544, lng: 108.2022 },
  tienTe: "VND",
  nguon: "nominatim",
  ngayLay: "2026-10-20",
};

describe("Kiểm tra và xử lý Form B1", () => {
  it("diemDi null, diemDen null, 2 người, 10.000.000 tổng, 3 ngày -> ['diem_di_thieu','diem_den_thieu']", () => {
    const form: FormB1 = {
      diemDi: null,
      diemDen: null,
      soNguoi: 2,
      nganSach: { soTien: 10_000_000, theo: "tong" },
      soNgay: 3,
      tranh: [],
      ghiChu: "",
    };
    expect(kiemTraFormB1(form)).toEqual(["diem_di_thieu", "diem_den_thieu"]);
  });

  it("diemDi và diemDen đều là TP.HCM (cùng toạ độ) -> chứa 'diem_di_trung_diem_den'", () => {
    const form: FormB1 = {
      diemDi: TPHCM,
      diemDen: TPHCM,
      soNguoi: 2,
      nganSach: { soTien: 10_000_000, theo: "tong" },
      soNgay: 3,
      tranh: [],
      ghiChu: "",
    };
    const errors = kiemTraFormB1(form);
    expect(errors).toContain("diem_di_trung_diem_den");
  });

  it("soNguoi 0 và soNguoi 11 -> mỗi trường hợp chứa 'so_nguoi_ngoai_pham_vi'", () => {
    const form0: FormB1 = {
      diemDi: TPHCM,
      diemDen: DANANG,
      soNguoi: 0,
      nganSach: { soTien: 10_000_000, theo: "tong" },
      soNgay: 3,
      tranh: [],
      ghiChu: "",
    };
    expect(kiemTraFormB1(form0)).toContain("so_nguoi_ngoai_pham_vi");

    const form11: FormB1 = {
      ...form0,
      soNguoi: 11,
    };
    expect(kiemTraFormB1(form11)).toContain("so_nguoi_ngoai_pham_vi");
  });

  it("soTien 0, -5, 1,5 -> mỗi trường hợp chứa 'ngan_sach_khong_hop_le'", () => {
    const base: FormB1 = {
      diemDi: TPHCM,
      diemDen: DANANG,
      soNguoi: 2,
      nganSach: { soTien: 0, theo: "tong" },
      soNgay: 3,
      tranh: [],
      ghiChu: "",
    };

    expect(kiemTraFormB1({ ...base, nganSach: { soTien: 0, theo: "tong" } })).toContain(
      "ngan_sach_khong_hop_le"
    );
    expect(kiemTraFormB1({ ...base, nganSach: { soTien: -5, theo: "tong" } })).toContain(
      "ngan_sach_khong_hop_le"
    );
    expect(kiemTraFormB1({ ...base, nganSach: { soTien: 1.5, theo: "tong" } })).toContain(
      "ngan_sach_khong_hop_le"
    );
  });

  it("soNgay 1 và 8 -> mỗi trường hợp chứa 'so_ngay_ngoai_pham_vi'", () => {
    const base: FormB1 = {
      diemDi: TPHCM,
      diemDen: DANANG,
      soNguoi: 2,
      nganSach: { soTien: 10_000_000, theo: "tong" },
      soNgay: 1,
      tranh: [],
      ghiChu: "",
    };

    expect(kiemTraFormB1({ ...base, soNgay: 1 })).toContain("so_ngay_ngoai_pham_vi");
    expect(kiemTraFormB1({ ...base, soNgay: 8 })).toContain("so_ngay_ngoai_pham_vi");
  });

  it("soNgay 7 hợp lệ", () => {
    const base: FormB1 = {
      diemDi: TPHCM,
      diemDen: DANANG,
      soNguoi: 2,
      nganSach: { soTien: 10_000_000, theo: "tong" },
      soNgay: 7,
      tranh: [],
      ghiChu: "",
    };
    expect(kiemTraFormB1(base)).toEqual([]);
  });

  it("form hợp lệ -> []", () => {
    const validForm: FormB1 = {
      diemDi: TPHCM,
      diemDen: DANANG,
      soNguoi: 2,
      nganSach: { soTien: 10_000_000, theo: "tong" },
      soNgay: 3,
      tranh: ["Không dậy sớm"],
      ghiChu: "Thích ẩm thực",
    };
    expect(kiemTraFormB1(validForm)).toEqual([]);
  });

  it("taoYeuCauTuForm với 4 người, soTien 3.000.000, theo 'moi_nguoi' -> ngansachTongVND 12.000.000; với 4 người, 10.000.000, theo 'tong' -> 10.000.000", () => {
    const reqMoiNguoi = taoYeuCauTuForm({
      diemDi: TPHCM,
      diemDen: DANANG,
      soNguoi: 4,
      nganSach: { soTien: 3_000_000, theo: "moi_nguoi" },
      soNgay: 3,
      tranh: [],
      ghiChu: "",
    });
    expect(reqMoiNguoi.ngansachTongVND).toBe(12_000_000);
    expect(reqMoiNguoi.soNguoi).toBe(4);

    const reqTong = taoYeuCauTuForm({
      diemDi: TPHCM,
      diemDen: DANANG,
      soNguoi: 4,
      nganSach: { soTien: 10_000_000, theo: "tong" },
      soNgay: 3,
      tranh: [],
      ghiChu: "",
    });
    expect(reqTong.ngansachTongVND).toBe(10_000_000);
    expect(reqTong.soNguoi).toBe(4);
  });

  it("dinhDangTien(10000000) = '10.000.000'; docTien('10.000.000') = 10000000; docTien('abc') = null; docTien('') = null", () => {
    expect(dinhDangTien(10000000)).toBe("10.000.000");
    expect(docTien("10.000.000")).toBe(10000000);
    expect(docTien("abc")).toBeNull();
    expect(docTien("")).toBeNull();
  });
});
