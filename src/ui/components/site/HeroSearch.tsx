"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Users,
  Wallet,
  Send,
  AlertCircle
} from "lucide-react";
import { dinhDangTien, docTien } from "@/core/formB1";
import { taoGoiChuyenB1, luuGoiChuyenVaoSession } from "@/ui/lib/chuyenB1";

export interface HeroSearchProps {
  onSuccess?: () => void;
}

const PRESET_DESTINATIONS = ["Đà Nẵng", "Hà Nội", "Đà Lạt", "Bangkok", "Seoul"];

export function HeroSearch({ onSuccess }: HeroSearchProps) {
  const router = useRouter();
  const [diemDi, setDiemDi] = useState("TP.HCM");
  const [diemDen, setDiemDen] = useState("");
  const [soNgay, setSoNgay] = useState(3);
  const [soNguoi, setSoNguoi] = useState(2);
  const [nganSachTheo, setNganSachTheo] = useState<"tong" | "moi_nguoi">("tong");
  const [nganSachStr, setNganSachStr] = useState("10.000.000");
  const [loi, setLoi] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoi(null);

    const soTien = docTien(nganSachStr) ?? 0;
    const res = taoGoiChuyenB1({
      diemDi,
      diemDen,
      soNguoi,
      soNgay,
      nganSach: {
        soTien,
        theo: nganSachTheo,
      },
    });

    if (!res.ok) {
      if (res.loi === "thieu_diem_den") setLoi("Vui lòng chọn hoặc nhập điểm đến.");
      else if (res.loi === "so_nguoi") setLoi("Số người phải từ 1 đến 10 người.");
      else if (res.loi === "so_ngay") setLoi("Thời gian chuyến đi phải từ 2 đến 5 ngày.");
      else if (res.loi === "ngan_sach") setLoi("Vui lòng nhập ngân sách hợp lệ (lớn hơn 0).");
      return;
    }

    // Lưu vào sessionStorage để B1 nhận
    luuGoiChuyenVaoSession(res.data);
    if (onSuccess) {
      onSuccess();
    }
    // Chuyển hướng sang khu vực ứng dụng lập kế hoạch
    router.push("/lap-ke-hoach");
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "var(--color-surface)",
        borderRadius: "var(--r-xl)",
        padding: "24px",
        boxShadow: "0 8px 30px rgba(43, 85, 214, 0.08)",
        border: "1px solid var(--color-border)",
        maxWidth: 880,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20
      }}
    >
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 16
      }}>
        {/* Đi từ */}
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
            <MapPin size={15} style={{ color: "var(--color-primary-main)" }} />
            <span>Đi từ</span>
          </label>
          <input
            type="text"
            value={diemDi}
            onChange={(e) => setDiemDi(e.target.value)}
            placeholder="TP.HCM, Hà Nội..."
            style={{
              width: "100%",
              height: 44,
              padding: "0 12px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--color-border-input)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              fontSize: 14,
              outline: "none"
            }}
          />
        </div>

        {/* Đến nơi */}
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
            <MapPin size={15} style={{ color: "var(--color-secondary-500)" }} />
            <span>Điểm đến</span>
          </label>
          <input
            type="text"
            value={diemDen}
            onChange={(e) => setDiemDen(e.target.value)}
            placeholder="Đà Nẵng, Seoul..."
            style={{
              width: "100%",
              height: 44,
              padding: "0 12px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--color-border-input)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              fontSize: 14,
              outline: "none"
            }}
          />
        </div>

        {/* Số ngày (2 - 5) */}
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
            <Calendar size={15} style={{ color: "var(--color-primary-main)" }} />
            <span>Số ngày</span>
          </label>
          <div style={{ display: "flex", gap: 6, height: 44 }}>
            {[2, 3, 4, 5].map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setSoNgay(d)}
                style={{
                  flex: 1,
                  border: soNgay === d ? "2px solid var(--color-primary-main)" : "1px solid var(--color-border)",
                  background: soNgay === d ? "var(--color-primary-tint)" : "var(--color-surface)",
                  color: soNgay === d ? "var(--color-primary-main)" : "var(--color-text)",
                  fontWeight: soNgay === d ? 700 : 500,
                  borderRadius: "var(--r-md)",
                  cursor: "pointer",
                  fontSize: 13
                }}
              >
                {d}N
              </button>
            ))}
          </div>
        </div>

        {/* Số người */}
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
            <Users size={15} style={{ color: "var(--color-primary-main)" }} />
            <span>Số người</span>
          </label>
          <select
            value={soNguoi}
            onChange={(e) => setSoNguoi(parseInt(e.target.value, 10))}
            style={{
              width: "100%",
              height: 44,
              padding: "0 12px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--color-border-input)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              fontSize: 14,
              outline: "none"
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} người
              </option>
            ))}
          </select>
        </div>

        {/* Ngân sách */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
              <Wallet size={15} style={{ color: "var(--color-hang-muc-an-uong)" }} />
              <span>Ngân sách</span>
            </label>
            <div style={{ fontSize: 11, display: "flex", gap: 4 }}>
              <button
                type="button"
                onClick={() => setNganSachTheo("tong")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: nganSachTheo === "tong" ? "var(--color-primary-main)" : "var(--color-text-sub)",
                  fontWeight: nganSachTheo === "tong" ? 700 : 400,
                  cursor: "pointer"
                }}
              >
                Tổng
              </button>
              <span style={{ color: "var(--color-border)" }}>|</span>
              <button
                type="button"
                onClick={() => setNganSachTheo("moi_nguoi")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: nganSachTheo === "moi_nguoi" ? "var(--color-primary-main)" : "var(--color-text-sub)",
                  fontWeight: nganSachTheo === "moi_nguoi" ? 700 : 400,
                  cursor: "pointer"
                }}
              >
                /người
              </button>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={nganSachStr}
              onChange={(e) => {
                const val = docTien(e.target.value);
                setNganSachStr(val ? dinhDangTien(val) : e.target.value);
              }}
              placeholder="10.000.000"
              style={{
                width: "100%",
                height: 44,
                padding: "0 32px 0 12px",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--color-border-input)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
                fontSize: 14,
                outline: "none"
              }}
            />
            <span style={{ position: "absolute", right: 10, top: 12, fontSize: 13, color: "var(--color-text-sub)" }}>
              đ
            </span>
          </div>
        </div>
      </div>

      {/* Gợi ý chọn nhanh điểm đến */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 13 }}>
        <span style={{ color: "var(--color-text-sub)", fontWeight: 500 }}>Gợi ý nhanh:</span>
        {PRESET_DESTINATIONS.map((dest) => (
          <button
            type="button"
            key={dest}
            onClick={() => setDiemDen(dest)}
            style={{
              padding: "4px 10px",
              borderRadius: "var(--r-full)",
              border: "1px solid var(--color-border)",
              background: diemDen === dest ? "var(--color-primary-tint)" : "var(--color-surface-sub)",
              color: diemDen === dest ? "var(--color-primary-main)" : "var(--color-text)",
              fontSize: 12,
              fontWeight: diemDen === dest ? 700 : 500,
              cursor: "pointer"
            }}
          >
            {dest}
          </button>
        ))}
      </div>

      {/* Lỗi nếu có */}
      {loi && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderRadius: "var(--r-md)",
          background: "var(--color-status-err-bg)",
          color: "var(--color-status-err-text)",
          fontSize: 13,
          fontWeight: 600
        }}>
          <AlertCircle size={16} />
          <span>{loi}</span>
        </div>
      )}

      {/* Nút Submit */}
      <button
        type="submit"
        style={{
          height: 48,
          borderRadius: "var(--r-md)",
          border: "none",
          background: "linear-gradient(135deg, var(--color-primary-main), var(--color-secondary-500))",
          color: "var(--color-primary-text)",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          boxShadow: "0 4px 14px rgba(43, 85, 214, 0.25)"
        }}
      >
        <Send size={18} />
        <span>Lập kế hoạch</span>
      </button>
    </form>
  );
}
