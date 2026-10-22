"use client";
import React from "react";
import { useApp } from "@/ui/context/AppContext";
import { MapPin, Receipt, Wallet } from "lucide-react";

export interface NhatKyTabBarProps {
  activeTab: "hanh-trinh" | "chi-tieu" | "ngan-sach";
}

export function NhatKyTabBar({ activeTab }: NhatKyTabBarProps) {
  const { nav, openB10 } = useApp();

  return (
    <div
      role="tablist"
      aria-label="Nhật ký chuyến đi"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--r-xl)",
        padding: "6px 8px",
        marginBottom: 20,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
      }}
    >
      {/* Tab 1: Hành trình (B8) */}
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "hanh-trinh"}
        onClick={() => nav("b8-chuyen-di")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 18px",
          borderRadius: "var(--r-lg)",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 700,
          background: activeTab === "hanh-trinh" ? "var(--color-primary-main)" : "transparent",
          color: activeTab === "hanh-trinh" ? "var(--color-primary-text)" : "var(--color-text-sub)",
          transition: "all 0.15s ease",
        }}
      >
        <MapPin size={16} />
        <span>Hành trình</span>
      </button>

      {/* Tab 2: Chi tiêu (B10) */}
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "chi-tieu"}
        onClick={() => openB10()}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 18px",
          borderRadius: "var(--r-lg)",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 700,
          background: activeTab === "chi-tieu" ? "var(--color-primary-main)" : "transparent",
          color: activeTab === "chi-tieu" ? "var(--color-primary-text)" : "var(--color-text-sub)",
          transition: "all 0.15s ease",
        }}
      >
        <Receipt size={16} />
        <span>Chi tiêu</span>
      </button>

      {/* Tab 3: Ngân sách (B11) */}
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "ngan-sach"}
        onClick={() => nav("b11-ngan-sach")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 18px",
          borderRadius: "var(--r-lg)",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 700,
          background: activeTab === "ngan-sach" ? "var(--color-primary-main)" : "transparent",
          color: activeTab === "ngan-sach" ? "var(--color-primary-text)" : "var(--color-text-sub)",
          transition: "all 0.15s ease",
        }}
      >
        <Wallet size={16} />
        <span>Ngân sách</span>
      </button>
    </div>
  );
}
