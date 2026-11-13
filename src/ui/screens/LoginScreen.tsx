"use client";
import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/ui/context/AppContext";
import { LogIn, Loader2 } from "lucide-react";
import { AuthPanel, PasswordField, authStyles } from "@/ui/components/AuthPanel";

export function LoginScreen() {
  const {
    nav,
    user,
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

  const savingAfterLogin = useRef(false);
  useEffect(() => {
    if (!user || !pendingSaveTrip || savingAfterLogin.current) return;
    savingAfterLogin.current = true; setPendingSaveTrip(false);
    void saveCurrentTripToAccount().then(result => {
      if (result.ok) nav("saved-trips"); else setError(result.message || "Đăng nhập thành công nhưng chưa lưu được chuyến đi.");
    }).finally(() => { savingAfterLogin.current = false; });
  }, [user, pendingSaveTrip, setPendingSaveTrip, saveCurrentTripToAccount, nav]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !pass) {
      setError("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }

    setLoading(true);
    const result = await loginUser(email.trim(), pass);
    setLoading(false);

    if (result.ok) {
      if (pendingSaveTrip) {
        // Deferred until the authenticated context has rendered.
        return;
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

  return (
    <AuthPanel title="Đăng nhập" subtitle="Mở nhật ký và tiếp tục chuyến đi của bạn." error={error}
      onContinue={() => nav(returnScreen && returnScreen !== "login" && returnScreen !== "register" ? returnScreen : "b1-chon-nhanh")}
      onSwitch={() => nav("register")} switchLabel="Chưa có tài khoản? Đăng ký">
      <form onSubmit={handleSubmit} className={authStyles.form} onChange={() => setError(null)}>
        <label>Email
          <input id="login-email" name="email" type="email" autoComplete="email" required value={email}
            onChange={(event) => setEmail(event.target.value)} />
        </label>
        <PasswordField id="login-pass" autoComplete="current-password"
          value={pass} onChange={setPass} visible={showPassword} onToggle={() => setShowPassword(!showPassword)} />
        <button className={authStyles.submit} type="submit" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
          {loading ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>
    </AuthPanel>
  );
}

export default LoginScreen;
