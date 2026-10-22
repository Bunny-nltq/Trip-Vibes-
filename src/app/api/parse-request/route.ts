import { NextResponse } from "next/server";
import { parseRequest } from "@/ai/parseRequest";
import { normalizeRequest } from "@/core/normalizeRequest";

/**
 * POST /api/parse-request
 * Nhận { text } và trích xuất thành TripRequest chuẩn hoá.
 * - Tối đa 500 ký tự (trả về 400 nếu vượt).
 * - Luồng: parseRequest -> normalizeRequest.
 * - Không log nội dung text và không bao giờ in API key.
 */
export async function POST(req: Request) {
  const start = Date.now();

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
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Dữ liệu JSON gửi lên không hợp lệ." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || !("text" in body)) {
      return NextResponse.json(
        { ok: false, error: "Thiếu trường 'text' trong yêu cầu." },
        { status: 400 }
      );
    }

    const text = (body as { text: unknown }).text;

    if (typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "Trường 'text' phải là chuỗi ký tự không rỗng." },
        { status: 400 }
      );
    }

    if (text.length > 500) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nội dung yêu cầu quá dài (tối đa 500 ký tự).",
        },
        { status: 400 }
      );
    }

    // Luồng xử lý: parseRequest (AI) -> normalizeRequest (Core thuần)
    const raw = await parseRequest(text);
    const request = normalizeRequest(raw);
    const ms = Date.now() - start;

    return NextResponse.json({
      ok: true,
      request,
      ms,
    });
  } catch (err: unknown) {
    const ms = Date.now() - start;
    console.error("Lỗi parse-request:", err);

    return NextResponse.json(
      { ok: false, error: "Lỗi khi xử lý yêu cầu du lịch.", ms },
      { status: 500 }
    );
  }
}

