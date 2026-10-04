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
    const raw = err instanceof Error ? err.message : String(err);

    // Phân loại lỗi thành thông báo dễ hiểu, KHÔNG in key
    let error = "Lỗi không xác định khi gọi Gemini.";

    if (raw.includes("GEMINI_API_KEY")) {
      error = "Chưa cấu hình GEMINI_API_KEY. Thêm vào .env.local và khởi động lại server.";
    } else if (raw.includes("GEMINI_MODEL")) {
      error = "Chưa cấu hình GEMINI_MODEL. Thêm vào .env.local (ví dụ: gemini-2.0-flash).";
    } else if (raw.includes("API_KEY_INVALID") || raw.includes("401") || raw.includes("403")) {
      error = "Lỗi xác thực: API key không hợp lệ hoặc đã hết hạn. Kiểm tra lại key tại aistudio.google.com.";
    } else if (raw.includes("MODEL_NOT_FOUND") || raw.includes("404")) {
      error = `Tên model không tồn tại. Kiểm tra lại GEMINI_MODEL trong .env.local.`;
    } else if (raw.includes("RESOURCE_EXHAUSTED") || raw.includes("429")) {
      error = "Đã hết lượt gọi API (quota). Vui lòng thử lại sau hoặc kiểm tra quota tại console.cloud.google.com.";
    } else if (raw.includes("PERMISSION_DENIED")) {
      error = "Không có quyền truy cập. Đảm bảo dùng auth key (tạo từ AI Studio từ 28/5/2026) và Generative Language API đã được bật.";
    } else if (raw.includes("UNAVAILABLE") || raw.includes("503")) {
      error = "Dịch vụ Gemini tạm thời không khả dụng. Thử lại sau ít phút.";
    } else if (raw.length < 300) {
      // Chỉ chuyển tiếp thông báo ngắn, không chứa key
      error = raw;
    }

    return NextResponse.json({ ok: false, error, ms }, { status: 500 });
  }
}
