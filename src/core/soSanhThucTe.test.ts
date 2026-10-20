import { describe, it, expect } from "vitest";
import { soSanhKeHoachThucTe } from "./soSanhThucTe";
import type { Plan, Ledger } from "@/contracts";

function createFixtureA(): Plan {
  return {
    schemaVersion: 6,
    request: {
      schemaVersion: 6,
      diemDi: "TP. Hồ Chí Minh",
      diemDen: "Đà Nẵng",
      soNgay: 3,
      soNguoi: 2,
      ngansachTongVND: 10000000,
      sothich: [],
      tranh: [],
      ghiChu: [],
      thieu: [],
      cauHoiLamRo: [],
      canhBao: [],
    },
    items: [
      // Di chuyển đi & về: 3.920.000
      {
        ngay: 1,
        gio: "06:00",
        hangMuc: "Di chuyển",
        noiDung: "Chiều đi",
        soLuong: 2,
        donGia: 980000,
        thanhTien: 1960000,
        refId: "t-di",
      },
      {
        ngay: 3,
        gio: "18:00",
        hangMuc: "Di chuyển",
        noiDung: "Chiều về",
        soLuong: 2,
        donGia: 980000,
        thanhTien: 1960000,
        refId: "t-ve",
      },
      // Chỗ ở: 2.200.000
      {
        ngay: 1,
        gio: null,
        hangMuc: "Chỗ ở",
        noiDung: "Khách sạn 2 đêm",
        soLuong: 2,
        donGia: 1100000,
        thanhTien: 2200000,
        refId: "hotel-1",
      },
      // Ăn uống: 600.000 / ngày (150k x 2 bữa x 2 người)
      {
        ngay: 1,
        gio: "12:00",
        hangMuc: "Ăn uống",
        noiDung: "Trưa ngày 1",
        soLuong: 2,
        donGia: 150000,
        thanhTien: 300000,
        refId: null,
      },
      {
        ngay: 1,
        gio: "18:30",
        hangMuc: "Ăn uống",
        noiDung: "Tối ngày 1",
        soLuong: 2,
        donGia: 150000,
        thanhTien: 300000,
        refId: null,
      },
      {
        ngay: 2,
        gio: "12:00",
        hangMuc: "Ăn uống",
        noiDung: "Trưa ngày 2",
        soLuong: 2,
        donGia: 150000,
        thanhTien: 300000,
        refId: null,
      },
      {
        ngay: 2,
        gio: "18:30",
        hangMuc: "Ăn uống",
        noiDung: "Tối ngày 2",
        soLuong: 2,
        donGia: 150000,
        thanhTien: 300000,
        refId: null,
      },
      {
        ngay: 3,
        gio: "12:00",
        hangMuc: "Ăn uống",
        noiDung: "Trưa ngày 3",
        soLuong: 2,
        donGia: 150000,
        thanhTien: 300000,
        refId: null,
      },
      {
        ngay: 3,
        gio: "18:30",
        hangMuc: "Ăn uống",
        noiDung: "Tối ngày 3",
        soLuong: 2,
        donGia: 150000,
        thanhTien: 300000,
        refId: null,
      },
      // Vui chơi: ngày 1 là 0, ngày 2 là 80.000 + 240.000, ngày 3 là 1.300.000
      {
        ngay: 2,
        gio: "09:00",
        hangMuc: "Vui chơi",
        noiDung: "Bảo tàng",
        soLuong: 2,
        donGia: 40000,
        thanhTien: 80000,
        refId: "act-1",
      },
      {
        ngay: 2,
        gio: "15:00",
        hangMuc: "Vui chơi",
        noiDung: "Công viên",
        soLuong: 2,
        donGia: 120000,
        thanhTien: 240000,
        refId: "act-2",
      },
      {
        ngay: 3,
        gio: "09:00",
        hangMuc: "Vui chơi",
        noiDung: "Bà Nà Hills",
        soLuong: 2,
        donGia: 650000,
        thanhTien: 1300000,
        refId: "act-3",
      },
    ],
    tongKet: {
      tongVND: 9540000,
      conLaiVND: 460000,
      phanTramDaDung: 95.4,
      theoHangMuc: {
        "Di chuyển": 3920000,
        "Chỗ ở": 2200000,
        "Ăn uống": 1800000,
        "Vui chơi": 1620000,
      },
      tongThoiGianDiChuyenPhut: 240,
      trangThaiNganSach: "trong",
    },
    canhBao: [],
  };
}

