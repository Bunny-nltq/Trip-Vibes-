/**
 * Giao diện LLM Provider – tách biệt logic AI khỏi implementation cụ thể.
 * Chỉ chạy phía server.
 */
export interface LLMProvider {
  /** Gửi một prompt văn bản đơn và trả về phản hồi dạng chuỗi. */
  generateText(prompt: string): Promise<string>;
  /** Tên model đang dùng (để log hoặc trả về client). */
  readonly modelName: string;
}
