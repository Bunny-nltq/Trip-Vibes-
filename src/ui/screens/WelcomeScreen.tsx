"use client";
import React from "react";
import { useApp } from "@/ui/context/AppContext";

export function WelcomeScreen() {
  const { nav } = useApp();

  const features = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2B55D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
        </svg>
      ),
      title: "Kế hoạch có giá",
      sub: "Phương tiện, khách sạn, hoạt động rõ ràng minh bạch",
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2B55D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      ),
      title: "Xem trước thay đổi",
      sub: "Biết trước chi phí và thời gian trước khi áp dụng",
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2B55D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
          <circle cx="12" cy="13" r="3"/>
        </svg>
      ),
      title: "Theo dõi chi tiêu",
      sub: "Chụp bill, AI đọc giúp — bạn kiểm tra và xác nhận",
    },
  ];

  return (
    <div className="Landing" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Header */}
      <header className="LandTop">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="48" height="38" viewBox="0 0 62 48" aria-hidden="true">
            <circle cx="43" cy="16" r="10" fill="#FFC24D" />
            <path d="M2 44 22 14l11 16 7-9 20 23z" fill="#2FA7B5" />
            <path d="M12 44 30 22l10 14 6-8 14 16z" fill="#3B82C4" />
            <path d="M2 44h58" stroke="#1F3A7A" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div>
            <div className="LogoName Script">Trip Vibes</div>
            <div className="LogoSub">Plan your next adventure</div>
          </div>
        </div>

        <div>
          <button
            type="button"
            className="Btn BtnSmall"
            onClick={() => nav("login")}
          >
            Đăng nhập
          </button>
        </div>
      </header>

      {/* Main Landing Card */}
      <main className="LandCard" style={{ padding: "64px 48px", textAlign: "center", marginTop: 24, marginBottom: 40 }}>
        <h1
          style={{
            fontSize: 42,
            lineHeight: 1.2,
            fontWeight: 800,
            color: "#1F2A44",
            marginBottom: 16,
            letterSpacing: -0.5,
          }}
        >
          Lập kế hoạch du lịch,{" "}
          <span style={{ color: "#2B55D6" }}>
            giữ đúng ngân sách
          </span>
        </h1>
        <p style={{ fontSize: 16, color: "#5C6B88", maxWidth: 580, margin: "0 auto 40px", lineHeight: 1.6 }}>
          Chọn vài nút bấm là có kế hoạch đầy đủ giá vé, chỗ ở và lịch trình. Xem trước mọi thay đổi và theo dõi chi tiêu thực tế thông minh.
        </p>

        {/* 3 Features */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            maxWidth: 820,
            margin: "0 auto 44px",
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: "#F6F9FE",
                borderRadius: 22,
                padding: "26px 20px",
                border: "1px solid #DCE6F5",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1F2A44", marginBottom: 6 }}>
                {f.title}
              </div>
              <div style={{ fontSize: 13, color: "#5C6B88", lineHeight: 1.5 }}>
                {f.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <button
          type="button"
          className="Btn BtnPrimary"
          style={{
            height: 52,
            padding: "0 36px",
            fontSize: 16,
            borderRadius: 26,
            margin: "0 auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
          onClick={() => nav("b1-chon-nhanh")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
          </svg>
          <span>Bắt đầu lập kế hoạch ngay</span>
        </button>

        <div style={{ marginTop: 28, fontSize: 12, color: "#8593AE" }}>
          Bản mô phỏng AI Agent · Nguồn dữ liệu minh bạch · Không lưu giữ ảnh hóa đơn trên đĩa
        </div>
      </main>
    </div>
  );
}

export default WelcomeScreen;
