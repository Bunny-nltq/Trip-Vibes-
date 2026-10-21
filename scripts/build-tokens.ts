#!/usr/bin/env tsx
/**
 * scripts/build-tokens.ts
 * npm run build:tokens
 *
 * Tự động sinh file CSS biến giao diện src/app/tokens.css từ src/design/tokens.json.
 * Bỏ hoàn toàn phần chép tay mã màu vào globals.css.
 */

import fs from "node:fs";
import path from "node:path";

export function sinhCSSTuTokens(tokens: any): string {
  const lines: string[] = [
    "/* ========================================================================== */",
    "/* File này được sinh tự động từ src/design/tokens.json qua npm run build:tokens. */",
    "/* TUYỆT ĐỐI không chỉnh sửa thủ công tệp này.                              */",
    "/* ========================================================================== */",
    "",
    ":root {",
  ];

  // Primary
  const pMain = tokens.colors?.primary?.main || tokens.colors?.primary || "#2B55D6";
  const pText = tokens.colors?.primary?.text || "#FFFFFF";
  const pTint = tokens.colors?.primary?.tint || "#EAF1FE";
  const p400 = tokens.colors?.primary?.["400"] || "#4A72E8";
  const pHover = tokens.colors?.primary?.brandHover || "#2244B0";

  // Core backgrounds & surfaces
  const bg = tokens.colors?.background || "#EEF4FB";
  const surface = tokens.colors?.surface || "#FFFFFF";
  const surfaceSub = tokens.colors?.surfaceSub || "#F6F9FE";
  const text = tokens.colors?.text || "#1F2A44";
  const textSub = tokens.colors?.textSub || "#5C6B88";
  const border = tokens.colors?.border || "#DCE6F5";
  const borderInput = tokens.colors?.borderInput || "#7C93C6";

  lines.push("  /* Thiết kế Xanh Trời Bước 21 */");
  lines.push(`  --color-bg: ${bg};`);
  lines.push(`  --color-background: ${bg};`);
  lines.push(`  --color-surface: ${surface};`);
  lines.push(`  --color-surface-sub: ${surfaceSub};`);
  lines.push(`  --color-card: ${surface};`);
  lines.push(`  --color-card-sub: ${surfaceSub};`);
  lines.push(`  --color-text: ${text};`);
  lines.push(`  --color-text-sub: ${textSub};`);
  lines.push(`  --color-navy-text: ${text};`);
  lines.push(`  --color-sub-text: ${textSub};`);
  lines.push(`  --color-body-text: ${text};`);
  lines.push(`  --color-muted-text: ${textSub};`);
  lines.push(`  --color-light-muted: ${borderInput};`);
  lines.push("");

  lines.push(`  --color-primary: ${pMain};`);
  lines.push(`  --color-primary-main: ${pMain};`);
  lines.push(`  --color-primary-brand: ${pMain};`);
  lines.push(`  --color-primary-hover: ${pHover};`);
  lines.push(`  --color-primary-text: ${pText};`);
  lines.push(`  --color-primary-tint: ${pTint};`);
  lines.push(`  --color-primary-light: ${pTint};`);
  lines.push(`  --color-primary-soft: ${bg};`);
  lines.push(`  --color-primary-active: ${pTint};`);
  lines.push("");

  lines.push(`  --color-border: ${border};`);
  lines.push(`  --color-border-light: ${border};`);
  lines.push(`  --color-border-blue: ${border};`);
  lines.push(`  --color-border-card: ${border};`);
  lines.push(`  --color-border-preset: ${borderInput};`);
  lines.push(`  --color-border-input: ${borderInput};`);
  lines.push("");

  // Status
  const st = tokens.colors?.status || {};
  lines.push(`  --color-success: ${st.success || "#0B7A5C"};`);
  lines.push(`  --color-success-text: ${st.successText || "#0B7A5C"};`);
  lines.push(`  --color-success-bg: ${st.successBg || "#DDF7EE"};`);
  lines.push("");
  lines.push(`  --color-warning: ${st.warning || "#8A5300"};`);
  lines.push(`  --color-warning-text: ${st.warnText || "#8A5300"};`);
  lines.push(`  --color-warning-bg: ${st.warnBg || "#FFF6E0"};`);
  lines.push("");
  lines.push(`  --color-error: ${st.error || "#C0213D"};`);
  lines.push(`  --color-error-text: ${st.errText || "#C0213D"};`);
  lines.push(`  --color-error-bg: ${st.errBg || "#FFEBEE"};`);
  lines.push(`  --color-badge-red: ${st.badgeRed || "#C0213D"};`);
  lines.push("");
  lines.push(`  --color-info: ${st.info || pMain};`);
  lines.push(`  --color-track-bg: ${tokens.colors?.neutral?.trackBg || pTint};`);
  lines.push("");

  // Hạng mục chi tiêu
  const hm = tokens.colors?.hangMuc || {};
  lines.push("  /* Hạng mục chi tiêu */");
  lines.push(`  --color-category-move: ${hm.diChuyen || pMain};`);
  lines.push(`  --color-category-stay: ${hm.choO || "#0E8FB5"};`);
  lines.push(`  --color-category-food: ${hm.anUong || "#C77700"};`);
  lines.push(`  --color-category-fun: ${hm.vuiChoi || "#1E8E6E"};`);
  lines.push("");

  // Art & Banner tokens
  const art = tokens.colors?.art || {};
  lines.push("  /* Minh họa & SVG */");
  Object.entries(art).forEach(([key, val]) => {
    const kebab = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    lines.push(`  --color-art-${kebab}: ${val};`);
  });

  const banner = tokens.colors?.banner || {};
  Object.entries(banner).forEach(([key, val]) => {
    const kebab = key.replace(/([A-Z0-9])/g, "-$1").toLowerCase();
    lines.push(`  --color-art-${kebab}: ${val};`);
  });

  // Avatar & Google brand aliases
  lines.push(`  --color-avatar-bg1: ${art.avatar1 || "#FFD6A5"};`);
  lines.push(`  --color-avatar-bg2: ${art.avatar2 || "#F4A0A0"};`);
  lines.push(`  --color-avatar-text: ${art.avatarText || "#6B3A2A"};`);
  lines.push(`  --color-google-blue: ${art.googleBlue || "#4285F4"};`);
  lines.push(`  --color-google-green: ${art.googleGreen || "#34A853"};`);
  lines.push(`  --color-google-yellow: ${art.googleYellow || "#FBBC05"};`);
  lines.push(`  --color-google-red: ${art.googleRed || "#EA4335"};`);

  lines.push("");
  lines.push("  /* Fonts */");
  lines.push("  --font-sans: var(--font-sans), 'Be Vietnam Pro', -apple-system, sans-serif;");
  lines.push("  --font-script: var(--font-script), 'Dancing Script', cursive;");
  lines.push("");
  lines.push("  /* Aliases cho các class cũ */");
  lines.push(`  --p500: var(--color-primary);`);
  lines.push(`  --p400: ${p400};`);
  lines.push(`  --p300: ${borderInput};`);
  lines.push(`  --p100: var(--color-primary-tint);`);
  lines.push(`  --s500: var(--color-category-stay);`);
  lines.push(`  --s400: ${tokens.colors?.secondary?.["400"] || "#2FA7B5"};`);
  lines.push(`  --s100: var(--color-primary-tint);`);
  lines.push(`  --navy: var(--color-text);`);
  lines.push(`  --g700: var(--color-text);`);
  lines.push(`  --g500: var(--color-text-sub);`);
  lines.push(`  --g400: ${borderInput};`);
  lines.push(`  --g300: ${border};`);
  lines.push(`  --g100: ${surfaceSub};`);
  lines.push(`  --g50: ${bg};`);
  lines.push(`  --border: ${border};`);
  lines.push(`  --bg: ${bg};`);
  lines.push(`  --surface: ${surface};`);
  lines.push(`  --white: ${surface};`);
  lines.push("");
  lines.push("  /* Radius */");
  lines.push(`  --r-sm: ${tokens.radius?.sm || "6px"};`);
  lines.push(`  --r-md: ${tokens.radius?.md || "10px"};`);
  lines.push(`  --r-lg: ${tokens.radius?.lg || "14px"};`);
  lines.push(`  --r-xl: ${tokens.radius?.xl || "18px"};`);
  lines.push(`  --r-full: 9999px;`);
  lines.push("}");
  lines.push("");

  return lines.join("\n");
}

export function buildTokensFile(): string {
  const tokensPath = path.resolve(process.cwd(), "src/design/tokens.json");
  const targetCssPath = path.resolve(process.cwd(), "src/app/tokens.css");

  const rawTokens = JSON.parse(fs.readFileSync(tokensPath, "utf-8"));
  const cssContent = sinhCSSTuTokens(rawTokens);

  fs.writeFileSync(targetCssPath, cssContent, "utf-8");
  console.log(`✅ Đã sinh thành công CSS tokens tại: ${targetCssPath}`);
  return targetCssPath;
}

if (process.argv[1] && process.argv[1].includes("build-tokens")) {
  buildTokensFile();
}
