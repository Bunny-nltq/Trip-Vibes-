"use client";
/**
 * src/ui/hooks/useExtractBill.ts
 *
 * Hook gọi POST /api/extract-bill để trích xuất hóa đơn.
 * Tuân thủ AGENTS.md:
 * - UI chỉ gọi API qua hooks.
 * - Ảnh hóa đơn chỉ xử lý in-memory, không lưu đĩa, không ghi log dữ liệu nhạy cảm.
 * - Bắt buộc người dùng xác nhận số tiền trước khi ghi vào sổ chi tiêu.
 */

import { useState, useCallback } from "react";
import type { BillExtraction } from "@/contracts";

export interface ExtractBillResult {
  ok: boolean;
  extraction?: BillExtraction;
  ms?: number;
  error?: string;
  is429?: boolean;
}

export function useExtractBill() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extract = useCallback(async (file: File): Promise<ExtractBillResult> => {
    setLoading(true);
    setError(null);

    // Client-side quick validations
    if (file.size > 5 * 1024 * 1024) {
      const errMsg = "Ảnh vượt quá giới hạn 5MB. Vui lòng chọn ảnh nhẹ hơn.";
      setError(errMsg);
      setLoading(false);
      return { ok: false, error: errMsg };
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      const errMsg = "Chỉ hỗ trợ định dạng JPG, PNG hoặc WEBP.";
      setError(errMsg);
      setLoading(false);
      return { ok: false, error: errMsg };
    }

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/extract-bill", {
        method: "POST",
        body: formData,
      });

      if (res.status === 429) {
        const errMsg = "Đã vượt hạn mức sử dụng AI hôm nay. Bạn hãy nhập tay thông tin hóa đơn nhé.";
        setError(errMsg);
        return { ok: false, error: errMsg, is429: true };
      }

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        const isRateLimit =
          data?.error?.includes("429") ||
          data?.error?.includes("hạn mức") ||
          data?.error?.includes("RESOURCE_EXHAUSTED");
        const errMsg = isRateLimit
          ? "Đã vượt hạn mức sử dụng AI hôm nay. Bạn hãy nhập tay thông tin hóa đơn nhé."
          : data?.error || data?.thongBao || "Lỗi AI không đọc được hóa đơn này. Vui lòng thử lại hoặc nhập tay.";
        setError(errMsg);
        return { ok: false, error: errMsg, is429: Boolean(isRateLimit) };
      }

      return {
        ok: true,
        extraction: data.extraction,
        ms: data.ms,
      };
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Lỗi kết nối khi gửi ảnh hóa đơn.";
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    extract,
    clearError: () => setError(null),
  };
}
