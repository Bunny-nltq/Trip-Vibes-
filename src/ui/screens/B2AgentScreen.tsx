"use client";
import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/ui/context/AppContext";
import { getDiemDenTen, type DiemDen } from "@/contracts";
import { layThongBaoLoi, type ThongBaoLoi } from "@/ui/messages/loi";
import { useTrangThaiAI } from "@/ui/hooks/useTrangThaiAI";
import type { CategoryKey, CategoryProgress } from "@/data/prepareDestination";
import {
  Sparkles,
  Check,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Hotel,
  Utensils,
  Coffee,
  Compass,
  Bus,
  Tag,
  RefreshCw,
  ArrowLeft,
  X,
} from "lucide-react";

const AI_STEPS = [
  { label: "Tìm phương tiện", sub: "Đang chọn phương tiện chiều đi và chiều về..." },
  { label: "Tìm khách sạn", sub: "Đang tìm chỗ ở phù hợp khu vực và ngân sách..." },
  { label: "Gợi ý hoạt động và ẩm thực", sub: "Đang chọn hoạt động, quán ăn trưa, tối và cafe..." },
  { label: "Kiểm tra và tính chi phí", sub: "Hệ thống code core kiểm tra ràng buộc cứng và tự sửa nếu vượt ngân sách..." },
];

const CATEGORY_META: Record<
  CategoryKey,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  khach_san: { label: "Khách sạn & chỗ ở", icon: Hotel },
  quan_an: { label: "Quán ăn địa phương", icon: Utensils },
  cafe: { label: "Quán cà phê", icon: Coffee },
  hoat_dong: { label: "Điểm tham quan & trải nghiệm", icon: Compass },
  phuong_tien: { label: "Phương tiện di chuyển", icon: Bus },
  gia_diem_den: { label: "Giá cả điểm đến", icon: Tag },
};

const fmt = (n: number) => {
  if (n >= 1_000_000) {
    const tr = n / 1_000_000;
    return Number.isInteger(tr) ? `${tr} triệu` : `${tr.toFixed(1)} triệu`;
  }
  return `${n.toLocaleString("vi-VN")} đ`;
};

