"use client";
import React from "react";
import Link from "next/link";
import { Compass, ShieldCheck } from "lucide-react";

export interface SiteFooterProps {
  ngayDuLieu?: string;
  onOpenGioiHan?: () => void;
}

export function SiteFooter({ ngayDuLieu = "20/10/2026", onOpenGioiHan }: SiteFooterProps) {
  return (
    <footer
      style={{
        background: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        padding: "56px 24px 36px",
        marginTop: 64,
        color: "var(--color-text)",
        fontSize: 16,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 40,
        }}
      >
        {/* Cột 1: Điểm đến */}
        <div>
          <h4
            style={{
              fontSize: 18,
              fontWeight: 800,
              marginBottom: 18,
              color: "var(--color-text)",
            }}
          >
            Điểm đến
          </h4>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              fontSize: 16,
            }}
          >
            <li>
              <Link
                href="/diem-den/da-nang"
                style={{ color: "var(--color-text-sub)", textDecoration: "none", transition: "color 0.15s" }}
              >
                Đà Nẵng · Việt Nam
              </Link>
            </li>
            <li>
              <Link
                href="/diem-den/ha-noi"
                style={{ color: "var(--color-text-sub)", textDecoration: "none", transition: "color 0.15s" }}
              >
                Hà Nội · Việt Nam
              </Link>
            </li>
            <li>
              <Link
                href="/diem-den/da-lat"
                style={{ color: "var(--color-text-sub)", textDecoration: "none", transition: "color 0.15s" }}
              >
                Đà Lạt · Việt Nam
              </Link>
            </li>
            <li>
              <Link
                href="/diem-den/bangkok"
                style={{ color: "var(--color-text-sub)", textDecoration: "none", transition: "color 0.15s" }}
              >
                Bangkok · Thái Lan
              </Link>
            </li>
            <li>
              <Link
                href="/diem-den/seoul"
                style={{ color: "var(--color-text-sub)", textDecoration: "none", transition: "color 0.15s" }}
              >
                Seoul · Hàn Quốc
              </Link>
            </li>
          </ul>
        </div>

        {/* Cột 2: Khách sạn */}
        <div>
          <h4
            style={{
              fontSize: 18,
              fontWeight: 800,
              marginBottom: 18,
              color: "var(--color-text)",
            }}
          >
            Khách sạn
          </h4>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              fontSize: 16,
            }}
          >
            <li>
              <Link
                href="/khach-san?diem-den=da-nang"
                style={{ color: "var(--color-text-sub)", textDecoration: "none", transition: "color 0.15s" }}
              >
                Khách sạn tại Đà Nẵng
              </Link>
            </li>
            <li>
              <Link
                href="/khach-san?diem-den=ha-noi"
                style={{ color: "var(--color-text-sub)", textDecoration: "none", transition: "color 0.15s" }}
              >
                Khách sạn tại Hà Nội
              </Link>
            </li>
            <li>
              <Link
                href="/khach-san?diem-den=da-lat"
                style={{ color: "var(--color-text-sub)", textDecoration: "none", transition: "color 0.15s" }}
              >
                Khách sạn tại Đà Lạt
              </Link>
            </li>
            <li>
              <Link
                href="/khach-san?diem-den=bangkok"
                style={{ color: "var(--color-text-sub)", textDecoration: "none", transition: "color 0.15s" }}
              >
                Khách sạn tại Bangkok
              </Link>
            </li>
            <li>
              <Link
                href="/khach-san?diem-den=seoul"
                style={{ color: "var(--color-text-sub)", textDecoration: "none", transition: "color 0.15s" }}
              >
                Khách sạn tại Seoul
              </Link>
            </li>
          </ul>
        </div>

        {/* Cột 3: Thông tin */}
        <div>
          <h4
            style={{
              fontSize: 18,
              fontWeight: 800,
              marginBottom: 18,
              color: "var(--color-text)",
            }}
          >
            Thông tin
          </h4>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              fontSize: 16,
              color: "var(--color-text-sub)",
              lineHeight: 1.6,
            }}
          >
            <div>
              <strong style={{ color: "var(--color-text)" }}>Dữ liệu:</strong> OpenStreetMap contributors
            </div>
            <div>
              <strong style={{ color: "var(--color-text)" }}>Cập nhật:</strong> {ngayDuLieu}
            </div>
            <div>
              <Link
                href="/gioi-han"
                style={{
                  color: "var(--color-primary-main)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Giới hạn dữ liệu & pháp lý
              </Link>
            </div>
            <div>
              <Link
                href="/tro-giup"
                style={{
                  color: "var(--color-text-sub)",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
              >
                Trợ giúp & Hướng dẫn
              </Link>
            </div>
            <div>
              <Link
                href="/nguon-anh"
                style={{
                  color: "var(--color-text-sub)",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
              >
                Nguồn ảnh & Bản quyền
              </Link>
            </div>
            <div>
              <Link
                href="/lich-trinh"
                style={{
                  color: "var(--color-text-sub)",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
              >
                Lịch trình mẫu 3N2Đ
              </Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-status-success)" }}>
              <ShieldCheck size={18} />
              <span style={{ fontSize: 14 }}>Ảnh bill chỉ xử lý trong bộ nhớ</span>
            </div>
            <div style={{ paddingTop: 4 }}>
              <Link
                href="/lap-ke-hoach"
                style={{
                  color: "var(--color-primary-main)",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Bắt đầu lập lịch trình →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dòng bản quyền & pháp lý */}
      <div
        style={{
          maxWidth: 1200,
          margin: "44px auto 0",
          paddingTop: 24,
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          fontSize: 14,
          color: "var(--color-text-sub)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "var(--r-sm)",
              background: "linear-gradient(135deg, var(--color-primary-main), var(--color-secondary-500))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary-text)",
            }}
          >
            <Compass size={14} />
          </div>
          <span>Bản quyền 2026 Trip Vibes. Dự án lập kế hoạch du lịch theo ngân sách.</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/dieu-khoan" style={{ color: "var(--color-text-sub)", textDecoration: "none" }}>
            Điều khoản
          </Link>
          <span>•</span>
          <Link href="/quyen-rieng-tu" style={{ color: "var(--color-text-sub)", textDecoration: "none" }}>
            Quyền riêng tư
          </Link>
          <span>•</span>
          <span>Dữ liệu: OpenStreetMap contributors. Giá là ước tính.</span>
        </div>
      </div>
    </footer>
  );
}
