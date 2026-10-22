"use client";
import React from "react";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";

export interface DiemDenThe {
  id: string;
  slug: string;
  ten: string;
  quocGia: string;
  ngayDuLieuFormatted: string; // dd/mm/yyyy
  moTaNgan?: string;
}

export interface ThuDiemDenProps {
  diemDens: DiemDenThe[];
}

export function ThuDiemDen({ diemDens }: ThuDiemDenProps) {
  if (!diemDens || diemDens.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 24,
        margin: "0 auto",
        maxWidth: 1200,
      }}
    >
      {diemDens.map((d) => (
        <article
          key={d.slug}
          style={{
            flex: "1 1 320px",
            maxWidth: 380,
            minWidth: 280,
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
                  width: 56,
                  height: 56,
                  borderRadius: "var(--r-full)",
                  background: "var(--color-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                }}
              >
                <MapPin size={28} color="var(--color-primary-main)" />
              </div>

              {/* Huy hiệu quốc gia */}
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
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
                <span>{d.quocGia}</span>
              </div>
            </div>

            {/* Thông tin tên và mô tả */}
            <div style={{ padding: "20px 20px 12px" }}>
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "var(--color-text)",
                  marginBottom: 8,
                  lineHeight: 1.3,
                }}
              >
                {d.ten}
              </h3>

              {d.moTaNgan && (
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--color-text-sub)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {d.moTaNgan}
                </p>
              )}
            </div>
          </div>

          {/* Nút Xem điểm đến dẫn /diem-den/<slug> */}
          <div
            style={{
              padding: "16px 20px 20px",
            }}
          >
            <Link
              href={`/diem-den/${d.slug}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                height: 42,
                borderRadius: "var(--r-md)",
                background: "var(--color-primary-main)",
                color: "var(--color-primary-text)",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(43, 85, 214, 0.2)",
                transition: "all 0.15s ease",
              }}
            >
              <span>Xem điểm đến</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
