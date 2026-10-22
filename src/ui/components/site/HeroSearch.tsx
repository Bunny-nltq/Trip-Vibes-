"use client";
/**
 * src/ui/components/site/HeroSearch.tsx
 *
 * Thanh tìm kiếm chính trên trang chủ:
 * - Chọn điểm đi & điểm đến bằng ChonDiem (danh sách thả xuống, lọc typeahead, aria).
 * - Chọn số ngày bằng danh sách thả xuống từ 2 đến 7 ("3 ngày 2 đêm").
 * - Chọn số người và ngân sách.
 * - Chuyển sang /lap-ke-hoach bằng taoGoiChuyenB1.
 * Tuân thủ AGENTS.md: tokens, không emoji, icon SVG.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Calendar, Wallet, Send, AlertCircle } from "lucide-react";
import { ChonDiem } from "@/ui/components/ChonDiem";
import { useDiemChon } from "@/ui/hooks/useDiemChon";
import { taoGoiChuyenB1, luuGoiChuyenVaoSession } from "@/ui/lib/chuyenB1";
import { docTien, dinhDangTien } from "@/core/formB1";
import type { DiemDen } from "@/contracts";

interface HeroSearchProps {
  onSuccess?: () => void;
}

export function HeroSearch({ onSuccess }: HeroSearchProps) {
  const router = useRouter();
  const { data: diemChonData } = useDiemChon();

  const [diemDi, setDiemDi] = useState<DiemDen | null>(null);
  const [diemDen, setDiemDen] = useState<DiemDen | null>(null);
  const [soNgay, setSoNgay] = useState<number>(3);
  const [soNguoi, setSoNguoi] = useState<number>(2);
  const [nganSachStr, setNganSachStr] = useState<string>("10.000.000");
  const [nganSachTheo, setNganSachTheo] = useState<"tong" | "moi_nguoi">("tong");
  const [loi, setLoi] = useState<string | null>(null);

  // Mặc định chọn điểm đi đầu tiên khi có data nếu chưa chọn
  React.useEffect(() => {
    if (!diemDi && diemChonData.diemDi.length > 0) {
      setDiemDi(diemChonData.diemDi[0]);
    }
  }, [diemChonData.diemDi, diemDi]);

  const handleNganSachChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = docTien(raw);
    if (num !== null) {
      setNganSachStr(dinhDangTien(num));
    } else {
      setNganSachStr(raw);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoi(null);

    const soTien = docTien(nganSachStr) ?? 0;
    const res = taoGoiChuyenB1({
      diemDi: diemDi?.ten || "",
      diemDen: diemDen?.ten || "",
      soNguoi,
      soNgay,
      nganSach: {
        soTien,
        theo: nganSachTheo,
      },
    });

    if (!res.ok) {
      if (res.loi === "thieu_diem_den") setLoi("Vui lòng chọn điểm đến trong danh sách.");
      else if (res.loi === "so_nguoi") setLoi("Số người phải từ 1 đến 10 người.");
      else if (res.loi === "so_ngay") setLoi("Thời gian chuyến đi phải từ 2 đến 7 ngày.");
      else if (res.loi === "ngan_sach") setLoi("Vui lòng nhập ngân sách hợp lệ (lớn hơn 0).");
      return;
    }

    // Lưu vào sessionStorage để B1 nhận
    luuGoiChuyenVaoSession(res.data);
    if (onSuccess) {
      onSuccess();
    }
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
        maxWidth: 960,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        {/* Đi từ */}
        <div>
          <ChonDiem
            id="hero-diem-di"
            label="Đi từ"
            placeholder="Chọn nơi xuất phát..."
            value={diemDi}
            onChange={(val) => setDiemDi(val)}
            options={diemChonData.diemDi}
            disabledOptionTen={diemDen?.ten}
          />
        </div>

        {/* Đến nơi */}
        <div>
          <ChonDiem
            id="hero-diem-den"
            label="Điểm đến"
            placeholder="Chọn nơi muốn đến..."
            value={diemDen}
            onChange={(val) => setDiemDen(val)}
            options={diemChonData.diemDen}
            disabledOptionTen={diemDi?.ten}
          />
        </div>

        {/* Số ngày (danh sách thả xuống 2 - 7) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            htmlFor="hero-so-ngay"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
              color: "var(--color-text)",
            }}
          >
            <Calendar size={16} color="var(--color-primary-main)" />
            <span>Số ngày</span>
          </label>
          <select
            id="hero-so-ngay"
            value={soNgay}
            onChange={(e) => setSoNgay(parseInt(e.target.value, 10))}
            style={{
              width: "100%",
              height: 44,
              padding: "0 12px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              fontSize: "var(--font-size-base)",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {[2, 3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>
                {d} ngày {d - 1} đêm
              </option>
            ))}
          </select>
        </div>

        {/* Số người */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            htmlFor="hero-so-nguoi"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
              color: "var(--color-text)",
            }}
          >
            <Users size={16} color="var(--color-primary-main)" />
            <span>Số người</span>
          </label>
          <div style={{ display: "flex", gap: 4, height: 44 }}>
            {[1, 2, 4, 6].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setSoNguoi(n)}
                style={{
                  flex: 1,
                  border: soNguoi === n ? "2px solid var(--color-primary-main)" : "1px solid var(--color-border)",
                  background: soNguoi === n ? "var(--color-primary-tint)" : "var(--color-surface)",
                  color: soNguoi === n ? "var(--color-primary-main)" : "var(--color-text)",
                  fontWeight: soNguoi === n ? 700 : 500,
                  borderRadius: "var(--r-md)",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Ngân sách */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label
              htmlFor="hero-ngan-sach"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                color: "var(--color-text)",
              }}
            >
              <Wallet size={16} color="var(--color-primary-main)" />
              <span>Ngân sách</span>
            </label>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                type="button"
                onClick={() => setNganSachTheo("tong")}
                style={{
                  padding: "2px 6px",
                  fontSize: 11,
                  borderRadius: "var(--r-sm)",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: nganSachTheo === "tong" ? 700 : 500,
                  background: nganSachTheo === "tong" ? "var(--color-primary-tint)" : "transparent",
                  color: nganSachTheo === "tong" ? "var(--color-primary-main)" : "var(--color-text-sub)",
                }}
              >
                Tổng
              </button>
              <button
                type="button"
                onClick={() => setNganSachTheo("moi_nguoi")}
                style={{
                  padding: "2px 6px",
                  fontSize: 11,
                  borderRadius: "var(--r-sm)",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: nganSachTheo === "moi_nguoi" ? 700 : 500,
                  background: nganSachTheo === "moi_nguoi" ? "var(--color-primary-tint)" : "transparent",
                  color: nganSachTheo === "moi_nguoi" ? "var(--color-primary-main)" : "var(--color-text-sub)",
                }}
              >
                /người
              </button>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <input
              id="hero-ngan-sach"
              type="text"
              value={nganSachStr}
              onChange={handleNganSachChange}
              placeholder="10.000.000"
              style={{
                width: "100%",
                height: 44,
                padding: "0 28px 0 12px",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
                fontSize: "var(--font-size-base)",
                outline: "none",
              }}
            />
            <span
              style={{
                position: "absolute",
                right: 10,
                top: 12,
                fontSize: 13,
                color: "var(--color-text-sub)",
              }}
            >
              đ
            </span>
          </div>
        </div>
      </div>

      {/* Lỗi nếu có */}
      {loi && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: "var(--r-md)",
            background: "var(--color-status-errBg)",
            color: "var(--color-status-errText)",
            fontSize: 13,
            fontWeight: 600,
            border: "1px solid var(--color-status-errBorder)",
          }}
        >
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
          background: "linear-gradient(135deg, var(--color-primary-main), var(--color-primary-sky))",
          color: "var(--color-primary-text)",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          boxShadow: "0 4px 14px rgba(43, 85, 214, 0.25)",
        }}
      >
        <Send size={18} />
        <span>Lập kế hoạch</span>
      </button>
    </form>
  );
}
