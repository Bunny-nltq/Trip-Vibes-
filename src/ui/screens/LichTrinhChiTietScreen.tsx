"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  Compass,
  ArrowRight,
  ArrowLeft,
  Building,
  Utensils,
  Coffee,
  Plane,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { SiteHeader } from "@/ui/components/site/SiteHeader";
import { SiteFooter } from "@/ui/components/site/SiteFooter";
import type { Plan, PlanItem } from "@/contracts";

export interface LichTrinhChiTietData {
  slug: string;
  tieuDe: string;
  tenDiemDen: string;
  quocGia: string;
  soNgay: number;
  soDem: number;
  soNguoi: number;
  ngansachTongVND: number;
  tongTienVND: number;
  tiLeDiChuyen: number;
  gioDen: string;
  canhBao?: string[];
  plan: Plan;
  nguon: string;
  ngayTao: string;
  quyTacVersion: string;
  giaLaUocTinh: boolean;
}

export interface LichTrinhChiTietScreenProps {
  data: LichTrinhChiTietData;
  ngayDuLieu?: string;
}

function getItemIcon(hangMuc: string, noiDung: string) {
  if (hangMuc === "Di chuyển") {
    return <Plane size={16} color="var(--color-category-di-chuyen)" />;
  }
  if (hangMuc === "Chỗ ở") {
    return <Building size={16} color="var(--color-category-cho-o)" />;
  }
  if (hangMuc === "Ăn uống") {
    const text = noiDung.toLowerCase();
    if (text.includes("cafe") || text.includes("cà phê")) {
      return <Coffee size={16} color="var(--color-category-am-thuc)" />;
    }
    return <Utensils size={16} color="var(--color-category-am-thuc)" />;
  }
  return <Compass size={16} color="var(--color-category-vui-choi)" />;
}

