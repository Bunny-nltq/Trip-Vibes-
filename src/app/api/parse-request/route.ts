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
    const raw = err instanceof Error ? err.message : String(err);

    let error = "Lỗi khi xử lý yêu cầu du lịch.";
    if (raw.includes("GEMINI_API_KEY")) {
      error = "Chưa cấu hình GEMINI_API_KEY. Vui lòng cấu hình trong .env.local.";
    } else if (raw.includes("GEMINI_MODEL")) {
      error = "Chưa cấu hình GEMINI_MODEL trong .env.local.";
    } else if (raw.includes("RESOURCE_EXHAUSTED") || raw.includes("429")) {
      error = "Đã vượt hạn mức gọi Gemini API (quota). Vui lòng thử lại sau.";
    } else if (raw.includes("API_KEY_INVALID") || raw.includes("401") || raw.includes("403")) {
      error = "Lỗi xác thực: API key không hợp lệ hoặc không có quyền truy cập.";
    } else if (raw.length < 300) {
      error = raw;
    }

    return NextResponse.json({ ok: false, error, ms }, { status: 500 });
  }
}
