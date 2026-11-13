"use client";
import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/ui/context/AppContext";
import { UserPlus, Loader2 } from "lucide-react";
import { AuthPanel, PasswordField, authStyles } from "@/ui/components/AuthPanel";

export function RegisterScreen() {
  const {
    nav,
    user,
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

    if (!name.trim()) {
      setError("Vui lòng nhập họ và tên của bạn.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }
    if (pass.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
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
      setError(result.message || "Đăng ký không thành công. Email có thể đã được sử dụng.");
    }
  };


  return (
    <AuthPanel title="Đăng ký tài khoản" subtitle="Tạo tài khoản để lưu hành trình và theo dõi chi tiêu của bạn." error={error}
      onContinue={() => nav(returnScreen && returnScreen !== "login" && returnScreen !== "register" ? returnScreen : "b1-chon-nhanh")}
      onSwitch={() => nav("login")} switchLabel="Đã có tài khoản? Đăng nhập">
      <form onSubmit={handleSubmit} className={authStyles.form} onChange={() => setError(null)}>
        <label>Họ và tên
          <input id="reg-name" name="name" autoComplete="name" required value={name}
            onChange={(event) => setName(event.target.value)} />
        </label>
        <label>Email
          <input id="reg-email" name="email" type="email" autoComplete="email" required value={email}
            onChange={(event) => setEmail(event.target.value)} />
        </label>
        <PasswordField id="reg-pass" autoComplete="new-password" hint="Dùng ít nhất 8 ký tự."
          value={pass} onChange={setPass} visible={showPassword} onToggle={() => setShowPassword(!showPassword)} />
        <label>Xác nhận mật khẩu
          <input id="reg-confirm" name="confirmPassword" type={showPassword ? "text" : "password"}
            autoComplete="new-password" required value={confirmPass}
            onChange={(event) => setConfirmPass(event.target.value)} />
        </label>
        <button className={authStyles.submit} type="submit" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
          {loading ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
        </button>
      </form>
    </AuthPanel>
  );
}

export default RegisterScreen;
