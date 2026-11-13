import { NextResponse } from "next/server";
import { sessionUser, SESSION_SECONDS } from "@/data/authStore";
export const SESSION_COOKIE = "trip_vibes_session";
export function requestToken(req: Request): string {
    return req.headers.get("cookie")?.split(";").map(v => v.trim()).find(v => v.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1) || "";
}
export function requestUser(req: Request) { return sessionUser(requestToken(req)); }
export function validOrigin(req: Request): boolean {
    if (req.headers.get("sec-fetch-site") === "cross-site")
        return false;
    const origin = req.headers.get("origin");
    if (!origin) return true;
    const url = new URL(req.url);
    const host = req.headers.get("host");
    // Next can normalize the request URL to localhost even when the browser uses 127.0.0.1.
    return origin === (host ? `${url.protocol}//${host}` : url.origin);
}
export function apiError(message: string, status = 400) { return NextResponse.json({ ok: false, thanhCong: false, error: message, thongDiep: message }, { status, headers: { "Cache-Control": "no-store" } }); }
export function attachSession(response: NextResponse, token: string) {
    response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_SECONDS });
    response.headers.set("Cache-Control", "no-store");
    return response;
}
