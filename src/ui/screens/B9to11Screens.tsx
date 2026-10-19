"use client";
import React, { useState } from "react";
import { useApp } from "@/ui/context/AppContext";
import { SideNav } from "@/ui/components/SideNav";

import { Map, MapPin, ArrowLeft, ExternalLink } from "lucide-react";

export function B9ChiDuongScreen() {
  const { nav } = useApp();
  return (
    <div className="tv-layout">
      <SideNav />
      <div className="tv-main animate-in">
        <span
          className="text-link"
          style={{ marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={() => nav("b8-chuyen-di")}
        >
          <ArrowLeft size={16} />
          Quay lại chuyến đi
        </span>
        <h1 className="page-title">Chỉ đường</h1>
        <p className="page-sub">Đến Phố cổ Hội An từ Ngũ Hành Sơn</p>
        {/* Map placeholder */}
        <div style={{ borderRadius: "var(--r-xl)", overflow: "hidden", marginBottom: 20, height: 340, background: "linear-gradient(135deg, #DBEAFE, #CCFBF1)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--g100)" }}>
          <div style={{ textAlign: "center", color: "var(--g400)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <Map size={48} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Bản đồ chỉ đường</div>
            <div style={{ fontSize: 13 }}>Ngũ Hành Sơn → Phố cổ Hội An</div>
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div><div style={{ fontWeight: 700, fontSize: 16 }}>Khoảng cách</div><div style={{ color: "var(--g500)" }}>~12 km</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700, fontSize: 16 }}>Thời gian</div><div style={{ color: "var(--g500)" }}>~10 phút (xe máy)</div></div>
          </div>
          {[
            { icon: "1", text: "Đi thẳng đường Nguyễn Duy Trinh ~6 km" },
            { icon: "2", text: "Rẽ trái vào đường Lê Văn Hiến" },
            { icon: "3", text: "Đến Cầu An Hội, vào Phố cổ" },
          ].map(s => (
            <div key={s.icon} style={{ display: "flex", gap: 12, marginBottom: 12, padding: "10px 14px", background: "var(--g50)", borderRadius: "var(--r-md)" }}>
              <div style={{ width: 24, height: 24, background: "var(--p500)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 700, flex: "none" }}>{s.icon}</div>
              <span style={{ fontSize: 14 }}>{s.text}</span>
            </div>
          ))}
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=Ph%E1%BB%91+c%E1%BB%95+H%E1%BB%99i+An"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-full"
            style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none" }}
          >
            <MapPin size={16} />
            Mở Google Maps
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

export function B10ChonNguonScreen() {
  const { nav } = useApp();
  const [mode, setMode] = useState<"photo" | "manual" | null>(null);
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="tv-layout">
        <SideNav />
        <div className="tv-main animate-in">
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <h1 className="page-title">Xác nhận chi tiêu</h1>
            <p className="page-sub">AI đọc bill. Bạn xác nhận trước khi ghi vào sổ.</p>
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#FFF8E6", borderRadius: "var(--r-md)", marginBottom: 20, fontSize: 13, color: "#92400E" }}>
                ⚠️ &nbsp; Số tiền này do AI đọc từ ảnh. Hãy kiểm tra trước khi lưu.
              </div>
              <div className="field"><div className="field-label">Nội dung</div><input className="input" defaultValue="Bữa trưa hải sản" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="field"><div className="field-label">Số tiền (đ)</div><input className="input" defaultValue="560000" /></div>
                <div className="field"><div className="field-label">Ngày</div><input className="input" defaultValue="Ngày 1" /></div>
              </div>
              <div className="field"><div className="field-label">Hạng mục</div><input className="input" defaultValue="Ăn uống" /></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-outline" onClick={() => { setConfirm(false); setMode(null); }}>Hủy</button>
              <button className="btn btn-primary" onClick={() => nav("b11-ngan-sach")}>Lưu chi tiêu</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tv-layout">
      <SideNav />
      <div className="tv-main animate-in">
        <span className="text-link" style={{ marginBottom: 16, display: "inline-block" }} onClick={() => nav("b8-chuyen-di")}>← Quay lại</span>
        <h1 className="page-title">Thêm chi tiêu</h1>
        <p className="page-sub">Chụp bill hoặc nhập tay.</p>

        {!mode ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 480 }}>
            <div className="card card-hover" style={{ padding: 28, textAlign: "center", cursor: "pointer" }} onClick={() => setMode("photo")}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Chụp ảnh bill</div>
              <div style={{ fontSize: 13, color: "var(--g500)", marginTop: 4 }}>AI sẽ đọc và điền số</div>
            </div>
            <div className="card card-hover" style={{ padding: 28, textAlign: "center", cursor: "pointer" }} onClick={() => setMode("manual")}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✏️</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Nhập tay</div>
              <div style={{ fontSize: 13, color: "var(--g500)", marginTop: 4 }}>Nhập thủ công từng khoản</div>
            </div>
          </div>
        ) : mode === "photo" ? (
          <div style={{ maxWidth: 480 }}>
            <div className="drop-zone" onClick={() => setConfirm(true)}>
              <div style={{ fontSize: 40 }}>📸</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginTop: 4 }}>Tải ảnh bill lên</div>
              <div className="hint">Click để chọn ảnh (JPEG, PNG)</div>
              <div className="hint" style={{ color: "var(--p500)", marginTop: 4 }}>Ảnh chỉ xử lý trong bộ nhớ, không lưu đĩa</div>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 480 }}>
            <div className="card" style={{ padding: 24 }}>
              <div className="field"><div className="field-label">Nội dung</div><input className="input" placeholder="Ví dụ: Bữa tối hải sản" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div className="field"><div className="field-label">Số tiền (đ)</div><input className="input" type="number" placeholder="0" /></div>
                <div className="field"><div className="field-label">Ngày</div><input className="input" defaultValue="Ngày 2" /></div>
              </div>
              <div className="field"><div className="field-label">Hạng mục</div><input className="input" defaultValue="Ăn uống" /></div>
              <button className="btn btn-primary btn-full" onClick={() => nav("b11-ngan-sach")}>Lưu chi tiêu</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const EXPENSES = [
  { day: "Ngày 1", name: "Bữa trưa hải sản",       cat: "Ăn uống",  amount: 560_000, src: "bill" },
  { day: "Ngày 1", name: "Cà phê Góc Phố",          cat: "Ăn uống",  amount: 108_000, src: "bill" },
  { day: "Ngày 2", name: "Vé Khu tham quan Sơn Thủy", cat: "Vui chơi", amount: 80_000,  src: "bill" },
  { day: "Ngày 2", name: "Vé phố cổ Hội An",        cat: "Vui chơi", amount: 240_000, src: "manual" },
  { day: "Ngày 2", name: "Bữa tối Quán Ăn Phố Cổ", cat: "Ăn uống",  amount: 308_000, src: "bill" },
];

export function B11NganSachScreen() {
  const { nav } = useApp();
  const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

  return (
    <div className="tv-layout">
      <SideNav />
      <div className="tv-main animate-in" style={{ maxWidth: 1100 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 className="page-title">Ngân sách thực tế</h1>
            <p className="page-sub">Kế hoạch so với chi tiêu bạn đã ghi.</p>
          </div>
          <button className="btn btn-primary" onClick={() => nav("b10-chon-nguon")}>
            + Thêm chi tiêu
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Ngân sách", num: "10.000.000 đ", color: "var(--navy)" },
            { label: "Đã đặt trước", num: "6.120.000 đ", color: "var(--p500)" },
            { label: "Đã chi thực tế", num: "1.296.000 đ", color: "var(--warning)" },
            { label: "Còn lại", num: "2.584.000 đ", color: "var(--success)" },
          ].map(s => (
            <div key={s.label} className="stat">
              <div className="stat-label">{s.label}</div>
              <div className="stat-num" style={{ color: s.color }}>{s.num}</div>
            </div>
          ))}
        </div>

        {/* Forecast */}
        <div className="card" style={{ padding: "14px 20px", marginBottom: 16, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
          <span style={{ fontWeight: 700 }}>Dự báo ngày 3:</span> kế hoạch 1.900.000 đ, còn lại 2.584.000 đ. &nbsp;
          <span style={{ color: "var(--success)", fontWeight: 600 }}>Ngân sách ngày 3 đủ, dư 684.000 đ.</span>
        </div>

        {/* Compare table */}
        <div className="card" style={{ marginBottom: 20, overflow: "hidden" }}>
          <table className="tv-table">
            <thead>
              <tr>
                <th>Hạng mục (đến hết ngày 2)</th>
                <th className="text-right">Kế hoạch</th>
                <th className="text-right">Thực tế</th>
                <th className="text-right">Chênh lệch</th>
                <th className="text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cat: "Ăn uống", plan: 1_200_000, actual: 976_000 },
                { cat: "Vui chơi", plan: 320_000, actual: 320_000 },
              ].map(r => {
                const diff = r.actual - r.plan;
                const pct = ((diff / r.plan) * 100).toFixed(1);
                return (
                  <tr key={r.cat}>
                    <td>{r.cat}</td>
                    <td className="text-right">{fmt(r.plan)}</td>
                    <td className="text-right">{fmt(r.actual)}</td>
                    <td className="text-right" style={{ color: diff < 0 ? "var(--success)" : "var(--error)", fontWeight: 600 }}>
                      {diff < 0 ? "−" : "+"}{fmt(Math.abs(diff))}
                    </td>
                    <td className="text-right" style={{ color: diff < 0 ? "var(--success)" : "var(--error)", fontWeight: 600 }}>
                      {diff < 0 ? "" : "+"}{pct}%
                    </td>
                  </tr>
                );
              })}
              <tr style={{ fontWeight: 700, background: "var(--g50)" }}>
                <td>Cộng</td>
                <td className="text-right">1.520.000 đ</td>
                <td className="text-right">1.296.000 đ</td>
                <td className="text-right" style={{ color: "var(--success)" }}>−224.000 đ</td>
                <td className="text-right" style={{ color: "var(--success)" }}>−14,7%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Expenses list */}
        <div className="section-title">Các khoản chi</div>
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="tv-table">
            <thead>
              <tr>
                <th>Ngày</th><th>Nội dung</th><th>Hạng mục</th>
                <th className="text-right">Số tiền</th><th>Nguồn</th><th className="text-right"></th>
              </tr>
            </thead>
            <tbody>
              {EXPENSES.map((e, i) => (
                <tr key={i}>
                  <td style={{ color: "var(--g500)" }}>{e.day}</td>
                  <td style={{ fontWeight: 500 }}>{e.name}</td>
                  <td>{e.cat}</td>
                  <td className="text-right" style={{ fontWeight: 600 }}>{fmt(e.amount)}</td>
                  <td><span className={`pill ${e.src === "bill" ? "bill" : ""}`}>{e.src === "bill" ? "Ảnh bill" : "Nhập tay"}</span></td>
                  <td className="text-right">
                    <span className="text-link" style={{ marginRight: 8 }}>Sửa</span>
                    <span className="text-link" style={{ color: "var(--error)" }}>Xóa</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
