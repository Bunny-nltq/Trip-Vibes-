import { NextResponse } from "next/server";
import { TripWriteSchema, TripUpdateSchema } from "@/contracts";
import { getUserTrips, saveUserTrip, deleteUserTrip, updateUserTrip, TripConflict } from "@/data/authStore";
import { recalculatePlan, validateWorkspace } from "@/core/tripWorkspace";
import { getUserTrip } from "@/data/authStore";
import { requestUser, validOrigin, apiError } from "@/app/api/_auth";
export const runtime = "nodejs";
export async function GET(req: Request) { const user = requestUser(req); if (!user)
    return apiError("Vui lòng đăng nhập để xem nhật ký.", 401); return NextResponse.json({ ok: true, thanhCong: true, trips: getUserTrips(user.id) }, { headers: { "Cache-Control": "no-store" } }); }
export async function POST(req: Request) { if (!validOrigin(req))
    return apiError("Nguồn yêu cầu không hợp lệ.", 403); const user = requestUser(req); if (!user)
    return apiError("Vui lòng đăng nhập.", 401); try {
    const raw = await req.json().catch(() => null);
    const parsed = TripWriteSchema.safeParse(raw?.trip ?? raw);
    if (!parsed.success)
        return apiError("Dữ liệu kế hoạch hoặc chi tiêu không hợp lệ.");
    if (!validateWorkspace(parsed.data.plan, parsed.data.ledger))
        return apiError("Ngày lịch trình/chi tiêu nằm ngoài chuyến đi.");
    const trip = saveUserTrip({ ...parsed.data, plan: recalculatePlan(parsed.data.plan, parsed.data.plan.items), userId: user.id });
    return NextResponse.json({ ok: true, thanhCong: true, trip }, { status: 201 });
}
catch {
    return apiError("Không thể lưu chuyến đi.", 500);
} }
export async function PUT(req: Request) { if (!validOrigin(req))
    return apiError("Nguồn yêu cầu không hợp lệ.", 403); const user = requestUser(req); if (!user)
    return apiError("Vui lòng đăng nhập.", 401); try {
    const parsed = TripUpdateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
        return apiError("Dữ liệu cập nhật không hợp lệ; cần phiên bản chuyến đi.");
    const { id, version, ...updates } = parsed.data;
    const current = getUserTrip(user.id, id);
    if (!current)
        return apiError("Không tìm thấy chuyến đi.", 404);
    const nextPlan = updates.plan || current.plan;
    if (!validateWorkspace(nextPlan, updates.ledger || current.ledger))
        return apiError("Ngày lịch trình/chi tiêu nằm ngoài chuyến đi.");
    if (updates.plan)
        updates.plan = recalculatePlan(nextPlan, nextPlan.items);
    const trip = updateUserTrip(user.id, id, updates, version);
    if (!trip)
        return apiError("Không tìm thấy chuyến đi.", 404);
    return NextResponse.json({ ok: true, thanhCong: true, trip });
}
catch (error) {
    return apiError(error instanceof TripConflict ? error.message : "Không thể cập nhật chuyến đi.", error instanceof TripConflict ? 409 : 500);
} }
export async function DELETE(req: Request) { if (!validOrigin(req))
    return apiError("Nguồn yêu cầu không hợp lệ.", 403); const user = requestUser(req); if (!user)
    return apiError("Vui lòng đăng nhập.", 401); const id = new URL(req.url).searchParams.get("id"); if (!id)
    return apiError("Thiếu mã chuyến đi."); return deleteUserTrip(user.id, id) ? NextResponse.json({ ok: true, thanhCong: true }) : apiError("Không tìm thấy chuyến đi.", 404); }
