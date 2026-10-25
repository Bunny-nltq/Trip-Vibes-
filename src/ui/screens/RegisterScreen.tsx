"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/ui/context/AppContext";
import {
  UserPlus,
  LogIn,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";

export function RegisterScreen() {
  const {
    nav,
    registerUser,
    returnScreen,
    setReturnScreen,
    pendingSaveTrip,
    setPendingSaveTrip,
    saveCurrentTripToAccount,
  } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Vui lòng nhập họ và tên của bạn.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }
    if (pass.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (pass !== confirmPass) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    const result = await registerUser(name.trim(), email.trim(), pass);
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
      setError(result.message || "Đăng ký không thành công. Email có thể đã được sử dụng.");
    }
  };

  const handleFillDemo = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setName("Trần Du Lịch");
    setEmail(`dulich${randomSuffix}@tripvibes.vn`);
    setPass("123456");
    setConfirmPass("123456");
    setError(null);
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
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)" }}>Đăng ký tài khoản</h2>
          <p style={{ fontSize: 13, color: "var(--color-text-sub)", marginTop: 4 }}>
            Tạo tài khoản để lưu trữ nhật ký chuyến đi và quản lý ngân sách thuận tiện.
          </p>
        </div>

        {/* Nút điền mẫu nhanh */}
        <div
          style={{
            background: "var(--color-surface-sub)",
            border: "1px dashed var(--color-border)",
            borderRadius: "var(--r-md)",
            padding: "8px 12px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--color-text-sub)" }}>Thử nghiệm nhanh:</span>
          <button
            type="button"
            onClick={handleFillDemo}
            className="Btn BtnSmall"
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 8px",
              background: "var(--color-surface)",
              color: "var(--color-primary-main)",
              cursor: "pointer",
            }}
          >
            Điền mẫu ngẫu nhiên
          </button>
        </div>

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
            <label className="FieldLabel" htmlFor="reg-name">Họ và tên</label>
            <input
              id="reg-name"
              className="Input"
              type="text"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="Field">
            <label className="FieldLabel" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="Input"
              type="email"
              placeholder="ban@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="Field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label className="FieldLabel" htmlFor="reg-pass" style={{ marginBottom: 0 }}>Mật khẩu (tối thiểu 6 ký tự)</label>
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
            <input
              id="reg-pass"
              className="Input"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="Field">
            <label className="FieldLabel" htmlFor="reg-confirm">Xác nhận mật khẩu</label>
            <input
              id="reg-confirm"
              className="Input"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="Btn BtnPrimary BtnFull"
            style={{ marginTop: 8, marginBottom: 12, height: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            <span>{loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}</span>
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
            onClick={() => nav("login")}
          >
            <LogIn size={16} />
            <span>Đã có tài khoản? Đăng nhập ngay</span>
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

export default RegisterScreen;
