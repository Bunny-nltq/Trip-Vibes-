"use client";
import React, { useState, useEffect } from "react";
import { useApp } from "@/ui/context/AppContext";

const STEPS = [
  { label: "Tìm phương tiện",           sub: "Đã tìm thấy 6 lựa chọn" },
  { label: "Tìm khách sạn",             sub: "Đã tìm thấy 4 lựa chọn" },
  { label: "Gợi ý hoạt động",           sub: "Đang chọn hoạt động phù hợp..." },
  { label: "Kiểm tra và tính chi phí",  sub: "Nếu vượt ngân sách, AI sẽ tự điều chỉnh (tối đa 2 lần)" },
];

export function B2AgentScreen() {
  const { nav, tripConfig } = useApp();
  const [step, setStep] = useState(0);
  const [pct, setPct] = useState(35);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 800);
    const t2 = setTimeout(() => { setStep(2); setPct(55); }, 1600);
    const t3 = setTimeout(() => { setStep(3); setPct(80); }, 2400);
    const t4 = setTimeout(() => { setPct(100); }, 3200);
    const t5 = setTimeout(() => nav("b3-ke-hoach"), 3800);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [nav]);

  const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

  return (
    <div className="center-layout animate-in" style={{ maxWidth: 560 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
        <h1 className="page-title" style={{ fontSize: 26, textAlign: "center" }}>Đang lập kế hoạch cho bạn</h1>
        <p className="page-sub" style={{ textAlign: "center" }}>Thường mất vài chục giây.</p>
      </div>

      {/* Summary card */}
      <div className="card" style={{ padding: "20px 24px", marginBottom: 20 }}>
        <div className="field-label" style={{ marginBottom: 12 }}>AI hiểu bạn muốn gì</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {[
            `${tripConfig.people} người`,
            "3 ngày 2 đêm",
            `Ngân sách ${fmt(tripConfig.budget)}`,
            tripConfig.avoids.length ? tripConfig.avoids[0] : "AI tự gợi ý hoạt động"
          ].map(t => (
            <span key={t} className="chip" style={{ fontSize: 13, height: "auto", padding: "4px 12px" }}>{t}</span>
          ))}
        </div>
        <span className="text-link" onClick={() => {}}>Sửa yêu cầu</span>
      </div>

      {/* Steps */}
      <div className="card" style={{ padding: "24px" }}>
        {STEPS.map((s, i) => {
          const done    = i < step;
          const active  = i === step;
          const pending = i > step;
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: i < STEPS.length - 1 ? 20 : 0 }}>
              <div className={`step-circle ${done ? "step-done" : active ? "step-active" : "step-pending"}`} style={{ marginTop: 2 }}>
                {done ? "✓" : active ? "●" : "○"}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: pending ? "var(--g400)" : "var(--navy)" }}>{s.label}</div>
                <div style={{ fontSize: 13, color: "var(--g500)", marginTop: 2 }}>{done ? s.sub.replace("Đang ", "Đã ").replace("...", "") : active ? s.sub : s.sub}</div>
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: 20 }}>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${pct}%`, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6, fontSize: 12, color: "var(--g500)", fontWeight: 600 }}>
            {pct}%
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <button className="btn btn-outline" onClick={() => nav("b1-chon-nhanh")}>Hủy</button>
      </div>
    </div>
  );
}
