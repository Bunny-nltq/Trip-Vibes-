"use client";
import React from "react";
import Link from "next/link";
import { useApp } from "@/ui/context/AppContext";
import { Compass, Send, BookOpen } from "lucide-react";

export const SidebarContext = React.createContext<boolean>(false);

export function SideNav() {
  const { screen, nav } = useApp();

  // Xác định mục nào sáng duy nhất theo màn hình hiện tại
  const activeItem = (() => {
    if (
      [
        "b1-chon-nhanh",
        "b2-dang-chay",
        "b3-ke-hoach",
        "b4-phuong-tien",
        "b5-khach-san",
        "b6-xem-truoc",
        "b7-xac-nhan",
      ].includes(screen)
    ) {
      return "ke-hoach";
    }
    if (["b8-chuyen-di", "b9-chi-duong", "b10-chon-nguon", "b11-ngan-sach"].includes(screen)) {
      return "nhat-ky";
    }
    return "ke-hoach";
  })();

  const handleNavClick = (target: "ke-hoach" | "nhat-ky") => {
    if (target === "ke-hoach") {
      nav("b1-chon-nhanh");
    } else if (target === "nhat-ky") {
      nav("b8-chuyen-di");
    }
  };

  return (
    <aside className="Sidebar" aria-label="Menu điều hướng chính">
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

      {/* Navigation: CHỈ còn 2 mục "Lên kế hoạch" và "Nhật ký chuyến đi" */}
      <nav className="Nav" style={{ marginTop: 28 }}>
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

        {/* Nhật ký chuyến đi */}
        <div
          className={`NavItem ${activeItem === "nhat-ky" ? "NavActive" : "NavOn"}`}
          onClick={() => handleNavClick("nhat-ky")}
          role="button"
          tabIndex={0}
        >
          <BookOpen size={18} />
          <span>Nhật ký chuyến đi</span>
        </div>
      </nav>
    </aside>
  );
}

export default SideNav;
