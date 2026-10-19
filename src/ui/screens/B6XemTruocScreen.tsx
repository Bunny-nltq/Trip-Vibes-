"use client";
import React from "react";
import { useApp } from "@/ui/context/AppContext";
import { SideNav } from "@/ui/components/SideNav";
import { BudgetBox } from "@/ui/components/BudgetBox";

export function B6XemTruocScreen() {
  const { nav } = useApp();

  return (
    <div className="tv-layout">
      <SideNav />
      <div className="tv-main animate-in">
        <span className="text-link" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }} onClick={() => nav("b3-ke-hoach")}>
          ← Quay lại
        </span>
        <h1 className="page-title">Xem trước thay đổi</h1>
        <p className="page-sub">So sánh trước và sau khi thay phương tiện.</p>

        {/* Compare grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          {/* Before */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--g500)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Trước</div>
            <div className="card" style={{ padding: 20, opacity: 0.7 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: "var(--g700)" }}>Hãng bay Mẫu B</div>
              <div style={{ fontSize: 13, color: "var(--g500)", marginBottom: 4 }}>06:30 → 07:55 · 85 phút · Trực tiếp</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "var(--g700)" }}>1.960.000 đ</div>
              <div style={{ fontSize: 12, color: "var(--g500)" }}>2 vé × 980.000 đ</div>
            </div>
          </div>
          {/* After */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--p500)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Sau</div>
            <div className="card" style={{ padding: 20, border: "2px solid var(--p500)" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: "var(--navy)" }}>Hãng bay Mẫu A</div>
              <div style={{ fontSize: 13, color: "var(--g500)", marginBottom: 4 }}>05:45 → 07:10 · 85 phút · Trực tiếp</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "var(--p500)" }}>1.600.000 đ</div>
              <div style={{ fontSize: 12, color: "var(--g500)" }}>2 vé × 800.000 đ</div>
              <div style={{ marginTop: 8, padding: "4px 10px", background: "#DCFCE7", borderRadius: "var(--r-full)", display: "inline-block", fontSize: 12, fontWeight: 600, color: "var(--success)" }}>
                Tiết kiệm 360.000 đ
              </div>
            </div>
          </div>
        </div>

        {/* Impact */}
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>Tác động đến kế hoạch</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {[
              { label: "Chi phí", before: "9.540.000 đ", after: "9.180.000 đ", good: true },
              { label: "Giờ đến sớm hơn", before: "07:55", after: "07:10", good: true },
              { label: "Ngân sách còn lại", before: "460.000 đ", after: "820.000 đ", good: true },
            ].map(x => (
              <div key={x.label} style={{ padding: 14, background: "var(--g50)", borderRadius: "var(--r-lg)" }}>
                <div style={{ fontSize: 12, color: "var(--g500)", marginBottom: 6, fontWeight: 600 }}>{x.label}</div>
                <div style={{ fontSize: 13, color: "var(--g400)", textDecoration: "line-through", marginBottom: 2 }}>{x.before}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: x.good ? "var(--success)" : "var(--error)" }}>{x.after}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn btn-outline" onClick={() => nav("b4-phuong-tien")}>← Chọn lại</button>
          <button className="btn btn-primary" onClick={() => nav("b3-ke-hoach")}>✓ &nbsp; Áp dụng thay đổi</button>
        </div>
      </div>
      <div className="tv-side"><BudgetBox total={9_180_000} /></div>
    </div>
  );
}
