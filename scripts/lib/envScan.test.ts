import { describe, it, expect } from "vitest";
import { tenBienTuNoiDung } from "./envScan";

describe("scripts/lib/envScan - tenBienTuNoiDung", () => {
  it("trích xuất đúng process.env.AAA và process.env['BBB']", () => {
    const code = "const a = process.env.AAA; const b = process.env['BBB'];";
    expect(tenBienTuNoiDung(code)).toEqual(["AAA", "BBB"]);
  });

  it("bỏ qua dòng chú thích bắt đầu bằng //", () => {
    const code = "// process.env.CCC";
    expect(tenBienTuNoiDung(code)).toEqual([]);
  });

  it("trích xuất nhiều biến trên một dòng", () => {
    const code = "process.env.DDD ?? process.env.EEE";
    expect(tenBienTuNoiDung(code)).toEqual(["DDD", "EEE"]);
  });
});
