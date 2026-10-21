// scripts/lib/envScan.ts
// Hàm thuần quét và bóc tách các tên biến môi trường từ chuỗi mã nguồn.
// Hỗ trợ các cú pháp: process.env.TEN hoặc process.env['TEN']
// Bỏ qua dòng chú thích bắt đầu bằng //

export function tenBienTuNoiDung(noiDung: string): string[] {
  if (!noiDung) return [];
  const lines = noiDung.split(/\r?\n/);
  const regex = /\bprocess\.env(?:\.([a-zA-Z_][a-zA-Z0-9_]*)|\[['"]([a-zA-Z_][a-zA-Z0-9_]*)['"]\])/g;
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//")) {
      continue;
    }

    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
      const varName = match[1] ?? match[2];
      if (varName && !result.includes(varName)) {
        result.push(varName);
      }
    }
  }

  return result;
}
