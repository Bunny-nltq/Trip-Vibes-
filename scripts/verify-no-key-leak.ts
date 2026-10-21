import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

async function waitPort(url: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return true;
    } catch {
      // chờ server khởi động
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function countMatches(content: string, secret: string): number {
  if (!secret) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = content.indexOf(secret, pos)) !== -1) {
    count++;
    pos += secret.length;
  }
  return count;
}

function getAllFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getAllFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

async function main() {
  console.log("================================================================================");
  console.log("BẰNG CHỨNG THỰC TẾ: QUÉT RÒ RỈ KHÓA (VERIFY NO KEY LEAK)");
  console.log("================================================================================\n");

  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error("Không tìm thấy tệp .env.local");
  }

  const envLines = fs.readFileSync(envPath, "utf-8").split("\n");
  let secretKey = "";
  for (const line of envLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("GEMINI_API_KEY=")) {
      secretKey = trimmed.slice("GEMINI_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
      break;
    }
  }

  if (!secretKey || secretKey.length < 10) {
    throw new Error("Không trích xuất được GEMINI_API_KEY hợp lệ từ .env.local");
  }

  const port = 3009;
  const baseUrl = `http://localhost:${port}`;

  console.log(`🚀 Khởi động next start trên cổng ${port} với VERCEL=1 và nạp biến môi trường thật...`);

  const serverProc = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "start", "-p", String(port)],
    {
      shell: true,
      env: {
        ...process.env,
        VERCEL: "1",
        GEMINI_API_KEY: secretKey,
      },
      stdio: "pipe",
    }
  );

  try {
    const ready = await waitPort(`${baseUrl}/api/health`, 40);
    if (!ready) {
      throw new Error(`Server không phản hồi trên cổng ${port} sau 20s`);
    }

    console.log("✅ Server đã sẵn sàng. Tiến hành kiểm tra grep trên các endpoint và static bundle...\n");

    // 1. Phản hồi /api/health
    const resHealth = await fetch(`${baseUrl}/api/health`);
    const textHealth = await resHealth.text();
    const matchesHealth = countMatches(textHealth, secretKey);

    // 2. Phản hồi /api/data/status
    const resDataStatus = await fetch(`${baseUrl}/api/data/status`);
    const textDataStatus = await resDataStatus.text();
    const matchesDataStatus = countMatches(textDataStatus, secretKey);

    // 3. Phản hồi /api/destination?q=Hà Nội
    const destUrl = `${baseUrl}/api/destination?q=${encodeURIComponent("Hà Nội")}`;
    const resDest = await fetch(destUrl);
    const textDest = await resDest.text();
    const matchesDest = countMatches(textDest, secretKey);

    // 4. Toàn bộ thư mục .next/static
    const staticDir = path.resolve(process.cwd(), ".next/static");
    const staticFiles = getAllFiles(staticDir);
    let matchesStatic = 0;
    for (const f of staticFiles) {
      try {
        const fileContent = fs.readFileSync(f, "utf-8");
        matchesStatic += countMatches(fileContent, secretKey);
      } catch {
        // file binary
      }
    }

    console.log("KẾT QUẢ KHỚP KHÓA (CHỈ IN SỐ KHỚP, KHÔNG IN GIÁ TRỊ KHÓA):");
    console.log(`- Số khớp trong /api/health: ${matchesHealth}`);
    console.log(`- Số khớp trong /api/data/status: ${matchesDataStatus}`);
    console.log(`- Số khớp trong /api/destination?q=Hà Nội: ${matchesDest}`);
    console.log(`- Số khớp trong .next/static (tổng cộng ${staticFiles.length} file JS/CSS trình duyệt): ${matchesStatic}\n`);

    if (
      matchesHealth === 0 &&
      matchesDataStatus === 0 &&
      matchesDest === 0 &&
      matchesStatic === 0
    ) {
      console.log("✅ BẰNG CHỨNG XÁC THỰC: 0 LỖI RÒ RỈ KHÓA! Toàn bộ 4 mục kiểm tra đều có số khớp = 0.");
    } else {
      console.error("❌ PHÁT HIỆN RÒ RỈ KHÓA!");
      process.exitCode = 1;
    }
  } finally {
    if (serverProc.pid) {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(serverProc.pid), "/f", "/t"]);
      } else {
        serverProc.kill("SIGTERM");
      }
    }
  }
}

main().catch((err) => {
  console.error("Lỗi khi chạy xác thực:", err.message);
  process.exit(1);
});
