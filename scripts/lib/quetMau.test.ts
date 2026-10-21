import { describe, it, expect } from "vitest";
import { quetNoiDung } from "./quetMau";

describe("scripts/lib/quetMau - quetNoiDung", () => {
  const fileName = "test.tsx";

  it('dòng có "#FF0000" -> 1 vi phạm', () => {
    const res = quetNoiDung('const color = "#FF0000";', fileName);
    expect(res.length).toBe(1);
    expect(res[0].type).toBe("Mã hex");
  });

  it('"var(--primary)" -> 0', () => {
    const res = quetNoiDung('const bg = "var(--primary)";', fileName);
    expect(res.length).toBe(0);
  });

  it('"// ghi chú #FF0000" -> 0 (dòng chú thích)', () => {
    const res = quetNoiDung('// ghi chú #FF0000', fileName);
    expect(res.length).toBe(0);
  });

  it('"fontFamily: \'Inter\'" -> 1', () => {
    const res = quetNoiDung("fontFamily: 'Inter'", fileName);
    expect(res.length).toBe(1);
    expect(res[0].type).toBe("Tên font");
  });

  it('"fontFamily: \'var(--font-body)\'" -> 0', () => {
    const res = quetNoiDung("fontFamily: 'var(--font-body)'", fileName);
    expect(res.length).toBe(0);
  });

  it('\'href="#top"\' -> 0', () => {
    const res = quetNoiDung('href="#top"', fileName);
    expect(res.length).toBe(0);
  });

  it('"#abc" -> 1', () => {
    const res = quetNoiDung('const c = "#abc";', fileName);
    expect(res.length).toBe(1);
    expect(res[0].type).toBe("Mã hex");
  });
});
