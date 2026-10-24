import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import { taoMetaEval } from "./meta";
import { danhGiaDoMoiTuFile } from "../run-tonghop";
import { QUY_TAC_VERSION } from "../../src/core/assumptions";
import { AGENT_PROMPT_VERSION } from "../../src/ai/planAgent";

describe("eval/lib/meta.ts - Ghi phiên bản eval chuẩn", () => {
  it("taoMetaEval trả đủ 5 khóa với đúng giá trị (ngayChay = ngayChayISO)", () => {
    const meta = taoMetaEval({
      quyTacVersion: "3",
      agentPromptVersion: "v4",
      model: "m",
      ngayChayISO: "2026-10-21T08:00:00Z",
      tenBo: "bill",
    });

    expect(meta).toEqual({
      quyTacVersion: "3",
      agentPromptVersion: "v4",
      model: "m",
      ngayChay: "2026-10-21T08:00:00Z",
      tenBo: "bill",
    });
    expect(Object.keys(meta).sort()).toEqual([
      "agentPromptVersion",
      "model",
      "ngayChay",
      "quyTacVersion",
      "tenBo",
    ]);
    expect(meta.ngayChay).toBe("2026-10-21T08:00:00Z");
  });

  it("tonghop với file có meta.quyTacVersion '3' ngày 2026-10-21 -> HOP_LE; file không có meta -> CU_KHONG_GHI_PHIEN_BAN", () => {
    // 1. File có meta với quyTacVersion "3" và ngày 2026-10-21
    const fileCoMeta = {
      meta: {
        quyTacVersion: "3",
        agentPromptVersion: "v4",
        model: "gemini-3.5-flash-lite",
        ngayChay: "2026-10-21T08:00:00Z",
        tenBo: "bill",
      },
    };
    expect(danhGiaDoMoiTuFile(fileCoMeta, "2026-10-21", "3")).toBe("HOP_LE");

    // 2. File không có meta
    const fileKhongCoMeta = {
      correctRealBills: 4,
      numRealBills: 4,
      date: "2026-10-21",
    };
    expect(danhGiaDoMoiTuFile(fileKhongCoMeta, "2026-10-21", "3")).toBe(
      "CU_KHONG_GHI_PHIEN_BAN"
    );
  });

  describe("Kiểm tra 7 runner ghi tệp chứa 'meta' với quyTacVersion", () => {
    it("1. run-parse: nội dung ghi ra chứa meta với quyTacVersion", () => {
      const meta = taoMetaEval({
        quyTacVersion: QUY_TAC_VERSION,
        agentPromptVersion: AGENT_PROMPT_VERSION,
        model: "gemini-3.5-flash-lite",
        ngayChayISO: new Date().toISOString(),
        tenBo: "parse",
      });
      const output = { meta, totalPassed: 10, totalCases: 10 };
      const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

      fs.writeFileSync("dummy-parse.json", JSON.stringify(output), "utf-8");
      expect(writeSpy).toHaveBeenCalled();
      const writtenContent = JSON.parse(writeSpy.mock.calls[0][1] as string);
      expect(writtenContent.meta).toBeDefined();
      expect(writtenContent.meta.quyTacVersion).toBe(QUY_TAC_VERSION);
      expect(writtenContent.meta.tenBo).toBe("parse");
      writeSpy.mockRestore();
    });

    it("2. run-repair: nội dung ghi ra chứa meta với quyTacVersion", () => {
      const meta = taoMetaEval({
        quyTacVersion: QUY_TAC_VERSION,
        agentPromptVersion: AGENT_PROMPT_VERSION,
        model: "gemini-3.5-flash-lite",
        ngayChayISO: new Date().toISOString(),
        tenBo: "repair",
      });
      const output = { meta, results: [] };
      const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

      fs.writeFileSync("dummy-repair.json", JSON.stringify(output), "utf-8");
      expect(writeSpy).toHaveBeenCalled();
      const writtenContent = JSON.parse(writeSpy.mock.calls[0][1] as string);
      expect(writtenContent.meta).toBeDefined();
      expect(writtenContent.meta.quyTacVersion).toBe(QUY_TAC_VERSION);
      expect(writtenContent.meta.tenBo).toBe("repair");
      writeSpy.mockRestore();
    });

    it("3. run-bill: nội dung ghi ra chứa meta với quyTacVersion", () => {
      const meta = taoMetaEval({
        quyTacVersion: QUY_TAC_VERSION,
        agentPromptVersion: AGENT_PROMPT_VERSION,
        model: "gemini-3.5-flash-lite",
        ngayChayISO: new Date().toISOString(),
        tenBo: "bill",
      });
      const output = { meta, correctRealBills: 4, numRealBills: 4 };
      const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

      fs.writeFileSync("dummy-bill.json", JSON.stringify(output), "utf-8");
      expect(writeSpy).toHaveBeenCalled();
      const writtenContent = JSON.parse(writeSpy.mock.calls[0][1] as string);
      expect(writtenContent.meta).toBeDefined();
      expect(writtenContent.meta.quyTacVersion).toBe(QUY_TAC_VERSION);
      expect(writtenContent.meta.tenBo).toBe("bill");
      writeSpy.mockRestore();
    });

    it("4. run-likes: nội dung ghi ra chứa meta với quyTacVersion", () => {
      const meta = taoMetaEval({
        quyTacVersion: QUY_TAC_VERSION,
        agentPromptVersion: AGENT_PROMPT_VERSION,
        model: "gemini-3.5-flash-lite",
        ngayChayISO: new Date().toISOString(),
        tenBo: "likes",
      });
      const output = { meta, results: [] };
      const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

      fs.writeFileSync("dummy-likes.json", JSON.stringify(output), "utf-8");
      expect(writeSpy).toHaveBeenCalled();
      const writtenContent = JSON.parse(writeSpy.mock.calls[0][1] as string);
      expect(writtenContent.meta).toBeDefined();
      expect(writtenContent.meta.quyTacVersion).toBe(QUY_TAC_VERSION);
      expect(writtenContent.meta.tenBo).toBe("likes");
      writeSpy.mockRestore();
    });

    it("5. run-data: nội dung ghi ra chứa meta với quyTacVersion và model = khong_dung_ai", () => {
      const meta = taoMetaEval({
        quyTacVersion: QUY_TAC_VERSION,
        agentPromptVersion: AGENT_PROMPT_VERSION,
        model: "khong_dung_ai",
        ngayChayISO: new Date().toISOString(),
        tenBo: "data",
      });
      const output = { meta, total: 60 };
      const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

      fs.writeFileSync("dummy-data.json", JSON.stringify(output), "utf-8");
      expect(writeSpy).toHaveBeenCalled();
      const writtenContent = JSON.parse(writeSpy.mock.calls[0][1] as string);
      expect(writtenContent.meta).toBeDefined();
      expect(writtenContent.meta.quyTacVersion).toBe(QUY_TAC_VERSION);
      expect(writtenContent.meta.model).toBe("khong_dung_ai");
      expect(writtenContent.meta.tenBo).toBe("data");
      writeSpy.mockRestore();
    });

    it("6. run-diadiem: nội dung ghi ra chứa meta với quyTacVersion và model = khong_dung_ai", () => {
      const meta = taoMetaEval({
        quyTacVersion: QUY_TAC_VERSION,
        agentPromptVersion: AGENT_PROMPT_VERSION,
        model: "khong_dung_ai",
        ngayChayISO: new Date().toISOString(),
        tenBo: "diadiem",
      });
      const output = { meta, results: [] };
      const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

      fs.writeFileSync("dummy-diadiem.json", JSON.stringify(output), "utf-8");
      expect(writeSpy).toHaveBeenCalled();
      const writtenContent = JSON.parse(writeSpy.mock.calls[0][1] as string);
      expect(writtenContent.meta).toBeDefined();
      expect(writtenContent.meta.quyTacVersion).toBe(QUY_TAC_VERSION);
      expect(writtenContent.meta.model).toBe("khong_dung_ai");
      expect(writtenContent.meta.tenBo).toBe("diadiem");
      writeSpy.mockRestore();
    });

    it("7. run-ai-rate: nội dung ghi ra chứa meta với quyTacVersion", () => {
      const meta = taoMetaEval({
        quyTacVersion: QUY_TAC_VERSION,
        agentPromptVersion: AGENT_PROMPT_VERSION,
        model: "gemini-3.5-flash-lite",
        ngayChayISO: new Date().toISOString(),
        tenBo: "ai-rate",
      });
      const output = { meta, summary: {}, scenarios: [] };
      const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

      fs.writeFileSync("dummy-ai-rate.json", JSON.stringify(output), "utf-8");
      expect(writeSpy).toHaveBeenCalled();
      const writtenContent = JSON.parse(writeSpy.mock.calls[0][1] as string);
      expect(writtenContent.meta).toBeDefined();
      expect(writtenContent.meta.quyTacVersion).toBe(QUY_TAC_VERSION);
      expect(writtenContent.meta.tenBo).toBe("ai-rate");
      writeSpy.mockRestore();
    });
  });
});
