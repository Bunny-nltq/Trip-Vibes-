import { describe, it, expect } from "vitest";
import { tinhChiSoTest, type SessionEvent } from "./chiSoTest";

describe("src/core/chiSoTest: tinhChiSoTest", () => {
  it("tính đúng các chỉ số cho kịch bản sự kiện đầy đủ do người dùng chỉ định", () => {
    const events: SessionEvent[] = [
      { type: "start", t: 0 },
      { type: "plan_ok", t: 12000 },
      { type: "change_applied", t: 30000, loai: "phuong_tien" },
      { type: "undo", t: 35000 },
      { type: "change_applied", t: 50000, loai: "khach_san" },
      { type: "confirm", t: 90000, trangThaiNganSach: "vuot", soCanhBaoConLai: 0 },
      { type: "expense_added", t: 100000, nguon: "anh_bill", daSuaTay: true },
      { type: "expense_added", t: 110000, nguon: "nhap_tay", daSuaTay: false },
    ];

    const result = tinhChiSoTest(events);

    expect(result.thoiGianTaoKeHoachMs).toBe(12000);
    expect(result.soLanDoi).toBe(2);
    expect(result.soLanHoanTac).toBe(1);
    expect(result.thoiGianToiChotMs).toBe(90000);
    expect(result.vuotKhiChot).toBe(true);
    expect(result.soExpense).toBe(2);
    expect(result.soExpenseDaSuaSo).toBe(1);
  });

  it("chuỗi rỗng cho mọi số bằng 0 và vuotKhiChot false", () => {
    const result = tinhChiSoTest("");

    expect(result).toEqual({
      thoiGianTaoKeHoachMs: 0,
      soLanDoi: 0,
      soLanHoanTac: 0,
      thoiGianToiChotMs: 0,
      vuotKhiChot: false,
      soExpense: 0,
      soExpenseDaSuaSo: 0,
    });
  });

  it("mảng rỗng hoặc null/undefined cũng trả về mặc định an toàn", () => {
    expect(tinhChiSoTest([])).toEqual({
      thoiGianTaoKeHoachMs: 0,
      soLanDoi: 0,
      soLanHoanTac: 0,
      thoiGianToiChotMs: 0,
      vuotKhiChot: false,
      soExpense: 0,
      soExpenseDaSuaSo: 0,
    });

    expect(tinhChiSoTest(null)).toEqual({
      thoiGianTaoKeHoachMs: 0,
      soLanDoi: 0,
      soLanHoanTac: 0,
      thoiGianToiChotMs: 0,
      vuotKhiChot: false,
      soExpense: 0,
      soExpenseDaSuaSo: 0,
    });
  });
});
