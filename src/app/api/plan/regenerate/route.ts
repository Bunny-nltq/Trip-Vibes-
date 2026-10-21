import { NextResponse } from "next/server";
import type { TripRequest, Selection } from "@/contracts";
import { LiveDataSource } from "@/data/live/LiveDataSource";
import { GeminiProvider } from "@/ai/provider";
import { planRegenerate } from "@/ai/planRegenerate";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const request = body.request as TripRequest;
    const currentSelection = body.selection as Selection;

    if (!request || !currentSelection) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu request hoặc selection" },
        { status: 400 }
      );
    }

    const liveDataSource = new LiveDataSource();

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
    } catch {
      return NextResponse.json(
        { error: "Chưa cấu hình GEMINI_API_KEY hoặc GEMINI_MODEL." },
        { status: 500 }
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
    const msg = err.message || String(err);
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json(
        { error: "Hết lượt gọi AI hôm nay. Bạn có thể đổi hoạt động thủ công bằng nút 'Đổi'." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Lỗi hệ thống khi gợi ý lại: " + msg },
      { status: 500 }
    );
  }
}
