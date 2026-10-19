"use client";
import React from "react";
import { useApp } from "@/ui/context/AppContext";

export function BudgetBox({
  total = 9_540_000,
  budget,
  showDetails = true,
}: {
  total?: number;
  budget?: number;
  showDetails?: boolean;
}) {
  const { tripConfig } = useApp();
  const currentBudget = budget ?? tripConfig?.budget ?? 10_000_000;
  const pct = Math.min((total / currentBudget) * 100, 100);
  const remain = currentBudget - total;
  const danger = pct > 90;

  const fmt = (n: number) =>
    n.toLocaleString("vi-VN") + " đ";

  const cats = [
    { label: "Di chuyển", amount: 3_920_000, pct: 41, color: "#3B82F6" },
    { label: "Chỗ ở",     amount: 2_200_000, pct: 23, color: "#14B8A6" },
    { label: "Ăn uống",   amount: 1_800_000, pct: 19, color: "#F59E0B" },
    { label: "Vui chơi",  amount: 1_620_000, pct: 17, color: "#8B5CF6" },
  ];

  return (
    <div className="budget-box">
      <div className="budget-label">Tổng kế hoạch</div>
      <div className="budget-big">{fmt(total)}</div>
      <div className="budget-sub">trên ngân sách {fmt(currentBudget)}</div>

      <div className="bar-track" style={{ marginBottom: 4 }}>
        <div className={`bar-fill ${danger ? "danger" : ""}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="bar-remain">
        <span style={{ fontWeight: 600, color: danger ? "var(--warning)" : "var(--p500)" }}>
          Đã dùng {pct.toFixed(1)}%
        </span>
        <span style={{ color: "var(--g500)" }}>
          Còn lại {fmt(remain)}
        </span>
      </div>

      {showDetails && cats.map(c => (
        <div key={c.label} className="cat-row">
          <div className="cat-head">
            <span style={{ color: "var(--g700)" }}>{c.label}</span>
            <span style={{ fontWeight: 600 }}>{fmt(c.amount)}</span>
          </div>
          <div className="cat-bar">
            <div className="cat-bar-fill" style={{ width: `${c.pct}%`, background: c.color }} />
          </div>
        </div>
      ))}

      <div className="divider" />
      <div className="move-row">
        <span>Tổng thời gian di chuyển</span>
        <span style={{ fontWeight: 600, color: "var(--navy)" }}>2 giờ 50 phút</span>
      </div>
      <div style={{ marginTop: 16, fontSize: 12, color: "var(--g400)", lineHeight: 1.5 }}>
        Mỗi thay đổi sẽ cho bạn xem trước (trước và sau) rồi mới áp dụng.
      </div>
    </div>
  );
}