function createS1(): Ledger {
  return {
    schemaVersion: 6,
    expenses: [
      {
        id: "e1",
        nguon: "nhap_tay",
        tenCuaHang: "Cơm gà",
        ngay: "2026-06-01",
        ngayTrongChuyen: 1,
        hangMuc: "an_uong",
        soTienVND: 560000,
        giaTriAIDoc: null,
        daSuaTay: false,
        ghiChu: null,
      },
      {
        id: "e2",
        nguon: "nhap_tay",
        tenCuaHang: "Trà sữa",
        ngay: "2026-06-01",
        ngayTrongChuyen: 1,
        hangMuc: "an_uong",
        soTienVND: 108000,
        giaTriAIDoc: null,
        daSuaTay: false,
        ghiChu: null,
      },
      {
        id: "e3",
        nguon: "nhap_tay",
        tenCuaHang: "Vé bảo tàng",
        ngay: "2026-06-02",
        ngayTrongChuyen: 2,
        hangMuc: "vui_choi",
        soTienVND: 80000,
        giaTriAIDoc: null,
        daSuaTay: false,
        ghiChu: null,
      },
      {
        id: "e4",
        nguon: "nhap_tay",
        tenCuaHang: "Vé công viên",
        ngay: "2026-06-02",
        ngayTrongChuyen: 2,
        hangMuc: "vui_choi",
        soTienVND: 240000,
        giaTriAIDoc: null,
        daSuaTay: false,
        ghiChu: null,
      },
      {
        id: "e5",
        nguon: "nhap_tay",
        tenCuaHang: "Bánh tráng cuốn",
        ngay: "2026-06-02",
        ngayTrongChuyen: 2,
        hangMuc: "an_uong",
        soTienVND: 308000,
        giaTriAIDoc: null,
        daSuaTay: false,
        ghiChu: null,
      },
    ],
  };
}

