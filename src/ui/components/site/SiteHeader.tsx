"use client";
import React from "react";
import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";

export interface SiteHeaderProps {
  onNavigatePlan?: () => void;
}

export function SiteHeader({ onNavigatePlan }: SiteHeaderProps) {
  return (
    <header
      className="site-header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 72,
        padding: "0 32px",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 8px rgba(43, 85, 214, 0.05)",
      }}
    >
      {/* Logo "Trip Vibes" (bỏ phụ đề) */}
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--r-md)",
            background: "linear-gradient(135deg, var(--color-primary-main), var(--color-secondary-500))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-primary-text)",
          }}
        >
          <Compass size={22} />
        </div>
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, var(--color-primary-main), var(--color-secondary-500))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Trip Vibes
        </span>
      </Link>

      {/* Liên kết: Trang chủ, Điểm đến, Khách sạn */}
      <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <Link
          href="/"
          style={{
            textDecoration: "none",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-text)",
            transition: "color 0.15s",
          }}
        >
          Trang chủ
        </Link>
        <Link
          href="/diem-den"
          style={{
            textDecoration: "none",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-text-sub)",
            transition: "color 0.15s",
          }}
        >
          Điểm đến
        </Link>
        <Link
          href="/khach-san"
          style={{
            textDecoration: "none",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-text-sub)",
            transition: "color 0.15s",
          }}
        >
          Khách sạn
        </Link>
      </nav>

      {/* Nút Lập kế hoạch */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href="/lap-ke-hoach"
          onClick={onNavigatePlan}
          style={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 40,
            padding: "0 18px",
            borderRadius: "var(--r-md)",
            background: "var(--color-primary-main)",
            color: "var(--color-primary-text)",
            fontSize: 14,
            fontWeight: 700,
            boxShadow: "0 2px 8px rgba(43, 85, 214, 0.25)",
            transition: "all 0.15s",
          }}
        >
          <span>Lập kế hoạch</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </header>
  );
}
