"use client";
import React from "react";
import { useApp } from "@/ui/context/AppContext";
import { Undo2, Redo2, Printer } from "lucide-react";

export function TopBar() {
  const {
    screen,
    canUndo,
    canRedo,
    undoPlan,
    redoPlan,
  } = useApp();

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

  return (
    <header className="TopbarFlow" role="banner">
      <div style={{ flex: 1 }} />
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
      </div>
    </header>
  );
}

export default TopBar;
