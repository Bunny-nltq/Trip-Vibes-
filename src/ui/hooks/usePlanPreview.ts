"use client";
/**
 * src/ui/hooks/usePlanPreview.ts
 *
 * Hook gọi POST /api/plan/preview để xem trước thay đổi kế hoạch.
 * Tuân thủ AGENTS.md:
 * - ui không import trực tiếp ai hoặc data; chỉ gọi API qua hooks.
 * - Tuyệt đối không gọi Gemini.
 */

import { useState, useCallback } from "react";
import type { Plan, TripRequest, Selection } from "@/contracts";
import type { PlanDiff } from "@/core/diffPlan";
import type { Violation } from "./usePlan";

export interface PreviewChangePayload {
  loai: "phuong_tien_di" | "phuong_tien_ve" | "khach_san" | "hoat_dong";
  viTri?: number;
  idMoi: string;
}

export interface PreviewResult {
  planSau: Plan;
  selection: Selection;
  diff: PlanDiff;
  hard: Violation[];
  soft: Violation[];
}

export function usePlanPreview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewResult | null>(null);

  const preview = useCallback(
    async (params: {
      request: TripRequest;
      selection: Selection;
      thayDoi: PreviewChangePayload;
    }): Promise<PreviewResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/plan/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Không thể xem trước thay đổi.");
        }

        const previewRes: PreviewResult = {
          planSau: data.planSau,
          selection: data.selection,
          diff: data.diff,
          hard: data.hard || [],
          soft: data.soft || [],
        };
        setResult(previewRes);
        return previewRes;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    result,
    preview,
    reset,
  };
}
