import type { TripRequest, Plan, DiemDen } from "@/contracts";
import { DEFAULT_DIEM_DI, getDiemDenTen } from "@/contracts";
import { LiveDataSource } from "@/data/live/LiveDataSource";
import { buildPlan } from "@/core/buildPlan";
import { validatePlan, type Violation } from "@/core/validatePlan";
import { donOKhongKhaDung } from "@/core/donOKhongKhaDung";
import { lapOTrong } from "@/core/lapOTrong";
import { tinhNganSachToiThieu } from "@/core/minBudget";
import { runPlanAgent, type AgentTraceItem } from "./planAgent";
import { GeminiProvider } from "./provider";
import { lapKeHoachTuDong } from "@/core/lapKeHoachTuDong";
import { MAX_REPAIR_ROUNDS } from "@/core/assumptions";
import { geocodeDestination, type GeocodeCandidate } from "@/data/live/geocodeClient";

import { getLastOverpassStatsSummary } from "@/data/live/overpassClient";

export interface PlanRepairResult {
  status:
    | "ok"
    | "co_vi_pham"
    | "khong_the_dat_ngan_sach"
    | "khong_co_phuong_an"
    | "can_lam_ro"
    | "khong_du_du_lieu";
  lyDo?:
    | "diem_den_mo_ho"
    | "thieu_thong_tin"
    | "ngoai_pham_vi_so_ngay"
    | "khong_du_du_lieu"
    | string;
  ungVien?: GeocodeCandidate[];
  request: TripRequest;
  plan?: Plan;
  hard: Violation[];
  soft: Violation[];
  chiTietThieu?: {
    phuongTien?: number;
    khachSan: number;
    quanAn: number;
    hoatDong: number;
    mayChuDaThu?: string;
  };
  lichSu: Array<{
    vong: number;
    soHard: number;
    codes: string[];
    tongVND: number;
    trace: AgentTraceItem[];
  }>;
  soVongSua: number;
  soLanGoiAI: number;
  soLan429: number;
  ms: number;
  toiThieuVND?: number;
  phuongThucLap?: "ai" | "quy_tac";
  lyDoDuPhong?:
    | "het_luot_ai"
    | "qua_thoi_gian"
    | "loi_mang_ai"
    | "ai_khong_sua_duoc_ngan_sach";
  dataSourceUsed: string;
  ngayDuLieu?: string;
  snapshotDate?: string;
  tuoiGioCache?: number;
}

