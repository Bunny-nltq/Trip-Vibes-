import type { TripRequest, Plan } from "@/contracts";
import { JsonDataSource } from "@/data/JsonDataSource";
import { buildPlan } from "@/core/buildPlan";
import { validatePlan, type Violation } from "@/core/validatePlan";
import { tinhNganSachToiThieu } from "@/core/minBudget";
import { runPlanAgent, type AgentTraceItem } from "./planAgent";
import { GeminiProvider } from "./provider";
import { MAX_REPAIR_ROUNDS } from "@/core/assumptions";

export interface PlanRepairResult {
  status:
    | "ok"
    | "co_vi_pham"
    | "khong_the_dat_ngan_sach"
    | "khong_co_phuong_an"
    | "can_lam_ro";
  request: TripRequest;
  plan?: Plan;
  hard: Violation[];
  soft: Violation[];
  lichSu: Array<{
    vong: number;
    soHard: number;
    codes: string[];
    tongVND: number;
    trace: AgentTraceItem[];
  }>;
  soVongSua: number;
  soLanGoiAI: number;
  ms: number;
  toiThieuVND?: number;
}

export async function planWithRepair(
  request: TripRequest,
  options?: { provider?: GeminiProvider }
): Promise<PlanRepairResult> {
  const startMs = Date.now();
  const dataSource = new JsonDataSource();
  const [transports, hotels, activities] = await Promise.all([
    dataSource.getTransports(),
    dataSource.getHotels(),
    dataSource.getActivities(),
  ]);
  const data = { transports, hotels, activities };

  const emptyResult: PlanRepairResult = {
    status: "can_lam_ro",
    request,
    hard: [],
    soft: [],
    lichSu: [],
    soVongSua: 0,
    soLanGoiAI: 0,
    ms: 0,
  };

  // a) Kiểm tra điều kiện "cần làm rõ"
  if (
    !request.soNguoi ||
    !request.soNgay ||
    !request.ngansachTongVND ||
    request.soNgay !== 3 ||
    request.diemDen !== "Đà Nẵng" ||
    request.thieu.length > 0
  ) {
    emptyResult.ms = Date.now() - startMs;
    return emptyResult;
  }

  // b) Kiểm tra ngân sách tối thiểu (không tốn quota AI)
  const minBudgetRes = tinhNganSachToiThieu(request, data);
  if (!minBudgetRes.khaThi) {
    emptyResult.status =
      minBudgetRes.lyDo === "khong_co_phuong_tien_phu_hop"
        ? "khong_co_phuong_an"
        : "khong_the_dat_ngan_sach";
    emptyResult.toiThieuVND = minBudgetRes.toiThieuVND;
    emptyResult.ms = Date.now() - startMs;
    // Báo lỗi bằng chiTiet giả vào hard
    emptyResult.hard.push({
      code: "ngan_sach_toi_thieu",
      chiTiet:
        minBudgetRes.lyDo === "khong_co_phuong_tien_phu_hop"
          ? "Không có phương tiện nào thỏa mãn các điều cần tránh của bạn."
          : `Ngân sách không đủ. Tối thiểu cần khoảng ${minBudgetRes.toiThieuVND.toLocaleString(
              "vi-VN"
            )} ₫.`,
    });
    return emptyResult;
  }

  // c) Vòng lặp sửa lỗi
  const provider = options?.provider ?? new GeminiProvider();
  const sharedSeenIds = new Set<string>();
  let soLanGoiAI = 0;

  let bestPlanInfo: {
    plan: Plan;
    hard: Violation[];
    soft: Violation[];
    vong: number;
  } | null = null;

  const lichSu: PlanRepairResult["lichSu"] = [];
  let currentRepairInfo: any = undefined;

  for (let vong = 0; vong <= MAX_REPAIR_ROUNDS; vong++) {
    soLanGoiAI++;
    let agentResult;
    try {
      agentResult = await runPlanAgent(request, {
        provider,
        dataSource,
        sharedSeenIds,
        repairInfo: currentRepairInfo,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("429") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("quota")
      ) {
        throw new Error("Lỗi API Gemini 429: " + msg);
      }
      throw err;
    }

    const { selection, trace } = agentResult;
    const buildRes = buildPlan(request, selection, data);

    let plan: Plan | undefined = undefined;
    let hard: Violation[] = [];
    let soft: Violation[] = [];
    let tongVND = 0;

    if (!buildRes.ok) {
      // Lỗi cấu trúc
      hard.push({
        code: "loi_cau_truc",
        chiTiet: buildRes.loi?.join("; ") || "Lỗi khi build kế hoạch (có thể ID không hợp lệ).",
      });
      tongVND = 0;
    } else {
      plan = buildRes.plan;
      tongVND = plan.tongKet.tongVND;
      const v = validatePlan(request, plan, data);
      hard = v.hard;
      soft = v.soft;
    }

    lichSu.push({
      vong,
      soHard: hard.length,
      codes: hard.map((h) => h.code),
      tongVND,
      trace,
    });

    if (plan) {
      // Cập nhật bestPlanInfo
      if (
        !bestPlanInfo ||
        hard.length < bestPlanInfo.hard.length ||
        (hard.length === bestPlanInfo.hard.length &&
          tongVND < bestPlanInfo.plan.tongKet.tongVND)
      ) {
        bestPlanInfo = { plan, hard, soft, vong };
      }
    }

    if (hard.length === 0) {
      // Thành công
      return {
        status: "ok",
        request,
        plan,
        hard,
        soft,
        lichSu,
        soVongSua: vong, // Vòng 0 nghĩa là không sửa (đạt ngay lần đầu)
        soLanGoiAI,
        ms: Date.now() - startMs,
        toiThieuVND: minBudgetRes.toiThieuVND,
      };
    }

    // Gán dữ liệu sửa lỗi cho vòng sau
    currentRepairInfo = {
      selectionTruoc: selection,
      viPham: hard,
      tongKetHienTai: plan?.tongKet || { tongVND },
      ngansachTongVND: request.ngansachTongVND,
    };
  }

  // d) Kết thúc vòng lặp vẫn còn lỗi
  return {
    status: "co_vi_pham",
    request,
    plan: bestPlanInfo?.plan,
    hard: bestPlanInfo?.hard || [],
    soft: bestPlanInfo?.soft || [],
    lichSu,
    soVongSua: MAX_REPAIR_ROUNDS,
    soLanGoiAI,
    ms: Date.now() - startMs,
    toiThieuVND: minBudgetRes.toiThieuVND,
  };
}
