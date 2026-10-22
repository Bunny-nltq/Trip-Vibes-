import { NextResponse } from "next/server";
import { parseRequest } from "@/ai/parseRequest";
import { planWithRepair } from "@/ai/planWithRepair";
import { normalizeRequest } from "@/core/normalizeRequest";
import { TripRequestSchema, type TripRequest, type DiemDen } from "@/contracts";
import {
  isDataReadyForDestination,
  hasSnapshotForDestination,
  isProductionEnvironment,
} from "@/data/prepareDestination";
import { kiemTraGioiHanAI, taoTrangThaiGioiHanAI } from "@/core/gioiHanAI";

export const maxDuration = 60;

// Bộ nhớ trạng thái giới hạn lượt gọi AI theo IP và ngày
const aiRateLimitState = taoTrangThaiGioiHanAI();

export async function POST(req: Request) {
  const start = Date.now();

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Dữ liệu JSON gửi lên không hợp lệ." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Dữ liệu yêu cầu không hợp lệ." },
        { status: 400 }
      );
    }

    const payload = body as { text?: unknown; request?: unknown };
    let tripRequest: TripRequest;

    if (typeof payload.text === "string" && payload.text.trim().length > 0) {
      if (process.env.LIVE_AI_ENABLED !== "true" || !process.env.GEMINI_API_KEY) {
        return NextResponse.json(
          {
            ok: false,
            maLoi: "ai_tat",
            error: "Tính năng phân tích văn bản tự do yêu cầu AI và đang tắt trên hệ thống. Vui lòng gửi cấu trúc request trực tiếp.",
          },
          { status: 503 }
        );
      }
      if (payload.text.length > 500) {
        return NextResponse.json(
          { ok: false, error: "Nội dung yêu cầu quá dài (tối đa 500 ký tự)." },
          { status: 400 }
        );
      }
      const raw = await parseRequest(payload.text);
      tripRequest = normalizeRequest(raw);
    } else if (payload.request && typeof payload.request === "object") {
      const parsed = TripRequestSchema.safeParse(payload.request);
      if (!parsed.success) {
        return NextResponse.json(
          {
            ok: false,
            error: "Dữ liệu request không đúng định dạng schema: " + parsed.error.message,
          },
          { status: 400 }
        );
      }
      tripRequest = parsed.data;
    } else {
      return NextResponse.json(
        { ok: false, error: "Cần cung cấp trường 'text' hoặc 'request'." },
        { status: 400 }
      );
    }

    // Kiểm tra snapshot nếu đang ở môi trường production (không có snapshot thì trả khong_co_du_lieu_luu_san, KHÔNG gọi Overpass)
    if (isProductionEnvironment() && tripRequest.diemDen) {
      const hasSnap = hasSnapshotForDestination(tripRequest.diemDen);
      if (!hasSnap) {
        return NextResponse.json(
          {
            ok: false,
            status: "khong_co_du_lieu_luu_san",
            maLoi: "khong_co_du_lieu_luu_san",
            error: "Điểm đến này chưa có dữ liệu đã lưu. Hãy chạy chương trình trên máy để chuẩn bị dữ liệu.",
          },
          { status: 409 }
        );
      }
    }

    // Kiểm tra dữ liệu đã sẵn sàng chưa (yêu cầu 2: /api/plan chỉ dùng dữ liệu ĐÃ SẴN SÀNG)
    if (tripRequest.diemDen) {
      const isReady = isDataReadyForDestination(
        tripRequest.diemDen,
        tripRequest.diemDi && typeof tripRequest.diemDi === "object"
          ? (tripRequest.diemDi as DiemDen)
          : undefined,
        tripRequest.soNgay ?? 3
      );
      if (!isReady) {
        return NextResponse.json(
          {
            ok: false,
            status: "du_lieu_chua_san_sang",
            maLoi: "du_lieu_chua_san_sang",
            error: "Dữ liệu cho điểm đến này chưa sẵn sàng. Vui lòng gọi /api/destination/prepare trước.",
          },
          { status: 409 }
        );
      }
    }

    // AI limit check (Áp dụng LIVE_AI_ENABLED ở mọi môi trường kể cả dev)
    const isProduction = isProductionEnvironment();

    let forceRulesOnly = false;
    let fallbackReason:
      | "het_luot_ai"
      | "gioi_han_luot_ai"
      | "gioi_han_ip"
      | "gioi_han_ngay"
      | "live_ai_tat"
      | undefined;

    if (process.env.LIVE_AI_ENABLED !== "true" || !process.env.GEMINI_API_KEY) {
      forceRulesOnly = true;
      fallbackReason = "live_ai_tat";
    } else if (isProduction) {
      const clientIp =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1";
      const maxDaily = Number(process.env.GEMINI_DAILY_CAP) || 40;
      const rateCheck = kiemTraGioiHanAI(aiRateLimitState, clientIp, Date.now(), {
        moiIpMoiGio: 5,
        tongMoiNgay: maxDaily,
      });
      if (!rateCheck.choPhep) {
        forceRulesOnly = true;
        fallbackReason = rateCheck.lyDo;
      }
    }

    const result = await planWithRepair(tripRequest, {
      forceRulesOnly,
      lyDoDuPhong: fallbackReason,
    });
    return NextResponse.json({
      ok: true,
      ...result,
      phuongThucLap: result.phuongThucLap ?? "ai",
      lyDoDuPhong: result.lyDoDuPhong,
      soLanGoiAI: result.soLanGoiAI ?? 0,
      soLan429: result.soLan429 ?? 0,
      ms: result.ms ?? Date.now() - start,
    });
  } catch (err: unknown) {
    const ms = Date.now() - start;
    console.error("Lỗi plan route:", err);
    const raw = err instanceof Error ? err.message : String(err);

    let error = "Lỗi khi lập kế hoạch du lịch.";
    if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
      error = "Đã vượt hạn mức gọi dịch vụ. Vui lòng thử lại sau.";
    } else if (raw.includes("agent_dung_id_la")) {
      error = "Hệ thống gặp sự cố khi xử lý dữ liệu địa điểm.";
    }

    return NextResponse.json({ ok: false, error, ms }, { status: 500 });
  }
}
