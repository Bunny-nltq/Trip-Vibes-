"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Utensils,
  Coffee,
  ExternalLink,
  Send,
  Star,
  Database,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/ui/components/site/SiteHeader";
import { SiteFooter } from "@/ui/components/site/SiteFooter";
import { dinhDangTien } from "@/core/formB1";
import {
  getActivityImage,
  getRestaurantImage,
  getCafeImage,
  getHotelImage,
} from "@/ui/lib/imageMap";

export interface DiaDiemVuiChoiItem {
  id: string;
  ten: string;
  khuVuc?: string;
  loai?: string | null;
  mapUrl: string;
}

export interface QuanAnItem {
  id: string;
  ten: string;
  khuVuc?: string;
  amThuc?: string | null;
  mapUrl: string;
}

export interface CafeItem {
  id: string;
  ten: string;
  khuVuc?: string;
  mapUrl: string;
}

export interface KhachSanDiemDenItem {
  id: string;
  ten: string;
  khuVuc?: string;
  soSao?: number | null;
  giaDemUocTinh: number;
}

import { type HinhAnhGhiCong } from "@/ui/components/site/ThuDiemDen";

export interface DiemDenChiTietScreenProps {
  slug: string;
  ten: string;
  quocGia: string;
  moTa: string;
  ngayDuLieu?: string;
  hoatDongs: DiaDiemVuiChoiItem[];
  quanAns: QuanAnItem[];
  cafes: CafeItem[];
  khachSans: KhachSanDiemDenItem[];
  hinhAnh?: HinhAnhGhiCong;
}

