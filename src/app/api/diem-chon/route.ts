import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { auditSnapshotData } from "@/data/snapshots/snapshotAudit";
import { DiemDenSchema, type DiemDen } from "@/contracts";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Đọc điểm đi từ src/data/reference/diem-di.json
    const refFile = path.resolve(process.cwd(), "src/data/reference/diem-di.json");
    let diemDi: DiemDen[] = [];
    if (fs.existsSync(refFile)) {
      const raw = JSON.parse(fs.readFileSync(refFile, "utf-8"));
      diemDi = (raw.danhSach || []).map((d: any) =>
        DiemDenSchema.parse({
          ...d,
          nguon: "danh_sach_co_dinh",
        })
      );
    }

    // 2. Đọc điểm đến từ các snapshot hợp lệ trong src/data/snapshots
    const snapshotDir = path.resolve(process.cwd(), "src/data/snapshots");
    const diemDen: DiemDen[] = [];

    if (fs.existsSync(snapshotDir)) {
      const files = fs.readdirSync(snapshotDir).filter((f) => f.endsWith(".json"));

      for (const file of files) {
        try {
          const raw = JSON.parse(
            fs.readFileSync(path.join(snapshotDir, file), "utf-8")
          );
          const audit = auditSnapshotData(raw, file);
          if (audit.status !== "HỢP LỆ") {
            continue;
          }

          const places = [
            ...(raw.khachSans || []),
            ...(raw.quanAns || []),
            ...(raw.cafes || []),
            ...(raw.hoatDongs || []),
          ];

          const lat =
            places.length > 0
              ? Number(
                  (
                    places.reduce((s: number, p: any) => s + p.toaDo.lat, 0) /
                    places.length
                  ).toFixed(4)
                )
              : 0;
          const lng =
            places.length > 0
              ? Number(
                  (
                    places.reduce((s: number, p: any) => s + p.toaDo.lng, 0) /
                    places.length
                  ).toFixed(4)
                )
              : 0;

          let quocGia = "Việt Nam";
          let maQuocGia = "VN";
          let tienTe = "VND";
          if (lat > 30) {
            quocGia = "Hàn Quốc";
            maQuocGia = "KR";
            tienTe = "KRW";
          } else if (lng < 101.5 && lat < 16) {
            quocGia = "Thái Lan";
            maQuocGia = "TH";
            tienTe = "THB";
          }

          const ten =
            typeof raw.diemDen === "string"
              ? raw.diemDen
              : raw.diemDen?.ten || file.replace(/\.json$/, "");
          const ngayLay = (raw.ngayTao || raw.createdAt || "2026-10-20").slice(0, 10);

          const parsed = DiemDenSchema.parse({
            ten,
            quocGia,
            maQuocGia,
            toaDo: { lat, lng },
            tienTe,
            nguon: "danh_sach_co_dinh",
            ngayLay,
          });

          diemDen.push(parsed);
        } catch {
          // bỏ qua file lỗi
        }
      }
    }

    return NextResponse.json({
      diemDi,
      diemDen,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Không thể lấy danh sách điểm chọn." },
      { status: 500 }
    );
  }
}
