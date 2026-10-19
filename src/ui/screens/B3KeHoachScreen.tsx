"use client";
import React, { useState } from "react";
import { useApp } from "@/ui/context/AppContext";
import { SideNav } from "@/ui/components/SideNav";
import { BudgetBox } from "@/ui/components/BudgetBox";

interface PlanDayItem {
  time: string;
  tag: string;
  tagClass: string;
  title: string;
  sub: string;
  amount: string;
  amountSub: string;
  canSwap: boolean;
  photo: string | null;
  said?: string;
}

interface PlanDay {
  num: number;
  total: string;
  items: PlanDayItem[];
}

const DAYS: PlanDay[] = [
  {
    num: 1, total: "4.760.000 đ",
    items: [
      { time: "06:30", tag: "Di chuyển",  tagClass: "tag-move",  title: "Máy bay TP.HCM → Đà Nẵng", sub: "Hãng bay Mẫu B · đến 07:55 · 85 phút", amount: "1.960.000 đ", amountSub: "2 vé × 980.000 đ", canSwap: true, photo: null },
      { time: "09:30", tag: "Vui chơi",   tagClass: "tag-fun",   title: "Bãi biển Mỹ Khê",          sub: "2 giờ · di chuyển 20 phút tới điểm kế", amount: "Miễn phí", amountSub: "", canSwap: true, photo: null },
      { time: "—",     tag: "Ăn uống",    tagClass: "tag-food",  title: "Ăn uống cả ngày",           sub: "Ước tính 300.000 đ mỗi người", amount: "600.000 đ", amountSub: "", canSwap: false, photo: null },
      {
        time: "14:00", tag: "Chỗ ở",    tagClass: "tag-stay",  title: "Khách sạn Mẫu 02",          sub: "4 sao · Mỹ Khê · Điểm 8,6 · 1.240 đánh giá · Có hồ bơi · Buffet sáng đã gồm",
        amount: "2.200.000 đ", amountSub: "2 đêm × 1.100.000 đ", canSwap: true,
        photo: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=160&h=100&fit=crop",
        said: "Khen: sạch sẽ, buffet đa dạng. Lưu ý: hồ bơi đông giờ chiều."
      },
    ],
  },
  {
    num: 2, total: "920.000 đ",
    items: [
      { time: "09:30", tag: "Vui chơi",  tagClass: "tag-fun",  title: "Ngũ Hành Sơn",  sub: "2,5 giờ · di chuyển 25 phút tới điểm kế", amount: "80.000 đ",  amountSub: "2 vé × 40.000 đ", canSwap: true, photo: null },
      { time: "15:30", tag: "Vui chơi",  tagClass: "tag-fun",  title: "Phố cổ Hội An",  sub: "4 giờ · di chuyển 10 phút tới điểm kế",  amount: "240.000 đ", amountSub: "2 vé × 120.000 đ", canSwap: true, photo: null },
      { time: "—",     tag: "Ăn uống",   tagClass: "tag-food", title: "Ăn uống cả ngày", sub: "Ước tính 300.000 đ mỗi người", amount: "600.000 đ", amountSub: "", canSwap: false, photo: null },
    ],
  },
  {
    num: 3, total: "3.860.000 đ",
    items: [
      { time: "09:30", tag: "Vui chơi",  tagClass: "tag-fun",  title: "Bà Nà Hills",          sub: "6 giờ · di chuyển 45 phút tới sân bay", amount: "1.300.000 đ", amountSub: "2 vé × 650.000 đ", canSwap: true, photo: null },
      { time: "—",     tag: "Ăn uống",   tagClass: "tag-food", title: "Ăn uống cả ngày",       sub: "Ước tính 300.000 đ mỗi người",          amount: "600.000 đ",   amountSub: "", canSwap: false, photo: null },
      { time: "18:00", tag: "Di chuyển", tagClass: "tag-move", title: "Máy bay Đà Nẵng → TP.HCM", sub: "Hãng bay Mẫu B · đến 19:25 · 85 phút", amount: "1.960.000 đ", amountSub: "2 vé × 980.000 đ", canSwap: true, photo: null },
    ],
  },
];

const VIBES = ["Biển","Ẩm thực","Hải sản","Văn hóa","Thiên nhiên","Vui chơi","Thư giãn","Chụp ảnh","Mua sắm"];

export function B3KeHoachScreen() {
  const { nav } = useApp();
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [vibe, setVibe] = useState("");

  const toggleVibe = (v: string) =>
    setSelectedVibes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  return (
    <div className="tv-layout">
      <SideNav />
      <div className="tv-main animate-in" style={{ overflowY: "auto" }}>
        {/* Warning banner */}
        <div className="banner banner-warn">
          <div className="banner-mark">!</div>
          <div>
            <div className="banner-title">Lưu ý</div>
            <div className="banner-text">Đã dùng 95,4% ngân sách, còn lại 460.000 đ.</div>
            <div className="banner-text">Máy bay đến lúc 07:55, sớm hơn giờ nhận phòng 14:00. Nên gửi hành lý tại khách sạn.</div>
          </div>
        </div>

        <div className="section-title">Kế hoạch theo ngày</div>

        {DAYS.map(day => (
          <div key={day.num} className="daycard">
            <div className="daycard-head">
              <div className="daycard-name">Ngày {day.num}</div>
              <div className="daycard-total">{day.total}</div>
            </div>

            {day.items.map((item, i) => (
              <React.Fragment key={i}>
                <div className="item">
                  <div className="item-time">{item.time}</div>
                  <span className={`tag ${item.tagClass}`}>{item.tag}</span>
                  {item.photo && (
                    <div className="item-photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.photo} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div className="item-info">
                    <div className="item-title">{item.title}</div>
                    <div className="item-sub">{item.sub}</div>
                  </div>
                  <div className="item-amount">
                    {item.amount}
                    {item.amountSub && <span className="item-amount-sub">{item.amountSub}</span>}
                  </div>
                  <div className="item-action">
                    {item.canSwap && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => nav(item.tag === "Chỗ ở" ? "b5-khach-san" : "b4-phuong-tien")}
                      >
                        Đổi
                      </button>
                    )}
                  </div>
                </div>
                {item.said && (
                  <div className="item-extra">
                    <div className="said">
                      <div className="said-title">Người đi trước nói gì</div>
                      {item.said} &nbsp;
                      <span style={{ color: "var(--g400)", fontStyle: "italic" }}>Nguồn: tổng hợp từ đánh giá công khai (dữ liệu mẫu).</span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        ))}

        {/* Personal panel */}
        <div className="personal-panel">
          <div className="panel-title">✨ Muốn kế hoạch hợp gu hơn?</div>
          <div className="panel-sub">Chọn điều bạn thích, AI sẽ gợi ý lại các hoạt động. Bạn xem trước thay đổi rồi mới áp dụng.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {VIBES.map(v => (
              <button key={v} className={`chip ${selectedVibes.includes(v) ? "on" : ""}`} onClick={() => toggleVibe(v)}>
                {v}
              </button>
            ))}
          </div>
          <textarea
            className="textarea"
            style={{ marginBottom: 14 }}
            placeholder="Hoặc nhắn thêm, ví dụ: thêm một buổi cà phê view biển"
            value={vibe}
            onChange={e => setVibe(e.target.value)}
          />
          <button className="btn btn-primary btn-sm">🔄 &nbsp; Gợi ý lại</button>
        </div>
      </div>

      <div className="tv-side">
        <BudgetBox />
      </div>
    </div>
  );
}
