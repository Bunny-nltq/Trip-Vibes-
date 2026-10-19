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

export { B10ChonNguonScreen } from "./B10ChonNguonScreen";
export { B11NganSachScreen } from "./B11NganSachScreen";
