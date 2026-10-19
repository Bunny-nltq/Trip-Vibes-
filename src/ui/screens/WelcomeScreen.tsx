"use client";
import React from "react";
import { useApp } from "@/ui/context/AppContext";

export function WelcomeScreen() {
  const { nav } = useApp();

  const features = [
    { icon: "📋", title: "Kế hoạch có giá", sub: "Phương tiện, khách sạn, hoạt động rõ ràng" },
    { icon: "👀", title: "Xem trước thay đổi", sub: "Biết trước tiền và thời gian trước khi áp dụng" },
    { icon: "📷", title: "Theo dõi chi tiêu", sub: "Chụp bill, AI đọc giúp — bạn xác nhận" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 100%)", display: "flex", flexDirection: "column" }}>
      {/* Hero */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
        
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#3B82F6,#14B8A6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(59,130,246,0.3)" }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 4l2.5 5h5l-4 3 1.5 5L14 14l-5 3 1.5-5-4-3h5z" fill="white" />
            </svg>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, background: "linear-gradient(135deg,#3B82F6,#14B8A6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: -1 }}>
            Trip Vibes
          </div>
        </div>

        <h1 style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.15, color: "#0F172A", marginBottom: 16, maxWidth: 660, letterSpacing: -1.5 }}>
          Lập kế hoạch du lịch,{" "}
          <span style={{ background: "linear-gradient(135deg,#3B82F6,#14B8A6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            giữ đúng ngân sách
          </span>
        </h1>
        <p style={{ fontSize: 17, color: "#64748B", maxWidth: 520, marginBottom: 48, lineHeight: 1.7 }}>
          Chọn vài nút bấm là có kế hoạch đầy đủ giá. Xem trước mọi thay đổi và theo dõi chi tiêu thực tế.
        </p>

        {/* Feature cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: 720, width: "100%", marginBottom: 48 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: "white", borderRadius: 16, padding: "24px 20px", border: "1px solid #DBEAFE", boxShadow: "0 4px 16px rgba(59,130,246,0.07)", textAlign: "left", transition: "transform 0.2s" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0F172A", marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>{f.sub}</div>
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary btn-lg"
          style={{ minWidth: 280, fontSize: 17, boxShadow: "0 8px 24px rgba(59,130,246,0.35)" }}
          onClick={() => nav("b1-chon-nhanh")}
        >
          ✈️ &nbsp; Bắt đầu lập kế hoạch
        </button>
        <div style={{ marginTop: 14 }}>
          <span className="text-link" onClick={() => nav("login")}>Đăng nhập</span>
        </div>
        <div style={{ marginTop: 28, fontSize: 12, color: "#94A3B8" }}>
          Bản mô phỏng · Dùng dữ liệu mẫu · Không đặt vé thật
        </div>
      </div>
    </div>
  );
}
