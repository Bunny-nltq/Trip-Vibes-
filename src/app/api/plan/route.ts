import { NextResponse } from "next/server";
import { parseRequest } from "@/ai/parseRequest";
import { planWithRepair } from "@/ai/planWithRepair";
import { normalizeRequest, removeVietnameseDiacritics } from "@/core/normalizeRequest";
import { TripRequestSchema, type TripRequest } from "@/contracts";

/**
 * POST /api/plan
 * Nhận { text } hoặc { request }.
 * - Có text thì chạy parse-request trước.
 * - Chạy qua planWithRepair (bao gồm cả kiểm tra điều kiện, minBudget, Agent + Repair).
 */
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

    const result = await planWithRepair(tripRequest);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    const ms = Date.now() - start;
    const raw = err instanceof Error ? err.message : String(err);

    let error = "Lỗi khi lập kế hoạch du lịch.";
    if (raw.includes("GEMINI_API_KEY")) {
      error = "Chưa cấu hình GEMINI_API_KEY trong .env.local.";
    } else if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
      error = "Đã vượt hạn mức gọi Gemini API (429). Vui lòng thử lại sau.";
    } else if (raw.includes("agent_dung_id_la")) {
      error = "AI Agent sử dụng ID không tồn tại trong dữ liệu hệ thống.";
    } else if (raw.length < 300) {
      error = raw;
    }

    return NextResponse.json({ ok: false, error, ms }, { status: 500 });
  }
}
