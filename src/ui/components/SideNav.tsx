"use client";
import React from "react";
import Link from "next/link";
import { useApp } from "@/ui/context/AppContext";
import { Compass, Send, BookOpen, Receipt, BookmarkCheck, LogIn, LogOut, User } from "lucide-react";

export const SidebarContext = React.createContext<boolean>(false);

export function SideNav() {
  const isInsideOuterSidebar = React.useContext(SidebarContext);
  const { screen, nav, user, logoutUser } = useApp();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Ngăn chặn nhân đôi sidebar khi component con gọi tiếp <SideNav /> bên trong main shell
  if (isInsideOuterSidebar) {
    return null;
  }

  // Xác định mục nào sáng duy nhất theo màn hình hiện tại
  const activeItem = (() => {
    if (screen === "saved-trips") {
      return "saved-trips";
    }
    if (["b10-chon-nguon", "b11-ngan-sach"].includes(screen)) {
      return "chi-tieu";
    }
    if (["b8-chuyen-di", "b9-chi-duong"].includes(screen)) {
      return "dong-hanh";
    }
    return "ke-hoach";
  })();

  const handleNavClick = (target: "ke-hoach" | "dong-hanh" | "chi-tieu" | "saved-trips") => {
    if (target === "ke-hoach") {
      nav("b1-chon-nhanh");
    } else if (target === "dong-hanh") {
      nav("b8-chuyen-di");
    } else if (target === "chi-tieu") {
      nav("b11-ngan-sach");
    } else if (target === "saved-trips") {
      nav("saved-trips");
    }
  };

  return (
    <aside className="Sidebar" aria-label="Menu điều hướng chính" style={{ padding: "20px 16px" }}>
      {/* Logo Block dẫn về "/" */}
      <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="LogoBlock" style={{ cursor: "pointer" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--r-md)",
              background: "var(--color-primary-main)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary-text)",
              flexShrink: 0,
            }}
          >
            <Compass size={20} strokeWidth={2.2} />
          </div>
          <div>
            <div className="LogoName" style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.3px" }}>Trip Vibes</div>
            <div className="LogoSub" style={{ fontSize: 11, color: "var(--color-text-sub)" }}>Hệ thống lập kế hoạch</div>
          </div>
        </div>
      </Link>

      {/* Navigation: Lên kế hoạch, Đồng hành chuyến đi, Hóa đơn & Chi tiêu, Nhật ký các chuyến đi */}
      <nav className="Nav" style={{ marginTop: 28, flex: 1 }}>
        {/* Lên kế hoạch */}
        <div
          className={`NavItem ${activeItem === "ke-hoach" ? "NavActive" : "NavOn"}`}
          onClick={() => handleNavClick("ke-hoach")}
          role="button"
          tabIndex={0}
        >
          <Send size={18} />
          <span>Lên kế hoạch</span>
        </div>

        {/* Đồng hành chuyến đi */}
        <div
          className={`NavItem ${activeItem === "dong-hanh" ? "NavActive" : "NavOn"}`}
          onClick={() => handleNavClick("dong-hanh")}
          role="button"
          tabIndex={0}
        >
          <Compass size={18} />
          <span>Đồng hành chuyến đi</span>
        </div>

        {/* Hóa đơn & Chi tiêu */}
        <div
          className={`NavItem ${activeItem === "chi-tieu" ? "NavActive" : "NavOn"}`}
          onClick={() => handleNavClick("chi-tieu")}
          role="button"
          tabIndex={0}
        >
          <Receipt size={18} />
          <span>Hóa đơn & Chi tiêu</span>
        </div>

        {/* Nhật ký các chuyến đi */}
        <div
          className={`NavItem ${activeItem === "saved-trips" ? "NavActive" : "NavOn"}`}
          onClick={() => handleNavClick("saved-trips")}
          role="button"
          tabIndex={0}
        >
          <BookOpen size={18} />
          <span>Nhật ký các chuyến đi</span>
        </div>
      </nav>

      {/* User Status / Auth footer in Sidebar */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: 16,
          borderTop: "1px solid var(--color-border)",
        }}
        suppressHydrationWarning
      >
        {mounted && user ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--color-surface-sub)",
              padding: "10px 12px",
              borderRadius: "var(--r-md)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                overflow: "hidden",
                cursor: "pointer",
              }}
              onClick={() => nav("saved-trips")}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "var(--r-full)",
                  background: "var(--color-primary-main)",
                  color: "var(--color-primary-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-text)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-sub)" }}>Tài khoản cá nhân</div>
              </div>
            </div>
            <button
              type="button"
              onClick={logoutUser}
              title="Đăng xuất"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: "var(--color-text-sub)",
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div
            style={{
              background: "var(--color-surface-sub)",
              padding: "10px 12px",
              borderRadius: "var(--r-md)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 11, color: "var(--color-text-sub)" }}>
              Chế độ Khách (Guest)
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                className="Btn BtnSmall"
                style={{ flex: 1, padding: "4px 8px", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                onClick={() => nav("login")}
              >
                <LogIn size={12} />
                <span>Đăng nhập</span>
              </button>
              <button
                type="button"
                className="Btn BtnSmall BtnPrimary"
                style={{ flex: 1, padding: "4px 8px", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                onClick={() => nav("register")}
              >
                <span>Đăng ký</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default SideNav;
