import { useState } from "react";
import { NearbyResultSchema, type PlaceSuggestion } from "@/contracts";
export function useCompanion() {
    const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
    const [loading, setLoading] = useState(false), [message, setMessage] = useState("");
    async function search(input: unknown) {
        setLoading(true);
        setSuggestions([]);
        setMessage("");
        try {
            const response = await fetch("/api/nearby", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
            const raw = await response.json();
            if (!response.ok)
                throw new Error(raw.error || "Không thể tìm gợi ý.");
            const result = NearbyResultSchema.parse(raw);
            setSuggestions(result.suggestions);
            setMessage(`${result.method === "ai" ? "AI xếp hạng ứng viên" : "Xếp hạng bằng quy tắc"}. ${result.suggestions.length ? result.note : "Chưa có ứng viên phù hợp trong nguồn dữ liệu. Bạn có thể thêm địa điểm thủ công."}`);
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Không thể tìm gợi ý.");
        }
        finally {
            setLoading(false);
        }
    }
    return { suggestions, loading, message, search };
}