export function DiemDenChiTietScreen({
  slug,
  ten,
  quocGia,
  moTa,
  ngayDuLieu = "20/10/2026",
  hoatDongs,
  quanAns,
  cafes,
  khachSans,
  hinhAnh,
}: DiemDenChiTietScreenProps) {
  const [activeTabAmThuc, setActiveTabAmThuc] = useState<"quan_an" | "cafe">("quan_an");

  const lapKeHoachUrl = `/lap-ke-hoach?den=${encodeURIComponent(ten)}`;

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
        {/* Banner Hero Điểm Đến */}
        <section
          style={{
            background: "linear-gradient(180deg, var(--color-surface) 0%, var(--color-background) 100%)",
            padding: "40px 24px 36px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {/* Breadcrumb */}
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
              <Link href="/diem-den" style={{ color: "var(--color-text-sub)", textDecoration: "none" }}>
                Điểm đến
              </Link>
              <span>/</span>
              <span style={{ color: "var(--color-primary-main)" }}>{ten}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 24,
              }}
            >
              <div style={{ maxWidth: 760 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: "var(--r-full)",
                    background: "var(--color-primary-tint)",
                    color: "var(--color-primary-main)",
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  <MapPin size={14} />
                  <span>{quocGia}</span>
                </div>

                <h1
                  style={{
                    fontSize: "clamp(32px, 4vw, 44px)",
                    fontWeight: 800,
                    lineHeight: 1.2,
                    color: "var(--color-text)",
                    marginBottom: 12,
                  }}
                >
                  {ten}
                </h1>

                <p
                  style={{
                    fontSize: 17,
                    lineHeight: 1.6,
                    color: "var(--color-text-sub)",
                    margin: 0,
                  }}
                >
                  {moTa}
                </p>
              </div>

              {/* Nút to: Lập kế hoạch đi X */}
              <div>
                <Link
                  href={lapKeHoachUrl}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    height: 48,
                    padding: "0 24px",
                    borderRadius: "var(--r-md)",
                    background: "var(--color-primary-main)",
                    color: "var(--color-primary-text)",
                    fontSize: 15,
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(43, 85, 214, 0.25)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Send size={18} />
                  <span>Lập kế hoạch đi {ten}</span>
                </Link>
              </div>
            </div>

            {/* Ảnh Hero minh họa từ Wikimedia Commons có ghi công bản quyền */}
            {hinhAnh && (
              <div
                style={{
                  marginTop: 28,
                  borderRadius: "var(--r-xl)",
                  overflow: "hidden",
                  position: "relative",
                  maxHeight: 420,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
                }}
              >
                {/* unoptimized: ảnh Wikimedia Commons được trình duyệt tải trực tiếp (Wikimedia chặn tải tự động từ máy chủ) */}
                <Image
                  src={hinhAnh.url}
                  alt={hinhAnh.alt || ten}
                  width={1200}
                  height={420}
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  unoptimized
                  style={{
                    width: "100%",
                    maxHeight: 420,
                    height: "auto",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 12,
                    right: 12,
                    padding: "6px 12px",
                    borderRadius: "var(--r-md)",
                    background: "rgba(0, 0, 0, 0.72)",
                    color: "var(--color-primary-text)",
                    fontSize: 12,
                    lineHeight: 1.4,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <span>
                    Ảnh:{" "}
                    <a
                      href={hinhAnh.linkGoc}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "inherit", textDecoration: "underline" }}
                    >
                      {hinhAnh.tacGia}
                    </a>{" "}
                    ({hinhAnh.giayPhep})
                  </span>
                  <a
                    href={hinhAnh.linkGoc}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "inherit",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                    title="Xem trang gốc trên Wikimedia Commons"
                  >
                    <span>Commons</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Khối 1: Địa điểm vui chơi (tối đa 12) */}
        <section style={{ maxWidth: 1200, margin: "48px auto", padding: "0 24px" }}>
          <div style={{ marginBottom: 24 }}>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "var(--color-text)",
                marginBottom: 6,
              }}
            >
              Địa điểm vui chơi & tham quan
            </h2>
            <p style={{ fontSize: 14, color: "var(--color-text-sub)", margin: 0 }}>
              Các địa điểm nổi tiếng tại {ten} từ dữ liệu kiểm toán cộng đồng OpenStreetMap (tối đa {hoatDongs.length} địa điểm)
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            {hoatDongs.map((hd) => {
              const actImg = getActivityImage("Vui chơi", hd.ten);
              return (
                <article
                  key={hd.id}
                  style={{
                    background: "var(--color-surface)",
                    borderRadius: "var(--r-xl)",
                    border: "1px solid var(--color-border)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                  }}
                >
                  <div>
                    {/* Khung ảnh hoạt động thật tỉ lệ 16:10 */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "16 / 10",
                        background: "linear-gradient(135deg, var(--color-primary-tint) 0%, var(--color-surface-sub) 100%)",
                        overflow: "hidden",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <img
                        src={actImg.urlThumb || actImg.url}
                        alt={actImg.alt || hd.ten}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: 6,
                          left: 6,
                          padding: "2px 6px",
                          borderRadius: "var(--r-sm)",
                          background: "rgba(0, 0, 0, 0.65)",
                          color: "var(--color-primary-text)",
                          fontSize: 9,
                          fontWeight: 600,
                          backdropFilter: "blur(4px)",
                          pointerEvents: "none",
                        }}
                      >
                        {actImg.tacGia} · {actImg.giayPhep}
                      </div>
                    </div>

                  <div style={{ padding: "16px 18px 10px" }}>
                    {/* Nhãn loại nếu có */}
                    {hd.loai && (
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--color-hangMuc-vuiChoi)",
                          background: "var(--color-status-success-bg)",
                          padding: "2px 8px",
                          borderRadius: "var(--r-full)",
                          marginBottom: 8,
                          textTransform: "uppercase",
                        }}
                      >
                        {hd.loai}
                      </span>
                    )}

                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--color-text)",
                        marginBottom: 6,
                        lineHeight: 1.35,
                      }}
                    >
                      {hd.ten}
                    </h3>

                    {hd.khuVuc && (
                      <p style={{ fontSize: 13, color: "var(--color-text-sub)", margin: 0 }}>
                        {hd.khuVuc}
                      </p>
                    )}
                  </div>
                </div>

                {/* Nút Xem trên Google Maps */}
                <div style={{ padding: "12px 18px 16px" }}>
                  <a
                    href={hd.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      width: "100%",
                      height: 36,
                      borderRadius: "var(--r-md)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface-sub)",
                      color: "var(--color-primary-main)",
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    <span>Xem trên Google Maps</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </article>
              );
            })}
          </div>
        </section>

        {/* Khối 2: Ẩm thực (Quán ăn 6 & Cà phê 6) */}
        <section style={{ maxWidth: 1200, margin: "56px auto", padding: "0 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "var(--color-text)",
                  marginBottom: 6,
                }}
              >
                Ẩm thực & Quán xá
              </h2>
              <p style={{ fontSize: 14, color: "var(--color-text-sub)", margin: 0 }}>
                Gợi ý quán ăn địa phương và không gian cà phê tại {ten}
              </p>
            </div>

            {/* Chuyển tab Quán ăn / Cà phê */}
            <div
              style={{
                display: "inline-flex",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--r-md)",
                padding: 4,
                gap: 4,
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTabAmThuc("quan_an")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: "var(--r-sm)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  background: activeTabAmThuc === "quan_an" ? "var(--color-primary-main)" : "transparent",
                  color: activeTabAmThuc === "quan_an" ? "var(--color-primary-text)" : "var(--color-text-sub)",
                  transition: "all 0.15s ease",
                }}
              >
                <Utensils size={15} />
                <span>Quán ăn ({quanAns.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTabAmThuc("cafe")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: "var(--r-sm)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  background: activeTabAmThuc === "cafe" ? "var(--color-primary-main)" : "transparent",
                  color: activeTabAmThuc === "cafe" ? "var(--color-primary-text)" : "var(--color-text-sub)",
                  transition: "all 0.15s ease",
                }}
              >
                <Coffee size={15} />
                <span>Cà phê ({cafes.length})</span>
              </button>
            </div>
          </div>

          {/* Lưới Quán ăn */}
          {activeTabAmThuc === "quan_an" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 20,
              }}
            >
              {quanAns.map((qa) => {
                const foodImg = getRestaurantImage(qa.ten, qa.amThuc);
                return (
                  <article
                    key={qa.id}
                    style={{
                      background: "var(--color-surface)",
                      borderRadius: "var(--r-xl)",
                      border: "1px solid var(--color-border)",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                    }}
                  >
                    <div>
                      {/* Khung ảnh ẩm thực thật tỉ lệ 16:10 */}
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          aspectRatio: "16 / 10",
                          background: "linear-gradient(135deg, var(--color-primary-tint) 0%, var(--color-surface-sub) 100%)",
                          overflow: "hidden",
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        <img
                          src={foodImg.urlThumb || foodImg.url}
                          alt={foodImg.alt || qa.ten}
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            bottom: 6,
                            left: 6,
                            padding: "2px 6px",
                            borderRadius: "var(--r-sm)",
                            background: "rgba(0, 0, 0, 0.65)",
                            color: "var(--color-primary-text)",
                            fontSize: 9,
                            fontWeight: 600,
                            backdropFilter: "blur(4px)",
                            pointerEvents: "none",
                          }}
                        >
                          {foodImg.tacGia} · {foodImg.giayPhep}
                        </div>
                      </div>

                    <div style={{ padding: "16px 18px 10px" }}>
                      {qa.amThuc && (
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--color-hangMuc-anUong)",
                            background: "var(--color-status-warn-bg)",
                            padding: "2px 8px",
                            borderRadius: "var(--r-full)",
                            marginBottom: 8,
                          }}
                        >
                          {qa.amThuc}
                        </span>
                      )}

                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "var(--color-text)",
                          marginBottom: 6,
                          lineHeight: 1.35,
                        }}
                      >
                        {qa.ten}
                      </h3>

                      {qa.khuVuc && (
                        <p style={{ fontSize: 13, color: "var(--color-text-sub)", margin: 0 }}>
                          {qa.khuVuc}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: "12px 18px 16px" }}>
                    <a
                      href={qa.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        width: "100%",
                        height: 36,
                        borderRadius: "var(--r-md)",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-surface-sub)",
                        color: "var(--color-primary-main)",
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      <span>Xem trên Google Maps</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </article>
                );
              })}
            </div>
          )}

          {/* Lưới Cà phê */}
          {activeTabAmThuc === "cafe" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 20,
              }}
            >
              {cafes.map((cf) => {
                const cafeImg = getCafeImage(cf.ten);
                return (
                  <article
                    key={cf.id}
                    style={{
                      background: "var(--color-surface)",
                      borderRadius: "var(--r-xl)",
                      border: "1px solid var(--color-border)",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                    }}
                  >
                    <div>
                      {/* Khung ảnh cà phê thật tỉ lệ 16:10 */}
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          aspectRatio: "16 / 10",
                          background: "linear-gradient(135deg, var(--color-primary-tint) 0%, var(--color-surface-sub) 100%)",
                          overflow: "hidden",
                          borderBottom: "1px solid var(--color-border)",
                        }}
                      >
                        <img
                          src={cafeImg.urlThumb || cafeImg.url}
                          alt={cafeImg.alt || cf.ten}
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            bottom: 6,
                            left: 6,
                            padding: "2px 6px",
                            borderRadius: "var(--r-sm)",
                            background: "rgba(0, 0, 0, 0.65)",
                            color: "var(--color-primary-text)",
                            fontSize: 9,
                            fontWeight: 600,
                            backdropFilter: "blur(4px)",
                            pointerEvents: "none",
                          }}
                        >
                          {cafeImg.tacGia} · {cafeImg.giayPhep}
                        </div>
                      </div>

                    <div style={{ padding: "16px 18px 10px" }}>
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "var(--color-text)",
                          marginBottom: 6,
                          lineHeight: 1.35,
                        }}
                      >
                        {cf.ten}
                      </h3>

                      {cf.khuVuc && (
                        <p style={{ fontSize: 13, color: "var(--color-text-sub)", margin: 0 }}>
                          {cf.khuVuc}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: "12px 18px 16px" }}>
                    <a
                      href={cf.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        width: "100%",
                        height: 36,
                        borderRadius: "var(--r-md)",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-surface-sub)",
                        color: "var(--color-primary-main)",
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      <span>Xem trên Google Maps</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Khối 3: Khách sạn (6 thẻ, liên kết /khach-san?diem-den=<slug>) */}
        <section style={{ maxWidth: 1200, margin: "56px auto", padding: "0 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "var(--color-text)",
                  marginBottom: 6,
                }}
              >
                Khách sạn tại {ten}
              </h2>
              <p style={{ fontSize: 14, color: "var(--color-text-sub)", margin: 0 }}>
                Gợi ý 6 địa chỉ lưu trú tiêu biểu với giá ước tính minh bạch
              </p>
            </div>

            <Link
              href={`/khach-san?diem-den=${slug}`}
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--color-primary-main)",
                textDecoration: "none",
              }}
            >
              Xem tất cả khách sạn {ten} →
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {khachSans.map((ks) => {
              const hotelImg = getHotelImage(ks.soSao, ks.ten, ten);
              return (
                <article
                  key={ks.id}
                  style={{
                    background: "var(--color-surface)",
                    borderRadius: "var(--r-xl)",
                    border: "1px solid var(--color-border)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                  }}
                >
                  <div>
                    {/* Khung ảnh khách sạn thật tỉ lệ 16:10 */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "16 / 10",
                        background: "linear-gradient(135deg, var(--color-primary-tint) 0%, var(--color-surface-sub) 100%)",
                        overflow: "hidden",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      <img
                        src={hotelImg.urlThumb || hotelImg.url}
                        alt={hotelImg.alt || ks.ten}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: 6,
                          left: 6,
                          padding: "2px 6px",
                          borderRadius: "var(--r-sm)",
                          background: "rgba(0, 0, 0, 0.65)",
                          color: "var(--color-primary-text)",
                          fontSize: 9,
                          fontWeight: 600,
                          backdropFilter: "blur(4px)",
                          pointerEvents: "none",
                        }}
                      >
                        {hotelImg.tacGia} · {hotelImg.giayPhep}
                      </div>
                    </div>

                  <div style={{ padding: "16px 18px 10px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 12, color: "var(--color-text-sub)", fontWeight: 600 }}>
                        {ks.khuVuc || "Trung tâm"}
                      </span>

                      {ks.soSao && ks.soSao > 0 && (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--color-hangMuc-anUong)",
                          }}
                        >
                          <Star size={13} fill="currentColor" />
                          <span>{ks.soSao} sao</span>
                        </div>
                      )}
                    </div>

                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--color-text)",
                        marginBottom: 10,
                        lineHeight: 1.35,
                      }}
                    >
                      {ks.ten}
                    </h3>

                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 17,
                          fontWeight: 800,
                          color: "var(--color-primary-main)",
                        }}
                      >
                        {dinhDangTien(ks.giaDemUocTinh)} đ
                      </span>
                      <span style={{ fontSize: 12, color: "var(--color-text-sub)" }}>
                        / đêm (ước tính)
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: "12px 18px 16px" }}>
                  <Link
                    href={`/khach-san?diem-den=${slug}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      width: "100%",
                      height: 36,
                      borderRadius: "var(--r-md)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface-sub)",
                      color: "var(--color-text)",
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    <span>Xem khách sạn</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
              );
            })}
          </div>
        </section>

        {/* Khối Call-to-action Lập kế hoạch */}
        <section
          style={{
            maxWidth: 1200,
            margin: "0 auto 40px",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, var(--color-primary-main), var(--color-primary-sky))",
              borderRadius: "var(--r-xl)",
              padding: "40px 32px",
              textAlign: "center",
              color: "var(--color-primary-text)",
            }}
          >
            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                marginBottom: 12,
                color: "var(--color-primary-text)",
              }}
            >
              Sẵn sàng cho chuyến du lịch {ten}?
            </h2>
            <p
              style={{
                fontSize: 16,
                color: "var(--color-primary-tint)",
                maxWidth: 600,
                margin: "0 auto 24px",
                lineHeight: 1.6,
              }}
            >
              Lên lịch trình tự động theo ngân sách thực tế của bạn ngay bây giờ với các địa điểm đã kiểm toán.
            </p>
            <Link
              href={lapKeHoachUrl}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 48,
                padding: "0 28px",
                borderRadius: "var(--r-md)",
                background: "var(--color-surface)",
                color: "var(--color-primary-main)",
                fontSize: 15,
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
              }}
            >
              <Send size={16} />
              <span>Bắt đầu lập kế hoạch đi {ten}</span>
            </Link>
          </div>
        </section>

        {/* Dải minh bạch */}
        <section style={{ maxWidth: 1200, margin: "0 auto 24px", padding: "0 24px" }}>
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
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Database size={18} color="var(--color-primary-main)" />
              <span>Dữ liệu: OpenStreetMap contributors. Giá là ước tính.</span>
            </div>
            <Link
              href="/diem-den"
              style={{
                color: "var(--color-primary-main)",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: 15,
              }}
            >
              Xem điểm đến khác →
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter ngayDuLieu={ngayDuLieu} />
    </div>
  );
}
