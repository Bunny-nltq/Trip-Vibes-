"use client";
/**
 * src/ui/hooks/useExpenseConfirm.ts
 *
 * Hook gọi POST /api/expenses/confirm để xác thực khoản chi trước khi lưu sổ.
 * Tuân thủ AGENTS.md: UI chỉ gọi API qua hooks.
 */

import { useState, useCallback } from "react";
import type { Expense, ExpenseCategory } from "@/contracts";

export interface ConfirmExpensePayload {
  id?: string;
  nguon: "anh_bill" | "nhap_tay";
  tenCuaHang: string | null;
  ngay: string | null;
  ngayTrongChuyen: number | null;
  hangMuc: ExpenseCategory;
  soTienVND: number;
  giaTriAIDoc: number | null;
  ghiChu: string | null;
}

export interface ConfirmExpenseResult {
  ok: boolean;
  expense?: Expense;
  loi?: string[];
  error?: string;
}

export function useExpenseConfirm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = useCallback(
    async (payload: ConfirmExpensePayload): Promise<ConfirmExpenseResult> => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/expenses/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data || !data.ok) {
          const errMsg = data?.error || (data?.loi ? data.loi.join(", ") : "Dữ liệu khoản chi không hợp lệ.");
          setError(errMsg);
          return { ok: false, loi: data?.loi, error: errMsg };
        }

        return { ok: true, expense: data.expense };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Lỗi kết nối khi xác nhận khoản chi.";
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
    confirm,
    clearError: () => setError(null),
  };
}
