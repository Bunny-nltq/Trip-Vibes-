import React from "react";
import Link from "next/link";
import { Compass, Home, MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-background)",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--r-2xl)",
          padding: "48px 32px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "var(--r-full)",
            background: "var(--color-primary-tint)",
            color: "var(--color-primary-main)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Compass size={32} />
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "var(--color-text)",
            marginBottom: 12,
          }}
        >
          404 - Lạc đường rồi!
        </h1>

        <p
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--color-text-sub)",
            marginBottom: 28,
          }}
        >
          Trang bạn tìm kiếm không tồn tại hoặc đã được thay đổi địa chỉ. Hãy quay
          lại trang chủ hoặc bắt đầu lập kế hoạch cho chuyến đi mới.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 20px",
              borderRadius: "var(--r-lg)",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <Home size={16} />
            <span>Về Trang chủ</span>
          </Link>

          <Link
            href="/lap-ke-hoach"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 20px",
              borderRadius: "var(--r-lg)",
              background: "var(--color-primary-main)",
              color: "var(--color-text-inverse)",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <MapPin size={16} />
            <span>Lập kế hoạch</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
