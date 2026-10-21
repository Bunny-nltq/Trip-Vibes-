import { describe, it, expect } from "vitest";
import { demEmoji } from "./quetEmoji";

describe("scripts/lib/quetEmoji - Kiểm tra hàm thuần đếm emoji", () => {
  it("chuỗi 'Đã lưu ✅' -> 1", () => {
    expect(demEmoji("Đã lưu ✅")).toBe(1);
  });

  it("chuỗi 'Đã lưu' -> 0", () => {
    expect(demEmoji("Đã lưu")).toBe(0);
  });

  it("chuỗi 'Xem ✏️' -> 1", () => {
    expect(demEmoji("Xem ✏️")).toBe(1);
  });
});
