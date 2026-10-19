"use client";
import React, { useState } from "react";
import { useApp } from "@/ui/context/AppContext";
import { SideNav } from "@/ui/components/SideNav";
import { BudgetBox } from "@/ui/components/BudgetBox";

const FLIGHTS = [
  { id: "f1", airline: "Hãng bay Mẫu A", dep: "05:45", arr: "07:10", duration: "85 phút", price: 1_600_000, note: "Trực tiếp", badge: "Rẻ nhất" },
  { id: "f2", airline: "Hãng bay Mẫu B", dep: "06:30", arr: "07:55", duration: "85 phút", price: 1_960_000, note: "Trực tiếp", badge: "Đang chọn" },
  { id: "f3", airline: "Hãng bay Mẫu C", dep: "08:00", arr: "09:25", duration: "85 phút", price: 2_200_000, note: "Trực tiếp", badge: "" },
  { id: "f4", airline: "Hãng bay Mẫu D", dep: "10:30", arr: "11:55", duration: "85 phút", price: 1_800_000, note: "Trực tiếp", badge: "" },
];

const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

export function B4PhuongTienScreen() {
  const { nav } = useApp();
  const [selected, setSelected] = useState("f2");
  const [tab, setTab] = useState<"di" | "ve">("di");

  return (
    <div className="tv-layout">
      <SideNav />
      <div className="tv-main animate-in">
        <span className="text-link" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16, fontSize: 14 }} onClick={() => nav("b3-ke-hoach")}>
          ← Quay lại kế hoạch
        </span>
        <h1 className="page-title">Chọn phương tiện</h1>
        <p className="page-sub">Chọn chuyến bay phù hợp với bạn.</p>

        <div className="tabs">
          <div className={`tab-item ${tab === "di" ? "active" : ""}`} onClick={() => setTab("di")}>Chiều đi</div>
          <div className={`tab-item ${tab === "ve" ? "active" : ""}`} onClick={() => setTab("ve")}>Chiều về</div>
        </div>

        <div style={{ fontSize: 13, color: "var(--g500)", marginBottom: 16, fontWeight: 500 }}>
          {tab === "di" ? "TP.HCM → Đà Nẵng" : "Đà Nẵng → TP.HCM"} · 2 vé
        </div>

        {FLIGHTS.map(f => (
          <div
            key={f.id}
            className={`card ${selected === f.id ? "card-selected" : "card-hover"}`}
            style={{ padding: 20, marginBottom: 12, cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => setSelected(f.id)}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)" }}>{f.dep}</div>
                  <div style={{ fontSize: 12, color: "var(--g500)" }}>Tân Sơn Nhất</div>
                </div>
                <div style={{ textAlign: "center", color: "var(--g400)", fontSize: 13 }}>
                  <div>✈ ──────</div>
                  <div style={{ fontSize: 12 }}>{f.duration}</div>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)" }}>{f.arr}</div>
                  <div style={{ fontSize: 12, color: "var(--g500)" }}>Đà Nẵng</div>
                </div>
                <div style={{ marginLeft: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{f.airline}</div>
                  <div style={{ fontSize: 12, color: "var(--g500)" }}>{f.note}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: selected === f.id ? "var(--p500)" : "var(--navy)" }}>{fmt(f.price)}</div>
                <div style={{ fontSize: 12, color: "var(--g500)" }}>2 vé</div>
                {f.badge && (
                  <div style={{ marginTop: 4, display: "inline-block", padding: "2px 8px", background: f.badge === "Rẻ nhất" ? "#DCFCE7" : "var(--p100)", borderRadius: "var(--r-full)", fontSize: 11, fontWeight: 600, color: f.badge === "Rẻ nhất" ? "var(--success)" : "var(--p500)" }}>
                    {f.badge}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <button className="btn btn-outline" onClick={() => nav("b3-ke-hoach")}>Hủy</button>
          <button className="btn btn-primary" onClick={() => nav("b6-xem-truoc")}>
            Xem trước thay đổi →
          </button>
        </div>
      </div>
      <div className="tv-side"><BudgetBox /></div>
    </div>
  );
}
