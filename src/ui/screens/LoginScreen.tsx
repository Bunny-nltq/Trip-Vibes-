"use client";
import React, { useState } from "react";
import { useApp } from "@/ui/context/AppContext";

export function LoginScreen() {
  const { nav } = useApp();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  return (
    <div className="Landing" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="AuthCard" style={{ padding: "40px 36px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <svg width="44" height="36" viewBox="0 0 62 48" aria-hidden="true">
              <circle cx="43" cy="16" r="10" fill="var(--color-art-sun)" />
              <path d="M2 44 22 14l11 16 7-9 20 23z" fill="var(--color-art-mountain1)" />
              <path d="M12 44 30 22l10 14 6-8 14 16z" fill="var(--color-art-mountain2)" />
              <path d="M2 44h58" stroke="var(--color-art-line)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="LogoName Script" style={{ fontSize: 32 }}>Trip Vibes</div>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)" }}>Đăng nhập</h2>
          <p style={{ fontSize: 13, color: "var(--color-text-sub)", marginTop: 4 }}>
            Đăng nhập để lưu kế hoạch và theo dõi chi tiêu chuyến đi.
          </p>
        </div>

        <div className="Field">
          <label className="FieldLabel">Email</label>
          <input
            className="Input"
            type="email"
            placeholder="ban@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="Field">
          <label className="FieldLabel">Mật khẩu</label>
          <input
            className="Input"
            type="password"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <div className="Hint" style={{ textAlign: "right" }}>
            <span className="Link">Quên mật khẩu?</span>
          </div>
        </div>

        <button
          type="button"
          className="Btn BtnPrimary BtnFull"
          style={{ marginBottom: 12, height: 46 }}
          onClick={() => nav("b1-chon-nhanh")}
        >
          Đăng nhập
        </button>

        <button
          type="button"
          className="Btn BtnFull"
          style={{ height: 46, gap: 10 }}
          onClick={() => nav("b1-chon-nhanh")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="var(--color-art-google-blue)"
              d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
            />
            <path
              fill="var(--color-art-google-green)"
              d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"
            />
            <path
              fill="var(--color-art-google-yellow)"
              d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
            />
            <path
              fill="var(--color-art-google-red)"
              d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
            />
          </svg>
          Tiếp tục với Google
        </button>

        <div style={{ textAlign: "center", marginTop: 22 }}>
          <span className="Link" onClick={() => nav("b1-chon-nhanh")}>
            Dùng thử không cần tài khoản
          </span>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
