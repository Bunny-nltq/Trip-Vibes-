"use client";
/**
 * src/ui/hooks/usePlanRegenerate.ts
 *
 * Hook gọi POST /api/plan/regenerate để gợi ý lại hoạt động/lịch trình theo sở thích mới.
 * Tuân thủ AGENTS.md: UI chỉ gọi API qua hooks.
 */

import { useState, useCallback } from "react";
import type { TripRequest, Selection, Plan } from "@/contracts";
import type { PlanDiff } from "@/core/diffPlan";
import type { Violation } from "./usePlan";

export interface PlanRegenerateResult {
  ok: boolean;
  planSau?: Plan;
  selection?: Selection;
  diff?: PlanDiff;
  hard?: Violation[];
  soft?: Violation[];
  diemKhopTruoc?: number;
  diemKhopSau?: number;
  error?: string;
  is429?: boolean;
}

export function usePlanRegenerate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regenerate = useCallback(
    async (params: {
      request: TripRequest;
      selection: Selection;
    }): Promise<PlanRegenerateResult> => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/plan/regenerate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (res.status === 429) {
          const errMsg =
            "Đã đạt giới hạn gợi ý lúc này. Bạn có thể đổi hoạt động thủ công bằng nút \"Đổi\" ở từng mục.";
          setError(errMsg);
          return { ok: false, error: errMsg, is429: true };
        }

        const data = await res.json().catch(() => null);

        if (!res.ok || !data) {
          const isRateLimit =
            data?.error?.includes("429") ||
            data?.message?.includes("429") ||
            data?.error?.includes("Hết lượt");
          const errMsg = isRateLimit
            ? "Đã đạt giới hạn gợi ý lúc này. Bạn có thể đổi hoạt động thủ công bằng nút \"Đổi\" ở từng mục."
            : data?.message ||
              data?.error ||
              "Không thể gợi ý lại lúc này. Bạn có thể đổi hoạt động thủ công bằng nút \"Đổi\".";
          setError(errMsg);
          return { ok: false, error: errMsg, is429: Boolean(isRateLimit) };
        }

        return {
          ok: true,
          planSau: data.planSau,
          selection: data.selection,
          diff: data.diff,
          hard: data.hard || [],
          soft: data.soft || [],
          diemKhopTruoc: data.diemKhopTruoc,
          diemKhopSau: data.diemKhopSau,
        };
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Lỗi kết nối khi gửi yêu cầu gợi ý lại.";
        setError(msg);
        return { ok: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    regenerate,
    clearError: () => setError(null),
  };
}
