"use client";
import React from "react";
import Link from "next/link";
import { Compass, ShieldCheck, MapPin, Database } from "lucide-react";

export interface SiteFooterProps {
  ngayDuLieu?: string;
}

export function SiteFooter({ ngayDuLieu = "20/10/2026" }: SiteFooterProps) {
  return (
    <footer style={{
      background: "var(--color-surface)",
      borderTop: "1px solid var(--color-border)",
      padding: "48px 32px 32px",
      marginTop: 64,
      color: "var(--color-text)"
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 36
      }}>
        {/* Cột 1: Thông tin Trip Vibes */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "var(--r-md)",
              background: "linear-gradient(135deg, var(--color-primary-main), var(--color-secondary-500))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary-text)"
            }}>
              <Compass size={18} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)" }}>
              Trip Vibes
            </span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--color-text-sub)", margin: 0 }}>
            AI Agent lập kế hoạch du lịch thông minh, tối ưu ngân sách thực tế và minh bạch nguồn gốc dữ liệu.
          </p>
        </div>

        {/* Cột 2: Điểm đến */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "var(--color-text)" }}>
            Điểm đến hỗ trợ
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "var(--color-text-sub)" }}>
            <li>Đà Nẵng · Việt Nam</li>
            <li>Hà Nội · Việt Nam</li>
            <li>Đà Lạt · Việt Nam</li>
            <li>Bangkok · Thái Lan</li>
            <li>Seoul · Hàn Quốc</li>
          </ul>
        </div>

        {/* Cột 3: Hỗ trợ & Trợ giúp */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "var(--color-text)" }}>
            Hỗ trợ & Hướng dẫn
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "var(--color-text-sub)" }}>
            <li>
              <a href="#tro-giup" style={{ color: "var(--color-text-sub)", textDecoration: "none" }}>
                Câu hỏi thường gặp
              </a>
            </li>
            <li>
              <a href="#tinh-nang" style={{ color: "var(--color-text-sub)", textDecoration: "none" }}>
                Cách hoạt động
              </a>
            </li>
            <li>
              <Link href="/lap-ke-hoach" style={{ color: "var(--color-primary-main)", textDecoration: "none", fontWeight: 600 }}>
                Bắt đầu lập lịch trình
              </Link>
            </li>
          </ul>
        </div>

        {/* Cột 4: Pháp lý và Nguồn dữ liệu */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "var(--color-text)", display: "flex", alignItems: "center", gap: 6 }}>
            <Database size={15} style={{ color: "var(--color-primary-main)" }} />
            <span>Pháp lý & Nguồn</span>
          </h4>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--color-text-sub)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
              <strong>Dữ liệu:</strong> OpenStreetMap contributors
            </div>
            <div>
              <strong>Ngày dữ liệu:</strong> {ngayDuLieu}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-status-success)" }}>
              <ShieldCheck size={16} />
              <span>Ảnh bill chỉ xử lý trong bộ nhớ</span>
            </div>
            <div>
              Giá hiển thị là ước tính tham khảo, không đặt vé thật.
            </div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: 1200,
        margin: "36px auto 0",
        paddingTop: 20,
        borderTop: "1px solid var(--color-border)",
        textAlign: "center",
        fontSize: 12,
        color: "var(--color-text-sub)"
      }}>
        Bản quyền 2026 Trip Vibes. Dự án ứng dụng AI Agent du lịch tuân thủ chuẩn minh bạch dữ liệu.
      </div>
    </footer>
  );
}
