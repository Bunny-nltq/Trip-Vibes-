import { describe, it, expect } from "vitest";
import {
  danhGiaDoMoi,
  dinhDangTrangThaiDiaDiem,
  dinhDangKetQuaLikes,
  xuLyBangDiadiemFallback,
  dinhDangLyDo,
} from "./tonghopRules";
import { parseSuiteBill, renderSuiteSection } from "./run-tonghop";

describe("eval/tonghopRules", () => {
  const ngayHienTai = "2026-10-21";
  const quyTacHienTai = "3";

  it("(ngày '2026-10-19', version rỗng) -> CU_KHONG_GHI_PHIEN_BAN", () => {
    const ketQua = danhGiaDoMoi({
      ngayChay: "2026-10-19",
      quyTacVersion: "",
      ngayHienTai,
      quyTacHienTai,
    });
    expect(ketQua).toBe("CU_KHONG_GHI_PHIEN_BAN");
  });

  it("('2026-10-21', '3') -> HOP_LE", () => {
    const ketQua = danhGiaDoMoi({
      ngayChay: "2026-10-21",
      quyTacVersion: "3",
      ngayHienTai,
      quyTacHienTai,
    });
    expect(ketQua).toBe("HOP_LE");
  });

  it("('2026-10-21', '2') -> CU_KHAC_PHIEN_BAN", () => {
    const ketQua = danhGiaDoMoi({
      ngayChay: "2026-10-21",
      quyTacVersion: "2",
      ngayHienTai,
      quyTacHienTai,
    });
    expect(ketQua).toBe("CU_KHAC_PHIEN_BAN");
  });

  it("('2026-10-13', '3') -> CU_QUA_7_NGAY (8 ngày)", () => {
    const ketQua = danhGiaDoMoi({
      ngayChay: "2026-10-13",
      quyTacVersion: "3",
      ngayHienTai,
      quyTacHienTai,
    });
    expect(ketQua).toBe("CU_QUA_7_NGAY");
  });

  it("('2026-10-14', '3') -> HOP_LE (đúng 7 ngày)", () => {
    const ketQua = danhGiaDoMoi({
      ngayChay: "2026-10-14",
      quyTacVersion: "3",
      ngayHienTai,
      quyTacHienTai,
    });
    expect(ketQua).toBe("HOP_LE");
  });

  it("chuỗi trạng thái diadiem ['CÓ NỘI DUNG','CÓ NỘI DUNG','CÓ VI PHẠM','THIẾU DỮ LIỆU','CÓ NỘI DUNG','THIẾU DỮ LIỆU'] -> '3/6 CÓ NỘI DUNG; 1 CÓ VI PHẠM; 0 CHƯA LẤP ĐỦ Ô; 2 THIẾU DỮ LIỆU'", () => {
    const input = [
      "CÓ NỘI DUNG",
      "CÓ NỘI DUNG",
      "CÓ VI PHẠM",
      "THIẾU DỮ LIỆU",
      "CÓ NỘI DUNG",
      "THIẾU DỮ LIỆU",
    ];
    const ketQua = dinhDangTrangThaiDiaDiem(input);
    expect(ketQua).toBe("3/6 CÓ NỘI DUNG; 1 CÓ VI PHẠM; 0 CHƯA LẤP ĐỦ Ô; 2 THIẾU DỮ LIỆU");
  });

  it("chuỗi likes ['TĂNG','GIỮ NGUYÊN','TỆ ĐI','TĂNG','GIỮ NGUYÊN'] -> '2 tăng, 2 giữ nguyên, 1 tệ đi'", () => {
    const input = ["TĂNG", "GIỮ NGUYÊN", "TỆ ĐI", "TĂNG", "GIỮ NGUYÊN"];
    const ketQua = dinhDangKetQuaLikes(input);
    expect(ketQua).toBe("2 tăng, 2 giữ nguyên, 1 tệ đi");
  });

  it("6 điểm đến trong đó chỉ 5 có snapshot hợp lệ và đều 'CÓ NỘI DUNG' -> '5/6 CÓ NỘI DUNG; 0 CÓ VI PHẠM; 0 CHƯA LẤP ĐỦ Ô; 1 THIẾU DỮ LIỆU'; trạng thái THIẾU thì ô Ô chưa lấp = '—'", () => {
    const items = [
      { diemDen: "Đà Nẵng", trangThaiNoiDung: "CÓ NỘI DUNG", soSlotChuaLap: { hoatDong: 0, buaAn: 0 } },
      { diemDen: "Hà Nội", trangThaiNoiDung: "CÓ NỘI DUNG", soSlotChuaLap: { hoatDong: 0, buaAn: 0 } },
      { diemDen: "Đà Lạt", trangThaiNoiDung: "CÓ NỘI DUNG", soSlotChuaLap: { hoatDong: 0, buaAn: 0 } },
      { diemDen: "Phú Quốc", trangThaiNoiDung: "CÓ NỘI DUNG", soSlotChuaLap: { hoatDong: 0, buaAn: 0 } },
      { diemDen: "Bangkok", trangThaiNoiDung: "CÓ NỘI DUNG", soSlotChuaLap: { hoatDong: 0, buaAn: 0 } },
      { diemDen: "Seoul", trangThaiNoiDung: "CÓ NỘI DUNG", soSlotChuaLap: { hoatDong: 0, buaAn: 0 } },
    ];

    const validSnapshots = [
      { file: "snapshot_da_nang_2026-10-20.json", diemDen: "Thành phố Đà Nẵng" },
      { file: "snapshot_ha_noi_2026-10-20.json", diemDen: "Hà Nội" },
      { file: "snapshot_da_lat_2026-10-20.json", diemDen: "Đà Lạt" },
      { file: "snapshot_bangkok_2026-10-20.json", diemDen: "Bangkok" },
      { file: "snapshot_seoul_2026-10-20.json", diemDen: "Seoul" },
    ];

    const result = xuLyBangDiadiemFallback(items, validSnapshots, "2026-10-20");
    expect(result.summary).toBe(
      "5/6 CÓ NỘI DUNG; 0 CÓ VI PHẠM; 0 CHƯA LẤP ĐỦ Ô; 1 THIẾU DỮ LIỆU"
    );

    // Kiểm tra hàng THIẾU DỮ LIỆU hiển thị "—" ở cột Ô chưa lấp, không hiển thị số 0
    const phuQuocRow = result.rows.find((r) => r.diemDen === "Phú Quốc");
    expect(phuQuocRow).toBeDefined();
    expect(phuQuocRow?.trangThaiHienThi).toContain("THIẾU DỮ LIỆU (không có snapshot)");
    expect(phuQuocRow?.oChuaLapHienThi).toBe("—");
  });

  describe("Hàm thuần dinhDangLyDo", () => {
    it("dinhDangLyDo({trangThai:'CÓ NỘI DUNG', daThuLai:['quan_an'], loiCuoi:null}) chứa 'đã thử lại thành công' và 'quan_an' và KHÔNG chứa 'timeout'", () => {
      const res = dinhDangLyDo({
        trangThai: "CÓ NỘI DUNG",
        daThuLai: ["quan_an"],
        loiCuoi: null,
      });
      expect(res).toContain("đã thử lại thành công");
      expect(res).toContain("quan_an");
      expect(res).not.toContain("timeout");
    });

    it("dinhDangLyDo({trangThai:'THIẾU DỮ LIỆU', loaiThieu:['khach_san'], loiCuoi:'timeout'}) chứa 'khach_san' và 'timeout'", () => {
      const res = dinhDangLyDo({
        trangThai: "THIẾU DỮ LIỆU",
        loaiThieu: ["khach_san"],
        loiCuoi: "timeout",
      });
      expect(res).toContain("khach_san");
      expect(res).toContain("timeout");
    });
  });

  describe("Mục bill của tonghop khi có kết quả chấm lại", () => {
    it("với meta { ngayChay '2026-10-19', chamLaiNgay '2026-10-21' } mục bill của tonghop chứa cả hai chuỗi ngày", () => {
      const mockBillChamLai = {
        meta: {
          ngayChay: "2026-10-19",
          chamLaiNgay: "2026-10-21",
          quyTacVersion: "3",
          ghiChu: "chấm lại từ kết quả đã lưu, không gọi AI",
        },
        correctRealBills: 4,
        numRealBills: 4,
        correctNotBills: 1,
        numNotBills: 1,
        dangerousErrors: 0,
        details: [],
      };

      const suite = parseSuiteBill(mockBillChamLai);
      const mucBill = renderSuiteSection(suite, 3);

      expect(mucBill).toContain("2026-10-19");
      expect(mucBill).toContain("2026-10-21");
      expect(suite.date).toContain("2026-10-19");
      expect(suite.date).toContain("2026-10-21");
    });
  });
});
