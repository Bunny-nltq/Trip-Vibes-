import { NextRequest, NextResponse } from "next/server";
import { prepareDestinationJob } from "@/data/prepareDestination";
import type { DiemDen } from "@/contracts";

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

    const diemDen: DiemDen = body.diemDen;
    const diemDi: DiemDen | undefined = body.diemDi;
    const soNgay: number = Number(body.soNgay) || 3;

    const result = prepareDestinationJob({
      diemDen,
      diemDi,
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

    return NextResponse.json({
      ok: true,
      trangThai: result.trangThai,
      jobId: result.jobId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
