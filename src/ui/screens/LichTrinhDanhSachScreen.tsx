"use client";
import React from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  Building,
  Utensils,
  MapPin,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { SiteHeader } from "@/ui/components/site/SiteHeader";
import { SiteFooter } from "@/ui/components/site/SiteFooter";

export interface LichTrinhMauThe {
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
  soHoatDong: number;
  soQuanAn: number;
  soCafe: number;
  khachSanTen: string;
}

export interface LichTrinhDanhSachScreenProps {
  danhSach: LichTrinhMauThe[];
  ngayDuLieu?: string;
}

export function LichTrinhDanhSachScreen({
  danhSach,
  ngayDuLieu = "20/10/2026",
}: LichTrinhDanhSachScreenProps) {
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
            padding: "48px 24px 32px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 840, margin: "0 auto" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-primary-main)",
                marginBottom: 16,
              }}
            >
              <Link href="/" style={{ color: "var(--color-text-sub)", textDecoration: "none" }}>
                Trang chủ
              </Link>
              <span>/</span>
              <span style={{ color: "var(--color-primary-main)" }}>Lịch trình mẫu</span>
            </div>

            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: "var(--color-text)",
                margin: "0 0 16px",
                letterSpacing: "-0.5px",
              }}
            >
              Lịch Trình Mẫu Tham Khảo
            </h1>
            <p
              style={{
                fontSize: 16,
                color: "var(--color-text-sub)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Các kế hoạch chuyến đi 3 ngày 2 đêm được tối ưu hóa sẵn từ dữ liệu OpenStreetMap. Bạn có thể sử dụng trực tiếp hoặc tùy biến lại theo sở thích và ngân sách riêng.
            </p>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 16,
                marginTop: 20,
                padding: "8px 16px",
                borderRadius: "var(--r-full)",
                background: "var(--color-surface-subtle)",
                border: "1px solid var(--color-border)",
                fontSize: 13,
                color: "var(--color-text-sub)",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={15} color="var(--color-status-success)" />
                5 điểm đến snapshot chính thức
              </span>
              <span>•</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={15} color="var(--color-primary-main)" />
                Giá ước tính minh bạch
              </span>
              <span>•</span>
              <span>Cập nhật: {ngayDuLieu}</span>
            </div>
          </div>
        </section>

        {/* Danh sách lưới các lịch trình mẫu */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px 64px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
              gap: 28,
            }}
          >
            {danhSach.map((item) => (
              <article
                key={item.slug}
                style={{
                  background: "var(--color-surface)",
                  borderRadius: "var(--r-lg)",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                {/* Phần đầu thẻ */}
                <div
                  style={{
                    padding: "24px 24px 16px",
                    borderBottom: "1px solid var(--color-border)",
                    background: "linear-gradient(135deg, var(--color-surface-subtle) 0%, var(--color-surface) 100%)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
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
                      {item.tenDiemDen} · {item.quocGia}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--color-text-sub)",
                      }}
                    >
                      <Calendar size={13} />
                      {item.soNgay}N{item.soDem}Đ
                    </span>
                  </div>

                  <h2
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      margin: "0 0 10px",
                      color: "var(--color-text)",
                      lineHeight: 1.4,
                    }}
                  >
                    {item.tieuDe}
                  </h2>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      fontSize: 13,
                      color: "var(--color-text-sub)",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Users size={13} />
                      {item.soNguoi} người
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Clock size={13} />
                      Di chuyển: {item.tiLeDiChuyen}%
                    </span>
                  </div>
                </div>

                {/* Phần tóm tắt địa điểm */}
                <div style={{ padding: "18px 24px", flex: 1 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Building size={16} color="var(--color-primary-main)" />
                      <span style={{ color: "var(--color-text-sub)" }}>Khách sạn:</span>
                      <strong style={{ color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.khachSanTen}
                      </strong>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Compass size={16} color="var(--color-category-am-thuc)" />
                      <span style={{ color: "var(--color-text-sub)" }}>Hành trình gồm:</span>
                      <span style={{ color: "var(--color-text)" }}>
                        <strong>{item.soHoatDong}</strong> điểm tham quan, <strong>{item.soQuanAn}</strong> bữa ăn, <strong>{item.soCafe}</strong> quán cafe
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Utensils size={16} color="var(--color-category-vui-choi)" />
                      <span style={{ color: "var(--color-text-sub)" }}>Giờ đến dự kiến:</span>
                      <span style={{ color: "var(--color-text)" }}>{item.gioDen} (Ngày 1)</span>
                    </div>
                  </div>

                  {/* Khối ngân sách và tổng tiền */}
                  <div
                    style={{
                      marginTop: 18,
                      padding: "14px 16px",
                      borderRadius: "var(--r-md)",
                      background: "var(--color-surface-subtle)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "var(--color-text-sub)" }}>Ngân sách kế hoạch:</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>
                        {item.ngansachTongVND.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 13, color: "var(--color-text-sub)" }}>Tổng chi phí ước tính:</span>
                      <span style={{ fontSize: 17, fontWeight: 800, color: "var(--color-primary-main)" }}>
                        {item.tongTienVND.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Phần nút hành động */}
                <div
                  style={{
                    padding: "16px 24px 20px",
                    borderTop: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Link
                    href={`/lich-trinh/${item.slug}`}
                    style={{
                      flex: 1,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      height: 40,
                      borderRadius: "var(--r-md)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface)",
                      color: "var(--color-text)",
                      fontSize: 14,
                      fontWeight: 600,
                      transition: "all 0.15s",
                    }}
                  >
                    <span>Xem chi tiết</span>
                  </Link>

                  <Link
                    href={`/lap-ke-hoach?diemDen=${encodeURIComponent(item.tenDiemDen)}&ngansach=${item.ngansachTongVND}&soNgay=3&soNguoi=2`}
                    style={{
                      flex: 1.2,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      height: 40,
                      borderRadius: "var(--r-md)",
                      background: "var(--color-primary-main)",
                      color: "var(--color-primary-text)",
                      fontSize: 14,
                      fontWeight: 700,
                      boxShadow: "0 2px 6px rgba(43, 85, 214, 0.2)",
                      transition: "all 0.15s",
                    }}
                  >
                    <span>Dùng mẫu này</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter ngayDuLieu={ngayDuLieu} />
    </div>
  );
}
