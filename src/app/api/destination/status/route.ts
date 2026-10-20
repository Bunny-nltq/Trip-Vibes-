import { NextRequest, NextResponse } from "next/server";
import { getDestinationJobStatus } from "@/data/prepareDestination";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const jobId = searchParams.get("jobId")?.trim();

  if (!jobId) {
    return NextResponse.json(
      { ok: false, error: "Thiếu tham số jobId trong query." },
      { status: 400 }
    );
  }

  const job = getDestinationJobStatus(jobId);

  if (!job) {
    return NextResponse.json(
      { ok: false, error: `Không tìm thấy công việc chuẩn bị với mã ${jobId}.` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    jobId: job.id,
    trangThai: job.trangThai,
    tienTrinh: job.tienTrinh,
    lyDoLoi: job.lyDoLoi,
    thieuChiTiet: job.thieuChiTiet,
  });
}
