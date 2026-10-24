import { NextRequest, NextResponse } from "next/server";
import { prepareDestinationJob, getSnapshotDiemDen } from "@/data/prepareDestination";
import { geocodeDestination } from "@/data/live/geocodeClient";
import { DiemDenSchema, type DiemDen } from "@/contracts";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Dữ liệu JSON không hợp lệ." },
        { status: 400 }
      );
    }

    if (!body || !body.diemDen) {
      return NextResponse.json(
        { ok: false, error: "Thiếu thông tin diemDen trong yêu cầu." },
        { status: 400 }
      );
    }

    let resolvedDiemDen: DiemDen | null = null;
    if (typeof body.diemDen === "string") {
      resolvedDiemDen = getSnapshotDiemDen(body.diemDen);
      if (!resolvedDiemDen) {
        const geo = await geocodeDestination(body.diemDen);
        if (geo.status === "thanh_cong") {
          resolvedDiemDen = geo.diemDen;
        }
      }
    } else {
      const parsed = DiemDenSchema.safeParse(body.diemDen);
      if (parsed.success) {
        resolvedDiemDen = parsed.data;
      } else if (body.diemDen && typeof body.diemDen === "object" && body.diemDen.ten) {
        resolvedDiemDen = getSnapshotDiemDen(body.diemDen.ten);
      }
    }

    if (!resolvedDiemDen) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy hoặc không xác định được toạ độ của điểm đến." },
        { status: 400 }
      );
    }

    let resolvedDiemDi: DiemDen | undefined = undefined;
    if (body.diemDi) {
      if (typeof body.diemDi === "string") {
        resolvedDiemDi = getSnapshotDiemDen(body.diemDi) || undefined;
        if (!resolvedDiemDi) {
          const geo = await geocodeDestination(body.diemDi);
          if (geo.status === "thanh_cong") {
            resolvedDiemDi = geo.diemDen;
          }
        }
      } else {
        const parsed = DiemDenSchema.safeParse(body.diemDi);
        if (parsed.success) {
          resolvedDiemDi = parsed.data;
        } else if (body.diemDi && typeof body.diemDi === "object" && body.diemDi.ten) {
          resolvedDiemDi = getSnapshotDiemDen(body.diemDi.ten) || undefined;
        }
      }
    }

    const soNgay: number = Number(body.soNgay) || 3;

    const result = prepareDestinationJob({
      diemDen: resolvedDiemDen,
      diemDi: resolvedDiemDi,
      soNgay,
    });

    if (result.trangThai === "loi") {
      return NextResponse.json(
        {
          ok: false,
          trangThai: "loi",
          maLoi: result.maLoi,
          thongBao: result.thongBao,
        },
        { status: 400 }
      );
    }

    const jobId = result.jobId || `ready_${resolvedDiemDen.maQuocGia || "VN"}_${Date.now()}`;

    return NextResponse.json({
      ok: true,
      trangThai: result.trangThai,
      jobId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
