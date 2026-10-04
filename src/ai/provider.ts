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
import type { LLMProvider } from "./LLMProvider";

export class GeminiProvider implements LLMProvider {
  private readonly client: GoogleGenAI;
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
          "Ví dụ: GEMINI_MODEL=gemini-2.0-flash"
      );
    }

    this.modelName = model;
    // Xác thực bằng auth key (tạo từ AI Studio từ 28/5/2026)
    // SDK tự động dùng header x-goog-api-key khi gọi Gemini API
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateText(prompt: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.modelName,
      contents: prompt,
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini trả về phản hồi rỗng.");
    }
    return text;
  }
}
