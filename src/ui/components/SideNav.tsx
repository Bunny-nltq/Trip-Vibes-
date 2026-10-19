"use client";
import React from "react";
import { useApp } from "@/ui/context/AppContext";
import { Map, Compass, Wallet, Lock } from "lucide-react";

export function SideNav() {
  const { screen, confirmed, nav } = useApp();

  const items = [
    {
      id: "b3-ke-hoach",
      label: "Kế hoạch",
      locked: false,
      icon: <Map size={18} />,
    },
    {
      id: "b8-chuyen-di",
      label: "Chuyến đi",
      locked: !confirmed,
      icon: <Compass size={18} />,
    },
    {
      id: "b11-ngan-sach",
      label: "Ngân sách",
      locked: !confirmed,
      icon: <Wallet size={18} />,
    },
  ] as const;

  return (
    <div className="tv-sidenav">
      {items.map((item) => (
        <div
          key={item.id}
          className={`tv-navitem ${screen === item.id ? "active" : ""} ${
            item.locked ? "locked" : ""
          }`}
          onClick={() => !item.locked && nav(item.id as Parameters<typeof nav>[0])}
          style={{
            cursor: item.locked ? "not-allowed" : "pointer",
            opacity: item.locked ? 0.45 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
          {item.locked && <Lock size={13} style={{ color: "var(--g400)" }} />}
        </div>
      ))}
      {!confirmed && (
        <div
          style={{
            marginTop: 16,
            padding: "0 14px",
            fontSize: 12,
            color: "var(--g400)",
            lineHeight: 1.5,
          }}
        >
          Chuyến đi và Ngân sách mở sau khi xác nhận kế hoạch.
        </div>
      )}
    </div>
  );
}
