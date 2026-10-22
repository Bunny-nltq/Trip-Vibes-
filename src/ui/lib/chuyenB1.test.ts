import { describe, it, expect } from "vitest";
import { taoGoiChuyenB1 } from "./chuyenB1";

describe("chuyenB1 – taoGoiChuyenB1 (đáp án người dùng N3)", () => {
  it("4 người, mỗi người 3.500.000 cho tongVND 14.000.000", () => {
    const res = taoGoiChuyenB1({
      diemDi: "TP.HCM",
      diemDen: "Đà Nẵng",
      soNguoi: 4,
      soNgay: 3,
      nganSach: {
        soTien: 3_500_000,
        theo: "moi_nguoi",
      },
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.tongVND).toBe(14_000_000);
      expect(res.data.soNguoi).toBe(4);
      expect(res.data.soNgay).toBe(3);
      expect(res.data.diemDenTen).toBe("Đà Nẵng");
    }
  });

  it("số người 0 trả lỗi so_nguoi", () => {
    const res = taoGoiChuyenB1({
      diemDi: "TP.HCM",
      diemDen: "Đà Nẵng",
      soNguoi: 0,
      soNgay: 3,
      nganSach: {
        soTien: 10_000_000,
        theo: "tong",
      },
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.loi).toBe("so_nguoi");
    }
  });

  it("điểm đến rỗng trả lỗi thieu_diem_den", () => {
    const res = taoGoiChuyenB1({
      diemDi: "TP.HCM",
      diemDen: "",
      soNguoi: 2,
      soNgay: 3,
      nganSach: {
        soTien: 10_000_000,
        theo: "tong",
      },
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.loi).toBe("thieu_diem_den");
    }
  });

  it("số ngày ngoài 2-7 trả lỗi so_ngay", () => {
    const res1 = taoGoiChuyenB1({
      diemDen: "Hà Nội",
      soNguoi: 2,
      soNgay: 1,
      nganSach: { soTien: 5_000_000, theo: "tong" },
    });
    expect(res1.ok).toBe(false);
    if (!res1.ok) expect(res1.loi).toBe("so_ngay");

    const res8 = taoGoiChuyenB1({
      diemDen: "Hà Nội",
      soNguoi: 2,
      soNgay: 8,
      nganSach: { soTien: 5_000_000, theo: "tong" },
    });
    expect(res8.ok).toBe(false);
    if (!res8.ok) expect(res8.loi).toBe("so_ngay");
  });

  it("ngân sách <= 0 trả lỗi ngan_sach", () => {
    const res = taoGoiChuyenB1({
      diemDen: "Hà Nội",
      soNguoi: 2,
      soNgay: 3,
      nganSach: { soTien: 0, theo: "tong" },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.loi).toBe("ngan_sach");
  });
});
