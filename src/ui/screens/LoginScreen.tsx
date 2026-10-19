"use client";
import React, { useState } from "react";
import { useApp } from "@/ui/context/AppContext";

export function LoginScreen() {
  const { nav } = useApp();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#EFF6FF,#F0FDFA)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 20, padding: 40, width: "100%", maxWidth: 420, boxShadow: "0 16px 48px rgba(59,130,246,0.1)", border: "1px solid #DBEAFE" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 900, background: "linear-gradient(135deg,#3B82F6,#14B8A6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 6 }}>
            Trip Vibes
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>Đăng nhập</div>
          <div style={{ fontSize: 14, color: "#64748B", marginTop: 4 }}>Đăng nhập để lưu kế hoạch của bạn.</div>
        </div>

        <div className="field">
          <div className="field-label">Email</div>
          <input className="input" placeholder="ban@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <div className="field-label">Mật khẩu</div>
          <input className="input" type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} />
          <div className="hint" style={{ marginTop: 6 }}>
            <span className="text-link">Quên mật khẩu?</span>
          </div>
        </div>

        <button className="btn btn-primary btn-full" style={{ marginBottom: 10, fontSize: 15, height: 48 }}>
          Đăng nhập
        </button>
        <button className="btn btn-outline btn-full" style={{ height: 48, gap: 10, fontSize: 15 }}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"/><path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/><path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
          Tiếp tục với Google
        </button>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <span className="text-link" onClick={() => nav("b1-chon-nhanh")}>Dùng thử không cần tài khoản</span>
        </div>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 13, color: "#64748B" }}>
          Chưa có tài khoản?{" "}
          <span className="text-link">Tạo tài khoản</span>
        </div>
      </div>
    </div>
  );
}
