/**
 * src/ui/hooks/usePlan.ts
 *
 * Hook gọi POST /api/plan
 * Tuân thủ AGENTS.md:
 * - Không import trực tiếp src/ai hoặc src/data.
 * - Chỉ giao tiếp với backend qua API endpoint /api/plan.
 * - Nhận yêu cầu có cấu trúc từ B1 hoặc dạng text.
 * - Trạng thái: idle | loading | ok | can_lam_ro | khong_the_dat_ngan_sach | khong_co_phuong_an | co_vi_pham | error.
 * - Hỗ trợ timeout 60 giây và nút thử lại (retry).
 */

import { useState, useCallback, useRef } from "react";
import type {
  TripRequest,
  Plan,
  Avoidance,
  Preference,
} from "@/contracts";

export interface Violation {
  code: string;
  chiTiet: string;
}

export type PlanStatus =
  | "idle"
  | "loading"
  | "ok"
  | "can_lam_ro"
  | "khong_the_dat_ngan_sach"
  | "khong_co_phuong_an"
  | "khong_du_du_lieu"
  | "co_vi_pham"
  | "error";

import { getDiemDenTen, type DiemDen } from "@/contracts";

export interface PlanStructuredInput {
  people?: number;
  budget?: number;
  avoids?: string[];
  note?: string;
  preferences?: string[];
  soNgay?: number;
  diemDi?: string | DiemDen | null;
  diemDen?: DiemDen | string | null;
  giaVeTuNhap?: { chieuDiVND: number; chieuVeVND: number };
}

export type PlanInput = PlanStructuredInput | { text: string } | string;

export interface DestinationCandidate {
  ten: string;
  quocGia: string;
  maQuocGia: string;
  toaDo: { lat: number; lng: number };
  tienTe: string;
}

export interface PlanApiResponse {
  ok: boolean;
  status?: PlanStatus;
  request?: TripRequest;
  plan?: Plan;
  hard?: Violation[];
  soft?: Violation[];
  lichSu?: unknown[];
  soVongSua?: number;
  soLanGoiAI?: number;
  ms?: number;
  toiThieuVND?: number;
  dataSourceUsed?: string;
  ngayDuLieu?: string;
  snapshotDate?: string;
  tuoiGioCache?: number;
  lyDo?: string;
  ungVien?: DestinationCandidate[];
  error?: string;
}

const AVOID_MAP: Record<string, Avoidance> = {
  "Không dậy sớm": "khong_day_som",
  "Không đi đêm": "khong_di_dem",
  "Tránh đi lâu": "tranh_di_chuyen_lau",
  "Tránh chỗ đông": "tranh_dong_nguoi",
  "Tránh đi bộ nhiều": "tranh_di_bo_nhieu",
  khong_day_som: "khong_day_som",
  khong_di_dem: "khong_di_dem",
  tranh_di_chuyen_lau: "tranh_di_chuyen_lau",
  tranh_dong_nguoi: "tranh_dong_nguoi",
  tranh_di_bo_nhieu: "tranh_di_bo_nhieu",
};

const PREF_MAP: Record<string, Preference> = {
  Biển: "bien",
  "Ẩm thực": "am_thuc",
  "Hải sản": "hai_san",
  "Văn hóa": "van_hoa_lich_su",
  "Thiên nhiên": "thien_nhien",
  "Vui chơi": "giai_tri_vui_choi",
  "Thư giãn": "thu_gian_spa",
  "Chụp ảnh": "check_in_chup_anh",
  "Mua sắm": "mua_sam",
  bien: "bien",
  am_thuc: "am_thuc",
  hai_san: "hai_san",
  van_hoa_lich_su: "van_hoa_lich_su",
  thien_nhien: "thien_nhien",
  giai_tri_vui_choi: "giai_tri_vui_choi",
  thu_gian_spa: "thu_gian_spa",
  check_in_chup_anh: "check_in_chup_anh",
  mua_sam: "mua_sam",
};

