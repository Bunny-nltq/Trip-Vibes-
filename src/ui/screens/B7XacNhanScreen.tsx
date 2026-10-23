"use client";
import React from "react";
import { useApp } from "@/ui/context/AppContext";
import { SideNav } from "@/ui/components/SideNav";
import { BudgetBox } from "@/ui/components/BudgetBox";
import { getDiemDenTen } from "@/contracts";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ShieldAlert,
  Compass,
  RotateCcw,
  Info,
} from "lucide-react";

export function B7XacNhanScreen() {
  const { nav, confirmed, setConfirmed, plan, softViolations } = useApp();

  const handleConfirm = () => {
    setConfirmed(true);
  };

  const handleReopen = () => {
    setConfirmed(false);
  };

  // Trang khi ĐÃ CHỐT
  if (confirmed) {
    return (
      <div className="tv-layout">
        <SideNav />
        <div className="tv-main animate-in" style={{ padding: "40px 20px", maxWidth: 700, margin: "0 auto" }}>
          <div
            className="card"
            style={{
              padding: 36,
              textAlign: "center",
              border: "2px solid var(--success)",
              borderRadius: "var(--r-xl)",
              background: "var(--surface)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--color-success-bg)",
                color: "var(--color-success-text)",
                marginBottom: 20,
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h1 className="page-title" style={{ marginBottom: 8 }}>
              Kế hoạch chuyến đi đã chốt
            </h1>
            <p className="page-sub" style={{ marginBottom: 24 }}>
              Kế hoạch đã được lưu cục bộ trên thiết bị của bạn. Mục &quot;Chuyến đi&quot; và &quot;Ngân sách&quot; đã được mở để đồng hành cùng bạn.
            </p>

            {/* Tóm tắt nhanh chuyến đi */}
            {plan && (
              <div
                style={{
                  background: "var(--g50)",
                  borderRadius: "var(--r-lg)",
                  padding: 16,
                  marginBottom: 24,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  textAlign: "left",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: "var(--g500)" }}>Lộ trình</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>
                    {(typeof plan.request.diemDi === "string" ? plan.request.diemDi : plan.request.diemDi.ten)} → {getDiemDenTen(plan.request.diemDen) || "Điểm đến"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--g500)" }}>Thời gian & Nhóm</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>
                    {plan.request.soNgay} ngày · {plan.request.soNguoi} người
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--g500)" }}>Tổng chi phí kế hoạch</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "var(--p500)" }}>
                    {plan.tongKet.tongVND.toLocaleString("vi-VN")} đ
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--g500)" }}>Ngân sách còn lại</div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 16,
                      color: plan.tongKet.conLaiVND >= 0 ? "var(--success)" : "var(--error)",
                    }}
                  >
                    {plan.tongKet.conLaiVND.toLocaleString("vi-VN")} đ
                  </div>
                </div>
              </div>
            )}

            {/* Khối bắt buộc theo quy định đồ án */}
            <div
              style={{
                padding: 14,
                marginBottom: 28,
                background: "var(--g50)",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--g300)",
                textAlign: "left",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldAlert size={15} style={{ color: "var(--g500)" }} />
                Trip Vibes không đặt vé thật, đây là bản mô phỏng
              </div>
              <div style={{ fontSize: 12, color: "var(--g500)" }}>
                Bạn tự đặt vé và phòng với nhà cung cấp sau khi xác nhận kế hoạch.
              </div>
            </div>

            {/* Hành động */}
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                className="btn btn-outline"
                onClick={handleReopen}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <RotateCcw size={15} />
                Mở lại để sửa
              </button>
              <button
                className="btn btn-primary"
                onClick={() => nav("b8-chuyen-di")}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 180 }}
              >
                <Compass size={16} />
                Bắt đầu chuyến đi
              </button>
            </div>
          </div>
        </div>
        <div className="tv-side">
          <BudgetBox plan={plan} />
        </div>
      </div>
    );
  }

  // Trang XÁC NHẬN (chưa chốt)
  const rows = plan
    ? plan.items.map((it) => ({
        label: `Ngày ${it.ngay} · ${it.hangMuc}`,
        detail: it.noiDung,
        amount:
          it.thanhTien === 0
            ? (it.hangMuc === "Vui chơi" ? "Chưa có giá" : "Miễn phí")
            : `${it.thanhTien.toLocaleString("vi-VN")} đ`,
      }))
    : [
        { label: "Chiều đi", detail: "Di chuyển chiều đi · Đã lên lịch", amount: "1.960.000 đ" },
        { label: "Chỗ ở", detail: "Khách sạn trung tâm · 2 đêm · buffet sáng · hồ bơi", amount: "2.200.000 đ" },
        { label: "Ngày 1", detail: "Điểm tham quan trung tâm", amount: "Chưa có giá" },
        { label: "Ngày 2", detail: "Khu danh thắng, Di sản văn hóa", amount: "320.000 đ" },
        { label: "Ngày 3", detail: "Khu du lịch sinh thái", amount: "1.300.000 đ" },
        { label: "Ăn uống", detail: "Ước tính các bữa ăn cho 2 người", amount: "1.800.000 đ" },
        { label: "Chiều về", detail: "Di chuyển chiều về · Đã lên lịch", amount: "1.960.000 đ" },
      ];

  return (
    <div className="tv-layout">
      <SideNav />
      <div className="tv-main animate-in" style={{ overflowY: "auto" }}>
        <span
          className="text-link"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 16,
            cursor: "pointer",
          }}
          onClick={() => nav("b3-ke-hoach")}
        >
          <ArrowLeft size={16} />
          Quay lại sửa
        </span>
        <h1 className="page-title">Xác nhận kế hoạch</h1>
        <p className="page-sub">Xem lại lần cuối trước khi chốt chuyến đi.</p>

        {/* Bảng tóm tắt các mục kế hoạch */}
        <div className="card" style={{ marginBottom: 20, overflow: "hidden" }}>
          <table className="tv-table">
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ width: 140, fontWeight: 700 }}>{r.label}</td>
                  <td style={{ color: "var(--g700)" }}>{r.detail}</td>
                  <td
                    className="text-right"
                    style={{
                      fontWeight: 600,
                      color:
                        r.amount === "Miễn phí"
                          ? "var(--success)"
                          : r.amount === "Chưa có giá"
                          ? "var(--g500)"
                          : "var(--navy)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cảnh báo nhẹ còn lại */}
        {softViolations.length > 0 && (
          <div className="banner banner-warn" style={{ marginBottom: 20 }}>
            <div className="banner-mark">
              <Info size={14} />
            </div>
            <div>
              <div className="banner-title">Lưu ý trước khi chốt:</div>
              {softViolations.map((s, idx) => (
                <div key={idx} className="banner-text">
                  • {s.chiTiet}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Thông báo bắt buộc theo quy định đồ án */}
        <div
          className="card"
          style={{
            padding: 16,
            marginBottom: 24,
            background: "var(--g50)",
            border: "1px solid var(--g300)",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <ShieldAlert size={16} style={{ color: "var(--g500)" }} />
            Trip Vibes không đặt vé thật, đây là bản mô phỏng
          </div>
          <div style={{ fontSize: 13, color: "var(--g500)" }}>
            Bạn tự đặt vé và phòng với nhà cung cấp sau khi xác nhận kế hoạch.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button
            className="btn btn-outline"
            onClick={() => nav("b3-ke-hoach")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <ArrowLeft size={16} />
            Quay lại sửa
          </button>
          <button
            className="btn btn-primary"
            style={{ minWidth: 180, fontSize: 15, display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={handleConfirm}
          >
            <Check size={16} />
            Xác nhận kế hoạch
          </button>
        </div>
      </div>
      <div className="tv-side">
        <BudgetBox plan={plan} />
      </div>
    </div>
  );
}
