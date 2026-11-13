"use client";

import { useState } from "react";
import { ArrowLeft, Check, Compass } from "lucide-react";
import { getDiemDenTen } from "@/contracts";
import { useApp } from "@/ui/context/AppContext";
import { BudgetBox } from "@/ui/components/BudgetBox";
import styles from "@/ui/components/Journey.module.css";

const money = (amount: number) => `${amount.toLocaleString("vi-VN")} đ`;

export function B7XacNhanScreen() {
  const { plan, nav, confirmed, setConfirmed, user, saveCurrentTripToAccount } = useApp();
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  if (!plan) return null;
  const { request, items } = plan;
  const days = [...new Set(items.map(item => item.ngay))];

  async function startTrip() {
    setStarting(true);
    setError("");
    try {
      if (user) {
        const result = await saveCurrentTripToAccount(undefined, {
          status: "in_progress", startDate: request.travelDates?.departureDate ?? null,
        });
        if (!result.ok) {
          setError(result.message || "Chưa lưu được trạng thái chuyến đi.");
          return;
        }
      }
      nav("b8-chuyen-di");
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className={styles.reviewLayout}>
      <section className={styles.panel}>
        <button type="button" className="btn btn-outline" onClick={() => nav("b3-ke-hoach")}><ArrowLeft size={16} /> Tổng quan</button>
        <h1 className={styles.reviewTitle}>{confirmed ? "Lịch trình đã chốt" : "Xem lại trước khi chốt"}</h1>
        <p>{getDiemDenTen(request.diemDi)} → {getDiemDenTen(request.diemDen)} · {request.soNgay} ngày · {request.soNguoi} người</p>
        <div className={styles.reviewDays}>
          {days.map(day => {
            const stops = items.filter(item => item.ngay === day);
            return <details key={day}>
              <summary>Ngày {day} <span>{money(stops.reduce((sum, item) => sum + item.thanhTien, 0))}</span></summary>
              <ul>{stops.map((item, index) => <li key={index}><span>{item.gio ?? "—"}</span><span>{item.noiDung}</span><strong>{item.thanhTien ? money(item.thanhTien) : item.priceKnown === true ? "0 đ" : "Chưa có giá"}</strong></li>)}</ul>
            </details>;
          })}
        </div>
        {error && <p role="alert">{error}</p>}
        {confirmed
          ? <button type="button" className={styles.primary} disabled={starting} onClick={() => void startTrip()}><Compass size={17} /> {starting ? "Đang mở…" : "Mở tiến độ chuyến đi"}</button>
          : <button type="button" className={styles.primary} onClick={() => setConfirmed(true)}><Check size={17} /> Chốt lịch trình</button>}
      </section>
      <aside><BudgetBox plan={plan} /></aside>
    </div>
  );
}
