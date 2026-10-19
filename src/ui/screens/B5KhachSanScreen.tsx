"use client";
import React, { useState } from "react";
import { useApp } from "@/ui/context/AppContext";
import { SideNav } from "@/ui/components/SideNav";
import { BudgetBox } from "@/ui/components/BudgetBox";

interface HotelOption {
  id: string;
  name: string;
  stars: number;
  area: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  includesBreakfast: boolean;
  hasPool: boolean;
  year: number;
  praised: string;
  watchOut: string;
  tip: string;
  badge?: string;
  warning?: string;
}

const HOTELS: HotelOption[] = [
  {
    id: "hotel-002",
    name: "Brilliant Hotel Đà Nẵng (mẫu)",
    stars: 4,
    area: "Trung tâm",
    rating: 8.7,
    reviewCount: 3210,
    pricePerNight: 1_100_000,
    includesBreakfast: true,
    hasPool: true,
    year: 2012,
    praised: "Sạch sẽ, buffet phong phú, gần cầu Rồng.",
    watchOut: "Giao thông trước khách sạn đông vào giờ cao điểm.",
    tip: "Đi bộ sang chợ Hàn chỉ 5 phút.",
    badge: "Đang chọn",
  },
  {
    id: "hotel-003",
    name: "Bella Villa Đà Nẵng (mẫu)",
    stars: 3,
    area: "An Thượng",
    rating: 8.2,
    reviewCount: 890,
    pricePerNight: 650_000,
    includesBreakfast: false,
    hasPool: false,
    year: 2018,
    praised: "Giá tốt, phòng rộng rãi, gần biển Mỹ Khê.",
    watchOut: "Không có buffet sáng, bãi xe nhỏ.",
    tip: "Khu phố Tây An Thượng có vô số quán cà phê đẹp.",
    badge: "Tiết kiệm nhất",
  },
  {
    id: "hotel-001",
    name: "Furama Resort Đà Nẵng (mẫu)",
    stars: 5,
    area: "Mỹ Khê",
    rating: 9.1,
    reviewCount: 4820,
    pricePerNight: 2_450_000,
    includesBreakfast: true,
    hasPool: true,
    year: 2000,
    praised: "Bãi biển riêng tuyệt đẹp, hồ bơi vô cực đẳng cấp.",
    watchOut: "Chi phí cao hơn mức trung bình của nhóm.",
    tip: "Thích hợp thư giãn nghỉ dưỡng phong cách resort.",
    badge: "Cao cấp",
  },
  {
    id: "hotel-004",
    name: "Luxury Sky Tower Đà Nẵng (mẫu)",
    stars: 5,
    area: "Sơn Trà",
    rating: 9.4,
    reviewCount: 1250,
    pricePerNight: 4_250_000,
    includesBreakfast: true,
    hasPool: true,
    year: 2022,
    praised: "View bán đảo Sơn Trà tuyệt đỉnh, ẩm thực sang trọng.",
    watchOut: "Vượt ngưỡng ngân sách phân bổ cho chỗ ở.",
    tip: "Phù hợp các dịp kỷ niệm đặc biệt.",
    warning: "Vượt ngân sách",
  },
];

const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

export function B5KhachSanScreen() {
  const { nav } = useApp();
  const [selected, setSelected] = useState<string>("hotel-002");
  const [filterPool, setFilterPool] = useState<boolean>(false);
  const [filterBreakfast, setFilterBreakfast] = useState<boolean>(false);

  const filtered = HOTELS.filter(h => {
    if (filterPool && !h.hasPool) return false;
    if (filterBreakfast && !h.includesBreakfast) return false;
    return true;
  });

  return (
    <div className="tv-layout">
      <SideNav />
      <div className="tv-main animate-in">
        <span
          className="text-link"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16, fontSize: 14 }}
          onClick={() => nav("b3-ke-hoach")}
        >
          ← Quay lại kế hoạch
        </span>
        <h1 className="page-title">Đổi khách sạn</h1>
        <p className="page-sub">2 đêm, 1 phòng cho 2 người tại Đà Nẵng.</p>

        {/* Filter bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className={`chip ${filterPool ? "on" : ""}`}
              onClick={() => setFilterPool(!filterPool)}
            >
              🏊 Có hồ bơi
            </button>
            <button
              className={`chip ${filterBreakfast ? "on" : ""}`}
              onClick={() => setFilterBreakfast(!filterBreakfast)}
            >
              🍳 Buffet sáng đã gồm
            </button>
          </div>
          <div style={{ fontSize: 13, color: "var(--g500)" }}>
            Hiển thị {filtered.length} / {HOTELS.length} khách sạn
          </div>
        </div>

        {/* List hotels */}
        {filtered.map(h => {
          const isSelected = selected === h.id;
          const total2Nights = h.pricePerNight * 2;
          const currentTotal = 2_200_000;
          const diff = total2Nights - currentTotal;

          return (
            <div
              key={h.id}
              className={`card ${isSelected ? "card-selected" : "card-hover"}`}
              style={{ padding: 20, marginBottom: 14, cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => setSelected(h.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "var(--navy)" }}>{h.name}</div>
                    {h.warning && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", background: "#FEE2E2", color: "var(--error)", borderRadius: "var(--r-full)" }}>
                        {h.warning}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--g500)", marginBottom: 4 }}>
                    {"⭐".repeat(h.stars)} · Khu vực {h.area} · Điểm <b>{h.rating}</b> ({h.reviewCount.toLocaleString()} đánh giá)
                  </div>
                  <div style={{ fontSize: 12, color: "var(--g700)", display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                    <span>Buffet: <b>{h.includesBreakfast ? "Đã gồm" : "Tự túc"}</b></span>
                    <span>Hồ bơi: <b>{h.hasPool ? "Có" : "Không"}</b></span>
                    <span>Khai trương: <b>{h.year}</b></span>
                  </div>

                  <div className="said" style={{ marginTop: 12 }}>
                    <div className="said-title">Người đi trước nói gì:</div>
                    <div>👍 {h.praised}</div>
                    <div style={{ color: "var(--warning)", marginTop: 2 }}>⚠️ {h.watchOut}</div>
                    <div style={{ color: "var(--p500)", marginTop: 2 }}>💡 Mẹo: {h.tip}</div>
                  </div>
                </div>

                <div style={{ textAlign: "right", minWidth: 160, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: isSelected ? "var(--p500)" : "var(--navy)" }}>
                    {fmt(h.pricePerNight)} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--g500)" }}>/đêm</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--g500)", marginTop: 2 }}>
                    2 đêm: <b>{fmt(total2Nights)}</b>
                  </div>
                  {diff !== 0 && (
                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: diff > 0 ? "var(--error)" : "var(--success)" }}>
                      {diff > 0 ? `+${fmt(diff)}` : `−${fmt(Math.abs(diff))}`}
                    </div>
                  )}
                  {h.badge && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: "3px 10px",
                        background: isSelected ? "var(--p500)" : "var(--p100)",
                        color: isSelected ? "white" : "var(--p500)",
                        borderRadius: "var(--r-full)",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {h.badge}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <button className="btn btn-outline" onClick={() => nav("b3-ke-hoach")}>
            Hủy
          </button>
          <button className="btn btn-primary" onClick={() => nav("b6-xem-truoc")}>
            Xem trước thay đổi →
          </button>
        </div>
      </div>
      <div className="tv-side">
        <BudgetBox />
      </div>
    </div>
  );
}
