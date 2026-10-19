"use client";
import React, { useState } from "react";
import { useApp } from "@/ui/context/AppContext";

const PRESETS = [
  { id: "couple", icon: "💑", name: "Cặp đôi", people: 2, budget: 10_000_000 },
  { id: "group",  icon: "👥", name: "Nhóm bạn", people: 4, budget: 20_000_000 },
  { id: "solo",   icon: "🧳", name: "Đi một mình", people: 1, budget: 5_000_000 },
];

const BUDGETS = [5_000_000, 8_000_000, 10_000_000, 15_000_000, 20_000_000];
const AVOIDS = ["Không dậy sớm","Không đi đêm","Tránh đi lâu","Tránh chỗ đông","Tránh đi bộ nhiều"];

const fmt = (n: number) => (n / 1_000_000).toFixed(0) + " triệu";

export function B1ChonNhanhScreen() {
  const { nav, tripConfig, setTripConfig } = useApp();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const toggleAvoid = (a: string) => {
    setTripConfig({
      avoids: tripConfig.avoids.includes(a)
        ? tripConfig.avoids.filter(x => x !== a)
        : [...tripConfig.avoids, a],
    });
  };

  const pickPreset = (p: typeof PRESETS[0]) => {
    setSelectedPreset(p.id);
    setTripConfig({ people: p.people, budget: p.budget });
  };

  return (
    <div className="center-layout animate-in" style={{ maxWidth: 680 }}>
      {/* Destination badge */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "var(--p100)", borderRadius: "var(--r-full)", marginBottom: 20, fontSize: 13, color: "var(--p500)", fontWeight: 600 }}>
        🏖 Đà Nẵng · 3 ngày 2 đêm · khởi hành từ TP.HCM
      </div>

      <h1 className="page-title" style={{ fontSize: 28 }}>Chuyến Đà Nẵng của bạn</h1>
      <p className="page-sub">Chạm để chọn, hoặc bấm Lập kế hoạch ngay.</p>

      {/* Presets */}
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--g500)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Chọn nhanh</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 28 }}>
        {PRESETS.map(p => (
          <div
            key={p.id}
            className={`card card-hover ${selectedPreset === p.id ? "card-selected" : ""}`}
            style={{ padding: 18, cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => pickPreset(p)}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{p.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 13, color: "var(--g500)" }}>{p.people} người · {fmt(p.budget)}</div>
            {selectedPreset === p.id && (
              <div style={{ marginTop: 8, color: "var(--p500)", fontSize: 12, fontWeight: 600 }}>✓ Đã chọn</div>
            )}
          </div>
        ))}
      </div>

      {/* Custom */}
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--g500)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.5px" }}>Hoặc tự chọn</div>

      <div className="field">
        <div className="field-label">Mấy người đi?</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button className="btn btn-outline btn-sm" style={{ width: 36, padding: 0, fontWeight: 800, fontSize: 18 }} onClick={() => setTripConfig({ people: Math.max(1, tripConfig.people - 1) })}>−</button>
          <span style={{ minWidth: 32, textAlign: "center", fontSize: 20, fontWeight: 700 }}>{tripConfig.people}</span>
          <button className="btn btn-outline btn-sm" style={{ width: 36, padding: 0, fontWeight: 800, fontSize: 18 }} onClick={() => setTripConfig({ people: tripConfig.people + 1 })}>+</button>
        </div>
      </div>

      <div className="field">
        <div className="field-label">Ngân sách cả chuyến</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {BUDGETS.map(b => (
            <button
              key={b}
              className={`chip ${tripConfig.budget === b ? "on" : ""}`}
              onClick={() => setTripConfig({ budget: b })}
            >
              {fmt(b)}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field-label">Muốn tránh gì?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {AVOIDS.map(a => (
            <button
              key={a}
              className={`chip ${tripConfig.avoids.includes(a) ? "on" : ""}`}
              onClick={() => toggleAvoid(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <div className="field-label">
          Muốn nói rõ hơn? <span style={{ fontWeight: 400, color: "var(--g500)" }}>Không bắt buộc</span>
        </div>
        <textarea
          className="textarea"
          placeholder="Ví dụ: đi cùng ba mẹ, thích ăn hải sản, không muốn đi bộ nhiều"
          value={tripConfig.note}
          onChange={e => setTripConfig({ note: e.target.value })}
        />
        <div className="hint">Bỏ trống cũng được, AI sẽ tự gợi ý.</div>
      </div>

      <div className="hint" style={{ marginBottom: 14, padding: "10px 14px", background: "var(--p100)", borderRadius: "var(--r-md)", color: "var(--p500)", fontWeight: 500 }}>
        {tripConfig.people} người · {fmt(tripConfig.budget)} · {tripConfig.avoids[0] ?? "AI tự gợi ý hoạt động"}
        {tripConfig.avoids.length > 1 && ` · +${tripConfig.avoids.length - 1} điều tránh`}
      </div>

      <button className="btn btn-primary btn-full btn-lg" onClick={() => nav("b2-dang-chay")}>
        ✨ &nbsp; Lập kế hoạch
      </button>
    </div>
  );
}
