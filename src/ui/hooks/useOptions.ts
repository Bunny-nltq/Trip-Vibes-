"use client";
/**
 * src/ui/hooks/useOptions.ts
 *
 * Hook gọi GET /api/options để lấy danh sách ứng viên (phương tiện, khách sạn, hoạt động).
 * Tuân thủ AGENTS.md:
 * - ui không import trực tiếp ai hoặc data; chỉ gọi API qua hooks.
 * - Không gọi Gemini.
 */

import { useState, useEffect, useCallback } from "react";

export interface TransportOption {
  id: string;
  type: string;
  carrier: string;
  code: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  origin: string;
  destination: string;
  pricePerPerson: number;
  tongTienNhom: number;
  huong: "di" | "ve";
  flags: string[];
  nguon?: string | null;
  ngayLay?: string;
  doTinCay?: string;
  giaLaUocTinh?: boolean;
}

export interface HotelOptionItem {
  id: string;
  ten: string;
  khuVuc: string;
  soSao: number | null;
  giaMotDem: number;
  includesBreakfast: boolean;
  hasPool: boolean;
  nguon?: string | null;
  doTinCay?: string;
  giaLaUocTinh?: boolean;
  praised?: string[];
  watchOut?: string[];
  tip?: string;
}

export interface ActivityOptionItem {
  id: string;
  ten: string;
  khuVuc: string;
  giaVeNguoi: number;
  tongTienNhom: number;
  thoiLuongPhut: number;
  nhan: string[];
  dongNguoi: boolean;
  diBoNhieu: boolean;
  nguon?: string | null;
  doTinCay?: string;
  giaLaUocTinh?: boolean;
}

export type OptionItem = TransportOption | HotelOptionItem | ActivityOptionItem;

export interface UseOptionsParams {
  loai: "phuong_tien" | "khach_san" | "hoat_dong" | "quan_an" | "cafe";
  huong?: "di" | "ve";
  soNguoi?: number;
  /** Điểm đến và điểm đi của kế hoạch đang xem (object DiemDen hoặc tên). Thiếu thì máy chủ không biết lấy dữ liệu của đâu. */
  diemDen?: unknown;
  diemDi?: unknown;
  soNgay?: number;
  enabled?: boolean;
}

/**
 * API /api/options trả phương tiện theo dạng hợp đồng Transport (provider, flags là đối tượng cờ của core),
 * còn màn hình B4 cần carrier, code và flags dạng mảng mã. Chuẩn hoá ở đây để màn hình không bị lỗi.
 */
export function chuanHoaPhuongTien(raw: Record<string, unknown>): TransportOption {
  const co = (raw.flags && !Array.isArray(raw.flags) ? raw.flags : {}) as Record<string, unknown>;
  const flags: string[] = Array.isArray(raw.flags)
    ? (raw.flags as string[])
    : [
        co.diDem ? "XE_DEM" : null,
        co.khoiHanhSom ? "KHOI_HANH_SOM" : null,
        co.denSom ? "DEN_SOM" : null,
        co.diChuyenLau ? "DI_CHUYEN_LAU" : null,
        raw.giaLaUocTinh ? "GIA_UOC_TINH" : null,
      ].filter((x): x is string => x !== null);
  return {
    ...(raw as unknown as TransportOption),
    carrier: String(raw.carrier ?? raw.provider ?? ""),
    code: String(raw.code ?? ""),
    arrivalTime: String(raw.arrivalTime ?? co.gioDen ?? ""),
    flags,
  };
}

function thanhThamSo(v: unknown): string {
  if (v === null || v === undefined) return "";
  return typeof v === "string" ? v : JSON.stringify(v);
}

export function useOptions<T = OptionItem>(params: UseOptionsParams) {
  const { loai, huong, soNguoi = 2, soNgay, enabled = true } = params;
  const diemDenParam = thanhThamSo(params.diemDen);
  const diemDiParam = thanhThamSo(params.diemDi);
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        loai,
        soNguoi: String(soNguoi),
      });
      if (huong) q.set("huong", huong);
      if (diemDenParam) q.set("diemDen", diemDenParam);
      if (diemDiParam) q.set("diemDi", diemDiParam);
      if (soNgay) q.set("soNgay", String(soNgay));

      const res = await fetch(`/api/options?${q.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Không thể tải danh sách lựa chọn.");
      }
      const ds = (data.items as Record<string, unknown>[]) || [];
      setItems((loai === "phuong_tien" ? ds.map(chuanHoaPhuongTien) : ds) as unknown as T[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [loai, huong, soNguoi, soNgay, diemDenParam, diemDiParam, enabled]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ với hệ thống bên ngoài React (URL, sessionStorage, mạng) chỉ làm được sau khi dựng
    fetchOptions();
  }, [fetchOptions]);

  return {
    items,
    loading,
    error,
    refetch: fetchOptions,
  };
}
