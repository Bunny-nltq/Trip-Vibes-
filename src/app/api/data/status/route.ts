import { NextResponse } from "next/server";
import { LiveDataSource } from "@/data/live/LiveDataSource";

/**
 * GET /api/data/status
 * Trả thông tin về nguồn dữ liệu hiện tại.
 */
export async function GET() {
  try {
    const ds = new LiveDataSource();
    const [khachSans, quanAns, cafes, hoatDongs] = await Promise.all([
      ds.getKhachSans(),
      ds.getQuanAns(),
      ds.getCafes(),
      ds.getHoatDongs(),
    ]);

    return NextResponse.json({
      ok: true,
      mode: ds.getMode(),
      ngayLay: ds.getNgayLay(),
      soKhachSan: khachSans.length,
      soQuanAn: quanAns.length,
      soCafe: cafes.length,
      soHoatDong: hoatDongs.length,
      nguon: "OpenStreetMap Overpass API",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
