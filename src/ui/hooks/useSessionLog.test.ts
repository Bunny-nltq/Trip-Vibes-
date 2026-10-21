import { describe, it, expect, beforeEach } from "vitest";
import {
  SessionLogger,
  taoNoiDungCSV,
  STORAGE_KEY,
  START_TIME_KEY,
} from "./useSessionLog";
import type { SessionEvent } from "@/core/chiSoTest";

/**
 * Mock class đơn giản cho Storage (sessionStorage)
 */
class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
}

describe("useSessionLog & SessionLogger (Chế độ test người dùng)", () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  it("không có ?test=1 thì useSessionLog KHÔNG ghi sự kiện nào", () => {
    // Trường hợp 1: URL rỗng hoặc tham số khác
    const loggerNoParam = new SessionLogger({
      search: "",
      storage: mockStorage,
    });

    expect(loggerNoParam.isTestMode).toBe(false);

    // Gọi các hàm ghi nhận sự kiện
    loggerNoParam.logStart();
    loggerNoParam.logPlanOk();
    loggerNoParam.logChangeApplied("khach_san");
    loggerNoParam.logConfirm(0, "trong_han_muc");

    // Khẳng định: không có sự kiện nào được ghi trong bộ nhớ lẫn sessionStorage
    expect(loggerNoParam.events.length).toBe(0);
    expect(mockStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(mockStorage.getItem(START_TIME_KEY)).toBeNull();

    // Trường hợp 2: tham số URL khác ?test=0 hoặc ?dev=1
    const loggerOtherParam = new SessionLogger({
      search: "?test=0&dev=1",
      storage: mockStorage,
    });
    expect(loggerOtherParam.isTestMode).toBe(false);
    loggerOtherParam.logStart();
    expect(loggerOtherParam.events.length).toBe(0);
    expect(mockStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("có ?test=1 thì ghi đúng thứ tự sự kiện", () => {
    const logger = new SessionLogger({
      search: "?test=1",
      storage: mockStorage,
    });

    expect(logger.isTestMode).toBe(true);

    // Kích hoạt một chuỗi các sự kiện theo đúng luồng người dùng
    logger.logStart();
    logger.logPlanOk();
    logger.logChangeApplied("phuong_tien");
    logger.logUndo();
    logger.logRegenerate();
    logger.logConfirm(1, "trong_han_muc");
    logger.logExpenseAdded("anh_bill", true);

    // 1. Kiểm tra thứ tự các sự kiện trong bộ nhớ
    const expectedTypes = [
      "start",
      "plan_ok",
      "change_applied",
      "undo",
      "regenerate",
      "confirm",
      "expense_added",
    ];

    expect(logger.events.map((e) => e.type)).toEqual(expectedTypes);

    // 2. Kiểm tra thứ tự và nội dung lưu trong sessionStorage
    const savedJson = mockStorage.getItem(STORAGE_KEY);
    expect(savedJson).not.toBeNull();

    const parsedEvents: SessionEvent[] = JSON.parse(savedJson!);
    expect(parsedEvents.length).toBe(7);
    expect(parsedEvents.map((e) => e.type)).toEqual(expectedTypes);

    // Kiểm tra dữ liệu chi tiết kèm theo từng sự kiện
    expect(parsedEvents[2].loai).toBe("phuong_tien");
    expect(parsedEvents[5].soCanhBaoConLai).toBe(1);
    expect(parsedEvents[5].trangThaiNganSach).toBe("trong_han_muc");
    expect(parsedEvents[6].nguon).toBe("anh_bill");
    expect(parsedEvents[6].daSuaTay).toBe(true);
  });

  it("xuất CSV có đúng các cột của tinhChiSoTest", () => {
    const events: SessionEvent[] = [
      { type: "start", t: 0 },
      { type: "plan_ok", t: 15000 },
      { type: "change_applied", t: 20000, loai: "khach_san" },
      { type: "undo", t: 25000 },
      { type: "confirm", t: 40000, soCanhBaoConLai: 0, trangThaiNganSach: "trong_han_muc" },
      { type: "expense_added", t: 50000, nguon: "anh_bill", daSuaTay: true },
      { type: "expense_added", t: 55000, nguon: "nhap_tay", daSuaTay: false },
    ];

    const csvContent = taoNoiDungCSV(events);
    expect(typeof csvContent).toBe("string");

    // Các cột bắt buộc của tinhChiSoTest
    const cacCotChiSo = [
      "thoiGianTaoKeHoachMs",
      "soLanDoi",
      "soLanHoanTac",
      "thoiGianToiChotMs",
      "vuotKhiChot",
      "soExpense",
      "soExpenseDaSuaSo",
    ];

    // Xác nhận dòng đầu tiên của CSV chứa đầy đủ mọi cột chỉ số
    const dongDau = csvContent.split("\n")[0];
    for (const cot of cacCotChiSo) {
      expect(dongDau).toContain(`"${cot}"`);
    }

    // Xác nhận dòng thứ 2 chứa các giá trị tính toán tương ứng
    const dongGiaTri = csvContent.split("\n")[1];
    expect(dongGiaTri).toContain('"15000"'); // thoiGianTaoKeHoachMs (15000 - 0)
    expect(dongGiaTri).toContain('"1"');     // soLanDoi (1 lần change_applied)
    expect(dongGiaTri).toContain('"1"');     // soLanHoanTac (1 lần undo)
    expect(dongGiaTri).toContain('"40000"'); // thoiGianToiChotMs (40000 - 0)
    expect(dongGiaTri).toContain('"false"'); // vuotKhiChot
    expect(dongGiaTri).toContain('"2"');     // soExpense (2 expense_added)
    expect(dongGiaTri).toContain('"1"');     // soExpenseDaSuaSo (1 lần daSuaTay: true)
  });
});