export function B2AgentScreen() {
  const {
    nav,
    tripConfig,
    planStatus,
    planRequest,
    planError,
    planResult,
    loadingStep,
    executePlan,
    retryPlan,
    abortPlan,
  } = useApp();
  const { aiBat } = useTrangThaiAI();

  // Pha thực thi: "chuan_bi" (Bước A) | "lap_ke_hoach" (Bước B)
  const [phase, setPhase] = useState<"chuan_bi" | "lap_ke_hoach">("chuan_bi");
  const [jobId, setJobId] = useState<string | null>(null);

  // Tiến trình từng hạng mục Bước A
  const [tienTrinh, setTienTrinh] = useState<Record<CategoryKey, CategoryProgress>>({
    khach_san: { trangThai: "cho" },
    quan_an: { trangThai: "cho" },
    cafe: { trangThai: "cho" },
    hoat_dong: { trangThai: "cho" },
    phuong_tien: { trangThai: "cho" },
    gia_diem_den: { trangThai: "cho" },
  });

  const [dataPrepError, setDataPrepError] = useState<{
    maLoi: string;
    tieuDe: string;
    noiDung: string;
    thieuChiTiet?: string[];
  } | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const hasExecutedPlanRef = useRef(false);

  const diemDen = tripConfig.diemDen as DiemDen | null;
  const tenDiemDen = diemDen ? getDiemDenTen(diemDen) : "Điểm đến";
  const diemDi = tripConfig.diemDi as DiemDen | null;
  const tenDiemDi = diemDi ? (typeof diemDi === "string" ? diemDi : diemDi.ten) : "";

  // 1. Kích hoạt Bước A: Gọi /api/destination/prepare
  const startPrepare = async () => {
    if (!diemDen) {
      nav("b1-chon-nhanh");
      return;
    }

    setDataPrepError(null);
    startTimeRef.current = Date.now();

    try {
      const res = await fetch("/api/destination/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diemDen,
          diemDi: diemDi ?? undefined,
          soNgay: tripConfig.soNgay ?? 3,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (data.maLoi === "khong_co_du_lieu_luu_san") {
          setDataPrepError({
            maLoi: "khong_co_du_lieu_luu_san",
            tieuDe: "Chưa có dữ liệu lưu sẵn",
            noiDung:
              data.thongBao ||
              "Điểm đến này chưa có dữ liệu đã lưu. Hãy chạy chương trình trên máy để chuẩn bị dữ liệu.",
          });
        } else {
          setDataPrepError({
            maLoi: "loi_khong_ro",
            tieuDe: "Lỗi chuẩn bị dữ liệu",
            noiDung: data.error || "Không thể chuẩn bị dữ liệu cho điểm đến này.",
          });
        }
        return;
      }

      if (data.trangThai === "san_sang") {
        // Dữ liệu đã sẵn sàng ngay (từ snapshot hoặc cache) -> Chuyển sang Bước B Lập kế hoạch
        setPhase("lap_ke_hoach");
        if (!hasExecutedPlanRef.current) {
          hasExecutedPlanRef.current = true;
          executePlan();
        }
      } else if (data.trangThai === "dang_chay" && data.jobId) {
        setJobId(data.jobId);
      }
    } catch {
      setDataPrepError({
        maLoi: "mang_loi",
        tieuDe: "Lỗi kết nối mạng",
        noiDung: "Không thể kết nối đến máy chủ để chuẩn bị dữ liệu.",
      });
    }
  };

  useEffect(() => {
    startPrepare();

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  // 2. Poll trạng thái mỗi 2 giây nếu đang chạy công việc chuẩn bị
  useEffect(() => {
    if (!jobId || phase !== "chuan_bi") return;

    const pollStatus = async () => {
      // Giới hạn tối đa 10 phút (600,000 ms)
      if (Date.now() - startTimeRef.current > 600_000) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setDataPrepError({
          maLoi: "loi_khong_ro",
          tieuDe: "Quá thời gian chuẩn bị dữ liệu",
          noiDung: "Quá trình thu thập dữ liệu đã vượt quá 10 phút. Vui lòng thử lại sau.",
        });
        return;
      }

      try {
        const res = await fetch(`/api/destination/status?jobId=${encodeURIComponent(jobId)}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.tienTrinh) {
          setTienTrinh(data.tienTrinh);
        }

        if (data.trangThai === "san_sang") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setPhase("lap_ke_hoach");
          if (!hasExecutedPlanRef.current) {
            hasExecutedPlanRef.current = true;
            executePlan();
          }
        } else if (data.trangThai === "thieu") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setDataPrepError({
            maLoi: "khong_du_du_lieu",
            tieuDe: "Thiếu dữ liệu điểm đến",
            noiDung: `Hệ thống chưa đủ dữ liệu cho ${tenDiemDen}: ${
              data.thieuChiTiet ? data.thieuChiTiet.join(", ") : data.lyDoLoi || "một số hạng mục bị thiếu"
            }.`,
            thieuChiTiet: data.thieuChiTiet,
          });
        } else if (data.trangThai === "loi") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setDataPrepError({
            maLoi: "loi_khong_ro",
            tieuDe: "Gặp sự cố chuẩn bị dữ liệu",
            noiDung: data.lyDoLoi || "Đã xảy ra lỗi khi thu thập dữ liệu điểm đến.",
          });
        }
      } catch {
        // Bỏ qua lỗi mạng chập chờn khi polling
      }
    };

    pollTimerRef.current = setInterval(pollStatus, 2000);
    pollStatus(); // Chạy ngay lần đầu

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [jobId, phase, tenDiemDen, executePlan]);

  // 3. Tự động chuyển trang khi Bước B hoàn tất
  useEffect(() => {
    if (phase === "lap_ke_hoach") {
      if (planStatus === "ok" || planStatus === "co_vi_pham") {
        const timer = setTimeout(() => {
          nav("b3-ke-hoach");
        }, 500);
        return () => clearTimeout(timer);
      } else if (
        planStatus === "can_lam_ro" ||
        planStatus === "khong_the_dat_ngan_sach" ||
        planStatus === "khong_co_phuong_an"
      ) {
        nav("b1-chon-nhanh");
      }
    }
  }, [phase, planStatus, nav]);

  const handleCancel = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    abortPlan();
    nav("b1-chon-nhanh");
  };

  // Tính phần trăm tiến trình Bước B
  const pct =
    planStatus === "ok" || planStatus === "co_vi_pham"
      ? 100
      : planStatus === "error"
      ? 0
      : Math.min(25 + loadingStep * 25, 95);

  // CHỈ gồm giá trị người dùng thật sự đã chọn (KHÔNG tự thêm sở thích)
  const understoodChips: string[] = [];
  understoodChips.push(`${tripConfig.people || 2} người`);
  understoodChips.push(`${tripConfig.soNgay || 3} ngày ${Math.max(1, (tripConfig.soNgay || 3) - 1)} đêm`);
  if (tripConfig.budget > 0) {
    understoodChips.push(`Ngân sách ${fmt(tripConfig.budget)}`);
  }
  if (tenDiemDi && tenDiemDen) {
    understoodChips.push(`${tenDiemDi} → ${tenDiemDen}`);
  }
  if (tripConfig.avoids && tripConfig.avoids.length > 0) {
    tripConfig.avoids.forEach((a) => understoodChips.push(a));
  }
  if (tripConfig.note && tripConfig.note.trim()) {
    understoodChips.push(`"${tripConfig.note.trim()}"`);
  }

  return (
    <div className="center-layout animate-in" style={{ maxWidth: 580, margin: "40px auto", padding: "0 16px" }}>
      {/* HEADER: DÙNG SVG ICON TRÁNH CHE CHỮ, KHÔNG EMOJI, KHÔNG ROBOT */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: 28,
            background: "var(--color-primary-brandLight)",
            color: "var(--color-primary-brand)",
            marginBottom: 16,
          }}
        >
          {dataPrepError || planStatus === "error" ? (
            <AlertCircle size={30} color="var(--color-status-error)" />
          ) : (
            <Sparkles size={28} />
          )}
        </div>

        <h1 className="page-title" style={{ fontSize: 24, fontWeight: 800, textAlign: "center", margin: 0 }}>
          {dataPrepError || planStatus === "error"
            ? "Đã xảy ra sự cố"
            : phase === "chuan_bi"
            ? `Chuẩn bị dữ liệu cho ${tenDiemDen}`
            : planStatus === "ok" || planStatus === "co_vi_pham"
            ? "Đã lập xong kế hoạch!"
            : "Đang lập kế hoạch cho bạn"}
        </h1>

        <p className="page-sub" style={{ textAlign: "center", marginTop: 8, fontSize: 14, color: "var(--color-neutral-mutedText)" }}>
          {dataPrepError
            ? dataPrepError.noiDung
            : planStatus === "error"
            ? planError || "Không thể hoàn thành việc lập kế hoạch."
            : phase === "chuan_bi"
            ? "Hệ thống đang chuẩn bị dữ liệu thực tế (khách sạn, quán ăn, điểm tham quan, giá vé)."
            : "Gemini AI đang tối ưu lịch trình phù hợp ngân sách và sở thích của bạn."}
        </p>

        {phase === "chuan_bi" && !dataPrepError && (
          <div
            style={{
              fontSize: 12,
              color: "var(--color-neutral-mutedText)",
              fontStyle: "italic",
              marginTop: 6,
            }}
          >
            Lần đầu với một điểm đến mới có thể mất 1 đến 5 phút. Lần sau sẽ nhanh.
          </div>
        )}
      </div>

      {/* ─── MÀN LỖI THIẾU DỮ LIỆU / KHÔNG CÓ DỮ LIỆU LƯU SẴN (BƯỚC A) ─── */}
      {dataPrepError && (
        <div
          className="card"
          style={{
            padding: 24,
            marginBottom: 20,
            border: "1.5px solid var(--color-status-error)",
            background: "var(--color-status-errBg)",
            borderRadius: 12,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--color-status-errText)", marginBottom: 8 }}>
            {dataPrepError.tieuDe}
          </div>
          <div style={{ fontSize: 14, color: "var(--color-neutral-bodyText)", marginBottom: 20, lineHeight: 1.5 }}>
            {dataPrepError.noiDung}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {dataPrepError.maLoi === "khong_du_du_lieu" && (
              <button
                type="button"
                className="Btn BtnPrimary BtnSmall"
                onClick={() => {
                  setDataPrepError(null);
                  startPrepare();
                }}
              >
                <RefreshCw size={14} style={{ marginRight: 6 }} />
                Thử lại phần còn thiếu
              </button>
            )}
            <button
              type="button"
              className="Btn BtnSmall"
              onClick={() => nav("b1-chon-nhanh")}
              style={{ background: "var(--color-surface)" }}
            >
              Chọn điểm đến khác
            </button>
            <button
              type="button"
              className="Btn BtnSmall"
              onClick={handleCancel}
              style={{ background: "var(--color-surface)" }}
            >
              Về màn hình chọn
            </button>
          </div>
        </div>
      )}

      {/* ─── MÀN LỖI KHI LẬP KẾ HOẠCH BẰNG AI (BƯỚC B) ─── */}
      {!dataPrepError && planStatus === "error" && (
        <div
          className="card"
          style={{
            padding: 24,
            marginBottom: 20,
            border: "1.5px solid var(--color-status-error)",
            background: "var(--color-status-errBg)",
            borderRadius: 12,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--color-status-errText)", marginBottom: 8 }}>
            Gặp sự cố kết nối hoặc xử lý
          </div>
          <div style={{ fontSize: 14, color: "var(--color-neutral-bodyText)", marginBottom: 20, lineHeight: 1.5 }}>
            {planError || "Không nhận được phản hồi hợp lệ từ máy chủ."}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" className="Btn BtnSmall" onClick={handleCancel} style={{ background: "var(--color-surface)" }}>
              ← Về màn hình chọn
            </button>
            <button type="button" className="Btn BtnPrimary BtnSmall" onClick={retryPlan}>
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* ─── CARD CHIP "AI HIỂU BẠN MUỐN GÌ" (CHỈ HIỆN KHI AI BẬT) ─── */}
      {aiBat && (
        <div className="card" style={{ padding: "18px 22px", marginBottom: 20, background: "var(--color-surface)", borderRadius: 12, border: "1px solid var(--color-neutral-borderCard)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-neutral-navyText)", marginBottom: 10 }}>
            AI hiểu bạn muốn gì
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {understoodChips.map((t, idx) => (
              <span
                key={idx}
                className="Chip ChipOn"
                style={{ fontSize: 12, padding: "4px 10px" }}
              >
                {t}
              </span>
            ))}
          </div>
          <span
            onClick={handleCancel}
            style={{ cursor: "pointer", fontSize: 12, color: "var(--color-primary-brand)", fontWeight: 600 }}
          >
            Sửa yêu cầu
          </span>
        </div>
      )}

      {/* ─── TIẾN TRÌNH THẬT BƯỚC A: CHUẨN BỊ DỮ LIỆU TỪNG HẠNG MỤC ─── */}
      {phase === "chuan_bi" && !dataPrepError && (
        <div className="card" style={{ padding: 22, background: "var(--color-surface)", borderRadius: 12, border: "1px solid var(--color-neutral-borderCard)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-neutral-navyText)", marginBottom: 14 }}>
            Tiến trình thu thập dữ liệu
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {(Object.keys(CATEGORY_META) as CategoryKey[]).map((key) => {
              const meta = CATEGORY_META[key];
              const IconComp = meta.icon;
              const item = tienTrinh[key];

              const isDone = item.trangThai === "xong";
              const isRunning = item.trangThai === "dang_chay";
              const isMissing = item.trangThai === "thieu";
              const isError = item.trangThai === "loi";

              return (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: isRunning
                      ? "var(--color-primary-brandSoft)"
                      : isDone
                      ? "var(--color-neutral-gray50)"
                      : "transparent",
                    border: "1px solid",
                    borderColor: isRunning
                      ? "var(--color-primary-brandLight)"
                      : isDone
                      ? "var(--color-neutral-borderLight)"
                      : "transparent",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isDone
                          ? "var(--color-primary-brandLight)"
                          : isRunning
                          ? "var(--color-primary-brand)"
                          : "var(--color-neutral-gray100)",
                        color: isRunning ? "var(--color-primary-text)" : "var(--color-primary-brand)",
                      }}
                    >
                      {isRunning ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : isDone ? (
                        <Check size={16} />
                      ) : (
                        <IconComp size={16} />
                      )}
                    </div>

                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-neutral-navyText)" }}>
                        {meta.label}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-neutral-mutedText)", marginTop: 2 }}>
                        {isRunning
                          ? "Đang tải dữ liệu từ máy chủ..."
                          : isDone
                          ? `Đã có ${item.soMuc ?? 0} mục ${item.mayChu ? `· ${item.mayChu}` : ""} ${item.ms ? `(${item.ms}ms)` : ""}`
                          : isMissing
                          ? `Thiếu: ${item.lyDo}`
                          : isError
                          ? `Lỗi: ${item.lyDo}`
                          : "Đang chờ..."}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isDone && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-status-success)" }}>
                        ✓ Xong
                      </span>
                    )}
                    {isRunning && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-primary-brand)" }}>
                        Đang lấy...
                      </span>
                    )}
                    {isMissing && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-status-warning)" }}>
                        Thiếu
                      </span>
                    )}
                    {isError && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-status-error)" }}>
                        Lỗi
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button
              type="button"
              className="Btn BtnSmall"
              onClick={handleCancel}
              style={{ background: "var(--color-surface)", padding: "6px 20px" }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* ─── TIẾN TRÌNH THẬT BƯỚC B: LẬP KẾ HOẠCH BẰNG AI (KHI DỮ LIỆU ĐÃ SẴN SÀNG) ─── */}
      {phase === "lap_ke_hoach" && planStatus !== "error" && (
        <div className="card" style={{ padding: 24, background: "var(--color-surface)", borderRadius: 12, border: "1px solid var(--color-neutral-borderCard)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-neutral-navyText)", marginBottom: 16 }}>
            Lập kế hoạch chi tiết
          </div>

          {AI_STEPS.map((s, i) => {
            const isDone =
              planStatus === "ok" || planStatus === "co_vi_pham" || i < loadingStep;
            const isActive = planStatus === "loading" && i === loadingStep;
            const isPending = planStatus === "loading" && i > loadingStep;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  marginBottom: i < AI_STEPS.length - 1 ? 20 : 0,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    marginTop: 2,
                    background: isDone
                      ? "var(--color-primary-brandLight)"
                      : isActive
                      ? "var(--color-primary-brand)"
                      : "var(--color-neutral-gray100)",
                    color: isDone
                      ? "var(--color-primary-brand)"
                      : isActive
                      ? "var(--color-primary-text)"
                      : "var(--color-neutral-mutedText)",
                  }}
                >
                  {isDone ? "✓" : isActive ? <Loader2 size={14} className="animate-spin" /> : i + 1}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: isPending ? "var(--color-neutral-mutedText)" : "var(--color-neutral-navyText)",
                    }}
                  >
                    {s.label}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-neutral-subText)", marginTop: 2 }}>
                    {isDone ? "Đã hoàn thành" : s.sub}
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 24 }}>
            <div
              style={{
                height: 8,
                background: "var(--color-neutral-gray100)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: "var(--color-primary-brand)",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 6,
                fontSize: 12,
                color: "var(--color-neutral-mutedText)",
                fontWeight: 600,
              }}
            >
              {pct}%
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button
              type="button"
              className="Btn BtnSmall"
              onClick={handleCancel}
              style={{ background: "var(--color-surface)", padding: "6px 20px" }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default B2AgentScreen;
