import { useState, useEffect } from "react";
import { PlanSchema, type Plan } from "@/contracts";
export function useTemplatePlan(slug: string | null) {
    const [plan, setPlan] = useState<Plan | null>(null), [loading, setLoading] = useState(!!slug), [error, setError] = useState("");
    useEffect(() => {
        if (!slug) {
            setPlan(null);
            setLoading(false);
            setError("");
            return;
        }
        let live = true;
        setLoading(true);
        setError("");
        fetch(`/api/templates/${encodeURIComponent(slug)}`).then(async (res) => { const data = await res.json(); if (!res.ok)
            throw new Error(data.error); const parsed = PlanSchema.parse(data.plan); if (live)
            setPlan(parsed); }).catch(() => { if (live)
            setError("Không thể tải mẫu. Vui lòng thử lại hoặc tạo lịch trình riêng."); }).finally(() => { if (live)
            setLoading(false); });
        return () => { live = false; };
    }, [slug]);
    return { plan, loading, error };
}
