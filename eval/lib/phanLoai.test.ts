import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  phanLoaiKetQua,
  kiemTraDungSomHaiLanLienTiep,
  tinhMauSoKichBan,
  taoChuoiTongHop,
} from "./phanLoai";
import { runAiRate } from "../run-ai-rate";
import { QUY_TAC_VERSION } from "../../src/core/assumptions";
import { AGENT_PROMPT_VERSION } from "../../src/ai/planAgent";

describe("eval/lib/phanLoai", () => {
  const contextHienTai = {
    quyTacHienTai: QUY_TAC_VERSION, // "5"
    promptHienTai: AGENT_PROMPT_VERSION, // "v4"
  };

  describe("1) phanLoaiKetQua", () => {
    it('{ quyTacVersion "3", prompt "v4", lyDo null, soLanGoiAI 3 } cho "cu"', () => {
      const res = phanLoaiKetQua(
        { quyTacVersion: "3", prompt: "v4", lyDo: null, soLanGoiAI: 3 },
        contextHienTai
      );
      expect(res).toBe("cu");
    });

    it('{ "5", "v4", "qua_thoi_gian", 0 } cho "khong_do_duoc"', () => {
      const res = phanLoaiKetQua(
        { quyTacVersion: "5", prompt: "v4", lyDo: "qua_thoi_gian", soLanGoiAI: 0 },
        contextHienTai
      );
      expect(res).toBe("khong_do_duoc");
    });

    it('{ "5", "v4", "het_luot_ai", 1 } cho "khong_do_duoc"', () => {
      const res = phanLoaiKetQua(
        { quyTacVersion: "5", prompt: "v4", lyDo: "het_luot_ai", soLanGoiAI: 1 },
        contextHienTai
      );
      expect(res).toBe("khong_do_duoc");
    });

    it('{ "5", "v4", "qua_thoi_gian", 2 } cho "hop_le"', () => {
      const res = phanLoaiKetQua(
        { quyTacVersion: "5", prompt: "v4", lyDo: "qua_thoi_gian", soLanGoiAI: 2 },
        contextHienTai
      );
      expect(res).toBe("hop_le");
    });

    it('{ "5", "v4", "vuot_so_luot_goi_ai", 8 } cho "hop_le"', () => {
      const res = phanLoaiKetQua(
        { quyTacVersion: "5", prompt: "v4", lyDo: "vuot_so_luot_goi_ai", soLanGoiAI: 8 },
        contextHienTai
      );
      expect(res).toBe("hop_le");
    });

    it('{ "5", "v4", null, 3 } cho "hop_le"', () => {
      const res = phanLoaiKetQua(
        { quyTacVersion: "5", prompt: "v4", lyDo: null, soLanGoiAI: 3 },
        contextHienTai
      );
      expect(res).toBe("hop_le");
    });
  });

  describe("3) kiemTraDungSomHaiLanLienTiep", () => {
    it('danh sách ["hop_le", "khong_do_duoc", "khong_do_duoc"] cho dừng (true)', () => {
      expect(
        kiemTraDungSomHaiLanLienTiep(["hop_le", "khong_do_duoc", "khong_do_duoc"])
      ).toBe(true);
    });

    it('danh sách ["khong_do_duoc", "hop_le", "khong_do_duoc"] cho không dừng (false)', () => {
      expect(
        kiemTraDungSomHaiLanLienTiep(["khong_do_duoc", "hop_le", "khong_do_duoc"])
      ).toBe(false);
    });
  });

  describe("4) tinhMauSoKichBan và chuỗi tổng hợp", () => {
    it("danh sách có 2 kịch bản bỏ qua cho mẫu số bằng tổng trừ 2", () => {
      const danhSach = [
        { boQua: false },
        { boQua: false },
        { boQua: false },
        { boQua: false },
        { boQua: true },
        { boQua: true },
        { boQua: false },
        { boQua: false },
        { boQua: false },
        { boQua: false },
      ];
      const res = tinhMauSoKichBan(danhSach);
      expect(res.tongSo).toBe(10);
      expect(res.soBoQua).toBe(2);
      expect(res.mauSo).toBe(8);
      expect(res.mauSo).toBe(res.tongSo - 2);
    });

    it('tạo đúng chuỗi tổng hợp "x/8 kịch bản hợp lệ với quy tắc hiện tại (bỏ qua 2 kịch bản Phú Quốc: không có snapshot)"', () => {
      const s = taoChuoiTongHop(5, 8, 2, "Phú Quốc");
      expect(s).toBe(
        "5/8 kịch bản hợp lệ với quy tắc hiện tại (bỏ qua 2 kịch bản Phú Quốc: không có snapshot)"
      );
    });
  });

  describe("Integration: runAiRate với phân loại và dừng sớm", () => {
    const testTempDir = path.resolve(process.cwd(), "eval/results/test-temp-phanloai");

    beforeEach(() => {
      fs.mkdirSync(testTempDir, { recursive: true });
    });

    afterEach(() => {
      if (fs.existsSync(testTempDir)) {
        try {
          fs.rmSync(testTempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
        } catch {
          // ignore Windows lock
        }
      }
      vi.restoreAllMocks();
    });

    it("kịch bản mới 'khong_do_duoc' không lưu vào tiến trình và dừng sớm khi 2 lần liên tiếp", async () => {
      const progressFile = path.join(testTempDir, "progress-early-stop.json");
      const resultFile = path.join(testTempDir, "result-early-stop.json");

      // planFn trả về qua_thoi_gian với soLanGoiAI = 0 -> "khong_do_duoc"
      const mockPlanFn = vi.fn().mockImplementation(async () => ({
        status: "ok",
        request: {} as any,
        hard: [],
        soft: [],
        lichSu: [],
        soVongSua: 0,
        soLanGoiAI: 0,
        soLan429: 0,
        ms: 100,
        phuongThucLap: "quy_tac",
        lyDoDuPhong: "qua_thoi_gian",
        dataSourceUsed: "snapshot",
      }));

      const consoleSpy = vi.spyOn(console, "log");

      const { results } = await runAiRate({
        progressFilePath: progressFile,
        resultsFilePath: resultFile,
        maxNew: 5,
        planFn: mockPlanFn,
        sleepBetweenMs: 0,
      });

      // Phải dừng sau đúng 2 kịch bản vì 2 lần liên tiếp khong_do_duoc
      expect(mockPlanFn).toHaveBeenCalledTimes(2);
      expect(results.length).toBe(2);

      // Thông báo dừng sớm đúng quy định
      expect(consoleSpy).toHaveBeenCalledWith(
        "DỪNG: AI không phản hồi 2 lần liên tiếp. Kiểm tra GEMINI_MODEL, mạng và hạn mức."
      );

      // Kịch bản mới là "khong_do_duoc": KHÔNG lưu vào tiến trình như hoàn tất
      if (fs.existsSync(progressFile)) {
        const saved = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
        expect(saved.length).toBe(0);
      }
    });
  });
});

