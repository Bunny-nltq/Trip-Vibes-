import { NextRequest, NextResponse } from "next/server";
import { geocodeDestination } from "@/data/live/geocodeClient";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json(
      { error: "Tham số tìm kiếm q không được để trống" },
      { status: 400 }
    );
  }

  try {
    const result = await geocodeDestination(q);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
