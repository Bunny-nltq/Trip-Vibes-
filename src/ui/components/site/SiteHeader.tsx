"use client";
import React from "react";
import Link from "next/link";
import { Compass, Sparkles, User, ArrowRight } from "lucide-react";

export interface SiteHeaderProps {
  onNavigatePlan?: () => void;
}

export function SiteHeader({ onNavigatePlan }: SiteHeaderProps) {
  return (
    <header className="site-header" style={{
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
      boxShadow: "0 1px 8px rgba(43, 85, 214, 0.05)"
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: "var(--r-md)",
          background: "linear-gradient(135deg, var(--color-primary-main), var(--color-secondary-500))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-primary-text)"
        }}>
          <Compass size={22} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, var(--color-primary-main), var(--color-secondary-500))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Trip Vibes
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-sub)", marginTop: -3, letterSpacing: "0.5px" }}>
            AI TRAVEL AGENT
          </span>
        </div>
      </Link>

      {/* Navigation links */}
      <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <a href="#diem-den" style={{
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--color-text-sub)",
          transition: "color 0.15s"
        }}>
          Điểm đến
        </a>
        <a href="#tinh-nang" style={{
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--color-text-sub)",
          transition: "color 0.15s"
        }}>
          Tính năng
        </a>
        <a href="#tro-giup" style={{
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--color-text-sub)",
          transition: "color 0.15s"
        }}>
          Trợ giúp
        </a>
      </nav>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Đăng nhập (nhãn Sắp có) */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: "var(--r-md)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface-sub)",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--color-text-sub)",
          cursor: "default"
        }}>
          <User size={15} />
          <span>Đăng nhập</span>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: "var(--r-full)",
            background: "var(--color-status-warn-bg)",
            color: "var(--color-status-warn-text)"
          }}>
            Sắp có
          </span>
        </div>

        {/* Nút Lập kế hoạch */}
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
            transition: "all 0.15s"
          }}
        >
          <Sparkles size={16} />
          <span>Lập kế hoạch</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </header>
  );
}
