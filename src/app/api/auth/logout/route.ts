import { NextResponse } from "next/server";
import { revokeSession } from "@/data/authStore";
import { requestToken, validOrigin, apiError, SESSION_COOKIE } from "@/app/api/_auth";
export async function POST(req: Request) { if (!validOrigin(req))
    return apiError("Nguồn yêu cầu không hợp lệ.", 403); revokeSession(requestToken(req)); const res = NextResponse.json({ ok: true }); res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0, sameSite: "lax", secure: process.env.NODE_ENV === "production" }); return res; }
