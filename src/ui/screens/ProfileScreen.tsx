"use client";
import React, { useState, useEffect } from "react";
import { accountRequest } from "@/ui/hooks/accountApi";
import { WorkspaceFrame } from "@/ui/components/WorkspaceFrame";
import { useApp } from "@/ui/context/AppContext";
import type { User } from "@/contracts";
import styles from "@/ui/components/Workspace.module.css";
export function ProfileScreen() {
    const { user, nav, setReturnScreen } = useApp();
    const [profile, setProfile] = useState<NonNullable<User["profile"]>>({ gender: "undisclosed", personalize: true, interests: [] });
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    useEffect(() => { let live = true; accountRequest("/api/auth/me").then(data => { if (live && data.user?.profile)
        setProfile(data.user.profile); }).catch(() => { if (live)
        setMessage("Không thể tải hồ sơ."); }); return () => { live = false; }; }, []);
    if (!user)
        return <WorkspaceFrame><h1>Hồ sơ cá nhân</h1><p>Đăng nhập để cập nhật hồ sơ và xem thống kê riêng.</p><button onClick={() => {setReturnScreen("profile");nav("login");}}>Đăng nhập</button></WorkspaceFrame>;
    return <WorkspaceFrame><h1>Hồ sơ & cá nhân hóa</h1><p>{user.name} · {user.email}</p><form className={styles.card} onSubmit={async (e) => { e.preventDefault(); setBusy(true); try {
        await accountRequest("/api/user/profile", "PUT", profile);
        setMessage("Đã lưu hồ sơ.");
    }
    catch (error) {
        setMessage(error instanceof Error ? error.message : "Không thể lưu.");
    }
    finally {
        setBusy(false);
    } }}>
 <div className={styles.grid}><label>Ngày sinh (tùy chọn)<input type="date" value={profile.birthDate || ""} onChange={e => setProfile({ ...profile, birthDate: e.target.value || null })}/></label><label>Giới tính (tùy chọn)<select value={profile.gender || "undisclosed"} onChange={e => setProfile({ ...profile, gender: e.target.value as NonNullable<User["profile"]>["gender"] })}><option value="undisclosed">Không muốn cung cấp</option><option value="female">Nữ</option><option value="male">Nam</option><option value="other">Khác</option></select></label></div>
 <label>Sở thích, cách nhau bằng dấu phẩy<input value={(profile.interests || []).join(", ")} placeholder="cafe, bảo tàng, biển" onChange={e => setProfile({ ...profile, interests: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })}/></label>
 <label className={styles.row}><input type="checkbox" checked={profile.personalize !== false} onChange={e => setProfile({ ...profile, personalize: e.target.checked })}/> Dùng sở thích để cá nhân hóa gợi ý</label><p>Ngày sinh và giới tính không bắt buộc. Hệ thống không suy đoán sở thích hay sức khỏe từ giới tính/tuổi.</p><button className={styles.primary} disabled={busy}>{busy ? "Đang lưu…" : "Lưu hồ sơ"}</button></form><p role="status">{message}</p></WorkspaceFrame>;
}
