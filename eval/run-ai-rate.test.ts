import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { runAiRate, type ScenarioResult, type ProgressRecord } from "./run-ai-rate";
import type { PlanRepairResult } from "../src/ai/planWithRepair";

const testTempDir = path.resolve(process.cwd(), "eval/results/test-temp");

describe("Eval chạy tiếp được (run-ai-rate)", () => {
  beforeEach(() => {
    fs.mkdirSync(testTempDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testTempDir)) {
      fs.rmSync(testTempDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  const createMockPlanResult = (stt: number): PlanRepairResult => ({
    status: "ok",
    request: {} as any,
    hard: [],
    soft: [],
    lichSu: [],
    soVongSua: 0,
    soLanGoiAI: 1,
    soLan429: 0,
    ms: 100,
    phuongThucLap: "ai",
    dataSourceUsed: "snapshot",
    plan: {
      schemaVersion: 9,
      request: { soNgay: 3 } as any,
      items: [
        {
          ngay: 1,
          gio: "08:00",
          hangMuc: "Di chuyển",
          noiDung: "Đi",
          soLuong: 2,
          donGia: 1000000,
          thanhTien: 2000000,
          refId: "est_di_may_bay_0",
        },
        {
          ngay: 2,
          gio: "09:30",
          hangMuc: "Vui chơi",
          noiDung: "Chơi 1",
          soLuong: 2,
          donGia: 0,
          thanhTien: 0,
          refId: "act_1",
        },
        {
          ngay: 3,
          gio: "17:00",
          hangMuc: "Di chuyển",
          noiDung: "Về",
          soLuong: 2,
          donGia: 1000000,
          thanhTien: 2000000,
          refId: "est_ve_may_bay_0",
        },
      ],
      tongKet: {
        tongVND: 5000000,
        conLaiVND: 2500000,
        phanTramDaDung: 66.7,
        trangThaiNganSach: "trong",
        theoHangMuc: {
          "Di chuyển": 4000000,
          "Chỗ ở": 1000000,
          "Ăn uống": 0,
          "Vui chơi": 0,
        },
        tongThoiGianDiChuyenPhut: 200,
      },
      canhBao: [],
    },
  });

  // (a) resume bỏ qua kịch bản đã xong và không gọi provider
  it("(a) resume bỏ qua kịch bản đã xong và không gọi provider/planFn", async () => {
    const progressFile = path.join(testTempDir, "progress-resume.json");
    const resultFile = path.join(testTempDir, "result-resume.json");

    // Giả lập kịch bản 1 đã hoàn thành trước đó
    const initialRecords: ProgressRecord[] = [
      {
        hashKey: "mock-hash-kb-1",
        ngayChay: "2026-10-20",
        stt: 1,
        scenarioResult: {
          stt: 1,
          diemDen: "Đà Nẵng",
          heSo: "1.3x",
          ngansachTongVND: 7500000,
          phuongThucLap: "ai",
          lyDoDuPhong: "",
          soLanGoiAI: 8,
          ms: 5000,
          tongVND: 6044000,
          phanTramNganSach: "80.6%",
          oHoatDong: "3/3 (tối đa 4)",
          tongThoiGianDiChuyen: 1334,
          tiLeThoiGianDiChuyen: "30.9%",
          soCanhBaoNhe: 0,
          soVongSua: 1,
          status: "ok",
          nguonKetQua: "từ lần chạy ngày 2026-10-20",
        },
      },
    ];
    fs.writeFileSync(progressFile, JSON.stringify(initialRecords, null, 2), "utf-8");

    const mockPlanFn = vi.fn().mockImplementation(async () => createMockPlanResult(2));

    // Chạy với giới hạn tối đa 1 kịch bản mới (chạy kịch bản 1 từ cache, kịch bản 2 mới)
    const { results } = await runAiRate({
      progressFilePath: progressFile,
      resultsFilePath: resultFile,
      maxNew: 1,
      planFn: mockPlanFn,
      sleepBetweenMs: 0,
    });

    // Kịch bản 1 phải được đọc từ cache với nguồn "từ lần chạy ngày 2026-10-20"
    expect(results[0].stt).toBe(1);
    expect(results[0].nguonKetQua).toContain("từ lần chạy ngày 2026-10-20");

    // mockPlanFn chỉ được gọi đúng 1 lần cho kịch bản 2 (kịch bản 1 không gọi planFn)
    expect(mockPlanFn).toHaveBeenCalledTimes(1);
  });

  // (b) gặp 429 ở kịch bản thứ 3 thì lưu 2 kịch bản đầu và dừng
  it("(b) gặp 429 ở kịch bản thứ 3 thì lưu 2 kịch bản đầu và dừng", async () => {
    const progressFile = path.join(testTempDir, "progress-429.json");
    const resultFile = path.join(testTempDir, "result-429.json");

    let callCount = 0;
    const mockPlanFn = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 3) {
        throw new Error("429 RESOURCE_EXHAUSTED: Quota exceeded for model");
      }
      return createMockPlanResult(callCount);
    });

    const { results, stopDueTo429 } = await runAiRate({
      progressFilePath: progressFile,
      resultsFilePath: resultFile,
      planFn: mockPlanFn,
      sleepBetweenMs: 0,
    });

    // Phải dừng do 429
    expect(stopDueTo429).toBe(true);

    // Đã chạy 2 kịch bản đầu thành công
    expect(results.length).toBe(2);
    expect(results[0].stt).toBe(1);
    expect(results[1].stt).toBe(2);

    // File tiến trình progressFile phải lưu chính xác 2 kịch bản
    expect(fs.existsSync(progressFile)).toBe(true);
    const savedRecords: ProgressRecord[] = JSON.parse(
      fs.readFileSync(progressFile, "utf-8")
    );
    expect(savedRecords.length).toBe(2);
    expect(savedRecords[0].stt).toBe(1);
    expect(savedRecords[1].stt).toBe(2);
  });

  // (c) --toi-da=2 chỉ chạy 2 kịch bản mới
  it("(c) --toi-da=2 chỉ chạy đúng 2 kịch bản mới", async () => {
    const progressFile = path.join(testTempDir, "progress-max2.json");
    const resultFile = path.join(testTempDir, "result-max2.json");

    const mockPlanFn = vi.fn().mockImplementation(async () => createMockPlanResult(1));

    const { results } = await runAiRate({
      progressFilePath: progressFile,
      resultsFilePath: resultFile,
      maxNew: 2,
      planFn: mockPlanFn,
      sleepBetweenMs: 0,
    });

    // Chỉ chạy đúng 2 kịch bản mới
    expect(results.length).toBe(2);
    expect(mockPlanFn).toHaveBeenCalledTimes(2);

    // File progress lưu đúng 2 kịch bản
    const savedRecords: ProgressRecord[] = JSON.parse(
      fs.readFileSync(progressFile, "utf-8")
    );
    expect(savedRecords.length).toBe(2);
  });
});
