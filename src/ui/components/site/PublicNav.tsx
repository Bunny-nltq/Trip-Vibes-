import type { Screen } from "@/ui/context/AppContext";
import type { ReactNode } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import styles from "./Public.module.css";

const links = [
  { href: "/", label: "Trang chủ" },
  { href: "/diem-den", label: "Trải nghiệm" },
  { href: "/khach-san", label: "Lưu trú" },
  { href: "/lap-ke-hoach", label: "Lên kế hoạch" },
  { href: "/lap-ke-hoach?screen=saved-trips", label: "Nhật ký chuyến đi" },
];

export function PublicNav({
  current,
  onNavigatePlan,
  onPlannerScreen,
  mobileAccount,
}: {
  current?: string;
  onNavigatePlan?: () => void;
  onPlannerScreen?: (screen: Screen) => void;
  mobileAccount?: ReactNode;
}) {
  const items = links.map((link) => (
    <Link
      key={link.href}
      href={link.href}
      aria-current={current === link.href ? "page" : undefined}
      onNavigate={(event) => {
        if (!onPlannerScreen || !link.href.startsWith("/lap-ke-hoach")) return;
        event.preventDefault();
        onPlannerScreen(link.href.includes("saved-trips") ? "saved-trips" : "b1-chon-nhanh");
      }}
      onClick={() => {
        if (link.href === "/lap-ke-hoach") {
          onNavigatePlan?.();
        }
      }}
    >
      {link.label}
    </Link>
  ));

  return (
    <>
      <nav className={`${styles.navLinks} ${styles.desktopNav}`} aria-label="Điều hướng chính">
        {items}
      </nav>
      <details className={styles.mobileMenu}>
        <summary aria-label="Mở menu điều hướng">
          <Menu size={22} />
        </summary>
        <nav className={styles.menuPanel} aria-label="Điều hướng trên điện thoại" onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a")) {
            event.currentTarget.closest("details")?.removeAttribute("open");
          }
        }}>
          {items}
          {mobileAccount}
        </nav>
      </details>
    </>
  );
}
