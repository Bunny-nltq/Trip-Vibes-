"use client";
import React from "react";
import Link from "next/link";
import { Building2, MapPin, Star, ArrowRight } from "lucide-react";
import { dinhDangTien } from "@/core/formB1";

export interface KhachSanThe {
  id: string;
  ten: string;
  diemDenTen: string;
  diemDenSlug: string;
  khuVuc: string;
  soSao: number | null;
  giaDemUocTinh: number;
}

export interface KhachSanThamKhaoProps {
  khachSans: KhachSanThe[];
}

export function KhachSanThamKhao({ khachSans }: KhachSanThamKhaoProps) {
  if (!khachSans || khachSans.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 24,
        margin: "0 auto",
        maxWidth: 1200,
      }}
    >
      {khachSans.map((ks) => (
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
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
            transition: "all 0.2s ease",
          }}
        >
          <div>
            {/* Khung ảnh tỉ lệ cố định 16:10, nền gradient token và icon placeholder */}
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "16 / 10",
                background: "linear-gradient(135deg, var(--color-primary-tint) 0%, var(--color-surface-sub) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "var(--r-full)",
                  background: "var(--color-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                }}
              >
                <Building2 size={26} color="var(--color-primary-main)" />
              </div>

              {/* Huy hiệu điểm đến */}
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--color-primary-main)",
                  background: "var(--color-surface)",
                  padding: "4px 10px",
                  borderRadius: "var(--r-full)",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
                }}
              >
                <MapPin size={12} />
                <span>{ks.diemDenTen}</span>
              </div>
            </div>

            {/* Thông tin khách sạn */}
            <div style={{ padding: "18px 20px 12px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-sub)",
                    fontWeight: 600,
                  }}
                >
                  {ks.khuVuc || "Khu vực trung tâm"}
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
                  fontSize: 17,
                  fontWeight: 800,
                  color: "var(--color-text)",
                  marginBottom: 10,
                  lineHeight: 1.3,
                }}
              >
                {ks.ten}
              </h3>

              {/* Giá ước tính */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  marginTop: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "var(--color-primary-main)",
                  }}
                >
                  {dinhDangTien(ks.giaDemUocTinh)} đ
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-sub)",
                  }}
                >
                  / đêm (ước tính)
                </span>
              </div>
            </div>
          </div>

          {/* Link sang /khach-san */}
          <div
            style={{
              padding: "14px 20px 18px",
            }}
          >
            <Link
              href={`/khach-san?diem-den=${ks.diemDenSlug}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                width: "100%",
                height: 38,
                borderRadius: "var(--r-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface-sub)",
                color: "var(--color-text)",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              <span>Xem khách sạn</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
