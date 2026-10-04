/**
 * Tuỳ chọn sinh nội dung cho LLM Provider
 */
export interface GenerateOptions {
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: unknown;
}

/**
 * Giao diện LLM Provider – tách biệt logic AI khỏi implementation cụ thể.
 * Chỉ chạy phía server.
 */
export interface LLMProvider {
  /** Gửi một prompt văn bản và trả về phản hồi dạng chuỗi. */
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  /** Tên model đang dùng (để log hoặc trả về client). */
  readonly modelName: string;
}
