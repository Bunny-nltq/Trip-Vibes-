"use client";
import React from "react";
import { useApp } from "@/ui/context/AppContext";
import { SideNav } from "@/ui/components/SideNav";
import { BudgetBox } from "@/ui/components/BudgetBox";

const ROWS = [
  { label: "Chiều đi",  detail: "Máy bay TP.HCM → Đà Nẵng · 06:30 → 07:55", amount: "1.960.000 đ" },
  { label: "Chỗ ở",     detail: "Khách sạn Mẫu 02 · 2 đêm · buffet sáng · hồ bơi", amount: "2.200.000 đ" },
  { label: "Ngày 1",    detail: "Bãi biển Mỹ Khê", amount: "Miễn phí" },
  { label: "Ngày 2",    detail: "Ngũ Hành Sơn, Phố cổ Hội An", amount: "320.000 đ" },
  { label: "Ngày 3",    detail: "Bà Nà Hills", amount: "1.300.000 đ" },
  { label: "Ăn uống",   detail: "Ước tính 3 ngày cho 2 người", amount: "1.800.000 đ" },
  { label: "Chiều về",  detail: "Máy bay Đà Nẵng → TP.HCM · 18:00 → 19:25", amount: "1.960.000 đ" },
];

export function B7XacNhanScreen() {
  const { nav, setConfirmed } = useApp();

  const handleConfirm = () => {
    setConfirmed(true);
    nav("b8-chuyen-di");
  };

  return (
    <div className="tv-layout">
      <SideNav />
      <div className="tv-main animate-in">
        <span className="text-link" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }} onClick={() => nav("b3-ke-hoach")}>
          ← Quay lại sửa
        </span>
        <h1 className="page-title">Xác nhận kế hoạch</h1>
        <p className="page-sub">Xem lại lần cuối trước khi chốt.</p>

        <div className="card" style={{ marginBottom: 20, overflow: "hidden" }}>
          <table className="tv-table">
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={i}>
                  <td style={{ width: 120, fontWeight: 700 }}>{r.label}</td>
                  <td style={{ color: "var(--g700)" }}>{r.detail}</td>
                  <td className="text-right" style={{ fontWeight: 600, color: r.amount === "Miễn phí" ? "var(--success)" : "var(--navy)", whiteSpace: "nowrap" }}>{r.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="banner banner-warn" style={{ marginBottom: 16 }}>
          <div className="banner-mark">!</div>
          <div>
            <div className="banner-title">Lưu ý còn lại</div>
            <div className="banner-text">Máy bay đến lúc 07:55, sớm hơn giờ nhận phòng 14:00. Nên gửi hành lý tại khách sạn.</div>
            <div className="banner-text">Đã dùng 95,4% ngân sách.</div>
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 24, background: "var(--g50)" }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>🔒 Trip Vibes không đặt vé thật</div>
          <div style={{ fontSize: 13, color: "var(--g500)" }}>Đây là bản mô phỏng. Bạn tự đặt vé và phòng với nhà cung cấp sau khi xác nhận.</div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button className="btn btn-outline" onClick={() => nav("b3-ke-hoach")}>← Quay lại sửa</button>
          <button className="btn btn-primary" style={{ minWidth: 180, fontSize: 15 }} onClick={handleConfirm}>
            ✓ &nbsp; Xác nhận kế hoạch
          </button>
        </div>
      </div>
      <div className="tv-side"><BudgetBox /></div>
    </div>
  );
}