export async function planWithRepair(
  incomingRequest: TripRequest,
  options?: { provider?: GeminiProvider }
): Promise<PlanRepairResult> {
  const startMs = Date.now();
  let request = { ...incomingRequest };

  // a) Kiểm tra điều kiện "cần làm rõ" (thiếu trường, ngoài phạm vi)
  const emptyResult: PlanRepairResult = {
    status: "can_lam_ro",
    request,
    hard: [],
    soft: [],
    lichSu: [],
    soVongSua: 0,
    soLanGoiAI: 0,
    soLan429: 0,
    ms: 0,
    dataSourceUsed: "live",
  };

  if (!request.diemDen || request.thieu.includes("diemDen")) {
    emptyResult.lyDo = "thieu_thong_tin";
    emptyResult.ms = Date.now() - startMs;
    return emptyResult;
  }

  // Geocode nếu diemDen là string hoặc cần kiểm tra mơ hồ
  let resolvedDiemDen: DiemDen;
  if (typeof request.diemDen === "string") {
    const geo = await geocodeDestination(request.diemDen);
    if (geo.status === "can_lam_ro") {
      emptyResult.lyDo = "diem_den_mo_ho";
      emptyResult.ungVien = geo.ungVien;
      emptyResult.ms = Date.now() - startMs;
      return emptyResult;
    }
    if (geo.status === "khong_tim_thay") {
      emptyResult.lyDo = "thieu_thong_tin";
      emptyResult.ms = Date.now() - startMs;
      return emptyResult;
    }
    resolvedDiemDen = geo.diemDen;
    request.diemDen = resolvedDiemDen;
  } else {
    resolvedDiemDen = request.diemDen;
  }

  let resolvedDiemDi: DiemDen = DEFAULT_DIEM_DI;
  if (request.diemDi) {
    if (typeof request.diemDi === "string") {
      const geoDi = await geocodeDestination(request.diemDi);
      if (geoDi.status === "thanh_cong") {
        resolvedDiemDi = geoDi.diemDen;
      }
    } else {
      resolvedDiemDi = request.diemDi;
    }
  }

  if (
    !request.soNguoi ||
    !request.soNgay ||
    !request.ngansachTongVND ||
    request.soNgay < 2 ||
    request.soNgay > 5 ||
    request.thieu.length > 0
  ) {
    emptyResult.lyDo =
      request.soNgay && (request.soNgay < 2 || request.soNgay > 5)
        ? "ngoai_pham_vi_so_ngay"
        : "thieu_thong_tin";
    emptyResult.ms = Date.now() - startMs;
    return emptyResult;
  }

  console.log("[planWithRepair] Initializing LiveDataSource for:", resolvedDiemDen.ten);
  const liveDataSource = new LiveDataSource(
    undefined,
    undefined,
    resolvedDiemDen,
    resolvedDiemDi,
    request.soNgay ?? 3,
    request.giaVeTuNhap
  );
  const mode = liveDataSource.getMode();
  emptyResult.dataSourceUsed = mode;

  console.log("[planWithRepair] Fetching all data via Promise.all...");
  // Lấy dữ liệu song song
  const [transports, hotels, activities, khachSans, quanAns, cafes, hoatDongs] =
    await Promise.all([
      liveDataSource.getTransports(),
      liveDataSource.getHotels(),
      liveDataSource.getActivities(),
      liveDataSource.getKhachSans(),
      liveDataSource.getQuanAns(),
      liveDataSource.getCafes(),
      liveDataSource.getHoatDongs(),
    ]);
  console.log(`[planWithRepair] Data ready: ${transports.length} transports, ${khachSans.length} hotels, ${quanAns.length} food, ${hoatDongs.length} activities`);

  const dsUsedInfo = liveDataSource.getDataSourceUsed();
  emptyResult.dataSourceUsed = dsUsedInfo.source;
  emptyResult.ngayDuLieu = dsUsedInfo.ngayDuLieu;
  emptyResult.snapshotDate = dsUsedInfo.snapshotDate;
  emptyResult.tuoiGioCache = dsUsedInfo.tuoiGio;

  const data = {
    transports,
    hotels,
    activities,
    khachSans,
    quanAns,
    cafes,
    hoatDongs,
  };

  // Tiền điều kiện dữ liệu: phương tiện, khách sạn dưới 3, điểm tham quan dưới 3 hoặc quán ăn dưới 2
  const thieuPT = transports.length === 0;
  const thieuKS = khachSans.length < 3;
  const thieuHD = hoatDongs.length < 3;
  const thieuQA = quanAns.length < 2;

  if (thieuPT || thieuKS || thieuHD || thieuQA) {
    const lyDoThieu: string[] = [];
    if (thieuPT) lyDoThieu.push("phương tiện di chuyển (0)");
    if (thieuKS) lyDoThieu.push(`khách sạn (${khachSans.length}/3)`);
    if (thieuHD) lyDoThieu.push(`điểm tham quan (${hoatDongs.length}/3)`);
    if (thieuQA) lyDoThieu.push(`quán ăn (${quanAns.length}/2)`);

    const overpassStats = getLastOverpassStatsSummary();
    console.warn(
      `[planWithRepair] Kho dữ liệu không đủ: thiếu ${lyDoThieu.join(", ")}. Dừng trước khi gọi Gemini.`
    );

    emptyResult.status = "khong_du_du_lieu";
    emptyResult.lyDo = "khong_du_du_lieu";
    emptyResult.soLanGoiAI = 0;
    emptyResult.soLan429 = 0;
    emptyResult.ms = Date.now() - startMs;
    emptyResult.chiTietThieu = {
      phuongTien: transports.length,
      khachSan: khachSans.length,
      quanAn: quanAns.length,
      hoatDong: hoatDongs.length,
      mayChuDaThu: overpassStats,
    };
    emptyResult.hard.push({
      code: "khong_du_du_lieu",
      chiTiet: `Dữ liệu địa phương tại ${resolvedDiemDen.ten} chưa đủ để lập kế hoạch chất lượng: thiếu ${lyDoThieu.join(
        ", "
      )}. Nguồn: OpenStreetMap. Chi tiết máy chủ: ${overpassStats}`,
    });
    return emptyResult;
  }

  // b) Kiểm tra ngân sách tối thiểu (không tốn quota AI)
  const minBudgetRes = tinhNganSachToiThieu(request, data);
  if (!minBudgetRes.khaThi || (request.ngansachTongVND && minBudgetRes.toiThieuVND > request.ngansachTongVND)) {
    emptyResult.status =
      minBudgetRes.lyDo === "khong_co_phuong_tien_phu_hop"
        ? "khong_co_phuong_an"
        : "khong_the_dat_ngan_sach";
    emptyResult.toiThieuVND = minBudgetRes.toiThieuVND;
    emptyResult.soLanGoiAI = 0;
    emptyResult.soLan429 = 0;
    emptyResult.ms = Date.now() - startMs;
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
  const sharedFoodIds = new Set<string>();
  let soLanGoiAI = 0;
  let soLan429 = 0;

  let bestPlanInfo: {
    plan: Plan;
    hard: Violation[];
    soft: Violation[];
    vong: number;
  } | null = null;

  const lichSu: PlanRepairResult["lichSu"] = [];
  let currentRepairInfo: any = undefined;

  const fallbackToRules = (
    lyDo: "het_luot_ai" | "qua_thoi_gian" | "loi_mang_ai" | "ai_khong_sua_duoc_ngan_sach",
    curSoLanGoiAI: number,
    curSoLan429: number,
    vong: number
  ): PlanRepairResult => {
    const autoRes = lapKeHoachTuDong(request, data, request.soNgay ?? 3);
    if (autoRes.status === "khong_the_dat_ngan_sach") {
      return {
        status: "khong_the_dat_ngan_sach",
        request,
        hard: [
          {
            code: "ngan_sach_toi_thieu",
            chiTiet: `Ngân sách không đủ. Tối thiểu cần khoảng ${autoRes.toiThieuVND.toLocaleString(
              "vi-VN"
            )} ₫.`,
          },
        ],
        soft: [],
        lichSu,
        soVongSua: vong,
        soLanGoiAI: curSoLanGoiAI,
        soLan429: curSoLan429,
        ms: Date.now() - startMs,
        toiThieuVND: autoRes.toiThieuVND,
        phuongThucLap: "quy_tac",
        lyDoDuPhong: lyDo,
        dataSourceUsed: dsUsedInfo.source,
        ngayDuLieu: dsUsedInfo.ngayDuLieu,
        snapshotDate: dsUsedInfo.snapshotDate,
        tuoiGioCache: dsUsedInfo.tuoiGio,
      };
    }

    return {
      status: "ok",
      request,
      plan: {
        ...autoRes.plan,
        phuongThucLap: "quy_tac",
        lyDoDuPhong: lyDo,
      },
      hard: [],
      soft: [],
      lichSu,
      soVongSua: vong,
      soLanGoiAI: curSoLanGoiAI,
      soLan429: curSoLan429,
      ms: Date.now() - startMs,
      toiThieuVND: autoRes.toiThieuVND,
      phuongThucLap: "quy_tac",
      lyDoDuPhong: lyDo,
      dataSourceUsed: dsUsedInfo.source,
      ngayDuLieu: dsUsedInfo.ngayDuLieu,
      snapshotDate: dsUsedInfo.snapshotDate,
      tuoiGioCache: dsUsedInfo.tuoiGio,
    };
  };

  for (let vong = 0; vong <= MAX_REPAIR_ROUNDS; vong++) {
    const timeBudget = Number(process.env.PLAN_TIME_BUDGET_MS) || 50_000;
    const remainingBudget = Math.max(0, timeBudget - (Date.now() - startMs));
    if (remainingBudget <= 0) {
      return fallbackToRules("qua_thoi_gian", soLanGoiAI, soLan429, vong);
    }

    let agentResult;
    let budgetTimer: NodeJS.Timeout;
    const budgetPromise = new Promise<never>((_, reject) => {
      budgetTimer = setTimeout(() => {
        const err = new Error("qua_thoi_gian: Quá ngân sách thời gian lập kế hoạch");
        reject(err);
      }, remainingBudget);
    });

    try {
      const agentPromise = runPlanAgent(request, {
        provider,
        dataSource: liveDataSource,
        liveDataSource,
        sharedSeenIds,
        sharedFoodIds,
        repairInfo: currentRepairInfo,
        timeBudgetMs: timeBudget,
        startTimeOverall: startMs,
      });

      agentResult = await Promise.race([agentPromise, budgetPromise]);
      soLanGoiAI += agentResult.soLanGoiAI ?? 1;
      soLan429 += agentResult.soLan429 ?? 0;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      let lyDo: "het_luot_ai" | "qua_thoi_gian" | "loi_mang_ai" = "loi_mang_ai";

      if (
        msg.includes("het_luot_ai") ||
        msg.includes("429") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("quota")
      ) {
        lyDo = "het_luot_ai";
        soLan429 = Math.max(soLan429 + 1, 1);
        soLanGoiAI = Math.max(soLanGoiAI + 1, 1);
      } else if (
        msg.includes("qua_thoi_gian") ||
        msg.includes("timed out") ||
        Date.now() - startMs >= timeBudget
      ) {
        lyDo = "qua_thoi_gian";
      } else if (
        msg.includes("loi_mang_ai") ||
        msg.includes("fetch failed") ||
        msg.includes("503") ||
        msg.includes("UNAVAILABLE")
      ) {
        lyDo = "loi_mang_ai";
      }

      return fallbackToRules(lyDo, soLanGoiAI, soLan429, vong);
    } finally {
      clearTimeout(budgetTimer!);
    }

    const { selection, trace } = agentResult;
    let activeSelection = selection;

    // 1. Dọn các ô không khả dụng do giờ giấc di chuyển trước khi kiểm tra hard / buildPlan
    const donResBefore = donOKhongKhaDung(activeSelection, undefined, data.transports);
    if (donResBefore.daDon) {
      activeSelection = donResBefore.selection;
    }

    const buildRes = buildPlan(request, activeSelection, data, mode);

    let plan: Plan | undefined = undefined;
    let hard: Violation[] = [];
    let soft: Violation[] = [];
    let tongVND = 0;

    if (!buildRes.ok) {
      hard.push({
        code: "loi_cau_truc",
        chiTiet: buildRes.loi?.join("; ") || "Lỗi khi build kế hoạch.",
      });
      tongVND = 0;
    } else {
      plan = buildRes.plan;
      for (const cb of donResBefore.canhBao) {
        if (!plan.canhBao.includes(cb)) plan.canhBao.push(cb);
      }

      // 2. Lấp các ô khả dụng còn trống
      const lapRes = lapOTrong(
        activeSelection,
        plan,
        data.hoatDongs ?? data.activities ?? [],
        request
      );
      if (lapRes.daLap) {
        activeSelection = lapRes.selection;
        const rebuild = buildPlan(request, activeSelection, data, mode);
        if (rebuild.ok) {
          plan = rebuild.plan;
          for (const cb of lapRes.canhBao) {
            if (!plan.canhBao.includes(cb)) plan.canhBao.push(cb);
          }
        }
      } else if (lapRes.canhBao.length > 0) {
        for (const cb of lapRes.canhBao) {
          if (!plan.canhBao.includes(cb)) plan.canhBao.push(cb);
        }
      }

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
      if (
        !bestPlanInfo ||
        hard.length < bestPlanInfo.hard.length ||
        (hard.length === bestPlanInfo.hard.length &&
          tongVND < bestPlanInfo.plan.tongKet.tongVND)
      ) {
        bestPlanInfo = { plan, hard, soft, vong };
      }
    }

    if (hard.length === 0 && plan) {
      return {
        status: "ok",
        request,
        plan: {
          ...plan,
          phuongThucLap: "ai",
        } as any,
        hard,
        soft,
        lichSu,
        soVongSua: vong,
        soLanGoiAI,
        soLan429,
        ms: Date.now() - startMs,
        toiThieuVND: minBudgetRes.toiThieuVND,
        phuongThucLap: "ai",
        dataSourceUsed: dsUsedInfo.source,
        ngayDuLieu: dsUsedInfo.ngayDuLieu,
        snapshotDate: dsUsedInfo.snapshotDate,
        tuoiGioCache: dsUsedInfo.tuoiGio,
      };
    }

    currentRepairInfo = {
      selectionTruoc: selection,
      viPham: hard,
      tongKetHienTai: plan?.tongKet || { tongVND },
      ngansachTongVND: request.ngansachTongVND,
    };
  }

  // Nếu sau mọi vòng sửa vẫn còn vuot_ngan_sach hoặc vi phạm trong khi toiThieuVND <= ngân sách:
  if (minBudgetRes.toiThieuVND <= (request.ngansachTongVND ?? 0)) {
    return fallbackToRules(
      "ai_khong_sua_duoc_ngan_sach",
      soLanGoiAI,
      soLan429,
      MAX_REPAIR_ROUNDS
    );
  }

  return {
    status: "co_vi_pham",
    request,
    plan: bestPlanInfo?.plan,
    hard: bestPlanInfo?.hard || [],
    soft: bestPlanInfo?.soft || [],
    lichSu,
    soVongSua: MAX_REPAIR_ROUNDS,
    soLanGoiAI,
    soLan429,
    ms: Date.now() - startMs,
    toiThieuVND: minBudgetRes.toiThieuVND,
    dataSourceUsed: dsUsedInfo.source,
    ngayDuLieu: dsUsedInfo.ngayDuLieu,
    snapshotDate: dsUsedInfo.snapshotDate,
    tuoiGioCache: dsUsedInfo.tuoiGio,
  };
}
