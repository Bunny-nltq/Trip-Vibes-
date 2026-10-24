"use client";
/**
 * src/ui/hooks/useDestinationPrepare.ts
 *
 * Hook gọi POST /api/destination/prepare và GET /api/destination/status.
 * Tuân thủ AGENTS.md:
 * - ui không import trực tiếp ai hoặc data; chỉ gọi API qua hooks.
 * - Tuyệt đối không gọi Gemini trực tiếp từ client.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { DiemDen } from "@/contracts";

export interface TienTrinhItem {
  trangThai?: "cho" | "dang_chay" | "xong" | "thieu" | "loi" | string;
  soMuc?: number;
  soLuong?: number;
  mayChu?: string;
  ms?: number;
  lyDo?: string;
  thongBao?: string;
}

export interface TienTrinhChuanBi {
  khach_san?: TienTrinhItem;
  quan_an?: TienTrinhItem;
  cafe?: TienTrinhItem;
  hoat_dong?: TienTrinhItem;
  phuong_tien?: TienTrinhItem;
  gia_diem_den?: TienTrinhItem;
  [key: string]: TienTrinhItem | undefined;
}

export interface PrepareError {
  maLoi: string;
  tieuDe: string;
  noiDung: string;
}

export interface DestinationPrepareState {
  trangThai: "chua_chay" | "dang_chuan_bi" | "san_sang" | "loi";
  jobId: string | null;
  tienTrinh: TienTrinhChuanBi;
  loi: PrepareError | null;
}

export function useDestinationPrepare() {
  const [trangThai, setTrangThai] = useState<DestinationPrepareState["trangThai"]>("chua_chay");
  const [jobId, setJobId] = useState<string | null>(null);
  const [tienTrinh, setTienTrinh] = useState<TienTrinhChuanBi>({});
  const [loi, setLoi] = useState<PrepareError | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const cleanPoll = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanPoll();
    };
  }, [cleanPoll]);

  const startPrepare = useCallback(
    async (params: {
      diemDen: DiemDen | string;
      diemDi?: DiemDen | string;
      soNgay?: number;
      onReady?: () => void;
    }) => {
      cleanPoll();
      setLoi(null);
      setTrangThai("dang_chuan_bi");
      startTimeRef.current = Date.now();

      try {
        const res = await fetch("/api/destination/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            diemDen: params.diemDen,
            diemDi: params.diemDi,
            soNgay: params.soNgay ?? 3,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          if (data.maLoi === "khong_co_du_lieu_luu_san") {
            const errObj: PrepareError = {
              maLoi: "khong_co_du_lieu_luu_san",
              tieuDe: "Chưa có dữ liệu lưu sẵn",
              noiDung:
                data.thongBao ||
                "Điểm đến này chưa có dữ liệu đã lưu. Hãy chạy chương trình trên máy để chuẩn bị dữ liệu.",
            };
            setLoi(errObj);
            setTrangThai("loi");
          } else {
            const errObj: PrepareError = {
              maLoi: "loi_khong_ro",
              tieuDe: "Lỗi chuẩn bị dữ liệu",
              noiDung: data.error || "Không thể chuẩn bị dữ liệu cho điểm đến này.",
            };
            setLoi(errObj);
            setTrangThai("loi");
          }
          return;
        }

        if (data.trangThai === "san_sang") {
          setTrangThai("san_sang");
          if (params.onReady) {
            params.onReady();
          }
          return;
        }

        if (data.trangThai === "dang_chay" && data.jobId) {
          const currentJobId = data.jobId;
          setJobId(currentJobId);

          // Bắt đầu poll
          pollTimerRef.current = setInterval(async () => {
            if (Date.now() - startTimeRef.current > 600_000) {
              cleanPoll();
              setLoi({
                maLoi: "loi_khong_ro",
                tieuDe: "Quá thời gian chuẩn bị dữ liệu",
                noiDung: "Quá trình thu thập dữ liệu đã vượt quá 10 phút. Vui lòng thử lại sau.",
              });
              setTrangThai("loi");
              return;
            }

            try {
              const statusRes = await fetch(
                `/api/destination/status?jobId=${encodeURIComponent(currentJobId)}`
              );
              if (!statusRes.ok) return;

              const statusData = await statusRes.json();
              if (statusData.tienTrinh) {
                setTienTrinh(statusData.tienTrinh);
              }

              if (statusData.trangThai === "san_sang") {
                cleanPoll();
                setTrangThai("san_sang");
                if (params.onReady) {
                  params.onReady();
                }
              } else if (statusData.trangThai === "loi") {
                cleanPoll();
                setLoi({
                  maLoi: "loi_chuan_bi",
                  tieuDe: "Lỗi khi thu thập dữ liệu",
                  noiDung: statusData.lyDoLoi || "Không thể hoàn thành việc chuẩn bị dữ liệu.",
                });
                setTrangThai("loi");
              }
            } catch {
              // Bỏ qua lỗi mạng chớp nhoáng khi poll
            }
          }, 2000);
        }
      } catch {
        setLoi({
          maLoi: "mang_loi",
          tieuDe: "Lỗi kết nối mạng",
          noiDung: "Không thể kết nối đến máy chủ để chuẩn bị dữ liệu.",
        });
        setTrangThai("loi");
      }
    },
    [cleanPoll]
  );

  return {
    trangThai,
    jobId,
    tienTrinh,
    loi,
    startPrepare,
    cancel: cleanPoll,
  };
}
