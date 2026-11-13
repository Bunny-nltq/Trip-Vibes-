"use client";
import { tripNights } from "@/core/tripWorkspace";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDestinationSearch } from "@/ui/hooks/useDestinationSearch";
import { useApp } from "@/ui/context/AppContext";
import { getDiemDenTen, type DiemDen } from "@/contracts";
import { useTrangThaiAI } from "@/ui/hooks/useTrangThaiAI";
import { useDestinationPrepare } from "@/ui/hooks/useDestinationPrepare";
import type { CategoryKey } from "@/contracts";
import { Check, AlertCircle, Loader2, Hotel, Utensils, Coffee, Compass, Bus, Tag, RefreshCw } from "lucide-react";

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

const fmt = (n: number) => `${n.toLocaleString("vi-VN")} đ`;

export function B2AgentScreen() {
  const {
    nav,
    tripConfig,
    setTripConfig,
    planStatus,
    planError,
    loadingStep,
    executePlan,
    retryPlan,
    abortPlan,
    toiThieuVND,
    hardViolations,
    planResult,
    chooseBudgetAlternative,
  } = useApp();
  const alternatives = planResult?.budgetAlternatives ?? [];
  const { aiBat } = useTrangThaiAI();
  const locationSearch = useDestinationSearch();

  const isPlanIssue =
    planStatus === "error" ||
    planStatus === "khong_the_dat_ngan_sach" ||
    planStatus === "can_lam_ro" ||
    planStatus === "khong_co_phuong_an";

  // Pha thực thi: "chuan_bi" (Bước A) | "lap_ke_hoach" (Bước B)
  const [phase, setPhase] = useState<"chuan_bi" | "lap_ke_hoach">("chuan_bi");
  const hasExecutedPlanRef = useRef(false);
  const latestExecutePlan = useRef(executePlan);
  useEffect(() => {
    latestExecutePlan.current = executePlan;
  }, [executePlan]);

  const {
    trangThai: prepStatus,
    tienTrinh: prepTienTrinh,
    loi: prepError,
    startPrepare: triggerPrepare,
    cancel: cancelPrepare,
  } = useDestinationPrepare();

  const diemDen = tripConfig.diemDen as DiemDen | null;
  const tenDiemDen = diemDen ? getDiemDenTen(diemDen) : "Điểm đến";
  const diemDi = tripConfig.diemDi as DiemDen | null;
  const tenDiemDi = diemDi ? (typeof diemDi === "string" ? diemDi : diemDi.ten) : "";

  // Kết hợp tiến trình từ hook với state hiển thị
  const tienTrinh = {
    khach_san: prepTienTrinh.khach_san || { trangThai: "cho" as const },
    quan_an: prepTienTrinh.quan_an || { trangThai: "cho" as const },
    cafe: prepTienTrinh.cafe || { trangThai: "cho" as const },
    hoat_dong: prepTienTrinh.hoat_dong || { trangThai: "cho" as const },
    phuong_tien: prepTienTrinh.phuong_tien || { trangThai: "cho" as const },
    gia_diem_den: prepTienTrinh.gia_diem_den || { trangThai: "cho" as const },
  };

  const dataPrepError = prepError;

  // 1. Kích hoạt Bước A chuẩn bị dữ liệu qua hook
  const startPrepare = useCallback(() => {
    if (!diemDen) {
      nav("b1-chon-nhanh");
      return;
    }

    triggerPrepare({
      diemDen,
      diemDi: diemDi ?? undefined,
      soNgay: tripConfig.soNgay ?? 3,
      onReady: () => {
        setPhase("lap_ke_hoach");
        if (!hasExecutedPlanRef.current) {
          hasExecutedPlanRef.current = true;
          void latestExecutePlan.current();
        }
      },
    });
  }, [diemDen, diemDi, tripConfig.soNgay, nav, triggerPrepare]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ với hệ thống bên ngoài React (URL, sessionStorage, mạng) chỉ làm được sau khi dựng
    startPrepare();
    return () => {
      cancelPrepare();
    };
  }, [startPrepare, cancelPrepare]);

  // 3. Tự động chuyển trang khi Bước B hoàn tất thành công
  useEffect(() => {
    if (phase === "lap_ke_hoach") {
      if (planStatus === "ok" || planStatus === "co_vi_pham") {
        const timer = setTimeout(() => {
          nav("b3-ke-hoach");
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, planStatus, nav]);

  const handleCancel = () => {
    cancelPrepare();
    if (!isPlanIssue) abortPlan();
    if (window.history.state?.tripVibesPlanningEntry) window.history.back();
    else nav("b1-chon-nhanh");
  };

  useEffect(() => {
    function cancelOnBack() {
      const target = new URLSearchParams(window.location.search).get("screen");
      if (target !== "b2-dang-chay" && !isPlanIssue) abortPlan();
    }
    window.addEventListener("popstate", cancelOnBack);
    return () => window.removeEventListener("popstate", cancelOnBack);
  }, [abortPlan, isPlanIssue]);

  // Tính phần trăm tiến trình Bước B
  const pct =
    planStatus === "ok" || planStatus === "co_vi_pham"
      ? 100
      : isPlanIssue
      ? 0
      : Math.min(25 + loadingStep * 25, 95);

  // CHỈ gồm giá trị người dùng thật sự đã chọn (KHÔNG tự thêm sở thích)
  const understoodChips: string[] = [];
  understoodChips.push(`${tripConfig.people || 2} người`);
  understoodChips.push(`${tripConfig.soNgay || 3} ngày ${tripNights(tripConfig.soNgay || 3)} đêm`);
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
          {dataPrepError || isPlanIssue ? (
            <AlertCircle size={30} color="var(--color-status-error)" />
          ) : (
            <Compass size={28} />
          )}
        </div>

        <h1 className="page-title" style={{ fontSize: 24, fontWeight: 800, textAlign: "center", margin: 0 }}>
          {dataPrepError || planStatus === "error"
            ? "Đã xảy ra sự cố"
            : planStatus === "khong_the_dat_ngan_sach"
            ? "Cần điều chỉnh chuyến đi"
            : planStatus === "can_lam_ro"
            ? "Cần làm rõ yêu cầu"
            : planStatus === "khong_co_phuong_an"
            ? "Không tìm thấy phương án"
            : phase === "chuan_bi"
            ? `Chuẩn bị dữ liệu cho ${tenDiemDen}`
            : planStatus === "ok" || planStatus === "co_vi_pham"
            ? "Đã lập xong kế hoạch!"
            : "Đang lập kế hoạch cho bạn"}
        </h1>

        <p className="page-sub" style={{ textAlign: "center", marginTop: 8, fontSize: 14, color: "var(--color-neutral-mutedText)" }}>
          {dataPrepError
            ? dataPrepError.noiDung
            : planStatus === "khong_the_dat_ngan_sach"
            ? "Xem mức dự toán và các cách điều chỉnh bên dưới."
            : planStatus === "can_lam_ro"
            ? (hardViolations.length > 0 ? hardViolations.map((v) => v.chiTiet).join(". ") : "Vui lòng hoàn thiện thêm thông tin điểm đến hoặc thời gian.")
            : planStatus === "khong_co_phuong_an"
            ? "Không tìm thấy lựa chọn di chuyển hoặc khách sạn phù hợp với các tiêu chí này."
            : planStatus === "error"
            ? planError || "Không thể hoàn thành việc lập kế hoạch."
            : phase === "chuan_bi"
            ? "Hệ thống đang chuẩn bị dữ liệu thực tế (khách sạn, quán ăn, điểm tham quan, giá vé)."
            : "Đang tối ưu lịch trình phù hợp ngân sách và sở thích của bạn."}
        </p>

        {dataPrepError && (
          <section>
            <button
              type="button"
              className="Btn BtnGhost"
              disabled={locationSearch.loading}
              onClick={() => void locationSearch.search(tenDiemDen)}
            >
              Xác định đúng địa phương
            </button>
            <p role="status">{locationSearch.message}</p>
            {locationSearch.results
              .filter((place) => place.maQuocGia === "VN")
              .map((place) => (
                <button
                  type="button"
                  className="Btn BtnGhost"
                  key={`${place.toaDo.lat}:${place.toaDo.lng}`}
                  onClick={() => setTripConfig({ diemDen: place })}
                >
                  {place.ten} · {place.quocGia}
                </button>
              ))}
          </section>
        )}

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
            background: "var(--color-surface)",
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
              onClick={handleCancel}
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
      {!dataPrepError && isPlanIssue && (
        <div
          role="alert"
          className="card"
          style={{
            padding: 24,
            marginBottom: 20,
            border: "1.5px solid var(--color-status-error)",
            background: "var(--color-surface)",
            borderRadius: 12,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--color-status-errText)", marginBottom: 8 }}>
            {planStatus === "khong_the_dat_ngan_sach"
              ? alternatives.length ? "Có lịch trình khác vừa ngân sách" : "Chưa tìm được lịch trình trong ngân sách"
              : planStatus === "can_lam_ro"
              ? "Cần bổ sung hoặc làm rõ thông tin"
              : planStatus === "khong_co_phuong_an"
              ? "Không có phương án phù hợp"
              : "Gặp sự cố kết nối hoặc xử lý"}
          </div>
          <div style={{ fontSize: 14, color: "var(--color-neutral-bodyText)", marginBottom: 20, lineHeight: 1.5 }}>
            {planStatus === "khong_the_dat_ngan_sach"
              ? (toiThieuVND
                  ? `Ngân sách của bạn vẫn là ${fmt(tripConfig.budget || 0)}. Với lựa chọn hiện tại, phương án tìm được ước tính ${fmt(toiThieuVND)}.`
                  : "Chưa tìm được phương án phù hợp. Hãy thử điều chỉnh ngày đi hoặc phương tiện.")
              : planStatus === "can_lam_ro"
              ? (hardViolations.length > 0 ? hardViolations.map((v) => v.chiTiet).join(". ") : planError || "Cần làm rõ thêm thông tin điểm đến hoặc số ngày.")
              : planStatus === "khong_co_phuong_an"
              ? (hardViolations.length > 0 ? hardViolations.map((v) => v.chiTiet).join(". ") : planError || "Không tìm thấy phương án di chuyển hoặc chỗ ở phù hợp.")
              : (planError || "Không nhận được phản hồi hợp lệ từ máy chủ.")}
          </div>
          {planStatus === "khong_the_dat_ngan_sach" && alternatives.length > 0 && (
            <ul style={{ display: "grid", gap: "var(--home-space)", marginBottom: "var(--home-space)" }}>
              {alternatives.map(({ plan, changes }) => {
                const { travelDates, soNgay } = plan.request;
                const cafe = plan.items.find(item => item.experienceType === "cafe");
                const transport = plan.items.filter(item => item.hangMuc === "Di chuyển" &&
                  item.experienceType !== "local_transfer" && item.refId);
                return (
                  <li key={changes.join("-") + soNgay} style={{
                    padding: "var(--home-space)", borderRadius: "var(--home-space)", background: "var(--home-wash)",
                  }}>
                    <strong>{changes.includes("shorter") ? `Rút còn ${soNgay} ngày` : "Giữ nguyên ngày đi và ngày về"}</strong>
                    <p>
                      {travelDates && `Ngày về ${travelDates.returnDate.split("-").reverse().join("/")} · `}
                      {changes.includes("flexible_transport") && "Đổi phương tiện đi xa · "}
                      {changes.includes("public_transit") && "Đi lại bằng phương tiện công cộng (ước tính) · "}
                      Dự toán {fmt(plan.tongKet.tongVND)} · Còn {fmt(plan.tongKet.conLaiVND)}
                    </p>
                    {transport.map((item, index) => <p key={`${item.refId}-${index}`}>{item.noiDung}</p>)}
                    {cafe && <p>{cafe.noiDung}{/bờ hồ|ven hồ|gần hồ|view hồ/i.test(tripConfig.note) && " · Cần xác nhận vị trí gần hồ."}</p>}
                    {!cafe && /cà phê|cafe|coffee/i.test(tripConfig.note) && <p>Phương án này chưa xếp được quán cà phê.</p>}
                    <button type="button" className="Btn BtnPrimary BtnSmall" onClick={() => chooseBudgetAlternative(plan)}>
                      Xem lịch trình này
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="Btn BtnSmall"
              onClick={handleCancel}
              style={{ background: "var(--color-surface)" }}
            >
              ← Quay lại chỉnh lịch trình
            </button>
            {planStatus === "khong_the_dat_ngan_sach" && toiThieuVND > (tripConfig.budget || 0) && (
              <button type="button" className="Btn BtnPrimary BtnSmall" onClick={() => {
                const budget = toiThieuVND;
                setTripConfig({ budget });
                void executePlan({ ...tripConfig, budget });
              }}>
                Áp dụng mức tối thiểu &amp; Tạo lại lịch trình
              </button>
            )}
            {planStatus === "khong_the_dat_ngan_sach" && alternatives.length === 0 && tripConfig.transportMode && tripConfig.transportMode !== "auto" && (
              <button type="button" className="Btn BtnPrimary BtnSmall" onClick={() => {
                setTripConfig({ transportMode: "auto" });
                void executePlan({ ...tripConfig, transportMode: "auto" });
              }}>
                Giữ ngân sách, thử phương tiện khác
              </button>
            )}
            {planStatus === "error" && (
              <button type="button" className="Btn BtnPrimary BtnSmall" onClick={retryPlan}>
                Thử lại
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── CARD CHIP "AI HIỂU BẠN MUỐN GÌ" (CHỈ HIỆN KHI AI BẬT) ─── */}
      {aiBat && (
        <div className="card" style={{ padding: "18px 22px", marginBottom: 20, background: "var(--color-surface)", borderRadius: 12, border: "1px solid var(--color-neutral-borderCard)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-neutral-navyText)", marginBottom: 10 }}>
            Mong muốn chuyến đi của bạn
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
      {phase === "lap_ke_hoach" && !isPlanIssue && (
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
