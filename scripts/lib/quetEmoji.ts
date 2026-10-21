/**
 * scripts/lib/quetEmoji.ts
 *
 * Hàm thuần phát hiện và đếm emoji trong chuỗi hoặc tệp mã nguồn.
 * Quy tắc dự án: Chỉ icon SVG, không emoji trong giao diện.
 */

// Regex Unicode chuẩn phát hiện ký tự emoji (Extended_Pictographic)
export const EMOJI_REGEX = /\p{Extended_Pictographic}/gu;

/**
 * Đếm số lượng emoji xuất hiện trong một chuỗi văn bản.
 * - "Đã lưu ✅" -> 1
 * - "Đã lưu" -> 0
 * - "Xem ✏️" -> 1
 */
export function demEmoji(chuoi: string): number {
  if (!chuoi) return 0;
  const matches = chuoi.match(EMOJI_REGEX);
  return matches ? matches.length : 0;
}

export interface ViPhamEmoji {
  file: string;
  line: number;
  emojis: string[];
  content: string;
}

/**
 * Quét nội dung văn bản tìm các dòng chứa emoji vi phạm.
 */
export function quetEmojiNoiDung(noiDung: string, tenFile: string): ViPhamEmoji[] {
  const violations: ViPhamEmoji[] = [];
  const lines = noiDung.split(/\r?\n/);

  lines.forEach((lineText, idx) => {
    const trimmed = lineText.trim();
    // Bỏ qua dòng chú thích thuần
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      return;
    }

    const matches = lineText.match(EMOJI_REGEX);
    if (matches && matches.length > 0) {
      violations.push({
        file: tenFile,
        line: idx + 1,
        emojis: matches,
        content: lineText.trim(),
      });
    }
  });

  return violations;
}
