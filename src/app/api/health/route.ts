import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isVercel = Boolean(
      process.env.VERCEL && process.env.VERCEL !== "0" && process.env.VERCEL !== "false"
    );
    const liveDataEnabled = process.env.LIVE_DATA_ENABLED === "true";
    const liveAiEnabled = process.env.LIVE_AI_ENABLED === "true";

    let mode = "live";
    if (isVercel) {
      mode = liveDataEnabled ? ((process.env.DATA_MODE as string) || "live") : "snapshot";
    } else {
      mode = (process.env.DATA_MODE as string) || "live";
    }

    // Đọc danh sách snapshot có sẵn
    const snapshotDir = path.resolve(process.cwd(), "src/data/snapshots");
    const snapshots: Array<{ ten: string; ngay: string }> = [];

    if (fs.existsSync(snapshotDir)) {
      const files = fs.readdirSync(snapshotDir).filter((f) => f.endsWith(".json"));
      for (const file of files) {
        try {
          const raw = JSON.parse(
            fs.readFileSync(path.join(snapshotDir, file), "utf-8")
          );
          const ten =
            typeof raw.diemDen === "string"
              ? raw.diemDen
              : raw.diemDen?.ten || file.replace(/\.json$/, "");
          const ngayFull = raw.ngayTao || raw.createdAt || raw.ngay || "";
          const ngay = ngayFull ? String(ngayFull).slice(0, 10) : "2026-10-20";

          snapshots.push({ ten, ngay });
        } catch {
          // Bỏ qua nếu có file không đúng định dạng
        }
      }
    }

    // TUYỆT ĐỐI không lộ khóa hay giá trị biến môi trường
    return NextResponse.json({
      mode,
      snapshots,
      liveDataEnabled,
      liveAiEnabled,
    });
  } catch {
    return NextResponse.json(
      { error: "Lỗi kiểm tra trạng thái hệ thống." },
      { status: 500 }
    );
  }
}
