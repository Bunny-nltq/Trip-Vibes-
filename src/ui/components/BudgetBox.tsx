"use client";
import React from "react";
import { useApp } from "@/ui/context/AppContext";
import type { Plan } from "@/contracts";

export function BudgetBox({
  plan: propPlan,
  total: propTotal,
  budget: propBudget,
  showDetails = true,
}: {
  plan?: Plan | null;
  total?: number;
  budget?: number;
  showDetails?: boolean;
}) {
  const { tripConfig, plan: appPlan } = useApp();
  const plan = propPlan !== undefined ? propPlan : appPlan;

  const currentBudget =
    propBudget ??
    plan?.request.ngansachTongVND ??
    tripConfig?.budget ??
    10_000_000;

  const total = propTotal ?? plan?.tongKet.tongVND ?? 9_540_000;
  const pct = currentBudget > 0 ? Math.min((total / currentBudget) * 100, 100) : 0;
  const remain = currentBudget - total;
  const danger = pct > 90 || total > currentBudget;

  const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

  // Danh mục chi phí theo hạng mục từ backend nếu có plan
  const theoHangMuc = plan?.tongKet.theoHangMuc;
  const cats = theoHangMuc
    ? [
        {
          label: "Di chuyển",
          amount: theoHangMuc["Di chuyển"] ?? 0,
          pct: total > 0 ? Math.round(((theoHangMuc["Di chuyển"] ?? 0) / total) * 100) : 0,
          colorVar: "var(--p500)",
        },
        {
          label: "Chỗ ở",
          amount: theoHangMuc["Chỗ ở"] ?? 0,
          pct: total > 0 ? Math.round(((theoHangMuc["Chỗ ở"] ?? 0) / total) * 100) : 0,
          colorVar: "var(--secondary-500)",
        },
        {
          label: "Ăn uống",
          amount: theoHangMuc["Ăn uống"] ?? 0,
          pct: total > 0 ? Math.round(((theoHangMuc["Ăn uống"] ?? 0) / total) * 100) : 0,
          colorVar: "var(--warning)",
        },
        {
          label: "Vui chơi",
          amount: theoHangMuc["Vui chơi"] ?? 0,
          pct: total > 0 ? Math.round(((theoHangMuc["Vui chơi"] ?? 0) / total) * 100) : 0,
          colorVar: "var(--status-loading)",
        },
      ]
    : [
        { label: "Di chuyển", amount: 3_920_000, pct: 41, colorVar: "var(--p500)" },
        { label: "Chỗ ở", amount: 2_200_000, pct: 23, colorVar: "var(--secondary-500)" },
        { label: "Ăn uống", amount: 1_800_000, pct: 19, colorVar: "var(--warning)" },
        { label: "Vui chơi", amount: 1_620_000, pct: 17, colorVar: "var(--status-loading)" },
      ];

  // Tính thời gian di chuyển
  const moveMinutes = plan?.tongKet.tongThoiGianDiChuyenPhut ?? 170;
  const moveHours = Math.floor(moveMinutes / 60);
  const moveRemainingMin = moveMinutes % 60;
  const moveStr =
    moveHours > 0
      ? `${moveHours} giờ ${moveRemainingMin > 0 ? moveRemainingMin + " phút" : ""}`
      : `${moveRemainingMin} phút`;

  return (
    <div className="BudgetSummary">
      <div className="Label">Tổng kế hoạch</div>
      <div className="Big">{fmt(total)}</div>
      <div className="BigSub">trên ngân sách {fmt(currentBudget)}</div>

      <div className="bar-track" style={{ marginBottom: 4 }}>
        <div
          className={`bar-fill ${danger ? "danger" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="bar-remain">
        <span
          style={{
            fontWeight: 600,
            color: danger ? "var(--warning)" : "var(--p500)",
          }}
        >
          {total > currentBudget
            ? `Vượt ngân sách ${fmt(total - currentBudget)}`
            : `Đã dùng ${pct.toFixed(1)}%`}
        </span>
        <span style={{ color: "var(--g500)" }}>
          {total > currentBudget ? `Âm ${fmt(remain)}` : `Còn lại ${fmt(remain)}`}
        </span>
      </div>

      {showDetails &&
        cats.map((c) => (
          <div key={c.label} className="cat-row">
            <div className="cat-head">
              <span style={{ color: "var(--g700)" }}>{c.label}</span>
              <span style={{ fontWeight: 600 }}>{fmt(c.amount)}</span>
            </div>
            <div className="cat-bar">
              <div
                className="cat-bar-fill"
                style={{ width: `${c.pct}%`, background: c.colorVar }}
              />
            </div>
          </div>
        ))}

      <div className="divider" />
      <div className="move-row">
        <span>Tổng thời gian di chuyển</span>
        <span style={{ fontWeight: 600, color: "var(--navy)" }}>{moveStr}</span>
      </div>
      <div
        style={{
          marginTop: 16,
          fontSize: 12,
          color: "var(--g400)",
          lineHeight: 1.5,
        }}
      >
        Mỗi thay đổi sẽ cho bạn xem trước (trước và sau) rồi mới áp dụng.
      </div>
    </div>
  );
}
