#!/usr/bin/env tsx
/**
 * scripts/check-env.ts
 * npm run check:env
 *
 * Quét src, scripts, eval (bỏ qua *.test.ts) để đối chiếu biến môi trường đọc trong mã
 * với danh sách khai báo trong .env.example.
 * - THẤT BẠI (exit code 1) nếu mã đọc biến không có trong .env.example (bỏ qua NODE_ENV, VERCEL, NEXT_RUNTIME, PORT, CI).
 * - CẢNH BÁO (không thất bại) nếu .env.example có biến mã không đọc (trừ UNSPLASH_ACCESS_KEY và SITE_URL).
 */

import fs from "node:fs";
import path from "node:path";
import { tenBienTuNoiDung } from "./lib/envScan";

const DIRS_TO_SCAN = ["src", "scripts", "eval"];
const IGNORED_SYSTEM_VARS = new Set(["NODE_ENV", "VERCEL", "NEXT_RUNTIME", "PORT", "CI"]);
const ALLOWED_UNUSED_VARS = new Set(["UNSPLASH_ACCESS_KEY", "SITE_URL"]);

interface VarLocation {
  file: string;
  line: number;
}

function scanDir(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanDir(fullPath));
    } else if (
      entry.isFile() &&
      /\.(ts|tsx|js|jsx|mjs)$/.test(entry.name) &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".test.tsx") &&
      !entry.name.endsWith(".spec.ts") &&
      !entry.name.endsWith(".spec.tsx")
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

export function parseEnvExample(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  const vars: string[] = [];
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)=/);
    if (match) {
      vars.push(match[1]);
    }
  }
  return vars;
}

export function runCheckEnv(): boolean {
  console.log("================================================================================");
  console.log("             KIỂM TRA BIẾN MÔI TRƯỜNG (CHECK:ENV)                               ");
  console.log("================================================================================\n");

  const envExamplePath = path.resolve(process.cwd(), ".env.example");
  const envExampleVars = parseEnvExample(envExamplePath);
  console.log(`Đã đọc ${envExampleVars.length} biến từ .env.example: ${envExampleVars.join(", ")}\n`);

  const codeVarsMap = new Map<string, VarLocation[]>();

  for (const dirName of DIRS_TO_SCAN) {
    const files = scanDir(path.resolve(process.cwd(), dirName));
    for (const file of files) {
      const relPath = path.relative(process.cwd(), file).replace(/\\/g, "/");
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split(/\r?\n/);

      lines.forEach((lineText, idx) => {
        const found = tenBienTuNoiDung(lineText);
        for (const v of found) {
          if (!codeVarsMap.has(v)) {
            codeVarsMap.set(v, []);
          }
          codeVarsMap.get(v)!.push({ file: relPath, line: idx + 1 });
        }
      });
    }
  }

  const codeVars = Array.from(codeVarsMap.keys()).sort();
  console.log(`Đã phát hiện ${codeVars.length} biến process.env trong mã nguồn (src, scripts, eval).\n`);

  // 1. Kiểm tra biến trong mã nhưng thiếu trong .env.example
  const missingInExample: string[] = [];
  for (const v of codeVars) {
    if (IGNORED_SYSTEM_VARS.has(v)) {
      continue;
    }
    if (!envExampleVars.includes(v)) {
      missingInExample.push(v);
    }
  }

  // 2. Kiểm tra biến trong .env.example nhưng mã không đọc
  const unusedInCode: string[] = [];
  for (const v of envExampleVars) {
    if (!codeVarsMap.has(v) && !ALLOWED_UNUSED_VARS.has(v)) {
      unusedInCode.push(v);
    }
  }

  let success = true;

  if (missingInExample.length > 0) {
    console.error(`❌ THẤT BẠI: Phát hiện ${missingInExample.length} biến môi trường được đọc trong mã nhưng THIẾU trong .env.example:`);
    for (const v of missingInExample) {
      const locs = codeVarsMap.get(v) ?? [];
      const firstLoc = locs[0] ? `${locs[0].file}:${locs[0].line}` : "không rõ";
      console.error(`   - ${v} (lần đầu xuất hiện tại ${firstLoc}, tổng ${locs.length} vị trí)`);
    }
    console.error("\nVui lòng bổ sung các biến trên vào .env.example và README.md!\n");
    success = false;
  } else {
    console.log("✅ ĐẠT: Mọi biến môi trường đọc trong mã đều đã có trong .env.example.");
  }

  if (unusedInCode.length > 0) {
    console.warn(`\n⚠️ CẢNH BÁO: Phát hiện ${unusedInCode.length} biến trong .env.example nhưng mã không đọc:`);
    for (const v of unusedInCode) {
      console.warn(`   - ${v}`);
    }
    console.warn("Lưu ý: Không tính các biến cho phép dự phòng (UNSPLASH_ACCESS_KEY, SITE_URL).\n");
  } else {
    console.log("✅ ĐẠT: Không có biến thừa trong .env.example.\n");
  }

  return success;
}

if (process.argv[1] && process.argv[1].includes("check-env")) {
  const passed = runCheckEnv();
  if (!passed) {
    process.exit(1);
  }
}