export function LichTrinhChiTietScreen({
  data,
  ngayDuLieu = "20/10/2026",
}: LichTrinhChiTietScreenProps) {
  const [activeDay, setActiveDay] = useState(1);

  const days = Array.from({ length: data.soNgay }, (_, i) => i + 1);
  const itemsOfDay = data.plan.items.filter((it) => it.ngay === activeDay);

  const theoHangMuc = data.plan.tongKet?.theoHangMuc || {};
  const diChuyenVND = theoHangMuc["Di chuyển"] ?? 0;
  const choOVND = theoHangMuc["Chỗ ở"] ?? 0;
  const anUongVND = theoHangMuc["Ăn uống"] ?? 0;
  const vuiChoiVND = theoHangMuc["Vui chơi"] ?? 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-background)",
        color: "var(--color-text)",
        fontSize: 16,
      }}
    >
      <SiteHeader />

      <main id="main-content" style={{ flex: 1 }}>
        {/* Banner tiêu đề */}
        <section
          style={{
            background: "linear-gradient(180deg, var(--color-surface) 0%, var(--color-background) 100%)",
            padding: "40px 24px 28px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            {/* Breadcrumb */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-text-sub)",
                marginBottom: 16,
              }}
            >
              <Link href="/" style={{ color: "var(--color-text-sub)", textDecoration: "none" }}>
                Trang chủ
              </Link>
              <span>/</span>
              <Link href="/lich-trinh" style={{ color: "var(--color-text-sub)", textDecoration: "none" }}>
                Lịch trình mẫu
              </Link>
              <span>/</span>
              <span style={{ color: "var(--color-primary-main)" }}>{data.tenDiemDen}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--color-primary-main)",
                      background: "var(--color-primary-subtle)",
                      padding: "4px 10px",
                      borderRadius: "var(--r-sm)",
                    }}
                  >
                    <MapPin size={13} />
                    {data.tenDiemDen} · {data.quocGia}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--color-text-sub)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Calendar size={13} />
                    {data.soNgay} ngày {data.soDem} đêm
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--color-text-sub)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Users size={13} />
                    {data.soNguoi} người
                  </span>
                </div>

                <h1
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "var(--color-text)",
                    margin: 0,
                    letterSpacing: "-0.5px",
                    lineHeight: 1.3,
                  }}
                >
                  {data.tieuDe}
                </h1>
              </div>

              {/* Nút hành động đầu trang */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Link
                  href={`/lap-ke-hoach?diemDen=${encodeURIComponent(data.tenDiemDen)}&ngansach=${data.ngansachTongVND}&soNgay=3&soNguoi=2`}
                  style={{
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    height: 44,
                    padding: "0 20px",
                    borderRadius: "var(--r-md)",
                    background: "var(--color-primary-main)",
                    color: "var(--color-primary-text)",
                    fontSize: 14,
                    fontWeight: 700,
                    boxShadow: "0 2px 8px rgba(43, 85, 214, 0.25)",
                    transition: "all 0.15s",
                  }}
                >
                  <span>Dùng làm điểm xuất phát</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Bảng tóm tắt tài chính 4 hạng mục */}
            <div
              style={{
                marginTop: 28,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              <div
                style={{
                  background: "var(--color-surface)",
                  padding: "16px 18px",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div style={{ fontSize: 13, color: "var(--color-text-sub)", marginBottom: 4 }}>Tổng chi phí ước tính</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-primary-main)" }}>
                  {data.tongTienVND.toLocaleString("vi-VN")} đ
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-sub)", marginTop: 4 }}>
                  Ngân sách: {data.ngansachTongVND.toLocaleString("vi-VN")} đ
                </div>
              </div>

              <div
                style={{
                  background: "var(--color-surface)",
                  padding: "16px 18px",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div style={{ fontSize: 13, color: "var(--color-text-sub)", marginBottom: 4 }}>Di chuyển</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)" }}>
                  {diChuyenVND.toLocaleString("vi-VN")} đ
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-sub)", marginTop: 4 }}>
                  Tỉ lệ di chuyển: {data.tiLeDiChuyen}%
                </div>
              </div>

              <div
                style={{
                  background: "var(--color-surface)",
                  padding: "16px 18px",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div style={{ fontSize: 13, color: "var(--color-text-sub)", marginBottom: 4 }}>Lưu trú & Chỗ ở</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)" }}>
                  {choOVND.toLocaleString("vi-VN")} đ
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-sub)", marginTop: 4 }}>
                  {data.soDem} đêm phòng
                </div>
              </div>

              <div
                style={{
                  background: "var(--color-surface)",
                  padding: "16px 18px",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div style={{ fontSize: 13, color: "var(--color-text-sub)", marginBottom: 4 }}>Ăn uống & Vui chơi</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)" }}>
                  {(anUongVND + vuiChoiVND).toLocaleString("vi-VN")} đ
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-sub)", marginTop: 4 }}>
                  Ăn uống: {anUongVND.toLocaleString("vi-VN")} đ
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Nội dung chi tiết các ngày */}
        <section style={{ maxWidth: 1000, margin: "32px auto 64px", padding: "0 24px" }}>
          {/* Thanh chuyển ngày */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
              borderBottom: "1px solid var(--color-border)",
              paddingBottom: 12,
            }}
          >
            {days.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDay(day)}
                style={{
                  height: 40,
                  padding: "0 20px",
                  borderRadius: "var(--r-md)",
                  border: activeDay === day ? "1px solid var(--color-primary-main)" : "1px solid var(--color-border)",
                  background: activeDay === day ? "var(--color-primary-main)" : "var(--color-surface)",
                  color: activeDay === day ? "var(--color-primary-text)" : "var(--color-text)",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                Ngày {day}
              </button>
            ))}
          </div>

          {/* Danh sách mục trong ngày */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {itemsOfDay.length === 0 ? (
              <div
                style={{
                  padding: "48px 20px",
                  textAlign: "center",
                  background: "var(--color-surface)",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-sub)",
                }}
              >
                Không có lịch trình cho ngày này.
              </div>
            ) : (
              itemsOfDay.map((item, idx) => (
                <div
                  key={item.refId || `${item.ngay}-${idx}`}
                  style={{
                    background: "var(--color-surface)",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--color-border)",
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 18,
                    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.03)",
                  }}
                >
                  {/* Cột mốc giờ */}
                  <div
                    style={{
                      minWidth: 90,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--color-text)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Clock size={14} color="var(--color-text-sub)" />
                      {item.gio || "Trong ngày"}
                    </span>
                  </div>

                  {/* Icon loại */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "var(--r-md)",
                      background: "var(--color-surface-subtle)",
                      border: "1px solid var(--color-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {getItemIcon(item.hangMuc, item.noiDung)}
                  </div>

                  {/* Nội dung chi tiết */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--color-primary-main)",
                          background: "var(--color-primary-subtle)",
                          padding: "2px 8px",
                          borderRadius: "var(--r-xs)",
                        }}
                      >
                        {item.hangMuc}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--color-text)",
                        margin: "0 0 6px",
                      }}
                    >
                      {item.noiDung}
                    </h3>
                  </div>

                  {/* Cột giá */}
                  <div style={{ textAlign: "right", minWidth: 120 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)" }}>
                      {item.thanhTien > 0 ? `${item.thanhTien.toLocaleString("vi-VN")} đ` : "Miễn phí"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-sub)", marginTop: 2 }}>
                      Giá ước tính
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Khung chân trang bài viết: Minh bạch và CTA */}
          <div
            style={{
              marginTop: 40,
              padding: "28px 32px",
              background: "var(--color-surface)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <ShieldCheck size={18} color="var(--color-primary-main)" />
                <strong style={{ fontSize: 16, color: "var(--color-text)" }}>
                  Sẵn sàng cho chuyến đi của bạn?
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-sub)", maxWidth: 540 }}>
                Bạn có thể nạp mẫu này vào công cụ lập kế hoạch để thêm bớt địa điểm, thay đổi khách sạn hoặc tinh chỉnh theo ngân sách thực tế.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link
                href="/lich-trinh"
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 44,
                  padding: "0 18px",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-text)",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={15} />
                <span>Xem mẫu khác</span>
              </Link>

              <Link
                href={`/lap-ke-hoach?diemDen=${encodeURIComponent(data.tenDiemDen)}&ngansach=${data.ngansachTongVND}&soNgay=3&soNguoi=2`}
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  height: 44,
                  padding: "0 22px",
                  borderRadius: "var(--r-md)",
                  background: "var(--color-primary-main)",
                  color: "var(--color-primary-text)",
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(43, 85, 214, 0.25)",
                }}
              >
                <span>Bắt đầu tùy chỉnh</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter ngayDuLieu={ngayDuLieu} />
    </div>
  );
}
