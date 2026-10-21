/**
 * scripts/check-contrast.ts
 *
 * Kiểm tra tỷ lệ tương phản màu sắc theo chuẩn WCAG 2.1:
 * - Cặp văn bản (chữ / nền): yêu cầu >= 4.5:1
 * - Viền ô nhập và màu biểu đồ đồ họa: yêu cầu >= 3.0:1
 */

function hexToRgb(hex: string): [number, number, number] {
  const sanitized = hex.replace("#", "").trim();
  if (sanitized.length === 3) {
    const r = parseInt(sanitized[0] + sanitized[0], 16);
    const g = parseInt(sanitized[1] + sanitized[1], 16);
    const b = parseInt(sanitized[2] + sanitized[2], 16);
    return [r, g, b];
  }
  const r = parseInt(sanitized.slice(0, 2), 16);
  const g = parseInt(sanitized.slice(2, 4), 16);
  const b = parseInt(sanitized.slice(4, 6), 16);
  return [r, g, b];
}

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

export function calculateContrastRatio(fgHex: string, bgHex: string): number {
  const l1 = getLuminance(fgHex);
  const l2 = getLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

interface ContrastCheck {
  tenCap: string;
  fg: string;
  bg: string;
  nguong: number;
  loai: "Chữ (>= 4.5:1)" | "UI/Biểu đồ (>= 3:1)";
}

export const CONTRAST_CHECKS: ContrastCheck[] = [
  // 1. Chữ chính trên các nền
  { tenCap: "Chữ chính trên Nền trang", fg: "#1F2A44", bg: "#EEF4FB", nguong: 4.5, loai: "Chữ (>= 4.5:1)" },
  { tenCap: "Chữ chính trên Thẻ trắng", fg: "#1F2A44", bg: "#FFFFFF", nguong: 4.5, loai: "Chữ (>= 4.5:1)" },
  { tenCap: "Chữ chính trên Thẻ phụ", fg: "#1F2A44", bg: "#F6F9FE", nguong: 4.5, loai: "Chữ (>= 4.5:1)" },

  // 2. Chữ phụ trên các nền
  { tenCap: "Chữ phụ trên Nền trang", fg: "#5C6B88", bg: "#EEF4FB", nguong: 4.5, loai: "Chữ (>= 4.5:1)" },
  { tenCap: "Chữ phụ trên Thẻ trắng", fg: "#5C6B88", bg: "#FFFFFF", nguong: 4.5, loai: "Chữ (>= 4.5:1)" },
  { tenCap: "Chữ phụ trên Thẻ phụ", fg: "#5C6B88", bg: "#F6F9FE", nguong: 4.5, loai: "Chữ (>= 4.5:1)" },

  // 3. Chữ trên primary
  { tenCap: "Chữ trên nút Primary", fg: "#FFFFFF", bg: "#2B55D6", nguong: 4.5, loai: "Chữ (>= 4.5:1)" },

  // 4. Trạng thái (chữ / nền)
  { tenCap: "Thành công (chữ / nền)", fg: "#0B7A5C", bg: "#DDF7EE", nguong: 4.5, loai: "Chữ (>= 4.5:1)" },
  { tenCap: "Cảnh báo (chữ / nền)", fg: "#8A5300", bg: "#FFF6E0", nguong: 4.5, loai: "Chữ (>= 4.5:1)" },
  { tenCap: "Nguy hiểm (chữ / nền)", fg: "#C0213D", bg: "#FFEBEE", nguong: 4.5, loai: "Chữ (>= 4.5:1)" },

  // 5. Viền ô nhập (trên nền thẻ trắng)
  { tenCap: "Viền ô nhập trên Thẻ trắng", fg: "#7C93C6", bg: "#FFFFFF", nguong: 3.0, loai: "UI/Biểu đồ (>= 3:1)" },

  // 6. Hạng mục chi tiêu (màu biểu đồ / phân loại trên thẻ trắng)
  { tenCap: "Hạng mục: Di chuyển trên Thẻ trắng", fg: "#2B55D6", bg: "#FFFFFF", nguong: 3.0, loai: "UI/Biểu đồ (>= 3:1)" },
  { tenCap: "Hạng mục: Chỗ ở trên Thẻ trắng", fg: "#0E8FB5", bg: "#FFFFFF", nguong: 3.0, loai: "UI/Biểu đồ (>= 3:1)" },
  { tenCap: "Hạng mục: Ăn uống trên Thẻ trắng", fg: "#C77700", bg: "#FFFFFF", nguong: 3.0, loai: "UI/Biểu đồ (>= 3:1)" },
  { tenCap: "Hạng mục: Vui chơi trên Thẻ trắng", fg: "#1E8E6E", bg: "#FFFFFF", nguong: 3.0, loai: "UI/Biểu đồ (>= 3:1)" },
];

export function runContrastAudit() {
  console.log("================================================================================");
  console.log("KIỂM TRA TƯƠNG PHẢN THIẾT KẾ (WCAG 2.1 CONTRAST AUDIT)");
  console.log("================================================================================\n");

  const results = CONTRAST_CHECKS.map((c) => {
    const ratio = calculateContrastRatio(c.fg, c.bg);
    const passed = ratio >= c.nguong;
    return {
      "Cặp màu": c.tenCap,
      "Màu FG": c.fg,
      "Màu BG": c.bg,
      "Tỷ lệ": `${ratio}:1`,
      "Yêu cầu": `>= ${c.nguong}:1`,
      "Đánh giá": passed ? "✅ ĐẠT" : "❌ KHÔNG ĐẠT",
      passed,
    };
  });

  console.table(
    results.map(({ passed, ...rest }) => rest)
  );

  const allPassed = results.every((r) => r.passed);
  if (!allPassed) {
    console.error("\n❌ Có cặp màu chưa đạt tỷ lệ tương phản yêu cầu!");
    process.exit(1);
  } else {
    console.log("\n✅ Toàn bộ 15/15 cặp màu đạt chuẩn tương phản thiết kế (WCAG 2.1)!\n");
  }
}

if (process.argv[1] && process.argv[1].includes("check-contrast")) {
  runContrastAudit();
}
