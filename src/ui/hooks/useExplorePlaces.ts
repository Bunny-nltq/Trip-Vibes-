"use client";
import { useEffect, useState } from "react";
import { NearbyResultSchema, type PlaceSuggestion } from "@/contracts";
export function useExplorePlaces(destination: string, kind: "activity" | "restaurant" | "cafe") {
    const [places, setPlaces] = useState<PlaceSuggestion[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError("");
        setPlaces([]);
        fetch("/api/nearby", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destination, kind }), signal: controller.signal }).then(async (response) => { if (!response.ok)
            throw new Error(); return NearbyResultSchema.parse(await response.json()); }).then(result => { setPlaces(result.suggestions); }).catch(() => { if (!controller.signal.aborted)
            setError("Chưa tải được địa điểm. Bạn có thể thử lại bằng cách chọn điểm đến khác."); }).finally(() => { if (!controller.signal.aborted)
            setLoading(false); });
        return () => controller.abort();
    }, [destination, kind]);
    return { places, loading, error };
}
