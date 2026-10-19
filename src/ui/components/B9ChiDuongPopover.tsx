"use client";
import React, { useEffect, useRef, useState } from "react";
import type { ProgressPlace } from "@/core/tripProgress";
import { MapPin, ExternalLink, Copy, Check, X } from "lucide-react";

interface B9ChiDuongPopoverProps {
  place: ProgressPlace | null;
  onClose: () => void;
}

export function B9ChiDuongPopover({ place, onClose }: B9ChiDuongPopoverProps) {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Đóng khi bấm phím Escape & trap focus
  useEffect(() => {
    if (!place) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Focus vào container khi mở
    containerRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [place, onClose]);

  if (!place) return null;

  const diaChi = place.diaChi || place.ten;
  const googleMapsUrl =
    place.mapsUrls?.chiDuong ||
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(diaChi)}`;
  const appleMapsUrl =
    place.mapsUrls?.apple ||
    `http://maps.apple.com/?daddr=${encodeURIComponent(diaChi)}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(diaChi);
      } else {
        // Fallback
        const textarea = document.createElement("textarea");
        textarea.value = diaChi;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="b9-popover-title"
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className="card animate-in"
        style={{
          width: "100%",
          maxWidth: 440,
          padding: 24,
          background: "var(--surface)",
          borderRadius: "var(--r-xl)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          outline: "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div
            id="b9-popover-title"
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--navy)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <MapPin size={18} style={{ color: "var(--p500)" }} />
            Chỉ đường địa điểm
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--g400)",
              padding: 4,
              borderRadius: "var(--r-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Thông tin địa điểm */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>
            {place.ten}
          </div>
          <div style={{ fontSize: 13, color: "var(--g500)", lineHeight: 1.5 }}>
            {diaChi}
          </div>
          {place.gio && (
            <div style={{ fontSize: 12, color: "var(--g400)", marginTop: 4 }}>
              Giờ dự kiến: {place.gio}
            </div>
          )}
        </div>

        {/* Nút hành động */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textDecoration: "none",
              padding: "10px 16px",
              fontSize: 14,
            }}
          >
            <NavigationIcon size={16} />
            Mở bằng Google Maps
            <ExternalLink size={14} />
          </a>

          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textDecoration: "none",
              padding: "10px 16px",
              fontSize: 14,
            }}
          >
            <NavigationIcon size={16} />
            Mở bằng Apple Maps
            <ExternalLink size={14} />
          </a>

          <button
            onClick={handleCopy}
            className="btn btn-ghost"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 16px",
              fontSize: 14,
              color: copied ? "var(--success)" : "var(--g700)",
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Đã sao chép địa chỉ!" : "Sao chép địa chỉ"}
          </button>
        </div>

        {/* Ghi chú Esc */}
        <div
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "var(--g400)",
            marginTop: 14,
          }}
        >
          Nhấn phím Esc hoặc bấm ra ngoài để đóng
        </div>
      </div>
    </div>
  );
}

function NavigationIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}
