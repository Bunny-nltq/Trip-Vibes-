import { NextResponse } from "next/server";
import { TripRequestSchema, SelectionSchema, type TripRequest, type Selection } from "@/contracts";
import { LiveDataSource } from "@/data/live/LiveDataSource";
import { GeminiProvider } from "@/ai/provider";
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

    let provider: GeminiProvider;
    try {
      provider = new GeminiProvider();
    } catch (e) {
      console.error("Lỗi khởi tạo provider:", e);
      return NextResponse.json(
        {
          ok: false,
          maLoi: "ai_tat",
          thongBao: "Tính năng này đang tắt trên bản hiện tại.",
        },
        { status: 503 }
      );
    }

    const result = await planRegenerate({
      request,
      selection: currentSelection,
      data,
      provider,
    });

    return NextResponse.json(result);
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

