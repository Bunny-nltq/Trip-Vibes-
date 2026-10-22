import { NextResponse } from "next/server";
import { GeminiProvider } from "@/ai/provider";

/**
 * GET /api/ai-ping
 * Kiểm tra kết nối Gemini bằng câu hỏi đơn giản.
 * Trả về { ok, text, model, ms } hoặc { ok: false, error }.
 * Không bao giờ in API key trong phản hồi.
 */
export async function GET() {
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
    const provider = new GeminiProvider();
    const text = await provider.generateText("Trả lời đúng một từ: OK");
    const ms = Date.now() - start;

    return NextResponse.json({
      ok: true,
      text: text.trim(),
      model: provider.modelName,
      ms,
    });
  } catch (err: unknown) {
    const ms = Date.now() - start;
    console.error("Lỗi ai-ping:", err);

    return NextResponse.json(
      { ok: false, error: "Lỗi kết nối dịch vụ AI.", ms },
      { status: 500 }
    );
  }
}

