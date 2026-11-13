import { NextResponse } from "next/server";
import { NearbyInputSchema, NearbyResultSchema } from "@/contracts";
import { nearbyCandidates } from "@/data/nearbyPlaces";
import { rankNearby } from "@/core/nearby";
import { chooseSuggestions } from "@/ai/rankSuggestions";
import { apiError, validOrigin, requestUser } from "@/app/api/_auth";
import { allowAttempt } from "@/data/authStore";
export async function POST(req: Request) {
    if (!validOrigin(req))
        return apiError("Nguồn yêu cầu không hợp lệ.", 403);
    const parsed = NearbyInputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
        return apiError("Thông tin tìm địa điểm không hợp lệ.");
    if (!allowAttempt("nearby:global", 60, 60000))
        return apiError("Vui lòng thử lại sau.", 429);
    try {
        const user = requestUser(req);
        const interests = user?.profile?.personalize === false ? [] : user?.profile?.interests || parsed.data.interests;
        const ranked = rankNearby(await nearbyCandidates(parsed.data.destination, parsed.data.kind), { ...parsed.data, interests });
        const selected = await chooseSuggestions(ranked, interests);
        return NextResponse.json(NearbyResultSchema.parse({ ok: true, ...selected, note: "Giá/giờ hoạt động theo nguồn được ghi kèm, không phải trạng thái mở cửa trực tiếp. Hãy xác nhận với địa điểm; hệ thống không tự thay lịch trình." }));
    }
    catch {
        return apiError("Chưa thể lấy gợi ý. Bạn vẫn có thể thêm địa điểm thủ công.", 503);
    }
}
