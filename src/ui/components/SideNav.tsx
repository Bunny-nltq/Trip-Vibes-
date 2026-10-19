"use client";
import React from "react";
import { useApp } from "@/ui/context/AppContext";

const ICON: Record<string, string> = {
  "b3-ke-hoach": "🗺",
  "b8-chuyen-di": "✈️",
  "b11-ngan-sach": "💰",
};

export function SideNav() {
  const { screen, confirmed, nav } = useApp();

  const items = [
    { id: "b3-ke-hoach", label: "Kế hoạch", locked: false },
    { id: "b8-chuyen-di", label: "Chuyến đi", locked: !confirmed },
    { id: "b11-ngan-sach", label: "Ngân sách", locked: !confirmed },
  ] as const;

  return (
    <div className="tv-sidenav">
      {items.map(item => (
        <div
          key={item.id}
          className={`tv-navitem ${screen === item.id ? "active" : ""} ${item.locked ? "locked" : ""}`}
          onClick={() => !item.locked && nav(item.id as Parameters<typeof nav>[0])}
        >
          <span>{ICON[item.id]}</span>
          <span>{item.label}</span>
        </div>
      ))}
      {!confirmed && (
        <div style={{ marginTop: 16, padding: "0 14px", fontSize: 12, color: "var(--g400)", lineHeight: 1.5 }}>
          Chuyến đi và Ngân sách mở sau khi xác nhận kế hoạch.
        </div>
      )}
    </div>
  );
}
