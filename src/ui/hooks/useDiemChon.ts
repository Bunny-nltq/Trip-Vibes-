"use client";
/**
 * src/ui/hooks/useDiemChon.ts
 *
 * Hook gọi GET /api/diem-chon để lấy danh sách điểm đi và điểm đến.
 * Tuân thủ AGENTS.md: UI chỉ gọi API qua hooks.
 */

import { useState, useEffect } from "react";
import type { DiemDen } from "@/contracts";

export interface DiemChonData {
  diemDi: DiemDen[];
  diemDen: DiemDen[];
}

export function useDiemChon(): {
  data: DiemChonData;
  dangTai: boolean;
  loi: string | null;
} {
  const [data, setData] = useState<DiemChonData>({
    diemDi: [],
    diemDen: [],
  });
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    async function load() {
      try {
        setDangTai(true);
        const res = await fetch("/api/diem-chon");
        if (!res.ok) {
          throw new Error("Không thể tải danh sách điểm chọn");
        }
        const json = await res.json();
        if (!canceled) {
          setData({
            diemDi: json.diemDi || [],
            diemDen: json.diemDen || [],
          });
          setLoi(null);
        }
      } catch (err) {
        if (!canceled) {
          setLoi(err instanceof Error ? err.message : "Lỗi tải điểm chọn");
        }
      } finally {
        if (!canceled) {
          setDangTai(false);
        }
      }
    }

    load();

    return () => {
      canceled = true;
    };
  }, []);

  return { data, dangTai, loi };
}
