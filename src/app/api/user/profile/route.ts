import { NextResponse } from "next/server";
import { ProfileInputSchema } from "@/contracts";
import { updateProfile } from "@/data/authStore";
import { requestUser, validOrigin, apiError } from "@/app/api/_auth";
export async function PUT(req: Request) { if (!validOrigin(req))
    return apiError("Nguồn yêu cầu không hợp lệ.", 403); const user = requestUser(req); if (!user)
    return apiError("Vui lòng đăng nhập.", 401); const input = ProfileInputSchema.safeParse(await req.json().catch(() => null)); if (!input.success)
    return apiError("Thông tin hồ sơ không hợp lệ."); if (input.data.birthDate) {
    const d = new Date(input.data.birthDate);
    if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== input.data.birthDate || d > new Date())
        return apiError("Ngày sinh không hợp lệ.");
} return NextResponse.json({ ok: true, user: updateProfile(user.id, input.data) }, { headers: { "Cache-Control": "no-store" } }); }
