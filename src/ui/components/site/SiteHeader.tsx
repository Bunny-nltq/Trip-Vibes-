"use client";
import React from "react";
import Link from "next/link";
import { Compass, ArrowRight, BookOpen } from "lucide-react";

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
      {/* Logo "Trip Vibes" (Clean Enterprise) */}
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "var(--r-md)",
            background: "var(--color-primary-main)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-primary-text)",
          }}
        >
          <Compass size={20} strokeWidth={2.2} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.4px",
              color: "var(--color-text)",
              lineHeight: 1.1,
            }}
          >
            Trip Vibes
          </span>
          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-sub)" }}>
            Hệ thống lập kế hoạch du lịch
          </span>
        </div>
      </Link>

      {/* Liên kết: Trang chủ, Điểm đến, Lịch trình mẫu, Khách sạn */}
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
          href="/lich-trinh"
          style={{
            textDecoration: "none",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-text-sub)",
            transition: "color 0.15s",
          }}
        >
          Lịch trình mẫu
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

      {/* Nút Nhật ký chuyến đi & Lập kế hoạch */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link
          href="/lap-ke-hoach?screen=saved-trips"
          style={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 40,
            padding: "0 14px",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            color: "var(--color-text)",
            fontSize: 14,
            fontWeight: 600,
            transition: "all 0.15s",
          }}
        >
          <BookOpen size={16} color="var(--color-primary-main)" />
          <span>Nhật ký chuyến đi</span>
        </Link>
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
