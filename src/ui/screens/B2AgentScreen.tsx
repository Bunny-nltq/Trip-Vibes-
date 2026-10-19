"use client";
import React, { useEffect } from "react";
import { useApp } from "@/ui/context/AppContext";

const STEPS = [
  { label: "Tìm phương tiện", sub: "Đang tìm phương tiện chiều đi và chiều về..." },
  { label: "Tìm khách sạn", sub: "Đang tìm chỗ ở phù hợp khu vực và ngân sách..." },
  { label: "Gợi ý hoạt động và ẩm thực", sub: "Đang chọn hoạt động, quán ăn trưa, tối và cafe..." },
  { label: "Kiểm tra và tính chi phí", sub: "Hệ thống code core kiểm tra ràng buộc cứng và tự sửa nếu vượt ngân sách..." },
];

const AVOID_LABELS: Record<string, string> = {
  khong_day_som: "Không dậy sớm",
  khong_di_dem: "Không đi đêm",
  tranh_di_chuyen_lau: "Tránh đi lâu",
  tranh_dong_nguoi: "Tránh chỗ đông",
  tranh_di_bo_nhieu: "Tránh đi bộ nhiều",
};

const PREF_LABELS: Record<string, string> = {
  bien: "Biển",
  am_thuc: "Ẩm thực",
  hai_san: "Hải sản",
  van_hoa_lich_su: "Văn hóa",
  thien_nhien: "Thiên nhiên",
  giai_tri_vui_choi: "Vui chơi",
  thu_gian_spa: "Thư giãn",
  check_in_chup_anh: "Chụp ảnh",
  mua_sam: "Mua sắm",
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
    loadingStep,
    retryPlan,
    abortPlan,
  } = useApp();

  // Tự động chuyển màn hình khi hoàn thành thành công hoặc có vi phạm
  useEffect(() => {
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
  }, [planStatus, nav]);

  const handleCancel = () => {
    abortPlan();
    nav("b1-chon-nhanh");
  };

  // Tính phần trăm tiến trình thật
  const pct =
    planStatus === "ok" || planStatus === "co_vi_pham"
      ? 100
      : planStatus === "error"
      ? 0
      : Math.min(25 + loadingStep * 25, 95);

  // Tạo các chip "AI hiểu bạn muốn gì" từ phản hồi API (nếu có) hoặc từ config người dùng
  const understoodChips: string[] = [];
  if (planRequest) {
    if (planRequest.soNguoi) understoodChips.push(`${planRequest.soNguoi} người`);
    if (planRequest.soNgay) {
      const dem = Math.max(1, planRequest.soNgay - 1);
      understoodChips.push(`${planRequest.soNgay} ngày ${dem} đêm`);
    }
    if (planRequest.ngansachTongVND) {
      understoodChips.push(`Ngân sách ${fmt(planRequest.ngansachTongVND)}`);
    }
    planRequest.tranh.forEach((t) => {
      understoodChips.push(AVOID_LABELS[t] || t);
    });
    planRequest.sothich.forEach((s) => {
      understoodChips.push(PREF_LABELS[s] || s);
    });
    planRequest.ghiChu.forEach((g) => {
      if (g) understoodChips.push(`"${g}"`);
    });
  } else {
    understoodChips.push(`${tripConfig.people} người`);
    understoodChips.push("3 ngày 2 đêm");
    understoodChips.push(`Ngân sách ${fmt(tripConfig.budget)}`);
    if (tripConfig.avoids.length) {
      tripConfig.avoids.forEach((a) => understoodChips.push(a));
    }
    if (tripConfig.note.trim()) {
      understoodChips.push(`"${tripConfig.note.trim()}"`);
    }
  }

  return (
    <div className="center-layout animate-in" style={{ maxWidth: 560 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
        <h1 className="page-title" style={{ fontSize: 26, textAlign: "center" }}>
          {planStatus === "error"
            ? "Không thể lập kế hoạch"
            : planStatus === "ok" || planStatus === "co_vi_pham"
            ? "Đã lập xong kế hoạch!"
            : "Đang lập kế hoạch cho bạn"}
        </h1>
        <p className="page-sub" style={{ textAlign: "center" }}>
          {planStatus === "error"
            ? "Đã xảy ra lỗi trong quá trình xử lý yêu cầu."
            : planStatus === "ok" || planStatus === "co_vi_pham"
            ? "Đang chuyển đến trang kế hoạch chi tiết..."
            : "Thường mất từ 5 đến 15 giây. Hệ thống đang tìm kiếm và tối ưu trực tiếp."}
        </p>
      </div>

      {/* Thông báo lỗi nếu có */}
      {planStatus === "error" && (
        <div className="card" style={{ padding: 24, marginBottom: 20, border: "1.5px solid var(--error)" }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--error)", marginBottom: 8 }}>
            Gặp sự cố kết nối hoặc xử lý
          </div>
          <div style={{ fontSize: 14, color: "var(--g700)", marginBottom: 20 }}>
            {planError || "Không nhận được phản hồi hợp lệ từ máy chủ."}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button className="btn btn-outline" onClick={handleCancel}>
              ← Về màn hình chọn
            </button>
            <button className="btn btn-primary" onClick={retryPlan}>
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Summary card "AI hiểu bạn muốn gì" */}
      <div className="card" style={{ padding: "20px 24px", marginBottom: 20 }}>
        <div className="field-label" style={{ marginBottom: 12 }}>
          AI hiểu bạn muốn gì
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {understoodChips.map((t, idx) => (
            <span
              key={idx}
              className="chip on"
              style={{ fontSize: 13, height: "auto", padding: "4px 12px" }}
            >
              {t}
            </span>
          ))}
        </div>
        <span
          className="text-link"
          onClick={handleCancel}
          style={{ cursor: "pointer", fontSize: 13 }}
        >
          Sửa yêu cầu
        </span>
      </div>

      {/* Progress Steps Card */}
      {planStatus !== "error" && (
        <div className="card" style={{ padding: 24 }}>
          {STEPS.map((s, i) => {
            const isDone =
              planStatus === "ok" || planStatus === "co_vi_pham" || i < loadingStep;
            const isActive =
              planStatus === "loading" && i === loadingStep;
            const isPending =
              planStatus === "loading" && i > loadingStep;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  marginBottom: i < STEPS.length - 1 ? 20 : 0,
                }}
              >
                <div
                  className={`step-circle ${
                    isDone
                      ? "step-done"
                      : isActive
                      ? "step-active"
                      : "step-pending"
                  }`}
                  style={{ marginTop: 2 }}
                >
                  {isDone ? "✓" : isActive ? "●" : "○"}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: isPending ? "var(--g400)" : "var(--navy)",
                    }}
                  >
                    {s.label}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--g500)", marginTop: 2 }}>
                    {isDone ? "Đã hoàn thành" : s.sub}
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 20 }}>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${pct}%`, transition: "width 0.4s ease" }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 6,
                fontSize: 12,
                color: "var(--g500)",
                fontWeight: 600,
              }}
            >
              {pct}%
            </div>
          </div>
        </div>
      )}

      {/* Nút hủy */}
      {planStatus === "loading" && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button className="btn btn-outline" onClick={handleCancel}>
            Hủy
          </button>
        </div>
      )}
    </div>
  );
}