describe("soSanhKeHoachThucTe", () => {
  it("T1: S1, denHetNgay = 2", () => {
    const plan = createFixtureA();
    const ledger = createS1();
    const res = soSanhKeHoachThucTe(plan, ledger, 2);

    expect(res.denHetNgayHieuLuc).toBe(2);
    expect(res.datTruocVND).toBe(6120000);
    expect(res.thucTeTongVND).toBe(1296000);
    expect(res.conLaiVND).toBe(2584000);

    const anUong = res.bang.find((r) => r.hangMuc === "Ăn uống")!;
    expect(anUong.keHoachVND).toBe(1200000);
    expect(anUong.thucTeVND).toBe(976000);
    expect(anUong.chenhVND).toBe(-224000);
    expect(anUong.chenhPhanTram).toBe(-18.7);

    const vuiChoi = res.bang.find((r) => r.hangMuc === "Vui chơi")!;
    expect(vuiChoi.keHoachVND).toBe(320000);
    expect(vuiChoi.thucTeVND).toBe(320000);
    expect(vuiChoi.chenhVND).toBe(0);
    expect(vuiChoi.chenhPhanTram).toBe(0);

    const khac = res.bang.find((r) => r.hangMuc === "Khác")!;
    expect(khac.keHoachVND).toBe(0);
    expect(khac.thucTeVND).toBe(0);
    expect(khac.chenhVND).toBe(0);
    expect(khac.chenhPhanTram).toBe(0);

    expect(res.tong.keHoachVND).toBe(1520000);
    expect(res.tong.thucTeVND).toBe(1296000);
    expect(res.tong.chenhVND).toBe(-224000);
    expect(res.tong.chenhPhanTram).toBe(-14.7);

    expect(res.duBao.keHoachNgayConLaiVND).toBe(1900000);
    expect(res.duBao.conLaiSauChiTieuVND).toBe(2584000);
    expect(res.duBao.chenhDuBaoVND).toBe(684000);
    expect(res.duBao.trangThai).toBe("du");
  });

  it("T2: S1 thêm ngày 2 vui_choi 900.000 (nhập tay), denHetNgay = 2", () => {
    const plan = createFixtureA();
    const ledger = createS1();
    ledger.expenses.push({
      id: "e6",
      nguon: "nhap_tay",
      tenCuaHang: "Show diễn",
      ngay: "2026-06-02",
      ngayTrongChuyen: 2,
      hangMuc: "vui_choi",
      soTienVND: 900000,
      giaTriAIDoc: null,
      daSuaTay: false,
      ghiChu: null,
    });

    const res = soSanhKeHoachThucTe(plan, ledger, 2);

    const vuiChoi = res.bang.find((r) => r.hangMuc === "Vui chơi")!;
    expect(vuiChoi.thucTeVND).toBe(1220000);
    expect(vuiChoi.chenhVND).toBe(900000);
    expect(vuiChoi.chenhPhanTram).toBe(281.3);

    expect(res.tong.thucTeVND).toBe(2196000);
    expect(res.tong.chenhVND).toBe(676000);
    expect(res.tong.chenhPhanTram).toBe(44.5);

    expect(res.conLaiVND).toBe(1684000);
    expect(res.duBao.chenhDuBaoVND).toBe(-216000);
    expect(res.duBao.trangThai).toBe("thieu");
  });

  it("T3: sổ rỗng, denHetNgay = 0", () => {
    const plan = createFixtureA();
    const ledger: Ledger = { schemaVersion: 6, expenses: [] };
    const res = soSanhKeHoachThucTe(plan, ledger, 0);

    expect(res.thucTeTongVND).toBe(0);
    expect(res.conLaiVND).toBe(3880000);
    expect(res.duBao.keHoachNgayConLaiVND).toBe(3420000);
    expect(res.duBao.chenhDuBaoVND).toBe(460000);
    expect(res.duBao.trangThai).toBe("du");
  });

  it("T4: S1, denHetNgay = 1 -> denHetNgayHieuLuc = 2 và mọi số giống T1", () => {
    const plan = createFixtureA();
    const ledger = createS1();
    const resT1 = soSanhKeHoachThucTe(plan, ledger, 2);
    const resT4 = soSanhKeHoachThucTe(plan, ledger, 1);

    expect(resT4.denHetNgayHieuLuc).toBe(2);
    expect(resT4).toEqual(resT1);
  });

  it("T5: một khoản di_chuyen 100.000 ngày 2", () => {
    const plan = createFixtureA();
    const ledger = createS1();
    ledger.expenses.push({
      id: "e6",
      nguon: "nhap_tay",
      tenCuaHang: "Taxi sân bay",
      ngay: "2026-06-02",
      ngayTrongChuyen: 2,
      hangMuc: "di_chuyen",
      soTienVND: 100000,
      giaTriAIDoc: null,
      daSuaTay: false,
      ghiChu: null,
    });

    const res = soSanhKeHoachThucTe(plan, ledger, 2);

    const khac = res.bang.find((r) => r.hangMuc === "Khác")!;
    expect(khac.keHoachVND).toBe(0);
    expect(khac.thucTeVND).toBe(100000);
    expect(khac.chenhPhanTram).toBe(0);

    expect(res.thucTeTongVND).toBe(1396000);
  });

  it("Fixture A (ngân sách 10.000.000, Di chuyển 3.920.000, Chỗ ở 2.200.000, chưa chi gì) cho conLaiVND = 3.880.000", () => {
    const plan = createFixtureA();
    const ledger: Ledger = { schemaVersion: 6, expenses: [] };
    const res = soSanhKeHoachThucTe(plan, ledger, 1);

    expect(res.datTruocVND).toBe(6120000); // 3.920.000 + 2.200.000
    expect(res.thucTeTongVND).toBe(0);
    expect(res.conLaiVND).toBe(3880000); // 10.000.000 - 6.120.000 - 0 = 3.880.000
  });
});

