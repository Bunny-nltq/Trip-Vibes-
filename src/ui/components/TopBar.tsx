"use client";
import React, { useState } from "react";
import { useApp } from "@/ui/context/AppContext";
import { Undo2, Redo2, Printer } from "lucide-react";
import { getDiemDenTen } from "@/contracts";

export function TopBar() {
  const {
    screen,
    nav,
    tripConfig,
    setTripConfig,
    canUndo,
    canRedo,
    undoPlan,
    redoPlan,
  } = useApp();

  const [searchInput, setSearchInput] = useState("");

  const showUndoRedo = [
    "b3-ke-hoach",
    "b4-phuong-tien",
    "b5-khach-san",
    "b6-xem-truoc",
  ].includes(screen);

  const showPrint = [
    "b3-ke-hoach",
    "b7-xac-nhan",
    "b8-chuyen-di",
    "b11-ngan-sach",
  ].includes(screen);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    setTripConfig({ diemDen: q });
    if (screen !== "b1-chon-nhanh") {
      nav("b1-chon-nhanh");
    }
  };

  return (
    <header className="TopbarFlow" role="banner">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="Search" style={{ position: "relative" }}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-text-sub)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Bạn muốn đi đâu hôm nay?"
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            width: "100%",
            fontSize: 13,
            color: "var(--color-text)",
          }}
        />
      </form>

      {/* Top Right Actions */}
      <div className="TopRight">
        {/* Undo / Redo for planning screens */}
        {showUndoRedo && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 8 }}>
            <button
              type="button"
              className="Btn BtnSmall BtnGhost"
              onClick={undoPlan}
              disabled={!canUndo}
              style={{ opacity: canUndo ? 1 : 0.4 }}
              title="Hoàn tác (Undo)"
            >
              <Undo2 size={14} />
            </button>
            <button
              type="button"
              className="Btn BtnSmall BtnGhost"
              onClick={redoPlan}
              disabled={!canRedo}
              style={{ opacity: canRedo ? 1 : 0.4 }}
              title="Làm lại (Redo)"
            >
              <Redo2 size={14} />
            </button>
          </div>
        )}

        {/* Print / Save PDF */}
        {showPrint && (
          <button
            type="button"
            className="Btn BtnSmall BtnGhost"
            onClick={() => window.print()}
            title="In hoặc Lưu PDF lịch trình"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, marginRight: 8 }}
          >
            <Printer size={15} />
            <span style={{ fontSize: 12 }}>In / PDF</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="Bell" title="Thông báo" onClick={() => nav("b8-chuyen-di")}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9.5a6 6 0 0 1 12 0c0 5.5 2 6.5 2 6.5H4s2-1 2-6.5z" />
            <path d="M10 19.5a2 2 0 0 0 4 0" />
          </svg>
          <div className="Dot" />
        </div>

        {/* User Avatar Circle */}
        <div className="Me" title="Tài khoản cá nhân" onClick={() => nav("login")}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8.5" r="3.5" />
            <path d="M5 20c.8-3.8 3.5-5.5 7-5.5s6.2 1.7 7 5.5" />
          </svg>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
