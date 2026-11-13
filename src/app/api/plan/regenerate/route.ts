import { NextResponse } from "next/server";
import { PlanSchema, TripRequestSchema, SelectionSchema, type TripRequest, type Selection } from "@/contracts";
import { LiveDataSource } from "@/data/live/LiveDataSource";
import { buildPlan } from "@/core/buildPlan";
import { lapOTrong } from "@/core/lapOTrong";
import { diffPlan } from "@/core/diffPlan";
import { validatePlan } from "@/core/validatePlan";
import { uniqueNamedOsmVenues } from "@/core/venueDiscovery";
import { spendingLimit } from "@/core/travelRequest";
import { planRegenerate } from "@/ai/planRegenerate";
import { getSnapshotDiemDen } from "@/data/prepareDestination";

export async function POST(req: Request) {
  if (process.env.LIVE_AI_ENABLED !== "true" || !process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        ok: false,
        maLoi: "ai_tat",
        thongBao: "Tính năng này đang tắt trên bản hiện tại.",
      },
      { status: 503 }
    );
  }
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Dữ liệu JSON không hợp lệ." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Thiếu dữ liệu yêu cầu." },
        { status: 400 }
      );
    }

    const parsedReq = TripRequestSchema.safeParse(body.request);
    if (!parsedReq.success) {
      return NextResponse.json(
        { ok: false, error: "Dữ liệu request không hợp lệ: " + parsedReq.error.message },
        { status: 400 }
      );
    }
    const request: TripRequest = parsedReq.data;

    const parsedSel = SelectionSchema.safeParse(body.selection);
    if (!parsedSel.success) {
      return NextResponse.json(
        { ok: false, error: "Dữ liệu selection không hợp lệ: " + parsedSel.error.message },
        { status: 400 }
      );
    }
    const currentSelection: Selection = parsedSel.data;

    const resolvedDiemDen = request.diemDen ? (getSnapshotDiemDen(request.diemDen) || undefined) : undefined;
    const resolvedDiemDi = request.diemDi ? (getSnapshotDiemDen(request.diemDi) || undefined) : undefined;

    const liveDataSource = new LiveDataSource(
      undefined,
      undefined,
      resolvedDiemDen,
      resolvedDiemDi,
      request.soNgay ?? 3,
      request.giaVeTuNhap
    );

    // Lấy dữ liệu song song từ LiveDataSource (theo DATA_MODE, có cache)
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

    const data = {
      transports,
      hotels,
      activities,
      khachSans,
      quanAns,
      cafes,
      hoatDongs,
    };

    const original = PlanSchema.safeParse(body.planTruoc);
    if (original.success && original.data.items.some(item => item.locked || item.state === "visited")) {
      return NextResponse.json({ ok: false, error: "Lịch có điểm đã khóa hoặc đã ghé. Hãy dùng nút Đổi ở từng mục cần chỉnh." }, { status: 422 });
    }

    if (process.env.LIVE_AI_ENABLED === "true" && process.env.GEMINI_API_KEY) {
      try {
        const result = await planRegenerate({ request, selection: currentSelection, data });
        if (!result.hard.length && result.planSau.tongKet.tongVND <= spendingLimit(request)) {
          return NextResponse.json({ ...result, ok: true,
            diff: original.success ? diffPlan(original.data, result.planSau, data) : result.diff });
        }
      } catch {
        // Dữ liệu cục bộ vẫn có thể tạo bản xem trước khi nhà cung cấp AI gặp lỗi.
      }
    }

    const selection = { ...currentSelection, hoatDongTheoNgay: currentSelection.hoatDongTheoNgay.map(() => []) };
    const base = buildPlan(request, selection, data);
    if (!base.ok) {
      return NextResponse.json({ ok: false, error: "Chưa thể đối chiếu phương tiện hoặc nơi ở trong lịch này. Bạn có thể đổi từng mục trong tổng quan." }, { status: 422 });
    }
    const candidates = uniqueNamedOsmVenues(hoatDongs.length ? hoatDongs : []);
    const proposed = lapOTrong(selection, base.plan, candidates, request, transports);
    const built = buildPlan(request, proposed.selection, data);
    if (built.ok) {
      const validation = validatePlan(request, built.plan, data);
      if (!validation.hard.length && built.plan.tongKet.tongVND <= spendingLimit(request)) {
        return NextResponse.json({ ok: true, planSau: built.plan, selection: proposed.selection,
          diff: diffPlan(original.success ? original.data : base.plan, built.plan, data), ...validation });
      }
    }
    return NextResponse.json({ ok: false, error: "Chưa tìm được hoạt động hợp gu trong ngân sách. Lịch hiện tại vẫn được giữ." }, { status: 422 });
  } catch (err: any) {
    console.error("Lỗi plan/regenerate:", err);
    const msg = err?.message || String(err);
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json(
        { ok: false, error: "Hết lượt gợi ý hôm nay. Bạn có thể đổi hoạt động thủ công bằng nút 'Đổi'." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { ok: false, error: "Lỗi hệ thống khi gợi ý lại." },
      { status: 500 }
    );
  }
}

