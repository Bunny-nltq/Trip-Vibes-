/**
 * scripts/check-colors.ts
 *
 * Kiểm tra xem trong thư mục src/ui còn mã màu hex hoặc tên font viết cứng không.
 * Quy tắc:
 * - Màu, cỡ chữ, khoảng cách, bo góc chỉ lấy từ biến CSS sinh từ src/design/tokens.json.
 * - Thất bại (exit code 1) nếu còn mã hex (#[0-9a-fA-F]{3,8}) hoặc tên font viết cứng trong src/ui.
 *
 * Sử dụng hàm thuần quetNoiDung từ scripts/lib/quetMau.ts
 */

import fs from "node:fs";
import path from "node:path";
import { quetNoiDung, type ViPhamMau } from "./lib/quetMau";

const UI_DIR = path.resolve(process.cwd(), "src/ui");

function scanDirectory(dir: string): string[] {
  let files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(scanDirectory(fullPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".tsx") ||
        entry.name.endsWith(".ts") ||
        entry.name.endsWith(".jsx") ||
        entry.name.endsWith(".js") ||
        entry.name.endsWith(".css"))
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

export function runCheckColors(): boolean {
  console.log("================================================================================");
  console.log("KIỂM TRA MÃ MÀU VÀ FONT CỨNG TRONG SRC/UI (CHECK:COLORS)");
  console.log("================================================================================\n");

  const files = scanDirectory(UI_DIR);
  const violations: ViPhamMau[] = [];

  for (const file of files) {
    const relPath = path.relative(process.cwd(), file).replace(/\\/g, "/");
    const content = fs.readFileSync(file, "utf-8");
    const fileViolations = quetNoiDung(content, relPath);
    violations.push(...fileViolations);
  }

  if (violations.length > 0) {
    console.warn(`⚠️ Phát hiện ${violations.length} vi phạm mã màu hoặc font viết cứng trong src/ui:`);

    const byFile: Record<string, number> = {};
    for (const v of violations) {
      byFile[v.file] = (byFile[v.file] || 0) + 1;
    }
    console.log("\nThống kê theo tập tin:");
    for (const [f, count] of Object.entries(byFile)) {
      console.log(` - ${f}: ${count} vi phạm`);
    }

    console.log("\n❌ KIỂM TRA THẤT BẠI: Vui lòng thay thế bằng biến CSS từ tokens.json!\n");
    return false;
  }

  console.log("✅ TUYỆT VỜI: src/ui hoàn toàn sạch mã hex và font cứng! Toàn bộ dùng biến CSS từ tokens.\n");
  return true;
}

if (process.argv[1] && process.argv[1].includes("check-colors")) {
  const passed = runCheckColors();
  if (!passed) {
    process.exit(1);
  }
}
