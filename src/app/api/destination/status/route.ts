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
    if (jobId.startsWith("ready_")) {
      return NextResponse.json({
        ok: true,
        jobId,
        trangThai: "san_sang",
        tienTrinh: {
          khach_san: { trangThai: "xong" },
          quan_an: { trangThai: "xong" },
          cafe: { trangThai: "xong" },
          hoat_dong: { trangThai: "xong" },
          phuong_tien: { trangThai: "xong" },
          gia_diem_den: { trangThai: "xong" },
        },
      });
    }

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
