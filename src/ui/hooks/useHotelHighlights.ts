"use client";
import { useEffect, useState } from "react";
import { HotelPublicDetailsSchema, type HotelPublicDetails } from "@/contracts";
export type HotelHighlight = HotelPublicDetails;
export function useHotelHighlights(destinations: string[]) { const key = destinations.join("|"); const [details, setDetails] = useState<Record<string, HotelHighlight>>({}); useEffect(() => { let active = true; Promise.all(key.split("|").filter(Boolean).map(async (destination) => { try {
    const response = await fetch(`/api/options?${new URLSearchParams({ loai: "khach_san", diemDen: destination })}`);
    if (!response.ok)
        return [];
    const raw = await response.json();
    if (!Array.isArray(raw.items))
        return [];
    return raw.items.flatMap((item: unknown) => { const parsed = HotelPublicDetailsSchema.safeParse(item); return parsed.success ? [parsed.data] : []; });
}
catch {
    return [];
} })).then(results => { if (active)
    setDetails(Object.fromEntries(results.flat().map(item => [item.id, item]))); }); return () => { active = false; }; }, [key]); return details; }
