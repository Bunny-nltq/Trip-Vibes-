"use client";
import React, { useState, useMemo } from "react";
import { useApp } from "@/ui/context/AppContext";
import { SideNav } from "@/ui/components/SideNav";
import { BudgetBox } from "@/ui/components/BudgetBox";
import {
  gomDiaDiemTheoNgay,
  tinhTienDo,
  type ProgressPlace,
} from "@/core/tripProgress";
import { B9ChiDuongPopover } from "@/ui/components/B9ChiDuongPopover";
import {
  Check,
  Navigation,
  Compass,
  RotateCcw,
  ArrowRight,
  Plus,
  Clock,
} from "lucide-react";

const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

export function B8ChuyenDiScreen() {
  const {
    nav,
    plan,
    activeDay,
    setActiveDay,
    tickedPlaces,
    toggleTickPlace,
    untickPlace,
  } = useApp();

  // Toast khi tick địa điểm
  const [toast, setToast] = useState<{ id: string; ten: string } | null>(null);

  // Popover B9
  const [popoverPlace, setPopoverPlace] = useState<ProgressPlace | null>(null);

  // Gom địa điểm thực tế từ plan
  const placesByDay = useMemo(() => {
    if (!plan) return {};
    return gomDiaDiemTheoNgay(plan);
  }, [plan]);

  const soNgay = plan?.request.soNgay || 3;
  const dayNumbers = useMemo(() => {
    return Array.from({ length: soNgay }, (_, i) => i + 1);
  }, [soNgay]);

  const currentDayPlaces = placesByDay[activeDay] || [];

  // Tiến độ tổng
  const progress = useMemo(() => {
    return tinhTienDo(placesByDay, tickedPlaces);
  }, [placesByDay, tickedPlaces]);

  const handleToggle = (place: ProgressPlace) => {
    const isNowTicked = toggleTickPlace(place.id);
    if (isNowTicked) {
      setToast({ id: place.id, ten: place.ten });
    } else {
      if (toast?.id === place.id) {
        setToast(null);
      }
    }
  };

  const handleUndoToast = () => {
    if (toast) {
      untickPlace(toast.id);
      setToast(null);
    }
  };

  return (
    <div className="tv-layout">
      <SideNav />
      <div className="tv-main animate-in" style={{ maxWidth: 860, overflowY: "auto" }}>
        <h1 className="page-title">Quản lý chuyến đi</h1>
        <p className="page-sub">
          {progress.daDen} trong {progress.tong} địa điểm đã đến ({progress.phanTram}%)
        </p>

        {/* Thanh tiến độ */}
        <div style={{ marginBottom: 20 }}>
          <div className="bar-track" style={{ height: 8, borderRadius: "var(--r-full)", background: "var(--g200)" }}>
            <div
              className="bar-fill"
              style={{
                width: `${progress.phanTram}%`,
                background: "var(--p500)",
                borderRadius: "var(--r-full)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Tabs ngày */}
        <div className="tabs" style={{ marginBottom: 16 }}>
          {dayNumbers.map((d) => (
            <div
              key={d}
              className={`tab-item ${activeDay === d ? "active" : ""}`}
              onClick={() => setActiveDay(d)}
            >
              Ngày {d}
            </div>
          ))}
        </div>

        {/* Danh sách địa điểm ngày hiện tại */}
        <div className="daycard">
          <div className="daycard-head">
            <div className="daycard-name">Lịch trình Ngày {activeDay}</div>
            <div className="daycard-total">
              {currentDayPlaces.filter((p) => tickedPlaces[p.id]).length} /{" "}
              {currentDayPlaces.length} địa điểm đã đến
            </div>
          </div>

          {currentDayPlaces.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: "var(--g500)" }}>
              Không có hoạt động hoặc địa điểm cụ thể cho ngày này.
            </div>
          )}

          {currentDayPlaces.map((place) => {
            const isDone = Boolean(tickedPlaces[place.id]);

            return (
              <div
                key={place.id}
                className="item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--g100)",
                }}
              >
                {/* Checkbox */}
                <div
                  className={`checkbox ${isDone ? "checked" : ""}`}
                  onClick={() => handleToggle(place)}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 22,
                    height: 22,
                    borderRadius: "var(--r-sm)",
                    border: isDone ? "none" : "2px solid var(--g300)",
                    background: isDone ? "var(--p500)" : "var(--surface)",
                    color: "white",
                    flexShrink: 0,
                  }}
                  title={isDone ? "Đánh dấu chưa đến" : "Đánh dấu đã đến"}
                >
                  {isDone && <Check size={14} strokeWidth={3} />}
                </div>

                {/* Giờ */}
                <div
                  className="item-time"
                  style={{
                    width: 55,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--g500)",
                    flexShrink: 0,
                  }}
                >
                  {place.gio || "—"}
                </div>

                {/* Tên & chi tiết */}
                <div className="item-info" style={{ flex: 1 }}>
                  <div
                    className="item-title"
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      textDecoration: isDone ? "line-through" : "none",
                      color: isDone ? "var(--g400)" : "var(--navy)",
                    }}
                  >
                    {place.ten}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--g500)", marginTop: 2 }}>
                    {place.hangMuc}
                    {place.thoiGianDiChuyenPhut && (
                      <span style={{ marginLeft: 8, color: "var(--p500)" }}>
                        · {place.thoiGianDiChuyenPhut} phút tới điểm kế
                      </span>
                    )}
                  </div>
                </div>

                {/* Số tiền kế hoạch */}
                <div className="item-amount" style={{ textAlign: "right", minWidth: 100 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--navy)" }}>
                    {place.thanhTien === 0 ? (
                      <span style={{ color: "var(--success)" }}>Miễn phí</span>
                    ) : (
                      fmt(place.thanhTien)
                    )}
                  </div>
                </div>

                {/* Nút chỉ đường (mở popover B9) */}
                <div className="item-action">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setPopoverPlace(place)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }}
                  >
                    <Navigation size={13} />
                    Chỉ đường
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hint" style={{ marginTop: 12 }}>
          Tick khi bạn đã đến một địa điểm. Bạn có thể bỏ tick nếu bấm nhầm.
        </div>
      </div>

      <div className="tv-side">
        <BudgetBox plan={plan} />
      </div>

      {/* Popover B9 */}
      <B9ChiDuongPopover
        place={popoverPlace}
        onClose={() => setPopoverPlace(null)}
      />

      {/* Toast hỏi thêm chi tiêu */}
      {toast && (
        <div className="toast" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Check size={16} style={{ color: "var(--success)" }} />
            Đã đánh dấu <b>{toast.ten}</b>. Thêm chi tiêu?
          </span>
          <button
            className="toast-btn"
            onClick={() => nav("b10-chon-nguon")}
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <Plus size={13} />
            Thêm
          </button>
          <button className="toast-btn" onClick={() => setToast(null)}>
            Bỏ qua
          </button>
          <button
            className="toast-btn"
            onClick={handleUndoToast}
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <RotateCcw size={13} />
            Hoàn tác
          </button>
        </div>
      )}
    </div>
  );
}
