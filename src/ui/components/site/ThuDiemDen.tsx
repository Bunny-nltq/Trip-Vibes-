"use client";
import React from "react";
import Link from "next/link";
import { MapPin, Calendar, ArrowRight } from "lucide-react";

export interface DiemDenThe {
  id: string;
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
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 20
    }}>
      {diemDens.map((d) => (
        <div
          key={d.id}
          style={{
            background: "var(--color-surface)",
            borderRadius: "var(--r-xl)",
            border: "1px solid var(--color-border)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            transition: "all 0.2s"
          }}
        >
          <div>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-primary-main)",
              background: "var(--color-primary-tint)",
              padding: "3px 8px",
              borderRadius: "var(--r-full)",
              marginBottom: 12
            }}>
              <MapPin size={13} />
              <span>{d.quocGia}</span>
            </div>

            <h3 style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--color-text)",
              marginBottom: 8
            }}>
              {d.ten}
            </h3>

            {d.moTaNgan && (
              <p style={{
                fontSize: 13,
                color: "var(--color-text-sub)",
                lineHeight: 1.5,
                marginBottom: 16
              }}>
                {d.moTaNgan}
              </p>
            )}
          </div>

          <div style={{
            paddingTop: 14,
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              color: "var(--color-text-sub)"
            }}>
              <Calendar size={13} />
              <span>{d.ngayDuLieuFormatted}</span>
            </div>

            <Link
              href={`/lap-ke-hoach?den=${encodeURIComponent(d.ten)}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--color-primary-main)",
                textDecoration: "none"
              }}
            >
              <span>Chọn</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
