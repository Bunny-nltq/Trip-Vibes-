/**
 * src/ui/hooks/usePlanHistory.ts
 *
 * Hook quản lý lịch sử plan cho Hoàn tác / Làm lại.
 * - Lưu plan hiện tại, quá khứ[], tương lai[].
 * - apply(plan): đẩy plan cũ vào quá khứ, set plan mới, xóa tương lai.
 * - undo(): quay plan cũ, đẩy hiện tại vào tương lai.
 * - redo(): áp dụng plan từ tương lai, đẩy hiện tại vào quá khứ.
 *
 * Tuân thủ AGENTS.md: không import AI hay data.
 */

import { useState, useCallback } from "react";
import type { Plan } from "@/contracts";

export interface PlanHistoryState {
  current: Plan | null;
  past: Plan[];
  future: Plan[];
}

export function usePlanHistory() {
  const [state, setState] = useState<PlanHistoryState>({
    current: null,
    past: [],
    future: [],
  });

  /** Đặt plan ban đầu (không tạo lịch sử) */
  const init = useCallback((plan: Plan) => {
    setState({ current: plan, past: [], future: [] });
  }, []);

  /** Áp dụng plan mới — đẩy plan hiện tại vào quá khứ, xóa tương lai */
  const apply = useCallback((newPlan: Plan) => {
    setState((prev) => {
      if (!prev.current) {
        return { current: newPlan, past: [], future: [] };
      }
      return {
        current: newPlan,
        past: [...prev.past, prev.current],
        future: [],
      };
    });
  }, []);

  /** Hoàn tác — quay lại plan trước, đẩy hiện tại vào tương lai */
  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.past.length === 0 || !prev.current) return prev;
      const newPast = [...prev.past];
      const restored = newPast.pop()!;
      return {
        current: restored,
        past: newPast,
        future: [prev.current, ...prev.future],
      };
    });
  }, []);

  /** Làm lại — áp dụng plan từ tương lai, đẩy hiện tại vào quá khứ */
  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.future.length === 0 || !prev.current) return prev;
      const newFuture = [...prev.future];
      const next = newFuture.shift()!;
      return {
        current: next,
        past: [...prev.past, prev.current],
        future: newFuture,
      };
    });
  }, []);

  return {
    current: state.current,
    past: state.past,
    future: state.future,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    init,
    apply,
    undo,
    redo,
  };
}
