"use client";
import React from "react";
import Link from "next/link";
import { useApp } from "@/ui/context/AppContext";
import { Undo2, Redo2, Check, RotateCcw } from "lucide-react";
import { getDiemDenTen } from "@/contracts";

const SCREENS = [
  { id: "welcome", label: "W0 · Màn chào (Welcome)" },
  { id: "login", label: "L1 · Đăng nhập" },
  { id: "b1-chon-nhanh", label: "B1 · Chọn nhanh nhu cầu" },
  { id: "b2-dang-chay", label: "B2 · AI Agent đang chạy" },
  { id: "b3-ke-hoach", label: "B3 · Kế hoạch tổng quan" },
  { id: "b4-phuong-tien", label: "B4 · Chọn phương tiện bay" },
  { id: "b5-khach-san", label: "B5 · Chọn khách sạn" },
  { id: "b6-xem-truoc", label: "B6 · Xem trước thay đổi" },
  { id: "b7-xac-nhan", label: "B7 · Xác nhận kế hoạch" },
  { id: "b8-chuyen-di", label: "B8 · Quản lý chuyến đi" },
  { id: "b9-chi-duong", label: "B9 · Chỉ đường địa điểm" },
  { id: "b10-chon-nguon", label: "B10 · Ghi chi tiêu / Đọc bill" },
  { id: "b11-ngan-sach", label: "B11 · Sổ ngân sách thực tế" },
] as const;

export function TopBar() {
  const {
    screen,
    confirmed,
    setConfirmed,
    nav,
    plan,
    tripConfig,
    canUndo,
    canRedo,
    undoPlan,
    redoPlan,
  } = useApp();

  const showTrip = [
    "b3-ke-hoach",
    "b4-phuong-tien",
    "b5-khach-san",
    "b6-xem-truoc",
    "b7-xac-nhan",
    "b8-chuyen-di",
    "b9-chi-duong",
    "b10-chon-nguon",
    "b11-ngan-sach",
  ].includes(screen);

  const showActions = [
    "b3-ke-hoach",
    "b4-phuong-tien",
    "b5-khach-san",
    "b6-xem-truoc",
  ].includes(screen);

  return (
    <div className="tv-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div className="tv-logo" onClick={() => nav("welcome")} style={{ cursor: "pointer" }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="url(#logo-grad)" />
            <path d="M14 7l2 4h4l-3.5 2.5 1.3 4L14 15l-3.8 2.5 1.3-4L8 11h4z" fill="white" />
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28">
                <stop stopColor="#3B82F6" />
                <stop offset="1" stopColor="#14B8A6" />
              </linearGradient>
            </defs>
          </svg>
          Trip Vibes
        </div>

        {/* Quick jump screen selector for easy testing */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--g400)", textTransform: "uppercase" }}>Test:</span>
          <select
            value={screen}
            onChange={(e) => nav(e.target.value as Parameters<typeof nav>[0])}
            style={{
              padding: "4px 8px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--g300)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--navy)",
              background: "var(--g50)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {SCREENS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showTrip && (
        <div style={{ fontSize: 13, color: "var(--g500)", fontWeight: 500 }} className="hidden md:block">
          {(plan?.request.diemDi
            ? typeof plan.request.diemDi === "string"
              ? plan.request.diemDi
              : plan.request.diemDi.ten
            : "TP.HCM")}{" "}
          → {getDiemDenTen(plan?.request.diemDen) || "Điểm đến"} &nbsp;·&nbsp;{" "}
          {plan?.request.soNgay ?? 3} ngày {Math.max(1, (plan?.request.soNgay ?? 3) - 1)} đêm &nbsp;·&nbsp;{" "}
          {plan?.request.soNguoi ?? tripConfig.people} người
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {showActions && (
          <>
            <button
              className="btn btn-ghost btn-sm"
              onClick={undoPlan}
              disabled={!canUndo || confirmed}
              style={{
                opacity: canUndo && !confirmed ? 1 : 0.4,
                cursor: canUndo && !confirmed ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
              title={
                confirmed
                  ? "Kế hoạch đã chốt, không thể hoàn tác"
                  : canUndo
                  ? "Hoàn tác thay đổi vừa thực hiện"
                  : "Không có thay đổi nào để hoàn tác"
              }
            >
              <Undo2 size={14} />
              Hoàn tác
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={redoPlan}
              disabled={!canRedo || confirmed}
              style={{
                opacity: canRedo && !confirmed ? 1 : 0.4,
                cursor: canRedo && !confirmed ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
              title={
                confirmed
                  ? "Kế hoạch đã chốt, không thể làm lại"
                  : canRedo
                  ? "Làm lại thay đổi vừa hoàn tác"
                  : "Không có thay đổi nào để làm lại"
              }
            >
              <Redo2 size={14} />
              Làm lại
            </button>
            {!confirmed ? (
              <button className="btn btn-primary btn-sm" onClick={() => nav("b7-xac-nhan")}>
                Xác nhận kế hoạch
              </button>
            ) : (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setConfirmed(false)}
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <RotateCcw size={13} />
                Mở lại để sửa
              </button>
            )}
          </>
        )}

        {confirmed && (
          <span
            style={{
              fontSize: 13,
              color: "var(--success)",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Check size={14} strokeWidth={2.5} />
            Đã chốt
          </span>
        )}

        <Link
          href="/demo"
          className="btn btn-outline btn-sm"
          style={{ fontSize: 12 }}
          title="Xem các trang wireframe tĩnh ban đầu"
        >
          28 Wireframes
        </Link>
        <div style={{ fontSize: 13, color: "var(--g500)", fontWeight: 500, padding: "4px 12px", border: "1.5px solid var(--g100)", borderRadius: "var(--r-full)", background: "var(--g50)" }}>
          Khách
        </div>
      </div>
    </div>
  );
}
