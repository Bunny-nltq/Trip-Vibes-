"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Database, ShieldCheck, X } from "lucide-react";
import { SiteHeader } from "@/ui/components/site/SiteHeader";
import { SiteFooter } from "@/ui/components/site/SiteFooter";
import { HeroSearch } from "@/ui/components/site/HeroSearch";
import { ThuDiemDen, type DiemDenThe } from "@/ui/components/site/ThuDiemDen";
import { KhachSanThamKhao, type KhachSanThe } from "@/ui/components/site/KhachSanThamKhao";

export interface HomePageViewProps {
  diemDens: DiemDenThe[];
  khachSans?: KhachSanThe[];
  ngayDuLieu?: string;
}

export function HomePageView({
  diemDens,
  khachSans = [],
  ngayDuLieu = "20/10/2026",
}: HomePageViewProps) {
  const [moModalGioiHan, setMoModalGioiHan] = useState(false);

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
      {/* Khối 1: Thanh trên (SiteHeader) */}
      <SiteHeader />

      <main id="main-content" style={{ flex: 1 }}>
        {/* Khối 2: Hero Section */}
        <section
          style={{
            background: "linear-gradient(180deg, var(--color-surface) 0%, var(--color-background) 100%)",
            padding: "56px 24px 44px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 880, margin: "0 auto 32px" }}>
            <h1
              style={{
                fontSize: "clamp(36px, 5vw, 52px)",
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: "-0.5px",
                color: "var(--color-text)",
                marginBottom: 16,
              }}
            >
              Lên kế hoạch du lịch theo ngân sách của bạn
            </h1>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.6,
                color: "var(--color-text-sub)",
                maxWidth: 720,
                margin: "0 auto",
              }}
            >
              Tự do lựa chọn điểm đến, tối ưu chi phí di chuyển, lưu trú và điểm tham quan bám sát ngân sách thực tế.
            </p>
          </div>

          {/* Form HeroSearch */}
          <HeroSearch />
        </section>

        {/* Khối 3: Thẻ Điểm đến từ Snapshot */}
        <section
          id="diem-den"
          style={{
            maxWidth: 1200,
            margin: "48px auto",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              marginBottom: 28,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "var(--color-text)",
                  marginBottom: 6,
                }}
              >
                Điểm đến
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--color-text-sub)",
                  margin: 0,
                }}
              >
                Khám phá các điểm đến được hỗ trợ dữ liệu chính thức
              </p>
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text-sub)" }}>
              Dữ liệu kiểm toán cập nhật ngày {ngayDuLieu}
            </div>
          </div>

          <ThuDiemDen diemDens={diemDens} />
        </section>

        {/* Khối 4: Khách sạn tham khảo từ Snapshot */}
        {khachSans && khachSans.length > 0 && (
          <section
            id="khach-san"
            style={{
              maxWidth: 1200,
              margin: "56px auto 48px",
              padding: "0 24px",
            }}
          >
            <div
              style={{
                marginBottom: 28,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "var(--color-text)",
                    marginBottom: 6,
                  }}
                >
                  Khách sạn tham khảo
                </h2>
                <p
                  style={{
                    fontSize: 15,
                    color: "var(--color-text-sub)",
                    margin: 0,
                  }}
                >
                  Gợi ý nơi lưu trú tham khảo với mức giá ước tính minh bạch từ snapshot dữ liệu
                </p>
              </div>
              <Link
                href="/khach-san"
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--color-primary-main)",
                  textDecoration: "none",
                }}
              >
                Xem tất cả khách sạn →
              </Link>
            </div>

            <KhachSanThamKhao khachSans={khachSans} />
          </section>
        )}

        {/* Dải một dòng: "Dữ liệu: OpenStreetMap contributors. Giá là ước tính." và liên kết "Giới hạn dữ liệu" */}
        <section
          style={{
            maxWidth: 1200,
            margin: "40px auto 20px",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--r-lg)",
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              fontSize: 15,
              color: "var(--color-text-sub)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Database size={18} color="var(--color-primary-main)" />
              <span>Dữ liệu: OpenStreetMap contributors. Giá là ước tính.</span>
            </div>
            <button
              type="button"
              onClick={() => setMoModalGioiHan(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-primary-main)",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 15,
                padding: 0,
                textDecoration: "underline",
              }}
            >
              Giới hạn dữ liệu
            </button>
          </div>
        </section>
      </main>

      {/* Khối 5: Chân trang (SiteFooter) */}
      <SiteFooter ngayDuLieu={ngayDuLieu} onOpenGioiHan={() => setMoModalGioiHan(true)} />

      {/* Modal Giới hạn dữ liệu & Pháp lý minh bạch */}
      {moModalGioiHan && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-gioi-han-title"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(31, 42, 68, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setMoModalGioiHan(false)}
        >
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "var(--r-xl)",
              border: "1px solid var(--color-border)",
              maxWidth: 600,
              width: "100%",
              padding: 28,
              boxShadow: "0 12px 36px rgba(0, 0, 0, 0.15)",
              color: "var(--color-text)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
                paddingBottom: 12,
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <h3
                id="modal-gioi-han-title"
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  margin: 0,
                  color: "var(--color-text)",
                }}
              >
                Giới hạn dữ liệu & Minh bạch
              </h3>
              <button
                type="button"
                onClick={() => setMoModalGioiHan(false)}
                aria-label="Đóng"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-sub)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--color-text)",
              }}
            >
              <div>
                <strong style={{ color: "var(--color-text)" }}>1. Nguồn dữ liệu POI & Địa điểm:</strong>
                <p style={{ margin: "4px 0 0", color: "var(--color-text-sub)" }}>
                  Thông tin địa điểm, tọa độ và khách sạn được thu thập từ cộng đồng OpenStreetMap (OSM) thông qua
                  Overpass API và Nominatim geocoding.
                </p>
              </div>

              <div>
                <strong style={{ color: "var(--color-text)" }}>2. Giá dịch vụ & Không đặt vé thật:</strong>
                <p style={{ margin: "4px 0 0", color: "var(--color-text-sub)" }}>
                  Mọi mức giá di chuyển, khách sạn, vé tham quan và ăn uống đều là giá ước tính tham khảo phục vụ bài
                  toán tối ưu ngân sách. Trip Vibes không phải đại lý du lịch, không giữ chỗ, không bán vé và không thực
                  hiện thanh toán tiền thật.
                </p>
              </div>

              <div>
                <strong style={{ color: "var(--color-text)" }}>3. Xử lý hóa đơn in-memory:</strong>
                <p style={{ margin: "4px 0 0", color: "var(--color-text-sub)" }}>
                  Ảnh chụp hóa đơn chi tiêu chỉ được xử lý tạm thời trong bộ nhớ máy chủ (in-memory buffer) để bóc tách
                  số tiền và lập tức giải phóng, tuyệt đối không lưu xuống đĩa hay ghi nhật ký dữ liệu nhạy cảm.
                </p>
              </div>

              <div>
                <strong style={{ color: "var(--color-text)" }}>4. Chế độ khách (Guest mode):</strong>
                <p style={{ margin: "4px 0 0", color: "var(--color-text-sub)" }}>
                  Người dùng sử dụng ở chế độ khách, không yêu cầu tạo tài khoản hay cung cấp thông tin cá nhân.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setMoModalGioiHan(false)}
                style={{
                  height: 38,
                  padding: "0 20px",
                  borderRadius: "var(--r-md)",
                  border: "none",
                  background: "var(--color-primary-main)",
                  color: "var(--color-primary-text)",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
