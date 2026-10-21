import { describe, it, expect } from "vitest";
import {
  danhGiaDoMoi,
  dinhDangTrangThaiDiaDiem,
  dinhDangKetQuaLikes,
} from "./tonghopRules";

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
});
