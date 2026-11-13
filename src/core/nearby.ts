import type { PlaceSuggestion } from "@/contracts";
import { khoangCachKm } from "./haversine";
import { NEARBY_MAX_DISTANCE_KM, NEARBY_RESULT_COUNT } from "./assumptions";
export function rankNearby(candidates: PlaceSuggestion[], context: {
    latitude?: number;
    longitude?: number;
    people?: number;
    exclude: string[];
    budget?: number;
    minutes?: number;
    interests: string[];
}) {
    return candidates.filter(c => !context.exclude.includes(c.id) && (!context.minutes || c.duration <= context.minutes) && (c.price === null || context.budget === undefined || c.price * (context.people || 1) <= context.budget))
        .map(c => {
        const distanceKm = context.latitude !== undefined && context.longitude !== undefined ? khoangCachKm({ lat: context.latitude, lng: context.longitude }, { lat: c.latitude, lng: c.longitude }) : null;
        const interest = context.interests.some(i => `${c.name} ${c.kind}`.toLowerCase().includes(i.toLowerCase()));
        return { ...c, distanceKm, reason: `${distanceKm === null ? "Cùng điểm đến" : `Cách khoảng ${distanceKm} km đường thẳng`}${interest ? ", phù hợp sở thích đã chọn" : ""}. ${c.price === null ? "Chưa có giá" : "Giá chỉ là ước tính"}; giờ mở cửa chưa được xác minh cho thời điểm đến.`, score: (interest ? 1 : 0) - (distanceKm || 0) };
    })
        .filter(c => c.distanceKm === null || c.distanceKm <= NEARBY_MAX_DISTANCE_KM).sort((a, b) => b.score - a.score).slice(0, NEARBY_RESULT_COUNT).map(({ score: _, ...c }) => c);
}
