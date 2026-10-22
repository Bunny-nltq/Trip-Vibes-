"use client";
import React from "react";
import Link from "next/link";
import { Database, MapPin } from "lucide-react";
import { SiteHeader } from "@/ui/components/site/SiteHeader";
import { SiteFooter } from "@/ui/components/site/SiteFooter";
import { ThuDiemDen, type DiemDenThe } from "@/ui/components/site/ThuDiemDen";

export interface DiemDenDanhSachScreenProps {
  diemDens: DiemDenThe[];
  ngayDuLieu?: string;
}

export function DiemDenDanhSachScreen({
  diemDens,
  ngayDuLieu = "20/10/2026",
}: DiemDenDanhSachScreenProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-background)",
        color: "var(--color-text)",
        fontSize: 16,
      }}
    >
      <SiteHeader />

      <main id="main-content" style={{ flex: 1 }}>
        {/* Banner tiêu đề */}
        <section
          style={{
            background: "linear-gradient(180deg, var(--color-surface) 0%, var(--color-background) 100%)",
            padding: "48px 24px 32px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-primary-main)",
                marginBottom: 16,
              }}
            >
              <Link href="/" style={{ color: "var(--color-text-sub)", textDecoration: "none" }}>
                Trang chủ
              </Link>
              <span>/</span>
              <span style={{ color: "var(--color-primary-main)" }}>Điểm đến</span>
            </div>

            <h1
              style={{
                fontSize: "clamp(32px, 4vw, 44px)",
                fontWeight: 800,
                lineHeight: 1.2,
                color: "var(--color-text)",
                marginBottom: 12,
              }}
            >
              Khám phá điểm đến
            </h1>

            <p
              style={{
                fontSize: 16,
                lineHeight: 1.6,
                color: "var(--color-text-sub)",
                margin: 0,
              }}
            >
              Khám phá các điểm đến du lịch được hỗ trợ chính thức với dữ liệu địa điểm, ẩm thực và lưu trú minh bạch.
            </p>
          </div>
        </section>

        {/* Lưới điểm đến */}
        <section
          style={{
            maxWidth: 1200,
            margin: "32px auto 56px",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MapPin size={20} color="var(--color-primary-main)" />
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)" }}>
                {diemDens.length} điểm đến chính thức
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text-sub)" }}>
              Cập nhật ngày {ngayDuLieu}
            </div>
          </div>

          <ThuDiemDen diemDens={diemDens} />
        </section>

        {/* Dải minh bạch dữ liệu */}
        <section
          style={{
            maxWidth: 1200,
            margin: "0 auto 24px",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--r-lg)",
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              fontSize: 15,
              color: "var(--color-text-sub)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Database size={18} color="var(--color-primary-main)" />
              <span>Dữ liệu: OpenStreetMap contributors. Giá là ước tính.</span>
            </div>
            <Link
              href="/"
              style={{
                color: "var(--color-primary-main)",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: 15,
              }}
            >
              Về trang chủ →
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter ngayDuLieu={ngayDuLieu} />
    </div>
  );
}
