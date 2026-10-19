import { describe, it, expect } from "vitest";
import { normalizeRequest, removeVietnameseDiacritics } from "./normalizeRequest";
import type { RawTripRequest } from "@/contracts";

function createBaseRaw(overrides: Partial<RawTripRequest> = {}): RawTripRequest {
  return {
    schemaVersion: 2,
    diemDi: "TP.HCM",
    diemDen: "Đà Nẵng",
    soNgay: 3,
    soNguoi: 2,
    ngansach: {
      soTien: 10000000,
      theo: "tong",
    },
    sothich: [],
    tranh: [],
    ghiChu: [],
    thieu: [],
    cauHoiLamRo: [],
    ...overrides,
  };
}

describe("removeVietnameseDiacritics", () => {
  it("chuyển đúng chữ có dấu thành không dấu chữ thường", () => {
    expect(removeVietnameseDiacritics("Đà Nẵng")).toBe("da nang");
    expect(removeVietnameseDiacritics("HÀ NỘI")).toBe("ha noi");
    expect(removeVietnameseDiacritics("TP. Hồ Chí Minh")).toBe("tp. ho chi minh");
  });
});

describe("normalizeRequest", () => {
  describe("diemDi", () => {
    it("giữ nguyên điểm đi nếu có", () => {
      const res = normalizeRequest(createBaseRaw({ diemDi: "Hà Nội" }));
      expect(res.diemDi).toBe("Hà Nội");
    });

    it("mặc định là TP.HCM nếu null hoặc chuỗi rỗng", () => {
      const resNull = normalizeRequest(createBaseRaw({ diemDi: null }));
      expect(resNull.diemDi).toBe("TP.HCM");

      const resEmpty = normalizeRequest(createBaseRaw({ diemDi: "   " }));
      expect(resEmpty.diemDi).toBe("TP.HCM");
    });
  });

  describe("diemDen", () => {
    it("nếu null thì đặt null, thêm vào thieu kèm câu hỏi làm rõ và không có cảnh báo diem_den_mac_dinh", () => {
      const res = normalizeRequest(createBaseRaw({ diemDen: null }));
      expect(res.diemDen).toBeNull();
      expect(res.thieu).toContain("diemDen");
      expect(res.cauHoiLamRo.some((q) => /điểm đến|ở đâu|đi đâu/i.test(q))).toBe(true);
      expect(res.canhBao).not.toContain("diem_den_mac_dinh");
      expect(res.canhBao).not.toContain("ngoai_pham_vi_diem_den");
    });

    it("điểm đến bất kỳ (Hà Nội, Bangkok, Đà Nẵng...) đều không có cảnh báo ngoài phạm vi", () => {
      const res1 = normalizeRequest(createBaseRaw({ diemDen: "Đà Nẵng" }));
      expect(res1.diemDen).toBe("Đà Nẵng");
      expect(res1.canhBao).not.toContain("ngoai_pham_vi_diem_den");

      const res2 = normalizeRequest(createBaseRaw({ diemDen: "Hà Nội" }));
      expect(res2.diemDen).toBe("Hà Nội");
      expect(res2.canhBao).not.toContain("ngoai_pham_vi_diem_den");

      const res3 = normalizeRequest(createBaseRaw({ diemDen: "Bangkok" }));
      expect(res3.diemDen).toBe("Bangkok");
      expect(res3.canhBao).not.toContain("ngoai_pham_vi_diem_den");
    });
  });

  describe("soNgay", () => {
    it("soNgay trong khoảng 2-5 giữ nguyên và không cảnh báo", () => {
      for (const d of [2, 3, 4, 5]) {
        const res = normalizeRequest(createBaseRaw({ soNgay: d }));
        expect(res.soNgay).toBe(d);
        expect(res.canhBao).not.toContain("ngoai_pham_vi_so_ngay");
      }
    });

    it("soNgay 1 hoặc 6 trả canhBao ngoai_pham_vi_so_ngay và đặt soNgay null kèm vào thieu", () => {
      const res1 = normalizeRequest(createBaseRaw({ soNgay: 1 }));
      expect(res1.soNgay).toBeNull();
      expect(res1.thieu).toContain("soNgay");
      expect(res1.canhBao).toContain("ngoai_pham_vi_so_ngay");

      const res6 = normalizeRequest(createBaseRaw({ soNgay: 6 }));
      expect(res6.soNgay).toBeNull();
      expect(res6.thieu).toContain("soNgay");
      expect(res6.canhBao).toContain("ngoai_pham_vi_so_ngay");
    });

    it("soNgay ngoài 1-7 thì đặt null, thêm thieu và canhBao so_ngay_khong_hop_le", () => {
      const res0 = normalizeRequest(createBaseRaw({ soNgay: 0 }));
      expect(res0.soNgay).toBeNull();
      expect(res0.thieu).toContain("soNgay");
      expect(res0.canhBao).toContain("so_ngay_khong_hop_le");

      const res10 = normalizeRequest(createBaseRaw({ soNgay: 10 }));
      expect(res10.soNgay).toBeNull();
      expect(res10.thieu).toContain("soNgay");
      expect(res10.canhBao).toContain("so_ngay_khong_hop_le");
    });

    it("soNgay là null thì thêm vào thieu", () => {
      const res = normalizeRequest(createBaseRaw({ soNgay: null }));
      expect(res.soNgay).toBeNull();
      expect(res.thieu).toContain("soNgay");
      expect(res.canhBao).not.toContain("ngoai_pham_vi_so_ngay");
    });
  });

  describe("soNguoi", () => {
    it("giữ nguyên nếu trong khoảng 1-20", () => {
      const res = normalizeRequest(createBaseRaw({ soNguoi: 5 }));
      expect(res.soNguoi).toBe(5);
      expect(res.thieu).not.toContain("soNguoi");
    });

    it("soNguoi ngoài 1-20 thì đặt null, thêm thieu và canhBao so_nguoi_khong_hop_le", () => {
      const res = normalizeRequest(createBaseRaw({ soNguoi: 25 }));
      expect(res.soNguoi).toBeNull();
      expect(res.thieu).toContain("soNguoi");
      expect(res.canhBao).toContain("so_nguoi_khong_hop_le");
    });

    it("soNguoi là null thì thêm vào thieu", () => {
      const res = normalizeRequest(createBaseRaw({ soNguoi: null }));
      expect(res.soNguoi).toBeNull();
      expect(res.thieu).toContain("soNguoi");
    });
  });

  describe("ngansach", () => {
    it("theo = 'tong': ngansachTongVND = soTien", () => {
      const res = normalizeRequest(
        createBaseRaw({
          ngansach: { soTien: 10000000, theo: "tong" },
        })
      );
      expect(res.ngansachTongVND).toBe(10000000);
      expect(res.thieu).not.toContain("ngansach");
    });

    it("theo = null: ngansachTongVND = soTien", () => {
      const res = normalizeRequest(
        createBaseRaw({
          ngansach: { soTien: 8000000, theo: null },
        })
      );
      expect(res.ngansachTongVND).toBe(8000000);
    });

    it("theo = 'moi_nguoi': nhân với soNguoi", () => {
      const res = normalizeRequest(
        createBaseRaw({
          soNguoi: 3,
          ngansach: { soTien: 4000000, theo: "moi_nguoi" },
        })
      );
      expect(res.ngansachTongVND).toBe(12000000);
    });

    it("theo = 'moi_nguoi' nhưng soNguoi null: ngansachTongVND = null và thiếu soNguoi", () => {
      const res = normalizeRequest(
        createBaseRaw({
          soNguoi: null,
          ngansach: { soTien: 4000000, theo: "moi_nguoi" },
        })
      );
      expect(res.ngansachTongVND).toBeNull();
      expect(res.thieu).toContain("soNguoi");
    });

    it("soTien null thì ngansachTongVND = null và thiếu ngansach", () => {
      const res = normalizeRequest(
        createBaseRaw({
          ngansach: { soTien: null, theo: "tong" },
        })
      );
      expect(res.ngansachTongVND).toBeNull();
      expect(res.thieu).toContain("ngansach");
    });

    it("tiền <= 0 thì đặt null, thêm thieu và canhBao ngan_sach_khong_hop_le", () => {
      const res = normalizeRequest(
        createBaseRaw({
          ngansach: { soTien: -500000, theo: "tong" },
        })
      );
      expect(res.ngansachTongVND).toBeNull();
      expect(res.thieu).toContain("ngansach");
      expect(res.canhBao).toContain("ngan_sach_khong_hop_le");
    });
  });

  describe("loại trùng và câu hỏi làm rõ", () => {
    it("loại trùng trong các mảng", () => {
      const res = normalizeRequest(
        createBaseRaw({
          sothich: ["bien", "hai_san", "bien"],
          tranh: ["khong_day_som", "khong_day_som"],
          ghiChu: ["note 1", "note 1"],
        })
      );
      expect(res.sothich).toEqual(["bien", "hai_san"]);
      expect(res.tranh).toEqual(["khong_day_som"]);
      expect(res.ghiChu).toEqual(["note 1"]);
    });

    it("khi thiếu thông tin thì cauHoiLamRo không được rỗng", () => {
      const res = normalizeRequest(
        createBaseRaw({
          soNguoi: null,
          soNgay: null,
          ngansach: { soTien: null, theo: null },
          cauHoiLamRo: [],
        })
      );
      expect(res.thieu).toEqual(["soNguoi", "soNgay", "ngansach"]);
      expect(res.cauHoiLamRo.length).toBeGreaterThanOrEqual(3);
    });
  });
});