export function usePlan() {
  const [status, setStatus] = useState<PlanStatus>("idle");
  const [result, setResult] = useState<PlanApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<number>(0);

  const lastInputRef = useRef<PlanInput | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus("idle");
    setLoadingStep(0);
  }, []);

  const executePlan = useCallback(async (input: PlanInput) => {
    lastInputRef.current = input;

    // Hủy request trước nếu đang chạy
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus("loading");
    setError(null);
    setLoadingStep(0);

    // Timeout 60 giây
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 60_000);

    // Cập nhật tiến trình hiển thị thật theo thời gian trôi qua trong lúc đợi
    const stepTimer1 = setTimeout(() => setLoadingStep(1), 1500);
    const stepTimer2 = setTimeout(() => setLoadingStep(2), 3500);
    const stepTimer3 = setTimeout(() => setLoadingStep(3), 6000);

    try {
      let bodyPayload: Record<string, unknown>;

      if (typeof input === "string") {
        bodyPayload = { text: input };
      } else if ("text" in input && typeof input.text === "string") {
        bodyPayload = { text: input.text };
      } else {
        // Yêu cầu có cấu trúc từ B1
        const sInput = input as PlanStructuredInput;
        const mappedAvoids: Avoidance[] = (sInput.avoids || [])
          .map((a) => AVOID_MAP[a])
          .filter((a): a is Avoidance => Boolean(a));

        const mappedPrefs: Preference[] = (sInput.preferences || [])
          .map((p) => PREF_MAP[p])
          .filter((p): p is Preference => Boolean(p));

        const tenDiemDen = getDiemDenTen(sInput.diemDen);
        const tenDiemDi = sInput.diemDi
          ? typeof sInput.diemDi === "string"
            ? sInput.diemDi
            : sInput.diemDi.ten
          : "";

        const noteTrimmed = sInput.note?.trim();

        // Nếu người dùng có nhập ghi chú tự do, gửi qua text để AI phân tích toàn diện
        if (noteTrimmed && noteTrimmed.length > 0) {
          const avoidsStr = sInput.avoids?.length
            ? `Tránh: ${sInput.avoids.join(", ")}.`
            : "";
          bodyPayload = {
            text: `Đi ${tenDiemDen || ""} ${sInput.people ?? 2} người, ngân sách ${
              ((sInput.budget ?? 10_000_000) / 1_000_000).toFixed(0)
            } triệu, ${sInput.soNgay ?? 3} ngày từ ${tenDiemDi}. ${avoidsStr} Ghi chú: ${noteTrimmed}`,
          };
        } else {
          // Gửi request có cấu trúc trực tiếp
          const thieuList: ("soNguoi" | "ngansach" | "diemDen" | "soNgay")[] = [];
          if (!sInput.diemDen) thieuList.push("diemDen");
          if (!sInput.people) thieuList.push("soNguoi");
          if (!sInput.budget) thieuList.push("ngansach");
          if (!sInput.soNgay) thieuList.push("soNgay");

          const tripRequest: TripRequest = {
            schemaVersion: 7,
            diemDi: sInput.diemDi || "",
            diemDen: sInput.diemDen || null,
            soNgay: sInput.soNgay ?? 3,
            soNguoi: sInput.people ?? null,
            ngansachTongVND: sInput.budget ?? null,
            sothich: mappedPrefs,
            tranh: mappedAvoids,
            ghiChu: [],
            thieu: thieuList,
            cauHoiLamRo: [],
            canhBao: [],
            giaVeTuNhap: sInput.giaVeTuNhap,
          };
          bodyPayload = { request: tripRequest };
        }
      }

      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      const data: PlanApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        const errorMsg = data.error || `Lỗi máy chủ (${res.status})`;
        setError(errorMsg);
        setStatus("error");
        setResult(data);
        return data;
      }

      const nextStatus: PlanStatus = data.status || "ok";
      setResult(data);
      setStatus(nextStatus);
      return data;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      if (err instanceof Error && err.name === "AbortError") {
        const msg = "Yêu cầu đã quá thời gian chờ (60 giây) hoặc bị hủy.";
        setError(msg);
        setStatus("error");
        return { ok: false, error: msg };
      }

      const msg = err instanceof Error ? err.message : "Lỗi kết nối tới máy chủ.";
      setError(msg);
      setStatus("error");
      return { ok: false, error: msg };
    } finally {
      abortControllerRef.current = null;
    }
  }, []);

  const retry = useCallback(() => {
    if (lastInputRef.current) {
      return executePlan(lastInputRef.current);
    }
  }, [executePlan]);

  return {
    status,
    result,
    error,
    loadingStep,
    executePlan,
    retry,
    abort,
    plan: result?.plan ?? null,
    request: result?.request ?? null,
    hardViolations: result?.hard ?? [],
    softViolations: result?.soft ?? [],
    toiThieuVND: result?.toiThieuVND ?? 0,
    dataSourceUsed: result?.dataSourceUsed ?? "",
    ngayDuLieu: result?.snapshotDate ?? result?.ngayDuLieu,
    tuoiGioCache: result?.tuoiGioCache,
  };
}
