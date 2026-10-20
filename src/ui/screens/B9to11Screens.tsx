"use client";
import React from "react";
import { useApp } from "@/ui/context/AppContext";
import { Map, MapPin, ArrowLeft, ExternalLink } from "lucide-react";

export function B9ChiDuongScreen() {
  const { nav } = useApp();
  return (
    <div className="Row2" style={{ padding: "0 0 40px" }}>
      <div className="Main" style={{ width: 860 }}>
        <button
          type="button"
          className="Btn BtnSmall BtnGhost"
          style={{ marginBottom: 16 }}
          onClick={() => nav("b8-chuyen-di")}
        >
          <ArrowLeft size={16} />
          Quay lại chuyến đi
        </button>

        <h1 className="H1">Chỉ đường</h1>
        <div className="Sub">Đến Phố cổ Hội An từ Ngũ Hành Sơn</div>

        {/* Map Header Card */}
        <div
          style={{
            borderRadius: 22,
            overflow: "hidden",
            marginBottom: 20,
            height: 300,
            background: "linear-gradient(135deg, #CFE5F8, #E9F4FE)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #D5E0F3",
            position: "relative",
          }}
        >
          <div style={{ textAlign: "center", color: "#5C6B88" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8, color: "#2B55D6" }}>
              <Map size={48} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1F2A44" }}>Bản đồ chỉ đường trực tuyến</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Ngũ Hành Sơn → Phố cổ Hội An</div>
          </div>
        </div>

        {/* Route Steps Card */}
        <div className="DayCard" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: "1px solid #EAF0FA", paddingBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1F2A44" }}>Khoảng cách</div>
              <div style={{ color: "#5C6B88", fontSize: 13, marginTop: 2 }}>~12 km</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1F2A44" }}>Thời gian dự kiến</div>
              <div style={{ color: "#5C6B88", fontSize: 13, marginTop: 2 }}>~20 phút (xe máy/ô tô)</div>
            </div>
          </div>

          {[
            { icon: "1", text: "Đi thẳng đường Nguyễn Duy Trinh ~6 km hướng về Ngũ Hành Sơn" },
            { icon: "2", text: "Rẽ trái vào đường Lê Văn Hiến, đi thẳng tiếp nối vào đường Trần Hưng Đạo" },
            { icon: "3", text: "Đến ngã tư Cầu An Hội, qua cầu vào trung tâm Phố cổ Hội An" },
          ].map((s) => (
            <div
              key={s.icon}
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 10,
                padding: "12px 14px",
                background: "#F4F8FE",
                borderRadius: 14,
                border: "1px solid #E1EAF8",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  background: "#2B55D6",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <span style={{ fontSize: 14, color: "#34476E" }}>{s.text}</span>
            </div>
          ))}

          <a
            href="https://www.google.com/maps/dir/?api=1&destination=Ph%E1%BB%91+c%E1%BB%95+H%E1%BB%99i+An"
            target="_blank"
            rel="noopener noreferrer"
            className="Btn BtnPrimary BtnFull"
            style={{
              marginTop: 18,
              textDecoration: "none",
            }}
          >
            <MapPin size={16} />
            Mở chỉ đường trên Google Maps
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

export { B10ChonNguonScreen } from "./B10ChonNguonScreen";
export { B11NganSachScreen } from "./B11NganSachScreen";
export default B9ChiDuongScreen;
