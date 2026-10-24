"use client";
import React from "react";
import { useApp } from "@/ui/context/AppContext";
import { Undo2, Redo2, Printer, Share2, Check } from "lucide-react";

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

  // Xác định bước hiện tại trong quy trình Lập kế hoạch
  const stepInfo = (() => {
    switch (screen) {
      case "b1-chon-nhanh":
        return { step: 1, title: "Chọn nhu cầu" };
      case "b2-dang-chay":
        return { step: 2, title: "AI Lập lịch trình" };
      case "b3-ke-hoach":
        return { step: 3, title: "Tổng quan kế hoạch" };
      case "b4-phuong-tien":
        return { step: 4, title: "Chọn phương tiện" };
      case "b5-khach-san":
        return { step: 5, title: "Chọn nơi lưu trú" };
      case "b6-xem-truoc":
        return { step: 6, title: "Xem trước thay đổi" };
      case "b7-xac-nhan":
        return { step: 7, title: "Chốt chuyến đi" };
      case "b8-chuyen-di":
        return { step: 8, title: "Trong chuyến đi" };
      case "b9-chi-duong":
        return { step: 9, title: "Chỉ đường di chuyển" };
      case "b10-chon-nguon":
        return { step: 10, title: "Quản lý hóa đơn & chi tiêu" };
      case "b11-ngan-sach":
        return { step: 11, title: "Sổ ngân sách thực tế" };
      default:
        return null;
    }
  })();

  const FLOW_STEPS = [
    { num: 1, label: "Nhu cầu" },
    { num: 2, label: "AI lập" },
    { num: 3, label: "Kế hoạch" },
    { num: 4, label: "Tùy chỉnh" },
    { num: 7, label: "Chốt" },
    { num: 8, label: "Đồng hành" },
    { num: 11, label: "Ngân sách" },
  ];

  const [copied, setCopied] = React.useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="TopbarFlow" role="banner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", gap: 16 }}>
      {stepInfo ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 12px",
              background: "var(--color-primary-tint)",
              borderRadius: "var(--r-full)",
              color: "var(--color-primary)",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            <span>Bước {stepInfo.step}/11</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ color: "var(--color-text)" }}>{stepInfo.title}</span>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}
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

        {/* Share Link */}
        {showPrint && (
          <button
            type="button"
            className="Btn BtnSmall BtnGhost"
            onClick={handleShare}
            title="Sao chép liên kết kế hoạch"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, marginRight: 8 }}
          >
            {copied ? <Check size={14} color="var(--color-status-success)" /> : <Share2 size={14} />}
            <span style={{ fontSize: 12 }}>{copied ? "Đã chép link" : "Chia sẻ"}</span>
          </button>
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
