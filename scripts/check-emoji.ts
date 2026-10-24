#!/usr/bin/env tsx
/**
 * scripts/check-emoji.ts
 * npm run check:emoji
 *
 * Kiểm tra xem trong thư mục src/ui còn emoji nào không.
 * Quy tắc dự án AGENTS.md: Chỉ icon SVG, không emoji trong giao diện.
 * Thất bại (exit code 1) nếu còn bất kỳ ký tự emoji nào trong src/ui.
 */

import fs from "node:fs";
import path from "node:path";
import { quetEmojiNoiDung, type ViPhamEmoji } from "./lib/quetEmoji";

const UI_DIR = path.resolve(process.cwd(), "src/ui");
const APP_DIR = path.resolve(process.cwd(), "src/app");

function scanDirectory(dir: string): string[] {
  let files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(scanDirectory(fullPath));
    } else if (
      entry.isFile() &&
      /\.(tsx|ts|jsx|js|css)$/.test(entry.name)
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

export function runCheckEmoji(): boolean {
  console.log("================================================================================");
  console.log("             KIỂM TRA EMOJI TRONG GIAO DIỆN (CHECK:EMOJI)                       ");
  console.log("================================================================================\n");

  const uiFiles = scanDirectory(UI_DIR);
  const appFiles = scanDirectory(APP_DIR);

  const violationsUI: ViPhamEmoji[] = [];
  const violationsApp: ViPhamEmoji[] = [];

  for (const file of uiFiles) {
    const relPath = path.relative(process.cwd(), file).replace(/\\/g, "/");
    const content = fs.readFileSync(file, "utf-8");
    const fileViolations = quetEmojiNoiDung(content, relPath);
    violationsUI.push(...fileViolations);
  }

  for (const file of appFiles) {
    const relPath = path.relative(process.cwd(), file).replace(/\\/g, "/");
    const content = fs.readFileSync(file, "utf-8");
    const fileViolations = quetEmojiNoiDung(content, relPath);
    violationsApp.push(...fileViolations);
  }

  console.log("=== KẾT QUẢ QUÉT EMOJI TRONG src/ui ===");
  if (violationsUI.length === 0) {
    console.log("✅ Không có emoji nào trong src/ui. (0 vi phạm)");
  } else {
    console.warn(`⚠️ Phát hiện ${violationsUI.length} emoji vi phạm trong src/ui:`);
    for (const v of violationsUI) {
      console.warn(` - ${v.file}:${v.line}: [${v.emojis.join(", ")}] -> ${v.content}`);
    }
  }

  console.log("\n=== KẾT QUẢ QUÉT EMOJI TRONG src/app ===");
  if (violationsApp.length === 0) {
    console.log("✅ Không có emoji nào trong src/app. (0 vi phạm)");
  } else {
    console.warn(`⚠️ Phát hiện ${violationsApp.length} emoji vi phạm trong src/app:`);
    for (const v of violationsApp) {
      console.warn(` - ${v.file}:${v.line}: [${v.emojis.join(", ")}] -> ${v.content}`);
    }
  }

  if (violationsUI.length > 0) {
    console.error("\n❌ KIỂM TRA THẤT BẠI: Vui lòng thay thế emoji trong src/ui bằng icon SVG!\n");
    return false;
  }

  console.log("\n✅ ĐẠT: Toàn bộ src/ui sạch emoji, chỉ sử dụng icon SVG theo AGENTS.md!\n");
  return true;
}

if (process.argv[1] && process.argv[1].includes("check-emoji")) {
  const passed = runCheckEmoji();
  if (!passed) {
    process.exit(1);
  }
}
