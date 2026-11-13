import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { LoginInputSchema } from "@/contracts";
import { loginUser, createSession, revokeSession, allowAttempt } from "@/data/authStore";
import { apiError, validOrigin, attachSession, requestToken } from "@/app/api/_auth";
export const runtime = "nodejs";
export async function POST(req: Request) {
    if (!validOrigin(req))
        return apiError("Nguồn yêu cầu không hợp lệ.", 403);
    try {
        const raw = await req.json().catch(() => null);
        if (!raw || typeof raw !== "object")
            return apiError("Dữ liệu JSON không hợp lệ.");
        const input = LoginInputSchema.safeParse({ ...raw, name: raw.name ?? raw.ten, password: raw.password ?? raw.matKhau });
        if (!input.success)
            return apiError("Tên/email không hợp lệ hoặc mật khẩu không đáp ứng yêu cầu.");
        const key = crypto.createHash("sha256").update(input.data.email.toLowerCase()).digest("hex");
        if (!allowAttempt("login:" + key) || !allowAttempt("login:global", 100, 60000))
            return apiError("Thử quá nhiều lần. Vui lòng chờ rồi thử lại.", 429);
        const result = loginUser(input.data.email, input.data.password);
        if (!result.ok)
            return apiError(result.error, 401);
        revokeSession(requestToken(req));
        return attachSession(NextResponse.json({ ok: true, thanhCong: true, user: result.user }, { status: 200 }), createSession(result.user.id));
    }
    catch {
        return apiError("Máy chủ chưa thể xử lý yêu cầu. Vui lòng thử lại.", 500);
    }
}
