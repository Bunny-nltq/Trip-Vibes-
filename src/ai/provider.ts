/**
 * GeminiProvider – triển khai LLMProvider dùng SDK chính thức @google/genai.
 *
 * Key xác thực: đọc từ GEMINI_API_KEY (auth key, tạo từ AI Studio từ 28/5/2026 trở đi).
 * Xác thực qua header x-goog-api-key (SDK xử lý tự động khi truyền apiKey).
 * CHỈ chạy phía server – không import file này từ client component.
 *
 * @see https://ai.google.dev/gemini-api/docs/api-key
 */
import { GoogleGenAI } from "@google/genai";
import type { LLMProvider, GenerateOptions } from "./LLMProvider";

export class GeminiProvider implements LLMProvider {
  readonly client: GoogleGenAI;
  readonly modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL;

    if (!apiKey) {
      throw new Error(
        "Thiếu biến môi trường GEMINI_API_KEY. " +
          "Hãy tạo auth key tại https://aistudio.google.com/apikey và thêm vào .env.local"
      );
    }
    if (!model) {
      throw new Error(
        "Thiếu biến môi trường GEMINI_MODEL. " +
          "Ví dụ: GEMINI_MODEL=gemini-3-flash-preview"
      );
    }

    this.modelName = model;
    // Đảm bảo dùng GEMINI_API_KEY, tránh bị biến môi trường toàn cục GOOGLE_API_KEY ghi đè
    if (process.env.GOOGLE_API_KEY) {
      delete process.env.GOOGLE_API_KEY;
    }
    // Xác thực bằng auth key (tạo từ AI Studio từ 28/5/2026)
    // SDK tự động dùng header x-goog-api-key khi gọi Gemini API
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const config: Record<string, unknown> = {};

    if (options?.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }
    if (options?.temperature !== undefined) {
      config.temperature = options.temperature;
    }
    if (options?.responseMimeType) {
      config.responseMimeType = options.responseMimeType;
    }
    if (options?.responseSchema) {
      config.responseSchema = options.responseSchema;
    }

    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let timer: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          const err = new Error("qua_thoi_gian: Gemini call timed out after 20000ms");
          err.name = "TimeoutError";
          reject(err);
        }, 20_000);
      });

      try {
        const response = await Promise.race([
          this.client.models.generateContent({
            model: this.modelName,
            contents: prompt,
            config: Object.keys(config).length > 0 ? (config as never) : undefined,
          }),
          timeoutPromise,
        ]);
        const text = response.text;
        if (!text) {
          throw new Error("Gemini trả về phản hồi rỗng.");
        }
        return text;
      } catch (err: unknown) {
        const anyErr = err as { status?: number; message?: string };
        const isTransient =
          anyErr?.status === 503 ||
          anyErr?.status === 429 ||
          (typeof anyErr?.message === "string" &&
            (anyErr.message.includes("503") ||
              anyErr.message.includes("high demand") ||
              anyErr.message.includes("RESOURCE_EXHAUSTED")));

        if (isTransient && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
          continue;
        }
        throw err;
      } finally {
        clearTimeout(timer!);
      }
    }

    throw new Error("Gemini không phản hồi sau các lần thử.");
  }
}
