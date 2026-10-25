import { NextResponse } from "next/server";
import { getUserById } from "@/data/authStore";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = req.headers.get("x-user-id") || url.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ ok: false, thanhCong: false, user: null }, { status: 200 });
  }

  const user = getUserById(userId);
  if (!user) {
    return NextResponse.json({ ok: false, thanhCong: false, user: null }, { status: 200 });
  }

  return NextResponse.json({ ok: true, thanhCong: true, user });
}
