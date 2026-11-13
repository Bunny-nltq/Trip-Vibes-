import { NextResponse } from "next/server";
import { requestUser } from "@/app/api/_auth";
export async function GET(req: Request) { const user = requestUser(req); return NextResponse.json({ ok: !!user, thanhCong: !!user, user }, { headers: { "Cache-Control": "no-store" } }); }
