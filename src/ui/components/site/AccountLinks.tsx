"use client";
import type { Screen } from "@/ui/context/AppContext";
import Link from "next/link";
import { Settings, UserRound, ArrowRight } from "lucide-react";
import type { User } from "@/contracts";
import styles from "./Public.module.css";

export function AccountLinks({ user, onPlannerScreen }: { user: User | null; onPlannerScreen?: (screen: Screen) => void }) {
  return (
    <div className={styles.actions}>
      {user ? (
        <>
          <Link
            className={styles.button}
            href="/lap-ke-hoach?screen=saved-trips"
            onNavigate={event => { if (onPlannerScreen) { event.preventDefault(); onPlannerScreen("saved-trips"); } }}
          >
            <UserRound size={18} />
            <span className={styles.accountName}>{user.name}</span>
          </Link>
          <Link
            href="/lap-ke-hoach?screen=profile"
            onNavigate={event => { if (onPlannerScreen) { event.preventDefault(); onPlannerScreen("profile"); } }}
            aria-label="Cài đặt tài khoản"
          >
            <Settings size={20} />
          </Link>
        </>
      ) : (
        <>
          <Link
            className={styles.link}
            href="/lap-ke-hoach?screen=login"
            onNavigate={event => { if (onPlannerScreen) { event.preventDefault(); onPlannerScreen("login"); } }}
          >
            Đăng nhập
          </Link>
          <Link
            className={`${styles.button} ${styles.primary}`}
            href="/lap-ke-hoach?screen=register"
            onNavigate={event => { if (onPlannerScreen) { event.preventDefault(); onPlannerScreen("register"); } }}
          >
            Đăng ký
            <ArrowRight size={16} />
          </Link>
        </>
      )}
    </div>
  );
}
