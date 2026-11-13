import type { ReactNode } from "react";
import { AlertCircle, Eye, EyeOff, Mountain } from "lucide-react";
import authStyles from "./AuthPanel.module.css";

export { authStyles };

export function AuthPanel({ title, subtitle, error, children, onSwitch, switchLabel, onContinue }: {
  title: string;
  subtitle: string;
  error: string | null;
  children: ReactNode;
  onSwitch: () => void;
  switchLabel: string;
  onContinue: () => void;
}) {
  return (
    <section className={authStyles.card} aria-labelledby="auth-title">
      <div className={authStyles.brand}><Mountain size={26} aria-hidden="true" /> Trip Vibes</div>
      <h1 id="auth-title">{title}</h1>
      <p className={authStyles.muted}>{subtitle}</p>
      {error && <p role="alert" className={authStyles.error}><AlertCircle size={18} /> {error}</p>}
      {children}
      <div className={authStyles.links}>
        <button type="button" onClick={onSwitch}>{switchLabel}</button>
        <button type="button" onClick={onContinue}>Tiếp tục với tư cách khách</button>
      </div>
    </section>
  );
}

export function PasswordField({ id, value, onChange, visible, onToggle, autoComplete, hint }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: string;
  hint?: string;
}) {
  return (
    <div className={authStyles.passwordField}>
      <label htmlFor={id}>Mật khẩu</label>
      <div className={authStyles.passwordRow}>
        <input id={id} name="password" value={value} onChange={(event) => onChange(event.target.value)}
          type={visible ? "text" : "password"} autoComplete={autoComplete} required
          aria-describedby={hint ? `${id}-hint` : undefined} />
        <button type="button" onClick={onToggle} aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {hint && <small id={`${id}-hint`} className={authStyles.muted}>{hint}</small>}
    </div>
  );
}
