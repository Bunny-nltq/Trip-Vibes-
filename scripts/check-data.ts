/**
 * scripts/check-data.ts
 * Kiểm tra tất cả file JSON mock bằng Zod schema.
 * Chạy: npm run check:data
 */
import path from "path";
import fs from "fs";
import { HotelSchema, TransportSchema, ActivitySchema } from "../src/contracts/index";
import type { ZodTypeAny } from "zod";

const MOCK_DIR = path.join(process.cwd(), "src", "data", "mock");

interface CheckResult {
  file: string;
  schema: string;
  total: number;
  errors: string[];
}

function checkFile<T>(
  filename: string,
  schemaName: string,
  schema: ZodTypeAny
): CheckResult {
  const filePath = path.join(MOCK_DIR, filename);
  const raw: unknown[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const errors: string[] = [];

  raw.forEach((item, idx) => {
    const result = schema.safeParse(item);
    if (!result.success) {
      errors.push(`  [${idx}] ${result.error.message}`);
    }
  });

  return { file: filename, schema: schemaName, total: raw.length, errors };
}

function main() {
  console.log("\n📋 Trip Vibes – Kiểm tra dữ liệu mẫu\n");

  const checks = [
    checkFile("transports.json", "TransportSchema", TransportSchema),
    checkFile("hotels.json", "HotelSchema", HotelSchema),
    checkFile("activities.json", "ActivitySchema", ActivitySchema),
  ];

  const expected: Record<string, number> = {
    "transports.json": 6,
    "hotels.json": 4,
    "activities.json": 6,
  };

  let hasError = false;

  for (const result of checks) {
    const exp = expected[result.file];
    const countOk = result.total === exp;
    const schemaOk = result.errors.length === 0;

    const countSymbol = countOk ? "✅" : "❌";
    const schemaSymbol = schemaOk ? "✅" : "❌";

    console.log(`${result.file} (${result.schema})`);
    console.log(
      `  ${countSymbol} Số mục: ${result.total} (kỳ vọng: ${exp})`
    );
    console.log(`  ${schemaSymbol} Validation: ${schemaOk ? "OK" : "CÓ LỖI"}`);

    if (!countOk || !schemaOk) {
      hasError = true;
      result.errors.forEach((e) => console.log(`  ⚠️  ${e}`));
    }
    console.log();
  }

  if (hasError) {
    console.error("❌ Kiểm tra THẤT BẠI – có lỗi trong dữ liệu mẫu.\n");
    process.exit(1);
  } else {
    console.log("✅ Tất cả kiểm tra THÀNH CÔNG.\n");
    console.log(
      `   Tổng: ${checks.reduce((acc, c) => acc + c.total, 0)} mục đọc được` +
        ` (6 phương tiện [3 đi + 3 về], 4 khách sạn, 6 hoạt động)\n`
    );
  }
}

main();
