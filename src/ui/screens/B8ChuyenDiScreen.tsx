"use client";
import React, { useState } from "react";
import { useApp } from "@/ui/context/AppContext";
import { SideNav } from "@/ui/components/SideNav";

const DAYS_DATA = [
  {
    num: 1,
    items: [
      { id: "d1-1", time: "06:30", title: "Máy bay TP.HCM → Đà Nẵng", duration: "85 phút",   travel: "—",      amount: "1.960.000 đ", done: true },
      { id: "d1-2", time: "09:30", title: "Bãi biển Mỹ Khê",           duration: "2 giờ",     travel: "20 phút", amount: "Miễn phí",   done: true },
      { id: "d1-3", time: "14:00", title: "Nhận phòng Khách sạn Mẫu 02", duration: "—",        travel: "—",      amount: "2.200.000 đ", done: false },
    ],
  },
  {
    num: 2,
    items: [
      { id: "d2-1", time: "09:30", title: "Ngũ Hành Sơn",  duration: "2,5 giờ", travel: "25 phút", amount: "80.000 đ",  done: true },
      { id: "d2-2", time: "15:30", title: "Phố cổ Hội An",  duration: "4 giờ",   travel: "10 phút", amount: "240.000 đ", done: false },
    ],
  },
  {
    num: 3,
    items: [
      { id: "d3-1", time: "09:30", title: "Bà Nà Hills",              duration: "6 giờ",   travel: "45 phút", amount: "1.300.000 đ", done: false },
      { id: "d3-2", time: "18:00", title: "Máy bay Đà Nẵng → TP.HCM", duration: "85 phút", travel: "—",       amount: "1.960.000 đ", done: false },
    ],
  },
];

export function B8ChuyenDiScreen() {
  const { nav, activeDay, setActiveDay } = useApp();
  const [checked, setChecked] = useState<Record<string, boolean>>({ "d1-1": true, "d1-2": true, "d2-1": true });
  const [toast, setToast] = useState<string | null>(null);

  const toggleCheck = (id: string, title: string) => {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id]) {
        setToast(title);
        setTimeout(() => setToast(null), 3000);
      }
      return next;
    });
  };

  const dayData = DAYS_DATA[activeDay - 1];
  const totalDone = Object.values(checked).filter(Boolean).length;
  const totalItems = DAYS_DATA.flatMap(d => d.items).length;

  return (
    <div className="tv-layout">
      <SideNav />
      <div className="tv-main animate-in" style={{ maxWidth: 800 }}>
        <h1 className="page-title">Chuyến đi</h1>
        <p className="page-sub">{totalDone} trong {totalItems} địa điểm đã đến</p>

        {/* Day tabs */}
        <div className="tabs">
          {DAYS_DATA.map(d => (
            <div key={d.num} className={`tab-item ${activeDay === d.num ? "active" : ""}`} onClick={() => setActiveDay(d.num)}>
              Ngày {d.num}
            </div>
          ))}
        </div>

        <div className="daycard">
          <div className="daycard-head">
            <div className="daycard-name">Ngày {dayData.num}</div>
            <div className="daycard-total">
              {dayData.items.filter(i => checked[i.id]).length}/{dayData.items.length} địa điểm đã đến
            </div>
          </div>

          {dayData.items.map(item => (
            <div key={item.id} className="item">
              <div
                className={`checkbox ${checked[item.id] ? "checked" : ""}`}
                onClick={() => toggleCheck(item.id, item.title)}
              >
                {checked[item.id] && "✓"}
              </div>
              <div className="item-time">{item.time}</div>
              <div className="item-info">
                <div className="item-title" style={{ textDecoration: checked[item.id] ? "line-through" : "none", color: checked[item.id] ? "var(--g400)" : undefined }}>
                  {item.title}
                </div>
                <div className="item-sub">{item.duration}</div>
              </div>
              <div className="item-amount">
                {item.amount}
                {item.travel !== "—" && <span className="item-amount-sub">{item.travel} tới điểm kế</span>}
              </div>
              <div className="item-action" style={{ width: 100 }}>
                <button className="btn btn-outline btn-sm" onClick={() => nav("b9-chi-duong")}>
                  Chỉ đường
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="hint">Tick khi bạn đã đến một địa điểm. Bạn có thể bỏ tick nếu bấm nhầm.</div>
      </div>

      {/* Budget mini */}
      <div className="tv-side">
        <div className="budget-box">
          <div className="budget-label">Ngân sách còn lại</div>
          <div className="budget-big" style={{ fontSize: 22 }}>2.584.000 đ</div>
          <div className="budget-sub">Đã chi thực tế 1.296.000 đ</div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: "13%" }} />
          </div>
          <div className="divider" />
          <span className="text-link" onClick={() => nav("b11-ngan-sach")}>Xem chi tiết ngân sách →</span>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast">
          <span>✓ Đã đánh dấu <b>{toast}</b>. Thêm chi tiêu?</span>
          <button className="toast-btn" onClick={() => nav("b10-chon-nguon")}>Thêm</button>
          <button className="toast-btn" onClick={() => setToast(null)}>Bỏ qua</button>
          <button className="toast-btn" onClick={() => setToast(null)}>Hoàn tác</button>
        </div>
      )}
    </div>
  );
}
