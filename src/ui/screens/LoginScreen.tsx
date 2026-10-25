"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/ui/context/AppContext";
import {
  LogIn,
  UserPlus,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export function LoginScreen() {
  const {
    nav,
    loginUser,
    returnScreen,
    setReturnScreen,
    pendingSaveTrip,
    setPendingSaveTrip,
    saveCurrentTripToAccount,
  } = useApp();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDemoNotice(null);
    if (!email.trim() || !pass) {
      setError("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }

    setLoading(true);
    const result = await loginUser(email.trim(), pass);
    setLoading(false);

    if (result.ok) {
      if (pendingSaveTrip) {
        setPendingSaveTrip(false);
        await saveCurrentTripToAccount();
        nav("saved-trips");
      } else if (returnScreen && returnScreen !== "login" && returnScreen !== "register") {
        const dest = returnScreen;
        setReturnScreen(null);
        nav(dest);
      } else {
        nav("saved-trips");
      }
    } else {
      setError(result.message || "Email hoặc mật khẩu không chính xác.");
    }
  };

  const handleFillDemo = () => {
    setEmail("khachhang@tripvibes.vn");
    setPass("123456");
    setError(null);
    setDemoNotice("Đã điền tài khoản thử nghiệm mẫu. Bạn có thể bấm Đăng nhập ngay!");
    setTimeout(() => setDemoNotice(null), 4000);
  };

  return (
    <div
      className="Landing"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
      }}
    >
      {/* Nút quay lại */}
      <div
        style={{
          maxWidth: 440,
          width: "100%",
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-text-sub)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={14} />
          <span>Trang chủ</span>
        </Link>

        {returnScreen && returnScreen !== "login" && returnScreen !== "register" && (
          <button
            type="button"
            onClick={() => nav(returnScreen)}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary-main)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>Quay lại chuyến đi</span>
            <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
          </button>
        )}
      </div>

      <div className="AuthCard" style={{ padding: "36px 32px", maxWidth: 440, width: "100%" }}>
        {/* Logo & Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
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
            Đăng nhập để xem nhật ký các chuyến đi và lưu kế hoạch du lịch của bạn.
          </p>
        </div>

        {/* Nút 1 chạm điền tài khoản thử nghiệm */}
        <div
          style={{
            background: "var(--color-primary-tint)",
            border: "1px dashed var(--color-primary-main)",
            borderRadius: "var(--r-md)",
            padding: "10px 14px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--color-text)" }}>
            <div style={{ fontWeight: 700, color: "var(--color-primary-main)", display: "flex", alignItems: "center", gap: 4 }}>
              <Sparkles size={13} />
              <span>Tài khoản thử nghiệm sẵn có</span>
            </div>
            <div style={{ color: "var(--color-text-sub)", fontSize: 11, marginTop: 2 }}>
              khachhang@tripvibes.vn · Pass: 123456
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="Btn BtnSmall"
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              background: "var(--color-surface)",
              border: "1px solid var(--color-primary-main)",
              color: "var(--color-primary-main)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Điền nhanh
          </button>
        </div>

        {demoNotice && (
          <div
            role="status"
            style={{
              padding: "8px 12px",
              background: "var(--color-status-successBg)",
              color: "var(--color-status-successText)",
              borderRadius: "var(--r-md)",
              marginBottom: 14,
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid var(--color-status-successText)",
            }}
          >
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{demoNotice}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              padding: "10px 14px",
              background: "var(--color-status-errBg)",
              color: "var(--color-status-errText)",
              borderRadius: "var(--r-md)",
              marginBottom: 16,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid var(--color-status-errText)",
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="Field">
            <label className="FieldLabel" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="Input"
              type="email"
              placeholder="khachhang@tripvibes.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="Field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label className="FieldLabel" htmlFor="login-pass" style={{ marginBottom: 0 }}>Mật khẩu</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontSize: 12,
                  color: "var(--color-text-sub)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showPassword ? "Ẩn" : "Hiện"}</span>
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input
                id="login-pass"
                className="Input"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete="current-password"
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  padding: 4,
                  cursor: "pointer",
                  color: "var(--color-text-sub)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="Btn BtnPrimary BtnFull"
            style={{ marginBottom: 10, height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            <span>{loading ? "Đang xử lý..." : "Đăng nhập"}</span>
          </button>

          <button
            type="button"
            className="Btn BtnFull"
            onClick={() => {
              setEmail("khachhang@tripvibes.vn");
              setPass("123456");
              setDemoNotice("Đã chọn đăng nhập nhanh qua Google (tài khoản demo)");
            }}
            style={{
              marginBottom: 12,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Tiếp tục với Google</span>
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button
            type="button"
            className="Btn BtnGhost BtnFull"
            style={{
              height: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: 13,
              color: "var(--color-primary-main)",
            }}
            onClick={() => nav("register")}
          >
            <UserPlus size={16} />
            <span>Chưa có tài khoản? Đăng ký ngay</span>
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 18, borderTop: "1px solid var(--color-border)", paddingTop: 14 }}>
          <span
            className="Link"
            onClick={() => nav(returnScreen && returnScreen !== "login" && returnScreen !== "register" ? returnScreen : "b1-chon-nhanh")}
            style={{ fontSize: 13, color: "var(--color-text-sub)", cursor: "pointer" }}
          >
            Tiếp tục ở chế độ Khách (Guest) không cần tài khoản
          </span>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
